/**
 * A React hook that triggers a callback when an interaction (e.g., mouse, touch, or pointer event)
 * occurs outside a specified DOM element. This is useful for handling interactions like closing
 * dropdowns, modals, or tooltips when clicking or interacting outside of them.
 *
 * @param onInteractOutside - A callback function that is triggered when an interaction occurs outside the specified element.
 * @param options.enabled - Whether the hook is active. Defaults to `true`.
 * @param options.excludeRefs - An array of refs to elements that should be excluded from triggering the callback.
 * @param ref - A ref to the DOM element that the hook monitors for outside interactions.
 */

import { useEventCallback } from '@package-hooks/useEventCallback';
import { type RefObject, useEffect, useMemo } from 'react';

type InteractOutsideEvent = PointerEvent | MouseEvent | TouchEvent;
type InteractOutsideHandler = (event: InteractOutsideEvent) => void;

export interface UseInteractOutsideProps {
  onInteractOutside: InteractOutsideHandler;
  options?: {
    enabled?: boolean;
    excludeRefs?: RefObject<Element | null>[];
  };
  ref: RefObject<Element | null>;
}

export function useInteractOutside({
  onInteractOutside,
  options = {},
  ref,
}: UseInteractOutsideProps) {
  const { enabled = true } = options;
  const excludeRefs = useMemo(
    () => options.excludeRefs ?? [],
    [options.excludeRefs],
  );
  // Stable identity that always calls the latest `onInteractOutside`, so the
  // listeners below don't resubscribe whenever the consumer's callback changes
  const handleInteractOutside = useEventCallback(onInteractOutside);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supportsPointerEvents =
      window.onpointerdown === null || 'PointerEvent' in window;

    /**
     * Handles pointer, mouse, or touch events. It checks if the event target is outside
     * the monitored element (`ref`) and any excluded elements (`excludeRefs`).
     *
     * @param event - The interaction event (PointerEvent, MouseEvent, or TouchEvent)
     */
    const handleInteraction = (event: InteractOutsideEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target) &&
        !excludeRefs.some((excludeRef) =>
          excludeRef.current?.contains(event.target as Node),
        )
      ) {
        handleInteractOutside(event);
      }
    };

    if (supportsPointerEvents) {
      document.addEventListener('pointerdown', handleInteraction);
    } else {
      document.addEventListener('mousedown', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
    }

    /*
     ** Cleanup event listeners when the component unmounts or dependencies change
     */
    return () => {
      if (supportsPointerEvents) {
        document.removeEventListener('pointerdown', handleInteraction);
      } else {
        document.removeEventListener('mousedown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      }
    };
  }, [enabled, ref, excludeRefs, handleInteractOutside]);
}
