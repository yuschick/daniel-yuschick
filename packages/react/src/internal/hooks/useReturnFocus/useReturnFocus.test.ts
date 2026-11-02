import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { useReturnFocus } from './useReturnFocus';

describe('useReturnFocus', () => {
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('basic restoration', () => {
    it('should restore focus to the trigger when closing', async () => {
      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Simulate focus moving into the overlay
      const dialogButton = document.createElement('button');
      document.body.appendChild(dialogButton);
      dialogButton.focus();
      expect(document.activeElement).toBe(dialogButton);

      // Close
      rerender({ enabled: false });

      // rAF flush
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });

    it('should not restore focus if still enabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Re-render with same value
      rerender({ enabled: true });

      // Focus should not have been manipulated
      expect(document.activeElement).toBe(trigger);
    });

    it('should be a no-op when enabled transitions false → false', () => {
      const focusSpy = vi.spyOn(trigger, 'focus');

      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: false },
        },
      );

      rerender({ enabled: false });

      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('missing trigger', () => {
    it('should not throw if nothing was focused before opening', () => {
      (document.activeElement as HTMLElement).blur();

      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      expect(() => {
        rerender({ enabled: false });
      }).not.toThrow();
    });

    it('should not throw if the trigger was removed from the DOM before closing', async () => {
      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Remove the trigger while the overlay is open
      trigger.remove();

      expect(() => {
        rerender({ enabled: false });
      }).not.toThrow();

      // Focus should not have moved to the removed element
      await vi.waitFor(() => {
        expect(document.activeElement).not.toBe(trigger);
      });
    });

    it('should not attempt to restore focus to document.body', async () => {
      // Blur so activeElement is body
      trigger.blur();
      expect(document.activeElement).toBe(document.body);

      const focusSpy = vi.spyOn(document.body, 'focus');

      const { rerender } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      rerender({ enabled: false });

      // Give rAF a chance to fire
      await vi.waitFor(() => {
        expect(focusSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('nested overlays', () => {
    it('should restore focus in LIFO order for nested dialogs', async () => {
      // Dialog A opens — trigger A (the button) is captured
      const hookA = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Focus moves into Dialog A
      const dialogAButton = document.createElement('button');
      dialogAButton.textContent = 'Dialog A action';
      document.body.appendChild(dialogAButton);
      dialogAButton.focus();

      // Dialog B opens from within Dialog A — trigger B (dialogAButton) is captured
      const hookB = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Focus moves into Dialog B
      const dialogBButton = document.createElement('button');
      dialogBButton.textContent = 'Dialog B action';
      document.body.appendChild(dialogBButton);
      dialogBButton.focus();

      // Close Dialog B — should restore to dialogAButton
      hookB.rerender({ enabled: false });

      await vi.waitFor(() => {
        expect(document.activeElement).toBe(dialogAButton);
      });

      // Close Dialog A — should restore to original trigger
      hookA.rerender({ enabled: false });

      await vi.waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });

    it('should handle closing nested dialogs in reverse order gracefully', async () => {
      // Dialog A opens
      const hookA = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      const dialogAButton = document.createElement('button');
      document.body.appendChild(dialogAButton);
      dialogAButton.focus();

      // Dialog B opens
      const hookB = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      // Close both in correct LIFO order
      hookB.rerender({ enabled: false });

      await vi.waitFor(() => {
        expect(document.activeElement).toBe(dialogAButton);
      });

      hookA.rerender({ enabled: false });

      await vi.waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  describe('unmount', () => {
    it('should not throw when unmounted while enabled', () => {
      const { unmount } = renderHook(
        ({ enabled }) => {
          useReturnFocus(enabled);
        },
        {
          initialProps: { enabled: true },
        },
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
