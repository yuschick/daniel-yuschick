/**
 * Merges the props a component computes (`internalProps`) with the ones its
 * consumer passes (`externalProps`) into a single object to spread on the root
 * element (RX-10).
 *
 * - Consumer values win over internal ones, except `undefined`, which never overrides.
 * - `className` values are joined, so both survive.
 * - `style` objects are shallow-merged, consumer keys winning.
 * - Event handlers (`on[A-Z]…`) are chained: the internal one runs first, then
 *   the consumer's, so a consumer callback is never swallowed.
 * - `ref` and `id` are not merged here; `useMergeRefs` and `useResolvedId` own those.
 *
 * This takes two positional arguments by design (documented exception to TS-03).
 *
 * @param internalProps - Attributes, state and class names computed by the component.
 * @param externalProps - Attributes passed in by the consumer, usually `htmlAttributes`.
 * @returns A new object; neither argument is mutated.
 */

import { cx } from '../cx';

type Props = Record<string, unknown>;
type Handler = (...args: unknown[]) => void;

const EVENT_HANDLER = /^on[A-Z]/;

function isHandler(value: unknown): value is Handler {
  return typeof value === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function mergeProps<Internal extends Props, External extends Props>(
  internalProps: Internal,
  externalProps: External,
): Internal & External {
  const merged: Props = { ...internalProps };

  for (const [key, externalValue] of Object.entries(externalProps)) {
    if (externalValue === undefined) {
      continue;
    }

    const internalValue = internalProps[key];

    if (key === 'className') {
      merged[key] = cx(
        typeof internalValue === 'string' && internalValue,
        typeof externalValue === 'string' && externalValue,
      );
    } else if (key === 'style' && isRecord(externalValue)) {
      merged[key] = {
        ...(isRecord(internalValue) ? internalValue : {}),
        ...externalValue,
      };
    } else if (
      EVENT_HANDLER.test(key) &&
      isHandler(internalValue) &&
      isHandler(externalValue)
    ) {
      merged[key] = (...args: unknown[]) => {
        internalValue(...args);
        externalValue(...args);
      };
    } else {
      merged[key] = externalValue;
    }
  }

  return merged as Internal & External;
}
