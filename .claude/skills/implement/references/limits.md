# Limits

What `/implement` can't prove, or proves only in part.

- The component checks and the cold review run only locally, so they detect problems rather than block a merge. CI repeats the rest and blocks.
- `--step` relies on you stopping. The hooks can't tell which stage you're in, so it's advisory.
- `--staging` proves the flow, not delivery: pushing, CI and the PR itself stay untested until a real build.
- A staging run answers for what changed since its preflight. To try a change to this skill, stash the staging work, `git switch` to the skill branch (the hook prompts the approver), commit the change, point `implement/<component>` at it and rerun preflight, which clears the earlier run's cache.
- A build trusts the approved spec, so it won't notice Figma changing after approval. Rerunning `/spec` catches that.
- Pre-approved tools last only until the approver's next message, so after a `--step` pause, commands may prompt them.
- The hooks recognize shell commands, not every effect they can have, so a build script or a command the approver approves could still write somewhere protected. The scope gate catches that afterwards.
- Approvals and gate results live in `node_modules/.cache`. Hooks deny the file tools there, but a shell command the approver approves could still change them.
- Claude Code's docs don't list skill hooks as running inside subagents, which is why only the read-only reviewer may start.
- The suppression check confirms an issue is cited, not that the issue exists.
- The API check covers the component's own props. It can't see attributes set inside the component or names exported beside it, which rest on the cold review.
- Inline styles have no exception yet. A component that truly needs one has to raise it with the approver, and the check changes through its own PR.
- `Conformance` checks styles the facts describe. Layout, wrapping and behavior rest on the other stories and the review.
- Forced pseudo-states prove the CSS for each state, not real pointer input, so behavior stories should still use `userEvent`.
- The reviewer's report depends on a `SubagentStop` hook in `.claude/settings.json`, because the same hook in this skill's frontmatter never fired for the reviewer. It only runs once the workspace is trusted, and it reads the handback from the reviewer's own transcript. If it doesn't run, the build stops rather than falling back to the author.
- The script checks that evidence exists, not that it supports the verdict. An `absent:` claim is only as good as the term the reviewer chose.
- A passing review is supporting evidence, not a guarantee. It doesn't replace the human review.
