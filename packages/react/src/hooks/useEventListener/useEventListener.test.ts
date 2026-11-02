import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useEventListener } from './useEventListener';

const { mockIsServer } = vi.hoisted(() => ({
  mockIsServer: vi.fn(() => false),
}));

vi.mock('@package-internal/utils', async () => {
  const actual = await vi.importActual<
    typeof import('@package-internal/utils')
  >('@package-internal/utils');

  return {
    ...actual,
    isServer: mockIsServer,
  };
});

describe('useEventListener', () => {
  beforeEach(() => {
    mockIsServer.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add click event to element', () => {
    const element = document.createElement('button');
    const handler = vi.fn();

    renderHook(() => {
      useEventListener({
        element: { current: element },
        eventName: 'click',
        handler,
      });
    });

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should remove event listener on unmount', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() => {
      useEventListener({
        element: { current: element },
        eventName: 'click',
        handler,
      });
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
  });

  it('should add event to window by default', () => {
    const handler = vi.fn();

    renderHook(() => {
      useEventListener({
        eventName: 'resize',
        handler,
      });
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should noop if no element is provided, and no window is defined', () => {
    mockIsServer.mockReturnValue(true);
    const handler = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => {
      useEventListener({
        eventName: 'resize',
        handler,
      });
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call the latest handler after rerender without re-subscribing', () => {
    const element = document.createElement('button');
    const elementRef = { current: element };
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) => {
        useEventListener({
          element: elementRef,
          eventName: 'click',
          handler,
        });
      },
      { initialProps: { handler: firstHandler } },
    );

    const addCallsBeforeRerender = addEventListenerSpy.mock.calls.length;
    const removeCallsBeforeRerender = removeEventListenerSpy.mock.calls.length;

    rerender({ handler: secondHandler });

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy.mock.calls.length).toBe(addCallsBeforeRerender);
    expect(removeEventListenerSpy.mock.calls.length).toBe(
      removeCallsBeforeRerender,
    );
  });

  it('should re-subscribe when eventName changes', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const { rerender } = renderHook(
      ({ eventName }: { eventName: 'click' | 'dblclick' }) => {
        useEventListener({
          element: { current: element },
          eventName,
          handler,
        });
      },
      { initialProps: { eventName: 'click' } },
    );

    rerender({ eventName: 'dblclick' });

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'dblclick',
      expect.any(Function),
      undefined,
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should re-subscribe when element target changes', () => {
    const firstElement = document.createElement('button');
    const secondElement = document.createElement('button');
    const handler = vi.fn();
    const removeFirstSpy = vi.spyOn(firstElement, 'removeEventListener');

    const { rerender } = renderHook(
      ({ element }) => {
        useEventListener({
          element,
          eventName: 'click',
          handler,
        });
      },
      { initialProps: { element: { current: firstElement } } },
    );

    rerender({ element: { current: secondElement } });

    act(() => {
      firstElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      secondElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(removeFirstSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should forward options to addEventListener and removeEventListener', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const options = { capture: true, passive: true };
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() => {
      useEventListener({
        element: { current: element },
        eventName: 'click',
        handler,
        options,
      });
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      options,
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      options,
    );
  });

  it('should support document events when document is provided as the target', () => {
    const handler = vi.fn();

    renderHook(() => {
      useEventListener({
        element: { current: document },
        eventName: 'visibilitychange',
        handler,
      });
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support MediaQueryList change events', () => {
    const handler = vi.fn();
    const mediaQueryList = new EventTarget() as MediaQueryList;

    renderHook(() => {
      useEventListener({
        element: { current: mediaQueryList },
        eventName: 'change',
        handler,
      });
    });

    act(() => {
      mediaQueryList.dispatchEvent(new Event('change'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not add event listener when enabled is false', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    renderHook(() => {
      useEventListener({
        element: { current: element },
        eventName: 'click',
        handler,
        enabled: false,
      });
    });

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should attach and detach listener when enabled changes', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const { rerender } = renderHook(
      ({ enabled }) => {
        useEventListener({
          element: { current: element },
          eventName: 'click',
          handler,
          enabled,
        });
      },
      { initialProps: { enabled: false } },
    );

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );

    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
