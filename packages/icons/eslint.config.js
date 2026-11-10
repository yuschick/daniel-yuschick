import { defineConfig } from 'eslint/config';

import { createReactConfig } from '@dy/configs/eslint-react';

export default defineConfig(
  // Generated on every build from src/icons.json; scripts/generate.test.js
  // covers what the generator writes.
  { ignores: ['src/react/index.ts', 'src/react/icons/'] },
  createReactConfig({ tsconfigRootDir: import.meta.dirname }),
);
