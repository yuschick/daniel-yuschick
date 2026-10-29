import { oneComponentPerFile } from './rules/one-component-per-file.js';
import { refNaming } from './rules/ref-naming.js';
import { restSpreadName } from './rules/rest-spread-name.js';

/**
 * Rules for DY Design System standards that no published plugin covers.
 * Registered under the `dy` namespace, e.g. `dy/ref-naming`.
 */
export const dyPlugin = {
  meta: { name: 'eslint-plugin-dy' },
  rules: {
    'one-component-per-file': oneComponentPerFile,
    'ref-naming': refNaming,
    'rest-spread-name': restSpreadName,
  },
};
