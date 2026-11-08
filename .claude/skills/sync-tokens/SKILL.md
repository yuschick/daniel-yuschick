---
name: sync-tokens
description: Export Figma variables as W3C DTCG token files into the tokens package, and hand the sync to /pr. Run only when the approver invokes /sync-tokens.
disable-model-invocation: true
argument-hint: '[current | new | <new-branch-name>] [base-branch]'
allowed-tools: Bash(date *) Bash(mkdir -p node_modules/.cache/sync-tokens/*) Bash(git status *) Bash(git branch --show-current) Bash(git branch -d *) Bash(git check-ref-format *) Bash(git rev-parse *) Bash(git fetch *) Bash(git cat-file *) Bash(git switch *) Bash(git restore *) Bash(git add packages/tokens/*) Bash(git commit *) Bash(git log *) Bash(node packages/tokens/scripts/*) Bash(pnpm --filter @dy/tokens build) Edit(node_modules/.cache/sync-tokens/**) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__use_figma Edit(node_modules/.cache/skills/**) Bash(node .claude/skills/sync-tokens/scripts/*)
---

# Sync tokens from Figma

Figma variables are the source of truth. This skill reads them (read-only), writes them as DTCG JSON into `<paths.tokensPackage>/src/`, and hands the branch to `/pr`. It never edits Figma and never edits token files by hand.

Placeholders that name a field of [project.json](../project.json), such as `<paths.specs>` or `<defaultBranch>`, stand for its value.

The run follows the approver's order: choose the branch the changes land on, sync and commit, then choose the branch the PR targets. Only collections that changed since the last sync are exported; `<paths.tokensPackage>/figma-sync.json` records each collection's fingerprint and files, and the converter reuses the committed files of the rest.

- Figma file key: `<figma.fileKey>`
- Work directory `<work>`: `node_modules/.cache/sync-tokens/<run-id>/`, with `raw/` inside. Use a new `<run-id>` (`date +%Y%m%d-%H%M`) every run.
- Arguments, both optional: `$0` is the working branch (`current`, `new`, or a name for a new branch) and `$1` is the PR destination. Ask only for what wasn't given.

## 1. Preflight

Stop and report if `git status --porcelain` isn't empty: the skill may switch branches, and it commits only its own files.

Record the current branch with `git branch --show-current` as `<start>`, and create `<work>/raw` with `mkdir -p`.

## 2. Working branch

From `$0`, or ask the approver before reading anything from Figma:

- **`current`**: use `<start>`.
- **`new`**: a new branch from the current one, named `tokens/sync-<run-id>`. When asking, suggest that name and accept any name he gives instead.
- **Any other value**: the name for a new branch.

For a new branch, check the name with `git check-ref-format --branch <name>` and confirm it doesn't exist yet (`git rev-parse --verify --quiet refs/heads/<name>` prints nothing). Then `git switch -c <name>`. If either check fails, say why and ask for another name.

Call the chosen branch `<work-branch>` and confirm `git cat-file -e HEAD:<paths.tokensPackage>/package.json`. If that fails, stop: this branch doesn't contain `<packages.tokens>` yet. If you created the branch, switch back to `<start>` and delete it with `git branch -d <name>`.

## 3. List collections and plan

Follow the Figma MCP's own instructions: `create_session` for the file, then load the `figma-use` skill before the first `use_figma` call.

Run [scripts/export-variables.js](scripts/export-variables.js) with `__COLLECTION_ID__` set to `LIST` and both `__OFFSET__` and `__LIMIT__` set to `0`. Save the result unchanged to `<work>/collections.json`, then:

```sh
node <paths.tokensPackage>/scripts/sync-plan.js --collections <work>/collections.json
```

If it prints `No collections changed since the last sync.`, stop and report that Figma and `<work-branch>` are in sync. If you created the branch, switch back to `<start>` and delete it with `git branch -d <name>`.

## 4. Export the changed collections

For every collection and offset the plan prints, run [scripts/export-variables.js](scripts/export-variables.js) with `__COLLECTION_ID__`, `__OFFSET__` and `__LIMIT__` (60) replaced. Run calls one at a time and save each result, unchanged and complete (`{ "hash": …, "payload": … }`), to `<work>/raw/<collection-slug>.<offset>.json`.

Never edit, reformat values in, or summarize a payload. Don't check hashes yourself: the converter verifies every file against the hash computed in Figma, and every collection against the fingerprint in the listing.

## 5. Convert, compare and build

```sh
node <paths.tokensPackage>/scripts/figma-to-dtcg.js --input <work>/raw --collections <work>/collections.json --output <paths.tokensPackage>/src --state <paths.tokensPackage>/figma-sync.json
node <paths.tokensPackage>/scripts/diff-tokens.js --base HEAD --dir <paths.tokensPackage>/src --out <work>/pr-body.md
<commands.buildTokens>
```

- The converter writes straight into `<paths.tokensPackage>/src` and updates `<paths.tokensPackage>/figma-sync.json`.
- If the converter reports an altered export or a fingerprint mismatch, re-export that collection and run it again. If it reports a missing type mapping, stop and explain: the converter needs updating, not the tokens.
- The diff counts added, changed and removed tokens and updated descriptions. If it prints `No token changes.`, run `git restore <paths.tokensPackage>`, stop and report that Figma and `<work-branch>` are in sync, and delete the branch if you created it.
- If the build fails (a hidden token leaking into CSS, a color that doesn't round-trip, a failing contrast pair), stop and report the error. Leave the files uncommitted on `<work-branch>` so the approver can inspect them.

## 6. Commit

`git add <paths.tokensPackage>/src <paths.tokensPackage>/figma-sync.json`, then commit on `<work-branch>` with the message `chore(tokens): sync from Figma`, ending with the attribution lines your harness specifies.

## 7. Destination and handoff

Use `$1` as the destination `<base>` if given. Otherwise ask the approver which branch the PR should target, defaulting to `<defaultBranch>` if they leave it blank.

- If the destination is `<work-branch>` itself, there is nothing to open a PR from: stop and report that the commit is on `<work-branch>`, unpushed.
- `git fetch origin <base>` and confirm `git cat-file -e origin/<base>:<paths.tokensPackage>/package.json`. If that fails, the destination doesn't contain `<packages.tokens>` yet: say so and ask for another destination. The commit stays on `<work-branch>` either way.

Write the PR body to `node_modules/.cache/skills/<work-branch>/body.md`, as `## ` sections:

- `What's Changed`: `<work>/pr-body.md` from the diff, unchanged.
- `Additional Information`: a line naming the Figma file and the collections the converter exported and reused, and, if `git log --oneline origin/<base>..HEAD` lists commits other than the sync, a line saying the PR includes them.

Then run `node .claude/skills/sync-tokens/scripts/write-handoff.js --title "chore(tokens): sync from Figma (<YYYY-MM-DD>)" --base <base>`, and stay on `<work-branch>`: `/pr` runs from there.

Report the working branch, the collections exported and reused, the counts from the diff, and `Next: /pr`.
