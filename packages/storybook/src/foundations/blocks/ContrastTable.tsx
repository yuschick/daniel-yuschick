import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { ContrastLevel } from './ContrastLevel';
import { customProperties } from './customProperties';
import { MODES, formatModeName, getContrastPairs } from './manifest';
import type { ContrastEntry } from './manifest';
import { TokenName } from './TokenName';

export interface ContrastTableProps {
  /** Names the table for assistive technology. */
  labelText: string;
}

function groupByBackground({ pairs }: { pairs: ContrastEntry[] }) {
  const groups = new Map<string, ContrastEntry[]>();
  for (const pair of pairs) {
    groups.set(pair.background, [...(groups.get(pair.background) ?? []), pair]);
  }
  return [...groups];
}

/**
 * Every pair the token build verifies, grouped by background, with the ratio
 * the build measured in each color mode. Text pairs (4.5:1) show a letter
 * sample and non-text pairs (3:1) a ring, each drawn in that mode.
 */
export const ContrastTable = function ContrastTable({
  labelText,
}: ContrastTableProps) {
  const groups = groupByBackground({ pairs: getContrastPairs() });
  const columnCount = MODES.length + 2;

  return (
    <Unstyled>
      <div className={[styles.block, styles.scroller].join(' ')}>
        <table className={styles.table}>
          <caption className={styles['visually-hidden']}>{labelText}</caption>
          <thead>
            <tr>
              <th scope="col">Foreground</th>
              <th scope="col">Requirement</th>
              {MODES.map((mode) => (
                <th key={mode} scope="col">
                  {formatModeName({ mode })}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map(([background, pairs]) => (
            <tbody key={background}>
              <tr>
                <th
                  className={styles['group-heading']}
                  colSpan={columnCount}
                  scope="rowgroup"
                >
                  On <TokenName name={background} />
                </th>
              </tr>
              {pairs.map((pair) => {
                const isText = pair.minimum >= 4.5;
                return (
                  <tr key={`${pair.foreground}-${pair.background}`}>
                    <th scope="row">
                      <TokenName name={pair.foreground} />
                    </th>
                    <td className={styles.description}>
                      {isText ? 'Text' : 'Non-text'}, {pair.minimum}:1
                    </td>
                    {MODES.map((mode) => (
                      <td key={mode}>
                        <span className={styles.mode}>
                          <span
                            aria-hidden="true"
                            className={styles.sample}
                            style={{
                              ...customProperties({
                                properties: {
                                  '--sample-color-foreground': `var(--${pair.foreground})`,
                                  '--sample-color-background': `var(--${pair.background})`,
                                },
                              }),
                              colorScheme: mode,
                            }}
                          >
                            {isText ? (
                              'Aa'
                            ) : (
                              <span className={styles['sample-ring']} />
                            )}
                          </span>
                          <span>
                            <ContrastLevel
                              minimum={pair.minimum}
                              ratio={pair.ratios[mode] ?? 0}
                            />
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </Unstyled>
  );
};
