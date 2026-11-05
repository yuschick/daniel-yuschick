import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import stylelint from 'stylelint';

import config from './index.js';

const lint = async (declarations, wrap = (body) => body) => {
  const code = `@layer dy.react {\n  .box {\n    ${wrap(declarations)}\n  }\n}\n`;
  const { results } = await stylelint.lint({
    code,
    config,
    configBasedir: import.meta.dirname,
  });
  return results[0].warnings.map(({ rule }) => rule);
};

const inForcedColors = (body) =>
  `@media (forced-colors: active) {\n      ${body}\n    }`;

describe('shorthands (CSS-14)', () => {
  for (const [name, declarations] of [
    ['padding', 'padding-block: 0;\n padding-inline: 0;'],
    [
      'border',
      'border-color: transparent;\n border-style: solid;\n border-width: var(--dy-border-width-default);',
    ],
    [
      'outline',
      'outline-color: transparent;\n outline-style: none;\n outline-width: var(--dy-border-width-focus);',
    ],
    [
      'font',
      'font-family: var(--dy-font-family-body);\n font-size: var(--dy-font-size-body-m);',
    ],
    [
      'transition',
      'transition-duration: var(--dy-motion-duration-fast);\n transition-property: color;',
    ],
  ]) {
    it(`rejects ${name} written as longhands`, async () => {
      assert.ok((await lint(declarations)).includes('dy/prefer-shorthand'));
    });
  }

  it('accepts one longhand, which the shorthand would over-reach', async () => {
    assert.deepEqual(await lint('padding-inline: var(--dy-space-m);'), []);
  });

  it('accepts font longhands the shorthand cannot express alone', async () => {
    assert.deepEqual(
      await lint(
        'font-weight: var(--dy-font-weight-strong);\n line-height: var(--dy-font-line-height-tight);',
      ),
      [],
    );
  });

  it('accepts token-driven shorthands', async () => {
    assert.deepEqual(
      await lint(
        [
          'border: var(--dy-border-width-default) solid var(--box-color-border);',
          'font: var(--dy-font-weight-strong) var(--box-font-size) / var(--dy-font-line-height-tight) var(--dy-font-family-body);',
          'outline: var(--dy-border-width-focus) var(--box-outline-style) var(--dy-color-border-focus);',
          'padding: var(--dy-space-xs) var(--box-space-padding-inline);',
          'transition: color var(--dy-motion-duration-fast) var(--dy-motion-easing-standard);',
        ].join('\n'),
      ),
      [],
    );
  });
});

describe('hardcoded values in shorthands', () => {
  for (const [name, declaration, rule] of [
    ['a hex color', 'border: 1px solid #fff;', 'color-no-hex'],
    ['a named color', 'outline: thin solid red;', 'color-named'],
    [
      'a color function',
      'border-color: rgb(0 0 0);',
      'function-disallowed-list',
    ],
    [
      'a raw length',
      'padding: var(--dy-space-xs) 4px;',
      'declaration-property-unit-disallowed-list',
    ],
    [
      'a raw duration',
      'transition: color 200ms;',
      'declaration-property-unit-disallowed-list',
    ],
  ]) {
    it(`rejects ${name}`, async () => {
      assert.ok((await lint(declaration)).includes(rule));
    });
  }
});

describe('system colors (CSS-08)', () => {
  for (const keyword of [
    'ButtonFace',
    'ButtonText',
    'Canvas',
    'CanvasText',
    'GrayText',
    'Highlight',
    'HighlightText',
    'LinkText',
  ]) {
    it(`accepts ${keyword} inside forced colors`, async () => {
      assert.deepEqual(
        await lint(`--box-color-text: ${keyword};`, inForcedColors),
        [],
      );
    });

    it(`rejects ${keyword} outside forced colors`, async () => {
      assert.ok(
        (await lint(`--box-color-text: ${keyword};`)).includes(
          'dy/system-colors-in-forced-colors',
        ),
      );
    });
  }
});
