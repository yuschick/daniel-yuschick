import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { format, resolveConfig } from 'prettier';

import { fnv1a } from './hash.js';

// Mode names that mean "this collection has no real modes", so files get no suffix
const UNNAMED_MODES = new Set(['Default', 'Mode 1', 'Value']);

// Figma font style names → DTCG numeric font weights
const FONT_WEIGHTS = new Map([
  ['Thin', 100],
  ['Extra Light', 200],
  ['Light', 300],
  ['Regular', 400],
  ['Medium', 500],
  ['Semi Bold', 600],
  ['Bold', 700],
  ['Extra Bold', 800],
  ['Black', 900],
]);

const DIMENSION_NAME =
  /\/(border-radius|border-width|corner-radius|line-height|size|space|spacing)\//;

/**
 * @typedef {{ alias: string } | string | number | boolean} FigmaValue
 * @typedef {{ id: string, name: string, type: string, description: string, scopes: string[], values: Record<string, FigmaValue> }} FigmaVariable
 * @typedef {{ collection: { id: string, name: string, modes: string[] }, total: number, offset: number, variables: FigmaVariable[] }} ExportPayload
 * @typedef {{ hash: string, payload: ExportPayload }} ExportPart
 * @typedef {{ fileName: string, tokens: Record<string, unknown> }} TokenFile
 */

/**
 * Throws unless the part's payload still hashes to the value computed in Figma.
 *
 * @param {{ part: ExportPart, source: string }} options
 */
export function verifyPart({ part, source }) {
  const actual = fnv1a(JSON.stringify(part.payload));

  if (actual !== part.hash) {
    throw new Error(
      `${source}: export was altered after leaving Figma (hash ${part.hash}, file hashes to ${actual}). Re-read this collection.`,
    );
  }
}

/**
 * Merges export parts into one entry per collection and checks that every
 * variable was exported exactly once.
 *
 * @param {{ parts: ExportPart[] }} options
 * @returns {ExportPayload[]}
 */
export function mergeParts({ parts }) {
  /** @type {Map<string, ExportPayload>} */
  const collections = new Map();

  for (const { payload } of parts) {
    const existing = collections.get(payload.collection.id);

    if (existing) {
      existing.variables.push(...payload.variables);
    } else {
      collections.set(payload.collection.id, {
        ...payload,
        variables: [...payload.variables],
      });
    }
  }

  for (const collection of collections.values()) {
    const uniqueIds = new Set(collection.variables.map(({ id }) => id));

    if (
      uniqueIds.size !== collection.total ||
      collection.variables.length !== collection.total
    ) {
      throw new Error(
        `${collection.collection.name}: exported ${String(collection.variables.length)} variables (${String(uniqueIds.size)} unique), expected ${String(collection.total)}. Re-read the missing parts.`,
      );
    }
  }

  return [...collections.values()];
}

/**
 * @param {{ variable: FigmaVariable }} options
 * @returns {string} The DTCG `$type` for a Figma variable
 */
export function toDtcgType({ variable }) {
  const { name, type } = variable;

  if (type === 'COLOR') {
    return 'color';
  }
  if (type === 'FLOAT' && name.includes('/motion/duration/')) {
    return 'duration';
  }
  if (type === 'FLOAT' && DIMENSION_NAME.test(name)) {
    return 'dimension';
  }
  if (type === 'STRING' && name.includes('/font/family/')) {
    return 'fontFamily';
  }
  if (type === 'STRING' && name.includes('/font/weight/')) {
    return 'fontWeight';
  }
  if (type === 'STRING' && name.includes('/motion/easing/')) {
    return 'cubicBezier';
  }

  throw new Error(
    `${name}: no DTCG type mapping for ${type}. Add one to toDtcgType in figma-to-dtcg.js.`,
  );
}

/**
 * @param {{ hex: string }} options
 * @returns {{ colorSpace: 'srgb', components: number[], alpha?: number, hex: string }}
 */
export function toDtcgColor({ hex }) {
  const channels = (hex.slice(1).match(/../g) ?? []).map(
    (pair) => Math.round((parseInt(pair, 16) / 255) * 10000) / 10000,
  );
  const [red = 0, green = 0, blue = 0, alpha] = channels;
  const color = {
    colorSpace: /** @type {const} */ ('srgb'),
    components: [red, green, blue],
    hex: hex.slice(0, 7).toLowerCase(),
  };

  return alpha === undefined || alpha === 1 ? color : { ...color, alpha };
}

/**
 * @param {{ variable: FigmaVariable, value: FigmaValue, type: string }} options
 * @returns {unknown} The DTCG `$value` for a literal (non-alias) Figma value
 */
export function toDtcgValue({ variable, value, type }) {
  switch (type) {
    case 'color':
      return toDtcgColor({ hex: String(value) });
    case 'dimension':
      return { value: Number(value), unit: 'px' };
    case 'duration':
      return { value: Number(value), unit: 'ms' };
    case 'fontFamily':
      return String(value);
    case 'fontWeight': {
      const weight = FONT_WEIGHTS.get(String(value));
      if (weight === undefined) {
        throw new Error(
          `${variable.name}: unknown font style "${String(value)}". Add it to FONT_WEIGHTS.`,
        );
      }
      return weight;
    }
    case 'cubicBezier': {
      const match = /^cubic-bezier\(([^)]+)\)$/.exec(String(value).trim());
      const points = match?.[1]?.split(',').map(Number) ?? [];
      if (points.length !== 4 || points.some(Number.isNaN)) {
        throw new Error(
          `${variable.name}: "${String(value)}" is not a cubic-bezier() value.`,
        );
      }
      return points;
    }
    default:
      throw new Error(`${variable.name}: unhandled DTCG type ${type}.`);
  }
}

/**
 * @param {{ collectionName: string, modeName: string, modeCount: number }} options
 * @returns {string} e.g. `color.light.json` or `space.json`
 */
export function toFileName({ collectionName, modeName, modeCount }) {
  const slugify = (text) =>
    text
      .replace(/^Portfolio\s+/i, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
  const base = slugify(collectionName);

  return modeCount === 1 && UNNAMED_MODES.has(modeName)
    ? `${base}.json`
    : `${base}.${slugify(modeName)}.json`;
}

/**
 * @param {{ tree: Record<string, unknown>, path: string[], token: Record<string, unknown>, source: string }} options
 */
function setToken({ tree, path, token, source }) {
  let node = tree;

  for (const [index, segment] of path.entries()) {
    const isLeaf = index === path.length - 1;
    const existing = node[segment];

    if (isLeaf) {
      if (existing !== undefined) {
        throw new Error(`${source}: ${path.join('.')} is defined twice.`);
      }
      node[segment] = token;
      return;
    }

    if (existing === undefined) {
      node[segment] = {};
    } else if (
      typeof existing !== 'object' ||
      existing === null ||
      '$value' in existing
    ) {
      throw new Error(
        `${source}: ${path.slice(0, index + 1).join('.')} is both a token and a group.`,
      );
    }
    node = /** @type {Record<string, unknown>} */ (node[segment]);
  }
}

/**
 * Converts merged Figma collections into DTCG token files, one per
 * collection and mode, with references kept as `{dy.…}` aliases.
 *
 * @param {{ collections: ExportPayload[] }} options
 * @returns {TokenFile[]}
 */
export function buildTokenFiles({ collections }) {
  /** @type {Map<string, FigmaVariable>} */
  const byId = new Map(
    collections.flatMap(({ variables }) =>
      variables.map((variable) => [variable.id, variable]),
    ),
  );
  /** @type {Map<string, string>} */
  const pathOwners = new Map();
  /** @type {TokenFile[]} */
  const files = [];

  const sortedCollections = [...collections].sort((first, second) =>
    first.collection.name.localeCompare(second.collection.name),
  );

  for (const { collection, variables } of sortedCollections) {
    const sortedVariables = [...variables].sort((first, second) =>
      first.name.localeCompare(second.name),
    );

    for (const modeName of collection.modes) {
      const fileName = toFileName({
        collectionName: collection.name,
        modeName,
        modeCount: collection.modes.length,
      });
      /** @type {Record<string, unknown>} */
      const tokens = {
        $description: `Generated by /sync-tokens from the Figma collection "${collection.name}" (mode "${modeName}"). Do not edit by hand.`,
      };

      for (const variable of sortedVariables) {
        const path = variable.name.split('/');
        const key = path.join('.');
        const owner = pathOwners.get(key);

        if (owner && owner !== collection.name) {
          throw new Error(
            `${key} exists in both "${owner}" and "${collection.name}".`,
          );
        }
        pathOwners.set(key, collection.name);

        const value = variable.values[modeName];
        if (value === undefined) {
          throw new Error(`${variable.name}: no value for mode "${modeName}".`);
        }

        /** @type {Record<string, unknown>} */
        let token;
        if (typeof value === 'object') {
          const target = byId.get(value.alias);
          if (!target) {
            throw new Error(
              `${variable.name}: references ${value.alias}, which isn't in this export (a variable from another file or library?).`,
            );
          }
          token = {
            $type: toDtcgType({ variable: target }),
            $value: `{${target.name.split('/').join('.')}}`,
          };
        } else {
          const type = toDtcgType({ variable });
          token = {
            $type: type,
            $value: toDtcgValue({ variable, value, type }),
          };
        }

        if (variable.description) {
          token.$description = variable.description;
        }
        token.$extensions = {
          'com.figma': { scopes: variable.scopes, variableId: variable.id },
        };

        setToken({ tree: tokens, path, token, source: fileName });
      }

      files.push({ fileName, tokens });
    }
  }

  return files;
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
 * Replaces every JSON file in the output directory with the given files,
 * formatted with the repo's Prettier config so the result is stable.
 *
 * @param {{ files: TokenFile[], outputDir: string }} options
 */
export async function writeTokenFiles({ files, outputDir }) {
  await mkdir(outputDir, { recursive: true });

  for (const fileName of await readdir(outputDir)) {
    if (fileName.endsWith('.json')) {
      await rm(join(outputDir, fileName));
    }
  }

  for (const { fileName, tokens } of files) {
    const filePath = join(outputDir, fileName);
    const prettierConfig = (await resolveConfig(filePath)) ?? {};
    const content = await format(JSON.stringify(tokens), {
      ...prettierConfig,
      parser: 'json',
    });
    await writeFile(filePath, content);
  }
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
      'Usage: node figma-to-dtcg.js --input <export parts dir> --output <token dir>',
    );
  }

  const parts = await readParts({ inputDir: resolve(values.input) });
  const collections = mergeParts({ parts });
  const files = buildTokenFiles({ collections });
  await writeTokenFiles({ files, outputDir: resolve(values.output) });

  process.stdout.write(
    `Wrote ${String(files.length)} token files from ${String(collections.length)} collections:\n${files
      .map(({ fileName }) => `- ${fileName}`)
      .join('\n')}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
