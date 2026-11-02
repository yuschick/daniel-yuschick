import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useControllableState } from './useControllableState';

describe('useControllableState', () => {
  describe('useControllableState', () => {
    it('uses defaultValue in uncontrolled mode and updates with setValue', () => {
      const { result } = renderHook(() =>
        useControllableState<number>({ defaultValue: 0 }),
      );

      expect(result.current.value).toBe(0);

      act(() => {
        result.current.setValue(1);
      });

      expect(result.current.value).toBe(1);
    });

    it('supports functional updates in uncontrolled mode', () => {
      const { result } = renderHook(() =>
        useControllableState<number>({ defaultValue: 2 }),
      );

      act(() => {
        result.current.setValue((prev) => prev + 3);
      });

      expect(result.current.value).toBe(5);
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState<number>({ defaultValue: 10, onChange }),
      );

      act(() => {
        result.current.setValue(11);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(11);
    });

    it('does not update internal value in controlled mode, but calls onChange', () => {
      const onChange = vi.fn();

      const { result } = renderHook(
        ({ value }) => useControllableState<number>({ value, onChange }),
        {
          initialProps: { value: 5 },
        },
      );

      expect(result.current.value).toBe(5);

      act(() => {
        result.current.setValue(9);
      });

      expect(result.current.value).toBe(5);
      expect(onChange).toHaveBeenCalledWith(9);
    });

    it('respects shouldUpdate and skips updates/callback when it returns false', () => {
      const onChange = vi.fn();
      const shouldUpdate = vi.fn(() => false);

      const { result } = renderHook(() =>
        useControllableState<number>({
          defaultValue: 1,
          onChange,
          shouldUpdate,
        }),
      );

      act(() => {
        result.current.setValue(2);
      });

      expect(shouldUpdate).toHaveBeenCalledWith(1, 2);
      expect(result.current.value).toBe(1);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
