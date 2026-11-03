import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildState,
  buildTokenFiles,
  checkExport,
  decodeEntities,
  mergeParts,
  toDtcgColor,
  toFileName,
  verifyPart,
} from './figma-to-dtcg.js';
import { fnv1a } from './hash.js';
import { FORMAT_VERSION, fingerprintCollection } from './sync-plan.js';

/** @param {object} payload */
const part = (payload) => ({ hash: fnv1a(JSON.stringify(payload)), payload });

const primitives = {
  collection: { id: 'C:1', name: 'Portfolio Primitives', modes: ['Mode 1'] },
  total: 7,
  offset: 0,
  variables: [
    {
      id: 'V:1',
      name: 'dy/color/rhubarb/600',
      type: 'COLOR',
      description: 'Raw palette value #BB2443.',
      scopes: [],
      values: { 'Mode 1': '#bb2443' },
    },
    {
      id: 'V:2',
      name: 'dy/spacing/200',
      type: 'FLOAT',
      description: '',
      scopes: [],
      values: { 'Mode 1': 16 },
    },
    {
      id: 'V:3',
      name: 'dy/motion/duration/fast',
      type: 'FLOAT',
      description: '',
      scopes: [],
      values: { 'Mode 1': 150 },
    },
    {
      id: 'V:4',
      name: 'dy/motion/easing/standard',
      type: 'STRING',
      description: '',
      scopes: [],
      values: { 'Mode 1': 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
    {
      id: 'V:5',
      name: 'dy/font/weight/semi-bold',
      type: 'STRING',
      description: '',
      scopes: [],
      values: { 'Mode 1': 'Semi Bold' },
    },
    {
      id: 'V:6',
      name: 'dy/font/family/default',
      type: 'STRING',
      description: '',
      scopes: [],
      values: { 'Mode 1': 'Inclusive Sans' },
    },
    {
      id: 'V:7',
      name: 'dy/font/line-height/150',
      type: 'FLOAT',
      description: '',
      scopes: [],
      values: { 'Mode 1': 1.5 },
    },
  ],
};

const color = {
  collection: { id: 'C:2', name: 'Portfolio Color', modes: ['Light'] },
  total: 1,
  offset: 0,
  variables: [
    {
      id: 'V:10',
      name: 'dy/color/surface/action/primary/default',
      type: 'COLOR',
      description: 'Primary action background.',
      scopes: ['FRAME_FILL'],
      values: { Light: { alias: 'V:1' } },
    },
  ],
};

describe('verifyPart', () => {
  it('accepts an unchanged export', () => {
    assert.doesNotThrow(() =>
      verifyPart({ part: part(primitives), source: 'primitives.json' }),
    );
  });

  it('rejects an export altered after it left Figma', () => {
    const altered = part(primitives);
    altered.payload = { ...altered.payload, total: 99 };
    assert.throws(
      () => verifyPart({ part: altered, source: 'primitives.json' }),
      /altered after leaving Figma/,
    );
  });
});

describe('mergeParts', () => {
  it('combines parts of one collection', () => {
    const first = {
      ...primitives,
      variables: primitives.variables.slice(0, 3),
    };
    const second = {
      ...primitives,
      offset: 3,
      variables: primitives.variables.slice(3),
    };
    const [merged] = mergeParts({ parts: [part(first), part(second)] });
    assert.equal(merged?.variables.length, 7);
  });

  it('merges slices in offset order, whatever order their files sort in', () => {
    const first = {
      ...primitives,
      variables: primitives.variables.slice(0, 3),
    };
    const second = {
      ...primitives,
      offset: 3,
      variables: primitives.variables.slice(3),
    };
    const [merged] = mergeParts({ parts: [part(second), part(first)] });
    assert.deepEqual(
      merged?.variables.map(({ id }) => id),
      primitives.variables.map(({ id }) => id),
    );
  });

  it('rejects a collection with missing variables', () => {
    const incomplete = {
      ...primitives,
      variables: primitives.variables.slice(0, 2),
    };
    assert.throws(
      () => mergeParts({ parts: [part(incomplete)] }),
      /expected 7/,
    );
  });
});

describe('toFileName', () => {
  it('omits placeholder mode names', () => {
    assert.equal(
      toFileName({
        collectionName: 'Portfolio Primitives',
        modeName: 'Mode 1',
        modeCount: 1,
      }),
      'primitives.json',
    );
  });

  it('keeps meaningful mode names', () => {
    assert.equal(
      toFileName({
        collectionName: 'Portfolio Theme',
        modeName: 'Rhubarb',
        modeCount: 1,
      }),
      'theme.rhubarb.json',
    );
  });
});

describe('toDtcgColor', () => {
  it('writes a DTCG sRGB color object', () => {
    assert.deepEqual(toDtcgColor({ hex: '#bb2443' }), {
      colorSpace: 'srgb',
      components: [0.7333, 0.1412, 0.2627],
      hex: '#bb2443',
    });
  });

  it('keeps alpha only when it is below 1', () => {
    assert.equal(toDtcgColor({ hex: '#00000080' }).alpha, 0.502);
    assert.equal('alpha' in toDtcgColor({ hex: '#000000ff' }), false);
  });
});

describe('buildTokenFiles', () => {
  const files = buildTokenFiles({ collections: [primitives, color] });
  const byName = Object.fromEntries(
    files.map(({ fileName, tokens }) => [fileName, tokens]),
  );
  /** @param {{ fileName: string, path: string }} options */
  const tokenAt = ({ fileName, path }) =>
    path.split('.').reduce((node, key) => node?.[key], byName[fileName]);

  it('writes one file per collection and mode', () => {
    assert.deepEqual(Object.keys(byName).sort(), [
      'color.light.json',
      'primitives.json',
    ]);
  });

  it('converts each Figma value to its DTCG type', () => {
    const fileName = 'primitives.json';
    assert.deepEqual(tokenAt({ fileName, path: 'dy.spacing.200.$value' }), {
      value: 16,
      unit: 'px',
    });
    assert.deepEqual(
      tokenAt({ fileName, path: 'dy.motion.duration.fast.$value' }),
      { value: 150, unit: 'ms' },
    );
    assert.deepEqual(
      tokenAt({ fileName, path: 'dy.motion.easing.standard.$value' }),
      [0.4, 0, 0.2, 1],
    );
    assert.equal(
      tokenAt({ fileName, path: 'dy.font.weight.semi-bold.$value' }),
      600,
    );
    assert.equal(
      tokenAt({ fileName, path: 'dy.font.family.default.$type' }),
      'fontFamily',
    );
    assert.deepEqual(tokenAt({ fileName, path: 'dy.font.line-height.150' }), {
      $type: 'number',
      $value: 1.5,
      $extensions: { 'com.figma': { scopes: [], variableId: 'V:7' } },
    });
  });

  it('keeps references as DTCG aliases with the target type', () => {
    const fileName = 'color.light.json';
    const path = 'dy.color.surface.action.primary.default';
    assert.equal(
      tokenAt({ fileName, path: `${path}.$value` }),
      '{dy.color.rhubarb.600}',
    );
    assert.equal(tokenAt({ fileName, path: `${path}.$type` }), 'color');
    assert.deepEqual(tokenAt({ fileName, path: `${path}.$extensions` }), {
      'com.figma': { scopes: ['FRAME_FILL'], variableId: 'V:10' },
    });
  });

  it('rejects a variable type it has no mapping for', () => {
    const unknown = {
      ...primitives,
      total: 1,
      variables: [
        {
          id: 'V:99',
          name: 'dy/flags/enabled',
          type: 'BOOLEAN',
          description: '',
          scopes: [],
          values: { 'Mode 1': true },
        },
      ],
    };
    assert.throws(
      () => buildTokenFiles({ collections: [unknown] }),
      /no DTCG type mapping/,
    );
  });

  it('rejects a reference to a variable outside the export', () => {
    assert.throws(
      () => buildTokenFiles({ collections: [color] }),
      /isn't in this export/,
    );
  });

  it('rejects the same path in two collections', () => {
    const duplicate = {
      ...color,
      collection: { ...color.collection, id: 'C:3', name: 'Portfolio Other' },
      variables: [
        { ...primitives.variables[1], id: 'V:20', values: { Light: 16 } },
      ],
    };
    assert.throws(
      () => buildTokenFiles({ collections: [primitives, duplicate] }),
      /exists in both/,
    );
  });
});

describe('buildTokenFiles with reused files', () => {
  const [primitivesFile] = buildTokenFiles({ collections: [primitives] });
  const reusedFiles = [
    {
      collectionName: 'Portfolio Primitives',
      fileName: 'primitives.json',
      tokens: /** @type {Record<string, unknown>} */ (primitivesFile?.tokens),
    },
  ];
  const files = buildTokenFiles({ collections: [color], reusedFiles });
  const byName = Object.fromEntries(
    files.map(({ fileName, tokens }) => [fileName, tokens]),
  );

  it('returns reused files unchanged', () => {
    assert.deepEqual(byName['primitives.json'], primitivesFile?.tokens);
  });

  it('resolves references into a reused file by Figma variable ID', () => {
    const token =
      byName['color.light.json']?.dy.color.surface.action.primary.default;
    assert.equal(token?.$value, '{dy.color.rhubarb.600}');
    assert.equal(token?.$type, 'color');
  });

  it('rejects a path that a reused file already defines', () => {
    const duplicate = {
      ...color,
      variables: [
        { ...primitives.variables[1], id: 'V:20', values: { Light: 16 } },
      ],
    };
    assert.throws(
      () => buildTokenFiles({ collections: [duplicate], reusedFiles }),
      /exists in both/,
    );
  });
});

describe('hidden collections', () => {
  it('drop variable descriptions', () => {
    const [file] = buildTokenFiles({ collections: [primitives] });
    const token = file?.tokens.dy.color.rhubarb[600];
    assert.equal(token && '$description' in token, false);
  });

  it('keep descriptions in shipped collections', () => {
    const files = buildTokenFiles({ collections: [primitives, color] });
    const colorFile = files.find(
      ({ fileName }) => fileName === 'color.light.json',
    );
    assert.equal(
      colorFile?.tokens.dy.color.surface.action.primary.default.$description,
      'Primary action background.',
    );
  });
});

describe('checkExport', () => {
  /** @param {{ payload: typeof primitives, fingerprint?: string }} options */
  const listed = ({ payload, fingerprint }) => ({
    ...payload.collection,
    total: payload.total,
    fingerprint: fingerprint ?? fingerprintCollection({ payload }),
  });
  const state = {
    formatVersion: FORMAT_VERSION,
    collections: {
      'C:1': {
        name: 'Portfolio Primitives',
        fingerprint: fingerprintCollection({ payload: primitives }),
        files: ['primitives.json'],
      },
    },
  };

  it('returns unchanged collections to reuse', () => {
    const reused = checkExport({
      listed: [listed({ payload: primitives }), listed({ payload: color })],
      state,
      collections: [color],
    });
    assert.deepEqual(
      reused.map(({ id }) => id),
      ['C:1'],
    );
  });

  it('rejects an export that does not match its listed fingerprint', () => {
    assert.throws(
      () =>
        checkExport({
          listed: [listed({ payload: color, fingerprint: '00000000' })],
          state,
          collections: [color],
        }),
      /doesn't match the fingerprint/,
    );
  });

  it('rejects a changed collection that was not exported', () => {
    assert.throws(
      () =>
        checkExport({
          listed: [listed({ payload: primitives }), listed({ payload: color })],
          state,
          collections: [],
        }),
      /not exported: Portfolio Color/,
    );
  });

  it('records each collection with its fingerprint and files', () => {
    const listing = [
      listed({ payload: primitives }),
      listed({ payload: color }),
    ];
    const reused = checkExport({
      listed: listing,
      state,
      collections: [color],
    });
    const next = buildState({
      listed: listing,
      collections: [color],
      reused,
      state,
    });
    assert.equal(next.formatVersion, FORMAT_VERSION);
    assert.deepEqual(next.collections['C:1']?.files, ['primitives.json']);
    assert.deepEqual(next.collections['C:2']?.files, ['color.light.json']);
    assert.equal(
      next.collections['C:2']?.fingerprint,
      fingerprintCollection({ payload: color }),
    );
  });
});

describe('decodeEntities', () => {
  it('decodes the escaping Figma applies to descriptions', () => {
    assert.equal(
      decodeEntities({
        text: 'intent=&quot;positive&quot; &amp; it&#39;s &lt;b&gt;',
      }),
      'intent="positive" & it\'s <b>',
    );
  });

  it('decodes one level only, so &amp;quot; becomes &quot;', () => {
    assert.equal(
      decodeEntities({ text: 'a &amp;quot;b&amp;quot;' }),
      'a &quot;b&quot;',
    );
  });
});
