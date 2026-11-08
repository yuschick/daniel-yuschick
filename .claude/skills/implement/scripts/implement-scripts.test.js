import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { parseSpec } from '../../_shared/scripts/spec.js';
import { checkApproval, checkPreflight } from './preflight.js';

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
    branch: 'implement/chip',
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
    for (const branch of ['main', 'feat/build-skill', 'implement/other']) {
      assert.match(checkPreflight({ ...clean, branch })[0], /implement\/chip/);
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
    const builds = hooks.SubagentStop.filter(({ hooks: [hook] }) =>
      hook.command.includes('/implement/scripts/'),
    );
    assert.equal(builds.length, 1);
    assert.equal(builds[0].matcher, 'component-reviewer');
    assert.match(builds[0].hooks[0].command, /run-hooks\.js" review$/);
  });
});
