# `@dy/stylelint-config`

The shared Stylelint configuration for native CSS. No preprocessors or PostCSS plugins: the CSS you write is the CSS that ships.

## Usage

```js
// stylelint.config.js
/** @type {import('stylelint').Config} */
const config = {
  extends: ['@dy/stylelint-config'],
};

export default config;
```

Extend the config rather than re-exporting it, so Stylelint resolves its plugins from this package.

## Rules backing the standards

| Rule                                                    | Standard |
| :------------------------------------------------------ | :------- |
| `selector-class-pattern` (kebab-case)                   | CSS-01   |
| `defensive-css/require-at-layer` (`dy.*` layers)        | CSS-02   |
| `declaration-property-value-allowed-list` (tokens only) | CSS-07   |
| `logical-css/*`                                         | CSS-10   |
| `reportDescriptionlessDisables`                         | GEN-01   |

Allowed cascade layers: `dy.react`, `dy.reset`, `dy.themes`, `dy.tokens`, `dy.utilities`.

Formatting is Prettier's job (see the root `prettier.config.mjs`).
