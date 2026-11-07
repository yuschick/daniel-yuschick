import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { customProperties } from './customProperties';
import {
  MODES,
  formatGroupName,
  formatModeName,
  groupTokens,
} from './manifest';
import { TokenName } from './TokenName';

export interface ColorTokenTableProps {
  /** Names the table for assistive technology. */
  labelText: string;
  /** Documents every color token under this prefix, e.g. `dy-color-surface`. */
  prefix: string;
}

/**
 * Color tokens grouped by role, with one swatch column per color mode. Each
 * swatch sets `color-scheme` to its mode, so once the tokens use
 * `light-dark()`, the same custom property renders that mode's value.
 */
export const ColorTokenTable = function ColorTokenTable({
  prefix,
  labelText,
}: ColorTokenTableProps) {
  const groups = groupTokens({ prefix });
  const columnCount = MODES.length + 2;

  return (
    <Unstyled>
      <div className={[styles.block, styles.scroller].join(' ')}>
        <table className={styles.table}>
          <caption className={styles['visually-hidden']}>{labelText}</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              {MODES.map((mode) => (
                <th key={mode} scope="col">
                  {formatModeName({ mode })}
                </th>
              ))}
              <th scope="col">Usage</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key}>
              {groups.length > 1 && (
                <tr>
                  <th
                    className={styles['group-heading']}
                    colSpan={columnCount}
                    scope="rowgroup"
                  >
                    {formatGroupName({ key: group.key })}
                  </th>
                </tr>
              )}
              {group.tokens.map((token) => (
                <tr key={token.name}>
                  <th scope="row">
                    <TokenName name={token.name} />
                  </th>
                  {MODES.map((mode) => (
                    <td key={mode}>
                      <span className={styles.mode}>
                        <span
                          aria-hidden="true"
                          className={styles.swatch}
                          style={{
                            ...customProperties({
                              properties: {
                                '--swatch-color': `var(--${token.name})`,
                              },
                            }),
                            colorScheme: mode,
                          }}
                        />
                        <code className={styles.value}>
                          {token.modes?.[mode] ?? token.value}
                        </code>
                      </span>
                    </td>
                  ))}
                  <td className={styles.description}>{token.description}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </Unstyled>
  );
};
