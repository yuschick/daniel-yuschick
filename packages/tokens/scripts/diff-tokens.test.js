import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NO_CHANGES,
  compareTokens,
  describeValue,
  flattenTokens,
  formatSummary,
} from './diff-tokens.js';

const baseFiles = {
  'primitives.json': {
    $description: 'Generated.',
    dy: {
      color: {
        rhubarb: {
          600: {
            $type: 'color',
            $value: {
              colorSpace: 'srgb',
              components: [0.7, 0.1, 0.2],
              hex: '#c2294a',
            },
          },
        },
      },
      spacing: {
        200: { $type: 'dimension', $value: { value: 16, unit: 'px' } },
      },
      radius: { 100: { $type: 'dimension', $value: { value: 8, unit: 'px' } } },
    },
  },
};

const headFiles = {
  'primitives.json': {
    $description: 'Generated.',
    dy: {
      color: {
        rhubarb: {
          600: {
            $type: 'color',
            $value: {
              colorSpace: 'srgb',
              components: [0.73, 0.14, 0.26],
              hex: '#bb2443',
            },
          },
        },
      },
      spacing: {
        200: { $type: 'dimension', $value: { value: 16, unit: 'px' } },
        300: { $type: 'dimension', $value: { value: 24, unit: 'px' } },
      },
    },
  },
};

describe('describeValue', () => {
  it('summarizes DTCG values on one line', () => {
    assert.equal(
      describeValue({
        value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' },
      }),
      '#ffffff',
    );
    assert.equal(describeValue({ value: { value: 16, unit: 'px' } }), '16px');
    assert.equal(
      describeValue({ value: '{dy.color.rhubarb.600}' }),
      '{dy.color.rhubarb.600}',
    );
    assert.equal(describeValue({ value: [0.4, 0, 0.2, 1] }), '[0.4,0,0.2,1]');
  });
});

describe('compareTokens', () => {
  const base = flattenTokens({ files: baseFiles });
  const head = flattenTokens({ files: headFiles });

  it('ignores $description and other reserved keys', () => {
    assert.equal(base.size, 3);
  });

  it('reports added, removed and changed tokens', () => {
    assert.deepEqual(compareTokens({ base, head }), {
      added: ['dy.spacing.300'],
      removed: ['dy.radius.100'],
      changed: ['dy.color.rhubarb.600'],
    });
  });

  it('summarizes changes with before and after values', () => {
    const summary = formatSummary({ base, head });
    assert.match(summary, /1 added, 1 changed, 1 removed/);
    assert.match(summary, /`#c2294a` \| `#bb2443`/);
  });

  it('says so when nothing changed', () => {
    assert.equal(formatSummary({ base: head, head }), NO_CHANGES);
  });
});
