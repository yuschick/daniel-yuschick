import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve the `@package-*` aliases from tsconfig.json `paths`
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.mjs'],
  },
});
