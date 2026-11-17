import { BULLET } from './mark.js';
import { palette } from './palette.js';

/** @typedef {import('chalk').ChalkInstance} ChalkInstance */
/** @typedef {import('./collect.js').SuiteRow} SuiteRow */

/**
 * @typedef {object} RenderOptions
 * @property {ChalkInstance} chalk Level 0 for no color
 * @property {boolean} plain No mark: for logs, pipes and screen readers
 */

const INDENT = '  ';
const MESSAGE_LINES = 8;

/**
 * Every status has a word as well as a symbol and color, so nothing depends
 * on color alone (A11Y). The symbols take the palette; words don't.
 */
const SYMBOLS = { passed: '✓', failed: '✗' };

/**
 * @param {number} milliseconds
 */
export function formatDuration(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * @param {SuiteRow} row
 */
function hasFailed(row) {
  if (!row.results) {
    return true;
  }

  return row.results.tests.failed > 0 || row.results.failures.length > 0;
}

/**
 * @param {SuiteRow} row
 */
function describeTests(row) {
  if (!row.results) {
    return row.note ?? 'no results';
  }

  const { passed, failed, skipped, todo } = row.results.tests;
  const parts = [`${passed} passed`];

  if (failed > 0) {
    parts.unshift(`${failed} failed`);
  }
  if (skipped > 0) {
    parts.push(`${skipped} skipped`);
  }
  if (todo > 0) {
    parts.push(`${todo} todo`);
  }

  return parts.join(', ');
}

/**
 * Rounds down, so 99.6% never reads as full coverage.
 *
 * @param {SuiteRow} row
 */
function describeCoverage(row) {
  if (!row.results) {
    return '';
  }

  return row.results.coverage
    ? `${Math.floor(row.results.coverage.lines)}% lines`
    : 'no coverage';
}

/**
 * @param {SuiteRow} row
 */
function describeTime(row) {
  if (!row.results) {
    return '';
  }

  return row.cached ? 'cached' : formatDuration(row.results.durationMs);
}

/**
 * @param {boolean} failed
 * @param {ChalkInstance} chalk
 */
function symbolFor(failed, chalk) {
  return failed
    ? chalk.hex(palette.negative)(SYMBOLS.failed)
    : chalk.hex(palette.positive)(SYMBOLS.passed);
}

/**
 * The mark and the line printed while the suites run.
 *
 * @param {RenderOptions & { mark: string | null }} options
 * @returns {string}
 */
export function renderHeader({ chalk, plain, mark }) {
  const brand = chalk.hex(palette.brand);
  const title = `${chalk.bold('@dy/design-system')}: Running test suites…`;

  if (plain || !mark) {
    return `${title}\n`;
  }

  return [
    '',
    ...mark.split('\n').map((line) => (line ? `${INDENT}${brand(line)}` : '')),
    '',
    `${INDENT}${brand(BULLET)} ${title}`,
    '',
  ].join('\n');
}

/**
 * One aligned row per suite. Columns are padded before they're colored, so
 * escape codes never throw the alignment off.
 *
 * @param {SuiteRow[]} rows
 * @param {ChalkInstance} chalk
 * @returns {string[]}
 */
export function renderRows(rows, chalk) {
  const cells = rows.map((row) => ({
    failed: hasFailed(row),
    label: row.label,
    tests: describeTests(row),
    coverage: describeCoverage(row),
    time: describeTime(row),
  }));

  const widthOf = (
    /** @type {'label' | 'tests' | 'coverage' | 'time'} */ key,
  ) => Math.max(0, ...cells.map((cell) => cell[key].length));

  return cells.map((cell) =>
    [
      `${INDENT}${symbolFor(cell.failed, chalk)} ${cell.label.padEnd(widthOf('label'))}`,
      cell.tests.padStart(widthOf('tests')),
      cell.coverage.padStart(widthOf('coverage')),
      cell.time.padStart(widthOf('time')),
    ]
      .join('  ')
      .trimEnd(),
  );
}

/**
 * @param {string} text
 * @param {number} depth
 */
function indent(text, depth) {
  const prefix = INDENT.repeat(depth);

  return text
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : line))
    .join('\n');
}

/**
 * Each failed test with its file and message, then each task that failed
 * without results, with the end of its log.
 *
 * @param {SuiteRow[]} rows
 * @param {ChalkInstance} chalk
 * @returns {string[]}
 */
export function renderFailures(rows, chalk) {
  const lines = [];

  for (const row of rows) {
    for (const failure of row.results?.failures ?? []) {
      const message = failure.message
        .trimEnd()
        .split('\n')
        .slice(0, MESSAGE_LINES)
        .join('\n');

      lines.push(
        '',
        `${INDENT}${symbolFor(true, chalk)} ${chalk.bold(row.label)} › ${failure.name}`,
      );
      if (failure.file) {
        lines.push(indent(failure.file, 2));
      }
      lines.push(indent(message, 2));
    }

    if (!row.results) {
      lines.push(
        '',
        `${INDENT}${symbolFor(true, chalk)} ${chalk.bold(row.label)} ${describeTests(row)}`,
      );
      if (row.log) {
        lines.push(indent(row.log, 2));
      }
    }
  }

  return lines;
}

/**
 * @param {number} count
 * @param {string} singular
 */
function plural(count, singular) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

/**
 * The rows, any failures, the totals and a closing verdict.
 *
 * @param {{ rows: SuiteRow[], durationMs: number, exitCode: number }} report
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderReport({ rows, durationMs, exitCode }, { chalk }) {
  const totals = { files: 0, passed: 0, failed: 0, other: 0 };

  for (const row of rows) {
    if (row.results) {
      totals.files += row.results.files;
      totals.passed += row.results.tests.passed;
      totals.failed += row.results.tests.failed;
      totals.other += row.results.tests.skipped + row.results.tests.todo;
    }
  }

  const testCount = totals.passed + totals.failed + totals.other;
  const suites = rows.filter((row) => row.kind === 'suite');
  const failedSuites = suites.filter(hasFailed).length;
  const cachedSuites = suites.filter((row) => row.cached).length;
  const failures = renderFailures(rows, chalk);

  // Other failed tasks, counted by name: "1 build failed"
  /** @type {Map<string, number>} */
  const failedTasks = new Map();
  for (const row of rows) {
    if (row.kind === 'task') {
      const name = (row.note ?? 'task failed').replace(/ failed$/, '');
      failedTasks.set(name, (failedTasks.get(name) ?? 0) + 1);
    }
  }

  const problems = [
    failedSuites > 0 ? `${plural(failedSuites, 'test suite')} failed` : '',
    ...[...failedTasks].map(([name, count]) => `${plural(count, name)} failed`),
  ].filter(Boolean);

  // Turbo can fail outside any task; say so rather than claim a pass
  if (problems.length === 0 && exitCode !== 0) {
    problems.push(`Turbo exited with code ${exitCode}`);
  }

  const testsLine = [
    totals.failed > 0 ? `${totals.failed} failed, ` : '',
    `${totals.passed} passed (${testCount})`,
  ].join('');

  const verdict =
    problems.length === 0
      ? `${symbolFor(false, chalk)} All test suites passed!`
      : `${symbolFor(true, chalk)} ${problems.join(', ')}`;

  const lines = [
    '',
    ...renderRows(rows, chalk),
    ...(failures.length > 0
      ? ['', `${INDENT}${chalk.bold('Failures')}`, ...failures]
      : []),
    '',
    `${INDENT}${chalk.bold('Test files:')}  ${totals.files}`,
    `${INDENT}${chalk.bold('     Tests:')}  ${testsLine}`,
    `${INDENT}${chalk.bold('  Duration:')}  ${formatDuration(durationMs)}, ${cachedSuites} of ${plural(suites.length, 'suite')} cached`,
    '',
    `${INDENT}${verdict}`,
    '',
  ];

  return lines.join('\n');
}
