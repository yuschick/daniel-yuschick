import { preferShorthand } from './plugin/rules/prefer-shorthand.js';
import {
  SYSTEM_COLORS,
  systemColorsInForcedColors,
} from './plugin/rules/system-colors-in-forced-colors.js';

const GLOBAL_KEYWORDS = [
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
];

/**
 * Values allowed for a token-driven property: a system token
 * (`--dy-[name]-*`), a component token (`--[component]-[name]-*`, CSS-07)
 * or a CSS keyword.
 *
 * @param {{ token: string, keywords?: string[] }} options
 * @returns {string[]}
 */
function tokenValues({ token, keywords = [] }) {
  return [
    // Prettier wraps long var() values, so whitespace can sit inside the parens.
    `/var\\(\\s*--dy-${token}-[^)]*\\)/`,
    `/var\\(\\s*--[a-z]+(-[a-z]+)*-${token}(-[a-z]+)*\\s*\\)/`,
    ...keywords,
    ...GLOBAL_KEYWORDS,
  ];
}

/**
 * The shared Stylelint configuration for native CSS in every package.
 *
 * @type {import('stylelint').Config}
 */
const config = {
  extends: [
    'stylelint-config-recommended',
    'stylelint-plugin-defensive-css/configs/recommended',
    'stylelint-plugin-logical-css/configs/recommended',
  ],
  plugins: [
    preferShorthand,
    systemColorsInForcedColors,
    'stylelint-order',
    'stylelint-plugin-defensive-css',
    'stylelint-plugin-logical-css',
  ],
  // GEN-01: every disable comment explains itself
  reportDescriptionlessDisables: true,
  rules: {
    // Consecutive statements such as `@import` stay grouped, with no blank line
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment'],
      },
    ],
    // Semantic tokens only, including inside shorthands such as `border`, which
    // the allowed list below can't see into
    'color-named': 'never',
    'color-no-hex': true,
    'custom-property-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      { message: 'Expected CSS custom properties to be written in kebab-case' },
    ],
    'declaration-block-no-duplicate-properties': true,
    'declaration-empty-line-before': [
      'always',
      {
        except: ['after-declaration', 'first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'declaration-no-important': true,
    // Semantic tokens only: no hardcoded colors, spacing, type or radii
    'declaration-property-value-allowed-list': {
      '/border-radius/': tokenValues({
        token: 'border-radius',
        keywords: ['0'],
      }),
      '/box-shadow/': [
        '/var\\(--dy-(color|elevation)(-[a-z]+)*\\)/',
        '/var\\(--[a-z]+(-[a-z]+)*-(color|elevation)(-[a-z]+)*\\)/',
        'none',
        ...GLOBAL_KEYWORDS,
      ],
      '/color/': tokenValues({
        token: 'color',
        // `dy/system-colors-in-forced-colors` keeps system colors in forced colors
        keywords: ['currentColor', 'transparent', ...SYSTEM_COLORS],
      }),
      'font-size': tokenValues({ token: 'font-size' }),
      'font-weight': tokenValues({ token: 'font-weight' }),
      'line-height': tokenValues({ token: 'line-height' }),
      '/margin|padding|gap/': tokenValues({
        token: 'space',
        keywords: ['0', 'auto'],
      }),
    },
    'declaration-property-unit-disallowed-list': {
      '/^(animation|transition)/': ['ms', 's'],
      '/^(border|font|gap|inset|margin|outline|padding)/': [
        'em',
        'pt',
        'px',
        'rem',
      ],
    },
    'declaration-property-value-no-unknown': true,
    // CSS-02: all styles live in a cascade layer. @dy/css owns the order, and
    // its tests keep these names identical to it.
    'defensive-css/require-at-layer': [
      true,
      {
        supportedLayerNames: [
          'dy.base',
          'dy.react',
          'dy.reset',
          'dy.themes',
          'dy.tokens',
          'dy.utilities',
        ],
        severity: 'error',
      },
    ],
    'defensive-css/require-system-font-fallback': [
      true,
      { ignore: ['var\\(--dy-font-family.*\\)'] },
    ],
    // CSS-14: two or more longhands of one shorthand must be that shorthand
    'dy/prefer-shorthand': true,
    // CSS-08: system colors only where forced colors apply
    'dy/system-colors-in-forced-colors': true,
    'function-disallowed-list': [
      'color',
      'color-mix',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
      'rgb',
      'rgba',
    ],
    'max-nesting-depth': 3,
    'no-unknown-animations': true,
    'order/order': ['custom-properties', 'declarations', 'at-rules'],
    'order/properties-alphabetical-order': true,
    // `composes` is the native CSS Modules composition keyword (CSS-05)
    'property-no-unknown': [true, { ignoreProperties: ['composes'] }],
    'rule-empty-line-before': [
      'always',
      { except: ['first-nested', 'after-single-line-comment'] },
    ],
    'selector-attribute-quotes': 'always',
    // CSS-01: kebab-case class names
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      { message: 'Expected CSS class names to be written in kebab-case' },
    ],
  },
};

export default config;
