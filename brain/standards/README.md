# DY Design System — Standards

The single source of truth for how code in this repo is written. Each file covers one domain, and every rule carries a permanent ID so it can be cited in reviews, lint messages and AI output (e.g. "violates `RX-04`").

| File                           | IDs      | Applies to       | Governs                                     |
| :----------------------------- | :------- | :--------------- | :------------------------------------------ |
| [a11y.md](a11y.md)             | `A11Y-*` | `**/*.{tsx,css}` | Accessibility (release-blocking)            |
| [css.md](css.md)               | `CSS-*`  | `**/*.css`       | Component stylesheets                       |
| [general.md](general.md)       | `GEN-*`  | Everything       | Lint discipline, naming                     |
| [props.md](props.md)           | `PROP-*` | `**/*.{ts,tsx}`  | Public prop names, values and defaults      |
| [react.md](react.md)           | `RX-*`   | `**/*.tsx`       | Component definition, state and composition |
| [typescript.md](typescript.md) | `TS-*`   | `**/*.{ts,tsx}`  | Types, interfaces and functions             |

## Precedence

1. `A11Y-*` rules win over any conflicting rule.
2. Otherwise, the more specific rule wins.
3. The paired ✅/❌ examples are authoritative.
4. The [Shared Type Registry](props.md#shared-type-registry) is the source of truth for shared prop values and defaults.

## How these files are loaded

- **Claude Code:** each file is symlinked into `.claude/rules/`. Files with a `paths` field load only when Claude reads or edits a matching file; `general.md` has no `paths` field, so it always loads.
- **GitHub Copilot:** the `applyTo` field scopes each file the same way.

Keep both `paths` and `applyTo` in sync when changing a file's scope.

## Adding or changing a rule

- Use the next unused number in the domain (e.g. `TS-09`). Never reuse a retired ID.
- Write rules with **MUST** / **MUST NOT**, followed by a ✅/❌ example.
- Add a matching line to the file's Pre-Submission Checklist.
- Add a new domain as a new file here, a symlink in `.claude/rules/`, and a row in the table above.
