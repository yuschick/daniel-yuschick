#!/usr/bin/env node
import { spawn } from 'node:child_process';

import { nodeTestArguments } from '../node-test.js';

/**
 * `dy-node-test [flags]`: runs `node --test` with the shared flags. The child
 * shares this terminal, and its exit code, or the signal that stopped it,
 * becomes this process's own.
 */
const child = spawn(
  process.execPath,
  nodeTestArguments(process.argv.slice(2)),
  { stdio: 'inherit' },
);

child.on('error', (error) => {
  process.stderr.write(`dy-node-test: ${error.message}\n`);
  process.exitCode = 1;
});

child.on('close', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
