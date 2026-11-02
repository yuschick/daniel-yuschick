import {
  getDestructuredProps,
  getEnclosingFunctionName,
  isComponentName,
} from '../utils/component.js';

const INTERNAL_REF = /^internal([A-Z][A-Za-z0-9]*)?Ref$/;
const REF_SUFFIX = /Ref$/;

/**
 * @param {import('eslint').Rule.Node | null | undefined} node
 * @returns {boolean} Whether the node is `useRef(...)` or `React.useRef(...)`
 */
function isUseRefCall(node) {
  if (node?.type !== 'CallExpression') {
    return false;
  }

  const { callee } = node;

  if (callee.type === 'Identifier') {
    return callee.name === 'useRef';
  }

  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'useRef'
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export const refNaming = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Require a component's ref prop to be destructured as 'externalRef' and its useRef results named 'internal[Name]Ref'; hooks and utilities only need a 'Ref' suffix (RX-02).",
    },
    messages: {
      externalRef: "Destructure the ref prop as 'ref: externalRef' (RX-02).",
      internalRef:
        "Name refs created with useRef in a component 'internalRef' or 'internal[Name]Ref', not '{{name}}' (RX-02).",
      refSuffix:
        "Name refs created with useRef with a 'Ref' suffix, not '{{name}}' (RX-02).",
    },
    schema: [],
  },
  create(context) {
    return {
      ':function'(node) {
        const props = getDestructuredProps(node);

        if (!props) {
          return;
        }

        for (const property of props.properties) {
          const isRefProp =
            property.type === 'Property' &&
            !property.computed &&
            property.key.type === 'Identifier' &&
            property.key.name === 'ref';

          if (!isRefProp) {
            continue;
          }

          const binding =
            property.value.type === 'AssignmentPattern'
              ? property.value.left
              : property.value;

          if (binding.type !== 'Identifier' || binding.name !== 'externalRef') {
            context.report({ node: property, messageId: 'externalRef' });
          }
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !isUseRefCall(node.init)) {
          return;
        }

        const isComponent = isComponentName(
          getEnclosingFunctionName(context.sourceCode.getAncestors(node)),
        );
        const isValid = isComponent
          ? INTERNAL_REF.test(node.id.name)
          : REF_SUFFIX.test(node.id.name);

        if (!isValid) {
          context.report({
            node: node.id,
            messageId: isComponent ? 'internalRef' : 'refSuffix',
            data: { name: node.id.name },
          });
        }
      },
    };
  },
};
