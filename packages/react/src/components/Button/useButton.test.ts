import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UseButtonOptions } from './Button.types';
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
  // The handler only touches these two methods, and a whole synthetic event
  // can't be built outside React's own event system.
  const event = {
    preventDefault,
    stopPropagation,
  } as unknown as React.MouseEvent<HTMLButtonElement>;
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
