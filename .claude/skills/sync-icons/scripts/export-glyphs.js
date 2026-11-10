// Read-only Figma Plugin API script for use_figma. Replace the placeholders
// before running:
// - __SECTION_ID__ = the node ID of the section holding the glyphs
// - __OFFSET__ and __LIMIT__ = the slice of glyphs to export, sorted by name
//
// A glyph is any component in the section that isn't a variant: the Icon
// component set lives in the same section, and its variants are skipped.
const SECTION_ID = '__SECTION_ID__';
const OFFSET = Number('__OFFSET__');
const LIMIT = Number('__LIMIT__');

// Identical to packages/icons/scripts/hash.js. The converter re-hashes each
// saved result and refuses to run if it no longer matches.
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const section = await figma.getNodeByIdAsync(SECTION_ID);
if (!section || !('findAllWithCriteria' in section)) {
  throw new Error(`No section or frame with ID ${SECTION_ID}.`);
}

// Load the section's page: only the current page's contents can be searched
let page = section.parent;
while (page && page.type !== 'PAGE') {
  page = page.parent;
}
if (page) {
  await figma.setCurrentPageAsync(page);
}

const glyphs = section
  .findAllWithCriteria({ types: ['COMPONENT'] })
  .filter((node) => node.parent?.type !== 'COMPONENT_SET')
  .sort((first, second) =>
    first.name < second.name ? -1 : first.name > second.name ? 1 : 0,
  );

const icons = [];
for (const glyph of glyphs.slice(OFFSET, OFFSET + LIMIT)) {
  icons.push({
    id: glyph.id,
    key: glyph.key,
    name: glyph.name,
    description: glyph.description,
    svg: await glyph.exportAsync({ format: 'SVG_STRING' }),
  });
}

const payload = {
  section: { id: section.id, name: section.name },
  total: glyphs.length,
  offset: OFFSET,
  icons,
};

return { hash: fnv1a(JSON.stringify(payload)), payload };
