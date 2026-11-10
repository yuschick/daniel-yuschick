import { cx } from '@package-internal/utils/cx';
import { mergeProps } from '@package-internal/utils/mergeProps';

import styles from './Icon.module.css';
import type { GetIconPropsOptions, GetIconPropsReturn } from './Icon.types';

/**
 * Holds the DOM computation, ARIA calculation and class resolution for an Icon
 * (RX-09), which isn't exported from `index.ts`. It's a plain function, not a
 * hook, because it calls no React hook.
 *
 * @param options - The resolved props and the consumer's remaining attributes.
 * @returns The finished props for the root `<span>`.
 */
export function getIconProps({
  ariaLabel,
  htmlAttributes,
  size,
}: GetIconPropsOptions): GetIconPropsReturn {
  const name = ariaLabel?.trim() ?? '';

  // A non-empty name makes the Icon an image with that name. Otherwise it's
  // decorative: hidden, with no role and no aria-label attribute at all (D8).
  const accessibilityProps =
    name === ''
      ? ({
          'aria-hidden': 'true',
        } satisfies React.HTMLAttributes<HTMLSpanElement>)
      : ({
          role: 'img',
          'aria-label': name,
        } satisfies React.HTMLAttributes<HTMLSpanElement>);

  const internalProps = {
    ...accessibilityProps,
    className: cx(styles.icon, styles[`size-${size}`]),
  } satisfies React.ComponentPropsWithoutRef<'span'>;

  return { rootProps: mergeProps(internalProps, htmlAttributes) };
}
