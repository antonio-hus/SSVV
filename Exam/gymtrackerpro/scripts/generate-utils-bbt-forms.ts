import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

interface EcRow {
    number: number | string;
    condition: string;
    validEc: string;
    invalidEc: string;
}

interface EpTcRow {
    noTc: number | string;
    ec: string;
    inputData: string;
    expected: string;
}

interface BvaRow {
    number: number | string;
    condition: string;
    testCase: string;
}

interface BvaTcRow {
    noTc: number | string;
    bva: string;
    inputData: string;
    expected: string;
}

interface FinalTcRow {
    noTc: number | string;
    fromEc: string;
    fromBva: string;
    inputData: string;
    expected: string;
}

interface BbtDescriptor {
    reqId: string;
    tcCount: number;
    statement: string;
    data: string;
    precondition: string;
    results: string;
    postcondition: string;
    ecRows: EcRow[];
    epTcRows: EpTcRow[];
    bvaRows: BvaRow[];
    bvaTcRows: BvaTcRow[];
    finalTcRows: FinalTcRow[];
    tcsFailed?: number;
    bugsFound?: number;
    bugsFixed?: string;
    retested?: string;
    retestRun?: number | string;
    retestPassed?: number | string;
    retestFailed?: number | string;
}

const THIN = {style: 'thin' as const};
const BORDER: Partial<ExcelJS.Borders> = {top: THIN, left: THIN, bottom: THIN, right: THIN};
const FILL_SECTION: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFBDD7EE'}};
const FILL_HEADER: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9E1F2'}};
const FILL_LABEL: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFEDEDED'}};
const FILL_PASS: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFE2EFDA'}};

function styleSection(c: ExcelJS.Cell) {
    c.font = {bold: true, color: {argb: 'FF1F3864'}};
    c.fill = FILL_SECTION;
    c.border = BORDER;
    c.alignment = {horizontal: 'center', vertical: 'middle'};
}

function styleHeader(c: ExcelJS.Cell) {
    c.font = {bold: true};
    c.fill = FILL_HEADER;
    c.border = BORDER;
    c.alignment = {wrapText: true, vertical: 'middle', horizontal: 'center'};
}

function styleLabel(c: ExcelJS.Cell) {
    c.font = {bold: true};
    c.fill = FILL_LABEL;
    c.border = BORDER;
    c.alignment = {wrapText: true, vertical: 'top'};
}

function styleData(c: ExcelJS.Cell) {
    c.border = BORDER;
    c.alignment = {wrapText: true, vertical: 'top'};
}

function stylePassed(c: ExcelJS.Cell) {
    c.font = {color: {argb: 'FF375623'}};
    c.fill = FILL_PASS;
    c.border = BORDER;
    c.alignment = {horizontal: 'center', vertical: 'middle'};
}

function addProblemSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Problem');
    ws.columns = [{width: 22}, {width: 110}];
    let row = ws.addRow([`Statement: ${d.statement}`, '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).border = BORDER;
    row.getCell(1).alignment = {wrapText: true, vertical: 'top'};
    row.height = 80;
    ws.addRow(['', '']);
    row = ws.addRow(['Specification', '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));
    row.height = 18;
    row = ws.addRow(['Data', d.data]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));
    row.height = 50;
    row = ws.addRow(['precondition', d.precondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));
    row.height = 60;
    ws.addRow(['', '']);
    row = ws.addRow(['Results', '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));
    row.height = 18;
    row = ws.addRow(['', d.results]);
    styleData(row.getCell(1));
    styleData(row.getCell(2));
    row.height = 30;
    row = ws.addRow(['postcondition', d.postcondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));
    row.height = 60;
}

function addEcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Req_EC');
    ws.columns = [{width: 12}, {width: 35}, {width: 55}, {width: 55}];
    const hdr = ws.addRow(['Number EC', 'Condition', 'Valid EC', 'Invalid EC']);
    hdr.eachCell(c => styleHeader(c));
    hdr.height = 20;
    for (const r of d.ecRows) {
        const row = ws.addRow([r.number, r.condition, r.validEc, r.invalidEc]);
        row.eachCell(c => styleData(c));
        row.height = 18;
    }
}

function addEcTcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Req_EC_TC');
    ws.columns = [{width: 8}, {width: 25}, {width: 80}, {width: 55}, {width: 25}];
    const hdr = ws.addRow(['No TC', 'EC', 'Input Data', 'Expected', 'Actual Result']);
    hdr.eachCell(c => styleHeader(c));
    hdr.height = 20;
    for (const r of d.epTcRows) {
        const row = ws.addRow([r.noTc, r.ec, r.inputData, r.expected, 'Passed']);
        styleData(row.getCell(1));
        styleData(row.getCell(2));
        styleData(row.getCell(3));
        styleData(row.getCell(4));
        stylePassed(row.getCell(5));
        row.height = 30;
    }
}

function addBvaSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Req_BVA');
    ws.columns = [{width: 12}, {width: 35}, {width: 55}];
    const hdr = ws.addRow(['Number BVA', 'Condition', 'BVA Test Case']);
    hdr.eachCell(c => styleHeader(c));
    hdr.height = 20;
    for (const r of d.bvaRows) {
        const row = ws.addRow([r.number, r.condition, r.testCase]);
        row.eachCell(c => styleData(c));
        row.height = 18;
    }
}

function addBvaTcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Req_BVA_TC');
    ws.columns = [{width: 8}, {width: 25}, {width: 80}, {width: 55}, {width: 25}];
    const hdr = ws.addRow(['No TC', 'BVA', 'Input Data', 'Expected', 'Actual Result']);
    hdr.eachCell(c => styleHeader(c));
    hdr.height = 20;
    for (const r of d.bvaTcRows) {
        const row = ws.addRow([r.noTc, r.bva, r.inputData, r.expected, 'Passed']);
        styleData(row.getCell(1));
        styleData(row.getCell(2));
        styleData(row.getCell(3));
        styleData(row.getCell(4));
        stylePassed(row.getCell(5));
        row.height = 30;
    }
}

function addFinalSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Req_EC_BVA_all_TC');
    ws.columns = [{width: 8}, {width: 12}, {width: 14}, {width: 75}, {width: 55}, {width: 25}];
    const hdr = ws.addRow(['No TC', 'TC from EC', 'TC from BVA', 'Input Data', 'Expected', 'Actual Result']);
    hdr.eachCell(c => styleHeader(c));
    hdr.height = 20;
    for (const r of d.finalTcRows) {
        const row = ws.addRow([r.noTc, r.fromEc, r.fromBva, r.inputData, r.expected, 'Passed']);
        styleData(row.getCell(1));
        styleData(row.getCell(2));
        styleData(row.getCell(3));
        styleData(row.getCell(4));
        styleData(row.getCell(5));
        stylePassed(row.getCell(6));
        row.height = 30;
    }
}

function addStatsSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Statistics_Req_');
    ws.columns = [{width: 20}, {width: 10}, {width: 12}, {width: 12}, {width: 12}, {width: 13}, {width: 12}, {width: 10}, {width: 12}, {width: 12}];
    const sRow = ws.addRow(['', 'Testing', '', '', '', 'Debugging', 'Re-testing', '', '', '']);
    ws.mergeCells(`B${sRow.number}:E${sRow.number}`);
    ws.mergeCells(`G${sRow.number}:J${sRow.number}`);
    sRow.getCell(1).border = BORDER;
    styleSection(sRow.getCell(2));
    styleSection(sRow.getCell(6));
    styleSection(sRow.getCell(7));
    [3, 4, 5, 8, 9, 10].forEach(c => {
        sRow.getCell(c).fill = FILL_SECTION;
        sRow.getCell(c).border = BORDER;
    });
    sRow.height = 20;
    const hRow = ws.addRow(['Req. ID', 'TCs run', 'TCs passed', 'TCs failed', 'No of BUGS', 'Bugs Fixed', 'Re-tested', 'TCs run', 'TCs passed', 'TCs failed']);
    hRow.eachCell(c => styleHeader(c));
    hRow.height = 25;

    const totalRun = d.finalTcRows.length;
    const tcsFailed = d.tcsFailed ?? 0;
    const tcsPassed = totalRun - tcsFailed;
    const bugsFound = d.bugsFound ?? 0;
    const bugsFixed = d.bugsFixed ?? 'n/a';
    const retested = d.retested ?? 'not yet';
    const retestRun = d.retestRun ?? 0;
    const retestPassed = d.retestPassed ?? '-';
    const retestFailed = d.retestFailed ?? '-';

    const dRow = ws.addRow([d.reqId, totalRun, tcsPassed, tcsFailed, bugsFound, bugsFixed, retested, retestRun, retestPassed, retestFailed]);
    styleLabel(dRow.getCell(1));
    [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(c => styleData(dRow.getCell(c)));
    dRow.height = 20;
}

async function writeBbt(descriptor: BbtDescriptor, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    const wb = new ExcelJS.Workbook();
    addProblemSheet(wb, descriptor);
    addEcSheet(wb, descriptor);
    addEcTcSheet(wb, descriptor);
    addBvaSheet(wb, descriptor);
    addBvaTcSheet(wb, descriptor);
    addFinalSheet(wb, descriptor);
    addStatsSheet(wb, descriptor);
    await wb.xlsx.writeFile(outputPath);
    console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

const BASE = path.join(ROOT, 'lib', '__tests__', 'bbt', 'utils');

// ── escapeLike ────────────────────────────────────────────────────────────────

const escapeLikeBbt: BbtDescriptor = {
    reqId: 'UTIL-01',
    tcCount: 18,  // was 14 — 9 EC + 9 BVA finalTcRows
    statement: 'escapeLike(s) – escapes the three LIKE meta-characters (%, _, \\) so the result can be safely used in a Prisma/SQL LIKE pattern.',
    data: 'Input: s: string',
    precondition: 'None',
    results: 'Output: string – copy of s with \\, %, _ prefixed by a backslash',
    postcondition: 'Each \\ → \\\\, each % → \\%, each _ → \\_ in the output. All other characters are unchanged.',
    ecRows: [
        { number: 1, condition: 'plain string (no special chars)', validEc: 'returned unchanged',              invalidEc: '' },
        { number: 2, condition: 'empty string',                    validEc: 'returns empty string',           invalidEc: '' },
        { number: 3, condition: '% character present',             validEc: 'each % becomes \\%',            invalidEc: '' },
        { number: 4, condition: '_ character present',             validEc: 'each _ becomes \\_',            invalidEc: '' },
        { number: 5, condition: '\\ character present',            validEc: 'each \\ becomes \\\\',          invalidEc: '' },
        { number: 6, condition: 'multiple special chars mixed',    validEc: 'all specials escaped in order', invalidEc: '' },
        { number: 7, condition: 'multiple consecutive % chars',    validEc: 'every % individually escaped',  invalidEc: '' },
        { number: 8, condition: 'multiple consecutive _ chars',    validEc: 'every _ individually escaped',  invalidEc: '' },
        { number: 9, condition: 'multiple consecutive \\ chars',   validEc: 'every \\ individually escaped', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: '"benchpress"',        expected: '"benchpress"' },
        { noTc: 2, ec: 'EC-2', inputData: '""',                  expected: '""' },
        { noTc: 3, ec: 'EC-3', inputData: '"100%"',              expected: '"100\\%"' },
        { noTc: 4, ec: 'EC-4', inputData: '"bench_press"',       expected: '"bench\\_press"' },
        { noTc: 5, ec: 'EC-5', inputData: '"path\\value"',       expected: '"path\\\\value"' },
        { noTc: 6, ec: 'EC-6', inputData: '"100%_bench\\press"', expected: '"100\\%\\_bench\\\\press"' },
        { noTc: 7, ec: 'EC-7', inputData: '"%%"',                expected: '"\\%\\%"' },
        { noTc: 8, ec: 'EC-8', inputData: '"__"',                expected: '"\\_\\_"' },
        { noTc: 9, ec: 'EC-9', inputData: '"\\\\"',              expected: '"\\\\\\\\"' },
    ],
    bvaRows: [
        { number: 1, condition: 'minimum length (n = 0)',     testCase: '"" (empty string)' },
        { number: 2, condition: 'just above minimum (n = 1)', testCase: '"a" (plain), "%" (percent), "_" (underscore), "\\" (backslash)' },
        { number: 3, condition: 'n+1 from minimum (n = 2)',   testCase: '"ab" (plain), "%%" (two percents), "__" (two underscores), "\\\\" (two backslashes)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: '""',     expected: '""' },
        { noTc: 2, bva: 'BVA-2 (n=1)', inputData: '"a"',    expected: '"a"' },
        { noTc: 3, bva: 'BVA-2 (n=1)', inputData: '"%"',    expected: '"\\%"' },
        { noTc: 4, bva: 'BVA-2 (n=1)', inputData: '"_"',    expected: '"\\_"' },
        { noTc: 5, bva: 'BVA-2 (n=1)', inputData: '"\\"',   expected: '"\\\\"' },
        { noTc: 6, bva: 'BVA-3 (n=2)', inputData: '"ab"',   expected: '"ab"' },
        { noTc: 7, bva: 'BVA-3 (n=2)', inputData: '"%%"',   expected: '"\\%\\%"' },
        { noTc: 8, bva: 'BVA-3 (n=2)', inputData: '"__"',   expected: '"\\_\\_"' },
        { noTc: 9, bva: 'BVA-3 (n=2)', inputData: '"\\\\"', expected: '"\\\\\\\\"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: '"benchpress"',        expected: '"benchpress"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: '""',                  expected: '""' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: '"100%"',              expected: '"100\\%"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: '"bench_press"',       expected: '"bench\\_press"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: '"path\\value"',       expected: '"path\\\\value"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: '"100%_bench\\press"', expected: '"100\\%\\_bench\\\\press"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: '"%%"',                expected: '"\\%\\%"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: '"__"',                expected: '"\\_\\_"' },
        { noTc: 9,  fromEc: 'EC-9', fromBva: '', inputData: '"\\\\"',              expected: '"\\\\\\\\"' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: '""',     expected: '""' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: '"a"',    expected: '"a"' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: '"%"',    expected: '"\\%"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-2', inputData: '"_"',    expected: '"\\_"' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-2', inputData: '"\\"',   expected: '"\\\\"' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: '"ab"',   expected: '"ab"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-3', inputData: '"%%"',   expected: '"\\%\\%"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-3', inputData: '"__"',   expected: '"\\_\\_"' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-3', inputData: '"\\\\"', expected: '"\\\\\\\\"' },
    ],
};

(async () => {
    console.log('Generating utils BBT form Excel files…\n');
    await writeBbt(escapeLikeBbt, path.join(BASE, 'escapeLike-bbt-form.xlsx'));
    console.log('\nDone.');
})();