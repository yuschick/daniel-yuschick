import '@dy/tokens/css/dy.css';
import './preview.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  // Every component gets a Documentation page with its props table (FS-07).
  tags: ['autodocs'],
  parameters: {
    a11y: {
      // Axe violations fail the story's test (A11Y-14).
      test: 'error',
    },
    controls: { expanded: true },
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
