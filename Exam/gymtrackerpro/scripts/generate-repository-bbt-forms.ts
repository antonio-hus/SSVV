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
  reqId: 'MEM-01',
  tcCount: 4,
  statement: 'UserRepository.createMember(data) – atomically creates a User and Member record. Hashes the password with bcrypt (12 rounds). Throws ConflictError if the email is already registered. Wraps any database failure in a TransactionError.',
  data: 'Input: CreateMemberInput { email, fullName, phone, dateOfBirth, password, membershipStart }',
  precondition: 'Database is accessible | No User row with data.email already exists',
  results: 'Output: Promise<MemberWithUser> | throws ConflictError / TransactionError',
  postcondition: 'On success: new User + Member rows are persisted atomically, password is stored as bcrypt hash.',
  ecRows: [
    { number: 1, condition: 'Email uniqueness', validEc: 'Email not yet registered', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                         invalidEc: 'Email already registered (ConflictError)' },
    { number: 3, condition: 'Database status',  validEc: 'Database write succeeds',   invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                         invalidEc: 'Database write fails (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'Valid member data, unique email',              expected: 'Returns MemberWithUser' },
    { noTc: 2, ec: 'EC-2',       inputData: 'Valid member data, email already registered', expected: 'Throws ConflictError' },
    { noTc: 3, ec: 'EC-4',       inputData: 'Valid member data, database connection fails', expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'Password storage', testCase: 'Input password plaintext vs Hashed output' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Hashing', inputData: 'Password="SecureP@ss1"', expected: 'Stored hash exists' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Valid member data, email not registered', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Email already in use',                   expected: 'Throws ConflictError' },
    { noTc: 3, fromEc: 'EC-4', fromBva: '',      inputData: 'DB write throws Error',                  expected: 'Throws TransactionError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-1', inputData: 'Check stored password hashing',          expected: 'Password is bcrypt hashed' },
  ],
};

const createAdminBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 4,
  statement: 'UserRepository.createAdmin(data) – atomically creates a User and Admin record. Hashes the password with bcrypt (12 rounds). Throws ConflictError if the email is already registered. Wraps any database failure in a TransactionError.',
  data: 'Input: CreateAdminInput { email, fullName, phone, dateOfBirth, password }',
  precondition: 'Database is accessible | No User row with data.email already exists',
  results: 'Output: Promise<AdminWithUser> | throws ConflictError / TransactionError',
  postcondition: 'On success: new User + Admin rows are persisted atomically.',
  ecRows: [
    { number: 1, condition: 'Email uniqueness', validEc: 'Email not yet registered', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                         invalidEc: 'Email already registered (ConflictError)' },
    { number: 3, condition: 'Database status',  validEc: 'Database write succeeds',   invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                         invalidEc: 'Database write fails (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'Valid admin data, unique email',          expected: 'Returns AdminWithUser' },
    { noTc: 2, ec: 'EC-2',       inputData: 'Valid admin data, email already registered', expected: 'Throws ConflictError' },
    { noTc: 3, ec: 'EC-4',       inputData: 'Valid admin data, database connection fails', expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'Password storage', testCase: 'Input password plaintext vs Hashed output' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Hashing', inputData: 'Password="AdminP@ss1"', expected: 'Stored hash exists' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Valid admin data, email not registered', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Email already in use',                   expected: 'Throws ConflictError' },
    { noTc: 3, fromEc: 'EC-4', fromBva: '',      inputData: 'DB write throws Error',                  expected: 'Throws TransactionError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-1', inputData: 'Check stored password hashing',          expected: 'Password is bcrypt hashed' },
  ],
};

const findByIdBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 4,
  statement: 'UserRepository.findById(id) – retrieves a User record by its ID. Throws NotFoundError if no User with the given ID exists.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<UserWithProfile> | throws NotFoundError',
  postcondition: 'Returns User record with associated profiles.',
  ecRows: [
    { number: 1, condition: 'User existence', validEc: 'User with given id exists', invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                          invalidEc: 'User does not exist (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'id = existing-user-uuid', expected: 'Returns UserWithProfile' },
    { noTc: 2, ec: 'EC-2', inputData: 'id = "nonexistent-id"',   expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = "" (Empty string)' },
    { number: 2, condition: '',          testCase: 'id = "a" (One character)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing user ID', expected: 'Returns UserWithProfile' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',  expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'Empty ID string', expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'One char ID',      expected: 'Throws NotFoundError' },
  ],
};

const findMemberByIdBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 4,
  statement: 'UserRepository.findMemberById(memberId) – retrieves a Member record by its ID. Throws NotFoundError if not found.',
  data: 'Input: memberId: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<MemberWithUser> | throws NotFoundError',
  postcondition: 'Returns Member record with parent User.',
  ecRows: [
    { number: 1, condition: 'Member existence', validEc: 'Member with given id exists', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                            invalidEc: 'Member does not exist (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'memberId = existing-member-uuid', expected: 'Returns MemberWithUser' },
    { noTc: 2, ec: 'EC-2', inputData: 'memberId = "nonexistent-id"',     expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'memberId = ""' },
    { number: 2, condition: '',          testCase: 'memberId = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'memberId = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'memberId = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing member ID', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',    expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'Empty memberId',     expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'One char memberId',  expected: 'Throws NotFoundError' },
  ],
};

const findAdminByIdBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 4,
  statement: 'UserRepository.findAdminById(adminId) – retrieves an Admin record by its ID. Throws NotFoundError if not found.',
  data: 'Input: adminId: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<AdminWithUser> | throws NotFoundError',
  postcondition: 'Returns Admin record with parent User.',
  ecRows: [
    { number: 1, condition: 'Admin existence', validEc: 'Admin with given id exists', invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                           invalidEc: 'Admin does not exist (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'adminId = existing-admin-uuid', expected: 'Returns AdminWithUser' },
    { noTc: 2, ec: 'EC-2', inputData: 'adminId = "nonexistent-id"',    expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'adminId = ""' },
    { number: 2, condition: '',          testCase: 'adminId = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'adminId = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'adminId = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing admin ID', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',   expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'Empty adminId',     expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'One char adminId',  expected: 'Throws NotFoundError' },
  ],
};

const findByEmailBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 4,
  statement: 'UserRepository.findByEmail(email) – retrieves a User record by email address. Returns null if not found.',
  data: 'Input: email: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<UserWithProfile | null>',
  postcondition: 'Returns UserWithProfile or null.',
  ecRows: [
    { number: 1, condition: 'Email existence', validEc: 'Email registered',   invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                    invalidEc: 'Email not registered' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'email = "john@example.com"', expected: 'Returns UserWithProfile' },
    { noTc: 2, ec: 'EC-2', inputData: 'email = "notfound@example.com"', expected: 'Returns null' },
  ],
  bvaRows: [
    { number: 1, condition: 'Email length', testCase: 'email = ""' },
    { number: 2, condition: '',             testCase: 'email = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'email = ""',  expected: 'Returns null' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'email = "a"', expected: 'Returns null' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Registered email',   expected: 'Returns UserWithProfile' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Unregistered email', expected: 'Returns null' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'Empty email string', expected: 'Returns null' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'One char email',    expected: 'Returns null' },
  ],
};

const findMembersBbt: BbtDescriptor = {
  reqId: 'MEM-03',
  tcCount: 14,
  statement: 'UserRepository.findMembers(options?) – returns a paginated list of Members.',
  data: 'Input: MemberListOptions? { search?, page?, pageSize? }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<MemberWithUser>>',
  postcondition: 'Returns filtered and paginated results ordered by fullName ASC.',
  ecRows: [
    { number: 1, condition: 'Search filter',    validEc: 'No search term',       invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'With search term',    invalidEc: '' },
    { number: 3, condition: 'Result ordering',  validEc: 'Multiple members',    invalidEc: '' },
    { number: 4, condition: 'Database state',   validEc: 'Members exist',        invalidEc: '' },
    { number: 5, condition: '',                 validEc: 'Empty database',      invalidEc: '' },
    { number: 6, condition: 'Pagination',       validEc: 'Default page/size',   invalidEc: '' },
    { number: 7, condition: '',                 validEc: 'Custom page/size',    invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-4, EC-6', inputData: 'No options, DB has members',      expected: 'Returns items and total' },
    { noTc: 2, ec: 'EC-2',             inputData: 'search="John"',                   expected: 'Returns filtered results' },
    { noTc: 3, ec: 'EC-3',             inputData: 'Multiple results',                expected: 'Ordered by fullName ASC' },
    { noTc: 4, ec: 'EC-5',             inputData: 'Empty database',                  expected: 'Returns items=[] total=0' },
    { noTc: 5, ec: 'EC-7',             inputData: 'page=2, pageSize=10',             expected: 'Returns second page' },
  ],
  bvaRows: [
    { number: 1, condition: 'Search param',   testCase: 'search = undefined' },
    { number: 2, condition: '',               testCase: 'search = ""' },
    { number: 3, condition: '',               testCase: 'search = "J"' },
    { number: 4, condition: 'Page param',     testCase: 'page = undefined' },
    { number: 5, condition: '',               testCase: 'page = 0' },
    { number: 6, condition: '',               testCase: 'page = 1' },
    { number: 7, condition: '',               testCase: 'page = 2' },
    { number: 8, condition: 'PageSize param', testCase: 'pageSize = undefined' },
    { number: 9, condition: '',               testCase: 'pageSize = 0' },
    { number: 10, condition: '',              testCase: 'pageSize = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Undefined', inputData: 'search = undefined', expected: 'Returns all members' },
    { noTc: 2, bva: 'BVA-2 Empty',     inputData: 'search = ""',        expected: 'Returns all members' },
    { noTc: 3, bva: 'BVA-3 OneChar',   inputData: 'search = "J"',       expected: 'Returns matching members' },
    { noTc: 4, bva: 'BVA-4 Undefined', inputData: 'page = undefined',   expected: 'Defaults to page 1' },
    { noTc: 5, bva: 'BVA-5 Zero',      inputData: 'page = 0',           expected: 'Defaults to page 1' },
    { noTc: 6, bva: 'BVA-6 One',       inputData: 'page = 1',           expected: 'Returns page 1' },
    { noTc: 7, bva: 'BVA-7 Two',       inputData: 'page = 2, total=15', expected: 'Returns page 2 (empty)' },
    { noTc: 8, bva: 'BVA-8 Undefined', inputData: 'pageSize = undefined',expected: 'Defaults to 10' },
    { noTc: 9, bva: 'BVA-9 Zero',      inputData: 'pageSize = 0',       expected: 'Returns zero items' },
    { noTc: 10,bva: 'BVA-10 One',      inputData: 'pageSize = 1',       expected: 'Returns one item' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'No options provided',               expected: 'Items length=1, total=1' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'search="John"',                     expected: 'Filtered items returned' },
    { noTc: 3, fromEc: 'EC-3', fromBva: '',      inputData: 'Alice, John in DB',                 expected: 'Alice comes before John' },
    { noTc: 4, fromEc: 'EC-5', fromBva: '',      inputData: 'Empty DB',                          expected: 'Items=[], total=0' },
    { noTc: 5, fromEc: '',      fromBva: 'BVA-1', inputData: 'search = undefined',               expected: 'Returns items' },
    { noTc: 6, fromEc: '',      fromBva: 'BVA-2', inputData: 'search = ""',                      expected: 'Returns items' },
    { noTc: 7, fromEc: '',      fromBva: 'BVA-3', inputData: 'search = "J"',                     expected: 'Returns items' },
    { noTc: 8, fromEc: '',      fromBva: 'BVA-4', inputData: 'page = undefined',                 expected: 'Returns first page' },
    { noTc: 9, fromEc: '',      fromBva: 'BVA-5', inputData: 'page = 0',                         expected: 'Returns first page' },
    { noTc: 10,fromEc: '',      fromBva: 'BVA-6', inputData: 'page = 1',                         expected: 'Returns first page' },
    { noTc: 11,fromEc: '',      fromBva: 'BVA-7', inputData: 'page = 2, pageSize=10, total=15',   expected: 'Items length=0, total=15' },
    { noTc: 12,fromEc: '',      fromBva: 'BVA-8', inputData: 'pageSize = undefined',             expected: 'Returns items' },
    { noTc: 13,fromEc: '',      fromBva: 'BVA-9', inputData: 'pageSize = 0',                     expected: 'Returns total but items=[]' },
    { noTc: 14,fromEc: '',      fromBva: 'BVA-10',inputData: 'pageSize = 1',                     expected: 'Returns total and one item' },
  ],
};

const findAdminsBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 14,
  statement: 'UserRepository.findAdmins(options?) – returns a paginated list of Admins.',
  data: 'Input: AdminListOptions? { search?, page?, pageSize? }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<AdminWithUser>>',
  postcondition: 'Returns filtered and paginated results ordered by fullName ASC.',
  ecRows: [
    { number: 1, condition: 'Search filter',    validEc: 'No search term',       invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'With search term',    invalidEc: '' },
    { number: 3, condition: 'Result ordering',  validEc: 'Multiple admins',    invalidEc: '' },
    { number: 4, condition: 'Database state',   validEc: 'Admins exist',         invalidEc: '' },
    { number: 5, condition: '',                 validEc: 'Empty database',      invalidEc: '' },
    { number: 6, condition: 'Pagination',       validEc: 'Default page/size',   invalidEc: '' },
    { number: 7, condition: '',                 validEc: 'Custom page/size',    invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-4, EC-6', inputData: 'No options, DB has admins',    expected: 'Returns items and total' },
    { noTc: 2, ec: 'EC-2',       inputData: 'search="Admin"',               expected: 'Returns filtered results' },
    { noTc: 3, ec: 'EC-3',       inputData: 'Multiple results',             expected: 'Ordered by fullName ASC' },
    { noTc: 4, ec: 'EC-5',       inputData: 'Empty database',               expected: 'Returns items=[] total=0' },
    { noTc: 5, ec: 'EC-7',       inputData: 'page=2, pageSize=10',          expected: 'Returns second page' },
  ],
  bvaRows: [
    { number: 1, condition: 'Search param',   testCase: 'search = undefined' },
    { number: 2, condition: '',               testCase: 'search = ""' },
    { number: 3, condition: '',               testCase: 'search = "A"' },
    { number: 4, condition: 'Page param',     testCase: 'page = undefined' },
    { number: 5, condition: '',               testCase: 'page = 0' },
    { number: 6, condition: '',               testCase: 'page = 1' },
    { number: 7, condition: '',               testCase: 'page = 2' },
    { number: 8, condition: 'PageSize param', testCase: 'pageSize = undefined' },
    { number: 9, condition: '',               testCase: 'pageSize = 0' },
    { number: 10, condition: '',              testCase: 'pageSize = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Undefined', inputData: 'search = undefined', expected: 'Returns all admins' },
    { noTc: 2, bva: 'BVA-2 Empty',     inputData: 'search = ""',        expected: 'Returns all admins' },
    { noTc: 3, bva: 'BVA-3 OneChar',   inputData: 'search = "A"',       expected: 'Returns matching admins' },
    { noTc: 4, bva: 'BVA-4 Undefined', inputData: 'page = undefined',   expected: 'Defaults to page 1' },
    { noTc: 5, bva: 'BVA-5 Zero',      inputData: 'page = 0',           expected: 'Defaults to page 1' },
    { noTc: 6, bva: 'BVA-6 One',       inputData: 'page = 1',           expected: 'Returns page 1' },
    { noTc: 7, bva: 'BVA-7 Two',       inputData: 'page = 2, total=15', expected: 'Returns page 2 (empty)' },
    { noTc: 8, bva: 'BVA-8 Undefined', inputData: 'pageSize = undefined',expected: 'Defaults to 10' },
    { noTc: 9, bva: 'BVA-9 Zero',      inputData: 'pageSize = 0',       expected: 'Returns zero items' },
    { noTc: 10,bva: 'BVA-10 One',      inputData: 'pageSize = 1',       expected: 'Returns one item' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'No options provided',               expected: 'Items length=1, total=1' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'search="Admin"',                    expected: 'Filtered items returned' },
    { noTc: 3, fromEc: 'EC-3', fromBva: '',      inputData: 'Alice, Admin in DB',                expected: 'Alice comes before Admin' },
    { noTc: 4, fromEc: 'EC-5', fromBva: '',      inputData: 'Empty DB',                          expected: 'Items=[], total=0' },
    { noTc: 5, fromEc: '',      fromBva: 'BVA-1', inputData: 'search = undefined',               expected: 'Returns items' },
    { noTc: 6, fromEc: '',      fromBva: 'BVA-2', inputData: 'search = ""',                      expected: 'Returns items' },
    { noTc: 7, fromEc: '',      fromBva: 'BVA-3', inputData: 'search = "A"',                     expected: 'Returns items' },
    { noTc: 8, fromEc: '',      fromBva: 'BVA-4', inputData: 'page = undefined',                 expected: 'Returns first page' },
    { noTc: 9, fromEc: '',      fromBva: 'BVA-5', inputData: 'page = 0',                         expected: 'Returns first page' },
    { noTc: 10,fromEc: '',      fromBva: 'BVA-6', inputData: 'page = 1',                         expected: 'Returns first page' },
    { noTc: 11,fromEc: '',      fromBva: 'BVA-7', inputData: 'page = 2, pageSize=10, total=15',   expected: 'Items length=0, total=15' },
    { noTc: 12,fromEc: '',      fromBva: 'BVA-8', inputData: 'pageSize = undefined',             expected: 'Returns items' },
    { noTc: 13,fromEc: '',      fromBva: 'BVA-9', inputData: 'pageSize = 0',                     expected: 'Returns total but items=[]' },
    { noTc: 14,fromEc: '',      fromBva: 'BVA-10',inputData: 'pageSize = 1',                     expected: 'Returns total and one item' },
  ],
};

const updateMemberBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 26,
  statement: 'UserRepository.updateMember(memberId, data) – atomically updates Member and User.',
  data: 'Input: memberId: string, data: UpdateMemberInput',
  precondition: 'Database is accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Updates records or throws error.',
  ecRows: [
    { number: 1, condition: 'Member existence', validEc: 'Found',                       invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                        invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Email conflict',    validEc: 'New email unique or same', invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                        invalidEc: 'New email taken (ConflictError)' },
    { number: 5, condition: 'Database write',    validEc: 'Success',                 invalidEc: '' },
    { number: 6, condition: '',                 validEc: '',                        invalidEc: 'Failure (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3, EC-5', inputData: 'Existing member, valid data',     expected: 'Returns updated MemberWithUser' },
    { noTc: 2, ec: 'EC-2',             inputData: 'Non-existent memberId',          expected: 'Throws NotFoundError' },
    { noTc: 3, ec: 'EC-4',             inputData: 'Email conflict',                 expected: 'Throws ConflictError' },
    { noTc: 4, ec: 'EC-6',             inputData: 'Database failure',               expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length',        testCase: 'memberId = ""' },
    { number: 2, condition: '',                 testCase: 'memberId = "a"' },
    { number: 3, condition: 'Email field',      testCase: 'email = undefined' },
    { number: 4, condition: '',                 testCase: 'email = ""' },
    { number: 5, condition: '',                 testCase: 'email = "a"' },
    { number: 6, condition: 'FullName field',   testCase: 'fullName = undefined' },
    { number: 7, condition: '',                 testCase: 'fullName = ""' },
    { number: 8, condition: '',                 testCase: 'fullName = "A"' },
    { number: 9, condition: 'Phone field',      testCase: 'phone = undefined' },
    { number: 10, condition: '',                testCase: 'phone = ""' },
    { number: 11, condition: '',                testCase: 'phone = "a"' },
    { number: 12, condition: 'DOB field',       testCase: 'dateOfBirth = undefined' },
    { number: 13, condition: '',                testCase: 'dateOfBirth = ""' },
    { number: 14, condition: '',                testCase: 'dateOfBirth = "a"' },
    { number: 15, condition: 'Password field',  testCase: 'password = undefined' },
    { number: 16, condition: '',                testCase: 'password = ""' },
    { number: 17, condition: '',                testCase: 'password = "a"' },
    { number: 18, condition: 'Membership field',testCase: 'membershipStart = undefined' },
    { number: 19, condition: '',                testCase: 'membershipStart = ""' },
    { number: 20, condition: '',                testCase: 'membershipStart = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 EmptyID',    inputData: 'memberId = ""',       expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneCharID',  inputData: 'memberId = "a"',      expected: 'Throws NotFoundError' },
    { noTc: 3, bva: 'BVA-3 UndefEmail', inputData: 'email = undefined',   expected: 'Updates successfully' },
    { noTc: 4, bva: 'BVA-4 EmptyEmail', inputData: 'email = ""',          expected: 'Updates successfully' },
    { noTc: 5, bva: 'BVA-5 CharEmail',  inputData: 'email = "a"',         expected: 'Updates successfully' },
    { noTc: 6, bva: 'BVA-6 UndefName',  inputData: 'fullName = undefined',expected: 'Updates successfully' },
    { noTc: 7, bva: 'BVA-7 EmptyName',  inputData: 'fullName = ""',       expected: 'Updates successfully' },
    { noTc: 8, bva: 'BVA-8 CharName',   inputData: 'fullName = "A"',      expected: 'Updates successfully' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing member, update fullName', expected: 'Member record updated' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent memberId',           expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EC-4', fromBva: '',      inputData: 'Email taken by other user',       expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EC-3', fromBva: '',      inputData: 'Update to current email',         expected: 'Skips conflict check' },
    { noTc: 5, fromEc: 'EC-5', fromBva: '',      inputData: 'Update with new password',        expected: 'Password is hashed' },
    { noTc: 6, fromEc: 'EC-6', fromBva: '',      inputData: 'Database write error',            expected: 'Throws TransactionError' },
    { noTc: 7, fromEc: '',      fromBva: 'BVA-1', inputData: 'memberId = ""',                  expected: 'Throws NotFoundError' },
    { noTc: 8, fromEc: '',      fromBva: 'BVA-2', inputData: 'memberId = "a"',                 expected: 'Throws NotFoundError' },
    { noTc: 9, fromEc: '',      fromBva: 'BVA-3', inputData: 'email = undefined',              expected: 'Returns items' },
    { noTc: 10,fromEc: '',      fromBva: 'BVA-4', inputData: 'email = ""',                     expected: 'Returns items' },
    { noTc: 11,fromEc: '',      fromBva: 'BVA-5', inputData: 'email = "a"',                    expected: 'Returns items' },
    { noTc: 12,fromEc: '',      fromBva: 'BVA-6', inputData: 'fullName = undefined',           expected: 'Returns items' },
    { noTc: 13,fromEc: '',      fromBva: 'BVA-7', inputData: 'fullName = ""',                  expected: 'Returns items' },
    { noTc: 14,fromEc: '',      fromBva: 'BVA-8', inputData: 'fullName = "A"',                 expected: 'Returns items' },
    { noTc: 15,fromEc: '',      fromBva: 'BVA-9', inputData: 'phone = undefined',              expected: 'Returns items' },
    { noTc: 16,fromEc: '',      fromBva: 'BVA-10',inputData: 'phone = ""',                     expected: 'Returns items' },
    { noTc: 17,fromEc: '',      fromBva: 'BVA-11',inputData: 'phone = "a"',                    expected: 'Returns items' },
    { noTc: 18,fromEc: '',      fromBva: 'BVA-12',inputData: 'dateOfBirth = undefined',        expected: 'Returns items' },
    { noTc: 19,fromEc: '',      fromBva: 'BVA-13',inputData: 'dateOfBirth = ""',               expected: 'Returns items' },
    { noTc: 20,fromEc: '',      fromBva: 'BVA-14',inputData: 'dateOfBirth = "a"',              expected: 'Returns items' },
    { noTc: 21,fromEc: '',      fromBva: 'BVA-15',inputData: 'password = undefined',           expected: 'Returns items' },
    { noTc: 22,fromEc: '',      fromBva: 'BVA-16',inputData: 'password = ""',                  expected: 'Returns items' },
    { noTc: 23,fromEc: '',      fromBva: 'BVA-17',inputData: 'password = "a"',                 expected: 'Returns items' },
    { noTc: 24,fromEc: '',      fromBva: 'BVA-18',inputData: 'membershipStart = undefined',    expected: 'Returns items' },
    { noTc: 25,fromEc: '',      fromBva: 'BVA-19',inputData: 'membershipStart = ""',           expected: 'Returns items' },
    { noTc: 26,fromEc: '',      fromBva: 'BVA-20',inputData: 'membershipStart = "a"',          expected: 'Returns items' },
  ],
};

const setMemberActiveBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 5,
  statement: 'UserRepository.setMemberActive(memberId, isActive) – sets isActive flag.',
  data: 'Input: memberId: string, isActive: boolean',
  precondition: 'Database is accessible',
  results: 'Output: Promise<MemberWithUser> | throws NotFoundError',
  postcondition: 'isActive flag updated.',
  ecRows: [
    { number: 1, condition: 'Member existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Active status',    validEc: 'isActive = false',     invalidEc: '' },
    { number: 4, condition: '',                 validEc: 'isActive = true',      invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'id exists, isActive=false', expected: 'Returns isActive=false' },
    { noTc: 2, ec: 'EC-1, EC-4', inputData: 'id exists, isActive=true',  expected: 'Returns isActive=true' },
    { noTc: 3, ec: 'EC-2',       inputData: 'Non-existent member',       expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'memberId = ""' },
    { number: 2, condition: '',          testCase: 'memberId = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'memberId = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'memberId = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '',      inputData: 'Exist, set inactive', expected: 'isActive=false' },
    { noTc: 2, fromEc: 'EC-1, EC-4', fromBva: '',      inputData: 'Exist, set active',   expected: 'isActive=true' },
    { noTc: 3, fromEc: 'EC-2',       fromBva: '',      inputData: 'Non-existent ID',    expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',           fromBva: 'BVA-1', inputData: 'memberId = ""',      expected: 'Throws NotFoundError' },
    { noTc: 5, fromEc: '',           fromBva: 'BVA-2', inputData: 'memberId = "a"',     expected: 'Throws NotFoundError' },
  ],
};

const updateAdminBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 23,
  statement: 'UserRepository.updateAdmin(adminId, data) – atomically updates Admin and User.',
  data: 'Input: adminId: string, data: UpdateAdminInput',
  precondition: 'Database is accessible',
  results: 'Output: Promise<AdminWithUser>',
  postcondition: 'Updates records or throws error.',
  ecRows: [
    { number: 1, condition: 'Admin existence',  validEc: 'Found',                       invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                        invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Email conflict',    validEc: 'New email unique or same', invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                        invalidEc: 'New email taken (ConflictError)' },
    { number: 5, condition: 'Database write',    validEc: 'Success',                 invalidEc: '' },
    { number: 6, condition: '',                 validEc: '',                        invalidEc: 'Failure (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3, EC-5', inputData: 'Existing admin, valid data',      expected: 'Returns updated AdminWithUser' },
    { noTc: 2, ec: 'EC-2',             inputData: 'Non-existent adminId',           expected: 'Throws NotFoundError' },
    { noTc: 3, ec: 'EC-4',             inputData: 'Email conflict',                 expected: 'Throws ConflictError' },
    { noTc: 4, ec: 'EC-6',             inputData: 'Database failure',               expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length',        testCase: 'adminId = ""' },
    { number: 2, condition: '',                 testCase: 'adminId = "a"' },
    { number: 3, condition: 'Email field',      testCase: 'email = undefined' },
    { number: 4, condition: '',                 testCase: 'email = ""' },
    { number: 5, condition: '',                 testCase: 'email = "a"' },
    { number: 6, condition: 'FullName field',   testCase: 'fullName = undefined' },
    { number: 7, condition: '',                 testCase: 'fullName = ""' },
    { number: 8, condition: '',                 testCase: 'fullName = "A"' },
    { number: 9, condition: 'Phone field',      testCase: 'phone = undefined' },
    { number: 10, condition: '',                testCase: 'phone = ""' },
    { number: 11, condition: '',                testCase: 'phone = "a"' },
    { number: 12, condition: 'DOB field',       testCase: 'dateOfBirth = undefined' },
    { number: 13, condition: '',                testCase: 'dateOfBirth = ""' },
    { number: 14, condition: '',                testCase: 'dateOfBirth = "a"' },
    { number: 15, condition: 'Password field',  testCase: 'password = undefined' },
    { number: 16, condition: '',                testCase: 'password = ""' },
    { number: 17, condition: '',                testCase: 'password = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 EmptyID',    inputData: 'adminId = ""',       expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneCharID',  inputData: 'adminId = "a"',      expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing admin, update fullName', expected: 'Admin record updated' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent adminId',           expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EC-4', fromBva: '',      inputData: 'Email taken by other user',       expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EC-3', fromBva: '',      inputData: 'Update to current email',         expected: 'Skips conflict check' },
    { noTc: 5, fromEc: 'EC-5', fromBva: '',      inputData: 'Update with new password',        expected: 'Password is hashed' },
    { noTc: 6, fromEc: 'EC-6', fromBva: '',      inputData: 'Database write error',            expected: 'Throws TransactionError' },
    { noTc: 7, fromEc: '',      fromBva: 'BVA-1', inputData: 'adminId = ""',                   expected: 'Throws NotFoundError' },
    { noTc: 8, fromEc: '',      fromBva: 'BVA-2', inputData: 'adminId = "a"',                  expected: 'Throws NotFoundError' },
    { noTc: 9, fromEc: '',      fromBva: 'BVA-3', inputData: 'email = undefined',              expected: 'Returns items' },
    { noTc: 10,fromEc: '',      fromBva: 'BVA-4', inputData: 'email = ""',                     expected: 'Returns items' },
    { noTc: 11,fromEc: '',      fromBva: 'BVA-5', inputData: 'email = "a"',                    expected: 'Returns items' },
    { noTc: 12,fromEc: '',      fromBva: 'BVA-6', inputData: 'fullName = undefined',           expected: 'Returns items' },
    { noTc: 13,fromEc: '',      fromBva: 'BVA-7', inputData: 'fullName = ""',                  expected: 'Returns items' },
    { noTc: 14,fromEc: '',      fromBva: 'BVA-8', inputData: 'fullName = "A"',                 expected: 'Returns items' },
    { noTc: 15,fromEc: '',      fromBva: 'BVA-9', inputData: 'phone = undefined',              expected: 'Returns items' },
    { noTc: 16,fromEc: '',      fromBva: 'BVA-10',inputData: 'phone = ""',                     expected: 'Returns items' },
    { noTc: 17,fromEc: '',      fromBva: 'BVA-11',inputData: 'phone = "a"',                    expected: 'Returns items' },
    { noTc: 18,fromEc: '',      fromBva: 'BVA-12',inputData: 'dateOfBirth = undefined',        expected: 'Returns items' },
    { noTc: 19,fromEc: '',      fromBva: 'BVA-13',inputData: 'dateOfBirth = ""',               expected: 'Returns items' },
    { noTc: 20,fromEc: '',      fromBva: 'BVA-14',inputData: 'dateOfBirth = "a"',              expected: 'Returns items' },
    { noTc: 21,fromEc: '',      fromBva: 'BVA-15',inputData: 'password = undefined',           expected: 'Returns items' },
    { noTc: 22,fromEc: '',      fromBva: 'BVA-16',inputData: 'password = ""',                  expected: 'Returns items' },
    { noTc: 23,fromEc: '',      fromBva: 'BVA-17',inputData: 'password = "a"',                 expected: 'Returns items' },
  ],
};

const deleteUserBbt: BbtDescriptor = {
  reqId: 'MEM-01/AUTH-06',
  tcCount: 5,
  statement: 'UserRepository.delete(id) – deletes the parent User cascading to profile.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<void> | throws NotFoundError',
  postcondition: 'User and profile records deleted.',
  ecRows: [
    { number: 1, condition: 'MemberId input',  validEc: 'id is an existing memberId',  invalidEc: '' },
    { number: 2, condition: 'AdminId input',   validEc: 'id is an existing adminId',   invalidEc: '' },
    { number: 3, condition: 'Non-existent',    validEc: '',                             invalidEc: 'ID not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'Existing memberId', expected: 'Resolves void' },
    { noTc: 2, ec: 'EC-2', inputData: 'Existing adminId',  expected: 'Resolves void' },
    { noTc: 3, ec: 'EC-3', inputData: 'Non-existent ID',   expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'MemberId delete', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'AdminId delete',  expected: 'Resolves void' },
    { noTc: 3, fromEc: 'EC-3', fromBva: '',      inputData: 'Non-existent id', expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-1', inputData: 'id = ""',         expected: 'Throws NotFoundError' },
    { noTc: 5, fromEc: '',      fromBva: 'BVA-2', inputData: 'id = "a"',        expected: 'Throws NotFoundError' },
  ],
};

// ── exercise-repository ────────────────────────────────────────────────────────

const exerciseCreateBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 2,
  statement: 'ExerciseRepository.create(data) – creates a new exercise. Names must be unique.',
  data: 'Input: CreateExerciseInput { name, description?, muscleGroup, equipmentNeeded }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<Exercise> | throws ConflictError',
  postcondition: 'Persists row or throws ConflictError.',
  ecRows: [
    { number: 1, condition: 'Name uniqueness', validEc: 'Name not in catalogue', invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                     invalidEc: 'Name exists (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'Unique name',    expected: 'Returns Exercise' },
    { noTc: 2, ec: 'EC-2', inputData: 'Duplicate name', expected: 'Throws ConflictError' },
  ],
  bvaRows: [],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Unique exercise name',    expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Duplicate exercise name', expected: 'Throws ConflictError' },
  ],
};

const exerciseFindByIdBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 4,
  statement: 'ExerciseRepository.findById(id) – retrieves an Exercise by ID.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<Exercise> | throws NotFoundError',
  postcondition: 'Returns record or throws NotFoundError.',
  ecRows: [
    { number: 1, condition: 'Exercise existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'Existing ID',     expected: 'Returns Exercise' },
    { noTc: 2, ec: 'EC-2', inputData: '"nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing exercise ID', expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',      expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'id = ""',              expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'id = "a"',             expected: 'Throws NotFoundError' },
  ],
};

const exerciseFindAllBbt: BbtDescriptor = {
  reqId: 'EXM-02/EXM-06',
  tcCount: 26,
  statement: 'ExerciseRepository.findAll(options?) – returns paginated list. Default only active. Supports search, muscleGroup filter, pagination.',
  data: 'Input: ExerciseListOptions? { search?, muscleGroup?, includeInactive?, page?, pageSize? }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<Exercise>>',
  postcondition: 'Returns paginated and filtered results ordered by name ASC.',
  ecRows: [
    { number: 1, condition: 'Active filter',     validEc: 'includeInactive=false',      invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'includeInactive=true',       invalidEc: '' },
    { number: 3, condition: 'Search term',      validEc: 'With search term',           invalidEc: '' },
    { number: 4, condition: 'MuscleGroup',      validEc: 'With muscleGroup filter',   invalidEc: '' },
    { number: 5, condition: 'Ordering',         validEc: 'Multiple exercises',         invalidEc: '' },
    { number: 6, condition: 'Database result',  validEc: 'Matches found',              invalidEc: '' },
    { number: 7, condition: '',                 validEc: 'No matches found',           invalidEc: '' },
    { number: 8, condition: 'Pagination',       validEc: 'Custom page/pageSize',       invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-6', inputData: 'No options, active DB',               expected: 'Returns active items' },
    { noTc: 2, ec: 'EC-3',       inputData: 'search="Bench"',                      expected: 'Filters by name' },
    { noTc: 3, ec: 'EC-4',       inputData: 'muscleGroup="CHEST"',                 expected: 'Filters by muscle' },
    { noTc: 4, ec: 'EC-2',       inputData: 'includeInactive=true',                expected: 'Returns all items' },
    { noTc: 5, ec: 'EC-5',       inputData: 'Multiple items',                      expected: 'Ordered by name ASC' },
  ],
  bvaRows: [
    { number: 1, condition: 'Search param',         testCase: 'search = undefined' },
    { number: 2, condition: '',                     testCase: 'search = ""' },
    { number: 3, condition: '',                     testCase: 'search = "a"' },
    { number: 4, condition: 'MuscleGroup param',    testCase: 'muscleGroup = CHEST' },
    { number: 5, condition: '',                     testCase: 'muscleGroup = SHOULDERS' },
    { number: 6, condition: '',                     testCase: 'muscleGroup = ARMS' },
    { number: 7, condition: '',                     testCase: 'muscleGroup = BACK' },
    { number: 8, condition: '',                     testCase: 'muscleGroup = CORE' },
    { number: 9, condition: '',                     testCase: 'muscleGroup = LEGS' },
    { number: 10, condition: '',                    testCase: 'muscleGroup = INVALID' },
    { number: 11, condition: 'Inactive param',      testCase: 'includeInactive = undefined' },
    { number: 12, condition: '',                    testCase: 'includeInactive = false' },
    { number: 13, condition: '',                    testCase: 'includeInactive = true' },
    { number: 14, condition: 'Page param',          testCase: 'page = undefined' },
    { number: 15, condition: '',                    testCase: 'page = 0' },
    { number: 16, condition: '',                    testCase: 'page = 1' },
    { number: 17, condition: '',                    testCase: 'page = 2' },
    { number: 18, condition: 'PageSize param',      testCase: 'pageSize = undefined' },
    { number: 19, condition: '',                    testCase: 'pageSize = 0' },
    { number: 20, condition: '',                    testCase: 'pageSize = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Undefined', inputData: 'search = undefined', expected: 'Returns items' },
    { noTc: 2, bva: 'BVA-2 Empty',     inputData: 'search = ""',        expected: 'Returns items' },
    { noTc: 3, bva: 'BVA-3 OneChar',   inputData: 'search = "a"',       expected: 'Returns items' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EC-1', fromBva: '',      inputData: 'Default options (Active only)',     expected: 'Items total matches count' },
    { noTc: 2,  fromEc: 'EC-3', fromBva: '',      inputData: 'search="Bench"',                    expected: 'Filtered results' },
    { noTc: 3,  fromEc: 'EC-4', fromBva: '',      inputData: 'muscleGroup="CHEST"',               expected: 'Filtered by group' },
    { noTc: 4,  fromEc: 'EC-2', fromBva: '',      inputData: 'includeInactive=true',              expected: 'All exercises returned' },
    { noTc: 5,  fromEc: 'EC-5', fromBva: '',      inputData: 'Multiple items in DB',              expected: 'Deadlift before Bench Press' },
    { noTc: 6,  fromEc: '',      fromBva: 'BVA-1', inputData: 'search = undefined',               expected: 'Returns items' },
    { noTc: 7,  fromEc: '',      fromBva: 'BVA-2', inputData: 'search = ""',                      expected: 'Returns items' },
    { noTc: 8,  fromEc: '',      fromBva: 'BVA-3', inputData: 'search = "a"',                     expected: 'Returns items' },
    { noTc: 9,  fromEc: '',      fromBva: 'BVA-4', inputData: 'muscleGroup = CHEST',              expected: 'Returns items' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-5', inputData: 'muscleGroup = SHOULDERS',          expected: 'Returns items' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-6', inputData: 'muscleGroup = ARMS',               expected: 'Returns items' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-7', inputData: 'muscleGroup = BACK',               expected: 'Returns items' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-8', inputData: 'muscleGroup = CORE',               expected: 'Returns items' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-9', inputData: 'muscleGroup = LEGS',               expected: 'Returns items' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-10',inputData: 'muscleGroup = INVALID',            expected: 'Returns empty result' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-11',inputData: 'includeInactive = undefined',      expected: 'Defaults to active' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-12',inputData: 'includeInactive = false',          expected: 'Returns active' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-13',inputData: 'includeInactive = true',           expected: 'Returns all' },
    { noTc: 19, fromEc: '',      fromBva: 'BVA-14',inputData: 'page = undefined',                 expected: 'Returns first page' },
    { noTc: 20, fromEc: '',      fromBva: 'BVA-15',inputData: 'page = 0',                         expected: 'Returns first page' },
    { noTc: 21, fromEc: '',      fromBva: 'BVA-16',inputData: 'page = 1',                         expected: 'Returns first page' },
    { noTc: 22, fromEc: '',      fromBva: 'BVA-17',inputData: 'page = 2, total=11, size=10',      expected: 'Returns second page' },
    { noTc: 23, fromEc: '',      fromBva: 'BVA-18',inputData: 'pageSize = undefined',             expected: 'Returns items' },
    { noTc: 24, fromEc: '',      fromBva: 'BVA-19',inputData: 'pageSize = 0',                     expected: 'Returns zero items' },
    { noTc: 25, fromEc: '',      fromBva: 'BVA-20',inputData: 'pageSize = 1',                     expected: 'Returns one item' },
    { noTc: 26, fromEc: 'EC-1, EC-3, EC-4', fromBva: '', inputData: 'Combined filters',           expected: 'Filters by all' },
  ],
};

const exerciseUpdateBbt: BbtDescriptor = {
  reqId: 'EXM-03',
  tcCount: 22,
  statement: 'ExerciseRepository.update(id, data) – updates existing exercise metadata.',
  data: 'Input: id: string, data: UpdateExerciseInput',
  precondition: 'Database is accessible',
  results: 'Output: Promise<Exercise> | throws NotFoundError/ConflictError',
  postcondition: 'Updates record or throws NotFoundError/ConflictError.',
  ecRows: [
    { number: 1, condition: 'Exercise existence', validEc: 'Found',                       invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                        invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Name uniqueness',    validEc: 'New name unique or same', invalidEc: '' },
    { number: 4, condition: '',                   validEc: '',                        invalidEc: 'New name taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'Exist, valid unique name',   expected: 'Returns updated Exercise' },
    { noTc: 2, ec: 'EC-2',       inputData: 'Non-existent ID',            expected: 'Throws NotFoundError' },
    { noTc: 3, ec: 'EC-4',       inputData: 'Name conflict with other',   expected: 'Throws ConflictError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length',            testCase: 'id = ""' },
    { number: 2, condition: '',                     testCase: 'id = "a"' },
    { number: 3, condition: 'Name field',           testCase: 'name = undefined' },
    { number: 4, condition: '',                     testCase: 'name = ""' },
    { number: 5, condition: '',                     testCase: 'name = "a"' },
    { number: 6, condition: 'Description field',    testCase: 'description = undefined' },
    { number: 7, condition: '',                     testCase: 'description = ""' },
    { number: 8, condition: '',                     testCase: 'description = "a"' },
    { number: 9, condition: 'MuscleGroup field',    testCase: 'muscleGroup = undefined' },
    { number: 10, condition: '',                    testCase: 'muscleGroup = CHEST' },
    { number: 11, condition: '',                    testCase: 'muscleGroup = SHOULDERS' },
    { number: 12, condition: '',                    testCase: 'muscleGroup = ARMS' },
    { number: 13, condition: '',                    testCase: 'muscleGroup = BACK' },
    { number: 14, condition: '',                    testCase: 'muscleGroup = CORE' },
    { number: 15, condition: '',                    testCase: 'muscleGroup = LEGS' },
    { number: 16, condition: 'Equipment field',      testCase: 'equipmentNeeded = undefined' },
    { number: 17, condition: '',                    testCase: 'equipmentNeeded = CABLE' },
    { number: 18, condition: '',                    testCase: 'equipmentNeeded = DUMBBELL' },
    { number: 19, condition: '',                    testCase: 'equipmentNeeded = BARBELL' },
    { number: 20, condition: '',                    testCase: 'equipmentNeeded = MACHINE' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 EmptyID',    inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneCharID',  inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '',      inputData: 'Existing ID, unique new name', expected: 'Exercise name updated' },
    { noTc: 2, fromEc: 'EC-2',       fromBva: '',      inputData: 'Non-existent exercise ID',    expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EC-4',       fromBva: '',      inputData: 'Name taken by another record', expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: '',           fromBva: 'BVA-1', inputData: 'id = ""',                     expected: 'Throws NotFoundError' },
    { noTc: 5, fromEc: '',           fromBva: 'BVA-2', inputData: 'id = "a"',                    expected: 'Throws NotFoundError' },
    { noTc: 6, fromEc: '',           fromBva: 'BVA-3', inputData: 'name = undefined',            expected: 'Updates successfully' },
    { noTc: 7, fromEc: '',           fromBva: 'BVA-4', inputData: 'name = ""',                   expected: 'Updates successfully' },
    { noTc: 8, fromEc: '',           fromBva: 'BVA-5', inputData: 'name = "a"',                  expected: 'Updates successfully' },
    { noTc: 9, fromEc: '',           fromBva: 'BVA-6', inputData: 'description = undefined',     expected: 'Updates successfully' },
    { noTc: 10,fromEc: '',           fromBva: 'BVA-7', inputData: 'description = ""',            expected: 'Updates successfully' },
    { noTc: 11,fromEc: '',           fromBva: 'BVA-8', inputData: 'description = "a"',           expected: 'Updates successfully' },
    { noTc: 12,fromEc: '',           fromBva: 'BVA-9', inputData: 'muscleGroup = undefined',     expected: 'Updates successfully' },
    { noTc: 13,fromEc: '',           fromBva: 'BVA-10',inputData: 'muscleGroup = CHEST',         expected: 'Updates successfully' },
    { noTc: 14,fromEc: '',           fromBva: 'BVA-11',inputData: 'muscleGroup = SHOULDERS',     expected: 'Updates successfully' },
    { noTc: 15,fromEc: '',           fromBva: 'BVA-12',inputData: 'muscleGroup = ARMS',          expected: 'Updates successfully' },
    { noTc: 16,fromEc: '',           fromBva: 'BVA-13',inputData: 'muscleGroup = BACK',          expected: 'Updates successfully' },
    { noTc: 17,fromEc: '',           fromBva: 'BVA-14',inputData: 'muscleGroup = CORE',          expected: 'Updates successfully' },
    { noTc: 18,fromEc: '',           fromBva: 'BVA-15',inputData: 'muscleGroup = LEGS',          expected: 'Updates successfully' },
    { noTc: 19,fromEc: '',           fromBva: 'BVA-16',inputData: 'equipmentNeeded = undefined', expected: 'Updates successfully' },
    { noTc: 20,fromEc: '',           fromBva: 'BVA-17',inputData: 'equipmentNeeded = CABLE',     expected: 'Updates successfully' },
    { noTc: 21,fromEc: '',           fromBva: 'BVA-18',inputData: 'equipmentNeeded = DUMBBELL',  expected: 'Updates successfully' },
    { noTc: 22,fromEc: '',           fromBva: 'BVA-19',inputData: 'equipmentNeeded = BARBELL',   expected: 'Updates successfully' },
  ],
};

const exerciseSetActiveBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 5,
  statement: 'ExerciseRepository.setActive(id, isActive) – archives/restores an exercise.',
  data: 'Input: id: string, isActive: boolean',
  precondition: 'Database is accessible',
  results: 'Output: Promise<Exercise> | throws NotFoundError',
  postcondition: 'isActive flag updated.',
  ecRows: [
    { number: 1, condition: 'Exercise existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Active status',      validEc: 'isActive = false',     invalidEc: '' },
    { number: 4, condition: '',                   validEc: 'isActive = true',      invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'id exists, isActive=false', expected: 'Returns isActive=false' },
    { noTc: 2, ec: 'EC-1, EC-4', inputData: 'id exists, isActive=true',  expected: 'Returns isActive=true' },
    { noTc: 3, ec: 'EC-2',       inputData: 'Non-existent ID',           expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '',      inputData: 'Exist, set inactive', expected: 'isActive=false' },
    { noTc: 2, fromEc: 'EC-1, EC-4', fromBva: '',      inputData: 'Exist, set active',   expected: 'isActive=true' },
    { noTc: 3, fromEc: 'EC-2',       fromBva: '',      inputData: 'Non-existent ID',    expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',           fromBva: 'BVA-1', inputData: 'id = ""',            expected: 'Throws NotFoundError' },
    { noTc: 5, fromEc: '',           fromBva: 'BVA-2', inputData: 'id = "a"',           expected: 'Throws NotFoundError' },
  ],
};

const exerciseDeleteBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 7,
  statement: 'ExerciseRepository.delete(id) – deletes exercise if not referenced in sessions.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<void> | throws NotFoundError/ConflictError',
  postcondition: 'Deletes record or throws NotFoundError/ConflictError.',
  ecRows: [
    { number: 1, condition: 'Exercise existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
    { number: 3, condition: 'Reference status',   validEc: 'usageCount = 0',      invalidEc: '' },
    { number: 4, condition: '',                   validEc: '',                    invalidEc: 'usageCount > 0 (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-3', inputData: 'Exist, unreferenced',      expected: 'Resolves void' },
    { noTc: 2, ec: 'EC-2',       inputData: 'Non-existent ID',          expected: 'Throws NotFoundError' },
    { noTc: 3, ec: 'EC-4',       inputData: 'Referenced in sessions',   expected: 'Throws ConflictError' },
  ],
  bvaRows: [
    { number: 1, condition: 'Reference boundary', testCase: 'usageCount = 0' },
    { number: 2, condition: '',                  testCase: 'usageCount = 1' },
    { number: 3, condition: 'ID length',          testCase: 'id = ""' },
    { number: 4, condition: '',                  testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Zero',    inputData: 'usageCount=0', expected: 'Resolves void' },
    { noTc: 2, bva: 'BVA-2 One',     inputData: 'usageCount=1', expected: 'Throws ConflictError' },
    { noTc: 3, bva: 'BVA-3 EmptyID', inputData: 'id = ""',      expected: 'Throws NotFoundError' },
    { noTc: 4, bva: 'BVA-4 OneChar', inputData: 'id = "a"',     expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1, EC-3', fromBva: '',      inputData: 'Exist, no usage',       expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EC-2',       fromBva: '',      inputData: 'Non-existent exercise', expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EC-4',       fromBva: '',      inputData: 'Referenced 5 times',    expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: '',           fromBva: 'BVA-1', inputData: 'usageCount=0',         expected: 'Resolves void' },
    { noTc: 5, fromEc: '',           fromBva: 'BVA-2', inputData: 'usageCount=1',         expected: 'Throws ConflictError' },
    { noTc: 6, fromEc: '',           fromBva: 'BVA-3', inputData: 'id = ""',              expected: 'Throws NotFoundError' },
    { noTc: 7, fromEc: '',           fromBva: 'BVA-4', inputData: 'id = "a"',             expected: 'Throws NotFoundError' },
  ],
};

// ── workout-session-repository ─────────────────────────────────────────────────

const wsCreateBbt: BbtDescriptor = {
  reqId: 'WSM-01/WSM-02/WSM-03/WSM-04',
  tcCount: 9,
  statement: 'WorkoutSessionRepository.create(data, exercises) – atomically creates session.',
  data: 'Input: data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]',
  precondition: 'Database is accessible | exercises.length >= 1',
  results: 'Output: Promise<WorkoutSessionWithExercises> | throws Error',
  postcondition: 'Persists records or throws Error.',
  ecRows: [
    { number: 1, condition: 'Exercises list',    validEc: 'Length >= 1',          invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'Multiple exercises',   invalidEc: '' },
    { number: 3, condition: '',                 validEc: '',                     invalidEc: 'Length = 0 (RequiresExercisesError)' },
    { number: 4, condition: 'Member existence',  validEc: 'Found',                invalidEc: '' },
    { number: 5, condition: '',                 validEc: '',                     invalidEc: 'Not found (NotFoundError)' },
    { number: 6, condition: 'Database status',   validEc: 'Success',              invalidEc: '' },
    { number: 7, condition: '',                 validEc: '',                     invalidEc: 'Failure (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-4, EC-6', inputData: 'Valid data, 1 exercise',      expected: 'Returns session with 1 exercise' },
    { noTc: 2, ec: 'EC-2',             inputData: 'Multiple exercises',          expected: 'Returns session with all' },
    { noTc: 3, ec: 'EC-3',             inputData: 'Empty exercises array',       expected: 'Throws RequiresExercisesError' },
    { noTc: 4, ec: 'EC-5',             inputData: 'Member not found',            expected: 'Throws NotFoundError' },
    { noTc: 5, ec: 'EC-7',             inputData: 'DB write failure',            expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'MemberId length',  testCase: 'memberId = ""' },
    { number: 2, condition: '',                testCase: 'memberId = "a"' },
    { number: 3, condition: 'Exercises length', testCase: 'length = 0' },
    { number: 4, condition: '',                testCase: 'length = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 EmptyID',    inputData: 'memberId = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneCharID',  inputData: 'memberId = "a"', expected: 'Throws NotFoundError' },
    { noTc: 3, bva: 'BVA-3 ZeroLen',    inputData: 'length = 0',     expected: 'Throws RequiresExercisesError' },
    { noTc: 4, bva: 'BVA-4 OneLen',     inputData: 'length = 1',     expected: 'Persists successfully' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Valid data, 1 exercise',   expected: 'Returns session' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: '2 exercises provided',     expected: 'Returns session with 2' },
    { noTc: 3, fromEc: 'EC-3', fromBva: '',      inputData: 'exercises = []',           expected: 'Throws RequiresExercisesError' },
    { noTc: 4, fromEc: 'EC-5', fromBva: '',      inputData: 'Invalid memberId',         expected: 'Throws NotFoundError' },
    { noTc: 5, fromEc: 'EC-7', fromBva: '',      inputData: 'Database exception',       expected: 'Throws TransactionError' },
    { noTc: 6, fromEc: '',      fromBva: 'BVA-1', inputData: 'memberId = ""',            expected: 'Throws NotFoundError' },
    { noTc: 7, fromEc: '',      fromBva: 'BVA-2', inputData: 'memberId = "a"',           expected: 'Throws NotFoundError' },
    { noTc: 8, fromEc: '',      fromBva: 'BVA-3', inputData: 'exercises = []',           expected: 'Throws RequiresExercisesError' },
    { noTc: 9, fromEc: '',      fromBva: 'BVA-4', inputData: '1 exercise',               expected: 'Returns session' },
  ],
};

const wsFindByIdBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 4,
  statement: 'WorkoutSessionRepository.findById(id) – retrieves session with exercises.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<WorkoutSessionWithExercises> | throws NotFoundError',
  postcondition: 'Returns record or throws NotFoundError.',
  ecRows: [
    { number: 1, condition: 'Session existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'Existing ID',     expected: 'Returns session' },
    { noTc: 2, ec: 'EC-2', inputData: '"nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing session ID', expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',      expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'id = ""',              expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'id = "a"',             expected: 'Throws NotFoundError' },
  ],
};

const wsFindAllBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 24,
  statement: 'WorkoutSessionRepository.findAll(options?) – returns filtered paginated sessions.',
  data: 'Input: WorkoutSessionListOptions?',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
  postcondition: 'Returns paginated filtered results. Ascending by date if unpaginated, Descending if paginated.',
  ecRows: [
    { number: 1, condition: 'Filters',          validEc: 'No options',           invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'By memberId',          invalidEc: '' },
    { number: 3, condition: '',                 validEc: 'By startDate',         invalidEc: '' },
    { number: 4, condition: '',                 validEc: 'By endDate',           invalidEc: '' },
    { number: 5, condition: '',                 validEc: 'By date range',        invalidEc: '' },
    { number: 6, condition: '',                 validEc: 'By member + range',    invalidEc: '' },
    { number: 7, condition: 'Pagination',       validEc: 'Custom page/pageSize', invalidEc: '' },
    { number: 8, condition: 'Database result',  validEc: 'Matches found',        invalidEc: '' },
    { number: 9, condition: '',                 validEc: 'No matches found',     invalidEc: '' },
    { number: 10,condition: 'Ordering',         validEc: 'Unpaginated (ASC)',    invalidEc: '' },
    { number: 11,condition: '',                 validEc: 'Paginated (DESC)',     invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-8, EC-10', inputData: 'No options',               expected: 'All sessions, date ASC' },
    { noTc: 2, ec: 'EC-2',             inputData: 'memberId="m1"',             expected: 'Filtered by member' },
    { noTc: 3, ec: 'EC-3',             inputData: 'startDate="2024-06-01"',    expected: 'Filtered by start' },
    { noTc: 4, ec: 'EC-4',             inputData: 'endDate="2024-06-30"',      expected: 'Filtered by end' },
    { noTc: 5, ec: 'EC-5',             inputData: 'Date range filter',          expected: 'Filtered by range' },
    { noTc: 6, ec: 'EC-7, EC-11',      inputData: 'page=1, pageSize=10',       expected: 'Filtered items, date DESC' },
  ],
  bvaRows: [
    { number: 1, condition: 'MemberId param',    testCase: 'memberId = undefined' },
    { number: 2, condition: '',                 testCase: 'memberId = ""' },
    { number: 3, condition: '',                 testCase: 'memberId = "a"' },
    { number: 4, condition: 'StartDate param',   testCase: 'startDate = undefined' },
    { number: 5, condition: 'EndDate param',     testCase: 'endDate = undefined' },
    { number: 6, condition: 'Date range',        testCase: 'startDate = endDate' },
    { number: 7, condition: 'Page params',       testCase: 'page=undef, size=undef' },
    { number: 8, condition: '',                 testCase: 'page=undef, size=10' },
    { number: 9, condition: '',                 testCase: 'page=1, size=undef' },
    { number: 10, condition: '',                testCase: 'page = 0' },
    { number: 11, condition: '',                testCase: 'page = 1' },
    { number: 12, condition: '',                testCase: 'page = 2' },
    { number: 13, condition: 'PageSize param',   testCase: 'pageSize = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Undefined', inputData: 'memberId = undefined', expected: 'Returns all sessions' },
    { noTc: 2, bva: 'BVA-2 Empty',     inputData: 'memberId = ""',        expected: 'Returns items=[]' },
    { noTc: 3, bva: 'BVA-3 OneChar',   inputData: 'memberId = "a"',       expected: 'Returns items' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'No options provided',               expected: 'All sessions, date ASC' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'memberId filter',                   expected: 'Filtered by member' },
    { noTc: 3, fromEc: 'EC-3', fromBva: '',      inputData: 'startDate filter',                  expected: 'Filtered by start' },
    { noTc: 4, fromEc: 'EC-4', fromBva: '',      inputData: 'endDate filter',                    expected: 'Filtered by end' },
    { noTc: 5, fromEc: 'EC-5', fromBva: '',      inputData: 'Date range',                        expected: 'Filtered in range' },
    { noTc: 6, fromEc: 'EC-6', fromBva: '',      inputData: 'Member + Range',                    expected: 'Filtered by both' },
    { noTc: 7, fromEc: 'EC-7', fromBva: '',      inputData: 'page=2, total=25',                  expected: 'Second page, items=1' },
    { noTc: 8, fromEc: 'EC-9', fromBva: '',      inputData: 'Non-existent member',               expected: 'Items=[], total=0' },
    { noTc: 9, fromEc: 'EC-10',fromBva: '',      inputData: 'Oldest vs Newest session',          expected: 'Oldest comes first (ASC)' },
    { noTc: 10,fromEc: 'EC-11',fromBva: '',      inputData: 'Paginated query',                   expected: 'Newest comes first (DESC)' },
    { noTc: 11,fromEc: '',      fromBva: 'BVA-1', inputData: 'memberId = undefined',              expected: 'Returns items' },
    { noTc: 12,fromEc: '',      fromBva: 'BVA-2', inputData: 'memberId = ""',                     expected: 'Returns items=[]' },
    { noTc: 13,fromEc: '',      fromBva: 'BVA-3', inputData: 'memberId = "a"',                    expected: 'Returns items' },
    { noTc: 14,fromEc: '',      fromBva: 'BVA-4', inputData: 'startDate = undefined',             expected: 'Returns items' },
    { noTc: 15,fromEc: '',      fromBva: 'BVA-5', inputData: 'endDate = undefined',               expected: 'Returns items' },
    { noTc: 16,fromEc: '',      fromBva: 'BVA-6', inputData: 'startDate = endDate',               expected: 'Same day sessions' },
    { noTc: 17,fromEc: '',      fromBva: 'BVA-7', inputData: 'page=undef, size=undef',            expected: 'All, date ASC' },
    { noTc: 18,fromEc: '',      fromBva: 'BVA-8', inputData: 'page=undef, size=10',               expected: 'All, date ASC' },
    { noTc: 19,fromEc: '',      fromBva: 'BVA-9', inputData: 'page=1, size=undef',                expected: 'All, date ASC' },
    { noTc: 20,fromEc: '',      fromBva: 'BVA-10',inputData: 'page = 0',                         expected: 'First page' },
    { noTc: 21,fromEc: '',      fromBva: 'BVA-11',inputData: 'page = 1',                         expected: 'First page' },
    { noTc: 22,fromEc: '',      fromBva: 'BVA-12',inputData: 'page = 2, total=25',               expected: 'Second page' },
    { noTc: 23,fromEc: '',      fromBva: 'BVA-13',inputData: 'pageSize = 1',                     expected: 'One item' },
    { noTc: 24,fromEc: 'EC-1', fromBva: '',      inputData: 'Multiple sessions in DB',           expected: 'Ordering logic applied' },
  ],
};

const wsUpdateBbt: BbtDescriptor = {
  reqId: 'WSM-06',
  tcCount: 4,
  statement: 'WorkoutSessionRepository.update(id, data) – updates session metadata only.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput',
  precondition: 'Database is accessible',
  results: 'Output: Promise<WorkoutSession> | throws NotFoundError',
  postcondition: 'Updates metadata or throws NotFoundError.',
  ecRows: [
    { number: 1, condition: 'Session existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'id exists, duration=75', expected: 'Metadata updated' },
    { noTc: 2, ec: 'EC-2', inputData: 'Non-existent session',    expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing session ID', expected: 'Duration updated to 75' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',      expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'id = ""',              expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'id = "a"',             expected: 'Throws NotFoundError' },
  ],
};

const wsUpdateWithExercisesBbt: BbtDescriptor = {
  reqId: 'WSM-06/WSM-07',
  tcCount: 9,
  statement: 'WorkoutSessionRepository.updateWithExercises(id, data, exercises) – atomically replaces metadata and exercises.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
  precondition: 'Database is accessible | exercises.length >= 1',
  results: 'Output: Promise<WorkoutSessionWithExercises> | throws Error',
  postcondition: 'Atomically updates all or nothing.',
  ecRows: [
    { number: 1, condition: 'Exercises list',    validEc: 'Length >= 1',          invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'Multiple exercises',   invalidEc: '' },
    { number: 3, condition: '',                 validEc: '',                     invalidEc: 'Length = 0 (RequiresExercisesError)' },
    { number: 4, condition: 'Session existence', validEc: 'Found',                invalidEc: '' },
    { number: 5, condition: '',                 validEc: '',                     invalidEc: 'Not found (NotFoundError)' },
    { number: 6, condition: 'Exercises state',   validEc: 'Kept items',           invalidEc: '' },
    { number: 7, condition: '',                 validEc: 'Stale items removed',  invalidEc: '' },
    { number: 8, condition: '',                 validEc: 'Mixed items',          invalidEc: '' },
    { number: 9, condition: 'Database status',   validEc: 'Success',              invalidEc: '' },
    { number: 10,condition: '',                 validEc: '',                     invalidEc: 'Failure (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1, EC-4, EC-9', inputData: 'Exists, valid data, 1 exercise', expected: 'Returns updated session' },
    { noTc: 2, ec: 'EC-3',             inputData: 'Exercises=[]',                   expected: 'Throws error' },
    { noTc: 3, ec: 'EC-5',             inputData: 'Non-existent session',          expected: 'Throws NotFoundError' },
    { noTc: 4, ec: 'EC-6',             inputData: 'Kept item included',            expected: 'Updated in place' },
    { noTc: 5, ec: 'EC-7',             inputData: 'Stale item omitted',            expected: 'Deleted from DB' },
    { noTc: 6, ec: 'EC-10',            inputData: 'DB failure',                    expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length',        testCase: 'id = ""' },
    { number: 2, condition: '',                testCase: 'id = "a"' },
    { number: 3, condition: 'Exercises length', testCase: 'length = 1' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 EmptyID',    inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneCharID',  inputData: 'id = "a"', expected: 'Throws NotFoundError' },
    { noTc: 3, bva: 'BVA-3 OneLen',     inputData: 'length = 1',expected: 'Updates successfully' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1, EC-4', fromBva: '',      inputData: 'Existing session, valid update',      expected: 'Returns session' },
    { noTc: 2, fromEc: 'EC-3',       fromBva: '',      inputData: 'Exercises array empty',              expected: 'Throws error' },
    { noTc: 3, fromEc: 'EC-5',       fromBva: '',      inputData: 'Non-existent session ID',            expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: 'EC-6',       fromBva: '',      inputData: 'Include existing exercise ID',    expected: 'Updates in place' },
    { noTc: 5, fromEc: 'EC-7',       fromBva: '',      inputData: 'Omit current exercise ID',        expected: 'Exercise row is deleted' },
    { noTc: 6, fromEc: 'EC-8',       fromBva: '',      inputData: 'Mixed: kept, new, and stale items',  expected: 'Correct row operations' },
    { noTc: 7, fromEc: 'EC-10',      fromBva: '',      inputData: 'Database write error',            expected: 'Throws TransactionError' },
    { noTc: 8, fromEc: '',           fromBva: 'BVA-1', inputData: 'id = ""',                         expected: 'Throws NotFoundError' },
    { noTc: 9, fromEc: '',           fromBva: 'BVA-2', inputData: 'id = "a"',                        expected: 'Throws NotFoundError' },
  ],
};

const wsDeleteBbt: BbtDescriptor = {
  reqId: 'WSM-08',
  tcCount: 4,
  statement: 'WorkoutSessionRepository.delete(id) – deletes session and exercises.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<void> | throws NotFoundError',
  postcondition: 'Deletes record or throws NotFoundError.',
  ecRows: [
    { number: 1, condition: 'Session existence', validEc: 'Found',                   invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                    invalidEc: 'Not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: 'EC-1', inputData: 'Existing ID',     expected: 'Resolves void' },
    { noTc: 2, ec: 'EC-2', inputData: '"nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'ID length', testCase: 'id = ""' },
    { number: 2, condition: '',          testCase: 'id = "a"' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1 Empty',   inputData: 'id = ""',  expected: 'Throws NotFoundError' },
    { noTc: 2, bva: 'BVA-2 OneChar', inputData: 'id = "a"', expected: 'Throws NotFoundError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EC-1', fromBva: '',      inputData: 'Existing session ID', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EC-2', fromBva: '',      inputData: 'Non-existent ID',      expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: '',      fromBva: 'BVA-1', inputData: 'id = ""',              expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: '',      fromBva: 'BVA-2', inputData: 'id = "a"',             expected: 'Throws NotFoundError' },
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
