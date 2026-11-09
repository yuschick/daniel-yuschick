---
name: pr
description: Verify the current branch the way the skill that handed it off requires, then push it and open its pull request from the handoff and the repo's template. The only skill that pushes; it never approves or merges. Run only when the approver invokes /pr.
disable-model-invocation: true
argument-hint: ''
allowed-tools: Bash(node .claude/skills/pr/scripts/*) Bash(git status *) Bash(git log *) Bash(git branch --show-current) Bash(git push -u origin *) Bash(gh pr create *) Bash(/opt/homebrew/bin/gh pr create *) Edit(node_modules/.cache/skills/**)
hooks:
  PreToolUse:
    - matcher: 'Bash'
      hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/pr/scripts/pr-hooks.js"'
          timeout: 30
---

# PR

Turns a verified branch into an open pull request. It is the only step that leaves the machine, so it checks the branch itself rather than trusting the handoff: **a skill describes its work; `/pr` decides whether it's ready.**

Placeholders that name a field of [project.json](../project.json), such as `<paths.specs>` or `<defaultBranch>`, stand for its value.

## The rules behind every step

- **Verify, then push, in that order, on the same commit.** A hook allows only the two commands the prepare script printed, for the exact commit it verified.
- **Never edit the work here.** If verification fails, report it; fixing belongs to the skill that made the branch.
- **Approving and merging are human decisions.** `settings.json` denies them to every agent.

## Input

None. Run it on the branch to open, from the repo root, with nothing uncommitted.

## 1. Prepare

```sh
node .claude/skills/pr/scripts/prepare-pr.js --footer "<the PR attribution line your harness specifies>"
```

It reads `node_modules/.cache/skills/<branch>/handoff.json` and checks it was written for this branch at this commit. Then it verifies the branch by the handing-off skill's own standard, not by anything the handoff says:

| Skill          | `/pr` checks                                                        |
| :------------- | :------------------------------------------------------------------ |
| `/spec`        | The spec and facts are ready to approve, and formatting             |
| `/implement`   | The gates and the latest cold review passed this exact code         |
| `/sync-tokens` | `<commands.buildTokens>`                                            |
| `/retro`       | `<commands.verify>`                                                 |
| No handoff     | `<commands.verify>`, after the approver confirms the title and body |

- **`READY`**: go to step 2.
- **`ERROR`**: report each error and stop. A moved branch means the skill's last step must run again.
- **`NO HANDOFF`**: no skill handed this branch off. Draft a title and body from the commits it lists, and show both to the approver. Only once they confirm, write the body to `node_modules/.cache/skills/<branch>/body.md` as `## ` sections and rerun with `--title "<title>"`, adding `--base <branch>` or `--draft` if they asked for either.

## 2. Push and open

Run each `RUN:` line exactly as printed, one at a time: the push, then the PR. The guard denies any other push or PR, and any change to those commands.

Report the PR URL and stop. Next: a human review and merge.

## Limits

- On an `implement/*` branch in a session where `/implement` ran, its hooks also judge these commands. They expect `prepare-pr.js`, so it runs without a prompt.
- The guard judges shell commands that push or open a PR. It can't see a push made outside this session.
- The rendered body is the handoff's prose. `/pr` proves the branch is ready, not that its description is accurate; the human review does that.
