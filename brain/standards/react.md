---
description: "DY Design System React conventions governing component definition, state and composition."
applyTo: "**/*.tsx"
paths:
  - "**/*.tsx"
---

# DY Design System — React Conventions

> **Core Philosophy:** Clear and stable code over complex abstractions.

Rule IDs are permanent: rules may be reordered or retired, but an ID is never reused. When guidance overlaps, the more specific rule wins and the paired ✅/❌ examples are authoritative. `A11Y-*` rules take precedence over any conflicting rule. See the [standards index](README.md) for every domain.

## React Rules

### RX-01 · Component Definition, Naming & Ref Forwarding

- Components **MUST** be defined with an `export const [ComponentName] = ...` binding whose render function is a **named** function matching the component name, so the display name is always derived from the function. Manual `Component.displayName = '...'` assignments are **STRICTLY FORBIDDEN**.
- **MUST NOT** pass anonymous arrow functions or anonymous function expressions as the render function.
- The forwarded ref **MUST** be named `externalRef` (see RX-02). The forwarding mechanism depends on the React version the package targets:
  - **React 19 (this project's default):** `ref` is a regular prop. Components **MUST** declare `ref?: React.Ref<T>` on their props interface and destructure it as `ref: externalRef`. `React.forwardRef` **MUST NOT** be used.
  - **React 18 (legacy):** Components **MUST** wrap the render function in `React.forwardRef<T, [ComponentName]Props>(function [ComponentName](props, externalRef) { ... })`.
- Examples in the remaining rules use the React 18 `forwardRef` form for brevity; the React 19 equivalent drops `forwardRef` and destructures `ref: externalRef` from props.

```tsx
/* ✅ Correct — React 19: ref is a prop, destructured and renamed to externalRef */
export const VisuallyHidden = function VisuallyHidden({
  ref: externalRef,
  children,
  ...htmlAttributes
}: VisuallyHiddenProps) {
  return (
    <div ref={externalRef} {...htmlAttributes}>
      {children}
    </div>
  );
};

/* ✅ Correct — React 18: named function expression inside React.forwardRef */
export const VisuallyHidden = React.forwardRef<
  HTMLDivElement,
  VisuallyHiddenProps
>(function VisuallyHidden({ children, ...htmlAttributes }, externalRef) {
  return (
    <div ref={externalRef} {...htmlAttributes}>
      {children}
    </div>
  );
});

/* ❌ Incorrect: anonymous render function patched with a manual displayName */
export const VisuallyHidden = ({
  children,
  ...htmlAttributes
}: VisuallyHiddenProps) => {
  return <div {...htmlAttributes}>{children}</div>;
};
VisuallyHidden.displayName = "VisuallyHidden"; // ❌ Forbidden manual assignment
```

### RX-02 · Forwarded Ref Parameter Naming & Disambiguation

- The forwarded ref **MUST** be named `externalRef`, whether it arrives as the `ref` prop destructured as `ref: externalRef` (React 19) or as the second `React.forwardRef` argument (React 18).
- Leaving the `ref` prop un-renamed, or using generic names like `forwardedRef` or `myRef`, is **STRICTLY FORBIDDEN**.
- Internal refs created via `useRef()` **MUST** use an `internalRef` identifier (e.g., `internalRef`, `internalContainerRef`).
- When a component needs both its own DOM ref and the forwarded ref, it **MUST** merge `externalRef` and `internalRef` with `useMergedRefs`.

```tsx
/* ✅ Correct — React 19: ref destructured as externalRef, merged with internalRef */
export const VisuallyHidden = function VisuallyHidden({
  ref: externalRef,
  children,
  ...htmlAttributes
}: VisuallyHiddenProps) {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const visuallyHiddenRef = useMergedRefs(externalRef, internalRef);

  return (
    <div ref={visuallyHiddenRef} {...htmlAttributes}>
      {children}
    </div>
  );
};

/* ❌ Incorrect: un-renamed ref prop and an ambiguous internal ref name */
export const VisuallyHidden = function VisuallyHidden({
  ref,
  children,
  ...htmlAttributes
}: VisuallyHiddenProps) {
  const myRef = React.useRef<HTMLDivElement>(null); // ❌ 'myRef' + un-renamed 'ref'
  return (
    <div ref={ref} {...htmlAttributes}>
      {children}
    </div>
  );
};
```

### RX-03 · Default Values for Optional Props

- All optional props defined in a component interface (e.g., `type?: 'ok' | 'neutral' | 'warning'`) **MUST** be assigned an explicit default value.
- Default prop values **MUST** be set directly within the function signature parameter list during object destructuring.
- Components **MUST NOT** use legacy `defaultProps` property assignments or inline fallback evaluations (e.g., `props.type || 'neutral'`) inside the function body.
- If an optional prop intentionally permits `undefined` to indicate an un-set or idle state (e.g., an unselected optional `value` or `onChange` callback), it **MUST** be explicitly documented with a comment or typed accordingly.

```tsx
/* ✅ Correct: Explicit default values assigned during signature destructuring */
export const StatusIndicator = React.forwardRef<
  HTMLDivElement,
  StatusIndicatorProps
>(function StatusIndicator(
  {
    type = "neutral",
    variant = "filled",
    size = "md",
    className,
    ...htmlAttributes
  },
  externalRef,
) {
  const internalProps = {
    ref: externalRef,
    className: clsx(
      styles["status-indicator"],
      styles[`type-${type}`],
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      className,
    ),
  };

  const mergedProps = mergeProps(internalProps, htmlAttributes);

  return <div {...mergedProps} />;
});

/* ❌ Incorrect: Missing parameter defaults, relying on inline fallbacks inside JSX */
export const StatusIndicator = React.forwardRef<
  HTMLDivElement,
  StatusIndicatorProps
>(function StatusIndicator(
  { type, variant, size, className, ...htmlAttributes },
  externalRef,
) {
  const internalProps = {
    ref: externalRef,
    className: clsx(
      styles["status-indicator"],
      styles[`type-${type || "neutral"}`], // ❌ Imperative inline fallback
      styles[`variant-${variant ?? "filled"}`], // ❌ Imperative inline fallback
      className,
    ),
  };
  return <div {...mergeProps(internalProps, htmlAttributes)} />;
});

/* ❌ Incorrect: Using deprecated defaultProps static property */
StatusIndicator.defaultProps = {
  type: "neutral", // ❌ Deprecated in modern React
};
```

### RX-04 · Explicit Named Exports & Default Export Prohibition

- All components, types, interfaces, and utility functions **MUST** use explicit named exports.
- **MUST NOT** use default exports (`export default`) under any circumstances.
- Module barrel files (`index.ts`) **MUST NOT** use wildcards (`export * from ...`). Every exported entity and type **MUST** be explicitly named (`export { VisuallyHidden } from ...` and `export type { VisuallyHiddenProps } from ...`) to guarantee deterministic tree-shaking across all bundler setups.
- Inline named exports (`export type StatusIndicatorType = ...`) are permitted and encouraged for standalone types, interfaces, and helper functions.

```ts
/* ✅ Correct: Explicit named exports in component and index files */
// Button.tsx
export function Button({ ...htmlAttributes }: ButtonProps) {
  return <button {...htmlAttributes} />;
}

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

/* ❌ Incorrect: Default exports and wildcard barrel re-exports */
// Button.tsx
export default function Button() { ... } // ❌ Default export

// index.ts
export * from './Button'; // ❌ Wildcard barrel export prevents optimal tree-shaking
```

### RX-05 · Component Entry Point & Root Index Module

- Every component directory **MUST** contain a root `index.ts` entry point file.
- The `index.ts` file **MUST** serve as the public API surface for that component module, re-exporting only the public component, its primary prop interface, and required public sub-types or sub-components.
- Internal implementation details, non-exported helper functions, or private hooks **MUST NOT** be exposed through `index.ts`.

```ts
/* ✅ Correct: Clean index.ts public interface contract */
// Button/index.ts
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

/* ❌ Incorrect: Missing index.ts forcing deep file path imports */
import { Button } from "@dy/react/Button/Button"; // ❌ Private path exposure
```

### RX-06 · Single Component File Isolation

- Every `.tsx` file **MUST** contain exactly one React component definition.
- Defining secondary, helper, or internal sub-components inside the same file as the primary component is **STRICTLY FORBIDDEN**.
- Sub-components that belong to a compound component pattern (e.g., `DialogHeader`, `DialogFooter`, `DialogClose`) **MUST** reside in their own dedicated `.tsx` file within the component folder.

```bash
/* ✅ Correct: Isolated single-component file architecture */
📁 Dialog/
├── Dialog.tsx
├── DialogClose.tsx
├── DialogContent.tsx
├── DialogFooter.tsx
├── DialogHeader.tsx
├── Dialog.module.css
├── Dialog.types.ts
└── index.ts
```

```ts
/* ❌ Incorrect: Multiple component declarations inside a single file */
// Dialog.tsx
export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className={styles.header}>{children}</div>;
}

export function Dialog({ children }: DialogProps) { // ❌ Secondary component co-located in same file
  return <div className={styles.dialog}>{children}</div>;
}
```

### RX-07 · Controlled & Uncontrolled State Unification

- All interactive UI and form control components (e.g., `Input`, `Checkbox`, `RadioGroup`, `Select`, `Switch`, `Slider`, `Accordion`) **MUST** support both controlled (`value`, `checked`, `isOpen`) and uncontrolled (`defaultValue`, `defaultChecked`, `defaultIsOpen`) usage patterns.
- Components **MUST NOT** implement custom inline state-switching logic; all dual-mode state synchronization **MUST** be delegated to the standardized `useControllableState` custom hook.
- Component prop interfaces **MUST** use discriminated unions (with `never`) so that mutually exclusive controlled/uncontrolled props (`value` and `defaultValue`) trigger a TypeScript error at compile-time.
- Components **MUST NOT** rely on runtime `console.warn` calls or defensive guard clauses to detect invalid controlled/uncontrolled combinations; the type system is the sole enforcement mechanism.
- Prop change handlers (`onChange`, `onCheckedChange`, `onIsOpenChange`) **MUST** fire consistently across both controlled and uncontrolled modes whenever state transitions occur.

```tsx
/* ✅ Correct: Discriminated union + delegation to useControllableState */
export interface ControlledCheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  checked: boolean;
  defaultChecked?: never;
  onCheckedChange?: (checked: boolean) => void;
}

export interface UncontrolledCheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  checked?: never;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export type CheckboxProps = ControlledCheckboxProps | UncontrolledCheckboxProps;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      className,
      ...htmlAttributes
    },
    externalRef,
  ) {
    const [isChecked, setIsChecked] = useControllableState({
      value: controlledChecked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(event.target.checked);
    };

    const internalProps = {
      ref: externalRef,
      type: "checkbox" as const,
      checked: isChecked,
      onChange: handleChange,
      className: clsx(styles.checkbox, className),
    };

    const mergedProps = mergeProps(internalProps, htmlAttributes);

    return <input {...mergedProps} />;
  },
);

/* ❌ Incorrect: Single-mode support and invalid props allowed at runtime */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean; // ❌ No discriminated union; both can be passed together
}

export function Checkbox({
  checked,
  onChange,
  ...htmlAttributes
}: CheckboxProps) {
  // ❌ Purely controlled component; fails in uncontrolled contexts
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      {...htmlAttributes}
    />
  );
}
```

### RX-08 · Slot-Based Component Composition Over Boolean Flags

- Complex layout and content slots **MUST** be implemented using compound component sub-elements (e.g., `Accordion.Summary`, `Accordion.Panel`) rather than boolean toggle flags (e.g., `hasHeader`, `hasFooter`, `hasClose`).
- Parent layout components **MUST** utilize CSS `grid-template-areas` or flexible container CSS modules to adapt gracefully to any combination of child sub-components.
- Composition parent components **MUST** perform runtime validation on `children` using `React.Children.forEach` and log a strict error or throw in development if an unsupported child component is detected.
- **MUST NOT** force consumers to pass JSX fragments via props (e.g., `header={<Header />}`); slots **MUST** be composed declaratively as direct sub-component children.

```tsx
/* ✅ Correct: Declarative sub-component composition with child validation */
export function Accordion({ children, ...htmlAttributes }: AccordionProps) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === AccordionSummary || child.type === AccordionPanel)
      return;

    console.error(
      `[DY DS] <Accordion> must only contain <Accordion.Summary> or <Accordion.Panel> children. Found invalid element: ${
        typeof child.type === "string" ? child.type : child.type.name
      }`,
    );
  });

  return (
    <div className={styles.accordion} {...htmlAttributes}>
      {children}
    </div>
  );
}

// Declarative Consumer Usage:
<Accordion>
  <Accordion.Summary>Title</Accordion.Summary>
  <Accordion.Panel>Content</Accordion.Panel>
</Accordion>;

/* ❌ Incorrect: Boolean property flags controlling conditional internal slots */
export function Accordion({
  hasSummary,
  summaryText,
  hasPanel,
  panelContent,
}: LegacyAccordionProps) {
  // ❌ Boolean flag branch pollution
  return (
    <div>
      {hasSummary && <div>{summaryText}</div>}
      {hasPanel && <div>{panelContent}</div>}
    </div>
  );
}
```

### RX-09 · Stateful vs. Stateless Component Architecture

- **Stateful Components:**
  - **MUST** support three unified state modalities: uncontrolled (`defaultIsOpen`), controlled (`isOpen, onIsOpenChange`), and external store (`store={accordionStore}`).
  - **MUST** expose an exported public hook (e.g., `useAccordion`) returning a state store object (`UseAccordionReturn`) to enable 100% programmatic control from external triggers.
  - The component interface **MUST** accept an optional `store?: UseAccordionReturn` prop. When provided, the store **MUST** take precedence over local state.
- **Stateless Components:**
  - **MUST** extract all DOM computation, ARIA calculation, and class name resolution into an internal custom hook (e.g., `useButton`).
  - Internal rendering hooks for stateless components **MUST NOT** be exported from the public entry point (`index.ts`); they exist strictly to decouple business/DOM logic from visual JSX rendering.

```ts
/* ✅ Correct: Stateful Component with Hook Store Escape Hatch */
export function Accordion({ store, isOpen, defaultIsOpen, onIsOpenChange, children, ...htmlAttributes }: AccordionProps) {
  const localStore = useAccordion({ isOpen, defaultIsOpen, onIsOpenChange });
  const activeStore = store ?? localStore; // ✅ External store takes precedence when provided

  return (
    <AccordionContext.Provider value={activeStore}>
      <div className={styles.accordion} {...htmlAttributes}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// Consumer Escape Hatch Usage:
const accordion = useAccordion();
<button type="button" onClick={accordion.toggle}>External Control</button>
<Accordion store={accordion}>
  <Accordion.Summary>External Store Slot</Accordion.Summary>
  <Accordion.Panel>Controlled externally without direct prop drilling</Accordion.Panel>
</Accordion>

/* ✅ Correct: Stateless Component Decoupled via Internal Hook */
function useButton(props: ButtonProps) {
  const resolvedClassName = clsx(styles.button, styles[`variant-${props.variant ?? 'filled'}`]);
  return {
    buttonProps: {
      className: resolvedClassName,
      'aria-disabled': props.isDisabled ? 'true' : undefined,
    },
  };
}

export function Button(props: ButtonProps) {
  const { buttonProps } = useButton(props); // ✅ Pure JSX template shell
  return <button {...buttonProps} />;
}
```

### RX-10 · Deterministic Prop Merging via `mergeProps`

- Component implementation functions **MUST NOT** spread destructured `htmlAttributes` or raw prop objects directly onto underlying JSX elements.
- All internally computed attributes, default values, computed ARIA states, and class names **MUST** be defined as a standalone local constant named `internalProps`.
- Components **MUST** pass `internalProps` and `htmlAttributes` (or `[composedComponentName]AndHTMLAttributes`) into the `mergeProps()` utility function, assigning the output to a constant named `mergedProps`.
- The `mergedProps` object **MUST** be the single spread applied to the root rendered element (`{...mergedProps}`).
- The `mergeProps()` utility function **MUST** safely concatenate CSS class names, combine inline `style` objects, execute chained event handlers without swallowing user callbacks, and prioritize incoming explicit external attributes.

```tsx
/* ✅ Correct: Standardized internalProps -> mergeProps -> mergedProps execution flow */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "filled",
      size = "md",
      isDisabled = false,
      isPending = false,
      className,
      onClick,
      children,
      ...htmlAttributes
    },
    externalRef,
  ) {
    /*
     ** The native HTML 'disabled' attribute is one of the rare cases where it does more harm than good.
     ** When using 'disabled' the element is not clickable, but it's also not focusable or readable by assistive technologies.
     ** Instead, we use aria-disabled and prevent click/press events manually.
     ** This way, disabled buttons can still be understood by assistive technologies while being non-operational.
     */
    const isInoperable = isDisabled || isPending;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isInoperable) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    const internalProps = {
      ref: externalRef,
      type: "button" as const,
      "aria-disabled": isInoperable ? "true" : undefined,
      "aria-busy": isPending ? "true" : undefined,
      "data-pending": isPending ? "true" : undefined,
      className: clsx(
        styles.button,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className,
      ),
      onClick: handleClick,
    };

    const mergedProps = mergeProps(internalProps, htmlAttributes);

    return <button {...mergedProps}>{children}</button>;
  },
);

/* ❌ Incorrect: Direct inline attribute spreading without mergeProps resolution */
export function Button({
  variant = "filled",
  className,
  onClick,
  ...htmlAttributes
}: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.button, className)}
      onClick={onClick} // ❌ Manual event binding prone to overriding internal logic
      {...htmlAttributes} // ❌ Direct spread risks clobbering computed attributes or class names
    />
  );
}
```

### RX-11 · Client Component Directive (`'use client'`)

- The `'use client'` directive **MUST** be added as the first line of any component or hook file that uses React state, effects, refs, event handlers, Context, or browser-only APIs.
- The directive **MUST** be the very first statement in the file, before any imports.
- Purely presentational components with no interactivity or hooks **MUST NOT** declare `'use client'`; they remain React Server Components by default.
- Type-only files (`[ComponentName].types.ts`), CSS modules, and barrel `index.ts` files **MUST NOT** declare `'use client'`.

```tsx
/* ✅ Correct: interactive component opts into the client boundary */
"use client";

import * as React from "react";
import { mergeProps } from "@dy/react/utils";
import styles from "./Switch.module.css";

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    { defaultChecked = false, onCheckedChange, ...htmlAttributes },
    externalRef,
  ) {
    const [isChecked, setIsChecked] = useControllableState({
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });
    // ...
  },
);

/* ❌ Incorrect: static presentational component forced onto the client boundary */
("use client"); // ❌ No state, effects, or handlers — must remain a Server Component

export function Divider({ className, ...htmlAttributes }: DividerProps) {
  return <hr className={clsx(styles.divider, className)} {...htmlAttributes} />;
}
```

### RX-12 · Stable IDs via `useResolvedId`

- Any component that needs an `id` for ARIA wiring (label association, `aria-describedby`, `aria-controls`, `aria-labelledby`) **MUST** derive it from the internal `useResolvedId` hook.
- `useResolvedId` returns the consumer-supplied `id` when present and otherwise falls back to a stable `React.useId()` value; the consumer-supplied `id` **MUST** always take precedence.
- Components **MUST NOT** call `React.useId()` directly, hardcode `id` values, or generate ids with `Math.random()` or module-level counters (all cause hydration mismatches or collisions).
- Because `React.useId()` must run unconditionally, `useResolvedId` **MUST** call it on every render and only choose between the two values afterward.

```tsx
/* ✅ Correct: shared useResolvedId hook (id ?? useId), consumer id wins */
export function useResolvedId(id?: string): string {
  const generatedId = React.useId();
  return id ?? generatedId;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ id, label, ...htmlAttributes }, externalRef) {
    const inputId = useResolvedId(id);

    const internalProps = { ref: externalRef, id: inputId };
    const mergedProps = mergeProps(internalProps, htmlAttributes);

    return (
      <>
        <label htmlFor={inputId}>{label}</label>
        <input {...mergedProps} />
      </>
    );
  },
);

/* ❌ Incorrect: direct useId call and a non-deterministic fallback id */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ id, label, ...htmlAttributes }, externalRef) {
    const inputId = id ?? `field-${Math.random()}`; // ❌ Hydration mismatch and collisions
    return <input id={inputId} ref={externalRef} {...htmlAttributes} />;
  },
);
```

### RX-13 · Event Handler & Callback Naming

- Internal event handlers defined inside a component **MUST** be named using the `handle[Event]` pattern (e.g., `handleClick`, `handleChange`, `handleKeyDown`).
- Public callback props that expose events to consumers **MUST** be named using the `on[Event]` pattern (e.g., `onClick`, `onChange`, `onValueChange`, `onIsOpenChange`).
- An internal handler and the callback prop it invokes **MUST NOT** share the same identifier.

```tsx
/* ✅ Correct: internal handle[Event] wraps and invokes the on[Event] prop */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle({ onPressedChange, ...htmlAttributes }, externalRef) {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(
        event.currentTarget.getAttribute("aria-pressed") !== "true",
      );
    };

    const internalProps = { ref: externalRef, onClick: handleClick };
    const mergedProps = mergeProps(internalProps, htmlAttributes);

    return <button type="button" {...mergedProps} />;
  },
);

/* ❌ Incorrect: mismatched naming for handler and prop */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle({ onClick, ...htmlAttributes }, externalRef) {
    const clicked = (event: React.MouseEvent<HTMLButtonElement>) =>
      onClick?.(event); // ❌ Not handleClick
    return (
      <button
        type="button"
        onClick={clicked}
        ref={externalRef}
        {...htmlAttributes}
      />
    );
  },
);
```

### RX-14 · SSR Safety

- Component and hook render bodies **MUST NOT** access browser-only globals (`window`, `document`, `navigator`, `localStorage`, `matchMedia`) during render.
- Browser-only access **MUST** occur inside `React.useEffect` (or event handlers), which run exclusively on the client.
- Any state derived from a browser API **MUST** have an SSR-safe initial value so the server and first client render match.
- `useLayoutEffect` that touches the DOM **MUST** be routed through an isomorphic `useIsomorphicLayoutEffect` wrapper to avoid SSR warnings.
- Components **MUST NOT** branch their rendered output on `typeof window !== 'undefined'` in a way that produces hydration mismatches.

```tsx
/* ✅ Correct: browser access deferred to an effect with an SSR-safe initial value */
export function useViewportWidth(): number | undefined {
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

/* ❌ Incorrect: reads window during render — throws on the server, mismatches on hydration */
export function useViewportWidth(): number {
  return window.innerWidth; // ❌ Browser global accessed during render

---

## Pre-Submission Checklist

- [ ] `export const` + named function; ref forwarded as `externalRef` (React 19 `ref` prop / React 18 `forwardRef`); no manual `displayName` (RX-01)
- [ ] `externalRef` / `internalRef` naming; merged via `useMergedRefs` (RX-02)
- [ ] Explicit defaults in the destructuring signature — no `defaultProps`/inline fallbacks (RX-03)
- [ ] Named exports only; explicit `index.ts` public surface; one component per file (RX-04, RX-05, RX-06)
- [ ] Controlled + uncontrolled supported via discriminated unions and `useControllableState` (RX-07)
- [ ] Slots via compound sub-components, not boolean flags (RX-08)
- [ ] Stateful/stateless split; logic in hooks (RX-09)
- [ ] `internalProps` → `mergeProps(internalProps, htmlAttributes)` → `mergedProps` as the single spread (RX-10)
- [ ] `'use client'` only where interactivity requires it (RX-11)
- [ ] IDs via `useResolvedId` (RX-12)
- [ ] Handlers named `handle[Event]`; callback props named `on[Event]` (RX-13)
- [ ] No browser globals during render; SSR-safe initial state (RX-14)
```
