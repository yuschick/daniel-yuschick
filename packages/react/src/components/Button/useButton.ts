'use client';

import { cx } from '@package-internal/utils/cx';
import { mergeProps } from '@package-internal/utils/mergeProps';
import { useCallback } from 'react';

import styles from './Button.module.css';
import type { UseButtonOptions, UseButtonReturn } from './Button.types';

/**
 * Holds the DOM computation, ARIA calculation and class resolution for a Button
 * (RX-09), which isn't exported from `index.ts`.
 *
 * @param options - The resolved props and the consumer's remaining attributes.
 * @returns The finished props for the `<button>` and its label `<span>`.
 */
export function useButton({
  ariaDisabled,
  buttonRef,
  disabled,
  emphasis,
  htmlAttributes,
  intent,
  isDisabled,
  onClick,
  size,
}: UseButtonOptions): UseButtonReturn {
  const resolvedIsDisabled =
    isDisabled ??
    disabled ??
    (ariaDisabled === true || ariaDisabled === 'true');

  // Native Enter and Space activation fire `click` on a `<button>`, so this one
  // guard also covers the keyboard.
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (resolvedIsDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    },
    [onClick, resolvedIsDisabled],
  );

  const internalProps = {
    ref: buttonRef,
    type: 'button',
    'aria-disabled': resolvedIsDisabled ? 'true' : undefined,
    className: cx(
      styles.button,
      styles[`emphasis-${emphasis}`],
      styles[`intent-${intent}`],
      styles[`size-${size}`],
    ),
    onClick: handleClick,
  } satisfies React.ComponentPropsWithRef<'button'>;

  return {
    buttonProps: mergeProps(internalProps, htmlAttributes),
    labelProps: { className: styles.label },
  };
}
