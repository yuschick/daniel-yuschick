import type {
  SanitizedHTMLAttributes,
  WithChildren,
} from '@package-internal/types/type-helpers';
import type { Emphasis, Intent, Size, Variant } from '@package-types/common';

import type { IconComponent } from '@dy/icons/react';

import type { IconProps } from '../Icon';

type AnchorNativeAttributes = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'aria-disabled' | 'href'
>;

interface AnchorBaseProps extends WithChildren<
  SanitizedHTMLAttributes<AnchorNativeAttributes>
> {
  /** The destination. An `<a>` without one isn't a link. */
  href: string;
  /** The meaning of the link. */
  intent?: Extract<Intent, 'brand' | 'strong' | 'subtle'>;
  ref?: React.Ref<HTMLAnchorElement>;
}

interface AnchorDefaultProps extends AnchorBaseProps {
  /** The priority of the link within a screen region. */
  emphasis?: Emphasis;
  /** The scale of the link's dimensions. */
  size?: Extract<Size, 's' | 'm' | 'l'>;
  /** Recolored text inside a run of prose, or the button-styled link. */
  variant?: 'default';
}

interface AnchorInlineProps extends AnchorBaseProps {
  emphasis?: never;
  size?: never;
  /** Recolored text inside a run of prose, or the button-styled link. */
  variant: Extract<Variant, 'inline'>;
}

interface AnchorLeadingIconProps {
  /** A decorative icon before the label, such as `ArrowLeftIcon` from `@dy/icons/react`. */
  iconLeading?: IconComponent;
  /** A decorative icon after the label. An anchor has at most one icon. */
  iconTrailing?: never;
}

interface AnchorTrailingIconProps {
  /** A decorative icon before the label. An anchor has at most one icon. */
  iconLeading?: never;
  /** A decorative icon after the label, such as `ExternalLinkIcon` from `@dy/icons/react`. */
  iconTrailing?: IconComponent;
}

/**
 * Inline links take no emphasis or size, and an anchor has at most one icon on
 * either form, so both invalid combinations fail type-checking (TS-08, D23).
 */
export type AnchorProps = (AnchorDefaultProps | AnchorInlineProps) &
  (AnchorLeadingIconProps | AnchorTrailingIconProps);

type AnchorOwnProps =
  | 'children'
  | 'emphasis'
  | 'href'
  | 'iconLeading'
  | 'iconTrailing'
  | 'intent'
  | 'ref'
  | 'size'
  | 'variant';

export interface GetAnchorPropsOptions {
  emphasis: Emphasis;
  href: string;
  htmlAttributes: Omit<AnchorProps, AnchorOwnProps>;
  /** The icon before the label. Set, it puts the icon slot before the label (D25). */
  iconLeading?: IconComponent;
  intent: NonNullable<AnchorProps['intent']>;
  size: Extract<Size, 's' | 'm' | 'l'>;
  variant: NonNullable<AnchorProps['variant']>;
}

export interface GetAnchorPropsReturn {
  anchorProps: React.ComponentPropsWithoutRef<'a'>;
  /** The text appended to the accessible name, when there is any (D12). */
  hiddenText: string | undefined;
  /** The Icon's size, resolved from the form and the anchor's size (D24, D26). */
  iconProps: { size: NonNullable<IconProps['size']> };
  /** The icon slot's class for the form and side, and its `aria-hidden` (D25). */
  iconSlotProps: React.ComponentPropsWithoutRef<'span'>;
  labelProps: React.ComponentPropsWithoutRef<'span'>;
}
