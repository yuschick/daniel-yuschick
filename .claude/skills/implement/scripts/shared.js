import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

/** Everything that decides what a component does or how it's judged, so a review stays pinned to it. */
const REVIEWED_PATHS = [
  '.claude/agents',
  '.claude/skills/implement',
  'brain/standards',
  'packages/configs',
  'packages/react/specs',
  'packages/react/src',
  'packages/storybook/.storybook',
  'packages/tokens/src',
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

/**
 * What preflight recorded. No record means preflight hasn't passed, and the
 * base lives here so the author can't pick one that hides its changes.
 *
 * @param {string} cache
 * @returns {{ staging: boolean, step: boolean, base: string } | null}
 */
export function readRun(cache) {
  const path = resolve(cache, 'run.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

export const MAX_REVIEW_ROUNDS = 3;
export const MAX_INVALID_REPORTS = 2;
const REPORT = /^report-(\d+)\.md$/;

/**
 * @param {string} cache
 * @returns {{ rounds: { file: string, verdict: string, treeHash: string, flagged: string[] }[], invalid: string[], history: object[], resets: number }}
 */
export function readReviewState(cache) {
  const path = resolve(cache, 'rounds.json');
  return existsSync(path)
    ? JSON.parse(readFileSync(path, 'utf8'))
    : { rounds: [], invalid: [], history: [], resets: 0 };
}

/**
 * @param {string} cache
 * @param {ReturnType<typeof readReviewState>} state
 */
export function writeReviewState(cache, state) {
  mkdirSync(resolve(cache), { recursive: true });
  writeFileSync(resolve(cache, 'rounds.json'), JSON.stringify(state, null, 2));
}

/**
 * @param {ReturnType<typeof readReviewState>} state
 * @returns {string | null} Why another reviewer may not start, if it may not.
 */
export function findReviewLimit({ rounds, invalid }) {
  const failures = rounds.filter(({ verdict }) => verdict === 'FAIL').length;
  if (failures >= MAX_REVIEW_ROUNDS) {
    return `${failures} review rounds have failed, which is the limit. Only Daniel can decide what happens next.`;
  }
  return invalid.length >= MAX_INVALID_REPORTS
    ? `${invalid.length} reports were invalid, which is the limit. Show Daniel.`
    : null;
}

/**
 * @param {ReturnType<typeof readReviewState>} state
 * @param {string} file
 * @returns {boolean}
 */
export function isReportRecorded({ rounds, history, invalid }, file) {
  return (
    invalid.includes(file) ||
    [...rounds, ...history].some((entry) => entry.file === file)
  );
}

/**
 * @param {ReturnType<typeof readReviewState>} state
 * @param {string} hash
 * @returns {boolean} Whether the most recent review passed this exact code.
 */
export function hasPassingReview({ rounds }, hash) {
  const last = rounds.at(-1);
  return last?.verdict === 'PASS' && last.treeHash === hash;
}

const reportNumbers = (cache) => {
  const directory = resolve(cache);
  return existsSync(directory)
    ? readdirSync(directory)
        .map((file) => Number(file.match(REPORT)?.[1] ?? 0))
        .filter(Boolean)
    : [];
};

/** @param {string} cache */
export function latestReport(cache) {
  const numbers = reportNumbers(cache);
  return numbers.length > 0 ? `report-${Math.max(...numbers)}.md` : null;
}

/** @param {string} cache */
export function nextReport(cache) {
  return `report-${Math.max(0, ...reportNumbers(cache)) + 1}.md`;
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
    cache: `node_modules/.cache/implement/${component}`,
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

export const REVIEW_HOOK_ERROR = 'review-hook-error.txt';
