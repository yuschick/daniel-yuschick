import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { fnv1a } from './hash.js';
import {
  FORMAT_VERSION,
  fingerprintCollection,
  planSync,
  readListing,
  readState,
  sliceOffsets,
} from './sync-plan.js';

const payload = {
  collection: { id: 'C:1', name: 'Portfolio Space', modes: ['Default'] },
  total: 2,
  variables: [
    {
      id: 'V:2',
      name: 'dy/space/s',
      type: 'FLOAT',
      description: '',
      scopes: ['GAP'],
      values: { Default: 8 },
    },
    {
      id: 'V:1',
      name: 'dy/space/xs',
      type: 'FLOAT',
      description: '',
      scopes: ['GAP'],
      values: { Default: 4 },
    },
  ],
};

/** @param {{ id: string, fingerprint: string }} options */
const listedCollection = ({ id, fingerprint }) => ({
  id,
  name: `Collection ${id}`,
  modes: ['Default'],
  total: 1,
  fingerprint,
});

/**
 * Returns the sort-and-hash core of a fingerprint function, without
 * whitespace, so the two copies can be compared.
 *
 * @param {{ source: string }} options
 */
const fingerprintCore = ({ source }) => {
  const start = source.indexOf('const sorted =');
  const end = source.indexOf('variables: sorted }));', start);
  return source.slice(start, end).replace(/\s+/g, '');
};

describe('fingerprintCollection', () => {
  it('is identical to the copy in the Figma export script', async () => {
    const packageSource = await readFile(
      new URL('./sync-plan.js', import.meta.url),
      'utf8',
    );
    const skillSource = await readFile(
      new URL(
        '../../../.claude/skills/sync-tokens/scripts/export-variables.js',
        import.meta.url,
      ),
      'utf8',
    );
    const packageCore = fingerprintCore({ source: packageSource });
    assert.ok(packageCore.includes('.sort('), 'fingerprint not found');
    assert.equal(fingerprintCore({ source: skillSource }), packageCore);
  });

  it('ignores the order Figma lists variables in', () => {
    const reordered = {
      ...payload,
      variables: [...payload.variables].reverse(),
    };
    assert.equal(
      fingerprintCollection({ payload }),
      fingerprintCollection({ payload: reordered }),
    );
  });

  it('changes when a value changes', () => {
    const [first, second] = payload.variables;
    const changed = {
      ...payload,
      variables: [first, { ...second, values: { Default: 6 } }],
    };
    assert.notEqual(
      fingerprintCollection({ payload }),
      fingerprintCollection({ payload: changed }),
    );
  });
});

describe('planSync', () => {
  const listed = [
    listedCollection({ id: 'C:1', fingerprint: 'aaaaaaaa' }),
    listedCollection({ id: 'C:2', fingerprint: 'bbbbbbbb' }),
  ];
  const state = {
    formatVersion: FORMAT_VERSION,
    collections: {
      'C:1': { name: 'Collection C:1', fingerprint: 'aaaaaaaa', files: [] },
      'C:2': { name: 'Collection C:2', fingerprint: 'cccccccc', files: [] },
    },
  };

  it('exports only collections whose fingerprint changed', () => {
    const { changed, unchanged } = planSync({ listed, state });
    assert.deepEqual(
      changed.map(({ id }) => id),
      ['C:2'],
    );
    assert.deepEqual(
      unchanged.map(({ id }) => id),
      ['C:1'],
    );
  });

  it('exports everything before the first sync', () => {
    assert.equal(planSync({ listed, state: undefined }).changed.length, 2);
  });

  it('exports everything after the format version changes', () => {
    const stale = { ...state, formatVersion: FORMAT_VERSION - 1 };
    assert.equal(planSync({ listed, state: stale }).changed.length, 2);
  });
});

describe('sliceOffsets', () => {
  it('covers every variable with slices of the given size', () => {
    assert.deepEqual(sliceOffsets({ total: 116, limit: 60 }), [0, 60]);
    assert.deepEqual(sliceOffsets({ total: 60, limit: 60 }), [0]);
    assert.deepEqual(sliceOffsets({ total: 0, limit: 60 }), [0]);
  });
});

describe('readListing', () => {
  it('rejects a listing altered after it left Figma', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sync-plan-'));
    const path = join(dir, 'collections.json');
    const listingPayload = {
      collections: [listedCollection({ id: 'C:1', fingerprint: 'aaaaaaaa' })],
    };
    const hash = fnv1a(JSON.stringify(listingPayload));

    await writeFile(path, JSON.stringify({ hash, payload: listingPayload }));
    assert.equal((await readListing({ path })).length, 1);

    listingPayload.collections[0].total = 99;
    await writeFile(path, JSON.stringify({ hash, payload: listingPayload }));
    await assert.rejects(readListing({ path }), /altered after leaving Figma/);
  });
});

describe('readState', () => {
  it('returns undefined before the first sync', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sync-plan-'));
    assert.equal(
      await readState({ path: join(dir, 'figma-sync.json') }),
      undefined,
    );
  });
});
