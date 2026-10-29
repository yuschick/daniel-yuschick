# `@dy/configs`

Shared tooling configuration for every package: ESLint, Stylelint and TypeScript. Each tool has its own subpath export, so a tool loads only its own config and plugins.

| Export                          | Provides                                         |
| :------------------------------ | :----------------------------------------------- |
| `@dy/configs/eslint`            | `createBaseConfig`                               |
| `@dy/configs/eslint-react`      | `createReactConfig`, `createNextConfig`          |
| `@dy/configs/stylelint`         | The Stylelint config (default export)            |
| `@dy/configs/typescript/*.json` | `base.json`, `nextjs.json`, `react-library.json` |

Formatting is Prettier's job (see the root `prettier.config.mjs`); these configs turn off rules that would conflict with it.

## ESLint

```js
// eslint.config.js: pick the one that matches the package
import { createBaseConfig } from '@dy/configs/eslint';
import { createReactConfig } from '@dy/configs/eslint-react';
import { createNextConfig } from '@dy/configs/eslint-react';

export default createReactConfig({ tsconfigRootDir: import.meta.dirname });
```

- **Base:** JavaScript, TypeScript (type-aware, `strictTypeChecked`), imports, disable-comment discipline and Turborepo env vars. `tsconfigRootDir` points type-aware linting at the package's `tsconfig.json`.
- **React:** adds React (`@eslint-react`, strict type-checked), hooks, accessibility (`jsx-a11y-x`, strict) and the custom `dy` rules. Stories (`*.stories.tsx`) and `internal/` files may define several components and use default exports.
- **Next.js:** adds Core Web Vitals rules and allows default exports in App Router files.

### Custom `dy` rules

Rules for standards that no published plugin covers. Each lives in [`eslint-react/plugin/rules/`](eslint-react/plugin/rules) with a test next to it (`pnpm test`).

| Rule                        | Standard | Requires                                                                       |
| :-------------------------- | :------- | :----------------------------------------------------------------------------- |
| `dy/one-component-per-file` | RX-06    | One JSX-rendering component per file                                           |
| `dy/ref-naming`             | RX-02    | `ref: externalRef` in props; `useRef` results named `internal*Ref`             |
| `dy/rest-spread-name`       | TS-01    | Remaining props named `...htmlAttributes` or `...[component]AndHTMLAttributes` |

### Other rules backing the standards

| Rule                                              | Standard |
| :------------------------------------------------ | :------- |
| `@eslint-community/eslint-comments/*`             | GEN-01   |
| `id-length`                                       | GEN-02   |
| `import-x/no-default-export`                      | RX-04    |
| `no-restricted-imports` (`@dy/react/*`)           | RX-05    |
| `no-restricted-syntax` (`export * from`)          | RX-05    |
| `no-restricted-syntax` (`enum`)                   | TS-07    |
| `@typescript-eslint/no-explicit-any` (preset)     | TS-06    |
| `@eslint-react/no-forward-ref` (preset)           | RX-01    |
| `@eslint-react/no-missing-component-display-name` | RX-01    |
| `no-restricted-syntax` (`displayName` assignment) | RX-01    |
| `jsx-a11y-x/*` (strict preset)                    | A11Y-\*  |

### Why TypeScript 6 is a dependency

The repo uses TypeScript 7, the native Go port, which doesn't include the JavaScript compiler API that `typescript-eslint` depends on. This package installs TypeScript 6.0.3 only so ESLint can parse TypeScript; type-checking and builds still use TypeScript 7. Remove it once `typescript-eslint` supports TypeScript 7.

## Stylelint

```js
// stylelint.config.js
/** @type {import('stylelint').Config} */
const config = {
  extends: ['@dy/configs/stylelint'],
};

export default config;
```

Native CSS only: no preprocessors or PostCSS plugins. Extend the config rather than re-exporting it, so Stylelint resolves its plugins from this package.

| Rule                                                    | Standard |
| :------------------------------------------------------ | :------- |
| `selector-class-pattern` (kebab-case)                   | CSS-01   |
| `defensive-css/require-at-layer` (`dy.*` layers)        | CSS-02   |
| `declaration-property-value-allowed-list` (tokens only) | CSS-07   |
| `logical-css/*`                                         | CSS-10   |
| `reportDescriptionlessDisables`                         | GEN-01   |

Allowed cascade layers: `dy.react`, `dy.reset`, `dy.themes`, `dy.tokens`, `dy.utilities`.

## TypeScript

```json
{
  "extends": "@dy/configs/typescript/react-library.json"
}
```

`base.json` is strict with `noUncheckedIndexedAccess`; `react-library.json` adds JSX, and `nextjs.json` adds the Next.js plugin and bundler resolution.
