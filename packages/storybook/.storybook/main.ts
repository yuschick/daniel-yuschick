import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

// The folder holding @dy/fonts' CSS and font files, found through its exports.
const fontsDirectory = dirname(
  fileURLToPath(import.meta.resolve('@dy/fonts/inclusive-sans.css')),
);

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // One instance documents every package. Stories are read from source, so a
  // package's own tsconfig paths and CSS Modules apply, not its built output.
  // Foundations pages document the system across packages, so they live here.
  stories: [
    '../src/**/*.mdx',
    '../../react/src/**/*.mdx',
    '../../react/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  core: { disableTelemetry: true },
  // The manager UI is a prebuilt app that can't import CSS, so it gets the
  // fonts as static files, loaded by `managerHead`. Stories import them in
  // `preview.ts` instead.
  staticDirs: [{ from: fontsDirectory, to: '/dy-fonts' }],
  managerHead: (head) => `${head ?? ''}
    <link rel="preload" href="./dy-fonts/InclusiveSans-Latin-VariableFont_wght.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="./dy-fonts/inclusive-sans.css">
  `,
  docs: { defaultName: 'Documentation' },
  viteFinal: (viteConfig) =>
    // Resolve each file's imports through its nearest tsconfig.json, so
    // `@package-*` aliases work without Storybook knowing about them.
    mergeConfig(viteConfig, { resolve: { tsconfigPaths: true } }),
};

export default config;
