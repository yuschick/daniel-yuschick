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
  });

  it('should return correct object with only ref', () => {
    const ref = 'HTMLDivElement';
    const result = createAdditionalTableGroups({ ref });

    expect(result).toHaveProperty('ref');
    expect(result).toHaveProperty('ref.table.type.summary', ref);
  });

  it('should return correct object with both groups', () => {
    const htmlAttributes = 'HTMLAttributes<HTMLDivElement>';
    const ref = 'HTMLDivElement';
    const result = createAdditionalTableGroups({ htmlAttributes, ref });

    expect(result).toHaveProperty(
      'htmlAttributes.table.type.summary',
      htmlAttributes,
    );
    expect(result).toHaveProperty('ref.table.type.summary', ref);
  });
});
