/**
 * @internal - This hook should not be exported outside of the library.
 * Returns the provided id or a stable auto-generated id.
 * Useful for ensuring a component always has a unique id.
 */

import { useId } from 'react';

export function useResolvedId(externalId?: string): string {
  const internalId = useId();
  const resolvedId = externalId ?? internalId;

  return resolvedId;
}
