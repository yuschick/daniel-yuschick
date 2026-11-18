/**
 * The brand's 500 shades, copied from `@dy/tokens`' primitives. A terminal
 * can't read tokens, and can't say whether its background is light or dark,
 * so these are the shades that hold at least 3:1 against black, white and
 * typical terminal backgrounds (#1e1e1e, #fafafa). That's WCAG's minimum for
 * non-text (1.4.11), so they color the mark and the status symbols only.
 * Text keeps the terminal's own color, which always has contrast.
 *
 * `palette.test.js` fails if a value drifts from the token it copies.
 */
export const palette = {
  /** `dy.color.rhubarb.500`, the theme's primary */
  brand: '#db465c',
  /** `dy.color.green.500`, the theme's positive */
  positive: '#2f9c3c',
  /** `dy.color.red.500`, the theme's negative */
  negative: '#e8372b',
};

/** The primitive each palette entry copies, for the drift test */
export const paletteSources = {
  brand: 'rhubarb.500',
  positive: 'green.500',
  negative: 'red.500',
};
