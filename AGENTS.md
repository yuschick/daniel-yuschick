# Portfolio monorepo

Source of truth for every agent working in this repo (Claude Code, Copilot, Cursor and others). [`CLAUDE.md`](CLAUDE.md) only points here.

Personal portfolio for Daniel Yuschick, a design systems architect, public speaker and author. The repo is both the site and a showcase of an AI-assisted design/dev workflow, so clarity, documentation and quality matter more than speed. It is built as a design system serving a single product.

## Non-negotiables

1. **Semantic tokens only.** Never hardcode colors, spacing, type or radii. Components use the top-layer `--dy-*` tokens from `@dy/tokens`; primitives and theme roles never reach the DOM.
2. **Accessibility is the baseline.** WCAG 2.2 AA, built to the `A11Y-*` rules. They win over every other rule.
3. **Nothing ships red.** Lint, types, build, tests and format pass before work is called done.

Ambiguity is a question, not a guess. Ask before making a consequential decision, adding a dependency, or deviating from a standard.

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm turbo run lint check-types build test`
- `pnpm format:check` (Prettier owns formatting; don't hand-format around it)

Run all of them after every change and report failures plainly, naming what ran. `lint` runs ESLint and Stylelint. Before changing `turbo.json`, read the docs bundled with the installed package (`node -p "require.resolve('turbo/package.json')"`, then `docs/README.md`); Turborepo behavior varies by version.

## Layout

| Path               | Holds                                                               |
| :----------------- | :------------------------------------------------------------------ |
| `apps/web`         | The portfolio site                                                  |
| `apps/docs`        | Design system documentation                                         |
| `packages/react`   | `@dy/react`, the component library (single entry point, `index.ts`) |
| `packages/tokens`  | `@dy/tokens`: tokens synced from Figma, built to CSS                |
| `packages/configs` | `@dy/configs`: ESLint, Stylelint and TypeScript configs             |
| `brain/`           | Context: Daniel's identity and voice, catalogs, coding standards    |
| `content/`         | Writing and speaking work, with its own `AGENTS.md`                 |
| `.claude/skills/`  | Versioned skills, e.g. `/sync-tokens`                               |

## Standards

Coding standards live in `brain/standards/`, one file per domain (`CSS-*`, `TS-*`, `RX-*`, `A11Y-*`, `PROP-*`, `GEN-*`) with permanent rule IDs. Claude Code loads them through `.claude/rules/` when you touch matching files; other tools should read the relevant file first. See `brain/README.md` for how the brain is layered.

- Cite rule IDs when explaining a decision or flagging a violation.
- `A11Y-*` wins over any conflicting rule; otherwise the more specific rule wins.
- Before finishing, check the work against the Pre-Submission Checklist of each relevant file.

### Enforced vs. advisory

A rule that a tool enforces fails the build. Every rule not listed as enforced is **advisory**: it relies on review, so apply it deliberately.

| Enforced by                                            | Rules                                                                            |
| :----------------------------------------------------- | :------------------------------------------------------------------------------- |
| ESLint (`@dy/configs/eslint`)                          | GEN-01, GEN-02, TS-06, TS-07, RX-04, RX-05                                       |
| ESLint, custom `dy` rules (`@dy/configs/eslint-react`) | RX-01 (display names), RX-02, RX-06, TS-01 (rest spread name)                    |
| ESLint, `jsx-a11y-x` strict                            | The statically checkable part of `A11Y-*`                                        |
| Stylelint (`@dy/configs/stylelint`)                    | CSS-01, CSS-02, CSS-07 (tokens only), CSS-10                                     |
| TypeScript                                             | TS-08 and RX-07 (invalid prop combinations), once components exist               |
| Token build (`@dy/tokens`)                             | No primitive or theme tokens in CSS, exact OKLCH round-trip, WCAG contrast pairs |

Judgment calls (for example `PROP-01`, `PROP-03`, `RX-08`, `RX-09`) and everything behavioral in `A11Y-*` (keyboard operation, focus order, screen reader output) need a human or reviewer pass. Tests and axe checks come with each component, not before.

## Spec before build

A component, or a change to a public API, needs an approved spec before any code.

1. Write the spec in `packages/react/specs/<component>.md` with `status: draft`: the API (per `PROP-*` and the Shared Type Registry), anatomy and composition, states, the WAI-ARIA pattern it follows, and the tokens it uses.
2. **Stop.** Ask Daniel to approve it. Don't implement until it says `status: approved`.
3. Build to the spec. If the work needs to deviate, update the spec and say so rather than diverging silently.

Typo fixes, dependency bumps and fully specified bug fixes don't need a spec. The test: if you'd want to argue about the approach after seeing the diff, it needed a spec first.

## Design tokens

Figma variables are the source of truth. `packages/tokens/src/` is generated by the `/sync-tokens` skill and `dist/` by the build; never edit either by hand. A token change means a change in Figma, then a sync PR.

## Brain and content

- `brain/` is public context. Only add facts Daniel has published himself, with a source. Never put anything private in it.
- `content/` has its own rules in `content/AGENTS.md`. Embargoed drafts go in the gitignored `content/private/`.

## Conventions not covered by rule IDs

- TypeScript runs in strict mode.
- Every theme-aware change works in light and dark mode.
- Every component ships with robust Storybook stories, documentation and test coverage.

## Working agreement

- Ask before adding a dependency.
- Plan first for anything touching more than one package.
- Small commits, one logical change each.
- Don't edit generated files or lockfiles by hand.
- Strengthen what exists before adding something new.
- When unsure about a convention, check `brain/standards/` first, then ask.
- **End every session definitively: land it or park it.** Either the work reaches a checkpoint and is committed, or the stopping point and next step are written down. Never leave work in an unrecorded state.
