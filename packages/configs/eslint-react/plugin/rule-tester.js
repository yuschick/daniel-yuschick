import { describe, it } from 'node:test';

import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

// Run RuleTester cases through Node's built-in test runner
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});
