import { pathToFileURL } from 'node:url';

const FIGMA_HOSTS = new Set(['figma.com', 'www.figma.com']);
const FILE_KEY = /^[0-9a-zA-Z]{22,128}$/;
const NODE_ID = /^\d+[-:]\d+$/;

/**
 * Accepts only an https Figma design URL that points at one node, so a run
 * can't start from a guessed node or an unrelated site.
 *
 * @param {string} input
 * @returns {{ fileKey: string, nodeId: string }}
 */
export function parseFigmaUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`"${input}" isn't a URL.`);
  }

  if (url.protocol !== 'https:' || !FIGMA_HOSTS.has(url.hostname)) {
    throw new Error('The URL must be an https figma.com link.');
  }

  const [kind, fileKey, branchMarker, branchKey] = url.pathname
    .split('/')
    .filter(Boolean);
  if (kind !== 'design') {
    throw new Error('The URL must be a Figma design file (/design/).');
  }

  const resolvedKey = branchMarker === 'branch' ? branchKey : fileKey;
  if (!FILE_KEY.test(resolvedKey ?? '')) {
    throw new Error('The URL has no valid Figma file key.');
  }

  const nodeId = url.searchParams.get('node-id');
  if (!NODE_ID.test(nodeId ?? '')) {
    throw new Error('The URL must include a node-id for one component.');
  }

  return { fileKey: resolvedKey, nodeId: nodeId.replace('-', ':') };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(parseFigmaUrl(process.argv[2] ?? '')));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
