import { createArgType, readStyle } from '@package-internal/utils/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Internal/Components/VisuallyHidden',
  component: VisuallyHidden,
  argTypes: {
    children: createArgType({
      control: 'text',
      description: 'The text that assistive technology reads. Required.',
      type: 'React.ReactNode',
    }),
  },
  parameters: {
    docs: {
      description: {
        component: `The \`VisuallyHidden\` component renders a \`<span>\` that stays in the accessibility tree but takes no space on screen. Use it to add to an element's accessible name, such as the "(opens in new tab)" text on an \`Anchor\`.

It's positioned absolutely, so set \`position: relative\` on the element it describes to keep it contained there.

\`\`\`tsx
import { VisuallyHidden } from '@package-internal/components/VisuallyHidden';
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

/**
 * The text adds to the parent's accessible name and takes no space.
 */
export const Default: Story = {
  args: { children: ' (opens in new tab)' },
  render: (args) => (
    <a href="#destination" style={{ position: 'relative' }}>
      Read the case study
      <VisuallyHidden {...args} />
    </a>
  ),
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link');
    const hiddenText = canvas.getByText('(opens in new tab)');
    const readHiddenStyle = (cssProperty: string) =>
      readStyle({ cssProperty, element: hiddenText });

    await expect(anchor).toHaveAccessibleName(
      'Read the case study (opens in new tab)',
    );
    await expect(readHiddenStyle('position')).toBe('absolute');
    await expect(readHiddenStyle('overflow-x')).toBe('hidden');
    await expect(readHiddenStyle('white-space')).toBe('nowrap');
    await expect(readHiddenStyle('clip-path')).not.toBe('none');
    await expect(hiddenText.offsetWidth).toBeLessThanOrEqual(1);
  },
};
