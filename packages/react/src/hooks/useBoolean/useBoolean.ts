/**
 * A React hook that provides a simplified interface for managing boolean state.
 * It returns the current value along with stable helper functions to set the
 * state to true, false, or toggle it, which is useful for handling the
 * visibility of menus, drawers, or simple conditional logic.
 *
 * @param props.defaultValue - The initial boolean value. Defaults to `false`.
 *
 * @returns An object containing the boolean state and memoized update functions:
 * - `setFalse`: A stable function that sets the value to `false`.
 * - `setTrue`: A stable function that sets the value to `true`.
 * - `setValue`: The standard React state setter supporting functional updates.
 * - `toggle`: A stable function that flips the current boolean value.
 * - `value`: The current boolean state value.
 */

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseBooleanProps {
  defaultValue?: boolean;
}

export interface UseBooleanReturn {
  setFalse: () => void;
  setTrue: () => void;
  setValue: Dispatch<SetStateAction<boolean>>;
  toggle: () => void;
  value: boolean;
}

export function useBoolean({
  defaultValue = false,
}: UseBooleanProps = {}): UseBooleanReturn {
  const [value, setValue] = useState(defaultValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return { setFalse, setTrue, setValue, toggle, value };
}
