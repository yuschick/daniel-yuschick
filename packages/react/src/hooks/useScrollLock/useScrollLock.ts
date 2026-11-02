/**
 * A React hook that manages body scroll locking to prevent background scrolling
 * when overlays (modals, drawers, menus) are active. It handles scrollbar
 * layout shifts by preserving the scrollbar gutter and provides a global
 * tracking mechanism to support nested or multiple active locks.
 *
 * @returns An object containing stable functions to manage the scroll state:
 * - `lock`: A function that increments the active lock count and applies 'overflow: hidden' to the body.
 * - `unlock`: A function that decrements the active lock count and restores original styles once all locks are released.
 */

import { isServer } from '@package-internal/utils';
import { useCallback, useLayoutEffect, useRef } from 'react';

export interface UseScrollLockReturn {
  lock: () => void;
  unlock: () => void;
}

interface OriginalStyles {
  overflow: CSSStyleDeclaration['overflow'];
  paddingRight: CSSStyleDeclaration['paddingRight'];
  scrollbarGutter: CSSStyleDeclaration['scrollbarGutter'];
}

const IS_SERVER = isServer();

let activeLocks = 0;
let originalStyles: OriginalStyles | null = null;

export function useScrollLock(): UseScrollLockReturn {
  const hasLockRef = useRef(false);

  const lock = useCallback(() => {
    if (IS_SERVER || hasLockRef.current) {
      return;
    }

    const { body, documentElement: root } = document;

    if (activeLocks === 0) {
      const { overflow, paddingRight } = body.style;
      const { scrollbarGutter } = root.style;

      originalStyles = { overflow, paddingRight, scrollbarGutter };

      const isPageScrollable = body.scrollHeight > window.innerHeight;
      const scrollbarWidth = window.innerWidth - body.scrollWidth;

      body.style.overflow = 'hidden';

      if (isPageScrollable && scrollbarWidth > 0) {
        const supportsScrollbarGutter = CSS.supports(
          'scrollbar-gutter: stable',
        );

        if (supportsScrollbarGutter) {
          root.style.scrollbarGutter = 'stable';
        } else {
          const paddingOffset =
            Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
          body.style.paddingRight = `${String(paddingOffset + scrollbarWidth)}px`;
        }
      }
    }

    activeLocks += 1;
    hasLockRef.current = true;
  }, []);

  const unlock = useCallback(() => {
    if (IS_SERVER || !hasLockRef.current) {
      return;
    }

    hasLockRef.current = false;
    activeLocks = Math.max(0, activeLocks - 1);

    if (activeLocks > 0) {
      return;
    }

    if (originalStyles) {
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.paddingRight = originalStyles.paddingRight;
      document.documentElement.style.scrollbarGutter =
        originalStyles.scrollbarGutter;

      originalStyles = null;
    }
  }, []);

  /*
   ** Ensure any held lock is released on unmount.
   */
  useLayoutEffect(() => {
    return () => {
      unlock();
    };
  }, [unlock]);

  return {
    lock,
    unlock,
  };
}
