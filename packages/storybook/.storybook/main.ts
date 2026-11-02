import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // One instance documents every package. Stories are read from source, so a
  // package's own tsconfig paths and CSS Modules apply, not its built output.
  stories: [
    '../../react/src/**/*.mdx',
    '../../react/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) =>
    // Resolve each file's imports through its nearest tsconfig.json, so
    // `@package-*` aliases work without Storybook knowing about them.
    mergeConfig(viteConfig, { resolve: { tsconfigPaths: true } }),
};

export default config;
