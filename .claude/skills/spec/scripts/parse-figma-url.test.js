import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseFigmaUrl } from './parse-figma-url.js';

const FILE_KEY = 'HiDiGLs2OsVWyqnCo7aEjF';

describe('parseFigmaUrl', () => {
  it('reads the file key and converts the node ID', () => {
    assert.deepEqual(
      parseFigmaUrl(
        `https://www.figma.com/design/${FILE_KEY}/Yuschick?node-id=148-2149&t=abc`,
      ),
      { fileKey: FILE_KEY, nodeId: '148:2149' },
    );
  });

  it('uses the branch key for a branch URL', () => {
    assert.equal(
      parseFigmaUrl(
        `https://figma.com/design/${FILE_KEY}/branch/${'b'.repeat(22)}/Name?node-id=1-2`,
      ).fileKey,
      'b'.repeat(22),
    );
  });

  for (const [name, input, message] of [
    ['text that is not a URL', 'button', /isn't a URL/],
    [
      'plain http',
      `http://figma.com/design/${FILE_KEY}/a?node-id=1-2`,
      /https/,
    ],
    [
      'a lookalike host',
      `https://figma.com.example.org/design/${FILE_KEY}/a?node-id=1-2`,
      /https figma\.com/,
    ],
    [
      'a FigJam board',
      `https://figma.com/board/${FILE_KEY}/a?node-id=1-2`,
      /design file/,
    ],
    [
      'a missing file key',
      'https://figma.com/design/short/a?node-id=1-2',
      /file key/,
    ],
    ['a missing node ID', `https://figma.com/design/${FILE_KEY}/a`, /node-id/],
    [
      'a malformed node ID',
      `https://figma.com/design/${FILE_KEY}/a?node-id=abc`,
      /node-id/,
    ],
  ]) {
    it(`rejects ${name}`, () => {
      assert.throws(() => parseFigmaUrl(input), message);
    });
  }
});
