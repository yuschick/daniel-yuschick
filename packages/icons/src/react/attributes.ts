import type { IconComponentProps } from './types';

/**
 * What every icon renders with unless a prop overrides it: decorative,
 * text-sized, and drawn in the house style. The `viewBox` and stroke values
 * must match the manifest's (`src/icons.json`); scripts/generate.js stops the
 * build when they don't.
 */
export const ICON_ATTRIBUTES = {
  'aria-hidden': true,
  focusable: 'false',
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} satisfies IconComponentProps;
