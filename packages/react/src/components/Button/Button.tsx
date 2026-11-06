'use client';

import type { ButtonProps } from './Button.types';
import { useButton } from './useButton';

export const Button = function Button({
  ref: externalRef,
  emphasis = 'primary',
  intent = 'brand',
  size = 'm',
  children,
  // Intentionally `undefined` by default, because `??` resolves them in order (RX-03, D15).
  isDisabled,
  disabled,
  'aria-disabled': ariaDisabled,
  onClick,
  ...htmlAttributes
}: ButtonProps) {
  const { buttonProps, labelProps } = useButton({
    ariaDisabled,
    buttonRef: externalRef,
    disabled,
    emphasis,
    htmlAttributes,
    intent,
    isDisabled,
    onClick,
    size,
  });

  return (
    /*
     ** The native HTML 'disabled' attribute is one of the rare cases where it does more harm than good.
     ** When using 'disabled' the element is not clickable, but it's also not focusable or readable by assistive technologies.
     ** Instead, we use aria-disabled and prevent click/press events manually.
     ** This way, disabled buttons can still be understood by assistive technologies while being non-operational.
     */
    <button
      // `buttonProps` already holds this value. It's repeated because the linter can't see into a spread.
      type={buttonProps.type}
      {...buttonProps}
    >
      <span {...labelProps}>{children}</span>
    </button>
  );
};
