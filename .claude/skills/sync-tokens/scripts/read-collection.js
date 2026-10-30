// Read-only Figma Plugin API script for use_figma: exports one slice of a
// variable collection. Replace the three placeholders before running.
const COLLECTION_ID = '__COLLECTION_ID__';
const OFFSET = Number('__OFFSET__');
const LIMIT = Number('__LIMIT__');

// Identical to packages/tokens/scripts/hash.js. The converter re-hashes the
// saved payload and refuses to run if it no longer matches.
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const toHex = (channel) =>
  Math.round(channel * 255)
    .toString(16)
    .padStart(2, '0');

const collection =
  await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID);
const modeNames = Object.fromEntries(
  collection.modes.map((mode) => [mode.modeId, mode.name]),
);

const variables = [];
for (const variableId of collection.variableIds.slice(OFFSET, OFFSET + LIMIT)) {
  const variable = await figma.variables.getVariableByIdAsync(variableId);
  const values = {};
  for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
    let exported = value;
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
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
    description: variable.description,
    scopes: variable.scopes,
    values,
  });
}

const payload = {
  collection: {
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map((mode) => mode.name),
  },
  total: collection.variableIds.length,
  offset: OFFSET,
  variables,
};

return { hash: fnv1a(JSON.stringify(payload)), payload };
