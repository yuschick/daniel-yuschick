import {
  CONFORMANCE_BOX_FIELDS,
  CONFORMANCE_BOX_NONE,
  CONFORMANCE_TEXT_FIELDS,
  checkConformance,
  createAdditionalTableGroups,
  createArgType,
  deriveConformanceCases,
  getBrowserCommands,
  getConformanceAxis,
  getConformanceKey,
  getConformanceVariants,
} from '@package-internal/utils/storybook';
import facts from '@package-specs/button.facts.json';
import { EMPHASES } from '@package-types/common';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Button } from './Button';
import type { ButtonProps } from './Button.types';

const BUTTON_INTENTS = [
  'brand',
  'subtle',
  'strong',
] as const satisfies readonly NonNullable<ButtonProps['intent']>[];

const BUTTON_SIZES = ['l', 'm', 's'] as const satisfies readonly NonNullable<
  ButtonProps['size']
>[];

const CONFORMANCE_CASES = deriveConformanceCases({
  facts: facts.payload,
  layers: {
    root: {
      fields: { ...CONFORMANCE_BOX_FIELDS, height: 'min-block-size' },
      // alignCounter, alignPrimary and layoutMode: Anatomy, checked by the Layout story.
      // itemSpacing: out of scope until icons arrive (D10, D26).
      ignored: ['alignCounter', 'alignPrimary', 'itemSpacing', 'layoutMode'],
      none: CONFORMANCE_BOX_NONE,
      part: 'root',
    },
    'root/1:Button': {
      fields: CONFORMANCE_TEXT_FIELDS,
      // letterSpacing: stays unset, because Figma's value is 0 (Anatomy).
      // lineHeight: Figma holds an unbound value, and the token comes from D4.
      ignored: ['letterSpacing', 'lineHeight'],
      part: 'span',
    },
    'root/3:Focus ring': {
      fields: {
        radius: CONFORMANCE_BOX_FIELDS.radius,
        stroke: 'outline-color',
        strokeWidth: 'outline-width',
      },
      // fill: the ring is the button's own outline, which has no fill (D30).
      // x and y: the offset is --dy-space-2xs from the border edge (D5, D30).
      ignored: ['fill', 'x', 'y'],
      part: 'root',
      state: 'focus',
    },
  },
});

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
    onClick: fn(),
  },
  argTypes: {
    'aria-disabled': createArgType({
      description:
        'Accepted as an input and resolved after `isDisabled` and `disabled`. The first defined value wins, even when `false`.',
      type: "React.AriaAttributes['aria-disabled']",
    }),
    children: createArgType({
      control: 'text',
      description: 'The label, which is also the accessible name. Required.',
      type: 'React.ReactNode',
    }),
    disabled: createArgType({
      control: 'boolean',
      description:
        'Accepted as an input and resolved after `isDisabled`, so native-style usage works. The native attribute is never rendered.',
      type: 'boolean',
    }),
    emphasis: createArgType({
      defaultValue: 'primary',
      description: 'The priority of the button within a screen region.',
      options: EMPHASES,
      type: 'Emphasis',
    }),
    intent: createArgType({
      defaultValue: 'brand',
      description: 'The meaning of the action.',
      options: BUTTON_INTENTS,
      type: 'Intent',
    }),
    isDisabled: createArgType({
      control: 'boolean',
      description:
        'Makes the button inoperable while it stays focusable and announced. Takes precedence over `disabled` and `aria-disabled`.',
      type: 'boolean',
    }),
    onClick: createArgType({
      category: 'HTML Attributes',
      description:
        'Called on click, and on Enter and Space, unless the button is disabled.',
      type: 'React.MouseEventHandler<HTMLButtonElement>',
    }),
    ref: createArgType({
      description: 'A ref to the rendered `<button>`.',
      type: 'React.Ref<HTMLButtonElement>',
    }),
    size: createArgType({
      defaultValue: 'm',
      description: "The scale of the button's dimensions.",
      options: BUTTON_SIZES,
      type: 'Size',
    }),
    ...createAdditionalTableGroups({
      htmlAttributes:
        'SanitizedHTMLAttributes<React.ButtonHTMLAttributes<HTMLButtonElement>>',
    }),
  },
  parameters: {
    docs: {
      description: {
        component: `Every action that carries a text label. It renders a native \`<button>\` and nothing else. \`intent\` communicates meaning and \`emphasis\` communicates priority within a screen region.

Use one primary-emphasis action per screen region, and step everything else down to secondary or tertiary. A disabled button keeps its focus and its name, so a keyboard or screen reader user can still find it and learn that it's unavailable.

\`\`\`tsx
import { Button } from '@dy/react';

<Button intent="brand" emphasis="primary" size="m" onClick={handleSave}>
  Save
</Button>;
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

const readResolvedStyle = ({
  cssProperty,
  element,
}: {
  cssProperty: string;
  element: Element;
}) => getComputedStyle(element).getPropertyValue(cssProperty);

/**
 * The button in its bare minimum use and default state: `brand`, `primary` and
 * `m`, with a label and nothing else. It renders one native `<button>` of type
 * `button`, whose only child is the label's `<span>`.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Button' });

    await expect(button.tagName).toBe('BUTTON');
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).not.toHaveAttribute('aria-disabled');
    await expect(button.children).toHaveLength(1);
    await expect(button.firstElementChild?.tagName).toBe('SPAN');
    await expect(button.firstElementChild).toHaveTextContent('Button');
  },
};

/**
 * Every intent at `primary` emphasis. Each one renders its own fill.
 */
export const Intents: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {BUTTON_INTENTS.map((intent) => (
        <Button key={intent} {...args} intent={intent}>
          {intent}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const fills = BUTTON_INTENTS.map((intent) =>
      readResolvedStyle({
        cssProperty: 'background-color',
        element: canvas.getByRole('button', { name: intent }),
      }),
    );

    await expect(new Set(fills).size).toBe(BUTTON_INTENTS.length);
  },
};

/**
 * Every emphasis at `brand` intent. Primary is a solid fill, secondary adds a
 * visible border, and tertiary has no fill at rest. All three keep a border, and
 * where Figma has none, it's transparent.
 */
export const Emphases: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {EMPHASES.map((emphasis) => (
        <Button key={emphasis} {...args} emphasis={emphasis}>
          {emphasis}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const TRANSPARENT = 'rgba(0, 0, 0, 0)';
    const readStyle = ({
      cssProperty,
      name,
    }: {
      cssProperty: string;
      name: string;
    }) =>
      readResolvedStyle({
        cssProperty,
        element: canvas.getByRole('button', { name }),
      });
    const readBorderColor = (name: string) =>
      readStyle({ cssProperty: 'border-block-start-color', name });

    for (const name of EMPHASES) {
      await expect(
        readStyle({ cssProperty: 'border-block-start-style', name }),
      ).toBe('solid');
      await expect(
        readStyle({ cssProperty: 'border-block-start-width', name }),
      ).not.toBe('0px');
    }
    await expect(readBorderColor('primary')).toBe(TRANSPARENT);
    await expect(readBorderColor('secondary')).not.toBe(TRANSPARENT);
    await expect(readBorderColor('tertiary')).toBe(TRANSPARENT);
    await expect(
      readStyle({ cssProperty: 'background-color', name: 'tertiary' }),
    ).toBe(TRANSPARENT);
  },
};

/**
 * Every size, each taller than the one below it.
 */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 'var(--dy-space-s)',
      }}
    >
      {BUTTON_SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const readHeight = (name: string) =>
      canvas.getByRole('button', { name }).offsetHeight;

    await expect(readHeight('l')).toBeGreaterThan(readHeight('m'));
    await expect(readHeight('m')).toBeGreaterThan(readHeight('s'));
  },
};

/**
 * The button lays out as `inline-flex`, centered on both axes, so a button with
 * extra height still centers its label.
 */
export const Layout: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Button' });
    const readStyle = (cssProperty: string) =>
      readResolvedStyle({ cssProperty, element: button });

    await expect(readStyle('display')).toBe('inline-flex');
    await expect(readStyle('align-items')).toBe('center');
    await expect(readStyle('justify-content')).toBe('center');
    await expect(readStyle('text-align')).toBe('center');
  },
};

/**
 * Long labels in a narrow container. The first wraps, centered, so the button
 * grows past its minimum height instead of clipping. The second is one unbroken
 * word, which breaks rather than overflowing.
 */
export const LongLabel: Story = {
  render: (args) => (
    <div
      data-testid="container"
      style={{
        display: 'grid',
        gap: 'var(--dy-space-s)',
        inlineSize: '10rem',
        justifyItems: 'start',
      }}
    >
      <Button {...args}>
        A label that is long enough to wrap onto more lines
      </Button>
      <Button {...args}>Pneumonoultramicroscopicsilicovolcanoconiosis</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByTestId('container');
    const [wrapping, unbroken] = canvas.getAllByRole('button');
    if (!wrapping || !unbroken) {
      throw new Error('Expected both buttons to render.');
    }

    const minimumHeight = Number.parseFloat(
      readResolvedStyle({
        cssProperty: 'min-block-size',
        element: wrapping,
      }),
    );

    await expect(minimumHeight).toBeGreaterThan(0);
    await expect(wrapping.offsetHeight).toBeGreaterThan(minimumHeight);
    await expect(wrapping.scrollHeight).toBeLessThanOrEqual(
      wrapping.clientHeight,
    );
    for (const button of [wrapping, unbroken]) {
      await expect(button.offsetWidth).toBeLessThanOrEqual(
        container.clientWidth,
      );
      await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    }
  },
};

/**
 * A label with inline markup stays a single flex item, so it wraps as a sentence,
 * and the markup still contributes to the accessible name.
 */
export const LabelWithMarkup: Story = {
  args: {
    children: (
      <>
        Save <strong>draft</strong>
      </>
    ),
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Save draft' });

    await expect(button.children).toHaveLength(1);
    await expect(button.firstElementChild?.tagName).toBe('SPAN');
  },
};

/**
 * Tab reaches the button, and Enter and Space activate it through the native
 * element's own behavior, each calling `onClick` once. A pointer click does too.
 */
export const Keyboard: Story = {
  play: async ({ args, canvas, step }) => {
    const button = canvas.getByRole('button', { name: 'Button' });

    await step('Tab reaches the button', async () => {
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step('Enter activates it', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step('Space activates it', async () => {
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalledTimes(2);
    });

    await step('A pointer activates it', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(3);
    });
  },
};

/**
 * `isDisabled` keeps the button focusable and announced as disabled, with
 * `aria-disabled` and never the native attribute. Tab still reaches it, while
 * Enter, Space and a pointer never reach `onClick`, and a click stops propagating
 * and has its default prevented.
 */
export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <form data-testid="form">
      <Button {...args} type="submit" />
    </form>
  ),
  play: async ({ args, canvas, step }) => {
    const button = canvas.getByRole('button', { name: 'Button' });
    const form = canvas.getByTestId('form');
    const handleSubmit = fn((event: Event) => {
      event.preventDefault();
    });
    // React's handler runs at its root, so only a listener above it can tell
    // whether the click stopped propagating.
    const handleDocumentClick = fn();
    form.addEventListener('submit', handleSubmit);
    document.addEventListener('click', handleDocumentClick);

    try {
      await step('It is announced as disabled, not removed', async () => {
        await expect(button).toHaveAttribute('aria-disabled', 'true');
        await expect(button).not.toHaveAttribute('disabled');
        await expect(button).toHaveTextContent('Button');
      });

      await step('Tab reaches it', async () => {
        await userEvent.tab();
        await expect(button).toHaveFocus();
      });

      await step('Enter, Space and a pointer do nothing', async () => {
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        await userEvent.click(button);
        await expect(args.onClick).not.toHaveBeenCalled();
        await expect(handleSubmit).not.toHaveBeenCalled();
        await expect(handleDocumentClick).not.toHaveBeenCalled();
      });

      await step('It shows the not-allowed cursor', async () => {
        await expect(
          readResolvedStyle({ cssProperty: 'cursor', element: button }),
        ).toBe('not-allowed');
      });
    } finally {
      form.removeEventListener('submit', handleSubmit);
      document.removeEventListener('click', handleDocumentClick);
    }
  },
};

/**
 * Disabled resolves from `isDisabled`, then `disabled`, then `aria-disabled`, and
 * the first defined value wins, even when `false`. The native attribute is never
 * rendered, and an operable button still calls `onClick`.
 */
export const DisabledResolution: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <Button {...args} disabled>
        disabled
      </Button>
      <Button {...args} aria-disabled="true">
        aria-disabled
      </Button>
      <Button {...args} aria-disabled="true" isDisabled={false}>
        isDisabled false
      </Button>
      <Button {...args} aria-disabled="true" disabled={false}>
        disabled false
      </Button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    for (const name of ['disabled', 'aria-disabled']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).not.toHaveAttribute('disabled');
      await userEvent.click(button);
    }
    await expect(args.onClick).not.toHaveBeenCalled();

    for (const name of ['isDisabled false', 'disabled false']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).not.toHaveAttribute('aria-disabled');
      await expect(button).not.toHaveAttribute('disabled');
      await userEvent.click(button);
    }
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

/**
 * A consumer can override `type` and pass other native attributes, which merge
 * with what the button computes, here `aria-disabled`.
 */
export const NativeAttributes: Story = {
  args: { isDisabled: true, name: 'save', type: 'submit', value: 'draft' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Button' });

    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('type', 'submit');
    await expect(button).toHaveAttribute('name', 'save');
    await expect(button).toHaveAttribute('value', 'draft');
  },
};

/**
 * A ref given to the button reaches the rendered `<button>`, the element that
 * carries its computed `type`.
 */
export const ForwardedRef: Story = {
  render: (args) => {
    const buttonRef = (element: HTMLButtonElement | null) => {
      element?.setAttribute('data-ref-attached', 'true');
    };
    return <Button {...args} ref={buttonRef} />;
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');

    await expect(button).toHaveAttribute('data-ref-attached', 'true');
    await expect(button).toHaveAttribute('type', 'button');
  },
};

/**
 * Keyboard focus adds the outline, offset from the border edge, and changes no
 * other color. It shows on a disabled button too, and focus on neither button
 * uses `box-shadow`.
 */
export const FocusRing: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-l)' }}>
      <Button {...args}>Enabled</Button>
      <Button {...args} isDisabled>
        Disabled
      </Button>
    </div>
  ),
  play: async ({ canvas, step }) => {
    for (const name of ['Enabled', 'Disabled']) {
      await step(`${name} shows the ring`, async () => {
        const button = canvas.getByRole('button', { name });
        const readStyle = (cssProperty: string) =>
          readResolvedStyle({ cssProperty, element: button });
        const colorsAtRest = [
          readStyle('background-color'),
          readStyle('border-block-start-color'),
          readStyle('color'),
        ];
        await expect(readStyle('outline-style')).toBe('none');

        await userEvent.tab();
        await expect(button).toHaveFocus();

        await expect(readStyle('outline-style')).toBe('solid');
        await expect(readStyle('outline-width')).not.toBe('0px');
        await expect(readStyle('outline-offset')).not.toBe('0px');
        await expect(readStyle('box-shadow')).toBe('none');
        await expect([
          readStyle('background-color'),
          readStyle('border-block-start-color'),
          readStyle('color'),
        ]).toEqual(colorsAtRest);
      });
    }
  },
};

/**
 * Active overrides hover, and disabled overrides both, so a disabled button
 * doesn't react to hover or press.
 */
export const StatePrecedence: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <Button {...args} data-precedence="enabled">
        Enabled
      </Button>
      <Button {...args} data-precedence="disabled" isDisabled>
        Disabled
      </Button>
    </div>
  ),
  play: async ({ canvas, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const readColors = (element: Element) => [
      readResolvedStyle({ cssProperty: 'background-color', element }),
      readResolvedStyle({ cssProperty: 'border-block-start-color', element }),
      readResolvedStyle({ cssProperty: 'color', element }),
    ];
    const enabled = canvas.getByRole('button', { name: 'Enabled' });
    const disabled = canvas.getByRole('button', { name: 'Disabled' });
    const ENABLED_SELECTOR = '[data-precedence="enabled"]';
    const DISABLED_SELECTOR = '[data-precedence="disabled"]';

    await commands.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await step('Active overrides hover on an enabled button', async () => {
        const colorsAtRest = readColors(enabled);
        await commands.forcePseudoState(ENABLED_SELECTOR, ['hover']);
        const colorsOnHover = readColors(enabled);
        await commands.forcePseudoState(ENABLED_SELECTOR, ['active']);
        const colorsOnActive = readColors(enabled);
        await commands.forcePseudoState(ENABLED_SELECTOR, ['hover', 'active']);

        await expect(colorsOnHover).not.toEqual(colorsAtRest);
        await expect(colorsOnActive).not.toEqual(colorsAtRest);
        await expect(colorsOnActive).not.toEqual(colorsOnHover);
        await expect(readColors(enabled)).toEqual(colorsOnActive);
        await commands.forcePseudoState(ENABLED_SELECTOR, []);
      });

      await step('Hover and active leave disabled unchanged', async () => {
        const colorsAtRest = readColors(disabled);
        await commands.forcePseudoState(DISABLED_SELECTOR, ['hover']);
        await expect(readColors(disabled)).toEqual(colorsAtRest);
        await commands.forcePseudoState(DISABLED_SELECTOR, ['active']);
        await expect(readColors(disabled)).toEqual(colorsAtRest);
      });
    } finally {
      await commands.forcePseudoState(DISABLED_SELECTOR, []);
      await commands.emulateMedia({ reducedMotion: null });
    }
  },
};

/**
 * In forced-colors mode, a disabled button uses `GrayText` for its text and border
 * and `Canvas` for its surface. An enabled button of each emphasis relies on the
 * browser's defaults, and keeps its border and its focus outline.
 */
export const ForcedColors: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {EMPHASES.map((emphasis) => (
        <Button key={emphasis} {...args} emphasis={emphasis}>
          {emphasis}
        </Button>
      ))}
      {EMPHASES.map((emphasis) => (
        <Button key={emphasis} {...args} emphasis={emphasis} isDisabled>
          {`disabled ${emphasis}`}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const probe = document.createElement('div');
    canvasElement.append(probe);
    const resolveColor = (color: string) => {
      probe.style.color = color;
      return getComputedStyle(probe).color;
    };

    await commands.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    try {
      for (const emphasis of EMPHASES) {
        await step(`Disabled ${emphasis} uses system colors`, async () => {
          const element = canvas.getByRole('button', {
            name: `disabled ${emphasis}`,
          });
          const readStyle = (cssProperty: string) =>
            readResolvedStyle({ cssProperty, element });

          await expect(readStyle('color')).toBe(resolveColor('GrayText'));
          await expect(readStyle('border-block-start-color')).toBe(
            resolveColor('GrayText'),
          );
          await expect(readStyle('background-color')).toBe(
            resolveColor('Canvas'),
          );
        });

        await step(`Enabled ${emphasis} keeps its boundary`, async () => {
          const element = canvas.getByRole('button', { name: emphasis });
          const readStyle = (cssProperty: string) =>
            readResolvedStyle({ cssProperty, element });

          await expect(readStyle('color')).not.toBe(resolveColor('GrayText'));
          await expect(readStyle('border-block-start-style')).toBe('solid');
          await expect(readStyle('border-block-start-width')).not.toBe('0px');
        });
      }

      await step('Focus keeps its outline', async () => {
        const element = canvas.getByRole('button', { name: 'primary' });
        await userEvent.tab();
        await expect(element).toHaveFocus();
        await expect(
          readResolvedStyle({ cssProperty: 'outline-style', element }),
        ).toBe('solid');
      });
    } finally {
      probe.remove();
      await commands.emulateMedia({ forcedColors: null, reducedMotion: null });
    }
  },
};

/**
 * State colors transition only for people who haven't asked for reduced motion.
 */
export const ReducedMotion: Story = {
  play: async ({ canvas, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const button = canvas.getByRole('button', { name: 'Button' });
    const readStyle = (cssProperty: string) =>
      readResolvedStyle({ cssProperty, element: button });

    try {
      await step('Colors transition with no preference', async () => {
        await commands.emulateMedia({ reducedMotion: 'no-preference' });
        await expect(readStyle('transition-property')).toBe(
          'background-color, border-color, color',
        );
        await expect(readStyle('transition-duration')).not.toBe('0s');
      });

      await step('Nothing transitions with reduced motion', async () => {
        await commands.emulateMedia({ reducedMotion: 'reduce' });
        await expect(readStyle('transition-duration')).toBe('0s');
      });
    } finally {
      await commands.emulateMedia({ reducedMotion: null });
    }
  },
};

/**
 * Every variant Figma's facts describe, each forced into its state, compared with
 * the rendered styles. It proves which tokens render where. Layout and behavior
 * rest on the other stories.
 */
export const Conformance: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dy-space-s)' }}
    >
      {getConformanceVariants(CONFORMANCE_CASES).map((axes) => {
        const key = getConformanceKey(axes);
        return (
          <Button
            key={key}
            {...args}
            data-conformance={key}
            emphasis={getConformanceAxis({
              axes,
              name: 'emphasis',
              options: EMPHASES,
            })}
            intent={getConformanceAxis({
              axes,
              name: 'intent',
              options: BUTTON_INTENTS,
            })}
            isDisabled={axes.state === 'disabled'}
            size={getConformanceAxis({
              axes,
              name: 'size',
              options: BUTTON_SIZES,
            })}
          >
            {key}
          </Button>
        );
      })}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const failures = await checkConformance({
      canvasElement,
      cases: CONFORMANCE_CASES,
    });

    await expect(failures ?? []).toEqual([]);
  },
};
