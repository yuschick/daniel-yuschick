import { defineConfig } from 'eslint/config';

import { createBaseConfig } from './eslint/index.js';

export default defineConfig(
  createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Stylelint resolves shared configs through their default export
    files: ['stylelint/index.js'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
);
