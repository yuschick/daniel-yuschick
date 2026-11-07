---
name: retro
description: Look back on the current session, or a pull request with --pr, and propose evidence-backed improvements to the repo and the skill flow, sorted by where each change belongs. Applies the small ones the approver picks on a retro branch, and parks the rest. Run only when the approver invokes /retro.
disable-model-invocation: true
argument-hint: '[--pr <number>]'
allowed-tools: Bash(git status *) Bash(git log *) Bash(git diff *) Bash(git fetch *) Bash(git switch *) Bash(git add *) Bash(git commit *) Bash(gh pr view *) Bash(/opt/homebrew/bin/gh pr view *) Bash(pnpm turbo run lint check-types build test) Bash(pnpm format:check) Bash(pnpm exec prettier --write *) Edit(node_modules/.cache/skills/**)
---

# Retro

Turns a session or a pull request into a short list of findings, each backed by something that happened and sorted by where its change belongs. The approver picks which to act on. Small, fully specified changes are committed on a `retro/` branch for `/pr`; everything else becomes a written follow-up. It never pushes, and never changes a standard.

## The rules behind every step

- **Evidence or nothing.** A finding cites what happened: a correction from the approver, a failed check, a hook denial, a review flag, a repeated question, a stale instruction. Advice with nothing behind it is dropped.
- **Look hardest at your own work.** You were in the session, so you're biased toward it. Your guesses, retries and missed instructions are findings.
- **Don't reopen decisions.** A recorded decision (a spec's Decisions, `.claude/skills/README.md`, memory) is only a finding if what happened contradicts it.
- **Fewer, sharper findings.** At most 7, most consequential first.

## Input

Read [`../project.json`](../project.json) for the approver, the default branch and the `gh` command (use the first entry that runs).

- **No arguments:** the current session, which is already in your context.
- **`--pr <number>`:** run `gh pr view <number> --json number,title,body,state,headRefName,commits,comments,reviews,files`. If a build cache for its component exists under `node_modules/.cache/`, read its review rounds too. Use `git log` and `git diff` for anything the PR view doesn't show.

## 1. Gather

List what happened that a better repo, skill or instruction would have changed. [references/findings.md](references/findings.md) lists the signals to look for, what doesn't count, and the destinations and control labels.

## 2. Report

Write the report from [references/report-template.md](references/report-template.md): findings, what worked (keep it), takeaways, and a park note if the work is unfinished. Each finding names its destination, its control now and as proposed, and its size:

- **small:** fully specified, with nothing to argue about after seeing the diff (the test in AGENTS.md), and only prose: a `SKILL.md`, a reference, an agent, `AGENTS.md` or a README.
- **follow-up:** everything else, including any code, check, config, hook, CI or `settings.json` change, and anything touching `brain/standards/`, a spec, generated files or lockfiles. Write the next step precisely enough to start a session from.

## 3. Ask

Ask the approver which findings to act on, by number. Never act on one they didn't pick.

## 4. Record

- **Memory findings and the park note:** write them to Claude's memory, updating an existing memory rather than adding a duplicate.
- **Follow-ups:** write each one into the park note or the memory it belongs to, so nothing picked is left only in this conversation.

## 5. Apply the small ones

Skip this step if no small finding was picked.

1. Stop if `git status --porcelain` isn't empty: say the session's own work must be landed or parked first, and leave the small findings as follow-ups.
2. `git fetch origin <default>`, then `git switch -c retro/<YYYY-MM-DD>-<topic> origin/<default>`.
3. Make exactly the change each finding proposed. Run `pnpm exec prettier --write` on the changed files, then `pnpm turbo run lint check-types build test` and `pnpm format:check`. On a failure, fix it only if the fix is part of the proposal; otherwise stop and report.
4. Commit each finding separately, as `docs(<scope>): <change>`, ending with the attribution lines your harness specifies.
5. Write the handoff to `node_modules/.cache/skills/retro/<YYYY-MM-DD>-<topic>/handoff.json`, as `.claude/skills/README.md` describes: `skill`, `branch`, `title`, `draft: false`, `verify` (`pnpm turbo run lint check-types build test && pnpm format:check`), and `body` with a section per finding (its evidence and change) and the list of follow-ups.

## Handoff

Print the branch and commits (if any), the follow-ups and where they were recorded, then `Next: /pr` for a retro branch, or the first follow-up otherwise.

## Limits

- It reads only the current session and pull requests, not stored transcripts of earlier sessions.
- Its findings on the current session come from the agent that did the work. A PR retro, which reads the record, is less biased.
- Until `/pr` exists (migration step 5), ask the approver whether to push the retro branch and open its PR by hand.
- `allowed-tools` can't read `project.json`, so the `gh` path there is repeated in the frontmatter.
