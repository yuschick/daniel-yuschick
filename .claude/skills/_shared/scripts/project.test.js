import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CITED_RULE,
  RULE_ID,
  TOKEN_REFERENCE,
  checkProfile,
  project,
} from './project.js';

describe('project profile', () => {
  it('loads this repo’s project.json without errors', () => {
    assert.deepEqual(checkProfile(project), []);
  });

  it('names every missing or malformed field', () => {
    const { approver, ...withoutApprover } = project;
    assert.ok(approver);
    assert.deepEqual(checkProfile({ ...withoutApprover, gh: [] }), [
      'project.json: approver is missing or malformed.',
      'project.json: gh is missing or malformed.',
    ]);
  });

  it('builds rule and token patterns from the profile', () => {
    assert.ok(RULE_ID.test('A11Y-14'));
    assert.ok(!RULE_ID.test('NOPE-1'));
    assert.deepEqual('See CSS-07 and TS-09.'.match(CITED_RULE), [
      'CSS-07',
      'TS-09',
    ]);
    assert.deepEqual(
      `padding: var(${project.tokens.prefix}space-m);`.match(TOKEN_REFERENCE),
      [`${project.tokens.prefix}space-m`],
    );
  });
});
