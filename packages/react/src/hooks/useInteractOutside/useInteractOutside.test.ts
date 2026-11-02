import {
  disablePointerEvents,
  mockPointerEvent,
  restorePointerEvent,
} from '@package-internal/utils/tests/__mocks__/mockPointerEvent';
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useInteractOutside } from './useInteractOutside';

describe('useInteractOutside', () => {
  let ref: HTMLDivElement;
  let excludedRef: HTMLDivElement | null;

  beforeEach(() => {
    ref = document.createElement('div');
    document.body.appendChild(ref);
    excludedRef = null;
  });

  afterEach(() => {
    document.body.removeChild(ref);

    if (excludedRef) {
      document.body.removeChild(excludedRef);
    }
  });

  it('should trigger mock function when pointerdown outside of ref', () => {
    mockPointerEvent();
    const mousedownMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new PointerEvent('pointerdown');
      document.dispatchEvent(event);
    });

    expect(mousedownMock).toHaveBeenCalledTimes(1);
    restorePointerEvent();
  });

  it('should trigger mock function when mousedown outside of ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const mousedownMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });

    expect(mousedownMock).toHaveBeenCalledTimes(1);
    restorePointerEvents();
  });

  it('should trigger mock function when touchstart outside of ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const touchstartMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: touchstartMock,
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new TouchEvent('touchstart');
      document.dispatchEvent(event);
    });

    expect(touchstartMock).toHaveBeenCalledTimes(1);
    restorePointerEvents();
  });

  it('should not trigger mock function when pointerdown inside ref', () => {
    mockPointerEvent();
    const mousedownMock = vi.fn();
    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        ref: { current: ref },
      });
    });
    act(() => {
      const event = new PointerEvent('pointerdown');
      ref.dispatchEvent(event);
    });
    expect(mousedownMock).not.toHaveBeenCalled();
    restorePointerEvent();
  });

  it('should not trigger mock function when mousedown inside ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const mousedownMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new MouseEvent('mousedown');
      ref.dispatchEvent(event);
    });

    expect(mousedownMock).not.toHaveBeenCalled();
    restorePointerEvents();
  });

  it('should not trigger mock function when touchstart inside ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const touchstartMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: touchstartMock,
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new TouchEvent('touchstart');
      ref.dispatchEvent(event);
    });

    expect(touchstartMock).not.toHaveBeenCalled();
    restorePointerEvents();
  });

  it('should not trigger mock function when pointerdown on excluded ref', () => {
    mockPointerEvent();
    const mousedownMock = vi.fn();
    excludedRef = document.createElement('div');
    document.body.appendChild(excludedRef);
    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        options: { excludeRefs: [{ current: excludedRef }] },
        ref: { current: ref },
      });
    });
    act(() => {
      const event = new PointerEvent('pointerdown');
      excludedRef?.dispatchEvent(event);
    });
    expect(mousedownMock).not.toHaveBeenCalled();
    restorePointerEvent();
  });

  it('should not trigger mock function when mousedown on excluded ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const mousedownMock = vi.fn();
    excludedRef = document.createElement('div');
    document.body.appendChild(excludedRef);

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        options: { excludeRefs: [{ current: excludedRef }] },
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new MouseEvent('mousedown');
      excludedRef?.dispatchEvent(event);
    });

    expect(mousedownMock).not.toHaveBeenCalled();
    restorePointerEvents();
  });

  it('should not trigger mock function when touchstart on excluded ref', () => {
    const restorePointerEvents = disablePointerEvents();
    const touchstartMock = vi.fn();
    excludedRef = document.createElement('div');
    document.body.appendChild(excludedRef);

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: touchstartMock,
        options: { excludeRefs: [{ current: excludedRef }] },
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new TouchEvent('touchstart');
      excludedRef?.dispatchEvent(event);
    });

    expect(touchstartMock).not.toHaveBeenCalled();
    restorePointerEvents();
  });

  it('should not trigger mock function when disabled', () => {
    const mousedownMock = vi.fn();

    renderHook(() => {
      useInteractOutside({
        onInteractOutside: mousedownMock,
        options: { enabled: false },
        ref: { current: ref },
      });
    });

    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });

    expect(mousedownMock).not.toHaveBeenCalled();
  });
});
