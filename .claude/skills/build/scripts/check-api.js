import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const CHECK_FILE = 'api-check.ts';
const COMPILER_ERROR = /api-check\.ts\((\d+),\d+\): error TS\d+: (.+)/;
// From node_modules/.cache/build/<component>, where the check is generated.
const TO_ROOT = '../../../..';

const literal = (value) => `'${value}'`;
const union = (values) => values.map(literal).join(' | ');

/**
 * The spec's type cell can carry prose after the type, so this stops at the
 * first comma outside the type's generics.
 *
 * @param {string} cell
 * @returns {string}
 */
export function readTypeExpression(cell) {
  let depth = 0;
  for (const [index, character] of [...cell].entries()) {
    if (character === '<') depth += 1;
    if (character === '>') depth -= 1;
    if (character === ',' && depth === 0) return cell.slice(0, index).trim();
  }
  return cell.trim();
}

/**
 * Turns the spec's API table into types the compiler has to prove, in both
 * directions. Each assertion is assigned to `never`, so a failure names the
 * invented or missing prop or value, however many types it came through.
 *
 * @param {{ meta: { component: string }, sections: Map<string, { rows: string[][] }> }} spec
 * @returns {{ source: string, labels: Map<number, string> }}
 */
export function renderApiCheck({ meta, sections }) {
  const rows = sections.get('API')?.rows.slice(1) ?? [];
  const props = rows.filter(([prop]) => !prop.startsWith('...'));
  const rest = rows.find(([prop]) => prop.startsWith('...'));
  const names = union(props.map(([prop]) => prop));

  const assertions = [
    ['Invented prop', `Exclude<OwnProps, ${names}>`],
    ['Missing prop', `Exclude<${names}, keyof Props>`],
    ['Missing HTML attribute', 'Exclude<keyof Rest, keyof Props>'],
  ];
  for (const [prop, type, values, defaultValue] of props) {
    const key = `Props[${literal(prop)}]`;
    const isOptional = `{} extends Pick<Props, ${literal(prop)}>`;
    if (values !== '-') {
      const allowed = union(values.split(',').map((value) => value.trim()));
      assertions.push(
        [
          `Invented value on ${prop}`,
          `Exclude<NonNullable<${key}>, ${allowed}>`,
        ],
        [
          `Missing value on ${prop}`,
          `Exclude<${allowed}, NonNullable<${key}>>`,
        ],
      );
    }
    if (defaultValue !== '-') {
      assertions.push([
        `${prop} has a default, so it must be optional`,
        `${isOptional} ? never : ${literal(prop)}`,
      ]);
    }
    if (type.startsWith('Required')) {
      assertions.push([
        `${prop} must be required`,
        `${isOptional} ? ${literal(prop)} : never`,
      ]);
    }
  }

  const header = [
    "import type { SanitizedHTMLAttributes, SanitizedSVGAttributes, WithChildren } from '@package-internal/types/type-helpers';",
    `import type { ${meta.component} } from '@package-components/${meta.component}/${meta.component}';`,
    `type Props = React.ComponentProps<typeof ${meta.component}>;`,
    `type Rest = ${rest ? readTypeExpression(rest[1]) : 'object'};`,
    'type OwnProps = Exclude<keyof Props, keyof Rest>;',
  ];
  const labels = new Map(
    assertions.map(([label], index) => [header.length + index + 1, label]),
  );
  const source = [
    ...header,
    ...assertions.map(
      ([, type], index) =>
        `export const assertion${index}: never = undefined as unknown as ${type};`,
    ),
    '',
  ].join('\n');
  return { source, labels };
}

/**
 * @param {{ output: string, labels: Map<number, string> }} options
 * @returns {string[]}
 */
export function parseCompilerOutput({ output, labels }) {
  return output
    .split('\n')
    .filter((line) => /error TS\d+/.test(line))
    .map((line) => {
      const [, assertionLine, message] = line.match(COMPILER_ERROR) ?? [];
      const label = labels.get(Number(assertionLine));
      return label ? `API: ${label}: ${message}` : `API: ${line.trim()}`;
    });
}

/**
 * @param {{ spec: Parameters<typeof renderApiCheck>[0], cache: string }} options
 * @returns {string[]}
 */
export function checkApiTypes({ spec, cache }) {
  const { source, labels } = renderApiCheck(spec);
  const directory = resolve(cache);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, CHECK_FILE), source);
  writeFileSync(
    resolve(directory, 'tsconfig.json'),
    JSON.stringify({
      extends: `${TO_ROOT}/packages/react/tsconfig.json`,
      compilerOptions: {
        noEmit: true,
        noUnusedLocals: false,
        rootDir: TO_ROOT,
      },
      files: [
        CHECK_FILE,
        `${TO_ROOT}/packages/react/src/internal/types/globals.d.ts`,
      ],
      // Only what the component imports. check-types covers the rest.
      include: [],
    }),
  );

  // TypeScript belongs to @dy/react, so resolve it from there.
  const require = createRequire(resolve('packages/react/package.json'));
  const manifestPath = require.resolve('typescript/package.json');
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const result = spawnSync(
    process.execPath,
    [
      resolve(dirname(manifestPath), bin.tsc),
      '-p',
      resolve(directory, 'tsconfig.json'),
      '--pretty',
      'false',
    ],
    { encoding: 'utf8' },
  );
  if (result.status === 0) return [];

  const errors = parseCompilerOutput({
    output: result.stdout + result.stderr,
    labels,
  });
  return errors.length > 0
    ? errors
    : [`API: the compiler failed:\n${result.stdout}${result.stderr}`.trim()];
}
