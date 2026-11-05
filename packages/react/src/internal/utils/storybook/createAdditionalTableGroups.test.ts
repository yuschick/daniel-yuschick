import { describe, expect, it } from 'vitest';

import { createAdditionalTableGroups } from './createAdditionalTableGroups';

describe('createAdditionalTableGroups', () => {
  it('should return correct object with only htmlAttributes', () => {
    const htmlAttributes = 'HTMLAttributes<HTMLDivElement>';
    const result = createAdditionalTableGroups({ htmlAttributes });

    expect(result).toHaveProperty('htmlAttributes');
    expect(result).toHaveProperty(
      'htmlAttributes.table.type.summary',
      htmlAttributes,
    );
    expect(result).toHaveProperty(
      'htmlAttributes.table.category',
      'HTML Attributes',
    );
  });

  it('should return correct object with only svgAttributes', () => {
    const svgAttributes = 'SVGAttributes<SVGSVGElement>';
    const result = createAdditionalTableGroups({ svgAttributes });

    expect(result).toHaveProperty('svgAttributes');
    expect(result).toHaveProperty(
      'svgAttributes.table.type.summary',
      svgAttributes,
    );
  });

  it('should return nothing without a group', () => {
    expect(createAdditionalTableGroups({})).toEqual({});
  });
});
