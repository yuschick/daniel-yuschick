import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import manifest from '@dy/tokens/manifest.json' with { type: 'json' };

const reset = await readFile(new URL('reset.css', import.meta.url), 'utf8');

describe('reset.css', () => {
  it('declares the same layer order as @dy/tokens', () => {
    const statement = reset.match(/^@layer ([^{]+?);$/m);

    assert.ok(statement, 'reset.css has no @layer order statement');
    assert.deepEqual(
      statement[1].split(',').map((layer) => layer.trim()),
      manifest.layers,
    );
  });

  it('puts every rule in dy.reset', () => {
    const blocks = [...reset.matchAll(/^@layer ([\w.]+) \{$/gm)].map(
      (match) => match[1],
    );

    assert.deepEqual(blocks, ['dy.reset']);
  });
});
