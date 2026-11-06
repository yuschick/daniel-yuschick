import type {
  SanitizedHTMLAttributes,
  WithChildren,
} from '@package-internal/types/type-helpers';
import type { Emphasis, Intent, Size } from '@package-types/common';

export interface ButtonProps extends WithChildren<
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

type ButtonOwnProps =
  | 'aria-disabled'
  | 'children'
  | 'disabled'
  | 'emphasis'
  | 'intent'
  | 'isDisabled'
  | 'onClick'
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
  size: NonNullable<ButtonProps['size']>;
}

export interface UseButtonReturn {
  buttonProps: React.ComponentPropsWithRef<'button'>;
  labelProps: React.ComponentPropsWithoutRef<'span'>;
}
