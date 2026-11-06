import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import {
  buildLedger,
  buildReviewerPrompt,
  buildStandardsLedger,
} from './build-ledger.js';
import {
  parseCompilerOutput,
  readTypeExpression,
  renderApiCheck,
} from './check-api.js';
import {
  checkDefaults,
  checkInlineStyles,
  checkScope,
  checkStructure,
  checkSuppressions,
  checkTokens,
  checkTokensExist,
  expectedTokens,
} from './check-component.js';
import {
  checkReport,
  findRepeats,
  parseReport,
  recordReview,
} from './check-review.js';
import { checkApproval, checkPreflight } from './preflight.js';
import { listGates, runGates } from './run-gates.js';
import { findReviewLimit, hasPassingReview } from './shared.js';

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
    component: 'chip',
    trackedChanges: '',
    spec: { local: SPEC, approved: SPEC },
    facts: { local: '{}', approved: '{}' },
  };

  it('passes an approved spec on a clean branch', () => {
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

  it('rejects any branch the hooks do not guard', () => {
    for (const branch of ['main', 'feat/build-skill', 'build/other']) {
      assert.match(checkPreflight({ ...clean, branch })[0], /build\/chip/);
    }
  });

  it('rejects tracked changes and open questions', () => {
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

  it('lets the gates recheck approval while the work is uncommitted', () => {
    const { trackedChanges, ...approval } = clean;
    assert.deepEqual(checkApproval(approval), []);
    assert.match(
      checkApproval({ ...approval, spec: { local: SPEC, approved: null } })[0],
      /isn't approved/,
    );
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

  it('keeps a required token when the out-of-scope prose mentions its property', () => {
    const prose = parseSpec(
      SPEC.replace(
        '| Item | Figma',
        'Nothing should fill this.\n\n| Item | Figma',
      ),
    );
    assert.ok(expectedTokens(prose).has('--dy-color-a'));
  });

  it('requires every default in the signature', () => {
    assert.deepEqual(
      checkDefaults({ sections: spec.sections, source: "size = 'm'" }),
      [],
    );
    const errors = checkDefaults({ sections: spec.sections, source: 'size' });
    assert.match(errors[0], /RX-03: size/);
  });

  it('rejects a token that does not exist, even in a story', () => {
    const errors = checkTokensExist({
      sources: { 'Chip.stories.tsx': 'var(--dy-real) var(--dy-invented)' },
      manifestTokens: { 'dy-real': {} },
    });
    assert.deepEqual(errors, [
      "Chip.stories.tsx uses --dy-invented, which doesn't exist.",
    ]);
  });

  it('rejects inline styles and raw colors, with their location', () => {
    const errors = checkInlineStyles({
      sources: {
        'Chip.tsx': "const size = 1;\n<a style={{ color: '#f00' }} />",
        'useChip.ts': "element.style.color = 'oklch(1 0 0)';",
      },
    });
    assert.equal(errors.length, 4);
    assert.match(errors[0], /Chip\.tsx:2 sets an inline style/);
    assert.match(errors[1], /CSS-01: Chip\.tsx:2/);
  });

  it('accepts class names, handlers and comments about style', () => {
    assert.deepEqual(
      checkInlineStyles({
        sources: {
          'Chip.tsx':
            "import styles from './Chip.module.css';\n// A styled chip\n<a className={styles.chip} href='#main' />",
        },
      }),
      [],
    );
  });

  it('requires a suppression to name its rule, reason and tracking issue', () => {
    const check = (source) =>
      checkSuppressions({ sources: { 'a.ts': source } });
    assert.deepEqual(
      check('// eslint-disable-next-line some/rule -- Why. Tracked in #12'),
      [],
    );
    assert.deepEqual(
      check(
        '/* stylelint-disable some-rule -- Why.\n   See github.com/a/b/issues/3 */',
      ),
      [],
    );
    assert.deepEqual(check('// @ts-expect-error -- Why. TODO: #402'), []);

    assert.match(check('// eslint-disable-next-line')[0], /name the rule/);
    assert.match(check('// eslint-disable-next-line')[1], /explain/);
    assert.match(check('// @ts-ignore')[0], /@ts-expect-error/);
    assert.match(
      check('// eslint-disable-next-line some/rule -- Why. TODO: follow up')[0],
      /tracking issue/,
    );
  });

  it('only accepts a shared rule a person approved', () => {
    const options = {
      changedFiles: [
        'packages/react/src/types/common.ts',
        'brain/standards/a.md',
      ],
      component: 'chip',
      spec: 'packages/react/specs/chip.md',
      facts: 'packages/react/specs/chip.facts.json',
    };
    const refused = checkScope({ ...options, isApproved: () => false });
    assert.equal(refused.length, 2);
    assert.match(refused[0], /without human approval/);
    assert.deepEqual(checkScope({ ...options, isApproved: () => true }), []);
  });

  it('rejects spec edits and files outside the component', () => {
    const options = {
      component: 'chip',
      spec: 'packages/react/specs/chip.md',
      facts: 'packages/react/specs/chip.facts.json',
      isApproved: () => false,
    };
    assert.deepEqual(
      checkScope({
        ...options,
        changedFiles: [
          'packages/react/src/components/Chip/Chip.tsx',
          'packages/react/src/components/index.ts',
          'packages/react/src/index.ts',
        ],
      }),
      [],
    );
    assert.equal(
      checkScope({
        ...options,
        changedFiles: ['packages/react/specs/chip.md', 'apps/web/page.tsx'],
      }).length,
      2,
    );
  });
});

describe('API check', () => {
  it('stops at the first comma outside the generics', () => {
    assert.equal(
      readTypeExpression('Omit<A, B>, without className or style'),
      'Omit<A, B>',
    );
    assert.equal(readTypeExpression('Omit<A, B>'), 'Omit<A, B>');
  });

  it('labels a failed assertion by what the spec expected', () => {
    const { source, labels } = renderApiCheck(spec);
    assert.match(source, /typeof Chip/);
    const inventedLine = source
      .split('\n')
      .findIndex((line) => line.includes('Exclude<OwnProps'));
    assert.equal(labels.get(inventedLine + 1), 'Invented prop');
    assert.deepEqual(
      parseCompilerOutput({
        output: `node_modules/.cache/build/chip/api-check.ts(${inventedLine + 1},14): error TS2322: Type '"isLoading"' is not assignable to type 'never'.\n`,
        labels,
      }),
      [
        `API: Invented prop: Type '"isLoading"' is not assignable to type 'never'.`,
      ],
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

describe('standards rows', () => {
  it('makes every checklist item a row, across every standard', () => {
    const rows = buildStandardsLedger({
      'react.md': '# React\n\n- [ ] Second (RX-01)\n',
      'a11y.md': '- [ ] First (A11Y-01)\nprose\n- [ ] Also first (A11Y-02)\n',
    });
    assert.deepEqual(rows, [
      {
        id: 'STD1',
        section: 'Standards: a11y',
        requirement: 'First (A11Y-01)',
      },
      {
        id: 'STD2',
        section: 'Standards: a11y',
        requirement: 'Also first (A11Y-02)',
      },
      {
        id: 'STD3',
        section: 'Standards: react',
        requirement: 'Second (RX-01)',
      },
    ]);
  });

  it('leaves out items a tool already enforces, unless they cite other rules', () => {
    const rows = buildStandardsLedger({
      'css.md': [
        '- [ ] Enforced (CSS-01, CSS-02)',
        '- [ ] Mixed (CSS-01, CSS-08)',
        '- [ ] Uncited',
      ].join('\n'),
    });
    assert.deepEqual(
      rows.map(({ requirement }) => requirement),
      ['Mixed (CSS-01, CSS-08)', 'Uncited'],
    );
  });

  it('finds every item in the real standards', () => {
    const directory = new URL('../../../../brain/standards/', import.meta.url);
    const standards = Object.fromEntries(
      readdirSync(directory)
        .filter((file) => file.endsWith('.md') && file !== 'README.md')
        .map((file) => [file, readFileSync(new URL(file, directory), 'utf8')]),
    );
    const rows = buildStandardsLedger(standards);
    assert.ok(rows.length >= 50, `Only ${rows.length} rows.`);
    assert.ok(rows.some(({ requirement }) => /A11Y-01/.test(requirement)));
  });
});

describe('reviewer prompt', () => {
  it("holds only paths, so it can't brief the reviewer", () => {
    assert.equal(
      buildReviewerPrompt({
        spec: 'a.md',
        bundle: 'b.md',
        facts: 'c.json',
        screenshots: ['d.png', 'e.png'],
      }),
      'Spec: a.md\nBundle: b.md\nFacts: c.json\nScreenshots: d.png, e.png',
    );
    assert.doesNotMatch(
      buildReviewerPrompt({
        spec: 'a.md',
        bundle: 'b.md',
        facts: 'c.json',
        screenshots: [],
      }),
      /Screenshots/,
    );
  });
});

describe('review report', () => {
  const ledgerIds = ['B1', 'O1'];
  const SOURCES = {
    'a/Chip.tsx': 'one\ntwo\nthree\nfour\n',
    'Chip.tsx': 'export const Chip = 1;\n',
  };
  const readSource = (file) => SOURCES[file] ?? null;
  const report = (rows, verdict = 'PASS', extra = '') =>
    parseReport(
      `REVIEWED: abc\n\n| ID | Verdict | Evidence |\n${rows}\n${extra}\nVERDICT: ${verdict}\n`,
    );
  const check = (parsed, overrides = {}) =>
    checkReport({
      report: parsed,
      ledgerIds,
      hash: 'abc',
      readSource,
      ...overrides,
    });

  it('accepts a complete report with evidence that holds up', () => {
    assert.deepEqual(
      check(
        report(
          '| B1 | PASS | a/Chip.tsx:4 |\n| O1 | PASS | absent: iconStart in Chip.tsx |',
        ),
      ),
      [],
    );
  });

  it('rejects skipped rows, missing evidence and stale code', () => {
    const errors = check(report('| B1 | PASS | looks good |'), { hash: 'new' });
    assert.equal(errors.length, 3);
  });

  it('rejects a citation of a file or line that does not exist', () => {
    const errors = check(
      report(
        '| B1 | PASS | a/Chip.tsx:999 |\n| O1 | PASS | a/Invented.tsx:1 |',
      ),
    );
    assert.match(errors[0], /past the end/);
    assert.match(errors[1], /Invented\.tsx, which doesn't exist/);
  });

  it('rejects a claim that something is absent when it is there', () => {
    const errors = check(
      report(
        '| B1 | PASS | a/Chip.tsx:1 |\n| O1 | PASS | absent: Chip in Chip.tsx |',
      ),
    );
    assert.match(errors[0], /says Chip is absent/);
    assert.match(
      check(
        report(
          '| B1 | PASS | a/Chip.tsx:1 |\n| O1 | PASS | absent: icon in Nope.tsx |',
        ),
      )[0],
      /Nope\.tsx, which doesn't exist/,
    );
  });

  it('only lets a standards row be N/A, and only with a reason', () => {
    const ids = ['STD1', 'B1'];
    assert.deepEqual(
      check(
        report(
          '| STD1 | N/A | n/a: no overlay here |\n| B1 | PASS | a/Chip.tsx:1 |',
        ),
        { ledgerIds: ids },
      ),
      [],
    );
    assert.match(
      check(report('| STD1 | N/A | skip |\n| B1 | PASS | a/Chip.tsx:1 |'), {
        ledgerIds: ids,
      })[0],
      /needs a reason/,
    );
    assert.match(
      check(
        report('| STD1 | PASS | a/Chip.tsx:1 |\n| B1 | N/A | n/a: skip |'),
        { ledgerIds: ids },
      )[0],
      /can't be N\/A/,
    );
  });

  it('rejects a verdict that contradicts its flags', () => {
    const contradiction = report(
      '| B1 | FAIL | a/Chip.tsx:1 |\n| O1 | PASS | a/Chip.tsx:2 |',
    );
    assert.match(check(contradiction)[0], /PASS, but/);
    const unmapped = report(
      '| B1 | PASS | a/Chip.tsx:1 |\n| O1 | PASS | a/Chip.tsx:2 |',
      'PASS',
      '- F1 [FAIL] Unrequested prop at a.tsx:9',
    );
    assert.match(check(unmapped)[0], /PASS, but/);
  });

  it('finds rows flagged again in a later round', () => {
    assert.deepEqual(
      findRepeats({
        flagged: ['B1', 'O1'],
        rounds: [
          { file: 'report-1.md', flagged: ['B1'] },
          { file: 'report-2.md', flagged: ['B1', 'O1'] },
        ],
        file: 'report-2.md',
      }),
      ['B1'],
    );
  });
});

describe('review limits', () => {
  const empty = { rounds: [], invalid: [], history: [], resets: 0 };
  const failed = (file) => ({
    state: empty,
    file,
    verdict: 'FAIL',
    hash: 'abc',
    flagged: ['B1'],
  });

  it('counts a report once, however often it is checked', () => {
    const once = recordReview(failed('report-1.md'));
    const twice = recordReview({ ...failed('report-1.md'), state: once });
    assert.equal(twice.rounds.length, 1);
  });

  it('allows two failed rounds and stops at the third', () => {
    let state = empty;
    for (const file of ['report-1.md', 'report-2.md']) {
      state = recordReview({ ...failed(file), state });
      assert.equal(findReviewLimit(state), null);
    }
    state = recordReview({ ...failed('report-3.md'), state });
    assert.match(findReviewLimit(state), /3 review rounds have failed/);
  });

  it('stops after two invalid reports, without using a round', () => {
    let state = recordReview({
      state: empty,
      file: 'report-1.md',
      verdict: 'INVALID',
      hash: 'abc',
    });
    assert.equal(findReviewLimit(state), null);
    assert.equal(state.rounds.length, 0);
    state = recordReview({
      state,
      file: 'report-2.md',
      verdict: 'INVALID',
      hash: 'abc',
    });
    assert.match(findReviewLimit(state), /2 reports were invalid/);
  });

  it('only trusts a pass on the code as it is now', () => {
    const state = recordReview({
      state: empty,
      file: 'report-1.md',
      verdict: 'PASS',
      hash: 'abc',
    });
    assert.equal(hasPassingReview(state, 'abc'), true);
    assert.equal(hasPassingReview(state, 'moved'), false);
    assert.equal(hasPassingReview(empty, 'abc'), false);
  });
});

describe('the reviewer', () => {
  const reviewer = readFileSync(
    new URL('../../../agents/component-reviewer.md', import.meta.url),
    'utf8',
  );

  it('can only read and runs on Opus', () => {
    assert.match(reviewer, /^tools: Read, Grep, Glob$/m);
    assert.match(reviewer, /^model: opus$/m);
  });
});

describe('the skill', () => {
  const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');
  const frontMatter = skill.slice(0, skill.indexOf('\n---', 4));

  it('registers every hook, and a guard that fails blocks the call', () => {
    for (const event of ['pre', 'post', 'stop']) {
      assert.match(frontMatter, new RegExp(`run-hooks\\.js" ${event}'`));
    }
    assert.match(frontMatter, /Bash\|Agent\|Task\|SendMessage'/);
    assert.match(frontMatter, /run-hooks\.js" pre'\n\s+onFailure: block/);
  });

  // A `SubagentStop` hook in the skill's frontmatter never fired for the reviewer.
  it('registers the review hook in the project settings, not the skill', () => {
    const { hooks } = JSON.parse(
      readFileSync(new URL('../../../settings.json', import.meta.url), 'utf8'),
    );

    assert.doesNotMatch(frontMatter, /SubagentStop/);
    assert.equal(hooks.SubagentStop.length, 1);
    assert.equal(hooks.SubagentStop[0].matcher, 'component-reviewer');
    assert.match(
      hooks.SubagentStop[0].hooks[0].command,
      /run-hooks\.js" review$/,
    );
  });
});

describe('gates', () => {
  it('checks the checker before anything else', () => {
    const gates = listGates({ component: 'chip', base: 'origin/main' });
    assert.deepEqual(
      gates.map(({ name }) => name),
      ['checker', 'approval', 'component', 'turbo', 'format'],
    );
    assert.match(gates[0].command, /build\/scripts\/\*\.test\.js/);
    assert.match(gates[1].command, /--approval-only/);
  });

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
