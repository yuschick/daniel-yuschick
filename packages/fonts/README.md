# `@dy/fonts`

The DY Design System's typefaces, self-hosted. Today that's [Inclusive Sans](https://github.com/LivKing/Inclusive-Sans), the family behind `--dy-font-family-body` and `--dy-font-family-heading` in [`@dy/tokens`](../tokens/README.md).

## Use

```ts
import '@dy/fonts/inclusive-sans.css';
import '@dy/tokens/css/dy.css';
```

The CSS only declares the font faces. It doesn't apply them: components do that through the font-family tokens.

There's no CDN and no build step. The `@font-face` rules point at the font files with relative `url()`s, so the consumer's bundler (Vite, Next.js) copies, fingerprints and serves them with the rest of the app.

| Export                 | Contains                                                                 |
| :--------------------- | :----------------------------------------------------------------------- |
| `./inclusive-sans.css` | The `@font-face` rules                                                   |
| `./assets/*`           | The raw files, for `<link rel="preload">` or for serving as static files |

## What's in it, and why

- **Variable fonts only.** One file per style (roman and italic) covers every weight. Each `@font-face` declares `font-weight: 300 700`, the font's own `wght` axis, so every weight token resolves, including any added later. The static per-weight files aren't shipped.
- **WOFF2 only.** Every supported browser reads it, and it's the smallest format, so there's no TTF fallback.
- **`font-display: swap`.** Text renders right away in the fallback stack from the token (`system-ui, sans-serif`), then swaps in the font once it loads.
- **The family name is the contract.** It must match the token value (`"Inclusive Sans"`) exactly, and a change to either has to change both. That's also why Next.js's `next/font/local` doesn't fit: it renames the family.
- **[`OFL.txt`](assets/OFL.txt).** The SIL Open Font License requires the license to travel with the font files.

Not done yet: a metric-matched fallback face (`size-adjust`) to reduce layout shift while the font loads, and subsetting by `unicode-range`. The first needs the fallback stack in the token to change in Figma.

## Lint

[`stylelint.config.js`](stylelint.config.js) extends the shared config, with one exception: inside `@font-face`, `font-weight` is a descriptor stating the range a font file covers, not a style, so it takes a numeric range instead of a weight token (CSS-07). Every other shared rule applies.

## Scripts

- `pnpm lint`: ESLint and Stylelint
