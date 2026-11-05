import '@dy/tokens/css/dy.css';

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
      storySort: {
        order: [
          'Daniel Yuschick',
          'Foundations',
          'Components',
          'Hooks',
          'Providers',
        ],
      },
    },
  },
};

export default preview;
