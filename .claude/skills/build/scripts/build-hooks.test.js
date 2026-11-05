import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';

import {
  checkEditedFile,
  decideTool,
  isExpectedCommand,
  parseCommand,
  readReport,
  readReportFromTranscript,
} from './build-hooks.js';
import { classifyPath, treeHash } from './shared.js';

const HOOKS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'build-hooks.js',
);

describe('what a build may touch', () => {
  for (const [path, expected] of [
    ['packages/react/src/components/Chip/Chip.tsx', 'allow'],
    ['packages/react/src/components/index.ts', 'allow'],
    ['packages/react/src/index.ts', 'allow'],
    ['brain/standards/props.md', 'ask'],
    ['packages/react/src/types/common.ts', 'ask'],
    ['packages/react/src/components/Other/Other.tsx', 'deny'],
    ['packages/react/src/internal/utils/cx/cx.ts', 'deny'],
    ['packages/react/specs/chip.md', 'deny'],
    ['Packages/React/Specs/chip.md', 'deny'],
    ['packages/react/specs/chip.facts.json', 'deny'],
    ['packages/tokens/src/color.json', 'deny'],
    ['packages/configs/eslint/index.js', 'deny'],
    ['packages/react/package.json', 'deny'],
    ['package.json', 'deny'],
    ['pnpm-lock.yaml', 'deny'],
    ['turbo.json', 'deny'],
    ['AGENTS.md', 'deny'],
    ['.claude/skills/build/SKILL.md', 'deny'],
    ['.claude/settings.json', 'deny'],
    ['node_modules/.cache/build/chip/gates.json', 'deny'],
    ['apps/web/page.tsx', 'deny'],
  ]) {
    it(`${expected}: ${path}`, () => {
      assert.equal(classifyPath(path, 'chip'), expected);
    });
  }
});

describe('shell commands', () => {
  const expected = (command) => {
    const { commands, isUnsafe } = parseCommand(command);
    return (
      !isUnsafe && commands.every((tokens) => isExpectedCommand(tokens, 'chip'))
    );
  };

  for (const command of [
    'git status --short',
    'git add packages/react/src/components/Chip && git commit -m "a; b > c"',
    'git switch -c build/chip',
    'git push -u origin build/chip',
    'pnpm turbo run lint check-types build test --ui=stream',
    'pnpm format:check 2>&1 | tail -3',
    'pnpm --filter @dy/tokens build',
    'pnpm --filter @dy/react test',
    'pnpm exec prettier --write packages/react/src/components/Chip/Chip.tsx',
    'node .claude/skills/build/scripts/run-gates.js --component chip',
    'node --test .claude/skills/build/scripts/*.test.js',
    'grep -n token packages/react/specs/chip.md > /dev/null',
    '/opt/homebrew/bin/gh pr create --draft --title a',
  ]) {
    it(`expects: ${command}`, () => {
      assert.equal(expected(command), true);
    });
  }

  for (const command of [
    'echo hacked > packages/react/specs/chip.md',
    'cat a.md >> b.md',
    'sed -i "" s/a/b/ a.md',
    'cp a.md b.md',
    'rm -rf packages',
    'tee a.md',
    'node -e "1"',
    'node ../outside.js',
    'node .claude/skills/other/scripts/a.js',
    'python3 -c "1"',
    'sh -c "ls"',
    'FOO=1 git status',
    'ls $(rm a.md)',
    'ls `rm a.md`',
    'git status; rm a.md',
    'git status && rm a.md',
    'git status | tee a.md',
    'git commit -F - <<EOF',
    'git -C other status',
    'git checkout main',
    'git switch main',
    'git reset --hard',
    'git stash',
    'git diff --output=a.md',
    'git push origin main',
    'git push -u origin build/other',
    'pnpm add left-pad',
    'pnpm format',
    'pnpm exec prettier --write packages/react/specs/chip.md',
    'find . -delete',
    'find . -exec rm {} ;',
    'gh pr ready',
    'gh pr merge',
    'gh api repos',
  ]) {
    it(`doesn't expect: ${command}`, () => {
      assert.equal(expected(command), false);
    });
  }
});

describe('hook decisions', () => {
  const root = '/repo';
  const decide = (tool, input, overrides = {}) =>
    decideTool({
      tool,
      input,
      component: 'chip',
      mode: 'default',
      root,
      cwd: root,
      run: { staging: false },
      isReadyForPullRequest: () => true,
      findReviewerProblem: () => null,
      ...overrides,
    });

  it('finds a report handed back through a tool, or sent as text', () => {
    const toTranscript = (...content) =>
      JSON.stringify({ type: 'assistant', message: { content } });
    const report = 'REVIEWED: abc\n\nVERDICT: FAIL';

    assert.equal(
      readReportFromTranscript(
        [
          'not json',
          toTranscript({ type: 'text', text: 'VERDICT: PASS' }),
          toTranscript({
            type: 'tool_use',
            name: 'SubagentHandback',
            input: { message: report },
          }),
          JSON.stringify({ type: 'user', message: { content: [] } }),
        ].join('\n'),
      ),
      report,
    );
    assert.equal(
      readReportFromTranscript(toTranscript({ type: 'text', text: report })),
      report,
    );
    assert.equal(
      readReportFromTranscript(
        toTranscript({ type: 'text', text: 'Reading.' }),
      ),
      null,
    );
  });

  describe('reading the report', () => {
    const report = 'REVIEWED: abc\n\nVERDICT: FAIL';
    const toEntry = (part) =>
      JSON.stringify({ type: 'assistant', message: { content: [part] } });
    let directory;
    let reviewerTranscript;
    let authorTranscript;

    before(() => {
      directory = mkdtempSync(join(tmpdir(), 'dy-build-report-'));
      reviewerTranscript = join(directory, 'reviewer.jsonl');
      authorTranscript = join(directory, 'author.jsonl');
      writeFileSync(
        reviewerTranscript,
        toEntry({
          type: 'tool_use',
          name: 'SubagentHandback',
          input: { message: report },
        }),
      );
      writeFileSync(
        authorTranscript,
        toEntry({ type: 'text', text: 'VERDICT: PASS' }),
      );
    });

    after(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    it('reads a handback from the input Claude Code really sends', () => {
      assert.equal(
        readReport({ agent_transcript_path: reviewerTranscript }),
        report,
      );
    });

    it("prefers the reviewer's transcript over its closing text", () => {
      assert.equal(
        readReport({
          agent_transcript_path: reviewerTranscript,
          last_assistant_message: 'All done.',
        }),
        report,
      );
    });

    it('falls back to the final message when the transcript has no report', () => {
      assert.equal(
        readReport({
          agent_transcript_path: join(directory, 'missing.jsonl'),
          last_assistant_message: report,
        }),
        report,
      );
    });

    it("never takes a report from the author's own transcript", () => {
      assert.equal(readReport({ transcript_path: authorTranscript }), null);
    });
  });

  it('asks a person before leaving for a branch, without reading its name as a path', () => {
    assert.equal(
      decide('Bash', { command: 'git switch feat/build-skill' }).decision,
      'ask',
    );
    assert.equal(
      decide('Bash', { command: 'git checkout packages/configs' }).decision,
      'deny',
    );
  });

  it('allows the component and leaves files outside the repo alone', () => {
    assert.equal(
      decide('Write', {
        file_path: '/repo/packages/react/src/components/Chip/Chip.tsx',
      }).decision,
      'allow',
    );
    assert.equal(decide('Write', { file_path: '/tmp/a' }).decision, 'allow');
  });

  it('asks a person about a shared rule', () => {
    const { decision, reason } = decide('Edit', {
      file_path: '/repo/brain/standards/props.md',
    });
    assert.equal(decision, 'ask');
    assert.match(reason, /shared rule/);
  });

  it('denies a shared rule in any mode that may not ask a person', () => {
    for (const mode of [
      'bypassPermissions',
      'acceptEdits',
      'dontAsk',
      'plan',
    ]) {
      const { decision } = decide(
        'Edit',
        { file_path: '/repo/brain/standards/props.md' },
        { mode },
      );
      assert.equal(decision, 'deny', mode);
    }
    assert.equal(
      decide(
        'Edit',
        { file_path: '/repo/brain/standards/props.md' },
        { mode: 'auto' },
      ).decision,
      'ask',
    );
  });

  it('denies a write to a protected file, however it is addressed', () => {
    for (const file_path of [
      '/repo/packages/react/specs/chip.md',
      'packages/react/specs/chip.md',
      '/repo/packages/react/src/../specs/chip.md',
      '/repo/node_modules/.cache/build/chip/gates.json',
    ]) {
      assert.equal(decide('Edit', { file_path }).decision, 'deny', file_path);
    }
    assert.equal(
      decide('NotebookEdit', { notebook_path: '/repo/AGENTS.md' }).decision,
      'deny',
    );
  });

  it('only lets the read-only reviewer start as a subagent', () => {
    assert.equal(
      decide('Agent', { subagent_type: 'component-reviewer' }).decision,
      'allow',
    );
    for (const subagent_type of ['general-purpose', 'claude', undefined]) {
      assert.equal(decide('Agent', { subagent_type }).decision, 'deny');
    }
    assert.equal(decide('Task', {}).decision, 'deny');
  });

  it('refuses a reviewer the review gate rejects, and never resumes one', () => {
    const refused = decide(
      'Agent',
      { subagent_type: 'component-reviewer' },
      { findReviewerProblem: () => 'Not cold.' },
    );
    assert.equal(refused.decision, 'deny');
    assert.equal(refused.reason, 'Not cold.');
    assert.equal(decide('SendMessage', { to: 'reviewer' }).decision, 'deny');
  });

  it('asks a person before resetting the review rounds', () => {
    const command =
      'node .claude/skills/build/scripts/check-review.js --component chip --reset';
    assert.equal(decide('Bash', { command }).decision, 'ask');
    assert.equal(
      decide('Bash', { command }, { mode: 'bypassPermissions' }).decision,
      'deny',
    );
    assert.equal(
      decide('Bash', {
        command:
          'node .claude/skills/build/scripts/check-review.js --component chip',
      }).decision,
      'allow',
    );
    assert.notEqual(
      decide('Bash', { command: `git status && ${command}` }).decision,
      'allow',
    );
  });

  it('asks about an unexpected command and denies one naming a protected path', () => {
    assert.equal(
      decide('Bash', { command: 'pnpm add left-pad' }).decision,
      'ask',
    );
    assert.equal(
      decide(
        'Bash',
        { command: 'pnpm add left-pad' },
        { mode: 'bypassPermissions' },
      ).decision,
      'deny',
    );
    for (const command of [
      'echo hacked > packages/react/specs/chip.md',
      'rm packages/tokens/dist/manifest.json',
      'git checkout -- packages/configs/eslint/index.js',
      'sed -i "" s/a/b/ .claude/skills/build/SKILL.md',
    ]) {
      assert.equal(decide('Bash', { command }).decision, 'deny', command);
    }
  });

  it("allows a build's scripts to name the spec they read", () => {
    assert.equal(
      decide('Bash', {
        command:
          'node .claude/skills/spec/scripts/check-spec.js --spec packages/react/specs/chip.md',
      }).decision,
      'allow',
    );
  });

  it('only opens a draft PR, and only on code that passed the gates', () => {
    const create = 'gh pr create --draft --title a';
    assert.equal(decide('Bash', { command: create }).decision, 'allow');
    assert.equal(
      decide('Bash', { command: 'gh pr create --title a' }).decision,
      'deny',
    );
    const refused = decide(
      'Bash',
      { command: `/opt/homebrew/bin/${create}` },
      { isReadyForPullRequest: () => false },
    );
    assert.equal(refused.decision, 'deny');
    assert.match(refused.reason, /gates and the cold review must pass/);
  });

  it('writes nothing to the component or shared rules before preflight passes', () => {
    for (const file_path of [
      '/repo/packages/react/src/components/Chip/Chip.tsx',
      '/repo/brain/standards/props.md',
    ]) {
      const { decision, reason } = decide(
        'Write',
        { file_path },
        { run: null },
      );
      assert.equal(decision, 'deny');
      assert.match(reason, /preflight/);
    }
  });

  it('commits, pushes and opens nothing in a staging build', () => {
    for (const command of [
      'git commit -m a',
      'git add a.ts && git commit -m a',
      'git push -u origin build/chip',
      'gh pr create --draft --title a',
      '/opt/homebrew/bin/gh pr create --draft --title a',
    ]) {
      const { decision, reason } = decide(
        'Bash',
        { command },
        { run: { staging: true } },
      );
      assert.equal(decision, 'deny', command);
      assert.match(reason, /staging/);
    }
    assert.equal(
      decide(
        'Bash',
        { command: 'git status --short' },
        { run: { staging: true } },
      ).decision,
      'allow',
    );
    assert.equal(
      decide(
        'Write',
        { file_path: '/repo/packages/react/src/components/Chip/Chip.tsx' },
        { run: { staging: true } },
      ).decision,
      'allow',
    );
  });

  it('leaves tools it does not guard alone', () => {
    assert.equal(decide('Read', { file_path: '/repo/a' }).decision, 'allow');
  });
});

describe('the check after an edit', () => {
  const check = (file, source) =>
    checkEditedFile({
      file,
      source,
      expected: new Set(['--dy-color-a']),
      manifestTokens: { 'dy-color-a': {}, 'dy-color-b': {} },
    });

  it('accepts a token the spec lists, even if others are still to come', () => {
    assert.deepEqual(check('Chip.module.css', 'var(--dy-color-a)'), []);
  });

  it('rejects a real token the spec does not list', () => {
    assert.match(
      check('Chip.module.css', 'var(--dy-color-b)')[0],
      /isn't in the spec/,
    );
  });

  it('rejects an invented token, inline styles and bare suppressions', () => {
    assert.match(
      check('Chip.module.css', 'var(--dy-fake)')[0],
      /doesn't exist/,
    );
    assert.match(check('Chip.tsx', '<a style={{}} />')[0], /inline style/);
    assert.match(check('Chip.tsx', '// eslint-disable-next-line')[0], /GEN-01/);
  });

  it('lets a story show any real token, but not an invented one', () => {
    assert.deepEqual(check('Chip.stories.tsx', 'var(--dy-color-b)'), []);
    assert.match(
      check('Chip.stories.tsx', 'var(--dy-fake)')[0],
      /doesn't exist/,
    );
  });
});

describe('the hooks, as Claude Code runs them', () => {
  const COMPONENT = 'packages/react/src/components/Chip';
  const SPEC =
    '---\ncomponent: Chip\n---\n\n## Out of scope\n\n## Figma tokens\n\n| Layer | Property | When | Token | Source |\n| :-- | :-- | :-- | :-- | :-- |\n| root | fill | all | `--dy-color-a` | figma |\n';
  let repo;

  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  const write = (file, content) => {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), content);
  };
  const runHook = (event, input, stdin) => {
    const result = spawnSync('node', [HOOKS, event], {
      cwd: repo,
      encoding: 'utf8',
      input:
        stdin ??
        JSON.stringify({ cwd: repo, permission_mode: 'default', ...input }),
    });
    return {
      status: result.status,
      output: result.stdout ? JSON.parse(result.stdout) : null,
      stderr: result.stderr,
    };
  };
  const inRepo = (callback) => {
    const previous = process.cwd();
    process.chdir(repo);
    try {
      return callback();
    } finally {
      process.chdir(previous);
    }
  };

  before(() => {
    repo = realpathSync(mkdtempSync(join(tmpdir(), 'dy-build-hooks-')));
    git('init', '--quiet', '-b', 'main');
    write('.gitignore', 'node_modules\n');
    write('packages/react/specs/chip.md', SPEC);
    write('packages/tokens/dist/manifest.json', '{"tokens":{"dy-color-a":{}}}');
    write('packages/react/src/types/common.ts', 'export {};\n');
    git('add', '-A');
    git(
      '-c',
      'user.name=fixture',
      '-c',
      'user.email=fixture@example.com',
      'commit',
      '--quiet',
      '--no-gpg-sign',
      '-m',
      'base',
    );
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('does nothing outside a build branch', () => {
    const { status, output } = runHook('pre', {
      tool_name: 'Write',
      tool_input: { file_path: join(repo, 'packages/react/specs/chip.md') },
    });
    assert.equal(status, 0);
    assert.equal(output, null);
  });

  it('blocks when the hook itself fails', () => {
    const { status, stderr } = runHook('pre', {}, 'not json');
    assert.equal(status, 2);
    assert.match(stderr, /build-hooks/);
  });

  describe('on a build branch', () => {
    before(() => {
      git('switch', '--quiet', '-c', 'build/chip');
      write(
        'node_modules/.cache/build/chip/run.json',
        JSON.stringify({ staging: false, step: false, base: 'origin/main' }),
      );
    });

    it('denies a component write until preflight has recorded a pass', () => {
      const run = join(repo, 'node_modules/.cache/build/chip/run.json');
      const saved = readFileSync(run, 'utf8');
      rmSync(run);
      const { output } = runHook('pre', {
        tool_name: 'Write',
        tool_input: { file_path: join(repo, `${COMPONENT}/Chip.tsx`) },
      });
      writeFileSync(run, saved);
      assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
      assert.match(
        output.hookSpecificOutput.permissionDecisionReason,
        /preflight/,
      );
    });

    it('denies a commit when preflight recorded a staging build', () => {
      const run = join(repo, 'node_modules/.cache/build/chip/run.json');
      const saved = readFileSync(run, 'utf8');
      writeFileSync(run, JSON.stringify({ staging: true }));
      const { output } = runHook('pre', {
        tool_name: 'Bash',
        tool_input: { command: 'git commit -m a' },
      });
      writeFileSync(run, saved);
      assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
    });

    it('denies a protected file', () => {
      const { output } = runHook('pre', {
        tool_name: 'Write',
        tool_input: { file_path: join(repo, 'packages/react/specs/chip.md') },
      });
      assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
    });

    it('sees through a symlink to a protected file', () => {
      symlinkSync(
        join(repo, 'packages/react/specs/chip.md'),
        join(tmpdir(), `dy-link-${process.pid}.md`),
      );
      try {
        const { output } = runHook('pre', {
          tool_name: 'Write',
          tool_input: {
            file_path: join(tmpdir(), `dy-link-${process.pid}.md`),
          },
        });
        assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
      } finally {
        rmSync(join(tmpdir(), `dy-link-${process.pid}.md`));
      }
    });

    it('asks about a shared rule, then records only what passed the prompt', () => {
      const file = join(repo, 'packages/react/src/types/common.ts');
      const pre = runHook('pre', {
        tool_name: 'Edit',
        tool_input: { file_path: file },
      });
      assert.equal(pre.output.hookSpecificOutput.permissionDecision, 'ask');

      runHook('post', { tool_name: 'Edit', tool_input: { file_path: file } });
      const approvals = JSON.parse(
        readFileSync(
          join(repo, 'node_modules/.cache/build/chip/approvals.json'),
          'utf8',
        ),
      );
      assert.ok(approvals['packages/react/src/types/common.ts']);
    });

    it('feeds problems back after an edit', () => {
      write(`${COMPONENT}/Chip.module.css`, '.a { color: var(--dy-fake); }\n');
      const { output } = runHook('post', {
        tool_name: 'Write',
        tool_input: { file_path: join(repo, `${COMPONENT}/Chip.module.css`) },
      });
      assert.equal(output.decision, 'block');
      assert.match(output.reason, /--dy-fake/);
    });

    it('stays quiet after a clean edit', () => {
      write(
        `${COMPONENT}/Chip.module.css`,
        '.a { color: var(--dy-color-a); }\n',
      );
      const { output } = runHook('post', {
        tool_name: 'Write',
        tool_input: { file_path: join(repo, `${COMPONENT}/Chip.module.css`) },
      });
      assert.equal(output, null);
    });

    it('pushes back once on stopping with red gates, then warns Daniel', () => {
      const first = runHook('stop', { stop_hook_active: false });
      assert.equal(first.output.decision, 'block');
      assert.match(first.output.reason, /run-gates/);

      const second = runHook('stop', { stop_hook_active: true });
      assert.equal(second.output.decision, undefined);
      assert.match(second.output.systemMessage, /without passing gates/);
    });

    it('lets a stated pause through, and tells Daniel why', () => {
      const pause = spawnSync(
        'node',
        [HOOKS, 'pause', '--reason', 'The spec is silent on focus'],
        { cwd: repo, encoding: 'utf8' },
      );
      assert.equal(pause.status, 0, pause.stderr);

      const { output } = runHook('stop', { stop_hook_active: false });
      assert.match(output.systemMessage, /The spec is silent on focus/);
      assert.equal(output.decision, undefined);
    });

    it('stops honoring a pause once the code changes', () => {
      write(`${COMPONENT}/Chip.tsx`, 'export {};\n');
      const { output } = runHook('stop', { stop_hook_active: false });
      assert.equal(output.decision, 'block');
    });

    it('stays quiet when the gates passed on this exact code', () => {
      write(
        'node_modules/.cache/build/chip/gates.json',
        JSON.stringify({ passed: true, treeHash: inRepo(treeHash) }),
      );
      const { status, output } = runHook('stop', { stop_hook_active: false });
      assert.equal(status, 0);
      assert.equal(output, null);
    });

    describe('saving a report', () => {
      const CACHE = 'node_modules/.cache/build/chip';
      const readState = () =>
        JSON.parse(readFileSync(join(repo, `${CACHE}/rounds.json`), 'utf8'));
      const failingReport = () =>
        `REVIEWED: ${inRepo(treeHash)}\n\n| ID | Verdict | Evidence |\n| B1 | FAIL | packages/react/specs/chip.md:1 |\n\nVERDICT: FAIL\n`;

      before(() => {
        write(
          `${CACHE}/ledger.json`,
          JSON.stringify([{ id: 'B1', section: 'A', requirement: 'B' }]),
        );
      });

      after(() => {
        rmSync(join(repo, CACHE), { recursive: true, force: true });
      });

      it('saves the final message itself, numbering each report', () => {
        for (const number of [1, 2]) {
          runHook('review', { last_assistant_message: `Report ${number}` });
          assert.equal(
            readFileSync(join(repo, `${CACHE}/report-${number}.md`), 'utf8'),
            `Report ${number}`,
          );
        }
      });

      it('records an unusable report as invalid, not as a round', () => {
        assert.deepEqual(readState().invalid, ['report-1.md', 'report-2.md']);
        assert.deepEqual(readState().rounds, []);
      });

      it('counts a failed round at once, even if the code then changes', () => {
        rmSync(join(repo, `${CACHE}/rounds.json`));
        runHook('review', { last_assistant_message: failingReport() });
        write(`${COMPONENT}/Chip.tsx`, 'export const fixed = 1;\n');
        const { rounds, invalid } = readState();
        assert.equal(rounds.length, 1);
        assert.equal(rounds[0].verdict, 'FAIL');
        assert.deepEqual(invalid, []);

        const recheck = spawnSync(
          'node',
          [
            HOOKS.replace('build-hooks.js', 'check-review.js'),
            '--component',
            'chip',
          ],
          { cwd: repo, encoding: 'utf8' },
        );
        assert.match(recheck.stdout, /RESULT: INVALID/);
        assert.equal(readState().rounds.length, 1);
        assert.deepEqual(readState().invalid, []);
      });
    });

    it('never traps a reviewer when saving its report fails', () => {
      const { status } = runHook('review', {}, 'not json');
      assert.equal(status, 1);
    });

    describe('starting a reviewer', () => {
      const CACHE = 'node_modules/.cache/build/chip';
      const PROMPT = 'Spec: a.md\nBundle: b.md\nFacts: c.json';
      const startReviewer = (overrides = {}) =>
        runHook('pre', {
          tool_name: 'Agent',
          tool_input: {
            subagent_type: 'component-reviewer',
            prompt: PROMPT,
            ...overrides,
          },
        }).output?.hookSpecificOutput;
      const setGates = () => {
        write(
          `${CACHE}/gates.json`,
          JSON.stringify({ passed: true, treeHash: inRepo(treeHash) }),
        );
      };

      it('refuses before the gates pass on this code', () => {
        write(`${CACHE}/gates.json`, JSON.stringify({ passed: false }));
        assert.match(
          startReviewer().permissionDecisionReason,
          /gates must pass/,
        );
      });

      it('refuses without the generated prompt', () => {
        setGates();
        assert.match(startReviewer().permissionDecisionReason, /build-ledger/);
      });

      it('allows only the exact generated prompt', () => {
        write(`${CACHE}/reviewer-prompt.txt`, PROMPT);
        setGates();
        assert.equal(startReviewer(), undefined);
        assert.match(
          startReviewer({
            prompt: `${PROMPT}\nThe author says this is fine.`,
          }).permissionDecisionReason,
          /exactly the prompt/,
        );
      });

      it('refuses a model override', () => {
        assert.match(
          startReviewer({ model: 'haiku' }).permissionDecisionReason,
          /model its definition sets/,
        );
      });

      it('refuses another reviewer while a report is unrecorded', () => {
        write(`${CACHE}/report-1.md`, 'A report no one checked.');
        assert.match(
          startReviewer().permissionDecisionReason,
          /report-1\.md hasn't been recorded/,
        );
        rmSync(join(repo, `${CACHE}/report-1.md`));
      });

      it('refuses a fourth reviewer', () => {
        const failed = (file) => ({
          file,
          verdict: 'FAIL',
          treeHash: 'old',
          flagged: ['B1'],
        });
        write(
          `${CACHE}/rounds.json`,
          JSON.stringify({
            rounds: ['a', 'b', 'c'].map(failed),
            invalid: [],
            history: [],
            resets: 0,
          }),
        );
        assert.match(
          startReviewer().permissionDecisionReason,
          /3 review rounds have failed/,
        );
      });
    });

    describe('opening a pull request', () => {
      const CACHE = 'node_modules/.cache/build/chip';
      const openPullRequest = () =>
        runHook('pre', {
          tool_name: 'Bash',
          tool_input: { command: 'gh pr create --draft --title a' },
        }).output?.hookSpecificOutput;

      it('refuses when the gates passed but the review did not', () => {
        write(
          `${CACHE}/gates.json`,
          JSON.stringify({ passed: true, treeHash: inRepo(treeHash) }),
        );
        write(
          `${CACHE}/rounds.json`,
          JSON.stringify({
            rounds: [
              {
                file: 'a',
                verdict: 'FAIL',
                treeHash: inRepo(treeHash),
                flagged: ['B1'],
              },
            ],
            invalid: [],
            history: [],
            resets: 0,
          }),
        );
        assert.equal(openPullRequest().permissionDecision, 'deny');
      });

      it('allows it when both passed this exact code', () => {
        write(
          `${CACHE}/rounds.json`,
          JSON.stringify({
            rounds: [
              {
                file: 'a',
                verdict: 'PASS',
                treeHash: inRepo(treeHash),
                flagged: [],
              },
            ],
            invalid: [],
            history: [],
            resets: 0,
          }),
        );
        assert.equal(openPullRequest(), undefined);
      });
    });

    it('refuses a PR once the code moves on from the gates', () => {
      write(`${COMPONENT}/Chip.tsx`, 'export const moved = 1;\n');
      const { output } = runHook('pre', {
        tool_name: 'Bash',
        tool_input: { command: 'gh pr create --draft --title a' },
      });
      assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
    });
  });
});
