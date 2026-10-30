import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findContrastFailures,
  findHiddenTokens,
  findUnresolvedReferences,
} from './verify.js';

describe('findHiddenTokens', () => {
  const css =
    ':root { --dy-color-surface-page: oklch(1 0 0); --dy-space-m: 1rem; }';

  it('finds a hidden token that leaked into the CSS', () => {
    assert.deepEqual(findHiddenTokens({ css, hiddenNames: ['dy-space-m'] }), [
      'dy-space-m',
    ]);
  });

  it('does not match a longer name that merely starts the same', () => {
    assert.deepEqual(
      findHiddenTokens({ css, hiddenNames: ['dy-color-surface'] }),
      [],
    );
  });
});

describe('findUnresolvedReferences', () => {
  it('reports declarations that still hold a reference', () => {
    assert.deepEqual(
      findUnresolvedReferences({
        css: ':root {\n  --dy-a: {dy.color.gray.50};\n}',
      }),
      ['--dy-a: {dy.color.gray.50};'],
    );
  });
});

describe('findContrastFailures', () => {
  const colors = new Map([
    ['dy-color-text-default', 'oklch(0.2651 0.0158 293.64)'],
    ['dy-color-text-disabled', 'oklch(0.6094 0.0452 293.86)'],
    ['dy-color-surface-page', 'oklch(0.9764 0.0089 297.67)'],
  ]);

  it('passes pairs at or above their minimum', () => {
    assert.deepEqual(
      findContrastFailures({
        colors,
        pairs: [
          {
            foreground: 'dy-color-text-default',
            background: 'dy-color-surface-page',
            minimum: 4.5,
          },
        ],
      }),
      [],
    );
  });

  it('reports pairs below their minimum', () => {
    const [failure] = findContrastFailures({
      colors,
      pairs: [
        {
          foreground: 'dy-color-text-disabled',
          background: 'dy-color-surface-page',
          minimum: 4.5,
        },
      ],
    });
    assert.match(failure ?? '', /needs 4\.5:1/);
  });

  it('reports a pair naming a token that does not exist', () => {
    const [failure] = findContrastFailures({
      colors,
      pairs: [
        {
          foreground: 'dy-color-text-missing',
          background: 'dy-color-surface-page',
          minimum: 4.5,
        },
      ],
    });
    assert.match(failure ?? '', /doesn't exist/);
  });
});
