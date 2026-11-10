import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { FORMAT_VERSION, ICON_NAME, SHAPES } from './figma-to-icon-manifest.js';
import { ICON_ATTRIBUTES } from '../src/react/attributes.ts';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

// Path data, numbers and keywords only: nothing that needs escaping in
// markup or JSX
const SAFE_VALUE = /^[a-zA-Z0-9 .,-]*$/;

const GENERATED =
  'Generated from src/icons.json by scripts/generate.js. Do not edit.';

/**
 * @typedef {import('./figma-to-icon-manifest.js').IconManifest} IconManifest
 * @typedef {import('./figma-to-icon-manifest.js').ManifestIcon} ManifestIcon
 */

/**
 * `chevron-down` → `ChevronDownIcon`
 *
 * @param {{ name: string }} options
 * @returns {string}
 */
export function toComponentName({ name }) {
  const pascal = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `${pascal}Icon`;
}

/** `stroke-width` → `strokeWidth` */
const toReactAttribute = (/** @type {string} */ attribute) =>
  attribute.replace(/-([a-z])/g, (_match, letter) =>
    String(letter).toUpperCase(),
  );

/**
 * Throws unless the manifest is one this generator can render safely.
 *
 * @param {{ manifest: IconManifest }} options
 */
export function checkManifest({ manifest }) {
  if (manifest.formatVersion !== FORMAT_VERSION) {
    throw new Error(
      `icons.json is format ${String(manifest.formatVersion)}; this generator reads format ${String(FORMAT_VERSION)}.`,
    );
  }

  const values = [
    manifest.viewBox,
    ...Object.values(manifest.attributes).map(String),
  ];
  const componentNames = new Set();

  for (const icon of manifest.icons) {
    if (!ICON_NAME.test(icon.name)) {
      throw new Error(`"${icon.name}" isn't a valid icon name.`);
    }
    const componentName = toComponentName({ name: icon.name });
    if (componentNames.has(componentName)) {
      throw new Error(
        `Two icons become ${componentName}. Rename one in Figma.`,
      );
    }
    componentNames.add(componentName);

    for (const [element, attributes] of icon.nodes) {
      const geometry = Object.hasOwn(SHAPES, element)
        ? SHAPES[/** @type {keyof typeof SHAPES} */ (element)]
        : undefined;
      if (!geometry) {
        throw new Error(`${icon.name}: <${element}> isn't an allowed shape.`);
      }
      for (const [attribute, value] of Object.entries(attributes)) {
        if (!geometry.includes(attribute)) {
          throw new Error(
            `${icon.name}: ${attribute} isn't geometry of <${element}>.`,
          );
        }
        values.push(value);
      }
    }
  }

  const unsafe = values.find((value) => !SAFE_VALUE.test(value));
  if (unsafe !== undefined) {
    throw new Error(
      `icons.json holds a value that isn't safe to render: "${unsafe}".`,
    );
  }
}

/**
 * A standalone SVG file, for `<img>`, CSS and anything that isn't React.
 *
 * @param {{ manifest: IconManifest, icon: ManifestIcon }} options
 * @returns {string}
 */
export function renderSvg({ manifest, icon }) {
  const rootAttributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: manifest.viewBox,
    ...manifest.attributes,
  };
  const attributesOf = (/** @type {Record<string, unknown>} */ attributes) =>
    Object.entries(attributes)
      .map(([attribute, value]) => ` ${attribute}="${String(value)}"`)
      .join('');

  return [
    `<!-- ${icon.name} · Lucide (https://lucide.dev), licensed as in @dy/icons/LICENSE -->`,
    `<svg${attributesOf(rootAttributes)}>`,
    ...icon.nodes.map(
      ([element, attributes]) => `  <${element}${attributesOf(attributes)} />`,
    ),
    '</svg>',
    '',
  ].join('\n');
}

/**
 * Throws unless the React defaults in `src/react/attributes.ts` draw in the
 * manifest's house style. They're hand-written so the package type-checks
 * before a build, so a style change in the manifest must be made there too.
 *
 * @param {{ manifest: IconManifest, defaults?: Record<string, unknown> }} options
 */
export function checkStyle({ manifest, defaults = ICON_ATTRIBUTES }) {
  const expected = {
    viewBox: manifest.viewBox,
    ...Object.fromEntries(
      Object.entries(manifest.attributes).map(([attribute, value]) => [
        toReactAttribute(attribute),
        value,
      ]),
    ),
  };
  const mismatched = Object.entries(expected)
    .filter(([attribute, value]) => defaults[attribute] !== value)
    .map(([attribute]) => attribute);

  if (mismatched.length > 0) {
    throw new Error(
      `src/react/attributes.ts doesn't match the house style in icons.json (${mismatched.join(', ')}). Update it to match.`,
    );
  }
}

/**
 * One icon component: its shapes as data, and a named render function
 * (RX-01) that hands them and its props to `renderIcon`. The ref is
 * destructured as `externalRef` (RX-02) and passed on as `svgRef`.
 *
 * @param {{ icon: ManifestIcon }} options
 * @returns {string}
 */
export function renderComponent({ icon }) {
  const componentName = toComponentName({ name: icon.name });
  // Values are checked safe (checkManifest), so quoting needs no escaping
  const nodes = icon.nodes.map(([element, attributes]) => {
    const geometry = Object.entries(attributes)
      .map(([attribute, value]) => `${attribute}: '${value}'`)
      .join(', ');
    return `  ['${element}', { ${geometry} }],`;
  });

  return [
    `// ${GENERATED}`,
    "import { renderIcon } from '../renderIcon';",
    "import type { IconComponentProps, IconNode } from '../types';",
    '',
    'const NODES = [',
    ...nodes,
    '] satisfies IconNode[];',
    '',
    `/** The \`${icon.name}\` icon, from Lucide. */`,
    `export const ${componentName} = function ${componentName}({`,
    '  ref: externalRef,',
    '  ...htmlAttributes',
    '}: IconComponentProps) {',
    '  return renderIcon({ htmlAttributes, nodes: NODES, svgRef: externalRef });',
    '};',
    '',
  ].join('\n');
}

/**
 * The `@dy/icons/react` entry point: every icon by name, plus the shared types.
 *
 * @param {{ manifest: IconManifest }} options
 * @returns {string}
 */
export function renderBarrel({ manifest }) {
  return [
    `// ${GENERATED}`,
    ...manifest.icons.map(({ name }) => {
      const componentName = toComponentName({ name });
      return `export { ${componentName} } from './icons/${componentName}';`;
    }),
    "export type { IconComponent, IconComponentProps } from './types';",
    '',
  ].join('\n');
}

/**
 * Writes the SVG files and the React sources tsdown compiles, replacing any
 * earlier output so a removed icon disappears.
 *
 * @param {{ manifest: IconManifest, svgDir: string, reactDir: string }} options
 */
export async function generate({ manifest, svgDir, reactDir }) {
  checkManifest({ manifest });
  checkStyle({ manifest });

  const iconsDir = join(reactDir, 'icons');
  await rm(svgDir, { recursive: true, force: true });
  await rm(iconsDir, { recursive: true, force: true });
  await mkdir(svgDir, { recursive: true });
  await mkdir(iconsDir, { recursive: true });

  for (const icon of manifest.icons) {
    await writeFile(
      join(svgDir, `${icon.name}.svg`),
      renderSvg({ manifest, icon }),
    );
    await writeFile(
      join(iconsDir, `${toComponentName({ name: icon.name })}.ts`),
      renderComponent({ icon }),
    );
  }
  await writeFile(join(reactDir, 'index.ts'), renderBarrel({ manifest }));
}

async function main() {
  /** @type {IconManifest} */
  const manifest = JSON.parse(
    await readFile(join(PACKAGE_ROOT, 'src/icons.json'), 'utf8'),
  );
  await generate({
    manifest,
    svgDir: join(PACKAGE_ROOT, 'dist/svg'),
    reactDir: join(PACKAGE_ROOT, 'src/react'),
  });
  process.stdout.write(`Generated ${String(manifest.icons.length)} icons.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
