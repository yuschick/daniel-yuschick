import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/*
 ** Runs before every shell command once /pr is used in a session. Only a push or
 ** `pr create` is judged, and if judging fails for any reason, it's denied:
 ** the one thing this hook must never do is let unverified work leave.
 */

const OUTBOUND = /\bgit\s+push\b|\bpr\s+create\b/;

function deny(reason) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
}

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

const input = readInput();
const command = String(input?.tool_input?.command ?? '');

if (input === null) {
  deny("The /pr guard couldn't read this tool call.");
} else if (input.tool_name === 'Bash' && OUTBOUND.test(command)) {
  try {
    const git = (args) =>
      spawnSync('git', args, {
        cwd: input.cwd,
        encoding: 'utf8',
      }).stdout.trim();
    const root = git(['rev-parse', '--show-toplevel']);
    const branch = git(['branch', '--show-current']);
    const head = git(['rev-parse', 'HEAD']);
    const { decideGuard, readyPath } = await import('./pr.js');
    const path = resolve(root, readyPath(branch));
    const ready = existsSync(path)
      ? JSON.parse(readFileSync(path, 'utf8'))
      : null;
    const result = decideGuard({ command, ready, branch, head });
    if (result) deny(result.reason);
  } catch (error) {
    deny(
      `The /pr guard failed, so the command is denied: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
