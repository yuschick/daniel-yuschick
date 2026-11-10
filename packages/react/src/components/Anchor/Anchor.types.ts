import type {
  SanitizedHTMLAttributes,
  WithChildren,
} from '@package-internal/types/type-helpers';
import type { Emphasis, Intent, Size, Variant } from '@package-types/common';

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

export type AnchorProps = AnchorDefaultProps | AnchorInlineProps;

type AnchorOwnProps =
  'children' | 'emphasis' | 'href' | 'intent' | 'ref' | 'size' | 'variant';

export interface GetAnchorPropsOptions {
  emphasis: Emphasis;
  href: string;
  htmlAttributes: Omit<AnchorProps, AnchorOwnProps>;
  intent: NonNullable<AnchorProps['intent']>;
  size: Extract<Size, 's' | 'm' | 'l'>;
  variant: NonNullable<AnchorProps['variant']>;
}

export interface GetAnchorPropsReturn {
  anchorProps: React.ComponentPropsWithoutRef<'a'>;
  /** The text appended to the accessible name, when there is any (D12). */
  hiddenText: string | undefined;
  hiddenTextProps: React.ComponentPropsWithoutRef<'span'>;
  labelProps: React.ComponentPropsWithoutRef<'span'>;
}
