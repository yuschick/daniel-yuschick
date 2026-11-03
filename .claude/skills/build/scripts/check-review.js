import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { componentPaths, treeHash } from './shared.js';

const VERDICT_ROW =
  /^\|\s*([A-Z]+\d+)\s*\|\s*(PASS|FAIL|QUESTION)\s*\|(.*)\|\s*$/gm;
const FINDING = /^- (F\d+) \[(FAIL|QUESTION)\]/gm;
// A file and line, or a stated search for something that must be missing.
const EVIDENCE = /[\w./-]+\.\w+:\d+|absent:\s*\S/;

/** @param {string} report */
export function parseReport(report) {
  const rows = new Map();
  for (const [, id, verdict, evidence] of report.matchAll(VERDICT_ROW)) {
    rows.set(id, { verdict, evidence: evidence.trim() });
  }
  return {
    rows,
    findings: [...report.matchAll(FINDING)].map(([, id, verdict]) => ({
      id,
      verdict,
    })),
    reviewed: report.match(/^REVIEWED: (\S+)/m)?.[1] ?? null,
    verdict: report.match(/^VERDICT: (PASS|FAIL)\s*$/m)?.[1] ?? null,
  };
}

const flaggedIds = ({ rows }) =>
  [...rows].filter(([, row]) => row.verdict !== 'PASS').map(([id]) => id);

/**
 * Invalid reports don't count as a round, because they prove nothing either way.
 *
 * @param {{ report: ReturnType<typeof parseReport>, ledgerIds: string[], hash: string }} options
 * @returns {string[]}
 */
export function checkReport({ report, ledgerIds, hash }) {
  const errors = [];
  if (report.reviewed !== hash) {
    errors.push(
      `The report reviewed ${report.reviewed}, but the code is ${hash}.`,
    );
  }
  for (const id of ledgerIds) {
    if (!report.rows.has(id)) errors.push(`Ledger row ${id} has no verdict.`);
  }
  for (const [id, row] of report.rows) {
    if (!ledgerIds.includes(id)) errors.push(`${id} isn't in the ledger.`);
    if (!EVIDENCE.test(row.evidence)) {
      errors.push(
        `${id} needs evidence: a file:line, or "absent: <what was searched>".`,
      );
    }
  }
  const isFlagged = flaggedIds(report).length > 0 || report.findings.length > 0;
  if (report.verdict === null) errors.push('The report has no VERDICT line.');
  if (report.verdict === 'PASS' && isFlagged) {
    errors.push('The verdict is PASS, but the report has flags.');
  }
  if (report.verdict === 'FAIL' && !isFlagged) {
    errors.push('The verdict is FAIL, but the report has no flags.');
  }
  return errors;
}

/**
 * @param {{ current: ReturnType<typeof parseReport>, previous: ReturnType<typeof parseReport>[] }} options
 * @returns {string[]} Ledger rows flagged again after an earlier round's fix.
 */
export function findRepeats({ current, previous }) {
  const earlier = new Set(previous.flatMap(flaggedIds));
  return flaggedIds(current).filter((id) => earlier.has(id));
}

function main() {
  const { values } = parseArgs({
    options: {
      component: { type: 'string' },
      report: { type: 'string' },
      previous: { type: 'string', multiple: true, default: [] },
    },
  });
  if (!values.component || !values.report) {
    throw new Error(
      'Usage: check-review.js --component <name> --report <file> [--previous <file>]...',
    );
  }

  const read = (file) => parseReport(readFileSync(resolve(file), 'utf8'));
  const { cache } = componentPaths(values.component);
  const ledger = JSON.parse(
    readFileSync(resolve(cache, 'ledger.json'), 'utf8'),
  );
  const report = read(values.report);
  const errors = checkReport({
    report,
    ledgerIds: ledger.map(({ id }) => id),
    hash: treeHash(),
  });

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    console.log('RESULT: INVALID');
    process.exitCode = 1;
    return;
  }
  const repeats = findRepeats({
    current: report,
    previous: values.previous.map(read),
  });
  console.log(
    [...report.rows]
      .filter(([, row]) => row.verdict !== 'PASS')
      .map(([id, row]) => `${row.verdict}: ${id} ${row.evidence}`)
      .join('\n'),
  );
  if (repeats.length > 0) console.log(`REPEAT: ${repeats.join(', ')}`);
  console.log(`RESULT: ${report.verdict}`);
  if (report.verdict !== 'PASS') process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
