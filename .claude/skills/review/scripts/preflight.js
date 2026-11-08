import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  checkSpecApproval,
  readApproval,
} from '../../_shared/scripts/approval.js';
import { readSpecErrors } from '../../_shared/scripts/check-spec.js';
import { APPROVAL_REF } from '../../_shared/scripts/project.js';
import { git } from '../../_shared/scripts/verification.js';
import { findBranchProblem, MARKER, targetPaths } from './review.js';

/*
 ** Before a component review: the spec must be approved, and the review starts
 ** from a clean folder. `--approval-only` is the gates' rerun of the first part.
 */

const { values } = parseArgs({
  options: {
    component: { type: 'string' },
    'approval-only': { type: 'boolean', default: false },
  },
});
if (!values.component) {
  throw new Error('Usage: preflight.js --component <name> [--approval-only]');
}

const paths = targetPaths('component', values.component);
const read = await readApproval(paths);
if ('error' in read) {
  console.error(`ERROR: ${read.error}`);
  process.exitCode = 1;
} else {
  const branchProblem = findBranchProblem(
    git(['branch', '--show-current']).output,
  );
  const errors = [
    ...(branchProblem ? [branchProblem] : []),
    ...checkSpecApproval(read),
    ...(await readSpecErrors({
      spec: paths.spec,
      facts: paths.facts,
      isReady: true,
    })),
  ];
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);

  if (errors.length > 0) {
    process.exitCode = 1;
  } else if (!values['approval-only']) {
    await rm(resolve(paths.cache), { recursive: true, force: true });
    await rm(resolve(MARKER), { force: true });
    await mkdir(resolve(paths.cache), { recursive: true });
    await writeFile(
      resolve(paths.cache, 'run.json'),
      JSON.stringify({ staging: false, step: false, base: APPROVAL_REF }),
    );
  }
}
