import { vi } from 'vitest';

export function disablePointerEvents() {
  const savedPointerEvent = window.PointerEvent;
  const savedOnpointerdown = window.onpointerdown;
  // @ts-expect-error -- Deleting to simulate environments without PointerEvent support
  delete window.PointerEvent;
  // @ts-expect-error -- Deleting to simulate environments without PointerEvent support
  delete window.onpointerdown;

  return () => {
    window.PointerEvent = savedPointerEvent;
    window.onpointerdown = savedOnpointerdown;
  };
}

export function mockPointerEvent() {
  vi.stubGlobal(
    'PointerEvent',
    class PointerEvent extends MouseEvent {
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        Object.assign(this, props);
      }
    },
  );
}

export function restorePointerEvent() {
  vi.unstubAllGlobals();
}
