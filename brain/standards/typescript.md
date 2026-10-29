---
description: "DY Design System TypeScript conventions governing types, interfaces and functions."
applyTo: "**/*.ts, **/*.tsx"
paths:
  - "**/*.{ts,tsx}"
---

# DY Design System — TypeScript Conventions

> **Core Philosophy:** Clear and stable code over complex abstractions.

Rule IDs are permanent: rules may be reordered or retired, but an ID is never reused. When guidance overlaps, the more specific rule wins and the paired ✅/❌ examples are authoritative. `A11Y-*` rules take precedence over any conflicting rule. See the [standards index](README.md) for every domain.

## TypeScript Rules

### TS-01 · Prop Interface Naming & Native Attribute Extension

- Component prop interfaces **MUST** be named using the exact pattern `[ComponentName]Props`. Generic names like `Props`, `ComponentProps`, or `Interface` are **STRICTLY FORBIDDEN**.
- The prop interface and all supporting types **MUST** live in a sibling `[ComponentName].types.ts` file next to `[ComponentName].tsx` — they **MUST NOT** be declared inline in the component file.
- Supporting sub-types or union members **MUST** be declared before the primary `[ComponentName]Props` interface.
- Interfaces **MUST** extend the native React attribute type of the rendered element (`React.HTMLAttributes<T>`, `React.ButtonHTMLAttributes<T>`, `React.InputHTMLAttributes<T>`, etc.) rather than manually re-declaring standard HTML props.
- Under React 19 (this project's target), the interface **MUST** also declare `ref?: React.Ref<T>` so the forwarded ref can be destructured as `ref: externalRef` (see RX-01, RX-02).
- Native props that collide with a design-system term **MUST** be removed with `Omit<T, K>` and re-exposed under an `html[Property]` name (e.g., `htmlSize`).
- Every component **MUST** destructure and spread its remaining native attributes as `...htmlAttributes` — never `...rest` or `...props`.
- The sole exception is a component that composes another design-system component: it **MUST** name the spread `...[composedComponentName]AndHTMLAttributes` (e.g., an `IconButton` that renders a `Button` spreads `...buttonAndHTMLAttributes`).

```ts
/* ✅ Correct: named [ComponentName]Props, extends native attributes, resolves collisions */
// Input.types.ts
export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  ref?: React.Ref<HTMLInputElement>; // React 19: forwarded ref arrives as a prop
  size?: "sm" | "md" | "lg"; // design-system visual scale
  htmlSize?: React.InputHTMLAttributes<HTMLInputElement>["size"]; // native HTML attribute, re-mapped
}

/* ✅ Correct: HOC wrapper extends the base component props */
export interface PasswordFieldProps extends TextFieldProps {
  onToggleVisibility?: (isVisible: boolean) => void;
}

/* ❌ Incorrect: generic name and manual re-declaration of native attributes */
export interface Props {
  className?: string; // ❌ already provided by React.HTMLAttributes
  onClick?: () => void; // ❌ already provided by native attributes
  size?: "sm" | "md" | "lg";
}
```

### TS-02 · System-Wide Prop Consistency & Defaults

- Props shared across multiple components **MUST** use identical naming, identical type signatures, and identical default values.
- Boolean props indicating state **MUST** use the `is[State]` or `has[Feature]` prefix pattern consistently across all components (e.g., `isDisabled`, `isReadOnly`, `isRequired`).

```ts
/* ✅ Correct: Shared prop names and default assumptions */
export interface ButtonProps {
  isDisabled?: boolean;
  size?: "sm" | "md" | "lg"; // Defaults to 'md'
}

export interface SwitchProps {
  isDisabled?: boolean;
  size?: "sm" | "md" | "lg"; // Defaults to 'md'
}

/* ❌ Incorrect: Inconsistent naming and mismatched defaults across components */
export interface ButtonProps {
  disabled?: boolean; // ❌ Deviates from isDisabled pattern
  size?: "sm" | "md" | "lg"; // Defaults to 'md'
}

export interface SwitchProps {
  isDisabled?: boolean;
  size?: "sm" | "md" | "lg"; // ❌ Defaults to 'sm'
}
```

### TS-03 · Single-Object Parameters for Functions & Hooks

- Utility functions, helpers, and custom hooks accepting two or more parameters **MUST** encapsulate them into a single typed options object.
- Functions **MUST NOT** use multiple positional arguments.

```ts
/* ✅ Correct: Single options object parameter */
export interface CalculateOffsetOptions {
  triggerRect: DOMRect;
  targetRect: DOMRect;
  placement: "top" | "bottom";
  offsetDistance?: number;
}

export function calculateOffset({
  triggerRect,
  targetRect,
  placement,
  offsetDistance = 8,
}: CalculateOffsetOptions) {
  // Logic...
}

/* ❌ Incorrect: Positional parameters */
export function calculateOffset(
  triggerRect: DOMRect,
  targetRect: DOMRect,
  placement: string,
  offsetDistance?: number,
) {
  // Logic...
}
```

### TS-04 · Optional Prop Syntax

- Optional props **MUST** be defined using the optional `?` operator syntax.
- **MUST NOT** use `null` or explicit `| undefined` in prop interfaces unless the component must explicitly distinguish between `null` and `undefined`.

```ts
/* ✅ Correct */
export interface CardProps {
  title?: string;
  badgeCount?: number;
}

/* ❌ Incorrect */
export interface CardProps {
  title: string | null;
  badgeCount?: number | undefined;
}
```

### TS-05 · Standardized Hook Return Interfaces

- Every custom React hook **MUST** define and export its return type using the interface naming pattern `Use[HookName]Return`.
- The hook **MUST** declare `Use[HookName]Return` explicitly as its return-type signature on the function declaration — inferred return types are **STRICTLY FORBIDDEN**.
- Generic or ambiguous return-type names (`Result`, `AccordionState`, `HookReturn`, `Output`) are **STRICTLY FORBIDDEN**.
- The return interface **MUST** be exported from the module's public entry point (`index.ts` or `[HookName].types.ts`) alongside the hook.

```ts
/* ✅ Correct: explicit, exported Use[HookName]Return signature */
export interface UseAccordionReturn {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export function useAccordion(
  options: UseAccordionOptions = {},
): UseAccordionReturn {
  // Logic...
  return { isOpen, toggle, close };
}

/* ❌ Incorrect: ambiguous interface name and inferred return type */
export interface AccordionState {
  isOpen: boolean;
}

export function useAccordion(options: UseAccordionOptions) {
  // ...
}
```

### TS-06 · Prohibition of `any`

- The `any` type is **STRICTLY FORBIDDEN** in all component, hook, and utility code.
- Genuinely unknown values (third-party payloads, caught errors, dynamic input) **MUST** be typed as `unknown` and narrowed before use.
- Generic constraints, `unknown`, or explicit union types **MUST** be used in place of `any` to preserve type safety.
- Suppression directives **MUST NOT** be used to reintroduce `any`-like behavior (see GEN-01).

```ts
/* ✅ Correct: unknown narrowed at the boundary */
export function parseConfig(raw: unknown): ButtonConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid config");
  }
  // Narrow further before use...
  return raw as ButtonConfig;
}

/* ❌ Incorrect: any disables all type checking */
export function parseConfig(raw: any): ButtonConfig {
  return raw;
}
```

### TS-07 · String-Literal Unions over Enums

- Fixed sets of variant, size, state, or option values **MUST** be modeled as string-literal unions (e.g., `'sm' | 'md' | 'lg'`).
- TypeScript `enum` and `const enum` declarations are **STRICTLY FORBIDDEN**; they emit runtime code, resist tree-shaking, and widen poorly across module boundaries.
- Shared unions **MUST** be declared once as an exported named type and reused rather than re-inlined per component.

```ts
/* ✅ Correct: exported string-literal union reused across components */
export type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  size?: Size;
}

/* ❌ Incorrect: enum emits runtime code and blocks tree-shaking */
export enum Size {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}
```

### TS-08 · Invalid Prop Combinations as Compile-Time Errors

- Mutually exclusive or interdependent props **MUST** be modeled with discriminated unions, using `never` to forbid conflicting members, so invalid combinations fail type-checking in the consumer's editor.
- Components **MUST NOT** rely on runtime `console.warn` calls, defensive guard clauses, or silent precedence to handle invalid prop combinations.
- Controlled vs. uncontrolled state is the most common case and is governed specifically by RX-07.

```ts
/* ✅ Correct: image and initials modes are mutually exclusive at compile time */
interface AvatarBaseProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: Size;
}

interface AvatarImageProps extends AvatarBaseProps {
  src: string;
  alt: string;
  initials?: never;
}

interface AvatarInitialsProps extends AvatarBaseProps {
  src?: never;
  alt?: never;
  initials: string;
}

export type AvatarProps = AvatarImageProps | AvatarInitialsProps;

/* ❌ Incorrect: both modes allowed; the conflict is resolved silently at runtime */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  initials?: string; // ❌ Ignored when src is set — consumers only find out in the browser
}
```

---

## Pre-Submission Checklist

- [ ] Interface named `[ComponentName]Props`, lives in `[ComponentName].types.ts`, extends the correct native attribute type, collisions resolved with `Omit` + `html[Prop]` (TS-01)
- [ ] Shared props use identical names/types/defaults; boolean state uses `is`/`has` prefix (TS-02)
- [ ] Functions/hooks take a single typed options object (TS-03)
- [ ] Optional props use `?`, not `| undefined`/`null` (TS-04)
- [ ] Hook return type exported as `Use[HookName]Return` and declared explicitly (TS-05)
- [ ] No `any` — use `unknown` + narrowing (TS-06)
- [ ] String-literal unions, never `enum` (TS-07)
- [ ] Invalid prop combinations are compile-time errors via discriminated unions + `never` (TS-08)
