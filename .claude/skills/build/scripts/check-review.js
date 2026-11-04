import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parseSpec } from '../../spec/scripts/check-spec.js';
import {
  componentPaths,
  isReportRecorded,
  latestReport,
  MAX_INVALID_REPORTS,
  MAX_REVIEW_ROUNDS,
  readReviewState,
  treeHash,
  writeReviewState,
} from './shared.js';

const VERDICT_ROW =
  /^\|\s*([A-Z]+\d+)\s*\|\s*(PASS|FAIL|QUESTION|N\/A)\s*\|(.*)\|\s*$/gm;
const FINDING = /^- (F\d+) \[(FAIL|QUESTION)\]/gm;
const CITATION = /([\w./-]+\.\w+):(\d+)/g;
const ABSENT = /^absent:\s*`?(.+?)`?\s+in\s+(.+)$/;
const NOT_APPLICABLE = /^n\/a:\s*\S/;
const STANDARDS_ROW = /^STD\d+$/;

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
  [...rows]
    .filter(([, { verdict }]) => verdict === 'FAIL' || verdict === 'QUESTION')
    .map(([id]) => id);

/**
 * A reviewer's evidence is checked against the code, so a citation has to point
 * at a real line and a claim that something is missing has to be true.
 *
 * @param {{ id: string, row: { verdict: string, evidence: string }, readSource: (file: string) => string | null }} options
 * @returns {string[]}
 */
export function checkEvidence({ id, row, readSource }) {
  const { verdict, evidence } = row;
  if (verdict === 'N/A') {
    if (!STANDARDS_ROW.test(id)) {
      return [`${id} is a spec requirement, so it can't be N/A.`];
    }
    return NOT_APPLICABLE.test(evidence)
      ? []
      : [`${id} needs a reason: "n/a: <why>".`];
  }

  const absent = evidence.match(ABSENT);
  if (absent) {
    const [, term, files] = absent;
    return files.split(/,\s*|\s+and\s+/).flatMap((file) => {
      const source = readSource(file.trim());
      if (source === null)
        return [`${id} searched ${file}, which doesn't exist.`];
      return source.includes(term)
        ? [`${id} says ${term} is absent from ${file}, but it's there.`]
        : [];
    });
  }

  const citations = [...evidence.matchAll(CITATION)];
  if (citations.length === 0) {
    return [
      `${id} needs evidence: a file:line, or "absent: <term> in <file>".`,
    ];
  }
  return citations.flatMap(([citation, file, line]) => {
    const source = readSource(file);
    if (source === null) return [`${id} cites ${file}, which doesn't exist.`];
    return Number(line) >= 1 && Number(line) <= source.split('\n').length
      ? []
      : [`${id} cites ${citation}, past the end of the file.`];
  });
}

/**
 * Invalid reports don't count as a round, because they prove nothing either way.
 *
 * @param {{ report: ReturnType<typeof parseReport>, ledgerIds: string[], hash: string, readSource: (file: string) => string | null }} options
 * @returns {string[]}
 */
export function checkReport({ report, ledgerIds, hash, readSource }) {
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
    errors.push(...checkEvidence({ id, row, readSource }));
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
 * Records a report once, however many times it's checked. The author never
 * passes in a count, so it can't lose track of a round.
 *
 * @param {{ state: ReturnType<typeof readReviewState>, file: string, verdict: 'PASS' | 'FAIL' | 'INVALID', hash: string, flagged?: string[] }} options
 * @returns {ReturnType<typeof readReviewState>}
 */
export function recordReview({ state, file, verdict, hash, flagged = [] }) {
  if (isReportRecorded(state, file)) return state;
  if (verdict === 'INVALID') {
    return { ...state, invalid: [...state.invalid, file] };
  }
  return {
    ...state,
    rounds: [...state.rounds, { file, verdict, treeHash: hash, flagged }],
  };
}

/**
 * @param {{ flagged: string[], rounds: { file: string, flagged: string[] }[], file: string }} options
 * @returns {string[]} Ledger rows flagged again after an earlier round's fix.
 */
export function findRepeats({ flagged, rounds, file }) {
  const earlier = new Set(
    rounds
      .filter((round) => round.file !== file)
      .flatMap((round) => round.flagged),
  );
  return flagged.filter((id) => earlier.has(id));
}

/**
 * Validates and records the newest report. The reviewer's hook runs this as soon
 * as it saves a report, so the author can't change the code first and turn a
 * failed round into a stale report. Rechecking changes nothing already recorded.
 *
 * @param {string} component
 * @returns {{ result: 'MISSING' | 'INVALID' | 'PASS' | 'FAIL', errors: string[], lines: string[] }}
 */
export function processLatestReport(component) {
  const { cache, spec } = componentPaths(component);
  const state = readReviewState(cache);
  const file = latestReport(cache);
  if (file === null) {
    return {
      result: 'MISSING',
      errors: [
        "The reviewer's report wasn't saved, so its hook didn't run. Stop and tell Daniel. Never write a report yourself.",
      ],
      lines: [],
    };
  }

  const name = parseSpec(readFileSync(resolve(spec), 'utf8')).meta.component;
  const readSource = (path) => {
    const found = [
      resolve(path),
      resolve('packages/react/src/components', name, path),
    ].find((candidate) => existsSync(candidate));
    return found ? readFileSync(found, 'utf8') : null;
  };
  const ledger = JSON.parse(
    readFileSync(resolve(cache, 'ledger.json'), 'utf8'),
  );
  const report = parseReport(readFileSync(resolve(cache, file), 'utf8'));
  const hash = treeHash();
  const errors = checkReport({
    report,
    ledgerIds: ledger.map(({ id }) => id),
    hash,
    readSource,
  });

  if (errors.length > 0) {
    const updated = recordReview({ state, file, verdict: 'INVALID', hash });
    writeReviewState(cache, updated);
    return {
      result: 'INVALID',
      errors,
      lines:
        updated.invalid.length >= MAX_INVALID_REPORTS
          ? [`STOP: ${updated.invalid.length} invalid reports. Show Daniel.`]
          : [],
    };
  }

  const flagged = flaggedIds(report);
  const updated = recordReview({
    state,
    file,
    verdict: report.verdict,
    hash,
    flagged,
  });
  writeReviewState(cache, updated);

  const repeats = findRepeats({ flagged, rounds: updated.rounds, file });
  const failures = updated.rounds.filter(
    ({ verdict }) => verdict === 'FAIL',
  ).length;
  return {
    result: report.verdict,
    errors: [],
    lines: [
      ...[...report.rows]
        .filter(([id]) => flagged.includes(id))
        .map(([id, row]) => `${row.verdict}: ${id} ${row.evidence}`),
      ...(repeats.length > 0 ? [`REPEAT: ${repeats.join(', ')}`] : []),
      `ROUND: ${failures} of ${MAX_REVIEW_ROUNDS} used.`,
      ...(report.verdict !== 'PASS' && failures >= MAX_REVIEW_ROUNDS
        ? [
            `STOP: ${MAX_REVIEW_ROUNDS} rounds failed. Show Daniel. No PR, and no more reviews unless he resets them.`,
          ]
        : []),
    ],
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      component: { type: 'string' },
      reset: { type: 'boolean', default: false },
    },
  });
  if (!values.component) {
    throw new Error('Usage: check-review.js --component <name> [--reset]');
  }

  // The hooks ask Daniel before this runs: more rounds are only his to give.
  if (values.reset) {
    const { cache } = componentPaths(values.component);
    const state = readReviewState(cache);
    writeReviewState(cache, {
      rounds: [],
      invalid: [],
      history: [...state.history, ...state.rounds],
      resets: state.resets + 1,
    });
    console.log('Review rounds reset.');
    return;
  }

  const { result, errors, lines } = processLatestReport(values.component);
  for (const error of errors) console.error(`ERROR: ${error}`);
  for (const line of lines) console.log(line);
  console.log(`RESULT: ${result}`);
  if (result === 'FAIL') process.exitCode = 2;
  else if (result !== 'PASS') process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
