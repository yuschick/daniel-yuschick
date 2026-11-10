import { getIconProps } from './getIconProps';
import styles from './Icon.module.css';
import type { IconProps } from './Icon.types';

export const Icon = function Icon({
  ref: externalRef,
  // undefined leaves the Icon decorative (D8), so it has no default.
  'aria-label': ariaLabel,
  icon,
  size = 'm',
  ...htmlAttributes
}: IconProps) {
  const { rootProps } = getIconProps({ ariaLabel, htmlAttributes, size });
  // JSX needs a capitalized name to render a component held in a variable.
  const Glyph = icon;

  return (
    <span ref={externalRef} {...rootProps}>
      <Glyph className={styles.glyph} />
    </span>
  );
};
