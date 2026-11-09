import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { TOKEN_REFERENCE, project } from '../../_shared/scripts/project.js';
import { parseSpec } from '../../_shared/scripts/spec.js';
import {
  checkInlineStyles,
  checkSuppressions,
  checkTokensExist,
  expectedTokens,
  isExampleFile,
} from '../../_shared/scripts/check-component.js';
import {
  processLatestReport,
  readReport,
} from '../../_shared/scripts/check-review.js';
import { lintStyleSheet } from './lint-styles.js';
import {
  classifyPath,
  componentPaths,
  findReviewLimit,
  git,
  hashFile,
  hasPassingReview,
  isReportRecorded,
  latestReport,
  nextReport,
  readApprovals,
  readReviewState,
  readRun,
  REVIEW_HOOK_ERROR,
  treeHash,
} from '../../_shared/scripts/verification.js';

/*
 ** Claude Code runs these hooks, so the author can't choose to skip them. They
 ** register for the whole session once /implement runs, so they only act on a
 ** `implement/*` branch, leaving /spec and /sync-tokens alone.
 */

const IMPLEMENT_BRANCH = /^implement\/(.+)$/;
const FILE_TOOLS = new Set(['Edit', 'NotebookEdit', 'Write']);
const SUBAGENT_TOOLS = new Set(['Agent', 'Task']);
const RESET_FLAG = '--reset';
const REVIEWER = project.reviewers.component;
const SCRIPTS_DIRECTORY = '.claude/skills/implement/scripts';
const MANIFEST = project.paths.tokensManifest;
const SYSTEM_TOKEN = TOKEN_REFERENCE;
// The docs confirm a hook's `ask` reaches a person in these. Elsewhere it may
// not, and a rule change no one saw is the one thing this guard exists to stop.
const PROMPTING_MODES = new Set(['auto', 'default']);

const READ_ONLY_COMMANDS = new Set([
  'cat',
  'cut',
  'grep',
  'head',
  'ls',
  'pwd',
  'tail',
  'wc',
]);
const GIT_COMMANDS = new Set([
  'add',
  'commit',
  'diff',
  'fetch',
  'log',
  'ls-files',
  'rev-parse',
  'show',
  'status',
]);

/**
 * Splits a shell command into its simple commands. Anything this can't be sure
 * of counts as unsafe, which only means a person is asked.
 *
 * @param {string} command
 * @returns {{ commands: string[][], isUnsafe: boolean }}
 */
export function parseCommand(command) {
  const commands = [];
  let tokens = [];
  let token = '';
  let hasToken = false;
  let quote = null;
  let isUnsafe = false;

  const endToken = () => {
    if (hasToken) tokens.push(token);
    token = '';
    hasToken = false;
  };
  const endCommand = () => {
    endToken();
    if (tokens.length > 0) commands.push(tokens);
    tokens = [];
  };

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    const next = command[index + 1];

    if (quote === "'") {
      if (character === "'") quote = null;
      else token += character;
    } else if (character === '`' || (character === '$' && next === '(')) {
      isUnsafe = true;
      token += character;
    } else if (quote === '"') {
      if (character === '"') quote = null;
      else token += character;
    } else if (character === '"' || character === "'") {
      quote = character;
      hasToken = true;
    } else if (character === '\\') {
      index += 1;
      token += command[index] ?? '';
      hasToken = true;
    } else if (character === '<' && next === '<') {
      isUnsafe = true;
      index += 1;
    } else if (character === '>') {
      // `2>&1` and `> /dev/null` write nothing worth guarding.
      const rest = command.slice(index + 1);
      const harmless = rest.match(/^(&\d|>?\s*\/dev\/null)/);
      if (/^\d$/.test(token)) {
        token = '';
        hasToken = false;
      }
      if (harmless) {
        index += harmless[0].length;
      } else {
        isUnsafe = true;
        endToken();
      }
    } else if (/[;|&\n]/.test(character)) {
      endCommand();
    } else if (/\s/.test(character)) {
      endToken();
    } else {
      token += character;
      hasToken = true;
    }
  }
  endCommand();
  return { commands, isUnsafe: isUnsafe || quote !== null };
}

/**
 * The commands a build needs. Everything else asks a person, rather than trying
 * to list every way a shell can write to a file.
 *
 * @param {string[]} tokens
 * @param {string} component
 * @returns {boolean}
 */
export function isExpectedCommand(tokens, component) {
  const [program, ...args] = tokens;
  const [first, second, third] = args;

  if (args.includes(RESET_FLAG)) return false;
  if (READ_ONLY_COMMANDS.has(program)) return true;
  if (program === 'find') {
    return !args.some((arg) => /^-(exec|ok|delete|fprint|fls)/.test(arg));
  }
  if (program === 'git') {
    if (GIT_COMMANDS.has(first)) {
      return !args.some((arg) => arg.startsWith('--output'));
    }
    if (first === 'branch') return second === '--show-current';
    if (first === 'switch') {
      return args
        .slice(1)
        .every((arg) => arg === '-c' || IMPLEMENT_BRANCH.test(arg));
    }
    return (
      first === 'push' &&
      args.length === 4 &&
      second === '-u' &&
      third === 'origin' &&
      args[3] === `implement/${component}`
    );
  }
  if (program === 'pnpm') {
    if (first === 'format:check') return args.length === 1;
    if (first === 'turbo') return second === 'run';
    if (first === '--filter') {
      return (
        (second === project.packages.tokens && third === 'build') ||
        ([project.packages.components, project.packages.storybook].includes(
          second,
        ) &&
          third === 'test')
      );
    }
    if (first === 'exec' && second === 'prettier') {
      return (
        third === '--write' &&
        args.length > 3 &&
        args.slice(3).every((arg) => classifyPath(arg, component) === 'allow')
      );
    }
    return false;
  }
  if (program === 'node') {
    const scripts = first === '--test' ? args.slice(1) : [first];
    return (
      scripts.length > 0 &&
      scripts.every((script) =>
        /^\.claude\/skills\/(implement|pr|spec)\/scripts\/[\w*.-]+\.js$/.test(
          script ?? '',
        ),
      )
    );
  }
  if (project.gh.includes(program)) {
    return first === 'pr' && (second === 'view' || second === 'create');
  }
  return false;
}

const toPathCandidates = (tokens) =>
  tokens[0] === 'git' && tokens[1] === 'switch' ? [] : tokens;

/** Follows symlinks, so a link can't disguise a protected file as an outside one. */
function toRealPath(path) {
  return existsSync(path)
    ? realpathSync(path)
    : join(toRealPath(dirname(path)), basename(path));
}

const allow = () => ({ decision: 'allow', reason: '' });
const deny = (reason) => ({ decision: 'deny', reason });

/** `ask` only where a person will see it, because silence must never approve a rule. */
const ask = (reason, mode) =>
  PROMPTING_MODES.has(mode)
    ? { decision: 'ask', reason }
    : deny(`${reason} This needs a person, and ${mode} mode may not ask one.`);

/**
 * @param {{ tool: string, input: Record<string, any>, component: string, mode: string, root: string, cwd: string, run: { staging: boolean } | null, isReadyForPullRequest: () => boolean, findReviewerProblem: (input: Record<string, any>) => string | null }} options
 * @returns {{ decision: 'allow' | 'ask' | 'deny', reason: string }}
 */
export function decideTool({
  tool,
  input,
  component,
  mode,
  root,
  cwd,
  run,
  isReadyForPullRequest,
  findReviewerProblem,
}) {
  const toRepoPath = (path) => {
    const repoPath = relative(root, toRealPath(resolve(cwd, path)));
    return repoPath.startsWith('..') || isAbsolute(repoPath) ? null : repoPath;
  };

  if (tool === 'SendMessage') {
    return deny('A reviewer must start cold, so an agent is never resumed.');
  }

  if (SUBAGENT_TOOLS.has(tool)) {
    if (input.subagent_type !== REVIEWER) {
      return deny(
        `A build may only start ${REVIEWER}. Other subagents can write without these hooks.`,
      );
    }
    const problem = findReviewerProblem(input);
    return problem === null ? allow() : deny(problem);
  }

  if (FILE_TOOLS.has(tool)) {
    const repoPath = toRepoPath(input.file_path ?? input.notebook_path ?? '');
    if (repoPath === null) return allow();
    const access = classifyPath(repoPath, component);
    if (access === 'deny') {
      return deny(`${repoPath} is outside what /implement may change.`);
    }
    if (run === null) {
      return deny(
        'Run preflight.js first: nothing is written until the spec is proven approved and Figma unchanged.',
      );
    }
    return access === 'ask'
      ? ask(`${repoPath} is a shared rule. Approve this edit?`, mode)
      : allow();
  }

  if (tool === 'Bash') {
    const { commands, isUnsafe } = parseCommand(input.command ?? '');
    if (
      run?.staging &&
      commands.some(
        ([program, first, second]) =>
          (program === 'git' && (first === 'commit' || first === 'push')) ||
          (/(^|\/)gh$/.test(program) && first === 'pr' && second === 'create'),
      )
    ) {
      return deny(
        'This is a staging build, so nothing is committed, pushed or opened as a PR.',
      );
    }
    const isPullRequest = commands.some(
      ([program, first, second]) =>
        /(^|\/)gh$/.test(program) && first === 'pr' && second === 'create',
    );
    if (
      !isUnsafe &&
      commands.length === 1 &&
      commands[0].includes(RESET_FLAG) &&
      commands[0][0] === 'node' &&
      commands[0][1] === `${SCRIPTS_DIRECTORY}/check-review.js`
    ) {
      return ask(
        'Reset the review rounds? That gives this build more reviews after it reached its limit.',
        mode,
      );
    }
    if (isPullRequest) {
      if (!input.command.includes('--draft')) {
        return deny('A build only opens draft pull requests.');
      }
      if (!isReadyForPullRequest()) {
        return deny(
          'The gates and the cold review must pass on this exact code before a PR.',
        );
      }
    }
    const unexpected = commands.filter(
      (tokens) => !isExpectedCommand(tokens, component),
    );
    if (!isUnsafe && unexpected.length === 0) return allow();

    // A branch name isn't a path, and a person still approves leaving the branch.
    const touchesProtected = commands
      .flatMap(toPathCandidates)
      .some((token) => {
        if (token.startsWith('-') || token.includes('://')) return false;
        const repoPath = toRepoPath(token);
        return (
          repoPath !== null &&
          repoPath !== '' &&
          (token.includes('/') || existsSync(resolve(cwd, token))) &&
          classifyPath(repoPath, component) === 'deny'
        );
      });
    return touchesProtected
      ? deny(
          'This command names a path /implement may not change, and it is not one a build expects, so it is denied even if it only reads. Use the Read tool, or a command from the skill.',
        )
      : ask('This command is outside what /implement normally runs.', mode);
  }

  return allow();
}

function isGatesCurrent(cache) {
  const path = resolve(cache, 'gates.json');
  if (!existsSync(path)) return false;
  const { passed, treeHash: hash } = JSON.parse(readFileSync(path, 'utf8'));
  return passed === true && hash === treeHash();
}

/**
 * @param {{ input: Record<string, any>, cache: string }} options
 * @returns {string | null} Why this reviewer may not start, if it may not.
 */
function findReviewerProblem({ input, cache }) {
  if (input.model) return 'The reviewer runs on the model its definition sets.';
  if (!isGatesCurrent(cache)) {
    return 'The gates must pass on this exact code before a review.';
  }
  const state = readReviewState(cache);
  const limit = findReviewLimit(state);
  if (limit) return limit;
  const latest = latestReport(cache);
  if (latest !== null && !isReportRecorded(state, latest)) {
    return `${latest} hasn't been recorded. Run check-review.js before another review, so no failed round goes uncounted.`;
  }
  const promptPath = resolve(cache, 'reviewer-prompt.txt');
  if (!existsSync(promptPath)) return 'Run implement-ledger.js first.';
  return input.prompt?.trim() === readFileSync(promptPath, 'utf8').trim()
    ? null
    : 'Give the reviewer exactly the prompt implement-ledger.js wrote, and nothing else, so it stays cold.';
}

function handleReview({ input, component }) {
  const { cache } = componentPaths(component);
  mkdirSync(resolve(cache), { recursive: true });
  const message = readReport(input);
  if (!message) {
    // Says the hook ran and found nothing, which `check-review.js` reports.
    writeFileSync(
      resolve(cache, REVIEW_HOOK_ERROR),
      `The reviewer's hook ran, but found no report. It received: ${Object.keys(input).join(', ')}.`,
    );
    return;
  }
  writeFileSync(resolve(cache, nextReport(cache)), message);
  processLatestReport(component);
}

function respondToPreToolUse({ decision, reason }) {
  if (decision === 'allow') return;
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
}

function recordApproval(file, cache) {
  const approvals = readApprovals(cache);
  approvals[file] = hashFile(file);
  mkdirSync(resolve(cache), { recursive: true });
  writeFileSync(
    resolve(cache, 'approvals.json'),
    JSON.stringify(approvals, null, 2),
  );
}

/**
 * The fast loop: what can be judged from one file, straight after an edit. The
 * file can be unfinished, so a token the spec wants but it lacks isn't a problem yet.
 * A style sheet is also linted, by `lintStyleSheet` in `handlePost`.
 *
 * @param {{ file: string, source: string, expected: Set<string>, manifestTokens: Record<string, unknown> }} options
 * @returns {string[]}
 */
export function checkEditedFile({ file, source, expected, manifestTokens }) {
  const sources = { [file]: source };
  const isExample = isExampleFile(file);
  return [
    ...checkTokensExist({ sources, manifestTokens }),
    ...checkSuppressions({ sources }),
    ...(isExample
      ? []
      : [...new Set(source.match(SYSTEM_TOKEN) ?? [])]
          .filter((token) => !expected.has(token))
          .map((token) => `${file} uses ${token}, which isn't in the spec.`)),
    ...(!isExample && /\.tsx?$/.test(file)
      ? checkInlineStyles({ sources })
      : []),
  ];
}

function handlePost({ input, component, mode }) {
  const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!path) return;
  const file = relative(process.cwd(), toRealPath(resolve(input.cwd, path)));
  const access = classifyPath(file, component);
  const { spec, cache } = componentPaths(component);

  // Only an edit that got past the prompt reaches here.
  if (access === 'ask' && PROMPTING_MODES.has(mode)) {
    recordApproval(file, cache);
    return;
  }
  if (
    !file.startsWith(`${project.paths.components}/`) ||
    access !== 'allow' ||
    !existsSync(resolve(file))
  ) {
    return;
  }

  const source = readFileSync(resolve(file), 'utf8');
  const problems = [
    ...checkEditedFile({
      file,
      source,
      expected: expectedTokens(parseSpec(readFileSync(resolve(spec), 'utf8'))),
      manifestTokens: JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'))
        .tokens,
    }),
    ...(file.endsWith('.css')
      ? lintStyleSheet({ file, source, root: process.cwd() })
      : []),
  ];
  if (problems.length > 0) {
    console.log(
      JSON.stringify({ decision: 'block', reason: problems.join('\n') }),
    );
  }
}

function hasComponentFolder(component) {
  const directory = resolve(project.paths.components);
  return (
    existsSync(directory) &&
    readdirSync(directory).some((entry) => entry.toLowerCase() === component)
  );
}

function handleStop({ input, component }) {
  const { cache } = componentPaths(component);
  if (!hasComponentFolder(component) || isGatesCurrent(cache)) return;

  const pausePath = resolve(cache, 'paused.json');
  const pause = existsSync(pausePath)
    ? JSON.parse(readFileSync(pausePath, 'utf8'))
    : null;
  if (pause?.treeHash === treeHash()) {
    console.log(
      JSON.stringify({
        systemMessage: `/implement paused with the gates not passing: ${pause.reason}`,
      }),
    );
    return;
  }
  // One push back, never a loop: the warning below still reaches the approver.
  console.log(
    JSON.stringify(
      input.stop_hook_active
        ? {
            systemMessage:
              '/implement stopped without passing gates and without saying why.',
          }
        : {
            decision: 'block',
            reason: `The gates haven't passed on this code. Run run-gates.js, or if you need ${project.approver}, run: node .claude/skills/implement/scripts/implement-hooks.js pause --reason "<why>"`,
          },
    ),
  );
}

function handlePause(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { reason: { type: 'string' } },
  });
  const { output: branch } = git(['branch', '--show-current']);
  const component = branch.match(IMPLEMENT_BRANCH)?.[1];
  if (!component || !values.reason) {
    throw new Error(
      'Usage, on a build branch: implement-hooks.js pause --reason <why>',
    );
  }
  const { cache } = componentPaths(component);
  mkdirSync(resolve(cache), { recursive: true });
  writeFileSync(
    resolve(cache, 'paused.json'),
    JSON.stringify({ treeHash: treeHash(), reason: values.reason }),
  );
  console.log(`Paused: ${values.reason}`);
}

function main() {
  const [event, ...rest] = process.argv.slice(2);
  if (event === 'pause') {
    handlePause(rest);
    return;
  }

  const input = JSON.parse(readFileSync(0, 'utf8'));
  process.chdir(input.cwd);
  const { output: branch } = git(['branch', '--show-current']);
  const component = branch.match(IMPLEMENT_BRANCH)?.[1];
  if (!component) return;

  const { output: root } = git(['rev-parse', '--show-toplevel']);
  const cwd = input.cwd;
  process.chdir(root);
  const mode = input.permission_mode;

  if (event === 'pre') {
    respondToPreToolUse(
      decideTool({
        tool: input.tool_name,
        input: input.tool_input ?? {},
        component,
        mode,
        root: process.cwd(),
        cwd,
        run: readRun(componentPaths(component).cache),
        isReadyForPullRequest: () => {
          const { cache } = componentPaths(component);
          return (
            isGatesCurrent(cache) &&
            hasPassingReview(readReviewState(cache), treeHash())
          );
        },
        findReviewerProblem: (toolInput) =>
          findReviewerProblem({
            input: toolInput,
            cache: componentPaths(component).cache,
          }),
      }),
    );
  } else if (event === 'post') {
    handlePost({ input, component, mode });
  } else if (event === 'stop') {
    handleStop({ input, component });
  } else if (event === 'review') {
    handleReview({ input, component });
  } else {
    throw new Error(`Unknown hook event: ${event}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    // Exit code 2 blocks: a guard that crashes must never wave a call through.
    // Elsewhere it would trap the session or a finished reviewer.
    console.error(`implement-hooks: ${error.message}`);
    process.exitCode = process.argv[2] === 'pre' ? 2 : 1;
  }
}
