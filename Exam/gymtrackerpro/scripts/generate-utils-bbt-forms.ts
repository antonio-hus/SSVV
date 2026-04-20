import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

interface EcRow   { number: number | string; condition: string; validEc: string; invalidEc: string; }
interface EpTcRow { noTc: number | string; ec: string; inputData: string; expected: string; }
interface BvaRow  { number: number | string; condition: string; testCase: string; }
interface BvaTcRow{ noTc: number | string; bva: string; inputData: string; expected: string; }
interface FinalTcRow { noTc: number | string; fromEc: string; fromBva: string; inputData: string; expected: string; }
interface BbtDescriptor {
  reqId: string; tcCount: number; statement: string; data: string;
  precondition: string; results: string; postcondition: string;
  ecRows: EcRow[]; epTcRows: EpTcRow[]; bvaRows: BvaRow[];
  bvaTcRows: BvaTcRow[]; finalTcRows: FinalTcRow[];
}

const THIN = { style: 'thin' as const };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const FILL_SECTION: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
const FILL_HEADER:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
const FILL_LABEL:   ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
const FILL_PASS:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

function styleSection(c: ExcelJS.Cell) { c.font = { bold: true, color: { argb: 'FF1F3864' } }; c.fill = FILL_SECTION; c.border = BORDER; c.alignment = { horizontal: 'center', vertical: 'middle' }; }
function styleHeader (c: ExcelJS.Cell) { c.font = { bold: true }; c.fill = FILL_HEADER; c.border = BORDER; c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }; }
function styleLabel  (c: ExcelJS.Cell) { c.font = { bold: true }; c.fill = FILL_LABEL; c.border = BORDER; c.alignment = { wrapText: true, vertical: 'top' }; }
function styleData   (c: ExcelJS.Cell) { c.border = BORDER; c.alignment = { wrapText: true, vertical: 'top' }; }
function stylePassed (c: ExcelJS.Cell) { c.font = { color: { argb: 'FF375623' } }; c.fill = FILL_PASS; c.border = BORDER; c.alignment = { horizontal: 'center', vertical: 'middle' }; }

function addProblemSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Problem');
  ws.columns = [{ width: 22 }, { width: 110 }];
  let row = ws.addRow([`Statement: ${d.statement}`, '']);
  ws.mergeCells(`A${row.number}:B${row.number}`);
  row.getCell(1).border = BORDER; row.getCell(1).alignment = { wrapText: true, vertical: 'top' }; row.height = 80;
  ws.addRow(['', '']);
  row = ws.addRow(['Specification', '']); ws.mergeCells(`A${row.number}:B${row.number}`); styleSection(row.getCell(1)); row.height = 18;
  row = ws.addRow(['Data', d.data]); styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 50;
  row = ws.addRow(['precondition', d.precondition]); styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 60;
  ws.addRow(['', '']);
  row = ws.addRow(['Results', '']); ws.mergeCells(`A${row.number}:B${row.number}`); styleSection(row.getCell(1)); row.height = 18;
  row = ws.addRow(['', d.results]); styleData(row.getCell(1)); styleData(row.getCell(2)); row.height = 30;
  row = ws.addRow(['postcondition', d.postcondition]); styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 60;
}

function addEcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC');
  ws.columns = [{ width: 12 }, { width: 35 }, { width: 55 }, { width: 55 }];
  const hdr = ws.addRow(['Number EC', 'Condition', 'Valid EC', 'Invalid EC']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.ecRows) { const row = ws.addRow([r.number, r.condition, r.validEc, r.invalidEc]); row.eachCell(c => styleData(c)); row.height = 18; }
}

function addEcTcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC_TC');
  ws.columns = [{ width: 8 }, { width: 25 }, { width: 80 }, { width: 55 }, { width: 25 }];
  const hdr = ws.addRow(['No TC', 'EC', 'Input Data', 'Expected', 'Actual Result']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.epTcRows) {
    const row = ws.addRow([r.noTc, r.ec, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2)); styleData(row.getCell(3)); styleData(row.getCell(4)); stylePassed(row.getCell(5)); row.height = 30;
  }
}

function addBvaSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_BVA');
  ws.columns = [{ width: 12 }, { width: 35 }, { width: 55 }];
  const hdr = ws.addRow(['Number BVA', 'Condition', 'BVA Test Case']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.bvaRows) { const row = ws.addRow([r.number, r.condition, r.testCase]); row.eachCell(c => styleData(c)); row.height = 18; }
}

function addBvaTcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_BVA_TC');
  ws.columns = [{ width: 8 }, { width: 25 }, { width: 80 }, { width: 55 }, { width: 25 }];
  const hdr = ws.addRow(['No TC', 'BVA', 'Input Data', 'Expected', 'Actual Result']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.bvaTcRows) {
    const row = ws.addRow([r.noTc, r.bva, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2)); styleData(row.getCell(3)); styleData(row.getCell(4)); stylePassed(row.getCell(5)); row.height = 30;
  }
}

function addFinalSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC_BVA_all_TC');
  ws.columns = [{ width: 8 }, { width: 12 }, { width: 14 }, { width: 75 }, { width: 55 }, { width: 25 }];
  const hdr = ws.addRow(['No TC', 'TC from EC', 'TC from BVA', 'Input Data', 'Expected', 'Actual Result']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.finalTcRows) {
    const row = ws.addRow([r.noTc, r.fromEc, r.fromBva, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2)); styleData(row.getCell(3)); styleData(row.getCell(4)); styleData(row.getCell(5)); stylePassed(row.getCell(6)); row.height = 30;
  }
}

function addStatsSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Statistics_Req_');
  ws.columns = [{ width: 20 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 13 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }];
  const sRow = ws.addRow(['', 'Testing', '', '', '', 'Debugging', 'Re-testing', '', '', '']);
  ws.mergeCells(`B${sRow.number}:E${sRow.number}`); ws.mergeCells(`G${sRow.number}:J${sRow.number}`);
  sRow.getCell(1).border = BORDER; styleSection(sRow.getCell(2)); styleSection(sRow.getCell(6)); styleSection(sRow.getCell(7));
  [3, 4, 5, 8, 9, 10].forEach(c => { sRow.getCell(c).fill = FILL_SECTION; sRow.getCell(c).border = BORDER; }); sRow.height = 20;
  const hRow = ws.addRow(['Req. ID', 'TCs run', 'TCs passed', 'TCs failed', 'No of BUGS', 'Bugs Fixed', 'Re-tested', 'TCs run', 'TCs passed', 'TCs failed']); hRow.eachCell(c => styleHeader(c)); hRow.height = 25;
  const dRow = ws.addRow([d.reqId, d.tcCount, d.tcCount, 0, 0, 'n/a', 'not yet', 0, '-', '-']);
  styleLabel(dRow.getCell(1)); [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(c => styleData(dRow.getCell(c))); dRow.height = 20;
}

async function writeBbt(descriptor: BbtDescriptor, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const wb = new ExcelJS.Workbook();
  addProblemSheet(wb, descriptor); addEcSheet(wb, descriptor); addEcTcSheet(wb, descriptor);
  addBvaSheet(wb, descriptor); addBvaTcSheet(wb, descriptor); addFinalSheet(wb, descriptor); addStatsSheet(wb, descriptor);
  await wb.xlsx.writeFile(outputPath);
  console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

const BASE = path.join(ROOT, 'lib', '__tests__', 'bbt', 'utils');

// ── escapeLike ────────────────────────────────────────────────────────────────

const escapeLikeBbt: BbtDescriptor = {
  reqId: 'UTILS-ESCAPE',
  tcCount: 13,
  statement: 'escapeLike(s) – escapes the three LIKE meta-characters (%, _, \\) so the result can be safely interpolated into a Prisma/SQL LIKE pattern. Used by findMembers, findAdmins, findAll exercises, and findAll workout-sessions when a search term is provided.',
  data: 'Input: s: string',
  precondition: 'None – pure function, no I/O',
  results: 'Output: string – copy of s with \\, %, _ prefixed by a backslash',
  postcondition: 'Each \\ → \\\\, each % → \\%, each _ → \\_ in the output. All other characters are unchanged.',
  ecRows: [
    { number: 1, condition: 'plain string (no special chars)', validEc: 'returned unchanged',           invalidEc: '' },
    { number: 2, condition: '% character present',            validEc: 'each % becomes \\%',           invalidEc: '' },
    { number: 3, condition: '_ character present',            validEc: 'each _ becomes \\_',           invalidEc: '' },
    { number: 4, condition: '\\ character present',           validEc: 'each \\ becomes \\\\',         invalidEc: '' },
    { number: 5, condition: 'multiple special chars mixed',   validEc: 'all specials escaped in order', invalidEc: '' },
    { number: 6, condition: 'empty string',                   validEc: 'returns empty string',          invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1', inputData: '"benchpress"',        expected: '"benchpress"' },
    { noTc: 2,  ec: '2', inputData: '"100%"',              expected: '"100\\\\%"' },
    { noTc: 3,  ec: '3', inputData: '"bench_press"',       expected: '"bench\\\\_press"' },
    { noTc: 4,  ec: '4', inputData: '"path\\\\value"',     expected: '"path\\\\\\\\value"' },
    { noTc: 5,  ec: '5', inputData: '"100%_bench\\\\press"', expected: '"100\\\\%\\\\_bench\\\\\\\\press"' },
    { noTc: 6,  ec: '6', inputData: '""',                  expected: '""' },
  ],
  bvaRows: [
    { number: 1, condition: 'single special char (min boundary)', testCase: '"%" (single percent only)' },
    { number: '', condition: '',                                   testCase: '"_" (single underscore only)' },
    { number: 2, condition: 'special at string start',            testCase: '"%benchpress" (leading %)' },
    { number: '', condition: '',                                   testCase: '"benchpress%" (trailing %)' },
    { number: 3, condition: 'consecutive specials',               testCase: '"100%%" (two consecutive %)' },
    { number: '', condition: '',                                   testCase: '"bench__press" (two consecutive _)' },
    { number: 4, condition: 'all three specials together',        testCase: '"%_\\\\" (one of each special)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'single %',         inputData: '"%"',             expected: '"\\\\%"' },
    { noTc: 2, bva: 'single _',         inputData: '"_"',             expected: '"\\\\_"' },
    { noTc: 3, bva: 'leading %',        inputData: '"%benchpress"',   expected: '"\\\\%benchpress"' },
    { noTc: 4, bva: 'trailing %',       inputData: '"benchpress%"',   expected: '"benchpress\\\\%"' },
    { noTc: 5, bva: 'consecutive %%',   inputData: '"100%%"',         expected: '"100\\\\%\\\\%"' },
    { noTc: 6, bva: 'consecutive __',   inputData: '"bench__press"',  expected: '"bench\\\\_\\\\_press"' },
    { noTc: 7, bva: 'all three mixed',  inputData: '"%_\\\\"',        expected: '"\\\\%\\\\_\\\\\\\\"' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1', fromBva: '',      inputData: '"benchpress" (plain string)',            expected: '"benchpress"' },
    { noTc: 2,  fromEc: 'EP-2', fromBva: '',      inputData: '"100%" (percent sign)',                  expected: '"100\\%"' },
    { noTc: 3,  fromEc: 'EP-3', fromBva: '',      inputData: '"bench_press" (underscore)',             expected: '"bench\\_press"' },
    { noTc: 4,  fromEc: 'EP-4', fromBva: '',      inputData: '"path\\value" (backslash)',              expected: '"path\\\\value"' },
    { noTc: 5,  fromEc: 'EP-5', fromBva: '',      inputData: '"100%_bench\\press" (mixed specials)',   expected: '"100\\%\\_bench\\\\press"' },
    { noTc: 6,  fromEc: 'EP-6', fromBva: '',      inputData: '"" (empty string)',                      expected: '""' },
    { noTc: 7,  fromEc: 'EP-5', fromBva: '',      inputData: '"%_\\" (only special chars)',            expected: '"\\%\\_\\\\"' },
    { noTc: 8,  fromEc: 'EP-2', fromBva: 'BVA-3', inputData: '"%benchpress" (leading %)',             expected: '"\\%benchpress"' },
    { noTc: 9,  fromEc: 'EP-2', fromBva: 'BVA-4', inputData: '"benchpress%" (trailing %)',            expected: '"benchpress\\%"' },
    { noTc: 10, fromEc: 'EP-2', fromBva: 'BVA-5', inputData: '"100%%" (consecutive %%)',              expected: '"100\\%\\%"' },
    { noTc: 11, fromEc: 'EP-3', fromBva: 'BVA-6', inputData: '"bench__press" (consecutive __)',       expected: '"bench\\_\\_press"' },
    { noTc: 12, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: '"%" (single percent)',                  expected: '"\\%"' },
    { noTc: 13, fromEc: 'EP-3', fromBva: 'BVA-2', inputData: '"_" (single underscore)',               expected: '"\\_"' },
  ],
};

(async () => {
  console.log('Generating utils BBT form Excel files…\n');
  await writeBbt(escapeLikeBbt, path.join(BASE, 'escapeLike-bbt-form.xlsx'));
  console.log('\nDone.');
})();
