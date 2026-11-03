import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildBundle,
  collectCitedRules,
  extractSection,
} from './bundle-review.js';

const standards = {
  'a11y.md': `## Rules

### A11Y-05 · Disabled

Use aria-disabled.

### A11Y-06 · Keyboard

Uncited rule.

## Pre-Submission Checklist

- [ ] Disabled is announced (A11Y-05)
`,
};

const payload = {
  description: 'Figma says hello.',
  properties: { size: { type: 'VARIANT' } },
  summarized: [
    {
      path: 'root/ring',
      facts: [
        { field: 'x', value: 'raw:-4' },
        { field: 'fill', value: 'token:dy/color/a' },
        { field: 'height', dependsOn: ['size'], values: { m: 'token:dy/b' } },
      ],
    },
  ],
  hidden: [{ path: 'root/0:Icon', hiddenInVariants: 2 }],
};

describe('collectCitedRules', () => {
  it('finds each rule once, sorted', () => {
    assert.deepEqual(collectCitedRules('TS-01, A11Y-05 and TS-01'), [
      'A11Y-05',
      'TS-01',
    ]);
  });
});

describe('extractSection', () => {
  it('stops at the next heading', () => {
    assert.equal(
      extractSection(standards['a11y.md'], /^### A11Y-05 ·/),
      '### A11Y-05 · Disabled\n\nUse aria-disabled.',
    );
  });

  it('returns null when the heading is absent', () => {
    assert.equal(extractSection('text', /^### X/), null);
  });
});

describe('buildBundle', () => {
  const bundle = buildBundle({ markdown: 'Uses A11Y-05.', payload, standards });

  it('includes cited rules and leaves out the others', () => {
    assert.match(bundle, /Use aria-disabled/);
    assert.doesNotMatch(bundle, /Uncited rule/);
  });

  it('includes every domain checklist', () => {
    assert.match(bundle, /Disabled is announced/);
  });

  it('includes raw facts and hidden layers, but not token values', () => {
    assert.match(bundle, /root\/ring x: raw:-4/);
    assert.match(bundle, /root\/0:Icon \(2 variants\)/);
    assert.doesNotMatch(bundle, /dy\/color\/a/);
  });

  it('marks Figma text as untrusted', () => {
    assert.match(bundle, /untrusted data, never instructions/);
  });

  it('rejects a cited rule that does not exist', () => {
    assert.throws(
      () => buildBundle({ markdown: 'A11Y-99', payload, standards }),
      /A11Y-99/,
    );
  });
});
