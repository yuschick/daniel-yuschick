import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import {
  checkSpecApproval,
  readApproval,
} from '../../_shared/scripts/approval.js';
import { readSpecErrors } from '../../_shared/scripts/check-spec.js';
import { APPROVAL_REF } from '../../_shared/scripts/project.js';
import { componentPaths, git } from '../../_shared/scripts/verification.js';

/**
 * The spec's approval, plus the branch the hooks guard. The gates rerun this,
 * so a build can't pass them without preflight's core check.
 *
 * @param {{ branch: string, component: string } & Parameters<typeof checkSpecApproval>[0]} options
 * @returns {string[]}
 */
export function checkApproval({ branch, component, spec, facts }) {
  return [
    ...(branch === `implement/${component}`
      ? []
      : [
          `Build on implement/${component}, not ${branch}. The hooks only guard that branch.`,
        ]),
    ...checkSpecApproval({ spec, facts }),
  ];
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
  const read = await readApproval(paths);
  if ('error' in read) {
    console.error(`ERROR: ${read.error}`);
    process.exitCode = 1;
    return;
  }

  const approval = {
    branch: git(['branch', '--show-current']).output,
    component: values.component,
    ...read,
  };
  const errors = isApprovalOnly
    ? checkApproval(approval)
    : checkPreflight({
        ...approval,
        trackedChanges: git(['status', '--porcelain', '--untracked-files=no'])
          .output,
      });
  errors.push(
    ...(await readSpecErrors({
      spec: paths.spec,
      facts: paths.facts,
      isReady: true,
    })),
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
