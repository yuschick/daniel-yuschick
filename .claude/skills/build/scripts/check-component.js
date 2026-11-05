import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import { checkApiTypes } from './check-api.js';
import {
  classifyPath,
  componentPaths,
  git,
  hashFile,
  readApprovals,
} from './shared.js';

const SYSTEM_TOKEN = /--dy-[a-z0-9-]+/g;
const INLINE_STYLE = /\bstyle\s*=\s*\{|\bstyle\s*:|\.style\b/;
const RAW_COLOR =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const SUPPRESSION =
  /(eslint-disable(?:-next-line|-line)?|stylelint-disable(?:-next-line|-line)?|@ts-expect-error|@ts-ignore)\b/g;
const ISSUE_REFERENCE = /#\d+|\/issues\/\d+/;
const MANIFEST = 'packages/tokens/dist/manifest.json';
const COMPONENTS = 'packages/react/src/components';

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
    // Backticks, so a word in the prose can't silently drop a required token.
    if (token.startsWith('--dy-') && !outOfScope.includes(`\`${property}\``)) {
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
 * Stories and tests may show any real token, but not one that doesn't exist.
 *
 * @param {{ sources: Record<string, string>, manifestTokens: Record<string, unknown> }} options
 * @returns {string[]}
 */
export function checkTokensExist({ sources, manifestTokens }) {
  return Object.entries(sources).flatMap(([file, source]) =>
    [...new Set(source.match(SYSTEM_TOKEN) ?? [])]
      .filter((token) => !(token.slice(2) in manifestTokens))
      .map((token) => `${file} uses ${token}, which doesn't exist.`),
  );
}

/**
 * Styling belongs in the CSS module, where Stylelint and the token check can see it.
 *
 * @param {{ sources: Record<string, string> }} options
 * @returns {string[]}
 */
export function checkInlineStyles({ sources }) {
  return Object.entries(sources).flatMap(([file, source]) =>
    source.split('\n').flatMap((line, index) => {
      const location = `${file}:${index + 1}`;
      return [
        ...(INLINE_STYLE.test(line)
          ? [`${location} sets an inline style. Styles belong in CSS.`]
          : []),
        ...(RAW_COLOR.test(line)
          ? [`CSS-01: ${location} hardcodes a color. Use a token.`]
          : []),
      ];
    }),
  );
}

/** Reads a directive's comment: to its closing marker if it has one, otherwise to the line's end. */
function readDirective(source, start) {
  const lineStart = source.lastIndexOf('\n', start) + 1;
  const isBlock = source.slice(lineStart, start).includes('/*');
  const end = source.indexOf(isBlock ? '*/' : '\n', start);
  return source.slice(start, end === -1 ? undefined : end);
}

/**
 * GEN-01: the exact rule, why it's bypassed, and a tracked path to resolving it.
 *
 * @param {{ sources: Record<string, string> }} options
 * @returns {string[]}
 */
export function checkSuppressions({ sources }) {
  const errors = [];
  for (const [file, source] of Object.entries(sources)) {
    for (const match of source.matchAll(SUPPRESSION)) {
      const location = `${file}:${source.slice(0, match.index).split('\n').length}`;
      const directive = match[1];
      if (directive === '@ts-ignore') {
        errors.push(
          `GEN-01: ${location} uses @ts-ignore. Use @ts-expect-error.`,
        );
        continue;
      }
      const [target, ...reason] = readDirective(source, match.index)
        .slice(directive.length)
        .split(' -- ');
      const explanation = reason.join(' -- ').trim();
      if (directive !== '@ts-expect-error' && target.trim() === '') {
        errors.push(`GEN-01: ${location} doesn't name the rule it suppresses.`);
      }
      if (explanation === '') {
        errors.push(`GEN-01: ${location} doesn't explain its suppression.`);
      } else if (!ISSUE_REFERENCE.test(explanation)) {
        errors.push(`GEN-01: ${location} doesn't cite a tracking issue.`);
      }
    }
  }
  return errors;
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
 * Each default sits in the signature (RX-03). The compiler proves the rest of
 * the API, in `check-api.js`.
 *
 * @param {{ sections: Map<string, { rows: string[][] }>, source: string }} options
 * @returns {string[]}
 */
export function checkDefaults({ sections, source }) {
  return dataRows(sections.get('API'))
    .filter(
      ([prop, , , defaultValue]) =>
        !prop.startsWith('...') &&
        defaultValue !== '-' &&
        !source.includes(`${prop} = '${defaultValue}'`),
    )
    .map(
      ([prop, , , defaultValue]) =>
        `RX-03: ${prop} must default to '${defaultValue}' in the signature.`,
    );
}

/**
 * FS-07: every prop in the spec has a row in the props table, and the component
 * keeps its Documentation page.
 *
 * @param {{ sections: Map<string, { rows: string[][] }>, storySource: string }} options
 * @returns {string[]}
 */
export function checkPropTable({ sections, storySource }) {
  const errors = dataRows(sections.get('API')).flatMap(([prop]) => {
    if (prop.startsWith('...')) {
      return storySource.includes('createAdditionalTableGroups(')
        ? []
        : [`FS-07: the stories need createAdditionalTableGroups for ${prop}.`];
    }
    const row = new RegExp(`['"]?${prop}['"]?\\s*:\\s*createArgType\\(`);
    return row.test(storySource)
      ? []
      : [`FS-07: the props table has no createArgType row for ${prop}.`];
  });
  if (storySource.includes('!autodocs')) {
    errors.push("FS-07: the stories can't opt out of the Documentation page.");
  }
  return errors;
}

/**
 * @param {{ changedFiles: string[], component: string, spec: string, facts: string, isApproved: (file: string) => boolean }} options
 * @returns {string[]}
 */
export function checkScope({
  changedFiles,
  component,
  spec,
  facts,
  isApproved,
}) {
  const errors = [];
  for (const file of changedFiles) {
    const access = classifyPath(file, component);
    if (file === spec || file === facts) {
      errors.push(
        `${file} is the approved spec: amend it in its own PR, never here.`,
      );
    } else if (access === 'deny') {
      errors.push(`${file} is outside the build's scope.`);
    } else if (access === 'ask' && !isApproved(file)) {
      errors.push(
        `${file} is a shared rule, changed without human approval. Only Daniel can approve it, when prompted.`,
      );
    }
  }
  return errors;
}

/** Only untracked files at the root are exempt: they're personal notes, never part of a build. */
function changedSince(base) {
  const committed = git(['diff', '--name-only', `${base}...HEAD`]).output;
  const working = git(['diff', '--name-only', 'HEAD']).output;
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .output.split('\n')
    .filter((file) => file.includes('/'));
  return [
    ...new Set(
      [...committed.split('\n'), ...working.split('\n'), ...untracked].filter(
        Boolean,
      ),
    ),
  ];
}

export const isExampleFile = (file) =>
  /\.(stories|test)\.tsx?$|\.mdx$/.test(file);

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
    const files = readdirSync(resolve(directory));
    const sources = Object.fromEntries(
      files.map((file) => [join(directory, file), read(file)]),
    );
    const shipped = Object.fromEntries(
      Object.entries(sources).filter(([file]) => !isExampleFile(file)),
    );
    const shippedScripts = Object.fromEntries(
      Object.entries(shipped).filter(([file]) => /\.tsx?$/.test(file)),
    );
    errors.push(
      ...checkStructure({
        name,
        files,
        indexSource: read('index.ts'),
        specText,
        storySource: read(`${name}.stories.tsx`),
      }),
      ...checkTokens({
        expected: expectedTokens(spec),
        css: Object.values(shipped).join('\n'),
      }),
      ...checkTokensExist({
        sources,
        manifestTokens: JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'))
          .tokens,
      }),
      ...checkInlineStyles({ sources: shippedScripts }),
      ...checkSuppressions({ sources }),
      ...checkDefaults({
        sections: spec.sections,
        source: read(`${name}.tsx`) + read(`${name}.types.ts`),
      }),
      ...checkPropTable({
        sections: spec.sections,
        storySource: read(`${name}.stories.tsx`),
      }),
      ...checkApiTypes({ spec, cache: paths.cache }),
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
  const approvals = readApprovals(paths.cache);
  errors.push(
    ...checkScope({
      changedFiles: changedSince(values.base),
      component: values.component,
      spec: paths.spec,
      facts: paths.facts,
      isApproved: (file) => approvals[file] === hashFile(file),
    }),
  );

  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  if (errors.length > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
