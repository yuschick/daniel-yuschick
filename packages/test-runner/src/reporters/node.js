import path from 'node:path';

import {
  readPackageName,
  RESULTS_DIRECTORY,
  SCHEMA_VERSION,
  writeSuiteResults,
} from '../results.js';

/** @typedef {import('../results.js').Coverage} Coverage */
/** @typedef {import('../results.js').Failure} Failure */
/** @typedef {import('../results.js').SuiteResults} SuiteResults */

/**
 * @typedef {object} FileCoverage
 * @property {string} path Absolute
 * @property {number} totalLineCount
 * @property {number} coveredLineCount
 * @property {number} totalBranchCount
 * @property {number} coveredBranchCount
 * @property {number} totalFunctionCount
 * @property {number} coveredFunctionCount
 */

/**
 * @param {number} covered
 * @param {number} total
 */
function toPercent(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

/**
 * Totals coverage for the package's own files only. Node also covers the
 * workspace packages a test imports (for example `@dy/css` importing the
 * Stylelint config from `@dy/configs`), which would count them twice. Its
 * include globs can't express "this package" without an absolute path.
 *
 * @param {FileCoverage[]} files
 * @param {string} packageDirectory
 * @returns {Coverage | null} `null` when the package has no JavaScript to cover
 */
export function toPackageCoverage(files, packageDirectory) {
  const ownFiles = files.filter((file) => {
    const relativePath = path.relative(packageDirectory, file.path);

    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  });

  const sum = (/** @type {keyof FileCoverage} */ key) =>
    ownFiles.reduce((total, file) => total + Number(file[key]), 0);

  if (sum('totalLineCount') === 0) {
    return null;
  }

  return {
    lines: toPercent(sum('coveredLineCount'), sum('totalLineCount')),
    branches: toPercent(sum('coveredBranchCount'), sum('totalBranchCount')),
    functions: toPercent(
      sum('coveredFunctionCount'),
      sum('totalFunctionCount'),
    ),
  };
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function toMessage(error) {
  if (error instanceof Error) {
    // node:test wraps a failed assertion; the cause holds its message
    return error.cause instanceof Error ? error.cause.message : error.message;
  }

  return String(error);
}

/**
 * Reads a `node --test` event stream into one suite's results.
 *
 * @param {AsyncIterable<{ type: string, data: any }>} source
 * @param {{ packageDirectory: string, packageName: string }} options
 * @returns {Promise<SuiteResults>}
 */
export async function collectNodeResults(
  source,
  { packageDirectory, packageName },
) {
  const files = new Set();
  /** @type {Failure[]} */
  const failures = [];
  /** @type {Coverage | null} */
  let coverage = null;
  let counts = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  let durationMs = 0;

  for await (const event of source) {
    switch (event.type) {
      case 'test:summary': {
        // One summary per file, then a final one without a file for the run
        if (event.data.file) {
          files.add(event.data.file);
        } else {
          counts = event.data.counts;
          durationMs = event.data.duration_ms;
        }
        break;
      }
      case 'test:coverage': {
        coverage = toPackageCoverage(
          event.data.summary.files,
          packageDirectory,
        );
        break;
      }
      case 'test:fail': {
        // A suite fails when a test in it fails; report the test, not both
        if (event.data.details.type !== 'suite') {
          failures.push({
            name: event.data.name,
            file: event.data.file
              ? path.relative(packageDirectory, event.data.file)
              : null,
            message: toMessage(event.data.details.error),
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    package: packageName,
    suite: 'node',
    files: files.size,
    tests: {
      passed: counts.passed,
      failed: counts.failed,
      skipped: counts.skipped,
      todo: counts.todo,
    },
    durationMs,
    coverage,
    failures,
  };
}

/**
 * A `node --test` reporter. Pair it with `spec` for readable output:
 *
 *   node --test --experimental-test-coverage \
 *     --test-reporter=spec --test-reporter-destination=stdout \
 *     --test-reporter=@dy/test-runner/node-reporter --test-reporter-destination=stdout
 *
 * It writes `.test-results/node.json` itself, because Node won't create a
 * missing folder for a reporter destination.
 *
 * @param {AsyncIterable<{ type: string, data: any }>} source
 */
export default async function* nodeReporter(source) {
  const packageDirectory = process.cwd();
  const results = await collectNodeResults(source, {
    packageDirectory,
    packageName: await readPackageName(packageDirectory),
  });

  await writeSuiteResults(packageDirectory, results);

  yield `Results written to ${RESULTS_DIRECTORY}/${results.suite}.json\n`;
}
