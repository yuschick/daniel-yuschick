import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
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

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const CHECK_COMPONENT = resolve(SCRIPTS, 'check-component.js');
const REACT_MODULES = resolve(
  SCRIPTS,
  '../../../../packages/react/node_modules',
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
| ...htmlAttributes | \`SanitizedHTMLAttributes<React.HTMLAttributes<HTMLSpanElement>>\`, without className | - | - | - | TS-01 |

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
  '.gitignore': 'node_modules\n',
  'package.json': '{ "private": true }\n',
  'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
  'packages/tokens/dist/manifest.json': '{ "tokens": { "dy-color-a": {} } }\n',
  'packages/react/package.json': '{ "name": "@dy/react" }\n',
  'packages/react/specs/chip.md': SPEC,
  'packages/react/specs/chip.facts.json': '{}\n',
  'packages/react/tsconfig.json': JSON.stringify({
    compilerOptions: {
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      paths: {
        '@package-components/*': ['./src/components/*'],
        '@package-internal/*': ['./src/internal/*'],
        '@package-types/*': ['./src/types/*'],
      },
      skipLibCheck: true,
      strict: true,
      target: 'ES2022',
    },
    include: ['src'],
  }),
  'packages/react/src/internal/types/globals.d.ts': 'export {};\n',
  'packages/react/src/internal/types/type-helpers.ts':
    "export type SanitizedHTMLAttributes<T> = Omit<T, 'className' | 'style' & keyof T>;\nexport type SanitizedSVGAttributes<T> = T;\nexport type WithChildren<T> = T;\n",
  'packages/react/src/types/common.ts':
    "export const SIZES = ['s', 'm'] as const;\nexport type Size = (typeof SIZES)[number];\n",
};

/** A build that follows the spec, so every failure comes from its seed. */
const BUILD_FILES = {
  'packages/react/src/index.ts': "export { Chip } from './components';\n",
  'packages/react/src/components/index.ts': "export { Chip } from './Chip';\n",
  [`${COMPONENT}/index.ts`]: "export { Chip } from './Chip';\n",
  [`${COMPONENT}/Chip.types.ts`]:
    "import type { SanitizedHTMLAttributes } from '@package-internal/types/type-helpers';\nimport type { Size } from '@package-types/common';\n\nexport interface ChipProps extends SanitizedHTMLAttributes<React.HTMLAttributes<HTMLSpanElement>> {\n  isDisabled?: boolean;\n  size?: Size;\n}\n",
  [`${COMPONENT}/Chip.tsx`]:
    "import type { ChipProps } from './Chip.types';\n\nexport const Chip = function Chip({ isDisabled, size = 'm', ...htmlAttributes }: ChipProps) {\n  return <span {...htmlAttributes} data-size={size} aria-disabled={isDisabled} />;\n};\n",
  [`${COMPONENT}/Chip.module.css`]:
    '.chip {\n  background-color: var(--dy-color-a);\n}\n',
  [`${COMPONENT}/Chip.stories.tsx`]:
    "const argTypes = {\n  size: createArgType({ description: 'A size.', type: 'Size' }),\n  isDisabled: createArgType({ description: 'Disabled.', type: 'boolean' }),\n  ...createAdditionalTableGroups({ htmlAttributes: 'HTMLAttributes' }),\n};\n/** Compares each variant with Figma. */\nexport const Conformance = { argTypes, play: () => checkConformance({}) };\n",
};

let repo;

/** Each one edits a passing build. Edits that change nothing throw, so a seed can't pass vacuously. */
const SEEDED_DEFECTS = [
  {
    name: 'an invented token in the CSS',
    file: `${COMPONENT}/Chip.module.css`,
    edit: (source) => source.replace('--dy-color-a', '--dy-color-invented'),
    expected: /--dy-color-invented/,
  },
  {
    name: 'an invented token in the TSX',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) =>
      `${source}export const tone = 'var(--dy-color-invented)';\n`,
    expected: /--dy-color-invented, which isn't in the spec/,
  },
  {
    name: 'an invented token in a story',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) =>
      `${source}export const tone = 'var(--dy-color-invented)';\n`,
    expected: /--dy-color-invented, which doesn't exist/,
  },
  {
    name: 'an inline style',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) =>
      source.replace(
        '<span ',
        "<span style={{ background: 'var(--dy-color-a)' }} ",
      ),
    expected: /Chip\.tsx:\d+ sets an inline style/,
  },
  {
    name: 'a raw color in the TSX',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) => `${source}export const tone = '#ff0000';\n`,
    expected: /CSS-01: .*Chip\.tsx:\d+ hardcodes a color/,
  },
  {
    name: 'an invented prop',
    file: `${COMPONENT}/Chip.types.ts`,
    edit: (source) =>
      source.replace('isDisabled?', 'isLoading?: boolean;\n  isDisabled?'),
    expected: /Invented prop: .*isLoading/,
  },
  {
    name: 'a spec prop left out',
    file: `${COMPONENT}/Chip.types.ts`,
    edit: (source) => source.replace('  isDisabled?: boolean;\n', ''),
    expected: /Missing prop: .*isDisabled/,
  },
  {
    name: 'an invented value on a shared type',
    file: 'packages/react/src/types/common.ts',
    edit: (source) => source.replace("'m']", "'m', 'ghost']"),
    expected: /Invented value on size: .*ghost/,
  },
  {
    name: 'a spec value left out of a shared type',
    file: 'packages/react/src/types/common.ts',
    edit: (source) => source.replace("['s', 'm']", "['m']"),
    expected: /Missing value on size: .*"s"/,
  },
  {
    name: 'a bare lint suppression',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) => `// eslint-disable-next-line\n${source}`,
    expected: /GEN-01: .*doesn't name the rule/,
  },
  {
    name: 'a suppression with only a TODO',
    file: `${COMPONENT}/Chip.tsx`,
    edit: (source) =>
      `// eslint-disable-next-line some/rule -- Why. TODO: follow up\n${source}`,
    expected: /GEN-01: .*doesn't cite a tracking issue/,
  },
  {
    name: 'a spec prop left out of the props table',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) => source.replace(/ {2}isDisabled: .*\n/, ''),
    expected: /FS-07: .*no createArgType row for isDisabled/,
  },
  {
    name: 'native attributes left out of the props table',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) => source.replace(/ {2}\.\.\.createAdditional.*\n/, ''),
    expected: /FS-07: .*createAdditionalTableGroups/,
  },
  {
    name: 'a component opted out of its Documentation page',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) => `${source}export const meta = { tags: ['!autodocs'] };\n`,
    expected: /FS-07: .*Documentation page/,
  },
  {
    name: 'an arg with no row in the props table',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) => `const meta = { args: { onClick: fn() } };\n${source}`,
    expected: /FS-07: .*args set onClick/,
  },
  {
    name: 'a story with no description',
    file: `${COMPONENT}/Chip.stories.tsx`,
    edit: (source) =>
      source.replace('/** Compares each variant with Figma. */\n', ''),
    expected: /FS-07: the story Conformance has no description/,
  },
  {
    name: 'a dependency added to a package',
    file: 'packages/react/package.json',
    edit: (source) =>
      source.replace('"@dy/react"', '"@dy/react", "dependencies": {}'),
    expected: /ERROR: packages\/react\/package\.json is outside/,
  },
  {
    name: 'a dependency added at the repo root',
    file: 'package.json',
    edit: (source) =>
      source.replace('"private": true', '"private": true, "dependencies": {}'),
    expected: /ERROR: package\.json is outside/,
  },
  {
    name: 'an edited lockfile',
    file: 'pnpm-lock.yaml',
    edit: (source) => `${source}# edited\n`,
    expected: /ERROR: pnpm-lock\.yaml is outside/,
  },
  {
    name: 'a shared rule changed without approval',
    file: 'packages/react/src/types/common.ts',
    edit: (source) => `// A changed rule.\n${source}`,
    expected: /common\.ts is a shared rule, changed without human approval/,
  },
  {
    name: 'an approval forged for different content',
    file: 'packages/react/src/types/common.ts',
    edit: (source) => {
      writeFileSync(
        join(repo, 'node_modules/.cache/build/chip/approvals.json'),
        JSON.stringify({ 'packages/react/src/types/common.ts': 'stale' }),
      );
      return `// A changed rule.\n${source}`;
    },
    expected: /without human approval/,
  },
  {
    name: 'an edited spec',
    file: 'packages/react/specs/chip.md',
    edit: (source) => source.replace('A chip.', 'A better chip.'),
    expected: /approved spec/,
  },
];

describe('seeded defects', () => {
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
    repo = realpathSync(mkdtempSync(join(tmpdir(), 'dy-seeded-defects-')));
    git('init', '--quiet');
    writeFiles(BASE_FILES);
    // The real packages, so the fixture compiles with the real compiler.
    mkdirSync(join(repo, 'packages/react/node_modules'));
    for (const name of ['@types', 'react', 'typescript']) {
      symlinkSync(
        join(REACT_MODULES, name),
        join(repo, 'packages/react/node_modules', name),
      );
    }
    commitAll('base');
    git('tag', BASE_TAG);
    writeFiles(BUILD_FILES);
    commitAll('build');
    mkdirSync(join(repo, 'node_modules/.cache/build/chip'), {
      recursive: true,
    });
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

  for (const { name, file, edit, expected } of SEEDED_DEFECTS) {
    it(`fails on ${name}`, () => {
      const path = join(repo, file);
      const source = readFileSync(path, 'utf8');
      const seeded = edit(source);
      assert.notEqual(seeded, source, 'The seed changed nothing.');
      writeFileSync(path, seeded);

      const { status, output } = runCheck();
      assert.notEqual(status, 0, `The checks passed:\n${output}`);
      assert.match(output, expected);
    });
  }
});
