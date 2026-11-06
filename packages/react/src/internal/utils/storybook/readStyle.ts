export interface ReadStyleOptions {
  cssProperty: string;
  element: Element;
}

/**
 * Reads one rendered CSS value, the way a story checks what a component really shows.
 *
 * @param options - The element to read and the CSS property, in kebab-case.
 * @returns The property's computed value.
 */
export function readStyle({ cssProperty, element }: ReadStyleOptions): string {
  return getComputedStyle(element).getPropertyValue(cssProperty);
}
