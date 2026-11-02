import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useEventCallback } from './useEventCallback';

describe('useEventCallback', () => {
  it('should maintain stable callback reference across renders', () => {
    const firstFn = vi.fn();
    const secondFn = vi.fn();

    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: firstFn },
    });

    const firstCallback = result.current;

    rerender({ fn: secondFn });

    expect(result.current).toBe(firstCallback);
  });

  it('should invoke the most recent function', () => {
    const firstFn = vi.fn((num: number) => num * 2);
    const secondFn = vi.fn((num: number) => num * 3);

    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: firstFn },
    });

    act(() => {
      result.current(5);
    });
    expect(firstFn).toHaveBeenCalledWith(5);
    expect(firstFn).toHaveReturnedWith(10);

    rerender({ fn: secondFn });

    act(() => {
      result.current(5);
    });
    expect(secondFn).toHaveBeenCalledWith(5);
    expect(secondFn).toHaveReturnedWith(15);
  });

  it('should safely handle undefined function without throwing', () => {
    const { result } = renderHook(() => useEventCallback(undefined));

    expect(() => {
      act(() => {
        result.current?.();
      });
    }).not.toThrow();
  });

  it('should preserve callback arguments and return value', () => {
    const mockFn = vi.fn(
      (arg1: string, arg2: number) => `${arg1}-${String(arg2)}`,
    );
    const { result } = renderHook(() => useEventCallback(mockFn));

    let returnValue: string | undefined;

    act(() => {
      returnValue = result.current('test', 42);
    });

    expect(mockFn).toHaveBeenCalledWith('test', 42);
    expect(returnValue).toBe('test-42');
  });
});
