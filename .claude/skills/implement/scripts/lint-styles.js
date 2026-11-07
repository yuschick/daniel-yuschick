import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/*
 ** Stylelint for the fast loop. The gates lint every style sheet too, but the
 ** package's lint script runs ESLint first and stops on its errors, so a style
 ** sheet's problems could stay hidden until the very end. A style sheet stands
 ** on its own, so it's linted straight after each edit instead.
 */

const PACKAGE = 'packages/react';
const BINARY = `${PACKAGE}/node_modules/.bin/stylelint`;

/**
 * Lints one style sheet with the package's own Stylelint and config, the same
 * ones the gates use. The source goes in on stdin, so nothing is written.
 *
 * @param {{ file: string, source: string, root: string }} options
 * @param {string} options.file - The style sheet, relative to the repo root.
 * @param {string} options.source - Its contents, as just edited.
 * @param {string} options.root - The repo root.
 * @returns {string[]} One line per problem. It fails closed: when Stylelint can't run, that's the problem.
 */
export function lintStyleSheet({ file, source, root }) {
  const binary = resolve(root, BINARY);
  if (!existsSync(binary)) {
    return [
      `Stylelint couldn't run on ${file}: ${BINARY} is missing. Run pnpm install.`,
    ];
  }

  const packageRoot = resolve(root, PACKAGE);
  const result = spawnSync(
    binary,
    [
      '--stdin-filename',
      resolve(root, file),
      '--formatter',
      'unix',
      '--max-warnings',
      '0',
    ],
    { cwd: packageRoot, encoding: 'utf8', input: source },
  );
  if (result.status === 0) return [];

  // Stylelint writes a failing report to stderr, so both streams are read.
  const output = `${result.stdout}\n${result.stderr}`;
  const problems = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith(`${resolve(root, file)}:`))
    .map((line) => line.replace(resolve(root, file), file));
  if (problems.length > 0) return problems;

  return [
    `Stylelint couldn't run on ${file}: ${output.trim() || `exit ${String(result.status)}`}`,
  ];
}
