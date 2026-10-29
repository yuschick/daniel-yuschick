import { defineConfig } from 'eslint/config';

import { createBaseConfig } from '@dy/eslint-config';

export default defineConfig(
  createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Stylelint resolves shared configs through their default export
    files: ['index.js'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
);
