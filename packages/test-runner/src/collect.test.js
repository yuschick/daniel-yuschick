import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';

import { clearResults, collectRows, findTestedPackages } from './collect.js';
import { RESULTS_DIRECTORY } from './results.js';

/** @type {string} */
let repositoryRoot;

/**
 * @param {string} relativePath
 * @param {unknown} contents
 */
async function writeJson(relativePath, contents) {
  const filePath = path.join(repositoryRoot, relativePath);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(contents));
}

/**
 * @param {string} name
 * @param {'node' | 'vitest'} suite
 * @param {number} failed
 */
function resultsFor(name, suite, failed = 0) {
  return {
    schemaVersion: 1,
    package: name,
    suite,
    files: 1,
    tests: { passed: 3, failed, skipped: 0, todo: 0 },
    durationMs: 100,
    coverage: null,
    failures: [],
  };
}

/**
 * @param {string} name
 * @param {string} task
 * @param {{ status?: 'HIT' | 'MISS', exitCode?: number }} [options]
 */
function taskFor(name, task, { status = 'MISS', exitCode = 0 } = {}) {
  return {
    task,
    package: `@dy/${name}`,
    directory: `packages/${name}`,
    command: 'node --test',
    cache: { status },
    execution: { exitCode },
  };
}

before(async () => {
  repositoryRoot = await mkdtemp(path.join(os.tmpdir(), 'dy-collect-'));

  for (const name of ['one', 'two', 'three', 'four']) {
    await writeJson(`packages/${name}/package.json`, {
      name: `@dy/${name}`,
      scripts: { test: 'node --test' },
    });
  }
  await writeJson('packages/untested/package.json', { name: '@dy/untested' });

  // one: a single suite, replayed from cache
  await writeJson(
    `packages/one/${RESULTS_DIRECTORY}/node.json`,
    resultsFor('@dy/one', 'node'),
  );
  // two: two suites, one of which crashed before writing results
  await writeJson(
    `packages/two/${RESULTS_DIRECTORY}/node.json`,
    resultsFor('@dy/two', 'node'),
  );
  await mkdir(path.join(repositoryRoot, 'packages/two/.turbo'), {
    recursive: true,
  });
  await writeFile(
    path.join(repositoryRoot, 'packages/two/.turbo/turbo-test.log'),
    '\u001B[31mStartup Error\u001B[39m\n    at load (file.js:1:1)\n\n\n ELIFECYCLE  Test failed.\n',
  );
  // three: never scheduled, because four's build failed
  // four: its build failed, and it has no results
});

after(async () => {
  await rm(repositoryRoot, { recursive: true, force: true });
});

describe('findTestedPackages', () => {
  test('finds packages with a test script only', async () => {
    const packages = await findTestedPackages(
      path.join(repositoryRoot, 'packages'),
    );

    assert.deepEqual(packages.map(({ name }) => name).sort(), [
      '@dy/four',
      '@dy/one',
      '@dy/three',
      '@dy/two',
    ]);
  });
});

describe('collectRows', () => {
  test('reports every expected suite, and why any has no results', async () => {
    const packages = await findTestedPackages(
      path.join(repositoryRoot, 'packages'),
    );
    const rows = await collectRows(
      {
        tasks: [
          taskFor('one', 'test', { status: 'HIT' }),
          taskFor('two', 'test', { exitCode: 1 }),
          taskFor('four', 'build', { exitCode: 1 }),
          taskFor('four', 'test', { exitCode: 1 }),
          { ...taskFor('untested', 'test'), command: '<NONEXISTENT>' },
        ],
      },
      packages,
      repositoryRoot,
    );

    assert.deepEqual(
      rows.map(({ label, kind, note, cached }) => ({
        label,
        kind,
        note,
        cached,
      })),
      [
        {
          label: '@dy/four',
          kind: 'suite',
          note: 'did not finish',
          cached: false,
        },
        {
          label: '@dy/four',
          kind: 'task',
          note: 'build failed',
          cached: false,
        },
        { label: '@dy/one', kind: 'suite', note: null, cached: true },
        {
          label: '@dy/three',
          kind: 'suite',
          note: 'did not run',
          cached: false,
        },
        {
          label: '@dy/two',
          kind: 'suite',
          note: 'did not finish',
          cached: false,
        },
        { label: '@dy/two · node', kind: 'suite', note: null, cached: false },
      ],
    );
  });

  test('cleans a crash log of color codes, stack frames and pnpm noise', async () => {
    const packages = await findTestedPackages(
      path.join(repositoryRoot, 'packages'),
    );
    const rows = await collectRows(
      { tasks: [taskFor('two', 'test', { exitCode: 1 })] },
      packages,
      repositoryRoot,
    );
    const crashed = rows.find(
      (row) => row.note === 'did not finish' && row.label === '@dy/two',
    );

    assert.ok(crashed?.log);
    assert.match(crashed.log, /^Startup Error\n\nFull log: /);
  });
});

describe('clearResults', () => {
  test("removes each package's results, and a suite without any still shows", async () => {
    const packages = await findTestedPackages(
      path.join(repositoryRoot, 'packages'),
    );
    await clearResults(packages);

    const rows = await collectRows(
      { tasks: [taskFor('one', 'test')] },
      packages.filter(({ name }) => name === '@dy/one'),
      repositoryRoot,
    );

    assert.equal(rows[0]?.results, null);
    assert.equal(rows[0]?.note, 'wrote no results');
  });
});
