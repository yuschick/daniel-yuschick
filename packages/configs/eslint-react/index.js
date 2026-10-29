import eslintReact from '@eslint-react/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';

import { createBaseConfig, restrictedSyntax } from '../eslint/index.js';
import { dyPlugin } from './plugin/index.js';

/**
 * The shared ESLint configuration for React packages: the base config plus
 * React, hooks and accessibility rules, and the custom `dy` rules.
 *
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function createReactConfig({ tsconfigRootDir }) {
  return defineConfig(
    createBaseConfig({ tsconfigRootDir }),
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        eslintReact.configs['strict-type-checked'],
        reactHooks.configs.flat.recommended,
        jsxA11y.configs.strict,
      ],
      plugins: {
        dy: dyPlugin,
      },
      rules: {
        // RX-01: components are named functions, so their display name is derived
        '@eslint-react/no-missing-component-display-name': 'error',
        'dy/one-component-per-file': 'error',
        'dy/ref-naming': 'error',
        'dy/rest-spread-name': 'error',
        'no-restricted-syntax': [
          'error',
          ...restrictedSyntax,
          {
            selector:
              "AssignmentExpression > MemberExpression.left[property.name='displayName']",
            message:
              'Name the render function instead of assigning displayName (RX-01).',
          },
        ],
      },
    },
    // Stories and internal utilities
    {
      files: ['**/*.stories.tsx', '**/internal/**'],
      rules: {
        'dy/one-component-per-file': 'off',
        // Storybook requires a default export for the story metadata object
        'import-x/no-default-export': 'off',
        'no-restricted-syntax': 'off',
        'react-hooks/rules-of-hooks': 'warn',
      },
    },
  );
}

/**
 * The shared ESLint configuration for Next.js apps: the React config plus the
 * Next.js Core Web Vitals rules.
 *
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function createNextConfig({ tsconfigRootDir }) {
  return defineConfig(
    createReactConfig({ tsconfigRootDir }),
    {
      extends: [nextPlugin.configs['core-web-vitals']],
    },
    {
      // App Router files must default-export their component
      files: [
        '**/app/**/{default,error,global-error,layout,loading,not-found,page,template}.tsx',
      ],
      rules: {
        'import-x/no-default-export': 'off',
      },
    },
  );
}
