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

# Build

Turns an approved spec into a component and ends at a reviewed branch that `/pr` opens as a draft pull request. **The author never decides its own work is finished:** scripts prove what can be proved, a cold agent judges the rest, and a person reviews last.

Placeholders that name a field of [project.json](../project.json), such as `<paths.specs>` or `<defaultBranch>`, stand for its value.

## The rules behind every step

- **The spec is the contract.** Build what it says, nothing more. If it's wrong, ambiguous or silent, stop and ask the approver with a recommendation. Never guess, and never edit the spec or its facts here.
- **Facts win over memory.** Take every value from the spec and `*.facts.json`, and never read the design. Keeping them current with Figma is `/spec`'s job, and tests run against the build's output.
- **The author can't dismiss a finding.** Only the approver can, and the PR records it.
- **Never loosen a check to pass.** That includes gates, stories and the reviewer's instructions. If a check is itself wrong, stop and show the approver.

## The hooks

On an `implement/*` branch, Claude Code runs [scripts/implement-hooks.js](scripts/implement-hooks.js), through [scripts/run-hooks.js](scripts/run-hooks.js), around your tools, so these aren't choices you make:

- **Before a tool runs.** The component folder and barrels are open. A shared rule, meaning `<paths.standards>/` or `<paths.typeRegistry>/`, prompts the approver for each edit, because only a person can change one. Everything else is denied, including specs, facts, tokens, configs, dependency files and the skills. Other shell commands prompt the approver, or are denied if they name a protected path, so use the commands in this skill and `git commit -m`. The only subagent you may start is `component-reviewer`, and a PR must be a draft on code that passed the gates.
- **After each edit.** The tokens, styles and suppressions in that file are checked, and a style sheet is also run through the package's own Stylelint. Any problem comes straight back to you, so fix it before moving on. ESLint runs at the gates, so half-finished TypeScript isn't judged. To lint sooner, run `pnpm turbo run lint --filter=<packages.components>`, because a command that names a package any other way is denied.
- **Before you finish.** You can't end a turn with the code ahead of the gates without saying why. If you need the approver, say so first, which also tells them directly:

  ```sh
  node .claude/skills/implement/scripts/implement-hooks.js pause --reason "<why>"
  ```

Never try to get around a denial. It means the work has gone outside the build, so stop and ask the approver.

## Input

`$0` is the lowercase component name, which names its spec. Ask if it's missing. The rest of `$ARGUMENTS` can hold two flags:

- **`--step`** pauses after every numbered stage. Run `implement-hooks.js pause --reason "<stage> done"`, summarize what the stage produced, and wait for the approver. Use it whenever they're tuning this skill.
- **`--staging`** is a rehearsal on a real component, on top of the unmerged skill. Every check runs as usual, but nothing is committed, pushed or opened as a PR, and the hooks deny all three. The work stays uncommitted for the approver to inspect, and step 8 reports instead.

## 1. Preflight

Stop and report on any failure. Don't work around one. **Nothing can be written to the component until this passes.**

If `node_modules/.cache/implement/<component>/run.json` exists and you're on `implement/<component>`, this build is resuming, so skip to wherever the work stands. The gates recheck the approval either way.

1. Get on `implement/<component>`. If it doesn't exist, create it: from an up-to-date `<defaultBranch>`, or from the current branch for `--staging`. If it exists but belongs to earlier work, stop and ask the approver.
2. Run `<commands.buildTokens>`, then pass any flags:

   ```sh
   node .claude/skills/implement/scripts/preflight.js --component <component> [--staging] [--step]
   ```

   This confirms the spec and facts are on `origin/main` and match it, which is what makes them approved, and that the spec has no open questions. Nothing writes approval into the spec.

## 2. Read

Read the spec in full. The standards load on their own when you touch matching files, so read only a cited rule that hasn't loaded. Use existing helpers before writing new ones: `mergeProps`, `cx`, `useMergeRefs`, `useResolvedId`, `createArgType`, `createAdditionalTableGroups` and the Shared Type Registry.

If reading raises a question the spec doesn't answer, ask now, before writing code.

## 3. Tests first

1. Write only what compiles: the types, a stub component that renders the bare element with no styles or logic, and the exports.
2. Write `<Name>.stories.tsx` and the test for the component's logic, `use<Name>.test.ts` or `get<Name>Props.test.ts` as the spec names it (RX-09), from the spec, not from an implementation you have in mind. Stories must cover every state and every Behavior row they can. Export `Default` first, as the single component in its bare minimum use and default state. Test keyboard support with `userEvent` (A11Y-14): reaching the component, each key its pattern names, and any state where it stays focusable while inoperable.
3. Add a `Conformance` story that passes the spec's facts to `checkConformance` from `@package-internal/utils/storybook`, starting from `CONFORMANCE_BOX_FIELDS`, `CONFORMANCE_BOX_NONE` and `CONFORMANCE_TEXT_FIELDS`. Import the facts as `@package-specs/<component>.facts.json` (FS-06). Every fact must be mapped or ignored, and each ignored field needs a comment citing the Decision behind it.
4. Write the props table in the story's `argTypes` (FS-07): a `createArgType` row for every prop in the spec, `ref` included, showing the type's name with its values as `options`, `createAdditionalTableGroups` for the native attributes, and a row in the `HTML Attributes` category for any native attribute the meta's `args` set. Give every story a comment above its export, true of what it renders.
5. Don't measure contrast or re-check token values in stories. `contrast-pairs.json` checks each token pair in every theme, `Conformance` proves which tokens render in each state, and axe checks rendered text in every story. If the spec pairs two tokens with no pair in that file, stop and ask the approver. Read variants with `getConformanceAxis`, so a story needs no casts (TS-09), and pass `forcePseudoState` a selector unique to the story, because a bare `button` takes the first match across every frame and the test silently proves nothing.
6. Run only this component's tests, with `pnpm --filter <packages.components> test <Name>` and `pnpm --filter <packages.storybook> test <Name>`, and **confirm they fail for the right reasons**. A test that passes against a stub proves nothing, so fix it before moving on.

## 4. Implement

Write the real component until its tests pass, following the spec row by row. The full suite runs at the gates. Keep literal types with `satisfies`, not casts (TS-09), and default to CSS shorthands (CSS-14). Change only the component folder, the barrels (`src/index.ts`, `src/components/index.ts`), and registry files when a Decision calls for it.

## 5. Gates

```sh
node .claude/skills/implement/scripts/run-gates.js --component <component>
```

It runs the skills' own tests, including the seeded defects that prove the checks can fail, then rechecks that the spec is approved, then the component checks, `pnpm turbo run lint check-types build test` and `pnpm format:check`, and pins the results to a hash of the code.

The component checks compare the code with the spec in both directions: the compiler proves the exact props and values, and a script proves the exact tokens. They also reject inline styles, raw colors, suppressions without a rule, reason and tracking issue, and any tracked change outside the build's scope.

Fix every failure and rerun. **Never invent a tracking issue to pass a check:** if a suppression seems unavoidable, stop and ask the approver. These attempts don't use a review round, but after **3 failed attempts at the same problem**, stop and show the approver.

## 6. Cold review

Run this only when the gates print `GATES: PASS`. Commit first, so each round is recoverable, unless this is `--staging`.

1. Capture what the reviewer will see:

   ```sh
   node .claude/skills/implement/scripts/capture-story.js --story components-<component>--conformance --output node_modules/.cache/implement/<component>/story.png
   node .claude/skills/implement/scripts/implement-ledger.js --component <component> --screenshot node_modules/.cache/implement/<component>/story.png
   ```

2. Start a **new** `component-reviewer` subagent, with the contents of the `reviewer-prompt.txt` that `implement-ledger.js` printed as its entire prompt. The hook refuses any other wording, a model override, code that hasn't passed the gates, and a reviewer past the limits, so don't describe the work, your reasoning or earlier rounds.
3. A hook saves the reviewer's report and records its verdict as soon as it stops, so you never handle the report, and changing the code can't undo a failed round. Read the result:

   ```sh
   node .claude/skills/implement/scripts/check-review.js --component <component>
   ```

   - **`RESULT: MISSING`**: the hook didn't save a report. Stop and tell the approver. Never write one yourself.
   - **`RESULT: INVALID`**: the report skipped rows, or its evidence didn't hold up against the code, so it proves nothing. Start another new reviewer. This doesn't use a round, but 2 invalid reports stop the build.
   - **`RESULT: PASS`**: go to step 8.
   - **`RESULT: FAIL`**: go to step 7.

## 7. Route every flag

There are **3 review rounds at most, and never a fourth**. The script counts them and the hook enforces the limit, so a round is used whenever a valid report fails.

| Flag                              | What to do                                                                                                |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `FAIL`, the code is wrong         | Make a targeted fix, then return to step 5. All gates rerun, then a new reviewer checks the whole ledger. |
| `QUESTION`, or the spec is wrong  | Stop and ask the approver. If the spec must change, it goes through its own PR, then this build resumes.  |
| You believe the reviewer is wrong | Stop and ask the approver. Only they can dismiss a finding, and it's recorded in the PR.                  |
| `REPEAT` printed for a row        | Stop and show the approver. The same row failing after a fix won't be solved by another round.            |
| `STOP` printed                    | Stop and show the approver every open flag, with your recommendation. **There is no PR.**                 |

Fix what a flag names, and don't regenerate the component. A rewrite throws away verified work, and new code can introduce new problems.

Whenever you stop for the approver, record why with `implement-hooks.js pause`. If they decide the build should get more rounds, run `node .claude/skills/implement/scripts/check-review.js --component <component> --reset`. The hook prompts him for it, and you never run it on your own judgment.

## 8. Hand off

**If this is `--staging`, there's no handoff.** Report the result, the rounds used, the findings by round, any shared rules changed, every file written and anything about the flow itself that went wrong or felt off. Then stop, because the approver inspects the work from here.

Otherwise, hand off only after a passing review: rerun `check-review.js`, which must still print `RESULT: PASS`. `/pr` checks again that the gates and the latest review passed this exact code, so a handoff can't stand in for either.

Write the PR body to `node_modules/.cache/skills/implement/<component>/body.md`, the one file outside the component the hooks let you write, as `## ` sections:

- **Result**: passed, in how many rounds, and any reset the approver gave, from `rounds.json`.
- **Findings by round**: what each reviewer flagged and how it was resolved, including anything the approver dismissed.
- **Shared rules changed**: each one with the Decision or conversation behind it, or `None.`
- **Controls**: label each as `blocking`, `detecting`, `advisory` or `unverified`, naming any limits. The local gates are `detecting`. CI is `blocking` for what it repeats (lint, types, build, tests, format, the spec check and the skill tests), because `<defaultBranch>` requires it; the component checks and the review run only locally.
- **Manual check (A11Y-14)**, as an unchecked box: screen reader output for each state. An agent can't confirm it.

Then run `node .claude/skills/implement/scripts/write-handoff.js --title "<type>(<scope>): add <Name>"`, using the Conventional Commits type and scope this repo's history uses for components. The PR is always a draft. Report the branch and `Next: /pr`, and stop. Marking the PR ready and merging are human decisions.

## Limits

- The component checks and the cold review run only locally, so they detect problems rather than block a merge. CI repeats the rest and blocks.
- `--step` relies on you stopping. The hooks can't tell which stage you're in, so it's advisory.
- `--staging` proves the flow, not delivery: pushing, CI and the PR itself stay untested until a real build.
- A staging run answers for what changed since its preflight. To try a change to this skill, stash the staging work, `git switch` to the skill branch (the hook prompts the approver), commit the change, point `implement/<component>` at it and rerun preflight, which clears the earlier run's cache.
- A build trusts the approved spec, so it won't notice Figma changing after approval. Rerunning `/spec` catches that.
- Pre-approved tools last only until the approver's next message, so after a `--step` pause, commands may prompt them.
- The hooks recognize shell commands, not every effect they can have, so a build script or a command the approver approves could still write somewhere protected. The scope gate catches that afterwards.
- Approvals and gate results live in `node_modules/.cache`. Hooks deny the file tools there, but a shell command the approver approves could still change them.
- Claude Code's docs don't list skill hooks as running inside subagents, which is why only the read-only reviewer may start.
- The suppression check confirms an issue is cited, not that the issue exists.
- The API check covers the component's own props. It can't see attributes set inside the component or names exported beside it, which rest on the cold review.
- Inline styles have no exception yet. A component that truly needs one has to raise it with the approver, and the check changes through its own PR.
- `Conformance` checks styles the facts describe. Layout, wrapping and behavior rest on the other stories and the review.
- Forced pseudo-states prove the CSS for each state, not real pointer input, so behavior stories should still use `userEvent`.
- The reviewer's report depends on a `SubagentStop` hook in `.claude/settings.json`, because the same hook in this skill's frontmatter never fired for the reviewer. It only runs once the workspace is trusted, and it reads the handback from the reviewer's own transcript. If it doesn't run, the build stops rather than falling back to the author.
- The script checks that evidence exists, not that it supports the verdict. An `absent:` claim is only as good as the term the reviewer chose.
- A passing review is supporting evidence, not a guarantee. It doesn't replace the human review.
