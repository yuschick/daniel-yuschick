import { renderHook } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('useIsomorphicLayoutEffect', () => {
  it('should run the effect without errors', async () => {
    const { useIsomorphicLayoutEffect } =
      await import('./useIsomorphicLayoutEffect');
    const effectSpy = vi.fn();

    renderHook(() => {
      useIsomorphicLayoutEffect(effectSpy, []);
    });

    expect(effectSpy).toHaveBeenCalledTimes(1);
  });

  it('should return useEffect on the server', async () => {
    vi.stubGlobal('window', undefined);

    const { useIsomorphicLayoutEffect } =
      await import('./useIsomorphicLayoutEffect');
    const { useEffect } = await import('react');

    expect(useIsomorphicLayoutEffect).toBe(useEffect);
  });

  it('should return useLayoutEffect on the client', async () => {
    vi.stubGlobal('window', {});

    const { useIsomorphicLayoutEffect } =
      await import('./useIsomorphicLayoutEffect');
    const { useLayoutEffect } = await import('react');

    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });
});
