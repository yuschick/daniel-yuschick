/**
 * The DY mark in terminal blocks, drawn by hand from the four slashes of
 * `@dy/react`'s Logo. Each slash is two blocks wide and moves one column per
 * row, so every stroke has the same width and the steps are even; tracing
 * the logo's exact geometry gives strokes that wobble between widths. The
 * `░` on each stroke's left edge is a shadow, and the rules frame it, after
 * the mark in Kesko's test runner by Ariel Salminen.
 *
 * The rows match the logo's proportions: the long slash runs rows 1–8, the
 * two short slashes rows 5–8, and the descender rows 5–12.
 */
export const MARK = [
  '░█████████████████████',
  '',
  '             ░██',
  '            ░██',
  '           ░██',
  '          ░██',
  '     ░██ ░██ ░██ ░██',
  '    ░██ ░██ ░██ ░██',
  '   ░██ ░██ ░██ ░██',
  '  ░██ ░██ ░██ ░██',
  '             ░██',
  '            ░██',
  '           ░██',
  '          ░██',
  '',
  '░█████████████████████',
].join('\n');

/** The small block before the report's title, echoing the mark's rules */
export const BULLET = '░█';
