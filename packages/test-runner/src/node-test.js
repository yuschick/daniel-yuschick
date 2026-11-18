import { fileURLToPath } from 'node:url';

/**
 * The reporter by its own location, so it loads from any package, including
 * `@dy/configs`, which can't depend on this one
 */
const RESULTS_REPORTER = fileURLToPath(
  new URL('reporters/node.js', import.meta.url),
);

/**
 * The flags every package's `node --test` suite shares: coverage of its own
 * files, `spec` for people, and the results reporter for the report. Extra
 * flags, such as `--test-timeout`, follow them.
 *
 * @param {string[]} extraArguments
 * @returns {string[]}
 */
export function nodeTestArguments(extraArguments) {
  return [
    '--test',
    '--experimental-test-coverage',
    '--test-coverage-exclude=**/*.test.js',
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    `--test-reporter=${RESULTS_REPORTER}`,
    '--test-reporter-destination=stdout',
    ...extraArguments,
  ];
}
