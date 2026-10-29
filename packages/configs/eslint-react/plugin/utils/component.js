const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

/**
 * Returns the identifier naming a function when that name is PascalCase, the
 * convention for React components, or `null` otherwise. Covers
 * `function Button() {}`, `const Button = function Button() {}` and
 * `const Button = () => {}`.
 *
 * @param {import('eslint').Rule.Node} node A function node
 * @returns {import('eslint').Rule.Node | null}
 */
export function getComponentNameNode(node) {
  const nameNode =
    node.id ??
    (node.parent.type === 'VariableDeclarator' ? node.parent.id : null);

  if (nameNode?.type !== 'Identifier' || !PASCAL_CASE.test(nameNode.name)) {
    return null;
  }

  return nameNode;
}

/**
 * Returns the destructured props parameter of a component, or `null` when the
 * function isn't a component or doesn't destructure its props.
 *
 * @param {import('eslint').Rule.Node} node A function node
 * @returns {import('eslint').Rule.Node | null}
 */
export function getDestructuredProps(node) {
  const [props] = node.params;

  if (!getComponentNameNode(node) || props?.type !== 'ObjectPattern') {
    return null;
  }

  return props;
}
