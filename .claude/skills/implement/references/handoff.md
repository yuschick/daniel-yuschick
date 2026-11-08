# Hand off

## Staging

Report the result, the rounds used, the findings by round, any shared rules changed, every file written and anything about the flow itself that went wrong or felt off. Then stop, because the approver inspects the work from here.

## The PR body

Write it to `node_modules/.cache/skills/implement/<component>/body.md`, the one file outside the component the hooks let you write, as `## ` sections:

- **Result**: passed, in how many rounds, and any reset the approver gave, from `rounds.json`.
- **Findings by round**: what each reviewer flagged and how it was resolved, including anything the approver dismissed.
- **Shared rules changed**: each one with the Decision or conversation behind it, or `None.`
- **Controls**: label each as `blocking`, `detecting`, `advisory` or `unverified`, naming any limits. The local gates are `detecting`. CI is `blocking` for what it repeats (lint, types, build, tests, format, the spec check and the skill tests), because `<defaultBranch>` requires it; the component checks and the review run only locally.
- **Manual check (A11Y-14)**, as an unchecked box: screen reader output for each state. An agent can't confirm it.
