import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const STATIC_ROOT = resolve('packages/storybook/storybook-static');
const CONTENT_TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
};

const { values } = parseArgs({
  options: { story: { type: 'string' }, output: { type: 'string' } },
});
if (!values.story || !values.output) {
  throw new Error('Usage: capture-story.js --story <id> --output <file.png>');
}

// Playwright belongs to @dy/storybook, so resolve it from there.
const require = createRequire(resolve('packages/storybook/package.json'));
const { chromium } = require('playwright');

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const file = join(STATIC_ROOT, pathname);
  if (!file.startsWith(STATIC_ROOT) || !existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
});
await new Promise((ready) => {
  server.listen(0, '127.0.0.1', ready);
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
  });
  const { port } = server.address();
  await page.goto(
    `http://127.0.0.1:${port}/iframe.html?id=${values.story}&viewMode=story`,
  );
  await page.locator('#storybook-root > *').first().waitFor();
  await page.screenshot({ path: resolve(values.output), fullPage: true });
  console.log(resolve(values.output));
} finally {
  await browser.close();
  server.close();
}
