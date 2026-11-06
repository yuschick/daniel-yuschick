import { create } from 'storybook/theming/create';

import manifest from '@dy/tokens/manifest.json' with { type: 'json' };

// Storybook's own UI can't read CSS custom properties, so the font stack comes
// from the token manifest rather than being typed out again here.
export const theme = create({
  base: 'light',
  fontBase: manifest.tokens['dy-font-family-body'].value,
});
