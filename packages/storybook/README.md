# `@dy/storybook`

One Storybook instance that documents every package. It owns no component stories: it reads them from each package's source. It does own the Foundations pages, which document the system across packages.

| Script  | Runs                                                 |
| :------ | :--------------------------------------------------- |
| `dev`   | Storybook on http://localhost:6006                   |
| `build` | A static build in `storybook-static/`                |
| `test`  | Every story as a Vitest browser test, checked by axe |
| `lint`  | ESLint and Stylelint on the config and Foundations   |

## How stories are found

`.storybook/main.ts` globs `*.stories.tsx` and `*.mdx` from `packages/react/src`, and `*.mdx` from this package's `src/`. Add a glob there when another package gets stories.

Stories are read from source, not from a package's `dist`, so two things have to work the way they do in that package:

- **Path aliases.** Vite's `resolve.tsconfigPaths` resolves each file through its nearest `tsconfig.json`, so `@package-*` imports in `packages/react` use that package's `paths`. Storybook never lists the aliases itself.
- **CSS Modules.** Vite handles `*.module.css` natively, and `@layer` blocks pass through unchanged.

`preview.ts` loads the token CSS (through `@dy/css/global.css`), so `dev`, `build` and `test` depend on `^build` (see `turbo.json`).

## Global CSS and fonts

Inclusive Sans comes from `@dy/fonts`, and reaches Storybook's two apps in two ways:

- **Stories and docs pages** (the preview iframe): `preview.ts` imports `@dy/css/global.css`, which imports `@dy/fonts/inclusive-sans.css`, and Vite bundles the font files.
- **Storybook's own UI** (the manager): it's a prebuilt app that can't import CSS, so `main.ts` serves the package's `assets/` folder at `/dy-fonts` through `staticDirs`, and `managerHead` links its CSS and preloads the roman font.

`preview.ts` loads everything through one import, `@dy/css/global.css`: the reset, the fonts and the token CSS. The reset applies `--dy-font-family-body` to `body`. Without it, the font is declared but nothing uses it. The reset sits in `@layer dy.reset`, so Storybook's own unlayered docs styles still beat it. `preview.css` is unlayered for now, and can move into `@layer dy.base` once there are base styles to share with the apps.

`theme.ts` sets Storybook's `fontBase` from `--dy-font-family-body` in the token manifest, and is used by the manager (`manager.ts`) and by the docs pages (`parameters.docs.theme`). Storybook's theme can't read CSS custom properties, so the manifest keeps the font stack from being typed out twice.

## Documentation

`preview.ts` sets the sidebar order and turns on autodocs for every story file, so each component gets a Documentation page. Its props table is grouped and filled in by `createArgType` and `createAdditionalTableGroups` (FS-07).

## Foundations

`src/foundations/` holds pages about the system as a whole, starting with **Foundations/Design Tokens** (`DesignTokens.mdx`). Its doc blocks in `src/foundations/blocks/` read everything from `@dy/tokens/manifest.json`, so the page can't drift from what the token build ships and verifies:

- Swatches, bars and specimens use the live custom properties, not copied values.
- Colors and contrast ratios render one column per entry in the manifest's `modes`. Each swatch sets `color-scheme` to its mode, so once dark mode ships through `light-dark()`, it appears as a second column with no change to the page.
- Contrast ratios are the build's own measurements, never recomputed here.
- A token outside every documented prefix (`DOCUMENTED_PREFIXES` in `blocks/manifest.ts`) is listed at the top of the page, so a token synced from a new Figma collection can't go unseen.

The blocks are Storybook's own UI rather than components, so their CSS sits in `@layer dy.base`, shares one CSS Module, and renders inside `<Unstyled>` to keep Storybook's docs typography out. Docs pages aren't run as tests, so axe doesn't check this page in CI: check it with the Accessibility panel after changing it.

## Tests

Every story is a test (FS-05). The Vitest addon renders each story in headless Chromium through Playwright, runs its `play` function, then runs axe. `a11y.test: 'error'` makes any axe violation fail the test (A11Y-14).

Two browser commands in `.storybook/browserCommands.mjs` let stories check what `userEvent` can't reach: `emulateMedia` for forced colors and reduced motion, and `forcePseudoState` for `:hover`, `:active` and `:focus-visible`. Stories call them through `getBrowserCommands()`, which returns `undefined` in the Storybook UI. They replace Vitest's general `cdp()` API, which Storybook keeps locked because unlocking it also allows file writes and code execution through the Vitest API.

Playwright's browser is not installed by `pnpm install`. Install it once per machine:

```sh
pnpm --filter @dy/storybook exec playwright install chromium
```
