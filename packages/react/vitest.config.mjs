import { defineConfig } from 'vitest/config';

import { ResultsReporter } from '@dy/test-runner/vitest-reporter';

export default defineConfig({
  resolve: {
    // Resolve the `@package-*` aliases from tsconfig.json `paths`
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.mjs'],
    // Writes .test-results/vitest.json for @dy/test-runner
    reporters: ['default', new ResultsReporter({ suite: 'vitest' })],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.tsx'],
      reporter: ['text-summary'],
    },
  },
});
