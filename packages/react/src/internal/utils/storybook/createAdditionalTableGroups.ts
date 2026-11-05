interface CreateAdditionalTableGroupsProps {
  htmlAttributes?: string;
  svgAttributes?: string;
}

/**
 *
 * @param props - The props for the function.
 * @param props.htmlAttributes - The HTML attributes type the component accepts.
 * @param props.svgAttributes - The SVG attributes type the component accepts.
 * @description
 * This function creates the native attribute rows of a component's props table (FS-07). Rows for the component's own props, including `ref`, come from `createArgType`.
 * @example
 * argTypes: {
    ...createAdditionalTableGroups({
      htmlAttributes: 'HTMLAttributes<HTMLDivElement>',
    }),
  }
 * @returns object - An object that contains the additional table groups for Storybook
 */
export function createAdditionalTableGroups({
  htmlAttributes,
  svgAttributes,
}: CreateAdditionalTableGroupsProps): object {
  return {
    ...(htmlAttributes
      ? {
          htmlAttributes: {
            table: {
              category: 'HTML Attributes',
              type: {
                summary: htmlAttributes,
              },
            },
            control: false,
          },
        }
      : {}),
    ...(svgAttributes
      ? {
          svgAttributes: {
            table: {
              category: 'SVG Attributes',
              type: {
                summary: svgAttributes,
              },
            },
            control: false,
          },
        }
      : {}),
  };
}
