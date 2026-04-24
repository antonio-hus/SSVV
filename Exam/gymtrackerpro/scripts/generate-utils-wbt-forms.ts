// generate-utils-wbt-forms.ts  (updated section)

import * as path from 'path';
import {writeWbt, WbtDescriptor} from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', '__tests__', 'wbt');

const escapeLikeWbt: WbtDescriptor = {
    reqId: 'UTIL-01',
    statement: 'escapeLike(value: string): string — escapes \\, %, _ in a raw string for safe use in Prisma LIKE/ILIKE filters',
    data: 'Input: value: string',
    precondition: 'value is a well-formed JavaScript string (may be empty)',
    results: 'Output: string with every \\, %, _ prefixed by a backslash',
    postcondition: 'Returned string contains no unescaped \\, %, or _ characters; all other characters are unchanged',

    // ── CFG ──────────────────────────────────────────────────────────────────
    cfgDot: `digraph CFG {
      rankdir=TB;
      splines=polyline;
      node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
      edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
    
      start [label="" shape=circle width=0.25 style=filled fillcolor=black];
      exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
    
      s1   [label="escaped = value.replace(/[\\\\\\\\%_]/g, '\\\\\\\\$&')" shape=box];
      ret  [label="return escaped" shape=box];
    
      start -> s1:n;
      s1:s  -> ret:n;
      ret:s -> exit;
    }`,

    cfgSourceCode: [
        "export function escapeLike(value: string): string {",
        "  const escaped = value.replace(/[\\\\%_]/g, '\\\\$&');",
        "  return escaped;",
        "}",
    ],

    cyclomaticComplexity: {
        cc1Regions: 1,   // 1 enclosed region (the outer region only)
        cc2EdgeNodePlus2: 1,   // E=2, N=3 → 2 − 3 + 2 = 1
        cc3PredicatePlus1: 1,   // P=0 → 0 + 1 = 1
    },

    predicates: [],   // no decision nodes

    paths: [
        {id: '1', description: 'start -> s1 -> ret -> exit  (single-path: replace executes, result is returned)'},
    ],

    hasLoopCoverage: false,

    // ── Test cases ─────────────────────────────────────────────────────────────
    // MCC with 0 predicates: only statement coverage is needed.
    // We add extra TCs to cover each special character class and the empty string.
    tcRows: [
        {
            noTc: '1',
            inputData: 'value = "" (empty string)',
            expected: 'Returns ""',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '2',
            inputData: 'value = "hello" (no special characters)',
            expected: 'Returns "hello" unchanged',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '3',
            inputData: 'value = "50%" (contains %)',
            expected: 'Returns "50\\\\%"',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '4',
            inputData: 'value = "col_name" (contains _)',
            expected: 'Returns "col\\\\_name"',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '5',
            inputData: 'value = "C:\\\\path" (contains backslash)',
            expected: 'Returns "C:\\\\\\\\path"',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '6',
            inputData: 'value = "%_\\\\" (all three special characters)',
            expected: 'Returns "\\\\%\\\\_\\\\\\\\"',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],

    remarks: [
        '1) statementCoverage is marked true only for TC1 because it is the first TC to execute s1 and ret; TCs 2–6 re-execute the same statements and add no new statement coverage.',
    ],

    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

async function main(): Promise<void> {
    console.log('Generating utils WBT forms…');

    await writeWbt(escapeLikeWbt, path.join(BASE, 'utils', 'escapeLike-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});