import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/*
 ** Claude Code runs this before tools (`pre`, from the skill) and when a
 ** reviewer stops (`save`, from settings.json). Nothing happens unless a review
 ** is waiting for its reviewer, so it costs nothing in any other session, and
 ** review.js is only loaded once a review is active.
 */

const MARKER = 'node_modules/.cache/review/active.json';
const event = process.argv[2];

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function findRoot(cwd) {
  const { status, stdout } = spawnSync(
    'git',
    ['rev-parse', '--show-toplevel'],
    {
      cwd,
      encoding: 'utf8',
    },
  );
  return status === 0 ? stdout.trim() : null;
}

const input = readInput();
const root =
  findRoot(input?.cwd ?? process.cwd()) ?? process.env.CLAUDE_PROJECT_DIR;

if (root && existsSync(resolve(root, MARKER))) {
  const { decidePre, readMarker, saveReport } = await import('./review.js');
  const marker = readMarker(root);

  if (event === 'pre') {
    // Unreadable input during a review fails closed.
    const result =
      input === null
        ? {
            decision: 'deny',
            reason: "The review hook couldn't read this tool call.",
          }
        : decidePre({
            toolName: input.tool_name,
            toolInput: input.tool_input ?? {},
            marker,
            root,
          });
    if (result) {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: result.decision,
            permissionDecisionReason: result.reason,
          },
        }),
      );
    }
  } else if (event === 'save') {
    saveReport({
      // Unreadable input still ends the review, with the cause recorded.
      input: input ?? { error: 'unreadable hook input' },
      marker,
      root,
    });
  }
}
