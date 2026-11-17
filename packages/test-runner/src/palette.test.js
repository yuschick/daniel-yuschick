import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { palette, paletteSources } from './palette.js';

// Read by path: @dy/tokens depends on this package for its reporter, so this
// package can't depend on @dy/tokens. turbo.json lists the file as an input.
const primitives = JSON.parse(
  await readFile(
    new URL('../../tokens/src/primitives.json', import.meta.url),
    'utf8',
  ),
);

/**
 * @param {string} hex
 */
function luminance(hex) {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;

    return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * @param {string} foreground
 * @param {string} background
 */
function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

describe('palette', () => {
  for (const [role, source] of Object.entries(paletteSources)) {
    test(`${role} matches dy.color.${source}`, () => {
      const [scale, step] = source.split('.');

      assert.equal(
        palette[/** @type {keyof typeof palette} */ (role)],
        primitives.dy.color[scale][step].$value.hex,
      );
    });

    test(`${role} keeps 3:1 on light and dark terminals`, () => {
      for (const background of ['#000000', '#ffffff', '#1e1e1e', '#fafafa']) {
        assert.ok(
          contrast(
            palette[/** @type {keyof typeof palette} */ (role)],
            background,
          ) >= 3,
          `${role} against ${background}`,
        );
      }
    });
  }
});
