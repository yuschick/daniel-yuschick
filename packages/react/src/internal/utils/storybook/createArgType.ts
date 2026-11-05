interface CreateArgTypeOptions {
  category?: string;
  control?: 'boolean' | 'radio' | 'select' | 'text' | false;
  defaultValue?: string;
  description: string;
  options?: readonly string[];
  type: string;
}

/**
 * Builds one row of a component's props table (FS-07). `type` is the name shown
 * in the Type column. When `options` are passed, the row can be toggled open to
 * list them, so the table shows `Size` and not a long union.
 *
 * @param options - The row's options.
 * @param options.category - The row's group. `[SubComponentName] Props` for a composed component's props.
 * @param options.control - The Controls panel input. Defaults to `radio` with `options`, otherwise none.
 * @param options.defaultValue - The prop's default, if it has one.
 * @param options.description - What the prop does.
 * @param options.options - The values the type allows.
 * @param options.type - The type's name.
 * @example
 * emphasis: createArgType({
 *   defaultValue: 'primary',
 *   description: 'The priority of the button within a screen region.',
 *   options: EMPHASES,
 *   type: 'Emphasis',
 * }),
 * @returns object - The Storybook arg type.
 */
export function createArgType({
  category = 'Component Props',
  control,
  defaultValue,
  description,
  options,
  type,
}: CreateArgTypeOptions): object {
  return {
    control: control ?? (options ? 'radio' : false),
    description,
    ...(options ? { options } : {}),
    table: {
      category,
      ...(defaultValue ? { defaultValue: { summary: defaultValue } } : {}),
      type: {
        summary: type,
        ...(options ? { detail: options.join(', ') } : {}),
      },
    },
  };
}
