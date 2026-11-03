/**
 * TShirtSize represents the sizing scale used throughout the design system.
 */
type TShirtSize = '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl';

/**
 * Densities represent the compactness of a component's layout.
 * Compact means reduced spacing and tighter layout.
 * Default means standard spacing and layout.
 * Relaxed means increased spacing and more open layout.
 * @default 'default'
 */
export const DENSITIES = ['compact', 'default', 'relaxed'] as const;
export type Density = (typeof DENSITIES)[number];

/**
 * Elevations represent the visual depth of a component, often used for shadows.
 * None means no elevation, resulting in a flat appearance.
 * Small means a subtle elevation.
 * Medium means a moderate elevation.
 * Large means a prominent elevation.
 * @default 'none'
 */
export const ELEVATIONS = ['none', 's', 'm', 'l'] as const satisfies readonly (
  'none' | TShirtSize
)[];
export type Elevation = (typeof ELEVATIONS)[number];

/**
 * Fits represent how a component should adjust its size relative to its content.
 * Fill means the component should expand to fill its container.
 * Hug means the component should shrink to fit its content.
 * @default 'hug'
 */
export const FITS = ['fill', 'hug'] as const;
export type Fit = (typeof FITS)[number];

/**
 * Flow represents the direction in which content should be arranged.
 * Default means the normal flow direction.
 * Reverse means the opposite flow direction.
 * @default 'default'
 */
export const FLOWS = ['default', 'reverse'] as const;
export type Flow = (typeof FLOWS)[number];

/**
 * Gaps represent the spacing between elements.
 * i.e.: the gap between an icon and label within a button.
 * @default 'm'
 */
export const GAPS = [
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
] as const satisfies readonly TShirtSize[];
export type Gap = (typeof GAPS)[number];

/**
 * Offsets represent the spacing around elements.
 * i.e.: the offset of a tooltip from its triggering element
 * @default 'm'
 */
export const OFFSETS = [
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
] as const satisfies readonly TShirtSize[];
export type Offset = (typeof OFFSETS)[number];

/**
 * Intents represent the purpose or meaning of a component, often used for styling.
 * Attention indicates something that requires the user's focus (e.g.: a warning message).
 * Negative indicates an error or destructive action (e.g.: a delete button).
 * Neutral indicates a neutral or default state (e.g.: a plain button).
 * Notice indicates an informational message (e.g.: an informational callout).
 * Positive indicates a successful or affirmative action (e.g.: a save button).
 * Primary indicates the main action or emphasis (e.g.: a submit button).
 * Secondary indicates a less prominent action or emphasis (e.g.: a cancel button).
 * Tertiary indicates the least prominent action or emphasis (e.g.: a low-priority link-style action).
 * @default 'primary'
 */
export const INTENTS = [
  'attention',
  'negative',
  'neutral',
  'notice',
  'positive',
  'primary',
  'secondary',
  'tertiary',
] as const;
export type Intent = (typeof INTENTS)[number];

/**
 * Orientations represent the direction in which content should be arranged within a container.
 * Column indicates a vertical arrangement.
 * Row indicates a horizontal arrangement.
 */
export const ORIENTATIONS = ['column', 'row'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/**
 * Placements represent the preferred position of an element relative to its reference element.
 */
export const PLACEMENTS = [
  'bottom-end',
  'bottom-start',
  'bottom',
  'left-end',
  'left-start',
  'left',
  'right-end',
  'right-start',
  'right',
  'top-end',
  'top-start',
  'top',
] as const;
export type Placement = (typeof PLACEMENTS)[number];
export type Position = Placement;

/**
 * Specifies the geometric silhouette of a component (border radius).
 * @default 'sharp'
 */
export const SHAPES = ['circle', 'pill', 'rounded', 'sharp'] as const;
export type Shape = (typeof SHAPES)[number];

/**
 * Sizes represent the predefined dimensions for components.
 * They are typically used to standardize spacing, padding, and element sizes across the UI.
 * @default 'm'
 */
export const SIZES = [
  'xs',
  's',
  'm',
  'l',
  'xl',
] as const satisfies readonly TShirtSize[];
export type Size = (typeof SIZES)[number];

/**
 * Variants represent the different visual styles, or 'skin' a component can have.
 * Filled indicates a solid background style.
 * Ghost indicates a minimal, transparent style.
 * Inline indicates an inline style without paddings, often used within text.
 * Outlined indicates a bordered style with no background.
 * @default 'filled'
 */
export const VARIANTS = ['filled', 'ghost', 'inline', 'outlined'] as const;
export type Variant = (typeof VARIANTS)[number];

/**
 * Visibilities represent the visibility state of an element.
 * Hidden indicates the element is not visible.
 * Visible indicates the element is visible.
 */
export const VISIBILITIES = ['hidden', 'visible'] as const;
export type Visibility = (typeof VISIBILITIES)[number];
