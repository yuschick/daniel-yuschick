import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { EasingCurve } from './EasingCurve';
import { getTokens } from './manifest';
import { TokenName } from './TokenName';

export interface MotionTokenTableProps {
  /** Names the table for assistive technology. */
  labelText: string;
  /** Documents every token under this prefix, e.g. `dy-motion-easing`. */
  prefix: string;
}

/**
 * Motion tokens. Easing curves are drawn rather than animated, so the page
 * itself never moves (A11Y-10).
 */
export const MotionTokenTable = function MotionTokenTable({
  prefix,
  labelText,
}: MotionTokenTableProps) {
  const tokens = getTokens({ prefix }).sort((first, second) =>
    first.type === 'duration'
      ? Number.parseFloat(first.value) - Number.parseFloat(second.value)
      : 0,
  );
  const hasCurves = tokens.some((token) => token.type === 'cubicBezier');

  return (
    <Unstyled>
      <div className={[styles.block, styles.scroller].join(' ')}>
        <table className={styles.table}>
          <caption className={styles['visually-hidden']}>{labelText}</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              {hasCurves && (
                <th scope="col">
                  <span className={styles['visually-hidden']}>Curve</span>
                </th>
              )}
              <th scope="col">Usage</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.name}>
                <th scope="row">
                  <TokenName name={token.name} />
                </th>
                <td>
                  <code className={styles.value}>{token.value}</code>
                </td>
                {hasCurves && (
                  <td>
                    <EasingCurve value={token.value} />
                  </td>
                )}
                <td className={styles.description}>{token.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Unstyled>
  );
};
