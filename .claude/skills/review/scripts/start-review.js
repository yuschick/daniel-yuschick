import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { readSpecErrors } from '../../_shared/scripts/check-spec.js';
import { buildBundle } from '../../_shared/scripts/review-bundle.js';
import {
  readStandards,
  writeComponentReview,
} from '../../_shared/scripts/review-ledger.js';
import { git } from '../../_shared/scripts/verification.js';
import {
  findBranchProblem,
  readTarget,
  reviewerFor,
  targetPaths,
  writeMarker,
} from './review.js';

/*
 ** Writes the only prompt the reviewer may receive, and marks the review as
 ** waiting for it, so the hooks guard the review and save its report.
 */

function fail(errors) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  process.exitCode = 1;
}

/** @param {ReturnType<typeof targetPaths>} paths */
async function writeSpecReview(paths) {
  const errors = await readSpecErrors({ spec: paths.spec, facts: paths.facts });
  if (errors.length > 0) return { errors };

  rmSync(resolve(paths.cache), { recursive: true, force: true });
  mkdirSync(resolve(paths.cache), { recursive: true });
  const bundlePath = `${paths.cache}/review-bundle.md`;
  const promptPath = `${paths.cache}/reviewer-prompt.txt`;
  writeFileSync(
    resolve(bundlePath),
    buildBundle({
      markdown: readFileSync(resolve(paths.spec), 'utf8'),
      payload: JSON.parse(readFileSync(resolve(paths.facts), 'utf8')).payload,
      standards: readStandards(),
    }),
  );
  writeFileSync(
    resolve(promptPath),
    [
      `Spec: ${paths.spec}`,
      `Bundle: ${bundlePath}`,
      `Facts: ${paths.facts}`,
    ].join('\n'),
  );
  return { promptPath };
}

const { values } = parseArgs({
  options: { component: { type: 'string' }, spec: { type: 'string' } },
});
const { kind, name } = readTarget(values);
const paths = targetPaths(kind, name);
const branchProblem = findBranchProblem(
  git(['branch', '--show-current']).output,
);

if (branchProblem) {
  fail([branchProblem]);
} else if (
  kind === 'component' &&
  !existsSync(resolve(paths.cache, 'gates.json'))
) {
  fail([
    'No gate results for this review. Run preflight.js, then run-gates.js, and start only on GATES: PASS.',
  ]);
} else {
  let result;
  try {
    result =
      kind === 'component'
        ? writeComponentReview({ component: name, skill: 'review' })
        : await writeSpecReview(paths);
  } catch (error) {
    result = {
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  if (result.errors) {
    fail(result.errors);
  } else {
    const reviewer = reviewerFor(kind);
    writeMarker(process.cwd(), {
      kind,
      name,
      cache: paths.cache,
      reviewer,
      prompt: readFileSync(resolve(result.promptPath), 'utf8'),
    });
    console.log(
      `${result.promptPath}\nStart a new ${reviewer} with this file's contents as its entire prompt.`,
    );
  }
}
