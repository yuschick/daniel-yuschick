import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { componentPaths, readRun, treeHash } from './verification.js';

const OUTPUT_TAIL_LINES = 40;
const IMPLEMENT_SCRIPTS = '.claude/skills/implement/scripts';

/** Removes terminal colors, so a saved log stays readable to a reviewer. */
const stripColors = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

/**
 * Every gate runs, even after a failure, so one attempt reports every problem.
 *
 * @param {{ name: string, command: string }[]} gates
 * @param {(command: string) => { status: number | null, output: string }} run
 */
export function runGates(gates, run) {
  return gates.map(({ name, command }) => {
    const { status, output } = run(command);
    return {
      name,
      command,
      passed: status === 0,
      tail: stripColors(output)
        .trim()
        .split('\n')
        .slice(-OUTPUT_TAIL_LINES)
        .join('\n'),
    };
  });
}

/**
 * The checker runs first: a gate that can't catch its seeded defects proves nothing.
 *
 * @param {{ component: string, base: string, scripts?: string }} options `scripts` is the calling skill's folder, which provides `preflight.js --approval-only` and `check-component.js`.
 * @returns {{ name: string, command: string }[]}
 */
export function listGates({ component, base, scripts = IMPLEMENT_SCRIPTS }) {
  return [
    {
      name: 'checker',
      command: 'node --test .claude/skills/*/scripts/*.test.js',
    },
    {
      name: 'approval',
      command: `node ${scripts}/preflight.js --component ${component} --approval-only`,
    },
    {
      name: 'component',
      command: `node ${scripts}/check-component.js --component ${component} --base ${base}`,
    },
    {
      name: 'turbo',
      // `--continue`, so one failed task can't hide the others.
      command:
        'pnpm turbo run lint check-types build test --ui=stream --continue',
    },
    { name: 'format', command: 'pnpm format:check' },
  ];
}

export function main({
  skill = 'implement',
  scripts = IMPLEMENT_SCRIPTS,
} = {}) {
  const { values } = parseArgs({
    options: { component: { type: 'string' } },
  });
  if (!values.component)
    throw new Error('Usage: run-gates.js --component <name>');

  const run = readRun(componentPaths(values.component, skill).cache);
  if (run === null) throw new Error('Run preflight.js first.');

  const before = treeHash();
  const gates = runGates(
    listGates({ component: values.component, base: run.base, scripts }),
    (command) => {
      const result = spawnSync(command, { shell: true, encoding: 'utf8' });
      return { status: result.status, output: result.stdout + result.stderr };
    },
  );
  const hash = treeHash();
  const passed = before === hash && gates.every((gate) => gate.passed);

  const { cache } = componentPaths(values.component, skill);
  mkdirSync(resolve(cache), { recursive: true });
  writeFileSync(
    resolve(cache, 'gates.json'),
    JSON.stringify({ treeHash: hash, passed, gates }, null, 2),
  );

  for (const gate of gates) {
    console.log(`${gate.passed ? 'PASS' : 'FAIL'}: ${gate.name}`);
    if (!gate.passed) console.log(gate.tail);
  }
  if (before !== hash)
    console.log('FAIL: reviewed files changed while the gates ran.');
  console.log(`GATES: ${passed ? 'PASS' : 'FAIL'} ${hash}`);
  if (!passed) process.exitCode = 1;
}
