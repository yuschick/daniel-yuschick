import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { RESULTS_DIRECTORY, SCHEMA_VERSION } from './results.js';

/** @typedef {import('./results.js').SuiteResults} SuiteResults */

/**
 * One line of the report: a suite's results, or a task that ended without
 * any, with a note saying why.
 *
 * @typedef {object} SuiteRow
 * @property {string} label
 * @property {'suite' | 'task'} kind A test suite, or another task (a build) that failed
 * @property {SuiteResults | null} results `null` when there are none to show
 * @property {string | null} note Why there are no results: 'did not finish', 'did not run' or 'build failed'
 * @property {boolean} cached Turbo replayed it instead of running it
 * @property {string | null} log The end of the task's log, when it failed without results
 */

/**
 * A workspace package that has a `test` script, so it should report.
 *
 * @typedef {object} TestedPackage
 * @property {string} name
 * @property {string} directory Absolute
 */

/**
 * The parts of a `turbo run --summarize` file this reads.
 *
 * @typedef {object} TurboTask
 * @property {string} task
 * @property {string} package
 * @property {string} directory Relative to the repository root
 * @property {string} command `<NONEXISTENT>` when the package has no such script
 * @property {{ status: 'HIT' | 'MISS' }} cache
 * @property {{ exitCode: number | null } | undefined} execution
 */

const LOG_LINES = 20;

/**
 * Packages in `packagesDirectory` with a `test` script. These are the suites
 * the report expects: Turbo's summary leaves out a task it never scheduled
 * (one whose dependency failed to build), so it can't be the only source.
 *
 * @param {string} packagesDirectory
 * @returns {Promise<TestedPackage[]>}
 */
export async function findTestedPackages(packagesDirectory) {
  const directories = (
    await readdir(packagesDirectory, { withFileTypes: true })
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDirectory, entry.name));

  const packages = await Promise.all(
    directories.map(async (directory) => {
      try {
        const manifest = JSON.parse(
          await readFile(path.join(directory, 'package.json'), 'utf8'),
        );

        return manifest.scripts?.test
          ? { name: /** @type {string} */ (manifest.name), directory }
          : null;
      } catch {
        return null;
      }
    }),
  );

  return packages.filter((testedPackage) => testedPackage !== null);
}

/**
 * Removes every package's results before a run, so a suite that crashes
 * can't leave last run's results looking current. Turbo restores the
 * results of cached tasks.
 *
 * @param {TestedPackage[]} packages
 */
export async function clearResults(packages) {
  await Promise.all(
    packages.map(({ directory }) =>
      rm(path.join(directory, RESULTS_DIRECTORY), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

/**
 * @param {string} packageDirectory
 * @returns {Promise<SuiteResults[]>} Sorted by suite
 */
export async function readSuiteResults(packageDirectory) {
  const directory = path.join(packageDirectory, RESULTS_DIRECTORY);
  /** @type {string[]} */
  let fileNames;

  try {
    fileNames = await readdir(directory);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const results = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.json'))
      .sort()
      .map(async (fileName) =>
        JSON.parse(await readFile(path.join(directory, fileName), 'utf8')),
      ),
  );

  return results.filter((result) => result.schemaVersion === SCHEMA_VERSION);
}

/**
 * The end of a task's log, without the runner's color codes (Turbo's
 * `--no-color` only covers Turbo) or pnpm's closing line.
 *
 * @param {string} packageDirectory
 * @param {string} task
 * @returns {Promise<string | null>}
 */
async function readLogTail(packageDirectory, task) {
  const logPath = path.join(packageDirectory, '.turbo', `turbo-${task}.log`);

  try {
    const lines = stripVTControlCharacters(await readFile(logPath, 'utf8'))
      .trimEnd()
      .split('\n')
      .filter((line) => !line.includes('ELIFECYCLE'))
      // Stack frames crowd out the messages; the full log keeps them
      .filter((line) => !/^\s+at /.test(line))
      // Keep one blank line where a runner prints several
      .filter((line, index, all) => line.trim() || all[index - 1]?.trim());

    const tail = lines.slice(-LOG_LINES).join('\n').trim();

    return `${tail}\n\nFull log: ${path.relative(process.cwd(), logPath)}`;
  } catch {
    return null;
  }
}

/**
 * @param {TestedPackage} testedPackage
 * @param {TurboTask | undefined} task
 * @returns {Promise<SuiteRow[]>}
 */
async function rowsForPackage(testedPackage, task) {
  if (!task) {
    return [
      {
        label: testedPackage.name,
        kind: 'suite',
        results: null,
        note: 'did not run',
        cached: false,
        log: null,
      },
    ];
  }

  const suites = await readSuiteResults(testedPackage.directory);
  const cached = task.cache.status === 'HIT';
  // A task can fail without a failing test, when a suite crashes before
  // writing its results
  const crashed =
    task.execution?.exitCode !== 0 &&
    !suites.some(
      (results) => results.tests.failed + results.failures.length > 0,
    );
  // A package with more than one row names each suite by its runner
  const named = suites.length + (crashed ? 1 : 0) > 1;

  /** @type {SuiteRow[]} */
  const rows = suites.map((results) => ({
    label: named
      ? `${testedPackage.name} · ${results.suite}`
      : testedPackage.name,
    kind: 'suite',
    results,
    note: null,
    cached,
    log: null,
  }));

  if (crashed) {
    rows.push({
      label: testedPackage.name,
      kind: 'suite',
      results: null,
      note: 'did not finish',
      cached,
      log: await readLogTail(testedPackage.directory, 'test'),
    });
  }

  // The task passed but nothing reported: a runner without the reporter.
  // Showing it keeps a suite from dropping out of the report unnoticed.
  if (rows.length === 0) {
    rows.push({
      label: testedPackage.name,
      kind: 'suite',
      results: null,
      note: 'wrote no results',
      cached,
      log: null,
    });
  }

  return rows;
}

/**
 * Builds the report's rows: every expected suite, then any other task that
 * failed (a build a suite needed), so the report says why a suite didn't run.
 *
 * @param {{ tasks: TurboTask[] }} summary
 * @param {TestedPackage[]} packages
 * @param {string} repositoryRoot
 * @returns {Promise<SuiteRow[]>} Sorted by label
 */
export async function collectRows(summary, packages, repositoryRoot) {
  const tasks = summary.tasks.filter(
    (task) => task.command !== '<NONEXISTENT>',
  );

  const suiteRows = await Promise.all(
    packages.map((testedPackage) =>
      rowsForPackage(
        testedPackage,
        tasks.find(
          (task) => task.task === 'test' && task.package === testedPackage.name,
        ),
      ),
    ),
  );

  const failedTasks = tasks.filter(
    (task) => task.task !== 'test' && task.execution?.exitCode !== 0,
  );

  const taskRows = await Promise.all(
    failedTasks.map(async (task) => ({
      label: task.package,
      kind: /** @type {const} */ ('task'),
      results: null,
      note: `${task.task} failed`,
      cached: false,
      log: await readLogTail(
        path.join(repositoryRoot, task.directory),
        task.task,
      ),
    })),
  );

  return [...suiteRows.flat(), ...taskRows].sort((first, second) =>
    first.label.localeCompare(second.label),
  );
}
