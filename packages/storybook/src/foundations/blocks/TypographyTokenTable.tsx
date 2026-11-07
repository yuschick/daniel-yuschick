import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { customProperties } from './customProperties';
import { getTokens, toPixels } from './manifest';
import { TokenName } from './TokenName';

export const TYPOGRAPHY_KINDS = [
  'family',
  'line-height',
  'size',
  'weight',
] as const;
export type TypographyKind = (typeof TYPOGRAPHY_KINDS)[number];

export interface TypographyTokenTableProps {
  /** Which type property to document; reads `dy-font-[kind]-*`. */
  kind: TypographyKind;
  /** Names the table for assistive technology. */
  labelText: string;
}

const SPECIMEN_PROPERTY = {
  family: '--specimen-font-family',
  'line-height': '--specimen-line-height',
  size: '--specimen-font-size',
  weight: '--specimen-font-weight',
} as const satisfies Record<TypographyKind, `--${string}`>;

// A pangram shows every letterform; the leading sample needs two lines.
const SPECIMEN_TEXT = 'Sphinx of black quartz, judge my vow.';
const LEADING_TEXT =
  'Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly.';

/** Type tokens, each set in a specimen that uses the token itself. */
export const TypographyTokenTable = function TypographyTokenTable({
  kind,
  labelText,
}: TypographyTokenTableProps) {
  const tokens = getTokens({ prefix: `dy-font-${kind}` }).sort(
    (first, second) =>
      kind === 'family'
        ? 0
        : Number.parseFloat(first.value) - Number.parseFloat(second.value),
  );

  return (
    <Unstyled>
      <div className={[styles.block, styles.scroller].join(' ')}>
        <table className={styles.table}>
          <caption className={styles['visually-hidden']}>{labelText}</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              <th scope="col">Specimen</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const pixels = toPixels({ value: token.value });
              return (
                <tr key={token.name}>
                  <th scope="row">
                    <TokenName name={token.name} />
                    {token.description && (
                      <p className={styles.description}>{token.description}</p>
                    )}
                  </th>
                  <td>
                    <code className={styles.value}>{token.value}</code>
                    {pixels && (
                      <span className={styles.description}> · {pixels}</span>
                    )}
                  </td>
                  <td>
                    <p
                      className={[
                        styles.specimen,
                        kind === 'line-height' ? styles.leading : '',
                      ].join(' ')}
                      style={customProperties({
                        properties: {
                          [SPECIMEN_PROPERTY[kind]]: `var(--${token.name})`,
                        },
                      })}
                    >
                      {kind === 'line-height' ? LEADING_TEXT : SPECIMEN_TEXT}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Unstyled>
  );
};
