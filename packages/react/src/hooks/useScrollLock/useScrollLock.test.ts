import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import type { UseScrollLockReturn } from './useScrollLock';

describe('useScrollLock', () => {
  let useScrollLock: () => UseScrollLockReturn;

  beforeEach(async () => {
    vi.resetModules();
    ({ useScrollLock } = await import('./useScrollLock'));
  });

  it('should lock and unlock the scroll', () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      result.current.unlock();
    });

    expect(document.body.style.overflow).toBe('');
  });

  it('should not change overflow if already locked', () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      result.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should support multiple locks and unlocks from a single instance', () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      result.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      result.current.unlock();
    });

    expect(document.body.style.overflow).toBe('');
  });

  it('should support multiple locks and unlocks from separate instances', () => {
    const { result: first } = renderHook(() => useScrollLock());
    const { result: second } = renderHook(() => useScrollLock());

    act(() => {
      first.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      second.current.lock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      first.current.unlock();
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      second.current.unlock();
    });

    expect(document.body.style.overflow).toBe('');
  });
});
