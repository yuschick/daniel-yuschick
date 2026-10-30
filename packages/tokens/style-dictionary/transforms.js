import { formatOklch } from './color.js';
import {
  BASE_FONT_SIZE,
  FONT_FALLBACK,
  PX_DIMENSION,
  VALUE_OVERRIDES,
} from './config.js';

// Style Dictionary transforms a primitive first, then re-runs transitive
// transforms on the semantic tokens that reference it. Each transform below
// therefore returns an already-converted string unchanged.

/** @param {{ value: number, places?: number }} options */
const trim = ({ value, places = 4 }) => String(Number(value.toFixed(places)));

/**
 * @param {{ value: unknown }} options A DTCG color object or a converted string
 * @returns {string}
 */
export function toCssColor({ value }) {
  if (typeof value === 'string') {
    return value;
  }
  const color = /** @type {{ hex: string, alpha?: number }} */ (value);
  const alpha =
    color.alpha === undefined
      ? ''
      : Math.round(color.alpha * 255)
          .toString(16)
          .padStart(2, '0');
  return formatOklch({ hex: `${color.hex}${alpha}` });
}

/**
 * @param {{ name: string, value: unknown }} options
 * @returns {string} `rem` by default, `px` for border widths, or an override
 */
export function toCssDimension({ name, value }) {
  const override = VALUE_OVERRIDES.get(name);
  if (override) {
    return override;
  }
  if (typeof value === 'string') {
    return value;
  }
  const { value: pixels } = /** @type {{ value: number }} */ (value);
  if (pixels === 0) {
    return '0';
  }
  return PX_DIMENSION.test(name)
    ? `${trim({ value: pixels })}px`
    : `${trim({ value: pixels / BASE_FONT_SIZE })}rem`;
}

/**
 * @param {{ value: unknown }} options
 * @returns {string}
 */
export function toCssDuration({ value }) {
  if (typeof value === 'string') {
    return value;
  }
  const { value: amount, unit } =
    /** @type {{ value: number, unit: string }} */ (value);
  return `${trim({ value: amount })}${unit}`;
}

/**
 * @param {{ value: unknown }} options
 * @returns {string}
 */
export function toCssCubicBezier({ value }) {
  if (typeof value === 'string') {
    return value;
  }
  return `cubic-bezier(${/** @type {number[]} */ (value).join(', ')})`;
}

/**
 * @param {{ value: unknown }} options
 * @returns {string} The family, quoted if needed, followed by the fallback stack
 */
export function toCssFontFamily({ value }) {
  const family = String(value);
  if (family.includes(',')) {
    return family;
  }
  const quoted = /^[a-z-]+$/i.test(family) ? family : `"${family}"`;
  return [quoted, ...FONT_FALLBACK].join(', ');
}

/** @typedef {{ name: string, $type?: string, $value: unknown }} Token */

/** Style Dictionary transform definitions, registered under these names. */
export const transforms = {
  'dy/name': {
    type: 'name',
    /** @param {{ path: string[] }} token */
    transform: (token) => token.path.join('-'),
  },
  'dy/color': {
    type: 'value',
    transitive: true,
    /** @param {Token} token */
    filter: (token) => token.$type === 'color',
    /** @param {Token} token */
    transform: (token) => toCssColor({ value: token.$value }),
  },
  'dy/dimension': {
    type: 'value',
    transitive: true,
    /** @param {Token} token */
    filter: (token) => token.$type === 'dimension',
    /** @param {Token} token */
    transform: (token) =>
      toCssDimension({ name: token.name, value: token.$value }),
  },
  'dy/duration': {
    type: 'value',
    transitive: true,
    /** @param {Token} token */
    filter: (token) => token.$type === 'duration',
    /** @param {Token} token */
    transform: (token) => toCssDuration({ value: token.$value }),
  },
  'dy/cubic-bezier': {
    type: 'value',
    transitive: true,
    /** @param {Token} token */
    filter: (token) => token.$type === 'cubicBezier',
    /** @param {Token} token */
    transform: (token) => toCssCubicBezier({ value: token.$value }),
  },
  'dy/font-family': {
    type: 'value',
    transitive: true,
    /** @param {Token} token */
    filter: (token) => token.$type === 'fontFamily',
    /** @param {Token} token */
    transform: (token) => toCssFontFamily({ value: token.$value }),
  },
};
