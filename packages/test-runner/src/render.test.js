import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { Chalk } from 'chalk';

import {
  formatDuration,
  renderHeader,
  renderReport,
  renderRows,
} from './render.js';

/** @typedef {import('./collect.js').SuiteRow} SuiteRow */

// Level 0 prints no escape codes, so output compares as plain text
const chalk = new Chalk({ level: 0 });

/**
 * @param {string} label
 * @param {Partial<import('./results.js').SuiteResults>} [results]
 * @param {Partial<SuiteRow>} [row]
 * @returns {SuiteRow}
 */
function suiteRow(label, results = {}, row = {}) {
  return {
    label,
    kind: 'suite',
    note: null,
    cached: false,
    log: null,
    results: {
      schemaVersion: 1,
      package: label,
      suite: 'node',
      files: 2,
      tests: { passed: 10, failed: 0, skipped: 0, todo: 0 },
      durationMs: 1234,
      coverage: { lines: 87.9, branches: 80, functions: 75 },
      failures: [],
      ...results,
    },
    ...row,
  };
}

describe('formatDuration', () => {
  test('shows seconds to two places', () => {
    assert.equal(formatDuration(42), '0.04s');
    assert.equal(formatDuration(16_318), '16.32s');
  });
});

describe('renderHeader', () => {
  test('shows the mark and its bullet unless output is plain', () => {
    const header = renderHeader({ chalk, plain: false, mark: 'MARK' });

    assert.match(
      header,
      /^\n {2}MARK\n\n {2}░█ @dy\/design-system: Running test suites…\n$/,
    );
    assert.equal(
      renderHeader({ chalk, plain: true, mark: 'MARK' }),
      '@dy/design-system: Running test suites…\n',
    );
  });
});

describe('renderRows', () => {
  test('aligns every column and words each status', () => {
    const rows = renderRows(
      [
        suiteRow('@dy/css', { coverage: null }),
        suiteRow('@dy/storybook', {
          tests: { passed: 80, failed: 2, skipped: 1, todo: 0 },
        }),
        suiteRow('@dy/tokens', {}, { cached: true }),
      ],
      chalk,
    );

    assert.deepEqual(rows, [
      '  ✓ @dy/css                             10 passed  no coverage   1.23s',
      '  ✗ @dy/storybook  2 failed, 80 passed, 1 skipped    87% lines   1.23s',
      '  ✓ @dy/tokens                          10 passed    87% lines  cached',
    ]);
  });

  test('says why a row has no results', () => {
    const [row] = renderRows(
      [
        {
          label: '@dy/storybook',
          kind: 'suite',
          results: null,
          note: 'did not run',
          cached: false,
          log: null,
        },
      ],
      chalk,
    );

    assert.equal(row, '  ✗ @dy/storybook  did not run');
  });
});

describe('renderReport', () => {
  test('totals every suite and closes on a pass', () => {
    const report = renderReport(
      {
        rows: [
          suiteRow('@dy/css'),
          suiteRow('@dy/tokens', {}, { cached: true }),
        ],
        durationMs: 2500,
        exitCode: 0,
      },
      { chalk, plain: true },
    );

    assert.match(report, /Test files: {2}4\n/);
    assert.match(report, /Tests: {2}20 passed \(20\)\n/);
    assert.match(report, /Duration: {2}2\.50s, 1 of 2 suites cached\n/);
    assert.match(report, /✓ All test suites passed!/);
    assert.doesNotMatch(report, /Failures/);
  });

  test('lists each failure with its file and message', () => {
    const report = renderReport(
      {
        rows: [
          suiteRow('@dy/react', {
            tests: { passed: 9, failed: 1, skipped: 0, todo: 0 },
            failures: [
              {
                name: 'toggles',
                file: 'src/useBoolean.test.ts',
                message: 'expected true to be false',
              },
            ],
          }),
        ],
        durationMs: 1000,
        exitCode: 1,
      },
      { chalk, plain: true },
    );

    assert.match(
      report,
      /✗ @dy\/react › toggles\n {4}src\/useBoolean\.test\.ts\n {4}expected true to be false/,
    );
    assert.match(report, /Tests: {2}1 failed, 9 passed \(10\)/);
    assert.match(report, /✗ 1 test suite failed$/m);
  });

  test('names a failed build apart from the suites, with its log', () => {
    const report = renderReport(
      {
        rows: [
          suiteRow('@dy/react'),
          {
            label: '@dy/react',
            kind: 'task',
            results: null,
            note: 'build failed',
            cached: false,
            log: 'ERROR  Build failed',
          },
          {
            label: '@dy/storybook',
            kind: 'suite',
            results: null,
            note: 'did not run',
            cached: false,
            log: null,
          },
        ],
        durationMs: 1000,
        exitCode: 1,
      },
      { chalk, plain: true },
    );

    assert.match(
      report,
      /✗ @dy\/react build failed\n {4}ERROR {2}Build failed/,
    );
    assert.match(report, /Duration: {2}1\.00s, 0 of 2 suites cached/);
    assert.match(report, /✗ 1 test suite failed, 1 build failed$/m);
  });

  test("doesn't claim a pass when Turbo failed outside any task", () => {
    const report = renderReport(
      { rows: [suiteRow('@dy/css')], durationMs: 1000, exitCode: 1 },
      { chalk, plain: true },
    );

    assert.match(report, /✗ Turbo exited with code 1$/m);
  });
});
