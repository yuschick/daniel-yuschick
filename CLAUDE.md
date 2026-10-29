# Portfolio monorepo

Personal portfolio for Daniel Yuschick, a design systems architect, public speaker and author.
The repo is both the site and a showcase of an AI-assisted design/dev workflow,
So clarity, documentation and quality matter more than speed.

@AGENTS.md

## Commands

- pnpm install
- pnpm dev
- pnpm turbo run lint check-types build

Run lint, check-types and build after every change, and report failures.

## Standards

Coding standards live in `brain/standards/`, one file per domain (`CSS-*`, `TS-*`, `RX-*`, `A11Y-*`, `PROP-*`, `GEN-*`).
They load automatically through `.claude/rules/` when you work on matching files.

- Cite rule IDs when explaining a decision or flagging a violation.
- `A11Y-*` rules win over any conflicting rule; otherwise the more specific rule wins.
- Before finishing, check the work against the Pre-Submission Checklist of each relevant file.

## Conventions not covered by rule IDs

- TypeScript runs in strict mode.
- Styling uses semantic tokens only. Never hardcode colors, spacing or fonts.
- Every theme-aware change must work in light and dark mode.
- Every component ships with robust Storybook stories, documentation, and test coverage.

## Working agreement

- Ask before adding a dependency.
- Plan first for anything touching more than one package.
- Small commits, one logical change each.
- Don't edit generated files or lockfiles by hand.
- When unsure about a convention, check `brain/standards/` first, then ask.
