import type { SanitizedHTMLAttributes } from '@package-internal/types/type-helpers';
import type { Size } from '@package-types/common';

/**
 * Lockups represent how the Logo is composed.
 * Mark is the initials alone, for subtle accent branding.
 * Full pairs the initials with the name, for prominent branding.
 * @default 'mark'
 */
export const LOCKUPS = ['mark', 'full'] as const;
export type Lockup = (typeof LOCKUPS)[number];

export interface LogoProps extends SanitizedHTMLAttributes<
  React.HTMLAttributes<HTMLSpanElement>,
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'role'
  | 'tabIndex'
> {
  /** The composition of the Logo: the initials alone, or the initials and the name. */
  lockup?: Lockup;
  ref?: React.Ref<HTMLSpanElement>;
  /** The scale of the Logo's dimensions. */
  size?: Extract<Size, 's' | 'm' | 'l'>;
}

type LogoOwnProps = 'lockup' | 'ref' | 'size';

export interface GetLogoPropsOptions {
  htmlAttributes: Omit<LogoProps, LogoOwnProps>;
  lockup: NonNullable<LogoProps['lockup']>;
  size: NonNullable<LogoProps['size']>;
}

export interface GetLogoPropsReturn {
  // The ref stays in the component: a plain function that's handed one could read it during render.
  rootProps: React.ComponentPropsWithoutRef<'span'>;
  svgProps: React.ComponentPropsWithoutRef<'svg'>;
}
