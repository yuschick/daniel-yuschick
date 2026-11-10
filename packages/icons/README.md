# `@dy/icons`

The DY Design System's icons, synced from Figma. The icons are [Lucide](https://lucide.dev)'s, placed in the Figma file as components, which are the source of truth: icons change in Figma, never here.

## Use

```tsx
import { ChevronDownIcon } from '@dy/icons/react';
// or one module per icon
import { ChevronDownIcon } from '@dy/icons/react/ChevronDownIcon';
// a standalone SVG file, for <img>, CSS or anything that isn't React
import chevronDown from '@dy/icons/svg/chevron-down.svg';
```

- Named exports only. Every React icon is named for its icon with an `Icon` suffix: `chevron-down` → `ChevronDownIcon`.
- Every React icon renders an `<svg>` that is `1em` square, strokes with `currentColor`, and is hidden from assistive tech (`aria-hidden="true"`). Any `<svg>` attribute passed to it overrides a default, and `ref` reaches the `<svg>`.
- In product UI, render icons through `@dy/react`'s `Icon`, which sizes them with tokens and gives a meaningful icon an accessible name. The bare components are for places `@dy/react` doesn't reach.
- An SVG file used in an `<img>` can't inherit `currentColor`, so it draws in black.
- What a `.svg` import returns depends on the bundler: a URL in Vite, an image object in Next.js (`chevronDown.src`).

## How icons get here

1. An icon is added to, changed in or removed from the **Icons** section of the Figma file (`HiDiGLs2OsVWyqnCo7aEjF`).
2. Daniel runs `/sync-icons` in Claude Code. The [skill](../../.claude/skills/sync-icons/SKILL.md) exports every glyph component in the section through the Figma MCP, converts the export with [`scripts/figma-to-icon-manifest.js`](scripts/figma-to-icon-manifest.js), and opens a PR with a summary from [`scripts/diff-icons.js`](scripts/diff-icons.js).
3. The PR is reviewed and merged.

### Adding an icon in Figma

1. Insert it with the Lucide plugin.
2. Turn it into a component, named for the icon in lowercase words joined by hyphens (`chevron-down`), and move it into the **Glyphs** frame.
3. Add it to the preferred values of the `Icon` component's `icon` property, so designers can swap to it.

## `src/icons.json`: generated, do not edit

The icon manifest: every icon as data, independent of any platform. It records the shared house style once (`viewBox` and stroke `attributes`) and, per icon, its name, its Figma node and key, its description, and its shapes as `[element, attributes]` pairs holding geometry only.

The converter optimizes each exported SVG with [SVGO](https://svgo.dev), which also restores Lucide's compact path data, and fails the sync on anything outside the house style:

- a grid other than 24×24
- an element other than `path`, `circle`, `ellipse`, `line`, `polygon`, `polyline` or `rect`: no groups, masks, clip paths, images or gradients
- a fill, more than one stroke color, a stroke width other than 2, or caps and joins that aren't round
- any other attribute, such as an opacity, a dash or a transform
- a name that isn't lowercase words joined by hyphens, or a name two icons share

Figma's MCP returns exports to the agent rather than to disk, so each slice is hashed inside Figma and re-hashed by the converter. A mismatch, or a slice missing or overlapping another, stops the sync.

## Build: `dist/` (generated, gitignored)

`pnpm build` runs [`scripts/generate.js`](scripts/generate.js), then [tsdown](https://tsdown.dev):

| Output                  | Contains                                           |
| :---------------------- | :------------------------------------------------- |
| `svg/<name>.svg`        | One standalone SVG per icon                        |
| `react/index.js`        | Every icon by name, plus the `IconComponent` types |
| `react/icons/<Name>.js` | One module per icon, with its `.d.ts`              |

`generate.js` writes the React sources tsdown compiles into `src/react/index.ts` and `src/react/icons/`, both gitignored. Each icon is a named component (`RX-01`, `RX-02`) holding its shapes as data and calling [`renderIcon`](src/react/renderIcon.ts), which renders every icon: the defaults, the ref and the shapes. Only that thin template is generated; the logic is hand-written, linted and tested with Vitest.

The defaults live in [`src/react/attributes.ts`](src/react/attributes.ts), hand-written so the package type-checks before a build. `generate.js` stops the build if they no longer match the manifest's house style.

## License

The icons are Lucide's: ISC, except those Lucide derives from Feather, which are MIT. Both notices are in [LICENSE](LICENSE).
