import { getLogoProps } from './getLogoProps';
import type { LogoProps } from './Logo.types';

export const Logo = function Logo({
  ref: externalRef,
  lockup = 'mark',
  size = 'm',
  ...htmlAttributes
}: LogoProps) {
  const { rootProps, svgProps } = getLogoProps({
    htmlAttributes,
    lockup,
    size,
  });

  return (
    <span ref={externalRef} {...rootProps}>
      <svg {...svgProps}>
        <path
          d="M17.0276 71.3135H30.5724L13.5447 122.686H0L17.0276 71.3135Z"
          fill="currentColor"
        />
        <path
          d="M77.0228 71.3135H90.5675L73.5398 122.686H59.9951L77.0228 71.3135Z"
          fill="currentColor"
        />
        <path
          d="M69.4758 0H83.0206L42.5799 122.686H29.0352L69.4758 0Z"
          fill="currentColor"
        />
        <path
          d="M105.455 71.3135H119L78.5594 194H65.0146L105.455 71.3135Z"
          fill="currentColor"
        />
      </svg>
      {lockup === 'full' && <span>Daniel Yuschick</span>}
    </span>
  );
};
