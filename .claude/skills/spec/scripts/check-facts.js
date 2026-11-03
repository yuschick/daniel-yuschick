import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { fnv1a } from '../../../../packages/tokens/scripts/hash.js';

/**
 * Layout mechanics that have no token by design, so they aren't questions.
 */
const STRUCTURAL_FIELDS = new Set([
  'layoutMode',
  'alignPrimary',
  'alignCounter',
]);

const ZERO_VALUE = /^raw:(0|\{"unit":"[A-Z]+","value":0\})$/;

/**
 * @param {string} tokenName A Figma variable name, e.g. dy/space/xs
 * @returns {string} Its name in the token manifest, e.g. dy-space-xs
 */
export function toManifestName(tokenName) {
  return tokenName.replaceAll('/', '-');
}

function* factValues(layer) {
  for (const fact of layer.facts) {
    if ('value' in fact) {
      yield { field: fact.field, value: fact.value };
    } else {
      for (const [when, value] of Object.entries(fact.values)) {
        yield { field: fact.field, value, when };
      }
    }
  }
}

/**
 * Compares saved facts with the shipped tokens. Errors mean the facts can't be
 * trusted and the run stops. Questions are gaps only a person can decide.
 *
 * @param {{ facts: { hash: string, payload: object }, manifest: { tokens: Record<string, unknown> } }} options
 * @returns {{ errors: string[], questions: string[] }}
 */
export function checkFacts({ facts, manifest }) {
  const { hash, payload } = facts;
  const errors = [];
  const questions = new Set();

  const actualHash = fnv1a(JSON.stringify(payload));
  if (actualHash !== hash) {
    errors.push(
      `Facts were altered after leaving Figma (hash ${hash}, file hashes to ${actualHash}).`,
    );
  }

  const expectedVariants = payload.axes.reduce(
    (total, axis) => total * payload.properties[axis].variantOptions.length,
    1,
  );
  if (payload.variantCount !== expectedVariants) {
    errors.push(
      `Expected ${expectedVariants} variants from the axes, found ${payload.variantCount}. Ask whether the missing combinations are intentional.`,
    );
  }

  const { walked, summarized, hidden } = payload.coverage;
  if (walked !== summarized + hidden) {
    errors.push(
      `Coverage gap: walked ${walked} layers but accounted for ${summarized + hidden}.`,
    );
  }

  for (const layer of payload.summarized) {
    for (const { field, value, when } of factValues(layer)) {
      const location = `${layer.path} ${field}${when ? ` (${when})` : ''}`;
      for (const part of value.split(' + ')) {
        if (part.startsWith('token:')) {
          const tokenName = part.slice('token:'.length);
          if (!(toManifestName(tokenName) in manifest.tokens)) {
            errors.push(
              `${location}: token ${tokenName} doesn't exist in @dy/tokens.`,
            );
          }
        } else if (
          part.startsWith('raw:') &&
          !STRUCTURAL_FIELDS.has(field) &&
          !ZERO_VALUE.test(part)
        ) {
          questions.add(`${layer.path} ${field} has no token: ${part}`);
        }
      }
    }
  }

  for (const layer of payload.hidden) {
    const controls = Object.values(layer.references ?? {}).join();
    questions.add(
      `Hidden layer ${layer.path} (${controls || 'no controlling property'}): in scope or deferred?`,
    );
  }

  return { errors, questions: [...questions] };
}

async function main() {
  const { values } = parseArgs({
    options: {
      facts: { type: 'string' },
      manifest: {
        type: 'string',
        default: 'packages/tokens/dist/manifest.json',
      },
    },
  });
  if (!values.facts) throw new Error('Usage: check-facts.js --facts <file>');

  const [facts, manifest] = await Promise.all(
    [values.facts, values.manifest].map(async (file) =>
      JSON.parse(await readFile(resolve(file), 'utf8')),
    ),
  );
  const { errors, questions } = checkFacts({ facts, manifest });

  for (const error of errors) console.error(`ERROR: ${error}`);
  for (const question of questions) console.log(`QUESTION: ${question}`);
  console.log(`${errors.length} errors, ${questions.length} questions.`);
  if (errors.length > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
