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

| Path                 | Holds                                                                  |
| :------------------- | :--------------------------------------------------------------------- |
| `apps/web`           | The portfolio site                                                     |
| `apps/docs`          | Design system documentation                                            |
| `packages/react`     | `@dy/react`, the component library (single entry point, `index.ts`)    |
| `packages/storybook` | `@dy/storybook`: one Storybook for every package; stories run as tests |
| `packages/tokens`    | `@dy/tokens`: tokens synced from Figma, built to CSS                   |
| `packages/configs`   | `@dy/configs`: ESLint, Stylelint and TypeScript configs                |
| `brain/`             | Context: Daniel's identity and voice, catalogs, coding standards       |
| `content/`           | Writing and speaking work, with its own `AGENTS.md`                    |
| `.claude/skills/`    | Versioned skills: `/sync-tokens`, `/spec`, `/build`                    |
| `.claude/agents/`    | Versioned subagents: `spec-reviewer`, `component-reviewer`             |

## Standards

Coding standards live in `brain/standards/`, one file per domain (`CSS-*`, `TS-*`, `RX-*`, `A11Y-*`, `PROP-*`, `GEN-*`) with permanent rule IDs. Claude Code loads them through `.claude/rules/` when you touch matching files; other tools should read the relevant file first. See `brain/README.md` for how the brain is layered.

- Cite rule IDs when explaining a decision or flagging a violation.
- `A11Y-*` wins over any conflicting rule; otherwise the more specific rule wins.
- Before finishing, check the work against the Pre-Submission Checklist of each relevant file.

### Enforced vs. advisory

A rule that a tool enforces fails the build. Every rule not listed as enforced is **advisory**: it relies on review, so apply it deliberately.

| Enforced by                                            | Rules                                                                                                                                                                    |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (`@dy/configs/eslint`)                          | GEN-01, GEN-02, TS-06, TS-07, TS-09 (`as const` in functions), RX-04, RX-05, FS-06                                                                                       |
| ESLint, custom `dy` rules (`@dy/configs/eslint-react`) | RX-01 (display names), RX-02, RX-06, TS-01 (rest spread name)                                                                                                            |
| ESLint, `jsx-a11y-x` strict                            | The statically checkable part of `A11Y-*`                                                                                                                                |
| Stylelint (`@dy/configs/stylelint`)                    | CSS-01, CSS-02, CSS-07 (tokens only), CSS-08 (system colors), CSS-10, CSS-14                                                                                             |
| TypeScript                                             | TS-08 and RX-07 (invalid prop combinations), once components exist                                                                                                       |
| Token build (`@dy/tokens`)                             | No primitive or theme tokens in CSS, exact OKLCH round-trip, WCAG contrast pairs                                                                                         |
| `/build` gates and hooks                               | The spec's exact API and tokens, FS-07 stories and props table rows, A11Y-14 keyboard stories, the scope of a build, GEN-01 suppressions, human approval of shared rules |

Judgment calls (for example `PROP-01`, `PROP-03`, `RX-08`, `RX-09`) and behavior in `A11Y-*` need a human or reviewer pass. Keyboard support is tested in Storybook, and screen reader output is checked by hand. Tests and axe checks come with each component, not before.

## Spec before build

A component, or a change to a public API, needs an approved spec before any code.

1. Run `/spec <figma-url>` to write `packages/react/specs/<component>.md` and its facts: the API (per `PROP-*` and the Shared Type Registry), anatomy and composition, states, the WAI-ARIA pattern it follows, and the tokens it uses.
2. **Stop.** The skill opens a PR containing only the spec. A spec is approved only when a human merges that PR into `main`. Agents never approve or merge a PR, and `status: approved` means nothing until it's on `main`.
3. Run `/build <component>` to build to the spec, in a separate PR. It proves the work with deterministic gates, hooks and a cold `component-reviewer`, for 3 review rounds at most, then opens a draft PR, or stops and asks if a round 3 fails. `--step` pauses after each stage, and `--staging` rehearses everything without committing, pushing or opening a PR. If the spec is wrong, stop: it changes through its own PR, merged by a human, and the build resumes from there. A build never edits its own spec.

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
