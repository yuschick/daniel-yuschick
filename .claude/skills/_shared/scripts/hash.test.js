import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { fnv1a } from './hash.js';

const EMBEDDED_COPIES = [
  new URL('../../spec/scripts/extract-component.js', import.meta.url),
];
const FUNCTION = /function fnv1a\(text\) \{[\s\S]*?\n\}/;
const compact = (source) => source.replace(/\s+/g, '');

describe('fnv1a', () => {
  it('matches the reference FNV-1a values', () => {
    assert.equal(fnv1a(''), '811c9dc5');
    assert.equal(fnv1a('a'), 'e40c292c');
  });

  for (const url of EMBEDDED_COPIES) {
    it(`is identical to the copy embedded in ${url.pathname.split('/').at(-1)}`, () => {
      const embedded = readFileSync(url, 'utf8').match(FUNCTION)?.[0];
      assert.ok(embedded, 'no fnv1a function found');
      assert.equal(compact(embedded), compact(fnv1a.toString()));
    });
  }
});
