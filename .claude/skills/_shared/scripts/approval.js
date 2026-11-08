import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { APPROVAL_REF, project } from './project.js';
import { parseSpec } from './spec.js';
import { git } from './verification.js';

/**
 * A spec is approved when it is on the default branch: merging its PR is the
 * approval, and nothing in the file records it. Both the spec and its facts
 * must match the approved copies, and no question may be left open.
 *
 * @param {{ spec: { local: string, approved: string | null }, facts: { local: string, approved: string | null } }} options
 * @returns {string[]}
 */
export function checkSpecApproval({ spec, facts }) {
  const errors = [];
  for (const [label, file] of Object.entries({ spec, facts })) {
    if (file.approved === null) {
      errors.push(
        `The ${label} isn't on ${APPROVAL_REF}, so it isn't approved.`,
      );
    } else if (file.approved !== file.local) {
      errors.push(
        `The ${label} differs from the approved copy on ${APPROVAL_REF}.`,
      );
    }
  }
  const { sections } = parseSpec(spec.local);
  const openQuestions = sections.get('Open questions')?.text.join('\n').trim();
  if (openQuestions !== 'None.') {
    errors.push('The spec has open questions.');
  }
  return errors;
}

/**
 * Fetches the default branch and reads the spec and facts both as they are on
 * disk and as they were approved.
 *
 * @param {{ spec: string, facts: string }} paths
 * @returns {Promise<{ error: string } | { spec: { local: string, approved: string | null }, facts: { local: string, approved: string | null } }>}
 */
export async function readApproval(paths) {
  if (!git(['fetch', 'origin', project.defaultBranch, '--quiet']).ok) {
    return { error: `Couldn't fetch ${APPROVAL_REF}.` };
  }
  const readApproved = (file) => {
    const { ok, output } = git(['show', `${APPROVAL_REF}:${file}`]);
    return ok ? output : null;
  };
  const readLocal = async (file) =>
    (await readFile(resolve(file), 'utf8')).trim();
  return {
    spec: {
      local: await readLocal(paths.spec),
      approved: readApproved(paths.spec),
    },
    facts: {
      local: await readLocal(paths.facts),
      approved: readApproved(paths.facts),
    },
  };
}
