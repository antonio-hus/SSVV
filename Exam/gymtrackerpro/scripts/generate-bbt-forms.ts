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
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const THIN = { style: 'thin' as const };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const FILL_SECTION: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
const FILL_HEADER:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
const FILL_LABEL:   ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
const FILL_PASS:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

function styleSection(cell: ExcelJS.Cell): void {
  cell.font      = { bold: true, color: { argb: 'FF1F3864' } };
  cell.fill      = FILL_SECTION;
  cell.border    = BORDER;
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function styleHeader(cell: ExcelJS.Cell): void {
  cell.font      = { bold: true };
  cell.fill      = FILL_HEADER;
  cell.border    = BORDER;
  cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
}

function styleLabel(cell: ExcelJS.Cell): void {
  cell.font      = { bold: true };
  cell.fill      = FILL_LABEL;
  cell.border    = BORDER;
  cell.alignment = { wrapText: true, vertical: 'top' };
}

function styleData(cell: ExcelJS.Cell): void {
  cell.border    = BORDER;
  cell.alignment = { wrapText: true, vertical: 'top' };
}

function stylePassed(cell: ExcelJS.Cell): void {
  cell.font      = { color: { argb: 'FF375623' } };
  cell.fill      = FILL_PASS;
  cell.border    = BORDER;
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

// ── Sheet builders ─────────────────────────────────────────────────────────────

function addProblemSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Problem');
  ws.columns = [{ width: 22 }, { width: 110 }];

  // Statement (merged A:B)
  let row = ws.addRow([`Statement: ${d.statement}`, '']);
  ws.mergeCells(`A${row.number}:B${row.number}`);
  row.getCell(1).border    = BORDER;
  row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  row.height = 80;

  ws.addRow(['', '']);  // blank separator

  // Specification section
  row = ws.addRow(['Specification', '']);
  ws.mergeCells(`A${row.number}:B${row.number}`);
  styleSection(row.getCell(1));
  row.height = 18;

  row = ws.addRow(['Data', d.data]);
  styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 50;

  row = ws.addRow(['precondition', d.precondition]);
  styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 60;

  ws.addRow(['', '']);  // blank separator

  // Results section
  row = ws.addRow(['Results', '']);
  ws.mergeCells(`A${row.number}:B${row.number}`);
  styleSection(row.getCell(1));
  row.height = 18;

  row = ws.addRow(['', d.results]);
  styleData(row.getCell(1)); styleData(row.getCell(2)); row.height = 30;

  row = ws.addRow(['postcondition', d.postcondition]);
  styleLabel(row.getCell(1)); styleData(row.getCell(2)); row.height = 60;
}

function addEcSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC');
  ws.columns = [{ width: 12 }, { width: 35 }, { width: 55 }, { width: 55 }];

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
  ws.columns = [{ width: 8 }, { width: 25 }, { width: 80 }, { width: 55 }, { width: 25 }];

  const hdr = ws.addRow(['No TC', 'EC', 'Input Data', 'Expected', 'Actual Result']);
  hdr.eachCell(c => styleHeader(c));
  hdr.height = 20;

  for (const r of d.epTcRows) {
    const row = ws.addRow([r.noTc, r.ec, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2));
    styleData(row.getCell(3)); styleData(row.getCell(4));
    stylePassed(row.getCell(5));
    row.height = 30;
  }
}

function addBvaSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_BVA');
  ws.columns = [{ width: 12 }, { width: 35 }, { width: 55 }];

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
  ws.columns = [{ width: 8 }, { width: 25 }, { width: 80 }, { width: 55 }, { width: 25 }];

  const hdr = ws.addRow(['No TC', 'BVA', 'Input Data', 'Expected', 'Actual Result']);
  hdr.eachCell(c => styleHeader(c));
  hdr.height = 20;

  for (const r of d.bvaTcRows) {
    const row = ws.addRow([r.noTc, r.bva, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2));
    styleData(row.getCell(3)); styleData(row.getCell(4));
    stylePassed(row.getCell(5));
    row.height = 30;
  }
}

function addFinalSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC_BVA_all_TC');
  ws.columns = [{ width: 8 }, { width: 12 }, { width: 14 }, { width: 75 }, { width: 55 }, { width: 25 }];

  const hdr = ws.addRow(['No TC', 'TC from EC', 'TC from BVA', 'Input Data', 'Expected', 'Actual Result']);
  hdr.eachCell(c => styleHeader(c));
  hdr.height = 20;

  for (const r of d.finalTcRows) {
    const row = ws.addRow([r.noTc, r.fromEc, r.fromBva, r.inputData, r.expected, r.expected]);
    styleData(row.getCell(1)); styleData(row.getCell(2)); styleData(row.getCell(3));
    styleData(row.getCell(4)); styleData(row.getCell(5));
    stylePassed(row.getCell(6));
    row.height = 30;
  }
}

function addStatsSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Statistics_Req_');
  // A=Req.ID  B-E=Testing(TCs run|passed|failed|Bugs)  F=Debugging(Bugs Fixed)  G-J=Re-testing(Re-tested|TCs run|passed|failed)
  ws.columns = [
    { width: 20 },  // A: Req. ID
    { width: 10 },  // B: TCs run
    { width: 12 },  // C: TCs passed
    { width: 12 },  // D: TCs failed
    { width: 12 },  // E: No of BUGS
    { width: 13 },  // F: Bugs Fixed (Debugging)
    { width: 12 },  // G: Re-tested
    { width: 10 },  // H: TCs run
    { width: 12 },  // I: TCs passed
    { width: 12 },  // J: TCs failed
  ];

  // Section header row: Testing (B-E), Debugging (F), Re-testing (G-J)
  const sRow = ws.addRow(['', 'Testing', '', '', '', 'Debugging', 'Re-testing', '', '', '']);
  ws.mergeCells(`B${sRow.number}:E${sRow.number}`);
  ws.mergeCells(`G${sRow.number}:J${sRow.number}`);
  sRow.getCell(1).border = BORDER;
  styleSection(sRow.getCell(2));  // Testing (top-left of merge)
  styleSection(sRow.getCell(6));  // Debugging
  styleSection(sRow.getCell(7));  // Re-testing (top-left of merge)
  [3, 4, 5, 8, 9, 10].forEach(c => { sRow.getCell(c).fill = FILL_SECTION; sRow.getCell(c).border = BORDER; });
  sRow.height = 20;

  // Column header row
  const hRow = ws.addRow(['Req. ID', 'TCs run', 'TCs passed', 'TCs failed', 'No of BUGS', 'Bugs Fixed', 'Re-tested', 'TCs run', 'TCs passed', 'TCs failed']);
  hRow.eachCell(c => styleHeader(c));
  hRow.height = 25;

  // Data row – all tests passed
  const dRow = ws.addRow([d.reqId, d.tcCount, d.tcCount, 0, 0, 'n/a', 'not yet', 0, '-', '-']);
  styleLabel(dRow.getCell(1));
  [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(c => styleData(dRow.getCell(c)));
  dRow.height = 20;
}

// ── Workbook assembly & file output ───────────────────────────────────────────

async function buildWorkbook(d: BbtDescriptor): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  addProblemSheet(wb, d);
  addEcSheet(wb, d);
  addEcTcSheet(wb, d);
  addBvaSheet(wb, d);
  addBvaTcSheet(wb, d);
  addFinalSheet(wb, d);
  addStatsSheet(wb, d);
  return wb;
}

async function writeBbt(descriptor: BbtDescriptor, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const wb = await buildWorkbook(descriptor);
  await wb.xlsx.writeFile(outputPath);
  console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

const BASE = path.join(ROOT, 'lib', 'schema', '__tests__', 'bbt');

const createMemberSchemaBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 34,
  statement: 'createMemberSchema – validate input for creating a gym member. Fields: fullName (8-64 chars), email (simplified RFC 5321), dateOfBirth (YYYY-MM-DD, must be strictly past), phone (E.164: +?[1-9]\\d{1,14}), password (8-64 chars, uppercase+digit+special), membershipStart (YYYY-MM-DD).',
  data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
  precondition: '8 ≤ len(fullName) ≤ 64  |  email valid RFC  |  dateOfBirth YYYY-MM-DD and strictly past  |  phone E.164 2–15 digits  |  8 ≤ len(password) ≤ 64 with upper+digit+special  |  membershipStart YYYY-MM-DD',
  results: 'Output: { success: true, data: CreateMemberInput }  OR  { success: false, error: ZodError }',
  postcondition: 'All preconditions hold → success: true.  Any violation → success: false with descriptive issue message.',
  ecRows: [
    { number: 1,  condition: 'fullName length',      validEc: '8 ≤ len ≤ 64',                         invalidEc: '' },
    { number: 2,  condition: '',                     validEc: '',                                      invalidEc: 'len < 8' },
    { number: 3,  condition: '',                     validEc: '',                                      invalidEc: 'len > 64' },
    { number: 4,  condition: 'email format',         validEc: 'valid RFC email',                       invalidEc: '' },
    { number: 5,  condition: '',                     validEc: '',                                      invalidEc: 'no @ symbol' },
    { number: 6,  condition: '',                     validEc: '',                                      invalidEc: 'no domain after @' },
    { number: 7,  condition: 'dateOfBirth',          validEc: 'YYYY-MM-DD strictly past',             invalidEc: '' },
    { number: 8,  condition: '',                     validEc: '',                                      invalidEc: 'wrong format (DD/MM/YYYY)' },
    { number: 9,  condition: '',                     validEc: '',                                      invalidEc: 'future date (tomorrow or beyond)' },
    { number: 10, condition: '',                     validEc: '',                                      invalidEc: 'today (not strictly past)' },
    { number: 11, condition: 'phone (E.164)',         validEc: '2–15 digit E.164',                    invalidEc: '' },
    { number: 12, condition: '',                     validEc: '',                                      invalidEc: 'starts with 0' },
    { number: 13, condition: '',                     validEc: '',                                      invalidEc: 'len < 2 (1 digit)' },
    { number: 14, condition: '',                     validEc: '',                                      invalidEc: 'len > 15 (16 digits)' },
    { number: 15, condition: 'password',             validEc: '8-64 chars, upper+digit+special',      invalidEc: '' },
    { number: 16, condition: '',                     validEc: '',                                      invalidEc: 'len < 8' },
    { number: 17, condition: '',                     validEc: '',                                      invalidEc: 'len > 64' },
    { number: 18, condition: '',                     validEc: '',                                      invalidEc: 'missing uppercase' },
    { number: 19, condition: '',                     validEc: '',                                      invalidEc: 'missing digit' },
    { number: 20, condition: '',                     validEc: '',                                      invalidEc: 'missing special character' },
    { number: 21, condition: 'membershipStart',      validEc: 'YYYY-MM-DD',                            invalidEc: '' },
    { number: 22, condition: '',                     validEc: '',                                      invalidEc: 'wrong format' },
    { number: 23, condition: '',                     validEc: '',                                      invalidEc: 'no separators (YYYYMMDD)' },
    { number: 24, condition: 'required fields',      validEc: 'all present',                           invalidEc: '' },
    { number: 25, condition: '',                     validEc: '',                                      invalidEc: 'email absent' },
    { number: 26, condition: '',                     validEc: '',                                      invalidEc: 'phone absent' },
    { number: 27, condition: '',                     validEc: '',                                      invalidEc: 'password absent' },
    { number: 28, condition: '',                     validEc: '',                                      invalidEc: 'dateOfBirth absent' },
    { number: 29, condition: '',                     validEc: '',                                      invalidEc: 'membershipStart absent' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,4,7,11,15,21,24', inputData: 'All valid fields', expected: 'success: true' },
    { noTc: 2,  ec: '2',   inputData: 'fullName=Ab1De2F (7 chars)',          expected: 'success: false – Full name must be at least 8 characters' },
    { noTc: 3,  ec: '3',   inputData: 'fullName=A×65 (65 chars)',            expected: 'success: false – Full name must be at most 64 characters' },
    { noTc: 4,  ec: '5',   inputData: 'email=invalidemail.com (no @)',        expected: 'success: false – Invalid email address' },
    { noTc: 5,  ec: '6',   inputData: 'email=user@ (no domain)',              expected: 'success: false – Invalid email address' },
    { noTc: 6,  ec: '8',   inputData: 'dateOfBirth=15/01/1990',              expected: 'success: false – Date of birth must be in YYYY-MM-DD format' },
    { noTc: 7,  ec: '9',   inputData: 'dateOfBirth=2099-12-31 (future)',      expected: 'success: false – Date of birth must be in the past' },
    { noTc: 8,  ec: '10',  inputData: 'dateOfBirth=today',                   expected: 'success: false – Date of birth must be in the past' },
    { noTc: 9,  ec: '12',  inputData: 'phone=0712345678 (starts with 0)',     expected: 'success: false – Phone number format is incorrect' },
    { noTc: 10, ec: '16',  inputData: 'password=7 chars',                    expected: 'success: false – Password must be at least 8 characters' },
    { noTc: 11, ec: '18',  inputData: 'password missing uppercase',          expected: 'success: false – password validation error' },
    { noTc: 12, ec: '19',  inputData: 'password missing digit',              expected: 'success: false – password validation error' },
    { noTc: 13, ec: '20',  inputData: 'password missing special character',  expected: 'success: false – password validation error' },
    { noTc: 14, ec: '22',  inputData: 'membershipStart=01-01-2024',          expected: 'success: false – format error' },
    { noTc: 15, ec: '25',  inputData: 'email field absent',                  expected: 'success: false' },
    { noTc: 16, ec: '26',  inputData: 'phone field absent',                  expected: 'success: false' },
    { noTc: 17, ec: '27',  inputData: 'password field absent',               expected: 'success: false' },
    { noTc: 18, ec: '28',  inputData: 'dateOfBirth field absent',            expected: 'success: false' },
    { noTc: 19, ec: '29',  inputData: 'membershipStart field absent',        expected: 'success: false' },
  ],
  bvaRows: [
    { number: 1,  condition: 'fullName min=8',       testCase: 'fullName=8 chars (min)' },
    { number: '',  condition: '',                     testCase: 'fullName=7 chars (min-1)' },
    { number: 2,  condition: 'fullName interior',    testCase: 'fullName=9 chars (min+1)' },
    { number: 3,  condition: '',                     testCase: 'fullName=63 chars (max-1)' },
    { number: 4,  condition: 'fullName max=64',      testCase: 'fullName=64 chars (max)' },
    { number: '',  condition: '',                     testCase: 'fullName=65 chars (max+1)' },
    { number: 5,  condition: 'password min=8',       testCase: 'password=8 chars (min)' },
    { number: '',  condition: '',                     testCase: 'password=7 chars (min-1)' },
    { number: 6,  condition: 'password max=64',      testCase: 'password=64 chars (max)' },
    { number: '',  condition: '',                     testCase: 'password=65 chars (max+1)' },
    { number: 7,  condition: 'phone min=2 digits',   testCase: 'phone=+12 (2 digits, min)' },
    { number: '',  condition: '',                     testCase: 'phone=+1 (1 digit, min-1)' },
    { number: 8,  condition: 'phone max=15 digits',  testCase: 'phone=+123456789012345 (15, max)' },
    { number: '',  condition: '',                     testCase: 'phone=+1234567890123456 (16, max+1)' },
    { number: 9,  condition: 'dateOfBirth boundary', testCase: 'yesterday (valid, strictly past)' },
    { number: '',  condition: '',                     testCase: 'today (invalid, not strictly past)' },
    { number: '',  condition: '',                     testCase: 'tomorrow (invalid, future)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName min (8)',      inputData: 'fullName=Ab1 De2F (8 chars)',       expected: 'success: true' },
    { noTc: 2,  bva: 'fullName min-1 (7)',    inputData: 'fullName=Ab1De2F (7 chars)',        expected: 'success: false – fullName too short' },
    { noTc: 3,  bva: 'fullName max (64)',     inputData: 'fullName=A×64 (64 chars)',          expected: 'success: true' },
    { noTc: 4,  bva: 'fullName max+1 (65)',   inputData: 'fullName=A×65 (65 chars)',          expected: 'success: false – fullName too long' },
    { noTc: 5,  bva: 'fullName interior 9',  inputData: 'fullName=9 chars',                  expected: 'success: true' },
    { noTc: 6,  bva: 'fullName interior 63', inputData: 'fullName=63 chars',                 expected: 'success: true' },
    { noTc: 7,  bva: 'password min (8)',      inputData: 'password=Pass1@aA (8 chars)',       expected: 'success: true' },
    { noTc: 8,  bva: 'password min-1 (7)',    inputData: 'password=Pas1@aA (7 chars)',        expected: 'success: false – password too short' },
    { noTc: 9,  bva: 'password max (64)',     inputData: 'password=P@ss1 + 59 chars (64)',    expected: 'success: true' },
    { noTc: 10, bva: 'password max+1 (65)',   inputData: 'password=P@ss1 + 60 chars (65)',    expected: 'success: false – password too long' },
    { noTc: 11, bva: 'phone min (2 digits)',  inputData: 'phone=+12',                         expected: 'success: true' },
    { noTc: 12, bva: 'phone min-1 (1 digit)', inputData: 'phone=+1',                          expected: 'success: false – phone format incorrect' },
    { noTc: 13, bva: 'phone max (15 digits)', inputData: 'phone=+123456789012345',            expected: 'success: true' },
    { noTc: 14, bva: 'phone max+1 (16)',       inputData: 'phone=+1234567890123456',           expected: 'success: false – phone format incorrect' },
    { noTc: 15, bva: 'dob yesterday',         inputData: 'dateOfBirth=yesterday',             expected: 'success: true' },
    { noTc: 16, bva: 'dob today',             inputData: 'dateOfBirth=today',                 expected: 'success: false – must be in the past' },
    { noTc: 17, bva: 'dob tomorrow',          inputData: 'dateOfBirth=tomorrow',              expected: 'success: false – must be in the past' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',        inputData: 'All valid fields',                 expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: 'BVA-2',   inputData: 'fullName=7 chars',                expected: 'success: false – fullName too short' },
    { noTc: 3,  fromEc: '',      fromBva: 'BVA-1',   inputData: 'fullName=8 chars',                 expected: 'success: true' },
    { noTc: 4,  fromEc: '',      fromBva: 'BVA-3',   inputData: 'fullName=64 chars',                expected: 'success: true' },
    { noTc: 5,  fromEc: 'EP-3',  fromBva: 'BVA-4',   inputData: 'fullName=65 chars',               expected: 'success: false – fullName too long' },
    { noTc: 6,  fromEc: 'EP-4',  fromBva: '',        inputData: 'email without @',                   expected: 'success: false – Invalid email address' },
    { noTc: 7,  fromEc: 'EP-5',  fromBva: '',        inputData: 'email without domain',              expected: 'success: false – Invalid email address' },
    { noTc: 8,  fromEc: 'EP-6',  fromBva: '',        inputData: 'dateOfBirth DD/MM/YYYY',            expected: 'success: false – format error' },
    { noTc: 9,  fromEc: 'EP-7',  fromBva: '',        inputData: 'dateOfBirth=future',               expected: 'success: false – must be in the past' },
    { noTc: 10, fromEc: 'EP-8',  fromBva: 'BVA-16',  inputData: 'dateOfBirth=today',               expected: 'success: false – must be in the past' },
    { noTc: 11, fromEc: 'EP-9',  fromBva: '',        inputData: 'phone starts with 0',               expected: 'success: false – phone format incorrect' },
    { noTc: 12, fromEc: 'EP-10', fromBva: 'BVA-8',   inputData: 'password=7 chars',                expected: 'success: false – password too short' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-7',   inputData: 'password=8 chars',                 expected: 'success: true' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-9',   inputData: 'password=64 chars',                expected: 'success: true' },
    { noTc: 15, fromEc: 'EP-11', fromBva: 'BVA-10',  inputData: 'password=65 chars',               expected: 'success: false – password too long' },
    { noTc: 16, fromEc: 'EP-11', fromBva: '',        inputData: 'password missing uppercase',        expected: 'success: false' },
    { noTc: 17, fromEc: 'EP-12', fromBva: '',        inputData: 'password missing digit',            expected: 'success: false' },
    { noTc: 18, fromEc: 'EP-13', fromBva: '',        inputData: 'password missing special char',     expected: 'success: false' },
    { noTc: 19, fromEc: 'EP-1',  fromBva: '',        inputData: 'password all constraints met',      expected: 'success: true' },
    { noTc: 20, fromEc: 'EP-14', fromBva: '',        inputData: 'membershipStart DD-MM-YYYY',        expected: 'success: false – format error' },
    { noTc: 21, fromEc: 'EP-15', fromBva: '',        inputData: 'email field absent',               expected: 'success: false' },
    { noTc: 22, fromEc: 'EP-16', fromBva: '',        inputData: 'phone field absent',               expected: 'success: false' },
    { noTc: 23, fromEc: 'EP-17', fromBva: '',        inputData: 'password field absent',            expected: 'success: false' },
    { noTc: 24, fromEc: 'EP-18', fromBva: '',        inputData: 'dateOfBirth field absent',         expected: 'success: false' },
    { noTc: 25, fromEc: 'EP-19', fromBva: '',        inputData: 'membershipStart field absent',     expected: 'success: false' },
    { noTc: 26, fromEc: '',      fromBva: 'BVA-15',  inputData: 'dateOfBirth=yesterday',            expected: 'success: true' },
    { noTc: 27, fromEc: '',      fromBva: 'BVA-17',  inputData: 'dateOfBirth=tomorrow',             expected: 'success: false' },
    { noTc: 28, fromEc: '',      fromBva: 'BVA-11',  inputData: 'phone min 2 digits',               expected: 'success: true' },
    { noTc: 29, fromEc: '',      fromBva: 'BVA-13',  inputData: 'phone max 15 digits',              expected: 'success: true' },
    { noTc: 30, fromEc: '',      fromBva: 'BVA-12',  inputData: 'phone below min 1 digit',          expected: 'success: false' },
    { noTc: 31, fromEc: '',      fromBva: 'BVA-14',  inputData: 'phone above max 16 digits',        expected: 'success: false' },
    { noTc: 32, fromEc: '',      fromBva: 'BVA-5',   inputData: 'fullName=9 chars',                 expected: 'success: true' },
    { noTc: 33, fromEc: '',      fromBva: 'BVA-6',   inputData: 'fullName=63 chars',                expected: 'success: true' },
    { noTc: 34, fromEc: 'EP-14', fromBva: '',        inputData: 'membershipStart no separators',    expected: 'success: false' },
  ],
};

const createMemberWithTempPasswordSchemaBbt: BbtDescriptor = {
  reqId: 'MEM-01/MEM-02',
  tcCount: 19,
  statement: 'createMemberWithTempPasswordSchema – validate input for creating a member whose password is auto-generated. Fields: email, fullName (8-64 chars), phone (E.164 2-15 digits), dateOfBirth (YYYY-MM-DD, strictly past), membershipStart (YYYY-MM-DD). No password field required.',
  data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, membershipStart: string }',
  precondition: '8 ≤ len(fullName) ≤ 64  |  email valid RFC  |  dateOfBirth YYYY-MM-DD strictly past  |  phone E.164 2-15 digits  |  membershipStart YYYY-MM-DD',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Any violation → success: false.  password field (if supplied) is stripped silently.',
  ecRows: [
    { number: 1,  condition: 'fullName length',  validEc: '8 ≤ len ≤ 64',             invalidEc: '' },
    { number: 2,  condition: '',                 validEc: '',                          invalidEc: 'len < 8' },
    { number: 3,  condition: '',                 validEc: '',                          invalidEc: 'len > 64' },
    { number: 4,  condition: 'email format',     validEc: 'valid RFC',                 invalidEc: '' },
    { number: 5,  condition: '',                 validEc: '',                          invalidEc: 'no @ or domain' },
    { number: 6,  condition: 'dateOfBirth',      validEc: 'YYYY-MM-DD, strictly past', invalidEc: '' },
    { number: 7,  condition: '',                 validEc: '',                          invalidEc: 'future date' },
    { number: 8,  condition: '',                 validEc: '',                          invalidEc: 'today (not strictly past)' },
    { number: 9,  condition: '',                 validEc: '',                          invalidEc: 'tomorrow' },
    { number: 10, condition: 'phone',            validEc: 'E.164 2-15 digits',         invalidEc: '' },
    { number: 11, condition: '',                 validEc: '',                          invalidEc: 'invalid format' },
    { number: 12, condition: '',                 validEc: '',                          invalidEc: 'len < 2 (1 digit)' },
    { number: 13, condition: '',                 validEc: '',                          invalidEc: 'len > 15 (16 digits)' },
    { number: 14, condition: 'membershipStart',  validEc: 'YYYY-MM-DD',               invalidEc: '' },
    { number: 15, condition: '',                 validEc: '',                          invalidEc: 'wrong format' },
    { number: 16, condition: 'password (extra)', validEc: 'field ignored/stripped',   invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,4,6,10,14',  inputData: 'All valid fields (no password)',              expected: 'success: true' },
    { noTc: 2,  ec: '2',            inputData: 'fullName=Ab1De2F (7 chars)',                  expected: 'success: false – fullName too short' },
    { noTc: 3,  ec: '5',            inputData: 'email=not-an-email',                          expected: 'success: false – Invalid email address' },
    { noTc: 4,  ec: '7',            inputData: 'dateOfBirth=2090-01-01 (future)',              expected: 'success: false – must be in the past' },
    { noTc: 5,  ec: '11',           inputData: 'phone with spaces',                           expected: 'success: false – phone format incorrect' },
    { noTc: 6,  ec: '15',           inputData: 'membershipStart=2024/01/01',                  expected: 'success: false – format error' },
    { noTc: 7,  ec: '16',           inputData: 'All valid + extra password field',             expected: 'success: true (password stripped from output)' },
    { noTc: 8,  ec: '16',           inputData: 'password field stripped from parsed data',     expected: 'password key absent in result' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName min=8',      testCase: 'fullName=8 chars (min)' },
    { number: '', condition: '',                    testCase: 'fullName=7 chars (min-1)' },
    { number: 2, condition: 'fullName max=64',     testCase: 'fullName=64 chars (max)' },
    { number: '', condition: '',                    testCase: 'fullName=65 chars (max+1)' },
    { number: 3, condition: 'fullName interior',   testCase: 'fullName=63 chars (max-1)' },
    { number: 4, condition: 'phone min=2 digits',  testCase: 'phone=+12 (min)' },
    { number: '', condition: '',                    testCase: 'phone=+1 (min-1)' },
    { number: 5, condition: 'phone max=15 digits', testCase: 'phone=+123456789012345 (max)' },
    { number: '', condition: '',                    testCase: 'phone=+1234567890123456 (max+1)' },
    { number: 6, condition: 'dob boundary',        testCase: 'yesterday (valid)' },
    { number: '', condition: '',                    testCase: 'today (invalid)' },
    { number: '', condition: '',                    testCase: 'tomorrow (invalid)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName min (8)',     inputData: 'fullName=8 chars',          expected: 'success: true' },
    { noTc: 2,  bva: 'fullName min-1 (7)',   inputData: 'fullName=7 chars',          expected: 'success: false – fullName too short' },
    { noTc: 3,  bva: 'fullName max (64)',    inputData: 'fullName=64 chars',         expected: 'success: true' },
    { noTc: 4,  bva: 'fullName max+1 (65)',  inputData: 'fullName=65 chars',         expected: 'success: false – fullName too long' },
    { noTc: 5,  bva: 'fullName interior 63', inputData: 'fullName=63 chars',         expected: 'success: true' },
    { noTc: 6,  bva: 'phone min (2)',        inputData: 'phone=+12',                 expected: 'success: true' },
    { noTc: 7,  bva: 'phone min-1 (1)',      inputData: 'phone=+1',                  expected: 'success: false' },
    { noTc: 8,  bva: 'phone max (15)',       inputData: 'phone=15 digits',            expected: 'success: true' },
    { noTc: 9,  bva: 'phone max+1 (16)',     inputData: 'phone=16 digits',            expected: 'success: false' },
    { noTc: 10, bva: 'dob yesterday',        inputData: 'dateOfBirth=yesterday',      expected: 'success: true' },
    { noTc: 11, bva: 'dob today',            inputData: 'dateOfBirth=today',          expected: 'success: false' },
    { noTc: 12, bva: 'dob tomorrow',         inputData: 'dateOfBirth=tomorrow',       expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',       inputData: 'All valid (no password)',          expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: 'BVA-2',  inputData: 'fullName=7 chars',                expected: 'success: false' },
    { noTc: 3,  fromEc: '',      fromBva: 'BVA-1',  inputData: 'fullName=8 chars',                 expected: 'success: true' },
    { noTc: 4,  fromEc: 'EP-3',  fromBva: '',       inputData: 'invalid email',                    expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-4',  fromBva: '',       inputData: 'future dateOfBirth',               expected: 'success: false' },
    { noTc: 6,  fromEc: 'EP-5',  fromBva: '',       inputData: 'phone with spaces',                expected: 'success: false' },
    { noTc: 7,  fromEc: 'EP-6',  fromBva: '',       inputData: 'membershipStart wrong format',     expected: 'success: false' },
    { noTc: 8,  fromEc: 'EP-7',  fromBva: '',       inputData: 'password field provided',          expected: 'success: true' },
    { noTc: 9,  fromEc: 'EP-8',  fromBva: '',       inputData: 'password field stripped from output', expected: 'password absent in parsed data' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-3',  inputData: 'fullName=64 chars',                expected: 'success: true' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-4',  inputData: 'fullName=65 chars',                expected: 'success: false' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-10', inputData: 'dateOfBirth=yesterday',            expected: 'success: true' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-6',  inputData: 'phone min 2 digits',               expected: 'success: true' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-8',  inputData: 'phone max 15 digits',              expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-7',  inputData: 'phone below min 1 digit',          expected: 'success: false' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-9',  inputData: 'phone above max 16 digits',        expected: 'success: false' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-11', inputData: 'dateOfBirth=today',                expected: 'success: false' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-12', inputData: 'dateOfBirth=tomorrow',             expected: 'success: false' },
    { noTc: 19, fromEc: '',      fromBva: 'BVA-5',  inputData: 'fullName=63 chars',                expected: 'success: true' },
  ],
};

const loginUserSchemaBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 8,
  statement: 'loginUserSchema – validate login credentials. Fields: email (simplified RFC 5321), password (non-empty string, min 1 char, no upper limit).',
  data: 'Input: { email: string, password: string }',
  precondition: 'email matches /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/  |  len(password) ≥ 1',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'Both fields valid → success: true.  Any invalid field → success: false.',
  ecRows: [
    { number: 1, condition: 'email format',   validEc: 'valid RFC email', invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                invalidEc: 'no @ symbol or domain' },
    { number: 3, condition: '',               validEc: '',                invalidEc: 'empty email string' },
    { number: 4, condition: 'password',       validEc: 'len ≥ 1',         invalidEc: '' },
    { number: 5, condition: '',               validEc: '',                invalidEc: 'empty string (len=0)' },
    { number: 6, condition: 'required fields',validEc: 'both present',    invalidEc: '' },
    { number: 7, condition: '',               validEc: '',                invalidEc: 'email absent' },
    { number: 8, condition: '',               validEc: '',                invalidEc: 'password absent' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,4,6', inputData: 'email=admin@gymtrackerpro.com, password=admin', expected: 'success: true' },
    { noTc: 2, ec: '2',     inputData: 'email=notanemail, password=admin',              expected: 'success: false – Invalid email address' },
    { noTc: 3, ec: '5',     inputData: 'email=admin@gym.com, password="" (empty)',      expected: 'success: false – Password is required' },
    { noTc: 4, ec: '7',     inputData: 'email absent, password=admin',                 expected: 'success: false' },
    { noTc: 5, ec: '8',     inputData: 'email=admin@gym.com, password absent',         expected: 'success: false' },
    { noTc: 6, ec: '3',     inputData: 'email="" (empty string)',                       expected: 'success: false' },
  ],
  bvaRows: [
    { number: 1, condition: 'password min=1',       testCase: 'password="" (0 chars, invalid)' },
    { number: '', condition: '',                     testCase: 'password=a (1 char, valid)' },
    { number: 2, condition: 'password upper (none)', testCase: 'password=long string (valid, no upper limit)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'password min-1 (0)', inputData: 'email=admin@gym.com, password=""',       expected: 'success: false – Password is required' },
    { noTc: 2, bva: 'password min (1)',   inputData: 'email=admin@gym.com, password=a (1 ch)', expected: 'success: true' },
    { noTc: 3, bva: 'password long',     inputData: 'email=admin@gym.com, password=long str',  expected: 'success: true (no upper limit)' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'Valid email + password',      expected: 'success: true' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'Invalid email format',        expected: 'success: false – Invalid email address' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'Empty password',             expected: 'success: false – Password is required' },
    { noTc: 4, fromEc: '',     fromBva: 'BVA-2', inputData: 'password=1 char',             expected: 'success: true' },
    { noTc: 5, fromEc: 'EP-4', fromBva: '',      inputData: 'email absent',                expected: 'success: false' },
    { noTc: 6, fromEc: 'EP-5', fromBva: '',      inputData: 'password absent',             expected: 'success: false' },
    { noTc: 7, fromEc: 'EP-6', fromBva: '',      inputData: 'empty email string',          expected: 'success: false' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-3', inputData: 'password=long string',        expected: 'success: true' },
  ],
};

const createAdminSchemaBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 21,
  statement: 'createAdminSchema – validate input for creating a gym administrator account. Fields: email (RFC 5321), fullName (8-64 chars), phone (E.164 2-15 digits), dateOfBirth (YYYY-MM-DD, strictly past), password (8-64 chars, upper+digit+special).',
  data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
  precondition: '8 ≤ len(fullName) ≤ 64  |  email valid RFC  |  dateOfBirth YYYY-MM-DD strictly past  |  phone E.164 2-15 digits  |  8 ≤ len(password) ≤ 64 with upper+digit+special',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1,  condition: 'fullName length', validEc: '8 ≤ len ≤ 64',                invalidEc: '' },
    { number: 2,  condition: '',                validEc: '',                              invalidEc: 'len < 8' },
    { number: 3,  condition: '',                validEc: '',                              invalidEc: 'len > 64' },
    { number: 4,  condition: 'email',           validEc: 'valid RFC',                    invalidEc: '' },
    { number: 5,  condition: '',                validEc: '',                              invalidEc: 'invalid email' },
    { number: 6,  condition: 'dateOfBirth',     validEc: 'YYYY-MM-DD strictly past',     invalidEc: '' },
    { number: 7,  condition: '',                validEc: '',                              invalidEc: 'future date' },
    { number: 8,  condition: '',                validEc: '',                              invalidEc: 'today (not strictly past)' },
    { number: 9,  condition: '',                validEc: '',                              invalidEc: 'tomorrow' },
    { number: 10, condition: 'phone',           validEc: 'E.164 2-15 digits',            invalidEc: '' },
    { number: 11, condition: '',                validEc: '',                              invalidEc: 'len < 2 (1 digit)' },
    { number: 12, condition: '',                validEc: '',                              invalidEc: 'len > 15 (16 digits)' },
    { number: 13, condition: 'password',        validEc: '8-64 chars, upper+digit+special', invalidEc: '' },
    { number: 14, condition: '',                validEc: '',                              invalidEc: 'len < 8' },
    { number: 15, condition: '',                validEc: '',                              invalidEc: 'len > 64' },
    { number: 16, condition: '',                validEc: '',                              invalidEc: 'missing uppercase' },
    { number: 17, condition: '',                validEc: '',                              invalidEc: 'missing digit' },
    { number: 18, condition: '',                validEc: '',                              invalidEc: 'missing special character' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,4,6,10,13', inputData: 'All valid admin fields',              expected: 'success: true' },
    { noTc: 2,  ec: '2',           inputData: 'fullName=7 chars',                    expected: 'success: false – fullName too short' },
    { noTc: 3,  ec: '3',           inputData: 'fullName=65 chars',                   expected: 'success: false – fullName too long' },
    { noTc: 4,  ec: '5',           inputData: 'email=invalid',                       expected: 'success: false – Invalid email address' },
    { noTc: 5,  ec: '7',           inputData: 'dateOfBirth=future',                  expected: 'success: false – must be in the past' },
    { noTc: 6,  ec: '14',          inputData: 'password=7 chars',                    expected: 'success: false – password too short' },
    { noTc: 7,  ec: '16',          inputData: 'password missing uppercase',           expected: 'success: false' },
    { noTc: 8,  ec: '17',          inputData: 'password missing digit',              expected: 'success: false' },
    { noTc: 9,  ec: '18',          inputData: 'password missing special char',       expected: 'success: false' },
  ],
  bvaRows: [
    { number: 1,  condition: 'fullName min=8',       testCase: 'fullName=8 chars (min)' },
    { number: '',  condition: '',                     testCase: 'fullName=7 chars (min-1)' },
    { number: 2,  condition: 'fullName max=64',      testCase: 'fullName=64 chars (max)' },
    { number: '',  condition: '',                     testCase: 'fullName=65 chars (max+1)' },
    { number: 3,  condition: 'password min=8',       testCase: 'password=8 chars (min)' },
    { number: '',  condition: '',                     testCase: 'password=7 chars (min-1)' },
    { number: 4,  condition: 'password max=64',      testCase: 'password=64 chars (max)' },
    { number: '',  condition: '',                     testCase: 'password=65 chars (max+1)' },
    { number: 5,  condition: 'phone min=2 digits',   testCase: 'phone=2 digits (min)' },
    { number: '',  condition: '',                     testCase: 'phone=1 digit (min-1)' },
    { number: 6,  condition: 'phone max=15 digits',  testCase: 'phone=15 digits (max)' },
    { number: '',  condition: '',                     testCase: 'phone=16 digits (max+1)' },
    { number: 7,  condition: 'dateOfBirth boundary', testCase: 'yesterday (valid)' },
    { number: '',  condition: '',                     testCase: 'today (invalid)' },
    { number: '',  condition: '',                     testCase: 'tomorrow (invalid)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName min (8)',     inputData: 'fullName=8 chars',        expected: 'success: true' },
    { noTc: 2,  bva: 'fullName min-1 (7)',   inputData: 'fullName=7 chars',        expected: 'success: false' },
    { noTc: 3,  bva: 'fullName max (64)',    inputData: 'fullName=64 chars',       expected: 'success: true' },
    { noTc: 4,  bva: 'fullName max+1 (65)', inputData: 'fullName=65 chars',       expected: 'success: false' },
    { noTc: 5,  bva: 'password min (8)',    inputData: 'password=8 chars',        expected: 'success: true' },
    { noTc: 6,  bva: 'password min-1 (7)', inputData: 'password=7 chars',        expected: 'success: false' },
    { noTc: 7,  bva: 'password max (64)',   inputData: 'password=64 chars',       expected: 'success: true' },
    { noTc: 8,  bva: 'password max+1 (65)',inputData: 'password=65 chars',        expected: 'success: false' },
    { noTc: 9,  bva: 'phone min (2)',       inputData: 'phone=2 digits',           expected: 'success: true' },
    { noTc: 10, bva: 'phone min-1 (1)',     inputData: 'phone=1 digit',            expected: 'success: false' },
    { noTc: 11, bva: 'phone max (15)',      inputData: 'phone=15 digits',          expected: 'success: true' },
    { noTc: 12, bva: 'phone max+1 (16)',    inputData: 'phone=16 digits',          expected: 'success: false' },
    { noTc: 13, bva: 'dob yesterday',      inputData: 'dateOfBirth=yesterday',     expected: 'success: true' },
    { noTc: 14, bva: 'dob today',          inputData: 'dateOfBirth=today',         expected: 'success: false' },
    { noTc: 15, bva: 'dob tomorrow',       inputData: 'dateOfBirth=tomorrow',      expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',        inputData: 'All valid fields',               expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: 'BVA-2',   inputData: 'fullName=7 chars',              expected: 'success: false' },
    { noTc: 3,  fromEc: '',      fromBva: 'BVA-1',   inputData: 'fullName=8 chars',               expected: 'success: true' },
    { noTc: 4,  fromEc: '',      fromBva: 'BVA-3',   inputData: 'fullName=64 chars',              expected: 'success: true' },
    { noTc: 5,  fromEc: 'EP-3',  fromBva: 'BVA-4',   inputData: 'fullName=65 chars',             expected: 'success: false' },
    { noTc: 6,  fromEc: 'EP-4',  fromBva: '',        inputData: 'invalid email',                  expected: 'success: false' },
    { noTc: 7,  fromEc: 'EP-5',  fromBva: '',        inputData: 'future dateOfBirth',             expected: 'success: false' },
    { noTc: 8,  fromEc: 'EP-6',  fromBva: 'BVA-6',   inputData: 'password=7 chars',              expected: 'success: false' },
    { noTc: 9,  fromEc: '',      fromBva: 'BVA-5',   inputData: 'password=8 chars',               expected: 'success: true' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-7',   inputData: 'password=64 chars',              expected: 'success: true' },
    { noTc: 11, fromEc: 'EP-7',  fromBva: 'BVA-8',   inputData: 'password=65 chars',             expected: 'success: false' },
    { noTc: 12, fromEc: 'EP-8',  fromBva: '',        inputData: 'password missing uppercase',     expected: 'success: false' },
    { noTc: 13, fromEc: 'EP-9',  fromBva: '',        inputData: 'password missing digit',         expected: 'success: false' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-13',  inputData: 'dateOfBirth=yesterday',          expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-9',   inputData: 'phone=2 digits (min)',            expected: 'success: true' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-11',  inputData: 'phone=15 digits (max)',           expected: 'success: true' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-10',  inputData: 'phone=1 digit (below min)',       expected: 'success: false' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-12',  inputData: 'phone=16 digits (above max)',     expected: 'success: false' },
    { noTc: 19, fromEc: '',      fromBva: 'BVA-14',  inputData: 'dateOfBirth=today',              expected: 'success: false' },
    { noTc: 20, fromEc: '',      fromBva: 'BVA-15',  inputData: 'dateOfBirth=tomorrow',           expected: 'success: false' },
    { noTc: 21, fromEc: '',      fromBva: '',        inputData: 'password missing special char',   expected: 'success: false' },
  ],
};

const updateMemberSchemaBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 28,
  statement: 'updateMemberSchema – validate partial update for a member. All fields optional: email, fullName (8-64), phone (E.164 2-15), dateOfBirth (YYYY-MM-DD, strictly past), password (8-64, upper+digit+special), membershipStart (YYYY-MM-DD). Same constraints when present.',
  data: 'Input: Partial<{ email, fullName, phone, dateOfBirth, password, membershipStart }>',
  precondition: 'All fields optional.  When present: same constraints as createMemberSchema.',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'Empty object → success: true.  Any provided field violating its constraint → success: false.',
  ecRows: [
    { number: 1,  condition: 'all absent',      validEc: 'empty object {}',              invalidEc: '' },
    { number: 2,  condition: 'email',            validEc: 'valid RFC',                   invalidEc: '' },
    { number: 3,  condition: '',                 validEc: '',                            invalidEc: 'invalid format' },
    { number: 4,  condition: 'fullName',         validEc: '8 ≤ len ≤ 64',               invalidEc: '' },
    { number: 5,  condition: '',                 validEc: '',                            invalidEc: 'len < 8 (7)' },
    { number: 6,  condition: '',                 validEc: '',                            invalidEc: 'len > 64 (65)' },
    { number: 7,  condition: 'phone',            validEc: 'E.164 2-15 digits',           invalidEc: '' },
    { number: 8,  condition: '',                 validEc: '',                            invalidEc: 'invalid format' },
    { number: 9,  condition: '',                 validEc: '',                            invalidEc: 'len < 2 (1 digit)' },
    { number: 10, condition: '',                 validEc: '',                            invalidEc: 'len > 15 (16 digits)' },
    { number: 11, condition: 'membershipStart',  validEc: 'YYYY-MM-DD',                 invalidEc: '' },
    { number: 12, condition: '',                 validEc: '',                            invalidEc: 'wrong format' },
    { number: 13, condition: '',                 validEc: '',                            invalidEc: 'no separators' },
    { number: 14, condition: 'password',         validEc: '8-64 chars, upper+digit+special', invalidEc: '' },
    { number: 15, condition: '',                 validEc: '',                            invalidEc: 'len < 8 (7)' },
    { number: 16, condition: '',                 validEc: '',                            invalidEc: 'len > 64 (65)' },
    { number: 17, condition: '',                 validEc: '',                            invalidEc: 'missing uppercase' },
    { number: 18, condition: '',                 validEc: '',                            invalidEc: 'missing digit' },
    { number: 19, condition: '',                 validEc: '',                            invalidEc: 'missing special character' },
    { number: 20, condition: 'dateOfBirth',      validEc: 'YYYY-MM-DD strictly past',   invalidEc: '' },
    { number: 21, condition: '',                 validEc: '',                            invalidEc: 'today (not strictly past)' },
    { number: 22, condition: '',                 validEc: '',                            invalidEc: 'tomorrow (future)' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1',   inputData: '{} (empty object)',                      expected: 'success: true' },
    { noTc: 2,  ec: '2',   inputData: '{ email: updated@example.com }',         expected: 'success: true' },
    { noTc: 3,  ec: '4',   inputData: '{ fullName: Updated Full Name }',        expected: 'success: true' },
    { noTc: 4,  ec: '3',   inputData: '{ email: bad-email }',                   expected: 'success: false – Invalid email address' },
    { noTc: 5,  ec: '5',   inputData: '{ fullName: 7 chars }',                  expected: 'success: false – fullName too short' },
    { noTc: 6,  ec: '6',   inputData: '{ fullName: 65 chars }',                 expected: 'success: false – fullName too long' },
    { noTc: 7,  ec: '8',   inputData: '{ phone: invalid }',                     expected: 'success: false – phone format incorrect' },
    { noTc: 8,  ec: '12',  inputData: '{ membershipStart: 01/01/2024 }',        expected: 'success: false – format error' },
    { noTc: 9,  ec: '15',  inputData: '{ password: 7 chars }',                  expected: 'success: false – password too short' },
  ],
  bvaRows: [
    { number: 1,  condition: 'fullName min=8',       testCase: 'fullName=8 chars' },
    { number: '',  condition: '',                     testCase: 'fullName=7 chars' },
    { number: 2,  condition: 'fullName max=64',      testCase: 'fullName=64 chars' },
    { number: '',  condition: '',                     testCase: 'fullName=65 chars' },
    { number: 3,  condition: 'password min=8',       testCase: 'password=8 chars' },
    { number: '',  condition: '',                     testCase: 'password=7 chars' },
    { number: 4,  condition: 'password max=64',      testCase: 'password=64 chars' },
    { number: '',  condition: '',                     testCase: 'password=65 chars' },
    { number: 5,  condition: 'phone min=2 digits',   testCase: 'phone=2 digits' },
    { number: '',  condition: '',                     testCase: 'phone=1 digit' },
    { number: 6,  condition: 'phone max=15 digits',  testCase: 'phone=15 digits' },
    { number: '',  condition: '',                     testCase: 'phone=16 digits' },
    { number: 7,  condition: 'dateOfBirth boundary', testCase: 'yesterday (valid)' },
    { number: '',  condition: '',                     testCase: 'today (invalid)' },
    { number: '',  condition: '',                     testCase: 'tomorrow (invalid)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName min (8)',     inputData: '{ fullName=8 chars }',   expected: 'success: true' },
    { noTc: 2,  bva: 'fullName min-1 (7)',   inputData: '{ fullName=7 chars }',   expected: 'success: false' },
    { noTc: 3,  bva: 'fullName max (64)',    inputData: '{ fullName=64 chars }',  expected: 'success: true' },
    { noTc: 4,  bva: 'fullName max+1 (65)', inputData: '{ fullName=65 chars }',  expected: 'success: false' },
    { noTc: 5,  bva: 'password min (8)',    inputData: '{ password=8 chars }',    expected: 'success: true' },
    { noTc: 6,  bva: 'password min-1 (7)', inputData: '{ password=7 chars }',    expected: 'success: false' },
    { noTc: 7,  bva: 'password max (64)',   inputData: '{ password=64 chars }',   expected: 'success: true' },
    { noTc: 8,  bva: 'password max+1 (65)',inputData: '{ password=65 chars }',   expected: 'success: false' },
    { noTc: 9,  bva: 'phone min (2)',       inputData: '{ phone=2 digits }',       expected: 'success: true' },
    { noTc: 10, bva: 'phone min-1 (1)',     inputData: '{ phone=1 digit }',        expected: 'success: false' },
    { noTc: 11, bva: 'phone max (15)',      inputData: '{ phone=15 digits }',      expected: 'success: true' },
    { noTc: 12, bva: 'phone max+1 (16)',    inputData: '{ phone=16 digits }',      expected: 'success: false' },
    { noTc: 13, bva: 'dob yesterday',      inputData: '{ dateOfBirth=yesterday }', expected: 'success: true' },
    { noTc: 14, bva: 'dob today',          inputData: '{ dateOfBirth=today }',     expected: 'success: false' },
    { noTc: 15, bva: 'dob tomorrow',       inputData: '{ dateOfBirth=tomorrow }',  expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',        inputData: 'Empty object',                   expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',        inputData: 'Valid email only',                expected: 'success: true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',        inputData: 'Valid fullName only',             expected: 'success: true' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: 'BVA-2',   inputData: 'fullName=7 chars',              expected: 'success: false' },
    { noTc: 5,  fromEc: '',      fromBva: 'BVA-1',   inputData: 'fullName=8 chars',               expected: 'success: true' },
    { noTc: 6,  fromEc: 'EP-5',  fromBva: 'BVA-4',   inputData: 'fullName=65 chars',             expected: 'success: false' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-3',   inputData: 'fullName=64 chars',              expected: 'success: true' },
    { noTc: 8,  fromEc: 'EP-6',  fromBva: '',        inputData: 'invalid email',                  expected: 'success: false' },
    { noTc: 9,  fromEc: 'EP-7',  fromBva: '',        inputData: 'invalid phone',                  expected: 'success: false' },
    { noTc: 10, fromEc: 'EP-8',  fromBva: '',        inputData: 'membershipStart wrong format',   expected: 'success: false' },
    { noTc: 11, fromEc: 'EP-9',  fromBva: 'BVA-6',   inputData: 'password=7 chars',              expected: 'success: false' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-5',   inputData: 'password=8 chars',               expected: 'success: true' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-7',   inputData: 'password=64 chars',              expected: 'success: true' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-8',   inputData: 'password=65 chars',              expected: 'success: false' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-13',  inputData: 'dateOfBirth=yesterday',          expected: 'success: true' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-14',  inputData: 'dateOfBirth=today',              expected: 'success: false' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-15',  inputData: 'dateOfBirth=tomorrow',           expected: 'success: false' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-9',   inputData: 'phone=2 digits (min)',            expected: 'success: true' },
    { noTc: 19, fromEc: '',      fromBva: 'BVA-11',  inputData: 'phone=15 digits (max)',           expected: 'success: true' },
    { noTc: 20, fromEc: '',      fromBva: 'BVA-10',  inputData: 'phone=1 digit (below min)',       expected: 'success: false' },
    { noTc: 21, fromEc: '',      fromBva: 'BVA-12',  inputData: 'phone=16 digits (above max)',     expected: 'success: false' },
    { noTc: 22, fromEc: '',      fromBva: '',        inputData: 'password missing uppercase',       expected: 'success: false' },
    { noTc: 23, fromEc: '',      fromBva: '',        inputData: 'password missing digit',           expected: 'success: false' },
    { noTc: 24, fromEc: '',      fromBva: '',        inputData: 'password missing special char',    expected: 'success: false' },
    { noTc: 25, fromEc: '',      fromBva: '',        inputData: 'valid phone',                      expected: 'success: true' },
    { noTc: 26, fromEc: '',      fromBva: '',        inputData: 'valid membershipStart',            expected: 'success: true' },
    { noTc: 27, fromEc: '',      fromBva: '',        inputData: 'valid password',                   expected: 'success: true' },
    { noTc: 28, fromEc: '',      fromBva: '',        inputData: 'membershipStart no separators',    expected: 'success: false' },
  ],
};

const updateAdminSchemaBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 25,
  statement: 'updateAdminSchema – validate partial update for an admin. All optional: email, fullName (8-64), phone (E.164 2-15), dateOfBirth (YYYY-MM-DD strictly past), password (8-64, upper+digit+special). Same constraints when present.',
  data: 'Input: Partial<{ email, fullName, phone, dateOfBirth, password }>',
  precondition: 'All optional.  Same constraints apply when present.',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'Empty object → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1,  condition: 'all absent',   validEc: 'empty object',                invalidEc: '' },
    { number: 2,  condition: 'email',        validEc: 'valid RFC',                    invalidEc: '' },
    { number: 3,  condition: '',             validEc: '',                             invalidEc: 'invalid format' },
    { number: 4,  condition: 'fullName',     validEc: '8 ≤ len ≤ 64',               invalidEc: '' },
    { number: 5,  condition: '',             validEc: '',                             invalidEc: 'len < 8' },
    { number: 6,  condition: '',             validEc: '',                             invalidEc: 'len > 64' },
    { number: 7,  condition: 'phone',        validEc: 'E.164 2-15 digits',           invalidEc: '' },
    { number: 8,  condition: '',             validEc: '',                             invalidEc: 'invalid format' },
    { number: 9,  condition: '',             validEc: '',                             invalidEc: 'len < 2 (1 digit)' },
    { number: 10, condition: '',             validEc: '',                             invalidEc: 'len > 15 (16 digits)' },
    { number: 11, condition: 'password',     validEc: '8-64 chars, upper+digit+special', invalidEc: '' },
    { number: 12, condition: '',             validEc: '',                             invalidEc: 'len < 8' },
    { number: 13, condition: '',             validEc: '',                             invalidEc: 'len > 64' },
    { number: 14, condition: '',             validEc: '',                             invalidEc: 'missing uppercase' },
    { number: 15, condition: '',             validEc: '',                             invalidEc: 'missing digit' },
    { number: 16, condition: '',             validEc: '',                             invalidEc: 'missing special char' },
    { number: 17, condition: 'dateOfBirth',  validEc: 'YYYY-MM-DD strictly past',   invalidEc: '' },
    { number: 18, condition: '',             validEc: '',                             invalidEc: 'today (not strictly past)' },
    { number: 19, condition: '',             validEc: '',                             invalidEc: 'tomorrow (future)' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1',   inputData: '{} (empty object)',                 expected: 'success: true' },
    { noTc: 2,  ec: '2',   inputData: '{ email: new-admin@example.com }', expected: 'success: true' },
    { noTc: 3,  ec: '3',   inputData: '{ email: not-valid }',             expected: 'success: false – Invalid email address' },
    { noTc: 4,  ec: '5',   inputData: '{ fullName: 7 chars }',            expected: 'success: false – fullName too short' },
    { noTc: 5,  ec: '8',   inputData: '{ phone: invalid-phone }',         expected: 'success: false – phone format incorrect' },
    { noTc: 6,  ec: '12',  inputData: '{ password: 7 chars }',            expected: 'success: false – password too short' },
    { noTc: 7,  ec: '18',  inputData: '{ dateOfBirth: today }',           expected: 'success: false – must be in the past' },
  ],
  bvaRows: [
    { number: 1,  condition: 'fullName min=8',       testCase: 'fullName=8 chars' },
    { number: '',  condition: '',                     testCase: 'fullName=7 chars' },
    { number: 2,  condition: 'fullName max=64',      testCase: 'fullName=64 chars' },
    { number: '',  condition: '',                     testCase: 'fullName=65 chars' },
    { number: 3,  condition: 'password min=8',       testCase: 'password=8 chars' },
    { number: '',  condition: '',                     testCase: 'password=7 chars' },
    { number: 4,  condition: 'password max=64',      testCase: 'password=64 chars' },
    { number: '',  condition: '',                     testCase: 'password=65 chars' },
    { number: 5,  condition: 'phone min=2 digits',   testCase: 'phone=2 digits' },
    { number: '',  condition: '',                     testCase: 'phone=1 digit' },
    { number: 6,  condition: 'phone max=15 digits',  testCase: 'phone=15 digits' },
    { number: '',  condition: '',                     testCase: 'phone=16 digits' },
    { number: 7,  condition: 'dateOfBirth boundary', testCase: 'yesterday (valid)' },
    { number: '',  condition: '',                     testCase: 'today (invalid)' },
    { number: '',  condition: '',                     testCase: 'tomorrow (invalid)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName min (8)',     inputData: '{ fullName=8 chars }',   expected: 'success: true' },
    { noTc: 2,  bva: 'fullName min-1 (7)',   inputData: '{ fullName=7 chars }',   expected: 'success: false' },
    { noTc: 3,  bva: 'fullName max (64)',    inputData: '{ fullName=64 chars }',  expected: 'success: true' },
    { noTc: 4,  bva: 'fullName max+1 (65)', inputData: '{ fullName=65 chars }',  expected: 'success: false' },
    { noTc: 5,  bva: 'password min (8)',    inputData: '{ password=8 chars }',    expected: 'success: true' },
    { noTc: 6,  bva: 'password min-1 (7)', inputData: '{ password=7 chars }',    expected: 'success: false' },
    { noTc: 7,  bva: 'password max (64)',   inputData: '{ password=64 chars }',   expected: 'success: true' },
    { noTc: 8,  bva: 'password max+1 (65)',inputData: '{ password=65 chars }',   expected: 'success: false' },
    { noTc: 9,  bva: 'phone min (2)',       inputData: '{ phone=2 digits }',       expected: 'success: true' },
    { noTc: 10, bva: 'phone min-1 (1)',     inputData: '{ phone=1 digit }',        expected: 'success: false' },
    { noTc: 11, bva: 'phone max (15)',      inputData: '{ phone=15 digits }',      expected: 'success: true' },
    { noTc: 12, bva: 'phone max+1 (16)',    inputData: '{ phone=16 digits }',      expected: 'success: false' },
    { noTc: 13, bva: 'dob yesterday',      inputData: '{ dateOfBirth=yesterday }', expected: 'success: true' },
    { noTc: 14, bva: 'dob today',          inputData: '{ dateOfBirth=today }',     expected: 'success: false' },
    { noTc: 15, bva: 'dob tomorrow',       inputData: '{ dateOfBirth=tomorrow }',  expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',        inputData: 'Empty object',                   expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',        inputData: 'Valid email',                     expected: 'success: true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',        inputData: 'Invalid email',                   expected: 'success: false' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: 'BVA-2',   inputData: 'fullName=7 chars',              expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: '',        inputData: 'invalid phone',                  expected: 'success: false' },
    { noTc: 6,  fromEc: '',      fromBva: 'BVA-1',   inputData: 'fullName=8 chars',               expected: 'success: true' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-3',   inputData: 'fullName=64 chars',              expected: 'success: true' },
    { noTc: 8,  fromEc: '',      fromBva: 'BVA-4',   inputData: 'fullName=65 chars',              expected: 'success: false' },
    { noTc: 9,  fromEc: 'EP-6',  fromBva: 'BVA-6',   inputData: 'password=7 chars',              expected: 'success: false' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-5',   inputData: 'password=8 chars',               expected: 'success: true' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-7',   inputData: 'password=64 chars',              expected: 'success: true' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-8',   inputData: 'password=65 chars',              expected: 'success: false' },
    { noTc: 13, fromEc: 'EP-7',  fromBva: 'BVA-14',  inputData: 'dateOfBirth=today',             expected: 'success: false' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-13',  inputData: 'dateOfBirth=yesterday',          expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-15',  inputData: 'dateOfBirth=tomorrow',           expected: 'success: false' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-9',   inputData: 'phone=2 digits (min)',            expected: 'success: true' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-11',  inputData: 'phone=15 digits (max)',           expected: 'success: true' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-10',  inputData: 'phone=1 digit (below min)',       expected: 'success: false' },
    { noTc: 19, fromEc: '',      fromBva: 'BVA-12',  inputData: 'phone=16 digits (above max)',     expected: 'success: false' },
    { noTc: 20, fromEc: '',      fromBva: '',        inputData: 'valid fullName',                   expected: 'success: true' },
    { noTc: 21, fromEc: '',      fromBva: '',        inputData: 'valid phone',                      expected: 'success: true' },
    { noTc: 22, fromEc: '',      fromBva: '',        inputData: 'valid password',                   expected: 'success: true' },
    { noTc: 23, fromEc: '',      fromBva: '',        inputData: 'password missing uppercase',       expected: 'success: false' },
    { noTc: 24, fromEc: '',      fromBva: '',        inputData: 'password missing digit',           expected: 'success: false' },
    { noTc: 25, fromEc: '',      fromBva: '',        inputData: 'password missing special char',    expected: 'success: false' },
  ],
};

const createExerciseSchemaBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 27,
  statement: 'createExerciseSchema – validate input for creating a new exercise. Fields: name (8-64 chars), description (0-1024 chars, optional), muscleGroup (enum: CHEST|SHOULDERS|ARMS|BACK|CORE|LEGS), equipmentNeeded (enum: CABLE|DUMBBELL|BARBELL|MACHINE).',
  data: 'Input: { name: string, description?: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }',
  precondition: '8 ≤ len(name) ≤ 64  |  len(description) ≤ 1024 (optional)  |  muscleGroup ∈ {CHEST,SHOULDERS,ARMS,BACK,CORE,LEGS}  |  equipmentNeeded ∈ {CABLE,DUMBBELL,BARBELL,MACHINE}',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1,  condition: 'name length',       validEc: '8 ≤ len ≤ 64',      invalidEc: '' },
    { number: 2,  condition: '',                  validEc: '',                   invalidEc: 'len < 8' },
    { number: 3,  condition: '',                  validEc: '',                   invalidEc: 'len > 64' },
    { number: 4,  condition: 'description',       validEc: 'absent (optional)',  invalidEc: '' },
    { number: 5,  condition: '',                  validEc: 'len = 0',            invalidEc: '' },
    { number: 6,  condition: '',                  validEc: 'len ≤ 1024',         invalidEc: '' },
    { number: 7,  condition: '',                  validEc: '',                   invalidEc: 'len > 1024' },
    { number: 8,  condition: 'muscleGroup',       validEc: 'CHEST|SHOULDERS|ARMS|BACK|CORE|LEGS', invalidEc: '' },
    { number: 9,  condition: '',                  validEc: '',                   invalidEc: 'value not in enum' },
    { number: 10, condition: 'equipmentNeeded',   validEc: 'CABLE|DUMBBELL|BARBELL|MACHINE', invalidEc: '' },
    { number: 11, condition: '',                  validEc: '',                   invalidEc: 'value not in enum' },
    { number: 12, condition: 'required fields',   validEc: 'all present',        invalidEc: '' },
    { number: 13, condition: '',                  validEc: '',                   invalidEc: 'name absent' },
    { number: 14, condition: '',                  validEc: '',                   invalidEc: 'muscleGroup absent' },
    { number: 15, condition: '',                  validEc: '',                   invalidEc: 'equipmentNeeded absent' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,4,8,10,12', inputData: 'name=Bench Press, desc absent, muscleGroup=CHEST, equipment=BARBELL',      expected: 'success: true' },
    { noTc: 2,  ec: '5',           inputData: 'description="" (empty string)',                                             expected: 'success: true' },
    { noTc: 3,  ec: '2',           inputData: 'name=Squat-X (7 chars)',                                                   expected: 'success: false – Name must be at least 8 characters' },
    { noTc: 4,  ec: '3',           inputData: 'name=E×65 (65 chars)',                                                     expected: 'success: false – Name must be at most 64 characters' },
    { noTc: 5,  ec: '7',           inputData: 'description=D×1025 (1025 chars)',                                          expected: 'success: false – Description must be at most 1024 characters' },
    { noTc: 6,  ec: '9',           inputData: 'muscleGroup=GLUTES',                                                       expected: 'success: false' },
    { noTc: 7,  ec: '11',          inputData: 'equipmentNeeded=KETTLEBELL',                                               expected: 'success: false' },
    { noTc: 8,  ec: '13',          inputData: 'name absent',                                                              expected: 'success: false' },
    { noTc: 9,  ec: '14',          inputData: 'muscleGroup absent',                                                       expected: 'success: false' },
    { noTc: 10, ec: '15',          inputData: 'equipmentNeeded absent',                                                   expected: 'success: false' },
  ],
  bvaRows: [
    { number: 1, condition: 'name min=8',          testCase: 'name=PullDown (8 chars)' },
    { number: '',condition: '',                     testCase: 'name=Squat-X (7 chars)' },
    { number: 2, condition: 'name max=64',          testCase: 'name=E×64 (64 chars)' },
    { number: '',condition: '',                     testCase: 'name=E×65 (65 chars)' },
    { number: 3, condition: 'description max=1024', testCase: 'description=D×1024 (1024 chars)' },
    { number: '',condition: '',                     testCase: 'description=D×1025 (1025 chars)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'name min (8)',         inputData: 'name=PullDown (8 chars), other valid', expected: 'success: true' },
    { noTc: 2, bva: 'name min-1 (7)',       inputData: 'name=Squat-X (7 chars), other valid',  expected: 'success: false – name too short' },
    { noTc: 3, bva: 'name max (64)',        inputData: 'name=E×64 (64 chars), other valid',    expected: 'success: true' },
    { noTc: 4, bva: 'name max+1 (65)',      inputData: 'name=E×65 (65 chars), other valid',    expected: 'success: false – name too long' },
    { noTc: 5, bva: 'description max(1024)',inputData: 'description=D×1024, other valid',      expected: 'success: true' },
    { noTc: 6, bva: 'description max+1',   inputData: 'description=D×1025, other valid',      expected: 'success: false – description too long' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',      inputData: 'All valid, no description',    expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',      inputData: 'description=empty string',     expected: 'success: true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: 'BVA-2', inputData: 'name=7 chars',                expected: 'success: false' },
    { noTc: 4,  fromEc: '',      fromBva: 'BVA-1', inputData: 'name=8 chars',                  expected: 'success: true' },
    { noTc: 5,  fromEc: '',      fromBva: 'BVA-3', inputData: 'name=64 chars',                 expected: 'success: true' },
    { noTc: 6,  fromEc: 'EP-4',  fromBva: 'BVA-4', inputData: 'name=65 chars',               expected: 'success: false' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-5', inputData: 'description=1024 chars',       expected: 'success: true' },
    { noTc: 8,  fromEc: 'EP-5',  fromBva: 'BVA-6', inputData: 'description=1025 chars',      expected: 'success: false' },
    { noTc: 9,  fromEc: 'EP-6',  fromBva: '',      inputData: 'muscleGroup=GLUTES',           expected: 'success: false' },
    { noTc: 10, fromEc: 'EP-7',  fromBva: '',      inputData: 'equipmentNeeded=KETTLEBELL',   expected: 'success: false' },
    { noTc: 11, fromEc: 'EP-8',  fromBva: '',      inputData: 'name absent',                  expected: 'success: false' },
    { noTc: 12, fromEc: 'EP-9',  fromBva: '',      inputData: 'muscleGroup absent',            expected: 'success: false' },
    { noTc: 13, fromEc: 'EP-10', fromBva: '',      inputData: 'equipmentNeeded absent',        expected: 'success: false' },
    { noTc: 14, fromEc: 'EP-11', fromBva: '',      inputData: 'name="" (empty string)',         expected: 'success: false' },
    { noTc: 15, fromEc: '',      fromBva: '',      inputData: 'description=1 char (interior)', expected: 'success: true' },
    { noTc: 16, fromEc: '',      fromBva: '',      inputData: 'description=1023 chars (interior)', expected: 'success: true' },
    { noTc: 17, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=SHOULDERS',         expected: 'success: true' },
    { noTc: 18, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=ARMS',              expected: 'success: true' },
    { noTc: 19, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=BACK',              expected: 'success: true' },
    { noTc: 20, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=CORE',              expected: 'success: true' },
    { noTc: 21, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=LEGS',              expected: 'success: true' },
    { noTc: 22, fromEc: '',      fromBva: '',      inputData: 'equipment=CABLE',               expected: 'success: true' },
    { noTc: 23, fromEc: '',      fromBva: '',      inputData: 'equipment=DUMBBELL',            expected: 'success: true' },
    { noTc: 24, fromEc: '',      fromBva: '',      inputData: 'equipment=MACHINE',             expected: 'success: true' },
    { noTc: 25, fromEc: 'EP-12', fromBva: '',      inputData: 'muscleGroup=GLUTES (invalid)',  expected: 'success: false' },
    { noTc: 26, fromEc: 'EP-13', fromBva: '',      inputData: 'equipment=KETTLEBELL (invalid)', expected: 'success: false' },
    { noTc: 27, fromEc: 'EP-14', fromBva: '',      inputData: 'equipment=RESISTANCE_BAND (invalid)', expected: 'success: false' },
  ],
};

const updateExerciseSchemaBbt: BbtDescriptor = {
  reqId: 'EXM-03',
  tcCount: 24,
  statement: 'updateExerciseSchema – validate partial update for an exercise. All fields optional: name (8-64 chars), description (0-1024 chars), muscleGroup (enum), equipmentNeeded (enum). Same constraints apply when a field is present.',
  data: 'Input: Partial<{ name, description, muscleGroup, equipmentNeeded }>',
  precondition: 'All optional.  When present: 8 ≤ len(name) ≤ 64  |  len(description) ≤ 1024  |  valid enum values.',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'Empty object → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1, condition: 'all absent',   validEc: 'empty object', invalidEc: '' },
    { number: 2, condition: 'name',         validEc: '8 ≤ len ≤ 64', invalidEc: '' },
    { number: 3, condition: '',             validEc: '',             invalidEc: 'len < 8' },
    { number: 4, condition: 'description',  validEc: 'len ≤ 1024',  invalidEc: '' },
    { number: 5, condition: '',             validEc: '',             invalidEc: 'len > 1024' },
    { number: 6, condition: 'muscleGroup',  validEc: 'valid enum',   invalidEc: '' },
    { number: 7, condition: '',             validEc: '',             invalidEc: 'not in enum' },
    { number: 8, condition: 'equipment',    validEc: 'valid enum',   invalidEc: '' },
    { number: 9, condition: '',             validEc: '',             invalidEc: 'not in enum' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1',  inputData: '{} (empty object)',                    expected: 'success: true' },
    { noTc: 2, ec: '2',  inputData: '{ name: Overhead Press (14 chars) }', expected: 'success: true' },
    { noTc: 3, ec: '4',  inputData: '{ description: Updated desc... }',    expected: 'success: true' },
    { noTc: 4, ec: '3',  inputData: '{ name: RowExr (6 chars) }',          expected: 'success: false – name too short' },
    { noTc: 5, ec: '5',  inputData: '{ description: X×1025 (1025 chars) }', expected: 'success: false – description too long' },
    { noTc: 6, ec: '7',  inputData: '{ muscleGroup: BICEP }',               expected: 'success: false – invalid enum' },
    { noTc: 7, ec: '9',  inputData: '{ equipmentNeeded: RESISTANCE_BAND }', expected: 'success: false – invalid enum' },
  ],
  bvaRows: [
    { number: 1, condition: 'name min=8',          testCase: 'name=LegPress (8 chars)' },
    { number: '',condition: '',                     testCase: 'name=RowExr (6 chars)' },
    { number: 2, condition: 'description max=1024', testCase: 'description=X×1024' },
    { number: '',condition: '',                     testCase: 'description=X×1025' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'name min (8)',         inputData: '{ name=LegPress (8 chars) }', expected: 'success: true' },
    { noTc: 2, bva: 'name min-1 (7)',       inputData: '{ name=RowExr (6 chars) }',   expected: 'success: false' },
    { noTc: 3, bva: 'description max(1024)',inputData: '{ description=X×1024 }',      expected: 'success: true' },
    { noTc: 4, bva: 'description max+1',   inputData: '{ description=X×1025 }',      expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1',  fromBva: '',      inputData: 'Empty object',          expected: 'success: true' },
    { noTc: 2, fromEc: 'EP-2',  fromBva: '',      inputData: 'Valid name',            expected: 'success: true' },
    { noTc: 3, fromEc: 'EP-3',  fromBva: '',      inputData: 'Valid description',     expected: 'success: true' },
    { noTc: 4, fromEc: 'EP-4',  fromBva: 'BVA-2', inputData: 'name=6 chars',         expected: 'success: false' },
    { noTc: 5, fromEc: '',      fromBva: 'BVA-1', inputData: 'name=8 chars',          expected: 'success: true' },
    { noTc: 6, fromEc: '',      fromBva: 'BVA-3', inputData: 'description=1024 chars', expected: 'success: true' },
    { noTc: 7, fromEc: 'EP-5',  fromBva: 'BVA-4', inputData: 'description=1025 chars', expected: 'success: false' },
    { noTc: 8,  fromEc: 'EP-6',  fromBva: '',      inputData: 'invalid muscleGroup',           expected: 'success: false' },
    { noTc: 9,  fromEc: 'EP-7',  fromBva: '',      inputData: 'invalid equipment',              expected: 'success: false' },
    { noTc: 10, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=SHOULDERS',          expected: 'success: true' },
    { noTc: 11, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=ARMS',               expected: 'success: true' },
    { noTc: 12, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=BACK',               expected: 'success: true' },
    { noTc: 13, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=CORE',               expected: 'success: true' },
    { noTc: 14, fromEc: '',      fromBva: '',      inputData: 'muscleGroup=LEGS',               expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: '',      inputData: 'equipment=CABLE',                expected: 'success: true' },
    { noTc: 16, fromEc: '',      fromBva: '',      inputData: 'equipment=DUMBBELL',             expected: 'success: true' },
    { noTc: 17, fromEc: '',      fromBva: '',      inputData: 'equipment=MACHINE',              expected: 'success: true' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-3', inputData: 'description=1024 chars (max)',  expected: 'success: true' },
    { noTc: 19, fromEc: '',      fromBva: '',      inputData: 'description="" (empty)',          expected: 'success: true' },
    { noTc: 20, fromEc: '',      fromBva: '',      inputData: 'description absent',             expected: 'success: true' },
    { noTc: 21, fromEc: '',      fromBva: 'BVA-1', inputData: 'name=8 chars (min)',            expected: 'success: true' },
    { noTc: 22, fromEc: '',      fromBva: 'BVA-4', inputData: 'name=65 chars (above max)',     expected: 'success: false' },
    { noTc: 23, fromEc: '',      fromBva: '',      inputData: 'name="" (empty string)',          expected: 'success: false' },
    { noTc: 24, fromEc: '',      fromBva: '',      inputData: 'name=64 chars (max)',             expected: 'success: true' },
  ],
};

const createWorkoutSessionSchemaBbt: BbtDescriptor = {
  reqId: 'WSM-01',
  tcCount: 19,
  statement: 'createWorkoutSessionSchema – validate input for creating a workout session. Fields: memberId (non-empty), date (YYYY-MM-DD), duration (Integer 0-180 minutes), notes (0-1024 chars, optional).',
  data: 'Input: { memberId: string, date: string, duration: number, notes?: string }',
  precondition: 'len(memberId) ≥ 1  |  date matches YYYY-MM-DD  |  0 ≤ duration ≤ 180  |  len(notes) ≤ 1024 (optional)',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1, condition: 'memberId',       validEc: 'len ≥ 1',          invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                  invalidEc: 'empty string' },
    { number: 3, condition: '',               validEc: '',                  invalidEc: 'field absent' },
    { number: 4, condition: 'date format',    validEc: 'YYYY-MM-DD',        invalidEc: '' },
    { number: 5, condition: '',               validEc: '',                  invalidEc: 'wrong format' },
    { number: 6, condition: '',               validEc: '',                  invalidEc: 'field absent' },
    { number: 7, condition: 'duration range', validEc: '0 ≤ d ≤ 180',      invalidEc: '' },
    { number: 8, condition: '',               validEc: '',                  invalidEc: 'd < 0' },
    { number: 9, condition: '',               validEc: '',                  invalidEc: 'd > 180' },
    { number: 10,condition: 'notes',          validEc: 'absent (optional)', invalidEc: '' },
    { number: 11,condition: '',               validEc: 'len ≤ 1024',        invalidEc: '' },
    { number: 12,condition: '',               validEc: '',                  invalidEc: 'len > 1024' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,4,7,10', inputData: 'memberId=member-abc, date=2024-06-15, duration=60, notes absent', expected: 'success: true' },
    { noTc: 2, ec: '2',        inputData: 'memberId="" (empty)',                                              expected: 'success: false' },
    { noTc: 3, ec: '3',        inputData: 'memberId absent',                                                  expected: 'success: false' },
    { noTc: 4, ec: '5',        inputData: 'date=15/06/2024 (DD/MM/YYYY)',                                    expected: 'success: false – Date must be in YYYY-MM-DD format' },
    { noTc: 5, ec: '6',        inputData: 'date absent',                                                      expected: 'success: false' },
    { noTc: 6, ec: '8',        inputData: 'duration=-1',                                                      expected: 'success: false – Duration must be ≥ 0' },
    { noTc: 7, ec: '9',        inputData: 'duration=181',                                                     expected: 'success: false – Duration must be ≤ 180 minutes' },
    { noTc: 8, ec: '12',       inputData: 'notes=N×1025 (1025 chars)',                                        expected: 'success: false – Notes must be at most 1024 characters' },
  ],
  bvaRows: [
    { number: 1, condition: 'duration min=0',   testCase: 'duration=0' },
    { number: '',condition: '',                  testCase: 'duration=-1' },
    { number: 2, condition: 'duration max=180', testCase: 'duration=180' },
    { number: '',condition: '',                  testCase: 'duration=181' },
    { number: 3, condition: 'notes max=1024',   testCase: 'notes=N×1024 (1024 chars)' },
    { number: '',condition: '',                  testCase: 'notes=N×1025 (1025 chars)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'duration min (0)',    inputData: 'duration=0, other valid',   expected: 'success: true' },
    { noTc: 2, bva: 'duration min-1 (-1)', inputData: 'duration=-1, other valid', expected: 'success: false – duration ≥ 0' },
    { noTc: 3, bva: 'duration max (180)',  inputData: 'duration=180, other valid', expected: 'success: true' },
    { noTc: 4, bva: 'duration max+1 (181)',inputData: 'duration=181, other valid', expected: 'success: false – duration ≤ 180' },
    { noTc: 5, bva: 'notes max (1024)',    inputData: 'notes=1024 chars, other valid', expected: 'success: true' },
    { noTc: 6, bva: 'notes max+1 (1025)', inputData: 'notes=1025 chars, other valid', expected: 'success: false – notes too long' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',      inputData: 'All valid, notes absent',    expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',      inputData: 'memberId empty',              expected: 'success: false' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',      inputData: 'memberId absent',             expected: 'success: false' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: '',      inputData: 'date wrong format',           expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: '',      inputData: 'date absent',                 expected: 'success: false' },
    { noTc: 6,  fromEc: 'EP-6',  fromBva: 'BVA-2', inputData: 'duration=-1',               expected: 'success: false' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-1', inputData: 'duration=0',                 expected: 'success: true' },
    { noTc: 8,  fromEc: '',      fromBva: 'BVA-3', inputData: 'duration=180',               expected: 'success: true' },
    { noTc: 9,  fromEc: 'EP-7',  fromBva: 'BVA-4', inputData: 'duration=181',              expected: 'success: false' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-5', inputData: 'notes=1024 chars',           expected: 'success: true' },
    { noTc: 11, fromEc: 'EP-8',  fromBva: 'BVA-6', inputData: 'notes=1025 chars',                    expected: 'success: false' },
    { noTc: 12, fromEc: 'EP-9',  fromBva: '',      inputData: 'memberId absent',                       expected: 'success: false' },
    { noTc: 13, fromEc: '',      fromBva: '',      inputData: 'memberId=whitespace only',               expected: 'success: false' },
    { noTc: 14, fromEc: '',      fromBva: '',      inputData: 'duration=1 (interior min+1)',            expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: '',      inputData: 'duration=179 (interior max-1)',          expected: 'success: true' },
    { noTc: 16, fromEc: '',      fromBva: '',      inputData: 'notes=1 char (interior)',                expected: 'success: true' },
    { noTc: 17, fromEc: '',      fromBva: '',      inputData: 'memberId=1 char (min length)',           expected: 'success: true' },
    { noTc: 18, fromEc: '',      fromBva: '',      inputData: 'duration absent',                        expected: 'success: false' },
    { noTc: 19, fromEc: '',      fromBva: '',      inputData: 'notes absent (optional)',                expected: 'success: true' },
  ],
};

const workoutSessionExercisesSchemaBbt: BbtDescriptor = {
  reqId: 'WSM-02/WSM-03',
  tcCount: 27,
  statement: 'workoutSessionExercisesSchema – validate the array of exercises in a session. Minimum one entry (WSM-03). Each entry: exerciseId (non-empty), sets (Integer 0-6), reps (Integer 0-30), weight (Float 0.0-500.0 kg).',
  data: 'Input: Array<{ exerciseId: string, sets: number, reps: number, weight: number }>',
  precondition: 'array.length ≥ 1  |  len(exerciseId) ≥ 1  |  0 ≤ sets ≤ 6  |  0 ≤ reps ≤ 30  |  0.0 ≤ weight ≤ 500.0',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Empty array or any violation → success: false.',
  ecRows: [
    { number: 1,  condition: 'array length', validEc: 'length ≥ 1',   invalidEc: '' },
    { number: 2,  condition: '',             validEc: '',              invalidEc: 'empty array []' },
    { number: 3,  condition: 'exerciseId',   validEc: 'len ≥ 1',      invalidEc: '' },
    { number: 4,  condition: '',             validEc: '',              invalidEc: 'empty string' },
    { number: 5,  condition: 'sets range',   validEc: '0 ≤ sets ≤ 6', invalidEc: '' },
    { number: 6,  condition: '',             validEc: '',              invalidEc: 'sets < 0' },
    { number: 7,  condition: '',             validEc: '',              invalidEc: 'sets > 6' },
    { number: 8,  condition: 'reps range',   validEc: '0 ≤ reps ≤ 30',invalidEc: '' },
    { number: 9,  condition: '',             validEc: '',              invalidEc: 'reps < 0' },
    { number: 10, condition: '',             validEc: '',              invalidEc: 'reps > 30' },
    { number: 11, condition: 'weight range', validEc: '0 ≤ w ≤ 500',  invalidEc: '' },
    { number: 12, condition: '',             validEc: '',              invalidEc: 'weight < 0' },
    { number: 13, condition: '',             validEc: '',              invalidEc: 'weight > 500' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,3,5,8,11', inputData: '[{exerciseId=ex-1, sets=3, reps=10, weight=80}]',       expected: 'success: true' },
    { noTc: 2,  ec: '1',           inputData: 'Three valid exercises',                                 expected: 'success: true' },
    { noTc: 3,  ec: '2',           inputData: '[] (empty array)',                                      expected: 'success: false – At least one exercise is required' },
    { noTc: 4,  ec: '4',           inputData: '[{exerciseId="", ...}]',                               expected: 'success: false – Exercise is required' },
    { noTc: 5,  ec: '6',           inputData: '[{...sets=-1...}]',                                    expected: 'success: false – Sets ≥ 0' },
    { noTc: 6,  ec: '7',           inputData: '[{...sets=7...}]',                                     expected: 'success: false – Sets ≤ 6' },
    { noTc: 7,  ec: '9',           inputData: '[{...reps=-1...}]',                                    expected: 'success: false – Reps ≥ 0' },
    { noTc: 8,  ec: '10',          inputData: '[{...reps=31...}]',                                    expected: 'success: false – Reps ≤ 30' },
    { noTc: 9,  ec: '12',          inputData: '[{...weight=-0.1...}]',                                expected: 'success: false – Weight ≥ 0.0' },
    { noTc: 10, ec: '13',          inputData: '[{...weight=500.1...}]',                               expected: 'success: false – Weight ≤ 500.0' },
  ],
  bvaRows: [
    { number: 1, condition: 'sets min=0',    testCase: 'sets=0' },
    { number: '',condition: '',              testCase: 'sets=-1' },
    { number: 2, condition: 'sets max=6',    testCase: 'sets=6' },
    { number: '',condition: '',              testCase: 'sets=7' },
    { number: 3, condition: 'reps min=0',    testCase: 'reps=0' },
    { number: '',condition: '',              testCase: 'reps=-1' },
    { number: 4, condition: 'reps max=30',   testCase: 'reps=30' },
    { number: '',condition: '',              testCase: 'reps=31' },
    { number: 5, condition: 'weight min=0',  testCase: 'weight=0.0' },
    { number: '',condition: '',              testCase: 'weight=-0.1' },
    { number: 6, condition: 'weight max=500',testCase: 'weight=500.0' },
    { number: '',condition: '',              testCase: 'weight=500.1' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'sets min (0)',      inputData: '[{sets=0, reps=10, weight=80, exerciseId=ex}]',    expected: 'success: true' },
    { noTc: 2,  bva: 'sets min-1 (-1)',   inputData: '[{sets=-1, ...}]',                                 expected: 'success: false' },
    { noTc: 3,  bva: 'sets max (6)',      inputData: '[{sets=6, ...}]',                                  expected: 'success: true' },
    { noTc: 4,  bva: 'sets max+1 (7)',    inputData: '[{sets=7, ...}]',                                  expected: 'success: false' },
    { noTc: 5,  bva: 'reps min (0)',      inputData: '[{reps=0, ...}]',                                  expected: 'success: true' },
    { noTc: 6,  bva: 'reps min-1 (-1)',   inputData: '[{reps=-1, ...}]',                                 expected: 'success: false' },
    { noTc: 7,  bva: 'reps max (30)',     inputData: '[{reps=30, ...}]',                                 expected: 'success: true' },
    { noTc: 8,  bva: 'reps max+1 (31)',   inputData: '[{reps=31, ...}]',                                 expected: 'success: false' },
    { noTc: 9,  bva: 'weight min (0)',    inputData: '[{weight=0, ...}]',                                expected: 'success: true' },
    { noTc: 10, bva: 'weight min-1',      inputData: '[{weight=-0.1, ...}]',                             expected: 'success: false' },
    { noTc: 11, bva: 'weight max (500)',  inputData: '[{weight=500, ...}]',                              expected: 'success: true' },
    { noTc: 12, bva: 'weight max+1',      inputData: '[{weight=500.1, ...}]',                            expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',       inputData: 'Single valid exercise',    expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',       inputData: 'Three valid exercises',    expected: 'success: true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',       inputData: 'Empty array []',           expected: 'success: false' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: '',       inputData: 'exerciseId=""',            expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: 'BVA-2',  inputData: 'sets=-1',                 expected: 'success: false' },
    { noTc: 6,  fromEc: '',      fromBva: 'BVA-1',  inputData: 'sets=0',                   expected: 'success: true' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-3',  inputData: 'sets=6',                   expected: 'success: true' },
    { noTc: 8,  fromEc: 'EP-6',  fromBva: 'BVA-4',  inputData: 'sets=7',                  expected: 'success: false' },
    { noTc: 9,  fromEc: 'EP-7',  fromBva: 'BVA-6',  inputData: 'reps=-1',                 expected: 'success: false' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-5',  inputData: 'reps=0',                   expected: 'success: true' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-7',  inputData: 'reps=30',                  expected: 'success: true' },
    { noTc: 12, fromEc: 'EP-8',  fromBva: 'BVA-8',  inputData: 'reps=31',                 expected: 'success: false' },
    { noTc: 13, fromEc: 'EP-9',  fromBva: 'BVA-10', inputData: 'weight=-0.1',             expected: 'success: false' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-9',  inputData: 'weight=0',                 expected: 'success: true' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-11', inputData: 'weight=500',               expected: 'success: true' },
    { noTc: 16, fromEc: 'EP-10', fromBva: 'BVA-12', inputData: 'weight=500.1',                     expected: 'success: false' },
    { noTc: 17, fromEc: 'EP-11', fromBva: '',       inputData: 'exerciseId missing',                  expected: 'success: false' },
    { noTc: 18, fromEc: 'EP-12', fromBva: '',       inputData: 'reps missing',                        expected: 'success: false' },
    { noTc: 19, fromEc: 'EP-13', fromBva: '',       inputData: 'sets missing',                        expected: 'success: false' },
    { noTc: 20, fromEc: 'EP-14', fromBva: '',       inputData: 'weight missing',                      expected: 'success: false' },
    { noTc: 21, fromEc: 'EP-15', fromBva: '',       inputData: 'exerciseId whitespace only',          expected: 'success: false' },
    { noTc: 22, fromEc: '',      fromBva: '',       inputData: 'sets=1 (interior min+1)',              expected: 'success: true' },
    { noTc: 23, fromEc: '',      fromBva: '',       inputData: 'sets=5 (interior max-1)',              expected: 'success: true' },
    { noTc: 24, fromEc: '',      fromBva: '',       inputData: 'reps=1 (interior min+1)',              expected: 'success: true' },
    { noTc: 25, fromEc: '',      fromBva: '',       inputData: 'reps=29 (interior max-1)',             expected: 'success: true' },
    { noTc: 26, fromEc: '',      fromBva: '',       inputData: 'weight=0.1 (interior min+small)',      expected: 'success: true' },
    { noTc: 27, fromEc: '',      fromBva: '',       inputData: 'weight=499.9 (interior max-small)',    expected: 'success: true' },
  ],
};

const updateWorkoutSessionSchemaBbt: BbtDescriptor = {
  reqId: 'WSM-06',
  tcCount: 14,
  statement: 'updateWorkoutSessionSchema – validate partial update for a workout session. All fields optional: date (YYYY-MM-DD), duration (0-180 minutes), notes (0-1024 chars). Same constraints when present.',
  data: 'Input: Partial<{ date: string, duration: number, notes: string }>',
  precondition: 'All optional.  date YYYY-MM-DD  |  0 ≤ duration ≤ 180  |  len(notes) ≤ 1024',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'Empty → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1, condition: 'all absent',   validEc: 'empty object', invalidEc: '' },
    { number: 2, condition: 'date',         validEc: 'YYYY-MM-DD',   invalidEc: '' },
    { number: 3, condition: '',             validEc: '',             invalidEc: 'wrong format' },
    { number: 4, condition: 'duration',     validEc: '0 ≤ d ≤ 180', invalidEc: '' },
    { number: 5, condition: '',             validEc: '',             invalidEc: 'd > 180' },
    { number: 6, condition: 'notes',        validEc: 'len ≤ 1024',  invalidEc: '' },
    { number: 7, condition: '',             validEc: '',             invalidEc: 'len > 1024' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: '{} (empty)',                  expected: 'success: true' },
    { noTc: 2, ec: '2', inputData: '{ date: 2024-09-01 }',       expected: 'success: true' },
    { noTc: 3, ec: '3', inputData: '{ date: 01-09-2024 }',       expected: 'success: false – date format error' },
    { noTc: 4, ec: '5', inputData: '{ duration: 181 }',          expected: 'success: false – duration > 180' },
    { noTc: 5, ec: '7', inputData: '{ notes: U×1025 (1025 ch) }',expected: 'success: false – notes too long' },
  ],
  bvaRows: [
    { number: 1, condition: 'duration min=0',   testCase: 'duration=0' },
    { number: 2, condition: 'duration max=180', testCase: 'duration=180' },
    { number: '',condition: '',                  testCase: 'duration=181' },
    { number: 3, condition: 'notes max=1024',   testCase: 'notes=U×1024' },
    { number: '',condition: '',                  testCase: 'notes=U×1025' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'duration min (0)',    inputData: '{ duration=0 }',         expected: 'success: true' },
    { noTc: 2, bva: 'duration max (180)',  inputData: '{ duration=180 }',       expected: 'success: true' },
    { noTc: 3, bva: 'duration max+1 (181)',inputData: '{ duration=181 }',       expected: 'success: false' },
    { noTc: 4, bva: 'notes max (1024)',    inputData: '{ notes=U×1024 }',       expected: 'success: true' },
    { noTc: 5, bva: 'notes max+1 (1025)', inputData: '{ notes=U×1025 }',       expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1',  fromBva: '',      inputData: 'Empty object',        expected: 'success: true' },
    { noTc: 2, fromEc: 'EP-2',  fromBva: '',      inputData: 'Valid date',          expected: 'success: true' },
    { noTc: 3, fromEc: 'EP-3',  fromBva: '',      inputData: 'Date wrong format',   expected: 'success: false' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-1', inputData: 'duration=0',         expected: 'success: true' },
    { noTc: 5, fromEc: '',      fromBva: 'BVA-2', inputData: 'duration=180',       expected: 'success: true' },
    { noTc: 6, fromEc: 'EP-4',  fromBva: 'BVA-3', inputData: 'duration=181',      expected: 'success: false' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-4', inputData: 'notes=1024 chars',           expected: 'success: true' },
    { noTc: 8,  fromEc: 'EP-5',  fromBva: 'BVA-5', inputData: 'notes=1025 chars',          expected: 'success: false' },
    { noTc: 9,  fromEc: '',      fromBva: '',       inputData: 'duration=-1 (below min)',    expected: 'success: false' },
    { noTc: 10, fromEc: '',      fromBva: '',       inputData: 'duration=1 (interior min+1)',expected: 'success: true' },
    { noTc: 11, fromEc: '',      fromBva: '',       inputData: 'duration=179 (interior max-1)', expected: 'success: true' },
    { noTc: 12, fromEc: '',      fromBva: '',       inputData: 'notes="" (empty string)',    expected: 'success: true' },
    { noTc: 13, fromEc: '',      fromBva: '',       inputData: 'notes=valid string',         expected: 'success: true' },
    { noTc: 14, fromEc: '',      fromBva: '',       inputData: 'duration=valid number',      expected: 'success: true' },
  ],
};

const workoutSessionExercisesUpdateSchemaBbt: BbtDescriptor = {
  reqId: 'WSM-07',
  tcCount: 24,
  statement: 'workoutSessionExercisesUpdateSchema – validate the array of exercises when updating a session. Same rules as workoutSessionExercisesSchema plus an optional id field per entry identifying an existing row.',
  data: 'Input: Array<{ id?: string, exerciseId: string, sets: number, reps: number, weight: number }>',
  precondition: 'array.length ≥ 1  |  id optional string  |  same numeric constraints as create schema',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Empty array or any violation → success: false.',
  ecRows: [
    { number: 1, condition: 'id field',     validEc: 'absent (new entry)',    invalidEc: '' },
    { number: 2, condition: '',             validEc: 'present (existing row)', invalidEc: '' },
    { number: 3, condition: 'array length', validEc: 'length ≥ 1',           invalidEc: '' },
    { number: 4, condition: '',             validEc: '',                      invalidEc: 'empty array' },
    { number: 5, condition: 'sets range',   validEc: '0 ≤ sets ≤ 6',         invalidEc: '' },
    { number: 6, condition: '',             validEc: '',                      invalidEc: 'sets > 6' },
    { number: 7, condition: 'reps range',   validEc: '0 ≤ reps ≤ 30',        invalidEc: '' },
    { number: 8, condition: '',             validEc: '',                      invalidEc: 'reps > 30' },
    { number: 9, condition: 'weight range', validEc: '0 ≤ w ≤ 500',          invalidEc: '' },
    { number: 10,condition: '',             validEc: '',                      invalidEc: 'weight > 500' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5,7,9', inputData: '[{exerciseId=ex, sets=3, reps=10, weight=80}] (no id)', expected: 'success: true' },
    { noTc: 2, ec: '2',         inputData: '[{id=uuid, exerciseId=ex, sets=3, reps=10, weight=80}]', expected: 'success: true' },
    { noTc: 3, ec: '4',         inputData: '[] (empty array)',                                      expected: 'success: false – At least one exercise required' },
    { noTc: 4, ec: '6',         inputData: '[{...sets=7...}]',                                     expected: 'success: false – Sets ≤ 6' },
    { noTc: 5, ec: '8',         inputData: '[{...reps=31...}]',                                    expected: 'success: false – Reps ≤ 30' },
    { noTc: 6, ec: '10',        inputData: '[{...weight=500.1...}]',                               expected: 'success: false – Weight ≤ 500.0' },
  ],
  bvaRows: [
    { number: 1, condition: 'sets max=6',    testCase: 'sets=6' },
    { number: '',condition: '',              testCase: 'sets=7' },
    { number: 2, condition: 'reps max=30',   testCase: 'reps=30' },
    { number: '',condition: '',              testCase: 'reps=31' },
    { number: 3, condition: 'weight max=500',testCase: 'weight=500' },
    { number: '',condition: '',              testCase: 'weight=500.1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'sets max (6)',    inputData: '[{sets=6, ...}]',       expected: 'success: true' },
    { noTc: 2, bva: 'sets max+1 (7)', inputData: '[{sets=7, ...}]',       expected: 'success: false' },
    { noTc: 3, bva: 'reps max (30)',   inputData: '[{reps=30, ...}]',      expected: 'success: true' },
    { noTc: 4, bva: 'reps max+1 (31)',inputData: '[{reps=31, ...}]',      expected: 'success: false' },
    { noTc: 5, bva: 'weight max (500)',inputData: '[{weight=500, ...}]',   expected: 'success: true' },
    { noTc: 6, bva: 'weight max+1',   inputData: '[{weight=500.1, ...}]', expected: 'success: false' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'New exercise (no id)',         expected: 'success: true' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'Existing exercise (with id)',  expected: 'success: true' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',      inputData: 'Empty array',                 expected: 'success: false' },
    { noTc: 4,  fromEc: 'EP-4', fromBva: 'BVA-2', inputData: 'sets=7',                             expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-5', fromBva: 'BVA-4', inputData: 'reps=31',                            expected: 'success: false' },
    { noTc: 6,  fromEc: 'EP-6', fromBva: 'BVA-6', inputData: 'weight=500.1',                       expected: 'success: false' },
    { noTc: 7,  fromEc: '',     fromBva: 'BVA-1', inputData: 'sets=6 (max)',                        expected: 'success: true' },
    { noTc: 8,  fromEc: '',     fromBva: '',       inputData: 'sets below min (sets=-1)',             expected: 'success: false' },
    { noTc: 9,  fromEc: '',     fromBva: '',       inputData: 'sets at min (sets=0)',                expected: 'success: true' },
    { noTc: 10, fromEc: '',     fromBva: 'BVA-3', inputData: 'reps=30 (max)',                       expected: 'success: true' },
    { noTc: 11, fromEc: '',     fromBva: '',       inputData: 'reps below min (reps=-1)',            expected: 'success: false' },
    { noTc: 12, fromEc: '',     fromBva: '',       inputData: 'reps at min (reps=0)',               expected: 'success: true' },
    { noTc: 13, fromEc: '',     fromBva: 'BVA-5', inputData: 'weight=500 (max)',                    expected: 'success: true' },
    { noTc: 14, fromEc: '',     fromBva: '',       inputData: 'weight below min (weight=-1)',        expected: 'success: false' },
    { noTc: 15, fromEc: '',     fromBva: '',       inputData: 'weight at min (weight=0)',            expected: 'success: true' },
    { noTc: 16, fromEc: '',     fromBva: '',       inputData: 'exerciseId="" (empty)',               expected: 'success: false' },
    { noTc: 17, fromEc: '',     fromBva: '',       inputData: 'exerciseId=whitespace only',          expected: 'success: false' },
    { noTc: 18, fromEc: '',     fromBva: '',       inputData: 'multiple exercises mixed (new+old)',  expected: 'success: true' },
    { noTc: 19, fromEc: '',     fromBva: '',       inputData: 'sets=1 (interior)',                   expected: 'success: true' },
    { noTc: 20, fromEc: '',     fromBva: '',       inputData: 'sets=5 (interior)',                   expected: 'success: true' },
    { noTc: 21, fromEc: '',     fromBva: '',       inputData: 'reps=1 (interior)',                   expected: 'success: true' },
    { noTc: 22, fromEc: '',     fromBva: '',       inputData: 'reps=29 (interior)',                  expected: 'success: true' },
    { noTc: 23, fromEc: '',     fromBva: '',       inputData: 'weight=0.1 (interior)',               expected: 'success: true' },
    { noTc: 24, fromEc: '',     fromBva: '',       inputData: 'weight=499.9 (interior)',             expected: 'success: true' },
  ],
};

const memberProgressReportSchemaBbt: BbtDescriptor = {
  reqId: 'RPG-01',
  tcCount: 21,
  statement: 'memberProgressReportSchema – validate progress report query. Fields: memberId (non-empty), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD).',
  data: 'Input: { memberId: string, startDate: string, endDate: string }',
  precondition: 'len(memberId) ≥ 1  |  startDate matches YYYY-MM-DD  |  endDate matches YYYY-MM-DD',
  results: 'Output: { success: true, data }  OR  { success: false, error }',
  postcondition: 'All valid → success: true.  Any violation → success: false.',
  ecRows: [
    { number: 1,  condition: 'memberId',    validEc: 'len ≥ 1',    invalidEc: '' },
    { number: 2,  condition: '',            validEc: '',           invalidEc: 'empty string' },
    { number: 3,  condition: '',            validEc: '',           invalidEc: 'field absent' },
    { number: 4,  condition: 'startDate',   validEc: 'YYYY-MM-DD', invalidEc: '' },
    { number: 5,  condition: '',            validEc: '',           invalidEc: 'DD/MM/YYYY' },
    { number: 6,  condition: '',            validEc: '',           invalidEc: 'DD-MM-YYYY' },
    { number: 7,  condition: '',            validEc: '',           invalidEc: 'field absent' },
    { number: 8,  condition: 'endDate',     validEc: 'YYYY-MM-DD', invalidEc: '' },
    { number: 9,  condition: '',            validEc: '',           invalidEc: 'MM/DD/YYYY' },
    { number: 10, condition: '',            validEc: '',           invalidEc: 'field absent' },
    { number: 11, condition: '',            validEc: '',           invalidEc: 'non-date string' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,4,8',  inputData: 'memberId=member-abc, startDate=2024-01-01, endDate=2024-12-31', expected: 'success: true' },
    { noTc: 2,  ec: '1',      inputData: 'startDate=endDate=2024-06-15 (single day range)',               expected: 'success: true' },
    { noTc: 3,  ec: '2',      inputData: 'memberId="" (empty)',                                           expected: 'success: false – Member ID is required' },
    { noTc: 4,  ec: '3',      inputData: 'memberId absent',                                               expected: 'success: false' },
    { noTc: 5,  ec: '5',      inputData: 'startDate=01/01/2024 (DD/MM/YYYY)',                            expected: 'success: false – Start date must be in YYYY-MM-DD format' },
    { noTc: 6,  ec: '6',      inputData: 'startDate=01-01-2024 (DD-MM-YYYY)',                            expected: 'success: false – Start date must be in YYYY-MM-DD format' },
    { noTc: 7,  ec: '7',      inputData: 'startDate absent',                                             expected: 'success: false' },
    { noTc: 8,  ec: '9',      inputData: 'endDate=12/31/2024 (MM/DD/YYYY)',                              expected: 'success: false – End date must be in YYYY-MM-DD format' },
    { noTc: 9,  ec: '10',     inputData: 'endDate absent',                                               expected: 'success: false' },
    { noTc: 10, ec: '11',     inputData: 'endDate=invalid-date',                                         expected: 'success: false – End date must be in YYYY-MM-DD format' },
  ],
  bvaRows: [
    { number: 1, condition: 'date precision', testCase: 'startDate=2024-01-01 (valid YYYY-MM-DD)' },
    { number: '',condition: '',               testCase: 'startDate=2024-1-1 (missing leading zeros)' },
    { number: '',condition: '',               testCase: 'startDate=20240101 (no separators)' },
    { number: '',condition: '',               testCase: 'startDate=2024-01-01T00:00:00 (extra chars)' },
    { number: 2, condition: 'endDate precision', testCase: 'endDate=2024-12-31 (valid YYYY-MM-DD)' },
    { number: '',condition: '',                  testCase: 'endDate=2024-12-31T00:00:00 (extra chars)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'startDate valid',             inputData: 'startDate=2024-01-01, other valid',           expected: 'success: true' },
    { noTc: 2, bva: 'startDate no leading zeros',  inputData: 'startDate=2024-1-1, other valid',             expected: 'success: false – format error' },
    { noTc: 3, bva: 'startDate no separators',     inputData: 'startDate=20240101, other valid',             expected: 'success: false – format error' },
    { noTc: 4, bva: 'startDate extra chars',       inputData: 'startDate=2024-01-01T00:00:00, other valid',  expected: 'success: false – format error' },
    { noTc: 5, bva: 'endDate valid',               inputData: 'endDate=2024-12-31, other valid',             expected: 'success: true' },
    { noTc: 6, bva: 'endDate extra chars',         inputData: 'endDate=2024-12-31T00:00:00, other valid',    expected: 'success: false – format error' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: 'BVA-1,BVA-5', inputData: 'All valid',                              expected: 'success: true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',             inputData: 'Single day range',                       expected: 'success: true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',             inputData: 'memberId empty',                         expected: 'success: false – Member ID is required' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: '',             inputData: 'memberId absent',                        expected: 'success: false' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: '',             inputData: 'startDate=01/01/2024',                   expected: 'success: false – format error' },
    { noTc: 6,  fromEc: 'EP-6',  fromBva: '',             inputData: 'startDate=01-01-2024',                   expected: 'success: false – format error' },
    { noTc: 7,  fromEc: 'EP-7',  fromBva: '',             inputData: 'startDate absent',                       expected: 'success: false' },
    { noTc: 8,  fromEc: 'EP-8',  fromBva: '',             inputData: 'endDate=12/31/2024',                     expected: 'success: false – format error' },
    { noTc: 9,  fromEc: 'EP-9',  fromBva: '',             inputData: 'endDate absent',                         expected: 'success: false' },
    { noTc: 10, fromEc: 'EP-10', fromBva: '',             inputData: 'endDate=invalid-date',                   expected: 'success: false – format error' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-2',        inputData: 'startDate=2024-1-1',                     expected: 'success: false – format error' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-3',        inputData: 'startDate=20240101',                     expected: 'success: false – format error' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-4',        inputData: 'startDate=2024-01-01T00:00:00',          expected: 'success: false – format error' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-6',        inputData: 'endDate=2024-12-31T00:00:00',            expected: 'success: false – format error' },
    { noTc: 15, fromEc: '',      fromBva: '',             inputData: 'memberId=whitespace only',                expected: 'success: false' },
    { noTc: 16, fromEc: '',      fromBva: '',             inputData: 'startDate=leap day (2024-02-29)',         expected: 'success: true (regex match, no calendar check)' },
    { noTc: 17, fromEc: '',      fromBva: '',             inputData: 'startDate=month 13 (2024-13-01)',         expected: 'success: true (regex match, no calendar check)' },
    { noTc: 18, fromEc: '',      fromBva: '',             inputData: 'endDate without leading zeros (2024-1-1)', expected: 'success: false' },
    { noTc: 19, fromEc: '',      fromBva: '',             inputData: 'endDate=leap day (2024-02-29)',            expected: 'success: true' },
    { noTc: 20, fromEc: '',      fromBva: '',             inputData: 'startDate after endDate (still valid format)', expected: 'success: true (no date-order check)' },
    { noTc: 21, fromEc: '',      fromBva: '',             inputData: 'memberId=1 char (min length)',             expected: 'success: true' },
  ],
};

const isoDateRegexBbt: BbtDescriptor = {
  reqId: 'UTILS-ISO',
  tcCount: 17,
  statement: 'isoDateRegex – pattern /^\\d{4}-\\d{2}-\\d{2}$/ used throughout the application to validate ISO date strings (YYYY-MM-DD format). Referenced by dateOfBirth, membershipStart, date, startDate, endDate fields.',
  data: 'Input: string s',
  precondition: 'None – regex.test(s) is a pure predicate',
  results: 'Output: boolean – true if s matches YYYY-MM-DD, false otherwise',
  postcondition: 'Exactly 4 digits, dash, exactly 2 digits, dash, exactly 2 digits, nothing more.',
  ecRows: [
    { number: 1,  condition: 'format YYYY-MM-DD',  validEc: 'matches regex',               invalidEc: '' },
    { number: 2,  condition: '',                   validEc: '',                            invalidEc: 'slash separator' },
    { number: 3,  condition: '',                   validEc: '',                            invalidEc: 'dot separator' },
    { number: 4,  condition: '',                   validEc: '',                            invalidEc: 'DD-MM-YYYY order' },
    { number: 5,  condition: '',                   validEc: '',                            invalidEc: 'single digit month' },
    { number: 6,  condition: '',                   validEc: '',                            invalidEc: 'single digit day' },
    { number: 7,  condition: '',                   validEc: '',                            invalidEc: 'extra chars appended' },
    { number: 8,  condition: '',                   validEc: '',                            invalidEc: 'no separators' },
    { number: 9,  condition: '',                   validEc: '',                            invalidEc: 'empty string' },
    { number: 10, condition: 'year digit count',   validEc: '',                            invalidEc: '3-digit year (too short)' },
    { number: 11, condition: '',                   validEc: '',                            invalidEc: '5-digit year (too long)' },
    { number: 12, condition: 'digit range MM/DD',  validEc: '00-99 accepted (no calendar check)', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1',  inputData: '"2024-01-01"',         expected: 'true' },
    { noTc: 2,  ec: '2',  inputData: '"2024/01/01"',         expected: 'false' },
    { noTc: 3,  ec: '3',  inputData: '"2024.01.01"',         expected: 'false' },
    { noTc: 4,  ec: '4',  inputData: '"01-01-2024"',         expected: 'false' },
    { noTc: 5,  ec: '5',  inputData: '"2024-1-01"',          expected: 'false' },
    { noTc: 6,  ec: '6',  inputData: '"2024-01-1"',          expected: 'false' },
    { noTc: 7,  ec: '7',  inputData: '"2024-01-01T00:00:00"',expected: 'false' },
    { noTc: 8,  ec: '8',  inputData: '"20240101"',           expected: 'false' },
    { noTc: 9,  ec: '9',  inputData: '""',                   expected: 'false' },
    { noTc: 10, ec: '10', inputData: '"202-01-01" (3-digit year)', expected: 'false' },
    { noTc: 11, ec: '11', inputData: '"20240-01-01" (5-digit year)', expected: 'false' },
    { noTc: 12, ec: '12', inputData: '"2024-00-15" (month=00)', expected: 'true' },
  ],
  bvaRows: [
    { number: 1, condition: 'digit counts',    testCase: '"1990-12-31" (all 2-digit parts filled)' },
    { number: '', condition: '',               testCase: '"2024-1-1" (1-digit month and day)' },
    { number: 2, condition: 'MM/DD max digit', testCase: '"2024-99-01" (month=99, max two-digit value)' },
    { number: '', condition: '',               testCase: '"2024-01-99" (day=99, max two-digit value)' },
    { number: 3, condition: 'all-zero date',   testCase: '"0000-00-00" (all-zero YYYY-MM-DD)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'all two-digit parts',   inputData: '"1990-12-31"',   expected: 'true' },
    { noTc: 2, bva: 'one-digit parts',        inputData: '"2024-1-1"',     expected: 'false' },
    { noTc: 3, bva: 'month=99 (max)',         inputData: '"2024-99-01"',   expected: 'true' },
    { noTc: 4, bva: 'day=99 (max)',           inputData: '"2024-01-99"',   expected: 'true' },
    { noTc: 5, bva: 'all-zero date',          inputData: '"0000-00-00"',   expected: 'true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: 'BVA-1', inputData: '"2024-01-01"',           expected: 'true' },
    { noTc: 2,  fromEc: 'EP-1',  fromBva: 'BVA-1', inputData: '"1990-12-31"',           expected: 'true' },
    { noTc: 3,  fromEc: 'EP-2',  fromBva: '',       inputData: '"2024/01/01"',           expected: 'false' },
    { noTc: 4,  fromEc: 'EP-3',  fromBva: '',       inputData: '"2024.01.01"',           expected: 'false' },
    { noTc: 5,  fromEc: 'EP-4',  fromBva: '',       inputData: '"01-01-2024"',           expected: 'false' },
    { noTc: 6,  fromEc: 'EP-5',  fromBva: 'BVA-2', inputData: '"2024-1-01"',            expected: 'false' },
    { noTc: 7,  fromEc: 'EP-6',  fromBva: 'BVA-2', inputData: '"2024-01-1"',            expected: 'false' },
    { noTc: 8,  fromEc: 'EP-7',  fromBva: '',       inputData: '"2024-01-01T00:00:00"', expected: 'false' },
    { noTc: 9,  fromEc: 'EP-8',  fromBva: '',       inputData: '"20240101"',             expected: 'false' },
    { noTc: 10, fromEc: 'EP-9',  fromBva: '',       inputData: '""',                     expected: 'false' },
    { noTc: 11, fromEc: 'EP-10', fromBva: '',       inputData: '"202-01-01" (3-digit year)',  expected: 'false' },
    { noTc: 12, fromEc: 'EP-11', fromBva: '',       inputData: '"20240-01-01" (5-digit year)', expected: 'false' },
    { noTc: 13, fromEc: 'EP-12', fromBva: 'BVA-4', inputData: '"2024-01-99" (day=99)',   expected: 'true' },
    { noTc: 14, fromEc: 'EP-12', fromBva: 'BVA-3', inputData: '"2024-99-01" (month=99)', expected: 'true' },
    { noTc: 15, fromEc: 'EP-12', fromBva: '',       inputData: '"2024-00-15" (month=00)', expected: 'true' },
    { noTc: 16, fromEc: 'EP-12', fromBva: '',       inputData: '"2024-01-00" (day=00)',   expected: 'true' },
    { noTc: 17, fromEc: 'EP-12', fromBva: 'BVA-5', inputData: '"0000-00-00" (all zeros)', expected: 'true' },
  ],
};

const e164PhoneRegexBbt: BbtDescriptor = {
  reqId: 'UTILS-E164',
  tcCount: 16,
  statement: 'e164PhoneRegex – pattern /^\\+?[1-9]\\d{1,14}$/ validates simplified E.164 phone numbers. Used by phone field in createMemberSchema, updateMemberSchema, createAdminSchema (MEM-01).',
  data: 'Input: string s',
  precondition: 'None – pure predicate',
  results: 'Output: boolean – true if s matches E.164 pattern',
  postcondition: 'Optional +, first digit 1-9, then 1-14 more digits, no spaces or punctuation.',
  ecRows: [
    { number: 1, condition: 'valid E.164',        validEc: 'matches /^\\+?[1-9]\\d{1,14}$/', invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                invalidEc: 'starts with 0' },
    { number: 3, condition: '',                   validEc: '',                                invalidEc: '+0 prefix' },
    { number: 4, condition: '',                   validEc: '',                                invalidEc: 'spaces in number' },
    { number: 5, condition: '',                   validEc: '',                                invalidEc: 'dashes in number' },
    { number: 6, condition: '',                   validEc: '',                                invalidEc: 'only + sign' },
    { number: 7, condition: '',                   validEc: '',                                invalidEc: 'empty string' },
    { number: 8, condition: '',                   validEc: '',                                invalidEc: 'contains parentheses' },
    { number: 9, condition: '',                   validEc: '',                                invalidEc: 'alphabetic chars only' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1', inputData: '"+40712345678"',         expected: 'true' },
    { noTc: 2,  ec: '1', inputData: '"40712345678" (no +)',   expected: 'true' },
    { noTc: 3,  ec: '2', inputData: '"0712345678"',           expected: 'false' },
    { noTc: 4,  ec: '3', inputData: '"+0712345678"',          expected: 'false' },
    { noTc: 5,  ec: '4', inputData: '"+44 20 1234 5678"',     expected: 'false' },
    { noTc: 6,  ec: '5', inputData: '"+1-800-555-5555"',      expected: 'false' },
    { noTc: 7,  ec: '6', inputData: '"+"',                    expected: 'false' },
    { noTc: 8,  ec: '7', inputData: '""',                     expected: 'false' },
    { noTc: 9,  ec: '8', inputData: '"+1(800)5551234"',       expected: 'false' },
    { noTc: 10, ec: '9', inputData: '"ABCDEFG"',              expected: 'false' },
  ],
  bvaRows: [
    { number: 1, condition: '\\d{1,14} min=1',  testCase: '"12" (1 extra digit – min length)' },
    { number: '', condition: '',                 testCase: '"1" (0 extra digits – below min)' },
    { number: 2, condition: '\\d{1,14} max=14', testCase: '"+123456789012345" (14 extra digits – max)' },
    { number: '', condition: '',                 testCase: '"+1234567890123456" (15 extra digits – above max)' },
    { number: 3, condition: 'interior range',    testCase: '"+123" (3 digits – inside valid range)' },
    { number: '', condition: '',                 testCase: '"+12345678901234" (14 digits – inside valid range)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'extra digits min (1)',    inputData: '"12" (2 total digits)',             expected: 'true' },
    { noTc: 2, bva: 'below min (0 extra)',     inputData: '"1" (1 total digit)',               expected: 'false' },
    { noTc: 3, bva: 'extra digits max (14)',   inputData: '"+123456789012345" (15 digits)',   expected: 'true' },
    { noTc: 4, bva: 'above max (15 extra)',    inputData: '"+1234567890123456" (16 digits)',  expected: 'false' },
    { noTc: 5, bva: 'interior 3 digits',       inputData: '"+123"',                           expected: 'true' },
    { noTc: 6, bva: 'interior 14 digits',      inputData: '"+12345678901234"',                expected: 'true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',      inputData: '"+40712345678"',          expected: 'true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',      inputData: '"40712345678" (no +)',    expected: 'true' },
    { noTc: 3,  fromEc: '',      fromBva: 'BVA-1', inputData: '"12" (min length)',       expected: 'true' },
    { noTc: 4,  fromEc: '',      fromBva: 'BVA-2', inputData: '"1" (below min)',         expected: 'false' },
    { noTc: 5,  fromEc: '',      fromBva: 'BVA-3', inputData: '"+123456789012345" (max)', expected: 'true' },
    { noTc: 6,  fromEc: '',      fromBva: 'BVA-4', inputData: '"+1234567890123456" (above max)', expected: 'false' },
    { noTc: 7,  fromEc: 'EP-3',  fromBva: '',      inputData: '"0712345678"',            expected: 'false' },
    { noTc: 8,  fromEc: 'EP-4',  fromBva: '',      inputData: '"+0712345678"',           expected: 'false' },
    { noTc: 9,  fromEc: 'EP-5',  fromBva: '',      inputData: '"+44 20 1234 5678"',     expected: 'false' },
    { noTc: 10, fromEc: 'EP-6',  fromBva: '',      inputData: '"+1-800-555-5555"',      expected: 'false' },
    { noTc: 11, fromEc: 'EP-7',  fromBva: '',      inputData: '"+"',                    expected: 'false' },
    { noTc: 12, fromEc: 'EP-8',  fromBva: '',      inputData: '""',                     expected: 'false' },
    { noTc: 13, fromEc: 'EP-9',  fromBva: '',      inputData: '"+1(800)5551234"',       expected: 'false' },
    { noTc: 14, fromEc: 'EP-10', fromBva: '',      inputData: '"ABCDEFG"',              expected: 'false' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-5', inputData: '"+123" (3 digits)',      expected: 'true' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-6', inputData: '"+12345678901234" (14 digits)', expected: 'true' },
  ],
};

const emailRegexBbt: BbtDescriptor = {
  reqId: 'UTILS-EMAIL',
  tcCount: 17,
  statement: 'emailRegex – pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ validates simplified RFC 5321 email addresses. Used by email field in all user-related schemas (AUTH-01, MEM-01).',
  data: 'Input: string s',
  precondition: 'None – pure predicate',
  results: 'Output: boolean – true if s matches the simplified email regex',
  postcondition: 'local@domain.tld pattern with no spaces; @ present; dot in domain part.',
  ecRows: [
    { number: 1,  condition: 'valid email',             validEc: 'user@domain.tld',           invalidEc: '' },
    { number: 2,  condition: '',                        validEc: 'user+tag@domain.com',       invalidEc: '' },
    { number: 3,  condition: '',                        validEc: 'numeric local part',        invalidEc: '' },
    { number: 4,  condition: '',                        validEc: 'special chars in local',    invalidEc: '' },
    { number: 5,  condition: 'no @ symbol',             validEc: '',                          invalidEc: 'invalidemail.com' },
    { number: 6,  condition: 'empty local part',        validEc: '',                          invalidEc: '@domain.com' },
    { number: 7,  condition: 'no domain after @',       validEc: '',                          invalidEc: 'user@' },
    { number: 8,  condition: 'no dot in domain',        validEc: '',                          invalidEc: 'user@domain' },
    { number: 9,  condition: 'space in local',          validEc: '',                          invalidEc: 'user name@domain.com' },
    { number: 10, condition: 'space after @',           validEc: '',                          invalidEc: 'user@ domain.com' },
    { number: 11, condition: 'empty string',            validEc: '',                          invalidEc: '""' },
    { number: 12, condition: 'multiple @ symbols',      validEc: '',                          invalidEc: 'a@b@example.com' },
    { number: 13, condition: 'empty domain before dot', validEc: '',                          invalidEc: 'user@.com' },
    { number: 14, condition: 'trailing dot in domain',  validEc: '',                          invalidEc: 'user@domain.' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1',  inputData: '"user@example.com"',           expected: 'true' },
    { noTc: 2,  ec: '1',  inputData: '"user@mail.example.com"',      expected: 'true' },
    { noTc: 3,  ec: '2',  inputData: '"user+tag@domain.com"',        expected: 'true' },
    { noTc: 4,  ec: '3',  inputData: '"12345@domain.com"',           expected: 'true' },
    { noTc: 5,  ec: '4',  inputData: '"user.name+tag@example.org"',  expected: 'true' },
    { noTc: 6,  ec: '5',  inputData: '"invalidemail.com"',           expected: 'false' },
    { noTc: 7,  ec: '6',  inputData: '"@domain.com"',                expected: 'false' },
    { noTc: 8,  ec: '7',  inputData: '"user@"',                      expected: 'false' },
    { noTc: 9,  ec: '8',  inputData: '"user@domain"',                expected: 'false' },
    { noTc: 10, ec: '9',  inputData: '"user name@domain.com"',       expected: 'false' },
    { noTc: 11, ec: '10', inputData: '"user@ domain.com"',           expected: 'false' },
    { noTc: 12, ec: '11', inputData: '""',                           expected: 'false' },
    { noTc: 13, ec: '12', inputData: '"a@b@example.com"',            expected: 'false' },
    { noTc: 14, ec: '13', inputData: '"user@.com"',                  expected: 'false' },
    { noTc: 15, ec: '14', inputData: '"user@domain."',               expected: 'false' },
  ],
  bvaRows: [
    { number: 1, condition: 'minimal valid email', testCase: '"a@b.c" (1 char local, 1 char domain, 1 char tld)' },
    { number: '', condition: '',                   testCase: '"@b.c" (empty local part – invalid)' },
    { number: 2, condition: 'dot position',        testCase: '"first.last@domain.com" (dot before @)' },
    { number: '', condition: '',                   testCase: '"admin@gymtrackerpro.com" (standard subdomain-less)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'minimal valid', inputData: '"a@b.c"',                   expected: 'true' },
    { noTc: 2, bva: 'empty local',   inputData: '"@b.c"',                    expected: 'false' },
    { noTc: 3, bva: 'dot before @',  inputData: '"first.last@domain.com"',  expected: 'true' },
    { noTc: 4, bva: 'admin email',   inputData: '"admin@gymtrackerpro.com"', expected: 'true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',      inputData: '"user@example.com"',       expected: 'true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',      inputData: '"user@mail.example.com"',  expected: 'true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',      inputData: '"user+tag@domain.com"',    expected: 'true' },
    { noTc: 4,  fromEc: 'EP-1',  fromBva: 'BVA-4', inputData: '"admin@gymtrackerpro.com"',expected: 'true' },
    { noTc: 5,  fromEc: 'EP-6',  fromBva: 'BVA-2', inputData: '"@domain.com"',            expected: 'false' },
    { noTc: 6,  fromEc: 'EP-7',  fromBva: '',      inputData: '"user@"',                  expected: 'false' },
    { noTc: 7,  fromEc: 'EP-8',  fromBva: '',      inputData: '"user@domain"',             expected: 'false' },
    { noTc: 8,  fromEc: 'EP-9',  fromBva: '',      inputData: '"user name@domain.com"',   expected: 'false' },
    { noTc: 9,  fromEc: 'EP-10', fromBva: '',      inputData: '"user@ domain.com"',       expected: 'false' },
    { noTc: 10, fromEc: 'EP-11', fromBva: '',      inputData: '""',                        expected: 'false' },
    { noTc: 11, fromEc: 'EP-5',  fromBva: '',      inputData: '"invalidemail.com"',        expected: 'false' },
    { noTc: 12, fromEc: 'EP-12', fromBva: '',      inputData: '"a@b@example.com"',         expected: 'false' },
    { noTc: 13, fromEc: 'EP-13', fromBva: '',      inputData: '"user@.com"',               expected: 'false' },
    { noTc: 14, fromEc: 'EP-14', fromBva: '',      inputData: '"user@domain."',            expected: 'false' },
    { noTc: 15, fromEc: 'EP-4',  fromBva: '',      inputData: '"12345@domain.com"',        expected: 'true' },
    { noTc: 16, fromEc: 'EP-5',  fromBva: '',      inputData: '"user.name+tag@example.org"', expected: 'true' },
    { noTc: 17, fromEc: 'EP-1',  fromBva: 'BVA-3', inputData: '"first.last@domain.com"', expected: 'true' },
  ],
};

(async () => {
  console.log('Generating BBT form Excel files…\n');

  await writeBbt(createMemberSchemaBbt,                path.join(BASE, 'user-schema', 'createMemberSchema-bbt-form.xlsx'));
  await writeBbt(createMemberWithTempPasswordSchemaBbt, path.join(BASE, 'user-schema', 'createMemberWithTempPasswordSchema-bbt-form.xlsx'));
  await writeBbt(loginUserSchemaBbt,                   path.join(BASE, 'user-schema', 'loginUserSchema-bbt-form.xlsx'));
  await writeBbt(createAdminSchemaBbt,                 path.join(BASE, 'user-schema', 'createAdminSchema-bbt-form.xlsx'));
  await writeBbt(updateMemberSchemaBbt,                path.join(BASE, 'user-schema', 'updateMemberSchema-bbt-form.xlsx'));
  await writeBbt(updateAdminSchemaBbt,                 path.join(BASE, 'user-schema', 'updateAdminSchema-bbt-form.xlsx'));
  await writeBbt(createExerciseSchemaBbt,              path.join(BASE, 'exercise-schema', 'createExerciseSchema-bbt-form.xlsx'));
  await writeBbt(updateExerciseSchemaBbt,              path.join(BASE, 'exercise-schema', 'updateExerciseSchema-bbt-form.xlsx'));
  await writeBbt(createWorkoutSessionSchemaBbt,        path.join(BASE, 'workout-session-schema', 'createWorkoutSessionSchema-bbt-form.xlsx'));
  await writeBbt(workoutSessionExercisesSchemaBbt,     path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesSchema-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionSchemaBbt,        path.join(BASE, 'workout-session-schema', 'updateWorkoutSessionSchema-bbt-form.xlsx'));
  await writeBbt(workoutSessionExercisesUpdateSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesUpdateSchema-bbt-form.xlsx'));
  await writeBbt(memberProgressReportSchemaBbt,        path.join(BASE, 'report-schema', 'memberProgressReportSchema-bbt-form.xlsx'));
  await writeBbt(isoDateRegexBbt,                      path.join(BASE, 'utils', 'isoDateRegex-bbt-form.xlsx'));
  await writeBbt(e164PhoneRegexBbt,                    path.join(BASE, 'utils', 'e164PhoneRegex-bbt-form.xlsx'));
  await writeBbt(emailRegexBbt,                        path.join(BASE, 'utils', 'emailRegex-bbt-form.xlsx'));

  console.log('\nDone.');
})();
