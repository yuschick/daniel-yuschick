// Read-only Figma Plugin API script for use_figma. Replace the placeholders
// before running:
// - __COLLECTION_ID__ = LIST: lists every collection with its fingerprint
// - __COLLECTION_ID__ = a collection ID: exports one slice of it, from
//   __OFFSET__, at most __LIMIT__ variables
const COLLECTION_ID = '__COLLECTION_ID__';
const OFFSET = Number('__OFFSET__');
const LIMIT = Number('__LIMIT__');

// Collections that resolve references but never ship to CSS (HIDDEN_FILE in
// packages/tokens/style-dictionary/config.js). Their descriptions only
// document Figma, so they're left out of the export.
const HIDDEN_COLLECTIONS = new Set(['Portfolio Primitives', 'Portfolio Theme']);

// Identical to packages/tokens/scripts/hash.js. The converter re-hashes each
// saved result and refuses to run if it no longer matches.
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Identical to fingerprintCollection in packages/tokens/scripts/sync-plan.js:
// the whole collection, variables sorted by ID so reordering in Figma
// doesn't count as a change.
function fingerprint({ collection, total, variables }) {
  const sorted = [...variables].sort((first, second) =>
    first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
  );
  return fnv1a(JSON.stringify({ collection, total, variables: sorted }));
}

const toHex = (channel) =>
  Math.round(channel * 255)
    .toString(16)
    .padStart(2, '0');

async function exportCollection({ collection, offset, limit }) {
  const modeNames = Object.fromEntries(
    collection.modes.map((mode) => [mode.modeId, mode.name]),
  );
  const isHidden = HIDDEN_COLLECTIONS.has(collection.name);

  const variables = [];
  for (const variableId of collection.variableIds.slice(
    offset,
    offset + limit,
  )) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    const values = {};
    for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
      let exported = value;
      if (
        value &&
        typeof value === 'object' &&
        value.type === 'VARIABLE_ALIAS'
      ) {
        exported = { alias: value.id };
      } else if (variable.resolvedType === 'COLOR') {
        const alpha = value.a < 1 ? toHex(value.a) : '';
        exported = `#${toHex(value.r)}${toHex(value.g)}${toHex(value.b)}${alpha}`;
      }
      values[modeNames[modeId]] = exported;
    }
    variables.push({
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType,
      description: isHidden ? '' : variable.description,
      scopes: variable.scopes,
      values,
    });
  }

  return {
    collection: {
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map((mode) => mode.name),
    },
    total: collection.variableIds.length,
    offset,
    variables,
  };
}

let payload;
if (COLLECTION_ID === 'LIST') {
  const collections = [];
  for (const collection of await figma.variables.getLocalVariableCollectionsAsync()) {
    const full = await exportCollection({
      collection,
      offset: 0,
      limit: collection.variableIds.length,
    });
    collections.push({
      ...full.collection,
      total: full.total,
      fingerprint: fingerprint(full),
    });
  }
  payload = { collections };
} else {
  const collection =
    await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID);
  payload = await exportCollection({
    collection,
    offset: OFFSET,
    limit: LIMIT,
  });
}

return { hash: fnv1a(JSON.stringify(payload)), payload };
