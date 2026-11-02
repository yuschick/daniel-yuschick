import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Every story is a test: it renders in a real browser, runs its play
// function and is checked by axe (FS-05, A11Y-14).
export default defineConfig({
  plugins: [
    storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
