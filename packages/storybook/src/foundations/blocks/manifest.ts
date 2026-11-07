import manifest from '@dy/tokens/manifest.json' with { type: 'json' };

/** One shipped token, as `@dy/tokens` documents it in its manifest. */
export interface ManifestToken {
  description?: string;
  /** Colors only: the value in each color mode, keyed by mode. */
  modes?: Record<string, string>;
  type: string;
  /** Font weights are numbers; every other value is a CSS string. */
  value: number | string;
}

/** One verified contrast pair, with its ratio in each color mode. */
export interface ContrastEntry {
  background: string;
  foreground: string;
  minimum: number;
  ratios: Record<string, number>;
}

export interface DocumentedToken extends Omit<ManifestToken, 'value'> {
  /** The CSS custom property name without its leading `--`. */
  name: string;
  /** The CSS value, as written in the stylesheet. */
  value: string;
}

export interface TokenGroup {
  /** The segments the group's tokens share, e.g. `action-brand`; empty for the base group. */
  key: string;
  tokens: DocumentedToken[];
}

const TOKENS: Record<string, ManifestToken> = manifest.tokens;
const CONTRAST: ContrastEntry[] = manifest.contrast;

export const DEFAULT_THEME: string = manifest.defaultTheme;
export const THEMES: string[] = manifest.themes;
/** Every color mode the build emits. Docs render one column per mode. */
export const MODES: string[] = manifest.modes;

/**
 * Prefixes the Design Tokens page documents. A shipped token outside all of
 * them is listed as undocumented, so a new Figma collection can't go unseen.
 */
export const DOCUMENTED_PREFIXES = [
  'dy-color-surface',
  'dy-color-text',
  'dy-color-border',
  'dy-space',
  'dy-size',
  'dy-border-radius',
  'dy-border-width',
  'dy-font',
  'dy-motion',
] as const;

// Interaction states read in this order, not alphabetically.
const STATE_ORDER = ['default', 'hover', 'active', 'disabled'];

function hasPrefix({ name, prefix }: { name: string; prefix: string }) {
  return name === prefix || name.startsWith(`${prefix}-`);
}

/** Every shipped token whose name starts with `prefix`, sorted by name. */
export function getTokens({ prefix }: { prefix: string }): DocumentedToken[] {
  return Object.entries(TOKENS)
    .filter(([name]) => hasPrefix({ name, prefix }))
    .map(([name, token]) => ({ ...token, name, value: String(token.value) }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

/** Shipped tokens that no section of the Design Tokens page documents. */
export function getUndocumentedTokens(): DocumentedToken[] {
  return Object.entries(TOKENS)
    .filter(
      ([name]) =>
        !DOCUMENTED_PREFIXES.some((prefix) => hasPrefix({ name, prefix })),
    )
    .map(([name, token]) => ({ ...token, name, value: String(token.value) }));
}

export function getTokenCount(): number {
  return Object.keys(TOKENS).length;
}

export function getContrastPairs(): ContrastEntry[] {
  return CONTRAST;
}

function compareStates({ first, second }: { first: string; second: string }) {
  const firstIndex = STATE_ORDER.indexOf(first);
  const secondIndex = STATE_ORDER.indexOf(second);
  if (firstIndex === -1 || secondIndex === -1) {
    return firstIndex === secondIndex
      ? first.localeCompare(second)
      : secondIndex - firstIndex;
  }
  return firstIndex - secondIndex;
}

/**
 * Groups tokens by the segments between `prefix` and their last segment, so
 * `dy-color-surface-action-brand-hover` joins `action-brand`. Tokens with a
 * single segment after the prefix form the base group, listed first.
 */
export function groupTokens({ prefix }: { prefix: string }): TokenGroup[] {
  const groups = new Map<string, DocumentedToken[]>();

  for (const token of getTokens({ prefix })) {
    const segments = token.name.slice(prefix.length + 1).split('-');
    // `on-action` is one name, not a group: only split names whose last
    // segment is a state or a variant of a longer path.
    const key =
      segments.length > 1 && !token.name.endsWith('-on-action')
        ? segments.slice(0, -1).join('-')
        : '';
    groups.set(key, [...(groups.get(key) ?? []), token]);
  }

  return [...groups]
    .sort(([firstKey], [secondKey]) =>
      firstKey === ''
        ? -1
        : secondKey === ''
          ? 1
          : firstKey.localeCompare(secondKey),
    )
    .map(([key, tokens]) => ({
      key,
      tokens: tokens.sort((first, second) =>
        compareStates({
          first: first.name.slice(first.name.lastIndexOf('-') + 1),
          second: second.name.slice(second.name.lastIndexOf('-') + 1),
        }),
      ),
    }));
}

/** `1.5rem` → `24px` against the 16px base the token build uses. */
export function toPixels({ value }: { value: string }): string | undefined {
  const match = /^(-?[\d.]+)rem$/.exec(value);
  return match?.[1] ? `${String(Number(match[1]) * 16)}px` : undefined;
}

/** The four control points of a `cubic-bezier()` value. */
export function parseCubicBezier({
  value,
}: {
  value: string;
}): [number, number, number, number] | undefined {
  const points = /^cubic-bezier\(([^)]+)\)$/
    .exec(value)?.[1]
    ?.split(',')
    .map((point) => Number(point.trim()));
  if (points?.length !== 4 || points.some(Number.isNaN)) {
    return undefined;
  }
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = points;
  return [x1, y1, x2, y2];
}

/** The WCAG 2.2 level a ratio reaches for its pair's minimum. */
export function getConformance({
  ratio,
  minimum,
}: {
  minimum: number;
  ratio: number;
}): 'AAA' | 'AA' | 'Fails' {
  if (ratio < minimum) {
    return 'Fails';
  }
  // AAA exists only for text (1.4.6); non-text contrast (1.4.11) stops at AA
  return minimum >= 4.5 && ratio >= 7 ? 'AAA' : 'AA';
}

/** `action-brand` → `Action brand`; the base group reads as `Base`. */
export function formatGroupName({ key }: { key: string }): string {
  if (key === '') {
    return 'Base';
  }
  const words = key.split('-').join(' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

/** Light mode → `Light`. */
export function formatModeName({ mode }: { mode: string }): string {
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}
