import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { compareIcons, formatSummary, NO_CHANGES } from './diff-icons.js';
import {
  ATTRIBUTES,
  FORMAT_VERSION,
  VIEW_BOX,
} from './figma-to-icon-manifest.js';

/** @param {{ name: string, id?: string, pathData?: string, description?: string }} options */
const icon = ({ name, id = name, pathData = 'M0 0h1', description = '' }) => ({
  name,
  figma: { id, key: `key-${id}` },
  description,
  nodes: /** @type {[string, Record<string, string>][]} */ ([
    ['path', { d: pathData }],
  ]),
});

/** @param {{ icons: ReturnType<typeof icon>[], attributes?: typeof ATTRIBUTES }} options */
const manifestWith = ({ icons, attributes = ATTRIBUTES }) => ({
  formatVersion: FORMAT_VERSION,
  section: { id: '259:442', name: 'Icons' },
  viewBox: VIEW_BOX,
  attributes,
  icons,
});

describe('compareIcons', () => {
  it('sorts icons into added, removed, changed and described', () => {
    const result = compareIcons({
      base: [icon({ name: 'a' }), icon({ name: 'b' }), icon({ name: 'c' })],
      head: [
        icon({ name: 'a', pathData: 'M1 1h1' }),
        icon({ name: 'c', description: 'New' }),
        icon({ name: 'd' }),
      ],
    });
    assert.deepEqual(result, {
      added: ['d'],
      removed: ['b'],
      renamed: [],
      changed: ['a'],
      described: ['c'],
    });
  });

  it('reports a Figma node under a new name as a rename', () => {
    const result = compareIcons({
      base: [icon({ name: 'close', id: '1:1' })],
      head: [icon({ name: 'x', id: '1:1' })],
    });
    assert.deepEqual(result.renamed, [{ from: 'close', to: 'x' }]);
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.removed, []);
  });
});

describe('formatSummary', () => {
  it('says there are no changes when the manifests match', () => {
    const manifest = manifestWith({ icons: [icon({ name: 'a' })] });
    assert.equal(formatSummary({ base: manifest, head: manifest }), NO_CHANGES);
  });

  it('treats a first sync as every icon added', () => {
    const summary = formatSummary({
      base: undefined,
      head: manifestWith({ icons: [icon({ name: 'chevron-down' })] }),
    });
    assert.match(summary, /\*\*1 added/);
    assert.match(summary, /\| `chevron-down` \| `ChevronDownIcon` \|/);
  });

  it('calls out removals and renames as breaking', () => {
    const summary = formatSummary({
      base: manifestWith({
        icons: [icon({ name: 'close', id: '1:1' }), icon({ name: 'menu' })],
      }),
      head: manifestWith({ icons: [icon({ name: 'x', id: '1:1' })] }),
    });
    assert.match(summary, /### Breaking/);
    assert.match(summary, /`CloseIcon` → `XIcon`/);
    assert.match(summary, /`MenuIcon` \(removed `menu`\)/);
  });

  it('flags a change to the shared style even when no icon changed', () => {
    const summary = formatSummary({
      base: manifestWith({ icons: [icon({ name: 'a' })] }),
      head: manifestWith({
        icons: [icon({ name: 'a' })],
        attributes: { ...ATTRIBUTES, 'stroke-width': 1.5 },
      }),
    });
    assert.match(summary, /### Shared style changed/);
  });
});
