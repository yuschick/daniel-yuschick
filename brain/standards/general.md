---
description: "DY Design System cross-cutting rules for all code."
applyTo: "**"
---

# DY Design System — General Rules

> **Core Philosophy:** Clear and stable code over complex abstractions.

Rule IDs are permanent: rules may be reordered or retired, but an ID is never reused. When guidance overlaps, the more specific rule wins and the paired ✅/❌ examples are authoritative. `A11Y-*` rules take precedence over any conflicting rule. See the [standards index](README.md) for every domain.

## General Rules

### GEN-01 · Strict Linter Compliance & Suppression Discipline

- All CSS and TypeScript code **MUST** pass Stylelint, ESLint, and type-checking with zero warnings or errors.
- When a lint or type error occurs, the code **MUST** be refactored to comply with the rule rather than suppressing the check.
- Any unavoidable suppression directive (`/* eslint-disable-next-line */`, `/* stylelint-disable-next-line */`, `/* @ts-expect-error */`, `/* @ts-ignore */`) **MUST** contain all three of the following:
  1. The exact rule name being overridden (e.g., `eslint-disable-next-line @typescript-eslint/naming-convention`). Bare, untargeted directives are **STRICTLY FORBIDDEN**.
  2. An inline explanation of why the rule is bypassed.
  3. A concrete path to resolution — a `TODO` or tracking issue link.
- `/* @ts-ignore */` **MUST NOT** be used; prefer `/* @ts-expect-error */` so the suppression fails once the underlying error is resolved.

```ts
/* ✅ Correct: exact rule, explanation, and tracked resolution */
// eslint-disable-next-line @typescript-eslint/naming-convention -- LightningCSS AST mandates the capitalized 'Function' key; tracked in issue #104
Function: {
  enter(node) {
    // Logic...
  }
}

// @ts-expect-error -- upstream @types/react omits the 'inert' attribute; remove once the published types include it (TODO: #402)
const externalRef = React.useRef<HTMLButtonElement>(null);

/* ❌ Incorrect: bare directive with no rule target, reason, or resolution */
// @ts-ignore
const externalRef = React.useRef<HTMLButtonElement>(null);
```

```css
/* ❌ Incorrect: disabling Stylelint to bypass a fixable error */
@layer dy.react {
  /* stylelint-disable-next-line selector-class-pattern */
  .statusIndicator {
    background-color: #ffffff; /* stylelint-disable-line color-no-hex */
  }
}
```

### GEN-02 · Descriptive Identifiers (No Single-Letter Names)

- All identifiers—including parameters, loop indices, exception bindings, and callback arguments **MUST** use descriptive, full-word names.
- Single-letter variable names (e.g., `e`, `i`, `v`, `x`, `p`, `err`, `t`) are **STRICTLY FORBIDDEN**.
- Event callback parameters **MUST** be explicitly named `event` (or `nativeEvent` when dealing with synthetic wrappers).
- Array iteration parameters **MUST** use domain-descriptive nouns (e.g., `item`, `user`, `node`) and full positional names like `index`.
- Exception parameters in `catch` blocks **MUST** be named `error` or `unknownError`.

```tsx
/* ✅ Correct: Self-documenting, searchable parameter identifiers */
export function ItemList({ items, onClick }: ItemListProps) {
  try {
    const selectedItems = items.filter(
      (item, index) => item.isSelected && index > 0,
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onClick?.(event);
    };

    return (
      <button type="button" onClick={handleClick}>
        {selectedItems.map((item) => (
          <span key={item.id}>{item.name}</span>
        ))}
      </button>
    );
  } catch (error) {
    console.error("Failed to render ItemList:", error);
    return null;
  }
}

/* ❌ Incorrect: Cryptic single-letter variables and truncated names */
export function ItemList({ items, onClick }: ItemListProps) {
  try {
    const selectedItems = items.filter((i, idx) => i.isSelected && idx > 0); // ❌ 'i' and abbreviated 'idx'

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // ❌ 'e' instead of 'event'
      e.preventDefault();
      onClick?.(e);
    };

    return (
      <button type="button" onClick={handleClick}>
        {selectedItems.map(
          (
            x, // ❌ 'x' instead of domain noun
          ) => (
            <span key={x.id}>{x.name}</span>
          ),
        )}
      </button>
    );
  } catch (err) {
    // ❌ 'err' abbreviated variable name
    console.error("Failed to render ItemList:", err);
    return null;
  }

---

## Pre-Submission Checklist

- [ ] Zero lint/type suppressions without exact rule + reason + resolution (GEN-01)
- [ ] Descriptive identifiers; no single-letter names (GEN-02)
```
