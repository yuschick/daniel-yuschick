import '@dy/css/global.css';
import './preview.css';

import type { Preview } from '@storybook/react-vite';

import { theme } from './theme';

const preview: Preview = {
  // Every component gets a Documentation page with its props table (FS-07).
  tags: ['autodocs'],
  parameters: {
    a11y: {
      // Axe violations fail the story's test (A11Y-14).
      test: 'error',
    },
    controls: { expanded: true },
    // Documentation pages use the same theme as the manager UI.
    docs: { theme },
    options: {
      // Storybook reads this statically, so the order must stay an inline literal.
      storySort: {
        method: 'alphabetical',
        order: [
          'Daniel Yuschick',
          'Foundations',
          'Components',
          ['*', ['Documentation', '*']],
          'Hooks',
          ['*', ['Documentation', '*']],
          'Providers',
          ['*', ['Documentation', '*']],
          '*',
        ],
      },
    },
  },
};

export default preview;
