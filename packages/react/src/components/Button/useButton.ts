'use client';

import { cx } from '@package-internal/utils/cx';
import { mergeProps } from '@package-internal/utils/mergeProps';
import { useCallback } from 'react';

import styles from './Button.module.css';
import type { UseButtonOptions, UseButtonReturn } from './Button.types';

/** The Icon size for each Button size, as Figma sets them (D38). */
const ICON_SIZES = {
  l: 'l',
  m: 'l',
  s: 's',
} satisfies Record<
  UseButtonOptions['size'],
  UseButtonReturn['iconProps']['size']
>;

/**
 * Holds the DOM computation, ARIA calculation and class resolution for a Button
 * (RX-09), which isn't exported from `index.ts`.
 *
 * @param options - The resolved props and the consumer's remaining attributes.
 * @returns The finished props for the `<button>`, its label `<span>` and its Icon.
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
  onMouseDown,
  onMouseUp,
  onPointerDown,
  onPointerUp,
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
    // While disabled, presses skip the consumer's down and up handlers, with no
    // `preventDefault`, so focus on click stays native. Move, enter and leave
    // handlers stay in `htmlAttributes`, so tooltips still work (D44).
    onMouseDown: resolvedIsDisabled ? undefined : onMouseDown,
    onMouseUp: resolvedIsDisabled ? undefined : onMouseUp,
    onPointerDown: resolvedIsDisabled ? undefined : onPointerDown,
    onPointerUp: resolvedIsDisabled ? undefined : onPointerUp,
  } satisfies React.ComponentPropsWithRef<'button'>;

  return {
    buttonProps: mergeProps(internalProps, htmlAttributes),
    iconProps: { size: ICON_SIZES[size] },
    labelProps: { className: styles.label },
  };
}
