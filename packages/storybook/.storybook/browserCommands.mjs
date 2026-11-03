/**
 * Browser controls for story tests, run in Node by Vitest's Playwright provider.
 *
 * Storybook keeps Vitest's general `cdp()` API locked, because unlocking it also
 * allows file writes and code execution through the Vitest API. These commands
 * expose only the two abilities the tests need.
 */

function findFrameDocuments(node, frameDocuments = []) {
  if (node.contentDocument) {
    frameDocuments.push(node.contentDocument);
    findFrameDocuments(node.contentDocument, frameDocuments);
  }
  for (const child of node.children ?? []) {
    findFrameDocuments(child, frameDocuments);
  }
  return frameDocuments;
}

/** Applies user preferences such as forced colors. `null` resets a preference. */
export async function emulateMedia(context, media) {
  await context.page.emulateMedia(media);
}

// Chromium drops forced pseudo-classes when the session that set them detaches,
// so each page keeps one session for its lifetime.
const sessions = new WeakMap();

async function getSession({ context, page }) {
  if (!sessions.has(page)) {
    const session = await context.newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    sessions.set(page, session);
  }
  return sessions.get(page);
}

/**
 * Forces pseudo-classes on the first match in the test frame, so real CSS
 * applies without moving the mouse. An empty list clears them.
 */
export async function forcePseudoState(context, selector, pseudoClasses) {
  const session = await getSession(context);
  const { root } = await session.send('DOM.getDocument', {
    depth: -1,
    pierce: true,
  });
  for (const frameDocument of findFrameDocuments(root)) {
    const { nodeId } = await session.send('DOM.querySelector', {
      nodeId: frameDocument.nodeId,
      selector,
    });
    if (nodeId) {
      await session.send('CSS.forcePseudoState', {
        nodeId,
        forcedPseudoClasses: pseudoClasses,
      });
      return;
    }
  }
  throw new Error(`No element matches ${selector}.`);
}
