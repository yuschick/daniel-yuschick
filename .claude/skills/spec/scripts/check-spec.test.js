import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fnv1a } from '../../../../packages/tokens/scripts/hash.js';
import { checkSpec, parseSpec, renderTokenRows } from './check-spec.js';

const payload = {
  properties: {
    'label#1:1': { type: 'TEXT', defaultValue: 'Go' },
    size: { type: 'VARIANT', defaultValue: 'm', variantOptions: ['m', 'l'] },
    state: {
      type: 'VARIANT',
      defaultValue: 'default',
      variantOptions: ['default'],
    },
  },
  axes: ['size', 'state'],
  variantCount: 2,
  coverage: { walked: 2, summarized: 2, hidden: 0, insideHidden: 0 },
  summarized: [
    {
      path: 'root',
      facts: [
        { field: 'fill', value: 'token:dy/color/a' },
        {
          field: 'height',
          dependsOn: ['size'],
          values: { m: 'token:dy/size/m', l: 'token:dy/size/l' },
        },
        { field: 'x', value: 'raw:-4' },
      ],
    },
  ],
  hidden: [],
};
const facts = { hash: fnv1a(JSON.stringify(payload)), payload };
const manifest = {
  tokens: {
    'dy-color-a': {},
    'dy-size-m': {},
    'dy-size-l': {},
    'dy-motion-fast': {},
  },
};
const ruleIds = new Set(['A11Y-05', 'CSS-03']);

function specMarkdown({
  status,
  hash = facts.hash,
  apiRows = '| size | Size | m, l | m | size | figma |\n| children | ReactNode | - | - | label | figma |',
  tokenRows = '| root | fill | all | `--dy-color-a` | figma |\n| root | height | m | `--dy-size-m` | figma |\n| root | height | l | `--dy-size-l` | figma |',
  additionalRows = '| `--dy-motion-fast` | Hover | D1 |',
  behaviorRows = '| Stays focusable when disabled | A11Y-05 |',
  outRows = '| state as a prop | state | D1 |',
  decisionRows = '| D1 | Offset is a token | root x | Daniel |',
  open = 'None.',
} = {}) {
  return `---
${status ? `status: ${status}\n` : ''}factsHash: ${hash}
---

## Purpose

Text.

## Anatomy

Text.

## API

| Prop | Type | Values | Default | Figma | Source |
| :-- | :-- | :-- | :-- | :-- | :-- |
${apiRows}

## Figma tokens

| Layer | Property | When | Token | Source |
| :-- | :-- | :-- | :-- | :-- |
${tokenRows}

## Additional tokens

| Token | Use | Source |
| :-- | :-- | :-- |
${additionalRows}

## Behavior and accessibility

| Requirement | Source |
| :-- | :-- |
${behaviorRows}

## Out of scope

| Item | Figma | Source |
| :-- | :-- | :-- |
${outRows}

## Decisions

| ID | Decision | Resolves | Source |
| :-- | :-- | :-- | :-- |
${decisionRows}

## Open questions

${open}
`;
}

const run = (options, { isReady = false } = {}) => {
  const markdown = specMarkdown(options);
  return checkSpec({
    spec: parseSpec(markdown),
    facts,
    manifest,
    ruleIds,
    markdown,
    isReady,
  });
};

describe('renderTokenRows', () => {
  it('lists only tokens, grouped by value', () => {
    assert.deepEqual(renderTokenRows(payload), [
      ['root', 'fill', 'all', '--dy-color-a', 'figma'],
      ['root', 'height', 'm', '--dy-size-m', 'figma'],
      ['root', 'height', 'l', '--dy-size-l', 'figma'],
    ]);
  });
});

describe('parseSpec', () => {
  it('keeps escaped pipes inside a table cell', () => {
    const { sections } = parseSpec(
      '## API\n\n| Type | Default |\n| `a \\| b` | a |\n',
    );
    assert.deepEqual(sections.get('API').rows[1], ['a \\| b', 'a']);
  });
});

describe('checkSpec', () => {
  it('passes a spec where every row has a source', () => {
    assert.deepEqual(run(), []);
  });

  it('rejects an invented prop with no source', () => {
    const errors = run({
      apiRows:
        '| size | Size | m, l | m | size | figma |\n| children | ReactNode | - | - | label | figma |\n| isLoud | boolean | - | false | - | |',
    });
    assert.ok(errors.includes('API: "isLoud" has no source.'));
  });

  it('rejects a prop that cites a Figma property that does not exist', () => {
    const errors = run({
      apiRows:
        '| size | Size | m, l | m | size | figma |\n| children | ReactNode | - | - | label | figma |\n| tone | Tone | a | a | tone | figma |',
    });
    assert.match(errors.join(), /cites Figma property "tone"/);
  });

  it('rejects a source that names a rule that does not exist', () => {
    const errors = run({ behaviorRows: '| Made up | A11Y-99 |' });
    assert.match(errors.join(), /unknown rule A11Y-99/);
  });

  it('rejects a source that names a decision that does not exist', () => {
    const errors = run({ behaviorRows: '| Made up | D9 |' });
    assert.match(errors.join(), /unknown decision D9/);
  });

  it('only accepts Daniel as a source in the decisions table', () => {
    const errors = run({ behaviorRows: '| Made up | Daniel |' });
    assert.match(errors.join(), /invalid source "Daniel"/);
  });

  it('rejects values and defaults that differ from Figma', () => {
    const errors = run({
      apiRows:
        '| size | Size | s, m, l | l | size | figma |\n| children | ReactNode | - | - | label | figma |',
    });
    assert.match(errors.join(), /don't match Figma/);
    assert.match(errors.join(), /default l doesn't match/);
  });

  it('rejects a Figma property nobody accounted for', () => {
    const errors = run({ outRows: '| Other | - | D1 |' });
    assert.match(errors.join(), /"state" is in neither/);
  });

  it('rejects a dropped or invented token row', () => {
    const errors = run({
      tokenRows:
        '| root | fill | all | `--dy-color-a` | figma |\n| root | height | m | `--dy-size-l` | figma |',
    });
    assert.match(errors.join(), /missing "root \| height \| m/);
    assert.match(
      errors.join(),
      /"root \| height \| m \| --dy-size-l \| figma" isn't in the facts/,
    );
  });

  it('rejects a token that does not exist anywhere in the spec', () => {
    const errors = run({ additionalRows: '| `--dy-fake` | Hover | D1 |' });
    assert.ok(errors.includes("Token --dy-fake doesn't exist in @dy/tokens."));
  });

  it('rejects an additional token that claims Figma as its source', () => {
    const errors = run({
      additionalRows: '| `--dy-motion-fast` | Hover | figma |',
    });
    assert.match(errors.join(), /can't cite figma/);
  });

  it('rejects a raw Figma value with no decision', () => {
    const errors = run({
      decisionRows: '| D1 | Something else | - | Daniel |',
    });
    assert.match(errors.join(), /No decision resolves the fact: root x/);
  });

  it('rejects stale facts', () => {
    assert.match(run({ hash: 'deadbeef' }).join(), /factsHash deadbeef/);
  });

  it('allows open questions while drafting but not once ready', () => {
    assert.deepEqual(run({ open: '- What about x?' }), []);
    assert.match(
      run({ open: '- What about x?' }, { isReady: true }).join(),
      /ready for review/,
    );
    assert.deepEqual(run({}, { isReady: true }), []);
  });

  it('rejects a status field, because approval is being on main', () => {
    for (const status of ['draft', 'approved']) {
      assert.match(run({ status }).join(), /Remove status/);
    }
  });
});
