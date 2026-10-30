// Read-only Figma Plugin API script for use_figma: lists local variable
// collections so each one can be exported with read-collection.js.
const collections = await figma.variables.getLocalVariableCollectionsAsync();

return collections.map((collection) => ({
  id: collection.id,
  name: collection.name,
  modes: collection.modes.map((mode) => mode.name),
  total: collection.variableIds.length,
}));
