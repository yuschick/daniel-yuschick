import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import { componentPaths, git } from './shared.js';

const SYSTEM_TOKEN = /--dy-[a-z0-9-]+/g;
const COMPONENTS = 'packages/react/src/components';
const ALWAYS_IN_SCOPE = [
  `${COMPONENTS}/index.ts`,
  'packages/react/src/index.ts',
];
// A change here must also trace to a Decision, which the cold review checks.
const REGISTRY = [
  'brain/standards/props.md',
  'packages/react/src/types/common.ts',
  'packages/react/src/types/index.ts',
];

const dataRows = (section) => section?.rows.slice(1) ?? [];

/**
 * The tokens a component must use: every Figma row whose property isn't out of
 * scope, plus the additional tokens. Exact in both directions, so a missing
 * token and an invented one both fail.
 *
 * @param {{ sections: Map<string, { text: string[], rows: string[][] }> }} spec
 * @returns {Set<string>}
 */
export function expectedTokens({ sections }) {
  const outOfScope = sections.get('Out of scope')?.text.join('\n') ?? '';
  const tokens = new Set();
  for (const [, property, , token] of dataRows(sections.get('Figma tokens'))) {
    if (token.startsWith('--dy-') && !outOfScope.includes(property)) {
      tokens.add(token);
    }
  }
  for (const [token] of dataRows(sections.get('Additional tokens'))) {
    tokens.add(token);
  }
  return tokens;
}

/**
 * @param {{ expected: Set<string>, css: string }} options
 * @returns {string[]}
 */
export function checkTokens({ expected, css }) {
  const used = new Set(css.match(SYSTEM_TOKEN) ?? []);
  return [
    ...[...expected]
      .filter((token) => !used.has(token))
      .map((token) => `CSS doesn't use the spec's token ${token}.`),
    ...[...used]
      .filter((token) => !expected.has(token))
      .map((token) => `CSS uses ${token}, which isn't in the spec.`),
  ];
}

/**
 * @param {{ name: string, files: string[], indexSource: string, specText: string, storySource: string }} options
 * @returns {string[]}
 */
export function checkStructure({
  name,
  files,
  indexSource,
  specText,
  storySource,
}) {
  const errors = [];
  for (const suffix of ['.tsx', '.types.ts', '.module.css', '.stories.tsx']) {
    if (!files.includes(`${name}${suffix}`)) {
      errors.push(`FS-04: ${name}${suffix} is missing.`);
    }
  }
  if (!files.includes('index.ts')) errors.push('FS-04: index.ts is missing.');
  for (const file of files) {
    if (file === `${name}.test.ts` || file === `${name}.test.tsx`) {
      errors.push(`FS-05: ${file} must be a Storybook test.`);
    }
  }

  const hook = `use${name}`;
  if (files.includes(`${hook}.ts`)) {
    if (!files.includes(`${hook}.test.ts`)) {
      errors.push(`FS-05: ${hook}.test.ts is missing.`);
    }
    if (
      specText.includes('not exported from `index.ts`') &&
      indexSource.includes(hook)
    ) {
      errors.push(`RX-09: ${hook} must not be exported from index.ts.`);
    }
  }
  if (/export \*/.test(indexSource) || /export default/.test(indexSource)) {
    errors.push('RX-04: index.ts must use explicit named exports.');
  }
  if (
    !/export const Conformance\b/.test(storySource) ||
    !storySource.includes('checkConformance(')
  ) {
    errors.push(
      'The stories need a Conformance story that calls checkConformance.',
    );
  }
  return errors;
}

/**
 * Checks each API row is declared and each default sits in the signature (RX-03).
 *
 * @param {{ sections: Map<string, { rows: string[][] }>, source: string }} options
 * @returns {string[]}
 */
export function checkApi({ sections, source }) {
  const errors = [];
  for (const [prop, , , defaultValue] of dataRows(sections.get('API'))) {
    if (prop.startsWith('...')) continue;
    if (!source.includes(prop))
      errors.push(`API prop ${prop} isn't implemented.`);
    if (
      defaultValue !== '-' &&
      !source.includes(`${prop} = '${defaultValue}'`)
    ) {
      errors.push(
        `RX-03: ${prop} must default to '${defaultValue}' in the signature.`,
      );
    }
  }
  return errors;
}

/**
 * @param {{ changedFiles: string[], componentDirectory: string, spec: string, facts: string }} options
 * @returns {string[]}
 */
export function checkScope({ changedFiles, componentDirectory, spec, facts }) {
  const errors = [];
  for (const file of changedFiles) {
    if (file === spec || file === facts) {
      errors.push(
        `${file} is the approved spec: amend it in its own PR, never here.`,
      );
    } else if (
      !file.startsWith(`${componentDirectory}/`) &&
      !ALWAYS_IN_SCOPE.includes(file) &&
      !REGISTRY.includes(file)
    ) {
      errors.push(`${file} is outside the build's scope.`);
    }
  }
  return errors;
}

/** Root-level untracked files are personal notes that `git add` never picks up. */
function changedSince(base) {
  const committed = git(['diff', '--name-only', `${base}...HEAD`]).output;
  const working = git(['diff', '--name-only', 'HEAD']).output;
  const untracked = git(['ls-files', '--others', '--exclude-standard']).output;
  return [
    ...new Set(
      [committed, working, untracked]
        .join('\n')
        .split('\n')
        .filter((file) => file.includes('/')),
    ),
  ];
}

function main() {
  const { values } = parseArgs({
    options: {
      component: { type: 'string' },
      base: { type: 'string', default: 'origin/main' },
    },
  });
  if (!values.component)
    throw new Error('Usage: check-component.js --component <name>');

  const paths = componentPaths(values.component);
  const specText = readFileSync(resolve(paths.spec), 'utf8');
  const spec = parseSpec(specText);
  const name = spec.meta.component;
  const directory = `${COMPONENTS}/${name}`;
  const errors = [];

  if (!existsSync(resolve(directory))) {
    errors.push(`${directory} doesn't exist.`);
  } else {
    const read = (file) => {
      const path = resolve(join(directory, file));
      return existsSync(path) ? readFileSync(path, 'utf8') : '';
    };
    errors.push(
      ...checkStructure({
        name,
        files: readdirSync(resolve(directory)),
        indexSource: read('index.ts'),
        specText,
        storySource: read(`${name}.stories.tsx`),
      }),
      ...checkTokens({
        expected: expectedTokens(spec),
        css: read(`${name}.module.css`),
      }),
      ...checkApi({
        sections: spec.sections,
        source: read(`${name}.tsx`) + read(`${name}.types.ts`),
      }),
    );
    if (
      !readFileSync(resolve(`${COMPONENTS}/index.ts`), 'utf8').includes(
        `'./${name}'`,
      )
    ) {
      errors.push(`${COMPONENTS}/index.ts doesn't export ${name}.`);
    }
    if (
      !readFileSync(resolve('packages/react/src/index.ts'), 'utf8').includes(
        name,
      )
    ) {
      errors.push(`packages/react/src/index.ts doesn't export ${name}.`);
    }
  }
  errors.push(
    ...checkScope({
      changedFiles: changedSince(values.base),
      componentDirectory: directory,
      spec: paths.spec,
      facts: paths.facts,
    }),
  );

  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  if (errors.length > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
