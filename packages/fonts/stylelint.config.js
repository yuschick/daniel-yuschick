import sharedConfig from '@dy/configs/stylelint';

const allowedValuesRule = 'declaration-property-value-allowed-list';

/**
 * This package holds only `@font-face` rules. Inside them, `font-weight` is a
 * descriptor declaring the weight range a variable font file covers, not a
 * style, so it takes a numeric range (`300 700`) rather than a weight token
 * (CSS-07). Every other shared rule applies unchanged.
 *
 * @type {import('stylelint').Config}
 */
const config = {
  extends: ['@dy/configs/stylelint'],
  rules: {
    [allowedValuesRule]: {
      ...sharedConfig.rules[allowedValuesRule],
      'font-weight': ['/^\\d{3} \\d{3}$/'],
    },
  },
};

export default config;
