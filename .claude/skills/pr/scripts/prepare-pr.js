import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  handoffDirectory,
  parseSections,
} from '../../_shared/scripts/handoff.js';
import { project } from '../../_shared/scripts/project.js';
import { git } from '../../_shared/scripts/verification.js';
import {
  buildCommands,
  checkHandoff,
  findGh,
  readyPath,
  renderBody,
  verifyBranch,
} from './pr.js';

/*
 ** Verifies the current branch, renders its PR body and prints the only two
 ** commands the guard will let through. Nothing leaves the machine here.
 */

const { values } = parseArgs({
  options: {
    footer: { type: 'string' },
    title: { type: 'string' },
    base: { type: 'string', default: project.defaultBranch },
    draft: { type: 'boolean', default: false },
  },
});

function fail(errors) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.log(`${errors.length} errors.`);
  process.exitCode = 1;
}

const branch = git(['branch', '--show-current']).output;
const head = git(['rev-parse', 'HEAD']).output;
const directory = handoffDirectory(branch);
const handoffPath = resolve(directory, 'handoff.json');
const uncommitted = git([
  'status',
  '--porcelain',
  '--untracked-files=no',
]).output;

if (!branch || branch === project.defaultBranch) {
  fail([
    `Run /pr from the branch to open, not ${branch || 'a detached HEAD'}.`,
  ]);
} else if (uncommitted) {
  fail([`Commit or stash tracked changes first:\n${uncommitted}`]);
} else if (!existsSync(handoffPath) && !values.title) {
  console.log(
    [
      `NO HANDOFF: no skill handed off ${branch}.`,
      `Draft a title and body from \`git log origin/${project.defaultBranch}..HEAD\`, and confirm both with ${project.approver}.`,
      `Then write the body to ${directory}/body.md, with "## " sections, and rerun with --title "<title>".`,
    ].join('\n'),
  );
  process.exitCode = 2;
} else {
  let pr;
  let errors = [];
  if (existsSync(handoffPath)) {
    const handoff = JSON.parse(readFileSync(handoffPath, 'utf8'));
    errors = checkHandoff(handoff, { branch, head });
    pr = handoff;
  } else {
    const bodyPath = resolve(directory, 'body.md');
    try {
      pr = {
        skill: null,
        base: values.base,
        title: values.title,
        draft: values.draft,
        body: existsSync(bodyPath)
          ? parseSections(readFileSync(bodyPath, 'utf8'))
          : {},
      };
      if (Object.keys(pr.body).length === 0) {
        errors.push(`No body sections at ${directory}/body.md.`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length === 0) {
    const checks = await verifyBranch({ skill: pr.skill, branch });
    for (const check of checks) {
      console.log(
        `${check.errors.length === 0 ? 'PASS' : 'FAIL'}: ${check.name}`,
      );
    }
    errors = checks.flatMap((check) => check.errors);
  }

  if (errors.length > 0) {
    fail(errors);
  } else {
    const bodyPath = `${directory}/pr-body.md`;
    mkdirSync(resolve(directory), { recursive: true });
    writeFileSync(
      resolve(bodyPath),
      renderBody({
        template: readFileSync(resolve(project.paths.prTemplate), 'utf8'),
        body: pr.body,
        footer: values.footer,
      }),
    );
    const commands = buildCommands({
      gh: findGh(),
      branch,
      base: pr.base,
      title: pr.title,
      draft: pr.draft,
      bodyPath,
    });
    writeFileSync(
      resolve(readyPath(branch)),
      JSON.stringify(
        {
          branch,
          head,
          base: pr.base,
          draft: pr.draft,
          title: pr.title,
          commands,
          verifiedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(
      [
        `READY: ${pr.title}`,
        `Into ${pr.base}${pr.draft ? ', as a draft' : ''}. Body: ${bodyPath}`,
        ...commands.map((command) => `RUN: ${command}`),
      ].join('\n'),
    );
  }
}
