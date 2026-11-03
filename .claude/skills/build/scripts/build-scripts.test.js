import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import { buildLedger } from './build-ledger.js';
import {
  checkApi,
  checkScope,
  checkStructure,
  checkTokens,
  expectedTokens,
} from './check-component.js';
import { checkReport, findRepeats, parseReport } from './check-review.js';
import { checkPreflight } from './preflight.js';
import { runGates } from './run-gates.js';

const SPEC = `---
component: Chip
---

## Purpose

A chip. It shows a label.

## Anatomy

A \`<span>\`.

## API

| Prop | Type | Values | Default | Figma | Source |
| :-- | :-- | :-- | :-- | :-- | :-- |
| size | \`Size\` | s, m | m | size | figma |
| isDisabled | \`boolean\` | - | - | - | PROP-05 |
| ...htmlAttributes | attrs | - | - | - | TS-01 |

## Figma tokens

| Layer | Property | When | Token | Source |
| :-- | :-- | :-- | :-- | :-- |
| root | fill | all | \`--dy-color-a\` | figma |
| root | stroke | all | \`none\` | figma |
| root | itemSpacing | all | \`--dy-space-gap\` | figma |

## Additional tokens

| Token | Use | Source |
| :-- | :-- | :-- |
| \`--dy-motion-fast\` | Transitions | D1 |

## Behavior and accessibility

| Requirement | Source |
| :-- | :-- |
| Native span | A11Y-03 |

## Out of scope

| Item | Figma | Source |
| :-- | :-- | :-- |
| \`itemSpacing\`, until icons | - | D1 |

## Decisions

| ID | Decision | Resolves | Source |
| :-- | :-- | :-- | :-- |
| D1 | No icons. | - | Daniel |

## Open questions

None.
`;
const spec = parseSpec(SPEC);

describe('preflight', () => {
  const clean = {
    branch: 'build/chip',
    trackedChanges: '',
    spec: { local: SPEC, approved: SPEC },
    facts: { local: '{}', approved: '{}' },
  };

  it('passes an approved spec on a clean branch, whatever its status says', () => {
    assert.deepEqual(checkPreflight(clean), []);
  });

  it('rejects a spec that is missing from main or differs from it', () => {
    const missing = checkPreflight({
      ...clean,
      spec: { local: SPEC, approved: null },
    });
    assert.match(missing[0], /isn't approved/);
    const edited = checkPreflight({
      ...clean,
      facts: { local: '{"a":1}', approved: '{}' },
    });
    assert.match(edited[0], /differs/);
  });

  it('rejects main, tracked changes and open questions', () => {
    assert.match(checkPreflight({ ...clean, branch: 'main' })[0], /branch/);
    assert.match(
      checkPreflight({ ...clean, trackedChanges: ' M a.ts' })[0],
      /tracked/,
    );
    const open = SPEC.replace('None.', 'Which color?');
    const errors = checkPreflight({
      ...clean,
      spec: { local: open, approved: open },
    });
    assert.match(errors[0], /open questions/);
  });
});

describe('component checks', () => {
  it('leaves out-of-scope rows and "none" out of the expected tokens', () => {
    assert.deepEqual(
      [...expectedTokens(spec)],
      ['--dy-color-a', '--dy-motion-fast'],
    );
  });

  it('fails on a missing token and on an invented one', () => {
    const errors = checkTokens({
      expected: new Set(['--dy-color-a']),
      css: '.a { color: var(--dy-color-b); }',
    });
    assert.equal(errors.length, 2);
  });

  it('requires FS-04 files, a private hook and a Conformance story', () => {
    const errors = checkStructure({
      name: 'Chip',
      files: ['Chip.tsx', 'Chip.test.tsx', 'useChip.ts'],
      indexSource:
        "export { useChip } from './useChip';\nexport * from './Chip';",
      specText: 'internal, not exported from `index.ts`',
      storySource: '',
    });
    const joined = errors.join('\n');
    assert.match(joined, /Chip\.types\.ts is missing/);
    assert.match(joined, /Chip\.test\.tsx must be a Storybook test/);
    assert.match(joined, /useChip\.test\.ts is missing/);
    assert.match(joined, /useChip must not be exported/);
    assert.match(joined, /explicit named exports/);
    assert.match(joined, /Conformance/);
  });

  it('requires every API prop and its default in the signature', () => {
    assert.deepEqual(
      checkApi({ sections: spec.sections, source: "size = 'm', isDisabled" }),
      [],
    );
    const errors = checkApi({ sections: spec.sections, source: 'size' });
    assert.equal(errors.length, 2);
  });

  it('rejects spec edits and files outside the component', () => {
    const options = {
      componentDirectory: 'packages/react/src/components/Chip',
      spec: 'specs/chip.md',
      facts: 'specs/chip.facts.json',
    };
    assert.deepEqual(
      checkScope({
        ...options,
        changedFiles: [
          'packages/react/src/components/Chip/Chip.tsx',
          'packages/react/src/types/common.ts',
          'packages/react/src/index.ts',
        ],
      }),
      [],
    );
    assert.equal(
      checkScope({
        ...options,
        changedFiles: ['specs/chip.md', 'apps/web/page.tsx'],
      }).length,
      2,
    );
  });
});

describe('ledger', () => {
  it('numbers every requirement, skipping nothing', () => {
    const ids = buildLedger(spec).map(({ id }) => id);
    assert.deepEqual(ids, [
      'P1',
      'P2',
      'AN1',
      'A1',
      'A2',
      'A3',
      'T1',
      'X1',
      'B1',
      'O1',
      'D1',
    ]);
  });
});

describe('review report', () => {
  const ledgerIds = ['B1', 'O1'];
  const report = (rows, verdict = 'PASS', extra = '') =>
    parseReport(
      `REVIEWED: abc\n\n| ID | Verdict | Evidence |\n${rows}\n${extra}\nVERDICT: ${verdict}\n`,
    );

  it('accepts a complete report with evidence', () => {
    const passing = report(
      '| B1 | PASS | a/Chip.tsx:4 |\n| O1 | PASS | absent: iconStart in Chip.tsx |',
    );
    assert.deepEqual(
      checkReport({ report: passing, ledgerIds, hash: 'abc' }),
      [],
    );
  });

  it('rejects skipped rows, missing evidence and stale code', () => {
    const errors = checkReport({
      report: report('| B1 | PASS | looks good |'),
      ledgerIds,
      hash: 'new',
    });
    assert.equal(errors.length, 3);
  });

  it('rejects a verdict that contradicts its flags', () => {
    const contradiction = report(
      '| B1 | FAIL | a.tsx:1 |\n| O1 | PASS | a.tsx:2 |',
    );
    assert.match(
      checkReport({ report: contradiction, ledgerIds, hash: 'abc' })[0],
      /PASS, but/,
    );
    const unmapped = report(
      '| B1 | PASS | a.tsx:1 |\n| O1 | PASS | a.tsx:2 |',
      'PASS',
      '- F1 [FAIL] Unrequested prop at a.tsx:9',
    );
    assert.match(
      checkReport({ report: unmapped, ledgerIds, hash: 'abc' })[0],
      /PASS, but/,
    );
  });

  it('finds rows flagged again in a later round', () => {
    const first = report('| B1 | FAIL | a.tsx:1 |', 'FAIL');
    const second = report(
      '| B1 | FAIL | a.tsx:3 |\n| O1 | QUESTION | a.tsx:2 |',
      'FAIL',
    );
    assert.deepEqual(findRepeats({ current: second, previous: [first] }), [
      'B1',
    ]);
  });
});

describe('gates', () => {
  it('runs every gate after a failure and strips terminal colors', () => {
    const ran = [];
    const results = runGates(
      [
        { name: 'one', command: 'a' },
        { name: 'two', command: 'b' },
      ],
      (command) => {
        ran.push(command);
        return {
          status: command === 'a' ? 1 : 0,
          output: '\u001b[31mred\u001b[0m',
        };
      },
    );
    assert.deepEqual(ran, ['a', 'b']);
    assert.deepEqual(
      results.map(({ passed }) => passed),
      [false, true],
    );
    assert.equal(results[0].tail, 'red');
  });
});
