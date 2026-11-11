import type {
  SanitizedHTMLAttributes,
  WithChildren,
} from '@package-internal/types/type-helpers';
import type { Emphasis, Intent, Size } from '@package-types/common';

import type { IconComponent } from '@dy/icons/react';

interface ButtonBaseProps extends WithChildren<
  SanitizedHTMLAttributes<React.ButtonHTMLAttributes<HTMLButtonElement>>
> {
  /** The priority of the button within a screen region. */
  emphasis?: Emphasis;
  /** The meaning of the action. */
  intent?: Extract<Intent, 'brand' | 'strong' | 'subtle'>;
  /** Makes the button inoperable while it stays focusable and announced. */
  isDisabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  /** The scale of the button's dimensions. */
  size?: Extract<Size, 's' | 'm' | 'l'>;
}

interface ButtonLeadingIconProps extends ButtonBaseProps {
  /** A decorative icon before the label, such as `ChevronDownIcon` from `@dy/icons/react`. */
  iconLeading?: IconComponent;
  /** A decorative icon after the label. A button has at most one icon. */
  iconTrailing?: never;
}

interface ButtonTrailingIconProps extends ButtonBaseProps {
  /** A decorative icon before the label. A button has at most one icon. */
  iconLeading?: never;
  /** A decorative icon after the label, such as `ArrowRightIcon` from `@dy/icons/react`. */
  iconTrailing?: IconComponent;
}

/** A button has at most one icon, so setting both icon props fails type-checking (TS-08, D37). */
export type ButtonProps = ButtonLeadingIconProps | ButtonTrailingIconProps;

type ButtonOwnProps =
  | 'aria-disabled'
  | 'children'
  | 'disabled'
  | 'emphasis'
  | 'iconLeading'
  | 'iconTrailing'
  | 'intent'
  | 'isDisabled'
  | 'onClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onPointerDown'
  | 'onPointerUp'
  | 'ref'
  | 'size';

export interface UseButtonOptions {
  ariaDisabled?: ButtonProps['aria-disabled'];
  buttonRef?: ButtonProps['ref'];
  disabled?: ButtonProps['disabled'];
  emphasis: NonNullable<ButtonProps['emphasis']>;
  htmlAttributes: Omit<ButtonProps, ButtonOwnProps>;
  intent: NonNullable<ButtonProps['intent']>;
  isDisabled?: ButtonProps['isDisabled'];
  onClick?: ButtonProps['onClick'];
  onMouseDown?: ButtonProps['onMouseDown'];
  onMouseUp?: ButtonProps['onMouseUp'];
  onPointerDown?: ButtonProps['onPointerDown'];
  onPointerUp?: ButtonProps['onPointerUp'];
  size: NonNullable<ButtonProps['size']>;
}

export interface UseButtonReturn {
  buttonProps: React.ComponentPropsWithRef<'button'>;
  /** The Icon's size, resolved from the button's (D38). */
  iconProps: { size: Size };
  labelProps: React.ComponentPropsWithoutRef<'span'>;
}
