import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UseButtonOptions, UseButtonReturn } from './Button.types';
import { useButton } from './useButton';

function renderUseButton(options: Partial<UseButtonOptions> = {}) {
  return renderHook(() =>
    useButton({
      emphasis: 'primary',
      htmlAttributes: {},
      intent: 'brand',
      size: 'm',
      ...options,
    }),
  ).result.current;
}

function createClickEvent() {
  const preventDefault = vi.fn();
  const stopPropagation = vi.fn();
  // The handlers only touch these two methods, and a whole synthetic event
  // can't be built outside React's own event system. A pointer event is also a
  // mouse event, so one fake serves the click, mouse and pointer handlers.
  const event = {
    preventDefault,
    stopPropagation,
  } as unknown as React.PointerEvent<HTMLButtonElement>;
  return { event, preventDefault, stopPropagation };
}

const DISABLED_CASES: {
  expected: 'true' | undefined;
  name: string;
  options: Partial<UseButtonOptions>;
}[] = [
  { expected: undefined, name: 'nothing set', options: {} },
  { expected: 'true', name: 'isDisabled', options: { isDisabled: true } },
  { expected: 'true', name: 'disabled', options: { disabled: true } },
  {
    expected: 'true',
    name: 'aria-disabled as a boolean',
    options: { ariaDisabled: true },
  },
  {
    expected: 'true',
    name: 'aria-disabled as a string',
    options: { ariaDisabled: 'true' },
  },
  {
    expected: undefined,
    name: 'aria-disabled as "false"',
    options: { ariaDisabled: 'false' },
  },
  {
    expected: undefined,
    name: 'isDisabled false over disabled true',
    options: { disabled: true, isDisabled: false },
  },
  {
    expected: undefined,
    name: 'isDisabled false over aria-disabled true',
    options: { ariaDisabled: 'true', isDisabled: false },
  },
  {
    expected: undefined,
    name: 'disabled false over aria-disabled true',
    options: { ariaDisabled: true, disabled: false },
  },
  {
    expected: 'true',
    name: 'isDisabled true over disabled false',
    options: { disabled: false, isDisabled: true },
  },
];

describe('useButton', () => {
  describe('resolving disabled', () => {
    it.each(DISABLED_CASES)(
      'sets aria-disabled for $name',
      ({ options, expected }) => {
        const { buttonProps } = renderUseButton(options);

        expect(buttonProps['aria-disabled']).toBe(expected);
      },
    );

    it('never renders the native disabled attribute', () => {
      const { buttonProps } = renderUseButton({ disabled: true });

      expect(buttonProps).not.toHaveProperty('disabled');
    });
  });

  describe('handling a click', () => {
    it('calls the consumer when enabled', () => {
      const onClick = vi.fn();
      const { event, preventDefault, stopPropagation } = createClickEvent();
      const { buttonProps } = renderUseButton({ onClick });

      buttonProps.onClick?.(event);

      expect(onClick).toHaveBeenCalledExactlyOnceWith(event);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(stopPropagation).not.toHaveBeenCalled();
    });

    it('stops the event before the consumer when disabled', () => {
      const onClick = vi.fn();
      const { event, preventDefault, stopPropagation } = createClickEvent();
      const { buttonProps } = renderUseButton({ isDisabled: true, onClick });

      buttonProps.onClick?.(event);

      expect(onClick).not.toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(stopPropagation).toHaveBeenCalledOnce();
    });

    it('handles a click with no consumer', () => {
      const { event } = createClickEvent();
      const { buttonProps } = renderUseButton();

      expect(buttonProps.onClick).toBeTypeOf('function');
      expect(() => buttonProps.onClick?.(event)).not.toThrow();
    });
  });

  describe('guarding pointer presses', () => {
    const PRESS_HANDLERS = [
      'onMouseDown',
      'onMouseUp',
      'onPointerDown',
      'onPointerUp',
    ] satisfies readonly (keyof UseButtonOptions)[];

    it.each(PRESS_HANDLERS)('calls %s when enabled', (handlerName) => {
      const handler = vi.fn();
      const { buttonProps } = renderUseButton({ [handlerName]: handler });

      buttonProps[handlerName]?.(createClickEvent().event);

      expect(handler).toHaveBeenCalledOnce();
    });

    it.each(PRESS_HANDLERS)('skips %s when disabled', (handlerName) => {
      const handler = vi.fn();
      const { event, preventDefault } = createClickEvent();
      const { buttonProps } = renderUseButton({
        isDisabled: true,
        [handlerName]: handler,
      });

      buttonProps[handlerName]?.(event);

      expect(handler).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('still passes move, enter and leave handlers when disabled', () => {
      const onMouseMove = vi.fn();
      const onPointerEnter = vi.fn();
      const onPointerLeave = vi.fn();
      const { buttonProps } = renderUseButton({
        htmlAttributes: { onMouseMove, onPointerEnter, onPointerLeave },
        isDisabled: true,
      });

      expect(buttonProps.onMouseMove).toBe(onMouseMove);
      expect(buttonProps.onPointerEnter).toBe(onPointerEnter);
      expect(buttonProps.onPointerLeave).toBe(onPointerLeave);
    });
  });

  describe('resolving the icon size', () => {
    it.each([
      { buttonSize: 's', iconSize: 's' },
      { buttonSize: 'm', iconSize: 'l' },
      { buttonSize: 'l', iconSize: 'l' },
    ] satisfies readonly {
      buttonSize: UseButtonOptions['size'];
      iconSize: UseButtonReturn['iconProps']['size'];
    }[])(
      'uses Icon $iconSize for Button $buttonSize',
      ({ buttonSize, iconSize }) => {
        const { iconProps } = renderUseButton({ size: buttonSize });

        expect(iconProps).toEqual({ size: iconSize });
      },
    );
  });

  describe('merging props', () => {
    it('defaults type to button', () => {
      const { buttonProps } = renderUseButton();

      expect(buttonProps.type).toBe('button');
    });

    it('lets the consumer override type', () => {
      const { buttonProps } = renderUseButton({
        htmlAttributes: { type: 'submit' },
      });

      expect(buttonProps.type).toBe('submit');
    });

    it('passes other attributes through', () => {
      const { buttonProps } = renderUseButton({
        htmlAttributes: { name: 'save' },
      });

      expect(buttonProps.name).toBe('save');
    });

    it('passes the ref through', () => {
      const buttonRef = vi.fn();
      const { buttonProps } = renderUseButton({ buttonRef });

      expect(buttonProps.ref).toBe(buttonRef);
    });
  });

  describe('resolving classes', () => {
    it('resolves the button class from each variant', () => {
      const { buttonProps } = renderUseButton({
        emphasis: 'tertiary',
        intent: 'subtle',
        size: 'l',
      });

      expect(buttonProps.className).toContain('button');
      expect(buttonProps.className).toContain('emphasis-tertiary');
      expect(buttonProps.className).toContain('intent-subtle');
      expect(buttonProps.className).toContain('size-l');
    });

    it('resolves the label class', () => {
      const { labelProps } = renderUseButton();

      expect(labelProps.className).toContain('label');
    });
  });
});
