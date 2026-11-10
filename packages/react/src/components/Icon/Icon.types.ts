import type { SanitizedHTMLAttributes } from '@package-internal/types/type-helpers';
import type { Size } from '@package-types/common';

import type { IconComponent } from '@dy/icons/react';

export type { IconComponent };

export interface IconProps extends SanitizedHTMLAttributes<
  React.HTMLAttributes<HTMLSpanElement>,
  | keyof React.DOMAttributes<HTMLSpanElement>
  | 'aria-hidden'
  | 'aria-labelledby'
  | 'role'
  | 'tabIndex'
> {
  /** The glyph to render: an icon component from `@dy/icons/react`, such as `ChevronDownIcon`. */
  icon: IconComponent;
  ref?: React.Ref<HTMLSpanElement>;
  /** The scale of the Icon's dimensions. */
  size?: Size;
}

type IconOwnProps = 'aria-label' | 'icon' | 'ref' | 'size';

export interface GetIconPropsOptions {
  /**
   * The consumer's `aria-label`. `undefined`, empty or whitespace-only leaves
   * the Icon decorative (D8).
   */
  ariaLabel?: string;
  htmlAttributes: Omit<IconProps, IconOwnProps>;
  size: NonNullable<IconProps['size']>;
}

export interface GetIconPropsReturn {
  // The ref stays in the component: a plain function that's handed one could read it during render.
  rootProps: React.ComponentPropsWithoutRef<'span'>;
}
