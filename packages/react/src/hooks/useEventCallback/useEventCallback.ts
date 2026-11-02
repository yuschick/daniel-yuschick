/**
 * A React hook that creates a stable callback reference while always invoking the most recent function.
 *
 * This hook is useful for event handlers that need to remain stable across renders (e.g., to maintain
 * referential equality for dependency arrays) while still having access to the latest function and its
 * closure. It uses a ref to store the current function and updates it in a layout effect, ensuring the
 * callback identity never changes but always executes the most recent implementation.
 *
 * @returns A stable callback function with the same signature that always invokes the latest provided function.
 */

import { useIsomorphicLayoutEffect } from '@package-internal/hooks';
import { useCallback, useRef } from 'react';

export function useEventCallback<Args extends unknown[], R>(
  func: (...args: Args) => R,
): (...args: Args) => R;
export function useEventCallback<Args extends unknown[], R>(
  func: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined;
export function useEventCallback<Args extends unknown[], R>(
  func: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined {
  const funcRef = useRef<typeof func>(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  useIsomorphicLayoutEffect(() => {
    funcRef.current = func;
  }, [func]);

  return useCallback(
    (...args: Args) => funcRef.current?.(...args),
    [funcRef],
  ) as (...args: Args) => R;
}
