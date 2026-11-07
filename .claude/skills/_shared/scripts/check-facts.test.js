import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fnv1a } from './hash.js';
import { checkFacts, toManifestName } from './check-facts.js';

const manifest = { tokens: { 'dy-space-xs': {}, 'dy-color-text-default': {} } };

function buildFacts(overrides = {}) {
  const payload = {
    properties: {
      size: { type: 'VARIANT', variantOptions: ['s', 'm'] },
    },
    axes: ['size'],
    variantCount: 2,
    coverage: { walked: 3, summarized: 2, hidden: 1, insideHidden: 0 },
    summarized: [
      {
        path: 'root',
        facts: [
          { field: 'layoutMode', value: 'raw:HORIZONTAL' },
          { field: 'fill', value: 'none' },
          { field: 'letterSpacing', value: 'raw:{"unit":"PERCENT","value":0}' },
          {
            field: 'paddingTop',
            dependsOn: ['size'],
            values: { s: 'token:dy/space/xs', m: 'token:dy/space/xs' },
          },
        ],
      },
    ],
    hidden: [],
    ...overrides,
  };
  return { hash: fnv1a(JSON.stringify(payload)), payload };
}

describe('toManifestName', () => {
  it('maps Figma variable names to manifest names', () => {
    assert.equal(toManifestName('dy/space/xs'), 'dy-space-xs');
  });
});

describe('checkFacts', () => {
  it('passes clean facts with no questions', () => {
    assert.deepEqual(checkFacts({ facts: buildFacts(), manifest }), {
      errors: [],
      questions: [],
    });
  });

  it('rejects facts changed after leaving Figma', () => {
    const facts = buildFacts();
    facts.payload.variantCount = 2.5;
    const { errors } = checkFacts({ facts, manifest });
    assert.match(errors[0], /altered after leaving Figma/);
  });

  it('rejects a missing variant', () => {
    const { errors } = checkFacts({
      facts: buildFacts({ variantCount: 1 }),
      manifest,
    });
    assert.match(errors[0], /Expected 2 variants/);
  });

  it('rejects layers that were not accounted for', () => {
    const { errors } = checkFacts({
      facts: buildFacts({
        coverage: { walked: 4, summarized: 2, hidden: 1, insideHidden: 0 },
      }),
      manifest,
    });
    assert.match(errors[0], /Coverage gap/);
  });

  it('rejects a fabricated token, including one state of a fact', () => {
    const { errors } = checkFacts({
      facts: buildFacts({
        summarized: [
          {
            path: 'root',
            facts: [
              {
                field: 'fill',
                dependsOn: ['size'],
                values: {
                  s: 'token:dy/color/text/default',
                  m: 'token:dy/fake',
                },
              },
            ],
          },
        ],
      }),
      manifest,
    });
    assert.deepEqual(errors, [
      "root fill (m): token dy/fake doesn't exist in @dy/tokens.",
    ]);
  });

  it('rejects a library token that has no dy equivalent', () => {
    const { errors } = checkFacts({
      facts: buildFacts({
        summarized: [
          {
            path: 'root',
            facts: [{ field: 'paddingTop', value: 'token:spacing/100' }],
          },
        ],
      }),
      manifest,
    });
    assert.match(errors[0], /spacing\/100/);
  });

  it('checks every paint when a layer has several', () => {
    const { errors, questions } = checkFacts({
      facts: buildFacts({
        summarized: [
          {
            path: 'root',
            facts: [
              {
                field: 'fill',
                value: 'token:dy/color/text/default + raw:#ff0000',
              },
            ],
          },
        ],
      }),
      manifest,
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(questions, ['root fill has no token: raw:#ff0000']);
  });

  it('asks about values with no token instead of accepting them', () => {
    const { errors, questions } = checkFacts({
      facts: buildFacts({
        summarized: [
          { path: 'root/ring', facts: [{ field: 'x', value: 'raw:-4' }] },
        ],
      }),
      manifest,
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(questions, ['root/ring x has no token: raw:-4']);
  });

  it('asks whether hidden layers are in scope', () => {
    const { questions } = checkFacts({
      facts: buildFacts({
        hidden: [
          { path: 'root/0:Icon', references: { visible: 'iconLeading#1:1' } },
        ],
      }),
      manifest,
    });
    assert.deepEqual(questions, [
      'Hidden layer root/0:Icon (iconLeading#1:1): in scope or deferred?',
    ]);
  });
});
