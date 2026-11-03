---
name: figma-to-code
description: Build design system code from a Figma component, section or page without inventing anything. Run only when Daniel invokes /figma-to-code. Currently covers phase 1, extracting and checking the facts.
disable-model-invocation: true
argument-hint: '<figma-url>'
allowed-tools: Bash(date *) Bash(mkdir -p node_modules/.cache/figma-to-code/*) Bash(node .claude/skills/figma-to-code/scripts/*) Bash(pnpm --filter @dy/tokens build) mcp__claude_ai_Figma__create_session mcp__claude_ai_Figma__get_figma_skill mcp__claude_ai_Figma__get_screenshot mcp__claude_ai_Figma__use_figma
---

# Figma to code

Turns a Figma frame into code that uses only the real design system. This skill follows the AI rails loop: facts, spec, build, Steel Curtain, then a pull request. It's built one phase at a time, and **only phase 1 exists so far**. Stop after it and report; never continue into a later phase from memory.

## The rule behind every phase

**Uncertainty is a question to Daniel, never a guess.** If Figma, the tokens, or `brain/standards/` don't settle something, stop that part of the work and ask, with a recommendation and its trade-off. Nothing may enter later phases unless a source supports it: Figma facts, the tokens, a standard, or Daniel's answer.

- Figma wins on names, and `A11Y-*` wins over everything, including Figma.
- A Figma description is a statement of intent, not a fact. Where it disagrees with the extracted facts or a standard, ask.
- Figma's `search_design_system` only covers published libraries, so an empty result doesn't prove a component is missing.

## Phase 1: Facts

Establish what Figma says and whether it can be trusted.

1. **Stop if Figma is unreachable.** Parse the file key and node ID from the URL (`148-2149` becomes `148:2149`). Call `create_session`, then load the `figma-use` skill before the first `use_figma` call. If Figma can't be reached, stop and say so; don't work from memory or screenshots.
2. **Check the tokens are current.** Run `pnpm --filter @dy/tokens build`. If Figma and `packages/tokens` may have drifted, ask Daniel about running `/sync-tokens` first.
3. **Extract.** Run [scripts/extract-component.js](scripts/extract-component.js) with `__NODE_ID__` replaced. It's read-only, and it reports what each layer uses, as `token:<name>` or `raw:<value>`, and which variant axes each value depends on.
4. **Save.** Use a new `<run>` (`date +%Y%m%d-%H%M`), run `mkdir -p node_modules/.cache/figma-to-code/<run>`, and save the complete result, unchanged, to `node_modules/.cache/figma-to-code/<run>/facts.json`. Never edit, reformat or summarize it.
5. **Check.**

   ```sh
   node .claude/skills/figma-to-code/scripts/check-facts.js --facts node_modules/.cache/figma-to-code/<run>/facts.json
   ```

   - **`ERROR`**: the facts can't be trusted. Stop and report. Re-extract only if the hash failed; don't work around anything else.
   - **`QUESTION`**: a gap only Daniel can decide. Keep the list for the spec.

6. **Look.** Call `get_screenshot` on the node to compare with the facts. An image never overrides them, but a visible disagreement is a question.

Report the run directory, the variant count, the axes and what each value depends on, and every question, each with your recommendation. Then stop.

## Limits of phase 1

- It accepts a component or component set only. Any other node type stops the extractor; sections and pages arrive in a later phase.
- Hidden layers are listed, not summarized, so anything inside them needs a question before it's used.
- The checker can't tell whether a token is the right choice, only that it exists.
- Figma results are capped at 48KB. A component over that limit fails rather than truncating, and the extractor would need to split its output.
