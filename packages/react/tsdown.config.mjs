import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'browser',
  unbundle: true,
  dts: true,
  tsconfig: 'tsconfig.json',
  clean: true,
  css: { inject: true },
  deps: { neverBundle: ['react', 'react-dom'] },
});
