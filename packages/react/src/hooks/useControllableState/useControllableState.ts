/**
 * A React hook that manages state that can be either controlled (by props) or
 * uncontrolled (internal state). It provides a consistent API for components
 * that need to support both patterns, common in design system elements like
 * Inputs, Accordions and Dialogs.
 *
 * @param props.defaultValue - The initial value when in uncontrolled mode. Can be a value or an initializer function.
 * @param props.onChange - A callback triggered whenever the state changes, regardless of controlled/uncontrolled mode.
 * @param props.shouldUpdate - An optional function to determine if the state should actually update. Defaults to a strict inequality check (prev !== next).
 * @param props.value - The controlled value of the state. If defined, the hook operates in controlled mode.
 * @returns An object containing the current state value and a stable setter function that supports functional updates.
 */

import { useState, type SetStateAction } from 'react';

import { useEventCallback } from '../useEventCallback';

export interface UseControllableStateProps<T> {
  defaultValue?: T | (() => T);
  onChange?: (value: T) => void;
  shouldUpdate?: (prev: T, next: T) => boolean;
  value?: T;
}

export interface UseControllableStateReturn<T> {
  setValue: (next: React.SetStateAction<T>) => void;
  value: T;
}

export function useControllableState<T>({
  defaultValue,
  onChange: onChangeProp,
  shouldUpdate: shouldUpdateProp = (prev, next) => prev !== next,
  value,
}: UseControllableStateProps<T>): UseControllableStateReturn<T> {
  const [uncontrolledState, setUncontrolledState] = useState(defaultValue as T);

  const onChange = useEventCallback(onChangeProp);
  const shouldUpdate = useEventCallback(shouldUpdateProp);

  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : uncontrolledState;

  // Stable identity, but always runs with the value from the latest render,
  // so functional updates and `shouldUpdate` never see a stale value
  const setValue = useEventCallback((next: SetStateAction<T>) => {
    const nextValue =
      typeof next === 'function'
        ? (next as (prev: T) => T)(resolvedValue)
        : next;

    if (!shouldUpdate(resolvedValue, nextValue)) {
      return;
    }

    if (!isControlled) {
      setUncontrolledState(nextValue);
    }

    onChange?.(nextValue);
  });

  return { value: resolvedValue, setValue };
}
