import { describe, it, expect, vi } from 'vitest';

import { mergeProps } from './mergeProps';

describe('mergeProps', () => {
  it('lets consumer values win over internal ones', () => {
    expect(
      mergeProps({ 'aria-label': 'Close', type: 'button' }, { type: 'submit' }),
    ).toEqual({ 'aria-label': 'Close', type: 'submit' });
  });

  it('never overrides with undefined', () => {
    expect(mergeProps({ type: 'button' }, { type: undefined })).toEqual({
      type: 'button',
    });
  });

  it('joins className values', () => {
    expect(
      mergeProps({ className: 'button size-m' }, { className: 'custom' }),
    ).toEqual({ className: 'button size-m custom' });
  });

  it('keeps className when only one side has it', () => {
    expect(mergeProps({ className: 'button' }, {})).toEqual({
      className: 'button',
    });
    expect(mergeProps({}, { className: 'custom' })).toEqual({
      className: 'custom',
    });
  });

  it('shallow-merges style with consumer keys winning', () => {
    expect(
      mergeProps(
        { style: { color: 'red', margin: 0 } },
        { style: { color: 'blue' } },
      ),
    ).toEqual({ style: { color: 'blue', margin: 0 } });
  });

  it('chains event handlers, internal first, without swallowing either', () => {
    const calls: string[] = [];
    const internal = vi.fn((_event: string) => calls.push('internal'));
    const external = vi.fn((_event: string) => calls.push('external'));

    const merged = mergeProps({ onClick: internal }, { onClick: external });
    merged.onClick('event');

    expect(calls).toEqual(['internal', 'external']);
    expect(internal).toHaveBeenCalledWith('event');
    expect(external).toHaveBeenCalledWith('event');
  });

  it('keeps a lone handler as is', () => {
    const handler = vi.fn();

    expect(mergeProps({ onClick: handler }, {}).onClick).toBe(handler);
    expect(mergeProps({}, { onClick: handler }).onClick).toBe(handler);
  });

  it('does not mutate its arguments', () => {
    const internalProps = { className: 'a', style: { color: 'red' } };
    const externalProps = { className: 'b', style: { margin: 0 } };

    mergeProps(internalProps, externalProps);

    expect(internalProps).toEqual({ className: 'a', style: { color: 'red' } });
    expect(externalProps).toEqual({ className: 'b', style: { margin: 0 } });
  });
});
