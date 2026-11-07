# Report template

Write the report in the conversation, in this shape. Leave out a section that has nothing in it, except Findings, which says `None.` when empty.

```markdown
## Retro: <the session's topic, or PR #<number>: <title>>

### Findings

1. **<A short claim>.** `<destination>` · <control now> → <control proposed> · <small | follow-up>
   - **Evidence:** <what happened, with a reference: a message, a check's output, a file and line, a review round>
   - **Proposal:** <the exact change for a small finding, or the next step and the question it settles for a follow-up>

### Working well

- <What to keep, and the evidence it worked.> At most 3.

### Takeaways

- <A concept from the session worth reaffirming, tied to the moment it showed up.> 2 or 3, a sentence or two each.

### Park note

<Only if the work is unfinished: where it stands, what's uncommitted, and the exact next step.>
```

A hypothetical finding, to show the shape:

> 1. **AGENTS.md still tells agents to run `/build` after it was renamed `/implement`.** `agents-md` · advisory → advisory · small
>    - **Evidence:** the session started `/build`, which no longer exists, after reading the Spec before build section of `AGENTS.md`.
>    - **Proposal:** replace `/build <component>` with `/implement <component>` in that section.

And a hypothetical takeaway:

> - A hook enforces what an instruction only asks for: a scope written in `SKILL.md` is advisory, but a `PreToolUse` hook that denies the edit makes it detecting.
