import {
  CONFORMANCE_BOX_FIELDS,
  CONFORMANCE_BOX_NONE,
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
import facts from '@package-specs/icon/icon.facts.json';
import { SIZES } from '@package-types/common';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import {
  ArrowRightIcon,
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from '@dy/icons/react';

import { Icon } from './Icon';

const LABEL = 'Download';

// A glyph layer's fill is the SVG `fill` property, which Figma's `none` leaves at `none`.
const GLYPH_FIELDS = { fill: 'fill' };
const GLYPH_NONE = { fill: 'none' };

const CONFORMANCE_CASES = deriveConformanceCases({
  facts: facts.payload,
  layers: {
    root: {
      fields: {
        fill: CONFORMANCE_BOX_FIELDS.fill,
        height: 'block-size',
        width: 'inline-size',
      },
      none: { fill: CONFORMANCE_BOX_NONE.fill },
      part: 'root',
    },
    'root/0:Glyph': {
      fields: GLYPH_FIELDS,
      // height and width: SVG geometry; the svg fills the root at 100% (D5).
      ignored: ['height', 'width'],
      none: GLYPH_NONE,
      part: 'svg',
    },
    'root/0:Glyph/0:Vector': {
      fields: GLYPH_FIELDS,
      // height and width: path data in the 24×24 viewBox, not CSS values (D5).
      // stroke: Icon sets no color; the stroke is currentColor from the parent, and
      // Figma's text/default binding is only its preview color (D3). The
      // InheritsColor story proves the stroke follows the parent.
      ignored: ['height', 'stroke', 'width'],
      none: GLYPH_NONE,
      part: 'svg > :first-child',
    },
  },
});

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  args: { icon: ChevronDownIcon },
  argTypes: {
    'aria-label': createArgType({
      control: 'text',
      description:
        'Makes the Icon meaningful: a label that is non-empty after trimming gives the Icon the `img` role and that name. Without one, the Icon is decorative and hidden from assistive tech.',
      type: 'string',
    }),
    icon: createArgType({
      description:
        'The glyph to render: an icon component from `@dy/icons/react`, such as `ChevronDownIcon`. Required.',
      type: 'IconComponent',
    }),
    ref: createArgType({
      description: 'A ref to the rendered root `<span>`.',
      type: 'React.Ref<HTMLSpanElement>',
    }),
    size: createArgType({
      defaultValue: 'm',
      description: "The scale of the Icon's dimensions.",
      options: SIZES,
      type: 'Size',
    }),
    ...createAdditionalTableGroups({
      htmlAttributes:
        "SanitizedHTMLAttributes<React.HTMLAttributes<HTMLSpanElement>, keyof React.DOMAttributes<HTMLSpanElement> | 'aria-hidden' | 'aria-labelledby' | 'role' | 'tabIndex'>",
    }),
  },
  parameters: {
    docs: {
      description: {
        component: `The one icon component: a single glyph from \`@dy/icons\` at one of the shared sizes. Pass the icon component itself, never a string name or an element. Icon sets no color, so the glyph takes the text color of whatever contains it.

Icon is decorative by default and hidden from assistive tech, because the label beside it carries the meaning. Pair an icon with a visible label whenever possible. An icon that conveys meaning on its own takes an \`aria-label\`, which gives it the \`img\` role and that name.

Never rely on Icon to name an interactive control: the control names itself, for example an icon-only button's own \`aria-label\`. Icon takes no event handlers; for interaction, wrap it in a Button or Anchor. Choose the size that matches the adjacent text or the containing component.

\`title\` passes through to the root, but it is not a substitute for \`aria-label\`: its tooltip isn't reliably available to keyboard, touch or screen reader users. On a named icon it becomes the description, and on a decorative icon it's hidden from assistive tech with the rest of the Icon.

\`\`\`tsx
import { Icon } from '@dy/react';
import { DownloadIcon } from '@dy/icons/react';

<Icon icon={DownloadIcon} aria-label="Download" size="s" />;
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * The Icon in its bare minimum use and default state: a decorative
 * `chevron-down` at `m`. It renders one `<span>`, hidden with `aria-hidden` and
 * with no role or name, holding the glyph's `<svg>`. The svg keeps the
 * `@dy/icons` defaults: the 24×24 viewBox, a `currentColor` stroke,
 * `aria-hidden` and `focusable="false"`, with no `<title>` or `<desc>`.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('span');
    const glyph = root?.firstElementChild;
    if (!root || !glyph) {
      throw new Error('Expected the Icon to render.');
    }

    await expect(root.children).toHaveLength(1);
    await expect(root).toHaveAttribute('aria-hidden', 'true');
    await expect(root).not.toHaveAttribute('role');
    await expect(root).not.toHaveAttribute('aria-label');
    await expect(glyph.tagName).toBe('svg');
    await expect(glyph).toHaveAttribute('viewBox', '0 0 24 24');
    await expect(glyph).toHaveAttribute('stroke', 'currentColor');
    await expect(glyph).toHaveAttribute('aria-hidden', 'true');
    await expect(glyph).toHaveAttribute('focusable', 'false');
    await expect(glyph.querySelector('title, desc')).toBeNull();
  },
};

/**
 * A named Icon: an `aria-label` gives the root the `img` role and that name,
 * trimmed, with no `aria-hidden`. The svg inside stays hidden, so the name is
 * announced once.
 */
export const Named: Story = {
  args: { 'aria-label': `  ${LABEL}  `, icon: DownloadIcon },
  play: async ({ canvas }) => {
    const root = canvas.getByRole('img', { name: LABEL });

    await expect(root.tagName).toBe('SPAN');
    await expect(root).toHaveAttribute('aria-label', LABEL);
    await expect(root).not.toHaveAttribute('aria-hidden');
    await expect(root.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(canvas.getAllByRole('img')).toHaveLength(1);
  },
};

/**
 * An empty or whitespace-only `aria-label` leaves the Icon decorative: hidden,
 * with no role and no `aria-label` attribute at all.
 */
export const BlankLabel: Story = {
  render: (args) => (
    <>
      <Icon {...args} aria-label="" data-testid="empty" />
      <Icon {...args} aria-label="   " data-testid="whitespace" />
    </>
  ),
  play: async ({ canvas }) => {
    for (const testId of ['empty', 'whitespace']) {
      const root = canvas.getByTestId(testId);

      await expect(root).toHaveAttribute('aria-hidden', 'true');
      await expect(root).not.toHaveAttribute('role');
      await expect(root).not.toHaveAttribute('aria-label');
    }
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
  },
};

/**
 * A named Icon with a `title`: the `aria-label` stays its accessible name, and
 * the `title` becomes its accessible description.
 */
export const NamedWithTitle: Story = {
  args: {
    'aria-label': LABEL,
    icon: DownloadIcon,
    title: 'Download the report',
  },
  play: async ({ canvas }) => {
    const root = canvas.getByRole('img', { name: LABEL });

    await expect(root).toHaveAttribute('title', 'Download the report');
    await expect(root).toHaveAccessibleName(LABEL);
    await expect(root).toHaveAccessibleDescription('Download the report');
  },
};

/**
 * Every size, each square and larger than the one before it. The svg fills its
 * root at every size.
 */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 'var(--dy-space-m)',
      }}
    >
      {SIZES.map((size) => (
        <Icon key={size} {...args} data-testid={size} size={size} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    let previousSize = 0;
    for (const size of SIZES) {
      const root = canvas.getByTestId(size);
      const glyph = root.querySelector('svg');
      if (!glyph) {
        throw new Error(`Expected the ${size} glyph to render.`);
      }
      const rootBox = root.getBoundingClientRect();
      const glyphBox = glyph.getBoundingClientRect();

      await expect(rootBox.width).toBeCloseTo(rootBox.height, 1);
      await expect(rootBox.width).toBeGreaterThan(previousSize);
      await expect(glyphBox.width).toBeCloseTo(rootBox.width, 1);
      await expect(glyphBox.height).toBeCloseTo(rootBox.height, 1);
      previousSize = rootBox.width;
    }
  },
};

/**
 * Different glyphs render in the same box: the glyph is whichever icon
 * component is passed.
 */
export const Glyphs: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-m)' }}>
      {[ArrowRightIcon, ChevronDownIcon, DownloadIcon, ExternalLinkIcon].map(
        (glyph) => (
          <Icon
            key={glyph.name}
            {...args}
            data-testid={glyph.name}
            icon={glyph}
          />
        ),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const roots = [...canvasElement.querySelectorAll('[data-testid]')];
    const shapes = roots.map((root) => root.querySelector('svg')?.innerHTML);

    await expect(roots).toHaveLength(4);
    await expect(new Set(shapes).size).toBe(4);
  },
};

/**
 * The root lays out as `inline-flex`, centered on the line in running text,
 * and never shrinks.
 */
export const Layout: Story = {
  render: (args) => (
    <p>
      Text before <Icon {...args} data-testid="icon" /> text after
    </p>
  ),
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('icon');
    const readRootStyle = (cssProperty: string) =>
      readStyle({ cssProperty, element: root });

    await expect(readRootStyle('display')).toBe('inline-flex');
    await expect(readRootStyle('vertical-align')).toBe('middle');
    await expect(readRootStyle('flex-shrink')).toBe('0');
  },
};

/**
 * Icon sets no color: inside a parent with a different text color, the glyph's
 * stroke follows the parent.
 */
export const InheritsColor: Story = {
  render: (args) => (
    <p data-testid="parent" style={{ color: 'var(--dy-color-text-strong)' }}>
      <Icon {...args} data-testid="icon" />
    </p>
  ),
  play: async ({ canvas }) => {
    const parent = canvas.getByTestId('parent');
    const glyph = canvas.getByTestId('icon').querySelector('svg');
    if (!glyph) {
      throw new Error('Expected the glyph to render.');
    }
    const parentColor = readStyle({ cssProperty: 'color', element: parent });

    await expect(readStyle({ cssProperty: 'stroke', element: glyph })).toBe(
      parentColor,
    );
  },
};

/**
 * Icon isn't focusable, even when named. Tab moves from the control before it
 * to the control after it, and neither the root nor the svg has a `tabindex`.
 */
export const NotFocusable: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <button type="button">Before</button>
      <Icon {...args} data-testid="decorative" />
      <Icon {...args} aria-label={LABEL} data-testid="named" />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    for (const testId of ['decorative', 'named']) {
      const root = canvas.getByTestId(testId);
      await expect(root).not.toHaveAttribute('tabindex');
      await expect(root.querySelector('[tabindex]')).toBeNull();
    }
  },
};

/**
 * Icon is static. Forcing hover, focus and active changes none of its colors,
 * and nothing transitions or animates.
 */
export const Static: Story = {
  render: (args) => <Icon {...args} data-static="true" />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-static="true"]');
    if (!root) {
      throw new Error('Expected the Icon to render.');
    }
    const elements = [root, ...root.querySelectorAll('svg, svg *')];
    const readColors = () =>
      elements.flatMap((element) => [
        readStyle({ cssProperty: 'color', element }),
        readStyle({ cssProperty: 'stroke', element }),
        readStyle({ cssProperty: 'background-color', element }),
      ]);

    await step('Nothing transitions or animates', async () => {
      for (const element of elements) {
        await expect(
          readStyle({ cssProperty: 'transition-duration', element }),
        ).toBe('0s');
        await expect(
          readStyle({ cssProperty: 'animation-name', element }),
        ).toBe('none');
      }
    });

    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const SELECTOR = '[data-static="true"]';

    await step('Hover, focus and active change no color', async () => {
      const colorsAtRest = readColors();
      try {
        for (const pseudoClass of ['hover', 'focus-visible', 'active']) {
          await commands.forcePseudoState(SELECTOR, [pseudoClass]);
          await expect(readColors()).toEqual(colorsAtRest);
        }
      } finally {
        await commands.forcePseudoState(SELECTOR, []);
      }
    });
  },
};

/**
 * Other native attributes, such as `id`, `title`, `data-*` and
 * `aria-describedby`, merge onto the root.
 */
export const NativeAttributes: Story = {
  args: {
    'aria-describedby': 'icon-description',
    'aria-label': LABEL,
    icon: DownloadIcon,
    id: 'icon',
    title: 'Save as PDF',
  },
  render: (args) => (
    <>
      <Icon {...args} data-testid="icon" />
      <p id="icon-description">Saves the report as a PDF</p>
    </>
  ),
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('icon');

    await expect(root.tagName).toBe('SPAN');
    await expect(root).toHaveAttribute('id', 'icon');
    await expect(root).toHaveAttribute('title', 'Save as PDF');
    await expect(root).toHaveAttribute('data-testid', 'icon');
    await expect(root).toHaveAttribute('aria-describedby', 'icon-description');
    await expect(root).toHaveAccessibleDescription('Saves the report as a PDF');
  },
};

/**
 * A ref given to the Icon reaches the rendered root `<span>`.
 */
export const ForwardedRef: Story = {
  render: (args) => {
    const iconRef = (element: HTMLSpanElement | null) => {
      element?.setAttribute('data-ref-attached', 'true');
    };
    return <Icon {...args} aria-label={LABEL} ref={iconRef} />;
  },
  play: async ({ canvas }) => {
    const root = canvas.getByRole('img', { name: LABEL });

    await expect(root.tagName).toBe('SPAN');
    await expect(root).toHaveAttribute('data-ref-attached', 'true');
  },
};

/**
 * In forced-colors mode, the glyph's stroke follows the system text color, and
 * Icon sets no system color of its own.
 */
export const ForcedColors: Story = {
  render: (args) => <Icon {...args} data-testid="icon" />,
  play: async ({ canvas, canvasElement }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const glyph = canvas.getByTestId('icon').querySelector('svg');
    if (!glyph) {
      throw new Error('Expected the glyph to render.');
    }
    const probe = document.createElement('div');
    canvasElement.append(probe);

    await commands.emulateMedia({ forcedColors: 'active' });
    try {
      probe.style.color = 'CanvasText';
      const systemText = readStyle({ cssProperty: 'color', element: probe });

      await expect(readStyle({ cssProperty: 'stroke', element: glyph })).toBe(
        systemText,
      );
    } finally {
      probe.remove();
      await commands.emulateMedia({ forcedColors: null });
    }
  },
};

/**
 * Under 200% text zoom, the Icon doubles in size, because its size tokens are
 * in `rem`.
 */
export const TextResize: Story = {
  render: (args) => <Icon {...args} data-testid="icon" />,
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('icon');
    const rootStyle = document.documentElement.style;
    const originalFontSize = rootStyle.fontSize;

    const atDefault = root.getBoundingClientRect().width;
    const defaultFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    rootStyle.fontSize = `${String(defaultFontSize * 2)}px`;
    try {
      await expect(root.getBoundingClientRect().width).toBeCloseTo(
        atDefault * 2,
        0,
      );
    } finally {
      rootStyle.fontSize = originalFontSize;
    }
  },
};

/**
 * Every variant Figma's facts describe, compared with the rendered styles. It
 * proves which tokens render where. Layout and behavior rest on the other
 * stories.
 */
export const Conformance: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dy-space-m)' }}
    >
      {getConformanceVariants(CONFORMANCE_CASES).map((axes) => {
        const key = getConformanceKey(axes);
        return (
          <Icon
            key={key}
            {...args}
            data-conformance={key}
            size={getConformanceAxis({ axes, name: 'size', options: SIZES })}
          />
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
