import type { CSSProperties } from 'react';

type CustomProperties = Record<`--${string}`, string>;

/**
 * Sets per-token custom properties inline. React's style type has no slot for
 * custom properties, so this widens it once instead of casting at each use.
 */
export function customProperties({
  properties,
}: {
  properties: CustomProperties;
}): CSSProperties & CustomProperties {
  return { ...properties };
}
