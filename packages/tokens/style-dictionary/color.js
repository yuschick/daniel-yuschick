// sRGB ↔ OKLCH conversion (Björn Ottosson's OKLab, D65). Kept dependency-free
// so the build controls rounding and can prove every color round-trips exactly.

const toLinear = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const toGamma = (channel) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

// Decimal places that reproduce every 8-bit sRGB color exactly (checked
// against the full palette; see color.test.js)
const PRECISION = { lightness: 4, chroma: 4, hue: 2 };
const ACHROMATIC_CHROMA = 0.00005;

/**
 * @param {{ hex: string }} options `#rrggbb` or `#rrggbbaa`
 * @returns {{ lightness: number, chroma: number, hue: number, alpha: number }}
 */
export function hexToOklch({ hex }) {
  const [red = 0, green = 0, blue = 0, alpha = 255] = (
    hex.slice(1).match(/../g) ?? []
  ).map((pair) => parseInt(pair, 16));
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map(
    (channel) => toLinear(channel / 255),
  );

  const long = Math.cbrt(
    0.4122214708 * linearRed +
      0.5363325363 * linearGreen +
      0.0514459929 * linearBlue,
  );
  const medium = Math.cbrt(
    0.2119034982 * linearRed +
      0.6806995451 * linearGreen +
      0.1073969566 * linearBlue,
  );
  const short = Math.cbrt(
    0.0883024619 * linearRed +
      0.2817188376 * linearGreen +
      0.6299787005 * linearBlue,
  );

  const lightness =
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short;
  const greenRed =
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short;
  const blueYellow =
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short;

  const chroma = Math.hypot(greenRed, blueYellow);
  const hue = (Math.atan2(blueYellow, greenRed) * 180) / Math.PI;

  return {
    lightness,
    chroma,
    hue: chroma < ACHROMATIC_CHROMA ? 0 : (hue + 360) % 360,
    alpha: alpha / 255,
  };
}

/**
 * @param {{ lightness: number, chroma: number, hue: number }} options
 * @returns {string} `#rrggbb`, clamped to the sRGB gamut
 */
export function oklchToHex({ lightness, chroma, hue }) {
  const radians = (hue * Math.PI) / 180;
  const greenRed = chroma * Math.cos(radians);
  const blueYellow = chroma * Math.sin(radians);

  const long =
    (lightness + 0.3963377774 * greenRed + 0.2158037573 * blueYellow) ** 3;
  const medium =
    (lightness - 0.1055613458 * greenRed - 0.0638541728 * blueYellow) ** 3;
  const short =
    (lightness - 0.0894841775 * greenRed - 1.291485548 * blueYellow) ** 3;

  const linear = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];

  return `#${linear
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, toGamma(channel))) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** @param {{ value: number, places: number }} options */
const round = ({ value, places }) => Number(value.toFixed(places));

/**
 * Formats a hex color as CSS `oklch()`, and throws if the rounded value
 * wouldn't reproduce the exact source color.
 *
 * @param {{ hex: string }} options
 * @returns {string} e.g. `oklch(0.52 0.1851 16.03)`
 */
export function formatOklch({ hex }) {
  const color = hexToOklch({ hex });
  const lightness = round({
    value: color.lightness,
    places: PRECISION.lightness,
  });
  const chroma = round({ value: color.chroma, places: PRECISION.chroma });
  const hue = round({ value: color.hue, places: PRECISION.hue });

  const roundTrip = oklchToHex({ lightness, chroma, hue });
  if (roundTrip !== hex.slice(0, 7).toLowerCase()) {
    throw new Error(
      `${hex} doesn't survive conversion to oklch (round-trips to ${roundTrip}). Increase PRECISION in color.js.`,
    );
  }

  const alpha = round({ value: color.alpha, places: 3 });
  return alpha < 1
    ? `oklch(${String(lightness)} ${String(chroma)} ${String(hue)} / ${String(alpha)})`
    : `oklch(${String(lightness)} ${String(chroma)} ${String(hue)})`;
}

/**
 * Parses a CSS `oklch()` string produced by formatOklch.
 *
 * @param {{ value: string }} options
 * @returns {{ lightness: number, chroma: number, hue: number }}
 */
export function parseOklch({ value }) {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)/.exec(value);
  if (!match) {
    throw new Error(`Not an oklch() value: ${value}`);
  }
  const [lightness, chroma, hue] = match.slice(1).map(Number);
  return { lightness: lightness ?? 0, chroma: chroma ?? 0, hue: hue ?? 0 };
}

/**
 * WCAG 2.x contrast ratio between two `#rrggbb` colors.
 *
 * @param {{ foreground: string, background: string }} options
 * @returns {number}
 */
export function contrastRatio({ foreground, background }) {
  /** @param {string} hex */
  const luminance = (hex) => {
    const [red = 0, green = 0, blue = 0] = (
      hex.slice(1).match(/../g) ?? []
    ).map((pair) => toLinear(parseInt(pair, 16) / 255));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}
