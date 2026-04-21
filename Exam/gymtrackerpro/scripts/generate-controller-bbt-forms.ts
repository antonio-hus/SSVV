import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');
const CTRL_BASE = path.join(ROOT, 'lib', 'controller', '__tests__', 'bbt');

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

// ── auth-controller ────────────────────────────────────────────────────────────

const loginBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 7,
  statement: 'auth-controller.login(data) – Server Action. Validates LoginUserInput (email regex + non-empty password). On valid input delegates to authService.login(), writes session fields, calls session.save(), and returns { success: true, data: SessionData }. On validation failure returns { success: false, errors }. On AppError returns { success: false, message }. On unexpected error returns { success: false, message: "An unexpected error occurred" }.',
  data: 'Input: LoginUserInput { email: string, password: string }',
  precondition: 'authService.login and getSession are mock-injected; session.save is a jest.fn()',
  results: 'Output: ActionResult<SessionData>',
  postcondition: 'On success: session is populated and saved.\nOn validation failure: no service call, no session write.\nOn error: session not written.',
  ecRows: [
    { number: 1, condition: 'email format',    validEc: 'valid email address',            invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                               invalidEc: 'invalid email format → validation error' },
    { number: 3, condition: 'password',        validEc: 'non-empty password',             invalidEc: '' },
    { number: 4, condition: '',                validEc: '',                               invalidEc: 'empty password → validation error' },
    { number: 5, condition: 'service outcome', validEc: 'authService.login resolves',     invalidEc: '' },
    { number: 6, condition: '',                validEc: '',                               invalidEc: 'service throws AuthorizationError → failure with message' },
    { number: 7, condition: '',                validEc: '',                               invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 8, condition: '',                validEc: '',                               invalidEc: 'service throws unexpected Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5', inputData: 'email="admin@gymtrackerpro.com", password="ValidPass1!"',          expected: '{ success: true }, session.save called' },
    { noTc: 2, ec: '2',     inputData: 'email="not-an-email", password="ValidPass1!"',                     expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '4',     inputData: 'email="admin@gymtrackerpro.com", password=""',                     expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '6',     inputData: 'valid input, service throws AuthorizationError("Invalid…")',       expected: '{ success: false, message: "Invalid email or password" }' },
    { noTc: 5, ec: '7',     inputData: 'valid input, service throws NotFoundError("User not found")',      expected: '{ success: false, message: "User not found" }' },
    { noTc: 6, ec: '8',     inputData: 'valid input, service throws Error("DB down")',                     expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'password length boundary', testCase: 'password with 2 chars → valid (min+1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'password=2 chars', inputData: 'password="xy"', expected: 'success=true (boundary valid)' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'Valid credentials',                      expected: 'success=true, session saved' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'Invalid email format',                   expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',      inputData: 'Empty password',                         expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',      inputData: 'Service throws AuthorizationError',      expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',      inputData: 'Service throws NotFoundError',           expected: 'success=false, message from error' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',      inputData: 'Service throws unexpected Error',        expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-1', inputData: 'Password 2 chars',                       expected: 'success=true' },
  ],
};

const logoutBbt: BbtDescriptor = {
  reqId: 'AUTH-03',
  tcCount: 1,
  statement: 'auth-controller.logout() – Server Action. Retrieves the current session via getSession() and calls session.destroy(). Returns { success: true, data: undefined }.',
  data: 'Input: none',
  precondition: 'getSession is mock-injected; session.destroy is a jest.fn()',
  results: 'Output: ActionResult<void>',
  postcondition: 'Session is destroyed. Returns success=true.',
  ecRows: [
    { number: 1, condition: 'session available', validEc: 'getSession resolves with { destroy: jest.fn() }', invalidEc: '' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'No input, session mock available', expected: '{ success: true }, session.destroy called' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical input' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'No input', expected: 'success=true, session.destroy called' },
  ],
};

// ── user-controller ────────────────────────────────────────────────────────────

const createMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 11,
  statement: 'user-controller.createMember(data) – Server Action. Validates CreateMemberInput via createMemberSchema (email, fullName ≥8 chars, phone E.164, dateOfBirth past, password ≥8, membershipStart ISO date). On valid input delegates to userService.createMember(). Returns ActionResult<MemberWithUser>.',
  data: 'Input: CreateMemberInput { email, fullName, phone, dateOfBirth, password, membershipStart }',
  precondition: 'userService.createMember is mock-injected',
  results: 'Output: ActionResult<MemberWithUser>',
  postcondition: 'On success: returns MemberWithUser.\nOn validation failure: returns errors, no service call.\nOn AppError: returns message.',
  ecRows: [
    { number: 1, condition: 'all fields valid',   validEc: 'All fields pass schema validation',                 invalidEc: '' },
    { number: 2, condition: 'fullName length',    validEc: 'fullName ≥ 8 chars',                              invalidEc: '' },
    { number: 3, condition: '',                   validEc: '',                                                  invalidEc: 'fullName < 8 chars → validation error' },
    { number: 4, condition: 'email format',       validEc: 'valid email',                                      invalidEc: '' },
    { number: 5, condition: '',                   validEc: '',                                                  invalidEc: 'invalid email → validation error' },
    { number: 6, condition: 'phone format',       validEc: 'E.164 phone',                                      invalidEc: '' },
    { number: 7, condition: '',                   validEc: '',                                                  invalidEc: 'invalid phone → validation error' },
    { number: 8, condition: 'service outcome',    validEc: 'userService.createMember resolves',                invalidEc: '' },
    { number: 9, condition: '',                   validEc: '',                                                  invalidEc: 'service throws ConflictError → failure with message' },
    { number: 10, condition: '',                  validEc: '',                                                  invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6,8',  inputData: 'VALID_MEMBER_INPUT, service resolves MemberWithUser',           expected: '{ success: true, data: MemberWithUser }' },
    { noTc: 2, ec: '3',          inputData: '{ ...VALID_MEMBER_INPUT, fullName: "Jo" }',                     expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',          inputData: '{ ...VALID_MEMBER_INPUT, email: "not-an-email" }',              expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',          inputData: '{ ...VALID_MEMBER_INPUT, phone: "12345" }',                     expected: '{ success: false, errors defined }' },
    { noTc: 5, ec: '',           inputData: '{ ...VALID_MEMBER_INPUT, dateOfBirth: "not-a-date" }',          expected: '{ success: false, errors defined }' },
    { noTc: 6, ec: '9',          inputData: 'valid input, service throws ConflictError',                     expected: '{ success: false, message: "Email already registered" }' },
    { noTc: 7, ec: '10',         inputData: 'valid input, service throws Error',                             expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName length boundary', testCase: 'fullName with 7 chars → invalid' },
    { number: '',condition: '',                          testCase: 'fullName with 8 chars → valid' },
    { number: 2, condition: '',                          testCase: 'fullName with 64 chars → valid' },
    { number: '',condition: '',                          testCase: 'fullName with 65 chars → invalid' },
    { number: 3, condition: 'fullName interior',         testCase: 'fullName with 9 chars → valid (min+1)' },
    { number: 4, condition: '',                          testCase: 'fullName with 63 chars → valid (max-1)' },
    { number: 5, condition: 'password length boundary', testCase: 'password with 9 chars → valid (min+1)' },
    { number: 6, condition: '',                          testCase: 'password with 63 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'fullName=7 chars',  inputData: '{ fullName: "1234567" }',             expected: 'success=false, errors.fullName defined' },
    { noTc: 2, bva: 'fullName=8 chars',  inputData: '{ fullName: "12345678" }',            expected: 'success=true' },
    { noTc: 3, bva: 'fullName=64 chars', inputData: '{ fullName: "a".repeat(64) }',         expected: 'success=true' },
    { noTc: 4, bva: 'fullName=65 chars', inputData: '{ fullName: "a".repeat(65) }',         expected: 'success=false, errors.fullName defined' },
    { noTc: 5, bva: 'fullName=9 chars',  inputData: '{ fullName: "John Doe1" }',           expected: 'success=true' },
    { noTc: 6, bva: 'fullName=63 chars', inputData: '{ fullName: "j".repeat(63) }',         expected: 'success=true' },
    { noTc: 7, bva: 'password=9 chars',  inputData: '{ password: "Pass1@aAb" }',           expected: 'success=true' },
    { noTc: 8, bva: 'password=63 chars', inputData: '{ password: "A1@"+ "a".repeat(60) }', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1', fromBva: '',      inputData: 'Valid input, service resolves',                    expected: 'success=true, MemberWithUser returned' },
    { noTc: 2,  fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'fullName 7 chars',                                expected: 'success=false, errors defined' },
    { noTc: 3,  fromEc: 'EP-2', fromBva: 'BVA-2', inputData: 'fullName 8 chars (boundary valid)',               expected: 'success=true' },
    { noTc: 4,  fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid email',                                  expected: 'success=false, errors defined' },
    { noTc: 5,  fromEc: 'EP-4', fromBva: '',       inputData: 'Invalid phone',                                  expected: 'success=false, errors defined' },
    { noTc: 6,  fromEc: 'EP-6', fromBva: '',       inputData: 'Valid, service throws ConflictError',            expected: 'success=false, message from error' },
    { noTc: 7,  fromEc: 'EP-7', fromBva: '',       inputData: 'Valid, service throws unexpected Error',         expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 8,  fromEc: '',     fromBva: 'BVA-5', inputData: 'fullName 9 chars',                                expected: 'success=true' },
    { noTc: 9,  fromEc: '',     fromBva: 'BVA-6', inputData: 'fullName 63 chars',                               expected: 'success=true' },
    { noTc: 10, fromEc: '',     fromBva: 'BVA-7', inputData: 'password 9 chars',                                expected: 'success=true' },
    { noTc: 11, fromEc: '',     fromBva: 'BVA-8', inputData: 'password 63 chars',                               expected: 'success=true' },
  ],
};

const createMemberWithTempPasswordCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-02',
  tcCount: 6,
  statement: 'user-controller.createMemberWithTempPassword(data) – Server Action. Validates CreateMemberWithTempPasswordInput (no password field). Delegates to userService.createMemberWithTempPassword(). Returns ActionResult<MemberWithUserAndTempPassword>.',
  data: 'Input: CreateMemberWithTempPasswordInput { email, fullName, phone, dateOfBirth, membershipStart }',
  precondition: 'userService.createMemberWithTempPassword is mock-injected',
  results: 'Output: ActionResult<MemberWithUserAndTempPassword>',
  postcondition: 'On success: MemberWithUser + tempPassword returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'all fields valid',  validEc: 'All fields pass schema',                             invalidEc: '' },
    { number: 2, condition: 'fullName length',   validEc: 'fullName ≥ 8 chars',                              invalidEc: '' },
    { number: 3, condition: '',                  validEc: '',                                                   invalidEc: 'fullName < 8 chars → validation error' },
    { number: 4, condition: 'email format',      validEc: 'valid email',                                       invalidEc: '' },
    { number: 5, condition: '',                  validEc: '',                                                   invalidEc: 'invalid email → validation error' },
    { number: 6, condition: 'service outcome',   validEc: 'resolves MemberWithUserAndTempPassword',            invalidEc: '' },
    { number: 7, condition: '',                  validEc: '',                                                   invalidEc: 'throws ConflictError → failure with message' },
    { number: 8, condition: '',                  validEc: '',                                                   invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6', inputData: 'VALID_MEMBER_NO_PWD, service resolves result',             expected: '{ success: true, data.tempPassword defined }' },
    { noTc: 2, ec: '3',       inputData: '{ ...VALID_MEMBER_NO_PWD, fullName: "Jo" }',               expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',       inputData: '{ ...VALID_MEMBER_NO_PWD, email: "bad-email" }',           expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',       inputData: 'valid input, service throws ConflictError',                expected: '{ success: false, message from error }' },
    { noTc: 5, ec: '8',       inputData: 'valid input, service throws Error',                        expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName length boundary', testCase: 'fullName 7 chars → invalid' },
    { number: '',condition: '',                          testCase: 'fullName 8 chars → valid' },
    { number: 2, condition: 'fullName interior',         testCase: 'fullName 9 chars → valid (min+1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'fullName=7', inputData: 'fullName="1234567"', expected: 'success=false, errors.fullName defined' },
    { noTc: 2, bva: 'fullName=8', inputData: 'fullName="12345678"', expected: 'schema passes (success depends on service)' },
    { noTc: 3, bva: 'fullName=9', inputData: 'fullName="John Doe1"', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'Valid input, service resolves',                  expected: 'success=true, tempPassword defined' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'fullName 7 chars',                              expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid email',                                 expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Service throws ConflictError',                  expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws unexpected Error',               expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 6, fromEc: '',     fromBva: 'BVA-3', inputData: 'fullName 9 chars',                          expected: 'success=true' },
  ],
};

const createAdminCtrlBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 9,
  statement: 'user-controller.createAdmin(data) – Server Action. Validates CreateAdminInput (email, fullName ≥8, phone, dateOfBirth, password ≥8). Delegates to userService.createAdmin(). Returns ActionResult<AdminWithUser>.',
  data: 'Input: CreateAdminInput { email, fullName, phone, dateOfBirth, password }',
  precondition: 'userService.createAdmin is mock-injected',
  results: 'Output: ActionResult<AdminWithUser>',
  postcondition: 'On success: AdminWithUser returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'all fields valid',  validEc: 'All fields pass schema',                            invalidEc: '' },
    { number: 2, condition: 'fullName length',   validEc: 'fullName ≥ 8 chars',                             invalidEc: '' },
    { number: 3, condition: '',                  validEc: '',                                                  invalidEc: 'fullName < 8 chars → validation error' },
    { number: 4, condition: 'email format',      validEc: 'valid email',                                      invalidEc: '' },
    { number: 5, condition: '',                  validEc: '',                                                  invalidEc: 'invalid email → validation error' },
    { number: 6, condition: 'service outcome',   validEc: 'resolves AdminWithUser',                           invalidEc: '' },
    { number: 7, condition: '',                  validEc: '',                                                  invalidEc: 'throws ConflictError → failure with message' },
    { number: 8, condition: '',                  validEc: '',                                                  invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6', inputData: 'VALID_ADMIN_INPUT, service resolves AdminWithUser',        expected: '{ success: true, data: AdminWithUser }' },
    { noTc: 2, ec: '3',       inputData: '{ ...VALID_ADMIN_INPUT, fullName: "Jo" }',                 expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',       inputData: '{ ...VALID_ADMIN_INPUT, email: "not-an-email" }',          expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',       inputData: 'valid input, service throws ConflictError',                expected: '{ success: false, message from error }' },
    { noTc: 5, ec: '8',       inputData: 'valid input, service throws Error',                        expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName length boundary', testCase: 'fullName 7 chars → invalid' },
    { number: '',condition: '',                          testCase: 'fullName 8 chars → valid' },
    { number: 2, condition: 'fullName boundary interior', testCase: 'fullName 9 chars → valid (min+1)' },
    { number: 3, condition: '',                          testCase: 'fullName 63 chars → valid (max-1)' },
    { number: 4, condition: 'password length boundary', testCase: 'password 9 chars → valid (min+1)' },
    { number: 5, condition: '',                          testCase: 'password 63 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'fullName=7', inputData: 'fullName="1234567"',             expected: 'success=false, errors.fullName defined' },
    { noTc: 2, bva: 'fullName=8', inputData: 'fullName="12345678"',            expected: 'schema passes' },
    { noTc: 3, bva: 'fullName=9', inputData: 'fullName="AdminAcc1"',           expected: 'success=true' },
    { noTc: 4, bva: 'fullName=63',inputData: 'fullName="B".repeat(63)',        expected: 'success=true' },
    { noTc: 5, bva: 'password=9', inputData: 'password="Pass1@aAb"',           expected: 'success=true' },
    { noTc: 6, bva: 'password=63',inputData: 'password="A1@"+"a".repeat(60)', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'Valid input, service resolves',                expected: 'success=true, AdminWithUser returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'fullName 7 chars',                           expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid email',                              expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Service throws ConflictError',               expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws unexpected Error',            expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 6, fromEc: '',     fromBva: 'BVA-3', inputData: 'fullName 9 chars',                       expected: 'success=true' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-4', inputData: 'fullName 63 chars',                      expected: 'success=true' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-5', inputData: 'password 9 chars',                       expected: 'success=true' },
    { noTc: 9, fromEc: '',     fromBva: 'BVA-6', inputData: 'password 63 chars',                      expected: 'success=true' },
  ],
};

const getMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 3,
  statement: 'user-controller.getMember(memberId) – Server Action. No input validation. Delegates to userService.getMember(). Returns ActionResult<MemberWithUser>.',
  data: 'Input: memberId: string',
  precondition: 'userService.getMember is mock-injected',
  results: 'Output: ActionResult<MemberWithUser>',
  postcondition: 'On success: MemberWithUser returned.\nOn NotFoundError: failure with message.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'service resolves MemberWithUser',          invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                          invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 3, condition: '',                 validEc: '',                                          invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001", service resolves',           expected: '{ success: true, data: MemberWithUser }' },
    { noTc: 2, ec: '2', inputData: 'memberId="nonexistent-id", service throws NotFoundError', expected: '{ success: false, message: "Member not found" }' },
    { noTc: 3, ec: '3', inputData: 'memberId="member-001", service throws Error',       expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string – no numerical boundary' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing memberId',                   expected: 'success=true, MemberWithUser returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId',               expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const getAdminCtrlBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 3,
  statement: 'user-controller.getAdmin(adminId) – Server Action. No input validation. Delegates to userService.getAdmin(). Returns ActionResult<AdminWithUser>.',
  data: 'Input: adminId: string',
  precondition: 'userService.getAdmin is mock-injected',
  results: 'Output: ActionResult<AdminWithUser>',
  postcondition: 'On success: AdminWithUser returned.\nOn NotFoundError: failure with message.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'service resolves AdminWithUser',          invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                         invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 3, condition: '',                validEc: '',                                         invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'adminId="admin-001", service resolves',               expected: '{ success: true, data: AdminWithUser }' },
    { noTc: 2, ec: '2', inputData: 'adminId="nonexistent-id", service throws NotFoundError', expected: '{ success: false, message: "Admin not found" }' },
    { noTc: 3, ec: '3', inputData: 'adminId="admin-001", service throws Error',           expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string – no numerical boundary' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing adminId',                    expected: 'success=true, AdminWithUser returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent adminId',                expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const updateMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 8,
  statement: 'user-controller.updateMember(memberId, data) – Server Action. Validates UpdateMemberInput (all fields optional). Delegates to userService.updateMember(). Returns ActionResult<MemberWithUser>.',
  data: 'Input: memberId: string, data: UpdateMemberInput (all optional)',
  precondition: 'userService.updateMember is mock-injected',
  results: 'Output: ActionResult<MemberWithUser>',
  postcondition: 'On success: updated MemberWithUser returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'all fields valid',  validEc: 'optional fields pass schema',              invalidEc: '' },
    { number: 2, condition: 'fullName optional', validEc: 'fullName ≥ 8 chars if provided',          invalidEc: '' },
    { number: 3, condition: '',                  validEc: '',                                          invalidEc: 'fullName < 8 chars → validation error' },
    { number: 4, condition: 'email optional',    validEc: 'valid email if provided',                  invalidEc: '' },
    { number: 5, condition: '',                  validEc: '',                                          invalidEc: 'invalid email if provided → validation error' },
    { number: 6, condition: 'service outcome',   validEc: 'resolves updated MemberWithUser',          invalidEc: '' },
    { number: 7, condition: '',                  validEc: '',                                          invalidEc: 'throws NotFoundError → failure with message' },
    { number: 8, condition: '',                  validEc: '',                                          invalidEc: 'throws ConflictError → failure with message' },
    { number: 9, condition: '',                  validEc: '',                                          invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6', inputData: '{ fullName: "John Updated Doe" }, service resolves', expected: '{ success: true }' },
    { noTc: 2, ec: '3',       inputData: '{ fullName: "Jo" }',                                  expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',       inputData: '{ email: "bad-email" }',                              expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',       inputData: 'valid update, service throws NotFoundError',          expected: '{ success: false, message: "Member not found" }' },
    { noTc: 5, ec: '8',       inputData: 'valid update, service throws ConflictError',          expected: '{ success: false, message: "Email already in use" }' },
    { noTc: 6, ec: '9',       inputData: 'valid update, service throws Error',                  expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName length boundary', testCase: 'fullName 7 chars → invalid' },
    { number: '',condition: '',                          testCase: 'fullName 8 chars → valid' },
    { number: 2, condition: 'fullName boundary interior', testCase: 'fullName 9 chars → valid (min+1)' },
    { number: 3, condition: '',                          testCase: 'fullName 63 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'fullName=7', inputData: '{ fullName: "1234567" }',  expected: 'success=false, errors.fullName defined' },
    { noTc: 2, bva: 'fullName=8', inputData: '{ fullName: "12345678" }', expected: 'schema passes' },
    { noTc: 3, bva: 'fullName=9', inputData: '{ fullName: "John Doe1" }', expected: 'success=true' },
    { noTc: 4, bva: 'fullName=63',inputData: '{ fullName: "C".repeat(63) }', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Valid update, service resolves',        expected: 'success=true, MemberWithUser returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'fullName 7 chars',                         expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid email',                        expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Service throws NotFoundError',         expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws ConflictError',         expected: 'success=false, message from error' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',       inputData: 'Service throws unexpected Error',        expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-3', inputData: 'fullName 9 chars',                       expected: 'success=true' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-4', inputData: 'fullName 63 chars',                      expected: 'success=true' },
  ],
};

const suspendMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 3,
  statement: 'user-controller.suspendMember(memberId) – Server Action. No input validation. Delegates to userService.suspendMember(). Returns ActionResult<MemberWithUser> with isActive=false.',
  data: 'Input: memberId: string',
  precondition: 'userService.suspendMember is mock-injected',
  results: 'Output: ActionResult<MemberWithUser>',
  postcondition: 'On success: member.isActive=false returned.\nOn AppError: failure with message.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'service resolves MemberWithUser(isActive=false)', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                                 invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                 validEc: '',                                                 invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001", service resolves {isActive:false}', expected: '{ success: true, data.isActive: false }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',           expected: '{ success: false, message: "Member not found" }' },
    { noTc: 3, ec: '3', inputData: 'memberId="member-001", service throws Error',              expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'isActive boundary', testCase: 'isActive=false (suspended state)' }],
  bvaTcRows: [
    { noTc: 1, bva: 'isActive=false', inputData: 'Service resolves with isActive=false', expected: 'data.isActive=false' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing memberId',                   expected: 'success=true, isActive=false' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Non-existent memberId',               expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const activateMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 3,
  statement: 'user-controller.activateMember(memberId) – Server Action. No input validation. Delegates to userService.activateMember(). Returns ActionResult<MemberWithUser> with isActive=true.',
  data: 'Input: memberId: string',
  precondition: 'userService.activateMember is mock-injected',
  results: 'Output: ActionResult<MemberWithUser>',
  postcondition: 'On success: member.isActive=true returned.\nOn AppError: failure with message.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'service resolves MemberWithUser(isActive=true)', invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                                invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                 validEc: '',                                                invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001", service resolves {isActive:true}', expected: '{ success: true, data.isActive: true }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',          expected: '{ success: false, message: "Member not found" }' },
    { noTc: 3, ec: '3', inputData: 'memberId="member-001", service throws Error',             expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'isActive boundary', testCase: 'isActive=true (reactivated state)' }],
  bvaTcRows: [
    { noTc: 1, bva: 'isActive=true', inputData: 'Service resolves with isActive=true', expected: 'data.isActive=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing suspended memberId',         expected: 'success=true, isActive=true' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Non-existent memberId',               expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const deleteMemberCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 3,
  statement: 'user-controller.deleteMember(memberId) – Server Action. No input validation. Delegates to userService.deleteMember(). Returns ActionResult<void>.',
  data: 'Input: memberId: string',
  precondition: 'userService.deleteMember is mock-injected',
  results: 'Output: ActionResult<void>',
  postcondition: 'On success: { success: true, data: undefined }.\nOn AppError: { success: false, message }.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'member existence', validEc: 'service resolves void',                  invalidEc: '' },
    { number: 2, condition: '',                 validEc: '',                                         invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 3, condition: '',                 validEc: '',                                         invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'memberId="member-001", service resolves',              expected: '{ success: true, data: undefined }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',       expected: '{ success: false, message: "Member not found" }' },
    { noTc: 3, ec: '3', inputData: 'memberId="member-001", service throws Error',          expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundary – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing memberId',                   expected: 'success=true, data=undefined' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent memberId',               expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

// ── exercise-controller ────────────────────────────────────────────────────────

const createExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 8,
  statement: 'exercise-controller.createExercise(data) – Server Action. Validates CreateExerciseInput via createExerciseSchema (name ≥8 chars ≤64, muscleGroup enum, equipmentNeeded enum). Delegates to exerciseService.createExercise(). Returns ActionResult<Exercise>.',
  data: 'Input: CreateExerciseInput { name, description?, muscleGroup, equipmentNeeded }',
  precondition: 'exerciseService.createExercise is mock-injected',
  results: 'Output: ActionResult<Exercise>',
  postcondition: 'On success: Exercise returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'all fields valid',    validEc: 'name ≥ 8 chars, valid enum values',         invalidEc: '' },
    { number: 2, condition: 'name length',         validEc: 'name ≥ 8 chars',                           invalidEc: '' },
    { number: 3, condition: '',                    validEc: '',                                           invalidEc: 'name < 8 chars → validation error' },
    { number: 4, condition: 'muscleGroup enum',    validEc: 'valid MuscleGroup value',                  invalidEc: '' },
    { number: 5, condition: '',                    validEc: '',                                           invalidEc: 'invalid MuscleGroup → validation error' },
    { number: 6, condition: 'equipment enum',      validEc: 'valid Equipment value',                    invalidEc: '' },
    { number: 7, condition: '',                    validEc: '',                                           invalidEc: 'invalid Equipment → validation error' },
    { number: 8, condition: 'service outcome',     validEc: 'resolves Exercise',                        invalidEc: '' },
    { number: 9, condition: '',                    validEc: '',                                           invalidEc: 'throws ConflictError → failure with message' },
    { number: 10, condition: '',                   validEc: '',                                           invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6,8', inputData: 'VALID_EXERCISE_INPUT, service resolves',                   expected: '{ success: true, data: Exercise }' },
    { noTc: 2, ec: '3',         inputData: '{ name: "Ab", muscleGroup: "CHEST", equipment: "BARBELL" }', expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',         inputData: '{ name: "Bench Press", muscleGroup: "INVALID_GROUP" }',     expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',         inputData: '{ name: "Bench Press", equipmentNeeded: "INVALID" }',       expected: '{ success: false, errors defined }' },
    { noTc: 5, ec: '9',         inputData: 'valid input, service throws ConflictError',                 expected: '{ success: false, message from error }' },
    { noTc: 6, ec: '10',        inputData: 'valid input, service throws Error',                         expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'name length boundary', testCase: 'name 7 chars → invalid (below min)' },
    { number: '',condition: '',                      testCase: 'name 8 chars → valid (at min)' },
    { number: 2, condition: '',                      testCase: 'name 64 chars → valid (at max)' },
    { number: '',condition: '',                      testCase: 'name 65 chars → invalid (above max)' },
    { number: 3, condition: 'name length interior', testCase: 'name 9 chars → valid (min+1)' },
    { number: 4, condition: '',                      testCase: 'name 63 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'name=7 chars',  inputData: '{ name: "1234567" }',          expected: 'success=false, errors.name defined' },
    { noTc: 2, bva: 'name=8 chars',  inputData: '{ name: "12345678" }',         expected: 'schema passes (min boundary)' },
    { noTc: 3, bva: 'name=64 chars', inputData: '{ name: "a".repeat(64) }',    expected: 'schema passes (max boundary)' },
    { noTc: 4, bva: 'name=65 chars', inputData: '{ name: "a".repeat(65) }',    expected: 'success=false, errors.name defined' },
    { noTc: 5, bva: 'name=9 chars',  inputData: '{ name: "BenchPrs1" }',        expected: 'success=true' },
    { noTc: 6, bva: 'name=63 chars', inputData: '{ name: "b".repeat(63) }',    expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Valid input (name ≥ 8), service resolves', expected: 'success=true, Exercise returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'Name "Ab" (2 chars)',                      expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid muscleGroup',                      expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Invalid equipment',                        expected: 'success=false, errors defined' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws ConflictError',             expected: 'success=false, message from error' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',       inputData: 'Service throws unexpected Error',          expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-5', inputData: 'Name 9 chars',                            expected: 'success=true' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-6', inputData: 'Name 63 chars',                           expected: 'success=true' },
  ],
};

const getExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-02',
  tcCount: 3,
  statement: 'exercise-controller.getExercise(id) – Server Action. No input validation. Delegates to exerciseService.getExercise(). Returns ActionResult<Exercise>.',
  data: 'Input: id: string',
  precondition: 'exerciseService.getExercise is mock-injected',
  results: 'Output: ActionResult<Exercise>',
  postcondition: 'On success: Exercise returned.\nOn NotFoundError: failure with message.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'service resolves Exercise',             invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                       invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 3, condition: '',                   validEc: '',                                       invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="exercise-001", service resolves Exercise',        expected: '{ success: true, data: Exercise }' },
    { noTc: 2, ec: '2', inputData: 'id="nonexistent-id", service throws NotFoundError',   expected: '{ success: false, message: "Exercise not found" }' },
    { noTc: 3, ec: '3', inputData: 'id="exercise-001", service throws Error',             expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing exercise id',               expected: 'success=true, Exercise returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                    expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',    expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const updateExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-03',
  tcCount: 8,
  statement: 'exercise-controller.updateExercise(id, data) – Server Action. Validates UpdateExerciseInput (all optional). Delegates to exerciseService.updateExercise(). Returns ActionResult<Exercise>.',
  data: 'Input: id: string, data: UpdateExerciseInput (all optional)',
  precondition: 'exerciseService.updateExercise is mock-injected',
  results: 'Output: ActionResult<Exercise>',
  postcondition: 'On success: updated Exercise returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'fields optional valid', validEc: 'optional name ≥ 8 chars if provided', invalidEc: '' },
    { number: 2, condition: 'name length',           validEc: 'name ≥ 8 if provided',                invalidEc: '' },
    { number: 3, condition: '',                      validEc: '',                                     invalidEc: 'name < 8 chars → validation error' },
    { number: 4, condition: 'muscleGroup optional',  validEc: 'valid enum if provided',               invalidEc: '' },
    { number: 5, condition: '',                      validEc: '',                                     invalidEc: 'invalid enum → validation error' },
    { number: 6, condition: 'service outcome',       validEc: 'resolves updated Exercise',            invalidEc: '' },
    { number: 7, condition: '',                      validEc: '',                                     invalidEc: 'throws NotFoundError → failure' },
    { number: 8, condition: '',                      validEc: '',                                     invalidEc: 'throws ConflictError → failure' },
    { number: 9, condition: '',                      validEc: '',                                     invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6', inputData: '{ name: "Incline Bench Press Classic" }, service resolves', expected: '{ success: true, data.name: "Incline Bench Press Classic" }' },
    { noTc: 2, ec: '3',       inputData: '{ name: "Ab" }',                                             expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',       inputData: '{ muscleGroup: "INVALID" }',                                 expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',       inputData: 'valid update, service throws NotFoundError',                  expected: '{ success: false, message: "Exercise not found" }' },
    { noTc: 5, ec: '8',       inputData: 'valid update, service throws ConflictError',                  expected: '{ success: false, message: "Name already in use" }' },
    { noTc: 6, ec: '9',       inputData: 'valid update, service throws Error',                          expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'name boundary', testCase: 'name 7 chars → invalid' },
    { number: '',condition: '',              testCase: 'name 8 chars → valid' },
    { number: 2, condition: 'name boundary interior', testCase: 'name 9 chars → valid (min+1)' },
    { number: 3, condition: '',                      testCase: 'name 63 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'name=7', inputData: '{ name: "1234567" }', expected: 'success=false, errors.name defined' },
    { noTc: 2, bva: 'name=8', inputData: '{ name: "12345678" }', expected: 'schema passes' },
    { noTc: 3, bva: 'name=9', inputData: '{ name: "BenchPrs1" }', expected: 'success=true' },
    { noTc: 4, bva: 'name=63', inputData: '{ name: "b".repeat(63) }', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Valid update, service resolves',        expected: 'success=true, Exercise returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'Name 7 chars',                         expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid muscleGroup',                  expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Service throws NotFoundError',         expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws ConflictError',         expected: 'success=false, message from error' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',       inputData: 'Service throws unexpected Error',        expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-3', inputData: 'Name 9 chars',                          expected: 'success=true' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-4', inputData: 'Name 63 chars',                         expected: 'success=true' },
  ],
};

const archiveExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-04',
  tcCount: 3,
  statement: 'exercise-controller.archiveExercise(id) – Server Action. No input validation. Delegates to exerciseService.archiveExercise(). Returns ActionResult<Exercise> with isActive=false.',
  data: 'Input: id: string',
  precondition: 'exerciseService.archiveExercise is mock-injected',
  results: 'Output: ActionResult<Exercise>',
  postcondition: 'On success: Exercise with isActive=false returned.\nOn NotFoundError: failure.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'service resolves Exercise(isActive=false)', invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                           invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                   validEc: '',                                           invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="exercise-001", service resolves {isActive:false}', expected: '{ success: true, data.isActive: false }' },
    { noTc: 2, ec: '2', inputData: 'id="nonexistent-id", service throws NotFoundError',    expected: '{ success: false, message: "Exercise not found" }' },
    { noTc: 3, ec: '3', inputData: 'id="exercise-001", service throws Error',              expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'isActive boundary', testCase: 'isActive=false (archived state)' }],
  bvaTcRows: [{ noTc: 1, bva: 'isActive=false', inputData: 'Service resolves with isActive=false', expected: 'data.isActive=false' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing exercise id',                expected: 'success=true, isActive=false' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Non-existent id',                    expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Service throws unexpected Error',    expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const deleteExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-01',
  tcCount: 4,
  statement: 'exercise-controller.deleteExercise(id) – Server Action. No input validation. Delegates to exerciseService.deleteExercise(). Returns ActionResult<void>.',
  data: 'Input: id: string',
  precondition: 'exerciseService.deleteExercise is mock-injected',
  results: 'Output: ActionResult<void>',
  postcondition: 'On success: { success: true, data: undefined }.\nOn AppError: { success: false, message }.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'service resolves void',                   invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                          invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                   validEc: '',                                          invalidEc: 'service throws ConflictError (referenced) → failure' },
    { number: 4, condition: '',                   validEc: '',                                          invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="exercise-001", service resolves',              expected: '{ success: true, data: undefined }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',   expected: '{ success: false, message: "Exercise not found" }' },
    { noTc: 3, ec: '3', inputData: 'id="exercise-001", service throws ConflictError',  expected: '{ success: false, message from ConflictError }' },
    { noTc: 4, ec: '4', inputData: 'id="exercise-001", service throws Error',          expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundary – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing unreferenced exercise',         expected: 'success=true, data=undefined' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                        expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Referenced exercise (ConflictError)',    expected: 'success=false, message from ConflictError' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: 'Service throws unexpected Error',        expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

// ── workout-session-controller ─────────────────────────────────────────────────

const createWorkoutSessionCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-01/WSM-02',
  tcCount: 17,
  statement: 'workout-session-controller.createWorkoutSession(data, exercises) – Server Action. Validates CreateWorkoutSessionInput (memberId non-empty, date ISO, duration 0–180) and workoutSessionExercisesSchema (≥1 exercise, sets 0–6, reps 0–30, weight 0–500). Returns ActionResult<WorkoutSessionWithExercises>.',
  data: 'Input: CreateWorkoutSessionInput { memberId, date, duration, notes? } + WorkoutSessionExerciseInput[] (≥1)',
  precondition: 'workoutSessionService.createWorkoutSession is mock-injected',
  results: 'Output: ActionResult<WorkoutSessionWithExercises>',
  postcondition: 'On success: WorkoutSessionWithExercises returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'session data valid',  validEc: 'memberId non-empty, date ISO, duration 0–180', invalidEc: '' },
    { number: 2, condition: 'duration range',      validEc: 'duration ≤ 180',                              invalidEc: '' },
    { number: 3, condition: '',                    validEc: '',                                              invalidEc: 'duration > 180 → validation error' },
    { number: 4, condition: 'date format',         validEc: 'ISO YYYY-MM-DD',                              invalidEc: '' },
    { number: 5, condition: '',                    validEc: '',                                              invalidEc: 'invalid date format → validation error' },
    { number: 6, condition: 'memberId',            validEc: 'non-empty string',                            invalidEc: '' },
    { number: 7, condition: '',                    validEc: '',                                              invalidEc: 'empty memberId → validation error' },
    { number: 8, condition: 'exercises array',     validEc: 'length ≥ 1',                                  invalidEc: '' },
    { number: 9, condition: '',                    validEc: '',                                              invalidEc: 'length = 0 → validation error (message only)' },
    { number: 10, condition: 'exercise sets',      validEc: 'sets ≤ 6',                                    invalidEc: '' },
    { number: 11, condition: '',                   validEc: '',                                              invalidEc: 'sets > 6 → validation error' },
    { number: 12, condition: 'service outcome',    validEc: 'resolves WorkoutSessionWithExercises',        invalidEc: '' },
    { number: 13, condition: '',                   validEc: '',                                              invalidEc: 'throws NotFoundError → failure' },
    { number: 14, condition: '',                   validEc: '',                                              invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6,8,10,12', inputData: 'VALID_SESSION_INPUT + VALID_EXERCISES, service resolves', expected: '{ success: true, data: WorkoutSessionWithExercises }' },
    { noTc: 2, ec: '3',               inputData: '{ duration: 181 }, valid exercises',                      expected: '{ success: false, errors.duration defined }' },
    { noTc: 3, ec: '5',               inputData: '{ date: "not-a-date" }, valid exercises',                  expected: '{ success: false, errors.date defined }' },
    { noTc: 4, ec: '7',               inputData: '{ memberId: "" }, valid exercises',                        expected: '{ success: false, errors.memberId defined }' },
    { noTc: 5, ec: '9',               inputData: 'valid session data, exercises=[]',                         expected: '{ success: false, message defined }' },
    { noTc: 6, ec: '11',              inputData: 'valid session, [{ sets: 7 }]',                             expected: '{ success: false }' },
    { noTc: 7, ec: '13',              inputData: 'valid, service throws NotFoundError',                      expected: '{ success: false, message: "Member not found" }' },
    { noTc: 8, ec: '',                inputData: 'valid, service throws WorkoutSessionRequiresExercisesError', expected: '{ success: false, message from error }' },
    { noTc: 9, ec: '14',              inputData: 'valid, service throws Error',                              expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'duration boundary', testCase: 'duration=180 → valid' },
    { number: '',condition: '',                   testCase: 'duration=181 → invalid' },
    { number: 2, condition: 'duration lower',     testCase: 'duration=0 → valid' },
    { number: 3, condition: 'duration interior',  testCase: 'duration=1 → valid (min+1)' },
    { number: 4, condition: '',                   testCase: 'duration=179 → valid (max-1)' },
    { number: 5, condition: 'notes length boundary', testCase: 'notes=1023 chars → valid (max-1)' },
    { number: 6, condition: 'sets boundary',      testCase: 'sets=6 → valid (max)' },
    { number: '',condition: '',                   testCase: 'sets=7 → invalid' },
    { number: 7, condition: 'sets interior',      testCase: 'sets=1 → valid (min+1)' },
    { number: 8, condition: '',                   testCase: 'sets=5 → valid (max-1)' },
    { number: 9, condition: 'reps interior',      testCase: 'reps=1 → valid (min+1)' },
    { number: 10,condition: '',                   testCase: 'reps=29 → valid (max-1)' },
    { number: 11,condition: 'weight interior',    testCase: 'weight=0.1 → valid (min+0.1)' },
    { number: 12,condition: '',                   testCase: 'weight=499.9 → valid (max-0.1)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'duration=180', inputData: '{ duration: 180 }', expected: 'success=true' },
    { noTc: 2,  bva: 'duration=181', inputData: '{ duration: 181 }', expected: 'success=false' },
    { noTc: 3,  bva: 'duration=0',   inputData: '{ duration: 0 }',   expected: 'success=true' },
    { noTc: 4,  bva: 'duration=1',   inputData: '{ duration: 1 }',   expected: 'success=true' },
    { noTc: 5,  bva: 'duration=179', inputData: '{ duration: 179 }', expected: 'success=true' },
    { noTc: 6,  bva: 'notes=1023',   inputData: '{ notes: "a".repeat(1023) }', expected: 'success=true' },
    { noTc: 7,  bva: 'sets=6',       inputData: 'sets: 6',           expected: 'success=true' },
    { noTc: 8,  bva: 'sets=7',       inputData: 'sets: 7',           expected: 'success=false' },
    { noTc: 9,  bva: 'sets=1',       inputData: 'sets: 1',           expected: 'success=true' },
    { noTc: 10, bva: 'sets=5',       inputData: 'sets: 5',           expected: 'success=true' },
    { noTc: 11, bva: 'reps=1',       inputData: 'reps: 1',           expected: 'success=true' },
    { noTc: 12, bva: 'reps=29',      inputData: 'reps: 29',          expected: 'success=true' },
    { noTc: 13, bva: 'weight=0.1',   inputData: 'weight: 0.1',       expected: 'success=true' },
    { noTc: 14, bva: 'weight=499.9', inputData: 'weight: 499.9',     expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Valid, duration=180, 1 exercise',           expected: 'success=true, session returned' },
    { noTc: 2,  fromEc: 'EP-2', fromBva: 'BVA-2', inputData: 'duration=181',                              expected: 'success=false, errors defined' },
    { noTc: 3,  fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid date format',                       expected: 'success=false, errors defined' },
    { noTc: 4,  fromEc: 'EP-4', fromBva: '',       inputData: 'Empty memberId',                            expected: 'success=false, errors defined' },
    { noTc: 5,  fromEc: 'EP-5', fromBva: '',       inputData: 'exercises=[]',                              expected: 'success=false, message about exercises' },
    { noTc: 6,  fromEc: 'EP-6', fromBva: 'BVA-8', inputData: 'sets=7 in exercise',                        expected: 'success=false' },
    { noTc: 7,  fromEc: 'EP-7', fromBva: '',       inputData: 'Service throws NotFoundError',              expected: 'success=false, message from error' },
    { noTc: 8,  fromEc: 'EP-9', fromBva: '',       inputData: 'Service throws unexpected Error',           expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 9,  fromEc: '',     fromBva: 'BVA-4', inputData: 'duration=1',                                expected: 'success=true' },
    { noTc: 10, fromEc: '',     fromBva: 'BVA-5', inputData: 'duration=179',                              expected: 'success=true' },
    { noTc: 11, fromEc: '',     fromBva: 'BVA-6', inputData: 'notes=1023 chars',                          expected: 'success=true' },
    { noTc: 12, fromEc: '',     fromBva: 'BVA-9', inputData: 'sets=1',                                    expected: 'success=true' },
    { noTc: 13, fromEc: '',     fromBva: 'BVA-10',inputData: 'sets=5',                                    expected: 'success=true' },
    { noTc: 14, fromEc: '',     fromBva: 'BVA-11',inputData: 'reps=1',                                    expected: 'success=true' },
    { noTc: 15, fromEc: '',     fromBva: 'BVA-12',inputData: 'reps=29',                                   expected: 'success=true' },
    { noTc: 16, fromEc: '',     fromBva: 'BVA-13',inputData: 'weight=0.1',                                expected: 'success=true' },
    { noTc: 17, fromEc: '',     fromBva: 'BVA-14',inputData: 'weight=499.9',                              expected: 'success=true' },
  ],
};

const getWorkoutSessionCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 3,
  statement: 'workout-session-controller.getWorkoutSession(workoutSessionId) – Server Action. No input validation. Delegates to workoutSessionService.getWorkoutSession(). Returns ActionResult<WorkoutSessionWithExercises>.',
  data: 'Input: workoutSessionId: string',
  precondition: 'workoutSessionService.getWorkoutSession is mock-injected',
  results: 'Output: ActionResult<WorkoutSessionWithExercises>',
  postcondition: 'On success: WorkoutSessionWithExercises returned.\nOn NotFoundError: failure.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'service resolves WorkoutSessionWithExercises', invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                                              invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                  validEc: '',                                              invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="session-001", service resolves',            expected: '{ success: true, data: WorkoutSessionWithExercises }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError', expected: '{ success: false, message: "Workout session not found" }' },
    { noTc: 3, ec: '3', inputData: 'id="session-001", service throws Error',         expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id',                expected: 'success=true, session returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                    expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',    expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const updateWorkoutSessionCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-06',
  tcCount: 8,
  statement: 'workout-session-controller.updateWorkoutSession(workoutSessionId, data) – Server Action. Validates UpdateWorkoutSessionInput (optional date ISO, optional duration 0–180). Delegates to workoutSessionService.updateWorkoutSession(). Returns ActionResult<WorkoutSession>.',
  data: 'Input: workoutSessionId: string, data: UpdateWorkoutSessionInput { date?, duration?, notes? }',
  precondition: 'workoutSessionService.updateWorkoutSession is mock-injected',
  results: 'Output: ActionResult<WorkoutSession>',
  postcondition: 'On success: updated WorkoutSession returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'fields optional valid', validEc: 'optional duration ≤ 180 if provided', invalidEc: '' },
    { number: 2, condition: 'duration range',        validEc: 'duration ≤ 180',                     invalidEc: '' },
    { number: 3, condition: '',                      validEc: '',                                    invalidEc: 'duration > 180 → validation error' },
    { number: 4, condition: 'date format',           validEc: 'ISO YYYY-MM-DD if provided',         invalidEc: '' },
    { number: 5, condition: '',                      validEc: '',                                    invalidEc: 'invalid date format → validation error' },
    { number: 6, condition: 'service outcome',       validEc: 'resolves WorkoutSession',             invalidEc: '' },
    { number: 7, condition: '',                      validEc: '',                                    invalidEc: 'throws NotFoundError → failure' },
    { number: 8, condition: '',                      validEc: '',                                    invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,2,4,6', inputData: 'VALID_UPDATE_INPUT, service resolves WorkoutSession',    expected: '{ success: true }' },
    { noTc: 2, ec: '3',       inputData: '{ duration: 181 }',                                       expected: '{ success: false, errors defined }' },
    { noTc: 3, ec: '5',       inputData: '{ date: "bad-date" }',                                    expected: '{ success: false, errors defined }' },
    { noTc: 4, ec: '7',       inputData: 'valid update, service throws NotFoundError',              expected: '{ success: false, message: "Session not found" }' },
    { noTc: 5, ec: '8',       inputData: 'valid update, service throws Error',                      expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'duration boundary', testCase: 'duration=180 → valid' },
    { number: '',condition: '',                   testCase: 'duration=181 → invalid' },
    { number: 2, condition: 'duration lower',     testCase: 'duration=0 → valid' },
    { number: 3, condition: 'duration interior',  testCase: 'duration=1 → valid (min+1)' },
    { number: 4, condition: '',                   testCase: 'duration=179 → valid (max-1)' },
    { number: 5, condition: 'notes length boundary', testCase: 'notes=1023 chars → valid (max-1)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'duration=180', inputData: '{ duration: 180 }', expected: 'schema passes' },
    { noTc: 2, bva: 'duration=181', inputData: '{ duration: 181 }', expected: 'success=false, errors.duration defined' },
    { noTc: 3, bva: 'duration=0',   inputData: '{ duration: 0 }',   expected: 'schema passes (lower boundary)' },
    { noTc: 4, bva: 'duration=1',   inputData: '{ duration: 1 }',   expected: 'success=true' },
    { noTc: 5, bva: 'duration=179', inputData: '{ duration: 179 }', expected: 'success=true' },
    { noTc: 6, bva: 'notes=1023',   inputData: '{ notes: "a".repeat(1023) }', expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Valid update, service resolves',      expected: 'success=true, session returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-2', inputData: 'duration=181',                        expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid date format',                 expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Service throws NotFoundError',        expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Service throws unexpected Error',     expected: 'success=false, message="An unexpected error occurred"' },
    { noTc: 6, fromEc: '',     fromBva: 'BVA-4', inputData: 'duration=1',                         expected: 'success=true' },
    { noTc: 7, fromEc: '',     fromBva: 'BVA-5', inputData: 'duration=179',                       expected: 'success=true' },
    { noTc: 8, fromEc: '',     fromBva: 'BVA-6', inputData: 'notes=1023 chars',                   expected: 'success=true' },
  ],
};

const deleteWorkoutSessionCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-08',
  tcCount: 3,
  statement: 'workout-session-controller.deleteWorkoutSession(workoutSessionId) – Server Action. No input validation. Delegates to workoutSessionService.deleteWorkoutSession(). Returns ActionResult<void>.',
  data: 'Input: workoutSessionId: string',
  precondition: 'workoutSessionService.deleteWorkoutSession is mock-injected',
  results: 'Output: ActionResult<void>',
  postcondition: 'On success: { success: true, data: undefined }.\nOn AppError: { success: false, message }.\nOn error: generic failure.',
  ecRows: [
    { number: 1, condition: 'session existence', validEc: 'service resolves void',                   invalidEc: '' },
    { number: 2, condition: '',                  validEc: '',                                          invalidEc: 'service throws NotFoundError → failure with message' },
    { number: 3, condition: '',                  validEc: '',                                          invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'workoutSessionId="session-001", service resolves', expected: '{ success: true, data: undefined }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',   expected: '{ success: false, message: "Session not found" }' },
    { noTc: 3, ec: '3', inputData: 'workoutSessionId="session-001", throws Error',     expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundary – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing session id',                expected: 'success=true, data=undefined' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent id',                    expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',    expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

// ── report-controller ──────────────────────────────────────────────────────────

const getMemberProgressReportCtrlBbt: BbtDescriptor = {
  reqId: 'RPG-01',
  tcCount: 7,
  statement: 'report-controller.getMemberProgressReport(memberId, startDate, endDate) – Server Action. Validates via memberProgressReportSchema (memberId non-empty, startDate/endDate in YYYY-MM-DD format). Delegates to reportService.getMemberProgressReport(). Returns ActionResult<Report>.',
  data: 'Input: memberId: string, startDate: string (YYYY-MM-DD), endDate: string (YYYY-MM-DD)',
  precondition: 'reportService.getMemberProgressReport is mock-injected',
  results: 'Output: ActionResult<Report>',
  postcondition: 'On success: Report returned.\nOn validation failure: errors returned.\nOn AppError: message returned.',
  ecRows: [
    { number: 1, condition: 'memberId',       validEc: 'non-empty string',                      invalidEc: '' },
    { number: 2, condition: '',               validEc: '',                                       invalidEc: 'empty memberId → validation error' },
    { number: 3, condition: 'startDate',      validEc: 'YYYY-MM-DD format',                    invalidEc: '' },
    { number: 4, condition: '',               validEc: '',                                       invalidEc: 'invalid date format → validation error' },
    { number: 5, condition: 'endDate',        validEc: 'YYYY-MM-DD format',                    invalidEc: '' },
    { number: 6, condition: '',               validEc: '',                                       invalidEc: 'invalid date format → validation error' },
    { number: 7, condition: 'service outcome',validEc: 'resolves Report',                       invalidEc: '' },
    { number: 8, condition: '',               validEc: '',                                       invalidEc: 'throws NotFoundError → failure' },
    { number: 9, condition: '',               validEc: '',                                       invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,3,5,7', inputData: 'memberId="member-001", startDate="2024-01-01", endDate="2024-03-31", service resolves', expected: '{ success: true, data: Report }' },
    { noTc: 2, ec: '2',       inputData: 'memberId="", startDate="2024-01-01", endDate="2024-03-31"',                             expected: '{ success: false, errors.memberId defined }' },
    { noTc: 3, ec: '4',       inputData: 'memberId="member-001", startDate="not-a-date", endDate="2024-03-31"',                  expected: '{ success: false, errors.startDate defined }' },
    { noTc: 4, ec: '6',       inputData: 'memberId="member-001", startDate="2024-01-01", endDate="not-a-date"',                  expected: '{ success: false, errors.endDate defined }' },
    { noTc: 5, ec: '',        inputData: 'memberId="member-001", startDate="01/01/2024", endDate="31-03-2024"',                  expected: '{ success: false, errors defined }' },
    { noTc: 6, ec: '8',       inputData: 'valid input, service throws NotFoundError',                                            expected: '{ success: false, message: "Member not found" }' },
    { noTc: 7, ec: '9',       inputData: 'valid input, service throws Error',                                                    expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'memberId length', testCase: 'memberId="" (empty) → invalid' },
    { number: '',condition: '',                testCase: 'memberId="m" (1 char) → valid (non-empty)' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'memberId empty',   inputData: 'memberId=""',                     expected: 'success=false, errors.memberId defined' },
    { noTc: 2, bva: 'memberId 1 char',  inputData: 'memberId="m"',                    expected: 'schema passes (non-empty satisfied)' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-2', inputData: 'Valid memberId and dates, service resolves',     expected: 'success=true, Report returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: 'BVA-1', inputData: 'Empty memberId',                                 expected: 'success=false, errors defined' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Invalid startDate format',                       expected: 'success=false, errors defined' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',       inputData: 'Invalid endDate format',                         expected: 'success=false, errors defined' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',       inputData: 'Both dates non-ISO format',                      expected: 'success=false, errors defined' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',       inputData: 'Service throws NotFoundError',                   expected: 'success=false, message from error' },
    { noTc: 7, fromEc: 'EP-7', fromBva: '',       inputData: 'Service throws unexpected Error',                expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

// ── user-controller (additional) ──────────────────────────────────────────────

const listMembersCtrlBbt: BbtDescriptor = {
  reqId: 'MEM-03',
  tcCount: 5,
  statement: 'user-controller.listMembers(options?) – Server Action. No input validation. Delegates to userService.listMembers(). Returns ActionResult<PageResult<MemberWithUser>>.',
  data: 'Input: MemberListOptions? { search?, page?, pageSize? }',
  precondition: 'userService.listMembers is mock-injected',
  results: 'Output: ActionResult<PageResult<MemberWithUser>>',
  postcondition: 'On success: page returned. On AppError: failure with message. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'no options',      validEc: 'service resolves page, returns success', invalidEc: '' },
    { number: 2, condition: 'with filter',     validEc: 'filter passed to service',               invalidEc: '' },
    { number: 3, condition: 'with pagination', validEc: 'pagination passed to service',           invalidEc: '' },
    { number: 4, condition: 'service outcome', validEc: 'resolves page',                          invalidEc: '' },
    { number: 5, condition: '',                validEc: '',                                        invalidEc: 'throws AppError → failure with message' },
    { number: 6, condition: '',                validEc: '',                                        invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,4', inputData: 'no options, service resolves { items:[MOCK_MEMBER], total:1 }', expected: '{ success: true, data.total: 1 }' },
    { noTc: 2, ec: '2',   inputData: '{ search: "John" }, service resolves page',                    expected: '{ success: true }; listMembers({ search:"John" }) called' },
    { noTc: 3, ec: '3',   inputData: '{ page: 2, pageSize: 10 }, service resolves',                  expected: '{ success: true }; listMembers(options) called' },
    { noTc: 4, ec: '5',   inputData: 'no options, service throws AppError("Service error")',          expected: '{ success: false, message: "Service error" }' },
    { noTc: 5, ec: '6',   inputData: 'no options, service throws Error("DB error")',                  expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries – pagination validated at schema layer' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'No options, service resolves',    expected: 'success=true, page returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'With search filter',              expected: 'success=true, listMembers(filter) called' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'With pagination',                 expected: 'success=true, listMembers(pagination) called' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: 'Service throws AppError',         expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '', inputData: 'Service throws unexpected Error', expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const listAdminsCtrlBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 5,
  statement: 'user-controller.listAdmins(options?) – Server Action. No input validation. Delegates to userService.listAdmins(). Returns ActionResult<PageResult<AdminWithUser>>.',
  data: 'Input: AdminListOptions? { search?, page?, pageSize? }',
  precondition: 'userService.listAdmins is mock-injected',
  results: 'Output: ActionResult<PageResult<AdminWithUser>>',
  postcondition: 'On success: page returned. On AppError: failure. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'no options',      validEc: 'service resolves page',      invalidEc: '' },
    { number: 2, condition: 'with filter',     validEc: 'filter passed to service',   invalidEc: '' },
    { number: 3, condition: 'with pagination', validEc: 'pagination passed through',  invalidEc: '' },
    { number: 4, condition: 'service outcome', validEc: 'resolves page',              invalidEc: '' },
    { number: 5, condition: '',                validEc: '',                            invalidEc: 'throws AppError → failure' },
    { number: 6, condition: '',                validEc: '',                            invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,4', inputData: 'no options, service resolves { items:[MOCK_ADMIN], total:1 }', expected: '{ success: true, data.total: 1 }' },
    { noTc: 2, ec: '2',   inputData: '{ search: "Admin" }, service resolves',                        expected: '{ success: true }; listAdmins({ search:"Admin" }) called' },
    { noTc: 3, ec: '3',   inputData: '{ page: 2, pageSize: 5 }, service resolves',                   expected: '{ success: true }; listAdmins(options) called' },
    { noTc: 4, ec: '5',   inputData: 'no options, service throws AppError("Service error")',          expected: '{ success: false, message: "Service error" }' },
    { noTc: 5, ec: '6',   inputData: 'no options, service throws Error("DB error")',                  expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundaries' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'No options, service resolves',    expected: 'success=true, page returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'With search filter',              expected: 'success=true, listAdmins(filter) called' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'With pagination',                 expected: 'success=true, listAdmins(pagination) called' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '', inputData: 'Service throws AppError',         expected: 'success=false, message from error' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '', inputData: 'Service throws unexpected Error', expected: 'success=false, message="An unexpected error occurred"' },
  ],
};

const updateAdminCtrlBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 17,
  statement: 'user-controller.updateAdmin(adminId, data) – Server Action. Validates UpdateAdminInput (all optional). Delegates to userService.updateAdmin(). Returns ActionResult<AdminWithUser>.',
  data: 'Input: adminId: string, data: UpdateAdminInput (all optional)',
  precondition: 'userService.updateAdmin is mock-injected',
  results: 'Output: ActionResult<AdminWithUser>',
  postcondition: 'On success: updated AdminWithUser returned. On validation failure: errors returned. On AppError: message returned.',
  ecRows: [
    { number: 1,  condition: 'all fields valid',   validEc: 'optional fields pass schema',             invalidEc: '' },
    { number: 2,  condition: 'fullName optional',  validEc: 'fullName ≥ 8 chars if provided',         invalidEc: '' },
    { number: 3,  condition: '',                   validEc: '',                                         invalidEc: 'fullName < 8 chars → validation error' },
    { number: 4,  condition: 'email optional',     validEc: 'valid email if provided',                invalidEc: '' },
    { number: 5,  condition: '',                   validEc: '',                                         invalidEc: 'invalid email → validation error' },
    { number: 6,  condition: 'password optional',  validEc: 'password ≥ 8 chars, upper+digit+special', invalidEc: '' },
    { number: 7,  condition: '',                   validEc: '',                                         invalidEc: 'password < 8 chars → validation error' },
    { number: 8,  condition: '',                   validEc: '',                                         invalidEc: 'password missing digit → validation error' },
    { number: 9,  condition: 'service outcome',    validEc: 'resolves updated AdminWithUser',          invalidEc: '' },
    { number: 10, condition: '',                   validEc: '',                                         invalidEc: 'throws NotFoundError → failure' },
    { number: 11, condition: '',                   validEc: '',                                         invalidEc: 'throws ConflictError → failure' },
    { number: 12, condition: '',                   validEc: '',                                         invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,2,4,6,9', inputData: '{ fullName: "Admin Updated Name" }, service resolves',    expected: '{ success: true }' },
    { noTc: 2,  ec: '1,9',       inputData: '{} (empty object), service resolves',                       expected: '{ success: true }' },
    { noTc: 3,  ec: '3',         inputData: '{ fullName: "JohnDo" } (7 chars)',                          expected: '{ success: false, errors defined }' },
    { noTc: 4,  ec: '2',         inputData: '{ fullName: "John Doe" } (8 chars)',                        expected: '{ success: true } (boundary valid)' },
    { noTc: 5,  ec: '2',         inputData: '{ fullName: "A".repeat(64) } (64 chars)',                   expected: '{ success: true } (boundary valid)' },
    { noTc: 6,  ec: '3',         inputData: '{ fullName: "A".repeat(65) } (65 chars)',                   expected: '{ success: false, errors defined }' },
    { noTc: 7,  ec: '5',         inputData: '{ email: "bademail" }',                                     expected: '{ success: false, errors defined }' },
    { noTc: 8,  ec: '7',         inputData: '{ password: "Sec1!ab" } (7 chars)',                         expected: '{ success: false, errors defined }' },
    { noTc: 9,  ec: '6',         inputData: '{ password: "Secure1!" } (8 chars)',                        expected: '{ success: true } (password boundary valid)' },
    { noTc: 10, ec: '6',         inputData: '{ password: "Secure1!" + "a".repeat(56) } (64 chars)',      expected: '{ success: true } (password upper boundary)' },
    { noTc: 11, ec: '7',         inputData: '{ password: "Secure1!" + "a".repeat(57) } (65 chars)',      expected: '{ success: false, errors defined }' },
    { noTc: 12, ec: '8',         inputData: '{ password: "SecurePass!" } (missing digit)',                expected: '{ success: false, errors defined }' },
    { noTc: 13, ec: '9',         inputData: 'valid update, service throws NotFoundError',                 expected: '{ success: false, message: "Admin not found" }' },
    { noTc: 14, ec: '10',        inputData: 'valid update, service throws ConflictError',                 expected: '{ success: false, message from error }' },
    { noTc: 15, ec: '11',        inputData: 'valid update, service throws Error',                         expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'fullName length', testCase: 'fullName 7 → invalid; 8 → valid (min); 64 → valid (max); 65 → invalid' },
    { number: 2, condition: 'password length', testCase: 'password 7 → invalid; 8 → valid (min); 64 → valid (max); 65 → invalid' },
    { number: 3, condition: 'password complexity', testCase: 'missing digit → invalid; missing uppercase → invalid; missing special → invalid' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'fullName=7',    inputData: '{ fullName: "JohnDo" }',                           expected: 'success=false, errors defined' },
    { noTc: 2,  bva: 'fullName=8',    inputData: '{ fullName: "John Doe" }',                         expected: 'schema passes' },
    { noTc: 3,  bva: 'fullName=64',   inputData: '{ fullName: "A".repeat(64) }',                    expected: 'schema passes' },
    { noTc: 4,  bva: 'fullName=65',   inputData: '{ fullName: "A".repeat(65) }',                    expected: 'success=false, errors defined' },
    { noTc: 5,  bva: 'password=7',    inputData: '{ password: "Sec1!ab" }',                         expected: 'success=false, errors defined' },
    { noTc: 6,  bva: 'password=8',    inputData: '{ password: "Secure1!" }',                        expected: 'schema passes' },
    { noTc: 7,  bva: 'password=64',   inputData: '{ password: "Secure1!" + "a".repeat(56) }',      expected: 'schema passes' },
    { noTc: 8,  bva: 'password=65',   inputData: '{ password: "Secure1!" + "a".repeat(57) }',      expected: 'success=false, errors defined' },
    { noTc: 9,  bva: 'no digit',      inputData: '{ password: "SecurePass!" }',                     expected: 'success=false, errors defined' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: '',      inputData: 'Valid fullName update',                  expected: 'success=true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: '',      inputData: 'Empty object',                           expected: 'success=true' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: 'BVA-1', inputData: 'fullName 7 chars',                      expected: 'success=false, errors defined' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: 'BVA-2', inputData: 'fullName 8 chars',                      expected: 'success=true' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: 'BVA-3', inputData: 'fullName 64 chars',                     expected: 'success=true' },
    { noTc: 6,  fromEc: 'EP-6',  fromBva: 'BVA-4', inputData: 'fullName 65 chars',                     expected: 'success=false, errors defined' },
    { noTc: 7,  fromEc: 'EP-7',  fromBva: '',       inputData: 'Invalid email',                         expected: 'success=false, errors defined' },
    { noTc: 8,  fromEc: 'EP-8',  fromBva: 'BVA-5', inputData: 'password 7 chars',                      expected: 'success=false, errors defined' },
    { noTc: 9,  fromEc: 'EP-9',  fromBva: 'BVA-6', inputData: 'password 8 chars',                      expected: 'success=true' },
    { noTc: 10, fromEc: 'EP-10', fromBva: 'BVA-7', inputData: 'password 64 chars',                     expected: 'success=true' },
    { noTc: 11, fromEc: 'EP-11', fromBva: 'BVA-8', inputData: 'password 65 chars',                     expected: 'success=false, errors defined' },
    { noTc: 12, fromEc: 'EP-12', fromBva: 'BVA-9', inputData: 'password missing digit',                expected: 'success=false, errors defined' },
    { noTc: 13, fromEc: 'EP-13', fromBva: '',       inputData: 'Service throws NotFoundError',          expected: 'success=false, message from error' },
    { noTc: 14, fromEc: 'EP-14', fromBva: '',       inputData: 'Service throws ConflictError',          expected: 'success=false, message from error' },
    { noTc: 15, fromEc: 'EP-15', fromBva: '',       inputData: 'Service throws unexpected Error',       expected: 'success=false, "An unexpected error occurred"' },
  ],
};

const deleteAdminCtrlBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 3,
  statement: 'user-controller.deleteAdmin(adminId) – Server Action. No input validation. Delegates to userService.deleteAdmin(). Returns ActionResult<void>.',
  data: 'Input: adminId: string',
  precondition: 'userService.deleteAdmin is mock-injected',
  results: 'Output: ActionResult<void>',
  postcondition: 'On success: { success: true, data: undefined }. On AppError: failure. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'admin existence', validEc: 'service resolves void',                  invalidEc: '' },
    { number: 2, condition: '',                validEc: '',                                         invalidEc: 'throws NotFoundError → failure with message' },
    { number: 3, condition: '',                validEc: '',                                         invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'adminId="admin-001", service resolves',             expected: '{ success: true, data: undefined }' },
    { noTc: 2, ec: '2', inputData: '"nonexistent-id", service throws NotFoundError',    expected: '{ success: false, message: "Admin not found" }' },
    { noTc: 3, ec: '3', inputData: 'adminId="admin-001", service throws Error',         expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'N/A', testCase: 'No numerical boundary – ID is opaque string' }],
  bvaTcRows: [],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '', inputData: 'Existing adminId',                   expected: 'success=true, data=undefined' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '', inputData: 'Non-existent adminId',               expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '', inputData: 'Service throws unexpected Error',    expected: 'success=false, "An unexpected error occurred"' },
  ],
};

// ── exercise-controller (additional) ──────────────────────────────────────────

const listExercisesCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-02/EXM-06',
  tcCount: 7,
  statement: 'exercise-controller.listExercises(options?) – Server Action. No input validation. Delegates to exerciseService.listExercises(). Returns ActionResult<PageResult<Exercise>>.',
  data: 'Input: ExerciseListOptions? { search?, muscleGroup?, includeInactive?, page?, pageSize? }',
  precondition: 'exerciseService.listExercises is mock-injected',
  results: 'Output: ActionResult<PageResult<Exercise>>',
  postcondition: 'On success: page returned. On AppError: failure. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'no options',      validEc: 'service resolves page',              invalidEc: '' },
    { number: 2, condition: 'with search',     validEc: 'search option passed to service',    invalidEc: '' },
    { number: 3, condition: 'with muscleGroup',validEc: 'muscleGroup filter passed',          invalidEc: '' },
    { number: 4, condition: 'includeInactive', validEc: 'flag passed to service',             invalidEc: '' },
    { number: 5, condition: 'with pagination', validEc: 'pagination passed to service',       invalidEc: '' },
    { number: 6, condition: 'service outcome', validEc: 'resolves page',                      invalidEc: '' },
    { number: 7, condition: '',                validEc: '',                                    invalidEc: 'throws AppError → failure' },
    { number: 8, condition: '',                validEc: '',                                    invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,6', inputData: 'no options, service resolves { items:[EXERCISE], total:1 }', expected: '{ success: true, data.total: 1 }' },
    { noTc: 2, ec: '2',   inputData: '{ search: "Bench" }, service resolves',                     expected: '{ success: true }; listExercises({ search:"Bench" }) called' },
    { noTc: 3, ec: '3',   inputData: '{ muscleGroup: "CHEST" }, service resolves',                expected: '{ success: true }; listExercises(options) called' },
    { noTc: 4, ec: '4',   inputData: '{ includeInactive: true }, service resolves',               expected: '{ success: true }; listExercises(options) called' },
    { noTc: 5, ec: '5',   inputData: '{ page: 2, pageSize: 10 }, service resolves',               expected: '{ success: true }; listExercises(options) called' },
    { noTc: 6, ec: '7',   inputData: 'no options, service throws AppError("Service error")',       expected: '{ success: false, message: "Service error" }' },
    { noTc: 7, ec: '8',   inputData: 'no options, service throws Error("DB error")',               expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'includeInactive', testCase: 'includeInactive=false (default) → active only; includeInactive=true → all' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'includeInactive=true', inputData: '{ includeInactive: true }', expected: 'listExercises({ includeInactive:true }) called' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'No options, service resolves',       expected: 'success=true, page returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'With search filter',                 expected: 'success=true, service called with options' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',      inputData: 'muscleGroup filter',                 expected: 'success=true, service called with options' },
    { noTc: 4, fromEc: 'EP-4', fromBva: 'BVA-1', inputData: 'includeInactive=true',              expected: 'success=true, all exercises returned' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',      inputData: 'With pagination',                    expected: 'success=true, service called with pagination' },
    { noTc: 6, fromEc: 'EP-6', fromBva: '',      inputData: 'Service throws AppError',            expected: 'success=false, message from error' },
    { noTc: 7, fromEc: 'EP-7', fromBva: '',      inputData: 'Service throws unexpected Error',    expected: 'success=false, "An unexpected error occurred"' },
  ],
};

const unarchiveExerciseCtrlBbt: BbtDescriptor = {
  reqId: 'EXM-05',
  tcCount: 3,
  statement: 'exercise-controller.unarchiveExercise(id) – Server Action. No input validation. Delegates to exerciseService.unarchiveExercise(). Returns ActionResult<Exercise> with isActive=true.',
  data: 'Input: id: string',
  precondition: 'exerciseService.unarchiveExercise is mock-injected',
  results: 'Output: ActionResult<Exercise>',
  postcondition: 'On success: Exercise with isActive=true returned. On NotFoundError: failure. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'exercise existence', validEc: 'service resolves Exercise(isActive=true)', invalidEc: '' },
    { number: 2, condition: '',                   validEc: '',                                           invalidEc: 'service throws NotFoundError → failure' },
    { number: 3, condition: '',                   validEc: '',                                           invalidEc: 'service throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1', inputData: 'id="exercise-001", service resolves {isActive:true}', expected: '{ success: true, data.isActive: true }' },
    { noTc: 2, ec: '2', inputData: 'id="nonexistent-id", service throws NotFoundError',   expected: '{ success: false, message: "Exercise not found" }' },
    { noTc: 3, ec: '3', inputData: 'id="exercise-001", service throws Error',             expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [{ number: 1, condition: 'isActive boundary', testCase: 'isActive=true (restored state)' }],
  bvaTcRows: [{ noTc: 1, bva: 'isActive=true', inputData: 'Service resolves with isActive=true', expected: 'data.isActive=true' }],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: 'BVA-1', inputData: 'Existing exercise id',               expected: 'success=true, isActive=true' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',       inputData: 'Non-existent id',                    expected: 'success=false, message from NotFoundError' },
    { noTc: 3, fromEc: 'EP-3', fromBva: '',       inputData: 'Service throws unexpected Error',    expected: 'success=false, "An unexpected error occurred"' },
  ],
};

// ── workout-session-controller (additional) ────────────────────────────────────

const listMemberWorkoutSessionsCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-05',
  tcCount: 5,
  statement: 'workout-session-controller.listMemberWorkoutSessions(memberId, options?) – Server Action. No input validation. Delegates to workoutSessionService.listMemberWorkoutSessions(). Returns ActionResult<PageResult<WorkoutSessionWithExercises>>.',
  data: 'Input: memberId: string, options?: { startDate?, endDate?, page?, pageSize? }',
  precondition: 'workoutSessionService.listMemberWorkoutSessions is mock-injected',
  results: 'Output: ActionResult<PageResult<WorkoutSessionWithExercises>>',
  postcondition: 'On success: page returned. On AppError: failure. On error: generic failure.',
  ecRows: [
    { number: 1, condition: 'no extra options', validEc: 'service resolves page filtered by memberId', invalidEc: '' },
    { number: 2, condition: 'with date range',  validEc: 'date range passed to service',               invalidEc: '' },
    { number: 3, condition: 'empty sessions',   validEc: 'items=[], total=0',                          invalidEc: '' },
    { number: 4, condition: 'pagination',       validEc: 'pagination passed to service',               invalidEc: '' },
    { number: 5, condition: 'service outcome',  validEc: 'resolves page',                              invalidEc: '' },
    { number: 6, condition: '',                 validEc: '',                                            invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1, ec: '1,5', inputData: 'memberId="member-001", no options',                              expected: '{ success: true, data.total: 1 }' },
    { noTc: 2, ec: '2',   inputData: 'memberId + { startDate, endDate }, service resolves',            expected: '{ success: true }; listMemberWorkoutSessions(memberId, options) called' },
    { noTc: 3, ec: '3',   inputData: 'memberId, service resolves empty page',                          expected: '{ success: true, data.items: [] }' },
    { noTc: 4, ec: '4',   inputData: 'memberId + { page:2, pageSize:5 }, service resolves',           expected: '{ success: true }; called with pagination' },
    { noTc: 5, ec: '6',   inputData: 'memberId, service throws Error("DB error")',                     expected: '{ success: false, message: "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'empty sessions', testCase: 'No sessions for member → total=0, items=[]' },
  ],
  bvaTcRows: [
    { noTc: 1, bva: 'empty result', inputData: 'memberId with no sessions', expected: 'items=[], total=0' },
  ],
  finalTcRows: [
    { noTc: 1, fromEc: 'EP-1', fromBva: '',      inputData: 'memberId, no options',          expected: 'success=true, page returned' },
    { noTc: 2, fromEc: 'EP-2', fromBva: '',      inputData: 'memberId + date range',         expected: 'success=true, service called with options' },
    { noTc: 3, fromEc: 'EP-3', fromBva: 'BVA-1', inputData: 'memberId, no sessions',         expected: 'success=true, items=[]' },
    { noTc: 4, fromEc: 'EP-4', fromBva: '',      inputData: 'memberId + pagination',         expected: 'success=true, service called with pagination' },
    { noTc: 5, fromEc: 'EP-5', fromBva: '',      inputData: 'Service throws unexpected Error', expected: 'success=false, "An unexpected error occurred"' },
  ],
};

const updateWorkoutSessionWithExercisesCtrlBbt: BbtDescriptor = {
  reqId: 'WSM-06/WSM-07',
  tcCount: 20,
  statement: 'workout-session-controller.updateWorkoutSessionWithExercises(id, data, exercises) – Server Action. Validates UpdateWorkoutSessionInput (optional duration 0–180) and workoutSessionExercisesUpdateSchema (≥1 exercise, sets 0–6, reps 0–30, weight 0–500). Returns ActionResult<WorkoutSessionWithExercises>.',
  data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[] (≥1)',
  precondition: 'workoutSessionService.updateWorkoutSessionWithExercises is mock-injected',
  results: 'Output: ActionResult<WorkoutSessionWithExercises>',
  postcondition: 'On success: WorkoutSessionWithExercises returned. On validation failure: errors returned. On AppError: message returned.',
  ecRows: [
    { number: 1,  condition: 'session data valid',  validEc: 'optional duration 0–180 if provided',    invalidEc: '' },
    { number: 2,  condition: 'duration optional',   validEc: 'duration ≤ 180',                         invalidEc: '' },
    { number: 3,  condition: '',                    validEc: '',                                         invalidEc: 'duration > 180 → validation error' },
    { number: 4,  condition: 'exercises array',     validEc: 'length ≥ 1',                              invalidEc: '' },
    { number: 5,  condition: '',                    validEc: '',                                         invalidEc: 'length = 0 → validation/service error' },
    { number: 6,  condition: 'sets range',          validEc: 'sets 0–6',                               invalidEc: '' },
    { number: 7,  condition: '',                    validEc: '',                                         invalidEc: 'sets > 6 → validation error' },
    { number: 8,  condition: 'reps range',          validEc: 'reps 0–30',                              invalidEc: '' },
    { number: 9,  condition: '',                    validEc: '',                                         invalidEc: 'reps > 30 → validation error' },
    { number: 10, condition: 'weight range',        validEc: 'weight 0–500',                           invalidEc: '' },
    { number: 11, condition: '',                    validEc: '',                                         invalidEc: 'weight > 500 → validation error' },
    { number: 12, condition: 'service outcome',     validEc: 'resolves WorkoutSessionWithExercises',    invalidEc: '' },
    { number: 13, condition: '',                    validEc: '',                                         invalidEc: 'throws NotFoundError → failure' },
    { number: 14, condition: '',                    validEc: '',                                         invalidEc: 'throws Error → generic failure' },
  ],
  epTcRows: [
    { noTc: 1,  ec: '1,2,4,6,8,10,12', inputData: 'VALID_UPDATE + [{ sets:3, reps:10, weight:50 }], service resolves', expected: '{ success: true }' },
    { noTc: 2,  ec: '3',               inputData: '{ duration: 181 }, valid exercises',                                 expected: '{ success: false, errors defined }' },
    { noTc: 3,  ec: '5',               inputData: 'valid data, exercises=[]',                                           expected: '{ success: false }' },
    { noTc: 4,  ec: '7',               inputData: 'valid data, [{ sets: 7 }]',                                         expected: '{ success: false }' },
    { noTc: 5,  ec: '9',               inputData: 'valid data, [{ reps: 31 }]',                                        expected: '{ success: false }' },
    { noTc: 6,  ec: '11',              inputData: 'valid data, [{ weight: 501 }]',                                      expected: '{ success: false }' },
    { noTc: 7,  ec: '13',              inputData: 'valid, service throws NotFoundError',                                 expected: '{ success: false, message from error }' },
    { noTc: 8,  ec: '14',              inputData: 'valid, service throws Error',                                         expected: '{ success: false, "An unexpected error occurred" }' },
  ],
  bvaRows: [
    { number: 1, condition: 'duration boundary', testCase: 'duration=180 → valid; duration=181 → invalid; duration=0 → valid' },
    { number: 2, condition: 'exercises count',   testCase: 'exercises=[] → error; exercises=[1] → valid' },
    { number: 3, condition: 'sets boundary',     testCase: 'sets=6 → valid; sets=7 → invalid; sets=0 → valid; sets=-1 → invalid' },
    { number: 4, condition: 'reps boundary',     testCase: 'reps=30 → valid; reps=31 → invalid; reps=0 → valid; reps=-1 → invalid' },
    { number: 5, condition: 'weight boundary',   testCase: 'weight=500 → valid; weight=501 → invalid; weight=0 → valid; weight=-1 → invalid' },
    { number: 6, condition: 'sets interior',      testCase: 'sets=1 → valid (min+1)' },
    { number: 7, condition: '',                   testCase: 'sets=5 → valid (max-1)' },
    { number: 8, condition: 'reps interior',      testCase: 'reps=1 → valid (min+1)' },
    { number: 9, condition: '',                   testCase: 'reps=29 → valid (max-1)' },
    { number: 10,condition: 'weight interior',    testCase: 'weight=0.1 → valid (min+0.1)' },
    { number: 11,condition: '',                   testCase: 'weight=499.9 → valid (max-0.1)' },
  ],
  bvaTcRows: [
    { noTc: 1,  bva: 'duration=180',  inputData: '{ duration: 180 }, valid exercises',           expected: 'success=true' },
    { noTc: 2,  bva: 'duration=181',  inputData: '{ duration: 181 }, valid exercises',           expected: 'success=false, errors defined' },
    { noTc: 3,  bva: 'duration=0',    inputData: '{ duration: 0 }, valid exercises',             expected: 'success=true' },
    { noTc: 4,  bva: 'exercises=0',   inputData: 'valid session, exercises=[]',                  expected: 'success=false' },
    { noTc: 5,  bva: 'exercises=1',   inputData: 'valid session, exercises=[1]',                 expected: 'success=true' },
    { noTc: 6,  bva: 'sets=6',        inputData: '[{ sets: 6 }]',                               expected: 'success=true (max boundary)' },
    { noTc: 7,  bva: 'sets=7',        inputData: '[{ sets: 7 }]',                               expected: 'success=false' },
    { noTc: 8,  bva: 'sets=0',        inputData: '[{ sets: 0 }]',                               expected: 'success=true (min boundary)' },
    { noTc: 9,  bva: 'sets=-1',       inputData: '[{ sets: -1 }]',                              expected: 'success=false' },
    { noTc: 10, bva: 'reps=30',       inputData: '[{ reps: 30 }]',                              expected: 'success=true (max boundary)' },
    { noTc: 11, bva: 'reps=31',       inputData: '[{ reps: 31 }]',                              expected: 'success=false' },
    { noTc: 12, bva: 'reps=0',        inputData: '[{ reps: 0 }]',                               expected: 'success=true (min boundary)' },
    { noTc: 13, bva: 'reps=-1',       inputData: '[{ reps: -1 }]',                              expected: 'success=false' },
    { noTc: 14, bva: 'weight=500',    inputData: '[{ weight: 500 }]',                           expected: 'success=true (max boundary)' },
    { noTc: 15, bva: 'weight=501',    inputData: '[{ weight: 501 }]',                           expected: 'success=false' },
    { noTc: 16, bva: 'weight=0',      inputData: '[{ weight: 0 }]',                             expected: 'success=true (min boundary)' },
    { noTc: 17, bva: 'weight=-1',     inputData: '[{ weight: -1 }]',                            expected: 'success=false' },
    { noTc: 18, bva: 'sets=1',        inputData: 'sets: 1',                                     expected: 'success=true' },
    { noTc: 19, bva: 'sets=5',        inputData: 'sets: 5',                                     expected: 'success=true' },
    { noTc: 20, bva: 'reps=1',        inputData: 'reps: 1',                                     expected: 'success=true' },
    { noTc: 21, bva: 'reps=29',       inputData: 'reps: 29',                                    expected: 'success=true' },
    { noTc: 22, bva: 'weight=0.1',    inputData: 'weight: 0.1',                                 expected: 'success=true' },
    { noTc: 23, bva: 'weight=499.9',  inputData: 'weight: 499.9',                               expected: 'success=true' },
  ],
  finalTcRows: [
    { noTc: 1,  fromEc: 'EP-1',  fromBva: 'BVA-1', inputData: 'Valid, duration=180, 1 exercise',    expected: 'success=true' },
    { noTc: 2,  fromEc: 'EP-2',  fromBva: 'BVA-2', inputData: 'duration=181',                       expected: 'success=false' },
    { noTc: 3,  fromEc: 'EP-3',  fromBva: '',       inputData: 'exercises=[] (EP)',                  expected: 'success=false' },
    { noTc: 4,  fromEc: 'EP-4',  fromBva: 'BVA-7', inputData: 'sets=7',                             expected: 'success=false' },
    { noTc: 5,  fromEc: 'EP-5',  fromBva: 'BVA-11', inputData: 'reps=31',                           expected: 'success=false' },
    { noTc: 6,  fromEc: 'EP-6',  fromBva: 'BVA-15', inputData: 'weight=501',                        expected: 'success=false' },
    { noTc: 7,  fromEc: 'EP-7',  fromBva: '',       inputData: 'Service throws NotFoundError',      expected: 'success=false, message from error' },
    { noTc: 8,  fromEc: 'EP-8',  fromBva: '',       inputData: 'Service throws unexpected Error',    expected: 'success=false, "An unexpected error occurred"' },
    { noTc: 9,  fromEc: '',      fromBva: 'BVA-3', inputData: 'duration=0',                      expected: 'success=true' },
    { noTc: 10, fromEc: '',      fromBva: 'BVA-6', inputData: 'sets=6',                           expected: 'success=true' },
    { noTc: 11, fromEc: '',      fromBva: 'BVA-10',inputData: 'reps=30',                          expected: 'success=true' },
    { noTc: 12, fromEc: '',      fromBva: 'BVA-14',inputData: 'weight=500',                       expected: 'success=true' },
    { noTc: 13, fromEc: '',      fromBva: 'BVA-18',inputData: 'sets=1',                           expected: 'success=true' },
    { noTc: 14, fromEc: '',      fromBva: 'BVA-19',inputData: 'sets=5',                           expected: 'success=true' },
    { noTc: 15, fromEc: '',      fromBva: 'BVA-20',inputData: 'reps=1',                           expected: 'success=true' },
    { noTc: 16, fromEc: '',      fromBva: 'BVA-21',inputData: 'reps=29',                          expected: 'success=true' },
    { noTc: 17, fromEc: '',      fromBva: 'BVA-22',inputData: 'weight=0.1',                       expected: 'success=true' },
    { noTc: 18, fromEc: '',      fromBva: 'BVA-23',inputData: 'weight=499.9',                     expected: 'success=true' },
    { noTc: 19, fromEc: 'EP-1',  fromBva: '',      inputData: 'Valid update with duration=60',     expected: 'success=true' },
    { noTc: 20, fromEc: 'EP-1',  fromBva: '',      inputData: 'Valid update with reps=15',         expected: 'success=true' },
  ],
};

// ── main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const AUTH_CTRL = path.join(CTRL_BASE, 'auth-controller');
  const USER_CTRL = path.join(CTRL_BASE, 'user-controller');
  const EXM_CTRL  = path.join(CTRL_BASE, 'exercise-controller');
  const WS_CTRL   = path.join(CTRL_BASE, 'workout-session-controller');
  const RPT_CTRL  = path.join(CTRL_BASE, 'report-controller');

  console.log('Generating auth-controller BBT forms…');
  await writeBbt(loginBbt,  path.join(AUTH_CTRL, 'login-bbt-form.xlsx'));
  await writeBbt(logoutBbt, path.join(AUTH_CTRL, 'logout-bbt-form.xlsx'));

  console.log('Generating user-controller BBT forms…');
  await writeBbt(createMemberCtrlBbt,              path.join(USER_CTRL, 'createMember-bbt-form.xlsx'));
  await writeBbt(createMemberWithTempPasswordCtrlBbt, path.join(USER_CTRL, 'createMemberWithTempPassword-bbt-form.xlsx'));
  await writeBbt(createAdminCtrlBbt,               path.join(USER_CTRL, 'createAdmin-bbt-form.xlsx'));
  await writeBbt(getMemberCtrlBbt,                 path.join(USER_CTRL, 'getMember-bbt-form.xlsx'));
  await writeBbt(getAdminCtrlBbt,                  path.join(USER_CTRL, 'getAdmin-bbt-form.xlsx'));
  await writeBbt(updateMemberCtrlBbt,              path.join(USER_CTRL, 'updateMember-bbt-form.xlsx'));
  await writeBbt(suspendMemberCtrlBbt,             path.join(USER_CTRL, 'suspendMember-bbt-form.xlsx'));
  await writeBbt(activateMemberCtrlBbt,            path.join(USER_CTRL, 'activateMember-bbt-form.xlsx'));
  await writeBbt(deleteMemberCtrlBbt,              path.join(USER_CTRL, 'deleteMember-bbt-form.xlsx'));
  await writeBbt(listMembersCtrlBbt,               path.join(USER_CTRL, 'listMembers-bbt-form.xlsx'));
  await writeBbt(listAdminsCtrlBbt,                path.join(USER_CTRL, 'listAdmins-bbt-form.xlsx'));
  await writeBbt(updateAdminCtrlBbt,               path.join(USER_CTRL, 'updateAdmin-bbt-form.xlsx'));
  await writeBbt(deleteAdminCtrlBbt,               path.join(USER_CTRL, 'deleteAdmin-bbt-form.xlsx'));

  console.log('Generating exercise-controller BBT forms…');
  await writeBbt(createExerciseCtrlBbt,      path.join(EXM_CTRL, 'createExercise-bbt-form.xlsx'));
  await writeBbt(getExerciseCtrlBbt,         path.join(EXM_CTRL, 'getExercise-bbt-form.xlsx'));
  await writeBbt(updateExerciseCtrlBbt,      path.join(EXM_CTRL, 'updateExercise-bbt-form.xlsx'));
  await writeBbt(archiveExerciseCtrlBbt,     path.join(EXM_CTRL, 'archiveExercise-bbt-form.xlsx'));
  await writeBbt(deleteExerciseCtrlBbt,      path.join(EXM_CTRL, 'deleteExercise-bbt-form.xlsx'));
  await writeBbt(listExercisesCtrlBbt,       path.join(EXM_CTRL, 'listExercises-bbt-form.xlsx'));
  await writeBbt(unarchiveExerciseCtrlBbt,   path.join(EXM_CTRL, 'unarchiveExercise-bbt-form.xlsx'));

  console.log('Generating workout-session-controller BBT forms…');
  await writeBbt(createWorkoutSessionCtrlBbt,                path.join(WS_CTRL, 'createWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getWorkoutSessionCtrlBbt,                   path.join(WS_CTRL, 'getWorkoutSession-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionCtrlBbt,                path.join(WS_CTRL, 'updateWorkoutSession-bbt-form.xlsx'));
  await writeBbt(deleteWorkoutSessionCtrlBbt,                path.join(WS_CTRL, 'deleteWorkoutSession-bbt-form.xlsx'));
  await writeBbt(listMemberWorkoutSessionsCtrlBbt,           path.join(WS_CTRL, 'listMemberWorkoutSessions-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionWithExercisesCtrlBbt,   path.join(WS_CTRL, 'updateWorkoutSessionWithExercises-bbt-form.xlsx'));

  console.log('Generating report-controller BBT forms…');
  await writeBbt(getMemberProgressReportCtrlBbt, path.join(RPT_CTRL, 'getMemberProgressReport-bbt-form.xlsx'));

  console.log('\nDone — 27 controller BBT forms generated.');
}

main().catch(console.error);
