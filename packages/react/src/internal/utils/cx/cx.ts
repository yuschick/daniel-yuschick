/**
 * Joins class names into one string, skipping empty values. It is plain string
 * concatenation: no arrays, no objects, no deduplication.
 *
 * @param classNames - Class names, or falsy values such as `false` and `undefined` that are skipped.
 * @returns The joined class names, or `undefined` when nothing is left so an empty `class` attribute is never rendered.
 */

export type ClassName = string | false | null | undefined;

export function cx(...classNames: ClassName[]): string | undefined {
  const joined = classNames.filter(Boolean).join(' ');

  return joined === '' ? undefined : joined;
}
