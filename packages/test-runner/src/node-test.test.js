import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { nodeTestArguments } from './node-test.js';

describe('nodeTestArguments', () => {
  test('pairs each reporter with a destination', () => {
    const flags = nodeTestArguments([]);
    const reporters = flags.filter((flag) =>
      flag.startsWith('--test-reporter='),
    );
    const destinations = flags.filter((flag) =>
      flag.startsWith('--test-reporter-destination='),
    );

    assert.equal(reporters.length, 2);
    assert.equal(destinations.length, reporters.length);
  });

  test('points at the results reporter by a path that exists', async () => {
    const reporter = nodeTestArguments([])
      .filter((flag) => flag.startsWith('--test-reporter='))
      .at(-1)
      ?.replace('--test-reporter=', '');

    assert.ok(reporter?.endsWith('reporters/node.js'), reporter);
    await access(reporter);
  });

  test('adds extra flags after the shared ones', () => {
    const flags = nodeTestArguments(['--test-timeout=30000']);

    assert.equal(flags[0], '--test');
    assert.equal(flags.at(-1), '--test-timeout=30000');
  });
});
