import { cx } from '@package-internal/utils/cx';
import { mergeProps } from '@package-internal/utils/mergeProps';

import styles from './Anchor.module.css';
import type {
  GetAnchorPropsOptions,
  GetAnchorPropsReturn,
} from './Anchor.types';

// The leading space separates this from the label in the accessible name. It
// stays inside the hidden text so an inline link shows no extra space (D19).
const DOWNLOAD_TEXT = ' (downloads file)';
const NEW_TAB_TEXT = ' (opens in new tab)';

function getHiddenText({
  htmlAttributes,
}: Pick<GetAnchorPropsOptions, 'htmlAttributes'>): string | undefined {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    target,
  } = htmlAttributes;
  // React types `download` as `any`, so it's narrowed here.
  const download: unknown = htmlAttributes.download;

  // A consumer label is the name, so appended text would be ignored or contradict it (D12).
  if (ariaLabel !== undefined || ariaLabelledBy !== undefined) {
    return undefined;
  }
  if (download !== undefined && download !== false) {
    return DOWNLOAD_TEXT;
  }
  return target === '_blank' ? NEW_TAB_TEXT : undefined;
}

/**
 * Holds the DOM computation and class resolution for an Anchor (RX-09), which
 * isn't exported from `index.ts`. It's a plain function, not a hook, because it
 * calls no React hook.
 *
 * @param options - The resolved props and the consumer's remaining attributes.
 * @returns The finished props for the `<a>` and its label, and the hidden text.
 */
export function getAnchorProps({
  emphasis,
  href,
  htmlAttributes,
  intent,
  size,
  variant,
}: GetAnchorPropsOptions): GetAnchorPropsReturn {
  const isInline = variant === 'inline';

  const internalProps = {
    href,
    className: cx(
      styles.anchor,
      styles[`variant-${variant}`],
      styles[`intent-${intent}`],
      !isInline && styles[`emphasis-${emphasis}`],
      !isInline && styles[`size-${size}`],
    ),
  } satisfies React.ComponentPropsWithoutRef<'a'>;

  return {
    anchorProps: mergeProps(internalProps, htmlAttributes),
    hiddenText: getHiddenText({ htmlAttributes }),
    labelProps: { className: styles.label },
  };
}
