import { readFileSync } from 'node:fs';

/** The one file that changes between projects. See `.claude/skills/README.md`. */
export const PROFILE_URL = new URL('../../project.json', import.meta.url);

const isString = (value) => typeof value === 'string' && value.length > 0;
const isStrings = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isString);

/** Every field a skill reads, with the check it must pass. */
const FIELDS = {
  approver: isString,
  defaultBranch: isString,
  gh: isStrings,
  'figma.fileKey': isString,
  'packages.components': isString,
  'packages.storybook': isString,
  'packages.tokens': isString,
  'paths.componentsPackage': isString,
  'paths.components': isString,
  'paths.barrels': isStrings,
  'paths.entry': isString,
  'paths.typeRegistry': isString,
  'paths.specs': isString,
  'paths.standards': isString,
  'paths.tokensPackage': isString,
  'paths.tokensManifest': isString,
  'paths.prTemplate': isString,
  'paths.reviewed': isStrings,
  'tokens.prefix': isString,
  'rules.domains': isStrings,
  'commands.buildTokens': isString,
  'commands.verify': isStrings,
  'reviewers.spec': isString,
  'reviewers.component': isString,
};

/**
 * @param {unknown} profile
 * @returns {string[]} One message per missing or malformed field.
 */
export function checkProfile(profile) {
  return Object.entries(FIELDS)
    .filter(([path, isValid]) => {
      const value = path
        .split('.')
        .reduce((node, key) => node?.[key], /** @type {any} */ (profile));
      return !isValid(value);
    })
    .map(([path]) => `project.json: ${path} is missing or malformed.`);
}

/** @param {URL | string} url */
export function loadProfile(url = PROFILE_URL) {
  const profile = JSON.parse(readFileSync(url, 'utf8'));
  const errors = checkProfile(profile);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return profile;
}

export const project = loadProfile();

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const domains = project.rules.domains.join('|');

/** A whole standards rule ID, such as `A11Y-14`. */
export const RULE_ID = new RegExp(`^(?:${domains})-\\d+$`);

/** Rule IDs cited anywhere in a text. Global, so use it with `match`. */
export const CITED_RULE = new RegExp(`\\b(?:${domains})-\\d+\\b`, 'g');

/** Top-layer token references, such as `--dy-space-m`. Global. */
export const TOKEN_REFERENCE = new RegExp(
  `${escape(project.tokens.prefix)}[a-z0-9-]+`,
  'g',
);

/** The approval ref: a spec is approved by being on the default branch. */
export const APPROVAL_REF = `origin/${project.defaultBranch}`;
