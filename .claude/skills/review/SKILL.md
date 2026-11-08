---
name: review
description: Run one cold review of a component against its approved spec, or of a spec before it merges, and record the result for /pr. It never fixes what it finds, approves a PR or merges one. Run only when the approver invokes /review.
disable-model-invocation: true
argument-hint: '--component <name> | --spec <name>'
allowed-tools: Bash(node .claude/skills/review/scripts/*) Bash(pnpm --filter @dy/tokens build) Bash(git status *) Bash(git branch --show-current)
hooks:
  PreToolUse:
    - matcher: 'Edit|Write|NotebookEdit|Bash|Agent|Task'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/review/scripts/review-hooks.js" pre'
          timeout: 30
---

# Review

Runs one cold review and records its result. A component is reviewed against its approved spec and the standards, behind the same gates `/implement` uses. A spec is reviewed before it merges, for ambiguity, invention, omission, contradiction and scope. **Whoever wrote the work never handles the report:** a hook saves it from the reviewer's own transcript, and a script checks it.

Placeholders that name a field of [project.json](../project.json), such as `<paths.specs>` or `<defaultBranch>`, stand for its value.

## The rules behind every step

- **One review, then stop.** This skill reports; it never fixes, and it never starts a second reviewer. Fixing is the author's next step.
- **The reviewer stays cold.** It gets exactly the prompt the script wrote and nothing about the work, the author or earlier reviews. The hooks refuse anything else.
- **Never write, edit or summarize a report into existence.** If the hook saved nothing, say so and stop.
- **A failing gate isn't yours to fix here.** Report it and stop.

## Input

Exactly one of `--component <name>` or `--spec <name>`, the lowercase name of the spec's folder in `<paths.specs>/`. Ask if neither is given. Run every command from the repo root.

`/implement` reviews its own builds, so this skill refuses an `implement/*` branch.

## Component

1. **Preflight.** `node .claude/skills/review/scripts/preflight.js --component <name>`. The spec must be on `<defaultBranch>`, unchanged and with no open questions. It starts the review from a clean folder.
2. **Gates.** Run `<commands.buildTokens>`, then `node .claude/skills/review/scripts/run-gates.js --component <name>`. Continue only on `GATES: PASS`; otherwise report each failing gate and stop. The scope gate expects a branch that changes only this component, its barrels and approved shared rules.
3. **Start.** `node .claude/skills/review/scripts/start-review.js --component <name>`, then start a **new** `<reviewers.component>` subagent with the contents of the file it printed as its entire prompt.
4. **Check.** `node .claude/skills/review/scripts/check-review.js --component <name>`.

## Spec

1. **Start.** `node .claude/skills/review/scripts/start-review.js --spec <name>`. The spec and its facts must pass the spec checks; approval isn't required, because a spec is usually reviewed before it merges. Then start a **new** `<reviewers.spec>` subagent with the contents of the file it printed as its entire prompt.
2. **Check.** `node .claude/skills/review/scripts/check-review.js --spec <name>`.

## Results

`check-review.js` prints `RESULT:` and writes `result.json` beside the report, pinned to the exact code or spec it reviewed.

| Result    | What to do                                                                                                                              |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `PASS`    | Report it. `Next: /pr`.                                                                                                                 |
| `FAIL`    | Show every flagged row or finding as the report states it, with no defence of the work. `Next:` fix, then `/review` again.              |
| `INVALID` | The report skipped rows, or its evidence didn't hold up. Show the errors and stop; the approver decides whether to run `/review` again. |
| `MISSING` | The hook saved no report. Tell the approver and stop.                                                                                   |

A `QUESTION` or `Question` in a report always goes to the approver. If you believe the reviewer is wrong, say so separately; only the approver can dismiss a finding.

## Limits

- The report hook lives in `settings.json`, because a skill's own hooks don't run for its subagents. It only runs once the workspace is trusted.
- The guard runs only while a review is waiting for its reviewer. It recognizes shell commands that name the review's folder, not every effect a command can have.
- A component review has no screenshots yet: capturing one is `/implement`'s stack-specific script.
- A spec report is prose, so the script checks its verdict and counts its labels; it can't check the evidence the way it does for a component.
- A passing review is evidence, not a guarantee. It doesn't replace the human review.
