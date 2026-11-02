/**
 * @internal - This hook should not be exported outside of the library.
 * Captures the focused element when `enabled` becomes true and restores
 * focus to it when `enabled` returns to false. Each scope restores only the
 * element it captured, so nested overlays (e.g. a Dialog opening a second
 * Dialog) return focus in the order they close, and a scope that mounts
 * closed never moves focus.
 *
 * Safe under React Strict Mode: all mutations are confined to the effect
 * phase, and cleanup cancels any pending restoration frame.
 */

import { useEffect, useRef } from 'react';

export function useReturnFocus(enabled: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (enabled) {
      const activeElement = document.activeElement;
      triggerRef.current =
        activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : null;

      return;
    }

    // Only a scope that was enabled has captured a trigger to restore
    const triggerElement = triggerRef.current;
    triggerRef.current = null;

    if (!triggerElement) {
      return;
    }

    const requestId = requestAnimationFrame(() => {
      if (document.contains(triggerElement)) {
        triggerElement.focus();
      }
    });

    return () => {
      cancelAnimationFrame(requestId);
    };
  }, [enabled]);
}
