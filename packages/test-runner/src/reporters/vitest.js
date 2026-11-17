import path from 'node:path';

import {
  readPackageName,
  SCHEMA_VERSION,
  writeSuiteResults,
} from '../results.js';

/** @typedef {import('../results.js').Coverage} Coverage */
/** @typedef {import('../results.js').Failure} Failure */
/** @typedef {import('../results.js').SuiteResults} SuiteResults */

/**
 * The parts of Vitest's reporter API this file reads. Typed loosely so this
 * package doesn't depend on Vitest.
 *
 * @typedef {{ state: 'passed' | 'failed' | 'skipped' | 'pending', errors?: ReadonlyArray<{ message: string }> }} TestCaseResult
 * @typedef {{ fullName: string, options: { mode: string }, result: () => TestCaseResult }} TestCase
 * @typedef {{ moduleId: string, children: { allTests: () => Iterable<TestCase> } }} TestModule
 * @typedef {{ total: number, pct: number }} CoverageTotal
 * @typedef {{ getCoverageSummary: () => { lines: CoverageTotal, branches: CoverageTotal, functions: CoverageTotal } }} CoverageMap
 */

/**
 * Vitest has already filtered the map to `coverage.include`, so it's used
 * whole. That's what lets Storybook's suite cover `@dy/react`'s source.
 *
 * @param {CoverageMap} coverageMap
 * @returns {Coverage | null}
 */
export function toCoverage(coverageMap) {
  const summary = coverageMap.getCoverageSummary();

  if (summary.lines.total === 0) {
    return null;
  }

  // Istanbul reports a percentage of nothing as 'Unknown', not a number
  const percent = (/** @type {CoverageTotal} */ total) =>
    total.total === 0 ? 100 : total.pct;

  return {
    lines: percent(summary.lines),
    branches: percent(summary.branches),
    functions: percent(summary.functions),
  };
}

/**
 * @param {ReadonlyArray<TestModule>} testModules
 * @param {ReadonlyArray<{ message: string }>} unhandledErrors
 * @param {{ packageDirectory: string, packageName: string, suite: 'vitest' | 'storybook', durationMs: number, coverage: Coverage | null }} options
 * @returns {SuiteResults}
 */
export function collectVitestResults(
  testModules,
  unhandledErrors,
  { packageDirectory, packageName, suite, durationMs, coverage },
) {
  const tests = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  /** @type {Failure[]} */
  const failures = [];

  for (const testModule of testModules) {
    for (const testCase of testModule.children.allTests()) {
      const result = testCase.result();

      if (testCase.options.mode === 'todo') {
        tests.todo += 1;
      } else if (result.state === 'passed') {
        tests.passed += 1;
      } else if (result.state === 'failed') {
        tests.failed += 1;
        failures.push({
          name: testCase.fullName,
          file: path.relative(packageDirectory, testModule.moduleId),
          message: result.errors?.[0]?.message ?? 'Failed',
        });
      } else {
        tests.skipped += 1;
      }
    }
  }

  // An error outside any test (a file that fails to import, say) fails the
  // run without failing a test, so it's reported as a failure of its own
  for (const error of unhandledErrors) {
    failures.push({
      name: 'Unhandled error',
      file: null,
      message: error.message,
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    package: packageName,
    suite,
    files: testModules.length,
    tests,
    durationMs,
    coverage,
    failures,
  };
}

/**
 * A Vitest reporter. Add it next to the default one:
 *
 *   reporters: ['default', new ResultsReporter({ suite: 'vitest' })]
 *
 * It writes `.test-results/<suite>.json`. Vitest reports coverage before the
 * run ends, so the coverage is held until then.
 */
export class ResultsReporter {
  /** @type {Coverage | null} */
  #coverage = null;
  /** @type {string} */
  #packageDirectory = process.cwd();
  #startTime = 0;
  /** @type {'vitest' | 'storybook'} */
  #suite;

  /**
   * @param {{ suite: 'vitest' | 'storybook' }} options
   */
  constructor({ suite }) {
    this.#suite = suite;
  }

  /**
   * Called before `onTestRunEnd`
   *
   * @param {CoverageMap} coverageMap
   */
  onCoverage(coverageMap) {
    this.#coverage = toCoverage(coverageMap);
  }

  /**
   * @param {{ config: { root: string } }} vitest
   */
  onInit(vitest) {
    this.#packageDirectory = vitest.config.root;
    this.#coverage = null;
    this.#startTime = performance.now();
  }

  /**
   * @param {ReadonlyArray<TestModule>} testModules
   * @param {ReadonlyArray<{ message: string }>} unhandledErrors
   */
  async onTestRunEnd(testModules, unhandledErrors) {
    const results = collectVitestResults(testModules, unhandledErrors, {
      packageDirectory: this.#packageDirectory,
      packageName: await readPackageName(this.#packageDirectory),
      suite: this.#suite,
      durationMs: performance.now() - this.#startTime,
      coverage: this.#coverage,
    });

    await writeSuiteResults(this.#packageDirectory, results);
  }
}
