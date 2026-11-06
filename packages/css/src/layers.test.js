import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import stylelintConfig from '@dy/configs/stylelint';

const read = (specifier) =>
  readFile(fileURLToPath(import.meta.resolve(specifier)), 'utf8');

const reset = await read('./reset.css');
const global = await read('./global.css');
const tokens = await read('@dy/tokens/css/dy.css');

/** Every `@layer name;` or `@layer a, b;` order statement in a stylesheet. */
const orderStatements = (css) =>
  [...css.matchAll(/^@layer ([^{]+?);$/gm)].map((match) =>
    match[1].split(',').map((layer) => layer.trim()),
  );

/** The names of every `@layer name { … }` block in a stylesheet. */
const layerBlocks = (css) =>
  [...css.matchAll(/^@layer ([\w.]+) \{$/gm)].map((match) => match[1]);

const [layerOrder] = orderStatements(reset);

describe('the cascade layer order', () => {
  it('is declared once, by the reset', () => {
    assert.equal(orderStatements(reset).length, 1);
    assert.deepEqual(orderStatements(global), []);
    assert.deepEqual(orderStatements(tokens), []);
  });

  it('matches the layers Stylelint allows', () => {
    const allowed =
      stylelintConfig.rules['defensive-css/require-at-layer'][1]
        .supportedLayerNames;

    assert.deepEqual([...layerOrder].sort(), [...allowed].sort());
  });

  it('comes first in global.css, before any other layer can appear', () => {
    const [firstImport] = global.match(/^@import '[^']+';$/m) ?? [];

    assert.equal(firstImport, "@import './reset.css';");
  });
});

describe('reset.css', () => {
  it('puts every rule in dy.reset', () => {
    assert.deepEqual(layerBlocks(reset), ['dy.reset']);
  });
});

describe('@dy/tokens', () => {
  it('fills only layers the order declares', () => {
    for (const layer of layerBlocks(tokens)) {
      assert.ok(layerOrder.includes(layer), `${layer} is not in the order`);
    }
  });
});
