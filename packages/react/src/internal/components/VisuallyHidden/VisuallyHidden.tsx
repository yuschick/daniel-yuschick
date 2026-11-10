import styles from './VisuallyHidden.module.css';
import type { VisuallyHiddenProps } from './VisuallyHidden.types';

/**
 * Text that stays in the accessibility tree but takes no space on screen. Its
 * nearest positioned ancestor contains it, so set `position: relative` on the
 * element it describes.
 */
export const VisuallyHidden = function VisuallyHidden({
  children,
}: VisuallyHiddenProps) {
  return <span className={styles['visually-hidden']}>{children}</span>;
};
