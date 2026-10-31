import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  toCssColor,
  toCssCubicBezier,
  toCssDimension,
  toCssDuration,
  toCssFontFamily,
  toCssNumber,
  transforms,
} from './transforms.js';

describe('toCssColor', () => {
  it('converts a DTCG color object to oklch', () => {
    assert.equal(
      toCssColor({
        value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' },
      }),
      'oklch(1 0 0)',
    );
  });

  it('carries alpha through', () => {
    assert.match(
      toCssColor({
        value: {
          colorSpace: 'srgb',
          components: [0, 0, 0],
          hex: '#000000',
          alpha: 0.5,
        },
      }),
      / \/ 0\.502\)$/,
    );
  });

  it('leaves an already converted value unchanged', () => {
    assert.equal(toCssColor({ value: 'oklch(1 0 0)' }), 'oklch(1 0 0)');
  });
});

describe('toCssDimension', () => {
  it('converts px to rem against a 16px base', () => {
    assert.equal(
      toCssDimension({ name: 'dy-space-m', value: { value: 16, unit: 'px' } }),
      '1rem',
    );
    assert.equal(
      toCssDimension({ name: 'dy-space-xs', value: { value: 4, unit: 'px' } }),
      '0.25rem',
    );
    assert.equal(
      toCssDimension({
        name: 'dy-size-page-inline-max',
        value: { value: 1280, unit: 'px' },
      }),
      '80rem',
    );
  });

  it('keeps border widths in px', () => {
    assert.equal(
      toCssDimension({
        name: 'dy-border-width-focus',
        value: { value: 2, unit: 'px' },
      }),
      '2px',
    );
  });

  it('writes zero without a unit', () => {
    assert.equal(
      toCssDimension({
        name: 'dy-border-radius-sharp',
        value: { value: 0, unit: 'px' },
      }),
      '0',
    );
  });

  it('applies the CSS meaning of circle and pill', () => {
    assert.equal(
      toCssDimension({
        name: 'dy-border-radius-circle',
        value: { value: 96, unit: 'px' },
      }),
      '50%',
    );
    assert.equal(
      toCssDimension({ name: 'dy-border-radius-pill', value: '6rem' }),
      '9999px',
    );
  });

  it('leaves an already converted value unchanged', () => {
    assert.equal(toCssDimension({ name: 'dy-space-m', value: '1rem' }), '1rem');
  });
});

describe('other types', () => {
  it('rounds Figma float noise and trims zeros', () => {
    assert.equal(toCssNumber({ value: 1.2000000476837158 }), '1.2');
    assert.equal(toCssNumber({ value: 1.5 }), '1.5');
    assert.equal(toCssNumber({ value: 2 }), '2');
    assert.equal(toCssNumber({ value: '1.2' }), '1.2');
  });

  it('writes durations with their unit', () => {
    assert.equal(toCssDuration({ value: { value: 150, unit: 'ms' } }), '150ms');
  });

  it('writes easing as cubic-bezier()', () => {
    assert.equal(
      toCssCubicBezier({ value: [0.4, 0, 0.2, 1] }),
      'cubic-bezier(0.4, 0, 0.2, 1)',
    );
  });

  it('quotes multi-word families and appends the fallback stack', () => {
    assert.equal(
      toCssFontFamily({ value: 'Inclusive Sans' }),
      '"Inclusive Sans", system-ui, sans-serif',
    );
    assert.equal(
      toCssFontFamily({ value: 'Inter' }),
      'Inter, system-ui, sans-serif',
    );
  });

  it('does not append the fallback stack twice', () => {
    const once = toCssFontFamily({ value: 'Inclusive Sans' });
    assert.equal(toCssFontFamily({ value: once }), once);
  });
});

describe('dy/name', () => {
  it('joins the token path with hyphens, matching Figma code syntax', () => {
    assert.equal(
      transforms['dy/name'].transform({ path: ['dy', 'size', 'icon', '2xl'] }),
      'dy-size-icon-2xl',
    );
  });
});
