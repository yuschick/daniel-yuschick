import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { renderIcon } from './renderIcon';
import type { IconComponentProps, IconNode } from './types';

const NODES = [
  ['path', { d: 'M18 6 6 18' }],
  ['circle', { cx: '12', cy: '12', r: '10' }],
] satisfies IconNode[];

// Shaped like a generated icon component
const TestIcon = function TestIcon({
  ref: externalRef,
  ...htmlAttributes
}: IconComponentProps) {
  return renderIcon({ htmlAttributes, nodes: NODES, svgRef: externalRef });
};

function renderSvg(props: IconComponentProps = {}) {
  const { container } = render(<TestIcon {...props} />);
  const svg = container.querySelector('svg');
  if (!svg) {
    throw new Error('No <svg> rendered.');
  }
  return svg;
}

describe('renderIcon', () => {
  it('renders every shape with its geometry, in order', () => {
    const svg = renderSvg();
    const shapes = [...svg.children];

    expect(shapes.map((shape) => shape.tagName)).toEqual(['path', 'circle']);
    expect(shapes[0]?.getAttribute('d')).toBe('M18 6 6 18');
    expect(shapes[1]?.getAttribute('r')).toBe('10');
  });

  it('is decorative, text-sized and drawn in the house style by default', () => {
    const svg = renderSvg();

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('2');
    expect(svg.getAttribute('stroke-linecap')).toBe('round');
    expect(svg.getAttribute('stroke-linejoin')).toBe('round');
  });

  it('lets every prop override a default', () => {
    const svg = renderSvg({
      'aria-hidden': undefined,
      'aria-label': 'Close',
      className: 'icon',
      role: 'img',
      width: 16,
    });

    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.getAttribute('aria-label')).toBe('Close');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('class')).toBe('icon');
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('height')).toBe('1em');
  });

  it('passes the ref to the <svg>', () => {
    const svgRef = createRef<SVGSVGElement>();
    const svg = renderSvg({ ref: svgRef });

    expect(svgRef.current).toBe(svg);
  });
});
