/**
 * 32-bit FNV-1a hash of a string, as 8 hex characters.
 *
 * Scripts that run inside Figma can't import, so `/spec`'s extractor embeds an
 * identical copy and hashes its result there. Checking that hash on disk
 * catches any change made while saving it. `hash.test.js` proves the copy
 * matches this one.
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
