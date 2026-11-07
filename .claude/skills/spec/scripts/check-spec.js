import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { checkFacts, toManifestName } from './check-facts.js';

const REQUIRED_SECTIONS = [
  'Purpose',
  'Anatomy',
  'API',
  'Figma tokens',
  'Additional tokens',
  'Behavior and accessibility',
  'Out of scope',
  'Decisions',
  'Open questions',
];

const RULE_ID = /^(A11Y|CSS|FS|GEN|PROP|RX|TS)-\d+$/;
const DECISION_ID = /^D\d+$/;
const TOKEN_REFERENCE = /--dy-[a-z0-9-]+/g;
const TOKEN_FIELDS_WITH_NONE = new Set(['fill', 'stroke', 'strokeWidth']);

const propertyName = (name) => name.split('#')[0];

/** @param {string} markdown */
export function parseSpec(markdown) {
  const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  const meta = Object.fromEntries(
    (frontMatter ? frontMatter[1].split('\n') : []).map((line) => {
      const [key, ...value] = line.split(':');
      return [key.trim(), value.join(':').trim()];
    }),
  );

  const sections = new Map();
  let current = null;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = { text: [], rows: [] };
      sections.set(heading[1], current);
    } else if (current) {
      current.text.push(line);
      if (/^\|/.test(line) && !/^\|\s*:?-/.test(line)) {
        current.rows.push(
          line
            .slice(1, -1)
            .split(/(?<!\\)\|/)
            // An escaped pipe is part of the cell, such as a union in a type.
            .map((cell) =>
              cell.trim().replaceAll('`', '').replaceAll('\\|', '|'),
            ),
        );
      }
    }
  }
  return { meta, sections };
}

function tableRows(section) {
  if (!section) return [];
  const [header, ...rows] = section.rows;
  return rows.map((row) =>
    Object.fromEntries(header.map((name, index) => [name, row[index] ?? ''])),
  );
}

/**
 * The spec's Figma token table, derived only from the facts. Identical values
 * are one row, so 135 variants stay reviewable.
 *
 * @param {object} payload The facts payload
 * @returns {string[][]} Layer, Property, When, Token, Source
 */
export function renderTokenRows(payload) {
  const rows = new Map();
  const add = (layer, field, when, value) => {
    const isNone = value === 'none' && TOKEN_FIELDS_WITH_NONE.has(field);
    if (!value.startsWith('token:') && !isNone) return;
    const token = isNone
      ? 'none'
      : `--${toManifestName(value.slice('token:'.length))}`;
    const key = [layer, field, token].join();
    if (!rows.has(key)) rows.set(key, { layer, field, token, when: [] });
    rows.get(key).when.push(when);
  };

  for (const layer of payload.summarized) {
    const layerName = layer.path === 'root' ? 'root' : layer.name;
    for (const fact of layer.facts) {
      if ('value' in fact) add(layerName, fact.field, 'all', fact.value);
      else {
        for (const [when, value] of Object.entries(fact.values)) {
          add(layerName, fact.field, when.replaceAll('|', ' / '), value);
        }
      }
    }
  }
  return [...rows.values()].map(({ layer, field, when, token }) => [
    layer,
    field,
    when.join('; '),
    token,
    'figma',
  ]);
}

/**
 * @param {string[]} sources Cells from a Source column
 * @param {{ ruleIds: Set<string>, decisionIds: Set<string> }} known
 */
function sourceErrors(sources, { ruleIds, decisionIds }) {
  const errors = [];
  for (const source of sources) {
    if (source === 'figma') continue;
    if (DECISION_ID.test(source)) {
      if (!decisionIds.has(source)) errors.push(`unknown decision ${source}`);
    } else if (RULE_ID.test(source)) {
      if (!ruleIds.has(source)) errors.push(`unknown rule ${source}`);
    } else {
      errors.push(`invalid source "${source}"`);
    }
  }
  return errors;
}

const splitSources = (cell) =>
  cell
    .split(',')
    .map((source) => source.trim())
    .filter(Boolean);

/**
 * Checks a spec against the saved facts, the shipped tokens and the standards.
 * A row with no valid source is an invented feature until proven otherwise.
 *
 * A spec is approved by being on `main`, never by a field, so `status` is
 * rejected. `isReady` asks whether it can open a PR: no open questions left.
 *
 * @param {{ spec: ReturnType<typeof parseSpec>, facts: { hash: string, payload: object }, manifest: { tokens: Record<string, unknown> }, ruleIds: Set<string>, markdown: string, isReady?: boolean }} options
 * @returns {string[]} Errors
 */
export function checkSpec({
  spec,
  facts,
  manifest,
  ruleIds,
  markdown,
  isReady = false,
}) {
  const errors = [];
  const { meta, sections } = spec;
  const { payload } = facts;

  if ('status' in meta) {
    errors.push(
      'Remove status: a spec is approved by merging it into main, not by a field.',
    );
  }
  if (meta.factsHash !== facts.hash) {
    errors.push(
      `factsHash ${meta.factsHash} doesn't match the facts (${facts.hash}). Re-run the spec from current facts.`,
    );
  }
  for (const name of REQUIRED_SECTIONS) {
    if (!sections.has(name)) errors.push(`Missing section: ${name}.`);
  }
  errors.push(
    ...checkFacts({ facts, manifest }).errors.map((error) => `Facts: ${error}`),
  );

  const decisions = tableRows(sections.get('Decisions'));
  const known = {
    ruleIds,
    decisionIds: new Set(decisions.map((row) => row.ID)),
  };
  const checkRows = (sectionName, rows, label) => {
    for (const row of rows) {
      const sources = splitSources(row.Source ?? '');
      if (sources.length === 0) {
        errors.push(`${sectionName}: "${row[label]}" has no source.`);
      }
      for (const error of sourceErrors(sources, known)) {
        errors.push(`${sectionName}: "${row[label]}" has ${error}.`);
      }
    }
  };

  const api = tableRows(sections.get('API'));
  const outOfScope = tableRows(sections.get('Out of scope'));
  checkRows('API', api, 'Prop');
  if (sections.has('API') && !api.some((row) => row.Prop?.startsWith('...'))) {
    errors.push(
      'API: no ...htmlAttributes row. Every component extends its native attributes (TS-01), and /implement checks them against this row.',
    );
  }
  checkRows('Out of scope', outOfScope, 'Item');
  checkRows(
    'Behavior and accessibility',
    tableRows(sections.get('Behavior and accessibility')),
    'Requirement',
  );

  const figmaProperties = new Map(
    Object.entries(payload.properties).map(([name, definition]) => [
      propertyName(name),
      definition,
    ]),
  );
  for (const row of api) {
    if (!splitSources(row.Source ?? '').includes('figma')) continue;
    const definition = figmaProperties.get(row.Figma);
    if (!definition) {
      errors.push(
        `API: "${row.Prop}" cites Figma property "${row.Figma}", which doesn't exist.`,
      );
    } else if (definition.type === 'VARIANT') {
      const values = row.Values.split(',').map((value) => value.trim());
      if (
        [...values].sort().join() !==
        [...definition.variantOptions].sort().join()
      ) {
        errors.push(
          `API: "${row.Prop}" values ${values.join()} don't match Figma ${definition.variantOptions.join()}.`,
        );
      }
      if (row.Default !== definition.defaultValue) {
        errors.push(
          `API: "${row.Prop}" default ${row.Default} doesn't match Figma ${definition.defaultValue}.`,
        );
      }
    }
  }

  const accountedFor = new Set([
    ...api.map((row) => row.Figma),
    ...outOfScope.map((row) => row.Figma),
  ]);
  for (const name of figmaProperties.keys()) {
    if (!accountedFor.has(name)) {
      errors.push(
        `Figma property "${name}" is in neither API nor Out of scope.`,
      );
    }
  }

  const expected = renderTokenRows(payload).map((row) => row.join(' | '));
  const actual = (sections.get('Figma tokens')?.rows ?? [])
    .slice(1)
    .map((row) => row.join(' | '));
  for (const row of expected) {
    if (!actual.includes(row)) errors.push(`Figma tokens: missing "${row}".`);
  }
  for (const row of actual) {
    if (!expected.includes(row)) {
      errors.push(`Figma tokens: "${row}" isn't in the facts.`);
    }
  }

  const additional = tableRows(sections.get('Additional tokens'));
  checkRows('Additional tokens', additional, 'Token');
  for (const row of additional) {
    if (splitSources(row.Source ?? '').includes('figma')) {
      errors.push(
        `Additional tokens: "${row.Token}" can't cite figma; those belong in Figma tokens.`,
      );
    }
  }

  for (const [token] of markdown.matchAll(TOKEN_REFERENCE)) {
    if (!(token.slice(2) in manifest.tokens)) {
      errors.push(`Token ${token} doesn't exist in @dy/tokens.`);
    }
  }

  for (const row of decisions) {
    const sources = splitSources(row.Source ?? '').filter(
      (source) => source !== 'Daniel',
    );
    if (!row.Source?.trim())
      errors.push(`Decisions: "${row.ID}" has no source.`);
    for (const error of sourceErrors(sources, known)) {
      errors.push(`Decisions: "${row.ID}" has ${error}.`);
    }
  }
  const resolved = decisions.map((row) => row.Resolves ?? '').join('\n');
  for (const question of checkFacts({ facts, manifest }).questions) {
    const subject = question.startsWith('Hidden layer ')
      ? question.split(' ')[2]
      : question.split(' has no token')[0];
    if (!resolved.includes(subject)) {
      errors.push(`No decision resolves the fact: ${question}`);
    }
  }

  const openQuestions = (sections.get('Open questions')?.text ?? [])
    .join('\n')
    .trim();
  if (isReady && openQuestions !== 'None.') {
    errors.push(
      'A spec ready for review must say "None." under Open questions.',
    );
  }
  return errors;
}

async function collectRuleIds(directory) {
  const ruleIds = new Set();
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md')) continue;
    const text = await readFile(join(directory, file), 'utf8');
    for (const [, id] of text.matchAll(/^### ([A-Z0-9]+-\d+) ·/gm)) {
      ruleIds.add(id);
    }
  }
  return ruleIds;
}

async function main() {
  const { values } = parseArgs({
    options: {
      facts: { type: 'string' },
      spec: { type: 'string' },
      'print-rows': { type: 'boolean', default: false },
      ready: { type: 'boolean', default: false },
      manifest: {
        type: 'string',
        default: 'packages/tokens/dist/manifest.json',
      },
      standards: { type: 'string', default: 'brain/standards' },
    },
  });
  if (!values.facts) throw new Error('--facts is required');
  const readJson = async (file) =>
    JSON.parse(await readFile(resolve(file), 'utf8'));
  const facts = await readJson(values.facts);

  if (values['print-rows']) {
    console.log('| Layer | Property | When | Token | Source |');
    console.log('| :-- | :-- | :-- | :-- | :-- |');
    for (const [layer, field, when, token, source] of renderTokenRows(
      facts.payload,
    )) {
      console.log(
        `| ${layer} | ${field} | ${when} | \`${token}\` | ${source} |`,
      );
    }
    return;
  }

  if (!values.spec) throw new Error('--spec is required');
  const markdown = await readFile(resolve(values.spec), 'utf8');
  const errors = checkSpec({
    spec: parseSpec(markdown),
    facts,
    manifest: await readJson(values.manifest),
    ruleIds: await collectRuleIds(resolve(values.standards)),
    markdown,
    isReady: values.ready,
  });
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  if (errors.length > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
