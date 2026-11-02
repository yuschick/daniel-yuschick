import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useMergeRefs } from './useMergeRefs';

describe('useMergeRefs', () => {
  it('should merge multiple refs', () => {
    const refCallback = renderHook(() => useMergeRefs([undefined])).result
      .current;
    expect(refCallback).toBeNull();
  });

  it('should merge multiple function refs', () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const { result } = renderHook(() => useMergeRefs([ref1, ref2]));

    act(() => {
      result.current?.('instance');
    });

    expect(ref1).toHaveBeenCalledWith('instance');
    expect(ref2).toHaveBeenCalledWith('instance');
  });

  it('should merge callback and object refs', () => {
    const ref1 = vi.fn();
    const ref2 = { current: null };
    const { result } = renderHook(() => useMergeRefs([ref1, ref2]));

    act(() => {
      result.current?.('instance');
    });

    expect(ref1).toHaveBeenCalledWith('instance');
    expect(ref2.current).toBe('instance');
  });

  it('should return null when all refs are undefined', () => {
    const { result } = renderHook(() => useMergeRefs([undefined, undefined]));
    expect(result.current).toBeNull();
  });

  it('should handle cleanup when ref is called with null', () => {
    const cleanup = vi.fn();
    const ref = vi.fn().mockReturnValue(cleanup);
    const { result } = renderHook(() => useMergeRefs([ref]));

    act(() => {
      result.current?.('instance');
    });

    act(() => {
      result.current?.(null);
    });

    expect(cleanup).toHaveBeenCalled();
  });

  it('should clear ref.current on cleanup', () => {
    const ref = { current: null as string | null };
    const { result } = renderHook(() => useMergeRefs([ref]));

    act(() => {
      result.current?.('instance');
    });

    expect(ref.current).toBe('instance');

    act(() => {
      result.current?.(null);
    });

    expect(ref.current).toBeNull();
  });

  it('should handle mixed undefined and defined refs', () => {
    const ref1 = vi.fn();
    const { result } = renderHook(() =>
      useMergeRefs([undefined, ref1, undefined]),
    );

    act(() => {
      result.current?.('instance');
    });

    expect(ref1).toHaveBeenCalledWith('instance');
  });

  it('keeps the same callback when given a new array of the same refs', () => {
    const ref1 = vi.fn();
    const ref2 = { current: null };
    const { result, rerender } = renderHook(({ refs }) => useMergeRefs(refs), {
      initialProps: { refs: [ref1, ref2] },
    });
    const first = result.current;

    rerender({ refs: [ref1, ref2] });

    expect(result.current).toBe(first);
  });

  it('returns a new callback when one of the refs changes', () => {
    const ref1 = vi.fn();
    const { result, rerender } = renderHook(({ refs }) => useMergeRefs(refs), {
      initialProps: { refs: [ref1, { current: null }] },
    });
    const first = result.current;

    rerender({ refs: [ref1, { current: null }] });

    expect(result.current).not.toBe(first);
  });

  it('returns a new callback when a ref is added or removed', () => {
    const ref1 = vi.fn();
    const { result, rerender } = renderHook(({ refs }) => useMergeRefs(refs), {
      initialProps: { refs: [ref1] as (typeof ref1 | undefined)[] },
    });
    const first = result.current;

    rerender({ refs: [ref1, undefined] });

    expect(result.current).not.toBe(first);
  });
});
