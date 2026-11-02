import { describe, it, expect } from 'vitest';

import { cx } from './cx';

describe('cx', () => {
  it('joins class names with a space', () => {
    expect(cx('button', 'size-m')).toBe('button size-m');
  });

  it('skips false, null, undefined and empty strings', () => {
    expect(cx('button', false, null, undefined, '', 'size-m')).toBe(
      'button size-m',
    );
  });

  it('returns undefined when nothing is left', () => {
    expect(cx()).toBeUndefined();
    expect(cx(false, undefined, '')).toBeUndefined();
  });

  it('supports a consumer className that may be undefined', () => {
    const consumerClassName: string | undefined = undefined;

    expect(cx('button', consumerClassName)).toBe('button');
  });
});
