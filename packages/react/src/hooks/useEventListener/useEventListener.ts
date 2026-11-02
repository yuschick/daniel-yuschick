import { isServer } from '@package-internal/utils';
import { useEffect, useRef, type RefObject } from 'react';

import { useEventCallback } from '../useEventCallback';

/*
SPDX-SnippetBegin
SPDX-SnippetCopyrightText: AIGENERATED/GitHub Copilot
SPDX-License-Identifier: LicenseRef-OpAiGenerated
*/
type SupportedEventTarget =
  Window | Document | HTMLElement | SVGElement | MediaQueryList;

type EventMapFor<T extends SupportedEventTarget> = T extends Window
  ? WindowEventMap
  : T extends Document
    ? DocumentEventMap
    : T extends MediaQueryList
      ? MediaQueryListEventMap
      : T extends SVGElement
        ? SVGElementEventMap
        : T extends HTMLElement
          ? HTMLElementEventMap
          : never;
/*
SPDX-SnippetEnd
*/

export interface UseEventListenerProps<
  T extends SupportedEventTarget = Window,
  K extends keyof EventMapFor<T> = keyof EventMapFor<T>,
> {
  element?: RefObject<T | null>;
  enabled?: boolean;
  eventName: K;
  handler: (event: EventMapFor<T>[K]) => void;
  options?: boolean | AddEventListenerOptions;
}
export function useEventListener<
  T extends SupportedEventTarget = Window,
  K extends keyof EventMapFor<T> = keyof EventMapFor<T>,
>({
  element,
  enabled = true,
  eventName,
  handler,
  options,
}: UseEventListenerProps<T, K>) {
  const stableHandler = useEventCallback(handler);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const targetElement = element?.current ?? (isServer() ? null : window);
    const { current } = optionsRef;

    if (!targetElement) {
      return;
    }

    targetElement.addEventListener(
      eventName as string,
      stableHandler as EventListener,
      current,
    );

    return () => {
      targetElement.removeEventListener(
        eventName as string,
        stableHandler as EventListener,
        current,
      );
    };
  }, [element, enabled, eventName, stableHandler]);
}
