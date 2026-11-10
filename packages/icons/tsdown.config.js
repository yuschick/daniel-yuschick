import { defineConfig } from 'tsdown';

// scripts/generate.js writes src/react/index.ts and src/react/icons/ first.
// Unbundled, every icon stays its own module, so an app only ships the icons
// it imports.
export default defineConfig({
  entry: ['src/react/index.ts'],
  outDir: 'dist/react',
  format: 'esm',
  platform: 'browser',
  unbundle: true,
  dts: true,
  tsconfig: 'tsconfig.json',
  clean: true,
  deps: { neverBundle: ['react', 'react/jsx-runtime'] },
});
