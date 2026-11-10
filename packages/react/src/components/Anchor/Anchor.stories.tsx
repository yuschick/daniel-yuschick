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
  readStyle,
} from '@package-internal/utils/storybook';
import facts from '@package-specs/anchor/anchor.facts.json';
import { EMPHASES } from '@package-types/common';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Anchor } from './Anchor';
import type { AnchorProps } from './Anchor.types';

const ANCHOR_INTENTS = [
  'brand',
  'subtle',
  'strong',
] as const satisfies readonly NonNullable<AnchorProps['intent']>[];

const ANCHOR_SIZES = ['l', 'm', 's'] as const satisfies readonly NonNullable<
  AnchorProps['size']
>[];

const ANCHOR_VARIANTS = [
  'default',
  'inline',
] as const satisfies readonly NonNullable<AnchorProps['variant']>[];

const DESTINATION = '#destination';

// Inline facts this story can't compare, each proved by its own story instead.
// root paddingTop and paddingBottom: the inline form has invisible block padding
// for its target size (D10, InlineTarget). fontStyle: it inherits every font
// property (D3, InlineInheritsTypography). height: it has no minimum height (D3,
// Inline), and `auto` computes differently on a flex item, as this story renders
// it, than on the block-level probe the check resolves against.
const OVERRULED_INLINE_FACTS = new Set([
  'root height',
  'root paddingTop',
  'root paddingBottom',
  'root/1:Anchor fontStyle',
]);

const CONFORMANCE_FACTS = {
  ...facts.payload,
  summarized: facts.payload.summarized.map((layer) => ({
    ...layer,
    facts: layer.facts.map((fact) =>
      OVERRULED_INLINE_FACTS.has(`${layer.path} ${fact.field}`) && fact.values
        ? {
            ...fact,
            values: Object.fromEntries(
              Object.entries(fact.values).filter(
                ([key]) => !key.startsWith('inline'),
              ),
            ),
          }
        : fact,
    ),
  })),
};

const CONFORMANCE_CASES = deriveConformanceCases({
  facts: CONFORMANCE_FACTS,
  layers: {
    root: {
      fields: { ...CONFORMANCE_BOX_FIELDS, height: 'min-block-size' },
      // alignCounter, alignPrimary and layoutMode: Anatomy, checked by the Layout story.
      // itemSpacing: out of scope until icons arrive (D6).
      ignored: ['alignCounter', 'alignPrimary', 'itemSpacing', 'layoutMode'],
      // radius: the inline form has none (D3).
      none: { ...CONFORMANCE_BOX_NONE, radius: '0px' },
      part: 'root',
    },
    'root/1:Anchor': {
      fields: CONFORMANCE_TEXT_FIELDS,
      // letterSpacing: stays unset, because Figma's value is 0 (Anatomy).
      // lineHeight: Figma holds an unbound value, and the token comes from D4.
      // textDecoration: the underline keyword has no token, and the Inline story checks it (D7).
      ignored: ['letterSpacing', 'lineHeight', 'textDecoration'],
      part: 'span',
    },
    'root/3:Focus ring': {
      fields: {
        radius: CONFORMANCE_BOX_FIELDS.radius,
        stroke: 'outline-color',
        strokeWidth: 'outline-width',
      },
      // fill: the ring is the anchor's own outline, which has no fill (D8).
      // x and y: the offset is --dy-space-2xs from the border edge (D8).
      ignored: ['fill', 'x', 'y'],
      // radius: the inline form has none, so neither does its outline (D3).
      none: { radius: '0px' },
      part: 'root',
      state: 'focus',
    },
  },
});

const handleClick = fn((event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
});

const meta: Meta<typeof Anchor> = {
  title: 'Components/Anchor',
  component: Anchor,
  args: {
    children: 'Anchor',
    href: DESTINATION,
    onClick: handleClick,
  },
  argTypes: {
    children: createArgType({
      control: 'text',
      description: 'The label, which is also the accessible name. Required.',
      type: 'React.ReactNode',
    }),
    emphasis: createArgType({
      defaultValue: 'primary',
      description:
        'The priority of the link within a screen region. Not available when `variant` is `inline`.',
      options: EMPHASES,
      type: 'Emphasis',
    }),
    href: createArgType({
      control: 'text',
      description: "The link's destination. Required.",
      type: 'string',
    }),
    intent: createArgType({
      defaultValue: 'brand',
      description: 'The meaning of the link.',
      options: ANCHOR_INTENTS,
      type: 'Intent',
    }),
    onClick: createArgType({
      category: 'HTML Attributes',
      description: 'Called on click and on Enter.',
      type: 'React.MouseEventHandler<HTMLAnchorElement>',
    }),
    ref: createArgType({
      description: 'A ref to the rendered `<a>`.',
      type: 'React.Ref<HTMLAnchorElement>',
    }),
    size: createArgType({
      defaultValue: 'm',
      description:
        "The scale of the link's dimensions. Not available when `variant` is `inline`.",
      options: ANCHOR_SIZES,
      type: 'Size',
    }),
    variant: createArgType({
      defaultValue: 'default',
      description:
        '`default` is the button-styled link, and `inline` is recolored text inside a run of prose.',
      options: ANCHOR_VARIANTS,
      type: 'Variant',
    }),
    ...createAdditionalTableGroups({
      htmlAttributes:
        "SanitizedHTMLAttributes<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-disabled' | 'href'>>",
    }),
  },
  parameters: {
    docs: {
      description: {
        component: `Every control that navigates and carries a text label. It renders a native \`<a href>\`, either styled like Button or, with \`variant="inline"\`, as recolored text inside a run of prose. Use Button when activation performs an action in place.

Use one primary-emphasis anchor per screen region, and step everything else down to secondary or tertiary. The label names the destination. Anchor has no disabled state: if a destination is unavailable, don't render the link.

A link with \`target="_blank"\` or \`download\` says so in its accessible name, in English. Pass \`aria-label\` to replace that text, and include both the visible label and the new-tab or download cue.

\`\`\`tsx
import { Anchor } from '@dy/react';

<Anchor href="/work" intent="brand" emphasis="primary" size="m">
  See the work
</Anchor>;

<p>
  Read <Anchor href="/about" variant="inline">more about me</Anchor>.
</p>;
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Anchor>;

/**
 * The anchor in its bare minimum use and default state: `brand`, `primary` and
 * `m`, with a label and a destination. It renders one native `<a>` whose only
 * child is the label's `<span>`.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link', { name: 'Anchor' });

    await expect(anchor.tagName).toBe('A');
    await expect(anchor).toHaveAttribute('href', DESTINATION);
    await expect(anchor).not.toHaveAttribute('role');
    await expect(anchor).not.toHaveAttribute('tabindex');
    await expect(anchor.children).toHaveLength(1);
    await expect(anchor.firstElementChild?.tagName).toBe('SPAN');
    await expect(anchor.firstElementChild).toHaveTextContent('Anchor');
  },
};

/**
 * Every intent at `primary` emphasis. Each one renders its own fill.
 */
export const Intents: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {ANCHOR_INTENTS.map((intent) => (
        <Anchor key={intent} {...args} intent={intent}>
          {intent}
        </Anchor>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const fills = ANCHOR_INTENTS.map((intent) =>
      readStyle({
        cssProperty: 'background-color',
        element: canvas.getByRole('link', { name: intent }),
      }),
    );

    await expect(new Set(fills).size).toBe(ANCHOR_INTENTS.length);
  },
};

/**
 * Every emphasis at `brand` intent. All three keep a border, and where Figma has
 * none, it's transparent. Tertiary has no fill at rest.
 */
export const Emphases: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {EMPHASES.map((emphasis) => (
        <Anchor
          key={emphasis}
          emphasis={emphasis}
          href={href}
          onClick={onClick}
        >
          {emphasis}
        </Anchor>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const TRANSPARENT = 'rgba(0, 0, 0, 0)';
    const readAnchorStyle = ({
      cssProperty,
      name,
    }: {
      cssProperty: string;
      name: string;
    }) =>
      readStyle({
        cssProperty,
        element: canvas.getByRole('link', { name }),
      });
    const readBorderColor = (name: string) =>
      readAnchorStyle({ cssProperty: 'border-block-start-color', name });

    for (const name of EMPHASES) {
      await expect(
        readAnchorStyle({ cssProperty: 'border-block-start-style', name }),
      ).toBe('solid');
      await expect(
        readAnchorStyle({ cssProperty: 'border-block-start-width', name }),
      ).not.toBe('0px');
    }
    await expect(readBorderColor('primary')).toBe(TRANSPARENT);
    await expect(readBorderColor('secondary')).not.toBe(TRANSPARENT);
    await expect(readBorderColor('tertiary')).toBe(TRANSPARENT);
    await expect(
      readAnchorStyle({ cssProperty: 'background-color', name: 'tertiary' }),
    ).toBe(TRANSPARENT);
  },
};

/**
 * Every size, each taller than the one below it, and each at least 24px tall.
 */
export const Sizes: Story = {
  render: ({ href, onClick }) => (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 'var(--dy-space-s)',
      }}
    >
      {ANCHOR_SIZES.map((size) => (
        <Anchor key={size} href={href} onClick={onClick} size={size}>
          {size}
        </Anchor>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const readHeight = (name: string) =>
      canvas.getByRole('link', { name }).offsetHeight;

    await expect(readHeight('l')).toBeGreaterThan(readHeight('m'));
    await expect(readHeight('m')).toBeGreaterThan(readHeight('s'));
    await expect(readHeight('s')).toBeGreaterThanOrEqual(24);
  },
};

/**
 * The default form lays out as `inline-flex`, centered on both axes, with no
 * underline, and is the containing block for its hidden text.
 */
export const Layout: Story = {
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link', { name: 'Anchor' });
    const readAnchorStyle = (cssProperty: string) =>
      readStyle({ cssProperty, element: anchor });

    await expect(readAnchorStyle('display')).toBe('inline-flex');
    await expect(readAnchorStyle('align-items')).toBe('center');
    await expect(readAnchorStyle('justify-content')).toBe('center');
    await expect(readAnchorStyle('text-align')).toBe('center');
    await expect(readAnchorStyle('text-decoration-line')).toBe('none');
    await expect(readAnchorStyle('position')).toBe('relative');
  },
};

/**
 * Long labels in a narrow container. The first wraps, so the anchor grows past
 * its minimum height. The second is one unbroken word, which breaks rather than
 * overflowing.
 */
export const LongLabel: Story = {
  render: ({ href, onClick }) => (
    <div
      data-testid="container"
      style={{
        display: 'grid',
        gap: 'var(--dy-space-s)',
        inlineSize: '10rem',
        justifyItems: 'start',
      }}
    >
      <Anchor href={href} onClick={onClick}>
        A label that is long enough to wrap onto more lines
      </Anchor>
      <Anchor href={href} onClick={onClick}>
        Pneumonoultramicroscopicsilicovolcanoconiosis
      </Anchor>
    </div>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByTestId('container');
    const [wrapping, unbroken] = canvas.getAllByRole('link');
    if (!wrapping || !unbroken) {
      throw new Error('Expected both anchors to render.');
    }

    const minimumHeight = Number.parseFloat(
      readStyle({ cssProperty: 'min-block-size', element: wrapping }),
    );

    await expect(minimumHeight).toBeGreaterThan(0);
    await expect(wrapping.offsetHeight).toBeGreaterThan(minimumHeight);
    for (const anchor of [wrapping, unbroken]) {
      await expect(anchor.offsetWidth).toBeLessThanOrEqual(
        container.clientWidth,
      );
      await expect(anchor.scrollWidth).toBeLessThanOrEqual(anchor.clientWidth);
    }
  },
};

/**
 * The inline form inside a sentence. It renders inline with no fill, border,
 * radius, minimum height or inline padding, and it stays underlined. It wraps
 * across lines with the sentence.
 */
export const Inline: Story = {
  render: ({ href, onClick }) => (
    <p style={{ inlineSize: '12rem' }}>
      A sentence with{' '}
      <Anchor href={href} onClick={onClick} variant="inline">
        a link that is long enough to wrap across more than one line
      </Anchor>{' '}
      inside it.
    </p>
  ),
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link');
    const readAnchorStyle = (cssProperty: string) =>
      readStyle({ cssProperty, element: anchor });

    await expect(readAnchorStyle('display')).toBe('inline');
    await expect(readAnchorStyle('text-decoration-line')).toBe('underline');
    await expect(readAnchorStyle('background-color')).toBe('rgba(0, 0, 0, 0)');
    await expect(readAnchorStyle('border-block-start-style')).toBe('none');
    await expect(readAnchorStyle('border-start-start-radius')).toBe('0px');
    await expect(readAnchorStyle('min-block-size')).toBe('0px');
    await expect(readAnchorStyle('padding-inline-start')).toBe('0px');
    await expect(readAnchorStyle('padding-inline-end')).toBe('0px');
    await expect(readAnchorStyle('position')).toBe('relative');
    await expect(anchor.getClientRects().length).toBeGreaterThan(1);
  },
};

/**
 * The inline form sets no typography, so each intent inherits every font property
 * from the surrounding text.
 */
export const InlineInheritsTypography: Story = {
  render: ({ href, onClick }) => (
    <p
      data-testid="prose"
      style={{
        fontFamily: 'monospace',
        fontSize: '1.125rem',
        fontStyle: 'italic',
        fontWeight: 300,
        letterSpacing: '0.1em',
        lineHeight: 2,
      }}
    >
      {ANCHOR_INTENTS.map((intent) => (
        <Anchor
          key={intent}
          href={href}
          intent={intent}
          onClick={onClick}
          variant="inline"
        >
          {intent}{' '}
        </Anchor>
      ))}
    </p>
  ),
  play: async ({ canvas }) => {
    const prose = canvas.getByTestId('prose');
    const properties = [
      'font-family',
      'font-size',
      'font-style',
      'font-weight',
      'letter-spacing',
      'line-height',
    ];

    for (const intent of ANCHOR_INTENTS) {
      const anchor = canvas.getByRole('link', { name: intent });
      for (const cssProperty of properties) {
        await expect(readStyle({ cssProperty, element: anchor })).toBe(
          readStyle({ cssProperty, element: prose }),
        );
      }
    }
  },
};

/**
 * Invisible block padding gives each line of the inline form a 24px hit height,
 * and a paragraph with the link is exactly as tall as one without it.
 */
export const InlineTarget: Story = {
  render: ({ href, onClick }) => (
    <>
      <p data-testid="without">A sentence with a word inside it.</p>
      <p data-testid="with">
        A sentence with{' '}
        <Anchor href={href} onClick={onClick} variant="inline">
          a
        </Anchor>{' '}
        word inside it.
      </p>
    </>
  ),
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link');

    await expect(
      Number.parseFloat(
        readStyle({ cssProperty: 'padding-block-start', element: anchor }),
      ),
    ).toBeGreaterThan(0);
    await expect(anchor.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      24,
    );
    await expect(canvas.getByTestId('with').offsetHeight).toBe(
      canvas.getByTestId('without').offsetHeight,
    );
  },
};

/**
 * Tab reaches the link and Enter activates it through the native element. Space
 * does not, as on every native link.
 */
export const Keyboard: Story = {
  play: async ({ args, canvas, step }) => {
    const anchor = canvas.getByRole('link', { name: 'Anchor' });
    const onClick = args.onClick;

    await step('Tab reaches the link', async () => {
      await userEvent.tab();
      await expect(anchor).toHaveFocus();
    });

    await step('Space does not activate it', async () => {
      await userEvent.keyboard(' ');
      await expect(onClick).not.toHaveBeenCalled();
    });

    await step('Enter activates it', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(onClick).toHaveBeenCalledTimes(1);
    });

    await step('A pointer activates it', async () => {
      await userEvent.click(anchor);
      await expect(onClick).toHaveBeenCalledTimes(2);
    });
  },
};

/**
 * A link that opens a new tab says so in its accessible name, in visually hidden
 * text that takes no space.
 */
export const OpensInNewTab: Story = {
  args: { children: 'Read the case study', target: '_blank' },
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link', {
      name: 'Read the case study (opens in new tab)',
    });
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

/**
 * On an inline link the appended text adds nothing visible, so punctuation right
 * after the link sits as close as it does after a plain link, while the name
 * still has its space.
 */
export const InlineAppendedText: Story = {
  render: ({ href, onClick }) => (
    <>
      <p>
        <Anchor href={href} onClick={onClick} variant="inline">
          docs
        </Anchor>
        .
      </p>
      <p>
        <Anchor href={href} onClick={onClick} target="_blank" variant="inline">
          docs
        </Anchor>
        .
      </p>
    </>
  ),
  play: async ({ canvas }) => {
    const plain = canvas.getByRole('link', { name: 'docs' });
    const newTab = canvas.getByRole('link', {
      name: 'docs (opens in new tab)',
    });

    await expect(newTab.getBoundingClientRect().width).toBe(
      plain.getBoundingClientRect().width,
    );
  },
};

/**
 * A download says so in its accessible name, and that text wins when the link
 * also opens a new tab.
 */
export const Downloads: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <Anchor download href={href} onClick={onClick}>
        Report
      </Anchor>
      <Anchor download href={href} onClick={onClick} target="_blank">
        Résumé
      </Anchor>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Report (downloads file)' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Résumé (downloads file)' }),
    ).toBeVisible();
  },
};

/**
 * A consumer label replaces the appended text, so nothing is appended. A correct
 * label includes the visible text and the new-tab or download cue, which types
 * can't enforce.
 */
export const ConsumerLabel: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <Anchor
        aria-label="Report, in a new window"
        href={href}
        onClick={onClick}
        target="_blank"
      >
        Report
      </Anchor>
      <span id="custom-name">Résumé, in a new window</span>
      <Anchor
        aria-labelledby="custom-name"
        href={href}
        onClick={onClick}
        target="_blank"
      >
        Résumé
      </Anchor>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Report, in a new window' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Résumé, in a new window' }),
    ).toBeVisible();
    await expect(canvas.queryByText('(opens in new tab)')).toBeNull();
  },
};

/**
 * Other native attributes reach the `<a>`.
 */
export const NativeAttributes: Story = {
  args: { id: 'native', rel: 'author' },
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link', { name: 'Anchor' });

    await expect(anchor).toHaveAttribute('id', 'native');
    await expect(anchor).toHaveAttribute('rel', 'author');
  },
};

/**
 * A ref given to the anchor reaches the rendered `<a>`.
 */
export const ForwardedRef: Story = {
  render: ({ children, href, onClick }) => {
    const anchorRef = (element: HTMLAnchorElement | null) => {
      element?.setAttribute('data-ref-attached', 'true');
    };
    return (
      <Anchor ref={anchorRef} href={href} onClick={onClick}>
        {children}
      </Anchor>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveAttribute(
      'data-ref-attached',
      'true',
    );
  },
};

/**
 * Keyboard focus adds the outline on both forms, offset from the edge, and changes
 * no color. It never uses `box-shadow`.
 */
export const FocusRing: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-l)' }}>
      <Anchor href={href} onClick={onClick}>
        Default
      </Anchor>
      <p>
        <Anchor href={href} onClick={onClick} variant="inline">
          Inline
        </Anchor>
      </p>
    </div>
  ),
  play: async ({ canvas, step }) => {
    for (const name of ['Default', 'Inline']) {
      await step(`${name} shows the ring`, async () => {
        const anchor = canvas.getByRole('link', { name });
        const readAnchorStyle = (cssProperty: string) =>
          readStyle({ cssProperty, element: anchor });
        const colorsAtRest = [
          readAnchorStyle('background-color'),
          readAnchorStyle('color'),
        ];
        await expect(readAnchorStyle('outline-style')).toBe('none');

        await userEvent.tab();
        await expect(anchor).toHaveFocus();

        await expect(readAnchorStyle('outline-style')).toBe('solid');
        await expect(readAnchorStyle('outline-width')).not.toBe('0px');
        await expect(readAnchorStyle('outline-offset')).not.toBe('0px');
        await expect(readAnchorStyle('box-shadow')).toBe('none');
        await expect([
          readAnchorStyle('background-color'),
          readAnchorStyle('color'),
        ]).toEqual(colorsAtRest);
      });
    }
  },
};

/**
 * Keyboard focus drops the inline form's block padding, so the ring is a true
 * offset from the text on every side, and the prose doesn't move.
 */
export const InlineFocusPadding: Story = {
  render: ({ href, onClick }) => (
    <p data-testid="prose">
      A sentence with{' '}
      <Anchor href={href} onClick={onClick} variant="inline">
        a link
      </Anchor>{' '}
      inside it.
    </p>
  ),
  play: async ({ canvas }) => {
    const anchor = canvas.getByRole('link');
    const prose = canvas.getByTestId('prose');
    const heightAtRest = prose.offsetHeight;
    const readPadding = () =>
      readStyle({ cssProperty: 'padding-block-start', element: anchor });

    await expect(readPadding()).not.toBe('0px');
    await userEvent.tab();
    await expect(anchor).toHaveFocus();
    await expect(readPadding()).toBe('0px');
    await expect(prose.offsetHeight).toBe(heightAtRest);
  },
};

/**
 * Active overrides hover for color, and for the inline underline's thickness,
 * which thickens on hover and active. Focus doesn't change thickness, so a link
 * that is focused and hovered uses the hover thickness.
 */
export const StatePrecedence: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <Anchor data-precedence="default" href={href} onClick={onClick}>
        Default
      </Anchor>
      <p>
        <Anchor
          data-precedence="inline"
          href={href}
          intent="strong"
          onClick={onClick}
          variant="inline"
        >
          Inline
        </Anchor>
      </p>
    </div>
  ),
  play: async ({ canvas, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const readColors = (element: Element) => [
      readStyle({ cssProperty: 'background-color', element }),
      readStyle({ cssProperty: 'color', element }),
    ];
    const defaultAnchor = canvas.getByRole('link', { name: 'Default' });
    const inlineAnchor = canvas.getByRole('link', { name: 'Inline' });
    const DEFAULT_SELECTOR = '[data-precedence="default"]';
    const INLINE_SELECTOR = '[data-precedence="inline"]';
    const readThickness = () =>
      readStyle({
        cssProperty: 'text-decoration-thickness',
        element: inlineAnchor,
      });

    await commands.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await step('Active overrides hover on colors', async () => {
        const colorsAtRest = readColors(defaultAnchor);
        await commands.forcePseudoState(DEFAULT_SELECTOR, ['hover']);
        const colorsOnHover = readColors(defaultAnchor);
        await commands.forcePseudoState(DEFAULT_SELECTOR, ['active']);
        const colorsOnActive = readColors(defaultAnchor);
        await commands.forcePseudoState(DEFAULT_SELECTOR, ['hover', 'active']);

        await expect(colorsOnHover).not.toEqual(colorsAtRest);
        await expect(colorsOnActive).not.toEqual(colorsOnHover);
        await expect(readColors(defaultAnchor)).toEqual(colorsOnActive);
        await commands.forcePseudoState(DEFAULT_SELECTOR, []);
      });

      await step('The inline underline thickens', async () => {
        await expect(readThickness()).toBe('1px');
        await commands.forcePseudoState(INLINE_SELECTOR, ['focus-visible']);
        await expect(readThickness()).toBe('1px');
        await commands.forcePseudoState(INLINE_SELECTOR, ['hover']);
        await expect(readThickness()).toBe('2px');
        await commands.forcePseudoState(INLINE_SELECTOR, [
          'focus-visible',
          'hover',
        ]);
        await expect(readThickness()).toBe('2px');
        await commands.forcePseudoState(INLINE_SELECTOR, ['active']);
        await expect(readThickness()).toBe('2px');
      });
    } finally {
      await commands.forcePseudoState(DEFAULT_SELECTOR, []);
      await commands.forcePseudoState(INLINE_SELECTOR, []);
      await commands.emulateMedia({ reducedMotion: null });
    }
  },
};

/**
 * In forced-colors mode both forms rely on the browser's link colors. The default
 * form keeps its border and outline, and the inline form keeps its underline.
 */
export const ForcedColors: Story = {
  render: ({ href, onClick }) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      {EMPHASES.map((emphasis) => (
        <Anchor
          key={emphasis}
          emphasis={emphasis}
          href={href}
          onClick={onClick}
        >
          {emphasis}
        </Anchor>
      ))}
      <p>
        <Anchor href={href} onClick={onClick} variant="inline">
          Inline
        </Anchor>
      </p>
    </div>
  ),
  play: async ({ canvas, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }

    await commands.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    try {
      for (const name of EMPHASES) {
        await step(`${name} keeps its boundary and outline`, async () => {
          const element = canvas.getByRole('link', { name });
          const readAnchorStyle = (cssProperty: string) =>
            readStyle({ cssProperty, element });

          await expect(readAnchorStyle('border-block-start-style')).toBe(
            'solid',
          );
          await expect(readAnchorStyle('border-block-start-width')).not.toBe(
            '0px',
          );
          await userEvent.tab();
          await expect(element).toHaveFocus();
          await expect(readAnchorStyle('outline-style')).toBe('solid');
        });
      }

      await step('Inline keeps its underline and outline', async () => {
        const element = canvas.getByRole('link', { name: 'Inline' });

        await expect(
          readStyle({ cssProperty: 'text-decoration-line', element }),
        ).toBe('underline');
        await userEvent.tab();
        await expect(element).toHaveFocus();
        await expect(readStyle({ cssProperty: 'outline-style', element })).toBe(
          'solid',
        );
      });
    } finally {
      await commands.emulateMedia({ forcedColors: null, reducedMotion: null });
    }
  },
};

/**
 * State colors transition only for people who haven't asked for reduced motion,
 * and underline thickness never animates.
 */
export const ReducedMotion: Story = {
  play: async ({ canvas, step }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const anchor = canvas.getByRole('link', { name: 'Anchor' });
    const readAnchorStyle = (cssProperty: string) =>
      readStyle({ cssProperty, element: anchor });

    try {
      await step('Colors transition with no preference', async () => {
        await commands.emulateMedia({ reducedMotion: 'no-preference' });
        await expect(readAnchorStyle('transition-property')).toBe(
          'background-color, border-color, color',
        );
        await expect(readAnchorStyle('transition-duration')).not.toBe('0s');
      });

      await step('Nothing transitions with reduced motion', async () => {
        await commands.emulateMedia({ reducedMotion: 'reduce' });
        await expect(readAnchorStyle('transition-duration')).toBe('0s');
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
  render: ({ href, onClick }) => (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dy-space-s)' }}
    >
      {getConformanceVariants(CONFORMANCE_CASES).map((axes) => {
        const key = getConformanceKey(axes);
        const intent = getConformanceAxis({
          axes,
          name: 'intent',
          options: ANCHOR_INTENTS,
        });
        return axes.variant === 'inline' ? (
          <Anchor
            key={key}
            data-conformance={key}
            href={href}
            intent={intent}
            onClick={onClick}
            variant="inline"
          >
            {key}
          </Anchor>
        ) : (
          <Anchor
            key={key}
            data-conformance={key}
            emphasis={getConformanceAxis({
              axes,
              name: 'emphasis',
              options: EMPHASES,
            })}
            href={href}
            intent={intent}
            onClick={onClick}
            size={getConformanceAxis({
              axes,
              name: 'size',
              options: ANCHOR_SIZES,
            })}
          >
            {key}
          </Anchor>
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
