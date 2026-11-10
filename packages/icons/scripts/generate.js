import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { FORMAT_VERSION, ICON_NAME, SHAPES } from './figma-to-icon-manifest.js';

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
 * The defaults every icon component renders with. Props override them.
 *
 * @param {{ manifest: IconManifest }} options
 * @returns {string}
 */
export function renderAttributes({ manifest }) {
  // Values are checked safe (checkManifest), so quoting needs no escaping
  const literal = (/** @type {string | number} */ value) =>
    typeof value === 'number' ? String(value) : `'${value}'`;
  const shared = Object.entries(manifest.attributes).map(
    ([attribute, value]) =>
      `  ${toReactAttribute(attribute)}: ${literal(value)},`,
  );

  return [
    `// ${GENERATED}`,
    "import type { IconComponentProps } from '../types';",
    '',
    '/** Decorative and text-sized by default; every attribute can be overridden. */',
    'export const ICON_ATTRIBUTES = {',
    "  'aria-hidden': true,",
    "  focusable: 'false',",
    "  width: '1em',",
    "  height: '1em',",
    `  viewBox: ${literal(manifest.viewBox)},`,
    ...shared,
    '} satisfies IconComponentProps;',
    '',
  ].join('\n');
}

/**
 * One icon component, named for its icon and following RX-01 and RX-02.
 *
 * @param {{ icon: ManifestIcon }} options
 * @returns {string}
 */
export function renderComponent({ icon }) {
  const componentName = toComponentName({ name: icon.name });
  const children = icon.nodes.map(([element, attributes]) => {
    const props = Object.entries(attributes)
      .map(([attribute, value]) => ` ${attribute}="${value}"`)
      .join('');
    return `      <${element}${props} />`;
  });

  return [
    `// ${GENERATED}`,
    "import type { IconComponentProps } from '../types';",
    "import { ICON_ATTRIBUTES } from './attributes';",
    '',
    `/** The \`${icon.name}\` icon, from Lucide. */`,
    `export const ${componentName} = function ${componentName}({`,
    '  ref: externalRef,',
    '  ...htmlAttributes',
    '}: IconComponentProps) {',
    '  return (',
    '    <svg ref={externalRef} {...ICON_ATTRIBUTES} {...htmlAttributes}>',
    ...children,
    '    </svg>',
    '  );',
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
      join(iconsDir, `${toComponentName({ name: icon.name })}.tsx`),
      renderComponent({ icon }),
    );
  }
  await writeFile(
    join(iconsDir, 'attributes.ts'),
    renderAttributes({ manifest }),
  );
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
