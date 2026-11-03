import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { fnv1a } from './hash.js';

/**
 * Bump when the converter's output changes for the same Figma input, so the
 * next sync re-exports every collection instead of reusing stale files.
 */
export const FORMAT_VERSION = 1;

export const NOTHING_CHANGED = 'No collections changed since the last sync.';

/**
 * @typedef {import('./figma-to-dtcg.js').ExportPayload} ExportPayload
 * @typedef {{ id: string, name: string, modes: string[], total: number, fingerprint: string }} ListedCollection
 * @typedef {{ name: string, fingerprint: string, files: string[] }} SyncedCollection
 * @typedef {{ formatVersion: number, collections: Record<string, SyncedCollection> }} SyncState
 */

/**
 * Hashes a whole collection, variables sorted by ID so reordering them in
 * Figma doesn't count as a change. The Figma export script
 * (`.claude/skills/sync-tokens/scripts/export-variables.js`) contains an
 * identical copy; the converter compares the two for every exported
 * collection, so a difference stops the sync rather than passing silently.
 *
 * @param {{ payload: Pick<ExportPayload, 'collection' | 'total' | 'variables'> }} options
 * @returns {string}
 */
export function fingerprintCollection({ payload }) {
  const { collection, total, variables } = payload;
  const sorted = [...variables].sort((first, second) =>
    first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
  );

  return fnv1a(JSON.stringify({ collection, total, variables: sorted }));
}

/**
 * Splits Figma's collections into those that must be exported and those whose
 * committed token files can be reused.
 *
 * @param {{ listed: ListedCollection[], state: SyncState | undefined }} options
 * @returns {{ changed: ListedCollection[], unchanged: ListedCollection[] }}
 */
export function planSync({ listed, state }) {
  const isCurrent = state?.formatVersion === FORMAT_VERSION;
  const changed = [];
  const unchanged = [];

  for (const collection of listed) {
    const synced = isCurrent ? state.collections[collection.id] : undefined;

    if (synced?.fingerprint === collection.fingerprint) {
      unchanged.push(collection);
    } else {
      changed.push(collection);
    }
  }

  return { changed, unchanged };
}

/**
 * @param {{ total: number, limit: number }} options
 * @returns {number[]} The offset of each slice needed to export a collection
 */
export function sliceOffsets({ total, limit }) {
  return Array.from(
    { length: Math.max(1, Math.ceil(total / limit)) },
    (_unused, index) => index * limit,
  );
}

/**
 * Reads the record of the last sync, or `undefined` before the first one.
 *
 * @param {{ path: string }} options
 * @returns {Promise<SyncState | undefined>}
 */
export async function readState({ path }) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Reads the collection listing saved from Figma and verifies its hash.
 *
 * @param {{ path: string }} options
 * @returns {Promise<ListedCollection[]>}
 */
export async function readListing({ path }) {
  /** @type {{ hash: string, payload: { collections: ListedCollection[] } }} */
  const listing = JSON.parse(await readFile(path, 'utf8'));
  const actual = fnv1a(JSON.stringify(listing.payload));

  if (actual !== listing.hash) {
    throw new Error(
      `${path}: listing was altered after leaving Figma (hash ${listing.hash}, file hashes to ${actual}). List the collections again.`,
    );
  }
  return listing.payload.collections;
}

async function main() {
  const { values } = parseArgs({
    options: {
      collections: { type: 'string' },
      state: { type: 'string', default: 'packages/tokens/figma-sync.json' },
      limit: { type: 'string', default: '60' },
    },
  });

  if (!values.collections) {
    throw new Error(
      'Usage: node sync-plan.js --collections <listing.json> [--state packages/tokens/figma-sync.json] [--limit 60]',
    );
  }

  const listed = await readListing({ path: resolve(values.collections) });
  const state = await readState({ path: resolve(values.state) });
  const { changed, unchanged } = planSync({ listed, state });

  if (changed.length === 0) {
    process.stdout.write(`${NOTHING_CHANGED}\n`);
    return;
  }

  const limit = Number(values.limit);
  const lines = [
    `Export ${String(changed.length)} of ${String(listed.length)} collections:`,
    ...changed.map(
      ({ id, name, total }) =>
        `- ${name} (${id}): offsets ${sliceOffsets({ total, limit }).join(', ')}`,
    ),
  ];
  if (unchanged.length > 0) {
    lines.push(
      `Unchanged, reused from the last sync: ${unchanged.map(({ name }) => name).join(', ')}`,
    );
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
