/**
 * @internal - This hook should not be exported outside of the library.
 * Captures the focused element when `enabled` becomes true and restores
 * focus to it when `enabled` returns to false. Supports nested overlays
 * (e.g. a Dialog opening a second Dialog) via a shared LIFO stack.
 *
 * Safe under React Strict Mode: all mutations are confined to the effect
 * phase, and cleanup cancels any pending restoration frame.
 */

import { useEffect, useRef } from 'react';

const RETURN_STACK: HTMLElement[] = [];

export function useReturnFocus(enabled: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (enabled) {
      const activeElement = document.activeElement;
      const triggerElement =
        activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : null;

      triggerRef.current = triggerElement;

      if (triggerElement) {
        RETURN_STACK.push(triggerElement);
      }

      return;
    }

    // enabled transitioned to false — restore focus
    const triggerElement = RETURN_STACK.pop() ?? triggerRef.current;
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
