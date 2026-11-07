import styles from './blocks.module.css';
import { getConformance } from './manifest';

export interface ContrastLevelProps {
  minimum: number;
  ratio: number;
}

/** The ratio and the WCAG level it reaches, in words as well as color (A11Y-08). */
export const ContrastLevel = function ContrastLevel({
  ratio,
  minimum,
}: ContrastLevelProps) {
  const level = getConformance({ ratio, minimum });
  return (
    <>
      <span className={styles.ratio}>{ratio.toFixed(2)}:1</span>{' '}
      <span
        className={[
          styles.level,
          level === 'Fails' ? styles['level-fails'] : '',
        ].join(' ')}
      >
        {level}
      </span>
    </>
  );
};
