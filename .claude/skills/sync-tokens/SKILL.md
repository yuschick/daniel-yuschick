---
name: sync-tokens
description: Export Figma variables as W3C DTCG token files into packages/tokens/src and open a pull request. Run only when Daniel invokes /sync-tokens.
disable-model-invocation: true
argument-hint: '[current | new | <new-branch-name>] [base-branch]'
allowed-tools: Bash(date *) Bash(mkdir -p node_modules/.cache/sync-tokens/*) Bash(git status *) Bash(git branch --show-current) Bash(git branch -d *) Bash(git check-ref-format *) Bash(git rev-parse *) Bash(git fetch *) Bash(git cat-file *) Bash(git switch *) Bash(git restore *) Bash(git add packages/tokens/*) Bash(git commit *) Bash(git log *) Bash(git push *) Bash(gh auth status) Bash(gh pr create *) Bash(/opt/homebrew/bin/gh auth status) Bash(/opt/homebrew/bin/gh pr create *) Bash(cat node_modules/.cache/sync-tokens/*) Bash(node packages/tokens/scripts/*) Bash(pnpm --filter @dy/tokens build) Edit(node_modules/.cache/sync-tokens/**) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__use_figma
---

# Sync tokens from Figma

Figma variables are the source of truth. This skill reads them (read-only), writes them as DTCG JSON into `packages/tokens/src/`, and opens a PR. It never edits Figma and never edits token files by hand.

The run follows Daniel's order: choose the branch the changes land on, sync and commit, then choose the branch the PR targets. Only collections that changed since the last sync are exported; `packages/tokens/figma-sync.json` records each collection's fingerprint and files, and the converter reuses the committed files of the rest.

- Figma file key: `HiDiGLs2OsVWyqnCo7aEjF`
- Work directory `<work>`: `node_modules/.cache/sync-tokens/<run-id>/`, with `raw/` inside. Use a new `<run-id>` (`date +%Y%m%d-%H%M`) every run.
- Arguments, both optional: `$0` is the working branch (`current`, `new`, or a name for a new branch) and `$1` is the PR destination. Ask only for what wasn't given.

## 1. Preflight

Stop and report if either check fails:

- `git status --porcelain` is empty (the skill may switch branches and commits only its own files).
- `gh auth status` succeeds. `gh` may not be on the shell's PATH; if `gh` isn't found, call `/opt/homebrew/bin/gh` and use that path for every `gh` command below.

Record the current branch with `git branch --show-current` as `<start>`, and create `<work>/raw` with `mkdir -p`.

## 2. Working branch

From `$0`, or ask Daniel before reading anything from Figma:

- **`current`**: use `<start>`.
- **`new`**: a new branch from the current one, named `tokens/sync-<run-id>`. When asking, suggest that name and accept any name he gives instead.
- **Any other value**: the name for a new branch.

For a new branch, check the name with `git check-ref-format --branch <name>` and confirm it doesn't exist yet (`git rev-parse --verify --quiet refs/heads/<name>` prints nothing). Then `git switch -c <name>`. If either check fails, say why and ask for another name.

Call the chosen branch `<work-branch>` and confirm `git cat-file -e HEAD:packages/tokens/package.json`. If that fails, stop: this branch doesn't contain `@dy/tokens` yet. If you created the branch, switch back to `<start>` and delete it with `git branch -d <name>`.

## 3. List collections and plan

Follow the Figma MCP's own instructions: `create_session` for the file, then load the `figma-use` skill before the first `use_figma` call.

Run [scripts/export-variables.js](scripts/export-variables.js) with `__COLLECTION_ID__` set to `LIST` and both `__OFFSET__` and `__LIMIT__` set to `0`. Save the result unchanged to `<work>/collections.json`, then:

```sh
node packages/tokens/scripts/sync-plan.js --collections <work>/collections.json
```

If it prints `No collections changed since the last sync.`, stop and report that Figma and `<work-branch>` are in sync. If you created the branch, switch back to `<start>` and delete it with `git branch -d <name>`.

## 4. Export the changed collections

For every collection and offset the plan prints, run [scripts/export-variables.js](scripts/export-variables.js) with `__COLLECTION_ID__`, `__OFFSET__` and `__LIMIT__` (60) replaced. Run calls one at a time and save each result, unchanged and complete (`{ "hash": …, "payload": … }`), to `<work>/raw/<collection-slug>.<offset>.json`.

Never edit, reformat values in, or summarize a payload. Don't check hashes yourself: the converter verifies every file against the hash computed in Figma, and every collection against the fingerprint in the listing.

## 5. Convert, compare and build

```sh
node packages/tokens/scripts/figma-to-dtcg.js --input <work>/raw --collections <work>/collections.json --output packages/tokens/src --state packages/tokens/figma-sync.json
node packages/tokens/scripts/diff-tokens.js --base HEAD --dir packages/tokens/src --out <work>/pr-body.md
pnpm --filter @dy/tokens build
```

- The converter writes straight into `packages/tokens/src` and updates `packages/tokens/figma-sync.json`.
- If the converter reports an altered export or a fingerprint mismatch, re-export that collection and run it again. If it reports a missing type mapping, stop and explain: the converter needs updating, not the tokens.
- The diff counts added, changed and removed tokens and updated descriptions. If it prints `No token changes.`, run `git restore packages/tokens`, stop and report that Figma and `<work-branch>` are in sync, and delete the branch if you created it.
- If the build fails (a hidden token leaking into CSS, a color that doesn't round-trip, a failing contrast pair), stop and report the error. Leave the files uncommitted on `<work-branch>` so Daniel can inspect them.

## 6. Commit

`git add packages/tokens/src packages/tokens/figma-sync.json`, then commit on `<work-branch>` with the message `chore(tokens): sync from Figma`, ending with the attribution lines your harness specifies.

## 7. Destination and PR

Use `$1` as the destination `<base>` if given. Otherwise ask Daniel which branch the PR should target, defaulting to `main` if he leaves it blank.

- If the destination is `<work-branch>` itself, there is nothing to open a PR from: stop and report that the commit is on `<work-branch>`, unpushed.
- `git fetch origin <base>` and confirm `git cat-file -e origin/<base>:packages/tokens/package.json`. If that fails, the destination doesn't contain `@dy/tokens` yet: say so and ask for another destination. The commit stays on `<work-branch>` either way.

Write `<work>/pr-footer.md` with:

- a line naming the Figma file and the collections the converter exported and reused,
- if `git log --oneline origin/<base>..HEAD` lists commits other than the sync, a line saying the PR includes them,
- the PR attribution line your harness specifies.

Then `git push -u origin <work-branch>` and open the PR, with the body built from the diff summary and the footer:

```sh
cat <work>/pr-body.md <work>/pr-footer.md | gh pr create --base <base> --head <work-branch> --title "chore(tokens): sync from Figma (<YYYY-MM-DD>)" --body-file -
```

Finally `git switch <start>` if you're not already on it.

Report the working branch, the PR URL, the collections exported and reused, and the counts from the diff.
