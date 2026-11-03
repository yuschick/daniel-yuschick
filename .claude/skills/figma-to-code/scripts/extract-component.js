// Read-only Figma Plugin API script for use_figma. Replace __NODE_ID__ with the
// component set or component before running, e.g. 148:2149
const NODE_ID = '__NODE_ID__';

// Hidden layers are still design facts, so they must be read too.
figma.skipInvisibleInstanceChildren = false;

// Identical to packages/tokens/scripts/hash.js, so a saved result can be
// checked against the hash computed in Figma.
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

const tokenNames = new Map();

async function tokenName(alias) {
  if (!tokenNames.has(alias.id)) {
    const variable = await figma.variables.getVariableByIdAsync(alias.id);
    tokenNames.set(alias.id, variable ? variable.name : `unknown:${alias.id}`);
  }
  return tokenNames.get(alias.id);
}

// Every fact is "token:<name>" or "raw:<value>", so a value with no token is
// visible at a glance and can't be mistaken for a design system decision.
async function readBound(node, boundKey, rawValue) {
  const bound = node.boundVariables && node.boundVariables[boundKey];
  const alias = Array.isArray(bound) ? bound[0] : bound;
  return alias
    ? `token:${await tokenName(alias)}`
    : `raw:${typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue}`;
}

async function readPaints(paints) {
  if (typeof paints === 'symbol') return 'raw:mixed';
  const visible = paints.filter((paint) => paint.visible !== false);
  if (visible.length === 0) return 'none';
  const facts = [];
  for (const paint of visible) {
    const alias = paint.boundVariables && paint.boundVariables.color;
    if (alias) facts.push(`token:${await tokenName(alias)}`);
    else if (paint.color) {
      facts.push(
        `raw:#${toHex(paint.color.r)}${toHex(paint.color.g)}${toHex(paint.color.b)}`,
      );
    } else facts.push(`raw:${paint.type}`);
  }
  return facts.join(' + ');
}

// Sizes that follow their content aren't design decisions, so they're skipped.
const isFixed = (node, axis) => node[`layoutSizing${axis}`] === 'FIXED';

async function readFacts(node) {
  const facts = {};
  const add = async (field, boundKey, value) => {
    if (value === undefined || value === null) return;
    facts[field] =
      typeof value === 'symbol'
        ? 'raw:mixed'
        : await readBound(node, boundKey, value);
  };

  if (node.layoutPositioning === 'ABSOLUTE') {
    facts.x = `raw:${node.x}`;
    facts.y = `raw:${node.y}`;
  } else {
    if (isFixed(node, 'Horizontal')) await add('width', 'width', node.width);
    if (isFixed(node, 'Vertical')) await add('height', 'height', node.height);
  }
  await add('minHeight', 'minHeight', node.minHeight);
  await add('minWidth', 'minWidth', node.minWidth);

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    facts.layoutMode = `raw:${node.layoutMode}`;
    facts.alignPrimary = `raw:${node.primaryAxisAlignItems}`;
    facts.alignCounter = `raw:${node.counterAxisAlignItems}`;
    for (const field of [
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'itemSpacing',
    ]) {
      await add(field, field, node[field]);
    }
  }

  if ('topLeftRadius' in node && node.topLeftRadius !== 0) {
    await add('radius', 'topLeftRadius', node.topLeftRadius);
  }
  if ('fills' in node) facts.fill = await readPaints(node.fills);
  if ('strokes' in node && node.strokes.length > 0) {
    facts.stroke = await readPaints(node.strokes);
    await add('strokeWidth', 'strokeTopWeight', node.strokeTopWeight);
  }
  if ('effects' in node && node.effects.length > 0) {
    facts.effects = `raw:${node.effects.map((effect) => effect.type).join()}`;
  }
  if ('opacity' in node && node.opacity !== 1) {
    await add('opacity', 'opacity', node.opacity);
  }

  if (node.type === 'TEXT') {
    const fontName = node.fontName;
    await add('fontFamily', 'fontFamily', fontName.family);
    await add('fontStyle', 'fontStyle', fontName.style);
    await add('fontSize', 'fontSize', node.fontSize);
    await add('lineHeight', 'lineHeight', node.lineHeight);
    await add('letterSpacing', 'letterSpacing', node.letterSpacing);
    if (node.textCase !== 'ORIGINAL') facts.textCase = `raw:${node.textCase}`;
    if (node.textDecoration !== 'NONE') {
      facts.textDecoration = `raw:${node.textDecoration}`;
    }
    if (typeof node.textStyleId === 'string' && node.textStyleId) {
      const style = await figma.getStyleByIdAsync(node.textStyleId);
      facts.textStyle = `raw:${style ? style.name : 'unknown'}`;
    }
  }
  return facts;
}

const root = await figma.getNodeByIdAsync(NODE_ID);
if (!root) throw new Error(`Node ${NODE_ID} not found`);

const isSet = root.type === 'COMPONENT_SET';
if (!isSet && root.type !== 'COMPONENT') {
  throw new Error(`Node ${NODE_ID} is a ${root.type}, not a component`);
}
if (root.type === 'COMPONENT' && root.parent.type === 'COMPONENT_SET') {
  throw new Error(
    `Node ${NODE_ID} is a variant; pass its set ${root.parent.id}`,
  );
}

const definitions = root.componentPropertyDefinitions;
const axes = Object.keys(definitions).filter(
  (name) => definitions[name].type === 'VARIANT',
);
const variantNodes = isSet ? root.children : [root];
const keyOf = (variant, names) =>
  names.map((name) => variant.variantProperties[name]).join('|');

const layers = new Map();
const coverage = { walked: 0, summarized: 0, hidden: 0, insideHidden: 0 };

function layerRecord(path, node) {
  if (!layers.has(path)) {
    layers.set(path, {
      name: node.name,
      type: node.type,
      references: node.componentPropertyReferences || {},
      visibleIn: new Map(),
      hiddenIn: 0,
    });
  }
  return layers.get(path);
}

async function walk(node, path, variant) {
  coverage.walked++;
  const record = layerRecord(path, node);
  if (node.type === 'INSTANCE') {
    const main = await node.getMainComponentAsync();
    record.mainComponent = main ? main.name : 'unknown';
  }
  if (node.visible === false) {
    record.hiddenIn++;
    coverage.hidden++;
    if ('findAll' in node) coverage.insideHidden += node.findAll().length;
    return;
  }
  coverage.summarized++;
  record.visibleIn.set(keyOf(variant, axes), await readFacts(node));
  if ('children' in node) {
    for (const [index, child] of node.children.entries()) {
      await walk(child, `${path}/${index}:${child.name}`, variant);
    }
  }
}

for (const variant of variantNodes) await walk(variant, 'root', variant);

function subsetsBySize(names) {
  const subsets = [[]];
  for (const name of names) {
    for (const subset of [...subsets]) subsets.push([...subset, name]);
  }
  return subsets.sort((first, second) => first.length - second.length);
}

// Finds the fewest axes that fully determine a field's value, which is what
// turns 135 variants into "height depends only on size".
function summarizeField(field, visibleIn) {
  const entries = [...visibleIn].map(([key, facts]) => ({
    properties: Object.fromEntries(
      axes.map((axis, index) => [axis, key.split('|')[index]]),
    ),
    value: facts[field] ?? 'none',
  }));
  for (const subset of subsetsBySize(axes)) {
    const byKey = new Map();
    const isDetermined = entries.every(({ properties, value }) => {
      const key = subset.map((axis) => properties[axis]).join('|');
      if (byKey.has(key) && byKey.get(key) !== value) return false;
      byKey.set(key, value);
      return true;
    });
    if (isDetermined) {
      return subset.length === 0
        ? { field, value: entries[0].value }
        : { field, dependsOn: subset, values: Object.fromEntries(byKey) };
    }
  }
  throw new Error(`Field ${field} is not determined by any axes`);
}

const summarized = [];
const hidden = [];
for (const [path, record] of layers) {
  const base = { path, name: record.name, type: record.type };
  if (Object.keys(record.references).length > 0) {
    base.references = record.references;
  }
  if (record.mainComponent) base.mainComponent = record.mainComponent;
  if (record.hiddenIn > 0) {
    hidden.push({ ...base, hiddenInVariants: record.hiddenIn });
  }
  if (record.visibleIn.size > 0) {
    const fields = new Set(
      [...record.visibleIn.values()].flatMap((facts) => Object.keys(facts)),
    );
    summarized.push({
      ...base,
      visibleInVariants: record.visibleIn.size,
      facts: [...fields].map((field) =>
        summarizeField(field, record.visibleIn),
      ),
    });
  }
}

const payload = {
  source: { id: root.id, name: root.name, type: root.type },
  description: root.description,
  properties: definitions,
  axes,
  variantCount: variantNodes.length,
  coverage,
  summarized,
  hidden,
};

return { hash: fnv1a(JSON.stringify(payload)), payload };
