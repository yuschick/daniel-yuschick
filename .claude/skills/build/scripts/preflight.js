import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import { componentPaths, git } from './shared.js';

const APPROVAL_REF = 'origin/main';

/**
 * A spec is approved only when it is on `main`, so `status` is never read here.
 *
 * @param {{ branch: string, trackedChanges: string, spec: { local: string, approved: string | null }, facts: { local: string, approved: string | null } }} options
 * @returns {string[]}
 */
export function checkPreflight({ branch, trackedChanges, spec, facts }) {
  const errors = [];
  if (branch === 'main') errors.push('Build on a branch, not on main.');
  if (trackedChanges) {
    errors.push(`Commit or stash tracked changes first:\n${trackedChanges}`);
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
  const openQuestions = parseSpec(spec.local)
    .sections.get('Open questions')
    ?.text.join('\n')
    .trim();
  if (openQuestions !== 'None.') {
    errors.push('The spec has open questions.');
  }
  return errors;
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
  const { values } = parseArgs({ options: { component: { type: 'string' } } });
  if (!values.component)
    throw new Error('Usage: preflight.js --component <name>');

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

  const errors = checkPreflight({
    branch: git(['branch', '--show-current']).output,
    trackedChanges: git(['status', '--porcelain', '--untracked-files=no'])
      .output,
    spec: {
      local: await readLocal(paths.spec),
      approved: readApproved(paths.spec),
    },
    facts: {
      local: await readLocal(paths.facts),
      approved: readApproved(paths.facts),
    },
  });
  errors.push(
    ...runValidator('check-facts.js', ['--facts', paths.facts]),
    ...runValidator('check-spec.js', [
      '--facts',
      paths.facts,
      '--spec',
      paths.spec,
    ]),
  );

  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  if (errors.length > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
