import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';

import { RESULTS_DIRECTORY, writeSuiteResults } from '../results.js';
import { collectNodeResults } from './node.js';

const packageDirectory = '/repo/packages/example';

/**
 * @param {Array<{ type: string, data: any }>} events
 */
async function* streamOf(events) {
  for (const event of events) {
    yield event;
  }
}

const passingRun = [
  {
    type: 'test:summary',
    data: { file: `${packageDirectory}/src/a.test.js`, counts: {} },
  },
  {
    type: 'test:summary',
    data: { file: `${packageDirectory}/src/b.test.js`, counts: {} },
  },
  {
    type: 'test:coverage',
    data: {
      summary: {
        files: [
          {
            path: `${packageDirectory}/src/a.js`,
            totalLineCount: 150,
            coveredLineCount: 140,
            totalBranchCount: 10,
            coveredBranchCount: 8,
            totalFunctionCount: 6,
            coveredFunctionCount: 5,
          },
          {
            path: `${packageDirectory}/src/b.js`,
            totalLineCount: 50,
            coveredLineCount: 40,
            totalBranchCount: 10,
            coveredBranchCount: 8,
            totalFunctionCount: 2,
            coveredFunctionCount: 1,
          },
          // Imported from another workspace package: not this package's coverage
          {
            path: '/repo/packages/other/index.js',
            totalLineCount: 100,
            coveredLineCount: 0,
            totalBranchCount: 10,
            coveredBranchCount: 0,
            totalFunctionCount: 4,
            coveredFunctionCount: 0,
          },
        ],
      },
    },
  },
  {
    type: 'test:summary',
    data: {
      counts: { passed: 7, failed: 0, skipped: 1, todo: 0, tests: 8 },
      duration_ms: 123.4,
    },
  },
];

describe('collectNodeResults', () => {
  test("counts files, tests, duration and coverage of the package's own files", async () => {
    const results = await collectNodeResults(streamOf(passingRun), {
      packageDirectory,
      packageName: '@dy/example',
    });

    assert.deepEqual(results, {
      schemaVersion: 1,
      package: '@dy/example',
      suite: 'node',
      files: 2,
      tests: { passed: 7, failed: 0, skipped: 1, todo: 0 },
      durationMs: 123.4,
      coverage: { lines: 90, branches: 80, functions: 75 },
      failures: [],
    });
  });

  test('records null coverage when the package has no files of its own', async () => {
    const results = await collectNodeResults(
      streamOf([
        {
          type: 'test:coverage',
          data: {
            summary: {
              files: [
                {
                  path: '/repo/packages/other/index.js',
                  totalLineCount: 100,
                  coveredLineCount: 90,
                  totalBranchCount: 0,
                  coveredBranchCount: 0,
                  totalFunctionCount: 1,
                  coveredFunctionCount: 1,
                },
              ],
            },
          },
        },
      ]),
      { packageDirectory, packageName: '@dy/example' },
    );

    assert.equal(results.coverage, null);
  });

  test('reports failed tests with the assertion message, but not their suites', async () => {
    const assertion = new Error('Expected 1 to equal 2');
    const wrapped = new Error('Test failed', { cause: assertion });

    const results = await collectNodeResults(
      streamOf([
        {
          type: 'test:fail',
          data: {
            name: 'adds numbers',
            file: `${packageDirectory}/src/math.test.js`,
            details: { type: 'test', error: wrapped },
          },
        },
        {
          type: 'test:fail',
          data: {
            name: 'math',
            file: `${packageDirectory}/src/math.test.js`,
            details: { type: 'suite', error: new Error('1 subtest failed') },
          },
        },
      ]),
      { packageDirectory, packageName: '@dy/example' },
    );

    assert.deepEqual(results.failures, [
      {
        name: 'adds numbers',
        file: 'src/math.test.js',
        message: 'Expected 1 to equal 2',
      },
    ]);
  });
});

describe('writeSuiteResults', () => {
  test('creates the results folder and writes the suite as JSON', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dy-test-runner-'));

    try {
      const results = await collectNodeResults(streamOf(passingRun), {
        packageDirectory,
        packageName: '@dy/example',
      });
      const filePath = await writeSuiteResults(directory, results);

      assert.equal(
        filePath,
        path.join(directory, RESULTS_DIRECTORY, 'node.json'),
      );
      assert.deepEqual(JSON.parse(await readFile(filePath, 'utf8')), results);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
