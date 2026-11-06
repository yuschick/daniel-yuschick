# `@dy/storybook`

One Storybook instance that documents every package. It owns no stories: it reads them from each package's source.

| Script  | Runs                                                 |
| :------ | :--------------------------------------------------- |
| `dev`   | Storybook on http://localhost:6006                   |
| `build` | A static build in `storybook-static/`                |
| `test`  | Every story as a Vitest browser test, checked by axe |
| `lint`  | ESLint on the Storybook config                       |

## How stories are found

`.storybook/main.ts` globs `*.stories.tsx` and `*.mdx` from `packages/react/src`. Add a glob there when another package gets stories.

Stories are read from source, not from a package's `dist`, so two things have to work the way they do in that package:

- **Path aliases.** Vite's `resolve.tsconfigPaths` resolves each file through its nearest `tsconfig.json`, so `@package-*` imports in `packages/react` use that package's `paths`. Storybook never lists the aliases itself.
- **CSS Modules.** Vite handles `*.module.css` natively, and `@layer` blocks pass through unchanged.

`preview.ts` loads the token CSS from `@dy/tokens/css/dy.css`, so `dev`, `build` and `test` depend on `^build` (see `turbo.json`).

## Fonts

Inclusive Sans comes from `@dy/fonts`, and reaches Storybook's two apps in two ways:

- **Stories and docs pages** (the preview iframe): `preview.ts` imports `@dy/fonts/inclusive-sans.css`, and Vite bundles the font files.
- **Storybook's own UI** (the manager): it's a prebuilt app that can't import CSS, so `main.ts` serves the package's `assets/` folder at `/dy-fonts` through `staticDirs`, and `managerHead` links its CSS and preloads the roman font.

`theme.ts` sets Storybook's `fontBase` from `--dy-font-family-body` in the token manifest, and is used by the manager (`manager.ts`) and by the docs pages (`parameters.docs.theme`). Storybook's theme can't read CSS custom properties, so the manifest keeps the font stack from being typed out twice.

## Documentation

`preview.ts` sets the sidebar order and turns on autodocs for every story file, so each component gets a Documentation page. Its props table is grouped and filled in by `createArgType` and `createAdditionalTableGroups` (FS-07).

## Tests

Every story is a test (FS-05). The Vitest addon renders each story in headless Chromium through Playwright, runs its `play` function, then runs axe. `a11y.test: 'error'` makes any axe violation fail the test (A11Y-14).

Two browser commands in `.storybook/browserCommands.mjs` let stories check what `userEvent` can't reach: `emulateMedia` for forced colors and reduced motion, and `forcePseudoState` for `:hover`, `:active` and `:focus-visible`. Stories call them through `getBrowserCommands()`, which returns `undefined` in the Storybook UI. They replace Vitest's general `cdp()` API, which Storybook keeps locked because unlocking it also allows file writes and code execution through the Vitest API.

Playwright's browser is not installed by `pnpm install`. Install it once per machine:

```sh
pnpm --filter @dy/storybook exec playwright install chromium
```
