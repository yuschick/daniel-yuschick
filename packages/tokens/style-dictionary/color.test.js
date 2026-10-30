import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  contrastRatio,
  formatOklch,
  hexToOklch,
  oklchToHex,
  parseOklch,
} from './color.js';

// The palette as synced from Figma on 2026-10-30, plus sRGB edge cases
const PALETTE = [
  'fff4f4',
  'fee2e2',
  'f8c6c7',
  'f4a0a4',
  'ed737e',
  'db465c',
  'bb2443',
  '901b32',
  '631d27',
  '3d181b',
  '210f10',
  'f2f9f3',
  'e3ede4',
  'cad9cc',
  'acc1af',
  '8aa78e',
  '6a8d70',
  '517357',
  '3c5841',
  '2c3e2f',
  '1d281f',
  '101711',
  'f7f6fd',
  'eae8f1',
  'd4d2df',
  'bbb8ca',
  '9f9ab4',
  '847e9c',
  '6a6480',
  '514c62',
  '3a3746',
  '25242d',
  '15141a',
  'edfced',
  'dbf0db',
  'bddfbd',
  '94cb95',
  '63b467',
  '2f9c3c',
  '047f21',
  '016216',
  '0f4516',
  '102c12',
  '0a190a',
  'fef4f3',
  'fee2de',
  'ffc4ba',
  'fe9c8e',
  'f86c5b',
  'e8372b',
  'c60203',
  '990102',
  '6a150f',
  '411410',
  '250d0a',
  'fff5eb',
  'fae6d0',
  'eeceab',
  'e2b076',
  'd48d2b',
  'b47301',
  '915b02',
  '704501',
  '513100',
  '361f01',
  '1f1203',
  'f2f7ff',
  'ddebfe',
  'b9d7fe',
  '8cbefd',
  '57a0fb',
  '1e82ee',
  '0066c8',
  '024e9a',
  '08386e',
  '0d2543',
  '081526',
  'ffffff',
];
const EDGE_CASES = [
  '000000',
  'ff0000',
  '00ff00',
  '0000ff',
  'ffff00',
  '00ffff',
  'ff00ff',
  '808080',
];

describe('formatOklch', () => {
  it('round-trips every palette color and sRGB edge case exactly', () => {
    for (const hex of [...PALETTE, ...EDGE_CASES]) {
      const formatted = formatOklch({ hex: `#${hex}` });
      assert.equal(
        oklchToHex(parseOklch({ value: formatted })),
        `#${hex}`,
        formatted,
      );
    }
  });

  it('writes the brand color with four, four and two decimal places', () => {
    assert.equal(formatOklch({ hex: '#bb2443' }), 'oklch(0.5198 0.1847 15.95)');
  });

  it('gives neutral colors a hue of 0', () => {
    assert.equal(formatOklch({ hex: '#ffffff' }), 'oklch(1 0 0)');
    assert.equal(hexToOklch({ hex: '#808080' }).hue, 0);
  });

  it('adds alpha only when the color is translucent', () => {
    assert.match(formatOklch({ hex: '#bb244380' }), / \/ 0\.502\)$/);
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG extremes', () => {
    assert.equal(
      contrastRatio({ foreground: '#000000', background: '#ffffff' }),
      21,
    );
    assert.equal(
      contrastRatio({ foreground: '#bb2443', background: '#bb2443' }),
      1,
    );
  });

  it('is symmetrical', () => {
    assert.equal(
      contrastRatio({ foreground: '#ffffff', background: '#bb2443' }),
      contrastRatio({ foreground: '#bb2443', background: '#ffffff' }),
    );
  });
});
