/**
 * A React hook that merges multiple refs into a single ref callback, allowing
 * a component to forward refs to multiple targets simultaneously. It handles both
 * callback refs and ref objects, managing their lifecycle and cleanup to prevent
 * memory leaks and ensure proper cleanup when instances are unmounted.
 *
 * @returns A ref callback function or null if all provided refs are undefined:
 */

import { useMemo, useRef } from 'react';

type Ref<Instance> =
  | Exclude<React.Ref<Instance>, React.RefObject<Instance>>
  | React.RefObject<Instance | null>;

// Gives every distinct ref object or callback a stable number, so a list of
// refs can be compared by identity through a short string key
const refIds = new WeakMap<object, number>();
let nextRefId = 0;

function getRefKey(ref: object | null | undefined): string {
  if (ref === null || ref === undefined) {
    return '-';
  }

  const knownId = refIds.get(ref);
  if (knownId !== undefined) {
    return String(knownId);
  }

  const id = nextRefId;
  nextRefId += 1;
  refIds.set(ref, id);
  return String(id);
}

export function useMergeRefs<Instance>(
  refs: (Ref<Instance> | undefined)[],
): null | React.RefCallback<Instance> {
  const cleanupRef = useRef<() => void>(undefined);

  // Consumers usually pass a new array each render, so the array can't be the
  // dependency. The key only changes when one of the refs itself does.
  const refsKey = refs.map(getRefKey).join(',');

  return useMemo(() => {
    /* eslint-disable-next-line eqeqeq -- intentional loose check */
    if (refs.every((ref) => ref == null)) {
      return null;
    }

    const refEffect = (instance: Instance) => {
      const cleanups = refs.map((ref) => {
        /* eslint-disable-next-line eqeqeq -- intentional loose check */
        if (ref == null) {
          return;
        }

        if (typeof ref === 'function') {
          const refCallback = ref;
          /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- intentional void checks for broader support */
          const refCleanup: void | (() => void) = refCallback(instance);
          return typeof refCleanup === 'function'
            ? refCleanup
            : () => {
                refCallback(null);
              };
        }

        ref.current = instance;

        return () => {
          ref.current = null;
        };
      });

      return () => {
        cleanups.forEach((refCleanup) => refCleanup?.());
      };
    };

    return (value) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }

      /* eslint-disable-next-line eqeqeq -- intentional loose check */
      if (value != null) {
        cleanupRef.current = refEffect(value);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- `refsKey` stands in for `refs`: it changes exactly when a ref's identity does (TODO: drop if the lint can ever verify a variable-length dependency list)
  }, [refsKey]);
}
