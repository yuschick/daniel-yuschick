import { getComponentNameNode } from '../utils/component.js';

/** @type {import('eslint').Rule.RuleModule} */
export const oneComponentPerFile = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require each file to define exactly one React component (RX-06).',
    },
    messages: {
      multipleComponents:
        "'{{name}}' is a second component in this file. Move it to its own file (RX-06).",
    },
    schema: [],
  },
  create(context) {
    // A PascalCase function only counts as a component once it renders JSX
    const components = new Map();

    return {
      ':function'(node) {
        const nameNode = getComponentNameNode(node);

        if (nameNode) {
          components.set(node, { nameNode, rendersJsx: false });
        }
      },
      'JSXElement, JSXFragment'(node) {
        for (const ancestor of context.sourceCode.getAncestors(node)) {
          const component = components.get(ancestor);

          if (component) {
            component.rendersJsx = true;
          }
        }
      },
      'Program:exit'() {
        const rendering = [...components.values()].filter(
          (component) => component.rendersJsx,
        );

        for (const { nameNode } of rendering.slice(1)) {
          context.report({
            node: nameNode,
            messageId: 'multipleComponents',
            data: { name: nameNode.name },
          });
        }
      },
    };
  },
};
