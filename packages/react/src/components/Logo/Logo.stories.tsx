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
import facts from '@package-specs/logo.facts.json';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { Logo } from './Logo';
import { LOCKUPS } from './Logo.types';
import type { LogoProps } from './Logo.types';

const LOGO_SIZES = ['s', 'm', 'l'] as const satisfies readonly NonNullable<
  LogoProps['size']
>[];

// The sizes D9 directs narrow layouts to.
const REFLOW_SIZES = ['s', 'm'] as const satisfies readonly NonNullable<
  LogoProps['size']
>[];

const NAME = 'Daniel Yuschick';

// The paths follow Figma's layer order, so each Vector maps to one path.
const VECTOR_LAYER = {
  fields: { fill: 'fill' },
  // height and width: SVG geometry from the viewBox, not CSS values (D3).
  ignored: ['height', 'width'],
};

const CONFORMANCE_CASES = deriveConformanceCases({
  facts: facts.payload,
  layers: {
    root: {
      fields: { ...CONFORMANCE_BOX_FIELDS, itemSpacing: 'column-gap' },
      // alignCounter, alignPrimary and layoutMode: Anatomy, checked by the Layout story.
      // height: the root's block size is never set, so it hugs the SVG (Anatomy, D3).
      // The Logo Initials layer checks that height, and the Layout story proves the root matches it.
      // width: SVG geometry, following the viewBox ratio (D3).
      ignored: [
        'alignCounter',
        'alignPrimary',
        'height',
        'layoutMode',
        'width',
      ],
      none: {
        ...CONFORMANCE_BOX_NONE,
        itemSpacing: 'normal',
        paddingBottom: '0',
        paddingLeft: '0',
        paddingRight: '0',
        paddingTop: '0',
      },
      part: 'root',
    },
    'root/0:Logo Initials': {
      fields: { fill: CONFORMANCE_BOX_FIELDS.fill, height: 'block-size' },
      // width: auto, following the viewBox ratio (D3).
      ignored: ['width'],
      none: { fill: CONFORMANCE_BOX_NONE.fill },
      part: 'svg',
    },
    'root/0:Logo Initials/0:initials': {
      fields: {},
      // height and width: SVG geometry, not CSS values (D3).
      ignored: ['height', 'width'],
      part: 'svg',
    },
    'root/0:Logo Initials/0:initials/0:Vector': {
      ...VECTOR_LAYER,
      part: 'path:nth-of-type(1)',
    },
    'root/0:Logo Initials/0:initials/1:Vector': {
      ...VECTOR_LAYER,
      part: 'path:nth-of-type(2)',
    },
    'root/0:Logo Initials/0:initials/2:Vector': {
      ...VECTOR_LAYER,
      part: 'path:nth-of-type(3)',
    },
    'root/0:Logo Initials/0:initials/3:Vector': {
      ...VECTOR_LAYER,
      part: 'path:nth-of-type(4)',
    },
    'root/1:Daniel Yuschick': {
      // The name only renders in the full lockup (Anatomy, D1).
      axes: { lockup: 'full' },
      fields: CONFORMANCE_TEXT_FIELDS,
      // letterSpacing: stays unset, because Figma's value is 0 (Anatomy).
      // lineHeight: Figma holds an unbound value, and the token comes from D4.
      // textCase: becomes text-transform, checked by the Lockups story (D5).
      ignored: ['letterSpacing', 'lineHeight', 'textCase'],
      part: 'span',
    },
  },
});

const meta: Meta<typeof Logo> = {
  title: 'Components/Logo',
  component: Logo,
  argTypes: {
    lockup: createArgType({
      defaultValue: 'mark',
      description:
        'The composition of the Logo: the initials alone, or the initials and the name.',
      options: LOCKUPS,
      type: 'Lockup',
    }),
    ref: createArgType({
      description: 'A ref to the rendered root `<span>`.',
      type: 'React.Ref<HTMLSpanElement>',
    }),
    size: createArgType({
      defaultValue: 'm',
      description: "The scale of the Logo's dimensions.",
      options: LOGO_SIZES,
      type: 'Size',
    }),
    ...createAdditionalTableGroups({
      htmlAttributes:
        "SanitizedHTMLAttributes<React.HTMLAttributes<HTMLSpanElement>, 'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'children' | 'role' | 'tabIndex'>",
    }),
  },
  parameters: {
    docs: {
      description: {
        component: `The Daniel Yuschick brand mark, for branded regions such as the page header and footer. It's static and non-interactive. The \`mark\` lockup is the initials alone, exposed as an image named ${NAME}. The \`full\` lockup adds the name as real text, and hides the initials from assistive tech so the name is read once.

Use at most one \`full\` lockup per page, in the page header, and the \`mark\` lockup everywhere else, including the footer. In narrow layouts, use the \`s\` or \`m\` full lockup. Never swap to the mark lockup responsively: the name never wraps, and it fits at 320px in those sizes.

To make the Logo a link, wrap it in your own \`<a>\`, which takes its name from the Logo. A link \`aria-label\` should only add purpose, and must start with the visible name (WCAG 2.5.3), for example \`${NAME}, home\`. To hide a duplicate Logo, wrap it in an element with \`aria-hidden\`.

\`\`\`tsx
import { Logo } from '@dy/react';

<a href="/">
  <Logo lockup="full" size="m" />
</a>;
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

/**
 * The Logo in its bare minimum use and default state: the `mark` lockup at `m`.
 * It renders one `<span>` holding one inline `<svg>`, exposed as an image named
 * Daniel Yuschick through `aria-label`, with no SVG `<title>` or `<desc>`. The
 * SVG keeps the 119:194 viewBox, sets no fixed dimensions, and fills its four
 * paths with `currentColor`.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const mark = canvas.getByRole('img', { name: NAME });
    const root = mark.parentElement;

    await expect(mark.tagName).toBe('svg');
    await expect(mark).toHaveAttribute('aria-label', NAME);
    await expect(mark).toHaveAttribute('viewBox', '0 0 119 194');
    await expect(mark).not.toHaveAttribute('width');
    await expect(mark).not.toHaveAttribute('height');
    await expect(mark.querySelector('title, desc')).toBeNull();
    const paths = mark.querySelectorAll('path');
    await expect(paths).toHaveLength(4);
    for (const path of paths) {
      await expect(path).toHaveAttribute('fill', 'currentColor');
    }
    await expect(root?.tagName).toBe('SPAN');
    await expect(root?.children).toHaveLength(1);
    await expect(root).not.toHaveAttribute('role');
    await expect(root).not.toHaveAttribute('tabindex');
  },
};

/**
 * Both lockups. The `full` lockup hides its SVG with `aria-hidden` and follows
 * it with the name, written `Daniel Yuschick` in the source and uppercased only
 * by `text-transform`, so it's read once, as a name and not as letters.
 */
export const Lockups: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--dy-space-m)' }}>
      {LOCKUPS.map((lockup) => (
        <div key={lockup} data-testid={lockup}>
          <Logo {...args} lockup={lockup} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, step }) => {
    await step(
      'The mark lockup is an image named Daniel Yuschick',
      async () => {
        const container = canvas.getByTestId('mark');

        await expect(
          container.querySelector('[role="img"]'),
        ).toHaveAccessibleName(NAME);
        await expect(container).toHaveTextContent(/^$/);
      },
    );

    await step('The full lockup shows the name as text, once', async () => {
      const container = canvas.getByTestId('full');
      const root = container.firstElementChild;
      const mark = root?.querySelector('svg');
      const name = root?.lastElementChild;
      if (!root || !mark || !name) {
        throw new Error('Expected the full lockup to render.');
      }

      await expect(root.children).toHaveLength(2);
      await expect(mark).toHaveAttribute('aria-hidden', 'true');
      await expect(mark).not.toHaveAttribute('role');
      await expect(mark).not.toHaveAttribute('aria-label');
      await expect(name.tagName).toBe('SPAN');
      await expect(name.textContent).toBe(NAME);
      await expect(
        readStyle({ cssProperty: 'text-transform', element: name }),
      ).toBe('uppercase');
      await expect(container.querySelector('[role="img"]')).toBeNull();
    });
  },
};

/**
 * Every size of both lockups, each taller than the one below it. The SVG's width
 * follows the 119:194 viewBox at every size.
 */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--dy-space-m)' }}>
      {LOCKUPS.map((lockup) => (
        <div
          key={lockup}
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 'var(--dy-space-m)',
          }}
        >
          {LOGO_SIZES.map((size) => (
            <Logo
              key={size}
              {...args}
              data-testid={`${lockup}-${size}`}
              lockup={lockup}
              size={size}
            />
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const lockup of LOCKUPS) {
      const readHeight = (size: string) =>
        canvas.getByTestId(`${lockup}-${size}`).getBoundingClientRect().height;

      await expect(readHeight('l')).toBeGreaterThan(readHeight('m'));
      await expect(readHeight('m')).toBeGreaterThan(readHeight('s'));

      for (const size of LOGO_SIZES) {
        const mark = canvas
          .getByTestId(`${lockup}-${size}`)
          .querySelector('svg');
        if (!mark) {
          throw new Error(`Expected the ${lockup} ${size} mark to render.`);
        }
        const { height, width } = mark.getBoundingClientRect();

        await expect(width / height).toBeCloseTo(119 / 194, 2);
      }
    }
  },
};

/**
 * The root lays out as `inline-flex`, vertically centered, and hugs the SVG, so
 * its height is the SVG's. The SVG never shrinks, and the name never wraps. Only
 * the `full` lockup sets a gap.
 */
export const Layout: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--dy-space-m)' }}>
      {LOCKUPS.flatMap((lockup) =>
        LOGO_SIZES.map((size) => (
          <div key={`${lockup}-${size}`}>
            <Logo
              {...args}
              data-testid={`${lockup}-${size}`}
              lockup={lockup}
              size={size}
            />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const lockup of LOCKUPS) {
      for (const size of LOGO_SIZES) {
        const root = canvas.getByTestId(`${lockup}-${size}`);
        const mark = root.querySelector('svg');
        if (!mark) {
          throw new Error(`Expected the ${lockup} ${size} mark to render.`);
        }
        const readRootStyle = (cssProperty: string) =>
          readStyle({ cssProperty, element: root });

        await expect(readRootStyle('display')).toBe('inline-flex');
        await expect(readRootStyle('align-items')).toBe('center');
        await expect(readRootStyle('vertical-align')).toBe('middle');
        await expect(
          readStyle({ cssProperty: 'flex-shrink', element: mark }),
        ).toBe('0');
        await expect(root.getBoundingClientRect().height).toBeCloseTo(
          mark.getBoundingClientRect().height,
          1,
        );

        if (lockup === 'full') {
          const name = root.lastElementChild;
          if (!name) {
            throw new Error(`Expected the ${size} name to render.`);
          }
          await expect(
            readStyle({ cssProperty: 'white-space', element: name }),
          ).toBe('nowrap');
          await expect(readRootStyle('column-gap')).not.toBe('normal');
        } else {
          await expect(readRootStyle('column-gap')).toBe('normal');
        }
      }
    }
  },
};

/**
 * Inside a link, each lockup gives the link its name, Daniel Yuschick. Inline,
 * the Logo centers on the surrounding text instead of sitting on its baseline.
 */
export const InLink: Story = {
  render: (args) => (
    <p>
      Text before{' '}
      {LOCKUPS.map((lockup) => (
        <a key={lockup} data-testid={lockup} href="#logo">
          <Logo {...args} lockup={lockup} />
        </a>
      ))}{' '}
      text after
    </p>
  ),
  play: async ({ canvas }) => {
    for (const lockup of LOCKUPS) {
      const link = canvas.getByTestId(lockup);
      const root = link.firstElementChild;
      if (!root) {
        throw new Error(`Expected the ${lockup} Logo to render.`);
      }

      await expect(link).toHaveAccessibleName(NAME);
      await expect(
        readStyle({ cssProperty: 'vertical-align', element: root }),
      ).toBe('middle');
    }
  },
};

/**
 * Logo isn't focusable. Tab moves from the control before it to the control after
 * it, past both lockups, which carry no `tabindex`.
 */
export const NotFocusable: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dy-space-s)' }}>
      <button type="button">Before</button>
      {LOCKUPS.map((lockup) => (
        <Logo key={lockup} {...args} data-testid={lockup} lockup={lockup} />
      ))}
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    for (const lockup of LOCKUPS) {
      const root = canvas.getByTestId(lockup);
      await expect(root).not.toHaveAttribute('tabindex');
      await expect(root.querySelector('[tabindex]')).toBeNull();
    }
  },
};

/**
 * Logo is static. Forcing hover, focus and active changes none of its colors, and
 * nothing transitions or animates.
 */
export const Static: Story = {
  args: { lockup: 'full' },
  render: (args) => <Logo {...args} data-static="true" />,
  play: async ({ canvas, step }) => {
    const root = canvas.getByText(NAME).parentElement;
    if (!root) {
      throw new Error('Expected the Logo to render.');
    }
    const elements = [root, ...root.querySelectorAll('svg, path, span')];
    const readColors = () =>
      elements.flatMap((element) => [
        readStyle({ cssProperty: 'color', element }),
        readStyle({ cssProperty: 'fill', element }),
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
    'aria-describedby': 'logo-description',
    id: 'logo',
    title: NAME,
  },
  render: (args) => (
    <>
      <Logo {...args} data-testid="logo" />
      <p id="logo-description">Back to the home page</p>
    </>
  ),
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('logo');

    await expect(root.tagName).toBe('SPAN');
    await expect(root).toHaveAttribute('id', 'logo');
    await expect(root).toHaveAttribute('title', NAME);
    await expect(root).toHaveAttribute('aria-describedby', 'logo-description');
    await expect(canvas.getByRole('img', { name: NAME })).toBeInTheDocument();
  },
};

/**
 * A ref given to the Logo reaches the rendered root `<span>`.
 */
export const ForwardedRef: Story = {
  render: (args) => {
    const logoRef = (element: HTMLSpanElement | null) => {
      element?.setAttribute('data-ref-attached', 'true');
    };
    return <Logo {...args} ref={logoRef} />;
  },
  play: async ({ canvas }) => {
    const root = canvas.getByRole('img', { name: NAME }).parentElement;

    await expect(root?.tagName).toBe('SPAN');
    await expect(root).toHaveAttribute('data-ref-attached', 'true');
  },
};

/**
 * In forced-colors mode, the name and the mark's paths both follow the system
 * text color, and Logo sets no system color of its own.
 */
export const ForcedColors: Story = {
  args: { lockup: 'full' },
  play: async ({ canvas, canvasElement }) => {
    const commands = getBrowserCommands();
    if (!commands) {
      return;
    }
    const name = canvas.getByText(NAME);
    const root = name.parentElement;
    if (!root) {
      throw new Error('Expected the Logo to render.');
    }
    const probe = document.createElement('div');
    canvasElement.append(probe);

    await commands.emulateMedia({ forcedColors: 'active' });
    try {
      probe.style.color = 'CanvasText';
      const systemText = readStyle({ cssProperty: 'color', element: probe });

      await expect(readStyle({ cssProperty: 'color', element: root })).toBe(
        systemText,
      );
      await expect(readStyle({ cssProperty: 'color', element: name })).toBe(
        systemText,
      );
      for (const path of root.querySelectorAll('path')) {
        await expect(readStyle({ cssProperty: 'fill', element: path })).toBe(
          systemText,
        );
      }
    } finally {
      probe.remove();
      await commands.emulateMedia({ forcedColors: null });
    }
  },
};

/**
 * Under 200% text zoom, the mark, the gap and the name all scale together,
 * because their tokens are in `rem` and the line height is unitless.
 */
export const TextResize: Story = {
  args: { lockup: 'full' },
  play: async ({ canvas }) => {
    const name = canvas.getByText(NAME);
    const root = name.parentElement;
    const mark = root?.querySelector('svg');
    if (!root || !mark) {
      throw new Error('Expected the Logo to render.');
    }
    const measure = () => ({
      fontSize: Number.parseFloat(
        readStyle({ cssProperty: 'font-size', element: name }),
      ),
      gap: Number.parseFloat(
        readStyle({ cssProperty: 'column-gap', element: root }),
      ),
      markHeight: mark.getBoundingClientRect().height,
      nameHeight: name.getBoundingClientRect().height,
    });
    const rootStyle = document.documentElement.style;
    const originalFontSize = rootStyle.fontSize;

    const atDefault = measure();
    const defaultFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    rootStyle.fontSize = `${String(defaultFontSize * 2)}px`;
    try {
      const atDouble = measure();

      await expect(atDouble.markHeight).toBeCloseTo(
        atDefault.markHeight * 2,
        0,
      );
      await expect(atDouble.gap).toBeCloseTo(atDefault.gap * 2, 0);
      await expect(atDouble.fontSize).toBeCloseTo(atDefault.fontSize * 2, 0);
      await expect(atDouble.nameHeight).toBeCloseTo(
        atDefault.nameHeight * 2,
        0,
      );
    } finally {
      rootStyle.fontSize = originalFontSize;
    }
  },
};

/**
 * At 320px wide, with the WCAG 1.4.12 text-spacing overrides applied, the `s`
 * and `m` full lockups fit on one line without clipping.
 */
export const Reflow: Story = {
  render: (args) => (
    <div
      data-testid="container"
      data-text-spacing="true"
      style={{ display: 'grid', gap: 'var(--dy-space-m)', inlineSize: '320px' }}
    >
      {REFLOW_SIZES.map((size) => (
        <div key={size}>
          <Logo {...args} data-testid={size} lockup="full" size={size} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByTestId('container');
    // WCAG 1.4.12's overrides, applied the way a user style sheet would.
    const textSpacing = document.createElement('style');
    textSpacing.textContent = `[data-text-spacing="true"] * {
  letter-spacing: 0.12em !important;
  line-height: 1.5 !important;
  word-spacing: 0.16em !important;
}`;
    document.head.append(textSpacing);

    try {
      for (const size of REFLOW_SIZES) {
        const root = canvas.getByTestId(size);
        const name = root.lastElementChild;
        if (!(name instanceof HTMLElement)) {
          throw new Error(`Expected the ${size} name to render.`);
        }

        await expect(
          readStyle({ cssProperty: 'letter-spacing', element: name }),
        ).not.toBe('normal');
        await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(
          container.getBoundingClientRect().right,
        );
        await expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
        await expect(name.scrollHeight).toBeLessThanOrEqual(name.clientHeight);
        await expect(name.getClientRects()).toHaveLength(1);
      }
    } finally {
      textSpacing.remove();
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
          <Logo
            key={key}
            {...args}
            data-conformance={key}
            lockup={getConformanceAxis({
              axes,
              name: 'lockup',
              options: LOCKUPS,
            })}
            size={getConformanceAxis({
              axes,
              name: 'size',
              options: LOGO_SIZES,
            })}
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
