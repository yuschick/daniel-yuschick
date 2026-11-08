---
description: 'DY Design System file and directory structure for the @dy/react package.'
applyTo: 'packages/react/**'
paths:
  - 'packages/react/**'
---

# DY Design System — Structure Rules

> **Core Philosophy:** If you know where one thing lives, you know where everything lives.

Rule IDs are permanent: rules may be reordered or retired, but an ID is never reused. This file governs _where files live and what they are called_ in `packages/react`. It points to the rules that govern their contents instead of repeating them: `RX-04`, `RX-05` and `RX-06` in [react.md](react.md), `TS-01` in [typescript.md](typescript.md) and `CSS-05` in [css.md](css.md). See the [standards index](README.md) for every domain.

> **Status:** ESLint enforces FS-06 and the `/build` gates enforce FS-07's rows and part of FS-04 and FS-05. The rest are advisory until a structure test exists (see [AGENTS.md](../../AGENTS.md#enforced-vs-advisory)).

## Structure Rules

### FS-01 · Package Layout

- `packages/react/src` **MUST** be organized into these folders, each exposing its public surface through an `index.ts`:

```bash
📁 src/
├── components/     # public components, one folder each
├── docs/           # Storybook documentation pages
├── hooks/          # public hooks
├── internal/       # everything consumers must never import (see FS-02)
├── providers/      # public context providers
├── types/          # shared types (common.ts is the Shared Type Registry)
└── index.ts        # the package's only public entry point (RX-05)
```

- Component specs live outside `src`, in a folder of their own, `packages/react/specs/<component>/<component>.md` beside its `<component>.facts.json`, and must be approved before a component is built.

### FS-02 · Internal Mirrors Public

- `src/internal/` **MUST** mirror the public layout it needs (`components/`, `hooks/`, `types/`, `utils/`) and **MUST** hold only code that exists to support the public components.
- Nothing in `internal/` may be exported from `src/index.ts` or from any public `index.ts`. Public code may import from `internal/`; consumers never can.
- A helper used by one component stays in that component's folder. It moves to `internal/` only when a second component needs it, and to a public folder only when consumers need it too.

### FS-03 · Folder Names and Barrels

- Component folders **MUST** be `PascalCase`; hook folders `camelCase` with a `use` prefix; utility folders `camelCase`.
- Every folder **MUST** have an `index.ts` containing only named exports (`export { Button } from './Button'`), never `export *` and never default exports (RX-04, RX-05). Types are exported with `export type`.

### FS-04 · Component Folder

- A component folder **MUST** contain these sibling files, named after the folder: `[Name].tsx`, `[Name].types.ts` (TS-01), `[Name].module.css` (CSS-05), `[Name].stories.tsx` and `index.ts`.
- A stateless component's logic (`use[Name].ts` when it calls a hook, otherwise `get[Name]Props.ts`, RX-09) is a sibling file with its own sibling test (FS-05), and **MUST NOT** be exported from `index.ts`. A stateful component's public hook (e.g. `useAccordion`) is a sibling file and **MUST** be exported.
- Every file declares one component (RX-06), so the parts of a composite component are sibling files in the parent's folder: `DialogHeader.tsx`, `DialogContent.tsx`, `DialogFooter.tsx`, `DialogClose.tsx`. They are consumed as `Dialog.Header`, `Dialog.Content` and so on.

```bash
✅ Correct
📁 Dialog/
├── Dialog.tsx
├── DialogClose.tsx
├── DialogContent.tsx
├── DialogFooter.tsx
├── DialogHeader.tsx
├── Dialog.module.css
├── Dialog.stories.tsx
├── Dialog.types.ts
├── useDialog.ts
└── index.ts

❌ Incorrect
📁 Dialog/
├── Dialog.tsx
├── Dialog.test.tsx      # ❌ component tests live in Storybook (FS-05)
├── DialogParts.tsx      # ❌ several components in one file (RX-06)
└── styles.css           # ❌ not [Name].module.css (CSS-05)
```

### FS-05 · Where Tests Live

- All component tests (unit, interaction, usability and accessibility) **MUST** be written as Storybook tests in `[Name].stories.tsx`. Components **MUST NOT** have separate `[Name].test.ts(x)` files.
- Hooks and utilities **MUST** have a sibling test file named after them, e.g. `useControllableState.test.ts` next to `useControllableState.ts`.

```bash
📁 hooks/useControllableState/
├── index.ts
├── useControllableState.ts
└── useControllableState.test.ts
```

### FS-06 · Aliased Imports

- An import that climbs more than one folder **MUST** use a path alias from `packages/react/tsconfig.json` (`@package-hooks/*`, `@package-internal/*`, `@package-specs/*`, `@package-types/*` and so on) instead of a `../../` chain. A sibling (`./`) or a single `../` stays relative.

```ts
/* ✅ Correct */
import facts from '@package-specs/button/button.facts.json';

/* ❌ Incorrect */
import facts from '../../../specs/button/button.facts.json';
```

### FS-07 · Storybook Documentation

- The sidebar order is Daniel Yuschick, Foundations, Components, Hooks, Providers, set once in `.storybook/preview.ts`. Everything beyond that order sorts alphabetically: other groups after these, each group's contents, and each component's stories, with its `Documentation` page first. A public story's `title` **MUST** start with one of these sections (`Components/Button`).
- Every component **MUST** have a Documentation page with a props table in addition to its stories. Autodocs is on for every story file, so **MUST NOT** opt out with `!autodocs`.
- Every story **MUST** have a description, written as a comment directly above its export, and the description **MUST** be true of what the story renders and tests.
- The first story exported **MUST** be `Default`: the single component in its bare minimum use case and default state. It's the Documentation page's main preview, and the sidebar sorts stories regardless of file order.
- Props table rows **MUST** be grouped under these categories:
  - `Component Props`: the component's own props, including `ref`.
  - `HTML Attributes`: the native attributes it passes through, from `createAdditionalTableGroups`, plus a `createArgType` row with this category for any native attribute the story meta's `args` set, such as `onClick`.
  - `[SubComponentName] Props`: the props of a core component it composes (e.g. `Button Props` on an `IconButton`).
- Every prop in the spec's API **MUST** have a row built with `createArgType`. The Type column **MUST** show the type's name, with its values passed as `options` so the row toggles open to list them (`Size`, then `s, m, l`).

```tsx
/* ✅ Correct: the named type, with its values behind the toggle */
argTypes: {
  emphasis: createArgType({
    defaultValue: 'primary',
    description: 'The priority of the button within a screen region.',
    options: EMPHASES,
    type: 'Emphasis',
  }),
  ...createAdditionalTableGroups({
    htmlAttributes:
      'SanitizedHTMLAttributes<React.ButtonHTMLAttributes<HTMLButtonElement>>',
  }),
},
```

---

## Pre-Submission Checklist

- [ ] Folders sit in the layout from FS-01 and specs live in `packages/react/specs` (FS-01)
- [ ] Nothing from `internal/` is exported publicly; helpers moved up only when a second consumer needed them (FS-02)
- [ ] Folder names follow their casing; every `index.ts` has named exports only (FS-03)
- [ ] The component folder holds exactly the files in FS-04, one component per file, sub-components as siblings (FS-04)
- [ ] Component tests are Storybook tests; hooks and utilities have sibling test files (FS-05)
- [ ] Imports climbing more than one folder use a path alias (FS-06)
- [ ] The component has a Documentation page; every API prop and meta arg has a `createArgType` row in the right category, with its type's name and values; every story has a true description (FS-07)
