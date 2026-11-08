import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

import { readReport } from '../../_shared/scripts/check-review.js';
import { project } from '../../_shared/scripts/project.js';
import {
  componentPaths,
  nextReport,
  REVIEW_HOOK_ERROR,
} from '../../_shared/scripts/verification.js';

export const SCRIPTS = '.claude/skills/review/scripts';
export const CACHE_ROOT = 'node_modules/.cache/review';
/** Written when a reviewer is about to start, removed once its report is saved. */
export const MARKER = `${CACHE_ROOT}/active.json`;
export const KINDS = /** @type {const} */ (['component', 'spec']);

/**
 * Where one review's files live. A spec review and a component review of the
 * same name never share a folder.
 *
 * @param {'component' | 'spec'} kind
 * @param {string} name Lowercase component name, as in the spec's file name.
 */
export function targetPaths(kind, name) {
  const paths = componentPaths(name, 'review');
  return kind === 'spec' ? { ...paths, cache: `${paths.cache}-spec` } : paths;
}

/** @param {'component' | 'spec'} kind */
export const reviewerFor = (kind) =>
  kind === 'spec' ? project.reviewers.spec : project.reviewers.component;

/**
 * A build reviews itself through /implement, whose hook would also save this
 * reviewer's report and count it as one of the build's rounds.
 *
 * @param {string} branch
 * @returns {string | null}
 */
export function findBranchProblem(branch) {
  return /^implement\//.test(branch)
    ? `This is a build branch, and /implement runs its own review. Run /review from another branch.`
    : null;
}

/**
 * @param {string} root Repo root
 * @returns {{ kind: 'component' | 'spec', name: string, cache: string, reviewer: string, prompt: string } | null}
 */
export function readMarker(root) {
  const path = resolve(root, MARKER);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

/**
 * @param {string} root
 * @param {{ kind: 'component' | 'spec', name: string, cache: string, reviewer: string, prompt: string }} marker
 */
export function writeMarker(root, marker) {
  mkdirSync(resolve(root, CACHE_ROOT), { recursive: true });
  writeFileSync(resolve(root, MARKER), JSON.stringify(marker, null, 2));
}

const deny = (reason) => ({ decision: 'deny', reason });
const AGENT_TOOLS = new Set(['Agent', 'Task']);
const FILE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);

/**
 * While a reviewer is due, nothing but the review's scripts and hook may touch
 * its files, and the only subagent is that reviewer with exactly its prompt, so
 * the review stays cold and its report is the reviewer's own.
 *
 * @param {{ toolName: string, toolInput: Record<string, any>, marker: ReturnType<typeof readMarker>, root: string }} options
 * @returns {{ decision: 'deny', reason: string } | null} `null` lets the tool run.
 */
export function decidePre({ toolName, toolInput, marker, root }) {
  if (marker === null) return null;

  if (FILE_TOOLS.has(toolName)) {
    const path = toolInput.file_path ?? toolInput.notebook_path ?? '';
    const inside = relative(resolve(root, CACHE_ROOT), resolve(root, path));
    return inside === '' || !(inside.startsWith('..') || isAbsolute(inside))
      ? deny('Only the review scripts and its hook write the review files.')
      : null;
  }
  if (toolName === 'Bash') {
    const command = String(toolInput.command ?? '').trim();
    return command.includes('.cache/review') &&
      !command.startsWith(`node ${SCRIPTS}/`)
      ? deny(
          'Only the review scripts touch the review files. Run them as the skill says.',
        )
      : null;
  }
  if (AGENT_TOOLS.has(toolName)) {
    if (toolInput.subagent_type !== marker.reviewer) {
      return deny(
        `A review is waiting for ${marker.reviewer}, so no other subagent may start.`,
      );
    }
    if (toolInput.model !== undefined) {
      return deny(
        "Start the reviewer without a model override, so it's the one its agent file names.",
      );
    }
    return String(toolInput.prompt ?? '').trim() === marker.prompt.trim()
      ? null
      : deny(
          'Give the reviewer exactly the prompt start-review.js printed, and nothing else, so it stays cold.',
        );
  }
  return null;
}

/**
 * Saves the reviewer's report from its own transcript, then ends the review so
 * the next one starts fresh.
 *
 * @param {{ input: Record<string, any>, marker: NonNullable<ReturnType<typeof readMarker>>, root: string }} options
 * @returns {string | null} The report's file name, or null if none was found.
 */
export function saveReport({ input, marker, root }) {
  if (input.agent_type !== undefined && input.agent_type !== marker.reviewer) {
    return null;
  }
  const cache = resolve(root, marker.cache);
  mkdirSync(cache, { recursive: true });
  const report = readReport(input);
  rmSync(resolve(root, MARKER), { force: true });
  if (!report) {
    writeFileSync(
      resolve(cache, REVIEW_HOOK_ERROR),
      `The reviewer's hook ran, but found no report. It received: ${Object.keys(input).join(', ')}.`,
    );
    return null;
  }
  const file = nextReport(cache);
  writeFileSync(resolve(cache, file), report);
  return file;
}

/**
 * A spec review is prose, so the script checks only its shape: a final verdict,
 * and how many blocking findings and questions it lists.
 *
 * @param {string} report
 * @returns {{ verdict: 'PASS' | 'FAIL' | null, blocking: number, questions: number }}
 */
export function parseSpecReport(report) {
  const verdict = report.match(/^VERDICT: (PASS|FAIL)\s*$/m)?.[1] ?? null;
  const count = (label) =>
    (report.match(new RegExp(`\\*\\*${label}\\*\\*|\\b${label}:`, 'g')) ?? [])
      .length;
  return {
    verdict: /** @type {'PASS' | 'FAIL' | null} */ (verdict),
    blocking: count('Blocking'),
    questions: count('Question'),
  };
}

/**
 * Pins a spec review to the exact spec and facts it read.
 *
 * @param {{ spec: string, facts: string }} paths
 */
export function hashSpec({ spec, facts }) {
  const hash = createHash('sha256');
  for (const file of [spec, facts]) hash.update(readFileSync(resolve(file)));
  return hash.digest('hex').slice(0, 16);
}

/**
 * @param {Record<string, unknown>} values Parsed `--component` and `--spec` options
 * @returns {{ kind: 'component' | 'spec', name: string }}
 */
export function readTarget(values) {
  const given = KINDS.filter((kind) => typeof values[kind] === 'string');
  if (given.length !== 1) {
    throw new Error('Give exactly one of --component <name> or --spec <name>.');
  }
  return { kind: given[0], name: values[given[0]] };
}
