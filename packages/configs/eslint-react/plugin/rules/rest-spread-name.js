import { getDestructuredProps } from '../utils/component.js';

// `htmlAttributes`, or `[composedComponent]AndHTMLAttributes` when a component
// renders another DY component (e.g. `buttonAndHTMLAttributes`)
const ALLOWED_NAME = /^(htmlAttributes|[a-z][A-Za-z0-9]*AndHTMLAttributes)$/;

/** @type {import('eslint').Rule.RuleModule} */
export const restSpreadName = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Require a component's remaining props to be named '...htmlAttributes' (TS-01).",
    },
    messages: {
      invalidName:
        "Name the remaining props '...htmlAttributes' (or '...[component]AndHTMLAttributes' when composing a DY component), not '...{{name}}' (TS-01).",
    },
    schema: [],
  },
  create(context) {
    return {
      ':function'(node) {
        const props = getDestructuredProps(node);
        const rest = props?.properties.find(
          (property) => property.type === 'RestElement',
        );

        if (
          rest?.argument.type === 'Identifier' &&
          !ALLOWED_NAME.test(rest.argument.name)
        ) {
          context.report({
            node: rest,
            messageId: 'invalidName',
            data: { name: rest.argument.name },
          });
        }
      },
    };
  },
};
