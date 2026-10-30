# `@dy/tokens`

The DY Design System's design tokens, synced from Figma. Figma variables are the single source of truth: tokens change in Figma, never here.

## How tokens get here

1. A token changes in the Figma file (`HiDiGLs2OsVWyqnCo7aEjF`).
2. Daniel runs `/sync-tokens` in Claude Code. The [skill](../../.claude/skills/sync-tokens/SKILL.md) reads every variable collection through the Figma MCP, converts it with [`scripts/figma-to-dtcg.js`](scripts/figma-to-dtcg.js), and opens a PR with a summary from [`scripts/diff-tokens.js`](scripts/diff-tokens.js).
3. The PR is reviewed and merged.

## `src/`: generated, do not edit

One [W3C DTCG](https://www.designtokens.org/tr/drafts/format/) file per Figma collection and mode, e.g. `color.light.json` or `theme.rhubarb.json`. Values mirror Figma exactly: colors as sRGB color objects, dimensions in `px`, durations in `ms`, references as `{dy.…}` aliases, and Figma's variable ID and scopes under `$extensions["com.figma"]`.

| File                 | Layer                        | Ships to CSS |
| :------------------- | :--------------------------- | :----------- |
| `primitives.json`    | Raw values                   | No           |
| `theme.<theme>.json` | Theme roles (primary, …)     | No           |
| `color.<mode>.json`  | Color by purpose             | Yes          |
| `space.json`         | Space scale                  | Yes          |
| `shape.json`         | Border radius by shape       | Yes          |
| `typography.json`    | Type roles                   | Yes          |
| `foundation.json`    | Sizes, border widths, motion | Yes          |

Primitives and theme roles exist only to resolve references at build time; the browser only ever sees the top layer.

## Integrity

Figma's MCP returns exports to the agent rather than to disk, so each export is hashed inside Figma and re-hashed by the converter. A mismatch stops the sync. The converter also fails on any variable type it has no mapping for, on references outside the export, and on duplicate token paths.

## Build: `dist/` (generated, gitignored)

`pnpm build` runs [Style Dictionary](https://styledictionary.com) once per theme, resolves every reference, and writes only the top layer:

| Output                   | Contains                                                                |
| :----------------------- | :---------------------------------------------------------------------- |
| `css/dy.css`             | Layer order plus everything below: what apps import (`@dy/tokens/css`)  |
| `css/tokens.css`         | Theme-neutral tokens in `@layer dy.tokens` on `:root`                   |
| `css/themes/<theme>.css` | Colors in `@layer dy.themes`; the default theme also applies to `:root` |
| `manifest.json`          | Every shipped token with its type and CSS value                         |

How Figma values become CSS ([`style-dictionary/config.js`](style-dictionary/config.js), [`style-dictionary/transforms.js`](style-dictionary/transforms.js)):

| Type        | CSS                                                                                                     |
| :---------- | :------------------------------------------------------------------------------------------------------ |
| Name        | Path joined with `-`, matching Figma's code syntax: `--dy-color-surface-page`                           |
| Color       | `oklch(L C H)` at 4/4/2 decimals; the build fails if a value wouldn't round-trip to the exact Figma hex |
| Dimension   | `rem` against a 16px base; border widths stay `px`; `0` is unitless                                     |
| Line height | Unitless ratio (`1.5`), usable with any font size                                                       |
| Font family | Quoted family plus `system-ui, sans-serif`                                                              |
| Duration    | `150ms`                                                                                                 |
| Easing      | `cubic-bezier(…)`                                                                                       |
| Shape       | `circle` → `50%` and `pill` → `9999px`, which Figma can't express                                       |

Before writing anything, the build checks that no primitive or theme-role token appears in the CSS, that no `{dy.…}` reference is left unresolved, and that every pair in [`contrast-pairs.json`](contrast-pairs.json) meets its WCAG minimum in every theme. Any failure stops the build. Until `/sync-tokens` has run, `src/` doesn't exist and the build skips with a message.

## Scripts

- `pnpm build`: generate `dist/`
- `pnpm test`: converter, diff, color, transforms, verification and an end-to-end build from a miniature Figma export
- `pnpm lint`
