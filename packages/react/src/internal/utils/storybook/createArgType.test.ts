import { describe, expect, it } from 'vitest';

import { createArgType } from './createArgType';

describe('createArgType', () => {
  it('should name the type and list its options when toggled', () => {
    const result = createArgType({
      description: 'The scale.',
      options: ['s', 'm', 'l'],
      type: 'Size',
    });

    expect(result).toHaveProperty('table.type.summary', 'Size');
    expect(result).toHaveProperty('table.type.detail', 's, m, l');
    expect(result).toHaveProperty('options', ['s', 'm', 'l']);
    expect(result).toHaveProperty('control', 'radio');
  });

  it('should have nothing to toggle without options', () => {
    const result = createArgType({
      control: 'boolean',
      description: 'Whether it is inoperable.',
      type: 'boolean',
    });

    expect(result).toHaveProperty('table.type', { summary: 'boolean' });
    expect(result).toHaveProperty('control', 'boolean');
  });

  it('should group rows under Component Props by default', () => {
    const result = createArgType({ description: 'A prop.', type: 'string' });

    expect(result).toHaveProperty('table.category', 'Component Props');
  });

  it('should group a composed component under its own category', () => {
    const result = createArgType({
      category: 'Button Props',
      description: 'A prop.',
      type: 'string',
    });

    expect(result).toHaveProperty('table.category', 'Button Props');
  });

  it('should show a default only when there is one', () => {
    expect(
      createArgType({
        defaultValue: 'm',
        description: 'A prop.',
        type: 'Size',
      }),
    ).toHaveProperty('table.defaultValue.summary', 'm');
    expect(
      createArgType({ description: 'A prop.', type: 'Size' }),
    ).not.toHaveProperty('table.defaultValue');
  });
});
