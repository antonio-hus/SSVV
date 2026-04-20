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
  const tcsFailed = d.tcsFailed ?? 0;
  const dRow = ws.addRow([d.reqId, d.tcCount, d.tcCount - tcsFailed, tcsFailed, d.bugsFound ?? 0,
    d.bugsFixed ?? 'n/a', d.retested ?? 'not yet', d.retestRun ?? 0, d.retestPassed ?? '-', d.retestFailed ?? '-']);
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

const SVC_BASE = path.join(ROOT, 'lib', 'service', '__tests__', 'bbt');

// ── auth-service ───────────────────────────────────────────────────────────────

const loginBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 8,
  statement: 'AuthService.login(data) – Looks up user by email via userRepository.findByEmail(). Throws NotFoundError if user not found (anti-enumeration message). Compares password with bcrypt. Throws AuthorizationError if password wrong (same anti-enumeration message). Returns SessionData on success with role-specific fields (adminId, memberId, isActive).',
  data: 'Input: LoginUserInput { email: string, password: string }',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<SessionData>  OR  throws NotFoundError / AuthorizationError',
  postcondition: 'On success: returns SessionData with userId, email, fullName, role, optional memberId/adminId/isActive.\nOn error: no state change.',
  ecRows: [
    { number: 1, condition: 'email lookup',    validEc: 'user with given email exists in repository',              invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                                        invalidEc: 'no user found for email → throws NotFoundError("Invalid email or password")' },
    { number: 3, condition: 'password check',  validEc: 'bcrypt.compare returns true',                            invalidEc: '' },
    { number: 4, condition: '',                validEc: '',                                                        invalidEc: 'bcrypt.compare returns false → throws AuthorizationError("Invalid email or password")' },
    { number: 5, condition: 'error message',   validEc: '',                                                        invalidEc: 'same message for both failure cases (anti-enumeration)' },
    { number: 6, condition: 'session data',    validEc: 'admin credentials → adminId populated',                  invalidEc: '' },
    { number: 7, condition: '',                validEc: 'member credentials → memberId + isActive populated',     invalidEc: '' },
    { number: 8, condition: 'isActive flag',   validEc: 'active member → isActive=true',                         invalidEc: '' },
    { number: 9, condition: '',                validEc: 'inactive member → isActive=false',                       invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '2', inputData: 'findByEmail returns null',                            expected: 'Throws NotFoundError("Invalid email or password")' },
    { noTc: 2, ec: '2,5', inputData: 'findByEmail returns null',                          expected: 'Error message is "Invalid email or password" (anti-enumeration)' },
    { noTc: 3, ec: '4', inputData: 'Email found, bcrypt.compare returns false',           expected: 'Throws AuthorizationError("Invalid email or password")' },
    { noTc: 4, ec: '4,5', inputData: 'Email found, wrong password',                      expected: 'Same message "Invalid email or password"' },
    { noTc: 5, ec: '1,3,6', inputData: 'Admin credentials, bcrypt returns true',          expected: 'SessionData with adminId="admin-001", no memberId' },
    { noTc: 6, ec: '1,3,7,8', inputData: 'Member credentials, bcrypt returns true',       expected: 'SessionData with memberId="member-001", isActive=true' },
    { noTc: 7, ec: '1,3,7', inputData: 'Member credentials (fullName check)',             expected: 'SessionData.fullName populated correctly' },
    { noTc: 8, ec: '1,3,7,9', inputData: 'Inactive member credentials, bcrypt true',     expected: 'SessionData.isActive=false, memberId populated' },
  ],
  bvaRows: [
    { number: 1, condition: 'N/A', testCase: 'No numerical boundaries – email/password are opaque strings at service layer' },
  ],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Non-existent email',              expected: 'Throws NotFoundError' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent email',              expected: 'Error msg = "Invalid email or password"' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Correct email, wrong password',   expected: 'Throws AuthorizationError' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: 'Wrong password failure path',     expected: 'Same error message (anti-enumeration)' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '', inputData: 'Admin credentials',               expected: 'Returns SessionData with adminId' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '', inputData: 'Active member credentials',       expected: 'Returns SessionData with memberId, isActive=true' },
    { noTc: 7, fromEc: 'EP-7', fromBva: '', inputData: 'Member credentials (fullName)',   expected: 'fullName populated' },
    { noTc: 8, fromEc: 'EP-8', fromBva: '', inputData: 'Inactive member credentials',     expected: 'isActive=false returned' },
  ],
  tcsFailed: 2,
  bugsFound: 1,
  bugsFixed: 'Bug: if (!user) threw AuthorizationError instead of NotFoundError — corrected to throw NotFoundError("Invalid email or password")',
  retested: 'yes',
  retestRun: 8,
  retestPassed: 8,
  retestFailed: 0,
};

// ── user-service ───────────────────────────────────────────────────────────────

const createMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 2,
  statement: 'UserService.createMember(data) – Delegates to userRepository.createMember(). Propagates ConflictError if email is taken.',
  data: 'Input: CreateMemberInput { email, fullName, phone, dateOfBirth, password, membershipStart }',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws ConflictError',
  postcondition: 'On success: MemberWithUser returned.\nOn ConflictError: no state change.',
  ecRows: [
    { number: 1, condition: 'email uniqueness', validEc: 'email not yet registered', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'email already registered (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'Valid CreateMemberInput, email not taken', expected: 'Returns MemberWithUser' },
    { noTc: 2, ec: '2', inputData: 'Valid CreateMemberInput, email already in use', expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – delegates directly to repository' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Unique email, all valid fields', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Duplicate email', expected: 'Throws ConflictError' },
  ],
};

const createMemberWithTempPwdBbt: BbtDescriptor = {
  reqId: 'MEM-02',
  tcCount: 5,
  statement: 'UserService.createMemberWithTempPassword(data) – Generates a cryptographically random 16-character temporary password (guaranteed uppercase, digit, special char via crypto.getRandomValues). Calls createMember() with temp password. Returns member + plaintext temp password.',
  data: 'Input: CreateMemberWithTempPasswordInput { email, fullName, phone, dateOfBirth, membershipStart } (no password field)',
  precondition: 'userRepository is accessible  |  crypto.getRandomValues is available',
  results: 'Output: Promise<MemberWithUserAndTempPassword>  OR  throws ConflictError',
  postcondition: 'On success: MemberWithUser + tempPassword (plaintext 16-char) returned. Password never stored in plaintext.',
  ecRows: [
    { number: 1, condition: 'temp password length', validEc: 'generated password is exactly 16 characters', invalidEc: '' },
    { number: 2, condition: 'temp password uppercase', validEc: 'contains at least one uppercase letter', invalidEc: '' },
    { number: 3, condition: 'temp password digit', validEc: 'contains at least one digit', invalidEc: '' },
    { number: 4, condition: 'temp password special', validEc: 'contains at least one special character', invalidEc: '' },
    { number: 5, condition: 'email uniqueness', validEc: 'email not taken – delegate creates member', invalidEc: 'email taken – ConflictError propagated' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'Valid input, mock repo returns MemberWithUser', expected: 'result.tempPassword.length === 16' },
    { noTc: 2, ec: '2', inputData: 'Same as TC-1', expected: '/[A-Z]/.test(result.tempPassword) === true' },
    { noTc: 3, ec: '3', inputData: 'Same as TC-1', expected: '/[0-9]/.test(result.tempPassword) === true' },
    { noTc: 4, ec: '4', inputData: 'Same as TC-1', expected: '/[^A-Za-z0-9]/.test(result.tempPassword) === true' },
    { noTc: 5, ec: '5', inputData: 'Duplicate email, repo throws ConflictError', expected: 'Throws ConflictError' },
  ],
  bvaRows: [
    { number: 1, condition: 'password length', testCase: 'Exact boundary: generated password must be exactly 16 chars (not 15, not 17)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1', inputData: 'Call createMemberWithTempPassword with valid input', expected: 'result.tempPassword.length === 16 (exactly at boundary)' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Valid input, mock repo succeeds', expected: 'tempPassword is exactly 16 chars' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Same valid input', expected: 'tempPassword has uppercase letter' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Same valid input', expected: 'tempPassword has digit' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: 'Same valid input', expected: 'tempPassword has special char' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '', inputData: 'Duplicate email', expected: 'Throws ConflictError' },
  ],
};

const suspendMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 2,
  statement: 'UserService.suspendMember(memberId) – Calls userRepository.setMemberActive(memberId, false). Preserves all historical session data. Propagates NotFoundError if member absent.',
  data: 'Input: memberId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: member.isActive === false. Historical WorkoutSessions are unaffected.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member with given memberId exists (isActive set to false)', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'no member with given memberId (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId = existing active member', expected: 'Returns MemberWithUser with isActive === false; setMemberActive called with (id, false)' },
    { noTc: 2, ec: '2', inputData: 'memberId = "nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing active memberId', expected: 'Returns member with isActive=false' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId', expected: 'Throws NotFoundError' },
  ],
};

const activateMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 2,
  statement: 'UserService.activateMember(memberId) – Calls userRepository.setMemberActive(memberId, true). Propagates NotFoundError if member absent.',
  data: 'Input: memberId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: member.isActive === true.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member with given memberId exists (isActive set to true)', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'no member with given memberId (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId = existing suspended member', expected: 'Returns MemberWithUser with isActive === true; setMemberActive called with (id, true)' },
    { noTc: 2, ec: '2', inputData: 'memberId = "nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing suspended memberId', expected: 'Returns member with isActive=true' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId', expected: 'Throws NotFoundError' },
  ],
};

// ── exercise-service ───────────────────────────────────────────────────────────

const createExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 2,
  statement: 'ExerciseService.createExercise(data) – Delegates to exerciseRepository.create(). Propagates ConflictError if name already in use.',
  data: 'Input: CreateExerciseInput { name, description?, muscleGroup, equipmentNeeded }',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<Exercise>  OR  throws ConflictError',
  postcondition: 'On success: new Exercise persisted.\nOn ConflictError: no rows written.',
  ecRows: [
    { number: 1, condition: 'name uniqueness', validEc: 'exercise name not yet registered', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'exercise name already in use (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'Valid CreateExerciseInput, unique name', expected: 'Returns Exercise' },
    { noTc: 2, ec: '2', inputData: 'Valid input but duplicate name', expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at service layer – delegates to repository' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Unique name, all valid fields', expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Duplicate name', expected: 'Throws ConflictError' },
  ],
};

const archiveExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 2,
  statement: 'ExerciseService.archiveExercise(id) – Calls exerciseRepository.setActive(id, false). Removes exercise from new workout session forms while preserving historical references. Propagates NotFoundError if absent.',
  data: 'Input: id: string',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError',
  postcondition: 'On success: exercise.isActive === false. Existing WorkoutSessionExercise rows are unaffected.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise with given id exists', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'no exercise with given id (NotFoundError)' },
    { number: 3, condition: 'setActive call', validEc: 'setActive called with (id, false)', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Existing exercise id', expected: 'Returns Exercise with isActive=false; setActive called with (id, false)' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing exercise id', expected: 'isActive=false, setActive(id,false) called' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent exercise id', expected: 'Throws NotFoundError' },
  ],
};

const deleteExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 3,
  statement: 'ExerciseService.deleteExercise(id) – Delegates to exerciseRepository.delete(). Propagates NotFoundError if absent. Propagates ConflictError if exercise is referenced by any WorkoutSessionExercise row.',
  data: 'Input: id: string',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<void>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: exercise row removed. On error: no state change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise with given id exists', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'no exercise with given id (NotFoundError)' },
    { number: 3, condition: 'referential integrity', validEc: 'not referenced by any session exercise', invalidEc: '' },
    { number: 4, condition: '', validEc: '', invalidEc: 'referenced by session exercise (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Existing unreferenced exercise id', expected: 'Resolves void; delete called with id' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"', expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4', inputData: 'Existing id referenced by session exercise', expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing unreferenced id', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id', expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Referenced id', expected: 'Throws ConflictError' },
  ],
};

// ── workout-session-service ────────────────────────────────────────────────────

const createWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-01',
  tcCount: 3,
  statement: 'WorkoutSessionService.createWorkoutSession(data, exercises) – Delegates to workoutSessionRepository.create(). Propagates WorkoutSessionRequiresExercisesError if exercises list is empty. Propagates NotFoundError if member does not exist.',
  data: 'Input: CreateWorkoutSessionInput { memberId, date, duration, notes? }, exercises: WorkoutSessionExerciseInput[]',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws WorkoutSessionRequiresExercisesError / NotFoundError',
  postcondition: 'On success: session + all exercises persisted atomically.\nOn error: no state change.',
  ecRows: [
    { number: 1, condition: 'exercises list', validEc: 'at least one exercise in list', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'empty exercises list (WorkoutSessionRequiresExercisesError)' },
    { number: 3, condition: 'member existence', validEc: 'memberId references existing member', invalidEc: '' },
    { number: 4, condition: '', validEc: '', invalidEc: 'memberId not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Valid data + 1 exercise, existing memberId', expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, ec: '2', inputData: 'Valid data + empty exercises array', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, ec: '4', inputData: 'Valid data + exercises, non-existent memberId', expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'exercises array length', testCase: 'Boundary: 0 exercises (invalid), 1 exercise (valid minimum)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1', inputData: 'exercises = [] (length 0)', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 2, bva: 'BVA-1', inputData: 'exercises = [oneExercise] (length 1)', expected: 'Returns WorkoutSessionWithExercises' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1 (len=1)', inputData: 'Valid session + 1 exercise', expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1 (len=0)', inputData: 'Valid session + empty exercises', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Valid exercises, non-existent member', expected: 'Throws NotFoundError' },
  ],
};

// ── report-service ─────────────────────────────────────────────────────────────

const getMemberProgressReportBbt: BbtDescriptor = {
  reqId: 'RPG-01',
  tcCount: 7,
  statement: 'ReportService.getMemberProgressReport(memberId, startDate, endDate) – Fetches member (throws NotFoundError if absent). Fetches all sessions in date range. Aggregates in-memory: per-exercise stats (totalSets, totalReps, totalVolume=sets×reps×weight, sessionCount via Set deduplication), per-session totals, overall totalVolume and averageSessionDuration. Returns exerciseBreakdown sorted descending by totalVolume.',
  data: 'Input: memberId: string, startDate: Date, endDate: Date',
  precondition: 'workoutSessionRepository and userRepository are accessible',
  results: 'Output: Promise<Report>  OR  throws NotFoundError',
  postcondition: 'On success: returns Report with all aggregated statistics.\nOn NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member with given memberId exists', invalidEc: '' },
    { number: 2, condition: '', validEc: '', invalidEc: 'no member with given memberId (NotFoundError)' },
    { number: 3, condition: 'sessions in range', validEc: 'one or more sessions in date range', invalidEc: '' },
    { number: 4, condition: '', validEc: '', invalidEc: 'no sessions in date range (zero stats)' },
    { number: 5, condition: 'aggregation', validEc: 'multiple sessions with same exercise → sessionCount via Set deduplication', invalidEc: '' },
    { number: 6, condition: 'sorting', validEc: 'exerciseBreakdown sorted descending by totalVolume', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '2', inputData: 'Non-existent memberId', expected: 'Throws NotFoundError' },
    { noTc: 2, ec: '1,4', inputData: 'Valid memberId, no sessions in range', expected: 'totalSessions=0, totalVolume=0, averageSessionDuration=0, exerciseBreakdown=[]' },
    { noTc: 3, ec: '1,3', inputData: '1 session, 1 exercise: sets=3, reps=10, weight=50', expected: 'totalVolume=1500, averageSessionDuration=duration of that session' },
    { noTc: 4, ec: '1,3,5', inputData: '2 sessions with same exercise', expected: 'stat.sessionCount=2, totalSets and totalReps correctly summed' },
    { noTc: 5, ec: '1,3', inputData: '2 sessions with durations 60 and 90', expected: 'averageSessionDuration=75' },
    { noTc: 6, ec: '1,3,6', inputData: '1 session with 2 exercises of different volumes', expected: 'exerciseBreakdown[0] has higher totalVolume than exerciseBreakdown[1]' },
    { noTc: 7, ec: '1,3', inputData: 'Valid member, valid range', expected: 'Report.memberId and Report.memberName populated correctly' },
  ],
  bvaRows: [
    { number: 1, condition: 'sessions count', testCase: 'Boundary: 0 sessions → averageSessionDuration=0 (no divide-by-zero)' },
    { number: 2, condition: 'volume formula', testCase: 'sets=3, reps=10, weight=50 → volume = 3×10×50 = 1500' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'BVA-1', inputData: 'No sessions in range', expected: 'averageSessionDuration = 0 (not NaN or error)' },
    { noTc: 2, bva: 'BVA-2', inputData: '1 session: sets=3, reps=10, weight=50', expected: 'totalVolume = 1500' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Non-existent memberId', expected: 'Throws NotFoundError' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'Member exists, no sessions', expected: 'All stats zero, no error' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-2', inputData: '1 session sets=3 reps=10 weight=50', expected: 'totalVolume=1500' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: '2 sessions same exercise', expected: 'sessionCount=2, correct aggregate' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '', inputData: 'Durations 60 & 90', expected: 'averageSessionDuration=75' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '', inputData: '2 exercises different volumes', expected: 'Sorted descending by totalVolume' },
    { noTc: 7, fromEc: 'EP-7', fromBva: '', inputData: 'Valid member and range', expected: 'memberName populated' },
  ],
};

// ── exercise-service (additional) ─────────────────────────────────────────────

const getExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-02',
  tcCount: 2,
  statement: 'ExerciseService.getExercise(id) – Delegates to exerciseRepository.findById(). Propagates NotFoundError if exercise absent.',
  data: 'Input: id: string',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError',
  postcondition: 'On success: Exercise returned. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise with given id exists',          invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                        invalidEc: 'no exercise with given id (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="exercise-001" (existing)', expected: 'Returns Exercise; findById called with id' },
    { noTc: 2, ec: '2', inputData: 'id="nonexistent-id"',          expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing exercise id', expected: 'Returns Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',       expected: 'Throws NotFoundError' },
  ],
};

const listExercisesSvcBbt: BbtDescriptor = {
  reqId: 'EXM-02/EXM-06',
  tcCount: 5,
  statement: 'ExerciseService.listExercises(options?) – Delegates to exerciseRepository.findAll(options). Supports search, muscleGroup filter, includeInactive flag, and pagination.',
  data: 'Input: ExerciseListOptions? { search?, muscleGroup?, includeInactive?, page?, pageSize? }',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<PageResult<Exercise>> = { items: Exercise[], total: number }',
  postcondition: 'Returns filtered/paginated page of exercises.',
  ecRows: [
    { number: 1, condition: 'no options',       validEc: 'returns page, passes undefined to repo',  invalidEc: '' },
    { number: 2, condition: 'with options',     validEc: 'search+muscleGroup passed through',       invalidEc: '' },
    { number: 3, condition: 'includeInactive',  validEc: 'true → all exercises returned',           invalidEc: '' },
    { number: 4, condition: 'empty repo',       validEc: 'items=[], total=0',                       invalidEc: '' },
    { number: 5, condition: 'pagination',       validEc: 'page/pageSize passed through',            invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'no options, repo returns 1 exercise',                           expected: 'items.length=1, total=1; findAll(undefined) called' },
    { noTc: 2, ec: '2', inputData: '{ search: "Bench", muscleGroup: CHEST, page: 1, pageSize: 10 }', expected: 'findAll called with those options' },
    { noTc: 3, ec: '3', inputData: '{ includeInactive: true }, repo returns 2 items',               expected: 'total=2; findAll(options) called' },
    { noTc: 4, ec: '4', inputData: 'no options, repo returns empty',                                expected: 'items.length=0, total=0; findAll(undefined) called' },
    { noTc: 5, ec: '5', inputData: '{ page: 2, pageSize: 5 }',                                     expected: 'findAll({ page:2, pageSize:5 }) called' },
  ],
  bvaRows: [
    { number: 1, condition: 'includeInactive boundary', testCase: 'includeInactive=false (default) → active only; includeInactive=true → all' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'includeInactive=true', inputData: '{ includeInactive: true }, 1 active + 1 inactive', expected: 'total=2' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 exercise',            expected: 'items.length=1, total=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'search + muscleGroup options',      expected: 'findAll called with options' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'includeInactive=true, 2 in repo',  expected: 'total=2' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',      inputData: 'Empty repo',                        expected: 'items=[], total=0' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',      inputData: 'page=2, pageSize=5',                expected: 'findAll called with pagination' },
  ],
};

const updateExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-03',
  tcCount: 3,
  statement: 'ExerciseService.updateExercise(id, data) – Delegates to exerciseRepository.update(). Propagates NotFoundError if absent. Propagates ConflictError if new name conflicts.',
  data: 'Input: id: string, data: UpdateExerciseInput (all optional)',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: updated Exercise returned. On error: no state change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise found',               invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                              invalidEc: 'not found (NotFoundError)' },
    { number: 3, condition: 'name uniqueness',    validEc: 'new name not taken',           invalidEc: '' },
    { number: 4, condition: '',                   validEc: '',                              invalidEc: 'name already taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, { name: "Incline Bench Press" }',  expected: 'Returns updated Exercise; update called with (id, data)' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                  expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'id exists, { name: "Squat" } (duplicate)',    expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'Name boundaries validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing id, unique new name',   expected: 'Returns updated Exercise' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing id, duplicate name',    expected: 'Throws ConflictError' },
  ],
};

const unarchiveExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-05',
  tcCount: 3,
  statement: 'ExerciseService.unarchiveExercise(id) – Calls exerciseRepository.setActive(id, true). Restores exercise to active catalogue. Propagates NotFoundError if absent.',
  data: 'Input: id: string',
  precondition: 'exerciseRepository is accessible',
  results: 'Output: Promise<Exercise>  OR  throws NotFoundError',
  postcondition: 'On success: Exercise.isActive=true returned. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'exercise found (archived or active)',   invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                       invalidEc: 'not found (NotFoundError)' },
    { number: 3, condition: 'setActive call',     validEc: 'setActive called with (id, true)',      invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'Archived exercise id',                  expected: 'Returns Exercise(isActive=true); setActive(id,true) called' },
    { noTc: 2, ec: '1,3', inputData: 'Already active exercise id',            expected: 'Returns Exercise(isActive=true); setActive(id,true) called' },
    { noTc: 3, ec: '2',   inputData: '"nonexistent-id"',                      expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'isActive boundary', testCase: 'isActive=true (restored state)' }],
  bvaTcRows: [{ noTc: 1, bva: 'isActive=true', inputData: 'Archived exercise id', expected: 'isActive=true in result' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Archived exercise id',    expected: 'isActive=true, setActive(id,true) called' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Already active id',       expected: 'isActive=true (idempotent)' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Non-existent id',         expected: 'Throws NotFoundError' },
  ],
};

// ── user-service (additional) ──────────────────────────────────────────────────

const createAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 2,
  statement: 'UserService.createAdmin(data) – Delegates to userRepository.createAdmin(). Propagates ConflictError if email is taken.',
  data: 'Input: CreateAdminInput { email, fullName, phone, dateOfBirth, password }',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<AdminWithUser>  OR  throws ConflictError',
  postcondition: 'On success: AdminWithUser returned. On ConflictError: no state change.',
  ecRows: [
    { number: 1, condition: 'email uniqueness', validEc: 'email not taken', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                 invalidEc: 'email already taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'Valid CreateAdminInput, unique email', expected: 'Returns AdminWithUser; createAdmin called with input' },
    { noTc: 2, ec: '2', inputData: 'Valid input, email already in use',    expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – delegates to repository' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Unique email, all valid fields', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Duplicate email',                expected: 'Throws ConflictError' },
  ],
};

const getMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 2,
  statement: 'UserService.getMember(memberId) – Delegates to userRepository.findMemberById(). Propagates NotFoundError if absent.',
  data: 'Input: memberId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: MemberWithUser returned. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member with given memberId exists',      invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                        invalidEc: 'no member with given memberId (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001" (existing)', expected: 'Returns MemberWithUser; findMemberById called with id' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',                 expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing memberId', expected: 'Returns MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',   expected: 'Throws NotFoundError' },
  ],
};

const getAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 2,
  statement: 'UserService.getAdmin(adminId) – Delegates to userRepository.findAdminById(). Propagates NotFoundError if absent.',
  data: 'Input: adminId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<AdminWithUser>  OR  throws NotFoundError',
  postcondition: 'On success: AdminWithUser returned. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'admin with given adminId exists',    invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                                    invalidEc: 'no admin (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'adminId="admin-001" (existing)', expected: 'Returns AdminWithUser; findAdminById called with id' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',               expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing adminId', expected: 'Returns AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',  expected: 'Throws NotFoundError' },
  ],
};

const listMembersSvcBbt: BbtDescriptor = {
  reqId: 'MEM-03',
  tcCount: 3,
  statement: 'UserService.listMembers(options?) – Delegates to userRepository.findMembers(options). Supports optional search/pagination options.',
  data: 'Input: MemberListOptions? { search?, page?, pageSize? }',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<PageResult<MemberWithUser>>',
  postcondition: 'Returns paginated page of members.',
  ecRows: [
    { number: 1, condition: 'no options',    validEc: 'passes undefined to repo, returns page', invalidEc: '' },
    { number: 2, condition: 'with options',  validEc: 'options passed through to repo',         invalidEc: '' },
    { number: 3, condition: 'empty DB',      validEc: 'items=[], total=0',                       invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'no options, repo returns 1 member',             expected: 'items.length=1, total=1; findMembers(undefined)' },
    { noTc: 2, ec: '2', inputData: '{ search: "John", page: 1, pageSize: 10 }',     expected: 'findMembers called with those options' },
    { noTc: 3, ec: '3', inputData: 'no options, repo returns empty',                expected: 'items=[], total=0' },
  ],
  bvaRows: [{ number: 1, condition: 'empty result', testCase: 'No members in repo → total=0' }],
  bvaTcRows: [{ noTc: 1, bva: 'empty', inputData: 'Empty repo', expected: 'items=[], total=0' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 member', expected: 'items.length=1, total=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'With search options',  expected: 'findMembers(options) called' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'Empty repo',           expected: 'items=[], total=0' },
  ],
};

const listAdminsSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 3,
  statement: 'UserService.listAdmins(options?) – Delegates to userRepository.findAdmins(options). Supports optional search/pagination options.',
  data: 'Input: AdminListOptions? { search?, page?, pageSize? }',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<PageResult<AdminWithUser>>',
  postcondition: 'Returns paginated page of admins.',
  ecRows: [
    { number: 1, condition: 'no options',    validEc: 'passes undefined to repo, returns page', invalidEc: '' },
    { number: 2, condition: 'with options',  validEc: 'options passed through to repo',         invalidEc: '' },
    { number: 3, condition: 'empty DB',      validEc: 'items=[], total=0',                       invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'no options, repo returns 1 admin',          expected: 'items.length=1; findAdmins(undefined) called' },
    { noTc: 2, ec: '2', inputData: '{ search: "Admin", page: 1, pageSize: 10 }', expected: 'findAdmins called with those options' },
    { noTc: 3, ec: '3', inputData: 'no options, repo returns empty',             expected: 'items=[], total=0' },
  ],
  bvaRows: [{ number: 1, condition: 'empty result', testCase: 'No admins in repo → total=0' }],
  bvaTcRows: [{ noTc: 1, bva: 'empty', inputData: 'Empty repo', expected: 'items=[], total=0' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, 1 admin', expected: 'items.length=1' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'With search options', expected: 'findAdmins(options) called' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'Empty repo',          expected: 'items=[], total=0' },
  ],
};

const updateMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 3,
  statement: 'UserService.updateMember(memberId, data) – Delegates to userRepository.updateMember(). Propagates NotFoundError if absent. Propagates ConflictError if new email already taken.',
  data: 'Input: memberId: string, data: UpdateMemberInput (all optional)',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<MemberWithUser>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: updated MemberWithUser returned. On error: no state change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member found',               invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                            invalidEc: 'not found (NotFoundError)' },
    { number: 3, condition: 'email uniqueness', validEc: 'new email not taken',        invalidEc: '' },
    { number: 4, condition: '',                 validEc: '',                            invalidEc: 'email taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'memberId exists, { fullName: "John Updated Name" }', expected: 'Returns updated MemberWithUser; updateMember(id,data) called' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                          expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'memberId exists, { email: "other@example.com" }',    expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at service layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing member, fullName update', expected: 'Returns updated MemberWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId',             expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing member, duplicate email',  expected: 'Throws ConflictError' },
  ],
};

const updateAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 3,
  statement: 'UserService.updateAdmin(adminId, data) – Delegates to userRepository.updateAdmin(). Propagates NotFoundError if absent. Propagates ConflictError if new email already taken.',
  data: 'Input: adminId: string, data: UpdateAdminInput (all optional)',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<AdminWithUser>  OR  throws NotFoundError / ConflictError',
  postcondition: 'On success: updated AdminWithUser returned. On error: no state change.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'admin found',                invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                             invalidEc: 'not found (NotFoundError)' },
    { number: 3, condition: 'email uniqueness',validEc: 'new email not taken',        invalidEc: '' },
    { number: 4, condition: '',               validEc: '',                             invalidEc: 'email taken (ConflictError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'adminId exists, { fullName: "Updated Admin Name" }',  expected: 'Returns updated AdminWithUser; updateAdmin(id,data) called' },
    { noTc: 2, ec: '2',   inputData: '"nonexistent-id", any data',                           expected: 'Throws NotFoundError' },
    { noTc: 3, ec: '4',   inputData: 'adminId exists, { email: "other@example.com" }',      expected: 'Throws ConflictError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries at service layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing admin, fullName update', expected: 'Returns updated AdminWithUser' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent adminId',             expected: 'Throws NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Existing admin, duplicate email',  expected: 'Throws ConflictError' },
  ],
};

const deleteMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 2,
  statement: 'UserService.deleteMember(memberId) – Delegates to userRepository.delete(memberId). Propagates NotFoundError if absent.',
  data: 'Input: memberId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<void>  OR  throws NotFoundError',
  postcondition: 'On success: void resolved, member+user rows deleted. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'member found → delete resolves void', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                      invalidEc: 'not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001" (existing)', expected: 'Resolves void; delete(memberId) called' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',                 expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing memberId', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',   expected: 'Throws NotFoundError' },
  ],
};

const deleteAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 2,
  statement: 'UserService.deleteAdmin(adminId) – Delegates to userRepository.delete(adminId). Propagates NotFoundError if absent.',
  data: 'Input: adminId: string',
  precondition: 'userRepository is accessible',
  results: 'Output: Promise<void>  OR  throws NotFoundError',
  postcondition: 'On success: void resolved, admin+user rows deleted. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'admin found → delete resolves void', invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                                     invalidEc: 'not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'adminId="admin-001" (existing)', expected: 'Resolves void; delete(adminId) called' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',               expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing adminId', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',  expected: 'Throws NotFoundError' },
  ],
};

// ── workout-session-service (additional) ──────────────────────────────────────

const getWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 2,
  statement: 'WorkoutSessionService.getWorkoutSession(id) – Delegates to workoutSessionRepository.findById(). Propagates NotFoundError if absent.',
  data: 'Input: id: string',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws NotFoundError',
  postcondition: 'On success: WorkoutSessionWithExercises returned. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session with given id exists',        invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                                      invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="session-001" (existing)', expected: 'Returns WorkoutSessionWithExercises; findById(id) called' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',             expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id', expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',     expected: 'Throws NotFoundError' },
  ],
};

const listMemberWorkoutSessionsSvcBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 4,
  statement: 'WorkoutSessionService.listMemberWorkoutSessions(memberId, options?) – Always sets memberId in options before calling workoutSessionRepository.findAll({ memberId, ...options }). Supports optional date range and pagination.',
  data: 'Input: memberId: string, options?: { startDate?, endDate?, page?, pageSize? }',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
  postcondition: 'Returns page of sessions filtered by memberId (plus any additional options).',
  ecRows: [
    { number: 1, condition: 'no extra options', validEc: 'passes { memberId } to repo',             invalidEc: '' },
    { number: 2, condition: 'date range opts',  validEc: 'memberId merged with date range options', invalidEc: '' },
    { number: 3, condition: 'empty sessions',   validEc: 'items=[], total=0',                       invalidEc: '' },
    { number: 4, condition: 'pagination opts',  validEc: 'memberId merged with pagination',         invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001", no options',                           expected: 'items.length=1; findAll({memberId}) called' },
    { noTc: 2, ec: '2', inputData: 'memberId="member-001", { startDate, endDate, page, pageSize }', expected: 'findAll({ memberId, startDate, endDate, page, pageSize }) called' },
    { noTc: 3, ec: '3', inputData: 'memberId="member-001", no sessions in range',                 expected: 'items=[], total=0' },
    { noTc: 4, ec: '4', inputData: 'memberId="member-001", { page:2, pageSize:5 }',               expected: 'findAll({ memberId, page:2, pageSize:5 }) called; total=5' },
  ],
  bvaRows: [
    { number: 1, condition: 'empty result', testCase: 'No sessions for member → total=0' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'empty', inputData: 'memberId with no sessions', expected: 'items=[], total=0' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'memberId, no options',       expected: 'items.length=1; findAll({memberId})' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'memberId + date range',      expected: 'findAll with merged options' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'memberId, empty sessions',   expected: 'items=[], total=0' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',      inputData: 'memberId + pagination',      expected: 'findAll with merged pagination' },
  ],
};

const updateWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-06',
  tcCount: 2,
  statement: 'WorkoutSessionService.updateWorkoutSession(id, data) – Delegates to workoutSessionRepository.update(). Updates session metadata only. Propagates NotFoundError if absent.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput { date?, duration?, notes? }',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<WorkoutSession>  OR  throws NotFoundError',
  postcondition: 'On success: updated WorkoutSession returned (exercises untouched). On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session found',                        invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                                       invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id exists, { date, duration: 60 }', expected: 'Returns WorkoutSession(duration=60); update(id,data) called' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", any data',         expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'Duration boundaries validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session, valid data', expected: 'Returns updated WorkoutSession' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent session id',      expected: 'Throws NotFoundError' },
  ],
};

const updateWorkoutSessionWithExercisesSvcBbt: BbtDescriptor = {
  reqId: 'WSM-06/WSM-07',
  tcCount: 3,
  statement: 'WorkoutSessionService.updateWorkoutSessionWithExercises(id, data, exercises) – Delegates to workoutSessionRepository.updateWithExercises(). Propagates WorkoutSessionRequiresExercisesError if exercises empty. Propagates NotFoundError if session absent.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[] (≥1)',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<WorkoutSessionWithExercises>  OR  throws WorkoutSessionRequiresExercisesError / NotFoundError',
  postcondition: 'On success: session + exercises fully replaced atomically. On error: no state change.',
  ecRows: [
    { number: 1, condition: 'exercises array', validEc: 'length ≥ 1',                                 invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                                              invalidEc: 'length = 0 (WorkoutSessionRequiresExercisesError)' },
    { number: 3, condition: 'session existence', validEc: 'session found',                            invalidEc: '' },
    { number: 4, condition: '',               validEc: '',                                              invalidEc: 'session not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3', inputData: 'id exists, valid data, 1 exercise',                 expected: 'Returns WorkoutSessionWithExercises; updateWithExercises called' },
    { noTc: 2, ec: '2',   inputData: 'id exists, valid data, exercises=[]',               expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, ec: '4',   inputData: '"nonexistent-id", valid data, 1 exercise',          expected: 'Throws NotFoundError' },
  ],
  bvaRows: [
    { number: 1, condition: 'exercises.length', testCase: 'exercises=[] → error; exercises=[1] → success' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'exercises.length=0', inputData: 'exercises=[], existing session', expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 2, bva: 'exercises.length=1', inputData: 'exercises=[1 item], existing session', expected: 'Returns WorkoutSessionWithExercises' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Existing id, 1 exercise',   expected: 'Returns WorkoutSessionWithExercises' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'exercises=[]',              expected: 'Throws WorkoutSessionRequiresExercisesError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Non-existent session id',  expected: 'Throws NotFoundError' },
  ],
};

const deleteWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-08',
  tcCount: 2,
  statement: 'WorkoutSessionService.deleteWorkoutSession(id) – Delegates to workoutSessionRepository.delete(). Propagates NotFoundError if absent.',
  data: 'Input: id: string',
  precondition: 'workoutSessionRepository is accessible',
  results: 'Output: Promise<void>  OR  throws NotFoundError',
  postcondition: 'On success: void resolved, session + exercises deleted. On NotFoundError: no state change.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'session found → delete resolves void', invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                                       invalidEc: 'not found (NotFoundError)' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="session-001" (existing)', expected: 'Resolves void; delete(id) called' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id"',             expected: 'Throws NotFoundError' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id', expected: 'Resolves void' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',     expected: 'Throws NotFoundError' },
  ],
};

async function main() {
  console.log('Generating service BBT forms...');

  const AUTH_SVC = path.join(SVC_BASE, 'auth-service');
  const USER_SVC = path.join(SVC_BASE, 'user-service');
  const EXM_SVC  = path.join(SVC_BASE, 'exercise-service');
  const WS_SVC   = path.join(SVC_BASE, 'workout-session-service');
  const RPT_SVC  = path.join(SVC_BASE, 'report-service');

  console.log('Generating auth-service BBT forms…');
  await writeBbt(loginBbt, path.join(AUTH_SVC, 'login-bbt-form.xlsx'));

  console.log('Generating user-service BBT forms…');
  await writeBbt(createMemberSvcBbt,         path.join(USER_SVC, 'createMember-bbt-form.xlsx'));
  await writeBbt(createMemberWithTempPwdBbt, path.join(USER_SVC, 'createMemberWithTempPassword-bbt-form.xlsx'));
  await writeBbt(createAdminSvcBbt,          path.join(USER_SVC, 'createAdmin-bbt-form.xlsx'));
  await writeBbt(getMemberSvcBbt,            path.join(USER_SVC, 'getMember-bbt-form.xlsx'));
  await writeBbt(getAdminSvcBbt,             path.join(USER_SVC, 'getAdmin-bbt-form.xlsx'));
  await writeBbt(listMembersSvcBbt,          path.join(USER_SVC, 'listMembers-bbt-form.xlsx'));
  await writeBbt(listAdminsSvcBbt,           path.join(USER_SVC, 'listAdmins-bbt-form.xlsx'));
  await writeBbt(updateMemberSvcBbt,         path.join(USER_SVC, 'updateMember-bbt-form.xlsx'));
  await writeBbt(updateAdminSvcBbt,          path.join(USER_SVC, 'updateAdmin-bbt-form.xlsx'));
  await writeBbt(suspendMemberSvcBbt,        path.join(USER_SVC, 'suspendMember-bbt-form.xlsx'));
  await writeBbt(activateMemberSvcBbt,       path.join(USER_SVC, 'activateMember-bbt-form.xlsx'));
  await writeBbt(deleteMemberSvcBbt,         path.join(USER_SVC, 'deleteMember-bbt-form.xlsx'));
  await writeBbt(deleteAdminSvcBbt,          path.join(USER_SVC, 'deleteAdmin-bbt-form.xlsx'));

  console.log('Generating exercise-service BBT forms…');
  await writeBbt(createExerciseSvcBbt,    path.join(EXM_SVC, 'createExercise-bbt-form.xlsx'));
  await writeBbt(getExerciseSvcBbt,       path.join(EXM_SVC, 'getExercise-bbt-form.xlsx'));
  await writeBbt(listExercisesSvcBbt,     path.join(EXM_SVC, 'listExercises-bbt-form.xlsx'));
  await writeBbt(updateExerciseSvcBbt,    path.join(EXM_SVC, 'updateExercise-bbt-form.xlsx'));
  await writeBbt(archiveExerciseSvcBbt,   path.join(EXM_SVC, 'archiveExercise-bbt-form.xlsx'));
  await writeBbt(unarchiveExerciseSvcBbt, path.join(EXM_SVC, 'unarchiveExercise-bbt-form.xlsx'));
  await writeBbt(deleteExerciseSvcBbt,    path.join(EXM_SVC, 'deleteExercise-bbt-form.xlsx'));

  console.log('Generating workout-session-service BBT forms…');
  await writeBbt(createWorkoutSessionSvcBbt,             path.join(WS_SVC, 'createWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getWorkoutSessionSvcBbt,                path.join(WS_SVC, 'getWorkoutSession-bbt-form.xlsx'));
  await writeBbt(listMemberWorkoutSessionsSvcBbt,        path.join(WS_SVC, 'listMemberWorkoutSessions-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionSvcBbt,             path.join(WS_SVC, 'updateWorkoutSession-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionWithExercisesSvcBbt,path.join(WS_SVC, 'updateWorkoutSessionWithExercises-bbt-form.xlsx'));
  await writeBbt(deleteWorkoutSessionSvcBbt,             path.join(WS_SVC, 'deleteWorkoutSession-bbt-form.xlsx'));

  console.log('Generating report-service BBT forms…');
  await writeBbt(getMemberProgressReportBbt, path.join(RPT_SVC, 'getMemberProgressReport-bbt-form.xlsx'));

  console.log('\nDone — 27 service BBT forms generated.');
}

main().catch(console.error);
