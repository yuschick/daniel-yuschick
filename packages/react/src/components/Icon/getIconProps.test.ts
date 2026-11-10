import { SIZES } from '@package-types/common';
import { describe, expect, it } from 'vitest';

import { getIconProps } from './getIconProps';
import type { GetIconPropsOptions } from './Icon.types';

function renderIconProps(options: Partial<GetIconPropsOptions> = {}) {
  return getIconProps({
    htmlAttributes: {},
    size: 'm',
    ...options,
  });
}

describe('getIconProps', () => {
  describe('the decorative state', () => {
    it('hides an Icon with no aria-label, with no role or name', () => {
      const { rootProps } = renderIconProps();

      expect(rootProps['aria-hidden']).toBe('true');
      expect(rootProps).not.toHaveProperty('role');
      expect(rootProps).not.toHaveProperty('aria-label');
    });

    it.each([
      ['empty', ''],
      ['whitespace-only', ' \t\n '],
    ])('treats an %s aria-label as decorative', (_description, ariaLabel) => {
      const { rootProps } = renderIconProps({ ariaLabel });

      expect(rootProps['aria-hidden']).toBe('true');
      expect(rootProps).not.toHaveProperty('role');
      expect(rootProps).not.toHaveProperty('aria-label');
    });
  });

  describe('the named state', () => {
    it('gives a named Icon the img role and its label, and no aria-hidden', () => {
      const { rootProps } = renderIconProps({ ariaLabel: 'Download' });

      expect(rootProps.role).toBe('img');
      expect(rootProps['aria-label']).toBe('Download');
      expect(rootProps).not.toHaveProperty('aria-hidden');
    });

    it('names the Icon with the trimmed label', () => {
      const { rootProps } = renderIconProps({ ariaLabel: '  Download  ' });

      expect(rootProps['aria-label']).toBe('Download');
    });
  });

  describe('merging props', () => {
    it('passes other attributes to the root', () => {
      const { rootProps } = renderIconProps({
        htmlAttributes: {
          'aria-describedby': 'description',
          id: 'icon',
          title: 'Download the file',
        },
      });

      expect(rootProps.id).toBe('icon');
      expect(rootProps.title).toBe('Download the file');
      expect(rootProps['aria-describedby']).toBe('description');
    });

    it('never makes the root focusable', () => {
      const { rootProps } = renderIconProps({ ariaLabel: 'Download' });

      expect(rootProps).not.toHaveProperty('tabIndex');
    });
  });

  describe('resolving classes', () => {
    it.each(SIZES)('resolves the root class for size %s', (size) => {
      const { rootProps } = renderIconProps({ size });

      expect(rootProps.className).toContain('icon');
      expect(rootProps.className).toContain(`size-${size}`);
    });
  });
});
