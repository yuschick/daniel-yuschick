import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { buildTokens } from './build.js';
import { buildTokenFiles, writeTokenFiles } from '../scripts/figma-to-dtcg.js';

// A miniature Figma export covering every layer and token type, run through
// the same converter /sync-tokens uses
let nextId = 0;
/** @param {{ name: string, type: string, value: unknown, mode?: string }} options */
const variable = ({ name, type, value, mode = 'Default' }) => ({
  id: `V:${String((nextId += 1))}`,
  name,
  type,
  description: '',
  scopes: [],
  values: { [mode]: value },
});
/** @param {{ name: string, mode?: string, variables: ReturnType<typeof variable>[] }} options */
const collection = ({ name, mode = 'Default', variables }) => ({
  collection: { id: `C:${name}`, name, modes: [mode] },
  total: variables.length,
  offset: 0,
  variables,
});

const primitives = collection({
  name: 'Portfolio Primitives',
  variables: [
    variable({ name: 'dy/color/rhubarb/600', type: 'COLOR', value: '#bb2443' }),
    variable({ name: 'dy/color/gray/50', type: 'COLOR', value: '#f7f6fd' }),
    variable({ name: 'dy/color/gray/900', type: 'COLOR', value: '#25242d' }),
    variable({ name: 'dy/color/white', type: 'COLOR', value: '#ffffff' }),
    variable({ name: 'dy/spacing/200', type: 'FLOAT', value: 16 }),
    variable({ name: 'dy/corner-radius/1200', type: 'FLOAT', value: 96 }),
    variable({
      name: 'dy/font/family/default',
      type: 'STRING',
      value: 'Inclusive Sans',
    }),
    variable({ name: 'dy/font/line-height/150', type: 'FLOAT', value: 1.5 }),
  ],
});
const [
  rhubarb600,
  gray50,
  gray900,
  white,
  spacing200,
  radius1200,
  family,
  lineHeight150,
] = primitives.variables;
/** @param {ReturnType<typeof variable> | undefined} target */
const alias = (target) => ({ alias: target?.id ?? '' });

const theme = collection({
  name: 'Portfolio Theme',
  mode: 'Rhubarb',
  variables: [
    variable({
      name: 'dy/color/primary/600',
      type: 'COLOR',
      value: alias(rhubarb600),
      mode: 'Rhubarb',
    }),
    variable({
      name: 'dy/color/neutral/50',
      type: 'COLOR',
      value: alias(gray50),
      mode: 'Rhubarb',
    }),
    variable({
      name: 'dy/color/neutral/900',
      type: 'COLOR',
      value: alias(gray900),
      mode: 'Rhubarb',
    }),
  ],
});
const [primary600, neutral50, neutral900] = theme.variables;

const exportedCollections = [
  primitives,
  theme,
  collection({
    name: 'Portfolio Color',
    mode: 'Light',
    variables: [
      variable({
        name: 'dy/color/surface/page',
        type: 'COLOR',
        value: alias(neutral50),
        mode: 'Light',
      }),
      variable({
        name: 'dy/color/surface/action/primary/default',
        type: 'COLOR',
        value: alias(primary600),
        mode: 'Light',
      }),
      variable({
        name: 'dy/color/text/default',
        type: 'COLOR',
        value: alias(neutral900),
        mode: 'Light',
      }),
      variable({
        name: 'dy/color/text/on-action',
        type: 'COLOR',
        value: alias(white),
        mode: 'Light',
      }),
    ],
  }),
  collection({
    name: 'Portfolio Space',
    variables: [
      variable({ name: 'dy/space/m', type: 'FLOAT', value: alias(spacing200) }),
    ],
  }),
  collection({
    name: 'Portfolio Shape',
    variables: [
      variable({
        name: 'dy/border-radius/pill',
        type: 'FLOAT',
        value: alias(radius1200),
      }),
    ],
  }),
  collection({
    name: 'Portfolio Typography',
    variables: [
      variable({
        name: 'dy/font/family/body',
        type: 'STRING',
        value: alias(family),
      }),
      variable({
        name: 'dy/font/line-height/default',
        type: 'FLOAT',
        value: alias(lineHeight150),
      }),
    ],
  }),
  collection({
    name: 'Portfolio Foundation',
    variables: [
      variable({ name: 'dy/border-width/focus', type: 'FLOAT', value: 2 }),
    ],
  }),
];

const pairs = [
  {
    foreground: 'dy-color-text-default',
    background: 'dy-color-surface-page',
    minimum: 4.5,
  },
  {
    foreground: 'dy-color-text-on-action',
    background: 'dy-color-surface-action-primary-default',
    minimum: 4.5,
  },
];

describe('buildTokens', () => {
  /** @type {string} */
  let workDir;
  /** @type {string} */
  let css;

  before(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'dy-tokens-'));
    await writeTokenFiles({
      files: buildTokenFiles({ collections: exportedCollections }),
      outputDir: join(workDir, 'src'),
    });
    await buildTokens({
      srcDir: join(workDir, 'src'),
      distDir: join(workDir, 'dist'),
      pairs,
    });
    css = await readFile(join(workDir, 'dist/css/dy.css'), 'utf8');
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('leaves the cascade layer order to @dy/css', () => {
    assert.doesNotMatch(css, /^@layer [^{]+;$/m);
  });

  it('ships top-layer tokens with resolved, converted values', () => {
    assert.match(css, /--dy-space-m: 1rem;/);
    assert.match(css, /--dy-border-radius-pill: 9999px;/);
    assert.match(css, /--dy-border-width-focus: 2px;/);
    assert.match(css, /--dy-font-line-height-default: 1\.5;/);
    assert.match(
      css,
      /--dy-font-family-body: "Inclusive Sans", system-ui, sans-serif;/,
    );
    assert.match(
      css,
      /--dy-color-surface-action-primary-default: oklch\(0\.5198 0\.1847 15\.95\);/,
    );
  });

  it('puts colors in the default theme layer on :root and data-theme', () => {
    assert.match(
      css,
      /@layer dy\.themes \{\n {2}:root,\n {2}\[data-theme='rhubarb'\] \{/,
    );
  });

  it('never ships primitive or theme-role tokens', () => {
    assert.doesNotMatch(css, /--dy-color-(rhubarb|gray|white|primary|neutral)/);
    assert.doesNotMatch(css, /--dy-(spacing|corner-radius)-/);
    assert.doesNotMatch(css, /--dy-font-(family-default|line-height-150)/);
  });

  it('writes a manifest of shipped tokens', async () => {
    const manifest = JSON.parse(
      await readFile(join(workDir, 'dist/manifest.json'), 'utf8'),
    );
    assert.equal(manifest.defaultTheme, 'rhubarb');
    assert.equal(Object.keys(manifest.tokens).length, 9);
  });

  it('fails when a contrast pair falls below its minimum', async () => {
    await assert.rejects(
      buildTokens({
        srcDir: join(workDir, 'src'),
        distDir: join(workDir, 'dist-failing'),
        pairs: [
          {
            foreground: 'dy-color-surface-page',
            background: 'dy-color-text-on-action',
            minimum: 4.5,
          },
        ],
      }),
      /Contrast \(rhubarb\): dy-color-surface-page on dy-color-text-on-action/,
    );
  });

  it('returns null when nothing has been synced yet', async () => {
    assert.equal(
      await buildTokens({
        srcDir: join(workDir, 'missing'),
        distDir: join(workDir, 'unused'),
        pairs,
      }),
      null,
    );
  });
});
