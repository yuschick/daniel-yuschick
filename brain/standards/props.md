---
description: 'DY Design System prop & terminology conventions governing component prop names, values, and defaults.'
applyTo: '**/*.ts, **/*.tsx'
paths:
  - '**/*.{ts,tsx}'
---

# DY Design System — Prop & Terminology Conventions

> **Core Philosophy:** If you know how to use one component, you know how to use them all.

This document governs how component **props, values, and defaults** are named and shaped across the DY Design System. It is the companion to the build rules in [css.md](css.md), [typescript.md](typescript.md) and [react.md](react.md): those govern _how components are built_, this file governs _what their public API looks like_.

Scope notes:

- This file **does not** define the design-token taxonomy (color, space, radius, elevation scales). Shared value sets here (e.g., `Gap`, `Offset`, `Elevation`) name the scale steps, but the underlying token values are defined separately.
- Rules use stable, permanent IDs (`PROP-*`). An ID is never reused for a different rule.
- When guidance appears to overlap, the more specific rule wins, and the [Shared Type Registry](#shared-type-registry) is the authoritative source for exact values and defaults.

---

## The Three Pillars

Every prop belongs to exactly one semantic pillar. This prevents "prop-bleeding," where a visual skin accidentally dictates functional logic.

- **Interaction & Logic (the "brain"):** functional rules, state transitions, accessibility — how a component _thinks_ and _responds_.
- **Layout & Composition (the "skeleton"):** physical relationships, distribution, and DOM order — _where_ things live.
- **Visual & Style (the "skin"):** strictly decorative — the aesthetic _flavor_, with no effect on function or layout.

---

## Core Principles

### PROP-01 · Pillar Isolation

- Every prop **MUST** belong to exactly one pillar: Interaction, Layout, or Visual.
- A Visual prop **MUST NOT** change Interaction logic or Layout, and vice versa. Pillars **MUST** remain independently composable so any combination of props is valid and non-conflicting.

### PROP-02 · Universal Defaults

- A prop shared across multiple components **MUST** use an identical name, type, and **default value** everywhere it appears.
- If `size` defaults to `m` on `Button`, it **MUST** default to `m` on `Input`, `Select`, `Avatar`, and every other component that exposes `size`.
- Shared defaults are defined once in the [Shared Type Registry](#shared-type-registry) and **MUST NOT** be redefined per component. (Reinforces `TS-02` in [typescript.md](typescript.md).)

### PROP-03 · Props Describe the Component, Not Its Context

- Props **MUST** describe the component's own identity, state, or appearance.
- Context-leaking props that describe _where_ the component lives or _what_ surrounds it are **STRICTLY FORBIDDEN**.

| Status           | Example                                            |
| :--------------- | :------------------------------------------------- |
| ✅ **Correct**   | `inverse` — describes the component                |
| ❌ **Incorrect** | `onDarkBg` — describes the component's environment |

### PROP-04 · Composition Over Boolean Flags

- Content slots and structural regions **MUST** be expressed through compound sub-components, not boolean flags plus content props.
- `has*` and `show*` props are deliberately rare: components emphasize consumer composition over prop customization so their APIs stay "selfish" and small. (Reinforces `RX-08` in [react.md](react.md).)

```jsx
/* ❌ Incorrect: boolean flags + content props bloat the API */
<Card hasHeader headerText="Title" hasFooter footerAction={handleSave}>
  Main Content
</Card>

/* ✅ Correct: declarative compound composition */
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Main Content</Card.Content>
  <Card.Footer>
    <Button onClick={handleSave}>Save</Button>
  </Card.Footer>
</Card>
```

---

## Naming Patterns

### PROP-05 · Boolean Prop Prefixes

- Every boolean prop **MUST** carry one of the prefixes below and be phrased in the present tense. Bare booleans (`open`, `disabled`, `invalid`) are **STRICTLY FORBIDDEN** — use `isOpen`, `isDisabled`, `isInvalid`.
- Any boolean state that supports controlled/uncontrolled modes **MUST** expose a `default`-prefixed counterpart (`isOpen` / `defaultIsOpen`), per `RX-07` in [react.md](react.md).

| Prefix  | Semantic target | Part of speech | Meaning                                          | Examples                            |
| :------ | :-------------- | :------------- | :----------------------------------------------- | :---------------------------------- |
| `is*`   | State           | Adjective      | A momentary condition or state of the component. | `isDisabled`, `isInvalid`, `isOpen` |
| `has*`  | Capability      | Noun           | An internal, non-composable feature.             | `hasTooltip`                        |
| `show*` | Visibility      | Noun           | Conditional rendering of an internal element.    | `showError`, `showPassword`         |

### PROP-06 · Event Callback Naming

- Event callbacks **MUST** use the `on[PresentTenseVerb]` pattern (`onChange`, `onPageUpdate`, `onVisibilityChange`).
- Native DOM event props (`onClick`, `onChange`, etc.) **MUST NOT** be overwritten or wrapped in a custom signature; they **MUST** forward the native event unchanged.
- Custom (non-DOM) events **MUST** receive a structured payload specific to that interaction, not a raw DOM event.
- This governs the _public prop_ name; the _internal handler_ is named `handle[Event]` per `RX-13` in [react.md](react.md).

### PROP-07 · Structured Pattern Props

- Prop names built from a base noun **MUST** follow these canonical suffixes/patterns so a name's suffix always implies its type and role:

| Pattern           | Role                                                        | Type                             | Example          |
| :---------------- | :---------------------------------------------------------- | :------------------------------- | :--------------- |
| `[base]Index`     | A numeric position within a set.                            | `number`                         | `activeIndex`    |
| `[base]Ms`        | A duration or timeout in milliseconds.                      | `number`                         | `delayMs`        |
| `[base]Ref`       | A React ref to an element for DOM access.                   | `RefObject<HTMLElement \| null>` | `closeButtonRef` |
| `[base]Start`     | An element placed at the **start** of the orientation axis. | `ReactNode`                      | `iconStart`      |
| `[base]End`       | An element placed at the **end** of the orientation axis.   | `ReactNode`                      | `iconEnd`        |
| `[base]Content`   | Arbitrary `ReactNode` children.                             | `ReactNode`                      | `panelContent`   |
| `[base]Message`   | Text that may include formatting.                           | `string \| ReactNode`            | `errorMessage`   |
| `[base]Text`      | A plain string only.                                        | `string`                         | `labelText`      |
| `[base]AriaLabel` | A plain-text, non-visual `aria-label`.                      | `string`                         | `closeAriaLabel` |

- `[base]Text` **MUST** accept a plain `string` only; use `[base]Message` when formatting/`ReactNode` is required. These two **MUST NOT** be conflated.

### PROP-08 · Grouped Union Props Over Related Booleans

- Related boolean props that describe one characteristic (`isSmall`, `isLarge`, `isCompact`) **MUST** be combined into a single union-typed prop (`size`, `density`). Adding a variant means adding one value to a union, not a new prop.
- The union **MUST** be the shared type from the [Shared Type Registry](#shared-type-registry) when one exists (e.g., `Size`), never inline string literals.
- Characteristic names and values **MUST** align with the design-side naming as closely as possible.

```ts
/* ✅ Correct: one characteristic, one registry-typed prop */
interface ButtonProps {
  size?: Size; // Defaults to 'm'
}

/* ❌ Incorrect: ambiguous, compounding booleans */
interface ButtonProps {
  isSmall?: boolean;
  isLarge?: boolean; // ❌ isSmall and isLarge can both be true
}
```

---

## Shared Prop Registry

These are the system-wide props. Where a value column lists a named type (e.g., `Size`), the members and default are fixed by the [Shared Type Registry](#shared-type-registry). Blank cells are intentionally component-defined.

### Interaction & Logic

| Prop / Pattern         | Description                                       | Type       | Default |
| :--------------------- | :------------------------------------------------ | :--------- | :------ |
| `[base]Index`          | A numeric value associated with an item in a set. | `number`   | `0`     |
| `[base]Ms`             | A duration or timeout in milliseconds.            | `number`   |         |
| `on[PresentTenseVerb]` | An event callback (see `PROP-06`).                | `Function` |         |

### Layout & Composition

| Prop / Pattern | Description                                                              | Type                             | Values (see registry)                   | Default         |
| :------------- | :----------------------------------------------------------------------- | :------------------------------- | :-------------------------------------- | :-------------- |
| `[base]Start`  | Element placed at the start of the parent's orientation axis.            | `ReactNode`                      |                                         |                 |
| `[base]End`    | Element placed at the end of the parent's orientation axis.              | `ReactNode`                      |                                         |                 |
| `[base]Ref`    | A React ref for DOM manipulation.                                        | `RefObject<HTMLElement \| null>` |                                         |                 |
| `direction`    | The layout axis used to arrange grouped elements.                        | `Orientation`                    | `column`, `row`                         |                 |
| `flow`         | Rendering order of internal elements along the orientation axis.         | `Flow`                           | `default`, `reverse`                    | `default`       |
| `gap`          | Token-based space between internal child elements.                       | `Gap`                            | `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl` | `m`             |
| `offset`       | External token-based space between the component and its anchor/trigger. | `Offset`                         | `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl` | `m`             |
| `placement`    | External alignment of the component relative to an anchor/trigger.       | `Placement`                      | see `Placement`                         |                 |
| `position`     | How an internal child element is positioned within the component.        | `Position`                       | see `Position`                          |                 |
| `renderInRef`  | The portal target element for rendering.                                 | `RefObject<HTMLElement \| null>` |                                         | `document.body` |

### Visual & Style

| Prop / Pattern    | Description                                     | Type                  | Values (see registry)                                                                        | Default   |
| :---------------- | :---------------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------- | :-------- |
| `[base]Content`   | Arbitrary `ReactNode` children.                 | `ReactNode`           |                                                                                              |           |
| `[base]Message`   | Text that may include formatting.               | `string \| ReactNode` |                                                                                              |           |
| `[base]Text`      | A plain string value only.                      | `string`              |                                                                                              |           |
| `[base]AriaLabel` | A plain-text, non-visual `aria-label`.          | `string`              |                                                                                              |           |
| `density`         | The visual "air" / white space.                 | `Density`             | `compact`, `default`, `relaxed`                                                              | `default` |
| `elevation`       | The visual depth of the component.              | `Elevation`           | `none`, `s`, `m`, `l`                                                                        | `none`    |
| `fit`             | The fill strategy of the component.             | `Fit`                 | `fill`, `hug`                                                                                | `hug`     |
| `intent`          | The visual meaning or purpose of the element.   | `Intent`              | `attention`, `negative`, `neutral`, `notice`, `positive`, `primary`, `secondary`, `tertiary` | `primary` |
| `shape`           | The geometric silhouette (border radius).       | `Shape`               | `circle`, `pill`, `rounded`, `sharp`                                                         | `sharp`   |
| `size`            | The relative scale of a component's dimensions. | `Size`                | `xs`, `s`, `m`, `l`, `xl`                                                                    | `m`       |
| `variant`         | The visual style / skin of a component.         | `Variant`             | `filled`, `ghost`, `inline`, `outlined`                                                      | `filled`  |
| `visibility`      | Whether the element is shown or hidden.         | `Visibility`          | `hidden`, `visible`                                                                          |           |

---

## Shared Type Registry

The single source of truth for these shared types is [`packages/react/src/types/common.ts`](../../packages/react/src/types/common.ts). It is not mirrored here: the table above lists each prop's values and default, and the `@default` tag in each type's doc comment is the machine-readable default. Public exports go through `packages/react/src/types/index.ts`.

Each value set is declared once as a `readonly` const array plus a derived string-literal union (never an `enum`; see `TS-07` in [typescript.md](typescript.md)), then imported wherever the prop is used.

```ts
// packages/react/src/types/common.ts
type TShirtSize = '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl';

/**
 * @default 'm'
 */
export const SIZES = [
  'xs',
  's',
  'm',
  'l',
  'xl',
] as const satisfies readonly TShirtSize[];
export type Size = (typeof SIZES)[number];
```

- **MUST** use `as const satisfies readonly …[]`, never a type annotation such as `SIZES: TShirtSize[]`. An annotation widens the derived union to the whole base type, so a set like `Elevation` would accept values its array doesn't contain.
- **MUST** give every type with a default an `@default` tag, and add a new shared value to `common.ts` and `types/index.ts`, not inline in a component.
- Components use sizes `xs` through `xl`. `Elevation` and `Density` are defined for completeness but no tokens back them yet.
- `intent` covers both status meanings (`attention`, `negative`, `neutral`, `notice`, `positive`) and emphasis (`primary`, `secondary`, `tertiary`).

---

## Semantic Element Terms

When a prop or sub-component name uses one of these terms, it **MUST** render the corresponding native HTML element so structure stays semantic and accessible.

| Term         | Renders as    |
| :----------- | :------------ |
| `Footer`     | `<footer>`    |
| `Header`     | `<header>`    |
| `Heading`    | `<h1>`–`<h6>` |
| `Label`      | `<label>`     |
| `Navigation` | `<nav>`       |

---

## Pre-Submission Checklist

Every new or changed prop **MUST** satisfy the applicable rules:

- [ ] Prop belongs to exactly one pillar (PROP-01)
- [ ] Shared props reuse the registry name, type, and default (PROP-02, PROP-05)
- [ ] Prop describes the component, not its context (PROP-03)
- [ ] Content/regions use compound sub-components, not boolean flags (PROP-04)
- [ ] Booleans use `is`/`has`/`show` (+ `default*` for controlled state) (PROP-05)
- [ ] Callbacks use `on[PresentTenseVerb]`; native events forward unchanged (PROP-06)
- [ ] Pattern-suffixed names match their canonical type (PROP-07)
- [ ] New shared values are added to the Shared Type Registry, not inlined (Shared Type Registry)
- [ ] Semantic terms render their native element (Semantic Element Terms)
- [ ] Related booleans are one registry-typed union prop aligned with design naming (PROP-08)
