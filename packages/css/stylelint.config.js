/**
 * This package holds the reset, whose job is to restyle HTML elements
 * themselves (`body`, `img`, `h1`), so it can't follow the shared rule that
 * selectors target only classes. Every other shared rule applies unchanged.
 *
 * @type {import('stylelint').Config}
 */
const config = {
  extends: ['@dy/configs/stylelint'],
  rules: {
    'defensive-css/require-pure-selectors': null,
  },
};

export default config;
