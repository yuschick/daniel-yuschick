import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { FocusScope } from './FocusScope';

const meta: Meta<typeof FocusScope> = {
  title: 'Internal/Components/FocusScope',
  component: FocusScope,
  argTypes: {
    enabled: {
      control: 'boolean',
      description:
        'When `true`, captures the active element. When transitioning to `false`, restores focus to it.',
      table: { category: 'Component Props' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `The \`FocusScope\` component captures the currently focused element when \`enabled\` becomes \`true\` and restores focus to it when \`enabled\` returns to \`false\`. It supports nested overlays via a shared Last In First Out (LIFO) stack, ensuring focus is always returned to the correct trigger in the correct order.

This is a behavioral wrapper that renders no additional DOM elements — it simply wraps children in a fragment.

\`\`\`tsx
import { FocusScope } from '@package-internal/components/FocusScope';
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FocusScope>;

const TRIGGER_BTN = 'trigger-btn';
const CLOSE_BTN = 'close-btn';
const OVERLAY = 'overlay';

function DefaultStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid={TRIGGER_BTN}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open Overlay
      </button>

      <FocusScope enabled={isOpen}>
        {isOpen && (
          <div data-testid={OVERLAY} role="dialog" aria-label="Overlay">
            <p>Overlay content</p>
            <button
              type="button"
              data-testid={CLOSE_BTN}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Close Overlay
            </button>
          </div>
        )}
      </FocusScope>
    </>
  );
}

const NESTED_TRIGGER = 'nested-trigger';
const NESTED_CLOSE = 'nested-close';
const NESTED_OVERLAY = 'nested-overlay';

function NestedStory() {
  const [firstOpen, setFirstOpen] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid={TRIGGER_BTN}
        onClick={() => {
          setFirstOpen(true);
        }}
      >
        Open First
      </button>

      <FocusScope enabled={firstOpen}>
        {firstOpen && (
          <div data-testid={OVERLAY} role="dialog" aria-label="First overlay">
            <button
              type="button"
              data-testid={NESTED_TRIGGER}
              onClick={() => {
                setSecondOpen(true);
              }}
            >
              Open Second
            </button>
            <button
              type="button"
              data-testid={CLOSE_BTN}
              onClick={() => {
                setFirstOpen(false);
              }}
            >
              Close First
            </button>

            <FocusScope enabled={secondOpen}>
              {secondOpen && (
                <div
                  data-testid={NESTED_OVERLAY}
                  role="dialog"
                  aria-label="Second overlay"
                >
                  <p>Nested overlay content</p>
                  <button
                    type="button"
                    data-testid={NESTED_CLOSE}
                    onClick={() => {
                      setSecondOpen(false);
                    }}
                  >
                    Close Second
                  </button>
                </div>
              )}
            </FocusScope>
          </div>
        )}
      </FocusScope>
    </>
  );
}

/**
 * Demonstrates basic return focus behavior.
 * Clicking the trigger opens an overlay; closing it restores focus to the trigger.
 */
export const Default: Story = {
  render: () => <DefaultStory />,
  parameters: {
    docs: {
      story: { autoplay: true },
    },
  },
  play: async ({ canvas, step }) => {
    const triggerBtn = canvas.getByTestId(TRIGGER_BTN);

    await step('Trigger receives focus when overlay is closed', async () => {
      await userEvent.click(triggerBtn);

      const closeBtn = canvas.getByTestId(CLOSE_BTN);
      await expect(canvas.getByTestId(OVERLAY)).toBeInTheDocument();

      await userEvent.click(closeBtn);

      // Focus is restored on the next animation frame.
      await waitFor(() => expect(triggerBtn).toHaveFocus());
    });
  },
};

/**
 * Demonstrates LIFO focus restoration across nested overlays.
 * Closing the inner overlay restores focus to its trigger, and closing the outer restores to the original trigger.
 */
export const Nested: Story = {
  render: () => <NestedStory />,
  parameters: {
    docs: {
      story: { autoplay: true },
    },
  },
  play: async ({ canvas, step }) => {
    const triggerBtn = canvas.getByTestId(TRIGGER_BTN);

    await step('Open first overlay', async () => {
      await userEvent.click(triggerBtn);
      await expect(canvas.getByTestId(OVERLAY)).toBeInTheDocument();
    });

    await step('Open second overlay from within first', async () => {
      const nestedTrigger = canvas.getByTestId(NESTED_TRIGGER);
      await userEvent.click(nestedTrigger);
      await expect(canvas.getByTestId(NESTED_OVERLAY)).toBeInTheDocument();
    });

    await step(
      'Close second overlay — focus returns to nested trigger',
      async () => {
        const nestedClose = canvas.getByTestId(NESTED_CLOSE);
        await userEvent.click(nestedClose);

        const nestedTrigger = within(canvas.getByTestId(OVERLAY)).getByTestId(
          NESTED_TRIGGER,
        );
        // Focus is restored on the next animation frame.
        await waitFor(() => expect(nestedTrigger).toHaveFocus());
      },
    );

    await step(
      'Close first overlay — focus returns to original trigger',
      async () => {
        const closeBtn = canvas.getByTestId(CLOSE_BTN);
        await userEvent.click(closeBtn);
        // Focus is restored on the next animation frame.
        await waitFor(() => expect(triggerBtn).toHaveFocus());
      },
    );
  },
};
