import '@dy/tokens/css/dy.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    a11y: {
      // Axe violations fail the story's test (A11Y-14).
      test: 'error',
    },
    controls: { expanded: true },
  },
};

export default preview;
