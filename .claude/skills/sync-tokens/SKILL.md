---
name: sync-tokens
description: Export Figma variables as W3C DTCG token files into packages/tokens/src and open a pull request. Run only when Daniel invokes /sync-tokens.
disable-model-invocation: true
argument-hint: '[base-branch]'
allowed-tools: Bash(git status *) Bash(git branch --show-current) Bash(git check-ref-format *) Bash(git rev-parse *) Bash(git fetch *) Bash(git ls-remote *) Bash(git cat-file *) Bash(git ls-tree *) Bash(git show *) Bash(git switch *) Bash(gh auth status) Bash(/opt/homebrew/bin/gh auth status) Bash(node packages/tokens/scripts/*) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__use_figma
---

# Sync tokens from Figma

Figma variables are the source of truth. This skill reads them (read-only), writes them as DTCG JSON into `packages/tokens/src/`, and opens a PR. It never edits Figma and never edits token files by hand.

The run follows Daniel's order: choose the branch the changes land on, sync and commit, then choose the branch the PR targets.

- Figma file key: `HiDiGLs2OsVWyqnCo7aEjF`
- Work directory: `node_modules/.cache/sync-tokens/<run-id>/` with `raw/` and `dtcg/` inside. Use a new `<run-id>` (`YYYYMMDD-HHmm`) every run.

## 1. Preflight

Stop and report if either check fails:

- `git status --porcelain` is empty (the skill may switch branches and commits only its own files).
- `gh auth status` succeeds. `gh` may not be on the shell's PATH; if `gh` isn't found, call `/opt/homebrew/bin/gh` and use that path for every `gh` command below.

Record the current branch with `git branch --show-current` as `<start>` so you can return to it.

## 2. Working branch

Ask Daniel where the changes should be made, before reading anything from Figma:

- **The current branch** (`<start>`), or
- **A new branch**, created from the current branch. Suggest `tokens/sync-<run-id>` and accept any name he gives instead.

For a new branch, check the name with `git check-ref-format --branch <name>` and confirm it doesn't exist yet (`git rev-parse --verify --quiet refs/heads/<name>` prints nothing). Then `git switch -c <name>`. If either check fails, say why and ask again.

Call the chosen branch `<work-branch>` and confirm `git cat-file -e HEAD:packages/tokens/package.json`. If that fails, stop: this branch doesn't contain `@dy/tokens` yet. If you created the branch, switch back to `<start>` and delete it with `git branch -d <name>`.

## 3. Read Figma

Follow the Figma MCP's own instructions: `create_session` for the file, then load the `figma-use` skill before the first `use_figma` call.

1. Run [scripts/list-collections.js](scripts/list-collections.js) with `use_figma`.
2. For every collection, run [scripts/read-collection.js](scripts/read-collection.js) with `__COLLECTION_ID__`, `__OFFSET__` and `__LIMIT__` replaced. Use a limit of 60 and repeat with increasing offsets until `offset + limit >= total`. Run calls one at a time.
3. Save each result, unchanged and complete (`{ "hash": …, "payload": … }`), to `raw/<collection-slug>.<offset>.json`. Never edit, reformat values in, or summarize a payload: the converter checks every file against the hash computed in Figma.

## 4. Convert and compare

Compare against `HEAD`, the working branch, so the summary describes exactly what the commit will change:

```sh
node packages/tokens/scripts/figma-to-dtcg.js --input <work>/raw --output <work>/dtcg
node packages/tokens/scripts/diff-tokens.js --base HEAD --dir <work>/dtcg
```

If the converter reports an altered export, re-read that collection and save it again. If it reports a missing type mapping, stop and explain: the converter needs updating, not the tokens.

If the diff prints `No token changes.`, stop and report that Figma and `<work-branch>` are already in sync. If you created the branch in step 2, switch back to `<start>` and delete it with `git branch -d <name>`.

## 5. Write and commit

1. Replace the JSON files in `packages/tokens/src/` with the files from `<work>/dtcg/`: first `find packages/tokens/src -maxdepth 1 -name '*.json' -delete` (never a `*.json` glob, which zsh turns into an error when nothing matches), then `mkdir -p packages/tokens/src` and copy the new files in.
2. Commit only `packages/tokens/src/` on `<work-branch>` with the message `chore(tokens): sync from Figma`, ending with the attribution lines your harness specifies.

## 6. Destination and PR

Use `$0` as the destination if given. Otherwise ask Daniel which branch the PR should target, defaulting to `main` if he leaves it blank.

- If the destination is `<work-branch>` itself, there is nothing to open a PR from: stop and report that the commit is on `<work-branch>`, unpushed.
- `git fetch origin <base>` and confirm `git cat-file -e origin/<base>:packages/tokens/package.json`. If that fails, the destination doesn't contain `@dy/tokens` yet: say so and ask for another destination. The commit stays on `<work-branch>` either way.

Then push `<work-branch>` and open the PR against `<base>`:

- Title: `chore(tokens): sync from Figma (<YYYY-MM-DD>)`
- Body: the diff summary from step 4, then a line naming the Figma file and the collections exported, then the PR attribution line your harness specifies. If `<work-branch>` already had commits that `origin/<base>` doesn't (check with `git log --oneline origin/<base>..HEAD`), add a line saying the PR includes them.

Finally `git switch <start>` if you're not already on it.

Report the working branch, the PR URL, and the added, changed and removed counts.
