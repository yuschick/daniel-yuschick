import js from '@eslint/js';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import turbo from 'eslint-plugin-turbo';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * `no-restricted-syntax` selectors shared by every config. Exported so that
 * configs which add their own selectors can extend the list instead of
 * replacing it (ESLint overwrites rule options rather than merging them).
 */
export const restrictedSyntax = [
  {
    selector: 'ExportAllDeclaration',
    message:
      'Barrel exports (export * from) are not allowed. Use explicit named exports instead (RX-05).',
  },
  {
    selector: 'TSEnumDeclaration',
    message: 'Use a string-literal union instead of an enum (TS-07).',
  },
];

/**
 * The shared ESLint configuration for every package in the repository.
 *
 * TypeScript files are linted with type information, so each consumer passes
 * the directory that holds its `tsconfig.json`, normally `import.meta.dirname`.
 *
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function createBaseConfig({ tsconfigRootDir }) {
  return defineConfig(
    globalIgnores([
      '**/.next/',
      '**/.turbo/',
      '**/build/',
      '**/coverage/',
      '**/dist/',
      '**/out/',
      '**/next-env.d.ts',
    ]),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    comments.recommended,
    turbo.configs['flat/recommended'],
    // After the presets, so it turns off their rules that conflict with
    // Prettier, but before ours, so `curly: 'all'` (Prettier-safe) survives
    prettier,
    {
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
        sourceType: 'module',
      },
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
      settings: {
        // TypeScript reports unresolved imports, so the built-in Node
        // resolver is enough for classifying imports in `import-x/order`
        'import-x/resolver-next': [createNodeResolver()],
      },
      rules: {
        // GEN-01: suppressions must be targeted, described and scoped
        '@eslint-community/eslint-comments/disable-enable-pair': [
          'error',
          { allowWholeFile: false },
        ],
        '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
        '@eslint-community/eslint-comments/no-unused-disable': 'error',
        '@eslint-community/eslint-comments/require-description': [
          'error',
          { ignore: ['eslint-enable'] },
        ],

        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': [
          'error',
          { default: 'array', readonly: 'array' },
        ],
        '@typescript-eslint/member-ordering': [
          'error',
          { default: { order: 'natural-case-insensitive' } },
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          // Unused variables and parameters must start with an underscore
          {
            selector: ['variable', 'parameter'],
            modifiers: ['unused'],
            leadingUnderscore: 'require',
            format: null,
          },
          // camelCase values, PascalCase components
          {
            selector: ['variable', 'function'],
            format: ['camelCase', 'PascalCase'],
          },
          // UPPER_CASE for constant value sets such as SIZES (see props.md)
          {
            selector: 'variable',
            modifiers: ['const'],
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          },
          {
            selector: 'parameter',
            format: ['camelCase'],
          },
          {
            selector: 'parameter',
            modifiers: ['destructured'],
            format: ['camelCase'],
          },
          // Component-typed props and stories may be PascalCase
          {
            selector: ['parameter', 'typeProperty', 'objectLiteralProperty'],
            format: ['PascalCase', 'camelCase'],
            filter: { regex: '(Icon|Component|Story).*$', match: true },
          },
          {
            selector: 'parameter',
            modifiers: ['destructured'],
            format: ['PascalCase', 'camelCase'],
            filter: { regex: '(Icon|Component|Story).*$', match: true },
          },
          // Names that need quotes (e.g. 'aria-label') are exempt
          {
            selector: [
              'classProperty',
              'objectLiteralProperty',
              'typeProperty',
              'classMethod',
              'objectLiteralMethod',
              'typeMethod',
              'accessor',
            ],
            modifiers: ['requiresQuotes'],
            format: null,
          },
          {
            selector: ['class', 'interface', 'typeAlias'],
            format: ['PascalCase'],
          },
          {
            selector: ['property', 'accessor'],
            modifiers: ['public'],
            format: ['camelCase'],
          },
        ],
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            ignoreRestSiblings: false,
          },
        ],

        curly: ['error', 'all'],
        eqeqeq: ['error', 'always'],
        // GEN-02: descriptive identifiers
        'id-length': [
          'error',
          { min: 2, exceptions: ['_'], properties: 'never' },
        ],

        'import-x/first': 'error',
        'import-x/named': 'off',
        'import-x/namespace': 'off',
        'import-x/newline-after-import': 'error',
        'import-x/no-absolute-path': 'error',
        // RX-04: named exports only
        'import-x/no-default-export': 'error',
        'import-x/no-duplicates': 'error',
        'import-x/no-named-as-default': 'off',
        // TypeScript reports unresolved imports
        'import-x/no-unresolved': 'off',
        'import-x/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              ['object'],
              ['parent', 'sibling', 'index'],
            ],
            pathGroups: [
              { pattern: '@dy/**', group: 'internal', position: 'after' },
            ],
            pathGroupsExcludedImportTypes: ['builtin'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],

        'no-console': 'error',
        'no-extra-boolean-cast': [
          'error',
          { enforceForInnerExpressions: true },
        ],
        'no-prototype-builtins': 'off',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['src/*'],
                message: 'Import using a package name or a relative path.',
              },
              {
                group: ['@dy/react/*'],
                message:
                  'Import from the @dy/react entry point, not its internal files (RX-05).',
              },
            ],
          },
        ],
        // Prettier leaves backtick strings alone, so this keeps plain strings
        // single-quoted; template literals are still fine with interpolation
        quotes: ['error', 'single', { avoidEscape: true }],
        // Vite's built-in env flags on `import.meta.env`, not Turborepo env vars
        'turbo/no-undeclared-env-vars': [
          'error',
          { allowList: ['^BASE_URL$', '^DEV$', '^MODE$', '^PROD$', '^SSR$'] },
        ],
        'no-restricted-syntax': ['error', ...restrictedSyntax],
      },
    },
    // JavaScript files (mostly tool configs) aren't part of a tsconfig
    {
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
    },
    // Tools such as ESLint, Prettier and Next.js require a default export
    {
      files: ['**/*.config.{js,mjs,cjs,ts}'],
      rules: {
        'import-x/no-default-export': 'off',
      },
    },
  );
}
