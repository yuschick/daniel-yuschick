import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import { getUndocumentedTokens } from './manifest';
import { TokenName } from './TokenName';

/**
 * Lists shipped tokens that no section of the page covers, so a token synced
 * from a new Figma collection shows up here instead of going unseen. Renders
 * nothing while every token is documented.
 */
export const UndocumentedTokens = function UndocumentedTokens() {
  const tokens = getUndocumentedTokens();
  if (tokens.length === 0) {
    return null;
  }

  return (
    <Unstyled>
      <div className={[styles.block, styles.callout].join(' ')}>
        <p>
          These tokens ship to CSS but no section of this page documents them
          yet. Add their prefix to <code>DOCUMENTED_PREFIXES</code> and a
          section that renders them.
        </p>
        <ul>
          {tokens.map((token) => (
            <li key={token.name}>
              <TokenName name={token.name} />
            </li>
          ))}
        </ul>
      </div>
    </Unstyled>
  );
};
