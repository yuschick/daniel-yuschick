---
name: implement
description: Build a component from its approved spec, prove it with deterministic gates and a cold review, and hand a draft pull request to /pr, or rehearse all of it with --staging. It never edits a spec, approves a PR or merges one. Run only when the approver invokes /implement.
disable-model-invocation: true
argument-hint: '<component> [--step] [--staging]'
allowed-tools: Bash(node .claude/skills/implement/scripts/*) Bash(pnpm --filter @dy/tokens build) Bash(pnpm --filter @dy/react test*) Bash(pnpm --filter @dy/storybook test*) Bash(pnpm exec prettier --write packages/react/src/components/*) Bash(git status *) Bash(git switch *) Bash(git add *) Bash(git commit *) Bash(git diff *)
hooks:
  PreToolUse:
    - matcher: 'Edit|Write|NotebookEdit|Bash|Agent|Task|SendMessage'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/implement/scripts/run-hooks.js" pre'
          onFailure: block
          timeout: 30
  PostToolUse:
    - matcher: 'Edit|Write|NotebookEdit'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/implement/scripts/run-hooks.js" post'
          timeout: 120
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/implement/scripts/run-hooks.js" stop'
          timeout: 30
---

# Implement

Turns an approved spec into a component and ends at a reviewed branch that `/pr` opens as a draft pull request. **The author never decides its own work is finished:** scripts prove what can be proved, a cold agent judges the rest, and a person reviews last.

Placeholders that name a field of [project.json](../project.json), such as `<paths.specs>` or `<defaultBranch>`, stand for its value.

## The rules behind every step

- **The spec is the contract.** Build what it says, nothing more. If it's wrong, ambiguous or silent, stop and ask the approver with a recommendation. Never guess, and never edit the spec or its facts here.
- **Facts win over memory.** Take every value from the spec and `*.facts.json`, and never read the design. Keeping them current with Figma is `/spec`'s job, and tests run against the build's output.
- **The author can't dismiss a finding.** Only the approver can, and the PR records it.
- **Never loosen a check to pass.** That includes gates, stories and the reviewer's instructions. If a check is itself wrong, stop and show the approver.
- **Hooks guard every tool.** Only the component folder and barrels are open, shared rules need the approver, and everything else is denied. [references/hooks.md](references/hooks.md) says exactly what they allow and check. Never try to get around a denial: stop and ask the approver. To stop for them at any point, run `node .claude/skills/implement/scripts/implement-hooks.js pause --reason "<why>"`.

## Input

`$0` is the lowercase component name, which names its spec. Ask if it's missing. The rest of `$ARGUMENTS` can hold two flags:

- **`--step`** pauses after every numbered stage: run `implement-hooks.js pause --reason "<stage> done"`, summarize what the stage produced, and wait for the approver. Use it whenever they're tuning this skill.
- **`--staging`** is a rehearsal on a real component, on top of the unmerged skill. Every check runs as usual, but nothing is committed, pushed or opened as a PR, and the hooks deny all three. The work stays uncommitted for the approver to inspect, and step 8 reports instead.

## 1. Preflight

Stop and report on any failure. **Nothing can be written to the component until this passes.** If `node_modules/.cache/implement/<component>/run.json` exists and you're on `implement/<component>`, this build is resuming, so skip to wherever the work stands; the gates recheck the approval either way.

1. Get on `implement/<component>`. If it doesn't exist, create it: from an up-to-date `<defaultBranch>`, or from the current branch for `--staging`. If it exists but belongs to earlier work, stop and ask the approver.
2. Run `<commands.buildTokens>`, then `node .claude/skills/implement/scripts/preflight.js --component <component> [--staging] [--step]`. It confirms the spec and facts are on `origin/<defaultBranch>` and match it, which is what makes them approved, and that the spec has no open questions. Nothing writes approval into the spec.

## 2. Read

Read the spec in full. The standards load on their own when you touch matching files, so read only a cited rule that hasn't loaded. Use existing helpers before writing new ones: `mergeProps`, `cx`, `useMergeRefs`, `useResolvedId`, `createArgType`, `createAdditionalTableGroups` and the Shared Type Registry. If reading raises a question the spec doesn't answer, ask now, before writing code.

## 3. Tests first

1. Write only what compiles: the types, a stub component that renders the bare element with no styles or logic, and the exports.
2. Write `<Name>.stories.tsx` and the test for the component's logic, `use<Name>.test.ts` or `get<Name>Props.test.ts` as the spec names it (RX-09), from the spec, not from an implementation you have in mind. Stories cover every state and every Behavior row they can. Export `Default` first, as the single component in its bare minimum use and default state. Test keyboard support with `userEvent` (A11Y-14): reaching the component, each key its pattern names, and any state where it stays focusable while inoperable.
3. Add the `Conformance` story and the props table, following [references/stories.md](references/stories.md), which also says what stories must not re-check.
4. Run only this component's tests, with `pnpm --filter <packages.components> test <Name>` and `pnpm --filter <packages.storybook> test <Name>`, and **confirm they fail for the right reasons**. A test that passes against a stub proves nothing, so fix it before moving on.

## 4. Implement

Write the real component until its tests pass, following the spec row by row. Keep literal types with `satisfies`, not casts (TS-09), and default to CSS shorthands (CSS-14). Change only the component folder, the barrels, and registry files when a Decision calls for it.

## 5. Gates

Run `node .claude/skills/implement/scripts/run-gates.js --component <component>`. It runs the skills' own tests (with the seeded defects that prove the checks can fail), rechecks the approval, runs the component checks, `pnpm turbo run lint check-types build test` and `pnpm format:check`, and pins the results to a hash of the code. The component checks compare code and spec both ways (exact props, values and tokens) and reject inline styles, raw colors, suppressions without a rule, reason and tracking issue, and any tracked change outside the build's scope.

Fix every failure and rerun. **Never invent a tracking issue to pass a check:** if a suppression seems unavoidable, stop and ask the approver. These attempts don't use a review round, but after **3 failed attempts at the same problem**, stop and show the approver.

## 6. Cold review

Only on `GATES: PASS`. Commit first, so each round is recoverable, unless this is `--staging`.

1. `node .claude/skills/implement/scripts/capture-story.js --story components-<component>--conformance --output node_modules/.cache/implement/<component>/story.png`, then `node .claude/skills/implement/scripts/implement-ledger.js --component <component> --screenshot node_modules/.cache/implement/<component>/story.png`.
2. Start a **new** `<reviewers.component>` subagent with the contents of the `reviewer-prompt.txt` the ledger printed as its entire prompt. The hook refuses any other wording, a model override, code that hasn't passed the gates, and a reviewer past the limits, so don't describe the work, your reasoning or earlier rounds.
3. A hook saves the report and records its verdict when the reviewer stops, so you never handle it, and changing the code can't undo a failed round. Read the result with `node .claude/skills/implement/scripts/check-review.js --component <component>`:
   - **`MISSING`**: the hook saved no report. Stop and tell the approver. Never write one yourself.
   - **`INVALID`**: the report skipped rows, or its evidence didn't hold up. Start another new reviewer; this doesn't use a round, but 2 invalid reports stop the build.
   - **`PASS`**: go to step 8. **`FAIL`**: go to step 7.

## 7. Route every flag

There are **3 review rounds at most, and never a fourth**: the script counts them and the hook enforces the limit.

| Flag                              | What to do                                                                                                |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `FAIL`, the code is wrong         | Make a targeted fix, then return to step 5. All gates rerun, then a new reviewer checks the whole ledger. |
| `QUESTION`, or the spec is wrong  | Stop and ask the approver. If the spec must change, it goes through its own PR, then this build resumes.  |
| You believe the reviewer is wrong | Stop and ask the approver. Only they can dismiss a finding, and it's recorded in the PR.                  |
| `REPEAT` printed for a row        | Stop and show the approver. The same row failing after a fix won't be solved by another round.            |
| `STOP` printed                    | Stop and show the approver every open flag, with your recommendation. **There is no PR.**                 |

Fix what a flag names, and don't regenerate the component: a rewrite throws away verified work. Whenever you stop, record why with `implement-hooks.js pause`. If the approver gives the build more rounds, run `check-review.js --component <component> --reset`; the hook prompts them for it, and you never run it on your own judgment.

## 8. Hand off

**With `--staging` there's no handoff:** report as [references/handoff.md](references/handoff.md) says, and stop.

Otherwise, rerun `check-review.js`, which must still print `RESULT: PASS`. Write the PR body that [references/handoff.md](references/handoff.md) describes, then run `node .claude/skills/implement/scripts/write-handoff.js --title "<type>(<scope>): add <Name>"`, using the Conventional Commits type and scope this repo's history uses for components. `/pr` checks again that the gates and the latest review passed this exact code, and opens the PR as a draft. Report the branch and `Next: /pr`, and stop. Marking the PR ready and merging are human decisions.

[references/limits.md](references/limits.md) lists what this skill can't prove.
