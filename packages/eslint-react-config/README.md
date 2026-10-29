# `@dy/eslint-react-config`

The shared ESLint configuration for React packages and Next.js apps. It extends [`@dy/eslint-config`](../eslint-config) with React (`@eslint-react`, strict type-checked), hooks, accessibility (`jsx-a11y-x`, strict) and the custom `dy` rules.

## Usage

```js
// React packages
import { createReactConfig } from '@dy/eslint-react-config';

export default createReactConfig({ tsconfigRootDir: import.meta.dirname });
```

```js
// Next.js apps: adds Core Web Vitals rules and allows App Router default exports
import { createNextConfig } from '@dy/eslint-react-config';

export default createNextConfig({ tsconfigRootDir: import.meta.dirname });
```

## Custom `dy` rules

Rules for standards that no published plugin covers. Each lives in [`plugin/rules/`](plugin/rules) with a test next to it (`pnpm test`).

| Rule                        | Standard | Requires                                                                       |
| :-------------------------- | :------- | :----------------------------------------------------------------------------- |
| `dy/one-component-per-file` | RX-06    | One JSX-rendering component per file                                           |
| `dy/ref-naming`             | RX-02    | `ref: externalRef` in props; `useRef` results named `internal*Ref`             |
| `dy/rest-spread-name`       | TS-01    | Remaining props named `...htmlAttributes` or `...[component]AndHTMLAttributes` |

## Other rules backing the standards

| Rule                                              | Standard |
| :------------------------------------------------ | :------- |
| `@eslint-react/no-forward-ref` (preset)           | RX-01    |
| `@eslint-react/no-missing-component-display-name` | RX-01    |
| `no-restricted-syntax` (`displayName` assignment) | RX-01    |
| `jsx-a11y-x/*` (strict preset)                    | A11Y-*   |

Stories (`*.stories.tsx`) and `internal/` files may define several components and use default exports.
