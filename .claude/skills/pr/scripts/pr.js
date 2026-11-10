import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readSpecErrors } from '../../_shared/scripts/check-spec.js';
import {
  checkHandoffShape,
  handoffDirectory,
} from '../../_shared/scripts/handoff.js';
import { project } from '../../_shared/scripts/project.js';
import {
  componentPaths,
  hasPassingReview,
  readReviewState,
  treeHash,
} from '../../_shared/scripts/verification.js';

/** Recorded once a branch is verified; the guard allows only its commands. */
export const readyPath = (branch) => `${handoffDirectory(branch)}/ready.json`;

/** Each skill's branch prefix, so a handoff can't claim another skill's work. */
const BRANCH_PREFIX = {
  implement: 'implement/',
  retro: 'retro/',
  spec: 'spec/',
  'sync-icons': 'icons/',
  'sync-tokens': 'tokens/',
};

/**
 * @param {Record<string, any>} handoff
 * @param {{ branch: string, head: string }} current
 * @returns {string[]}
 */
export function checkHandoff(handoff, { branch, head }) {
  const errors = checkHandoffShape(handoff);
  if (handoff.branch !== branch) {
    errors.push(`The handoff is for ${handoff.branch}, not ${branch}.`);
  }
  if (handoff.head !== head) {
    errors.push(
      `The branch moved since the handoff (${String(handoff.head).slice(0, 7)} → ${head.slice(0, 7)}). Rerun the skill's last step, so the PR describes what's pushed.`,
    );
  }
  const prefix = BRANCH_PREFIX[handoff.skill];
  // /retro may commit on a session's unmerged branch, so only its own prefix is optional.
  if (prefix && handoff.skill !== 'retro' && !branch.startsWith(prefix)) {
    errors.push(
      `A ${handoff.skill} handoff must come from a ${prefix} branch.`,
    );
  }
  if (handoff.skill === 'implement' && handoff.draft !== true) {
    errors.push("A build's PR is always a draft.");
  }
  if (handoff.base === branch) {
    errors.push("A PR can't target its own branch.");
  }
  return errors;
}

/**
 * @param {string} command
 * @returns {{ status: number | null, output: string }}
 */
export function runShell(command) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

const shellCheck = (name, command, run) => {
  const { status, output } = run(command);
  return {
    name,
    errors:
      status === 0
        ? []
        : [
            `${command} failed:\n${output.trim().split('\n').slice(-20).join('\n')}`,
          ],
  };
};

/**
 * /pr's own check of each skill's branch, never a command the handoff names,
 * so whoever wrote the handoff can't decide how it's verified.
 *
 * @param {{ skill: string | null, branch: string, run?: typeof runShell }} options `skill` is null for a branch no skill handed off.
 * @returns {Promise<{ name: string, errors: string[] }[]>}
 */
export async function verifyBranch({ skill, branch, run = runShell }) {
  const component = branch.slice(branch.indexOf('/') + 1);
  if (skill === 'spec') {
    const { spec, facts } = componentPaths(component);
    return [
      {
        name: 'spec ready',
        errors: await readSpecErrors({ spec, facts, isReady: true }),
      },
      shellCheck('format', 'pnpm format:check', run),
    ];
  }
  if (skill === 'implement') {
    const { cache } = componentPaths(component);
    const gatesPath = resolve(cache, 'gates.json');
    const gates = existsSync(gatesPath)
      ? JSON.parse(readFileSync(gatesPath, 'utf8'))
      : null;
    const hash = treeHash();
    return [
      {
        name: 'gates',
        errors:
          gates?.passed && gates.treeHash === hash
            ? []
            : [
                'The gates must pass on this exact code. Run /implement to its end.',
              ],
      },
      {
        name: 'review',
        errors: hasPassingReview(readReviewState(cache), hash)
          ? []
          : ['The latest cold review must pass this exact code.'],
      },
    ];
  }
  if (skill === 'sync-tokens') {
    return [shellCheck('tokens', project.commands.buildTokens, run)];
  }
  if (skill === 'sync-icons') {
    return [shellCheck('icons', project.commands.buildIcons, run)];
  }
  return project.commands.verify.map((command) =>
    shellCheck(command, command, run),
  );
}

const normalize = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Fills the repo's PR template from the handoff's sections, matched by heading,
 * drops template sections nothing filled, and appends the rest in order.
 *
 * @param {{ template: string, body: Record<string, string>, footer?: string }} options
 * @returns {string}
 */
export function renderBody({ template, body, footer }) {
  const headings = [...template.matchAll(/^## (.+?)\s*$/gm)].map(
    ([, heading]) => heading,
  );
  const used = new Set();
  const sections = [];
  for (const heading of headings) {
    const key = Object.keys(body).find(
      (name) => normalize(name) === normalize(heading),
    );
    if (key) {
      sections.push(`## ${heading}\n\n${body[key]}`);
      used.add(key);
    }
  }
  for (const [name, text] of Object.entries(body)) {
    if (!used.has(name)) sections.push(`## ${name}\n\n${text}`);
  }
  if (footer) sections.push(footer);
  return `${sections.join('\n\n')}\n`;
}

/** @param {string} text */
export const shellQuote = (text) => `'${text.replaceAll("'", `'\\''`)}'`;

/** The first `gh` in the profile that runs. */
export function findGh() {
  return (
    project.gh.find(
      (command) => spawnSync(command, ['--version']).status === 0,
    ) ?? project.gh[0]
  );
}

/**
 * @param {{ gh: string, branch: string, base: string, title: string, draft: boolean, bodyPath: string }} options
 * @returns {string[]} The push, then the PR, exactly as the guard will allow them.
 */
export function buildCommands({ gh, branch, base, title, draft, bodyPath }) {
  return [
    `git push -u origin ${branch}`,
    [
      `${gh} pr create --base ${base} --head ${branch}`,
      `--title ${shellQuote(title)} --body-file ${bodyPath}`,
      ...(draft ? ['--draft'] : []),
    ].join(' '),
  ];
}

const OUTBOUND = /\bgit\s+push\b|\bpr\s+create\b/;

/** @param {string} command */
export const isOutbound = (command) => OUTBOUND.test(command);

/**
 * Only /pr pushes or opens a PR, and only with the exact commands it printed
 * for the exact commit it verified.
 *
 * @param {{ command: string, ready: { branch: string, head: string, commands: string[] } | null, branch: string, head: string }} options
 * @returns {{ decision: 'deny', reason: string } | null} `null` lets it run.
 */
export function decideGuard({ command, ready, branch, head }) {
  const trimmed = command.trim();
  if (!isOutbound(trimmed)) return null;
  if (ready === null || ready.branch !== branch) {
    return {
      decision: 'deny',
      reason:
        'Run prepare-pr.js first: only a verified branch is pushed or opened as a PR.',
    };
  }
  if (ready.head !== head) {
    return {
      decision: 'deny',
      reason: 'The branch moved since prepare-pr.js verified it. Run it again.',
    };
  }
  return ready.commands.includes(trimmed)
    ? null
    : {
        decision: 'deny',
        reason:
          'Run exactly the commands prepare-pr.js printed, one at a time.',
      };
}
