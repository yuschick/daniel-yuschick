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

## Tests

Every story is a test (FS-05). The Vitest addon renders each story in headless Chromium through Playwright, runs its `play` function, then runs axe. `a11y.test: 'error'` makes any axe violation fail the test (A11Y-14).

Playwright's browser is not installed by `pnpm install`. Install it once per machine:

```sh
pnpm --filter @dy/storybook exec playwright install chromium
```
