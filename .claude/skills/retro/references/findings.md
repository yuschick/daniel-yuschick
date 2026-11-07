# What counts as a finding

## Signals

Look for these in the session or the PR record. Each is evidence that something in the repo, a skill or an instruction could have prevented it, or should keep doing what it did.

- **A correction.** The approver redirected, overruled or undid something. What instruction would have got it right the first time?
- **A guess.** You assumed something the repo didn't settle, whether or not it turned out right.
- **A repeated or avoidable question.** The same question asked twice, or answered by a file you hadn't read.
- **A failed check.** Lint, types, tests, format, a gate or the token build failed, and the cause was a missing or unclear instruction rather than a typo.
- **A hook denial or a permission prompt.** Either the work went out of scope, or the scope is drawn wrong.
- **A repeated review flag.** The same row or rule failed in more than one round, or across components.
- **A stale instruction.** A doc, skill or memory said something the repo no longer does.
- **Wasted steps.** Work redone, a dead end, a long search for something that should be one link away.
- **Something that worked.** A check that caught a real problem, or an instruction that prevented a mistake. These go under "Working well" so they aren't removed later.

## What doesn't count

- Advice with no event behind it ("consider adding more tests").
- Anything about the approver personally.
- A recorded decision, unless what happened contradicts it.
- One-off slips with no instruction that would have prevented them.

## Destinations

| Destination | Holds                                                                  |
| :---------- | :--------------------------------------------------------------------- |
| `standards` | `<paths.standards>/`: always a follow-up, changed only by the approver |
| `skills`    | `.claude/skills/` and `.claude/agents/`                                |
| `agents-md` | `AGENTS.md`, `CLAUDE.md`, `content/AGENTS.md` and READMEs              |
| `checks`    | ESLint, Stylelint, gates, hooks, CI, tests and `settings.json`         |
| `memory`    | Claude's memory: preferences, project state, the park note             |

## Control labels

How strongly the behaviour a finding concerns is enforced, now and as proposed. Moving a rule up a level is usually the best fix for a repeated finding.

| Label        | Means                                                                    |
| :----------- | :----------------------------------------------------------------------- |
| `blocking`   | A required check stops the merge (CI on `<defaultBranch>`).              |
| `detecting`  | A check fails, but nothing stops a merge (local gates, hooks, a review). |
| `advisory`   | Written down, and relies on someone reading and following it.            |
| `unverified` | Not written down or checked anywhere.                                    |
