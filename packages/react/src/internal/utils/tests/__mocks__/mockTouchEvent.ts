type TouchType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';

export function createMockTouch({
  identifier = 0,
  target = document.body,
  screenX = 0,
  screenY = 0,
}: Partial<Touch> & {
  screenX?: number;
  screenY?: number;
  target?: EventTarget;
}): Touch {
  return {
    identifier,
    target,
    screenX,
    screenY,
    clientX: screenX,
    clientY: screenY,
    pageX: screenX,
    pageY: screenY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  };
}

export function createMockTouchEvent(
  type: TouchType,
  touches: ReturnType<typeof createMockTouch>[],
): TouchEvent {
  return new TouchEvent(type, {
    changedTouches: touches,
    touches,
    targetTouches: touches,
    bubbles: true,
    cancelable: true,
  });
}
