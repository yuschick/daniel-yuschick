import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';

import { parseSections } from '../../_shared/scripts/handoff.js';
import { project } from '../../_shared/scripts/project.js';
import {
  buildCommands,
  checkHandoff,
  decideGuard,
  readyPath,
  renderBody,
  shellQuote,
  verifyBranch,
} from './pr.js';

const HEAD = 'a'.repeat(40);
const HANDOFF = {
  skill: 'spec',
  branch: 'spec/chip',
  head: HEAD,
  base: 'main',
  title: 'docs(specs): add Chip spec',
  draft: false,
  body: { "What's Changed": 'Adds the Chip spec.' },
};
const current = { branch: 'spec/chip', head: HEAD };

describe('the handoff', () => {
  it('accepts a handoff for this branch at this commit', () => {
    assert.deepEqual(checkHandoff(HANDOFF, current), []);
  });

  it('refuses a branch that moved since the handoff', () => {
    const [error] = checkHandoff(HANDOFF, { ...current, head: 'b'.repeat(40) });
    assert.match(error, /moved since the handoff/);
  });

  it('refuses another branch’s handoff, or another skill’s branch', () => {
    assert.ok(
      checkHandoff(HANDOFF, { ...current, branch: 'spec/tag' }).length > 0,
    );
    assert.ok(
      checkHandoff(
        { ...HANDOFF, skill: 'implement', draft: true },
        current,
      ).some((error) => /implement\/ branch/.test(error)),
    );
  });

  it('lets /retro hand off a session’s own branch', () => {
    assert.deepEqual(
      checkHandoff(
        { ...HANDOFF, skill: 'retro', branch: 'feat/x' },
        { ...current, branch: 'feat/x' },
      ),
      [],
    );
  });

  it('keeps a build’s PR a draft', () => {
    const build = {
      ...HANDOFF,
      skill: 'implement',
      branch: 'implement/chip',
      draft: false,
    };
    assert.ok(
      checkHandoff(build, { ...current, branch: 'implement/chip' }).some(
        (error) => /draft/.test(error),
      ),
    );
  });

  it('refuses a missing field or an unknown skill', () => {
    assert.ok(checkHandoff({ ...HANDOFF, title: '' }, current).length > 0);
    assert.ok(checkHandoff({ ...HANDOFF, skill: 'grill' }, current).length > 0);
    assert.ok(checkHandoff({ ...HANDOFF, body: {} }, current).length > 0);
  });

  it('reads a body’s sections in order and refuses text before the first', () => {
    assert.deepEqual(
      parseSections(
        "## What's Changed\n\nA.\n\n## Decisions\n\n- D1\n\n## Empty\n",
      ),
      {
        "What's Changed": 'A.',
        Decisions: '- D1',
      },
    );
    assert.throws(() => parseSections('Intro\n## A\nB'));
  });
});

describe('verifying a branch', () => {
  const passing = () => ({ status: 0, output: '' });
  const failing = () => ({ status: 1, output: 'boom' });

  it('checks a token sync by building the tokens, never a handoff command', async () => {
    const commands = [];
    const run = (command) => (commands.push(command), passing());
    await verifyBranch({ skill: 'sync-tokens', branch: 'tokens/sync-1', run });
    assert.deepEqual(commands, [project.commands.buildTokens]);
  });

  it('runs the repo checks for a retro or a branch no skill handed off', async () => {
    for (const skill of ['retro', null]) {
      const commands = [];
      await verifyBranch({
        skill,
        branch: 'x/y',
        run: (command) => (commands.push(command), passing()),
      });
      assert.deepEqual(commands, project.commands.verify);
    }
  });

  it('reports a failing command with its output', async () => {
    const [check] = await verifyBranch({
      skill: 'sync-tokens',
      branch: 'tokens/sync-1',
      run: failing,
    });
    assert.match(check.errors[0], /failed:\nboom/);
  });

  it('refuses a build without gates and a passing review on this code', async () => {
    const checks = await verifyBranch({
      skill: 'implement',
      branch: 'implement/zz-no-such-build',
    });
    assert.deepEqual(
      checks.map(({ errors }) => errors.length > 0),
      [true, true],
    );
  });
});

describe('the PR body', () => {
  const template =
    "## ✨ What's Changed?\n\n_List it._\n\n## 💡 Context & Background\n\n_Why._\n\n## 🎨 Figma\n\n_Link._\n";

  it('fills template sections by heading, drops empty ones and appends the rest', () => {
    const body = renderBody({
      template,
      body: {
        Decisions: '- D1',
        "What's changed": 'A spec.',
        'Context and background': 'Because.',
      },
      footer: 'Generated.',
    });
    assert.equal(
      body,
      "## ✨ What's Changed?\n\nA spec.\n\n## Decisions\n\n- D1\n\n## Context and background\n\nBecause.\n\nGenerated.\n",
    );
  });

  it('matches headings regardless of emoji, case and punctuation', () => {
    const body = renderBody({
      template,
      body: { 'context & background': 'Why.' },
    });
    assert.match(body, /^## 💡 Context & Background\n\nWhy\.\n$/);
  });
});

describe('the commands', () => {
  it('quotes a title so the shell sees it whole', () => {
    assert.equal(shellQuote("it's"), `'it'\\''s'`);
  });

  it('builds the push and the PR, with --draft only for drafts', () => {
    const [push, pr] = buildCommands({
      gh: 'gh',
      branch: 'spec/chip',
      base: 'main',
      title: 'T',
      draft: false,
      bodyPath: 'b.md',
    });
    assert.equal(push, 'git push -u origin spec/chip');
    assert.equal(
      pr,
      "gh pr create --base main --head spec/chip --title 'T' --body-file b.md",
    );
    assert.match(
      buildCommands({
        gh: 'gh',
        branch: 'b',
        base: 'main',
        title: 'T',
        draft: true,
        bodyPath: 'b.md',
      })[1],
      / --draft$/,
    );
  });
});

describe('the guard', () => {
  const commands = buildCommands({
    gh: 'gh',
    branch: 'spec/chip',
    base: 'main',
    title: 'T',
    draft: false,
    bodyPath: 'b.md',
  });
  const ready = { branch: 'spec/chip', head: HEAD, commands };
  const guard = (command, overrides = {}) =>
    decideGuard({
      command,
      ready,
      branch: 'spec/chip',
      head: HEAD,
      ...overrides,
    })?.decision ?? 'allow';

  it('lets anything but a push or a PR through', () => {
    assert.equal(guard('git status', { ready: null }), 'allow');
    assert.equal(guard('pnpm turbo run lint', { ready: null }), 'allow');
  });

  it('allows exactly the printed commands on the verified commit', () => {
    assert.equal(guard(commands[0]), 'allow');
    assert.equal(guard(` ${commands[1]} `), 'allow');
  });

  it('denies a push or PR before prepare, after a move, or with other words', () => {
    assert.equal(guard(commands[0], { ready: null }), 'deny');
    assert.equal(guard(commands[0], { head: 'b'.repeat(40) }), 'deny');
    assert.equal(guard(commands[0], { branch: 'spec/tag' }), 'deny');
    assert.equal(guard('git push --force -u origin spec/chip'), 'deny');
    assert.equal(guard(`${commands[1]} --draft`), 'deny');
    assert.equal(guard(`git status && ${commands[0]}`), 'deny');
    assert.equal(guard('/opt/homebrew/bin/gh pr create --fill'), 'deny');
  });
});

describe('the guard, as Claude Code runs it', () => {
  const HOOK = fileURLToPath(new URL('pr-hooks.js', import.meta.url));
  let repo;
  const git = (...args) =>
    spawnSync('git', args, { cwd: repo, encoding: 'utf8' }).stdout.trim();
  before(() => {
    repo = realpathSync(mkdtempSync(join(tmpdir(), 'dy-pr-')));
    git('init', '--quiet', '-b', 'spec/chip');
    git(
      '-c',
      'user.email=a@b',
      '-c',
      'user.name=A',
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'x',
    );
  });
  after(() => rmSync(repo, { recursive: true, force: true }));

  const run = (command) =>
    spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({
        cwd: repo,
        tool_name: 'Bash',
        tool_input: { command },
      }),
      encoding: 'utf8',
    }).stdout;

  it('denies a push with nothing verified', () => {
    assert.equal(
      JSON.parse(run('git push -u origin spec/chip')).hookSpecificOutput
        .permissionDecision,
      'deny',
    );
  });

  it('allows the verified push and stays silent on other commands', () => {
    const path = join(repo, readyPath('spec/chip'));
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify({
        branch: 'spec/chip',
        head: git('rev-parse', 'HEAD'),
        commands: ['git push -u origin spec/chip'],
      }),
    );
    assert.equal(run('git push -u origin spec/chip'), '');
    assert.equal(run('ls'), '');
    assert.match(readFileSync(path, 'utf8'), /spec\/chip/);
  });

  it('fails closed on unreadable input', () => {
    const { stdout } = spawnSync(process.execPath, [HOOK], {
      input: '{nope',
      encoding: 'utf8',
    });
    assert.equal(
      JSON.parse(stdout).hookSpecificOutput.permissionDecision,
      'deny',
    );
  });
});
