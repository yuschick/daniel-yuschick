/**
 * 32-bit FNV-1a hash of a string, as 8 hex characters.
 *
 * The Figma export script (`.claude/skills/sync-tokens/scripts/export-variables.js`)
 * contains an identical copy. It hashes each export inside Figma, and
 * `figma-to-dtcg.js` re-hashes the copy written to disk, so any difference
 * introduced while saving the export is caught before tokens are generated.
 *
 * @param {string} text
 * @returns {string}
 */
export function fnv1a(text) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
