import { createElement } from 'react';
import type { ReactElement, Ref } from 'react';

import { ICON_ATTRIBUTES } from './attributes';
import type { IconComponentProps, IconNode } from './types';

export interface RenderIconOptions {
  /** Every other prop the icon component received. */
  htmlAttributes: Omit<IconComponentProps, 'ref'>;
  /** The glyph's shapes, generated from `src/icons.json`. */
  nodes: readonly IconNode[];
  /** The icon component's `externalRef`, for the `<svg>`. */
  svgRef?: Ref<SVGSVGElement>;
}

/**
 * Renders a glyph as an `<svg>`. Every generated icon component calls it, so
 * the defaults, the ref and the shapes are handled in this one place.
 *
 * A plain function, not a component: it adds nothing to the React tree, and
 * each icon keeps its own name for DevTools and stack traces (RX-01). The
 * received props are spread after the defaults, so they override every one.
 */
export function renderIcon({
  htmlAttributes,
  nodes,
  svgRef,
}: RenderIconOptions): ReactElement {
  // Shapes are passed as separate children, not an array, because the list
  // is static: React needs no keys for it.
  return createElement(
    'svg',
    { ...ICON_ATTRIBUTES, ...htmlAttributes, ref: svgRef },
    ...nodes.map(([shape, geometry]) => createElement(shape, geometry)),
  );
}
