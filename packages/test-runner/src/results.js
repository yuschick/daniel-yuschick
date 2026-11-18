import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Every suite writes one results file here, relative to its package. Turbo
 * caches the folder as the `test` task's output, so an unchanged package
 * replays its last real results instead of rerunning.
 */
export const RESULTS_DIRECTORY = '.test-results';

/** Bump when the shape below changes, so the renderer can reject old files. */
export const SCHEMA_VERSION = 1;

/**
 * @typedef {object} Coverage
 * @property {number} lines Percent covered, 0–100
 * @property {number} branches Percent covered, 0–100
 * @property {number} functions Percent covered, 0–100
 */

/**
 * @typedef {object} Failure
 * @property {string} name The test's name
 * @property {string | null} file Relative to the package, when known
 * @property {string} message The assertion or error message
 */

/**
 * @typedef {object} SuiteResults
 * @property {number} schemaVersion
 * @property {string} package The package name, for example `@dy/css`
 * @property {'node' | 'vitest' | 'storybook'} suite The runner that produced it
 * @property {number} files Test files run
 * @property {{ passed: number, failed: number, skipped: number, todo: number }} tests
 * @property {number} durationMs The runner's own measure of its run
 * @property {Coverage | null} coverage `null` when there is no JavaScript to cover
 * @property {Failure[]} failures
 */

/**
 * @param {string} packageDirectory
 * @returns {Promise<string>}
 */
export async function readPackageName(packageDirectory) {
  const manifest = JSON.parse(
    await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
  );

  return manifest.name;
}

/**
 * @param {string} packageDirectory
 * @param {SuiteResults} results
 * @returns {Promise<string>} The file written
 */
export async function writeSuiteResults(packageDirectory, results) {
  const directory = path.join(packageDirectory, RESULTS_DIRECTORY);
  const filePath = path.join(directory, `${results.suite}.json`);

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(results, null, 2)}\n`);

  return filePath;
}
