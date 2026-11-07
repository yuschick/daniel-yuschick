import styles from './blocks.module.css';
import { parseCubicBezier } from './manifest';

export interface EasingCurveProps {
  /** A `cubic-bezier()` value. */
  value: string;
}

/**
 * Plots a `cubic-bezier()` as progress (up) over time (right). The plot grows
 * past the unit square when a curve overshoots, as a bounce does.
 */
export const EasingCurve = function EasingCurve({ value }: EasingCurveProps) {
  const points = parseCubicBezier({ value });
  if (!points) {
    return null;
  }

  const [x1, y1, x2, y2] = points;
  const top = Math.max(1, y1, y2);
  const bottom = Math.min(0, y1, y2);
  // SVG's y axis points down, so progress is flipped against the top edge
  const flip = (progress: number) => top - progress;

  return (
    <svg
      aria-hidden="true"
      className={styles.curve}
      preserveAspectRatio="none"
      viewBox={`0 0 1 ${String(top - bottom)}`}
    >
      <path
        className={styles['curve-axis']}
        d={`M0 ${String(flip(0))} H1 M0 ${String(flip(1))} H1`}
      />
      <path
        className={styles['curve-line']}
        d={`M0 ${String(flip(0))} C${String(x1)} ${String(flip(y1))} ${String(x2)} ${String(flip(y2))} 1 ${String(flip(1))}`}
      />
    </svg>
  );
};
