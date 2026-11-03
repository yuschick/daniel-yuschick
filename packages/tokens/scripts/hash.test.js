import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { fnv1a } from './hash.js';

/**
 * Returns the fnv1a function body with whitespace and comments removed.
 *
 * @param {{ source: string }} options
 */
const fnv1aBody = ({ source }) => {
  const start = source.indexOf('function fnv1a(text) {');
  const end = source.indexOf('\n}', start);
  return source
    .slice(start, end)
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, '');
};

describe('fnv1a', () => {
  it('is identical to the copy in the Figma export script', async () => {
    const packageSource = await readFile(
      new URL('./hash.js', import.meta.url),
      'utf8',
    );
    const skillSource = await readFile(
      new URL(
        '../../../.claude/skills/sync-tokens/scripts/export-variables.js',
        import.meta.url,
      ),
      'utf8',
    );
    const packageBody = fnv1aBody({ source: packageSource });
    assert.ok(packageBody.includes('Math.imul'), 'fnv1a not found in hash.js');
    assert.equal(fnv1aBody({ source: skillSource }), packageBody);
  });

  it('matches the published FNV-1a 32-bit test vectors', () => {
    assert.equal(fnv1a(''), '811c9dc5');
    assert.equal(fnv1a('a'), 'e40c292c');
    assert.equal(fnv1a('foobar'), 'bf9cf968');
  });

  it('changes when a single character changes', () => {
    assert.notEqual(fnv1a('{"value":"#bb2443"}'), fnv1a('{"value":"#bb2444"}'));
  });
});
