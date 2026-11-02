---
description: 'DY Design System CSS conventions governing component stylesheets.'
applyTo: '**/*.css'
paths:
  - '**/*.css'
---

# DY Design System — CSS Conventions

> **Core Philosophy:** Clear and stable code over complex abstractions.

Rule IDs are permanent: rules may be reordered or retired, but an ID is never reused. When guidance overlaps, the more specific rule wins and the paired ✅/❌ examples are authoritative. `A11Y-*` rules take precedence over any conflicting rule. See the [standards index](README.md) for every domain.

## CSS Rules

### CSS-01 · Class Naming Syntax

- All CSS classnames **MUST** use `kebab-case`.
- **MUST NOT** use `camelCase`, `PascalCase`, or `snake_case`.

| Status           | Example                     |
| :--------------- | :-------------------------- |
| ✅ **Correct**   | `.status-indicator { ... }` |
| ❌ **Incorrect** | `.statusIndicator { ... }`  |
| ❌ **Incorrect** | `.StatusIndicator { ... }`  |

### CSS-02 · Cascade Layer Scoping

- All component styles **MUST** be wrapped in the `@layer dy.react` cascade layer.
- Styles **MUST NOT** exist at the root CSS scope outside of this layer.

```css
/* ✅ Correct */
@layer dy.react {
  .status-indicator { ... }
}

/* ❌ Incorrect - Missing layer scope */
.status-indicator { ... }
```

### CSS-03 · Motion & Reduced Motion Fallbacks

- All CSS `transition` and `animation` properties **MUST** be disabled by default or placed exclusively inside a `@media (prefers-reduced-motion: no-preference)` block.
- Motion **MUST NOT** execute when a user has enabled reduced motion settings.
- Opacity changes and instant color swaps are permitted by default; physical spatial movement, scaling, and rotation **MUST** be gated behind the media query.

```css
/* ✅ Correct: Default is static; motion is opt-in */
.status-indicator {
  opacity: 1;
  transition: opacity 150ms ease;
}

@media (prefers-reduced-motion: no-preference) {
  .status-indicator {
    transition:
      transform 200ms ease,
      opacity 150ms ease;
  }
}

/* ❌ Incorrect: Motion applied unconditionally at root scope */
.status-indicator {
  transition: transform 200ms ease;
}
```

### CSS-04 · Strict Prop-to-Class Name Namespacing

- All string prop values that control visual variants **MUST** map to CSS class names using a strict [propName]-[propValue] prefix pattern.
- Standalone or un-prefixed variant classnames (e.g., `.ghost`, `.md`, `.neutral`) are **STRICTLY FORBIDDEN**.
- **MUST NOT** use `if/else` chains, `switch` statements, or manual ternaries to resolve variant class names; resolve them dynamically via string interpolation.

```ts
/* ✅ Correct: Every variant prop is explicitly prefixed */
// StatusIndicator.types.ts
interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
  type?: 'ok' | 'neutral' | 'warning';
  variant?: 'filled' | 'ghost' | 'outlined';
  size?: 's' | 'm' | 'l';
}

// StatusIndicator.tsx
export const StatusIndicator = function StatusIndicator({
  ref: externalRef,
  type = 'neutral',
  variant = 'filled',
  size = 'm',
  className,
  ...htmlAttributes
}: StatusIndicatorProps) {
  const internalProps = {
    ref: externalRef,
    className: cx(
      styles['status-indicator'],
      styles[`type-${type}`],
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      className
    ),
  };

  return <div {...mergeProps(internalProps, htmlAttributes)} />;
};
```

```css
/* Corresponding CSS Module: styles.module.css */
@layer dy.react {
  .status-indicator { ... }
  .type-neutral { ... }
  .variant-ghost { ... }
  .size-m { ... }
}

/* ❌ Incorrect: Un-prefixed or conditionally assigned classes */
export function StatusIndicator({ type, variant, size }: StatusIndicatorProps) {
  return (
    <div
      className={cx(
        styles['status-indicator'],
        styles[type], // ❌ Missing `type-` prefix
        variant === 'ghost' ? styles.ghost : styles.filled // ❌ Imperative check & un-prefixed
      )}
    />
  );
}
```

### CSS-05 · Components and CSS Modules

- All React components **MUST** define their styles in a co-located `[ComponentName].module.css` file.
- The CSS module **MUST** be imported as styles at the top of the component file (`import styles from './[ComponentName].module.css`).
- Style files **MUST NOT** be shared across multiple components; each component owns its dedicated .module.css file.

```bash
📁 StatusIndicator/
├── StatusIndicator.tsx
├── StatusIndicator.module.css
├── StatusIndicator.stories.tsx
├── StatusIndicator.types.ts
└── index.ts
```

### CSS-06 · State Styling via Semantic HTML & Data Attributes

- Dynamic component states **MUST** be styled using native HTML attributes (e.g., `[disabled]`, `[readonly]`) or ARIA attributes (e.g., `[aria-expanded="true"]`, `[aria-selected="true"]`).
- Non-standard, custom visual states, **MUST** use custom `data-*` attributes (e.g., `[data-state="active"]`, `[data-pending="true"]`).
- **MUST NOT** create custom modifier CSS class names for state management (e.g., `.disabled`, `.active`, `.is-open`, `.is-pending`).

```css
/* ✅ Correct: Styles bound directly to native/ARIA & data attributes */
@layer dy.react {
  .button {
    background-color: var(--dy-color-surface-action-primary);

    &[aria-disabled='true'] {
      background-color: var(--dy-color-surface-neutral-disabled);
      cursor: not-allowed;
    }

    &[aria-expanded='true'] {
      border-color: var(--dy-color-border-focus);
    }

    &[data-pending='true'] {
      pointer-events: none;
      opacity: 0.7;
    }
  }
}

/* ❌ Incorrect: Decoupled modifier classes */
@layer dy.react {
  .button {
    &.disabled { ... }
    &.is-open { ... }
    &.pending { ... }
  }
}
```

```ts
/* ✅ Correct React Implementation */
export function Button({
  isPending,
  isDisabled,
  isOpen,
  ...htmlAttributes
}: ButtonProps) {
  return (
    <button
      className={styles.button}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-expanded={isOpen}
      data-pending={isPending ? 'true' : undefined}
      {...htmlAttributes}
    />
  );
}
```

### CSS-07 · Component Token Abstraction via CSS Custom Properties

- Every CSS property that changes values across states, variants, or sizes **MUST** be driven by an internal component-scoped CSS custom property (component token).
- Component CSS custom properties **MUST** follow the strict naming structure:

--[component-name]-[property]-[variant-or-state]

(e.g., `--button-color-surface-default`, `--button-color-surface-hover`, `--button-size-block-min`).

- Component CSS custom properties **MUST** use Logical CSS terminology
- Variant and state selectors (`.variant-primary`, `&[aria-disabled="true"]`) **MUST ONLY** redefine the values of these internal custom properties. They **MUST NOT** repeat raw CSS declarations (like `background-color:` or `padding:`) across multiple selectors.
- Component tokens **MUST** reference system design tokens (`var(--dy-color-...)` or `var(--dy-space-...)`) rather than hardcoded primitive values.

```css
/* ✅ Correct: Single CSS declaration driven by local variable overrides */
@layer dy.react {
  .button {
    /* 1. Define Local Component Tokens (mapped to System Tokens) */
    --button-color-surface: var(--dy-color-surface-action-primary-default);
    --button-color-foreground: var(--dy-color-text-on-action);
    --button-space-padding: var(--dy-space-3);

    /* 2. Single Declaration using Local Variables */
    background-color: var(--button-color-surface);
    color: var(--button-color-foreground);
    padding: var(--button-space-padding);

    /* 3. Variant & State Selectors ONLY Mutate Local Variables */
    &.variant-secondary {
      --button-color-surface: var(--dy-color-surface-action-secondary-default);
    }

    &.size-s {
      --button-space-padding: var(--dy-space-2);
    }

    &[aria-disabled='true'] {
      --button-color-surface: var(--dy-color-surface-neutral-disabled);
      --button-color-foreground: var(--dy-color-text-disabled);
    }
  }
}

/* ❌ Incorrect: Repeating properties across state selectors */
@layer dy.react {
  .button {
    background-color: var(--dy-color-surface-action-primary-default);
    color: var(--dy-color-text-on-action);

    &.variant-secondary {
      background-color: var(
        --dy-color-surface-action-secondary-default
      ); /* ❌ Repeated property */
    }

    &[aria-disabled='true'] {
      background-color: var(
        --dy-color-surface-neutral-disabled
      ); /* ❌ Repeated property */
      color: var(--dy-color-text-disabled); /* ❌ Repeated property */
    }
  }
}
```

### CSS-08 · Forced Colors Mode & High-Contrast Boundaries

- Interactive elements (buttons, inputs, checkboxes) and floating UI containers (dialogs, popovers, menus, tooltips) **MUST ALWAYS** retain a defined `border-width` and `border-style`.
- Visual borders that should appear invisible in default states or themes **MUST** use `border-color: transparent` or `border: 1px solid transparent`.
- **MUST NOT** use `border: none`, `border: 0`, or `border-width: 0` on interactive elements or floating containers.
- Floating elements using `box-shadow` for elevation **MUST** also include a `1px solid transparent` border so the browser can draw a high-contrast bounding box when shadows are disabled in Forced Colors Mode.
- Focus outlines and states **MUST NOT** be created using `box-shadow` as all shadows are removed in Forced Colors Mode. All focus indicators **MUST** use robust patterns using `outline` and/or `border`.

```css
/* ✅ Correct: Preserves geometry and focus in Forced Colors Mode */
@layer dy.react {
  /* Ghost button style */
  .button.variant-ghost {
    border: 1px solid transparent;
  }

  /* Floating UI elevation */
  .popover {
    box-shadow: var(--dy-elevation-high);
    border: 1px solid transparent;
  }

  /* Focus indicator using native outline */
  .button:focus-visible {
    outline: 2px solid var(--dy-color-border-focus);
    outline-offset: 2px;
  }
}

/* ❌ Incorrect: Invisible boundaries and lost focus in Forced Colors Mode */
@layer dy.react {
  .button.variant-ghost {
    border: none; /* ❌ Eliminates high-contrast outline */
  }

  .popover {
    box-shadow: var(
      --dy-elevation-high
    ); /* ❌ Disappears when shadows are stripped */
  }

  /* ❌ Disappears entirely in Windows High Contrast Mode */
  .button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--dy-color-border-focus);
  }
}
```

### CSS-09 · Touch-Safe Hover States

- All :hover pseudo-class selectors **MUST** be wrapped inside a `@media (hover: hover)` media query to prevent sticky hover states on touch devices.
- Pseudo-class `:hover` styles **MUST NOT** exist at the root scope outside of a `@media (hover: hover)` block.
- Hover styles **MUST ONLY** adjust visual properties (such as `color`, `opacity`, or `border`) and **MUST NOT** be required for essential component functionality or accessibility.

```css
/* ✅ Correct: Hover styles isolated to hover-capable devices */
@layer dy.react {
  .button {
    --button-color-surface: var(--dy-color-surface-action-primary-default);
    background-color: var(--button-color-surface);

    @media (hover: hover) {
      &:hover {
        --button-color-surface: var(--dy-color-surface-action-primary-hover);
      }
    }
  }
}

/* ❌ Incorrect: Root-level hover creates sticky touch states */
@layer dy.react {
  .button {
    background-color: var(--dy-color-surface-action-primary-default);

    &:hover {
      background-color: var(--dy-color-surface-action-primary-hover);
    }
  }
}
```

### CSS-10 · Logical Properties

- All dimensions, directional margins, paddings, borders, and positioning **MUST** use logical CSS properties (`inline-size`, `block-size`, `margin-inline`, `padding-block-start`, `inset-inline-start`, etc.).
- Physical layout properties (`width`, `height`, `margin-top`, `padding-left`, `top`, `left`, `right`, `bottom`) are **STRICTLY FORBIDDEN**.

```css
/* ✅ Correct: Direction-agnostic logical dimensions and spacing */
@layer dy.react {
  .card {
    inline-size: 100%;
    block-size: 12.5rem;
    margin-block-start: var(--dy-space-4);
    padding-inline-start: var(--dy-space-3);
    inset-block-start: 0;
  }
}

/* ❌ Incorrect: Physical properties tied to top-to-bottom / left-to-right axis */
@layer dy.react {
  .card {
    width: 100%;
    height: 200px;
    margin-top: 16px;
    padding-left: 12px;
    top: 0;
  }
}
```

### CSS-11 · Modern Relational & Grouping Pseudo-Classes

- Structural parent-child relationships **MUST** be handled using relational pseudo-classes like `:has()` rather than JS-injected structural layout classes.
- Complex state exclusions or non-matching conditions **MUST** combine `:not()` and `:is()` into concise list declarations rather than chaining multiple separate `:not()` selectors or repeating rule blocks.

```css
/* ✅ Correct: Relational layout and clean state exclusion */
@layer dy.react {
  /* Parent adjusts grid template automatically when child label exists */
  .field-wrapper:has(.checkbox-label) {
    grid-template-columns: [input] auto [label] 1fr;
  }

  /* Single rule handling multiple excluded conditions simultaneously */
  .checkbox:not([disabled], [aria-invalid='true'], :checked) {
    --checkbox-color-border: var(--dy-color-border-default);
  }
}

/* ❌ Incorrect: JS-dependent wrapper classes & redundant selector duplication */
@layer dy.react {
  .field-wrapper.has-label {
    grid-template-columns: auto 1fr;
  }

  .checkbox:not([disabled]):not([aria-invalid='true']):not(:checked) {
    --checkbox-color-border: var(--dy-color-border-default);
  }
}
```

### CSS-12 · Native Nesting & Explicit Ampersand Binding

- Pseudo-classes, pseudo-elements, sub-elements, and state variants **MUST** be nested inside the main block using native CSS nesting syntax.
- Nested rules **MUST** explicitly use the ampersand (`&`) prefix when targeting modifiers (`&.size-l`), attributes (`&[disabled]`), pseudo-classes (`&:focus-visible`), or pseudo-elements (`&::before`).

```css
/* ✅ Correct: Native nesting using explicit ampersand binding */
@layer dy.react {
  .accordion-trigger {
    background-color: var(--accordion-color-bg);

    &.variant-elevated {
      box-shadow: var(--dy-elevation-low);
    }

    &[aria-expanded='true'] {
      border-radius: var(--dy-radius-sm) var(--dy-radius-sm) 0 0;
    }

    &:focus-visible::before {
      content: '';
      inset: 0;
      position: absolute;
    }
  }
}

/* ❌ Incorrect: Un-nested root declarations or missing ampersand prefixes */
@layer dy.react {
  .accordion-trigger {
    background-color: var(--accordion-color-bg);
  }

  .accordion-trigger.variant-elevated {
    box-shadow: var(--dy-elevation-low);
  }
}
```

### CSS-13 · Browser Support & Feature Queries

- All CSS features and properties used **MUST** have Baseline (Widely Available) browser support.
- If a newer property or rule with Baseline (Newly Available) or non-baseline support is used as a progressive enhancement, a standard Baseline-compliant fallback **MUST** be defined first or wrapped inside a `@supports` feature query.
- Progressive enhancements inside `@supports` **MUST NOT** break core visual layout or functional accessibility when the feature query evaluates to false.

```css
/* ✅ Correct: Fallback provided with progressive enhancement */
@layer dy.react {
  .container {
    /* Baseline fallback for layout flow */
    display: flex;
    flex-wrap: wrap;

    /* Progressive enhancement using modern reading-flow */
    @supports (reading-flow: grid-columns) {
      display: grid;
      reading-flow: grid-columns;
    }
  }
}

/* ❌ Incorrect: Unprotected feature lacking baseline support */
@layer dy.react {
  .container {
    /* ❌ Will fail silently without fallback in unsupported browsers */
    reading-flow: grid-columns;
  }
}
```

---

## Pre-Submission Checklist

- [ ] `kebab-case` class names, all styles inside `@layer dy.react` (CSS-01, CSS-02)
- [ ] Motion gated behind `prefers-reduced-motion`; hover gated behind `@media (hover: hover)` (CSS-03, CSS-09)
- [ ] Variant classes strictly prefixed `[prop]-[value]`, resolved by interpolation — no `if`/`switch`/ternary (CSS-04)
- [ ] Co-located, non-shared `[ComponentName].module.css` (CSS-05)
- [ ] State styled via native/ARIA/`data-*` attributes — no modifier classes (CSS-06)
- [ ] Component tokens `--[component]-[property]-[state]` reference system tokens; selectors only remap tokens (CSS-07)
- [ ] Interactive/floating elements keep a defined border; focus via `outline`/`border`, never `box-shadow` (CSS-08)
- [ ] Logical properties only; native nesting with explicit `&`; `:has()`/`:is()`/`:not()` for relations (CSS-10, CSS-11, CSS-12)
- [ ] Baseline support or `@supports` fallback (CSS-13)
