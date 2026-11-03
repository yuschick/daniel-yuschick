import { getBrowserCommands } from './browserCommands';

const TOKEN_REFERENCE = /--dy-[a-z0-9-]+/g;

/** The Figma `state` axis as it applies to a rendered element. */
const FORCED_PSEUDO_CLASSES: Record<string, string[]> = {
  active: ['active'],
  focus: ['focus-visible'],
  hover: ['hover'],
};

interface ConformanceFact {
  dependsOn?: string[];
  field: string;
  value?: string;
  values?: Record<string, string>;
}

export interface ConformanceFacts {
  axes: string[];
  properties: Record<string, { defaultValue: unknown }>;
  summarized: { facts: ConformanceFact[]; path: string }[];
}

export interface ConformanceLayer {
  /** Figma field to the logical CSS property that must carry its token. */
  fields: Record<string, string>;
  /** Fields with no CSS to check. Each one must cite the Decision behind it. */
  ignored?: string[];
  /** The CSS value a Figma `none` becomes, by field. */
  none?: Record<string, string>;
  /** A CSS selector, relative to the rendered variant, or `root` for the variant itself. */
  part: string;
  /** The Figma state this layer is visible in, when it isn't the default. */
  state?: string;
}

export type ConformanceLayers = Record<string, ConformanceLayer>;

export interface ConformanceCase {
  axes: Record<string, string>;
  cssProperty: string;
  expected: string;
  label: string;
  part: string;
}

export interface DeriveConformanceCasesOptions {
  facts: ConformanceFacts;
  layers: ConformanceLayers;
}

function toCssValue(value: string): string {
  return value.startsWith('token:')
    ? `var(--${value.slice('token:'.length).replaceAll('/', '-')})`
    : value;
}

/**
 * Turns Figma facts into the rendered styles a component must have. It throws
 * on any layer or field it wasn't told about, so a new Figma fact can't go
 * unchecked without someone deciding that it should.
 *
 * @param options - The facts payload and how its layers map to the DOM.
 * @returns One case per fact and variant.
 */
export function deriveConformanceCases({
  facts,
  layers,
}: DeriveConformanceCasesOptions): ConformanceCase[] {
  const defaultAxes = Object.fromEntries(
    facts.axes.map((axis) => [
      axis,
      String(facts.properties[axis]?.defaultValue),
    ]),
  );

  return facts.summarized.flatMap(({ path, facts: layerFacts }) => {
    const layer = layers[path];
    if (!layer) {
      throw new Error(`No conformance mapping for the Figma layer ${path}.`);
    }

    return layerFacts.flatMap((fact) => {
      if (layer.ignored?.includes(fact.field)) {
        return [];
      }
      const cssProperty = layer.fields[fact.field];
      if (!cssProperty) {
        throw new Error(`No conformance mapping for ${path} ${fact.field}.`);
      }

      const variants: [Record<string, string>, string][] =
        fact.value === undefined
          ? Object.entries(fact.values ?? {}).map(([key, value]) => {
              const axisValues = key.split('|');
              const axes = Object.fromEntries(
                (fact.dependsOn ?? []).map((axis, index) => [
                  axis,
                  axisValues[index] ?? '',
                ]),
              );
              return [axes, value];
            })
          : [[{}, fact.value]];

      return variants.map(([axes, value]) => {
        const resolvedAxes = {
          ...defaultAxes,
          ...(layer.state ? { state: layer.state } : {}),
          ...axes,
        };
        const expected =
          value === 'none' ? layer.none?.[fact.field] : toCssValue(value);
        if (expected === undefined) {
          throw new Error(`No "none" value for ${path} ${fact.field}.`);
        }
        return {
          axes: resolvedAxes,
          cssProperty,
          expected,
          label: `${path} ${fact.field} [${Object.values(resolvedAxes).join(' / ')}]`,
          part: layer.part,
        };
      });
    });
  });
}

/**
 * @param axes - A variant's value on each Figma axis.
 * @returns The key a rendered variant must carry as `data-conformance`.
 */
export function getConformanceKey(axes: Record<string, string>): string {
  return Object.keys(axes)
    .sort()
    .map((axis) => axes[axis])
    .join('|');
}

/**
 * @param cases - The cases from `deriveConformanceCases`.
 * @returns Each distinct variant that has to be rendered.
 */
export function getConformanceVariants(
  cases: ConformanceCase[],
): Record<string, string>[] {
  const variants = new Map(
    cases.map(({ axes }) => [getConformanceKey(axes), axes]),
  );
  return [...variants.values()];
}

function readStyle(element: Element, cssProperty: string): string {
  return getComputedStyle(element).getPropertyValue(cssProperty);
}

/** Resolves a value the way the browser would for the same property. */
function resolveExpected(
  probe: HTMLElement,
  cssProperty: string,
  expected: string,
): string {
  probe.style.setProperty(cssProperty, expected);
  const resolved = readStyle(probe, cssProperty);
  probe.style.removeProperty(cssProperty);
  return resolved;
}

export interface CheckConformanceOptions {
  canvasElement: HTMLElement;
  cases: ConformanceCase[];
}

/**
 * Compares rendered styles with the Figma facts, in a real browser and through
 * the real cascade. Motion is turned off so no value is read mid-transition.
 *
 * @param options - The rendered canvas and the cases to check.
 * @returns A description of each mismatch, or `null` in the Storybook UI, which has no browser commands.
 */
export async function checkConformance({
  canvasElement,
  cases,
}: CheckConformanceOptions): Promise<string[] | null> {
  const commands = getBrowserCommands();
  if (!commands) {
    return null;
  }

  const failures: string[] = [];
  const rootStyle = getComputedStyle(document.documentElement);
  const probe = document.createElement('div');
  // Widths compute to 0 while a line style is `none`.
  probe.style.borderStyle = 'solid';
  probe.style.outlineStyle = 'solid';
  canvasElement.append(probe);

  await commands.emulateMedia({ reducedMotion: 'reduce' });
  try {
    for (const axes of getConformanceVariants(cases)) {
      const key = getConformanceKey(axes);
      const selector = `[data-conformance="${key}"]`;
      const variant = canvasElement.querySelector(selector);
      if (!variant) {
        failures.push(`The variant ${key} wasn't rendered.`);
        continue;
      }

      const pseudoClasses = FORCED_PSEUDO_CLASSES[axes.state ?? ''] ?? [];
      await commands.forcePseudoState(selector, pseudoClasses);

      for (const testCase of cases) {
        if (getConformanceKey(testCase.axes) !== key) {
          continue;
        }
        const element =
          testCase.part === 'root'
            ? variant
            : variant.querySelector(testCase.part);
        if (!element) {
          failures.push(`${testCase.label}: ${testCase.part} is missing.`);
          continue;
        }
        for (const token of testCase.expected.match(TOKEN_REFERENCE) ?? []) {
          if (rootStyle.getPropertyValue(token) === '') {
            failures.push(`${testCase.label}: ${token} has no value.`);
          }
        }
        const actual = readStyle(element, testCase.cssProperty);
        const expected = resolveExpected(
          probe,
          testCase.cssProperty,
          testCase.expected,
        );
        if (actual !== expected) {
          failures.push(
            `${testCase.label}: ${testCase.cssProperty} is ${actual}, expected ${testCase.expected} (${expected}).`,
          );
        }
      }

      await commands.forcePseudoState(selector, []);
    }
  } finally {
    await commands.emulateMedia({ reducedMotion: null });
    probe.remove();
  }

  return failures;
}
