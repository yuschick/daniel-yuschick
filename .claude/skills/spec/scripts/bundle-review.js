import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { project } from '../../_shared/scripts/project.js';
import { buildBundle } from '../../_shared/scripts/review-bundle.js';

async function main() {
  const { values } = parseArgs({
    options: {
      spec: { type: 'string' },
      facts: { type: 'string' },
      standards: { type: 'string', default: project.paths.standards },
    },
  });
  if (!values.spec || !values.facts) {
    throw new Error('Usage: bundle-review.js --spec <file> --facts <file>');
  }

  const markdown = await readFile(resolve(values.spec), 'utf8');
  const { payload } = JSON.parse(await readFile(resolve(values.facts), 'utf8'));
  const standards = {};
  for (const file of await readdir(resolve(values.standards))) {
    if (file.endsWith('.md') && file !== 'README.md') {
      standards[file] = await readFile(
        join(resolve(values.standards), file),
        'utf8',
      );
    }
  }

  const bundle = buildBundle({ markdown, payload, standards });
  const component = basename(values.spec, '.md');
  const output = resolve(
    `node_modules/.cache/spec/${component}/review-bundle.md`,
  );
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bundle);

  const allStandards = Object.values(standards).join('').length;
  console.log(
    `${output}\n${bundle.length} characters, against ${allStandards} for all standards.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
