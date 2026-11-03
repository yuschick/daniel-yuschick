import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Everything that decides what a component does, so a review stays pinned to it. */
const REVIEWED_PATHS = [
  'brain/standards',
  'packages/react/specs',
  'packages/react/src',
  'packages/storybook/.storybook',
];

/** @param {string[]} args */
export function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  return { ok: result.status === 0, output: result.stdout.trim() };
}

/** @param {string} component Lowercase component name, as in the spec's file name. */
export function componentPaths(component) {
  const specs = 'packages/react/specs';
  return {
    spec: `${specs}/${component}.md`,
    facts: `${specs}/${component}.facts.json`,
    cache: `node_modules/.cache/build/${component}`,
  };
}

/** Hashes the reviewed files as they are on disk, committed or not. */
export function treeHash() {
  const { output } = git([
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    ...REVIEWED_PATHS,
  ]);
  const hash = createHash('sha256');
  for (const file of output.split('\n').filter(Boolean).sort()) {
    hash.update(file);
    try {
      hash.update(readFileSync(resolve(file)));
    } catch {
      hash.update('deleted');
    }
  }
  return hash.digest('hex').slice(0, 16);
}
