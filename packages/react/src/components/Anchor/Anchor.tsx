import { VisuallyHidden } from '@package-internal/components/VisuallyHidden';

import { Icon } from '../Icon';
import type { AnchorProps } from './Anchor.types';
import { getAnchorProps } from './getAnchorProps';

export const Anchor = function Anchor({
  ref: externalRef,
  children,
  emphasis = 'primary',
  href,
  // Intentionally `undefined` by default: no icon renders (RX-03).
  iconLeading,
  iconTrailing,
  intent = 'brand',
  size = 'm',
  variant = 'default',
  ...htmlAttributes
}: AnchorProps) {
  const { anchorProps, hiddenText, iconProps, iconSlotProps, labelProps } =
    getAnchorProps({
      emphasis,
      href,
      htmlAttributes,
      iconLeading,
      intent,
      size,
      variant,
    });

  return (
    <a
      ref={externalRef}
      // `anchorProps` already holds this value. It's repeated because the linter can't see into a spread.
      href={anchorProps.href}
      {...anchorProps}
    >
      {iconLeading ? (
        <span {...iconSlotProps}>
          <Icon icon={iconLeading} {...iconProps} />
        </span>
      ) : null}
      <span {...labelProps}>
        {children}
        {hiddenText ? <VisuallyHidden>{hiddenText}</VisuallyHidden> : null}
      </span>
      {iconTrailing ? (
        <span {...iconSlotProps}>
          <Icon icon={iconTrailing} {...iconProps} />
        </span>
      ) : null}
    </a>
  );
};
