# `@dy/eslint-config`

The shared ESLint configuration for every package: JavaScript, TypeScript (type-aware, `strictTypeChecked`), imports, disable-comment discipline and Turborepo env vars. React packages use [`@dy/eslint-react-config`](../eslint-react-config), which builds on this one.

## Usage

```js
// eslint.config.js
import { createBaseConfig } from '@dy/eslint-config';

export default createBaseConfig({ tsconfigRootDir: import.meta.dirname });
```

`tsconfigRootDir` points type-aware linting at the package's `tsconfig.json`.

## Rules backing the standards

| Rule                                          | Standard |
| :-------------------------------------------- | :------- |
| `@eslint-community/eslint-comments/*`         | GEN-01   |
| `id-length`                                   | GEN-02   |
| `import-x/no-default-export`                  | RX-04    |
| `no-restricted-imports` (`@dy/react/*`)       | RX-05    |
| `no-restricted-syntax` (`export * from`)      | RX-05    |
| `no-restricted-syntax` (`enum`)               | TS-07    |
| `@typescript-eslint/no-explicit-any` (preset) | TS-06    |

## Why TypeScript 6 is a dependency

The repo uses TypeScript 7, the native Go port, which doesn't include the JavaScript compiler API that `typescript-eslint` depends on. This package installs TypeScript 6.0.3 only so ESLint can parse TypeScript; type-checking and builds still use TypeScript 7. Remove it once `typescript-eslint` supports TypeScript 7.

Formatting is Prettier's job (see the root `prettier.config.mjs`); `eslint-config-prettier` turns off rules that would conflict with it.
