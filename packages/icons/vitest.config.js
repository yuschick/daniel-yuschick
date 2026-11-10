import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // scripts/*.test.js run under node --test
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.js'],
  },
});
