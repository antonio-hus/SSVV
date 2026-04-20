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

const REPO_BASE = path.join(ROOT, 'lib', 'repository', '__tests__', 'bbt');

// ── user-repository ────────────────────────────────────────────────────────────

const createMemberBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 4,
  statement: 'UserRepository.createMember(data) – atomically creates a User and Member record. Hashes the password with bcrypt (12 rounds). Throws ConflictError if the email is already registered. Wraps any database failure in a TransactionError.',
  data: 'Input: CreateMemberInput { email, fullName, phone, dateOfBirth, password, membershipStart }\nPrecondition: no User with the given email exists in the database.',
  precondition: 'Database is accessible  |  No User row with data.email already exists',
  results: 'Output: Promise<MemberWithUser>  OR  throws ConflictError / TransactionError',
  postcondition: 'On success: new User + Member rows are persisted atomically, password is stored as bcrypt hash.\nOn ConflictError: no rows written.\nOn TransactionError: no rows written.',
  ecRows: [
    { number: 1, condition: 'email uniqueness', validEc: 'email not yet registered', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                         invalidEc: 'email already registered (ConflictError)' },
    { number: 3, condition: 'DB write',         validEc: 'write succeeds',           invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                         invalidEc: 'write fails (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Valid CreateMemberInput, email not taken',              expected: 'Returns MemberWithUser with user defined' },
    { noTc: 2, ec: '2',   inputData: 'Valid CreateMemberInput, email already registered',     expected: 'Throws ConflictError' },
    { noTc: 3, ec: '4',   inputData: 'Valid CreateMemberInput, DB write throws Error',        expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'exercises list', testCase: 'N/A – no array input at this layer' },
  ],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Email not registered, all valid fields', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Email already in use',                   expected: 'Throws ConflictError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'DB write throws Error',                  expected: 'Throws TransactionError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '', inputData: 'Valid email, check stored password is bcrypt hash (not plaintext)', expected: 'user.password starts with $2b$' },
  ],
};

const createAdminBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 4,
  statement: 'UserRepository.createAdmin(data) – atomically creates a User and Admin record. Hashes the password with bcrypt (12 rounds). Throws ConflictError if the email is already registered. Wraps any database failure in a TransactionError.',
  data: 'Input: CreateAdminInput { email, fullName, phone, dateOfBirth, password }',
  precondition: 'Database is accessible  |  No User row with data.email already exists',
  results: 'Output: Promise<AdminWithUser>  OR  throws ConflictError / TransactionError',
  postcondition: 'On success: new User + Admin rows are persisted atomically.\nOn ConflictError: no rows written.\nOn TransactionError: no rows written.',
  ecRows: [
    { number: 1, condition: 'email uniqueness', validEc: 'email not yet registered', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                         invalidEc: 'email already registered (ConflictError)' },
    { number: 3, condition: 'DB write',         validEc: 'write succeeds',           invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                         invalidEc: 'write fails (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Valid CreateAdminInput, email not taken',          expected: 'Returns AdminWithUser with user defined' },
    { noTc: 2, ec: '2',   inputData: 'Valid CreateAdminInput, email already registered', expected: 'Throws ConflictError' },
    { noTc: 3, ec: '4',   inputData: 'Valid CreateAdminInput, DB write throws Error',    expected: 'Throws TransactionError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at this layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Email not registered, all valid fields', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Email already in use',                   expected: 'Throws ConflictError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'DB write throws Error',                  expected: 'Throws TransactionError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '', inputData: 'Valid email, check stored password is bcrypt hash (not plaintext)', expected: 'user.password starts with $2b$' },
  ],
};

const findByIdBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 2,
  statement: 'UserRepository.findById(id) – retrieves a User record by its ID, including both the Member and Admin profiles. Throws NotFoundError if no User with the given ID exists.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<UserWithProfile>  OR  throws NotFoundError',
  postcondition: 'On success: returns UserWithProfile (with member/admin included).\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'user existence', validEc: 'User with given id exists',          invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                                    invalidEc: 'No User with given id (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id = existing user UUID',     expected: 'Returns UserWithProfile with correct id and email' },
    { noTc: 2, ec: '2', inputData: 'id = "nonexistent-id"',       expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing user id', expected: 'Returns UserWithProfile' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',  expected: 'Throws NotFoundError' },
  ],
};

const findMemberByIdBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 2,
  statement: 'UserRepository.findMemberById(memberId) – retrieves a Member record by its ID, including the parent User. Throws NotFoundError if no Member with the given ID exists.',
  data: 'Input: memberId: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: returns MemberWithUser.\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'Member with given memberId exists',    invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                      invalidEc: 'No Member with given memberId (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId = existing member UUID', expected: 'Returns MemberWithUser with user defined' },
    { noTc: 2, ec: '2', inputData: 'memberId = "nonexistent-id"',     expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing member id', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',    expected: 'Throws NotFoundError' },
  ],
};

const findAdminByIdBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 2,
  statement: 'UserRepository.findAdminById(adminId) – retrieves an Admin record by its ID, including the parent User. Throws NotFoundError if no Admin with the given ID exists.',
  data: 'Input: adminId: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<AdminWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: returns AdminWithUser.\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'Admin with given adminId exists',    invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                    invalidEc: 'No Admin with given adminId (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'adminId = existing admin UUID', expected: 'Returns AdminWithUser with user defined' },
    { noTc: 2, ec: '2', inputData: 'adminId = "nonexistent-id"',    expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing admin id', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',   expected: 'Throws NotFoundError' },
  ],
};

const findByEmailBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 2,
  statement: 'UserRepository.findByEmail(email) – retrieves a User record by email address (including Member/Admin profiles). Returns null if not found. Used by AuthService during login.',
  data: 'Input: email: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<UserWithProfile | null>',
  postcondition: 'On found: returns UserWithProfile.\nOn not found: returns null (no error thrown).',
  ecRows: [
    { number: 1, condition: 'email existence', validEc: 'User with given email exists  → returns UserWithProfile', invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                                         invalidEc: 'No User with given email → returns null' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'email = "john@example.com" (registered)', expected: 'Returns non-null UserWithProfile' },
    { noTc: 2, ec: '2', inputData: 'email = "notfound@example.com"',           expected: 'Returns null' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – email is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Registered email',   expected: 'Returns UserWithProfile' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Unregistered email', expected: 'Returns null' },
  ],
};

const findMembersBbt: BbtDescriptor = {
  reqId: 'MEM-03',
  tcCount: 7,
  statement: 'UserRepository.findMembers(options?) – returns a paginated list of Members (each with user included). Supports optional case-insensitive search by fullName or email. Defaults: page=1, pageSize=10. Results sorted ascending by fullName.',
  data: 'Input: MemberListOptions? { search?: string, page?: number, pageSize?: number }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<MemberWithUser>> = { items: MemberWithUser[], total: number }',
  postcondition: 'Returns paginated page with matching members. Empty result when no members match.',
  ecRows: [
    { number: 1, condition: 'search filter', validEc: 'no search → all members returned',       invalidEc: '' },
    { number: 2, condition: '',              validEc: 'with search → filtered members returned', invalidEc: '' },
    { number: 3, condition: 'pagination',    validEc: 'default page/size (1/10)',                invalidEc: '' },
    { number: 4, condition: '',              validEc: 'custom page/pageSize',                    invalidEc: '' },
    { number: 5, condition: 'DB result',     validEc: 'members exist',                           invalidEc: '' },
    { number: 6, condition: '',              validEc: 'no members → empty page (total=0)',        invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5', inputData: 'No options, DB has 1 member',           expected: 'items.length=1, total=1' },
    { noTc: 2, ec: '2',     inputData: 'search="John", DB returns 1 match',     expected: 'items.length=1' },
    { noTc: 3, ec: '4',     inputData: 'page=2, pageSize=10, total=15',         expected: 'total=15, items.length=0 (page 2 is empty)' },
    { noTc: 4, ec: '6',     inputData: 'No options, DB has 0 members',          expected: 'items.length=0, total=0' },
  ],
  bvaRows: [
    { number: 1, condition: 'pageSize min', testCase: 'pageSize=1 (single item per page)' },
    { number: '',condition: '',             testCase: 'pageSize=0 would cause division by zero – schema validates before repo' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'empty result', inputData: 'No members in DB, no options', expected: 'items=[], total=0' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 member in DB',                        expected: 'items.length=1, total=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'search="John"',                                     expected: 'items.length=1' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',      inputData: 'page=2, pageSize=10, total=15',                     expected: 'total=15' },
    { noTc: 4, fromEc: 'EP-4', fromBva: 'BVA-1', inputData: 'No options, empty DB',                             expected: 'items=[], total=0' },
    { noTc: 5, fromEc: 'EP-3', fromBva: '',      inputData: 'default pagination (page=1, pageSize=10) → skip=0', expected: 'prisma called with skip=0, take=10' },
    { noTc: 6, fromEc: 'EP-3', fromBva: '',      inputData: 'page=2, pageSize=10 → skip=10',                    expected: 'prisma called with skip=10, take=10' },
    { noTc: 7, fromEc: 'EP-3', fromBva: '',      inputData: 'pageSize=5 → take=5',                              expected: 'prisma called with take=5' },
  ],
};

const findAdminsBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 7,
  statement: 'UserRepository.findAdmins(options?) – returns a paginated list of Admins (each with user included). Supports optional case-insensitive search by fullName or email. Same pagination pattern as findMembers.',
  data: 'Input: AdminListOptions? { search?: string, page?: number, pageSize?: number }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<AdminWithUser>> = { items: AdminWithUser[], total: number }',
  postcondition: 'Returns paginated page with matching admins. Empty result when no admins match.',
  ecRows: [
    { number: 1, condition: 'search filter', validEc: 'no search → all admins', invalidEc: '' },
    { number: 2, condition: '',              validEc: 'with search → filtered', invalidEc: '' },
    { number: 3, condition: 'DB result',     validEc: 'admins exist',           invalidEc: '' },
    { number: 4, condition: '',              validEc: 'no admins → empty page', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'No options, DB has 1 admin',       expected: 'items.length=1, total=1' },
    { noTc: 2, ec: '2',   inputData: 'search="Admin", DB returns 1 match', expected: 'items.length=1' },
    { noTc: 3, ec: '4',   inputData: 'No options, DB has 0 admins',       expected: 'items.length=0, total=0' },
  ],
  bvaRows: [{ number: 1, condition: 'empty DB', testCase: 'No admins exist → total=0' }],
  bvaTcRows: [{ noTc: 1, bva: 'empty result', inputData: 'No admins in DB', expected: 'items=[], total=0' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 admin',                               expected: 'items.length=1, total=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'search="Admin"',                                    expected: 'items.length=1' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'No options, empty DB',                            expected: 'items=[], total=0' },
    { noTc: 4, fromEc: 'EP-3', fromBva: '',      inputData: 'page=2, pageSize=10 → items on page 2',            expected: 'total matches, items on page 2' },
    { noTc: 5, fromEc: 'EP-3', fromBva: '',      inputData: 'default pagination (page=1, pageSize=10) → skip=0', expected: 'prisma called with skip=0, take=10' },
    { noTc: 6, fromEc: 'EP-3', fromBva: '',      inputData: 'page=2, pageSize=10 → skip=10',                    expected: 'prisma called with skip=10, take=10' },
    { noTc: 7, fromEc: 'EP-3', fromBva: '',      inputData: 'pageSize=5 → take=5',                              expected: 'prisma called with take=5' },
  ],
};

const updateMemberBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 6,
  statement: 'UserRepository.updateMember(memberId, data) – atomically updates the Member and its parent User fields. Hashes a new password if provided. Throws NotFoundError if member absent. Throws ConflictError if new email already taken.',
  data: 'Input: memberId: string, data: UpdateMemberInput (all fields optional)',
  precondition: 'Database is accessible  |  Member with memberId may or may not exist',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError / ConflictError / TransactionError',
  postcondition: 'On success: member + user rows updated atomically.\nOn NotFoundError / ConflictError: no change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member found',               invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                            invalidEc: 'member not found (NotFoundError)' },
    { number: 3, condition: 'email uniqueness', validEc: 'new email not taken OR same', invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                            invalidEc: 'new email already taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'memberId exists, { fullName: "Updated Name" }',        expected: 'Returns updated MemberWithUser' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                           expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'memberId exists, { email: "taken@example.com" }',     expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at this layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing member, fullName update',                        expected: 'Returns updated MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId',                                   expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing member, duplicate email update',                 expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '', inputData: 'Same email as current user → skips conflict check',       expected: 'Returns updated MemberWithUser (no ConflictError)' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '', inputData: 'New password provided → password is hashed before save',  expected: 'stored hash verifies against original plaintext' },
    { noTc: 6, fromEc: 'EP-3', fromBva: '', inputData: 'Valid data, DB write throws Error',                       expected: 'Throws TransactionError' },
  ],
};

const setMemberActiveBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 3,
  statement: 'UserRepository.setMemberActive(memberId, isActive) – sets the isActive flag of a Member to suspend (false) or reactivate (true) them. Throws NotFoundError if member absent. Session history is preserved regardless.',
  data: 'Input: memberId: string, isActive: boolean',
  precondition: 'Database is accessible  |  Member with memberId may or may not exist',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: Member.isActive updated, all historical WorkoutSession rows preserved.\nOn NotFoundError: no change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member found',               invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                            invalidEc: 'member not found (NotFoundError)' },
    { number: 3, condition: 'isActive flag',    validEc: 'isActive=false → suspend',   invalidEc: '' },
    { number: 4, condition: '',                 validEc: 'isActive=true → reactivate', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'memberId exists, isActive=false', expected: 'Returns MemberWithUser with isActive=false' },
    { noTc: 2, ec: '1,4', inputData: 'memberId exists, isActive=true',  expected: 'Returns MemberWithUser with isActive=true' },
    { noTc: 3, ec: '2',   inputData: '"nonexistent-id", isActive=true', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'isActive boundary', testCase: 'isActive=false (suspend)' },
    { number: '',condition: '',                   testCase: 'isActive=true (reactivate)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'isActive=false', inputData: 'existing memberId, isActive=false', expected: 'isActive=false in result' },
    { noTc: 2, bva: 'isActive=true',  inputData: 'existing memberId, isActive=true',  expected: 'isActive=true in result' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing member, isActive=false', expected: 'isActive=false' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-2', inputData: 'Existing member, isActive=true',  expected: 'isActive=true' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Non-existent memberId',           expected: 'Throws NotFoundError' },
  ],
};

const updateAdminBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 6,
  statement: 'UserRepository.updateAdmin(adminId, data) – atomically updates the Admin and its parent User fields. Hashes a new password if provided. Throws NotFoundError if admin absent. Throws ConflictError if new email already taken.',
  data: 'Input: adminId: string, data: UpdateAdminInput (all fields optional)',
  precondition: 'Database is accessible  |  Admin with adminId may or may not exist',
  results: 'Output: Promise<AdminWithUser>  OR  throws NotFoundError / ConflictError / TransactionError',
  postcondition: 'On success: admin + user rows updated atomically.\nOn NotFoundError / ConflictError: no change.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'admin found',               invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                            invalidEc: 'admin not found (NotFoundError)' },
    { number: 3, condition: 'email uniqueness',validEc: 'new email not taken OR same', invalidEc: '' },
    { number: 4, condition: '',                validEc: '',                            invalidEc: 'new email already taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'adminId exists, { fullName: "Updated Admin" }',       expected: 'Returns updated AdminWithUser' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                          expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'adminId exists, { email: "taken@example.com" }',     expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at this layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing admin, fullName update',                       expected: 'Returns updated AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent adminId',                                  expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing admin, duplicate email update',                expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '', inputData: 'Same email as current user → skips conflict check',     expected: 'Returns updated AdminWithUser (no ConflictError)' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '', inputData: 'New password provided → password is hashed before save', expected: 'stored hash verifies against original plaintext' },
    { noTc: 6, fromEc: 'EP-3', fromBva: '', inputData: 'Valid data, DB write throws Error',                     expected: 'Throws TransactionError' },
  ],
};

const deleteUserBbt: BbtDescriptor = {
  reqId: 'MEM-01/AUTH-06',
  tcCount: 3,
  statement: 'UserRepository.delete(id) – resolves the id as a Member or Admin profile, then deletes the parent User (cascading to the profile). Throws NotFoundError if the id matches neither a Member nor an Admin.',
  data: 'Input: id: string  (either a memberId or adminId)',
  precondition: 'Database is accessible  |  id may match an existing Member, Admin, or neither',
  results: 'Output: Promise<void>  OR  throws NotFoundError',
  postcondition: 'On success: User + profile row deleted (cascade). All WorkoutSession history also deleted via DB cascade.\nOn NotFoundError: no change.',
  ecRows: [
    { number: 1, condition: 'id resolution', validEc: 'id is an existing memberId',  invalidEc: '' },
    { number: 2, condition: '',              validEc: 'id is an existing adminId',   invalidEc: '' },
    { number: 3, condition: '',              validEc: '',                             invalidEc: 'id not found as member or admin (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id = existing memberId', expected: 'Resolves void, member+user rows deleted' },
    { noTc: 2, ec: '2', inputData: 'id = existing adminId',  expected: 'Resolves void, admin+user rows deleted' },
    { noTc: 3, ec: '3', inputData: 'id = "nonexistent-id"',  expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing memberId', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Existing adminId',  expected: 'Resolves void' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Non-existent id',   expected: 'Throws NotFoundError' },
  ],
};

// ── exercise-repository ────────────────────────────────────────────────────────

const exerciseCreateBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 2,
  statement: 'ExerciseRepository.create(data) – creates a new exercise in the catalogue. Exercise names must be unique across the system. Throws ConflictError if an exercise with the same name already exists.',
  data: 'Input: CreateExerciseInput { name, description?, muscleGroup, equipmentNeeded }',
  precondition: 'Database is accessible  |  Exercise with data.name may or may not already exist',
  results: 'Output: Promise<Exercise>  OR  throws ConflictError',
  postcondition: 'On success: new Exercise row persisted.\nOn ConflictError: no row written.',
  ecRows: [
    { number: 1, condition: 'name uniqueness', validEc: 'name not yet in catalogue', invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                           invalidEc: 'name already in catalogue (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'name="Bench Press", not yet in catalogue', expected: 'Returns Exercise with id defined' },
    { noTc: 2, ec: '2', inputData: 'name="Bench Press", already exists',       expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'Name boundary validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Unique name',    expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Duplicate name', expected: 'Throws ConflictError' },
  ],
};

const exerciseFindByIdBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 2,
  statement: 'ExerciseRepository.findById(id) – retrieves an Exercise by its unique identifier. Throws NotFoundError if no exercise with the given ID exists.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError',
  postcondition: 'On success: returns Exercise record.\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'Exercise with given id exists',          invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                        invalidEc: 'No Exercise with given id (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id = existing exercise UUID', expected: 'Returns Exercise with correct id and name' },
    { noTc: 2, ec: '2', inputData: 'id = "nonexistent-id"',       expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing exercise id', expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',      expected: 'Throws NotFoundError' },
  ],
};

const exerciseFindAllBbt: BbtDescriptor = {
  reqId: 'EXM-02/EXM-06',
  tcCount: 11,
  statement: 'ExerciseRepository.findAll(options?) – returns a paginated list of exercises. Only active exercises are returned by default (includeInactive=false). Supports search by name (LIKE), filter by muscleGroup, and pagination. Sorted by name ascending.',
  data: 'Input: ExerciseListOptions? { search?, muscleGroup?, includeInactive?, page?, pageSize? }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<Exercise>> = { items: Exercise[], total: number }',
  postcondition: 'Returns filtered and paginated list. Empty result when no exercises match.',
  ecRows: [
    { number: 1, condition: 'includeInactive',  validEc: 'false (default) → only active', invalidEc: '' },
    { number: 2, condition: '',                 validEc: 'true → all exercises',           invalidEc: '' },
    { number: 3, condition: 'search filter',    validEc: 'no search → all',               invalidEc: '' },
    { number: 4, condition: '',                 validEc: 'with search → name-filtered',    invalidEc: '' },
    { number: 5, condition: 'muscleGroup',      validEc: 'no filter → all groups',        invalidEc: '' },
    { number: 6, condition: '',                 validEc: 'with muscleGroup → filtered',    invalidEc: '' },
    { number: 7, condition: 'pagination',       validEc: 'default page/size',             invalidEc: '' },
    { number: 8, condition: '',                 validEc: 'custom page/pageSize',           invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5,7', inputData: 'No options, 1 active exercise in DB',           expected: 'items.length=1, total=1' },
    { noTc: 2, ec: '4',       inputData: 'search="Bench", 1 matching active exercise',    expected: 'items.length=1' },
    { noTc: 3, ec: '6',       inputData: 'muscleGroup="CHEST", 1 CHEST exercise',         expected: 'items.length=1' },
    { noTc: 4, ec: '2',       inputData: 'includeInactive=true, 1 active + 1 inactive',  expected: 'total=2' },
    { noTc: 5, ec: '8',       inputData: 'page=3, pageSize=10, total=25',                 expected: 'total=25, items.length=0' },
  ],
  bvaRows: [
    { number: 1, condition: 'includeInactive boundary', testCase: 'includeInactive=false (default) → 1 active only' },
    { number: '',condition: '',                          testCase: 'includeInactive=true → all 2 returned' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'includeInactive=false', inputData: 'No options, 1 active + 1 inactive in DB', expected: 'items.length=1' },
    { noTc: 2, bva: 'includeInactive=true',  inputData: 'includeInactive=true, 1+1 in DB',         expected: 'total=2' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'No options, 1 active exercise',                   expected: 'items.length=1, total=1' },
    { noTc: 2,  fromEc: 'EP-2', fromBva: '',       inputData: 'search="Bench"',                                  expected: 'items.length=1' },
    { noTc: 3,  fromEc: 'EP-3', fromBva: '',       inputData: 'muscleGroup="CHEST"',                             expected: 'items.length=1' },
    { noTc: 4,  fromEc: 'EP-4', fromBva: 'BVA-2', inputData: 'includeInactive=true',                            expected: 'total=2' },
    { noTc: 5,  fromEc: 'EP-5', fromBva: '',       inputData: 'page=3, pageSize=10, total=25',                   expected: 'total=25, items.length=0' },
    { noTc: 6,  fromEc: 'EP-5', fromBva: '',       inputData: 'no matching exercises → empty page result',       expected: 'items=[], total=0' },
    { noTc: 7,  fromEc: 'EP-5', fromBva: '',       inputData: 'default pagination: page=1, pageSize=10 → skip=0, take=10', expected: 'prisma called with skip=0, take=10' },
    { noTc: 8,  fromEc: 'EP-5', fromBva: '',       inputData: 'page=1 boundary → skip=0',                       expected: 'prisma called with skip=0' },
    { noTc: 9,  fromEc: 'EP-5', fromBva: '',       inputData: 'page=2, pageSize=10 → skip=10',                   expected: 'prisma called with skip=10' },
    { noTc: 10, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'includeInactive=false (explicit) → only active',  expected: 'items.length=1 (inactive excluded)' },
    { noTc: 11, fromEc: 'EP-2', fromBva: '',       inputData: 'search + muscleGroup combined filter',            expected: 'prisma called with both where conditions' },
  ],
};

const exerciseUpdateBbt: BbtDescriptor = {
  reqId: 'EXM-03',
  tcCount: 5,
  statement: 'ExerciseRepository.update(id, data) – updates an existing exercise. Throws NotFoundError if exercise not found. Throws ConflictError if the new name conflicts with another existing exercise.',
  data: 'Input: id: string, data: UpdateExerciseInput (all fields optional)',
  precondition: 'Database is accessible  |  Exercise may or may not exist',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: exercise row updated.\nOn NotFoundError / ConflictError: no change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise found',                    invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                   invalidEc: 'exercise not found (NotFoundError)' },
    { number: 3, condition: 'name uniqueness',    validEc: 'new name not taken OR same name',   invalidEc: '' },
    { number: 4, condition: '',                   validEc: '',                                   invalidEc: 'new name already taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, { name: "Incline Bench Press" }, name not taken', expected: 'Returns updated Exercise' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                                 expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'id exists, { name: "Existing Exercise" }',                  expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'Name boundaries validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing id, new unique name',                           expected: 'Returns updated Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                                        expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing id, duplicate name',                            expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '', inputData: 'Same name as current exercise → skips conflict check',  expected: 'Returns updated Exercise (no ConflictError)' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '', inputData: 'Update without name field → no conflict check performed', expected: 'Returns updated Exercise (no conflict call)' },
  ],
};

const exerciseSetActiveBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 3,
  statement: 'ExerciseRepository.setActive(id, isActive) – archives (isActive=false) or restores (isActive=true) an exercise. Archived exercises are excluded from default findAll queries. Throws NotFoundError if exercise absent.',
  data: 'Input: id: string, isActive: boolean',
  precondition: 'Database is accessible  |  Exercise may or may not exist',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError',
  postcondition: 'On success: Exercise.isActive updated.\nOn NotFoundError: no change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise found',              invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                             invalidEc: 'exercise not found (NotFoundError)' },
    { number: 3, condition: 'isActive flag',      validEc: 'isActive=false → archive',   invalidEc: '' },
    { number: 4, condition: '',                   validEc: 'isActive=true → restore',    invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, isActive=false', expected: 'Returns Exercise with isActive=false' },
    { noTc: 2, ec: '1,4', inputData: 'id exists, isActive=true',  expected: 'Returns Exercise with isActive=true' },
    { noTc: 3, ec: '2',   inputData: '"nonexistent-id", any flag', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'isActive boundary', testCase: 'isActive=false (archive)' },
    { number: '',condition: '',                   testCase: 'isActive=true (restore)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'isActive=false', inputData: 'existing id, isActive=false', expected: 'isActive=false in result' },
    { noTc: 2, bva: 'isActive=true',  inputData: 'existing id, isActive=true',  expected: 'isActive=true in result' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing id, isActive=false', expected: 'isActive=false' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-2', inputData: 'Existing id, isActive=true',  expected: 'isActive=true' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Non-existent id',             expected: 'Throws NotFoundError' },
  ],
};

const exerciseDeleteBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 4,
  statement: 'ExerciseRepository.delete(id) – permanently removes an exercise. Throws NotFoundError if exercise absent. Throws ConflictError (referential RESTRICT) if any WorkoutSessionExercise row references the exercise.',
  data: 'Input: id: string',
  precondition: 'Database is accessible  |  Exercise may or may not exist  |  Exercise may or may not be referenced',
  results: 'Output: Promise<void>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: exercise row deleted.\nOn NotFoundError / ConflictError: no change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise found',                           invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                          invalidEc: 'exercise not found (NotFoundError)' },
    { number: 3, condition: 'reference check',    validEc: 'usageCount=0 → safe to delete',            invalidEc: '' },
    { number: 4, condition: '',                   validEc: '',                                          invalidEc: 'usageCount>0 → referenced (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, usageCount=0', expected: 'Resolves void, exercise deleted' },
    { noTc: 2, ec: '2',   inputData: 'id = "nonexistent-id"',   expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'id exists, usageCount=3', expected: 'Throws ConflictError' },
  ],
  bvaRows: [
    { number: 1, condition: 'usageCount boundary', testCase: 'usageCount=0 → delete allowed' },
    { number: '',condition: '',                     testCase: 'usageCount=1 → delete blocked' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'usageCount=0', inputData: 'existing id, usageCount=0', expected: 'Resolves void' },
    { noTc: 2, bva: 'usageCount=1', inputData: 'existing id, usageCount=1', expected: 'Throws ConflictError' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing id, usageCount=0',                   expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Non-existent id',                             expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-2', inputData: 'Existing id, usageCount=3',                   expected: 'Throws ConflictError' },
    { noTc: 4, fromEc: 'EP-3', fromBva: 'BVA-2', inputData: 'Existing id, usageCount=1 (boundary – exactly one reference)', expected: 'Throws ConflictError' },
  ],
};

// ── workout-session-repository ─────────────────────────────────────────────────

const wsCreateBbt: BbtDescriptor = {
  reqId: 'WSM-01/WSM-02/WSM-03/WSM-04',
  tcCount: 6,
  statement: 'WorkoutSessionRepository.create(data, exercises) – atomically creates a WorkoutSession and all session exercises. Throws WorkoutSessionRequiresExercisesError if exercises array is empty. Throws NotFoundError if member absent. Wraps DB failure in TransactionError.',
  data: 'Input: data: CreateWorkoutSessionInput { memberId, date, duration, notes? },  exercises: WorkoutSessionExerciseInput[] (at least one)',
  precondition: 'Database is accessible  |  exercises.length ≥ 1  |  Member with data.memberId may or may not exist',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws WorkoutSessionRequiresExercisesError / NotFoundError / TransactionError',
  postcondition: 'On success: WorkoutSession + all WorkoutSessionExercise rows persisted atomically.\nOn any error: no rows written.',
  ecRows: [
    { number: 1, condition: 'exercises array', validEc: 'length ≥ 1',                                               invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                                          invalidEc: 'length = 0 (WorkoutSessionRequiresExercisesError)' },
    { number: 3, condition: 'member existence',validEc: 'member found',                                             invalidEc: '' },
    { number: 4, condition: '',                validEc: '',                                                          invalidEc: 'member not found (NotFoundError)' },
    { number: 5, condition: 'DB write',        validEc: 'write succeeds',                                           invalidEc: '' },
    { number: 6, condition: '',                validEc: '',                                                          invalidEc: 'write fails (TransactionError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5', inputData: 'Valid session data, 1 exercise, member exists',       expected: 'Returns WorkoutSessionWithExercises, exercises.length=1' },
    { noTc: 2, ec: '2',     inputData: 'Valid session data, exercises=[]',                    expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, ec: '4',     inputData: 'Valid session data, 1 exercise, member not found',   expected: 'Throws NotFoundError' },
    { noTc: 4, ec: '6',     inputData: 'Valid session data, 1 exercise, DB write throws',    expected: 'Throws TransactionError' },
  ],
  bvaRows: [
    { number: 1, condition: 'exercises.length boundary', testCase: 'exercises=[] (length=0) → error' },
    { number: '',condition: '',                           testCase: 'exercises=[1 item] (length=1) → success' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'exercises.length=0', inputData: 'exercises=[], valid session data', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 2, bva: 'exercises.length=1', inputData: 'exercises=[1 item], member exists', expected: 'Returns WorkoutSessionWithExercises' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: '1 exercise, valid member',                          expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'exercises=[]',                                      expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: '1 exercise, member not found',                     expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: '1 exercise, DB write fails',                       expected: 'Throws TransactionError' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '',       inputData: 'Valid session data with notes=null',                expected: 'Returns session with notes=null' },
    { noTc: 6, fromEc: 'EP-1', fromBva: '',       inputData: '3 exercises → all 3 persisted and returned',       expected: 'session.exercises.length=3' },
  ],
};

const wsFindByIdBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 2,
  statement: 'WorkoutSessionRepository.findById(id) – retrieves a WorkoutSession by ID, including all session exercises and their catalogue Exercise entries. Throws NotFoundError if absent.',
  data: 'Input: id: string',
  precondition: 'Database is accessible',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws NotFoundError',
  postcondition: 'On success: returns WorkoutSessionWithExercises.\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session found',                invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                              invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id = existing session UUID', expected: 'Returns WorkoutSessionWithExercises, exercises.length=1' },
    { noTc: 2, ec: '2', inputData: 'id = "nonexistent-id"',      expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id', expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',     expected: 'Throws NotFoundError' },
  ],
};

const wsFindAllBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 9,
  statement: 'WorkoutSessionRepository.findAll(options?) – returns a filtered, paginated list of WorkoutSessions. Supports filter by memberId, date range (startDate/endDate), and optional pagination. Paginated results are sorted newest-first; unpaginated results are oldest-first.',
  data: 'Input: WorkoutSessionListOptions? { memberId?, startDate?, endDate?, page?, pageSize? }',
  precondition: 'Database is accessible',
  results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>> = { items, total }',
  postcondition: 'Returns filtered page. Empty result when no sessions match.',
  ecRows: [
    { number: 1, condition: 'memberId filter', validEc: 'no filter → all sessions',              invalidEc: '' },
    { number: 2, condition: '',                validEc: 'memberId set → filtered by member',      invalidEc: '' },
    { number: 3, condition: 'date range',      validEc: 'no range → all dates',                  invalidEc: '' },
    { number: 4, condition: '',                validEc: 'startDate+endDate → range filtered',     invalidEc: '' },
    { number: 5, condition: 'pagination',      validEc: 'no page → unpaginated (all results)',    invalidEc: '' },
    { number: 6, condition: '',                validEc: 'page+pageSize → paginated results',      invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5', inputData: 'No options, 1 session in DB',                    expected: 'items.length=1, total=1' },
    { noTc: 2, ec: '2',     inputData: 'memberId="member-001", 1 matching session',       expected: 'items.length=1' },
    { noTc: 3, ec: '4',     inputData: 'startDate=2024-01-01, endDate=2024-12-31',        expected: 'total=1' },
    { noTc: 4, ec: '6',     inputData: 'page=2, pageSize=10, total=30',                  expected: 'total=30, items.length=0' },
  ],
  bvaRows: [
    { number: 1, condition: 'empty DB boundary', testCase: 'No sessions in DB → total=0, items=[]' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'empty DB', inputData: 'No options, DB empty', expected: 'items=[], total=0' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 session',                           expected: 'items.length=1, total=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'memberId filter',                                 expected: 'items.length=1' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',      inputData: 'Date range filter',                               expected: 'total=1' },
    { noTc: 4, fromEc: 'EP-4', fromBva: 'BVA-1', inputData: 'page=2, pageSize=10, total=30',                  expected: 'total=30, items.length=0' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 2 sessions → results ordered ascending (oldest first)', expected: 'sessions returned oldest-first' },
    { noTc: 6, fromEc: 'EP-4', fromBva: '',      inputData: 'page+pageSize provided → results ordered descending (newest first)', expected: 'sessions returned newest-first' },
    { noTc: 7, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'memberId filter with no matching sessions',       expected: 'items=[], total=0' },
    { noTc: 8, fromEc: 'EP-4', fromBva: '',      inputData: 'page=2, pageSize=10 → skip=10',                   expected: 'prisma called with skip=10, take=10' },
    { noTc: 9, fromEc: 'EP-2', fromBva: '',      inputData: 'memberId + startDate + endDate combined filter',   expected: 'all three where conditions applied' },
  ],
};

const wsUpdateBbt: BbtDescriptor = {
  reqId: 'WSM-06',
  tcCount: 2,
  statement: 'WorkoutSessionRepository.update(id, data) – updates session metadata only (date, duration, notes). Does not touch session exercises. Throws NotFoundError if session absent.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput { date?, duration?, notes? }',
  precondition: 'Database is accessible  |  Session may or may not exist',
  results: 'Output: Promise<WorkoutSession>  OR  throws NotFoundError',
  postcondition: 'On success: session metadata updated, exercises untouched.\nOn NotFoundError: no change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session found',                invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                              invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id exists, { duration: 75 }', expected: 'Returns WorkoutSession with duration=75' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", any data',   expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'duration boundaries validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing id, { duration: 75 }', expected: 'Returns session with duration=75' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',               expected: 'Throws NotFoundError' },
  ],
};

const wsUpdateWithExercisesBbt: BbtDescriptor = {
  reqId: 'WSM-06/WSM-07',
  tcCount: 7,
  statement: 'WorkoutSessionRepository.updateWithExercises(id, data, exercises) – atomically replaces session metadata and all exercise entries in a single transaction. Throws WorkoutSessionRequiresExercisesError if exercises array is empty. Throws NotFoundError if session absent. Wraps DB failure in TransactionError.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[] (at least one)',
  precondition: 'Database is accessible  |  exercises.length ≥ 1  |  Session may or may not exist',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws WorkoutSessionRequiresExercisesError / NotFoundError / TransactionError',
  postcondition: 'On success: session metadata + exercises fully replaced atomically.\nOn any error: no change.',
  ecRows: [
    { number: 1, condition: 'exercises array', validEc: 'length ≥ 1',                                              invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                                         invalidEc: 'length = 0 (WorkoutSessionRequiresExercisesError)' },
    { number: 3, condition: 'session existence',validEc: 'session found',                                          invalidEc: '' },
    { number: 4, condition: '',                validEc: '',                                                         invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, valid data, 1 new exercise',           expected: 'Returns updated WorkoutSessionWithExercises' },
    { noTc: 2, ec: '2',   inputData: 'id exists, valid data, exercises=[]',             expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, ec: '4',   inputData: '"nonexistent-id", valid data, 1 exercise',        expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'exercises.length boundary', testCase: 'exercises=[] → error' },
    { number: '',condition: '',                           testCase: 'exercises=[1 item] → success' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'exercises.length=0', inputData: 'exercises=[], existing session', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 2, bva: 'exercises.length=1', inputData: 'exercises=[1 item], existing session', expected: 'Returns WorkoutSessionWithExercises' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Existing id, 1 exercise',                           expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'exercises=[]',                                       expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Non-existent session id',                           expected: 'Throws NotFoundError' },
    { noTc: 4, fromEc: 'EP-1', fromBva: '',       inputData: 'Exercise with existing id → updated in place (not deleted/re-created)', expected: 'exercise row preserved with same id' },
    { noTc: 5, fromEc: 'EP-1', fromBva: '',       inputData: 'Exercise not in new list → deleted (stale)',        expected: 'stale exercise row removed' },
    { noTc: 6, fromEc: 'EP-1', fromBva: '',       inputData: 'Mixed: kept, new, and stale exercises',             expected: 'kept updated, stale deleted, new created' },
    { noTc: 7, fromEc: 'EP-3', fromBva: '',       inputData: 'Valid data, transaction fails',                     expected: 'Throws TransactionError' },
  ],
};

const wsDeleteBbt: BbtDescriptor = {
  reqId: 'WSM-08',
  tcCount: 2,
  statement: 'WorkoutSessionRepository.delete(id) – permanently removes a WorkoutSession and all its SessionExercise rows (cascade). Throws NotFoundError if session absent.',
  data: 'Input: id: string',
  precondition: 'Database is accessible  |  Session may or may not exist',
  results: 'Output: Promise<void>  OR  throws NotFoundError',
  postcondition: 'On success: WorkoutSession + all child WorkoutSessionExercise rows deleted.\nOn NotFoundError: no change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session found',                invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                              invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id = existing session UUID', expected: 'Resolves void, session + exercises deleted' },
    { noTc: 2, ec: '2', inputData: 'id = "nonexistent-id"',      expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',     expected: 'Throws NotFoundError' },
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
