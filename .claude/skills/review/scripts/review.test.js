import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
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

import { listGates } from '../../_shared/scripts/run-gates.js';
import {
  decidePre,
  findBranchProblem,
  MARKER,
  parseSpecReport,
  readMarker,
  readTarget,
  saveReport,
  SCRIPTS,
  targetPaths,
  writeMarker,
} from './review.js';

const ROOT = '/repo';
const MARKED = {
  kind: 'component',
  name: 'chip',
  cache: 'node_modules/.cache/review/chip',
  reviewer: 'component-reviewer',
  prompt: 'Spec: a\nBundle: b\nFacts: c',
};
const pre = (toolName, toolInput, marker = MARKED) =>
  decidePre({ toolName, toolInput, marker, root: ROOT })?.decision ?? 'allow';

describe('review targets', () => {
  it('keeps a spec review and a component review of one name apart', () => {
    assert.notEqual(
      targetPaths('spec', 'chip').cache,
      targetPaths('component', 'chip').cache,
    );
    assert.match(
      targetPaths('component', 'chip').cache,
      /\.cache\/review\/chip$/,
    );
  });

  it('takes exactly one of --component or --spec', () => {
    assert.deepEqual(readTarget({ spec: 'chip' }), {
      kind: 'spec',
      name: 'chip',
    });
    assert.throws(() => readTarget({}));
    assert.throws(() => readTarget({ spec: 'chip', component: 'chip' }));
  });

  it('refuses a build branch, whose own review would count this one', () => {
    assert.ok(findBranchProblem('implement/chip'));
    assert.equal(findBranchProblem('fix/chip-focus'), null);
  });

  it('runs the gates through the calling skill’s scripts', () => {
    const gates = listGates({
      component: 'chip',
      base: 'origin/main',
      scripts: SCRIPTS,
    });
    assert.match(
      gates[1].command,
      /review\/scripts\/preflight\.js --component chip --approval-only/,
    );
    assert.match(
      gates[2].command,
      /review\/scripts\/check-component\.js --component chip/,
    );
    assert.match(gates[0].command, /skills\/\*\/scripts\/\*\.test\.js/);
  });
});

describe('the guard while a reviewer is due', () => {
  it('does nothing when no review is waiting', () => {
    assert.equal(
      pre('Write', { file_path: `${ROOT}/${MARKER}` }, null),
      'allow',
    );
    assert.equal(
      pre('Agent', { subagent_type: 'general-purpose' }, null),
      'allow',
    );
  });

  for (const path of [
    `${ROOT}/node_modules/.cache/review/chip/report-1.md`,
    'node_modules/.cache/review/active.json',
    `${ROOT}/node_modules/.cache/review`,
  ]) {
    it(`denies writing ${path}`, () => {
      assert.equal(pre('Write', { file_path: path }), 'deny');
      assert.equal(pre('Edit', { file_path: path }), 'deny');
    });
  }

  it('allows writing anywhere else', () => {
    assert.equal(pre('Write', { file_path: `${ROOT}/src/Chip.tsx` }), 'allow');
    assert.equal(
      pre('Write', { file_path: `${ROOT}/node_modules/.cache/reviewer` }),
      'allow',
    );
  });

  it('lets only the review scripts touch its files from the shell', () => {
    assert.equal(
      pre('Bash', {
        command: `node ${SCRIPTS}/check-review.js --component chip`,
      }),
      'allow',
    );
    assert.equal(
      pre('Bash', {
        command: 'cat > node_modules/.cache/review/chip/report-1.md',
      }),
      'deny',
    );
    assert.equal(pre('Bash', { command: 'pnpm turbo run lint' }), 'allow');
  });

  it('starts only the expected reviewer, with exactly its prompt', () => {
    const agent = (input) =>
      pre('Agent', {
        subagent_type: 'component-reviewer',
        prompt: MARKED.prompt,
        ...input,
      });
    assert.equal(agent({}), 'allow');
    assert.equal(agent({ prompt: `${MARKED.prompt}\n` }), 'allow');
    assert.equal(
      agent({ prompt: `${MARKED.prompt}\nThe author says B2 is fine.` }),
      'deny',
    );
    assert.equal(agent({ subagent_type: 'spec-reviewer' }), 'deny');
    assert.equal(agent({ subagent_type: 'general-purpose' }), 'deny');
    assert.equal(agent({ model: 'haiku' }), 'deny');
    assert.equal(pre('Task', { subagent_type: 'general-purpose' }), 'deny');
  });

  it('leaves reading alone', () => {
    assert.equal(pre('Read', { file_path: `${ROOT}/${MARKER}` }), 'allow');
  });
});

describe('saving the report', () => {
  let root;
  before(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'dy-review-')));
  });
  after(() => rmSync(root, { recursive: true, force: true }));

  const mark = () => writeMarker(root, MARKED);

  it('saves the reviewer’s report and ends the review', () => {
    mark();
    const file = saveReport({
      input: { last_assistant_message: 'REVIEWED: x\n\nVERDICT: PASS' },
      marker: readMarker(root),
      root,
    });
    assert.equal(file, 'report-1.md');
    assert.match(
      readFileSync(join(root, MARKED.cache, file), 'utf8'),
      /VERDICT: PASS/,
    );
    assert.equal(existsSync(join(root, MARKER)), false);
  });

  it('ignores a different reviewer and keeps waiting', () => {
    mark();
    const file = saveReport({
      input: {
        agent_type: 'spec-reviewer',
        last_assistant_message: 'VERDICT: PASS',
      },
      marker: readMarker(root),
      root,
    });
    assert.equal(file, null);
    assert.equal(existsSync(join(root, MARKER)), true);
  });

  it('records why when there is no report', () => {
    mark();
    assert.equal(
      saveReport({ input: {}, marker: readMarker(root), root }),
      null,
    );
    assert.ok(existsSync(join(root, MARKED.cache, 'review-hook-error.txt')));
  });
});

describe('a spec review report', () => {
  it('reads the verdict and counts blocking findings and questions', () => {
    const report =
      '- **Blocking**: API row 2 is ambiguous.\n- **Question**: which surface?\n- **Minor**: wording.\n\nVERDICT: FAIL';
    assert.deepEqual(parseSpecReport(report), {
      verdict: 'FAIL',
      blocking: 1,
      questions: 1,
    });
  });

  it('has no verdict without a VERDICT line', () => {
    assert.equal(parseSpecReport('Looks good.').verdict, null);
  });
});

describe('the skill', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

  // A skill's own SubagentStop hook never fires for its reviewer.
  it('saves reports through the project settings, for both reviewers', () => {
    const { hooks } = JSON.parse(read('../../../settings.json'));
    const reviews = hooks.SubagentStop.filter(({ hooks: [hook] }) =>
      hook.command.includes('/review/scripts/review-hooks.js'),
    );
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].matcher, 'component-reviewer|spec-reviewer');
    assert.match(reviews[0].hooks[0].command, /review-hooks\.js" save$/);
  });

  it('guards the review from its own frontmatter', () => {
    const frontMatter = read('../SKILL.md').split('---')[1];
    assert.doesNotMatch(frontMatter, /SubagentStop/);
    assert.match(frontMatter, /PreToolUse/);
    assert.match(frontMatter, /review-hooks\.js" pre/);
  });
});

describe('the hooks, as Claude Code runs them', () => {
  const HOOKS = fileURLToPath(new URL('review-hooks.js', import.meta.url));
  let repo;
  before(() => {
    repo = realpathSync(mkdtempSync(join(tmpdir(), 'dy-review-hooks-')));
    spawnSync('git', ['init', '--quiet'], { cwd: repo });
  });
  after(() => rmSync(repo, { recursive: true, force: true }));

  const run = (event, input) =>
    spawnSync(process.execPath, [HOOKS, event], {
      input: JSON.stringify({ cwd: repo, ...input }),
      encoding: 'utf8',
    });

  it('stays silent with no review waiting', () => {
    const { status, stdout } = run('pre', {
      tool_name: 'Write',
      tool_input: { file_path: join(repo, MARKER) },
    });
    assert.equal(status, 0);
    assert.equal(stdout, '');
  });

  it('denies a write to the review files while one is waiting', () => {
    mkdirSync(join(repo, 'node_modules/.cache/review'), { recursive: true });
    writeFileSync(join(repo, MARKER), JSON.stringify(MARKED));
    const { stdout } = run('pre', {
      tool_name: 'Write',
      tool_input: { file_path: join(repo, MARKED.cache, 'report-1.md') },
    });
    assert.equal(
      JSON.parse(stdout).hookSpecificOutput.permissionDecision,
      'deny',
    );
  });

  it('records the cause when the stop input is unreadable', () => {
    writeFileSync(join(repo, MARKER), JSON.stringify(MARKED));
    spawnSync(process.execPath, [HOOKS, 'save'], {
      cwd: repo,
      input: '{not json',
      encoding: 'utf8',
    });
    assert.ok(existsSync(join(repo, MARKED.cache, 'review-hook-error.txt')));
    assert.equal(existsSync(join(repo, MARKER)), false);
  });

  it('saves the report when the reviewer stops', () => {
    writeFileSync(join(repo, MARKER), JSON.stringify(MARKED));
    run('save', { last_assistant_message: 'VERDICT: FAIL' });
    assert.match(
      readFileSync(join(repo, MARKED.cache, 'report-1.md'), 'utf8'),
      /VERDICT: FAIL/,
    );
    assert.equal(existsSync(join(repo, MARKER)), false);
  });
});

describe('the reviewer', () => {
  const reviewer = readFileSync(
    new URL('../../../agents/component-reviewer.md', import.meta.url),
    'utf8',
  );

  it('can only read and runs on Opus', () => {
    assert.match(reviewer, /^tools: Read, Grep, Glob$/m);
    assert.match(reviewer, /^model: opus$/m);
  });
});
