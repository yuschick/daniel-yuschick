import { describe, expect, it } from 'vitest';

import type { GetAnchorPropsOptions } from './Anchor.types';
import { getAnchorProps } from './getAnchorProps';

function renderAnchorProps(options: Partial<GetAnchorPropsOptions> = {}) {
  return getAnchorProps({
    emphasis: 'primary',
    href: '/destination',
    htmlAttributes: {},
    intent: 'brand',
    size: 'm',
    variant: 'default',
    ...options,
  });
}

describe('getAnchorProps', () => {
  describe('appending text', () => {
    it('appends nothing to an ordinary link', () => {
      expect(renderAnchorProps().hiddenText).toBeUndefined();
    });

    it('names a new tab', () => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { target: '_blank' },
      });

      expect(hiddenText).toBe(' (opens in new tab)');
    });

    it('ignores any other target', () => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { target: '_self' },
      });

      expect(hiddenText).toBeUndefined();
    });

    it.each([true, '', 'report.pdf'])('names a download of %j', (download) => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { download },
      });

      expect(hiddenText).toBe(' (downloads file)');
    });

    it('treats download={false} as no download', () => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { download: false },
      });

      expect(hiddenText).toBeUndefined();
    });

    it('prefers the download text when both apply', () => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { download: true, target: '_blank' },
      });

      expect(hiddenText).toBe(' (downloads file)');
    });

    it.each([
      { 'aria-label': 'Report, opens in a new tab' },
      { 'aria-labelledby': 'label' },
    ])('defers to a consumer label: %j', (label) => {
      const { hiddenText } = renderAnchorProps({
        htmlAttributes: { ...label, target: '_blank' },
      });

      expect(hiddenText).toBeUndefined();
    });
  });

  describe('merging props', () => {
    it('sets the href and passes other attributes through', () => {
      const { anchorProps } = renderAnchorProps({
        htmlAttributes: { id: 'link', rel: 'author' },
      });

      expect(anchorProps.href).toBe('/destination');
      expect(anchorProps.id).toBe('link');
      expect(anchorProps.rel).toBe('author');
    });

    it('adds no role, tabIndex or click handling', () => {
      const { anchorProps } = renderAnchorProps();

      expect(anchorProps).not.toHaveProperty('role');
      expect(anchorProps).not.toHaveProperty('tabIndex');
      expect(anchorProps).not.toHaveProperty('onClick');
    });
  });

  describe('resolving classes', () => {
    it('resolves every class on the default form', () => {
      const { anchorProps } = renderAnchorProps({
        emphasis: 'secondary',
        intent: 'subtle',
        size: 'l',
      });

      expect(anchorProps.className).toContain('anchor');
      expect(anchorProps.className).toContain('variant-default');
      expect(anchorProps.className).toContain('intent-subtle');
      expect(anchorProps.className).toContain('emphasis-secondary');
      expect(anchorProps.className).toContain('size-l');
    });

    it('leaves emphasis and size off the inline form', () => {
      const { anchorProps } = renderAnchorProps({ variant: 'inline' });

      expect(anchorProps.className).toContain('variant-inline');
      expect(anchorProps.className).toContain('intent-brand');
      expect(anchorProps.className).not.toContain('emphasis-');
      expect(anchorProps.className).not.toContain('size-');
    });

    it('resolves the label class', () => {
      const { labelProps } = renderAnchorProps();

      expect(labelProps.className).toContain('label');
    });
  });
});
