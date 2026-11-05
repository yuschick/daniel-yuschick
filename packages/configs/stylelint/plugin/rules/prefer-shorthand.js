import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'dy/prefer-shorthand';

const messages = ruleMessages(ruleName, {
  expected: (shorthand, longhands) =>
    `Expected the shorthand "${shorthand}" instead of ${longhands} (CSS-14)`,
});

/**
 * Two or more longhands of one shorthand in a block must be that shorthand.
 * `requires` lists what the shorthand can't be written without.
 */
const SHORTHANDS = [
  {
    shorthand: 'animation',
    longhands: [
      'animation-delay',
      'animation-direction',
      'animation-duration',
      'animation-fill-mode',
      'animation-iteration-count',
      'animation-name',
      'animation-play-state',
      'animation-timing-function',
    ],
  },
  {
    shorthand: 'background',
    longhands: [
      'background-attachment',
      'background-clip',
      'background-color',
      'background-image',
      'background-origin',
      'background-position',
      'background-repeat',
      'background-size',
    ],
  },
  {
    shorthand: 'border',
    longhands: ['border-color', 'border-style', 'border-width'],
  },
  {
    shorthand: 'border-block',
    longhands: [
      'border-block-color',
      'border-block-style',
      'border-block-width',
    ],
  },
  {
    shorthand: 'border-inline',
    longhands: [
      'border-inline-color',
      'border-inline-style',
      'border-inline-width',
    ],
  },
  { shorthand: 'flex', longhands: ['flex-basis', 'flex-grow', 'flex-shrink'] },
  { shorthand: 'flex-flow', longhands: ['flex-direction', 'flex-wrap'] },
  {
    shorthand: 'font',
    longhands: [
      'font-family',
      'font-size',
      'font-stretch',
      'font-style',
      'font-variant',
      'font-weight',
      'line-height',
    ],
    requires: ['font-family', 'font-size'],
  },
  { shorthand: 'gap', longhands: ['column-gap', 'row-gap'] },
  {
    shorthand: 'grid-area',
    longhands: [
      'grid-column-end',
      'grid-column-start',
      'grid-row-end',
      'grid-row-start',
    ],
  },
  { shorthand: 'inset', longhands: ['inset-block', 'inset-inline'] },
  {
    shorthand: 'inset-block',
    longhands: ['inset-block-end', 'inset-block-start'],
  },
  {
    shorthand: 'inset-inline',
    longhands: ['inset-inline-end', 'inset-inline-start'],
  },
  {
    shorthand: 'list-style',
    longhands: ['list-style-image', 'list-style-position', 'list-style-type'],
  },
  { shorthand: 'margin', longhands: ['margin-block', 'margin-inline'] },
  {
    shorthand: 'margin-block',
    longhands: ['margin-block-end', 'margin-block-start'],
  },
  {
    shorthand: 'margin-inline',
    longhands: ['margin-inline-end', 'margin-inline-start'],
  },
  {
    shorthand: 'outline',
    longhands: ['outline-color', 'outline-style', 'outline-width'],
  },
  { shorthand: 'padding', longhands: ['padding-block', 'padding-inline'] },
  {
    shorthand: 'padding-block',
    longhands: ['padding-block-end', 'padding-block-start'],
  },
  {
    shorthand: 'padding-inline',
    longhands: ['padding-inline-end', 'padding-inline-start'],
  },
  {
    shorthand: 'place-content',
    longhands: ['align-content', 'justify-content'],
  },
  { shorthand: 'place-items', longhands: ['align-items', 'justify-items'] },
  { shorthand: 'place-self', longhands: ['align-self', 'justify-self'] },
  {
    shorthand: 'text-decoration',
    longhands: [
      'text-decoration-color',
      'text-decoration-line',
      'text-decoration-style',
      'text-decoration-thickness',
    ],
  },
  {
    shorthand: 'transition',
    longhands: [
      'transition-behavior',
      'transition-delay',
      'transition-duration',
      'transition-property',
      'transition-timing-function',
    ],
  },
];

const checkBlock = ({ block, result }) => {
  const declarations = (block.nodes ?? []).filter(
    (node) => node.type === 'decl',
  );
  for (const { shorthand, longhands, requires = [] } of SHORTHANDS) {
    const found = declarations.filter(({ prop }) =>
      longhands.includes(prop.toLowerCase()),
    );
    const props = found.map(({ prop }) => prop.toLowerCase());
    if (found.length < 2 || !requires.every((prop) => props.includes(prop))) {
      continue;
    }
    for (const node of found) {
      report({
        result,
        ruleName,
        node,
        message: messages.expected(shorthand, props.join(', ')),
      });
    }
  }
};

const ruleFunction = (primary) => (root, result) => {
  if (
    !validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  ) {
    return;
  }
  checkBlock({ block: root, result });
  root.walk((node) => {
    if (node.type === 'rule' || node.type === 'atrule') {
      checkBlock({ block: node, result });
    }
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export const preferShorthand = createPlugin(ruleName, ruleFunction);
