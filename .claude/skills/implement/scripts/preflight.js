import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import { componentPaths, git } from './shared.js';

const APPROVAL_REF = 'origin/main';

/**
 * A spec is approved when it is on `main`: merging its PR is the approval, and
 * nothing in the file records it. The gates rerun this, so a build can't pass
 * them without preflight's core check.
 *
 * @param {{ branch: string, component: string, spec: { local: string, approved: string | null }, facts: { local: string, approved: string | null } }} options
 * @returns {string[]}
 */
export function checkApproval({ branch, component, spec, facts }) {
  const errors = [];
  if (branch !== `implement/${component}`) {
    errors.push(
      `Build on implement/${component}, not ${branch}. The hooks only guard that branch.`,
    );
  }
  for (const [label, file] of Object.entries({ spec, facts })) {
    if (file.approved === null) {
      errors.push(
        `The ${label} isn't on ${APPROVAL_REF}, so it isn't approved.`,
      );
    } else if (file.approved !== file.local) {
      errors.push(
        `The ${label} differs from the approved copy on ${APPROVAL_REF}.`,
      );
    }
  }
  const { sections } = parseSpec(spec.local);
  const openQuestions = sections.get('Open questions')?.text.join('\n').trim();
  if (openQuestions !== 'None.') {
    errors.push('The spec has open questions.');
  }
  return errors;
}

/**
 * @param {Parameters<typeof checkApproval>[0] & { trackedChanges: string }} options
 * @returns {string[]}
 */
export function checkPreflight({ trackedChanges, ...approval }) {
  return [
    ...checkApproval(approval),
    ...(trackedChanges
      ? [`Commit or stash tracked changes first:\n${trackedChanges}`]
      : []),
  ];
}

function runValidator(script, args) {
  const result = spawnSync(
    'node',
    [`.claude/skills/spec/scripts/${script}`, ...args],
    { encoding: 'utf8' },
  );
  return result.status === 0
    ? []
    : [`${script} failed:\n${result.stdout}${result.stderr}`.trim()];
}

async function main() {
  const { values } = parseArgs({
    options: {
      component: { type: 'string' },
      'approval-only': { type: 'boolean', default: false },
      staging: { type: 'boolean', default: false },
      step: { type: 'boolean', default: false },
    },
  });
  const isApprovalOnly = values['approval-only'];
  if (!values.component) {
    throw new Error(
      'Usage: preflight.js --component <name> [--staging] [--step], or --component <name> --approval-only',
    );
  }

  const paths = componentPaths(values.component);
  if (!git(['fetch', 'origin', 'main', '--quiet']).ok) {
    console.error(`ERROR: Couldn't fetch ${APPROVAL_REF}.`);
    process.exitCode = 1;
    return;
  }

  const readApproved = (file) => {
    const { ok, output } = git(['show', `${APPROVAL_REF}:${file}`]);
    return ok ? output : null;
  };
  const readLocal = async (file) =>
    (await readFile(resolve(file), 'utf8')).trim();

  const approval = {
    branch: git(['branch', '--show-current']).output,
    component: values.component,
    spec: {
      local: await readLocal(paths.spec),
      approved: readApproved(paths.spec),
    },
    facts: {
      local: await readLocal(paths.facts),
      approved: readApproved(paths.facts),
    },
  };
  const errors = isApprovalOnly
    ? checkApproval(approval)
    : checkPreflight({
        ...approval,
        trackedChanges: git(['status', '--porcelain', '--untracked-files=no'])
          .output,
      });
  errors.push(
    ...runValidator('check-facts.js', ['--facts', paths.facts]),
    ...runValidator('check-spec.js', [
      '--ready',
      '--facts',
      paths.facts,
      '--spec',
      paths.spec,
    ]),
  );

  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  if (errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (!isApprovalOnly) {
    // A rehearsal starts clean. A real build keeps its cache, because clearing
    // it would also reset the review rounds and approvals it has to answer for.
    if (values.staging) {
      await rm(resolve(paths.cache), { recursive: true, force: true });
    }
    await mkdir(resolve(paths.cache), { recursive: true });
    await writeFile(
      resolve(paths.cache, 'run.json'),
      JSON.stringify({
        staging: values.staging,
        step: values.step,
        // A staging build never commits, so it answers only for what it changes from here.
        base: values.staging ? git(['rev-parse', 'HEAD']).output : APPROVAL_REF,
      }),
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
