import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useResolvedId } from './useResolvedId';

describe('useResolvedId', () => {
  it('should return the defined id', () => {
    const testId = 'test-id';
    const { result } = renderHook(() => useResolvedId(testId));
    expect(result.current).toBe(testId);
  });

  it('should return a randomly generated id when no id is provided', () => {
    const { result } = renderHook(() => useResolvedId());
    expect(result.current).toMatch(/^[a-zA-Z0-9\-_:]+$/);
  });
});
