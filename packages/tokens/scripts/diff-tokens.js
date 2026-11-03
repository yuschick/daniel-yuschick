import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const NO_CHANGES = 'No token changes.';

/**
 * @typedef {{ file: string, type: string, value: string, description: string }} FlatToken
 */

/**
 * Formats a DTCG `$value` for a one-line summary.
 *
 * @param {{ value: unknown }} options
 * @returns {string}
 */
export function describeValue({ value }) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (value && typeof value === 'object' && 'hex' in value) {
    return String(value.hex);
  }
  if (
    value &&
    typeof value === 'object' &&
    'unit' in value &&
    'value' in value
  ) {
    return `${String(value.value)}${String(value.unit)}`;
  }
  return JSON.stringify(value);
}

/**
 * Flattens token files into `path → token` entries.
 *
 * @param {{ files: Record<string, unknown> }} options Parsed token files by file name
 * @returns {Map<string, FlatToken>}
 */
export function flattenTokens({ files }) {
  /** @type {Map<string, FlatToken>} */
  const tokens = new Map();

  /** @param {{ node: unknown, path: string[], file: string }} options */
  const walk = ({ node, path, file }) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if ('$value' in node) {
      tokens.set(path.join('.'), {
        file,
        type: String(/** @type {{ $type?: string }} */ (node).$type ?? ''),
        value: describeValue({ value: node.$value }),
        description: String(
          /** @type {{ $description?: string }} */ (node).$description ?? '',
        ),
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) {
        walk({ node: child, path: [...path, key], file });
      }
    }
  };

  for (const [file, json] of Object.entries(files)) {
    walk({ node: json, path: [], file });
  }
  return tokens;
}

/**
 * @param {{ base: Map<string, FlatToken>, head: Map<string, FlatToken> }} options
 */
export function compareTokens({ base, head }) {
  const added = [...head.keys()].filter((path) => !base.has(path)).sort();
  const removed = [...base.keys()].filter((path) => !head.has(path)).sort();
  const changed = [...head.keys()]
    .filter((path) => {
      const before = base.get(path);
      const after = head.get(path);
      return (
        before &&
        after &&
        (before.value !== after.value || before.type !== after.type)
      );
    })
    .sort();
  const described = [...head.keys()]
    .filter((path) => {
      const before = base.get(path);
      const after = head.get(path);
      return before && after && before.description !== after.description;
    })
    .sort();

  return { added, removed, changed, described };
}

/**
 * Builds the Markdown summary used as the token PR description.
 *
 * @param {{ base: Map<string, FlatToken>, head: Map<string, FlatToken> }} options
 * @returns {string}
 */
export function formatSummary({ base, head }) {
  const { added, removed, changed, described } = compareTokens({
    base,
    head,
  });

  if (added.length + removed.length + changed.length + described.length === 0) {
    return NO_CHANGES;
  }

  /** @param {{ path: string, token: FlatToken | undefined }} options */
  const row = ({ path, token }) =>
    `| \`${path}\` | ${token?.type ?? ''} | \`${token?.value ?? ''}\` | ${token?.file ?? ''} |`;
  const table = [
    '| Token | Type | Value | File |',
    '| :-- | :-- | :-- | :-- |',
  ];
  const sections = [
    `**${String(added.length)} added, ${String(changed.length)} changed, ${String(removed.length)} removed**, ${String(described.length)} descriptions updated (${String(head.size)} tokens in total)`,
  ];

  if (changed.length > 0) {
    sections.push(
      '### Changed',
      [
        '| Token | Before | After | File |',
        '| :-- | :-- | :-- | :-- |',
        ...changed.map(
          (path) =>
            `| \`${path}\` | \`${base.get(path)?.value ?? ''}\` | \`${head.get(path)?.value ?? ''}\` | ${head.get(path)?.file ?? ''} |`,
        ),
      ].join('\n'),
    );
  }
  if (added.length > 0) {
    sections.push(
      '### Added',
      [
        ...table,
        ...added.map((path) => row({ path, token: head.get(path) })),
      ].join('\n'),
    );
  }
  if (removed.length > 0) {
    sections.push(
      '### Removed',
      [
        ...table,
        ...removed.map((path) => row({ path, token: base.get(path) })),
      ].join('\n'),
    );
  }

  if (described.length > 0) {
    /** @param {{ text: string | undefined }} options */
    const cell = ({ text }) => (text ? text.replace(/\|/g, '\\|') : '_(none)_');
    sections.push(
      [
        '<details>',
        `<summary>Descriptions updated (${String(described.length)})</summary>`,
        '',
        '| Token | Before | After |',
        '| :-- | :-- | :-- |',
        ...described.map(
          (path) =>
            `| \`${path}\` | ${cell({ text: base.get(path)?.description })} | ${cell({ text: head.get(path)?.description })} |`,
        ),
        '',
        '</details>',
      ].join('\n'),
    );
  }

  return sections.join('\n\n');
}

/**
 * Reads the token files committed at a git ref.
 *
 * @param {{ ref: string, repoDir: string }} options
 * @returns {Record<string, unknown>}
 */
function readFilesAtRef({ ref, repoDir }) {
  let listing;
  try {
    listing = execFileSync(
      'git',
      ['ls-tree', '--full-tree', '--name-only', `${ref}:${repoDir}`],
      {
        encoding: 'utf8',
        // A missing directory is expected on a first sync; keep git's own
        // "fatal: Not a valid object name" message out of the output
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    // The directory doesn't exist at that ref yet, so every token is new
    return {};
  }

  return Object.fromEntries(
    listing
      .split('\n')
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => [
        fileName,
        JSON.parse(
          execFileSync('git', ['show', `${ref}:${repoDir}/${fileName}`], {
            encoding: 'utf8',
          }),
        ),
      ]),
  );
}

/**
 * @param {{ dir: string }} options
 * @returns {Promise<Record<string, unknown>>}
 */
async function readFilesInDir({ dir }) {
  const fileNames = (await readdir(dir)).filter((fileName) =>
    fileName.endsWith('.json'),
  );
  const entries = await Promise.all(
    fileNames.map(async (fileName) => [
      fileName,
      JSON.parse(await readFile(join(dir, fileName), 'utf8')),
    ]),
  );
  return Object.fromEntries(entries);
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' },
      dir: { type: 'string' },
      'repo-dir': { type: 'string', default: 'packages/tokens/src' },
      out: { type: 'string' },
    },
  });

  if (!values.base || !values.dir) {
    throw new Error(
      'Usage: node diff-tokens.js --base <git ref> --dir <new token dir> [--repo-dir packages/tokens/src] [--out <summary.md>]',
    );
  }

  const base = flattenTokens({
    files: readFilesAtRef({ ref: values.base, repoDir: values['repo-dir'] }),
  });
  const head = flattenTokens({
    files: await readFilesInDir({ dir: resolve(values.dir) }),
  });
  const summary = formatSummary({ base, head });

  // --out keeps the exact summary for the PR body, so it isn't retyped
  if (values.out) {
    await writeFile(resolve(values.out), `${summary}\n`);
  }
  process.stdout.write(`${summary}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
