# Portfolio monorepo

This file exists because Claude Code looks for `CLAUDE.md`. The rules live in `AGENTS.md`, imported below.

Quick reference, until everything below has loaded:

1. Semantic tokens only: never hardcode colors, spacing, type or radii.
2. Accessibility is the baseline: `A11Y-*` rules win over every other rule.
3. Nothing ships red: run `pnpm turbo run lint check-types build test` and `pnpm format:check`, and report failures.
4. Ask before adding a dependency, and get an approved spec before building a component.

@AGENTS.md
