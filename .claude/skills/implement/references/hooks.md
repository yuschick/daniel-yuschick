# The hooks

On an `implement/*` branch, Claude Code runs [../scripts/implement-hooks.js](../scripts/implement-hooks.js), through [../scripts/run-hooks.js](../scripts/run-hooks.js), around your tools, so these aren't choices you make:

- **Before a tool runs.** The component folder and barrels are open. A shared rule, meaning `<paths.standards>/` or `<paths.typeRegistry>/`, prompts the approver for each edit, because only a person can change one. Everything else is denied, including specs, facts, tokens, configs, dependency files and the skills. Other shell commands prompt the approver, or are denied if they name a protected path, so use the commands in this skill and `git commit -m`. The only subagent you may start is `component-reviewer`, and a PR must be a draft on code that passed the gates.
- **After each edit.** The tokens, styles and suppressions in that file are checked, and a style sheet is also run through the package's own Stylelint. Any problem comes straight back to you, so fix it before moving on. ESLint runs at the gates, so half-finished TypeScript isn't judged. To lint sooner, run `pnpm turbo run lint --filter=<packages.components>`, because a command that names a package any other way is denied.
- **Before you finish.** You can't end a turn with the code ahead of the gates without saying why. If you need the approver, say so first, which also tells them directly:

  ```sh
  node .claude/skills/implement/scripts/implement-hooks.js pause --reason "<why>"
  ```

Never try to get around a denial. It means the work has gone outside the build, so stop and ask the approver.
