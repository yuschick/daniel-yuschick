import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { collectVitestResults, toCoverage } from './vitest.js';

const packageDirectory = '/repo/packages/example';

/**
 * @param {string} fullName
 * @param {'passed' | 'failed' | 'skipped'} state
 * @param {{ mode?: string, message?: string }} [options]
 */
function testCaseOf(fullName, state, { mode = 'run', message } = {}) {
  return {
    fullName,
    options: { mode },
    result: () => ({
      state,
      errors: message === undefined ? undefined : [{ message }],
    }),
  };
}

/**
 * @param {string} file
 * @param {ReturnType<typeof testCaseOf>[]} testCases
 */
function testModuleOf(file, testCases) {
  return {
    moduleId: `${packageDirectory}/${file}`,
    children: { allTests: () => testCases },
  };
}

/**
 * @param {number} lines
 * @param {number | string} linePercent
 */
function coverageMapOf(lines, linePercent) {
  return {
    getCoverageSummary: () => ({
      lines: { total: lines, pct: linePercent },
      branches: { total: 0, pct: 'Unknown' },
      functions: { total: 4, pct: 75 },
    }),
  };
}

const options = {
  packageDirectory,
  packageName: '@dy/example',
  suite: /** @type {const} */ ('vitest'),
  durationMs: 512,
  coverage: null,
};

describe('collectVitestResults', () => {
  test('counts passed, failed, skipped and todo tests across files', () => {
    const results = collectVitestResults(
      [
        testModuleOf('src/a.test.ts', [
          testCaseOf('a > works', 'passed'),
          testCaseOf('a > is skipped', 'skipped'),
        ]),
        testModuleOf('src/b.test.ts', [
          testCaseOf('b > to do', 'skipped', { mode: 'todo' }),
          testCaseOf('b > breaks', 'failed', { message: 'expected 1 to be 2' }),
        ]),
      ],
      [],
      options,
    );

    assert.deepEqual(results, {
      schemaVersion: 1,
      package: '@dy/example',
      suite: 'vitest',
      files: 2,
      tests: { passed: 1, failed: 1, skipped: 1, todo: 1 },
      durationMs: 512,
      coverage: null,
      failures: [
        {
          name: 'b > breaks',
          file: 'src/b.test.ts',
          message: 'expected 1 to be 2',
        },
      ],
    });
  });

  test('reports an unhandled error as a failure without a file', () => {
    const results = collectVitestResults(
      [],
      [{ message: 'Failed to load module' }],
      options,
    );

    assert.deepEqual(results.failures, [
      { name: 'Unhandled error', file: null, message: 'Failed to load module' },
    ]);
  });
});

describe('toCoverage', () => {
  test('reads the summary, treating a percentage of nothing as 100', () => {
    assert.deepEqual(toCoverage(coverageMapOf(200, 88.5)), {
      lines: 88.5,
      branches: 100,
      functions: 75,
    });
  });

  test('returns null when no lines were included', () => {
    assert.equal(toCoverage(coverageMapOf(0, 'Unknown')), null);
  });
});
