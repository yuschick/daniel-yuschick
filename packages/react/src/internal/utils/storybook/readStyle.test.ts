import { afterEach, describe, expect, it } from 'vitest';

import { readStyle } from './readStyle';

describe('readStyle', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('should read a computed value by its kebab-case property', () => {
    const element = document.createElement('div');
    element.style.setProperty('text-align', 'center');
    document.body.append(element);

    expect(readStyle({ cssProperty: 'text-align', element })).toBe('center');
  });

  it('should return an empty string for a property with no value', () => {
    const element = document.createElement('div');
    document.body.append(element);

    expect(readStyle({ cssProperty: '--unset-property', element })).toBe('');
  });
});
