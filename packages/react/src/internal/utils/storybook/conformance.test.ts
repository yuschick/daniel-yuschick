import { describe, expect, it } from 'vitest';

import {
  deriveConformanceCases,
  getConformanceAxis,
  getConformanceKey,
  getConformanceVariants,
} from './conformance';
import type { ConformanceFacts, ConformanceLayers } from './conformance';

const facts: ConformanceFacts = {
  axes: ['intent', 'state'],
  properties: {
    intent: { defaultValue: 'brand' },
    state: { defaultValue: 'default' },
  },
  summarized: [
    {
      path: 'root',
      facts: [
        { field: 'radius', value: 'token:dy/border-radius/rounded' },
        { field: 'layoutMode', value: 'raw:HORIZONTAL' },
        {
          field: 'fill',
          dependsOn: ['intent', 'state'],
          values: {
            'brand|default': 'token:dy/color/a',
            'brand|hover': 'none',
          },
        },
      ],
    },
    { path: 'root/ring', facts: [{ field: 'stroke', value: 'token:dy/ring' }] },
  ],
};

const rootFields = {
  fields: { fill: 'background-color', radius: 'border-start-start-radius' },
  part: 'root',
};
const rootLayer = {
  ...rootFields,
  ignored: ['layoutMode'],
  none: { fill: 'transparent' },
};
const ringLayer = {
  fields: { stroke: 'outline-color' },
  part: 'root',
  state: 'focus',
};
const layers: ConformanceLayers = { root: rootLayer, 'root/ring': ringLayer };

describe('deriveConformanceCases', () => {
  it('expands facts into variants, filling unset axes with defaults', () => {
    const cases = deriveConformanceCases({ facts, layers });

    expect(
      cases.map(({ axes, cssProperty, expected }) => [
        axes,
        cssProperty,
        expected,
      ]),
    ).toEqual([
      [
        { intent: 'brand', state: 'default' },
        'border-start-start-radius',
        'var(--dy-border-radius-rounded)',
      ],
      [
        { intent: 'brand', state: 'default' },
        'background-color',
        'var(--dy-color-a)',
      ],
      [{ intent: 'brand', state: 'hover' }, 'background-color', 'transparent'],
      [{ intent: 'brand', state: 'focus' }, 'outline-color', 'var(--dy-ring)'],
    ]);
  });

  it('throws on a layer with no mapping', () => {
    expect(() =>
      deriveConformanceCases({ facts, layers: { root: rootLayer } }),
    ).toThrow('root/ring');
  });

  it('throws on a field that is neither mapped nor ignored', () => {
    expect(() =>
      deriveConformanceCases({
        facts,
        layers: {
          ...layers,
          root: { ...rootFields, none: rootLayer.none },
        },
      }),
    ).toThrow('root layoutMode');
  });

  describe('pinning a layer to the variants it is visible in', () => {
    const pinnedFacts: ConformanceFacts = {
      axes: ['lockup', 'size'],
      properties: {
        lockup: { defaultValue: 'mark' },
        size: { defaultValue: 'm' },
      },
      summarized: [
        {
          path: 'root/name',
          facts: [
            { field: 'fill', value: 'token:dy/color/text' },
            {
              field: 'fontSize',
              dependsOn: ['size'],
              values: { m: 'token:dy/font/m', l: 'token:dy/font/l' },
            },
          ],
        },
      ],
    };
    const nameLayer = {
      axes: { lockup: 'full' },
      fields: { fill: 'color', fontSize: 'font-size' },
      part: 'span',
    };

    it('resolves its facts to the pinned axes, not the defaults', () => {
      const cases = deriveConformanceCases({
        facts: pinnedFacts,
        layers: { 'root/name': nameLayer },
      });

      expect(cases.map(({ axes, expected }) => [axes, expected])).toEqual([
        [{ lockup: 'full', size: 'm' }, 'var(--dy-color-text)'],
        [{ lockup: 'full', size: 'm' }, 'var(--dy-font-m)'],
        [{ lockup: 'full', size: 'l' }, 'var(--dy-font-l)'],
      ]);
    });

    it('throws on a pin to an axis the facts do not have', () => {
      expect(() =>
        deriveConformanceCases({
          facts: pinnedFacts,
          layers: { 'root/name': { ...nameLayer, axes: { lockups: 'full' } } },
        }),
      ).toThrow('root/name pins the axis lockups');
    });

    it('throws when a fact names a variant the pin excludes', () => {
      expect(() =>
        deriveConformanceCases({
          facts: pinnedFacts,
          layers: { 'root/name': { ...nameLayer, axes: { size: 'l' } } },
        }),
      ).toThrow('root/name fontSize holds a value for size m');
    });
  });

  it('throws on a "none" with no CSS value to compare', () => {
    expect(() =>
      deriveConformanceCases({
        facts,
        layers: {
          ...layers,
          root: { ...rootFields, ignored: rootLayer.ignored },
        },
      }),
    ).toThrow('No "none" value');
  });
});

describe('getConformanceAxis', () => {
  const options = ['s', 'm'] as const;

  it('should return the axis value as one of its options', () => {
    expect(
      getConformanceAxis({ axes: { size: 'm' }, name: 'size', options }),
    ).toBe('m');
  });

  it('should throw on a value Figma holds but the prop does not', () => {
    expect(() =>
      getConformanceAxis({ axes: { size: 'xl' }, name: 'size', options }),
    ).toThrow(/size holds xl/);
  });
});

describe('getConformanceVariants', () => {
  it('returns each variant once, keyed the same whatever the axis order', () => {
    const variants = getConformanceVariants(
      deriveConformanceCases({ facts, layers }),
    );

    expect(variants).toHaveLength(3);
    expect(getConformanceKey({ state: 'hover', intent: 'brand' })).toBe(
      getConformanceKey({ intent: 'brand', state: 'hover' }),
    );
  });
});
