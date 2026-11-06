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

- **Subset to Latin.** The files keep only the characters in Google Fonts' `latin` range: Basic Latin and Latin-1 (which covers Finnish, Swedish and most Western European languages), common punctuation, `€` and `™`. That cuts each file by about 35% (roman 45.9 → 30.0 KB, italic 48.2 → 31.6 KB). The `wght` axis, kerning and every OpenType feature are kept. `unicode-range` declares the same range, so any other character renders in the fallback stack. If the site needs Latin Extended (for example Polish or Czech), add a second subset file with its own `@font-face` and `unicode-range`. The browser then downloads it only on pages that use those characters.

Not done yet: a metric-matched fallback face (`size-adjust`) to reduce layout shift while the font loads. It needs the fallback stack in the token to change in Figma.

## Regenerating the subsets

The files were made with [fonttools](https://github.com/fonttools/fonttools) 4.60.2 (with `brotli`), which isn't a dependency of this repo. Install it in a throwaway Python environment, then run this once per style, from the full variable font downloaded from [Google Fonts](https://fonts.google.com/specimen/Inclusive+Sans):

```sh
pyftsubset InclusiveSans-VariableFont_wght.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --layout-features='*' \
  --flavor=woff2 \
  --output-file=InclusiveSans-Latin-VariableFont_wght.woff2
```

Keep `--unicodes` and the `unicode-range` in [`inclusive-sans.css`](assets/inclusive-sans.css) identical.

## Lint

[`stylelint.config.js`](stylelint.config.js) extends the shared config, with one exception: inside `@font-face`, `font-weight` is a descriptor stating the range a font file covers, not a style, so it takes a numeric range instead of a weight token (CSS-07). Every other shared rule applies.

## Scripts

- `pnpm lint`: ESLint and Stylelint
