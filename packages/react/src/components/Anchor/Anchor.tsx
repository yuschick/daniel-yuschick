import type { AnchorProps } from './Anchor.types';
import { getAnchorProps } from './getAnchorProps';

export const Anchor = function Anchor({
  ref: externalRef,
  children,
  emphasis = 'primary',
  href,
  intent = 'brand',
  size = 'm',
  variant = 'default',
  ...htmlAttributes
}: AnchorProps) {
  const { anchorProps, hiddenText, hiddenTextProps, labelProps } =
    getAnchorProps({
      emphasis,
      href,
      htmlAttributes,
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
      <span {...labelProps}>
        {children}
        {hiddenText ? <span {...hiddenTextProps}>{hiddenText}</span> : null}
      </span>
    </a>
  );
};
