import { contrastRatio, oklchToHex, parseOklch } from './color.js';

/**
 * @typedef {{ foreground: string, background: string, minimum: number }} ContrastPair
 */

/**
 * Names of tokens that must never reach CSS but appear in it anyway.
 *
 * @param {{ css: string, hiddenNames: string[] }} options
 * @returns {string[]}
 */
export function findHiddenTokens({ css, hiddenNames }) {
  return hiddenNames.filter((name) =>
    new RegExp(`--${name}(?![\\w-])`).test(css),
  );
}

/**
 * Lines that still contain a `{dy.…}` reference.
 *
 * @param {{ css: string }} options
 * @returns {string[]}
 */
export function findUnresolvedReferences({ css }) {
  return css
    .split('\n')
    .filter((line) => /\{dy\.[^}]+\}/.test(line))
    .map((line) => line.trim());
}

/**
 * Contrast pairs below their minimum, or naming a color that doesn't ship.
 *
 * @param {{ colors: Map<string, string>, pairs: ContrastPair[] }} options
 *   `colors` maps CSS custom property names (without `--`) to oklch() values
 * @returns {string[]}
 */
export function findContrastFailures({ colors, pairs }) {
  const failures = [];

  for (const { foreground, background, minimum } of pairs) {
    const foregroundValue = colors.get(foreground);
    const backgroundValue = colors.get(background);

    if (!foregroundValue || !backgroundValue) {
      failures.push(
        `${foreground} on ${background}: ${!foregroundValue ? foreground : background} doesn't exist`,
      );
      continue;
    }

    const ratio = contrastRatio({
      foreground: oklchToHex(parseOklch({ value: foregroundValue })),
      background: oklchToHex(parseOklch({ value: backgroundValue })),
    });
    if (ratio < minimum) {
      failures.push(
        `${foreground} on ${background}: ${ratio.toFixed(2)}:1, needs ${String(minimum)}:1`,
      );
    }
  }

  return failures;
}
