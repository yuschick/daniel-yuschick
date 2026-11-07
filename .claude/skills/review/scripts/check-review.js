import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { processLatestReport } from '../../_shared/scripts/check-review.js';
import { project } from '../../_shared/scripts/project.js';
import {
  latestReport,
  REVIEW_HOOK_ERROR,
  treeHash,
} from '../../_shared/scripts/verification.js';
import {
  hashSpec,
  MARKER,
  parseSpecReport,
  readTarget,
  targetPaths,
} from './review.js';

/*
 ** Reads the report the hook saved, checks it, and records the result where
 ** /pr will look for it. One review per run, so no rounds are counted here.
 */

/** Round lines belong to /implement's loop, not to a single review. */
const ROUND_LINE = /^(ROUND|STOP|REPEAT):/;

/** @param {ReturnType<typeof targetPaths>} paths */
function checkSpecReview(paths) {
  const file = latestReport(paths.cache);
  if (file === null) {
    const hookError = resolve(paths.cache, REVIEW_HOOK_ERROR);
    const cause = existsSync(hookError)
      ? readFileSync(hookError, 'utf8')
      : "The reviewer's hook didn't run.";
    return {
      result: 'MISSING',
      errors: [
        `The reviewer's report wasn't saved. ${cause} Stop and tell ${project.approver}. Never write a report yourself.`,
      ],
      lines: [],
      file,
    };
  }
  const { verdict, blocking, questions } = parseSpecReport(
    readFileSync(resolve(paths.cache, file), 'utf8'),
  );
  return verdict === null
    ? {
        result: 'INVALID',
        errors: ['The report has no VERDICT line, so it proves nothing.'],
        lines: [],
        file,
      }
    : {
        result: verdict,
        errors: [],
        lines: [`Blocking: ${blocking}. Questions: ${questions}.`],
        file,
      };
}

const { values } = parseArgs({
  options: { component: { type: 'string' }, spec: { type: 'string' } },
});
const { kind, name } = readTarget(values);
const paths = targetPaths(kind, name);

const outcome =
  kind === 'component'
    ? {
        ...processLatestReport(name, 'review'),
        file: latestReport(paths.cache),
      }
    : checkSpecReview(paths);
const lines = outcome.lines.filter((line) => !ROUND_LINE.test(line));

// The review is over either way, so the guard stops.
rmSync(resolve(MARKER), { force: true });
writeFileSync(
  resolve(paths.cache, 'result.json'),
  JSON.stringify(
    {
      kind,
      name,
      result: outcome.result,
      report: outcome.file,
      hash: kind === 'component' ? treeHash() : hashSpec(paths),
      checkedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

for (const error of outcome.errors) console.error(`ERROR: ${error}`);
for (const line of lines) console.log(line);
console.log(`RESULT: ${outcome.result}`);
if (outcome.result !== 'PASS') process.exitCode = 1;
