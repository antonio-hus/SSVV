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
  tcsFailed?: number; bugsFound?: number; bugsFixed?: string;
  retested?: string; retestRun?: number | string; retestPassed?: number | string; retestFailed?: number | string;
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
    const row = ws.addRow([r.noTc, r.ec, r.inputData, r.expected, 'Passed']);
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
    const row = ws.addRow([r.noTc, r.bva, r.inputData, r.expected, 'Passed']);
    styleData(row.getCell(1)); styleData(row.getCell(2)); styleData(row.getCell(3)); styleData(row.getCell(4)); stylePassed(row.getCell(5)); row.height = 30;
  }
}

function addFinalSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
  const ws = wb.addWorksheet('Req_EC_BVA_all_TC');
  ws.columns = [{ width: 8 }, { width: 12 }, { width: 14 }, { width: 75 }, { width: 55 }, { width: 25 }];
  const hdr = ws.addRow(['No TC', 'TC from EC', 'TC from BVA', 'Input Data', 'Expected', 'Actual Result']); hdr.eachCell(c => styleHeader(c)); hdr.height = 20;
  for (const r of d.finalTcRows) {
    const row = ws.addRow([r.noTc, r.fromEc, r.fromBva, r.inputData, r.expected, 'Passed']);
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

const REPO_BASE = path.join(ROOT, 'lib', 'repository', '__tests__', 'bbt');

// ── user-repository ────────────────────────────────────────────────────────────
const createMemberBbt: BbtDescriptor = {
    reqId: 'REPO-01',
    tcCount: 3,
    statement: 'UserRepository.createMember(data) – Creates a new user and member record atomically. Returns the created MemberWithUser on success. Throws ConflictError if the email is already registered. Throws TransactionError if the database write fails.',
    data: 'Input: data: CreateMemberInput',
    precondition: 'Database is accessible. The provided email may or may not already be registered.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with result.id: MEMBER_ID and result.user defined. On failure: ConflictError or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Email uniqueness',  validEc: 'Unique email → MemberWithUser returned', invalidEc: '' },
        { number: 2, condition: 'Email uniqueness',  validEc: '',                                        invalidEc: 'Duplicate email → ConflictError' },
        { number: 3, condition: 'Database write',    validEc: 'Write succeeds → MemberWithUser returned', invalidEc: '' },
        { number: 4, condition: 'Database write',    validEc: '',                                          invalidEc: 'Write fails → TransactionError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1, EC-3', inputData: 'data: CREATE_MEMBER_INPUT, email unique, DB succeeds', expected: 'MemberWithUser returned with result.id: MEMBER_ID, result.user defined' },
        { noTc: 2, ec: 'EC-2',       inputData: 'data: CREATE_MEMBER_INPUT, email already registered',  expected: 'throws ConflictError' },
        { noTc: 3, ec: 'EC-4',       inputData: 'data: CREATE_MEMBER_INPUT, DB throws Error("DB connection failed")', expected: 'throws TransactionError' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '', inputData: 'data: CREATE_MEMBER_INPUT, email unique, DB succeeds', expected: 'MemberWithUser returned with result.id: MEMBER_ID, result.user defined' },
        { noTc: 2, fromEc: 'EC-2',       fromBva: '', inputData: 'data: CREATE_MEMBER_INPUT, email already registered',  expected: 'throws ConflictError' },
        { noTc: 3, fromEc: 'EC-4',       fromBva: '', inputData: 'data: CREATE_MEMBER_INPUT, DB throws Error("DB connection failed")', expected: 'throws TransactionError' },
    ],
};

const createAdminBbt: BbtDescriptor = {
    reqId: 'REPO-02',
    tcCount: 3,
    statement: 'UserRepository.createAdmin(data) – Creates a new user and admin record atomically. Returns the created AdminWithUser on success. Throws ConflictError if the email is already registered. Throws TransactionError if the database write fails.',
    data: 'Input: data: CreateAdminInput',
    precondition: 'Database is accessible. The provided email may or may not already be registered.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: AdminWithUser returned with result.id: ADMIN_ID and result.user defined. On failure: ConflictError or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Email uniqueness', validEc: 'Unique email → AdminWithUser returned', invalidEc: '' },
        { number: 2, condition: 'Email uniqueness', validEc: '',                                       invalidEc: 'Duplicate email → ConflictError' },
        { number: 3, condition: 'Database write',   validEc: 'Write succeeds → AdminWithUser returned', invalidEc: '' },
        { number: 4, condition: 'Database write',   validEc: '',                                         invalidEc: 'Write fails → TransactionError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1, EC-3', inputData: 'data: CREATE_ADMIN_INPUT, email unique, DB succeeds', expected: 'AdminWithUser returned with result.id: ADMIN_ID, result.user defined' },
        { noTc: 2, ec: 'EC-2',       inputData: 'data: CREATE_ADMIN_INPUT, email already registered',  expected: 'throws ConflictError' },
        { noTc: 3, ec: 'EC-4',       inputData: 'data: CREATE_ADMIN_INPUT, DB throws Error("DB connection failed")', expected: 'throws TransactionError' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '', inputData: 'data: CREATE_ADMIN_INPUT, email unique, DB succeeds', expected: 'AdminWithUser returned with result.id: ADMIN_ID, result.user defined' },
        { noTc: 2, fromEc: 'EC-2',       fromBva: '', inputData: 'data: CREATE_ADMIN_INPUT, email already registered',  expected: 'throws ConflictError' },
        { noTc: 3, fromEc: 'EC-4',       fromBva: '', inputData: 'data: CREATE_ADMIN_INPUT, DB throws Error("DB connection failed")', expected: 'throws TransactionError' },
    ],
};

const findByIdBbt: BbtDescriptor = {
    reqId: 'REPO-03',
    tcCount: 5,
    statement: 'UserRepository.findById(id) – Retrieves a user by ID. Returns the UserWithProfile on success. Throws NotFoundError if no user exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. A user with the given ID may or may not exist.',
    results: 'Output: Promise<UserWithProfile>',
    postcondition: 'On success: UserWithProfile returned with result.id: USER_ID, result.email: MOCK_USER.email. On failure: NotFoundError thrown.',
    ecRows: [
        { number: 1, condition: 'User existence', validEc: 'Existing ID → UserWithProfile returned', invalidEc: '' },
        { number: 2, condition: 'User existence', validEc: '',                                        invalidEc: 'Non-existent ID → NotFoundError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: USER_ID',     expected: 'UserWithProfile returned with result.id: USER_ID, result.email: MOCK_USER.email' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)',    expected: 'UserWithProfile returned with result.id: "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: USER_ID',        expected: 'UserWithProfile returned with result.id: USER_ID, result.email: MOCK_USER.email' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found)',    expected: 'UserWithProfile returned with result.id: "a"' },
    ],
};

const findMemberByIdBbt: BbtDescriptor = {
    reqId: 'REPO-04',
    tcCount: 5,
    statement: 'UserRepository.findMemberById(id) – Retrieves a member by ID. Returns the MemberWithUser on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. A member with the given ID may or may not exist.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with result.id: MEMBER_ID, result.user defined. On failure: NotFoundError thrown.',
    ecRows: [
        { number: 1, condition: 'Member existence', validEc: 'Existing ID → MemberWithUser returned', invalidEc: '' },
        { number: 2, condition: 'Member existence', validEc: '',                                       invalidEc: 'Non-existent ID → NotFoundError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: MEMBER_ID',      expected: 'MemberWithUser returned with result.id: MEMBER_ID, result.user defined' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)',    expected: 'MemberWithUser returned with result.id: "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: MEMBER_ID',      expected: 'MemberWithUser returned with result.id: MEMBER_ID, result.user defined' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found)',    expected: 'MemberWithUser returned with result.id: "a"' },
    ],
};

const findAdminByIdBbt: BbtDescriptor = {
    reqId: 'REPO-05',
    tcCount: 5,
    statement: 'UserRepository.findAdminById(id) – Retrieves an admin by ID. Returns the AdminWithUser on success. Throws NotFoundError if no admin exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. An admin with the given ID may or may not exist.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: AdminWithUser returned with result.id: ADMIN_ID, result.user defined. On failure: NotFoundError thrown.',
    ecRows: [
        { number: 1, condition: 'Admin existence', validEc: 'Existing ID → AdminWithUser returned', invalidEc: '' },
        { number: 2, condition: 'Admin existence', validEc: '',                                      invalidEc: 'Non-existent ID → NotFoundError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: ADMIN_ID',       expected: 'AdminWithUser returned with result.id: ADMIN_ID, result.user defined' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)',    expected: 'AdminWithUser returned with result.id: "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: ADMIN_ID',       expected: 'AdminWithUser returned with result.id: ADMIN_ID, result.user defined' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: ""',             expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found)',    expected: 'AdminWithUser returned with result.id: "a"' },
    ],
};

const findByEmailBbt: BbtDescriptor = {
    reqId: 'REPO-06',
    tcCount: 4,
    statement: 'UserRepository.findByEmail(email) – Retrieves a user by email address. Returns UserWithProfile if found, null otherwise. Never throws.',
    data: 'Input: email: string',
    precondition: 'Database is accessible. The provided email may or may not be registered.',
    results: 'Output: Promise<UserWithProfile | null>',
    postcondition: 'On match: UserWithProfile returned with result.email: "john@example.com". On no match: null returned.',
    ecRows: [
        { number: 1, condition: 'Email registration', validEc: 'Registered email → UserWithProfile returned', invalidEc: '' },
        { number: 2, condition: 'Email registration', validEc: '',                                             invalidEc: 'Unregistered email → null returned' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'email: "john@example.com" (registered)',   expected: 'UserWithProfile returned with result.email: "john@example.com", result not null' },
        { noTc: 2, ec: 'EC-2', inputData: 'email: "notfound@example.com" (not found)', expected: 'null returned' },
    ],
    bvaRows: [
        { number: 1, condition: 'Email length', testCase: '0 chars (empty, not found), 1 char "a" (not found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'email: ""',  expected: 'null returned' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'email: "a"', expected: 'null returned' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'email: "john@example.com" (registered)',    expected: 'UserWithProfile returned with result.email: "john@example.com", result not null' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'email: "notfound@example.com" (not found)', expected: 'null returned' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'email: ""',  expected: 'null returned' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'email: "a"', expected: 'null returned' },
    ],
};
const findMembersBbt: BbtDescriptor = {
    reqId: 'REPO-07',
    tcCount: 14,
    statement: 'UserRepository.findMembers(options?) – Returns a paginated list of members. Supports optional search filtering by name/email, pagination via page and pageSize, and results ordered by full name ascending.',
    data: 'Input: options?: MemberListOptions { search?: string, page?: number, pageSize?: number }',
    precondition: 'Database is accessible. The member table may be empty or contain one or more records.',
    results: 'Output: Promise<PageResult<MemberWithUser>>',
    postcondition: 'On success: PageResult returned with items matching the filter, total reflecting the full count, and items ordered by user.fullName ascending.',
    ecRows: [
        { number: 1, condition: 'Options',          validEc: 'No options → default page returned, items.length: 1, total: 1',     invalidEc: '' },
        { number: 2, condition: 'Search filter',    validEc: 'search: "John" → matching items returned, items.length: 1, total: 1', invalidEc: '' },
        { number: 3, condition: 'Result ordering',  validEc: 'Multiple members → items ordered by user.fullName ASC',              invalidEc: '' },
        { number: 4, condition: 'Data availability', validEc: '',                                                                   invalidEc: 'Empty database → items.length: 0, total: 0' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options',                                          expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 2, ec: 'EC-2', inputData: 'options: { search: "John" }',                         expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 3, ec: 'EC-3', inputData: 'no options, members: [memberAlice, MOCK_MEMBER_WITH_USER]', expected: 'PageResult with items[0].user.fullName: "Alice Brown", items[1].user.fullName: "John Doe"' },
        { noTc: 4, ec: 'EC-4', inputData: 'no options, DB empty',                                expected: 'PageResult with items.length: 0, total: 0' },
    ],
    bvaRows: [
        { number: 1, condition: 'Search value',  testCase: 'search: undefined, search: "" (empty), search: "a" (one char)' },
        { number: 2, condition: 'Page number',   testCase: 'page: undefined, page: 0 (first), page: 1 (first), page: 2 (second)' },
        { number: 3, condition: 'Page size',     testCase: 'pageSize: undefined (default), pageSize: 0 (no items), pageSize: 1 (one item)' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1 (undef)', inputData: 'options: { search: undefined }',  expected: 'PageResult with items.length: 1' },
        { noTc: 2,  bva: 'BVA-1 (n=0)',   inputData: 'options: { search: "" }',          expected: 'PageResult with items.length: 1' },
        { noTc: 3,  bva: 'BVA-1 (n=1)',   inputData: 'options: { search: "a" }',         expected: 'PageResult with items.length: 1' },
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'options: { page: undefined }',     expected: 'PageResult with items.length: 1' },
        { noTc: 5,  bva: 'BVA-2 (p=0)',   inputData: 'options: { page: 0, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 6,  bva: 'BVA-2 (p=1)',   inputData: 'options: { page: 1, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 7,  bva: 'BVA-2 (p=2)',   inputData: 'options: { page: 2, pageSize: 10 }', expected: 'PageResult with items.length: 0, total: 15' },
        { noTc: 8,  bva: 'BVA-3 (undef)', inputData: 'options: { pageSize: undefined }', expected: 'PageResult with items.length: 1' },
        { noTc: 9,  bva: 'BVA-3 (s=0)',   inputData: 'options: { pageSize: 0 }',          expected: 'PageResult with items.length: 0, total: 5' },
        { noTc: 10, bva: 'BVA-3 (s=1)',   inputData: 'options: { pageSize: 1 }',          expected: 'PageResult with items.length: 1, total: 5' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options',                                           expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'options: { search: "John" }',                          expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'no options, members: [memberAlice, MOCK_MEMBER_WITH_USER]', expected: 'PageResult with items[0].user.fullName: "Alice Brown", items[1].user.fullName: "John Doe"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'no options, DB empty',                                 expected: 'PageResult with items.length: 0, total: 0' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 5,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: undefined }',   expected: 'PageResult with items.length: 1' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "" }',           expected: 'PageResult with items.length: 1' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "a" }',          expected: 'PageResult with items.length: 1' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: undefined }',      expected: 'PageResult with items.length: 1' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 0, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 1, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 2, pageSize: 10 }', expected: 'PageResult with items.length: 0, total: 15' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: undefined }',  expected: 'PageResult with items.length: 1' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: 0 }',           expected: 'PageResult with items.length: 0, total: 5' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: 1 }',           expected: 'PageResult with items.length: 1, total: 5' },
    ],
};

const findAdminsBbt: BbtDescriptor = {
    reqId: 'REPO-08',
    tcCount: 14,
    statement: 'UserRepository.findAdmins(options?) – Returns a paginated list of admins. Supports optional search filtering by name/email, pagination via page and pageSize, and results ordered by full name ascending.',
    data: 'Input: options?: AdminListOptions { search?: string, page?: number, pageSize?: number }',
    precondition: 'Database is accessible. The admin table may be empty or contain one or more records.',
    results: 'Output: Promise<PageResult<AdminWithUser>>',
    postcondition: 'On success: PageResult returned with items matching the filter, total reflecting the full count, and items ordered by user.fullName ascending.',
    ecRows: [
        { number: 1, condition: 'Options',           validEc: 'No options → default page returned, items.length: 1, total: 1',      invalidEc: '' },
        { number: 2, condition: 'Search filter',     validEc: 'search: "Admin" → matching items returned, items.length: 1, total: 1', invalidEc: '' },
        { number: 3, condition: 'Result ordering',   validEc: 'Multiple admins → items ordered by user.fullName ASC',                invalidEc: '' },
        { number: 4, condition: 'Data availability', validEc: '',                                                                     invalidEc: 'Empty database → items.length: 0, total: 0' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options',                                         expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 2, ec: 'EC-2', inputData: 'options: { search: "Admin" }',                       expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 3, ec: 'EC-3', inputData: 'no options, admins: [adminAlice, MOCK_ADMIN_WITH_USER]', expected: 'PageResult with items[0].user.fullName: "Alice Brown", items[1].user.fullName: "John Doe"' },
        { noTc: 4, ec: 'EC-4', inputData: 'no options, DB empty',                               expected: 'PageResult with items.length: 0, total: 0' },
    ],
    bvaRows: [
        { number: 1, condition: 'Search value', testCase: 'search: undefined, search: "" (empty), search: "a" (one char)' },
        { number: 2, condition: 'Page number',  testCase: 'page: undefined, page: 0 (first), page: 1 (first), page: 2 (second)' },
        { number: 3, condition: 'Page size',    testCase: 'pageSize: undefined (default), pageSize: 0 (no items), pageSize: 1 (one item)' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1 (undef)', inputData: 'options: { search: undefined }',   expected: 'PageResult with items.length: 1' },
        { noTc: 2,  bva: 'BVA-1 (n=0)',   inputData: 'options: { search: "" }',           expected: 'PageResult with items.length: 1' },
        { noTc: 3,  bva: 'BVA-1 (n=1)',   inputData: 'options: { search: "a" }',          expected: 'PageResult with items.length: 1' },
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'options: { page: undefined }',      expected: 'PageResult with items.length: 1' },
        { noTc: 5,  bva: 'BVA-2 (p=0)',   inputData: 'options: { page: 0, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 6,  bva: 'BVA-2 (p=1)',   inputData: 'options: { page: 1, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 7,  bva: 'BVA-2 (p=2)',   inputData: 'options: { page: 2, pageSize: 10 }', expected: 'PageResult with items.length: 0, total: 15' },
        { noTc: 8,  bva: 'BVA-3 (undef)', inputData: 'options: { pageSize: undefined }',  expected: 'PageResult with items.length: 1' },
        { noTc: 9,  bva: 'BVA-3 (s=0)',   inputData: 'options: { pageSize: 0 }',           expected: 'PageResult with items.length: 0, total: 5' },
        { noTc: 10, bva: 'BVA-3 (s=1)',   inputData: 'options: { pageSize: 1 }',           expected: 'PageResult with items.length: 1, total: 5' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options',                                          expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'options: { search: "Admin" }',                        expected: 'PageResult with items.length: 1, total: 1' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'no options, admins: [adminAlice, MOCK_ADMIN_WITH_USER]', expected: 'PageResult with items[0].user.fullName: "Alice Brown", items[1].user.fullName: "John Doe"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'no options, DB empty',                                expected: 'PageResult with items.length: 0, total: 0' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 5,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: undefined }',    expected: 'PageResult with items.length: 1' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "" }',            expected: 'PageResult with items.length: 1' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "a" }',           expected: 'PageResult with items.length: 1' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: undefined }',       expected: 'PageResult with items.length: 1' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 0, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 1, pageSize: 10 }', expected: 'PageResult with items.length: 1' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { page: 2, pageSize: 10 }', expected: 'PageResult with items.length: 0, total: 15' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: undefined }',   expected: 'PageResult with items.length: 1' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: 0 }',            expected: 'PageResult with items.length: 0, total: 5' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { pageSize: 1 }',            expected: 'PageResult with items.length: 1, total: 5' },
    ],
};

const updateMemberBbt: BbtDescriptor = {
    reqId: 'REPO-09',
    tcCount: 27,
    statement: 'UserRepository.updateMember(id, data) – Updates a member and their user record. Returns the updated MemberWithUser on success. Throws NotFoundError if the member does not exist. Throws ConflictError if the new email is already taken by another user. Throws TransactionError if the database write fails.',
    data: 'Input: id: string, data: UpdateMemberInput { fullName?, email?, phone?, dateOfBirth?, password?, membershipStart? }',
    precondition: 'Database is accessible. A member with the given ID may or may not exist. Any new email may or may not already be registered to another user.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with updated fields (result.user.fullName, result.id). On failure: NotFoundError, ConflictError, or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Member existence',  validEc: 'Existing ID + valid data → MemberWithUser returned with result.user.fullName: "Updated Name"', invalidEc: '' },
        { number: 2, condition: 'Member existence',  validEc: '',                                                                                               invalidEc: 'Non-existent ID → NotFoundError' },
        { number: 3, condition: 'Email uniqueness',  validEc: 'New email not taken → MemberWithUser returned',                                                 invalidEc: '' },
        { number: 4, condition: 'Email uniqueness',  validEc: '',                                                                                               invalidEc: 'New email taken by another user → ConflictError' },
        { number: 5, condition: 'Email identity',    validEc: 'Same email as current user → MemberWithUser returned with result.id: MEMBER_ID',                invalidEc: '' },
        { number: 6, condition: 'Password change',   validEc: 'New password provided → MemberWithUser returned with result.id: MEMBER_ID',                     invalidEc: '' },
        { number: 7, condition: 'Database write',    validEc: '',                                                                                               invalidEc: 'Write fails → TransactionError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: MEMBER_ID, data: { fullName: "Updated Name" }',      expected: 'MemberWithUser returned with result.user.fullName: "Updated Name"' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID, data: { fullName: "New Name" }',     expected: 'throws NotFoundError' },
        { noTc: 3, ec: 'EC-4', inputData: 'id: MEMBER_ID, data: { email: "taken@example.com" }',    expected: 'throws ConflictError' },
        { noTc: 4, ec: 'EC-5', inputData: 'id: MEMBER_ID, data: { email: MOCK_USER.email }',        expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 5, ec: 'EC-6', inputData: 'id: MEMBER_ID, data: { password: "NewPass1!" }',         expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 6, ec: 'EC-7', inputData: 'id: MEMBER_ID, data: { fullName: "New Name" }, DB fails', expected: 'throws TransactionError' },
    ],
    bvaRows: [
        { number: 1, condition: 'Member ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
        { number: 2, condition: 'email field',      testCase: 'email: undefined, email: "" (empty), email: "a" (one char)' },
        { number: 3, condition: 'fullName field',   testCase: 'fullName: undefined, fullName: "" (empty), fullName: "A" (one char)' },
        { number: 4, condition: 'phone field',      testCase: 'phone: undefined, phone: "" (empty), phone: "a" (one char)' },
        { number: 5, condition: 'dateOfBirth field', testCase: 'dateOfBirth: undefined, dateOfBirth: "" (empty), dateOfBirth: "a" (one char)' },
        { number: 6, condition: 'password field',   testCase: 'password: undefined, password: "" (empty), password: "a" (one char)' },
        { number: 7, condition: 'membershipStart field', testCase: 'membershipStart: undefined, membershipStart: "" (empty), membershipStart: "a" (one char)' },
    ],
    bvaTcRows: [
        // ── ID length ────────────────────────────────────────────────────────
        { noTc: 1,  bva: 'BVA-1 (n=0)', inputData: 'id: "", data: { fullName: "New Name" }',           expected: 'throws NotFoundError' },
        { noTc: 2,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match), data: { fullName: "New Name" }', expected: 'throws NotFoundError' },
        { noTc: 3,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found), data: { fullName: "New Name" }',  expected: 'MemberWithUser returned with result.id: "a"' },
        // ── email ────────────────────────────────────────────────────────────
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'id: MEMBER_ID, data: { email: undefined }',      expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 5,  bva: 'BVA-2 (n=0)',   inputData: 'id: MEMBER_ID, data: { email: "" }',             expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 6,  bva: 'BVA-2 (n=1)',   inputData: 'id: MEMBER_ID, data: { email: "a" }',            expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        // ── fullName ─────────────────────────────────────────────────────────
        { noTc: 7,  bva: 'BVA-3 (undef)', inputData: 'id: MEMBER_ID, data: { fullName: undefined }',   expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 8,  bva: 'BVA-3 (n=0)',   inputData: 'id: MEMBER_ID, data: { fullName: "" }',          expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 9,  bva: 'BVA-3 (n=1)',   inputData: 'id: MEMBER_ID, data: { fullName: "A" }',         expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        // ── phone ────────────────────────────────────────────────────────────
        { noTc: 10, bva: 'BVA-4 (undef)', inputData: 'id: MEMBER_ID, data: { phone: undefined }',      expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 11, bva: 'BVA-4 (n=0)',   inputData: 'id: MEMBER_ID, data: { phone: "" }',             expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 12, bva: 'BVA-4 (n=1)',   inputData: 'id: MEMBER_ID, data: { phone: "a" }',            expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        // ── dateOfBirth ──────────────────────────────────────────────────────
        { noTc: 13, bva: 'BVA-5 (undef)', inputData: 'id: MEMBER_ID, data: { dateOfBirth: undefined }', expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 14, bva: 'BVA-5 (n=0)',   inputData: 'id: MEMBER_ID, data: { dateOfBirth: "" }',       expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 15, bva: 'BVA-5 (n=1)',   inputData: 'id: MEMBER_ID, data: { dateOfBirth: "a" }',      expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        // ── password ─────────────────────────────────────────────────────────
        { noTc: 16, bva: 'BVA-6 (undef)', inputData: 'id: MEMBER_ID, data: { password: undefined }',   expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 17, bva: 'BVA-6 (n=0)',   inputData: 'id: MEMBER_ID, data: { password: "" }',          expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 18, bva: 'BVA-6 (n=1)',   inputData: 'id: MEMBER_ID, data: { password: "a" }',         expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        // ── membershipStart ──────────────────────────────────────────────────
        { noTc: 19, bva: 'BVA-7 (undef)', inputData: 'id: MEMBER_ID, data: { membershipStart: undefined }', expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 20, bva: 'BVA-7 (n=0)',   inputData: 'id: MEMBER_ID, data: { membershipStart: "" }',   expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 21, bva: 'BVA-7 (n=1)',   inputData: 'id: MEMBER_ID, data: { membershipStart: "a" }',  expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'id: MEMBER_ID, data: { fullName: "Updated Name" }',       expected: 'MemberWithUser returned with result.user.fullName: "Updated Name"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'id: NONEXISTENT_ID, data: { fullName: "New Name" }',      expected: 'throws NotFoundError' },
        { noTc: 3,  fromEc: 'EC-4', fromBva: '', inputData: 'id: MEMBER_ID, data: { email: "taken@example.com" }',     expected: 'throws ConflictError' },
        { noTc: 4,  fromEc: 'EC-5', fromBva: '', inputData: 'id: MEMBER_ID, data: { email: MOCK_USER.email }',         expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 5,  fromEc: 'EC-6', fromBva: '', inputData: 'id: MEMBER_ID, data: { password: "NewPass1!" }',          expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 6,  fromEc: 'EC-7', fromBva: '', inputData: 'id: MEMBER_ID, data: { fullName: "New Name" }, DB fails', expected: 'throws TransactionError' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "", data: { fullName: "New Name" }',              expected: 'throws NotFoundError' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match), data: { fullName: "New Name" }',  expected: 'throws NotFoundError' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found), data: { fullName: "New Name" }',     expected: 'MemberWithUser returned with result.id: "a"' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2', inputData: 'id: MEMBER_ID, data: { email: undefined }',           expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'id: MEMBER_ID, data: { email: "" }',                  expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'id: MEMBER_ID, data: { email: "a" }',                 expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-3', inputData: 'id: MEMBER_ID, data: { fullName: undefined }',        expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'id: MEMBER_ID, data: { fullName: "" }',               expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: 'id: MEMBER_ID, data: { fullName: "A" }',              expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-4', inputData: 'id: MEMBER_ID, data: { phone: undefined }',           expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-4', inputData: 'id: MEMBER_ID, data: { phone: "" }',                  expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-4', inputData: 'id: MEMBER_ID, data: { phone: "a" }',                 expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-5', inputData: 'id: MEMBER_ID, data: { dateOfBirth: undefined }',     expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-5', inputData: 'id: MEMBER_ID, data: { dateOfBirth: "" }',            expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-5', inputData: 'id: MEMBER_ID, data: { dateOfBirth: "a" }',           expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-6', inputData: 'id: MEMBER_ID, data: { password: undefined }',        expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-6', inputData: 'id: MEMBER_ID, data: { password: "" }',               expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-6', inputData: 'id: MEMBER_ID, data: { password: "a" }',              expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-7', inputData: 'id: MEMBER_ID, data: { membershipStart: undefined }', expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-7', inputData: 'id: MEMBER_ID, data: { membershipStart: "" }',        expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-7', inputData: 'id: MEMBER_ID, data: { membershipStart: "a" }',       expected: 'MemberWithUser returned with result.id: MEMBER_ID' },
    ],
};

const setMemberActiveBbt: BbtDescriptor = {
    reqId: 'REPO-10',
    tcCount: 6,
    statement: 'UserRepository.setMemberActive(id, isActive) – Sets the isActive flag on an existing member. Returns the updated MemberWithUser on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: id: string, isActive: boolean',
    precondition: 'Database is accessible. A member with the given ID may or may not exist.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with result.isActive matching the input value. On failure: NotFoundError thrown.',
    ecRows: [
        { number: 1, condition: 'Member existence', validEc: 'Existing ID, isActive: false → MemberWithUser returned with result.isActive: false', invalidEc: '' },
        { number: 2, condition: 'Member existence', validEc: 'Existing ID, isActive: true → MemberWithUser returned with result.isActive: true',   invalidEc: '' },
        { number: 3, condition: 'Member existence', validEc: '',                                                                                    invalidEc: 'Non-existent ID → NotFoundError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: MEMBER_ID, isActive: false', expected: 'MemberWithUser returned with result.isActive: false' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: MEMBER_ID, isActive: true',  expected: 'MemberWithUser returned with result.isActive: true' },
        { noTc: 3, ec: 'EC-3', inputData: 'id: NONEXISTENT_ID, isActive: true', expected: 'throws NotFoundError' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "", isActive: true',             expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match), isActive: true', expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found), isActive: true',    expected: 'MemberWithUser returned with result.id: "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: MEMBER_ID, isActive: false',        expected: 'MemberWithUser returned with result.isActive: false' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: MEMBER_ID, isActive: true',         expected: 'MemberWithUser returned with result.isActive: true' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'id: NONEXISTENT_ID, isActive: true',    expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "", isActive: true',               expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match), isActive: true',   expected: 'throws NotFoundError' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found), isActive: true',      expected: 'MemberWithUser returned with result.id: "a"' },
    ],
};
const updateAdminBbt: BbtDescriptor = {
    reqId: 'REPO-11',
    tcCount: 24,
    statement: 'UserRepository.updateAdmin(id, data) – Updates an admin and their user record. Returns the updated AdminWithUser on success. Throws NotFoundError if the admin does not exist. Throws ConflictError if the new email is already taken by another user. Throws TransactionError if the database write fails.',
    data: 'Input: id: string, data: UpdateAdminInput { fullName?, email?, phone?, dateOfBirth?, password? }',
    precondition: 'Database is accessible. An admin with the given ID may or may not exist. Any new email may or may not already be registered to another user.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: AdminWithUser returned with updated fields (result.user.fullName, result.id). On failure: NotFoundError, ConflictError, or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Admin existence',  validEc: 'Existing ID + valid data → AdminWithUser returned with result.user.fullName: "Updated Admin"', invalidEc: '' },
        { number: 2, condition: 'Admin existence',  validEc: '',                                                                                              invalidEc: 'Non-existent ID → NotFoundError' },
        { number: 3, condition: 'Email uniqueness', validEc: 'New email not taken → AdminWithUser returned',                                                  invalidEc: '' },
        { number: 4, condition: 'Email uniqueness', validEc: '',                                                                                              invalidEc: 'New email taken by another user → ConflictError' },
        { number: 5, condition: 'Email identity',   validEc: 'Same email as current user → AdminWithUser returned with result.id: ADMIN_ID',                 invalidEc: '' },
        { number: 6, condition: 'Password change',  validEc: 'New password provided → AdminWithUser returned with result.id: ADMIN_ID',                      invalidEc: '' },
        { number: 7, condition: 'Database write',   validEc: '',                                                                                              invalidEc: 'Write fails → TransactionError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: ADMIN_ID, data: { fullName: "Updated Admin" }',         expected: 'AdminWithUser returned with result.user.fullName: "Updated Admin"' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID, data: { fullName: "Name" }',            expected: 'throws NotFoundError' },
        { noTc: 3, ec: 'EC-4', inputData: 'id: ADMIN_ID, data: { email: "taken@example.com" }',        expected: 'throws ConflictError' },
        { noTc: 4, ec: 'EC-5', inputData: 'id: ADMIN_ID, data: { email: MOCK_ADMIN_WITH_USER.user.email }', expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 5, ec: 'EC-6', inputData: 'id: ADMIN_ID, data: { password: "NewAdminPass1!" }',        expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 6, ec: 'EC-7', inputData: 'id: ADMIN_ID, data: { fullName: "New Name" }, DB fails',    expected: 'throws TransactionError' },
    ],
    bvaRows: [
        { number: 1, condition: 'Admin ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
        { number: 2, condition: 'email field',     testCase: 'email: undefined, email: "" (empty), email: "a" (one char)' },
        { number: 3, condition: 'fullName field',  testCase: 'fullName: undefined, fullName: "" (empty), fullName: "A" (one char)' },
        { number: 4, condition: 'phone field',     testCase: 'phone: undefined, phone: "" (empty), phone: "a" (one char)' },
        { number: 5, condition: 'dateOfBirth field', testCase: 'dateOfBirth: undefined, dateOfBirth: "" (empty), dateOfBirth: "a" (one char)' },
        { number: 6, condition: 'password field',  testCase: 'password: undefined, password: "" (empty), password: "a" (one char)' },
    ],
    bvaTcRows: [
        // ── ID length ────────────────────────────────────────────────────────
        { noTc: 1,  bva: 'BVA-1 (n=0)', inputData: 'id: "", data: { fullName: "New Name" }',              expected: 'throws NotFoundError' },
        { noTc: 2,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match), data: { fullName: "New Name" }',  expected: 'throws NotFoundError' },
        { noTc: 3,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found), data: { fullName: "New Name" }',     expected: 'AdminWithUser returned with result.id: "a"' },
        // ── email ────────────────────────────────────────────────────────────
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'id: ADMIN_ID, data: { email: undefined }',          expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 5,  bva: 'BVA-2 (n=0)',   inputData: 'id: ADMIN_ID, data: { email: "" }',                 expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 6,  bva: 'BVA-2 (n=1)',   inputData: 'id: ADMIN_ID, data: { email: "a" }',                expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        // ── fullName ─────────────────────────────────────────────────────────
        { noTc: 7,  bva: 'BVA-3 (undef)', inputData: 'id: ADMIN_ID, data: { fullName: undefined }',       expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 8,  bva: 'BVA-3 (n=0)',   inputData: 'id: ADMIN_ID, data: { fullName: "" }',              expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 9,  bva: 'BVA-3 (n=1)',   inputData: 'id: ADMIN_ID, data: { fullName: "A" }',             expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        // ── phone ────────────────────────────────────────────────────────────
        { noTc: 10, bva: 'BVA-4 (undef)', inputData: 'id: ADMIN_ID, data: { phone: undefined }',          expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 11, bva: 'BVA-4 (n=0)',   inputData: 'id: ADMIN_ID, data: { phone: "" }',                 expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 12, bva: 'BVA-4 (n=1)',   inputData: 'id: ADMIN_ID, data: { phone: "a" }',                expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        // ── dateOfBirth ──────────────────────────────────────────────────────
        { noTc: 13, bva: 'BVA-5 (undef)', inputData: 'id: ADMIN_ID, data: { dateOfBirth: undefined }',    expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 14, bva: 'BVA-5 (n=0)',   inputData: 'id: ADMIN_ID, data: { dateOfBirth: "" }',           expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 15, bva: 'BVA-5 (n=1)',   inputData: 'id: ADMIN_ID, data: { dateOfBirth: "a" }',          expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        // ── password ─────────────────────────────────────────────────────────
        { noTc: 16, bva: 'BVA-6 (undef)', inputData: 'id: ADMIN_ID, data: { password: undefined }',       expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 17, bva: 'BVA-6 (n=0)',   inputData: 'id: ADMIN_ID, data: { password: "" }',              expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 18, bva: 'BVA-6 (n=1)',   inputData: 'id: ADMIN_ID, data: { password: "a" }',             expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'id: ADMIN_ID, data: { fullName: "Updated Admin" }',          expected: 'AdminWithUser returned with result.user.fullName: "Updated Admin"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'id: NONEXISTENT_ID, data: { fullName: "Name" }',             expected: 'throws NotFoundError' },
        { noTc: 3,  fromEc: 'EC-4', fromBva: '', inputData: 'id: ADMIN_ID, data: { email: "taken@example.com" }',         expected: 'throws ConflictError' },
        { noTc: 4,  fromEc: 'EC-5', fromBva: '', inputData: 'id: ADMIN_ID, data: { email: MOCK_ADMIN_WITH_USER.user.email }', expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 5,  fromEc: 'EC-6', fromBva: '', inputData: 'id: ADMIN_ID, data: { password: "NewAdminPass1!" }',         expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 6,  fromEc: 'EC-7', fromBva: '', inputData: 'id: ADMIN_ID, data: { fullName: "New Name" }, DB fails',     expected: 'throws TransactionError' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "", data: { fullName: "New Name" }',              expected: 'throws NotFoundError' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match), data: { fullName: "New Name" }',  expected: 'throws NotFoundError' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found), data: { fullName: "New Name" }',     expected: 'AdminWithUser returned with result.id: "a"' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2', inputData: 'id: ADMIN_ID, data: { email: undefined }',            expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'id: ADMIN_ID, data: { email: "" }',                   expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'id: ADMIN_ID, data: { email: "a" }',                  expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-3', inputData: 'id: ADMIN_ID, data: { fullName: undefined }',         expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'id: ADMIN_ID, data: { fullName: "" }',                expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: 'id: ADMIN_ID, data: { fullName: "A" }',               expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-4', inputData: 'id: ADMIN_ID, data: { phone: undefined }',            expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-4', inputData: 'id: ADMIN_ID, data: { phone: "" }',                   expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-4', inputData: 'id: ADMIN_ID, data: { phone: "a" }',                  expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-5', inputData: 'id: ADMIN_ID, data: { dateOfBirth: undefined }',      expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-5', inputData: 'id: ADMIN_ID, data: { dateOfBirth: "" }',             expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-5', inputData: 'id: ADMIN_ID, data: { dateOfBirth: "a" }',            expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-6', inputData: 'id: ADMIN_ID, data: { password: undefined }',         expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-6', inputData: 'id: ADMIN_ID, data: { password: "" }',                expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-6', inputData: 'id: ADMIN_ID, data: { password: "a" }',               expected: 'AdminWithUser returned with result.id: ADMIN_ID' },
    ],
};

const deleteUserBbt: BbtDescriptor = {
    reqId: 'REPO-12',
    tcCount: 6,
    statement: 'UserRepository.delete(id) – Deletes the user record and their associated profile (member or admin). Checks both tables to locate the record. Returns void on success. Throws NotFoundError if neither a member nor an admin exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. The ID may belong to a member, an admin, or neither.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves to undefined (void). On failure: NotFoundError thrown.',
    ecRows: [
        { number: 1, condition: 'User type', validEc: 'Existing member ID → resolves void',  invalidEc: '' },
        { number: 2, condition: 'User type', validEc: 'Existing admin ID → resolves void',   invalidEc: '' },
        { number: 3, condition: 'User type', validEc: '',                                     invalidEc: 'Non-existent ID (no member, no admin) → NotFoundError' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: MEMBER_ID (member exists, admin: null)',       expected: 'resolves void' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: ADMIN_ID (member: null, admin exists)',        expected: 'resolves void' },
        { noTc: 3, ec: 'EC-3', inputData: 'id: NONEXISTENT_ID (member: null, admin: null)',   expected: 'throws NotFoundError' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found as member)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (member: null, admin: null)',                      expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match in member or admin)',                   expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (member found: { ...MOCK_MEMBER_WITH_USER, id: "a" })', expected: 'resolves void' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: MEMBER_ID (member exists, admin: null)',     expected: 'resolves void' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: ADMIN_ID (member: null, admin exists)',      expected: 'resolves void' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'id: NONEXISTENT_ID (member: null, admin: null)', expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "" (member: null, admin: null)',            expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no match in member or admin)',         expected: 'throws NotFoundError' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (member found: { ...MOCK_MEMBER_WITH_USER, id: "a" })', expected: 'resolves void' },
    ],
};

// ── exercise-repository ────────────────────────────────────────────────────────

const exerciseCreateBbt: BbtDescriptor = {
    reqId: 'REPO-13',
    tcCount: 2,
    statement: 'ExerciseRepository.create(data) – Creates a new exercise record. Returns the created Exercise on success. Throws ConflictError if an exercise with the same name already exists.',
    data: 'Input: data: CreateExerciseInput { name: string, ... }',
    precondition: 'Database is accessible. An exercise with the given name may or may not already exist.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with result matching expectedReturn and result.name matching input name. On failure: ConflictError thrown with message "Exercise name already in use".',
    ecRows: [
        { number: 1, condition: 'Name uniqueness', validEc: 'Name not yet registered → Exercise returned with result.name: VALID_CREATE_INPUT.name', invalidEc: '' },
        { number: 2, condition: 'Name uniqueness', validEc: '', invalidEc: 'Name already registered → ConflictError("Exercise name already in use")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'data: VALID_CREATE_INPUT (name not found in DB)',  expected: 'Exercise returned with result equal to MOCK_EXERCISE and result.name: VALID_CREATE_INPUT.name' },
        { noTc: 2, ec: 'EC-2', inputData: 'data: VALID_CREATE_INPUT (name already in DB)',    expected: 'throws ConflictError("Exercise name already in use")' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'data: VALID_CREATE_INPUT (name not found in DB)', expected: 'Exercise returned with result equal to MOCK_EXERCISE and result.name: VALID_CREATE_INPUT.name' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'data: VALID_CREATE_INPUT (name already in DB)',   expected: 'throws ConflictError("Exercise name already in use")' },
    ],
};

const exerciseFindByIdBbt: BbtDescriptor = {
    reqId: 'REPO-14',
    tcCount: 5,
    statement: 'ExerciseRepository.findById(id) – Retrieves a single exercise by ID. Returns the matching Exercise on success. Throws NotFoundError with message "Exercise not found" if no exercise exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. An exercise with the given ID may or may not exist.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with result equal to MOCK_EXERCISE and result.id matching input id. On failure: NotFoundError("Exercise not found") thrown.',
    ecRows: [
        { number: 1, condition: 'Exercise existence', validEc: 'Existing ID → Exercise returned with result equal to MOCK_EXERCISE and result.id: EXERCISE_ID', invalidEc: '' },
        { number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Exercise not found")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: EXERCISE_ID (exercise exists)',    expected: 'Exercise returned with result equal to MOCK_EXERCISE and result.id: EXERCISE_ID' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: "non-existent-id" (no exercise with that ID)', expected: 'throws NotFoundError("Exercise not found")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no exercise with that ID)',                        expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no exercise with that ID)',                       expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (exercise exists with id: "a")',                   expected: 'Exercise returned with result.id: "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: EXERCISE_ID (exercise exists)',                expected: 'Exercise returned with result equal to MOCK_EXERCISE and result.id: EXERCISE_ID' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: "non-existent-id" (no exercise with that ID)', expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "" (no exercise with that ID)',               expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no exercise with that ID)',              expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (exercise exists with id: "a")',          expected: 'Exercise returned with result.id: "a"' },
    ],
};

const exerciseFindAllBbt: BbtDescriptor = {
    reqId: 'REPO-15',
    tcCount: 27,
    statement: 'ExerciseRepository.findAll(options?) – Returns a paginated list of exercises. Supports optional filtering by search term, muscle group, and active status. Supports pagination via page and pageSize. Results are ordered by name ascending.',
    data: 'Input: options?: ExerciseListOptions { search?, muscleGroup?, includeInactive?, page?, pageSize? }',
    precondition: 'Database is accessible. The exercise table may be empty or contain active and inactive exercises across multiple muscle groups.',
    results: 'Output: Promise<PageResult<Exercise>>',
    postcondition: 'On success: PageResult returned with items matching the applied filters, total reflecting the full count, and items ordered by name ascending.',
    ecRows: [
        { number: 1, condition: 'Options',           validEc: 'No options → active exercises only, items.length: 1, total: 1',                                                invalidEc: '' },
        { number: 2, condition: 'Active filter',     validEc: 'includeInactive: false → active only, items.length: 1, items[0] equal to MOCK_EXERCISE',                       invalidEc: '' },
        { number: 3, condition: 'Active filter',     validEc: 'includeInactive: true → all exercises, items.length: 2, items contains MOCK_EXERCISE and inactiveExercise',    invalidEc: '' },
        { number: 4, condition: 'Muscle group',      validEc: 'muscleGroup: MuscleGroup.BACK → filtered items, items[0].muscleGroup: MuscleGroup.BACK',                       invalidEc: '' },
        { number: 5, condition: 'Combined filters',  validEc: 'search: "Bench", muscleGroup: MuscleGroup.CHEST → items[0].muscleGroup: CHEST and items[0].name contains "Bench"', invalidEc: '' },
        { number: 6, condition: 'Ordering',          validEc: 'Multiple exercises → items[0].name: "A Exercise", items[1].name: "B Exercise"',                                invalidEc: '' },
        { number: 7, condition: 'No filters',        validEc: 'Empty options object → items.length: 2, total: 2, items contains MOCK_EXERCISE and MOCK_EXERCISE_BACK',         invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options',                                                          expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE, total: 1' },
        { noTc: 2, ec: 'EC-2', inputData: 'options: { includeInactive: false }',                                 expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE, total: 1' },
        { noTc: 3, ec: 'EC-3', inputData: 'options: { includeInactive: true }',                                  expected: 'PageResult with items.length: 2, items contains MOCK_EXERCISE and inactiveExercise, total: 2' },
        { noTc: 4, ec: 'EC-4', inputData: 'options: { muscleGroup: MuscleGroup.BACK }',                          expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.BACK, items[0] equal to MOCK_EXERCISE_BACK' },
        { noTc: 5, ec: 'EC-5', inputData: 'options: { search: "Bench", muscleGroup: MuscleGroup.CHEST }',        expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.CHEST, items[0].name contains "Bench"' },
        { noTc: 6, ec: 'EC-6', inputData: 'no options, exercises: [exerciseA (name: "A Exercise"), exerciseB (name: "B Exercise")]', expected: 'PageResult with items.length: 2, items[0].name: "A Exercise", items[1].name: "B Exercise"' },
        { noTc: 7, ec: 'EC-7', inputData: 'options: {} (empty object)',                                          expected: 'PageResult with items.length: 2, total: 2, items contains MOCK_EXERCISE and MOCK_EXERCISE_BACK' },
    ],
    bvaRows: [
        { number: 1, condition: 'Search value',       testCase: 'search: undefined, search: "" (empty), search: "a" (one char)' },
        { number: 2, condition: 'Muscle group enum',  testCase: 'MuscleGroup.CHEST (found), MuscleGroup.SHOULDERS (empty), MuscleGroup.ARMS (empty), MuscleGroup.BACK (found), MuscleGroup.CORE (empty), MuscleGroup.LEGS (empty), "INVALID" (empty)' },
        { number: 3, condition: 'includeInactive',    testCase: 'includeInactive: undefined (active only), includeInactive: false (active only), includeInactive: true (all)' },
        { number: 4, condition: 'Page number',        testCase: 'page: undefined, page: 0 (first), page: 1 (first), page: 2 (second)' },
        { number: 5, condition: 'Page size',          testCase: 'pageSize: undefined (default), pageSize: 0 (no items), pageSize: 1 (one item)' },
    ],
    bvaTcRows: [
        // ── Search value ─────────────────────────────────────────────────────
        { noTc: 1,  bva: 'BVA-1 (undef)', inputData: 'options: { search: undefined }',             expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 2,  bva: 'BVA-1 (n=0)',   inputData: 'options: { search: "" }',                    expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 3,  bva: 'BVA-1 (n=1)',   inputData: 'options: { search: "a" }',                   expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        // ── Muscle group enum ────────────────────────────────────────────────
        { noTc: 4,  bva: 'BVA-2 (CHEST)',     inputData: 'options: { muscleGroup: MuscleGroup.CHEST }',      expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.CHEST' },
        { noTc: 5,  bva: 'BVA-2 (SHOULDERS)', inputData: 'options: { muscleGroup: MuscleGroup.SHOULDERS }',  expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 6,  bva: 'BVA-2 (ARMS)',      inputData: 'options: { muscleGroup: MuscleGroup.ARMS }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 7,  bva: 'BVA-2 (BACK)',      inputData: 'options: { muscleGroup: MuscleGroup.BACK }',       expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.BACK' },
        { noTc: 8,  bva: 'BVA-2 (CORE)',      inputData: 'options: { muscleGroup: MuscleGroup.CORE }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 9,  bva: 'BVA-2 (LEGS)',      inputData: 'options: { muscleGroup: MuscleGroup.LEGS }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 10, bva: 'BVA-2 (INVALID)',   inputData: 'options: { muscleGroup: "INVALID" as MuscleGroup }', expected: 'PageResult with items.length: 0, total: 0' },
        // ── includeInactive ──────────────────────────────────────────────────
        { noTc: 11, bva: 'BVA-3 (undef)', inputData: 'options: { includeInactive: undefined }',    expected: 'PageResult with items.length: 1, items[0].isActive: true' },
        { noTc: 12, bva: 'BVA-3 (false)', inputData: 'options: { includeInactive: false }',        expected: 'PageResult with items.length: 1, items[0].isActive: true' },
        { noTc: 13, bva: 'BVA-3 (true)',  inputData: 'options: { includeInactive: true }',         expected: 'PageResult with items.length: 2, total: 2, items contains MOCK_EXERCISE and inactiveExercise' },
        // ── Page number ──────────────────────────────────────────────────────
        { noTc: 14, bva: 'BVA-4 (undef)', inputData: 'options: { page: undefined }',               expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 15, bva: 'BVA-4 (p=0)',   inputData: 'options: { page: 0 }',                       expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 16, bva: 'BVA-4 (p=1)',   inputData: 'options: { page: 1 }',                       expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 17, bva: 'BVA-4 (p=2)',   inputData: 'options: { page: 2, pageSize: 10 }',         expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE_BACK, total: 11' },
        // ── Page size ────────────────────────────────────────────────────────
        { noTc: 18, bva: 'BVA-5 (undef)', inputData: 'options: { pageSize: undefined }',           expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 19, bva: 'BVA-5 (s=0)',   inputData: 'options: { pageSize: 0 }',                   expected: 'PageResult with items.length: 0, total: 2' },
        { noTc: 20, bva: 'BVA-5 (s=1)',   inputData: 'options: { pageSize: 1 }',                   expected: 'PageResult with items.length: 1, total: 2' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options',                                                          expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE, total: 1' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'options: { includeInactive: false }',                                 expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE, total: 1' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'options: { includeInactive: true }',                                  expected: 'PageResult with items.length: 2, items contains MOCK_EXERCISE and inactiveExercise, total: 2' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'options: { muscleGroup: MuscleGroup.BACK }',                          expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.BACK, items[0] equal to MOCK_EXERCISE_BACK' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'options: { search: "Bench", muscleGroup: MuscleGroup.CHEST }',        expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.CHEST, items[0].name contains "Bench"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'no options, exercises: [exerciseA (name: "A Exercise"), exerciseB (name: "B Exercise")]', expected: 'PageResult with items.length: 2, items[0].name: "A Exercise", items[1].name: "B Exercise"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'options: {} (empty object)',                                          expected: 'PageResult with items.length: 2, total: 2, items contains MOCK_EXERCISE and MOCK_EXERCISE_BACK' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: undefined }',              expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "" }',                     expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'options: { search: "a" }',                    expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.CHEST }',      expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.CHEST' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.SHOULDERS }',  expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.ARMS }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.BACK }',       expected: 'PageResult with items.length: 1, items[0].muscleGroup: MuscleGroup.BACK' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.CORE }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: MuscleGroup.LEGS }',       expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { muscleGroup: "INVALID" as MuscleGroup }', expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { includeInactive: undefined }',     expected: 'PageResult with items.length: 1, items[0].isActive: true' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { includeInactive: false }',         expected: 'PageResult with items.length: 1, items[0].isActive: true' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { includeInactive: true }',          expected: 'PageResult with items.length: 2, total: 2, items contains MOCK_EXERCISE and inactiveExercise' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-4', inputData: 'options: { page: undefined }',                expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-4', inputData: 'options: { page: 0 }',                        expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-4', inputData: 'options: { page: 1 }',                        expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-4', inputData: 'options: { page: 2, pageSize: 10 }',          expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE_BACK, total: 11' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { pageSize: undefined }',            expected: 'PageResult with items.length: 1, items[0] equal to MOCK_EXERCISE' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { pageSize: 0 }',                    expected: 'PageResult with items.length: 0, total: 2' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { pageSize: 1 }',                    expected: 'PageResult with items.length: 1, total: 2' },
    ],
};

const exerciseUpdateBbt: BbtDescriptor = {
    reqId: 'REPO-16',
    tcCount: 24,
    statement: 'ExerciseRepository.update(id, data) – Updates an existing exercise record. Returns the updated Exercise on success. Throws NotFoundError("Exercise not found") if no exercise exists with the given ID. Throws ConflictError("Exercise name already in use") if the new name is already taken by a different exercise.',
    data: 'Input: id: string, data: UpdateExerciseInput { name?, description?, muscleGroup?, equipmentNeeded? }',
    precondition: 'Database is accessible. An exercise with the given ID may or may not exist. Any new name may or may not already be registered to a different exercise.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with updated fields (result.name, result.description, result.muscleGroup, result.equipmentNeeded, result.id). On failure: NotFoundError or ConflictError thrown.',
    ecRows: [
        { number: 1, condition: 'Exercise existence', validEc: 'Existing ID + valid data → Exercise returned with result.name: "Updated Bench Press", result equal to expectedReturn', invalidEc: '' },
        { number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Exercise not found")' },
        { number: 3, condition: 'Name uniqueness',    validEc: 'New name not taken by another exercise → Exercise returned', invalidEc: '' },
        { number: 4, condition: 'Name uniqueness',    validEc: '', invalidEc: 'Name taken by a different exercise → ConflictError("Exercise name already in use")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: EXERCISE_ID, data: { name: "Updated Bench Press" } (exercise exists, new name not taken)',                           expected: 'Exercise returned with result.name: "Updated Bench Press", result equal to expectedReturn' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: "non-existent-id", data: { description: "New description" } (no exercise with that ID)',                             expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 3, ec: 'EC-4', inputData: 'id: EXERCISE_ID, data: { name: "Existing Exercise" } (exercise exists, name taken by a different exercise)',              expected: 'throws ConflictError("Exercise name already in use")' },
    ],
    bvaRows: [
        { number: 1, condition: 'Exercise ID length',    testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
        { number: 2, condition: 'name field',            testCase: 'name: undefined, name: "" (empty), name: "a" (one char)' },
        { number: 3, condition: 'description field',     testCase: 'description: undefined, description: "" (empty), description: "a" (one char)' },
        { number: 4, condition: 'muscleGroup field',     testCase: 'muscleGroup: undefined, MuscleGroup.CHEST, MuscleGroup.SHOULDERS, MuscleGroup.ARMS, MuscleGroup.BACK, MuscleGroup.CORE, MuscleGroup.LEGS' },
        { number: 5, condition: 'equipmentNeeded field', testCase: 'equipmentNeeded: undefined, Equipment.CABLE, Equipment.DUMBBELL, Equipment.BARBELL, Equipment.MACHINE' },
    ],
    bvaTcRows: [
        // ── ID length ────────────────────────────────────────────────────────
        { noTc: 1,  bva: 'BVA-1 (n=0)', inputData: 'id: "" (no exercise with that ID), data: { description: "Updated description" }',                    expected: 'throws NotFoundError' },
        { noTc: 2,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no exercise with that ID), data: { description: "Updated description" }',                   expected: 'throws NotFoundError' },
        { noTc: 3,  bva: 'BVA-1 (n=1)', inputData: 'id: "a" (exercise exists with id: "a"), data: { description: "Updated description" }',               expected: 'Exercise returned with result.id: "a", result.description: "Updated description"' },
        // ── name ─────────────────────────────────────────────────────────────
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'id: EXERCISE_ID, data: { name: undefined } (exercise exists)',                                      expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 5,  bva: 'BVA-2 (n=0)',   inputData: 'id: EXERCISE_ID, data: { name: "" } (exercise exists)',                                             expected: 'Exercise returned with result.name: ""' },
        { noTc: 6,  bva: 'BVA-2 (n=1)',   inputData: 'id: EXERCISE_ID, data: { name: "a" } (exercise exists, new name not taken)',                        expected: 'Exercise returned with result.name: "a"' },
        // ── description ──────────────────────────────────────────────────────
        { noTc: 7,  bva: 'BVA-3 (undef)', inputData: 'id: EXERCISE_ID, data: { description: undefined } (exercise exists)',                               expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 8,  bva: 'BVA-3 (n=0)',   inputData: 'id: EXERCISE_ID, data: { description: "" } (exercise exists)',                                      expected: 'Exercise returned with result.description: ""' },
        { noTc: 9,  bva: 'BVA-3 (n=1)',   inputData: 'id: EXERCISE_ID, data: { description: "a" } (exercise exists)',                                     expected: 'Exercise returned with result.description: "a"' },
        // ── muscleGroup ──────────────────────────────────────────────────────
        { noTc: 10, bva: 'BVA-4 (undef)',     inputData: 'id: EXERCISE_ID, data: { muscleGroup: undefined } (exercise exists)',                            expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 11, bva: 'BVA-4 (CHEST)',     inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.CHEST } (exercise exists)',                    expected: 'Exercise returned with result.muscleGroup: MuscleGroup.CHEST' },
        { noTc: 12, bva: 'BVA-4 (SHOULDERS)', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.SHOULDERS } (exercise exists)',                expected: 'Exercise returned with result.muscleGroup: MuscleGroup.SHOULDERS' },
        { noTc: 13, bva: 'BVA-4 (ARMS)',      inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.ARMS } (exercise exists)',                     expected: 'Exercise returned with result.muscleGroup: MuscleGroup.ARMS' },
        { noTc: 14, bva: 'BVA-4 (BACK)',      inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.BACK } (exercise exists)',                     expected: 'Exercise returned with result.muscleGroup: MuscleGroup.BACK' },
        { noTc: 15, bva: 'BVA-4 (CORE)',      inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.CORE } (exercise exists)',                     expected: 'Exercise returned with result.muscleGroup: MuscleGroup.CORE' },
        { noTc: 16, bva: 'BVA-4 (LEGS)',      inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.LEGS } (exercise exists)',                     expected: 'Exercise returned with result.muscleGroup: MuscleGroup.LEGS' },
        // ── equipmentNeeded ──────────────────────────────────────────────────
        { noTc: 17, bva: 'BVA-5 (undef)',    inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: undefined } (exercise exists)',                         expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 18, bva: 'BVA-5 (CABLE)',    inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.CABLE } (exercise exists)',                   expected: 'Exercise returned with result.equipmentNeeded: Equipment.CABLE' },
        { noTc: 19, bva: 'BVA-5 (DUMBBELL)', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.DUMBBELL } (exercise exists)',                expected: 'Exercise returned with result.equipmentNeeded: Equipment.DUMBBELL' },
        { noTc: 20, bva: 'BVA-5 (BARBELL)',  inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.BARBELL } (exercise exists)',                 expected: 'Exercise returned with result.equipmentNeeded: Equipment.BARBELL' },
        { noTc: 21, bva: 'BVA-5 (MACHINE)',  inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.MACHINE } (exercise exists)',                 expected: 'Exercise returned with result.equipmentNeeded: Equipment.MACHINE' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'id: EXERCISE_ID, data: { name: "Updated Bench Press" } (exercise exists, new name not taken)',          expected: 'Exercise returned with result.name: "Updated Bench Press", result equal to expectedReturn' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'id: "non-existent-id", data: { description: "New description" } (no exercise with that ID)',            expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 3,  fromEc: 'EC-4', fromBva: '', inputData: 'id: EXERCISE_ID, data: { name: "Existing Exercise" } (exercise exists, name taken by a different exercise)', expected: 'throws ConflictError("Exercise name already in use")' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 4,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "" (no exercise with that ID), data: { description: "Updated description" }',                      expected: 'throws NotFoundError' },
        { noTc: 5,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no exercise with that ID), data: { description: "Updated description" }',                     expected: 'throws NotFoundError' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (exercise exists with id: "a"), data: { description: "Updated description" }',                 expected: 'Exercise returned with result.id: "a", result.description: "Updated description"' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-2', inputData: 'id: EXERCISE_ID, data: { name: undefined } (exercise exists)',                                          expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-2', inputData: 'id: EXERCISE_ID, data: { name: "" } (exercise exists)',                                                 expected: 'Exercise returned with result.name: ""' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2', inputData: 'id: EXERCISE_ID, data: { name: "a" } (exercise exists, new name not taken)',                            expected: 'Exercise returned with result.name: "a"' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-3', inputData: 'id: EXERCISE_ID, data: { description: undefined } (exercise exists)',                                   expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-3', inputData: 'id: EXERCISE_ID, data: { description: "" } (exercise exists)',                                          expected: 'Exercise returned with result.description: ""' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3', inputData: 'id: EXERCISE_ID, data: { description: "a" } (exercise exists)',                                         expected: 'Exercise returned with result.description: "a"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: undefined } (exercise exists)',                                   expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.CHEST } (exercise exists)',                           expected: 'Exercise returned with result.muscleGroup: MuscleGroup.CHEST' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.SHOULDERS } (exercise exists)',                       expected: 'Exercise returned with result.muscleGroup: MuscleGroup.SHOULDERS' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.ARMS } (exercise exists)',                            expected: 'Exercise returned with result.muscleGroup: MuscleGroup.ARMS' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.BACK } (exercise exists)',                            expected: 'Exercise returned with result.muscleGroup: MuscleGroup.BACK' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.CORE } (exercise exists)',                            expected: 'Exercise returned with result.muscleGroup: MuscleGroup.CORE' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-4', inputData: 'id: EXERCISE_ID, data: { muscleGroup: MuscleGroup.LEGS } (exercise exists)',                            expected: 'Exercise returned with result.muscleGroup: MuscleGroup.LEGS' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-5', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: undefined } (exercise exists)',                               expected: 'Exercise returned with result equal to { ...MOCK_EXERCISE }' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-5', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.CABLE } (exercise exists)',                         expected: 'Exercise returned with result.equipmentNeeded: Equipment.CABLE' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-5', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.DUMBBELL } (exercise exists)',                      expected: 'Exercise returned with result.equipmentNeeded: Equipment.DUMBBELL' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-5', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.BARBELL } (exercise exists)',                       expected: 'Exercise returned with result.equipmentNeeded: Equipment.BARBELL' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-5', inputData: 'id: EXERCISE_ID, data: { equipmentNeeded: Equipment.MACHINE } (exercise exists)',                       expected: 'Exercise returned with result.equipmentNeeded: Equipment.MACHINE' },
    ],
};

const exerciseSetActiveBbt: BbtDescriptor = {
    reqId: 'REPO-17',
    tcCount: 6,
    statement: 'ExerciseRepository.setActive(id, isActive) – Sets the isActive flag on an existing exercise. Returns the updated Exercise on success. Throws NotFoundError("Exercise not found") if no exercise exists with the given ID.',
    data: 'Input: id: string, isActive: boolean',
    precondition: 'Database is accessible. An exercise with the given ID may or may not exist.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with result.isActive matching the input value and result equal to expected. On failure: NotFoundError("Exercise not found") thrown.',
    ecRows: [
        { number: 1, condition: 'Exercise existence', validEc: 'Existing ID, isActive: false → Exercise returned with result.isActive: false, result equal to expected', invalidEc: '' },
        { number: 2, condition: 'Exercise existence', validEc: 'Existing ID, isActive: true → Exercise returned with result.isActive: true, result equal to expected',  invalidEc: '' },
        { number: 3, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Exercise not found")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: EXERCISE_ID, isActive: false (exercise exists, currently active)',   expected: 'Exercise returned with result.isActive: false, result equal to { ...MOCK_EXERCISE, isActive: false }' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: EXERCISE_ID, isActive: true (exercise exists, currently inactive)',  expected: 'Exercise returned with result.isActive: true, result equal to { ...MOCK_EXERCISE, isActive: true }' },
        { noTc: 3, ec: 'EC-3', inputData: 'id: "non-existent-id", isActive: true (no exercise with that ID)',       expected: 'throws NotFoundError("Exercise not found")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no exercise with that ID), isActive: true',                                   expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no exercise with that ID), isActive: true',                                  expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (exercise exists with id: "a", currently active), isActive: false',           expected: 'Exercise returned with result.id: "a", result.isActive: false' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: EXERCISE_ID, isActive: false (exercise exists, currently active)',        expected: 'Exercise returned with result.isActive: false, result equal to { ...MOCK_EXERCISE, isActive: false }' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: EXERCISE_ID, isActive: true (exercise exists, currently inactive)',       expected: 'Exercise returned with result.isActive: true, result equal to { ...MOCK_EXERCISE, isActive: true }' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'id: "non-existent-id", isActive: true (no exercise with that ID)',            expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "" (no exercise with that ID), isActive: true',                         expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no exercise with that ID), isActive: true',                        expected: 'throws NotFoundError' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (exercise exists with id: "a", currently active), isActive: false', expected: 'Exercise returned with result.id: "a", result.isActive: false' },
    ],
};

const exerciseDeleteBbt: BbtDescriptor = {
    reqId: 'REPO-18',
    tcCount: 8,
    statement: 'ExerciseRepository.delete(id) – Deletes an exercise if it exists and is not referenced by any workout sessions. Returns void on success. Throws NotFoundError("Exercise not found") if the ID does not exist. Throws ConflictError("Exercise is used in existing workout sessions and cannot be deleted") if the exercise is referenced by one or more workout sessions.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. An exercise with the given ID may or may not exist. The exercise may or may not be referenced by workout session exercises.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves to undefined (void). On failure: NotFoundError or ConflictError thrown.',
    ecRows: [
        { number: 1, condition: 'Exercise existence', validEc: 'Existing ID, not referenced in any workout session → resolves void', invalidEc: '' },
        { number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Exercise not found")' },
        { number: 3, condition: 'Workout references', validEc: '', invalidEc: 'Referenced in workout sessions → ConflictError("Exercise is used in existing workout sessions and cannot be deleted")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1',       inputData: 'id: EXERCISE_ID (exercise exists, not referenced in any workout session)',                      expected: 'resolves void' },
        { noTc: 2, ec: 'EC-2',       inputData: 'id: "non-existent-id" (no exercise with that ID)',                                              expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 3, ec: 'EC-3',       inputData: 'id: EXERCISE_ID (exercise exists, referenced in 5 workout sessions)',                           expected: 'throws ConflictError("Exercise is used in existing workout sessions and cannot be deleted")' },
    ],
    bvaRows: [
        { number: 1, condition: 'Workout session reference count', testCase: 'count: 0 (delete allowed), count: 1 (delete blocked)' },
        { number: 2, condition: 'ID length',                       testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found, count: 0)' },
    ],
    bvaTcRows: [
        // ── Reference count ──────────────────────────────────────────────────
        { noTc: 1, bva: 'BVA-1 (c=0)', inputData: 'id: EXERCISE_ID (exercise exists, not referenced in any workout session)',                    expected: 'resolves void' },
        { noTc: 2, bva: 'BVA-1 (c=1)', inputData: 'id: EXERCISE_ID (exercise exists, referenced in 1 workout session)',                         expected: 'throws ConflictError("Exercise is used in existing workout sessions and cannot be deleted")' },
        // ── ID length ────────────────────────────────────────────────────────
        { noTc: 3, bva: 'BVA-2 (n=0)', inputData: 'id: "" (no exercise with that ID)',                                                           expected: 'throws NotFoundError' },
        { noTc: 4, bva: 'BVA-2 (n=1)', inputData: 'id: "a" (no exercise with that ID)',                                                          expected: 'throws NotFoundError' },
        { noTc: 5, bva: 'BVA-2 (n=1)', inputData: 'id: "a" (exercise exists with id: "a", not referenced in any workout session)',               expected: 'resolves void' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: EXERCISE_ID (exercise exists, not referenced in any workout session)',            expected: 'resolves void' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'id: "non-existent-id" (no exercise with that ID)',                                   expected: 'throws NotFoundError("Exercise not found")' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'id: EXERCISE_ID (exercise exists, referenced in 5 workout sessions)',                 expected: 'throws ConflictError("Exercise is used in existing workout sessions and cannot be deleted")' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 4, fromEc: '', fromBva: 'BVA-1', inputData: 'id: EXERCISE_ID (exercise exists, not referenced in any workout session)',           expected: 'resolves void' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: EXERCISE_ID (exercise exists, referenced in 1 workout session)',                 expected: 'throws ConflictError("Exercise is used in existing workout sessions and cannot be deleted")' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-2', inputData: 'id: "" (no exercise with that ID)',                                                  expected: 'throws NotFoundError' },
        { noTc: 7, fromEc: '', fromBva: 'BVA-2', inputData: 'id: "a" (no exercise with that ID)',                                                 expected: 'throws NotFoundError' },
        { noTc: 8, fromEc: '', fromBva: 'BVA-2', inputData: 'id: "a" (exercise exists with id: "a", not referenced in any workout session)',      expected: 'resolves void' },
    ],
};

// ── workout-session-repository ─────────────────────────────────────────────────
const wsCreateBbt: BbtDescriptor = {
    reqId: 'REPO-19',
    tcCount: 10,
    statement: 'WorkoutSessionRepository.create(data, exercises) – Creates a new workout session with its associated exercises. Returns the created WorkoutSessionWithExercises on success. Throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.") if the exercises array is empty. Throws NotFoundError("Member not found") if no member exists with the given memberId. Throws TransactionError if the database write fails.',
    data: 'Input: data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]',
    precondition: 'Database is accessible. A member with the given memberId may or may not exist. The exercises array may be empty or contain one or more items.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length matching the number of provided exercises, and result.exercises[0].exerciseId matching the first exercise input. On failure: WorkoutSessionRequiresExercisesError, NotFoundError, or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Exercise count', validEc: 'One exercise provided → WorkoutSessionWithExercises returned with result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID', invalidEc: '' },
        { number: 2, condition: 'Exercise count', validEc: 'Multiple exercises provided → WorkoutSessionWithExercises returned with result.exercises.length: 2, result.exercises[1].exerciseId: "exercise-uuid-002"', invalidEc: '' },
        { number: 3, condition: 'Exercise count', validEc: '', invalidEc: 'Empty exercises array → WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { number: 4, condition: 'Member existence', validEc: 'Member exists → WorkoutSessionWithExercises returned', invalidEc: '' },
        { number: 5, condition: 'Member existence', validEc: '', invalidEc: 'No member with given memberId → NotFoundError("Member not found")' },
        { number: 6, condition: 'Database write',   validEc: 'Write succeeds → WorkoutSessionWithExercises returned', invalidEc: '' },
        { number: 7, condition: 'Database write',   validEc: '', invalidEc: 'Write fails → TransactionError("DB error")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1, EC-4, EC-6', inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (1 item, member exists, write succeeds)',                                                                  expected: 'WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
        { noTc: 2, ec: 'EC-2',             inputData: 'data: CREATE_SESSION_INPUT, exercises: [EXERCISE_INPUT[0], { exerciseId: "exercise-uuid-002", sets: 4, reps: 8, weight: 60.0 }] (member exists, write succeeds)', expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 2, result.exercises[1].exerciseId: "exercise-uuid-002", result.exercises[1].sets: 4' },
        { noTc: 3, ec: 'EC-3',             inputData: 'data: CREATE_SESSION_INPUT, exercises: [] (empty array)',                                                                                                          expected: 'throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { noTc: 4, ec: 'EC-5',             inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (no member with given memberId)',                                                                            expected: 'throws NotFoundError("Member not found")' },
        { noTc: 5, ec: 'EC-7',             inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (member exists, database write fails with "DB error")',                                                     expected: 'throws TransactionError("DB error")' },
    ],
    bvaRows: [
        { number: 1, condition: 'memberId length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
        { number: 2, condition: 'exercises length', testCase: 'length: 0 (empty array), length: 1 (one item)' },
    ],
    bvaTcRows: [
        // ── memberId length ──────────────────────────────────────────────────
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "" } (no member with that ID), exercises: EXERCISE_INPUT',                      expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "a" } (no member with that ID), exercises: EXERCISE_INPUT',                     expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "a" } (member exists with id: "a"), exercises: EXERCISE_INPUT',                 expected: 'WorkoutSessionWithExercises returned with result.memberId: "a"' },
        // ── exercises length ─────────────────────────────────────────────────
        { noTc: 4, bva: 'BVA-2 (l=0)', inputData: 'data: CREATE_SESSION_INPUT, exercises: [] (empty array)',                                                                  expected: 'throws WorkoutSessionRequiresExercisesError' },
        { noTc: 5, bva: 'BVA-2 (l=1)', inputData: 'data: CREATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0 }] (member exists)',   expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1, EC-4, EC-6', fromBva: '', inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (1 item, member exists, write succeeds)',                                                                  expected: 'WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
        { noTc: 2,  fromEc: 'EC-2',             fromBva: '', inputData: 'data: CREATE_SESSION_INPUT, exercises: [EXERCISE_INPUT[0], { exerciseId: "exercise-uuid-002", sets: 4, reps: 8, weight: 60.0 }] (member exists, write succeeds)', expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 2, result.exercises[1].exerciseId: "exercise-uuid-002", result.exercises[1].sets: 4' },
        { noTc: 3,  fromEc: 'EC-3',             fromBva: '', inputData: 'data: CREATE_SESSION_INPUT, exercises: [] (empty array)',                                                                                                          expected: 'throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { noTc: 4,  fromEc: 'EC-5',             fromBva: '', inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (no member with given memberId)',                                                                            expected: 'throws NotFoundError("Member not found")' },
        { noTc: 5,  fromEc: 'EC-7',             fromBva: '', inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (member exists, database write fails with "DB error")',                                                     expected: 'throws TransactionError("DB error")' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 6,  fromEc: '', fromBva: 'BVA-1', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "" } (no member with that ID), exercises: EXERCISE_INPUT',                    expected: 'throws NotFoundError' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "a" } (no member with that ID), exercises: EXERCISE_INPUT',                   expected: 'throws NotFoundError' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1', inputData: 'data: { ...CREATE_SESSION_INPUT, memberId: "a" } (member exists with id: "a"), exercises: EXERCISE_INPUT',               expected: 'WorkoutSessionWithExercises returned with result.memberId: "a"' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2', inputData: 'data: CREATE_SESSION_INPUT, exercises: [] (empty array)',                                                                expected: 'throws WorkoutSessionRequiresExercisesError' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2', inputData: 'data: CREATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0 }] (member exists)', expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
    ],
};

const wsFindByIdBbt: BbtDescriptor = {
    reqId: 'REPO-20',
    tcCount: 5,
    statement: 'WorkoutSessionRepository.findById(id) – Retrieves a single workout session with its exercises by ID. Returns the matching WorkoutSessionWithExercises on success. Throws NotFoundError("Workout session not found") if no session exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. A workout session with the given ID may or may not exist.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1. On failure: NotFoundError("Workout session not found") thrown.',
    ecRows: [
        { number: 1, condition: 'Session existence', validEc: 'Existing ID → WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1', invalidEc: '' },
        { number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Workout session not found")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: SESSION_ID (session exists)',           expected: 'WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID (no session with that ID)', expected: 'throws NotFoundError("Workout session not found")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no session with that ID)',                    expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no session with that ID)',                   expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (session exists with id: "a")',               expected: 'WorkoutSessionWithExercises returned with result.id: "a", result equal to { ...MOCK_SESSION_WITH_EXERCISES, id: "a" }' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',    inputData: 'id: SESSION_ID (session exists)',               expected: 'WorkoutSessionWithExercises returned with result equal to MOCK_SESSION_WITH_EXERCISES, result.id: SESSION_ID, result.exercises.length: 1' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',    inputData: 'id: NONEXISTENT_ID (no session with that ID)',  expected: 'throws NotFoundError("Workout session not found")' },
        { noTc: 3, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "" (no session with that ID)',            expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (no session with that ID)',           expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (session exists with id: "a")',       expected: 'WorkoutSessionWithExercises returned with result.id: "a", result equal to { ...MOCK_SESSION_WITH_EXERCISES, id: "a" }' },
    ],
};

const wsFindAllBbt: BbtDescriptor = {
    reqId: 'REPO-21',
    tcCount: 22,
    statement: 'WorkoutSessionRepository.findAll(options?) – Returns a paginated list of workout sessions with their exercises. Supports optional filtering by memberId, startDate, and endDate. Supports pagination via page and pageSize. Unpaginated results are ordered by date ascending; paginated results are ordered by date descending.',
    data: 'Input: options?: WorkoutSessionListOptions { memberId?, startDate?, endDate?, page?, pageSize? }',
    precondition: 'Database is accessible. The workout session table may be empty or contain sessions across multiple members and dates.',
    results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
    postcondition: 'On success: PageResult returned with items matching the applied filters, total reflecting the full count, and items ordered by date ascending (unpaginated) or date descending (paginated).',
    ecRows: [
        { number: 1,  condition: 'Options',    validEc: 'No options → all sessions, items.length: 2, total: 2, ordered by date ascending',                                                          invalidEc: '' },
        { number: 2,  condition: 'Filters',    validEc: 'memberId: MEMBER_ID → sessions for that member, items.length: 1, items[0].memberId: MEMBER_ID',                                            invalidEc: '' },
        { number: 3,  condition: 'Filters',    validEc: 'startDate: 2024-06-01 → sessions on or after startDate, items[0].date >= startDate',                                                       invalidEc: '' },
        { number: 4,  condition: 'Filters',    validEc: 'endDate: 2024-06-30 → sessions on or before endDate, items[0].date <= endDate',                                                            invalidEc: '' },
        { number: 5,  condition: 'Filters',    validEc: 'startDate: 2024-01-01, endDate: 2024-12-31 → sessions within range, items[0].date >= startDate and items[0].date <= endDate',              invalidEc: '' },
        { number: 6,  condition: 'Filters',    validEc: 'memberId: MEMBER_ID, startDate: 2024-06-01, endDate: 2024-06-30 → sessions for that member within range, items[0].memberId: MEMBER_ID',    invalidEc: '' },
        { number: 7,  condition: 'Pagination', validEc: 'page: 2, pageSize: 10 → second page subset, items.length: 1, total: 25',                                                                   invalidEc: '' },
        { number: 8,  condition: 'DB results', validEc: 'No matching sessions → empty result, items.length: 0, total: 0',                                                                           invalidEc: '' },
        { number: 9,  condition: 'Ordering',   validEc: 'Unpaginated, multiple sessions → items[0].id: "older", items[1].id: "newer", items[0].date < items[1].date (ascending)',                   invalidEc: '' },
        { number: 10, condition: 'Ordering',   validEc: 'Paginated (page: 1, pageSize: 10), multiple sessions → items[0].id: "newer", items[1].id: "older", items[0].date > items[1].date (descending)', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'no options (2 sessions in DB)',                                                                                    expected: 'PageResult with items.length: 2, items[0] equal to MOCK_SESSION_WITH_EXERCISES, items[1] equal to session2, total: 2' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'options: { memberId: MEMBER_ID } (1 matching session)',                                                            expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID, items[0] equal to MOCK_SESSION_WITH_EXERCISES, total: 1' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'options: { startDate: new Date("2024-06-01") } (1 session on or after startDate)',                                 expected: 'PageResult with items.length: 1, items[0].date >= startDate, total: 1' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'options: { endDate: new Date("2024-06-30") } (1 session on or before endDate)',                                   expected: 'PageResult with items.length: 1, items[0].date <= endDate, total: 1' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'options: { startDate: new Date("2024-01-01"), endDate: new Date("2024-12-31") } (1 session within range)',         expected: 'PageResult with items.length: 1, items[0].date >= startDate, items[0].date <= endDate, total: 1' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'options: { memberId: MEMBER_ID, startDate: new Date("2024-06-01"), endDate: new Date("2024-06-30") }',             expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID, total: 1' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'options: { page: 2, pageSize: 10 } (25 total sessions)',                                                          expected: 'PageResult with items.length: 1, total: 25' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'options: { memberId: NONEXISTENT_ID } (no matching sessions)',                                                     expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'no options, sessions: [olderSession (date: 2024-01-01), newerSession (date: 2024-12-01)]',                         expected: 'PageResult with items.length: 2, items[0].id: "older", items[1].id: "newer", items[0].date < items[1].date' },
        { noTc: 10, ec: 'EC-10', inputData: 'options: { page: 1, pageSize: 10 }, sessions: [newerSession (date: 2024-12-01), olderSession (date: 2024-01-01)]', expected: 'PageResult with items.length: 2, items[0].id: "newer", items[1].id: "older", items[0].date > items[1].date' },
    ],
    bvaRows: [
        { number: 1,  condition: 'memberId',         testCase: 'memberId: undefined (all sessions), memberId: "" (no sessions), memberId: "a" (matching sessions)' },
        { number: 2,  condition: 'startDate',        testCase: 'startDate: undefined (all sessions)' },
        { number: 3,  condition: 'endDate',          testCase: 'endDate: undefined (all sessions)' },
        { number: 4,  condition: 'Date boundary',    testCase: 'startDate equals endDate (same-day sessions only)' },
        { number: 5,  condition: 'Pagination combo', testCase: 'page: undefined + pageSize: undefined, page: undefined + pageSize: 10, page: 1 + pageSize: undefined' },
        { number: 6,  condition: 'Page number',      testCase: 'page: 0 (first page), page: 1 (first page), page: 2 (second page, empty result)' },
        { number: 7,  condition: 'Page size',        testCase: 'pageSize: 1 (one item per page)' },
    ],
    bvaTcRows: [
        // ── memberId ─────────────────────────────────────────────────────────
        { noTc: 1,  bva: 'BVA-1 (undef)', inputData: 'options: { memberId: undefined } (2 sessions in DB)',                                          expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 2,  bva: 'BVA-1 (n=0)',   inputData: 'options: { memberId: "" } (no sessions with that memberId)',                                    expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 3,  bva: 'BVA-1 (n=1)',   inputData: 'options: { memberId: "a" } (1 session with matching memberId)',                                 expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID' },
        // ── startDate ────────────────────────────────────────────────────────
        { noTc: 4,  bva: 'BVA-2 (undef)', inputData: 'options: { startDate: undefined } (2 sessions in DB)',                                         expected: 'PageResult with items.length: 2, total: 2' },
        // ── endDate ──────────────────────────────────────────────────────────
        { noTc: 5,  bva: 'BVA-3 (undef)', inputData: 'options: { endDate: undefined } (2 sessions in DB)',                                           expected: 'PageResult with items.length: 2, total: 2' },
        // ── Date boundary ────────────────────────────────────────────────────
        { noTc: 6,  bva: 'BVA-4 (eq)',    inputData: 'options: { startDate: new Date("2024-06-01"), endDate: new Date("2024-06-01") } (1 matching session on that day)', expected: 'PageResult with items.length: 1, items[0].date equal to new Date("2024-06-01")' },
        // ── Pagination combo ─────────────────────────────────────────────────
        { noTc: 7,  bva: 'BVA-5 (both undef)', inputData: 'options: { page: undefined, pageSize: undefined } (3 sessions in DB)',                    expected: 'PageResult with items.length: 3, total: 3' },
        { noTc: 8,  bva: 'BVA-5 (page undef)', inputData: 'options: { page: undefined, pageSize: 10 } (2 sessions in DB)',                           expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 9,  bva: 'BVA-5 (size undef)', inputData: 'options: { page: 1, pageSize: undefined } (2 sessions in DB)',                            expected: 'PageResult with items.length: 2, total: 2' },
        // ── Page number ──────────────────────────────────────────────────────
        { noTc: 10, bva: 'BVA-6 (p=0)', inputData: 'options: { page: 0, pageSize: 10 } (5 total sessions)',                                          expected: 'PageResult with items.length: 1, total: 5' },
        { noTc: 11, bva: 'BVA-6 (p=1)', inputData: 'options: { page: 1, pageSize: 10 } (25 total sessions)',                                         expected: 'PageResult with items.length: 1, total: 25' },
        { noTc: 12, bva: 'BVA-6 (p=2)', inputData: 'options: { page: 2, pageSize: 10 } (25 total sessions, no items on this page)',                  expected: 'PageResult with items.length: 0, total: 25' },
        // ── Page size ────────────────────────────────────────────────────────
        // note: pageSize: 1 is covered in BVA-7 below; pageSize: 0 has no dedicated test
        { noTc: 13, bva: 'BVA-7 (s=1)', inputData: 'options: { page: 1, pageSize: 1 } (5 total sessions)',                                           expected: 'PageResult with items.length: 1, total: 5' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'no options (2 sessions in DB)',                                                                                    expected: 'PageResult with items.length: 2, items[0] equal to MOCK_SESSION_WITH_EXERCISES, items[1] equal to session2, total: 2' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'options: { memberId: MEMBER_ID } (1 matching session)',                                                            expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID, items[0] equal to MOCK_SESSION_WITH_EXERCISES, total: 1' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'options: { startDate: new Date("2024-06-01") } (1 session on or after startDate)',                                 expected: 'PageResult with items.length: 1, items[0].date >= startDate, total: 1' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'options: { endDate: new Date("2024-06-30") } (1 session on or before endDate)',                                   expected: 'PageResult with items.length: 1, items[0].date <= endDate, total: 1' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'options: { startDate: new Date("2024-01-01"), endDate: new Date("2024-12-31") } (1 session within range)',         expected: 'PageResult with items.length: 1, items[0].date >= startDate, items[0].date <= endDate, total: 1' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'options: { memberId: MEMBER_ID, startDate: new Date("2024-06-01"), endDate: new Date("2024-06-30") }',             expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID, total: 1' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'options: { page: 2, pageSize: 10 } (25 total sessions)',                                                          expected: 'PageResult with items.length: 1, total: 25' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'options: { memberId: NONEXISTENT_ID } (no matching sessions)',                                                     expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'no options, sessions: [olderSession (date: 2024-01-01), newerSession (date: 2024-12-01)]',                         expected: 'PageResult with items.length: 2, items[0].id: "older", items[1].id: "newer", items[0].date < items[1].date' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'options: { page: 1, pageSize: 10 }, sessions: [newerSession (date: 2024-12-01), olderSession (date: 2024-01-01)]', expected: 'PageResult with items.length: 2, items[0].id: "newer", items[1].id: "older", items[0].date > items[1].date' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: 'options: { memberId: undefined } (2 sessions in DB)',                                          expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'options: { memberId: "" } (no sessions with that memberId)',                                    expected: 'PageResult with items.length: 0, total: 0' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'options: { memberId: "a" } (1 session with matching memberId)',                                 expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-2', inputData: 'options: { startDate: undefined } (2 sessions in DB)',                                         expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: 'options: { endDate: undefined } (2 sessions in DB)',                                           expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-4', inputData: 'options: { startDate: new Date("2024-06-01"), endDate: new Date("2024-06-01") } (1 matching session on that day)', expected: 'PageResult with items.length: 1, items[0].date equal to new Date("2024-06-01")' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { page: undefined, pageSize: undefined } (3 sessions in DB)',                         expected: 'PageResult with items.length: 3, total: 3' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { page: undefined, pageSize: 10 } (2 sessions in DB)',                                expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-5', inputData: 'options: { page: 1, pageSize: undefined } (2 sessions in DB)',                                 expected: 'PageResult with items.length: 2, total: 2' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-6', inputData: 'options: { page: 0, pageSize: 10 } (5 total sessions)',                                        expected: 'PageResult with items.length: 1, total: 5' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-6', inputData: 'options: { page: 1, pageSize: 10 } (25 total sessions)',                                       expected: 'PageResult with items.length: 1, total: 25' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-7', inputData: 'options: { page: 1, pageSize: 1 } (5 total sessions)',                                         expected: 'PageResult with items.length: 1, total: 5' },
    ],
};

const wsUpdateBbt: BbtDescriptor = {
    reqId: 'REPO-22',
    tcCount: 5,
    statement: 'WorkoutSessionRepository.update(id, data) – Updates metadata of an existing workout session. Returns the updated WorkoutSession on success. Throws NotFoundError("Workout session not found") if no session exists with the given ID.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput',
    precondition: 'Database is accessible. A workout session with the given ID may or may not exist.',
    results: 'Output: Promise<WorkoutSession>',
    postcondition: 'On success: WorkoutSession returned with updated fields (result.duration: 75, result equal to expectedReturn). On failure: NotFoundError("Workout session not found") thrown.',
    ecRows: [
        { number: 1, condition: 'Session existence', validEc: 'Existing ID, valid data → WorkoutSession returned with result.duration: 75, result equal to expectedReturn', invalidEc: '' },
        { number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Workout session not found")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT (session exists)',       expected: 'WorkoutSession returned with result.duration: 75, result equal to { ...MOCK_SESSION, duration: 75 }' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT (no session with that ID)', expected: 'throws NotFoundError("Workout session not found")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no session with that ID), data: UPDATE_SESSION_INPUT',                 expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no session with that ID), data: UPDATE_SESSION_INPUT',                expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (session exists with id: "a"), data: UPDATE_SESSION_INPUT',            expected: 'WorkoutSession returned with result.id: "a", result.duration: 75' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',    inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT (session exists)',            expected: 'WorkoutSession returned with result.duration: 75, result equal to { ...MOCK_SESSION, duration: 75 }' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',    inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT (no session with that ID)', expected: 'throws NotFoundError("Workout session not found")' },
        { noTc: 3, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "" (no session with that ID), data: UPDATE_SESSION_INPUT',          expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (no session with that ID), data: UPDATE_SESSION_INPUT',         expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (session exists with id: "a"), data: UPDATE_SESSION_INPUT',     expected: 'WorkoutSession returned with result.id: "a", result.duration: 75' },
    ],
};

const wsUpdateWithExercisesBbt: BbtDescriptor = {
    reqId: 'REPO-23',
    tcCount: 11,
    statement: 'WorkoutSessionRepository.updateWithExercises(id, data, exercises) – Atomically updates a workout session\'s metadata and replaces its exercises. New exercises (no id) are created; existing exercises (with id) are updated; exercises omitted from the input are deleted. Returns the updated WorkoutSessionWithExercises on success. Throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.") if the exercises array is empty. Throws NotFoundError("Workout session not found") if no session exists with the given ID. Throws TransactionError if the transaction fails.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'Database is accessible. A workout session with the given ID may or may not exist. The exercises array may be empty or contain new items (no id), existing items (with id), or a mix of both.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: WorkoutSessionWithExercises returned with result.id matching input id, result.exercises reflecting the provided exercises after create/update/delete reconciliation. On failure: WorkoutSessionRequiresExercisesError, NotFoundError, or TransactionError thrown.',
    ecRows: [
        { number: 1, condition: 'Session existence', validEc: 'Existing ID, new exercises → WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length: 1', invalidEc: '' },
        { number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Workout session not found")' },
        { number: 3, condition: 'Exercise count',    validEc: 'New exercises provided (no id) → exercises created, result.exercises.length: 1', invalidEc: '' },
        { number: 4, condition: 'Exercise count',    validEc: '', invalidEc: 'Empty exercises array → WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { number: 5, condition: 'Exercise mutation', validEc: 'Exercise with existing id provided → exercise updated in place, result.exercises[0].sets: 4', invalidEc: '' },
        { number: 6, condition: 'Exercise mutation', validEc: 'Exercise omitted from input (stale) → exercise deleted, result equal to MOCK_SESSION_WITH_EXERCISES', invalidEc: '' },
        { number: 7, condition: 'Exercise mutation', validEc: 'Mix of existing id (updated) and new (created), stale removed → result.id: SESSION_ID, result equal to MOCK_SESSION_WITH_EXERCISES', invalidEc: '' },
        { number: 8, condition: 'Transaction',       validEc: 'Transaction succeeds → WorkoutSessionWithExercises returned', invalidEc: '' },
        { number: 9, condition: 'Transaction',       validEc: '', invalidEc: 'Transaction fails → TransactionError("DB connection lost")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1, EC-3', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (session exists, new exercises, transaction succeeds)',                                                           expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length: 1, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 2, ec: 'EC-4',       inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [] (empty array)',                                                                                                               expected: 'throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { noTc: 3, ec: 'EC-2',       inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (no session with that ID)',                                                                                   expected: 'throws NotFoundError("Workout session not found")' },
        { noTc: 4, ec: 'EC-5',       inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ id: "se-uuid-001", exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0 }] (session exists, exercise se-uuid-001 exists)', expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length: 1, result.exercises[0].sets: 4' },
        { noTc: 5, ec: 'EC-6',       inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 5, reps: 5, weight: 100.0 }] (session exists, stale exercise se-uuid-001 removed)',           expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 6, ec: 'EC-7',       inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ id: "se-uuid-001", ... }, { exerciseId: "exercise-uuid-002", ... }] (session exists, se-uuid-002 stale and removed)',        expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 7, ec: 'EC-9',       inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (session exists, transaction fails with "DB connection lost")',                                                   expected: 'throws TransactionError("DB connection lost")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length',       testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
        { number: 2, condition: 'exercises length', testCase: 'length: 1 (one new exercise)' },
    ],
    bvaTcRows: [
        // ── ID length ────────────────────────────────────────────────────────
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no session with that ID), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                                   expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no session with that ID), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                                  expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (session exists with id: "a"), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                              expected: 'WorkoutSessionWithExercises returned with result.id: "a"' },
        // ── exercises length ─────────────────────────────────────────────────
        { noTc: 4, bva: 'BVA-2 (l=1)', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0 }] (session exists)', expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1, EC-3', fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (session exists, new exercises, transaction succeeds)',                                                           expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length: 1, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 2,  fromEc: 'EC-4',       fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [] (empty array)',                                                                                                               expected: 'throws WorkoutSessionRequiresExercisesError("A workout session must include at least one exercise.")' },
        { noTc: 3,  fromEc: 'EC-2',       fromBva: '', inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (no session with that ID)',                                                                                   expected: 'throws NotFoundError("Workout session not found")' },
        { noTc: 4,  fromEc: 'EC-5',       fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ id: "se-uuid-001", exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0 }] (session exists, exercise se-uuid-001 exists)', expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result.exercises.length: 1, result.exercises[0].sets: 4' },
        { noTc: 5,  fromEc: 'EC-6',       fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 5, reps: 5, weight: 100.0 }] (session exists, stale exercise se-uuid-001 removed)',           expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 6,  fromEc: 'EC-7',       fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ id: "se-uuid-001", ... }, { exerciseId: "exercise-uuid-002", ... }] (session exists, se-uuid-002 stale and removed)',        expected: 'WorkoutSessionWithExercises returned with result.id: SESSION_ID, result equal to MOCK_SESSION_WITH_EXERCISES' },
        { noTc: 7,  fromEc: 'EC-9',       fromBva: '', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (session exists, transaction fails with "DB connection lost")',                                                   expected: 'throws TransactionError("DB connection lost")' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "" (no session with that ID), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                                 expected: 'throws NotFoundError' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (no session with that ID), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                                expected: 'throws NotFoundError' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (session exists with id: "a"), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',                                            expected: 'WorkoutSessionWithExercises returned with result.id: "a"' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0 }] (session exists)', expected: 'WorkoutSessionWithExercises returned with result.exercises.length: 1, result.exercises[0].exerciseId: EXERCISE_ID' },
    ],
};

const wsDeleteBbt: BbtDescriptor = {
    reqId: 'REPO-24',
    tcCount: 5,
    statement: 'WorkoutSessionRepository.delete(id) – Deletes an existing workout session by ID. Returns void on success. Throws NotFoundError("Workout session not found") if no session exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'Database is accessible. A workout session with the given ID may or may not exist.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves to undefined (void). On failure: NotFoundError("Workout session not found") thrown.',
    ecRows: [
        { number: 1, condition: 'Session existence', validEc: 'Existing ID → resolves void', invalidEc: '' },
        { number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError("Workout session not found")' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'id: SESSION_ID (session exists)',               expected: 'resolves void' },
        { noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID (no session with that ID)',  expected: 'throws NotFoundError("Workout session not found")' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: "" (no session with that ID)',                    expected: 'throws NotFoundError' },
        { noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no session with that ID)',                   expected: 'throws NotFoundError' },
        { noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (session exists with id: "a")',               expected: 'resolves void' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',    inputData: 'id: SESSION_ID (session exists)',              expected: 'resolves void' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',    inputData: 'id: NONEXISTENT_ID (no session with that ID)', expected: 'throws NotFoundError("Workout session not found")' },
        { noTc: 3, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "" (no session with that ID)',           expected: 'throws NotFoundError' },
        { noTc: 4, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (no session with that ID)',          expected: 'throws NotFoundError' },
        { noTc: 5, fromEc: '',     fromBva: 'BVA-1', inputData: 'id: "a" (session exists with id: "a")',      expected: 'resolves void' },
    ],
};

// ── main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const USER_REPO = path.join(REPO_BASE, 'user-repository');
  const EXM_REPO  = path.join(REPO_BASE, 'exercise-repository');
  const WS_REPO   = path.join(REPO_BASE, 'workout-session-repository');

  console.log('Generating user-repository BBT forms…');
  await writeBbt(createMemberBbt,   path.join(USER_REPO, 'createMember-bbt-form.xlsx'));
  await writeBbt(createAdminBbt,    path.join(USER_REPO, 'createAdmin-bbt-form.xlsx'));
  await writeBbt(findByIdBbt,       path.join(USER_REPO, 'findById-bbt-form.xlsx'));
  await writeBbt(findMemberByIdBbt, path.join(USER_REPO, 'findMemberById-bbt-form.xlsx'));
  await writeBbt(findAdminByIdBbt,  path.join(USER_REPO, 'findAdminById-bbt-form.xlsx'));
  await writeBbt(findByEmailBbt,    path.join(USER_REPO, 'findByEmail-bbt-form.xlsx'));
  await writeBbt(findMembersBbt,    path.join(USER_REPO, 'findMembers-bbt-form.xlsx'));
  await writeBbt(findAdminsBbt,     path.join(USER_REPO, 'findAdmins-bbt-form.xlsx'));
  await writeBbt(updateMemberBbt,   path.join(USER_REPO, 'updateMember-bbt-form.xlsx'));
  await writeBbt(setMemberActiveBbt,path.join(USER_REPO, 'setMemberActive-bbt-form.xlsx'));
  await writeBbt(updateAdminBbt,    path.join(USER_REPO, 'updateAdmin-bbt-form.xlsx'));
  await writeBbt(deleteUserBbt,     path.join(USER_REPO, 'delete-bbt-form.xlsx'));

  console.log('Generating exercise-repository BBT forms…');
  await writeBbt(exerciseCreateBbt,   path.join(EXM_REPO, 'create-bbt-form.xlsx'));
  await writeBbt(exerciseFindByIdBbt, path.join(EXM_REPO, 'findById-bbt-form.xlsx'));
  await writeBbt(exerciseFindAllBbt,  path.join(EXM_REPO, 'findAll-bbt-form.xlsx'));
  await writeBbt(exerciseUpdateBbt,   path.join(EXM_REPO, 'update-bbt-form.xlsx'));
  await writeBbt(exerciseSetActiveBbt,path.join(EXM_REPO, 'setActive-bbt-form.xlsx'));
  await writeBbt(exerciseDeleteBbt,   path.join(EXM_REPO, 'delete-bbt-form.xlsx'));

  console.log('Generating workout-session-repository BBT forms…');
  await writeBbt(wsCreateBbt,              path.join(WS_REPO, 'create-bbt-form.xlsx'));
  await writeBbt(wsFindByIdBbt,            path.join(WS_REPO, 'findById-bbt-form.xlsx'));
  await writeBbt(wsFindAllBbt,             path.join(WS_REPO, 'findAll-bbt-form.xlsx'));
  await writeBbt(wsUpdateBbt,              path.join(WS_REPO, 'update-bbt-form.xlsx'));
  await writeBbt(wsUpdateWithExercisesBbt, path.join(WS_REPO, 'updateWithExercises-bbt-form.xlsx'));
  await writeBbt(wsDeleteBbt,              path.join(WS_REPO, 'delete-bbt-form.xlsx'));

  console.log('\nDone — 24 BBT forms generated.');
}

main().catch(console.error);
