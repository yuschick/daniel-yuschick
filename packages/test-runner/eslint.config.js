import { createBaseConfig } from '@dy/configs/eslint';

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Node loads a test reporter from its default export, the same way tools
    // load `*.config.js`, which the shared config already exempts (RX-04)
    files: ['src/reporters/*.js'],
    ignores: ['**/*.test.js'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
];
