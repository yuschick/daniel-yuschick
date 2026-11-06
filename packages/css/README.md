# `@dy/css`

The DY Design System's global CSS: the styles that apply to a whole page rather than to one component. It owns the cascade layer order, and ships the reset and a single entry point that loads everything a page needs.

## Use

```ts
import '@dy/css/global.css';
```

`global.css` imports the reset, the Inclusive Sans faces from [`@dy/fonts`](../fonts/README.md) and the token CSS from [`@dy/tokens`](../tokens/README.md). Vite and Next.js inline `@import`s, so the browser gets one stylesheet. Import it once, at the app's root (Storybook's `preview.ts`, or the root `layout.tsx` in Next.js), before any component.

| Export         | Contains                                                       |
| :------------- | :------------------------------------------------------------- |
| `./global.css` | The reset, fonts and tokens, in that order                     |
| `./reset.css`  | The layer order, and the reset in `@layer dy.reset` on its own |

Use `reset.css` alone only when the fonts and tokens are loaded some other way. It still has to come before them.

There's no build step. The CSS ships as written, and the consumer's bundler handles it.

## The cascade

```css
@layer dy.reset, dy.base, dy.tokens, dy.themes, dy.react, dy.utilities;
```

Each layer beats the ones before it, whatever the specificity, and unlayered CSS beats every layer.

| Layer          | Holds                                                  | Written by          |
| :------------- | :----------------------------------------------------- | :------------------ |
| `dy.reset`     | Removing browser defaults                              | `@dy/css`           |
| `dy.base`      | Element defaults: page color and surface, links, prose | Each app, Storybook |
| `dy.tokens`    | Theme-neutral custom properties                        | `@dy/tokens`        |
| `dy.themes`    | Color custom properties, per theme                     | `@dy/tokens`        |
| `dy.react`     | Component styles                                       | `@dy/react`         |
| `dy.utilities` | Single-purpose overrides                               | Not used yet        |

`dy.base` is declared here but left empty: this package writes no base styles. An app (or Storybook) adds its own in `@layer dy.base { … }`, using semantic tokens. It sits before the tokens, so a base style can never redefine a token's value, which only changes in Figma. Elements and custom properties don't compete otherwise, so the tokens' position doesn't affect anything else.

**This is the only place the order is declared.** The browser fixes a layer's position the first time it sees the layer's name, so the order statement must load before any other layered CSS. That's why `global.css` imports the reset first, and why it has to load before any component. Nothing else repeats the statement, including the token CSS. Stylelint keeps its own list of allowed layer names, which can't import from this package without a dependency cycle. [`layers.test.js`](src/layers.test.js) fails if:

- the order is declared anywhere but the reset
- the Stylelint list and the order differ
- `global.css` doesn't import the reset first
- the reset has rules outside `dy.reset`
- the token CSS fills a layer the order doesn't name

## What the reset does, and why

1. **`box-sizing: border-box`, no margin or padding**, on every element and pseudo-element. Spacing comes only from tokens a component sets on purpose. This includes padding, so native controls, fieldsets, dialogs and lists start at zero and get their spacing from their component.
2. **No iOS text inflation.** `text-size-adjust: none` stops Safari enlarging text in landscape. Pinch-zoom still works.
3. **Keyword sizes can transition.** `interpolate-size: allow-keywords` lets `block-size` animate to `auto`, only when the user allows motion (CSS-03).
4. **Body type from tokens.** `font` uses `--dy-font-weight-body`, `--dy-font-size-body-m`, `--dy-font-line-height-default` and `--dy-font-family-body`, so every element inherits the system's font.
5. **Font smoothing** on macOS.
6. **Media** (`img`, `picture`, `video`, `canvas`, `svg`) is block-level and never wider than its container.
7. **Form controls inherit** `font`, `color` and `letter-spacing` instead of using the browser's own.
8. **Long words wrap** in paragraphs and headings instead of overflowing.
9. **Better line breaks:** `text-wrap: balance` on headings, `pretty` on paragraphs.
10. **List markers are opt-in to remove.** Only `ol`, `ul` and `menu` with `role="list"` lose them, so prose from Markdown keeps its bullets. Safari drops list semantics from lists without markers, and the explicit role keeps them.
11. **In-page link targets** and headings leave `--dy-space-2xl` above them when scrolled to.

Features that aren't Baseline Widely Available yet (`text-size-adjust`, `-webkit-font-smoothing`, `text-wrap: pretty`, `interpolate-size`) sit in `@supports`, so browsers without them keep their defaults (CSS-13).

Left out on purpose:

- **A root stacking context** (`#root { isolation: isolate }`). The wrapper's ID depends on the framework, and Next.js App Router has none, so an app sets it on its own root element.
- **Body color and background**, and any other element styling. That's base, not reset: an app writes it in `dy.base`.
- **A global reduced-motion kill switch.** Components gate their own motion (CSS-03), and the switch would need `!important`.

## Lint

[`stylelint.config.js`](stylelint.config.js) extends the shared config, with one exception: a reset restyles elements themselves (`body`, `img`, `h1`), so `defensive-css/require-pure-selectors`, which allows only class and ID selectors, is off. Every other shared rule applies.

## Scripts

- `pnpm lint`: ESLint and Stylelint
- `pnpm test`: checks that the layer order has one owner and every layer is in it
