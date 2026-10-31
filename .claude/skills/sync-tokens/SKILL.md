---
name: sync-tokens
description: Export Figma variables as W3C DTCG token files into packages/tokens/src and open a pull request. Run only when Daniel invokes /sync-tokens.
disable-model-invocation: true
argument-hint: '[base-branch]'
allowed-tools: Bash(git status *) Bash(git branch --show-current) Bash(git fetch *) Bash(git ls-remote *) Bash(git cat-file *) Bash(git ls-tree *) Bash(git show *) Bash(git switch *) Bash(gh auth status) Bash(/opt/homebrew/bin/gh auth status) Bash(node packages/tokens/scripts/*) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__use_figma
---

# Sync tokens from Figma

Figma variables are the source of truth. This skill reads them (read-only), writes them as DTCG JSON into `packages/tokens/src/`, and opens a PR. It never edits Figma and never edits token files by hand.

- Figma file key: `HiDiGLs2OsVWyqnCo7aEjF`
- Work directory: `node_modules/.cache/sync-tokens/<run-id>/` with `raw/` and `dtcg/` inside. Use a new `<run-id>` (`YYYYMMDD-HHmm`) every run.

## 1. Preflight

Stop and report if either check fails:

- `git status --porcelain` is empty (the skill switches branches).
- `gh auth status` succeeds. `gh` may not be on the shell's PATH; if `gh` isn't found, call `/opt/homebrew/bin/gh` and use that path for every `gh` command below.

Record the current branch with `git branch --show-current` so you can return to it.

## 2. Base branch

Use `$0` if given. Otherwise ask Daniel which branch the PR should target, defaulting to `main` if he leaves it blank.

Then `git fetch origin <base>` and confirm `git cat-file -e origin/<base>:packages/tokens/package.json`. If that fails, stop: the base branch doesn't contain `@dy/tokens` yet, so suggest merging it first or choosing a branch that has it.

## 3. Read Figma

Follow the Figma MCP's own instructions: `create_session` for the file, then load the `figma-use` skill before the first `use_figma` call.

1. Run [scripts/list-collections.js](scripts/list-collections.js) with `use_figma`.
2. For every collection, run [scripts/read-collection.js](scripts/read-collection.js) with `__COLLECTION_ID__`, `__OFFSET__` and `__LIMIT__` replaced. Use a limit of 60 and repeat with increasing offsets until `offset + limit >= total`. Run calls one at a time.
3. Save each result, unchanged and complete (`{ "hash": …, "payload": … }`), to `raw/<collection-slug>.<offset>.json`. Never edit, reformat values in, or summarize a payload: the converter checks every file against the hash computed in Figma.

## 4. Convert and compare

```sh
node packages/tokens/scripts/figma-to-dtcg.js --input <work>/raw --output <work>/dtcg
node packages/tokens/scripts/diff-tokens.js --base origin/<base> --dir <work>/dtcg
```

If the converter reports an altered export, re-read that collection and save it again. If it reports a missing type mapping, stop and explain: the converter needs updating, not the tokens.

If the diff prints `No token changes.`, stop and report that Figma and `<base>` are already in sync.

## 5. Branch, commit and open the PR

1. `git switch -c tokens/sync-<run-id> origin/<base>`
2. Replace the JSON files in `packages/tokens/src/` with the files from `<work>/dtcg/`: first `find packages/tokens/src -maxdepth 1 -name '*.json' -delete` (never a `*.json` glob, which zsh turns into an error when nothing matches), then `mkdir -p packages/tokens/src` and copy the new files in.
3. Commit only `packages/tokens/src/` with the message `chore(tokens): sync from Figma`, ending with the attribution lines your harness specifies.
4. Push and open the PR against `<base>`:
   - Title: `chore(tokens): sync from Figma (<YYYY-MM-DD>)`
   - Body: the diff summary, then a line naming the Figma file and the collections exported, then the PR attribution line your harness specifies.
5. `git switch` back to the branch recorded in preflight.

Report the PR URL and the added, changed and removed counts.
