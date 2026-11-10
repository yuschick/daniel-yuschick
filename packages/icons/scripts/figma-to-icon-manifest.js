import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { format, resolveConfig } from 'prettier';
import { optimize } from 'svgo';

import { fnv1a } from './hash.js';

/** Bump when the manifest's shape changes, so consumers can tell. */
export const FORMAT_VERSION = 1;

/** The grid every glyph is drawn on. */
export const VIEW_BOX = '0 0 24 24';
const GRID_SIZE = '24';

/**
 * The house style every glyph must match: Lucide's 2px round stroke, no fill.
 * The converter checks each glyph against it and stores it once, so the
 * glyphs themselves carry geometry only.
 */
export const ATTRIBUTES = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/** The only elements a glyph may contain, with the geometry each one keeps. */
export const SHAPES = {
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  path: ['d'],
  polygon: ['points'],
  polyline: ['points'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
};

/** Lowercase words joined by hyphens, starting with a letter: `chevron-down`. */
export const ICON_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const ROOT_ATTRIBUTES = new Set([
  'xmlns',
  'width',
  'height',
  'viewBox',
  'fill',
]);

/**
 * @typedef {{ id: string, key: string, name: string, description: string, svg: string }} ExportedGlyph
 * @typedef {{ section: { id: string, name: string }, total: number, offset: number, icons: ExportedGlyph[] }} ExportPayload
 * @typedef {{ hash: string, payload: ExportPayload }} ExportPart
 * @typedef {[string, Record<string, string>]} IconNode
 * @typedef {{ name: string, figma: { id: string, key: string }, description: string, nodes: IconNode[] }} ManifestIcon
 * @typedef {{ formatVersion: number, section: { id: string, name: string }, viewBox: string, attributes: typeof ATTRIBUTES, icons: ManifestIcon[] }} IconManifest
 * @typedef {{ type: string, name?: string, attributes?: Record<string, string>, children?: XastNode[] }} XastNode
 */

/**
 * Figma returns component descriptions HTML-escaped (a typed `"` reads back
 * as `&quot;`). One level is decoded, with `&amp;` last so `&amp;quot;` isn't
 * turned into a quote. Same as `decodeEntities` in the tokens converter.
 *
 * @param {{ text: string }} options
 * @returns {string}
 */
export function decodeEntities({ text }) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Throws unless the part's payload still hashes to the value computed in Figma.
 *
 * @param {{ part: ExportPart, source: string }} options
 */
export function verifyPart({ part, source }) {
  const actual = fnv1a(JSON.stringify(part.payload));

  if (actual !== part.hash) {
    throw new Error(
      `${source}: export was altered after leaving Figma (hash ${part.hash}, file hashes to ${actual}). Export this slice again.`,
    );
  }
}

/**
 * Joins the exported slices into one list, checking they come from one
 * section and cover every glyph exactly once.
 *
 * @param {{ parts: ExportPart[] }} options
 * @returns {{ section: ExportPayload['section'], glyphs: ExportedGlyph[] }}
 */
export function mergeParts({ parts }) {
  const [first] = parts;
  if (!first) {
    throw new Error('No export parts to merge.');
  }

  const { section, total } = first.payload;
  const sorted = [...parts].sort(
    (left, right) => left.payload.offset - right.payload.offset,
  );
  const glyphs = [];

  for (const { payload } of sorted) {
    if (payload.section.id !== section.id || payload.total !== total) {
      throw new Error(
        'Export parts come from different sections or different runs. Export every slice again.',
      );
    }
    if (payload.offset !== glyphs.length) {
      throw new Error(
        `Expected a slice starting at ${String(glyphs.length)}, found one at ${String(payload.offset)}. Export the missing or overlapping slice again.`,
      );
    }
    glyphs.push(...payload.icons);
  }

  if (glyphs.length !== total) {
    throw new Error(
      `The section has ${String(total)} glyphs, but the parts hold ${String(glyphs.length)}. Export the remaining slices.`,
    );
  }
  return { section, glyphs };
}

/**
 * Optimizes a glyph's SVG and returns the optimized tree.
 *
 * @param {{ svg: string }} options
 * @returns {XastNode}
 */
function optimizeGlyph({ svg }) {
  /** @type {XastNode | undefined} */
  let finalRoot;

  optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        // Keep one element per Figma layer, as Lucide draws them
        params: { overrides: { mergePaths: false } },
      },
      {
        name: 'capture-tree',
        // Runs last in every pass, so the final pass leaves the final tree
        fn: () => ({
          root: {
            exit: (root) => {
              finalRoot = root;
            },
          },
        }),
      },
    ],
  });

  if (!finalRoot) {
    throw new Error('SVGO returned no tree.');
  }
  return finalRoot;
}

/**
 * Turns one glyph's SVG into geometry-only nodes, after checking it matches
 * the house style: a 24×24 grid, allowed shapes only, one stroke color, and
 * the shared stroke width, caps and joins.
 *
 * @param {{ name: string, svg: string }} options
 * @returns {IconNode[]}
 */
export function parseGlyph({ name, svg }) {
  const root = optimizeGlyph({ svg });
  const svgElements = (root.children ?? []).filter(
    (child) => child.type === 'element',
  );
  const [svgElement] = svgElements;

  if (svgElements.length !== 1 || svgElement?.name !== 'svg') {
    throw new Error(`${name}: expected a single <svg> element.`);
  }

  const rootAttributes = svgElement.attributes ?? {};
  if (rootAttributes.viewBox !== VIEW_BOX) {
    throw new Error(
      `${name}: viewBox is "${String(rootAttributes.viewBox)}", not "${VIEW_BOX}". Draw it on the 24×24 grid.`,
    );
  }
  for (const [attribute, value] of Object.entries(rootAttributes)) {
    if (!ROOT_ATTRIBUTES.has(attribute)) {
      throw new Error(`${name}: <svg ${attribute}> isn't allowed.`);
    }
    if (
      (attribute === 'width' || attribute === 'height') &&
      value !== GRID_SIZE
    ) {
      throw new Error(`${name}: ${attribute} is ${value}, not ${GRID_SIZE}.`);
    }
    if (attribute === 'fill' && value !== 'none') {
      throw new Error(`${name}: glyphs are stroked, not filled.`);
    }
  }

  const colors = new Set();
  /** @type {IconNode[]} */
  const nodes = [];

  for (const child of svgElement.children ?? []) {
    if (child.type !== 'element') {
      continue;
    }

    const element = String(child.name);
    const geometry = SHAPES[/** @type {keyof typeof SHAPES} */ (element)];
    if (!geometry) {
      throw new Error(
        `${name}: <${element}> isn't allowed. Glyphs may only contain ${Object.keys(SHAPES).join(', ')}. Flatten groups, and remove masks, clip paths, images and gradients.`,
      );
    }
    if (
      (child.children ?? []).some((grandchild) => grandchild.type === 'element')
    ) {
      throw new Error(`${name}: <${element}> can't contain other elements.`);
    }

    const attributes = child.attributes ?? {};
    /** @type {Record<string, string>} */
    const kept = {};

    if (!attributes.stroke || attributes.stroke === 'none') {
      throw new Error(`${name}: every <${element}> must have a stroke.`);
    }

    for (const [attribute, value] of Object.entries(attributes)) {
      if (geometry.includes(attribute)) {
        kept[attribute] = value;
      } else if (attribute === 'stroke') {
        colors.add(value.toLowerCase());
      } else if (attribute === 'fill') {
        if (value !== 'none') {
          throw new Error(`${name}: glyphs are stroked, not filled.`);
        }
      } else if (attribute in ATTRIBUTES) {
        const expected = String(
          ATTRIBUTES[/** @type {keyof typeof ATTRIBUTES} */ (attribute)],
        );
        if (value !== expected) {
          throw new Error(
            `${name}: ${attribute} is ${value}, not ${expected}. Every glyph uses the same stroke.`,
          );
        }
      } else {
        throw new Error(`${name}: ${attribute} on <${element}> isn't allowed.`);
      }
    }

    for (const attribute of [
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
    ]) {
      if (!(attribute in attributes)) {
        throw new Error(
          `${name}: <${element}> is missing ${attribute}. Every glyph uses the same stroke.`,
        );
      }
    }

    nodes.push([element, kept]);
  }

  if (colors.size > 1) {
    throw new Error(
      `${name}: uses ${String(colors.size)} stroke colors. Glyphs are single color.`,
    );
  }
  if (nodes.length === 0) {
    throw new Error(`${name}: contains no shapes.`);
  }
  return nodes;
}

/**
 * Builds the manifest from the merged export, sorted by name.
 *
 * @param {{ section: ExportPayload['section'], glyphs: ExportedGlyph[] }} options
 * @returns {IconManifest}
 */
export function buildManifest({ section, glyphs }) {
  const seen = new Set();
  const icons = glyphs.map(({ id, key, name, description, svg }) => {
    if (!ICON_NAME.test(name)) {
      throw new Error(
        `"${name}": glyph names are lowercase words joined by hyphens, starting with a letter (chevron-down).`,
      );
    }
    if (seen.has(name)) {
      throw new Error(`"${name}": two glyphs share this name.`);
    }
    seen.add(name);

    return {
      name,
      figma: { id, key },
      description: decodeEntities({ text: description }).trim(),
      nodes: parseGlyph({ name, svg }),
    };
  });

  return {
    formatVersion: FORMAT_VERSION,
    section,
    viewBox: VIEW_BOX,
    attributes: ATTRIBUTES,
    icons: icons.sort((first, second) => first.name.localeCompare(second.name)),
  };
}

/**
 * Reads every export part in a directory and verifies each one.
 *
 * @param {{ inputDir: string }} options
 * @returns {Promise<ExportPart[]>}
 */
export async function readParts({ inputDir }) {
  const fileNames = (await readdir(inputDir))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();

  if (fileNames.length === 0) {
    throw new Error(`No export parts found in ${inputDir}.`);
  }

  const parts = [];
  for (const fileName of fileNames) {
    /** @type {ExportPart} */
    const part = JSON.parse(await readFile(join(inputDir, fileName), 'utf8'));
    verifyPart({ part, source: fileName });
    parts.push(part);
  }
  return parts;
}

/**
 * Writes the manifest with the repo's Prettier config, so the result is stable.
 *
 * @param {{ manifest: IconManifest, outputPath: string }} options
 */
export async function writeManifest({ manifest, outputPath }) {
  const prettierConfig = (await resolveConfig(outputPath)) ?? {};
  await writeFile(
    outputPath,
    await format(JSON.stringify(manifest), {
      ...prettierConfig,
      parser: 'json',
    }),
  );
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
    },
  });

  if (!values.input || !values.output) {
    throw new Error(
      'Usage: node figma-to-icon-manifest.js --input <export parts dir> --output <icons.json>',
    );
  }

  const parts = await readParts({ inputDir: resolve(values.input) });
  const manifest = buildManifest(mergeParts({ parts }));
  await writeManifest({ manifest, outputPath: resolve(values.output) });

  process.stdout.write(
    `Wrote ${String(manifest.icons.length)} icons from "${manifest.section.name}".\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
