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

## Scripts

- `pnpm test`: unit tests for the converter, diff and hash.
- `pnpm lint`
