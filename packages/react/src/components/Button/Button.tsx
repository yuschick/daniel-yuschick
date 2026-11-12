'use client';

import { Icon } from '../Icon';
import type { ButtonProps } from './Button.types';
import { useButton } from './useButton';

export const Button = function Button({
  ref: externalRef,
  emphasis = 'primary',
  intent = 'brand',
  size = 'm',
  children,
  // Intentionally `undefined` by default: no icon renders (RX-03).
  iconLeading,
  iconTrailing,
  // Intentionally `undefined` by default, because `??` resolves them in order (RX-03, D15).
  isDisabled,
  disabled,
  'aria-disabled': ariaDisabled,
  onClick,
  onMouseDown,
  onMouseUp,
  onPointerDown,
  onPointerUp,
  ...htmlAttributes
}: ButtonProps) {
  const { buttonProps, iconProps, labelProps } = useButton({
    ariaDisabled,
    buttonRef: externalRef,
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
      {iconLeading ? <Icon icon={iconLeading} {...iconProps} /> : null}
      <span {...labelProps}>{children}</span>
      {iconTrailing ? <Icon icon={iconTrailing} {...iconProps} /> : null}
    </button>
  );
};
