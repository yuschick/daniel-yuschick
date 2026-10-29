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
    `/var\\(--dy-${token}-.*\\)/`,
    `/var\\(--[a-z]+(-[a-z]+)*-${token}(-[a-z]+)*\\)/`,
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
    'stylelint-order',
    'stylelint-plugin-defensive-css',
    'stylelint-plugin-logical-css',
  ],
  // GEN-01: every disable comment explains itself
  reportDescriptionlessDisables: true,
  rules: {
    'at-rule-empty-line-before': [
      'always',
      { except: ['first-nested'], ignore: ['after-comment'] },
    ],
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
        keywords: ['currentColor', 'transparent'],
      }),
      'font-size': tokenValues({ token: 'font-size' }),
      'font-weight': tokenValues({ token: 'font-weight' }),
      'line-height': tokenValues({ token: 'line-height' }),
      '/margin|padding|gap/': tokenValues({
        token: 'space',
        keywords: ['0', 'auto'],
      }),
    },
    'declaration-property-value-no-unknown': true,
    // CSS-02: all styles live in a cascade layer
    'defensive-css/require-at-layer': [
      true,
      {
        supportedLayerNames: [
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
