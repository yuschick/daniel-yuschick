import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import {
  emulateMedia,
  forcePseudoState,
} from './.storybook/browserCommands.mjs';

// Every story is a test: it renders in a real browser, runs its play
// function and is checked by axe (FS-05, A11Y-14).
export default defineConfig({
  plugins: [
    storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }),
  ],
  test: {
    name: 'storybook',
    setupFiles: ['./.storybook/vitest.setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      commands: { emulateMedia, forcePseudoState },
      instances: [{ browser: 'chromium' }],
    },
  },
});
