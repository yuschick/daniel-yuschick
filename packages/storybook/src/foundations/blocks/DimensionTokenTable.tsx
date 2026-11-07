import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { customProperties } from './customProperties';
import { getTokens, toPixels } from './manifest';
import type { DocumentedToken } from './manifest';
import { TokenName } from './TokenName';

export const DIMENSION_VISUALS = [
  'bar',
  'none',
  'radius',
  'square',
  'stroke',
] as const;
export type DimensionVisual = (typeof DIMENSION_VISUALS)[number];

export interface DimensionTokenTableProps {
  /** Names the table for assistive technology. */
  labelText: string;
  /** Documents every token under this prefix, e.g. `dy-space`. */
  prefix: string;
  /**
   * How each value is drawn: a bar for lengths, a square for sizes, a tile for
   * radii, a line for border widths, or nothing for values too large to draw.
   * @default 'bar'
   */
  visual?: DimensionVisual;
}

const VISUAL_PROPERTY = {
  bar: '--bar-size',
  none: '--bar-size',
  radius: '--tile-border-radius',
  square: '--square-size',
  stroke: '--stroke-size',
} as const satisfies Record<DimensionVisual, `--${string}`>;

function sortByValue({ tokens }: { tokens: DocumentedToken[] }) {
  // Sizes read smallest first, which a name sort can't give (2xl before l).
  // A percentage radius rounds fully at any size, so it sorts last.
  const measure = (token: DocumentedToken) =>
    token.value.endsWith('%')
      ? Number.POSITIVE_INFINITY
      : Number.parseFloat(token.value);
  return [...tokens].sort((first, second) => measure(first) - measure(second));
}

/** Dimension tokens with their CSS value, px equivalent and a drawing of each. */
export const DimensionTokenTable = function DimensionTokenTable({
  prefix,
  labelText,
  visual = 'bar',
}: DimensionTokenTableProps) {
  const tokens = sortByValue({ tokens: getTokens({ prefix }) });

  return (
    <Unstyled>
      <div className={[styles.block, styles.scroller].join(' ')}>
        <table className={styles.table}>
          <caption className={styles['visually-hidden']}>{labelText}</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              {visual !== 'none' && (
                <th scope="col">
                  <span className={styles['visually-hidden']}>Preview</span>
                </th>
              )}
              <th scope="col">Usage</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const pixels = toPixels({ value: token.value });
              return (
                <tr key={token.name}>
                  <th scope="row">
                    <TokenName name={token.name} />
                  </th>
                  <td>
                    <code className={styles.value}>{token.value}</code>
                    {pixels && (
                      <span className={styles.description}> · {pixels}</span>
                    )}
                  </td>
                  {visual !== 'none' && (
                    <td>
                      <div
                        aria-hidden="true"
                        className={styles[visual]}
                        style={customProperties({
                          properties: {
                            [VISUAL_PROPERTY[visual]]: `var(--${token.name})`,
                          },
                        })}
                      />
                    </td>
                  )}
                  <td className={styles.description}>{token.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Unstyled>
  );
};
