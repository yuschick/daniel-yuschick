import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { lintStyleSheet } from './lint-styles.js';

/*
 ** Runs the real Stylelint and config, as the hook does. The defects are the two
 ** that reached the end of the first Logo build unseen.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const FILE = 'packages/react/src/components/Chip/Chip.module.css';

const CLEAN = `@layer dy.react {
  .chip {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--chip-space-gap);
  }
}
`;

const lint = (source) => lintStyleSheet({ file: FILE, source, root: ROOT });

describe('linting a style sheet after an edit', () => {
  it('passes a clean style sheet', () => {
    assert.deepEqual(lint(CLEAN), []);
  });

  it('catches a keyword where a space token belongs', () => {
    const problems = lint(
      CLEAN.replace(
        'gap: var(--chip-space-gap);',
        'gap: var(--chip-space-gap);\n\n    &.lockup-mark {\n      --chip-space-gap: normal;\n    }',
      ),
    );
    assert.equal(problems.length, 1);
    assert.match(
      problems[0],
      /^packages\/react\/src\/components\/Chip\/Chip\.module\.css:\d+:\d+: .*declaration-property-value-allowed-list/,
    );
  });

  it('catches a flex container with no flex-wrap', () => {
    const problems = lint(CLEAN.replace('    flex-wrap: nowrap;\n', ''));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /flex-wrap/);
  });

  it('fails closed when Stylelint is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'dy-lint-'));
    try {
      const problems = lintStyleSheet({ file: FILE, source: CLEAN, root });
      assert.equal(problems.length, 1);
      assert.match(problems[0], /couldn't run/);
    } finally {
      rmSync(root, { recursive: true });
    }
  });
});
