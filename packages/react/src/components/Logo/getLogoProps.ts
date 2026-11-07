import { cx } from '@package-internal/utils/cx';
import { mergeProps } from '@package-internal/utils/mergeProps';

import styles from './Logo.module.css';
import type { GetLogoPropsOptions, GetLogoPropsReturn } from './Logo.types';

const NAME = 'Daniel Yuschick';

/**
 * Holds the DOM computation, ARIA calculation and class resolution for a Logo
 * (RX-09), which isn't exported from `index.ts`. It's a plain function, not a
 * hook, because it calls no React hook.
 *
 * @param options - The resolved props and the consumer's remaining attributes.
 * @returns The finished props for the root `<span>` and the `<svg>`.
 */
export function getLogoProps({
  htmlAttributes,
  lockup,
  size,
}: GetLogoPropsOptions): GetLogoPropsReturn {
  const internalProps = {
    className: cx(
      styles.logo,
      styles[`lockup-${lockup}`],
      styles[`size-${size}`],
    ),
  } satisfies React.ComponentPropsWithoutRef<'span'>;

  // The mark is the only content of the mark lockup, so it carries the name. In
  // the full lockup the visible name does, and the mark is hidden so the name is
  // read once (D1).
  const svgAccessibilityProps =
    lockup === 'mark'
      ? ({
          role: 'img',
          'aria-label': NAME,
        } satisfies React.SVGAttributes<SVGSVGElement>)
      : ({
          'aria-hidden': 'true',
        } satisfies React.SVGAttributes<SVGSVGElement>);

  return {
    rootProps: mergeProps(internalProps, htmlAttributes),
    svgProps: {
      ...svgAccessibilityProps,
      className: styles.mark,
      viewBox: '0 0 119 194',
    },
  };
}
