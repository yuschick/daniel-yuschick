#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { Chalk } from 'chalk';

import { clearResults, collectRows, findTestedPackages } from './collect.js';
import { MARK } from './mark.js';
import { renderHeader, renderReport } from './render.js';

const USAGE = `Usage: pnpm test [--force] [--plain]

Runs every design system package's tests through Turbo and reports them.

  --force  Rerun every suite, ignoring Turbo's cache
  --plain  Leave out the mark, for logs and screen readers. Implied when
           output isn't a terminal. Set NO_COLOR to drop color.
  --help   Show this message`;

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const packagesDirectory = path.join(repositoryRoot, 'packages');

/**
 * Runs `turbo` quietly and returns its exit code and output. The report
 * replaces Turbo's logs, and the run summary carries everything it needs.
 *
 * @param {string[]} turboArguments
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
function runTurbo(turboArguments) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      path.join(repositoryRoot, 'node_modules', '.bin', 'turbo'),
      turboArguments,
      { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, output });
    });
  });
}

/**
 * @param {string[]} commandLine
 */
function readOptions(commandLine) {
  const { values } = parseArgs({
    args: commandLine,
    options: {
      force: { type: 'boolean', default: false },
      plain: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  // Chalk reads FORCE_COLOR and whether output is a terminal, but not
  // NO_COLOR (https://no-color.org), so that's handled here
  const noColor = Boolean(process.env.NO_COLOR);

  return {
    ...values,
    plain: values.plain || !process.stdout.isTTY,
    chalk: noColor ? new Chalk({ level: 0 }) : new Chalk(),
  };
}

async function main() {
  /** @type {ReturnType<typeof readOptions>} */
  let options;

  try {
    options = readOptions(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${/** @type {Error} */ (error).message}\n\n${USAGE}\n`,
    );
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const { chalk, plain } = options;

  process.stdout.write(renderHeader({ chalk, plain, mark: MARK }));

  const packages = await findTestedPackages(packagesDirectory);
  await clearResults(packages);

  const { exitCode, output } = await runTurbo([
    'run',
    'test',
    // Design system packages only; apps come later
    '--filter=./packages/*',
    '--summarize',
    // A failing suite doesn't stop the others; a failed build still stops
    // the packages that need it, since they can't run
    '--continue=dependencies-successful',
    '--output-logs=none',
    '--ui=stream',
    '--no-color',
    ...(options.force ? ['--force'] : []),
  ]);

  const summaryPath = /Summary:\s+(\S+\.json)/.exec(output)?.[1];

  // Without a summary, Turbo stopped before running anything (a config
  // error, say), so its own output is the most useful thing to show
  if (!summaryPath) {
    process.stdout.write(`\n${output}`);
    process.exitCode = exitCode || 1;
    return;
  }

  const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
  await rm(summaryPath, { force: true });

  const rows = await collectRows(summary, packages, repositoryRoot);

  process.stdout.write(
    renderReport(
      {
        rows,
        durationMs: summary.execution.endTime - summary.execution.startTime,
        exitCode,
      },
      { chalk, plain },
    ),
  );
  process.exitCode = exitCode;
}

await main();
