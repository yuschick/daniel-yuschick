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

/**
 * Returns the name of the nearest enclosing function that has one, so a ref
 * created inside a callback is attributed to the component or hook around it.
 *
 * @param {import('eslint').Rule.Node[]} ancestors Ancestors, outermost first
 * @returns {string | null}
 */
export function getEnclosingFunctionName(ancestors) {
  for (const ancestor of [...ancestors].reverse()) {
    if (
      ancestor.type !== 'FunctionDeclaration' &&
      ancestor.type !== 'FunctionExpression' &&
      ancestor.type !== 'ArrowFunctionExpression'
    ) {
      continue;
    }

    const nameNode =
      ancestor.id ??
      (ancestor.parent.type === 'VariableDeclarator'
        ? ancestor.parent.id
        : null);

    if (nameNode?.type === 'Identifier') {
      return nameNode.name;
    }
  }

  return null;
}

/**
 * @param {string | null} name
 * @returns {boolean} Whether the name is PascalCase, the convention for components
 */
export function isComponentName(name) {
  return name !== null && PASCAL_CASE.test(name);
}
