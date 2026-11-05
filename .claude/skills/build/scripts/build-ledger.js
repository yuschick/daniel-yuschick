import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { buildBundle } from '../../spec/scripts/bundle-review.js';
import { parseSpec } from '../../spec/scripts/check-spec.js';
import { componentPaths, git, readRun, treeHash } from './shared.js';

const SENTENCE_END = /(?<=\.)\s+(?=[A-Z`])/;
const CHECKLIST_ITEM = /^- \[ \] (.+)$/gm;
const CITED_RULE = /\b(?:A11Y|CSS|FS|GEN|PROP|RX|TS)-\d+\b/g;
// Rules lint or a gate fully enforces (see AGENTS.md), so a reviewer needn't repeat them.
const TOOL_ENFORCED = new Set([
  'CSS-01',
  'CSS-02',
  'CSS-10',
  'CSS-14',
  'FS-06',
  'FS-07',
  'GEN-01',
  'GEN-02',
  'RX-04',
  'RX-05',
  'RX-06',
  'TS-06',
  'TS-07',
]);

const dataRows = (section) => section?.rows.slice(1) ?? [];

const sentences = (section) =>
  section.text.join(' ').trim().split(SENTENCE_END).filter(Boolean);

/**
 * Numbers everything the spec requires, so a review can't skip a row and a
 * script can prove it didn't.
 *
 * @param {{ sections: Map<string, { text: string[], rows: string[][] }> }} spec
 * @returns {{ id: string, section: string, requirement: string }[]}
 */
export function buildLedger({ sections }) {
  const rows = (prefix, section, describe) =>
    dataRows(sections.get(section)).map((cells, index) => ({
      id: `${prefix}${index + 1}`,
      section,
      requirement: describe(cells),
    }));

  return [
    ...sentences(sections.get('Purpose')).map((requirement, index) => ({
      id: `P${index + 1}`,
      section: 'Purpose',
      requirement,
    })),
    ...sentences(sections.get('Anatomy')).map((requirement, index) => ({
      id: `AN${index + 1}`,
      section: 'Anatomy',
      requirement,
    })),
    ...rows(
      'A',
      'API',
      ([prop, type, values, defaultValue]) =>
        `\`${prop}\`: ${type}; values ${values}; default ${defaultValue}`,
    ),
    {
      id: 'T1',
      section: 'Figma tokens',
      requirement:
        'The Conformance story derives every Figma tokens row from the facts, and every field it ignores traces to a Decision or an Anatomy statement.',
    },
    ...rows('X', 'Additional tokens', ([token, use]) => `\`${token}\`: ${use}`),
    ...rows('B', 'Behavior and accessibility', ([requirement]) => requirement),
    ...rows('O', 'Out of scope', ([item]) => `Must not be built: ${item}`),
    ...dataRows(sections.get('Decisions')).map(([id, decision]) => ({
      id,
      section: 'Decisions',
      requirement: decision,
    })),
  ];
}

const isToolEnforced = (requirement) => {
  const rules = requirement.match(CITED_RULE) ?? [];
  return rules.length > 0 && rules.every((rule) => TOOL_ENFORCED.has(rule));
};

/**
 * Every Pre-Submission Checklist item a tool doesn't already enforce becomes a
 * row, so skipping an accessibility or coding standard fails validation, rather
 * than going unnoticed.
 *
 * @param {Record<string, string>} standards File name to its Markdown
 * @returns {{ id: string, section: string, requirement: string }[]}
 */
export function buildStandardsLedger(standards) {
  const items = Object.keys(standards)
    .sort()
    .flatMap((file) =>
      [...standards[file].matchAll(CHECKLIST_ITEM)]
        .filter(([, requirement]) => !isToolEnforced(requirement))
        .map(([, requirement]) => ({
          section: `Standards: ${file.replace('.md', '')}`,
          requirement,
        })),
    );
  return items.map((item, index) => ({ id: `STD${index + 1}`, ...item }));
}

/**
 * The only prompt a reviewer may start with, which the hook enforces. If the
 * author wrote it, the author could brief the reviewer, and it wouldn't be cold.
 *
 * @param {{ spec: string, bundle: string, facts: string, screenshots: string[] }} paths
 * @returns {string}
 */
export function buildReviewerPrompt({ spec, bundle, facts, screenshots }) {
  return [
    `Spec: ${spec}`,
    `Bundle: ${bundle}`,
    `Facts: ${facts}`,
    ...(screenshots.length > 0
      ? [`Screenshots: ${screenshots.join(', ')}`]
      : []),
  ].join('\n');
}

function collectFiles(directory) {
  return readdirSync(resolve(directory))
    .sort()
    .map((file) => join(directory, file));
}

function main() {
  const { values } = parseArgs({
    options: {
      component: { type: 'string' },
      standards: { type: 'string', default: 'brain/standards' },
      screenshot: { type: 'string', multiple: true, default: [] },
    },
  });
  if (!values.component)
    throw new Error('Usage: build-ledger.js --component <name>');

  const paths = componentPaths(values.component);
  const markdown = readFileSync(resolve(paths.spec), 'utf8');
  const spec = parseSpec(markdown);
  const { payload } = JSON.parse(readFileSync(resolve(paths.facts), 'utf8'));
  const standards = Object.fromEntries(
    readdirSync(resolve(values.standards))
      .filter((file) => file.endsWith('.md') && file !== 'README.md')
      .map((file) => [
        file,
        readFileSync(resolve(values.standards, file), 'utf8'),
      ]),
  );

  const ledger = [...buildLedger(spec), ...buildStandardsLedger(standards)];
  const directory = `packages/react/src/components/${spec.meta.component}`;
  const code = collectFiles(directory);
  const gates = JSON.parse(
    readFileSync(resolve(paths.cache, 'gates.json'), 'utf8'),
  );
  const hash = treeHash();
  if (!gates.passed || gates.treeHash !== hash) {
    throw new Error(
      'Run the gates on this exact code first: they must pass before a review.',
    );
  }
  const sharedDiff = git([
    'diff',
    readRun(paths.cache)?.base ?? 'origin/main',
    '--',
    'brain/standards',
    'packages/react/src/types',
    'packages/react/src/index.ts',
    'packages/react/src/components/index.ts',
  ]).output;

  const bundle = [
    '# Component review bundle',
    `Tree hash: ${hash}`,
    '## Code under review',
    code.map((file) => `- ${file}`).join('\n'),
    '## Changes outside the component folder',
    sharedDiff ? `\`\`\`diff\n${sharedDiff}\n\`\`\`` : 'None.',
    '## Gate results',
    gates.gates
      .map(
        (gate) =>
          `- ${gate.name}: ${gate.passed ? 'passed' : 'failed'} (\`${gate.command}\`)`,
      )
      .join('\n'),
    '## Ledger',
    '| ID | Section | Requirement |\n| :-- | :-- | :-- |\n' +
      ledger
        .map(
          ({ id, section, requirement }) =>
            `| ${id} | ${section} | ${requirement.replaceAll('\n', ' ')} |`,
        )
        .join('\n'),
    buildBundle({ markdown, payload, standards, isBuildReview: true }),
  ].join('\n\n');

  mkdirSync(resolve(paths.cache), { recursive: true });
  const bundlePath = `${paths.cache}/review-bundle.md`;
  const promptPath = `${paths.cache}/reviewer-prompt.txt`;
  writeFileSync(resolve(bundlePath), bundle);
  writeFileSync(
    resolve(paths.cache, 'ledger.json'),
    JSON.stringify(ledger, null, 2),
  );
  writeFileSync(
    resolve(promptPath),
    buildReviewerPrompt({
      spec: paths.spec,
      bundle: bundlePath,
      facts: paths.facts,
      screenshots: values.screenshot,
    }),
  );
  console.log(
    `${promptPath}\n${ledger.length} ledger rows, ${bundle.length} characters.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
