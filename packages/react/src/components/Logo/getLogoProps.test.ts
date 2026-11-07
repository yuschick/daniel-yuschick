import { describe, expect, it } from 'vitest';

import { getLogoProps } from './getLogoProps';
import type { GetLogoPropsOptions } from './Logo.types';

function renderLogoProps(options: Partial<GetLogoPropsOptions> = {}) {
  return getLogoProps({
    htmlAttributes: {},
    lockup: 'mark',
    size: 'm',
    ...options,
  });
}

describe('getLogoProps', () => {
  describe('naming the mark', () => {
    it('gives the mark lockup an img role and the name', () => {
      const { svgProps } = renderLogoProps({ lockup: 'mark' });

      expect(svgProps.role).toBe('img');
      expect(svgProps['aria-label']).toBe('Daniel Yuschick');
      expect(svgProps).not.toHaveProperty('aria-hidden');
    });

    it('hides the full lockup mark, so the visible name is read once', () => {
      const { svgProps } = renderLogoProps({ lockup: 'full' });

      expect(svgProps['aria-hidden']).toBe('true');
      expect(svgProps).not.toHaveProperty('role');
      expect(svgProps).not.toHaveProperty('aria-label');
    });

    it('keeps the viewBox and sets no fixed dimensions', () => {
      const { svgProps } = renderLogoProps();

      expect(svgProps.viewBox).toBe('0 0 119 194');
      expect(svgProps).not.toHaveProperty('width');
      expect(svgProps).not.toHaveProperty('height');
    });
  });

  describe('merging props', () => {
    it('passes other attributes to the root', () => {
      const { rootProps } = renderLogoProps({
        htmlAttributes: {
          'aria-describedby': 'description',
          id: 'logo',
          title: 'Home',
        },
      });

      expect(rootProps.id).toBe('logo');
      expect(rootProps.title).toBe('Home');
      expect(rootProps['aria-describedby']).toBe('description');
    });

    it('never makes the root focusable or gives it a role', () => {
      const { rootProps } = renderLogoProps();

      expect(rootProps).not.toHaveProperty('tabIndex');
      expect(rootProps).not.toHaveProperty('role');
    });
  });

  describe('resolving classes', () => {
    it('resolves the root class from each variant', () => {
      const { rootProps } = renderLogoProps({ lockup: 'full', size: 'l' });

      expect(rootProps.className).toContain('logo');
      expect(rootProps.className).toContain('lockup-full');
      expect(rootProps.className).toContain('size-l');
    });

    it('resolves the mark class', () => {
      const { svgProps } = renderLogoProps();

      expect(svgProps.className).toContain('mark');
    });
  });
});
