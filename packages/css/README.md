# `@dy/css`

The DY Design System's global CSS: the styles that apply to a whole page rather than to one component. Today that's the reset.

## Use

```ts
import '@dy/fonts/inclusive-sans.css';
import '@dy/tokens/css/dy.css';
import '@dy/css/reset.css';
```

The reset sets body type from tokens, so it needs `@dy/tokens`' CSS on the page, and `@dy/fonts` for the typeface those tokens name. Import order doesn't decide the cascade: the token CSS and the reset declare the same layer order, so whichever loads first sets it.

| Export        | Contains                        |
| :------------ | :------------------------------ |
| `./reset.css` | The reset, in `@layer dy.reset` |

There's no build step. The CSS ships as written, and the consumer's bundler handles it.

## The cascade

```css
@layer dy.reset, dy.tokens, dy.themes, dy.react, dy.utilities;
```

`dy.reset` is the first and weakest layer, so any component style in `dy.react` beats it, whatever its specificity. Unlayered CSS beats every layer, so an app's own styles always win too.

The reset repeats the order statement from `@dy/tokens` so the cascade can't depend on which file loads first. [`layers.test.js`](src/layers.test.js) fails if the two drift apart, and if any rule sits outside `dy.reset`.

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
- **Body color and background.** Those belong to the theme, so they're set by the app.
- **A global reduced-motion kill switch.** Components gate their own motion (CSS-03), and the switch would need `!important`.

## Lint

[`stylelint.config.js`](stylelint.config.js) extends the shared config, with one exception: a reset restyles elements themselves (`body`, `img`, `h1`), so `defensive-css/require-pure-selectors`, which allows only class and ID selectors, is off. Every other shared rule applies.

## Scripts

- `pnpm lint`: ESLint and Stylelint
- `pnpm test`: checks the layer order against `@dy/tokens`
