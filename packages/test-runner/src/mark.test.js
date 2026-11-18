import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { MARK } from './mark.js';

const lines = MARK.split('\n');
const strokeRows = lines.slice(2, -2);

describe('MARK', () => {
  test('is framed by two identical rules', () => {
    assert.equal(lines[0], lines.at(-1));
    assert.match(lines[0] ?? '', /^░█+$/);
  });

  test('draws only shadow and block characters, within the rules', () => {
    for (const line of strokeRows) {
      assert.match(line, /^[ ░█]*$/);
      assert.ok(line.length <= (lines[0] ?? '').length, line);
    }
  });

  test('draws every stroke two blocks wide, with a shadow', () => {
    for (const line of strokeRows) {
      for (const stroke of line.trim().split(/ +/)) {
        assert.equal(stroke, '░██');
      }
    }
  });

  test('moves each stroke one column left per row', () => {
    // The descender keeps going after the other slashes stop
    const lastColumns = strokeRows.map((line) => line.lastIndexOf('░'));

    for (let row = 1; row < lastColumns.length; row += 1) {
      if (row !== 4) {
        assert.equal(
          lastColumns[row],
          (lastColumns[row - 1] ?? 0) - 1,
          `row ${row}`,
        );
      }
    }
  });
});
