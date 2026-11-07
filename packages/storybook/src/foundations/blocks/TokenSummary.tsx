import { Unstyled } from '@storybook/addon-docs/blocks';

import styles from './blocks.module.css';
import {
  DEFAULT_THEME,
  MODES,
  THEMES,
  formatModeName,
  getContrastPairs,
  getTokenCount,
} from './manifest';

/** The shape of the shipped system at a glance, read from the manifest. */
export const TokenSummary = function TokenSummary() {
  const items = [
    { label: 'Tokens shipped to CSS', value: String(getTokenCount()) },
    {
      label: THEMES.length === 1 ? 'Theme' : 'Themes',
      value: THEMES.length === 1 ? DEFAULT_THEME : String(THEMES.length),
    },
    {
      label: MODES.length === 1 ? 'Color mode' : 'Color modes',
      value: MODES.map((mode) => formatModeName({ mode })).join(', '),
    },
    {
      label: 'Contrast pairs verified',
      value: String(getContrastPairs().length),
    },
  ];

  return (
    <Unstyled>
      <ul className={[styles.block, styles.summary].join(' ')}>
        {items.map((item) => (
          <li key={item.label} className={styles['summary-item']}>
            <span className={styles['summary-label']}>{item.label}</span>
            <span className={styles['summary-value']}>{item.value}</span>
          </li>
        ))}
      </ul>
    </Unstyled>
  );
};
