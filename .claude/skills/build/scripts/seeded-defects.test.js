import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, afterEach, before, describe, it } from 'node:test';

/*
 ** Checks the checker: each defect below is something a build must never get
 ** away with, seeded into a throwaway repo and run through the real script. The
 ** unit tests call one function at a time, so they can't see gaps between them.
 */

const CHECK_COMPONENT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'check-component.js',
);
const COMPONENT = 'packages/react/src/components/Chip';
const BASE_TAG = 'fixture-base';

const SPEC = `---
component: Chip
---

## Purpose

A chip.

## Anatomy

A \`<span>\`.

## API

| Prop | Type | Values | Default | Figma | Source |
| :-- | :-- | :-- | :-- | :-- | :-- |
| size | \`Size\` | s, m | m | size | figma |
| isDisabled | \`boolean\` | - | - | - | PROP-05 |
| ...htmlAttributes | attrs | - | - | - | TS-01 |

## Figma tokens

| Layer | Property | When | Token | Source |
| :-- | :-- | :-- | :-- | :-- |
| root | fill | all | \`--dy-color-a\` | figma |

## Additional tokens

| Token | Use | Source |
| :-- | :-- | :-- |

## Behavior and accessibility

| Requirement | Source |
| :-- | :-- |
| Native span | A11Y-03 |

## Out of scope

| Item | Figma | Source |
| :-- | :-- | :-- |

## Decisions

| ID | Decision | Resolves | Source |
| :-- | :-- | :-- | :-- |

## Open questions

None.
`;

/** What is on `main` before the build starts. */
const BASE_FILES = {
  'package.json': '{ "private": true }\n',
  'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
  'packages/react/package.json': '{ "name": "@dy/react" }\n',
  'packages/react/specs/chip.md': SPEC,
  'packages/react/specs/chip.facts.json': '{}\n',
  'packages/react/src/types/common.ts':
    "export const SIZES = ['s', 'm'] as const;\n",
};

/** A build that follows the spec, so every failure comes from its seed. */
const BUILD_FILES = {
  'packages/react/src/index.ts': "export { Chip } from './components';\n",
  'packages/react/src/components/index.ts': "export { Chip } from './Chip';\n",
  [`${COMPONENT}/index.ts`]: "export { Chip } from './Chip';\n",
  [`${COMPONENT}/Chip.types.ts`]:
    "export interface ChipProps {\n  isDisabled?: boolean;\n  size?: 's' | 'm';\n}\n",
  [`${COMPONENT}/Chip.tsx`]:
    "export const Chip = function Chip({ isDisabled, size = 'm' }: ChipProps) {\n  return <span data-size={size} aria-disabled={isDisabled} />;\n};\n",
  [`${COMPONENT}/Chip.module.css`]:
    '.chip {\n  background-color: var(--dy-color-a);\n}\n',
  [`${COMPONENT}/Chip.stories.tsx`]:
    'export const Conformance = { play: () => checkConformance({}) };\n',
};

/** Each one edits a passing build. Edits that change nothing throw, so a seed can't pass vacuously. */
const SEEDED_DEFECTS = [
  {
    name: 'an invented token in the CSS',
    file: `${COMPONENT}/Chip.module.css`,
    edit: (source) => source.replace('--dy-color-a', '--dy-color-invented'),
    expected: /--dy-color-invented/,
  },
  {
    name: 'a dependency added to a package',
    file: 'packages/react/package.json',
    edit: (source) =>
      source.replace('"@dy/react"', '"@dy/react", "dependencies": {}'),
    expected: /packages\/react\/package\.json/,
  },
  {
    name: 'an invented prop',
    file: `${COMPONENT}/Chip.types.ts`,
    edit: (source) =>
      source.replace('isDisabled?', 'isLoading?: boolean;\n  isDisabled?'),
    expected: /isLoading/,
    knownGap: true,
  },
  {
    name: 'an invented value on a shared type',
    file: 'packages/react/src/types/common.ts',
    edit: (source) => source.replace("'m']", "'m', 'ghost']"),
    expected: /ghost/,
    knownGap: true,
  },
  {
    name: 'an invented token and raw colors inline in the TSX',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) =>
      source.replace(
        '<span ',
        "<span style={{ color: 'var(--dy-color-invented)', background: '#f00' }} ",
      ),
    expected: /--dy-color-invented|inline style/,
    knownGap: true,
  },
  {
    name: 'a dependency added at the repo root',
    file: 'package.json',
    edit: (source) =>
      source.replace('"private": true', '"private": true, "dependencies": {}'),
    expected: /package\.json/,
    knownGap: true,
  },
  {
    name: 'a bare lint suppression',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) => `// eslint-disable-next-line\n${source}`,
    expected: /GEN-01/,
    knownGap: true,
  },
];

describe('seeded defects', () => {
  let repo;

  const git = (...args) => {
    const result = spawnSync(
      'git',
      [
        '-c',
        'user.name=fixture',
        '-c',
        'user.email=fixture@example.com',
        ...args,
      ],
      { cwd: repo, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
  };

  const writeFiles = (files) => {
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      writeFileSync(join(repo, file), content);
    }
  };

  const commitAll = (message) => {
    git('add', '-A');
    git('commit', '--quiet', '--no-gpg-sign', '-m', message);
  };

  const runCheck = () => {
    const result = spawnSync(
      'node',
      [CHECK_COMPONENT, '--component', 'chip', '--base', BASE_TAG],
      { cwd: repo, encoding: 'utf8' },
    );
    return { status: result.status, output: result.stdout + result.stderr };
  };

  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'dy-seeded-defects-'));
    git('init', '--quiet');
    writeFiles(BASE_FILES);
    commitAll('base');
    git('tag', BASE_TAG);
    writeFiles(BUILD_FILES);
    commitAll('build');
  });

  afterEach(() => {
    git('reset', '--quiet', '--hard');
    git('clean', '--quiet', '-fd');
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('passes the build with nothing seeded', () => {
    const { status, output } = runCheck();
    assert.equal(status, 0, output);
  });

  for (const { name, file, edit, expected, knownGap } of SEEDED_DEFECTS) {
    it(
      `fails on ${name}`,
      { todo: knownGap ? 'A known gap in the checks' : false },
      () => {
        const path = join(repo, file);
        const source = readFileSync(path, 'utf8');
        const seeded = edit(source);
        assert.notEqual(seeded, source, 'The seed changed nothing.');
        writeFileSync(path, seeded);

        const { status, output } = runCheck();
        assert.notEqual(status, 0, `The checks passed:\n${output}`);
        assert.match(output, expected);
      },
    );
  }
});
