import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/*
 ** Claude Code calls this, not build-hooks.js. It imports nothing from the skill,
 ** so a half-finished edit to the hooks can't lock a session that isn't building:
 ** off a `build/*` branch it stops here, and on one a crash still blocks.
 */

const BUILD_HOOKS = fileURLToPath(new URL('build-hooks.js', import.meta.url));
const stdin = readFileSync(0, 'utf8');

function readCwd() {
  try {
    return JSON.parse(stdin).cwd;
  } catch {
    return undefined;
  }
}

const cwd = readCwd();
const { stdout: branch } = spawnSync('git', ['branch', '--show-current'], {
  cwd,
  encoding: 'utf8',
});

// Unreadable input goes to the hooks, which fail closed on it.
if (cwd === undefined || /^build\//.test(branch.trim())) {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [BUILD_HOOKS, ...process.argv.slice(2)],
    { encoding: 'utf8', input: stdin },
  );
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  process.exitCode = status ?? 2;
}
