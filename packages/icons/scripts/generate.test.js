import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  ATTRIBUTES,
  FORMAT_VERSION,
  VIEW_BOX,
} from './figma-to-icon-manifest.js';
import {
  checkManifest,
  generate,
  renderAttributes,
  renderBarrel,
  renderComponent,
  renderSvg,
  toComponentName,
} from './generate.js';

/** @param {{ name: string, nodes?: [string, Record<string, string>][] }} options */
const icon = ({ name, nodes = [['path', { d: 'm6 9 6 6 6-6' }]] }) => ({
  name,
  figma: { id: '1:1', key: 'key' },
  description: '',
  nodes,
});

/** @param {{ icons: ReturnType<typeof icon>[] }} options */
const manifestWith = ({ icons }) => ({
  formatVersion: FORMAT_VERSION,
  section: { id: '259:442', name: 'Icons' },
  viewBox: VIEW_BOX,
  attributes: ATTRIBUTES,
  icons,
});

describe('toComponentName', () => {
  it('turns kebab-case names into PascalCase with an Icon suffix', () => {
    assert.equal(toComponentName({ name: 'chevron-down' }), 'ChevronDownIcon');
    assert.equal(toComponentName({ name: 'x' }), 'XIcon');
    assert.equal(
      toComponentName({ name: 'arrow-up-right' }),
      'ArrowUpRightIcon',
    );
  });
});

describe('checkManifest', () => {
  it('accepts the converter’s output', () => {
    checkManifest({
      manifest: manifestWith({ icons: [icon({ name: 'chevron-down' })] }),
    });
  });

  it('rejects another format version', () => {
    const manifest = { ...manifestWith({ icons: [] }), formatVersion: 99 };
    assert.throws(() => checkManifest({ manifest }), /format 99/);
  });

  it('rejects two icons that become one component name', () => {
    const manifest = manifestWith({
      icons: [icon({ name: 'arrow-2' }), icon({ name: 'arrow2' })],
    });
    assert.throws(
      () => checkManifest({ manifest }),
      /Two icons become Arrow2Icon/,
    );
  });

  it('rejects values that would need escaping in markup or JSX', () => {
    const manifest = manifestWith({
      icons: [icon({ name: 'x', nodes: [['path', { d: 'M0 0"/><script>' }]] })],
    });
    assert.throws(() => checkManifest({ manifest }), /isn't safe to render/);
  });

  it('rejects attributes that aren’t the shape’s geometry', () => {
    const manifest = manifestWith({
      icons: [icon({ name: 'x', nodes: [['path', { onclick: 'a' }]] })],
    });
    assert.throws(
      () => checkManifest({ manifest }),
      /onclick isn't geometry of <path>/,
    );
  });

  it('rejects elements that aren’t allowed shapes', () => {
    const manifest = manifestWith({
      icons: [icon({ name: 'x', nodes: [['script', {}]] })],
    });
    assert.throws(
      () => checkManifest({ manifest }),
      /<script> isn't an allowed shape/,
    );
  });
});

describe('renderSvg', () => {
  it('writes a standalone 24×24 SVG with the shared stroke', () => {
    const manifest = manifestWith({ icons: [] });
    const svg = renderSvg({ manifest, icon: icon({ name: 'chevron-down' }) });
    assert.match(svg, /^<!-- chevron-down · Lucide/);
    assert.match(
      svg,
      /<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">/,
    );
    assert.match(svg, /<path d="m6 9 6 6 6-6" \/>/);
  });
});

describe('renderComponent', () => {
  it('names the render function after the component (RX-01) and the ref externalRef (RX-02)', () => {
    const source = renderComponent({ icon: icon({ name: 'chevron-down' }) });
    assert.match(
      source,
      /export const ChevronDownIcon = function ChevronDownIcon\(\{/,
    );
    assert.match(source, /ref: externalRef,\n {2}\.\.\.htmlAttributes/);
    assert.match(
      source,
      /<svg ref=\{externalRef\} \{\.\.\.ICON_ATTRIBUTES\} \{\.\.\.htmlAttributes\}>/,
    );
    assert.match(source, /<path d="m6 9 6 6 6-6" \/>/);
    assert.doesNotMatch(source, /displayName|export default/);
  });
});

describe('renderAttributes', () => {
  it('hides icons from assistive tech and sizes them to the text by default', () => {
    const source = renderAttributes({ manifest: manifestWith({ icons: [] }) });
    for (const line of [
      "'aria-hidden': true,",
      "focusable: 'false',",
      "width: '1em',",
      'strokeWidth: 2,',
      "strokeLinecap: 'round',",
      "stroke: 'currentColor',",
      "viewBox: '0 0 24 24',",
    ]) {
      assert.ok(source.includes(line), `missing ${line}`);
    }
  });
});

describe('renderBarrel', () => {
  it('exports every icon by name and the shared types, with no wildcards (RX-04)', () => {
    const source = renderBarrel({
      manifest: manifestWith({
        icons: [icon({ name: 'chevron-down' }), icon({ name: 'x' })],
      }),
    });
    assert.ok(
      source.includes(
        "export { ChevronDownIcon } from './icons/ChevronDownIcon';",
      ),
    );
    assert.ok(source.includes("export { XIcon } from './icons/XIcon';"));
    assert.ok(
      source.includes(
        "export type { IconComponent, IconComponentProps } from './types';",
      ),
    );
    assert.doesNotMatch(source, /export \*/);
  });
});

describe('generate', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dy-icons-'));
  after(() => rm(directory, { recursive: true, force: true }));

  it('replaces earlier output, so a removed icon disappears', async () => {
    const svgDir = join(directory, 'svg');
    const reactDir = join(directory, 'react');

    await generate({
      manifest: manifestWith({
        icons: [icon({ name: 'chevron-down' }), icon({ name: 'x' })],
      }),
      svgDir,
      reactDir,
    });
    await writeFile(join(svgDir, 'stray.svg'), '');
    await generate({
      manifest: manifestWith({ icons: [icon({ name: 'x' })] }),
      svgDir,
      reactDir,
    });

    assert.deepEqual(await readdir(svgDir), ['x.svg']);
    assert.deepEqual((await readdir(join(reactDir, 'icons'))).sort(), [
      'XIcon.tsx',
      'attributes.ts',
    ]);
    assert.doesNotMatch(
      await readFile(join(reactDir, 'index.ts'), 'utf8'),
      /ChevronDown/,
    );
  });
});
