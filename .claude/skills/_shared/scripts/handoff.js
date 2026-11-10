import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { project } from './project.js';
import { git } from './verification.js';

/*
 ** A skill that ends at a branch hands it to /pr here. The skill writes only the
 ** PR body, as Markdown; this script adds the facts nobody types by hand, such
 ** as the branch and the commit, and /pr verifies the branch itself.
 */

export const HANDOFF_ROOT = 'node_modules/.cache/skills';
export const HANDOFF_SKILLS = /** @type {const} */ ([
  'implement',
  'retro',
  'spec',
  'sync-icons',
  'sync-tokens',
]);

/** @param {string} branch */
export const handoffDirectory = (branch) => `${HANDOFF_ROOT}/${branch}`;

/**
 * Splits a body into its `##` sections, in order. Text before the first
 * heading has nowhere to go, so it's an error rather than silently dropped.
 *
 * @param {string} markdown
 * @returns {Record<string, string>}
 */
export function parseSections(markdown) {
  const sections = {};
  let current = null;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (.+?)\s*$/);
    if (heading) {
      current = heading[1];
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    } else if (line.trim()) {
      throw new Error('The body must start with a "## " section heading.');
    }
  }
  return Object.fromEntries(
    Object.entries(sections)
      .map(([name, lines]) => [name, lines.join('\n').trim()])
      .filter(([, text]) => text),
  );
}

/**
 * @param {{ skill: string, branch: string, head: string, base: string, title: string, draft: boolean, body: Record<string, string> }} handoff
 * @returns {string[]}
 */
export function checkHandoffShape(handoff) {
  const errors = [];
  if (!HANDOFF_SKILLS.includes(/** @type {any} */ (handoff.skill))) {
    errors.push(`Unknown skill in the handoff: ${handoff.skill}.`);
  }
  for (const field of ['branch', 'head', 'base', 'title']) {
    if (typeof handoff[field] !== 'string' || !handoff[field]) {
      errors.push(`The handoff has no ${field}.`);
    }
  }
  if (typeof handoff.draft !== 'boolean') {
    errors.push('The handoff must say whether the PR is a draft.');
  }
  if (
    typeof handoff.body !== 'object' ||
    handoff.body === null ||
    Object.keys(handoff.body).length === 0
  ) {
    errors.push('The handoff has no body sections.');
  }
  return errors;
}

/**
 * @param {{ skill: string, draft?: boolean }} options `draft` forces the value, as /implement does.
 */
export function main({ skill, draft: forcedDraft } = { skill: '' }) {
  const { values } = parseArgs({
    options: {
      title: { type: 'string' },
      base: { type: 'string', default: project.defaultBranch },
      draft: { type: 'boolean', default: false },
      body: { type: 'string' },
    },
  });
  if (!values.title) {
    throw new Error(
      'Usage: write-handoff.js --title "<title>" [--base <branch>] [--draft] [--body <file>]',
    );
  }

  const branch = git(['branch', '--show-current']).output;
  const directory = handoffDirectory(branch);
  const bodyPath = values.body ?? `${directory}/body.md`;
  const errors = [];
  if (!branch) errors.push('Not on a branch.');
  if (branch === project.defaultBranch) {
    errors.push(`A handoff can't come from ${project.defaultBranch}.`);
  }
  const uncommitted = git([
    'status',
    '--porcelain',
    '--untracked-files=no',
  ]).output;
  if (uncommitted) errors.push(`Commit the work first:\n${uncommitted}`);
  if (!existsSync(resolve(bodyPath))) errors.push(`No body at ${bodyPath}.`);

  let body = {};
  if (errors.length === 0) {
    try {
      body = parseSections(readFileSync(resolve(bodyPath), 'utf8'));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  const handoff = {
    skill,
    branch,
    head: git(['rev-parse', 'HEAD']).output,
    base: values.base,
    title: values.title,
    draft: forcedDraft ?? values.draft,
    body,
  };
  errors.push(...(errors.length === 0 ? checkHandoffShape(handoff) : []));

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  mkdirSync(resolve(directory), { recursive: true });
  writeFileSync(
    resolve(directory, 'handoff.json'),
    JSON.stringify(handoff, null, 2),
  );
  console.log(`${directory}/handoff.json\nNext: /pr`);
}
