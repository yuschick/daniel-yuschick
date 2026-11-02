interface CreateAdditionalTableGroupsProps {
  htmlAttributes?: string;
  ref?: string;
  svgAttributes?: string;
}

/**
 *
 * @param props - The props for the function.
 * @param props.htmlAttributes - The HTML attributes to be added to the table.
 * @param props.ref - The ref to be added to the table.
 * @description
 * This function creates additional table groups for Storybook documentation. It takes an object with `htmlAttributes` and `ref` properties and returns an object that can be used in Storybook to display the additional table groups.
 * @example
 * argTypes: {
    ...createAdditionalTableGroups({
      htmlAttributes: 'HTMLAttributes<HTMLDivElement>',
      ref: 'React.RefObject<HTMLDivElement>',
    }),
  }
 * @returns object - An object that contains the additional table groups for Storybook
 */
export function createAdditionalTableGroups({
  htmlAttributes,
  ref,
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
    ...(ref
      ? {
          ref: {
            table: {
              category: 'Forward Ref',
              type: {
                summary: ref,
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
