import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ATTRIBUTES,
  buildManifest,
  mergeParts,
  parseGlyph,
  VIEW_BOX,
  verifyPart,
} from './figma-to-icon-manifest.js';
import { fnv1a } from './hash.js';

// Real exports from Figma's exportAsync({ format: 'SVG_STRING' })
const STROKE =
  'stroke="#25242D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** @param {{ body: string, root?: string }} options */
const figmaSvg = ({ body, root = '' }) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"${root}>\n${body}\n</svg>\n`;

const CHEVRON_DOWN = figmaSvg({
  body: `<path d="M6 9L12 15L18 9" ${STROKE}/>`,
});
const EXTERNAL_LINK = figmaSvg({
  body: [
    `<path d="M15 3H21V9" ${STROKE}/>`,
    `<path d="M10 14L21 3" ${STROKE}/>`,
    `<path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" ${STROKE}/>`,
  ].join('\n'),
});

/** @param {{ name: string, svg?: string, id?: string }} options */
const glyph = ({ name, svg = CHEVRON_DOWN, id = `1:${name.length}` }) => ({
  id,
  key: `key-${name}`,
  name,
  // As Figma returns it: HTML-escaped
  description: ` Lucide &quot;${name}&quot; &amp;&#39;s. `,
  svg,
});

/** @param {{ icons: ReturnType<typeof glyph>[], offset?: number, total?: number, sectionId?: string }} options */
const part = ({
  icons,
  offset = 0,
  total = icons.length,
  sectionId = '259:442',
}) => {
  const payload = {
    section: { id: sectionId, name: 'Icons' },
    total,
    offset,
    icons,
  };
  return { hash: fnv1a(JSON.stringify(payload)), payload };
};

describe('parseGlyph', () => {
  it('keeps geometry only, optimized to the shape Lucide publishes', () => {
    assert.deepEqual(parseGlyph({ name: 'chevron-down', svg: CHEVRON_DOWN }), [
      ['path', { d: 'm6 9 6 6 6-6' }],
    ]);
    assert.deepEqual(
      parseGlyph({ name: 'external-link', svg: EXTERNAL_LINK }),
      [
        ['path', { d: 'M15 3h6v6' }],
        ['path', { d: 'M10 14 21 3' }],
        [
          'path',
          { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' },
        ],
      ],
    );
  });

  it('keeps one element per Figma layer instead of merging paths', () => {
    const svg = figmaSvg({
      body: `<path d="M4 5H20" ${STROKE}/>\n<path d="M4 12H20" ${STROKE}/>`,
    });
    assert.equal(parseGlyph({ name: 'menu', svg }).length, 2);
  });

  it('keeps the geometry of shapes other than paths', () => {
    const svg = figmaSvg({
      body: `<circle cx="12" cy="12" r="10" ${STROKE}/>`,
    });
    const [[element, attributes]] = parseGlyph({ name: 'circle', svg });
    assert.ok(['circle', 'path'].includes(element));
    assert.ok(Object.keys(attributes).length > 0);
  });

  const rejects = [
    {
      reason: 'a grid other than 24×24',
      svg: CHEVRON_DOWN.replaceAll('24', '20'),
      error: /viewBox/,
    },
    {
      reason: 'a filled shape',
      svg: figmaSvg({ body: '<path d="M6 9L12 15L18 9Z" fill="#25242D"/>' }),
      error: /must have a stroke|not filled/,
    },
    {
      reason: 'a fill alongside the stroke',
      svg: figmaSvg({
        body: `<path d="M6 9L12 15L18 9Z" fill="#25242D" ${STROKE}/>`,
      }),
      error: /not filled/,
    },
    {
      reason: 'a second stroke color',
      svg: figmaSvg({
        body: `<path d="M4 5H20" ${STROKE}/>\n<path d="M4 12H20" ${STROKE.replace('#25242D', '#FF0000')}/>`,
      }),
      error: /2 stroke colors/,
    },
    {
      reason: 'a different stroke width',
      svg: figmaSvg({
        body: `<path d="M6 9L12 15L18 9" ${STROKE.replace('"2"', '"1.5"')}/>`,
      }),
      error: /stroke-width is 1.5/,
    },
    {
      reason: 'square caps',
      svg: figmaSvg({
        body: `<path d="M6 9L12 15L18 9" ${STROKE.replace('linecap="round"', 'linecap="square"')}/>`,
      }),
      error: /stroke-linecap is square/,
    },
    {
      reason: 'a mask',
      svg: figmaSvg({
        body: `<mask id="m"><rect width="24" height="24" fill="white"/></mask>\n<path d="M6 9L12 15L18 9" ${STROKE} mask="url(#m)"/>`,
      }),
      error: /isn't allowed/,
    },
    {
      reason: 'an embedded image',
      svg: figmaSvg({
        body: '<image href="data:image/png;base64,AAAA" width="24" height="24"/>',
      }),
      error: /<image> isn't allowed/,
    },
    {
      reason: 'a translucent stroke',
      svg: figmaSvg({
        body: `<path d="M6 9L12 15L18 9" ${STROKE} stroke-opacity="0.5"/>`,
      }),
      error: /stroke-opacity on <path> isn't allowed/,
    },
    {
      reason: 'a dashed stroke',
      svg: figmaSvg({
        body: `<path d="M6 9L12 15L18 9" ${STROKE} stroke-dasharray="2 2"/>`,
      }),
      error: /stroke-dasharray/,
    },
    {
      reason: 'an empty glyph',
      svg: figmaSvg({ body: '' }),
      error: /contains no shapes/,
    },
  ];

  for (const { reason, svg, error } of rejects) {
    it(`rejects ${reason}`, () => {
      assert.throws(() => parseGlyph({ name: 'broken', svg }), error);
    });
  }
});

describe('verifyPart', () => {
  it('accepts an untouched part and rejects an altered one', () => {
    const untouched = part({ icons: [glyph({ name: 'chevron-down' })] });
    verifyPart({ part: untouched, source: 'part.json' });

    const altered = structuredClone(untouched);
    altered.payload.icons[0].name = 'chevron-up';
    assert.throws(
      () => verifyPart({ part: altered, source: 'part.json' }),
      /altered after leaving Figma/,
    );
  });
});

describe('mergeParts', () => {
  const icons = ['a', 'b', 'c'].map((name) => glyph({ name }));

  it('joins slices in offset order', () => {
    const merged = mergeParts({
      parts: [
        part({ icons: icons.slice(2), offset: 2, total: 3 }),
        part({ icons: icons.slice(0, 2), offset: 0, total: 3 }),
      ],
    });
    assert.deepEqual(
      merged.glyphs.map(({ name }) => name),
      ['a', 'b', 'c'],
    );
  });

  it('rejects a missing slice', () => {
    assert.throws(
      () =>
        mergeParts({ parts: [part({ icons: icons.slice(0, 2), total: 3 })] }),
      /holds? 2/,
    );
  });

  it('rejects overlapping slices', () => {
    assert.throws(
      () =>
        mergeParts({
          parts: [
            part({ icons: icons.slice(0, 2), offset: 0, total: 3 }),
            part({ icons: icons.slice(1), offset: 1, total: 3 }),
          ],
        }),
      /starting at 2/,
    );
  });

  it('rejects slices from different sections', () => {
    assert.throws(
      () =>
        mergeParts({
          parts: [
            part({ icons: icons.slice(0, 1), offset: 0, total: 2 }),
            part({
              icons: icons.slice(1, 2),
              offset: 1,
              total: 2,
              sectionId: '1:1',
            }),
          ],
        }),
      /different sections/,
    );
  });
});

describe('buildManifest', () => {
  const section = { id: '259:442', name: 'Icons' };

  it('stores the house style once and the icons sorted by name', () => {
    const manifest = buildManifest({
      section,
      glyphs: [
        glyph({ name: 'external-link', svg: EXTERNAL_LINK }),
        glyph({ name: 'chevron-down' }),
      ],
    });
    assert.equal(manifest.viewBox, VIEW_BOX);
    assert.deepEqual(manifest.attributes, ATTRIBUTES);
    assert.deepEqual(
      manifest.icons.map(({ name }) => name),
      ['chevron-down', 'external-link'],
    );
    assert.deepEqual(manifest.icons[0], {
      name: 'chevron-down',
      figma: { id: '1:12', key: 'key-chevron-down' },
      description: 'Lucide "chevron-down" &\'s.',
      nodes: [['path', { d: 'm6 9 6 6 6-6' }]],
    });
  });

  for (const name of [
    'ChevronDown',
    'chevron_down',
    '2-factor',
    'chevron--down',
    'chevron-down-',
  ]) {
    it(`rejects the name "${name}"`, () => {
      assert.throws(
        () => buildManifest({ section, glyphs: [glyph({ name })] }),
        /lowercase words joined by hyphens/,
      );
    });
  }

  it('rejects two glyphs with one name', () => {
    assert.throws(
      () =>
        buildManifest({
          section,
          glyphs: [
            glyph({ name: 'x', id: '1:1' }),
            glyph({ name: 'x', id: '1:2' }),
          ],
        }),
      /two glyphs share this name/,
    );
  });
});
