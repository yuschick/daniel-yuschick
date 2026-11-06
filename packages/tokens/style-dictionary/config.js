// Decisions about how Figma values become CSS. Changing a value here changes
// the generated CSS for every consumer.

/** Root font size Figma's px values are designed against: 16px = 1rem. */
export const BASE_FONT_SIZE = 16;

/** Theme and mode emitted on `:root`; others need `data-theme`. */
export const DEFAULT_THEME = 'rhubarb';

/** Appended to every font family token (CSS-13 / defensive-css). */
export const FONT_FALLBACK = ['system-ui', 'sans-serif'];

/**
 * CSS meanings Figma can't store: a percentage, and "fully rounded" at any size.
 * Keyed by CSS custom property name, without the leading `--`.
 */
export const VALUE_OVERRIDES = new Map([
  ['dy-border-radius-circle', '50%'],
  ['dy-border-radius-pill', '9999px'],
]);

/** Dimensions that stay in px instead of scaling with the root font size. */
export const PX_DIMENSION = /^dy-border-width-/;

/** Source files that resolve references but never ship to CSS. */
export const HIDDEN_FILE = /^(primitives|theme\.[^.]+)\.json$/;

/** Source files holding theme- and mode-dependent color. */
export const COLOR_FILE = /^color\.[^.]+\.json$/;
