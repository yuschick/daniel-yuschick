import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Everything that decides what a component does, so a review stays pinned to it. */
const REVIEWED_PATHS = [
  'brain/standards',
  'packages/react/specs',
  'packages/react/src',
  'packages/storybook/.storybook',
];
const BARRELS = [
  'packages/react/src/components/index.ts',
  'packages/react/src/index.ts',
];
const SHARED_RULES = ['brain/standards/', 'packages/react/src/types/'];

/**
 * The one table of what a build may touch, used by the hooks before a write and
 * by the scope gate after it. Anything unlisted is denied. Lowercased because
 * macOS treats `Specs/` and `specs/` as the same folder.
 *
 * @param {string} file Path relative to the repo root
 * @param {string} component Lowercase component name
 * @returns {'allow' | 'ask' | 'deny'} `ask` means only a person can approve it.
 */
export function classifyPath(file, component) {
  const path = file.toLowerCase();
  if (
    path.startsWith(`packages/react/src/components/${component}/`) ||
    BARRELS.includes(path)
  ) {
    return 'allow';
  }
  return SHARED_RULES.some((prefix) => path.startsWith(prefix))
    ? 'ask'
    : 'deny';
}

/** @param {string} file */
export function hashFile(file) {
  const path = resolve(file);
  return existsSync(path)
    ? createHash('sha256').update(readFileSync(path)).digest('hex')
    : null;
}

/**
 * Shared-rule edits a person approved, recorded by the hook after the prompt.
 *
 * @param {string} cache
 * @returns {Record<string, string>} File to the hash that was approved.
 */
export function readApprovals(cache) {
  const path = resolve(cache, 'approvals.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

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
