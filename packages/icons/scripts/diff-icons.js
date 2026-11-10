import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { toComponentName } from './generate.js';

export const NO_CHANGES = 'No icon changes.';

/**
 * @typedef {import('./figma-to-icon-manifest.js').IconManifest} IconManifest
 * @typedef {import('./figma-to-icon-manifest.js').ManifestIcon} ManifestIcon
 */

/**
 * Compares two manifests by icon name. An icon whose Figma node keeps its ID
 * under a new name is a rename, which breaks every import of the old name.
 *
 * @param {{ base: ManifestIcon[], head: ManifestIcon[] }} options
 */
export function compareIcons({ base, head }) {
  const baseByName = new Map(base.map((icon) => [icon.name, icon]));
  const headByName = new Map(head.map((icon) => [icon.name, icon]));
  const baseById = new Map(base.map((icon) => [icon.figma.id, icon]));

  /** @type {{ from: string, to: string }[]} */
  const renamed = [];
  const added = [];
  for (const icon of head) {
    if (baseByName.has(icon.name)) {
      continue;
    }
    const previous = baseById.get(icon.figma.id);
    if (previous && !headByName.has(previous.name)) {
      renamed.push({ from: previous.name, to: icon.name });
    } else {
      added.push(icon.name);
    }
  }

  const renamedFrom = new Set(renamed.map(({ from }) => from));
  const removed = base
    .map(({ name }) => name)
    .filter((name) => !headByName.has(name) && !renamedFrom.has(name));

  const changed = [];
  const described = [];
  for (const icon of head) {
    const before = baseByName.get(icon.name);
    if (!before) {
      continue;
    }
    if (JSON.stringify(before.nodes) !== JSON.stringify(icon.nodes)) {
      changed.push(icon.name);
    }
    if (before.description !== icon.description) {
      described.push(icon.name);
    }
  }

  return { added, removed, renamed, changed, described };
}

/**
 * Builds the Markdown summary used as the icon sync PR description.
 *
 * @param {{ base: IconManifest | undefined, head: IconManifest }} options
 * @returns {string}
 */
export function formatSummary({ base, head }) {
  const { added, removed, renamed, changed, described } = compareIcons({
    base: base?.icons ?? [],
    head: head.icons,
  });
  const styleChanged =
    base !== undefined &&
    (base.viewBox !== head.viewBox ||
      JSON.stringify(base.attributes) !== JSON.stringify(head.attributes));

  const total =
    added.length +
    removed.length +
    renamed.length +
    changed.length +
    described.length;
  if (total === 0 && !styleChanged) {
    return NO_CHANGES;
  }

  /** @param {{ name: string }} options */
  const row = ({ name }) =>
    `| \`${name}\` | \`${toComponentName({ name })}\` |`;
  const table = ['| Icon | React |', '| :-- | :-- |'];
  const sections = [
    `**${String(added.length)} added, ${String(changed.length)} changed, ${String(renamed.length)} renamed, ${String(removed.length)} removed**, ${String(described.length)} descriptions updated (${String(head.icons.length)} icons in total)`,
  ];

  if (styleChanged) {
    sections.push(
      '### Shared style changed',
      'The viewBox or stroke attributes every icon shares changed. Check every icon, not only those listed below.',
    );
  }
  if (removed.length > 0 || renamed.length > 0) {
    sections.push(
      '### Breaking',
      'Imports of these names stop working:',
      [
        ...renamed.map(
          ({ from, to }) =>
            `- \`${toComponentName({ name: from })}\` → \`${toComponentName({ name: to })}\` (renamed \`${from}\` → \`${to}\`)`,
        ),
        ...removed.map(
          (name) => `- \`${toComponentName({ name })}\` (removed \`${name}\`)`,
        ),
      ].join('\n'),
    );
  }
  if (added.length > 0) {
    sections.push(
      '### Added',
      [...table, ...added.map((name) => row({ name }))].join('\n'),
    );
  }
  if (changed.length > 0) {
    sections.push(
      '### Changed shape',
      [...table, ...changed.map((name) => row({ name }))].join('\n'),
    );
  }
  if (described.length > 0) {
    sections.push(
      '### Descriptions updated',
      described.map((name) => `- \`${name}\``).join('\n'),
    );
  }

  return sections.join('\n\n');
}

/**
 * Reads the manifest committed at a git ref, if there is one.
 *
 * @param {{ ref: string, repoPath: string }} options
 * @returns {IconManifest | undefined}
 */
function readManifestAtRef({ ref, repoPath }) {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `${ref}:${repoPath}`], {
        encoding: 'utf8',
        // A missing manifest is expected on a first sync; keep git's own
        // "fatal: path does not exist" message out of the output
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    );
  } catch {
    return undefined;
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' },
      file: { type: 'string' },
      'repo-path': { type: 'string', default: 'packages/icons/src/icons.json' },
      out: { type: 'string' },
    },
  });

  if (!values.base || !values.file) {
    throw new Error(
      'Usage: node diff-icons.js --base <git ref> --file <new icons.json> [--repo-path packages/icons/src/icons.json] [--out <summary.md>]',
    );
  }

  const summary = formatSummary({
    base: readManifestAtRef({
      ref: values.base,
      repoPath: values['repo-path'],
    }),
    head: JSON.parse(await readFile(resolve(values.file), 'utf8')),
  });

  if (values.out) {
    await writeFile(resolve(values.out), `${summary}\n`);
  }
  process.stdout.write(`${summary}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
