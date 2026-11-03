---
name: spec
description: Turn a Figma component into a validated, cold-reviewed component spec and open a pull request for human approval. It never builds code. Run only when Daniel invokes /spec.
disable-model-invocation: true
argument-hint: '<figma-url>'
allowed-tools: Bash(date *) Bash(mkdir -p node_modules/.cache/spec/*) Bash(node .claude/skills/spec/scripts/*) Bash(pnpm --filter @dy/tokens build) Bash(git status *) Bash(git switch *) Bash(git add packages/react/specs/*) Bash(git commit *) Bash(git push *) Bash(gh pr create *) Bash(/opt/homebrew/bin/gh pr create *) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__get_screenshot mcp__claude_ai_Figma__use_figma
---

# Spec

Turns a Figma component into a spec that says exactly what to build, and ends at a pull request. **A spec is approved only when a human merges it into `main`.** This skill never builds code, approves a PR or merges one.

## The rule behind every step

**Uncertainty is a question to Daniel, never a guess.** If Figma, the tokens or `brain/standards/` don't settle something, ask, with a recommendation and its trade-off. Nothing enters the spec unless a source supports it: Figma facts, a standard, or Daniel's recorded decision.

- Figma wins on names, and `A11Y-*` wins over everything, including Figma.
- A Figma description is a statement of intent, not a fact. Where it disagrees with the facts or a standard, ask.
- Figma's `search_design_system` only covers published libraries, so an empty result doesn't prove a component is missing.

## 1. Facts

1. **Stop if Figma is unreachable.** Parse the file key and node ID from the URL (`148-2149` becomes `148:2149`). Call `create_session`, then load the `figma-use` skill before the first `use_figma` call. If Figma can't be reached, stop and say so; don't work from memory or screenshots.
2. **Check the tokens are current.** Run `pnpm --filter @dy/tokens build`. If Figma and `packages/tokens` may have drifted, ask Daniel about running `/sync-tokens` first.
3. **Extract.** Run [scripts/extract-component.js](scripts/extract-component.js) with `__NODE_ID__` replaced. It's read-only, and reports what each layer uses, as `token:<name>` or `raw:<value>`, and which variant axes each value depends on.
4. **Save.** Save the complete result, unchanged, to `packages/react/specs/<component>.facts.json`. Never edit, reformat or summarize it.
5. **Check.**

   ```sh
   node .claude/skills/spec/scripts/check-facts.js --facts packages/react/specs/<component>.facts.json
   ```

   - **`ERROR`**: the facts can't be trusted. Stop and report. Re-extract only if the hash failed; don't work around anything else.
   - **`QUESTION`**: a gap only Daniel can decide. Keep the list for the spec.

6. **Look.** Call `get_screenshot` on the node to compare with the facts. An image never overrides them, but a visible disagreement is a question.

## 2. Draft

Write `packages/react/specs/<component>.md` from [references/spec-template.md](references/spec-template.md), with `status: draft` and `factsHash` set to the facts hash. Produce the Figma tokens table only from the script; never write it by hand:

```sh
node .claude/skills/spec/scripts/check-spec.js --facts <facts> --print-rows
```

Read the standards for the component's domain, including what the template lists as commonly missed.

## 3. Ask

Every fact question, and anything else no source settles, goes to Daniel one decision at a time. Record each answer in Decisions. Unanswered ones go under Open questions; never fill them in yourself. Only the Decisions table may cite `Daniel`; other rows cite the decision.

## 4. Validate

```sh
node .claude/skills/spec/scripts/check-spec.js --facts <facts> --spec packages/react/specs/<component>.md
```

Fix every error by correcting the spec or asking. Never loosen the validator to pass.

## 5. Cold review

Start a new subagent with only this brief: follow `.claude/skills/spec/references/spec-review.md`, reviewing `<spec>` with facts `<facts>`. Don't describe the work or your reasoning.

Blocking findings go back to step 3, and the review runs again with a fresh agent, **3 rounds at most**. Then stop and show Daniel the findings, even if unresolved. A `Question` always goes to Daniel.

## 6. Pull request

Continue only when Open questions reads `None.` and the validator passes.

1. Set `status: approved`. This proposes the spec for approval; it grants nothing until the PR merges.
2. Re-run the validator.
3. Create branch `spec/<component>` from an up-to-date `main`, commit only the spec and its facts, push, and open a PR into `main` that contains only those two files.
4. In the PR body, list the Decisions, the last review's remaining findings and the number of review rounds. End with the attribution line your harness specifies.

Report the PR URL and stop. Merging is a human decision, and nothing may be built from the spec until it's on `main`.

## Limits

- It accepts a component or component set only. Any other node type stops the extractor.
- Hidden layers are listed, not summarized, so anything inside them needs a question before it's used.
- The checks can't tell whether a token is the right choice, only that it exists and matches Figma.
- Figma results are capped at 48KB. A larger component fails rather than truncating, and the extractor would need to split its output.
- Setting a Figma component's description through a script can re-encode its text, so ask Daniel to edit descriptions by hand.
