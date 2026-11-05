import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'dy/system-colors-in-forced-colors';

const messages = ruleMessages(ruleName, {
  rejected: (keyword) =>
    `"${keyword}" is only allowed inside @media (forced-colors: active) (CSS-08)`,
});

/** The CSS system colors a component may use, because no token can express one. */
export const SYSTEM_COLORS = [
  'ButtonFace',
  'ButtonText',
  'Canvas',
  'CanvasText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'LinkText',
];

const SYSTEM_COLOR = new RegExp(`\\b(${SYSTEM_COLORS.join('|')})\\b`, 'g');
const FORCED_COLORS = /forced-colors\s*:\s*active/;

const isInForcedColors = (node) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      parent.type === 'atrule' &&
      parent.name === 'media' &&
      FORCED_COLORS.test(parent.params)
    ) {
      return true;
    }
  }
  return false;
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
  root.walkDecls((node) => {
    if (isInForcedColors(node)) {
      return;
    }
    for (const [keyword] of node.value.matchAll(SYSTEM_COLOR)) {
      report({
        result,
        ruleName,
        node,
        word: keyword,
        message: messages.rejected(keyword),
      });
    }
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export const systemColorsInForcedColors = createPlugin(ruleName, ruleFunction);
