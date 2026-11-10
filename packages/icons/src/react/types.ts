import type { ReactElement, Ref, SVGAttributes } from 'react';

/**
 * Props every icon component accepts: any `<svg>` attribute, plus `ref`.
 * Every icon shares this one interface because every icon is generated from
 * the same template (scripts/generate.js), rather than one `[Name]Props` each.
 *
 * Icons default to `1em` square, `currentColor`, and hidden from assistive
 * tech (`aria-hidden="true"`); any attribute passed here overrides a default.
 */
export interface IconComponentProps extends SVGAttributes<SVGSVGElement> {
  ref?: Ref<SVGSVGElement>;
}

/** Any icon component from `@dy/icons/react`, such as `ChevronDownIcon`. */
export type IconComponent = (props: IconComponentProps) => ReactElement;
