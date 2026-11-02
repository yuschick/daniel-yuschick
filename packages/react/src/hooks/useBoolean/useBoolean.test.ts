import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useBoolean } from './useBoolean';

describe('useBoolean', () => {
  it('should toggle the boolean value', () => {
    const { result } = renderHook(() => useBoolean({ defaultValue: false }));

    expect(result.current.value).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);
  });

  it('should set the boolean value to true', () => {
    const { result } = renderHook(() => useBoolean({ defaultValue: false }));

    act(() => {
      result.current.setTrue();
    });

    expect(result.current.value).toBe(true);
  });

  it('should set the boolean value to false', () => {
    const { result } = renderHook(() => useBoolean({ defaultValue: true }));

    act(() => {
      result.current.setFalse();
    });

    expect(result.current.value).toBe(false);
  });
});
