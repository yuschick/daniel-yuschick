---
name: build
description: Build a component from its approved spec, prove it with deterministic gates and a cold review, and open a draft pull request, or rehearse all of it with --staging. It never edits a spec, approves a PR or merges one. Run only when Daniel invokes /build.
disable-model-invocation: true
argument-hint: '<component> [--step] [--staging]'
allowed-tools: Bash(node .claude/skills/build/scripts/*) Bash(pnpm --filter @dy/tokens build) Bash(pnpm --filter @dy/react test*) Bash(pnpm --filter @dy/storybook test*) Bash(pnpm exec prettier --write packages/react/src/components/*) Bash(git status *) Bash(git switch *) Bash(git add *) Bash(git commit *) Bash(git diff *) Bash(git push -u origin build/*) Bash(gh pr create --draft *) Bash(/opt/homebrew/bin/gh pr create --draft *)
hooks:
  PreToolUse:
    - matcher: 'Edit|Write|NotebookEdit|Bash|Agent|Task|SendMessage'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/build/scripts/run-hooks.js" pre'
          onFailure: block
          timeout: 30
  PostToolUse:
    - matcher: 'Edit|Write|NotebookEdit'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/build/scripts/run-hooks.js" post'
          timeout: 120
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/build/scripts/run-hooks.js" stop'
          timeout: 30
---

# Build

Turns an approved spec into a component and ends at a draft pull request. **The author never decides its own work is finished:** scripts prove what can be proved, a cold agent judges the rest, and a person reviews last.

## The rules behind every step

- **The spec is the contract.** Build what it says, nothing more. If it's wrong, ambiguous or silent, stop and ask Daniel with a recommendation. Never guess, and never edit the spec or its facts here.
- **Facts win over memory.** Take every value from the spec and `*.facts.json`, and never read the design. Keeping them current with Figma is `/spec`'s job, and tests run against the build's output.
- **The author can't dismiss a finding.** Only Daniel can, and the PR records it.
- **Never loosen a check to pass.** That includes gates, stories and the reviewer's instructions. If a check is itself wrong, stop and show Daniel.

## The hooks

On a `build/*` branch, Claude Code runs [scripts/build-hooks.js](scripts/build-hooks.js), through [scripts/run-hooks.js](scripts/run-hooks.js), around your tools, so these aren't choices you make:

- **Before a tool runs.** The component folder and barrels are open. A shared rule, meaning `brain/standards/` or `packages/react/src/types/`, prompts Daniel for each edit, because only a person can change one. Everything else is denied, including specs, facts, tokens, configs, dependency files and the skills. Other shell commands prompt Daniel, or are denied if they name a protected path, so use the commands in this skill and `git commit -m`. The only subagent you may start is `component-reviewer`, and a PR must be a draft on code that passed the gates.
- **After each edit.** The tokens, styles and suppressions in that file are checked, and any problem comes straight back to you. Fix it before moving on. Lint runs at the gates, so half-finished work isn't judged.
- **Before you finish.** You can't end a turn with the code ahead of the gates without saying why. If you need Daniel, say so first, which also tells him directly:

  ```sh
  node .claude/skills/build/scripts/build-hooks.js pause --reason "<why>"
  ```

Never try to get around a denial. It means the work has gone outside the build, so stop and ask Daniel.

## Input

`$0` is the lowercase component name, which names its spec. Ask if it's missing. The rest of `$ARGUMENTS` can hold two flags:

- **`--step`** pauses after every numbered stage. Run `build-hooks.js pause --reason "<stage> done"`, summarize what the stage produced, and wait for Daniel. Use it whenever he's tuning this skill.
- **`--staging`** is a rehearsal on a real component, on top of the unmerged skill. Every check runs as usual, but nothing is committed, pushed or opened as a PR, and the hooks deny all three. The work stays uncommitted for Daniel to inspect, and step 8 reports instead.

## 1. Preflight

Stop and report on any failure. Don't work around one. **Nothing can be written to the component until this passes.**

If `node_modules/.cache/build/<component>/run.json` exists and you're on `build/<component>`, this build is resuming, so skip to wherever the work stands. The gates recheck the approval either way.

1. Get on `build/<component>`. If it doesn't exist, create it: from an up-to-date `main`, or from the current branch for `--staging`. If it exists but belongs to earlier work, stop and ask Daniel.
2. Run `pnpm --filter @dy/tokens build`, then pass any flags:

   ```sh
   node .claude/skills/build/scripts/preflight.js --component <component> [--staging] [--step]
   ```

   This confirms the spec and facts are on `origin/main` and match it, which is what makes them approved, and that the spec has no open questions. Nothing writes approval into the spec.

## 2. Read

Read the spec in full. The standards load on their own when you touch matching files, so read only a cited rule that hasn't loaded. Use existing helpers before writing new ones: `mergeProps`, `cx`, `useMergeRefs`, `useResolvedId`, `createArgType`, `createAdditionalTableGroups` and the Shared Type Registry.

If reading raises a question the spec doesn't answer, ask now, before writing code.

## 3. Tests first

1. Write only what compiles: the types, a stub component that renders the bare element with no styles or logic, and the exports.
2. Write `<Name>.stories.tsx` and any `use<Name>.test.ts` from the spec, not from an implementation you have in mind. Stories must cover every state and every Behavior row they can. Export `Default` first, as the single component in its bare minimum use and default state. Test keyboard support with `userEvent` (A11Y-14): reaching the component, each key its pattern names, and any state where it stays focusable while inoperable.
3. Add a `Conformance` story that passes the spec's facts to `checkConformance` from `@package-internal/utils/storybook`, starting from `CONFORMANCE_BOX_FIELDS`, `CONFORMANCE_BOX_NONE` and `CONFORMANCE_TEXT_FIELDS`. Import the facts as `@package-specs/<component>.facts.json` (FS-06). Every fact must be mapped or ignored, and each ignored field needs a comment citing the Decision behind it.
4. Write the props table in the story's `argTypes` (FS-07): a `createArgType` row for every prop in the spec, `ref` included, showing the type's name with its values as `options`, `createAdditionalTableGroups` for the native attributes, and a row in the `HTML Attributes` category for any native attribute the meta's `args` set. Give every story a comment above its export, true of what it renders.
5. Don't measure contrast or re-check token values in stories. `contrast-pairs.json` checks each token pair in every theme, `Conformance` proves which tokens render in each state, and axe checks rendered text in every story. If the spec pairs two tokens with no pair in that file, stop and ask Daniel. Read variants with `getConformanceAxis`, so a story needs no casts (TS-09), and pass `forcePseudoState` a selector unique to the story, because a bare `button` takes the first match across every frame and the test silently proves nothing.
6. Run only this component's tests, with `pnpm --filter @dy/react test <Name>` and `pnpm --filter @dy/storybook test <Name>`, and **confirm they fail for the right reasons**. A test that passes against a stub proves nothing, so fix it before moving on.

## 4. Implement

Write the real component until its tests pass, following the spec row by row. The full suite runs at the gates. Keep literal types with `satisfies`, not casts (TS-09), and default to CSS shorthands (CSS-14). Change only the component folder, the barrels (`src/index.ts`, `src/components/index.ts`), and registry files when a Decision calls for it.

## 5. Gates

```sh
node .claude/skills/build/scripts/run-gates.js --component <component>
```

It runs the skills' own tests, including the seeded defects that prove the checks can fail, then rechecks that the spec is approved, then the component checks, `pnpm turbo run lint check-types build test` and `pnpm format:check`, and pins the results to a hash of the code.

The component checks compare the code with the spec in both directions: the compiler proves the exact props and values, and a script proves the exact tokens. They also reject inline styles, raw colors, suppressions without a rule, reason and tracking issue, and any tracked change outside the build's scope.

Fix every failure and rerun. **Never invent a tracking issue to pass a check:** if a suppression seems unavoidable, stop and ask Daniel. These attempts don't use a review round, but after **3 failed attempts at the same problem**, stop and show Daniel.

## 6. Cold review

Run this only when the gates print `GATES: PASS`. Commit first, so each round is recoverable, unless this is `--staging`.

1. Capture what the reviewer will see:

   ```sh
   node .claude/skills/build/scripts/capture-story.js --story components-<component>--conformance --output node_modules/.cache/build/<component>/story.png
   node .claude/skills/build/scripts/build-ledger.js --component <component> --screenshot node_modules/.cache/build/<component>/story.png
   ```

2. Start a **new** `component-reviewer` subagent, with the contents of the `reviewer-prompt.txt` that `build-ledger.js` printed as its entire prompt. The hook refuses any other wording, a model override, code that hasn't passed the gates, and a reviewer past the limits, so don't describe the work, your reasoning or earlier rounds.
3. A hook saves the reviewer's report and records its verdict as soon as it stops, so you never handle the report, and changing the code can't undo a failed round. Read the result:

   ```sh
   node .claude/skills/build/scripts/check-review.js --component <component>
   ```

   - **`RESULT: MISSING`**: the hook didn't save a report. Stop and tell Daniel. Never write one yourself.
   - **`RESULT: INVALID`**: the report skipped rows, or its evidence didn't hold up against the code, so it proves nothing. Start another new reviewer. This doesn't use a round, but 2 invalid reports stop the build.
   - **`RESULT: PASS`**: go to step 8.
   - **`RESULT: FAIL`**: go to step 7.

## 7. Route every flag

There are **3 review rounds at most, and never a fourth**. The script counts them and the hook enforces the limit, so a round is used whenever a valid report fails.

| Flag                              | What to do                                                                                                |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `FAIL`, the code is wrong         | Make a targeted fix, then return to step 5. All gates rerun, then a new reviewer checks the whole ledger. |
| `QUESTION`, or the spec is wrong  | Stop and ask Daniel. If the spec must change, it goes through its own PR, then this build resumes.        |
| You believe the reviewer is wrong | Stop and ask Daniel. Only he can dismiss a finding, and it's recorded in the PR.                          |
| `REPEAT` printed for a row        | Stop and show Daniel. The same row failing after a fix won't be solved by another round.                  |
| `STOP` printed                    | Stop and show Daniel every open flag, with your recommendation. **There is no PR.**                       |

Fix what a flag names, and don't regenerate the component. A rewrite throws away verified work, and new code can introduce new problems.

Whenever you stop for Daniel, record why with `build-hooks.js pause`. If he decides the build should get more rounds, run `node .claude/skills/build/scripts/check-review.js --component <component> --reset`. The hook prompts him for it, and you never run it on your own judgment.

## 8. Draft pull request

**If this is `--staging`, there's no PR.** Report the result, the rounds used, the findings by round, any shared rules changed, every file written and anything about the flow itself that went wrong or felt off. Then stop, because Daniel inspects the work from here.

Otherwise, a PR only follows a passing review. The hook refuses one unless the gates and the most recent review both passed this exact code. Rerun `check-review.js` first: it must still print `RESULT: PASS`.

Push with `git push -u origin build/<component>` and open a **draft** PR into `main` using the template in `.github/pull_request_template.md`. Always include:

- **Result**: passed, in how many rounds, and any reset Daniel gave, from `rounds.json`.
- **Findings by round**: what each reviewer flagged and how it was resolved, including anything Daniel dismissed.
- **Shared rules changed**: each one with the Decision or conversation behind it, or `None.`
- **Controls**: label each as `blocking`, `detecting`, `advisory` or `unverified`, naming any limits. Without CI, the gates are `detecting`, because nothing stops a merge.
- **Manual check (A11Y-14)**, as an unchecked box: screen reader output for each state. An agent can't confirm it.

End with the attribution line your harness specifies. Report the URL and stop. Marking it ready and merging are human decisions.

## Limits

- Gates run locally. Until CI exists and `main` requires it, they detect problems rather than block a merge.
- `--step` relies on you stopping. The hooks can't tell which stage you're in, so it's advisory.
- `--staging` proves the flow, not delivery: pushing, CI and the PR itself stay untested until a real build.
- A staging run answers for what changed since its preflight. To try a change to this skill, stash the staging work, `git switch` to the skill branch (the hook prompts Daniel), commit the change, point `build/<component>` at it and rerun preflight, which clears the earlier run's cache.
- A build trusts the approved spec, so it won't notice Figma changing after approval. Rerunning `/spec` catches that.
- Pre-approved tools last only until Daniel's next message, so after a `--step` pause, commands may prompt him.
- The hooks recognize shell commands, not every effect they can have, so a build script or a command Daniel approves could still write somewhere protected. The scope gate catches that afterwards.
- Approvals and gate results live in `node_modules/.cache`. Hooks deny the file tools there, but a shell command Daniel approves could still change them.
- Claude Code's docs don't list skill hooks as running inside subagents, which is why only the read-only reviewer may start.
- The suppression check confirms an issue is cited, not that the issue exists.
- The API check covers the component's own props. It can't see attributes set inside the component or names exported beside it, which rest on the cold review.
- Inline styles have no exception yet. A component that truly needs one has to raise it with Daniel, and the check changes through its own PR.
- `Conformance` checks styles the facts describe. Layout, wrapping and behavior rest on the other stories and the review.
- Forced pseudo-states prove the CSS for each state, not real pointer input, so behavior stories should still use `userEvent`.
- The reviewer's report depends on a `SubagentStop` hook in `.claude/settings.json`, because the same hook in this skill's frontmatter never fired for the reviewer. It only runs once the workspace is trusted, and it reads the handback from the reviewer's own transcript. If it doesn't run, the build stops rather than falling back to the author.
- The script checks that evidence exists, not that it supports the verdict. An `absent:` claim is only as good as the term the reviewer chose.
- A passing review is supporting evidence, not a guarantee. It doesn't replace the human review.
