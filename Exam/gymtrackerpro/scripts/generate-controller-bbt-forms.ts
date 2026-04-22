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
  const retestPassed = d.retestPassed ?? 0;
  const retestFailed = d.retestFailed ?? 0;

  const row = ws.addRow([d.reqId, totalRun, tcsPassed, tcsFailed, bugsFound, bugsFixed, retested, retestRun, retestPassed, retestFailed]);
  row.eachCell(c => styleData(c)); row.height = 20;
}

async function writeBbt(d: BbtDescriptor, outPath: string) {
  const wb = new ExcelJS.Workbook();
  addProblemSheet(wb, d); addEcSheet(wb, d); addEcTcSheet(wb, d); addBvaSheet(wb, d); addBvaTcSheet(wb, d); addFinalSheet(wb, d); addStatsSheet(wb, d);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await wb.xlsx.writeFile(outPath);
}

// ── Descriptors ──────────────────────────────────────────────────────────────
const loginCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-01',
    tcCount: 17,
    statement: 'login(data) – Validates the login input, authenticates the credentials, persists the resulting SessionData in the session cookie, and returns an ActionResult<SessionData>. Returns success with the SessionData on success with the session persisted. Returns a field-level validation error for schema failures without calling the authentication service. Returns a failure with the service error message for AuthorizationError and NotFoundError. Returns a failure with a generic error message for unexpected errors such as a session retrieval failure.',
    data: 'Input: data: LoginUserInput { email: string, password: string }',
    precondition: 'The session layer is available and supports save() and destroy(). Password rules: 8–64 chars, at least one uppercase letter, one digit, one special character.',
    results: 'Output: Promise<ActionResult<SessionData>>',
    postcondition: 'On success: login completes, session persisted, returned data matches the authenticated user session. On validation failure: field-level validation error returned, the authentication service is not called. On service error: operation fails with the thrown error message. On unexpected error: operation fails with generic error message.',
    ecRows: [
        { number: 1,  condition: 'Credentials',    validEc: 'Valid admin credentials → login succeeds, returned session data matches admin session, session persisted', invalidEc: '' },
        { number: 2,  condition: 'Credentials',    validEc: 'Valid member credentials → login succeeds, returned session data matches member session with role MEMBER, session persisted', invalidEc: '' },
        { number: 3,  condition: 'Email field',    validEc: '', invalidEc: 'Missing email → validation fails: email field error returned' },
        { number: 4,  condition: 'Password field', validEc: '', invalidEc: 'Missing password → validation fails: password field error returned' },
        { number: 5,  condition: 'Email format',   validEc: '', invalidEc: 'Invalid email format ("bad-email") → validation fails: email field error returned' },
        { number: 6,  condition: 'Password rules', validEc: '', invalidEc: 'No uppercase letter ("validpass1!") → validation fails: password field error returned' },
        { number: 7,  condition: 'Password rules', validEc: '', invalidEc: 'No digit ("ValidPass!") → validation fails: password field error returned' },
        { number: 8,  condition: 'Password rules', validEc: '', invalidEc: 'No special character ("ValidPass1") → validation fails: password field error returned' },
        { number: 9,  condition: 'Service error',  validEc: '', invalidEc: 'Credentials do not match any account (AuthorizationError "Invalid email or password") → operation fails with message "Invalid email or password"' },
        { number: 10, condition: 'Service error',  validEc: '', invalidEc: 'No account exists for the provided email (NotFoundError "User not found") → operation fails with message "User not found"' },
        { number: 11, condition: 'Session error',  validEc: '', invalidEc: 'Session retrieval fails unexpectedly → operation fails with generic error message' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'valid admin credentials (email and password matching an admin account)',                                expected: 'login succeeds, returned session data matches admin session, session persisted' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid member credentials (email: "member@example.com", password: "ValidPassword1!")',                   expected: 'login succeeds, returned session data matches member session with role MEMBER, session persisted' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'login data with email field omitted',                                                                  expected: 'validation fails: email field error returned' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'login data with password field omitted',                                                               expected: 'validation fails: password field error returned' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'login data with email set to "bad-email"',                                                             expected: 'validation fails: email field error returned' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'login data with password "validpass1!" (no uppercase letter)',                                         expected: 'validation fails: password field error returned' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'login data with password "ValidPass!" (no digit)',                                                     expected: 'validation fails: password field error returned' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'login data with password "ValidPass1" (no special character)',                                         expected: 'validation fails: password field error returned' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid credentials format, credentials do not match any account (AuthorizationError)',                  expected: 'operation fails with message "Invalid email or password"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid credentials format, no account exists for the provided email (NotFoundError)',                   expected: 'operation fails with message "User not found"' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid credentials format, authentication succeeds, session retrieval fails unexpectedly',              expected: 'operation fails with generic error message' },
    ],
    bvaRows: [
        { number: 1, condition: 'Password length', testCase: '7 chars (min - 1): below minimum → invalid; 8 chars (min): at minimum → valid; 9 chars (min + 1): above minimum → valid' },
        { number: 2, condition: 'Password length', testCase: '63 chars (max - 1): below maximum → valid; 64 chars (max): at maximum → valid; 65 chars (max + 1): above maximum → invalid' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=7)',  inputData: 'login data with password of 7 characters meeting all rules except minimum length ("V1@aaaa")',    expected: 'validation fails: password field error returned' },
        { noTc: 2, bva: 'BVA-1 (n=8)',  inputData: 'login data with password of 8 characters meeting all rules ("V1@aaaaa")',                         expected: 'login succeeds, session persisted' },
        { noTc: 3, bva: 'BVA-1 (n=9)',  inputData: 'login data with password of 9 characters meeting all rules ("V1@aaaaaa")',                        expected: 'login succeeds, session persisted' },
        { noTc: 4, bva: 'BVA-2 (n=63)', inputData: 'login data with password of 63 characters meeting all rules ("V1@" + "a".repeat(60))',            expected: 'login succeeds, session persisted' },
        { noTc: 5, bva: 'BVA-2 (n=64)', inputData: 'login data with password of 64 characters meeting all rules ("V1@" + "a".repeat(61))',            expected: 'login succeeds, session persisted' },
        { noTc: 6, bva: 'BVA-2 (n=65)', inputData: 'login data with password of 65 characters exceeding maximum length ("V1@" + "a".repeat(62))',    expected: 'validation fails: password field error returned' },
    ],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'valid admin credentials (email and password matching an admin account)',               expected: 'login succeeds, returned session data matches admin session, session persisted' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid member credentials (email: "member@example.com", password: "ValidPassword1!")',   expected: 'login succeeds, returned session data matches member session with role MEMBER, session persisted' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'login data with email field omitted',                                                  expected: 'validation fails: email field error returned' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'login data with password field omitted',                                               expected: 'validation fails: password field error returned' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'login data with email set to "bad-email"',                                             expected: 'validation fails: email field error returned' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'login data with password "validpass1!" (no uppercase letter)',                         expected: 'validation fails: password field error returned' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'login data with password "ValidPass!" (no digit)',                                     expected: 'validation fails: password field error returned' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'login data with password "ValidPass1" (no special character)',                         expected: 'validation fails: password field error returned' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid credentials format, credentials do not match any account (AuthorizationError)', expected: 'operation fails with message "Invalid email or password"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid credentials format, no account exists for the provided email (NotFoundError)',  expected: 'operation fails with message "User not found"' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid credentials format, authentication succeeds, session retrieval fails unexpectedly', expected: 'operation fails with generic error message' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'login data with password of 7 characters meeting all rules except minimum length ("V1@aaaa")',  expected: 'validation fails: password field error returned' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'login data with password of 8 characters meeting all rules ("V1@aaaaa")',                       expected: 'login succeeds, session persisted' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'login data with password of 9 characters meeting all rules ("V1@aaaaaa")',                      expected: 'login succeeds, session persisted' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'login data with password of 63 characters meeting all rules ("V1@" + "a".repeat(60))',          expected: 'login succeeds, session persisted' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'login data with password of 64 characters meeting all rules ("V1@" + "a".repeat(61))',          expected: 'login succeeds, session persisted' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'login data with password of 65 characters exceeding maximum length ("V1@" + "a".repeat(62))',   expected: 'validation fails: password field error returned' },
    ],
};

const logoutCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-02',
    tcCount: 3,
    statement: 'logout() – Destroys the current session cookie and returns an ActionResult<void>. Returns success with no data on success with the session destroyed. Returns a failure with a generic error message if session retrieval or session destruction fails unexpectedly.',
    data: 'Input: none',
    precondition: 'The session layer is available and supports destroy(). No authentication state is required to call logout.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'On success: logout completes, session destroyed, no data returned. On failure: operation fails with generic error message.',
    ecRows: [
        { number: 1, condition: 'Session lifecycle', validEc: 'Session is retrieved and destroyed successfully → logout completes successfully, no data returned, session destroyed', invalidEc: '' },
        { number: 2, condition: 'Session lifecycle', validEc: '', invalidEc: 'Session retrieval fails unexpectedly → operation fails with generic error message' },
        { number: 3, condition: 'Session lifecycle', validEc: '', invalidEc: 'Session is retrieved, but destruction fails unexpectedly → operation fails with generic error message' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no input, session is retrieved and destroyed successfully',                          expected: 'logout completes successfully, no data returned, session destroyed' },
        { noTc: 2, ec: 'EC-2', inputData: 'no input, session retrieval fails unexpectedly',                                     expected: 'operation fails with generic error message' },
        { noTc: 3, ec: 'EC-3', inputData: 'no input, session is retrieved, but session destruction fails unexpectedly',         expected: 'operation fails with generic error message' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'no input, session is retrieved and destroyed successfully',                 expected: 'logout completes successfully, no data returned, session destroyed' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'no input, session retrieval fails unexpectedly',                           expected: 'operation fails with generic error message' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'no input, session is retrieved, but session destruction fails unexpectedly', expected: 'operation fails with generic error message' },
    ],
};

const createMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-03',
    tcCount: 41,
    statement: 'createMember(data) – Validates the create-member input and returns an ActionResult<MemberWithUser>. Returns success with the created MemberWithUser on success. Returns a field-level validation error for schema failures without calling the service. Returns a failure with the service error message for ConflictError and TransactionError. Whitespace is trimmed from email, fullName, and phone before validation. fullName must be 8–64 characters after trimming and must not be whitespace-only. Password must be 8–64 characters with at least one uppercase letter, one digit, and one special character. dateOfBirth must be in YYYY-MM-DD format and must be strictly in the past (before today). membershipStart must be in YYYY-MM-DD format; future dates are accepted.',
    data: 'Input: data: CreateMemberInput { email, fullName, phone, dateOfBirth, password, membershipStart, ...optional }',
    precondition: 'Password rules: 8–64 chars, at least one uppercase letter, one digit, one special character. fullName rules: 8–64 chars after trim, not whitespace-only. dateOfBirth: YYYY-MM-DD, strictly before today. membershipStart: YYYY-MM-DD, any date including future.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: member created successfully, returned data matches the created member. On validation failure: field-level validation error returned, the service is not called. On service error: operation fails with the service error message.',
    ecRows: [
        { number: 1,  condition: 'Input validity',      validEc: 'All fields valid → member created successfully, returned data matches the created member', invalidEc: '' },
        { number: 2,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing email → validation fails: email field error returned' },
        { number: 3,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing fullName → validation fails: fullName field error returned' },
        { number: 4,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing phone → validation fails: phone field error returned' },
        { number: 5,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing dateOfBirth → validation fails: dateOfBirth field error returned' },
        { number: 6,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing password → validation fails: password field error returned' },
        { number: 7,  condition: 'Required fields',     validEc: '', invalidEc: 'Missing membershipStart → validation fails: membershipStart field error returned' },
        { number: 8,  condition: 'Email format',        validEc: '', invalidEc: 'Invalid email format ("invalid") → validation fails: email field error returned' },
        { number: 9,  condition: 'Password rules',      validEc: '', invalidEc: 'No uppercase letter ("securep@ss1!") → validation fails: password field error returned' },
        { number: 10, condition: 'Password rules',      validEc: '', invalidEc: 'No digit ("SecurePass!") → validation fails: password field error returned' },
        { number: 11, condition: 'Password rules',      validEc: '', invalidEc: 'No special character ("SecurePass1") → validation fails: password field error returned' },
        { number: 12, condition: 'Phone format',        validEc: '', invalidEc: 'Invalid phone format ("0712345678", missing country code) → validation fails: phone field error returned' },
        { number: 13, condition: 'dateOfBirth format',  validEc: '', invalidEc: 'Invalid format ("15-01-1990", not YYYY-MM-DD) → validation fails: dateOfBirth field error returned' },
        { number: 14, condition: 'dateOfBirth value',   validEc: '', invalidEc: 'Future dateOfBirth ("2099-01-01") → validation fails: dateOfBirth field error returned' },
        { number: 15, condition: 'membershipStart',     validEc: 'Future membershipStart ("2099-01-01") → validation passes, member created successfully (future dates accepted)', invalidEc: '' },
        { number: 16, condition: 'membershipStart',     validEc: '', invalidEc: 'Invalid membershipStart format ("01/01/2024") → validation fails: membershipStart field error returned' },
        { number: 17, condition: 'fullName content',    validEc: '', invalidEc: 'fullName whitespace-only ("         ") → validation fails: fullName field error returned' },
        { number: 18, condition: 'Whitespace trimming', validEc: 'fullName with surrounding whitespace ("  John Doe Test  ") → trimmed and accepted, member created successfully', invalidEc: '' },
        { number: 19, condition: 'Whitespace trimming', validEc: 'email with surrounding whitespace ("  john.doe@example.com  ") → trimmed and accepted, member created successfully', invalidEc: '' },
        { number: 20, condition: 'Whitespace trimming', validEc: 'phone with surrounding whitespace ("  +40712345678  ") → trimmed and accepted, member created successfully', invalidEc: '' },
        { number: 21, condition: 'Service error',       validEc: '', invalidEc: 'A duplicate email conflict occurs → operation fails with message "Email already registered"' },
        { number: 22, condition: 'Service error',       validEc: '', invalidEc: 'A database transaction failure occurs → operation fails with message "DB failure"' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required member fields provided with valid values',                                                                              expected: 'member created successfully, returned data matches the created member' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid member data with email field omitted',                                                                                        expected: 'validation fails: email field error returned' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid member data with fullName field omitted',                                                                                     expected: 'validation fails: fullName field error returned' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid member data with phone field omitted',                                                                                        expected: 'validation fails: phone field error returned' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid member data with dateOfBirth field omitted',                                                                                  expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'valid member data with password field omitted',                                                                                     expected: 'validation fails: password field error returned' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid member data with membershipStart field omitted',                                                                              expected: 'validation fails: membershipStart field error returned' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid member data with email set to "invalid"',                                                                                     expected: 'validation fails: email field error returned' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid member data with password "securep@ss1!" (no uppercase letter)',                                                              expected: 'validation fails: password field error returned' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid member data with password "SecurePass!" (no digit)',                                                                          expected: 'validation fails: password field error returned' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid member data with password "SecurePass1" (no special character)',                                                              expected: 'validation fails: password field error returned' },
        { noTc: 12, ec: 'EC-12', inputData: 'valid member data with phone "0712345678" (no country code)',                                                                       expected: 'validation fails: phone field error returned' },
        { noTc: 13, ec: 'EC-13', inputData: 'valid member data with dateOfBirth "15-01-1990" (DD-MM-YYYY, wrong format)',                                                        expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 14, ec: 'EC-14', inputData: 'valid member data with dateOfBirth "2099-01-01" (future date)',                                                                     expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 15, ec: 'EC-15', inputData: 'valid member data with membershipStart "2099-01-01" (future date)',                                                                 expected: 'validation passes, member created successfully with membershipStart set to 2099-01-01' },
        { noTc: 16, ec: 'EC-16', inputData: 'valid member data with membershipStart "01/01/2024" (MM/DD/YYYY, wrong format)',                                                    expected: 'validation fails: membershipStart field error returned' },
        { noTc: 17, ec: 'EC-17', inputData: 'valid member data with fullName "         " (whitespace-only)',                                                                     expected: 'validation fails: fullName field error returned' },
        { noTc: 18, ec: 'EC-18', inputData: 'valid member data with fullName "  John Doe Test  " (surrounding whitespace)',                                                      expected: 'validation passes after trimming, member created successfully' },
        { noTc: 19, ec: 'EC-19', inputData: 'valid member data with email "  john.doe@example.com  " (surrounding whitespace)',                                                  expected: 'validation passes after trimming, member created successfully' },
        { noTc: 20, ec: 'EC-20', inputData: 'valid member data with phone "  +40712345678  " (surrounding whitespace)',                                                          expected: 'validation passes after trimming, member created successfully' },
        { noTc: 21, ec: 'EC-21', inputData: 'all required member fields valid, a duplicate email conflict occurs',                                                               expected: 'operation fails with message "Email already registered"' },
        { noTc: 22, ec: 'EC-22', inputData: 'all required member fields valid, a database transaction failure occurs',                                                           expected: 'operation fails with message "DB failure"' },
    ],
    bvaRows: [
        { number: 1, condition: 'fullName length',            testCase: '7 chars (min - 1): below minimum → invalid; 8 chars (min): at minimum → valid; 9 chars (min + 1): above minimum → valid' },
        { number: 2, condition: 'fullName length',            testCase: '63 chars (max - 1): below maximum → valid; 64 chars (max): at maximum → valid; 65 chars (max + 1): above maximum → invalid' },
        { number: 3, condition: 'fullName whitespace + trim', testCase: '8 whitespace chars (empty after trim): invalid; 8 real chars + padding (8 chars after trim): valid; 64 real chars + padding (64 chars after trim): valid; 65 real chars + padding (65 chars after trim): invalid' },
        { number: 4, condition: 'password length',            testCase: '7 chars (min - 1): below minimum → invalid; 8 chars (min): at minimum → valid; 9 chars (min + 1): above minimum → valid' },
        { number: 5, condition: 'password length',            testCase: '63 chars (max - 1): below maximum → valid; 64 chars (max): at maximum → valid; 65 chars (max + 1): above maximum → invalid' },
        { number: 6, condition: 'dateOfBirth boundary',       testCase: 'yesterday (today - 1 day): strictly before today → valid; today: not before today → invalid; tomorrow (today + 1 day): future → invalid' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1 (n=7)',   inputData: 'valid member data with fullName of 7 characters ("A".repeat(7))',                                          expected: 'validation fails: fullName field error returned' },
        { noTc: 2,  bva: 'BVA-1 (n=8)',   inputData: 'valid member data with fullName of 8 characters ("A".repeat(8))',                                          expected: 'validation passes, member created successfully' },
        { noTc: 3,  bva: 'BVA-1 (n=9)',   inputData: 'valid member data with fullName of 9 characters ("A".repeat(9))',                                          expected: 'validation passes, member created successfully' },
        { noTc: 4,  bva: 'BVA-2 (n=63)',  inputData: 'valid member data with fullName of 63 characters ("A".repeat(63))',                                        expected: 'validation passes, member created successfully' },
        { noTc: 5,  bva: 'BVA-2 (n=64)',  inputData: 'valid member data with fullName of 64 characters ("A".repeat(64))',                                        expected: 'validation passes, member created successfully' },
        { noTc: 6,  bva: 'BVA-2 (n=65)',  inputData: 'valid member data with fullName of 65 characters ("A".repeat(65))',                                        expected: 'validation fails: fullName field error returned' },
        { noTc: 7,  bva: 'BVA-3 (ws=8)',  inputData: 'valid member data with fullName of 8 whitespace characters (empty string after trim)',                     expected: 'validation fails: fullName field error returned' },
        { noTc: 8,  bva: 'BVA-3 (p=8)',   inputData: 'valid member data with fullName padded to 8 real characters after trimming (" " + "A".repeat(8) + " ")',  expected: 'validation passes after trimming, member created successfully' },
        { noTc: 9,  bva: 'BVA-3 (p=64)',  inputData: 'valid member data with fullName padded to 64 real characters after trimming (" " + "A".repeat(64) + " ")', expected: 'validation passes after trimming, member created successfully' },
        { noTc: 10, bva: 'BVA-3 (p=65)',  inputData: 'valid member data with fullName padded to 65 real characters after trimming (" " + "A".repeat(65) + " ")', expected: 'validation fails: fullName field error returned' },
        { noTc: 11, bva: 'BVA-4 (n=7)',   inputData: 'valid member data with password of 7 characters meeting all rules except minimum length ("P1@aaaa")',      expected: 'validation fails: password field error returned' },
        { noTc: 12, bva: 'BVA-4 (n=8)',   inputData: 'valid member data with password of 8 characters meeting all rules ("P1@aaaaa")',                           expected: 'validation passes, member created successfully' },
        { noTc: 13, bva: 'BVA-4 (n=9)',   inputData: 'valid member data with password of 9 characters meeting all rules ("P1@aaaaaa")',                          expected: 'validation passes, member created successfully' },
        { noTc: 14, bva: 'BVA-5 (n=63)',  inputData: 'valid member data with password of 63 characters meeting all rules ("P1@" + "a".repeat(60))',              expected: 'validation passes, member created successfully' },
        { noTc: 15, bva: 'BVA-5 (n=64)',  inputData: 'valid member data with password of 64 characters meeting all rules ("P1@" + "a".repeat(61))',              expected: 'validation passes, member created successfully' },
        { noTc: 16, bva: 'BVA-5 (n=65)',  inputData: 'valid member data with password of 65 characters ("P1@" + "a".repeat(62))',                                expected: 'validation fails: password field error returned' },
        { noTc: 17, bva: 'BVA-6 (yest)',  inputData: 'valid member data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                   expected: 'validation passes, member created successfully' },
        { noTc: 18, bva: 'BVA-6 (today)', inputData: 'valid member data with dateOfBirth set to today (YYYY-MM-DD)',                                             expected: 'validation fails: dateOfBirth field error returned (not strictly in the past)' },
        { noTc: 19, bva: 'BVA-6 (tmrw)',  inputData: 'valid member data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                     expected: 'validation fails: dateOfBirth field error returned' },
    ],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required member fields provided with valid values',                                            expected: 'member created successfully, returned data matches the created member' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid member data with email field omitted',                                                       expected: 'validation fails: email field error returned' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid member data with fullName field omitted',                                                    expected: 'validation fails: fullName field error returned' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid member data with phone field omitted',                                                       expected: 'validation fails: phone field error returned' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid member data with dateOfBirth field omitted',                                                 expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'valid member data with password field omitted',                                                    expected: 'validation fails: password field error returned' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid member data with membershipStart field omitted',                                             expected: 'validation fails: membershipStart field error returned' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid member data with email set to "invalid"',                                                    expected: 'validation fails: email field error returned' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid member data with password "securep@ss1!" (no uppercase letter)',                             expected: 'validation fails: password field error returned' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid member data with password "SecurePass!" (no digit)',                                         expected: 'validation fails: password field error returned' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid member data with password "SecurePass1" (no special character)',                             expected: 'validation fails: password field error returned' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: 'valid member data with phone "0712345678" (no country code)',                                      expected: 'validation fails: phone field error returned' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: 'valid member data with dateOfBirth "15-01-1990" (DD-MM-YYYY, wrong format)',                       expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: 'valid member data with dateOfBirth "2099-01-01" (future date)',                                    expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 15, fromEc: 'EC-15', fromBva: '', inputData: 'valid member data with membershipStart "2099-01-01" (future date)',                                expected: 'validation passes, member created successfully with membershipStart set to 2099-01-01' },
        { noTc: 16, fromEc: 'EC-16', fromBva: '', inputData: 'valid member data with membershipStart "01/01/2024" (MM/DD/YYYY, wrong format)',                   expected: 'validation fails: membershipStart field error returned' },
        { noTc: 17, fromEc: 'EC-17', fromBva: '', inputData: 'valid member data with fullName "         " (whitespace-only)',                                    expected: 'validation fails: fullName field error returned' },
        { noTc: 18, fromEc: 'EC-18', fromBva: '', inputData: 'valid member data with fullName "  John Doe Test  " (surrounding whitespace)',                     expected: 'validation passes after trimming, member created successfully' },
        { noTc: 19, fromEc: 'EC-19', fromBva: '', inputData: 'valid member data with email "  john.doe@example.com  " (surrounding whitespace)',                 expected: 'validation passes after trimming, member created successfully' },
        { noTc: 20, fromEc: 'EC-20', fromBva: '', inputData: 'valid member data with phone "  +40712345678  " (surrounding whitespace)',                         expected: 'validation passes after trimming, member created successfully' },
        { noTc: 21, fromEc: 'EC-21', fromBva: '', inputData: 'all required member fields valid, a duplicate email conflict occurs',                              expected: 'operation fails with message "Email already registered"' },
        { noTc: 22, fromEc: 'EC-22', fromBva: '', inputData: 'all required member fields valid, a database transaction failure occurs',                          expected: 'operation fails with message "DB failure"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-1', inputData: 'valid member data with fullName of 7 characters ("A".repeat(7))',                                  expected: 'validation fails: fullName field error returned' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-1', inputData: 'valid member data with fullName of 8 characters ("A".repeat(8))',                                  expected: 'validation passes, member created successfully' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-1', inputData: 'valid member data with fullName of 9 characters ("A".repeat(9))',                                  expected: 'validation passes, member created successfully' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-2', inputData: 'valid member data with fullName of 63 characters ("A".repeat(63))',                                expected: 'validation passes, member created successfully' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-2', inputData: 'valid member data with fullName of 64 characters ("A".repeat(64))',                                expected: 'validation passes, member created successfully' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-2', inputData: 'valid member data with fullName of 65 characters ("A".repeat(65))',                                expected: 'validation fails: fullName field error returned' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-3', inputData: 'valid member data with fullName of 8 whitespace characters (empty string after trim)',             expected: 'validation fails: fullName field error returned' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-3', inputData: 'valid member data with fullName padded to 8 real characters after trimming (" " + "A".repeat(8) + " ")',  expected: 'validation passes after trimming, member created successfully' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-3', inputData: 'valid member data with fullName padded to 64 real characters after trimming (" " + "A".repeat(64) + " ")', expected: 'validation passes after trimming, member created successfully' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-3', inputData: 'valid member data with fullName padded to 65 real characters after trimming (" " + "A".repeat(65) + " ")', expected: 'validation fails: fullName field error returned' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-4', inputData: 'valid member data with password of 7 characters meeting all rules except minimum length ("P1@aaaa")',      expected: 'validation fails: password field error returned' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-4', inputData: 'valid member data with password of 8 characters meeting all rules ("P1@aaaaa")',                           expected: 'validation passes, member created successfully' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-4', inputData: 'valid member data with password of 9 characters meeting all rules ("P1@aaaaaa")',                          expected: 'validation passes, member created successfully' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-5', inputData: 'valid member data with password of 63 characters meeting all rules ("P1@" + "a".repeat(60))',              expected: 'validation passes, member created successfully' },
        { noTc: 37, fromEc: '', fromBva: 'BVA-5', inputData: 'valid member data with password of 64 characters meeting all rules ("P1@" + "a".repeat(61))',              expected: 'validation passes, member created successfully' },
        { noTc: 38, fromEc: '', fromBva: 'BVA-5', inputData: 'valid member data with password of 65 characters ("P1@" + "a".repeat(62))',                                expected: 'validation fails: password field error returned' },
        { noTc: 39, fromEc: '', fromBva: 'BVA-6', inputData: 'valid member data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                   expected: 'validation passes, member created successfully' },
        { noTc: 40, fromEc: '', fromBva: 'BVA-6', inputData: 'valid member data with dateOfBirth set to today (YYYY-MM-DD)',                                             expected: 'validation fails: dateOfBirth field error returned (not strictly in the past)' },
        { noTc: 41, fromEc: '', fromBva: 'BVA-6', inputData: 'valid member data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                     expected: 'validation fails: dateOfBirth field error returned' },
    ],
};

const createMemberWithTempPasswordCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-04',
    tcCount: 8,
    statement: 'createMemberWithTempPassword(data) – Validates the create-member-without-password input and returns an ActionResult<MemberWithUserAndTempPassword>. Returns success with the created member and a generated temporary password on success. Returns a field-level validation error for schema failures without calling the service. Returns a failure with the service error message for ConflictError.',
    data: 'Input: data: CreateMemberNoPwdInput { email, fullName, phone, dateOfBirth, membershipStart, ...optional }',
    precondition: 'Input schema is the same as CreateMemberInput but without the password field. A temporary password is generated internally by the service.',
    results: 'Output: Promise<ActionResult<MemberWithUserAndTempPassword>>',
    postcondition: 'On success: member created successfully, returned data contains a non-empty tempPassword field. On validation failure: field-level validation error returned, the service is not called. On service error: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',  validEc: 'All fields valid → member created successfully, returned data contains a tempPassword', invalidEc: '' },
        { number: 2, condition: 'Required fields', validEc: '', invalidEc: 'Missing email → validation fails: email field error returned' },
        { number: 3, condition: 'Required fields', validEc: '', invalidEc: 'Missing fullName → validation fails: fullName field error returned' },
        { number: 4, condition: 'Required fields', validEc: '', invalidEc: 'Missing phone → validation fails: phone field error returned' },
        { number: 5, condition: 'Required fields', validEc: '', invalidEc: 'Missing dateOfBirth → validation fails: dateOfBirth field error returned' },
        { number: 6, condition: 'Required fields', validEc: '', invalidEc: 'Missing membershipStart → validation fails: membershipStart field error returned' },
        { number: 7, condition: 'Service error',   validEc: '', invalidEc: 'A duplicate email conflict occurs → operation fails with message "Email taken"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'all required member fields provided with valid values (no password field), the created member record includes a generated temporary password', expected: 'member created successfully, returned data contains a non-empty tempPassword' },
        { noTc: 2, ec: 'EC-2', inputData: 'valid member data with email field omitted',                                                                                              expected: 'validation fails: email field error returned' },
        { noTc: 3, ec: 'EC-3', inputData: 'valid member data with fullName field omitted',                                                                                          expected: 'validation fails: fullName field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'valid member data with phone field omitted',                                                                                             expected: 'validation fails: phone field error returned' },
        { noTc: 5, ec: 'EC-5', inputData: 'valid member data with dateOfBirth field omitted',                                                                                       expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 6, ec: 'EC-6', inputData: 'valid member data with membershipStart field omitted',                                                                                   expected: 'validation fails: membershipStart field error returned' },
        { noTc: 7, ec: 'EC-7', inputData: 'all required member fields provided with valid values (no password field), a duplicate email conflict occurs',                           expected: 'operation fails with message "Email taken"' },
    ],
    bvaRows: [
        { number: 1, condition: 'Temp password length', testCase: 'Service returns tempPassword of exactly 16 characters: returned data contains tempPassword of length 16' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (n=16)', inputData: 'all required member fields provided with valid values (no password field), the created member record includes a generated temporary password of exactly 16 characters', expected: 'member created successfully, returned tempPassword has length 16' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'all required member fields provided with valid values (no password field), the created member record includes a generated temporary password', expected: 'member created successfully, returned data contains a non-empty tempPassword' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'valid member data with email field omitted',                                                                           expected: 'validation fails: email field error returned' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'valid member data with fullName field omitted',                                                                        expected: 'validation fails: fullName field error returned' },
        { noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'valid member data with phone field omitted',                                                                           expected: 'validation fails: phone field error returned' },
        { noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'valid member data with dateOfBirth field omitted',                                                                     expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'valid member data with membershipStart field omitted',                                                                 expected: 'validation fails: membershipStart field error returned' },
        { noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'all required member fields provided with valid values (no password field), a duplicate email conflict occurs',         expected: 'operation fails with message "Email taken"' },
        { noTc: 8, fromEc: '', fromBva: 'BVA-1', inputData: 'all required member fields provided with valid values (no password field), the created member record includes a generated temporary password of exactly 16 characters', expected: 'member created successfully, returned tempPassword has length 16' },
    ],
};

const createAdminCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-05',
    tcCount: 3,
    statement: 'createAdmin(data) – Validates the create-admin input and returns an ActionResult<MemberWithUser>. Returns success with the created admin on success. Returns a failure with the service error message for ConflictError and TransactionError.',
    data: 'Input: data: CreateAdminInput',
    precondition: 'The created admin has role Role.ADMIN.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: admin created successfully, returned data has role ADMIN. On service error: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity', validEc: 'All fields valid → admin created successfully, returned data has role ADMIN', invalidEc: '' },
        { number: 2, condition: 'Service error',  validEc: '', invalidEc: 'An email conflict occurs → operation fails with message "Email taken"' },
        { number: 3, condition: 'Service error',  validEc: '', invalidEc: 'A database transaction failure occurs → operation fails with message "DB failure"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'all required admin fields provided with valid values',                           expected: 'admin created successfully, returned data has role ADMIN' },
        { noTc: 2, ec: 'EC-2', inputData: 'all required admin fields provided with valid values, an email conflict occurs', expected: 'operation fails with message "Email taken"' },
        { noTc: 3, ec: 'EC-3', inputData: 'all required admin fields provided with valid values, a database transaction failure occurs', expected: 'operation fails with message "DB failure"' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'all required admin fields provided with valid values',                           expected: 'admin created successfully, returned data has role ADMIN' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'all required admin fields provided with valid values, an email conflict occurs', expected: 'operation fails with message "Email taken"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'all required admin fields provided with valid values, a database transaction failure occurs', expected: 'operation fails with message "DB failure"' },
    ],
};

const getMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-06',
    tcCount: 5,
    statement: 'getMember(id) – Looks up a member by the provided id and returns an ActionResult<MemberWithUser>. Returns success with the matching member on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'A known member id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: member retrieved successfully, returned data id matches the requested id. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → member retrieved successfully, returned data id matches the requested id', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing member id',                       expected: 'member retrieved successfully, returned data id matches the requested id' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists',     expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that matches an existing record: shortest valid id → member retrieved successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id',                        expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a") with no matching record',                                     expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), a matching member record exists with id "a"',                expected: 'member retrieved successfully, returned data id is "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'known existing member id',                                    expected: 'member retrieved successfully, returned data id matches the requested id' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'non-existent id, no matching record exists',                  expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'empty string id (""), no matching record exists for this id', expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2', inputData: 'one-character id ("a") with no matching record',              expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3', inputData: 'one-character id ("a"), a matching member record exists with id "a"', expected: 'member retrieved successfully, returned data id is "a"' },
    ],
};

const getAdminCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-07',
    tcCount: 5,
    statement: 'getAdmin(id) – Looks up an admin by the provided id and returns an ActionResult<MemberWithUser>. Returns success with the matching admin on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'A known admin id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: admin retrieved successfully, returned data id matches the requested id. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → admin retrieved successfully, returned data id matches the requested id', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing admin id',                        expected: 'admin retrieved successfully, returned data id matches the requested id' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists',     expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that matches an existing record: shortest valid id → admin retrieved successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id',                       expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a") with no matching record',                                    expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), a matching admin record exists with id "a"',                expected: 'admin retrieved successfully, returned data id is "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'known existing admin id',                                    expected: 'admin retrieved successfully, returned data id matches the requested id' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'non-existent id, no matching record exists',                 expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'empty string id (""), no matching record exists for this id', expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2', inputData: 'one-character id ("a") with no matching record',              expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3', inputData: 'one-character id ("a"), a matching admin record exists with id "a"', expected: 'admin retrieved successfully, returned data id is "a"' },
    ],
};

const listMembersCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-08',
    tcCount: 14,
    statement: 'listMembers(options?) – Accepts optional pagination and search options and returns an ActionResult<Page<MemberWithUser>> containing the matching members. Returns success with the paginated member list on success, with items ordered by fullName. Returns success with an empty items array and total 0 when no members exist. Returns a failure with an error message when the operation cannot be completed.',
    data: 'Input: options?: MemberListOptions { page?: number, pageSize?: number, search?: string }',
    precondition: 'The member store may be empty or populated. Default pagination applies when options are undefined or partially omitted.',
    results: 'Output: Promise<ActionResult<Page<MemberWithUser>>>',
    postcondition: 'On success: list retrieved successfully, returned page reflects the requested options. On failure: operation fails with an error message.',
    ecRows: [
        { number: 1, condition: 'Database state', validEc: 'Multiple members exist, no options → list retrieved successfully, items returned in order by fullName', invalidEc: '' },
        { number: 2, condition: 'Database state', validEc: 'No members exist, no options → list retrieved successfully, returned items array is empty and total is 0', invalidEc: '' },
        { number: 3, condition: 'Search option',  validEc: 'Search term provided (search: "John") → list retrieved successfully, returned items match the search term', invalidEc: '' },
        { number: 4, condition: 'Service error',  validEc: '', invalidEc: 'Operation fails internally → operation fails with the returned error message' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options, two members exist ordered by fullName ("A Member", "B Member")',   expected: 'list retrieved successfully, first item fullName is "A Member", second is "B Member"' },
        { noTc: 2, ec: 'EC-2', inputData: 'no options, no members exist in the store',                                    expected: 'list retrieved successfully, returned items array is empty and total is 0' },
        { noTc: 3, ec: 'EC-3', inputData: 'options: { search: "John" }, matching members exist',                          expected: 'list retrieved successfully' },
        { noTc: 4, ec: 'EC-4', inputData: 'no options, operation fails internally',                                       expected: 'operation fails with the returned error message' },
    ],
    bvaRows: [
        { number: 1,  condition: 'pageSize boundary', testCase: 'pageSize: 1 (minimum non-zero): exactly 1 item returned → list retrieved successfully with 1 item' },
        { number: 2,  condition: 'pageSize boundary', testCase: 'pageSize: 0 (zero): no items returned → list retrieved successfully with empty items array' },
        { number: 3,  condition: 'pageSize boundary', testCase: 'pageSize: undefined (omitted): default page size applied → list retrieved successfully' },
        { number: 4,  condition: 'search boundary',   testCase: 'search: "" (empty string): treated as no filter → list retrieved successfully with all items' },
        { number: 5,  condition: 'search boundary',   testCase: 'search: undefined (omitted): treated as no filter → list retrieved successfully with all items' },
        { number: 6,  condition: 'search boundary',   testCase: 'search: "A" (one character): minimum non-empty search term → list retrieved successfully' },
        { number: 7,  condition: 'page boundary',     testCase: 'page: 0 (zero-indexed first page): first page returned → list retrieved successfully' },
        { number: 8,  condition: 'page boundary',     testCase: 'page: 1 (one-indexed first page): first page returned → list retrieved successfully' },
        { number: 9,  condition: 'page boundary',     testCase: 'page: 2 (beyond available data): no items for that page → list retrieved successfully with empty items array' },
        { number: 10, condition: 'page boundary',     testCase: 'page: undefined (omitted): default page applied → list retrieved successfully' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (pageSize=1)',         inputData: 'options: { pageSize: 1 }, 5 members exist',                            expected: 'list retrieved successfully, returned items array has length 1' },
        { noTc: 2,  bva: 'BVA-2  (pageSize=0)',         inputData: 'options: { pageSize: 0 }, 5 members exist',                            expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 3,  bva: 'BVA-3  (pageSize=undefined)', inputData: 'options: { pageSize: undefined }, members exist',                      expected: 'list retrieved successfully' },
        { noTc: 4,  bva: 'BVA-4  (search="")',          inputData: 'options: { search: "" }, members exist',                               expected: 'list retrieved successfully' },
        { noTc: 5,  bva: 'BVA-5  (search=undefined)',   inputData: 'options: { search: undefined }, members exist',                        expected: 'list retrieved successfully' },
        { noTc: 6,  bva: 'BVA-6  (search="A")',         inputData: 'options: { search: "A" }, members matching "A" exist',                 expected: 'list retrieved successfully' },
        { noTc: 7,  bva: 'BVA-7  (page=0)',             inputData: 'options: { page: 0 }, members exist',                                  expected: 'list retrieved successfully' },
        { noTc: 8,  bva: 'BVA-8  (page=1)',             inputData: 'options: { page: 1 }, members exist',                                  expected: 'list retrieved successfully' },
        { noTc: 9,  bva: 'BVA-9  (page=2)',             inputData: 'options: { page: 2 }, only 1 member exists (page 2 is beyond data)',    expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 10, bva: 'BVA-10 (page=undefined)',     inputData: 'options: { page: undefined }, members exist',                          expected: 'list retrieved successfully' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options, two members exist ordered by fullName ("A Member", "B Member")',   expected: 'list retrieved successfully, first item fullName is "A Member", second is "B Member"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'no options, no members exist in the store',                                   expected: 'list retrieved successfully, returned items array is empty and total is 0' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'options: { search: "John" }, matching members exist',                         expected: 'list retrieved successfully' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'no options, operation fails internally',                                      expected: 'operation fails with the returned error message' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 5,  fromEc: '', fromBva: 'BVA-1',  inputData: 'options: { pageSize: 1 }, 5 members exist',                                 expected: 'list retrieved successfully, returned items array has length 1' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-2',  inputData: 'options: { pageSize: 0 }, 5 members exist',                                 expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-3',  inputData: 'options: { pageSize: undefined }, members exist',                           expected: 'list retrieved successfully' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-4',  inputData: 'options: { search: "" }, members exist',                                    expected: 'list retrieved successfully' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-5',  inputData: 'options: { search: undefined }, members exist',                             expected: 'list retrieved successfully' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-6',  inputData: 'options: { search: "A" }, members matching "A" exist',                      expected: 'list retrieved successfully' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-7',  inputData: 'options: { page: 0 }, members exist',                                       expected: 'list retrieved successfully' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-8',  inputData: 'options: { page: 1 }, members exist',                                       expected: 'list retrieved successfully' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-9',  inputData: 'options: { page: 2 }, only 1 member exists (page 2 is beyond data)',         expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-10', inputData: 'options: { page: undefined }, members exist',                               expected: 'list retrieved successfully' },
    ],
};

const listAdminsCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-09',
    tcCount: 10,
    statement: 'listAdmins(options?) – Accepts optional pagination and search options and returns an ActionResult<Page<MemberWithUser>> containing the matching admins. Returns success with the paginated admin list on success, with items ordered by fullName. Returns success with an empty items array when no admins exist. Returns a failure with an error message when the operation cannot be completed.',
    data: 'Input: options?: AdminListOptions { page?: number, pageSize?: number, search?: string }',
    precondition: 'The admin store may be empty or populated. Default pagination applies when options are undefined or partially omitted.',
    results: 'Output: Promise<ActionResult<Page<MemberWithUser>>>',
    postcondition: 'On success: list retrieved successfully, returned page reflects the requested options. On failure: operation fails with an error message.',
    ecRows: [
        { number: 1, condition: 'Database state', validEc: 'Multiple admins exist, no options → list retrieved successfully, items returned in order by fullName', invalidEc: '' },
        { number: 2, condition: 'Database state', validEc: 'No admins exist, no options → list retrieved successfully, returned items array is empty', invalidEc: '' },
        { number: 3, condition: 'Search option',  validEc: 'Search term provided (search: "Admin") → list retrieved successfully, returned items match the search term', invalidEc: '' },
        { number: 4, condition: 'Service error',  validEc: '', invalidEc: 'Operation fails internally → operation fails with the returned error message' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options, two admins exist ordered by fullName ("A Admin", "B Admin")',   expected: 'list retrieved successfully, first item fullName is "A Admin", second is "B Admin"' },
        { noTc: 2, ec: 'EC-2', inputData: 'no options, no admins exist in the store',                                  expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 3, ec: 'EC-3', inputData: 'options: { search: "Admin" }, matching admins exist',                       expected: 'list retrieved successfully' },
        { noTc: 4, ec: 'EC-4', inputData: 'no options, operation fails internally',                                    expected: 'operation fails with the returned error message' },
    ],
    bvaRows: [
        { number: 1, condition: 'pageSize boundary', testCase: 'pageSize: 1 (minimum non-zero): exactly 1 item returned → list retrieved successfully with 1 item' },
        { number: 2, condition: 'pageSize boundary', testCase: 'pageSize: 0 (zero): no items returned → list retrieved successfully with empty items array' },
        { number: 3, condition: 'search boundary',   testCase: 'search: "" (empty string): treated as no filter → list retrieved successfully with all items' },
        { number: 4, condition: 'search boundary',   testCase: 'search: "A" (one character): minimum non-empty search term → list retrieved successfully' },
        { number: 5, condition: 'page boundary',     testCase: 'page: 0 (zero-indexed first page): first page returned → list retrieved successfully' },
        { number: 6, condition: 'page boundary',     testCase: 'page: 1 (one-indexed first page): first page returned → list retrieved successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (pageSize=1)', inputData: 'options: { pageSize: 1 }, 5 admins exist',                   expected: 'list retrieved successfully, returned items array has length 1' },
        { noTc: 2, bva: 'BVA-2 (pageSize=0)', inputData: 'options: { pageSize: 0 }, 5 admins exist',                   expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 3, bva: 'BVA-3 (search="")',  inputData: 'options: { search: "" }, admins exist',                      expected: 'list retrieved successfully' },
        { noTc: 4, bva: 'BVA-4 (search="A")', inputData: 'options: { search: "A" }, admins matching "A" exist',        expected: 'list retrieved successfully' },
        { noTc: 5, bva: 'BVA-5 (page=0)',     inputData: 'options: { page: 0 }, admins exist',                         expected: 'list retrieved successfully' },
        { noTc: 6, bva: 'BVA-6 (page=1)',     inputData: 'options: { page: 1 }, admins exist',                         expected: 'list retrieved successfully' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options, two admins exist ordered by fullName ("A Admin", "B Admin")',   expected: 'list retrieved successfully, first item fullName is "A Admin", second is "B Admin"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'no options, no admins exist in the store',                                 expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'options: { search: "Admin" }, matching admins exist',                      expected: 'list retrieved successfully' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'no options, operation fails internally',                                   expected: 'operation fails with the returned error message' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 5,  fromEc: '', fromBva: 'BVA-1', inputData: 'options: { pageSize: 1 }, 5 admins exist',                                expected: 'list retrieved successfully, returned items array has length 1' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-2', inputData: 'options: { pageSize: 0 }, 5 admins exist',                                expected: 'list retrieved successfully, returned items array is empty' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-3', inputData: 'options: { search: "" }, admins exist',                                  expected: 'list retrieved successfully' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-4', inputData: 'options: { search: "A" }, admins matching "A" exist',                    expected: 'list retrieved successfully' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-5', inputData: 'options: { page: 0 }, admins exist',                                     expected: 'list retrieved successfully' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-6', inputData: 'options: { page: 1 }, admins exist',                                     expected: 'list retrieved successfully' },
    ],
};
const updateMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-09',
    tcCount: 29,
    statement: 'updateMember(id, data) – Validates the update-member input and returns an ActionResult<MemberWithUser>. Returns success with the updated member on success. Returns a field-level validation error for schema failures without calling the service. An empty update object is accepted and returns success. Returns a failure with the service error message for NotFoundError, ConflictError, and TransactionError.',
    data: 'Input: id: string, data: UpdateMemberInput { email?, fullName?, phone?, dateOfBirth?, password?, membershipStart? }',
    precondition: 'The member store may be empty or populated. All fields in UpdateMemberInput are optional. When a field is present, it must pass the same format and length rules as in createMember. When a field is undefined, it is ignored and the update proceeds. An empty object is valid.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: member updated successfully, returned data reflects the applied changes. On validation failure: field-level validation error returned, the service is not called. On service error: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',  validEc: 'Valid partial input ({ fullName: "Updated Name" }), matching member exists → member updated successfully, returned fullName matches the new value', invalidEc: '' },
        { number: 2, condition: 'Input validity',  validEc: 'Empty update object ({}) → member updated successfully', invalidEc: '' },
        { number: 3, condition: 'Email format',    validEc: '', invalidEc: 'Invalid email value ("bad") → validation fails: email field error returned' },
        { number: 4, condition: 'ID existence',    validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with the returned error message' },
        { number: 5, condition: 'Service error',   validEc: '', invalidEc: 'The provided email is already registered to another account (ConflictError) → operation fails with the returned error message' },
        { number: 6, condition: 'Service error',   validEc: '', invalidEc: 'A database transaction failure occurs (TransactionError) → operation fails with the returned error message' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing member id, data: { fullName: "Updated Name" }, member exists and is updated successfully', expected: 'member updated successfully, returned data fullName is "Updated Name"' },
        { noTc: 2, ec: 'EC-2', inputData: 'known existing member id, data: {} (empty update object)',                                                  expected: 'member updated successfully' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing member id, data: { email: "bad" }',                                                          expected: 'validation fails: email field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'non-existent id, data: { fullName: "Updated Name" }, no matching record exists (NotFoundError)',             expected: 'operation fails with message "Not found"' },
        { noTc: 5, ec: 'EC-5', inputData: 'known existing member id, data: { email: "taken@example.com" }, email already registered (ConflictError)',   expected: 'operation fails with message "Email taken"' },
        { noTc: 6, ec: 'EC-6', inputData: 'known existing member id, data: { fullName: "Updated Name" }, database transaction failure occurs (TransactionError)', expected: 'operation fails with message "DB failure"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'id boundary',              testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2,  condition: 'id boundary',              testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3,  condition: 'id boundary',              testCase: 'id: "a" (one character), matching record exists → member updated successfully' },
        { number: 4,  condition: 'fullName length',          testCase: 'fullName: 8 characters (minimum valid length) → member updated successfully' },
        { number: 5,  condition: 'password length',          testCase: 'password: 64 characters meeting all rules (maximum valid length) → member updated successfully' },
        { number: 6,  condition: 'email presence',           testCase: 'email: undefined (field omitted) → update proceeds successfully, email not changed' },
        { number: 7,  condition: 'email presence',           testCase: 'email: "" (empty string) → validation fails: email field error returned' },
        { number: 8,  condition: 'email presence',           testCase: 'email: "a" (one character, invalid format) → validation fails: email field error returned' },
        { number: 9,  condition: 'fullName presence',        testCase: 'fullName: undefined (field omitted) → update proceeds successfully, fullName not changed' },
        { number: 10, condition: 'fullName presence',        testCase: 'fullName: "" (empty string) → validation fails: fullName field error returned' },
        { number: 11, condition: 'fullName presence',        testCase: 'fullName: "a" (one character, below minimum) → validation fails: fullName field error returned' },
        { number: 12, condition: 'phone presence',           testCase: 'phone: undefined (field omitted) → update proceeds successfully, phone not changed' },
        { number: 13, condition: 'phone presence',           testCase: 'phone: "" (empty string) → validation fails: phone field error returned' },
        { number: 14, condition: 'phone presence',           testCase: 'phone: "a" (one character, invalid format) → validation fails: phone field error returned' },
        { number: 15, condition: 'dateOfBirth presence',     testCase: 'dateOfBirth: undefined (field omitted) → update proceeds successfully, dateOfBirth not changed' },
        { number: 16, condition: 'dateOfBirth presence',     testCase: 'dateOfBirth: "" (empty string) → validation fails: dateOfBirth field error returned' },
        { number: 17, condition: 'dateOfBirth presence',     testCase: 'dateOfBirth: "a" (one character, invalid format) → validation fails: dateOfBirth field error returned' },
        { number: 18, condition: 'password presence',        testCase: 'password: undefined (field omitted) → update proceeds successfully, password not changed' },
        { number: 19, condition: 'password presence',        testCase: 'password: "" (empty string) → validation fails: password field error returned' },
        { number: 20, condition: 'password presence',        testCase: 'password: "a" (one character, fails all rules) → validation fails: password field error returned' },
        { number: 21, condition: 'membershipStart presence', testCase: 'membershipStart: undefined (field omitted) → update proceeds successfully, membershipStart not changed' },
        { number: 22, condition: 'membershipStart presence', testCase: 'membershipStart: "" (empty string) → validation fails: membershipStart field error returned' },
        { number: 23, condition: 'membershipStart presence', testCase: 'membershipStart: "a" (one character, invalid format) → validation fails: membershipStart field error returned' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (id="")',                    inputData: 'id: "", data: { fullName: "Updated Name" }, no record can match an empty id',                                        expected: 'operation fails with message "Not found"' },
        { noTc: 2,  bva: 'BVA-2  (id="a", no match)',         inputData: 'id: "a", data: { fullName: "Updated Name" }, no member exists with id "a"',                                          expected: 'operation fails with message "Not found"' },
        { noTc: 3,  bva: 'BVA-3  (id="a", match)',            inputData: 'id: "a", data: { fullName: "Updated Name" }, a member with id "a" exists in the store',                              expected: 'member updated successfully, returned data id is "a"' },
        { noTc: 4,  bva: 'BVA-4  (fullName=8 chars)',         inputData: 'known existing member id, data: { fullName: "A".repeat(8) }',                                                        expected: 'member updated successfully' },
        { noTc: 5,  bva: 'BVA-5  (password=64 chars)',        inputData: 'known existing member id, data: { password: "P1@" + "a".repeat(61) }',                                              expected: 'member updated successfully' },
        { noTc: 6,  bva: 'BVA-6  (email=undefined)',          inputData: 'known existing member id, data: { email: undefined }',                                                               expected: 'member updated successfully' },
        { noTc: 7,  bva: 'BVA-7  (email="")',                 inputData: 'known existing member id, data: { email: "" }',                                                                      expected: 'validation fails: email field error returned' },
        { noTc: 8,  bva: 'BVA-8  (email="a")',                inputData: 'known existing member id, data: { email: "a" }',                                                                     expected: 'validation fails: email field error returned' },
        { noTc: 9,  bva: 'BVA-9  (fullName=undefined)',       inputData: 'known existing member id, data: { fullName: undefined }',                                                            expected: 'member updated successfully' },
        { noTc: 10, bva: 'BVA-10 (fullName="")',              inputData: 'known existing member id, data: { fullName: "" }',                                                                   expected: 'validation fails: fullName field error returned' },
        { noTc: 11, bva: 'BVA-11 (fullName="a")',             inputData: 'known existing member id, data: { fullName: "a" }',                                                                  expected: 'validation fails: fullName field error returned' },
        { noTc: 12, bva: 'BVA-12 (phone=undefined)',          inputData: 'known existing member id, data: { phone: undefined }',                                                               expected: 'member updated successfully' },
        { noTc: 13, bva: 'BVA-13 (phone="")',                 inputData: 'known existing member id, data: { phone: "" }',                                                                      expected: 'validation fails: phone field error returned' },
        { noTc: 14, bva: 'BVA-14 (phone="a")',                inputData: 'known existing member id, data: { phone: "a" }',                                                                     expected: 'validation fails: phone field error returned' },
        { noTc: 15, bva: 'BVA-15 (dateOfBirth=undefined)',    inputData: 'known existing member id, data: { dateOfBirth: undefined }',                                                         expected: 'member updated successfully' },
        { noTc: 16, bva: 'BVA-16 (dateOfBirth="")',           inputData: 'known existing member id, data: { dateOfBirth: "" }',                                                                expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 17, bva: 'BVA-17 (dateOfBirth="a")',          inputData: 'known existing member id, data: { dateOfBirth: "a" }',                                                               expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 18, bva: 'BVA-18 (password=undefined)',       inputData: 'known existing member id, data: { password: undefined }',                                                            expected: 'member updated successfully' },
        { noTc: 19, bva: 'BVA-19 (password="")',              inputData: 'known existing member id, data: { password: "" }',                                                                   expected: 'validation fails: password field error returned' },
        { noTc: 20, bva: 'BVA-20 (password="a")',             inputData: 'known existing member id, data: { password: "a" }',                                                                  expected: 'validation fails: password field error returned' },
        { noTc: 21, bva: 'BVA-21 (membershipStart=undefined)',inputData: 'known existing member id, data: { membershipStart: undefined }',                                                     expected: 'member updated successfully' },
        { noTc: 22, bva: 'BVA-22 (membershipStart="")',       inputData: 'known existing member id, data: { membershipStart: "" }',                                                            expected: 'validation fails: membershipStart field error returned' },
        { noTc: 23, bva: 'BVA-23 (membershipStart="a")',      inputData: 'known existing member id, data: { membershipStart: "a" }',                                                           expected: 'validation fails: membershipStart field error returned' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'known existing member id, data: { fullName: "Updated Name" }, member exists and is updated successfully',                        expected: 'member updated successfully, returned data fullName is "Updated Name"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'known existing member id, data: {} (empty update object)',                                                                        expected: 'member updated successfully' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'known existing member id, data: { email: "bad" }',                                                                               expected: 'validation fails: email field error returned' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'non-existent id, data: { fullName: "Updated Name" }, no matching record exists (NotFoundError)',                                 expected: 'operation fails with message "Not found"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'known existing member id, data: { email: "taken@example.com" }, email already registered (ConflictError)',                       expected: 'operation fails with message "Email taken"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'known existing member id, data: { fullName: "Updated Name" }, database transaction failure occurs (TransactionError)',           expected: 'operation fails with message "DB failure"' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 7,  fromEc: '', fromBva: 'BVA-1',  inputData: 'id: "", data: { fullName: "Updated Name" }, no record can match an empty id',                                                  expected: 'operation fails with message "Not found"' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-2',  inputData: 'id: "a", data: { fullName: "Updated Name" }, no member exists with id "a"',                                                   expected: 'operation fails with message "Not found"' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-3',  inputData: 'id: "a", data: { fullName: "Updated Name" }, a member with id "a" exists in the store',                                       expected: 'member updated successfully, returned data id is "a"' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-4',  inputData: 'known existing member id, data: { fullName: "A".repeat(8) }',                                                                  expected: 'member updated successfully' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-5',  inputData: 'known existing member id, data: { password: "P1@" + "a".repeat(61) }',                                                        expected: 'member updated successfully' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-6',  inputData: 'known existing member id, data: { email: undefined }',                                                                         expected: 'member updated successfully' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-7',  inputData: 'known existing member id, data: { email: "" }',                                                                                expected: 'validation fails: email field error returned' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-8',  inputData: 'known existing member id, data: { email: "a" }',                                                                               expected: 'validation fails: email field error returned' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-9',  inputData: 'known existing member id, data: { fullName: undefined }',                                                                      expected: 'member updated successfully' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-10', inputData: 'known existing member id, data: { fullName: "" }',                                                                             expected: 'validation fails: fullName field error returned' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-11', inputData: 'known existing member id, data: { fullName: "a" }',                                                                            expected: 'validation fails: fullName field error returned' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-12', inputData: 'known existing member id, data: { phone: undefined }',                                                                         expected: 'member updated successfully' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-13', inputData: 'known existing member id, data: { phone: "" }',                                                                                expected: 'validation fails: phone field error returned' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-14', inputData: 'known existing member id, data: { phone: "a" }',                                                                               expected: 'validation fails: phone field error returned' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-15', inputData: 'known existing member id, data: { dateOfBirth: undefined }',                                                                   expected: 'member updated successfully' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-16', inputData: 'known existing member id, data: { dateOfBirth: "" }',                                                                          expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-17', inputData: 'known existing member id, data: { dateOfBirth: "a" }',                                                                         expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-18', inputData: 'known existing member id, data: { password: undefined }',                                                                      expected: 'member updated successfully' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-19', inputData: 'known existing member id, data: { password: "" }',                                                                             expected: 'validation fails: password field error returned' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-20', inputData: 'known existing member id, data: { password: "a" }',                                                                            expected: 'validation fails: password field error returned' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-21', inputData: 'known existing member id, data: { membershipStart: undefined }',                                                               expected: 'member updated successfully' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-22', inputData: 'known existing member id, data: { membershipStart: "" }',                                                                      expected: 'validation fails: membershipStart field error returned' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-23', inputData: 'known existing member id, data: { membershipStart: "a" }',                                                                     expected: 'validation fails: membershipStart field error returned' },
    ],
};

const updateAdminCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-10',
    tcCount: 21,
    statement: 'updateAdmin(id, data) – Validates the update-admin input and returns an ActionResult<MemberWithUser>. Returns success with the updated admin on success. Returns a field-level validation error for schema failures without calling the service. Returns a failure with the service error message for NotFoundError and TransactionError.',
    data: 'Input: id: string, data: UpdateAdminInput { email?, fullName?, phone?, dateOfBirth?, password? }',
    precondition: 'The admin store may be empty or populated. All fields in UpdateAdminInput are optional. When a field is present, it must pass the same format and length rules as in createAdmin. When a field is undefined, it is ignored and the update proceeds.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: admin updated successfully, returned data reflects the applied changes. On validation failure: field-level validation error returned, the service is not called. On service error: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity', validEc: 'Valid partial input ({ fullName: "Admin Updated" }), matching admin exists → admin updated successfully, returned fullName matches the new value', invalidEc: '' },
        { number: 2, condition: 'ID existence',   validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with the returned error message' },
        { number: 3, condition: 'Service error',  validEc: '', invalidEc: 'A database transaction failure occurs (TransactionError) → operation fails with the returned error message' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing admin id, data: { fullName: "Admin Updated" }, admin exists and is updated successfully', expected: 'admin updated successfully, returned data fullName is "Admin Updated"' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, data: { fullName: "Admin Updated" }, no matching record exists (NotFoundError)',         expected: 'operation fails with message "Not found"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing admin id, data: { fullName: "Admin Updated" }, database transaction failure occurs (TransactionError)', expected: 'operation fails with message "DB Error"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'id boundary',          testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2,  condition: 'id boundary',          testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3,  condition: 'id boundary',          testCase: 'id: "a" (one character), matching record exists → admin updated successfully' },
        { number: 4,  condition: 'email presence',       testCase: 'email: undefined (field omitted) → update proceeds successfully, email not changed' },
        { number: 5,  condition: 'email presence',       testCase: 'email: "" (empty string) → validation fails: email field error returned' },
        { number: 6,  condition: 'email presence',       testCase: 'email: "a" (one character, invalid format) → validation fails: email field error returned' },
        { number: 7,  condition: 'fullName presence',    testCase: 'fullName: undefined (field omitted) → update proceeds successfully, fullName not changed' },
        { number: 8,  condition: 'fullName presence',    testCase: 'fullName: "" (empty string) → validation fails: fullName field error returned' },
        { number: 9,  condition: 'fullName presence',    testCase: 'fullName: "a" (one character, below minimum) → validation fails: fullName field error returned' },
        { number: 10, condition: 'phone presence',       testCase: 'phone: undefined (field omitted) → update proceeds successfully, phone not changed' },
        { number: 11, condition: 'phone presence',       testCase: 'phone: "" (empty string) → validation fails: phone field error returned' },
        { number: 12, condition: 'phone presence',       testCase: 'phone: "a" (one character, invalid format) → validation fails: phone field error returned' },
        { number: 13, condition: 'dateOfBirth presence', testCase: 'dateOfBirth: undefined (field omitted) → update proceeds successfully, dateOfBirth not changed' },
        { number: 14, condition: 'dateOfBirth presence', testCase: 'dateOfBirth: "" (empty string) → validation fails: dateOfBirth field error returned' },
        { number: 15, condition: 'dateOfBirth presence', testCase: 'dateOfBirth: "a" (one character, invalid format) → validation fails: dateOfBirth field error returned' },
        { number: 16, condition: 'password presence',    testCase: 'password: undefined (field omitted) → update proceeds successfully, password not changed' },
        { number: 17, condition: 'password presence',    testCase: 'password: "" (empty string) → validation fails: password field error returned' },
        { number: 18, condition: 'password presence',    testCase: 'password: "a" (one character, fails all rules) → validation fails: password field error returned' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (id="")',              inputData: 'id: "", data: { fullName: "Admin Updated" }, no record can match an empty id',                   expected: 'operation fails with message "Not found"' },
        { noTc: 2,  bva: 'BVA-2  (id="a", no match)',   inputData: 'id: "a", data: { fullName: "Admin Updated" }, no admin exists with id "a"',                      expected: 'operation fails with message "Not found"' },
        { noTc: 3,  bva: 'BVA-3  (id="a", match)',      inputData: 'id: "a", data: { fullName: "Admin Updated" }, an admin with id "a" exists in the store',         expected: 'admin updated successfully, returned data id is "a"' },
        { noTc: 4,  bva: 'BVA-4  (email=undefined)',    inputData: 'known existing admin id, data: { email: undefined }',                                             expected: 'admin updated successfully' },
        { noTc: 5,  bva: 'BVA-5  (email="")',           inputData: 'known existing admin id, data: { email: "" }',                                                    expected: 'validation fails: email field error returned' },
        { noTc: 6,  bva: 'BVA-6  (email="a")',          inputData: 'known existing admin id, data: { email: "a" }',                                                   expected: 'validation fails: email field error returned' },
        { noTc: 7,  bva: 'BVA-7  (fullName=undefined)', inputData: 'known existing admin id, data: { fullName: undefined }',                                          expected: 'admin updated successfully' },
        { noTc: 8,  bva: 'BVA-8  (fullName="")',        inputData: 'known existing admin id, data: { fullName: "" }',                                                 expected: 'validation fails: fullName field error returned' },
        { noTc: 9,  bva: 'BVA-9  (fullName="a")',       inputData: 'known existing admin id, data: { fullName: "a" }',                                                expected: 'validation fails: fullName field error returned' },
        { noTc: 10, bva: 'BVA-10 (phone=undefined)',    inputData: 'known existing admin id, data: { phone: undefined }',                                             expected: 'admin updated successfully' },
        { noTc: 11, bva: 'BVA-11 (phone="")',           inputData: 'known existing admin id, data: { phone: "" }',                                                    expected: 'validation fails: phone field error returned' },
        { noTc: 12, bva: 'BVA-12 (phone="a")',          inputData: 'known existing admin id, data: { phone: "a" }',                                                   expected: 'validation fails: phone field error returned' },
        { noTc: 13, bva: 'BVA-13 (dob=undefined)',      inputData: 'known existing admin id, data: { dateOfBirth: undefined }',                                       expected: 'admin updated successfully' },
        { noTc: 14, bva: 'BVA-14 (dob="")',             inputData: 'known existing admin id, data: { dateOfBirth: "" }',                                              expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 15, bva: 'BVA-15 (dob="a")',            inputData: 'known existing admin id, data: { dateOfBirth: "a" }',                                             expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 16, bva: 'BVA-16 (password=undefined)', inputData: 'known existing admin id, data: { password: undefined }',                                          expected: 'admin updated successfully' },
        { noTc: 17, bva: 'BVA-17 (password="")',        inputData: 'known existing admin id, data: { password: "" }',                                                 expected: 'validation fails: password field error returned' },
        { noTc: 18, bva: 'BVA-18 (password="a")',       inputData: 'known existing admin id, data: { password: "a" }',                                                expected: 'validation fails: password field error returned' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'known existing admin id, data: { fullName: "Admin Updated" }, admin exists and is updated successfully',                  expected: 'admin updated successfully, returned data fullName is "Admin Updated"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'non-existent id, data: { fullName: "Admin Updated" }, no matching record exists (NotFoundError)',                         expected: 'operation fails with message "Not found"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'known existing admin id, data: { fullName: "Admin Updated" }, database transaction failure occurs (TransactionError)',    expected: 'operation fails with message "DB Error"' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 4,  fromEc: '', fromBva: 'BVA-1',  inputData: 'id: "", data: { fullName: "Admin Updated" }, no record can match an empty id',                        expected: 'operation fails with message "Not found"' },
        { noTc: 5,  fromEc: '', fromBva: 'BVA-2',  inputData: 'id: "a", data: { fullName: "Admin Updated" }, no admin exists with id "a"',                           expected: 'operation fails with message "Not found"' },
        { noTc: 6,  fromEc: '', fromBva: 'BVA-3',  inputData: 'id: "a", data: { fullName: "Admin Updated" }, an admin with id "a" exists in the store',              expected: 'admin updated successfully, returned data id is "a"' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-4',  inputData: 'known existing admin id, data: { email: undefined }',                                                  expected: 'admin updated successfully' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-5',  inputData: 'known existing admin id, data: { email: "" }',                                                         expected: 'validation fails: email field error returned' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-6',  inputData: 'known existing admin id, data: { email: "a" }',                                                        expected: 'validation fails: email field error returned' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-7',  inputData: 'known existing admin id, data: { fullName: undefined }',                                               expected: 'admin updated successfully' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-8',  inputData: 'known existing admin id, data: { fullName: "" }',                                                      expected: 'validation fails: fullName field error returned' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-9',  inputData: 'known existing admin id, data: { fullName: "a" }',                                                     expected: 'validation fails: fullName field error returned' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-10', inputData: 'known existing admin id, data: { phone: undefined }',                                                  expected: 'admin updated successfully' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-11', inputData: 'known existing admin id, data: { phone: "" }',                                                         expected: 'validation fails: phone field error returned' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-12', inputData: 'known existing admin id, data: { phone: "a" }',                                                        expected: 'validation fails: phone field error returned' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-13', inputData: 'known existing admin id, data: { dateOfBirth: undefined }',                                            expected: 'admin updated successfully' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-14', inputData: 'known existing admin id, data: { dateOfBirth: "" }',                                                   expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-15', inputData: 'known existing admin id, data: { dateOfBirth: "a" }',                                                  expected: 'validation fails: dateOfBirth field error returned' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-16', inputData: 'known existing admin id, data: { password: undefined }',                                               expected: 'admin updated successfully' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-17', inputData: 'known existing admin id, data: { password: "" }',                                                      expected: 'validation fails: password field error returned' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-18', inputData: 'known existing admin id, data: { password: "a" }',                                                     expected: 'validation fails: password field error returned' },
    ],
};

const suspendMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-11',
    tcCount: 5,
    statement: 'suspendMember(id) – Suspends the member with the given id and returns an ActionResult<MemberWithUser>. Returns success with the member data showing isActive as false on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'The member store may be empty or populated. A known member id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: member suspended successfully, returned data has isActive set to false. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → member suspended successfully, returned data has isActive false', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing member id, member exists in the store',      expected: 'member suspended successfully, returned data has isActive false' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError)', expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'id boundary', testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2, condition: 'id boundary', testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3, condition: 'id boundary', testCase: 'id: "a" (one character), matching record exists → member suspended successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id="")',          inputData: 'id: "", no record can match an empty id',                     expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (id="a", no match)', inputData: 'id: "a", no member exists with id "a"',                    expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (id="a", match)',  inputData: 'id: "a", a member with id "a" exists in the store',           expected: 'member suspended successfully, returned data id is "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',     inputData: 'known existing member id, member exists in the store',       expected: 'member suspended successfully, returned data has isActive false' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',     inputData: 'non-existent id, no matching record exists (NotFoundError)',  expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',   inputData: 'id: "", no record can match an empty id',                     expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',   inputData: 'id: "a", no member exists with id "a"',                       expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',   inputData: 'id: "a", a member with id "a" exists in the store',           expected: 'member suspended successfully, returned data id is "a"' },
    ],
};

const activateMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-12',
    tcCount: 5,
    statement: 'activateMember(id) – Activates the member with the given id and returns an ActionResult<MemberWithUser>. Returns success with the member data showing isActive as true on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'The member store may be empty or populated. A known member id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'On success: member activated successfully, returned data has isActive set to true. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → member activated successfully, returned data has isActive true', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing member id, member exists in the store',      expected: 'member activated successfully, returned data has isActive true' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError)', expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'id boundary', testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2, condition: 'id boundary', testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3, condition: 'id boundary', testCase: 'id: "a" (one character), matching record exists → member activated successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id="")',            inputData: 'id: "", no record can match an empty id',                   expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (id="a", no match)', inputData: 'id: "a", no member exists with id "a"',                    expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (id="a", match)',    inputData: 'id: "a", a member with id "a" exists in the store',         expected: 'member activated successfully, returned data id is "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',   inputData: 'known existing member id, member exists in the store',         expected: 'member activated successfully, returned data has isActive true' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',   inputData: 'non-existent id, no matching record exists (NotFoundError)',    expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',  inputData: 'id: "", no record can match an empty id',                      expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',  inputData: 'id: "a", no member exists with id "a"',                        expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',  inputData: 'id: "a", a member with id "a" exists in the store',            expected: 'member activated successfully, returned data id is "a"' },
    ],
};

const deleteMemberCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-13',
    tcCount: 5,
    statement: 'deleteMember(id) – Deletes the member with the given id and returns an ActionResult<void>. Returns success with no data on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'The member store may be empty or populated. A known member id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'On success: member deleted successfully, no data returned. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → member deleted successfully, no data returned', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing member id, member exists in the store',      expected: 'member deleted successfully, no data returned' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError)', expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'id boundary', testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2, condition: 'id boundary', testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3, condition: 'id boundary', testCase: 'id: "a" (one character), matching record exists → member deleted successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id="")',            inputData: 'id: "", no record can match an empty id',                   expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (id="a", no match)', inputData: 'id: "a", no member exists with id "a"',                    expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (id="a", match)',    inputData: 'id: "a", a member with id "a" exists in the store',         expected: 'member deleted successfully, no data returned' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',   inputData: 'known existing member id, member exists in the store',         expected: 'member deleted successfully, no data returned' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',   inputData: 'non-existent id, no matching record exists (NotFoundError)',    expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',  inputData: 'id: "", no record can match an empty id',                      expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',  inputData: 'id: "a", no member exists with id "a"',                        expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',  inputData: 'id: "a", a member with id "a" exists in the store',            expected: 'member deleted successfully, no data returned' },
    ],
};

const deleteAdminCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-14',
    tcCount: 5,
    statement: 'deleteAdmin(id) – Deletes the admin with the given id and returns an ActionResult<void>. Returns success with no data on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'The admin store may be empty or populated. A known admin id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'On success: admin deleted successfully, no data returned. On failure: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → admin deleted successfully, no data returned', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError) → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing admin id, admin exists in the store',        expected: 'admin deleted successfully, no data returned' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError)', expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'id boundary', testCase: 'id: "" (empty string, length 0): no record can match → operation fails' },
        { number: 2, condition: 'id boundary', testCase: 'id: "a" (one character), no matching record exists → operation fails' },
        { number: 3, condition: 'id boundary', testCase: 'id: "a" (one character), matching record exists → admin deleted successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id="")',            inputData: 'id: "", no record can match an empty id',                   expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (id="a", no match)', inputData: 'id: "a", no admin exists with id "a"',                     expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (id="a", match)',    inputData: 'id: "a", an admin with id "a" exists in the store',         expected: 'admin deleted successfully, no data returned' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',   inputData: 'known existing admin id, admin exists in the store',           expected: 'admin deleted successfully, no data returned' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',   inputData: 'non-existent id, no matching record exists (NotFoundError)',    expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',  inputData: 'id: "", no record can match an empty id',                      expected: 'operation fails with message "Not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',  inputData: 'id: "a", no admin exists with id "a"',                         expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',  inputData: 'id: "a", an admin with id "a" exists in the store',            expected: 'admin deleted successfully, no data returned' },
    ],
};

const createExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-15',
    tcCount: 31,
    statement: 'createExercise(data) – Validates the create-exercise input and returns an ActionResult<Exercise>. Returns success with the created Exercise on success. description is optional and may be omitted. Returns a field-level validation error for schema failures without calling the service. name is required, must be 8–64 characters after trimming, and must not be whitespace-only. muscleGroup must be one of the valid MuscleGroup enum values. equipmentNeeded must be one of the valid Equipment enum values. description, when provided, must be at most 1024 characters. Returns a failure with the service error message for ConflictError. Returns a failure with a generic error message for unexpected errors.',
    data: 'Input: data: CreateExerciseInput { name: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment, description?: string }',
    precondition: 'Valid MuscleGroup values: CHEST, BACK, LEGS, SHOULDERS, ARMS, CORE. Valid Equipment values: BARBELL, DUMBBELL, MACHINE, CABLE. name rules: 8–64 characters after trimming, not whitespace-only. description rules: optional, at most 1024 characters when provided.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'On success: exercise created successfully, returned data matches the created exercise. On validation failure: field-level validation error returned, the service is not called. On service error: operation fails with the service error message. On unexpected error: operation fails with generic error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',   validEc: 'All required fields valid, description provided → exercise created successfully, returned data matches the created exercise', invalidEc: '' },
        { number: 2, condition: 'description',      validEc: 'All required fields valid, description omitted → exercise created successfully, returned data has description undefined', invalidEc: '' },
        { number: 3, condition: 'name required',    validEc: '', invalidEc: 'name omitted → validation fails: name field error returned' },
        { number: 4, condition: 'muscleGroup required', validEc: '', invalidEc: 'muscleGroup omitted → validation fails: muscleGroup field error returned' },
        { number: 5, condition: 'equipmentNeeded required', validEc: '', invalidEc: 'equipmentNeeded omitted → validation fails: equipmentNeeded field error returned' },
        { number: 6, condition: 'name value',       validEc: '', invalidEc: 'name is empty string → validation fails: name field error returned' },
        { number: 7, condition: 'Service error',    validEc: '', invalidEc: 'Exercise name is already in use (ConflictError "Name already in use") → operation fails with message "Name already in use"' },
        { number: 8, condition: 'Unexpected error', validEc: '', invalidEc: 'An unexpected error occurs → operation fails with generic error message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'all required fields provided with valid values, exercise is created successfully',                                      expected: 'exercise created successfully, returned data matches the created exercise' },
        { noTc: 2, ec: 'EC-2', inputData: 'name: "Standard Bench Press", muscleGroup: CHEST, equipmentNeeded: BARBELL, description omitted',                       expected: 'exercise created successfully, returned data has description undefined' },
        { noTc: 3, ec: 'EC-3', inputData: 'all required fields provided with valid values, name field omitted',                                                    expected: 'validation fails: name field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'all required fields provided with valid values, muscleGroup field omitted',                                             expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 5, ec: 'EC-5', inputData: 'all required fields provided with valid values, equipmentNeeded field omitted',                                         expected: 'validation fails: equipmentNeeded field error returned' },
        { noTc: 6, ec: 'EC-6', inputData: 'all required fields provided with valid values, name set to "" (empty string)',                                         expected: 'validation fails: name field error returned' },
        { noTc: 7, ec: 'EC-7', inputData: 'all required fields provided with valid values, exercise name is already in use (ConflictError)',                       expected: 'operation fails with message "Name already in use"' },
        { noTc: 8, ec: 'EC-8', inputData: 'all required fields provided with valid values, an unexpected error occurs',                                            expected: 'operation fails with generic error message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'name whitespace',   testCase: 'name: whitespace-only string → validation fails: name field error returned' },
        { number: 2,  condition: 'name whitespace',   testCase: 'name: "   Bench Press   " (valid content padded with whitespace) → trimmed and accepted, exercise created successfully' },
        { number: 3,  condition: 'name length',       testCase: 'name: 7 chars (min - 1): below minimum → validation fails: name field error returned' },
        { number: 4,  condition: 'name length',       testCase: 'name: 8 chars (min): at minimum → exercise created successfully' },
        { number: 5,  condition: 'name length',       testCase: 'name: 9 chars (min + 1): above minimum → exercise created successfully' },
        { number: 6,  condition: 'name length',       testCase: 'name: 63 chars (max - 1): below maximum → exercise created successfully' },
        { number: 7,  condition: 'name length',       testCase: 'name: 64 chars (max): at maximum → exercise created successfully' },
        { number: 8,  condition: 'name length',       testCase: 'name: 65 chars (max + 1): above maximum → validation fails: name field error returned' },
        { number: 9,  condition: 'description length', testCase: 'description: 1023 chars (max - 1): below maximum → exercise created successfully' },
        { number: 10, condition: 'description length', testCase: 'description: 1024 chars (max): at maximum → exercise created successfully' },
        { number: 11, condition: 'description length', testCase: 'description: 1025 chars (max + 1): above maximum → validation fails: description field error returned' },
        { number: 12, condition: 'muscleGroup enum',  testCase: 'muscleGroup: CHEST (valid enum value) → exercise created successfully' },
        { number: 13, condition: 'muscleGroup enum',  testCase: 'muscleGroup: BACK (valid enum value) → exercise created successfully' },
        { number: 14, condition: 'muscleGroup enum',  testCase: 'muscleGroup: LEGS (valid enum value) → exercise created successfully' },
        { number: 15, condition: 'muscleGroup enum',  testCase: 'muscleGroup: SHOULDERS (valid enum value) → exercise created successfully' },
        { number: 16, condition: 'muscleGroup enum',  testCase: 'muscleGroup: ARMS (valid enum value) → exercise created successfully' },
        { number: 17, condition: 'muscleGroup enum',  testCase: 'muscleGroup: CORE (valid enum value) → exercise created successfully' },
        { number: 18, condition: 'muscleGroup enum',  testCase: 'muscleGroup: "INVALID" (not a valid enum value) → validation fails: muscleGroup field error returned' },
        { number: 19, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: BARBELL (valid enum value) → exercise created successfully' },
        { number: 20, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: DUMBBELL (valid enum value) → exercise created successfully' },
        { number: 21, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: MACHINE (valid enum value) → exercise created successfully' },
        { number: 22, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: CABLE (valid enum value) → exercise created successfully' },
        { number: 23, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: "INVALID" (not a valid enum value) → validation fails: equipmentNeeded field error returned' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (name=ws)',       inputData: 'all required fields valid, name: "         " (whitespace-only)',                                   expected: 'validation fails: name field error returned' },
        { noTc: 2,  bva: 'BVA-2  (name=padded)',   inputData: 'all required fields valid, name: "   Bench Press   " (padded with whitespace)',                    expected: 'exercise created successfully, returned data matches the created exercise' },
        { noTc: 3,  bva: 'BVA-3  (name=7)',        inputData: 'all required fields valid, name: "A".repeat(7)',                                                   expected: 'validation fails: name field error returned' },
        { noTc: 4,  bva: 'BVA-4  (name=8)',        inputData: 'all required fields valid, name: "A".repeat(8)',                                                   expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 5,  bva: 'BVA-5  (name=9)',        inputData: 'all required fields valid, name: "A".repeat(9)',                                                   expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 6,  bva: 'BVA-6  (name=63)',       inputData: 'all required fields valid, name: "A".repeat(63)',                                                  expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 7,  bva: 'BVA-7  (name=64)',       inputData: 'all required fields valid, name: "A".repeat(64)',                                                  expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 8,  bva: 'BVA-8  (name=65)',       inputData: 'all required fields valid, name: "A".repeat(65)',                                                  expected: 'validation fails: name field error returned' },
        { noTc: 9,  bva: 'BVA-9  (desc=1023)',     inputData: 'all required fields valid, description: "A".repeat(1023)',                                         expected: 'exercise created successfully, returned data description matches the input' },
        { noTc: 10, bva: 'BVA-10 (desc=1024)',     inputData: 'all required fields valid, description: "A".repeat(1024)',                                         expected: 'exercise created successfully, returned data description matches the input' },
        { noTc: 11, bva: 'BVA-11 (desc=1025)',     inputData: 'all required fields valid, description: "A".repeat(1025)',                                         expected: 'validation fails: description field error returned' },
        { noTc: 12, bva: 'BVA-12 (mg=CHEST)',      inputData: 'all required fields valid, muscleGroup: CHEST',                                                    expected: 'exercise created successfully, returned data muscleGroup is CHEST' },
        { noTc: 13, bva: 'BVA-13 (mg=BACK)',       inputData: 'all required fields valid, muscleGroup: BACK',                                                     expected: 'exercise created successfully, returned data muscleGroup is BACK' },
        { noTc: 14, bva: 'BVA-14 (mg=LEGS)',       inputData: 'all required fields valid, muscleGroup: LEGS',                                                     expected: 'exercise created successfully, returned data muscleGroup is LEGS' },
        { noTc: 15, bva: 'BVA-15 (mg=SHOULDERS)',  inputData: 'all required fields valid, muscleGroup: SHOULDERS',                                                expected: 'exercise created successfully, returned data muscleGroup is SHOULDERS' },
        { noTc: 16, bva: 'BVA-16 (mg=ARMS)',       inputData: 'all required fields valid, muscleGroup: ARMS',                                                     expected: 'exercise created successfully, returned data muscleGroup is ARMS' },
        { noTc: 17, bva: 'BVA-17 (mg=CORE)',       inputData: 'all required fields valid, muscleGroup: CORE',                                                     expected: 'exercise created successfully, returned data muscleGroup is CORE' },
        { noTc: 18, bva: 'BVA-18 (mg=INVALID)',    inputData: 'all required fields valid, muscleGroup: "INVALID" (not a valid enum value)',                       expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 19, bva: 'BVA-19 (eq=BARBELL)',    inputData: 'all required fields valid, equipmentNeeded: BARBELL',                                              expected: 'exercise created successfully, returned data equipmentNeeded is BARBELL' },
        { noTc: 20, bva: 'BVA-20 (eq=DUMBBELL)',   inputData: 'all required fields valid, equipmentNeeded: DUMBBELL',                                             expected: 'exercise created successfully, returned data equipmentNeeded is DUMBBELL' },
        { noTc: 21, bva: 'BVA-21 (eq=MACHINE)',    inputData: 'all required fields valid, equipmentNeeded: MACHINE',                                              expected: 'exercise created successfully, returned data equipmentNeeded is MACHINE' },
        { noTc: 22, bva: 'BVA-22 (eq=CABLE)',      inputData: 'all required fields valid, equipmentNeeded: CABLE',                                                expected: 'exercise created successfully, returned data equipmentNeeded is CABLE' },
        { noTc: 23, bva: 'BVA-23 (eq=INVALID)',    inputData: 'all required fields valid, equipmentNeeded: "INVALID" (not a valid enum value)',                   expected: 'validation fails: equipmentNeeded field error returned' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'all required fields provided with valid values, exercise is created successfully',                    expected: 'exercise created successfully, returned data matches the created exercise' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'name: "Standard Bench Press", muscleGroup: CHEST, equipmentNeeded: BARBELL, description omitted',    expected: 'exercise created successfully, returned data has description undefined' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'all required fields provided with valid values, name field omitted',                                  expected: 'validation fails: name field error returned' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'all required fields provided with valid values, muscleGroup field omitted',                           expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'all required fields provided with valid values, equipmentNeeded field omitted',                       expected: 'validation fails: equipmentNeeded field error returned' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'all required fields provided with valid values, name set to "" (empty string)',                       expected: 'validation fails: name field error returned' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'all required fields provided with valid values, exercise name is already in use (ConflictError)',     expected: 'operation fails with message "Name already in use"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: 'all required fields provided with valid values, an unexpected error occurs',                          expected: 'operation fails with generic error message "An unexpected error occurred"' },
        // ── From BVA ─────────────────────────────────────────────────────────
        { noTc: 9,  fromEc: '', fromBva: 'BVA-1',  inputData: 'all required fields valid, name: "         " (whitespace-only)',                                    expected: 'validation fails: name field error returned' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-2',  inputData: 'all required fields valid, name: "   Bench Press   " (padded with whitespace)',                     expected: 'exercise created successfully, returned data matches the created exercise' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-3',  inputData: 'all required fields valid, name: "A".repeat(7)',                                                    expected: 'validation fails: name field error returned' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-4',  inputData: 'all required fields valid, name: "A".repeat(8)',                                                    expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-5',  inputData: 'all required fields valid, name: "A".repeat(9)',                                                    expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-6',  inputData: 'all required fields valid, name: "A".repeat(63)',                                                   expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-7',  inputData: 'all required fields valid, name: "A".repeat(64)',                                                   expected: 'exercise created successfully, returned data name matches the input' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-8',  inputData: 'all required fields valid, name: "A".repeat(65)',                                                   expected: 'validation fails: name field error returned' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-9',  inputData: 'all required fields valid, description: "A".repeat(1023)',                                          expected: 'exercise created successfully, returned data description matches the input' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-10', inputData: 'all required fields valid, description: "A".repeat(1024)',                                          expected: 'exercise created successfully, returned data description matches the input' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-11', inputData: 'all required fields valid, description: "A".repeat(1025)',                                          expected: 'validation fails: description field error returned' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-12', inputData: 'all required fields valid, muscleGroup: CHEST',                                                     expected: 'exercise created successfully, returned data muscleGroup is CHEST' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-13', inputData: 'all required fields valid, muscleGroup: BACK',                                                      expected: 'exercise created successfully, returned data muscleGroup is BACK' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-14', inputData: 'all required fields valid, muscleGroup: LEGS',                                                      expected: 'exercise created successfully, returned data muscleGroup is LEGS' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-15', inputData: 'all required fields valid, muscleGroup: SHOULDERS',                                                 expected: 'exercise created successfully, returned data muscleGroup is SHOULDERS' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-16', inputData: 'all required fields valid, muscleGroup: ARMS',                                                      expected: 'exercise created successfully, returned data muscleGroup is ARMS' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-17', inputData: 'all required fields valid, muscleGroup: CORE',                                                      expected: 'exercise created successfully, returned data muscleGroup is CORE' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-18', inputData: 'all required fields valid, muscleGroup: "INVALID" (not a valid enum value)',                        expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-19', inputData: 'all required fields valid, equipmentNeeded: BARBELL',                                               expected: 'exercise created successfully, returned data equipmentNeeded is BARBELL' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-20', inputData: 'all required fields valid, equipmentNeeded: DUMBBELL',                                              expected: 'exercise created successfully, returned data equipmentNeeded is DUMBBELL' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-21', inputData: 'all required fields valid, equipmentNeeded: MACHINE',                                               expected: 'exercise created successfully, returned data equipmentNeeded is MACHINE' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-22', inputData: 'all required fields valid, equipmentNeeded: CABLE',                                                 expected: 'exercise created successfully, returned data equipmentNeeded is CABLE' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-23', inputData: 'all required fields valid, equipmentNeeded: "INVALID" (not a valid enum value)',                    expected: 'validation fails: equipmentNeeded field error returned' },
    ],
};

const getExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-16',
    tcCount: 6,
    statement: 'getExercise(id) – Looks up an exercise by the provided id and returns an ActionResult<Exercise>. Returns success with the matching exercise on success. Returns a failure with the service error message for NotFoundError. Returns a failure with a generic error message for unexpected errors.',
    data: 'Input: id: string',
    precondition: 'A known exercise id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'On success: exercise retrieved successfully, returned data matches the requested exercise. On NotFoundError: operation fails with the service error message. On unexpected error: operation fails with generic error message.',
    ecRows: [
        { number: 1, condition: 'ID existence',    validEc: 'Known existing id → exercise retrieved successfully, returned data matches the requested exercise', invalidEc: '' },
        { number: 2, condition: 'ID existence',    validEc: '', invalidEc: 'Non-existent id, no matching record exists → operation fails with message "Exercise not found"' },
        { number: 3, condition: 'Unexpected error', validEc: '', invalidEc: 'An unexpected error occurs → operation fails with generic error message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing exercise id, the exercise is retrieved successfully',                    expected: 'exercise retrieved successfully, returned data matches the requested exercise' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',        expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing exercise id, an unexpected error occurs',                                expected: 'operation fails with generic error message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that matches an existing record: shortest valid id → exercise retrieved successfully' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',          expected: 'operation fails with message "Exercise not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a"), a matching exercise record exists with id "a"',                expected: 'exercise retrieved successfully, returned data id is "a"' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',         expected: 'operation fails with message "Exercise not found"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing exercise id, the exercise is retrieved successfully',                    expected: 'exercise retrieved successfully, returned data matches the requested exercise' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',        expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',       inputData: 'known existing exercise id, an unexpected error occurs',                                expected: 'operation fails with generic error message "An unexpected error occurred"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1',      inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',            expected: 'operation fails with message "Exercise not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-2',      inputData: 'one-character id ("a"), a matching exercise record exists with id "a"',                  expected: 'exercise retrieved successfully, returned data id is "a"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-3',      inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',           expected: 'operation fails with message "Exercise not found"' },
    ],
};

const listExercisesCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-17',
    tcCount: 23,
    statement: 'listExercises(options?) – Retrieves a paginated list of exercises and returns an ActionResult<PageResult<Exercise>>. options is fully optional; when omitted, only active exercises are returned. includeInactive: false returns only active exercises; includeInactive: true returns all exercises. muscleGroup filters results to the specified group. search filters results by name. page and pageSize control pagination; when omitted, defaults apply. Returns a failure with the service error message for AppError.',
    data: 'Input: options?: ExerciseListOptions { includeInactive?: boolean, muscleGroup?: MuscleGroup, search?: string, page?: number, pageSize?: number }',
    precondition: 'Valid MuscleGroup values: CHEST, BACK, LEGS, SHOULDERS, ARMS, CORE. page: 0 and 1 both return the first page; page 2 returns the second page. pageSize: 0 returns no items; pageSize: 1 returns at most one item. search: undefined or empty string returns all exercises.',
    results: 'Output: Promise<ActionResult<PageResult<Exercise>>>',
    postcondition: 'On success: exercise list retrieved successfully, returned data matches the expected page result. On AppError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'options',            validEc: 'options omitted → exercise list retrieved successfully, only active exercises returned', invalidEc: '' },
        { number: 2, condition: 'includeInactive',    validEc: 'includeInactive: false → exercise list retrieved successfully, only active exercises returned', invalidEc: '' },
        { number: 3, condition: 'includeInactive',    validEc: 'includeInactive: true → exercise list retrieved successfully, all exercises returned (active and inactive)', invalidEc: '' },
        { number: 4, condition: 'muscleGroup filter', validEc: 'muscleGroup: CHEST → exercise list retrieved successfully, returned items all have muscleGroup CHEST', invalidEc: '' },
        { number: 5, condition: 'search filter',      validEc: 'search: "Bench" → exercise list retrieved successfully, returned items all contain "Bench" in their name', invalidEc: '' },
        { number: 6, condition: 'result ordering',    validEc: 'two exercises exist → exercise list retrieved successfully, items returned in alphabetical order', invalidEc: '' },
        { number: 7, condition: 'Service error',      validEc: '', invalidEc: 'An AppError occurs → operation fails with message "Service failed"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no options provided, the service returns a page of active exercises',                                                                   expected: 'exercise list retrieved successfully, returned items contain only active exercises' },
        { noTc: 2, ec: 'EC-2', inputData: 'includeInactive: false, the service returns a page of active exercises',                                                                expected: 'exercise list retrieved successfully, returned items contain only active exercises' },
        { noTc: 3, ec: 'EC-3', inputData: 'includeInactive: true, the service returns a page including inactive exercises',                                                        expected: 'exercise list retrieved successfully, returned items include all exercises' },
        { noTc: 4, ec: 'EC-4', inputData: 'muscleGroup: CHEST, the service returns exercises matching that muscle group',                                                          expected: 'exercise list retrieved successfully, returned items all have muscleGroup CHEST' },
        { noTc: 5, ec: 'EC-5', inputData: 'search: "Bench", the service returns exercises whose name contains "Bench"',                                                           expected: 'exercise list retrieved successfully, returned items all contain "Bench" in their name' },
        { noTc: 6, ec: 'EC-6', inputData: 'no options provided, the service returns two exercises ordered alphabetically ("A Exercise", "B Exercise")',                            expected: 'exercise list retrieved successfully, returned items are in order: "A Exercise" then "B Exercise"' },
        { noTc: 7, ec: 'EC-7', inputData: 'no options provided, an AppError occurs',                                                                                              expected: 'operation fails with message "Service failed"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'search boundary',    testCase: 'search: undefined → treated as no filter, service returns all exercises' },
        { number: 2,  condition: 'search boundary',    testCase: 'search: "" (empty string) → treated as no filter, service returns all exercises' },
        { number: 3,  condition: 'search boundary',    testCase: 'search: "a" (single character) → service returns exercises matching that character' },
        { number: 4,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: CHEST → service returns exercises for that muscle group' },
        { number: 5,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: BACK → service returns exercises for that muscle group' },
        { number: 6,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: LEGS → service returns exercises for that muscle group' },
        { number: 7,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: SHOULDERS → service returns exercises for that muscle group' },
        { number: 8,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: ARMS → service returns exercises for that muscle group' },
        { number: 9,  condition: 'muscleGroup enum',   testCase: 'muscleGroup: CORE → service returns exercises for that muscle group' },
        { number: 10, condition: 'page boundary',      testCase: 'page: 0 (below conventional first page) → service returns first page of results' },
        { number: 11, condition: 'page boundary',      testCase: 'page: 1 (first page) → service returns first page of results' },
        { number: 12, condition: 'page boundary',      testCase: 'page: 2 (second page, beyond available data) → service returns empty items list with total reflecting actual count' },
        { number: 13, condition: 'page boundary',      testCase: 'page: undefined → service applies default and returns first page of results' },
        { number: 14, condition: 'pageSize boundary',  testCase: 'pageSize: 0 → service returns empty items list' },
        { number: 15, condition: 'pageSize boundary',  testCase: 'pageSize: 1 → service returns at most one item' },
        { number: 16, condition: 'pageSize boundary',  testCase: 'pageSize: undefined → service applies default page size and returns first page of results' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (search=undef)',  inputData: 'search: undefined, the service returns all exercises',                                                             expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 2,  bva: 'BVA-2  (search="")',     inputData: 'search: "" (empty string), the service returns all exercises',                                                     expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 3,  bva: 'BVA-3  (search="a")',    inputData: 'search: "a" (single character), the service returns matching exercises',                                           expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 4,  bva: 'BVA-4  (mg=CHEST)',      inputData: 'muscleGroup: CHEST, the service returns exercises for that muscle group',                                          expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is CHEST' },
        { noTc: 5,  bva: 'BVA-5  (mg=BACK)',       inputData: 'muscleGroup: BACK, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is BACK' },
        { noTc: 6,  bva: 'BVA-6  (mg=LEGS)',       inputData: 'muscleGroup: LEGS, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is LEGS' },
        { noTc: 7,  bva: 'BVA-7  (mg=SHOULDERS)',  inputData: 'muscleGroup: SHOULDERS, the service returns exercises for that muscle group',                                      expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is SHOULDERS' },
        { noTc: 8,  bva: 'BVA-8  (mg=ARMS)',       inputData: 'muscleGroup: ARMS, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is ARMS' },
        { noTc: 9,  bva: 'BVA-9  (mg=CORE)',       inputData: 'muscleGroup: CORE, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is CORE' },
        { noTc: 10, bva: 'BVA-10 (page=0)',        inputData: 'page: 0, the service returns the first page of results',                                                          expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 11, bva: 'BVA-11 (page=1)',        inputData: 'page: 1, the service returns the first page of results',                                                          expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 12, bva: 'BVA-12 (page=2)',        inputData: 'page: 2, the service returns an empty page because the data fits on page 1 (items: [], total: 1)',                 expected: 'exercise list retrieved successfully, items has length 0, total is 1' },
        { noTc: 13, bva: 'BVA-13 (page=undef)',    inputData: 'page: undefined, the service applies default and returns the first page of results',                              expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 14, bva: 'BVA-14 (pageSize=0)',    inputData: 'pageSize: 0, the service returns an empty items list (items: [], total: 1)',                                       expected: 'exercise list retrieved successfully, items has length 0' },
        { noTc: 15, bva: 'BVA-15 (pageSize=1)',    inputData: 'pageSize: 1, the service returns at most one item',                                                               expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 16, bva: 'BVA-16 (pageSize=undef)',inputData: 'pageSize: undefined, the service applies default page size and returns the first page of results',                expected: 'exercise list retrieved successfully, items has length 1' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'no options provided, the service returns a page of active exercises',                                                expected: 'exercise list retrieved successfully, returned items contain only active exercises' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'includeInactive: false, the service returns a page of active exercises',                                             expected: 'exercise list retrieved successfully, returned items contain only active exercises' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'includeInactive: true, the service returns a page including inactive exercises',                                     expected: 'exercise list retrieved successfully, returned items include all exercises' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'muscleGroup: CHEST, the service returns exercises matching that muscle group',                                       expected: 'exercise list retrieved successfully, returned items all have muscleGroup CHEST' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'search: "Bench", the service returns exercises whose name contains "Bench"',                                        expected: 'exercise list retrieved successfully, returned items all contain "Bench" in their name' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'no options provided, the service returns two exercises ordered alphabetically ("A Exercise", "B Exercise")',         expected: 'exercise list retrieved successfully, returned items are in order: "A Exercise" then "B Exercise"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'no options provided, an AppError occurs',                                                                           expected: 'operation fails with message "Service failed"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1',  inputData: 'search: undefined, the service returns all exercises',                                                             expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2',  inputData: 'search: "" (empty string), the service returns all exercises',                                                     expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-3',  inputData: 'search: "a" (single character), the service returns matching exercises',                                           expected: 'exercise list retrieved successfully, total is 1, items has length 1' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-4',  inputData: 'muscleGroup: CHEST, the service returns exercises for that muscle group',                                          expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is CHEST' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-5',  inputData: 'muscleGroup: BACK, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is BACK' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-6',  inputData: 'muscleGroup: LEGS, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is LEGS' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-7',  inputData: 'muscleGroup: SHOULDERS, the service returns exercises for that muscle group',                                      expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is SHOULDERS' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-8',  inputData: 'muscleGroup: ARMS, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is ARMS' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-9',  inputData: 'muscleGroup: CORE, the service returns exercises for that muscle group',                                           expected: 'exercise list retrieved successfully, returned items[0].muscleGroup is CORE' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-10', inputData: 'page: 0, the service returns the first page of results',                                                          expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-11', inputData: 'page: 1, the service returns the first page of results',                                                          expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-12', inputData: 'page: 2, the service returns an empty page because the data fits on page 1 (items: [], total: 1)',                 expected: 'exercise list retrieved successfully, items has length 0, total is 1' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-13', inputData: 'page: undefined, the service applies default and returns the first page of results',                              expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-14', inputData: 'pageSize: 0, the service returns an empty items list (items: [], total: 1)',                                       expected: 'exercise list retrieved successfully, items has length 0' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-15', inputData: 'pageSize: 1, the service returns at most one item',                                                               expected: 'exercise list retrieved successfully, items has length 1' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-16', inputData: 'pageSize: undefined, the service applies default page size and returns the first page of results',                expected: 'exercise list retrieved successfully, items has length 1' },
    ],
};

const updateExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-18',
    tcCount: 26,
    statement: 'updateExercise(id, data) – Validates the update-exercise input and returns an ActionResult<Exercise>. All fields in UpdateExerciseInput are optional; an empty object is accepted and results in a no-op update. Returns success with the updated Exercise on success. Returns a field-level validation error for schema failures without calling the service. muscleGroup, when provided, must be a valid MuscleGroup enum value. equipmentNeeded, when provided, must be a valid Equipment enum value. name, when provided, must be 8–64 characters. description, when provided, must be at most 1024 characters. Returns a failure with the service error message for NotFoundError and ConflictError. Returns a failure with a generic error message for unexpected errors.',
    data: 'Input: id: string, data: UpdateExerciseInput { name?: string, muscleGroup?: MuscleGroup, equipmentNeeded?: Equipment, description?: string }',
    precondition: 'All fields are optional. Valid MuscleGroup values: CHEST, BACK, LEGS, SHOULDERS, ARMS, CORE. Valid Equipment values: BARBELL, DUMBBELL, MACHINE, CABLE. name rules when provided: 8–64 characters. description rules when provided: at most 1024 characters.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'On success: exercise updated successfully, returned data reflects the applied changes. On validation failure: field-level validation error returned, the service is not called. On NotFoundError: operation fails with the service error message. On ConflictError: operation fails with the service error message. On unexpected error: operation fails with generic error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',         validEc: 'Valid partial update data provided (e.g. description: "Updated description") → exercise updated successfully, returned data reflects the change', invalidEc: '' },
        { number: 2, condition: 'Empty input',            validEc: 'Empty object provided → exercise updated successfully (no-op), returned data unchanged', invalidEc: '' },
        { number: 3, condition: 'muscleGroup value',      validEc: '', invalidEc: 'muscleGroup: "INVALID" (not a valid enum value) → validation fails: muscleGroup field error returned' },
        { number: 4, condition: 'equipmentNeeded value',  validEc: '', invalidEc: 'equipmentNeeded: "INVALID" (not a valid enum value) → validation fails: equipmentNeeded field error returned' },
        { number: 5, condition: 'Service error',          validEc: '', invalidEc: 'No exercise exists for the given id (NotFoundError "Exercise not found") → operation fails with message "Exercise not found"' },
        { number: 6, condition: 'Service error',          validEc: '', invalidEc: 'Exercise name is already in use (ConflictError "Name taken") → operation fails with message "Name taken"' },
        { number: 7, condition: 'Unexpected error',       validEc: '', invalidEc: 'An unexpected error occurs → operation fails with generic error message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing exercise id, data: { description: "Updated description" }, exercise is updated successfully',              expected: 'exercise updated successfully, returned data description is "Updated description"' },
        { noTc: 2, ec: 'EC-2', inputData: 'known existing exercise id, data: {} (empty object), exercise is updated successfully',                                   expected: 'exercise updated successfully, returned data matches the original exercise' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing exercise id, data: { muscleGroup: "INVALID" }',                                                           expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'known existing exercise id, data: { equipmentNeeded: "INVALID" }',                                                       expected: 'validation fails: equipmentNeeded field error returned' },
        { noTc: 5, ec: 'EC-5', inputData: 'non-existent exercise id, data: { name: "New Exercise Name" }, no matching record exists (NotFoundError)',               expected: 'operation fails with message "Exercise not found"' },
        { noTc: 6, ec: 'EC-6', inputData: 'known existing exercise id, data: { name: "Existing Name" }, exercise name is already in use (ConflictError)',           expected: 'operation fails with message "Name taken"' },
        { noTc: 7, ec: 'EC-7', inputData: 'known existing exercise id, data: { name: "Any Name" }, an unexpected error occurs',                                     expected: 'operation fails with generic error message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'name length',          testCase: 'name: 7 chars (min - 1): below minimum → validation fails: name field error returned' },
        { number: 2,  condition: 'name length',          testCase: 'name: 8 chars (min): at minimum → exercise updated successfully' },
        { number: 3,  condition: 'name length',          testCase: 'name: 64 chars (max): at maximum → exercise updated successfully' },
        { number: 4,  condition: 'name length',          testCase: 'name: 65 chars (max + 1): above maximum → validation fails: name field error returned' },
        { number: 5,  condition: 'description length',   testCase: 'description: 1023 chars (max - 1): below maximum → exercise updated successfully' },
        { number: 6,  condition: 'description length',   testCase: 'description: 1024 chars (max): at maximum → exercise updated successfully' },
        { number: 7,  condition: 'description length',   testCase: 'description: 1025 chars (max + 1): above maximum → validation fails: description field error returned' },
        { number: 8,  condition: 'muscleGroup enum',     testCase: 'muscleGroup: CHEST (valid enum value) → exercise updated successfully' },
        { number: 9,  condition: 'muscleGroup enum',     testCase: 'muscleGroup: BACK (valid enum value) → exercise updated successfully' },
        { number: 10, condition: 'muscleGroup enum',     testCase: 'muscleGroup: LEGS (valid enum value) → exercise updated successfully' },
        { number: 11, condition: 'muscleGroup enum',     testCase: 'muscleGroup: SHOULDERS (valid enum value) → exercise updated successfully' },
        { number: 12, condition: 'muscleGroup enum',     testCase: 'muscleGroup: ARMS (valid enum value) → exercise updated successfully' },
        { number: 13, condition: 'muscleGroup enum',     testCase: 'muscleGroup: CORE (valid enum value) → exercise updated successfully' },
        { number: 14, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: BARBELL (valid enum value) → exercise updated successfully' },
        { number: 15, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: DUMBBELL (valid enum value) → exercise updated successfully' },
        { number: 16, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: MACHINE (valid enum value) → exercise updated successfully' },
        { number: 17, condition: 'equipmentNeeded enum', testCase: 'equipmentNeeded: CABLE (valid enum value) → exercise updated successfully' },
        { number: 18, condition: 'ID length',            testCase: 'one-character id that matches an existing record: shortest valid id → exercise updated successfully' },
        { number: 19, condition: 'ID length',            testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (name=7)',       inputData: 'known existing exercise id, data: { name: "A".repeat(7) }',                                                expected: 'validation fails: name field error returned' },
        { noTc: 2,  bva: 'BVA-2  (name=8)',       inputData: 'known existing exercise id, data: { name: "A".repeat(8) }, exercise is updated successfully',              expected: 'exercise updated successfully, returned data name matches the input' },
        { noTc: 3,  bva: 'BVA-3  (name=64)',      inputData: 'known existing exercise id, data: { name: "A".repeat(64) }, exercise is updated successfully',             expected: 'exercise updated successfully, returned data name matches the input' },
        { noTc: 4,  bva: 'BVA-4  (name=65)',      inputData: 'known existing exercise id, data: { name: "A".repeat(65) }',                                               expected: 'validation fails: name field error returned' },
        { noTc: 5,  bva: 'BVA-5  (desc=1023)',    inputData: 'known existing exercise id, data: { description: "A".repeat(1023) }, exercise is updated successfully',    expected: 'exercise updated successfully, returned data description matches the input' },
        { noTc: 6,  bva: 'BVA-6  (desc=1024)',    inputData: 'known existing exercise id, data: { description: "A".repeat(1024) }, exercise is updated successfully',    expected: 'exercise updated successfully, returned data description matches the input' },
        { noTc: 7,  bva: 'BVA-7  (desc=1025)',    inputData: 'known existing exercise id, data: { description: "A".repeat(1025) }',                                      expected: 'validation fails: description field error returned' },
        { noTc: 8,  bva: 'BVA-8  (mg=CHEST)',     inputData: 'known existing exercise id, data: { muscleGroup: CHEST }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is CHEST' },
        { noTc: 9,  bva: 'BVA-9  (mg=BACK)',      inputData: 'known existing exercise id, data: { muscleGroup: BACK }, exercise is updated successfully',                expected: 'exercise updated successfully, returned data muscleGroup is BACK' },
        { noTc: 10, bva: 'BVA-10 (mg=LEGS)',      inputData: 'known existing exercise id, data: { muscleGroup: LEGS }, exercise is updated successfully',                expected: 'exercise updated successfully, returned data muscleGroup is LEGS' },
        { noTc: 11, bva: 'BVA-11 (mg=SHOULDERS)', inputData: 'known existing exercise id, data: { muscleGroup: SHOULDERS }, exercise is updated successfully',          expected: 'exercise updated successfully, returned data muscleGroup is SHOULDERS' },
        { noTc: 12, bva: 'BVA-12 (mg=ARMS)',      inputData: 'known existing exercise id, data: { muscleGroup: ARMS }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is ARMS' },
        { noTc: 13, bva: 'BVA-13 (mg=CORE)',      inputData: 'known existing exercise id, data: { muscleGroup: CORE }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is CORE' },
        { noTc: 14, bva: 'BVA-14 (eq=BARBELL)',   inputData: 'known existing exercise id, data: { equipmentNeeded: BARBELL }, exercise is updated successfully',        expected: 'exercise updated successfully, returned data equipmentNeeded is BARBELL' },
        { noTc: 15, bva: 'BVA-15 (eq=DUMBBELL)',  inputData: 'known existing exercise id, data: { equipmentNeeded: DUMBBELL }, exercise is updated successfully',       expected: 'exercise updated successfully, returned data equipmentNeeded is DUMBBELL' },
        { noTc: 16, bva: 'BVA-16 (eq=MACHINE)',   inputData: 'known existing exercise id, data: { equipmentNeeded: MACHINE }, exercise is updated successfully',        expected: 'exercise updated successfully, returned data equipmentNeeded is MACHINE' },
        { noTc: 17, bva: 'BVA-17 (eq=CABLE)',     inputData: 'known existing exercise id, data: { equipmentNeeded: CABLE }, exercise is updated successfully',          expected: 'exercise updated successfully, returned data equipmentNeeded is CABLE' },
        { noTc: 18, bva: 'BVA-18 (id=len1, exist)', inputData: 'one-character id ("a"), a matching exercise record exists, data: { muscleGroup: BACK }, exercise is updated successfully', expected: 'exercise updated successfully, returned data id is "a" and muscleGroup is BACK' },
        { noTc: 19, bva: 'BVA-19 (id=len1, none)', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError), data: { description: "New" }',               expected: 'operation fails with message "Not found"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'known existing exercise id, data: { description: "Updated description" }, exercise is updated successfully',  expected: 'exercise updated successfully, returned data description is "Updated description"' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'known existing exercise id, data: {} (empty object), exercise is updated successfully',                       expected: 'exercise updated successfully, returned data matches the original exercise' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'known existing exercise id, data: { muscleGroup: "INVALID" }',                                               expected: 'validation fails: muscleGroup field error returned' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'known existing exercise id, data: { equipmentNeeded: "INVALID" }',                                           expected: 'validation fails: equipmentNeeded field error returned' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'non-existent exercise id, data: { name: "New Exercise Name" }, no matching record exists (NotFoundError)',   expected: 'operation fails with message "Exercise not found"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'known existing exercise id, data: { name: "Existing Name" }, exercise name is already in use (ConflictError)', expected: 'operation fails with message "Name taken"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'known existing exercise id, data: { name: "Any Name" }, an unexpected error occurs',                         expected: 'operation fails with generic error message "An unexpected error occurred"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1',  inputData: 'known existing exercise id, data: { name: "A".repeat(7) }',                                               expected: 'validation fails: name field error returned' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2',  inputData: 'known existing exercise id, data: { name: "A".repeat(8) }, exercise is updated successfully',             expected: 'exercise updated successfully, returned data name matches the input' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-3',  inputData: 'known existing exercise id, data: { name: "A".repeat(64) }, exercise is updated successfully',            expected: 'exercise updated successfully, returned data name matches the input' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-4',  inputData: 'known existing exercise id, data: { name: "A".repeat(65) }',                                              expected: 'validation fails: name field error returned' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-5',  inputData: 'known existing exercise id, data: { description: "A".repeat(1023) }, exercise is updated successfully',   expected: 'exercise updated successfully, returned data description matches the input' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-6',  inputData: 'known existing exercise id, data: { description: "A".repeat(1024) }, exercise is updated successfully',   expected: 'exercise updated successfully, returned data description matches the input' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-7',  inputData: 'known existing exercise id, data: { description: "A".repeat(1025) }',                                     expected: 'validation fails: description field error returned' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-8',  inputData: 'known existing exercise id, data: { muscleGroup: CHEST }, exercise is updated successfully',              expected: 'exercise updated successfully, returned data muscleGroup is CHEST' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-9',  inputData: 'known existing exercise id, data: { muscleGroup: BACK }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is BACK' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-10', inputData: 'known existing exercise id, data: { muscleGroup: LEGS }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is LEGS' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-11', inputData: 'known existing exercise id, data: { muscleGroup: SHOULDERS }, exercise is updated successfully',          expected: 'exercise updated successfully, returned data muscleGroup is SHOULDERS' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-12', inputData: 'known existing exercise id, data: { muscleGroup: ARMS }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is ARMS' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-13', inputData: 'known existing exercise id, data: { muscleGroup: CORE }, exercise is updated successfully',               expected: 'exercise updated successfully, returned data muscleGroup is CORE' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-14', inputData: 'known existing exercise id, data: { equipmentNeeded: BARBELL }, exercise is updated successfully',        expected: 'exercise updated successfully, returned data equipmentNeeded is BARBELL' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-15', inputData: 'known existing exercise id, data: { equipmentNeeded: DUMBBELL }, exercise is updated successfully',       expected: 'exercise updated successfully, returned data equipmentNeeded is DUMBBELL' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-16', inputData: 'known existing exercise id, data: { equipmentNeeded: MACHINE }, exercise is updated successfully',        expected: 'exercise updated successfully, returned data equipmentNeeded is MACHINE' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-17', inputData: 'known existing exercise id, data: { equipmentNeeded: CABLE }, exercise is updated successfully',          expected: 'exercise updated successfully, returned data equipmentNeeded is CABLE' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-18', inputData: 'one-character id ("a"), a matching exercise record exists, data: { muscleGroup: BACK }, exercise is updated successfully', expected: 'exercise updated successfully, returned data id is "a" and muscleGroup is BACK' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-19', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError), data: { description: "New" }',              expected: 'operation fails with message "Not found"' },
    ],
};

const archiveExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-19',
    tcCount: 5,
    statement: 'archiveExercise(id) – Archives the exercise with the given id and returns an ActionResult<Exercise>. Returns success with the archived exercise (isActive: false) on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'A known exercise id exists in the store with isActive: true. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'On success: exercise archived successfully, returned data has isActive: false and id matches the requested id. On NotFoundError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → exercise archived successfully, returned data has isActive: false and id matches the requested id', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError "Exercise not found") → operation fails with message "Exercise not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing exercise id, the exercise is archived successfully',                         expected: 'exercise archived successfully, returned data has isActive: false and id matches the requested id' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',            expected: 'operation fails with message "Exercise not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that matches an existing record: shortest valid id → exercise archived successfully, returned data has isActive: false' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',                       expected: 'operation fails with message "Exercise not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a"), a matching exercise record exists with id "a", exercise is archived successfully', expected: 'exercise archived successfully, returned data id is "a" and isActive is false' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',                      expected: 'operation fails with message "Exercise not found"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing exercise id, the exercise is archived successfully',                         expected: 'exercise archived successfully, returned data has isActive: false and id matches the requested id' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',            expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',      inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',               expected: 'operation fails with message "Exercise not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',      inputData: 'one-character id ("a"), a matching exercise record exists with id "a", exercise is archived successfully', expected: 'exercise archived successfully, returned data id is "a" and isActive is false' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',      inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',              expected: 'operation fails with message "Exercise not found"' },
    ],
};

const unarchiveExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-20',
    tcCount: 5,
    statement: 'unarchiveExercise(id) – Unarchives the exercise with the given id and returns an ActionResult<Exercise>. Returns success with the restored exercise (isActive: true) on success. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string',
    precondition: 'A known exercise id exists in the store with isActive: false (archived). A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'On success: exercise unarchived successfully, returned data has isActive: true and id matches the requested id. On NotFoundError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing archived id → exercise unarchived successfully, returned data has isActive: true and id matches the requested id', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError "Exercise not found") → operation fails with message "Exercise not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing archived exercise id, the exercise is unarchived successfully',                      expected: 'exercise unarchived successfully, returned data has isActive: true and id matches the requested id' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',                    expected: 'operation fails with message "Exercise not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that matches an existing archived record: shortest valid id → exercise unarchived successfully, returned data has isActive: true' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',                            expected: 'operation fails with message "Exercise not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a"), a matching archived exercise record exists with id "a", exercise is unarchived successfully', expected: 'exercise unarchived successfully, returned data id is "a" and isActive is true' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',                           expected: 'operation fails with message "Exercise not found"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing archived exercise id, the exercise is unarchived successfully',               expected: 'exercise unarchived successfully, returned data has isActive: true and id matches the requested id' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',             expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, fromEc: '', fromBva: 'BVA-1',      inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',                expected: 'operation fails with message "Exercise not found"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-2',      inputData: 'one-character id ("a"), a matching archived exercise record exists with id "a", exercise is unarchived successfully', expected: 'exercise unarchived successfully, returned data id is "a" and isActive is true' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-3',      inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',               expected: 'operation fails with message "Exercise not found"' },
    ],
};

const deleteExerciseCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-21',
    tcCount: 6,
    statement: 'deleteExercise(id) – Permanently deletes the exercise with the given id and returns an ActionResult<void>. Returns success with undefined data on success. Returns a failure with the service error message for NotFoundError. Returns a failure with the service error message for ConflictError when the exercise is referenced in existing sessions.',
    data: 'Input: id: string',
    precondition: 'A known exercise id exists in the store and is not referenced by any session. A referenced exercise id is used in at least one existing session. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'On success: exercise permanently deleted, returned data is undefined. On NotFoundError: operation fails with the service error message. On ConflictError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'ID existence / references', validEc: 'Known existing id with no session references → exercise deleted successfully, returned data is undefined', invalidEc: '' },
        { number: 2, condition: 'ID existence / references', validEc: '', invalidEc: 'Non-existent id, no matching record exists (NotFoundError "Exercise not found") → operation fails with message "Exercise not found"' },
        { number: 3, condition: 'ID existence / references', validEc: '', invalidEc: 'Known existing id that is referenced in sessions (ConflictError "Referenced in sessions") → operation fails with message "Referenced in sessions"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing exercise id with no session references, the exercise is deleted successfully',                        expected: 'exercise deleted successfully, returned data is undefined' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',                                    expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing exercise id that is referenced in sessions (ConflictError "Referenced in sessions")',                 expected: 'operation fails with message "Referenced in sessions"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'empty string id (length 0): no record can match → operation fails with service error message' },
        { number: 2, condition: 'ID length', testCase: 'one-character id that matches an existing unreferenced record: shortest valid id → exercise deleted successfully' },
        { number: 3, condition: 'ID length', testCase: 'one-character id that does not match any record: non-existent → operation fails with service error message' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)', inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',                                    expected: 'operation fails with message "Exercise not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1)', inputData: 'one-character id ("a"), a matching unreferenced exercise record exists with id "a", exercise is deleted successfully', expected: 'exercise deleted successfully, returned data is undefined' },
        { noTc: 3, bva: 'BVA-3 (len=1)', inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',                                   expected: 'operation fails with message "Exercise not found"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing exercise id with no session references, the exercise is deleted successfully',        expected: 'exercise deleted successfully, returned data is undefined' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'non-existent id, no matching record exists (NotFoundError "Exercise not found")',                     expected: 'operation fails with message "Exercise not found"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',       inputData: 'known existing exercise id that is referenced in sessions (ConflictError "Referenced in sessions")', expected: 'operation fails with message "Referenced in sessions"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1',      inputData: 'empty string id (""), no matching record exists for this id (NotFoundError)',                        expected: 'operation fails with message "Exercise not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-2',      inputData: 'one-character id ("a"), a matching unreferenced exercise record exists with id "a", exercise is deleted successfully', expected: 'exercise deleted successfully, returned data is undefined' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-3',      inputData: 'one-character id ("a"), no matching record exists for this id (NotFoundError)',                      expected: 'operation fails with message "Exercise not found"' },
    ],
};

const createWorkoutSessionCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-22',
    tcCount: 45,
    statement: 'createWorkoutSession(session, exercises) – Validates both the session input and the exercises array, then returns an ActionResult<WorkoutSessionWithExercises>. Returns success with the created session and all exercises on success. notes is optional; when omitted or empty the session is still created. Returns a field-level validation error on the session when memberId, date, or duration are invalid. memberId must be a non-empty, non-whitespace-only string. date must be in YYYY-MM-DD format. duration must be 0–180 (inclusive). notes, when provided, must be at most 1024 characters. Returns a failure with message "At least one exercise is required" when the exercises array is empty. Returns a failure with message "Invalid exercises" when any exercise fails per-item validation: exerciseId is required; sets must be 0–6; reps must be 0–30; weight must be 0.0–500.0. Returns a failure with the service error message for NotFoundError and TransactionError.',
    data: 'Input: session: CreateWorkoutSessionInput { memberId: string, date: string, duration: number, notes?: string }, exercises: WorkoutSessionExerciseInput[] { exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'memberId: non-empty, non-whitespace-only string (min 1 char after trim). date: YYYY-MM-DD format. duration: integer 0–180 inclusive. notes: optional, max 1024 characters. exercises: at least one element required. Per exercise — sets: 0–6 inclusive; reps: 0–30 inclusive; weight: 0.0–500.0 inclusive.',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'On success: session created successfully, returned data matches the created session including all exercises. On session validation failure: field-level validation error returned, the service is not called. On exercise list failure ("At least one exercise is required" or "Invalid exercises"): message-level failure returned, the service is not called. On NotFoundError or TransactionError: operation fails with the service error message.',
    ecRows: [
        { number: 1,  condition: 'Input validity',          validEc: 'All session fields valid, one valid exercise → session created successfully, returned data matches the created session', invalidEc: '' },
        { number: 2,  condition: 'Exercise count',          validEc: 'All session fields valid, two valid exercises → session created successfully, returned data exercises has length 2', invalidEc: '' },
        { number: 3,  condition: 'notes presence',          validEc: 'notes omitted → session created successfully, returned data notes is null', invalidEc: '' },
        { number: 4,  condition: 'notes value',             validEc: 'notes: "" (empty string) → session created successfully, returned data notes is ""', invalidEc: '' },
        { number: 5,  condition: 'memberId required',       validEc: '', invalidEc: 'memberId omitted → validation fails: memberId field error returned' },
        { number: 6,  condition: 'memberId value',          validEc: '', invalidEc: 'memberId: "   " (whitespace-only) → validation fails: memberId field error returned' },
        { number: 7,  condition: 'date required',           validEc: '', invalidEc: 'date omitted → validation fails: date field error returned' },
        { number: 8,  condition: 'date format',             validEc: '', invalidEc: 'date: "15/06/2024" (DD/MM/YYYY, wrong format) → validation fails: date field error returned' },
        { number: 9,  condition: 'duration required',       validEc: '', invalidEc: 'duration omitted → validation fails: duration field error returned' },
        { number: 10, condition: 'exercises array',         validEc: '', invalidEc: 'exercises: [] (empty array) → operation fails with message "At least one exercise is required"' },
        { number: 11, condition: 'exercise exerciseId',     validEc: '', invalidEc: 'exercise with exerciseId omitted → operation fails with message "Invalid exercises"' },
        { number: 12, condition: 'Service error',           validEc: '', invalidEc: 'Member does not exist (NotFoundError "Member not found") → operation fails with message "Member not found"' },
        { number: 13, condition: 'Service error',           validEc: '', invalidEc: 'A database transaction failure occurs (TransactionError "DB failure") → operation fails with message "DB failure"' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all session fields valid, one valid exercise provided, session is created successfully',                                        expected: 'session created successfully, returned data matches the created session' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'all session fields valid, two valid exercises provided, session is created successfully',                                       expected: 'session created successfully, returned data exercises has length 2' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'all session fields valid except notes omitted, session is created successfully',                                               expected: 'session created successfully, returned data notes is null' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'all session fields valid, notes: "" (empty string), session is created successfully',                                          expected: 'session created successfully, returned data notes is ""' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'all session fields valid, memberId field omitted',                                                                             expected: 'validation fails: memberId field error returned' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'all session fields valid, memberId: "   " (whitespace-only)',                                                                  expected: 'validation fails: memberId field error returned' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'all session fields valid, date field omitted',                                                                                 expected: 'validation fails: date field error returned' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'all session fields valid, date: "15/06/2024" (DD/MM/YYYY, wrong format)',                                                      expected: 'validation fails: date field error returned' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'all session fields valid, duration field omitted',                                                                             expected: 'validation fails: duration field error returned' },
        { noTc: 10, ec: 'EC-10', inputData: 'all session fields valid, exercises: [] (empty array)',                                                                        expected: 'operation fails with message "At least one exercise is required"' },
        { noTc: 11, ec: 'EC-11', inputData: 'all session fields valid, one exercise with exerciseId omitted',                                                               expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 12, ec: 'EC-12', inputData: 'all session fields valid, one valid exercise, member does not exist (NotFoundError "Member not found")',                        expected: 'operation fails with message "Member not found"' },
        { noTc: 13, ec: 'EC-13', inputData: 'all session fields valid, one valid exercise, a database transaction failure occurs (TransactionError "DB failure")',           expected: 'operation fails with message "DB failure"' },
    ],
    bvaRows: [
        // ── memberId ──────────────────────────────────────────────────────────
        { number: 1,  condition: 'memberId length',  testCase: 'memberId: "" (length 0): empty → validation fails: memberId field error returned' },
        { number: 2,  condition: 'memberId length',  testCase: 'memberId: "A" (length 1, min): shortest valid id → session created successfully' },
        { number: 3,  condition: 'memberId length',  testCase: 'memberId: "AB" (length 2, min + 1): above minimum → session created successfully' },
        // ── duration ─────────────────────────────────────────────────────────
        { number: 4,  condition: 'duration range',   testCase: 'duration: -1 (min - 1): below minimum → validation fails: duration field error returned' },
        { number: 5,  condition: 'duration range',   testCase: 'duration: 0 (min): at minimum → session created successfully' },
        { number: 6,  condition: 'duration range',   testCase: 'duration: 1 (min + 1): above minimum → session created successfully' },
        { number: 7,  condition: 'duration range',   testCase: 'duration: 179 (max - 1): below maximum → session created successfully' },
        { number: 8,  condition: 'duration range',   testCase: 'duration: 180 (max): at maximum → session created successfully' },
        { number: 9,  condition: 'duration range',   testCase: 'duration: 181 (max + 1): above maximum → validation fails: duration field error returned' },
        // ── notes ────────────────────────────────────────────────────────────
        { number: 10, condition: 'notes length',     testCase: 'notes: "" (length 0): empty string → session created successfully' },
        { number: 11, condition: 'notes length',     testCase: 'notes: "A" (length 1, min + 1): one character → session created successfully' },
        { number: 12, condition: 'notes length',     testCase: 'notes: "A".repeat(1023) (max - 1): below maximum → session created successfully' },
        { number: 13, condition: 'notes length',     testCase: 'notes: "A".repeat(1024) (max): at maximum → session created successfully' },
        { number: 14, condition: 'notes length',     testCase: 'notes: "A".repeat(1025) (max + 1): above maximum → validation fails: notes field error returned' },
        // ── sets ─────────────────────────────────────────────────────────────
        { number: 15, condition: 'sets range',       testCase: 'sets: -1 (min - 1): below minimum → operation fails with message "Invalid exercises"' },
        { number: 16, condition: 'sets range',       testCase: 'sets: 0 (min): at minimum → session created successfully' },
        { number: 17, condition: 'sets range',       testCase: 'sets: 1 (min + 1): above minimum → session created successfully' },
        { number: 18, condition: 'sets range',       testCase: 'sets: 5 (max - 1): below maximum → session created successfully' },
        { number: 19, condition: 'sets range',       testCase: 'sets: 6 (max): at maximum → session created successfully' },
        { number: 20, condition: 'sets range',       testCase: 'sets: 7 (max + 1): above maximum → operation fails with message "Invalid exercises"' },
        // ── reps ─────────────────────────────────────────────────────────────
        { number: 21, condition: 'reps range',       testCase: 'reps: -1 (min - 1): below minimum → operation fails with message "Invalid exercises"' },
        { number: 22, condition: 'reps range',       testCase: 'reps: 0 (min): at minimum → session created successfully' },
        { number: 23, condition: 'reps range',       testCase: 'reps: 1 (min + 1): above minimum → session created successfully' },
        { number: 24, condition: 'reps range',       testCase: 'reps: 29 (max - 1): below maximum → session created successfully' },
        { number: 25, condition: 'reps range',       testCase: 'reps: 30 (max): at maximum → session created successfully' },
        { number: 26, condition: 'reps range',       testCase: 'reps: 31 (max + 1): above maximum → operation fails with message "Invalid exercises"' },
        // ── weight ───────────────────────────────────────────────────────────
        { number: 27, condition: 'weight range',     testCase: 'weight: -0.1 (min - 0.1): below minimum → operation fails with message "Invalid exercises"' },
        { number: 28, condition: 'weight range',     testCase: 'weight: 0 (min): at minimum → session created successfully' },
        { number: 29, condition: 'weight range',     testCase: 'weight: 0.1 (min + 0.1): above minimum → session created successfully' },
        { number: 30, condition: 'weight range',     testCase: 'weight: 499.9 (max - 0.1): below maximum → session created successfully' },
        { number: 31, condition: 'weight range',     testCase: 'weight: 500 (max): at maximum → session created successfully' },
        { number: 32, condition: 'weight range',     testCase: 'weight: 500.1 (max + 0.1): above maximum → operation fails with message "Invalid exercises"' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (memberId=0)',   inputData: 'all session fields valid, memberId: "" (empty string)',                                                        expected: 'validation fails: memberId field error returned' },
        { noTc: 2,  bva: 'BVA-2  (memberId=1)',   inputData: 'all session fields valid, memberId: "A" (1 character), session is created successfully',                      expected: 'session created successfully, returned data memberId is "A"' },
        { noTc: 3,  bva: 'BVA-3  (memberId=2)',   inputData: 'all session fields valid, memberId: "AB" (2 characters), session is created successfully',                    expected: 'session created successfully, returned data memberId is "AB"' },
        { noTc: 4,  bva: 'BVA-4  (dur=-1)',       inputData: 'all session fields valid, duration: -1',                                                                      expected: 'validation fails: duration field error returned' },
        { noTc: 5,  bva: 'BVA-5  (dur=0)',        inputData: 'all session fields valid, duration: 0, session is created successfully',                                      expected: 'session created successfully, returned data duration is 0' },
        { noTc: 6,  bva: 'BVA-6  (dur=1)',        inputData: 'all session fields valid, duration: 1, session is created successfully',                                      expected: 'session created successfully, returned data duration is 1' },
        { noTc: 7,  bva: 'BVA-7  (dur=179)',      inputData: 'all session fields valid, duration: 179, session is created successfully',                                    expected: 'session created successfully, returned data duration is 179' },
        { noTc: 8,  bva: 'BVA-8  (dur=180)',      inputData: 'all session fields valid, duration: 180, session is created successfully',                                    expected: 'session created successfully, returned data duration is 180' },
        { noTc: 9,  bva: 'BVA-9  (dur=181)',      inputData: 'all session fields valid, duration: 181',                                                                     expected: 'validation fails: duration field error returned' },
        { noTc: 10, bva: 'BVA-10 (notes=0)',      inputData: 'all session fields valid, notes: "" (empty string), session is created successfully',                         expected: 'session created successfully, returned data notes is ""' },
        { noTc: 11, bva: 'BVA-11 (notes=1)',      inputData: 'all session fields valid, notes: "A" (1 character), session is created successfully',                         expected: 'session created successfully, returned data notes is "A"' },
        { noTc: 12, bva: 'BVA-12 (notes=1023)',   inputData: 'all session fields valid, notes: "A".repeat(1023), session is created successfully',                          expected: 'session created successfully, returned data notes matches the input' },
        { noTc: 13, bva: 'BVA-13 (notes=1024)',   inputData: 'all session fields valid, notes: "A".repeat(1024), session is created successfully',                          expected: 'session created successfully, returned data notes matches the input' },
        { noTc: 14, bva: 'BVA-14 (notes=1025)',   inputData: 'all session fields valid, notes: "A".repeat(1025)',                                                           expected: 'validation fails: notes field error returned' },
        { noTc: 15, bva: 'BVA-15 (sets=-1)',      inputData: 'all session fields valid, one exercise with sets: -1',                                                        expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 16, bva: 'BVA-16 (sets=0)',       inputData: 'all session fields valid, one exercise with sets: 0, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 17, bva: 'BVA-17 (sets=1)',       inputData: 'all session fields valid, one exercise with sets: 1, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 18, bva: 'BVA-18 (sets=5)',       inputData: 'all session fields valid, one exercise with sets: 5, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 19, bva: 'BVA-19 (sets=6)',       inputData: 'all session fields valid, one exercise with sets: 6, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 20, bva: 'BVA-20 (sets=7)',       inputData: 'all session fields valid, one exercise with sets: 7',                                                         expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 21, bva: 'BVA-21 (reps=-1)',      inputData: 'all session fields valid, one exercise with reps: -1',                                                        expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 22, bva: 'BVA-22 (reps=0)',       inputData: 'all session fields valid, one exercise with reps: 0, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 23, bva: 'BVA-23 (reps=1)',       inputData: 'all session fields valid, one exercise with reps: 1, session is created successfully',                        expected: 'session created successfully' },
        { noTc: 24, bva: 'BVA-24 (reps=29)',      inputData: 'all session fields valid, one exercise with reps: 29, session is created successfully',                       expected: 'session created successfully' },
        { noTc: 25, bva: 'BVA-25 (reps=30)',      inputData: 'all session fields valid, one exercise with reps: 30, session is created successfully',                       expected: 'session created successfully' },
        { noTc: 26, bva: 'BVA-26 (reps=31)',      inputData: 'all session fields valid, one exercise with reps: 31',                                                        expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 27, bva: 'BVA-27 (weight=-0.1)',  inputData: 'all session fields valid, one exercise with weight: -0.1',                                                    expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 28, bva: 'BVA-28 (weight=0)',     inputData: 'all session fields valid, one exercise with weight: 0, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 29, bva: 'BVA-29 (weight=0.1)',   inputData: 'all session fields valid, one exercise with weight: 0.1, session is created successfully',                    expected: 'session created successfully' },
        { noTc: 30, bva: 'BVA-30 (weight=499.9)', inputData: 'all session fields valid, one exercise with weight: 499.9, session is created successfully',                  expected: 'session created successfully' },
        { noTc: 31, bva: 'BVA-31 (weight=500)',   inputData: 'all session fields valid, one exercise with weight: 500, session is created successfully',                    expected: 'session created successfully' },
        { noTc: 32, bva: 'BVA-32 (weight=500.1)', inputData: 'all session fields valid, one exercise with weight: 500.1',                                                   expected: 'operation fails with message "Invalid exercises"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all session fields valid, one valid exercise provided, session is created successfully',                       expected: 'session created successfully, returned data matches the created session' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'all session fields valid, two valid exercises provided, session is created successfully',                      expected: 'session created successfully, returned data exercises has length 2' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'all session fields valid except notes omitted, session is created successfully',                              expected: 'session created successfully, returned data notes is null' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'all session fields valid, notes: "" (empty string), session is created successfully',                         expected: 'session created successfully, returned data notes is ""' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'all session fields valid, memberId field omitted',                                                            expected: 'validation fails: memberId field error returned' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'all session fields valid, memberId: "   " (whitespace-only)',                                                 expected: 'validation fails: memberId field error returned' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'all session fields valid, date field omitted',                                                                expected: 'validation fails: date field error returned' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'all session fields valid, date: "15/06/2024" (DD/MM/YYYY, wrong format)',                                     expected: 'validation fails: date field error returned' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'all session fields valid, duration field omitted',                                                            expected: 'validation fails: duration field error returned' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'all session fields valid, exercises: [] (empty array)',                                                       expected: 'operation fails with message "At least one exercise is required"' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'all session fields valid, one exercise with exerciseId omitted',                                              expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: 'all session fields valid, one valid exercise, member does not exist (NotFoundError "Member not found")',       expected: 'operation fails with message "Member not found"' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: 'all session fields valid, one valid exercise, a database transaction failure occurs (TransactionError "DB failure")', expected: 'operation fails with message "DB failure"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────
        { noTc: 14, fromEc: '', fromBva: 'BVA-1',  inputData: 'all session fields valid, memberId: "" (empty string)',                                                      expected: 'validation fails: memberId field error returned' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-2',  inputData: 'all session fields valid, memberId: "A" (1 character), session is created successfully',                    expected: 'session created successfully, returned data memberId is "A"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-3',  inputData: 'all session fields valid, memberId: "AB" (2 characters), session is created successfully',                  expected: 'session created successfully, returned data memberId is "AB"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-4',  inputData: 'all session fields valid, duration: -1',                                                                    expected: 'validation fails: duration field error returned' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-5',  inputData: 'all session fields valid, duration: 0, session is created successfully',                                    expected: 'session created successfully, returned data duration is 0' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-6',  inputData: 'all session fields valid, duration: 1, session is created successfully',                                    expected: 'session created successfully, returned data duration is 1' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-7',  inputData: 'all session fields valid, duration: 179, session is created successfully',                                  expected: 'session created successfully, returned data duration is 179' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-8',  inputData: 'all session fields valid, duration: 180, session is created successfully',                                  expected: 'session created successfully, returned data duration is 180' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-9',  inputData: 'all session fields valid, duration: 181',                                                                   expected: 'validation fails: duration field error returned' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-10', inputData: 'all session fields valid, notes: "" (empty string), session is created successfully',                       expected: 'session created successfully, returned data notes is ""' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-11', inputData: 'all session fields valid, notes: "A" (1 character), session is created successfully',                       expected: 'session created successfully, returned data notes is "A"' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-12', inputData: 'all session fields valid, notes: "A".repeat(1023), session is created successfully',                        expected: 'session created successfully, returned data notes matches the input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-13', inputData: 'all session fields valid, notes: "A".repeat(1024), session is created successfully',                        expected: 'session created successfully, returned data notes matches the input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-14', inputData: 'all session fields valid, notes: "A".repeat(1025)',                                                         expected: 'validation fails: notes field error returned' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-15', inputData: 'all session fields valid, one exercise with sets: -1',                                                      expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-16', inputData: 'all session fields valid, one exercise with sets: 0, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-17', inputData: 'all session fields valid, one exercise with sets: 1, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-18', inputData: 'all session fields valid, one exercise with sets: 5, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-19', inputData: 'all session fields valid, one exercise with sets: 6, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-20', inputData: 'all session fields valid, one exercise with sets: 7',                                                       expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-21', inputData: 'all session fields valid, one exercise with reps: -1',                                                      expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-22', inputData: 'all session fields valid, one exercise with reps: 0, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-23', inputData: 'all session fields valid, one exercise with reps: 1, session is created successfully',                      expected: 'session created successfully' },
        { noTc: 37, fromEc: '', fromBva: 'BVA-24', inputData: 'all session fields valid, one exercise with reps: 29, session is created successfully',                     expected: 'session created successfully' },
        { noTc: 38, fromEc: '', fromBva: 'BVA-25', inputData: 'all session fields valid, one exercise with reps: 30, session is created successfully',                     expected: 'session created successfully' },
        { noTc: 39, fromEc: '', fromBva: 'BVA-26', inputData: 'all session fields valid, one exercise with reps: 31',                                                      expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 40, fromEc: '', fromBva: 'BVA-27', inputData: 'all session fields valid, one exercise with weight: -0.1',                                                  expected: 'operation fails with message "Invalid exercises"' },
        { noTc: 41, fromEc: '', fromBva: 'BVA-28', inputData: 'all session fields valid, one exercise with weight: 0, session is created successfully',                    expected: 'session created successfully' },
        { noTc: 42, fromEc: '', fromBva: 'BVA-29', inputData: 'all session fields valid, one exercise with weight: 0.1, session is created successfully',                  expected: 'session created successfully' },
        { noTc: 43, fromEc: '', fromBva: 'BVA-30', inputData: 'all session fields valid, one exercise with weight: 499.9, session is created successfully',                expected: 'session created successfully' },
        { noTc: 44, fromEc: '', fromBva: 'BVA-31', inputData: 'all session fields valid, one exercise with weight: 500, session is created successfully',                  expected: 'session created successfully' },
        { noTc: 45, fromEc: '', fromBva: 'BVA-32', inputData: 'all session fields valid, one exercise with weight: 500.1',                                                 expected: 'operation fails with message "Invalid exercises"' },
    ],
};

const getWorkoutSessionCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-23',
    tcCount: 6,
    statement: 'getWorkoutSession(id) – Looks up a workout session by the provided id and returns an ActionResult<WorkoutSessionWithExercises>. Returns success with the matching session on success. Returns a failure with the service error message for NotFoundError. Returns a failure with message "An unexpected error occurred" for any other unexpected error.',
    data: 'Input: id: string',
    precondition: 'A known session id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'On success: session retrieved successfully, returned data matches the stored session. On NotFoundError: operation fails with the service error message. On unexpected error: operation fails with message "An unexpected error occurred".',
    ecRows: [
        { number: 1, condition: 'ID existence',    validEc: 'Known existing id → session retrieved successfully, returned data matches the stored session', invalidEc: '' },
        { number: 2, condition: 'ID existence',    validEc: '', invalidEc: 'Non-existent id (NotFoundError "Session not found") → operation fails with message "Session not found"' },
        { number: 3, condition: 'Error type',      validEc: '', invalidEc: 'Unexpected error occurs → operation fails with message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing session id, session is retrieved successfully',                                         expected: 'session retrieved successfully, returned data matches the stored session' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Session not found")',                       expected: 'operation fails with message "Session not found"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing session id, an unexpected error occurs during retrieval',                               expected: 'operation fails with message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'id: "" (length 0): no record can match → operation fails with message "Session not found"' },
        { number: 2, condition: 'ID length', testCase: 'id: "a" (length 1), no matching record exists → operation fails with message "Session not found"' },
        { number: 3, condition: 'ID length', testCase: 'id: "a" (length 1), a matching session record exists → session retrieved successfully, returned data id is "a"' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)',      inputData: 'id: "" (empty string), no matching record exists (NotFoundError "Session not found")',                    expected: 'operation fails with message "Session not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1, miss)', inputData: 'id: "a" (1 character), no matching record exists (NotFoundError "Session not found")',                   expected: 'operation fails with message "Session not found"' },
        { noTc: 3, bva: 'BVA-3 (len=1, hit)',  inputData: 'id: "a" (1 character), a matching session record exists with id "a", session is retrieved successfully', expected: 'session retrieved successfully, returned data id is "a"' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing session id, session is retrieved successfully',                                         expected: 'session retrieved successfully, returned data matches the stored session' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'non-existent id, no matching record exists (NotFoundError "Session not found")',                       expected: 'operation fails with message "Session not found"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',       inputData: 'known existing session id, an unexpected error occurs during retrieval',                               expected: 'operation fails with message "An unexpected error occurred"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1',      inputData: 'id: "" (empty string), no matching record exists (NotFoundError "Session not found")',                 expected: 'operation fails with message "Session not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-2',      inputData: 'id: "a" (1 character), no matching record exists (NotFoundError "Session not found")',                 expected: 'operation fails with message "Session not found"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-3',      inputData: 'id: "a" (1 character), a matching session record exists with id "a", session is retrieved successfully', expected: 'session retrieved successfully, returned data id is "a"' },
    ],
};

const listMemberWorkoutSessionsCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-24',
    tcCount: 9,
    statement: 'listMemberWorkoutSessions(memberId, options?) – Lists workout sessions for a member and returns an ActionResult<Page<WorkoutSessionWithExercises>>. Returns success with a paginated page of sessions on success. Accepts an optional options object for filtering by date range (startDate, endDate) and for pagination (page, pageSize). When no pagination options are provided, sessions are returned in ascending date order. When pagination options are provided, sessions are returned in descending date order. Returns a failure with the service error message for AppError (e.g. NotFoundError).',
    data: 'Input: memberId: string, options?: WorkoutSessionListOptions { startDate?: Date, endDate?: Date, page?: number, pageSize?: number }',
    precondition: 'A known member id exists in the store. An empty memberId returns an empty page rather than an error. page: 0-based index; pageSize: minimum 1.',
    results: 'Output: Promise<ActionResult<Page<WorkoutSessionWithExercises>>>',
    postcondition: 'On success: sessions retrieved, returned data is a page with items and total. On AppError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'memberId validity',  validEc: 'Known existing memberId → sessions retrieved successfully, returned page has items and total', invalidEc: '' },
        { number: 2, condition: 'options presence',   validEc: 'Date range options provided (startDate, endDate) → sessions retrieved successfully', invalidEc: '' },
        { number: 3, condition: 'Sort order',         validEc: 'Multiple sessions, no pagination options → sessions returned in ascending date order (older first)', invalidEc: '' },
        { number: 4, condition: 'Sort order',         validEc: 'Multiple sessions with pagination options → sessions returned in descending date order (newer first)', invalidEc: '' },
        { number: 5, condition: 'Service error',      validEc: '', invalidEc: 'Member does not exist (NotFoundError "Member not found") → operation fails with message "Member not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing memberId, no options provided, one session exists',                                                                   expected: 'sessions retrieved successfully, returned page items has length 1 and total is 1' },
        { noTc: 2, ec: 'EC-2', inputData: 'known existing memberId, options with startDate: new Date("2024-01-01") and endDate: new Date("2024-12-31") provided',               expected: 'sessions retrieved successfully' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing memberId, no options provided, two sessions exist with dates "2024-01-01" (older) and "2024-12-31" (newer)',          expected: 'sessions retrieved successfully, first item has id "older", second item has id "newer"' },
        { noTc: 4, ec: 'EC-4', inputData: 'known existing memberId, pagination options { page: 1, pageSize: 10 } provided, two sessions exist with dates "2024-01-01" (older) and "2024-12-01" (newer)', expected: 'sessions retrieved successfully, first item has id "newer", second item has id "older"' },
        { noTc: 5, ec: 'EC-5', inputData: 'known existing memberId, member does not exist (NotFoundError "Member not found")',                                                   expected: 'operation fails with message "Member not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'memberId length',  testCase: 'memberId: "" (length 0): service returns empty page → sessions retrieved successfully, returned page items has length 0' },
        { number: 2, condition: 'memberId length',  testCase: 'memberId: "A" (length 1, min): shortest non-empty id → sessions retrieved successfully' },
        { number: 3, condition: 'page value',       testCase: 'page: 0 (first page): valid boundary → sessions retrieved successfully' },
        { number: 4, condition: 'pageSize value',   testCase: 'pageSize: 1 (minimum): one item per page → returned page items has length 1' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (memberId=0)',   inputData: 'memberId: "" (empty string), service returns an empty page',                                           expected: 'sessions retrieved successfully, returned page items has length 0' },
        { noTc: 2, bva: 'BVA-2 (memberId=1)',   inputData: 'memberId: "A" (1 character), service returns matching sessions successfully',                          expected: 'sessions retrieved successfully' },
        { noTc: 3, bva: 'BVA-3 (page=0)',       inputData: 'known existing memberId, options: { page: 0 }, service returns the first page of sessions',            expected: 'sessions retrieved successfully' },
        { noTc: 4, bva: 'BVA-4 (pageSize=1)',   inputData: 'known existing memberId, options: { pageSize: 1 }, service returns a page with exactly one item',      expected: 'sessions retrieved successfully, returned page items has length 1' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',     inputData: 'known existing memberId, no options provided, one session exists',                                                                   expected: 'sessions retrieved successfully, returned page items has length 1 and total is 1' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',     inputData: 'known existing memberId, options with startDate: new Date("2024-01-01") and endDate: new Date("2024-12-31") provided',               expected: 'sessions retrieved successfully' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',     inputData: 'known existing memberId, no options provided, two sessions exist with dates "2024-01-01" (older) and "2024-12-31" (newer)',          expected: 'sessions retrieved successfully, first item has id "older", second item has id "newer"' },
        { noTc: 4, fromEc: 'EC-4', fromBva: '',     inputData: 'known existing memberId, pagination options { page: 1, pageSize: 10 } provided, two sessions exist with dates "2024-01-01" (older) and "2024-12-01" (newer)', expected: 'sessions retrieved successfully, first item has id "newer", second item has id "older"' },
        { noTc: 5, fromEc: 'EC-5', fromBva: '',     inputData: 'known existing memberId, member does not exist (NotFoundError "Member not found")',                                                   expected: 'operation fails with message "Member not found"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-1',   inputData: 'memberId: "" (empty string), service returns an empty page',                                                                         expected: 'sessions retrieved successfully, returned page items has length 0' },
        { noTc: 7, fromEc: '', fromBva: 'BVA-2',   inputData: 'memberId: "A" (1 character), service returns matching sessions successfully',                                                        expected: 'sessions retrieved successfully' },
        { noTc: 8, fromEc: '', fromBva: 'BVA-3',   inputData: 'known existing memberId, options: { page: 0 }, service returns the first page of sessions',                                         expected: 'sessions retrieved successfully' },
        { noTc: 9, fromEc: '', fromBva: 'BVA-4',   inputData: 'known existing memberId, options: { pageSize: 1 }, service returns a page with exactly one item',                                   expected: 'sessions retrieved successfully, returned page items has length 1' },
    ],
};

const updateWorkoutSessionCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-25',
    tcCount: 9,
    statement: 'updateWorkoutSession(id, data) – Validates the partial update input and returns an ActionResult<WorkoutSession>. Returns success with the updated session on success. An empty update object is accepted and returns the unchanged session. Returns a field-level validation error when duration or date are invalid. duration must be 0–180 (inclusive). date, when provided, must be in YYYY-MM-DD format. Returns a failure with the service error message for NotFoundError.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput { duration?: number, date?: string, notes?: string, ...optional }',
    precondition: 'A known session id exists in the store. A non-existent id has no matching record. duration: 0–180 inclusive when provided. date: YYYY-MM-DD format when provided. notes: max 1024 characters when provided.',
    results: 'Output: Promise<ActionResult<WorkoutSession>>',
    postcondition: 'On success: session updated successfully, returned data reflects the applied changes. On validation failure: field-level validation error returned, the service is not called. On NotFoundError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',     validEc: 'All provided fields valid (duration: 75) → session updated successfully, returned data duration is 75', invalidEc: '' },
        { number: 2, condition: 'Input completeness', validEc: 'Empty update object {} → session updated successfully (no changes applied)', invalidEc: '' },
        { number: 3, condition: 'duration value',     validEc: '', invalidEc: 'duration: -5 (below minimum) → validation fails: duration field error returned' },
        { number: 4, condition: 'date format',        validEc: '', invalidEc: 'date: "2024.01.01" (invalid format) → validation fails: date field error returned' },
        { number: 5, condition: 'ID existence',       validEc: '', invalidEc: 'Non-existent id (NotFoundError "Not found") → operation fails with message "Not found"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing session id, update data with duration: 75, session is updated successfully',          expected: 'session updated successfully, returned data duration is 75' },
        { noTc: 2, ec: 'EC-2', inputData: 'known existing session id, update data: {} (empty object), session is updated successfully',         expected: 'session updated successfully' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing session id, update data with duration: -5',                                           expected: 'validation fails: duration field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'known existing session id, update data with date: "2024.01.01" (invalid format)',                    expected: 'validation fails: date field error returned' },
        { noTc: 5, ec: 'EC-5', inputData: 'non-existent id, valid update data, no matching record exists (NotFoundError "Not found")',           expected: 'operation fails with message "Not found"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length',     testCase: 'id: "a" (length 1), a matching session record exists → session updated successfully, returned data id is "a"' },
        { number: 2, condition: 'ID length',     testCase: 'id: "a" (length 1), no matching record exists (NotFoundError "Not found") → operation fails with message "Not found"' },
        { number: 3, condition: 'duration range', testCase: 'duration: 0 (min): at minimum → session updated successfully' },
        { number: 4, condition: 'notes length',  testCase: 'notes: "A".repeat(1024) (max): at maximum → session updated successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id=1, hit)',    inputData: 'id: "a" (1 character), valid update data, a matching session record exists with id "a", session is updated successfully',  expected: 'session updated successfully, returned data id is "a"' },
        { noTc: 2, bva: 'BVA-2 (id=1, miss)',   inputData: 'id: "a" (1 character), valid update data, no matching record exists (NotFoundError "Not found")',                           expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (dur=0)',        inputData: 'known existing session id, update data with duration: 0, session is updated successfully',                                  expected: 'session updated successfully' },
        { noTc: 4, bva: 'BVA-4 (notes=1024)',   inputData: 'known existing session id, update data with notes: "A".repeat(1024), session is updated successfully',                     expected: 'session updated successfully' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',       inputData: 'known existing session id, update data with duration: 75, session is updated successfully',          expected: 'session updated successfully, returned data duration is 75' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',       inputData: 'known existing session id, update data: {} (empty object), session is updated successfully',         expected: 'session updated successfully' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',       inputData: 'known existing session id, update data with duration: -5',                                           expected: 'validation fails: duration field error returned' },
        { noTc: 4, fromEc: 'EC-4', fromBva: '',       inputData: 'known existing session id, update data with date: "2024.01.01" (invalid format)',                    expected: 'validation fails: date field error returned' },
        { noTc: 5, fromEc: 'EC-5', fromBva: '',       inputData: 'non-existent id, valid update data, no matching record exists (NotFoundError "Not found")',           expected: 'operation fails with message "Not found"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-1',      inputData: 'id: "a" (1 character), valid update data, a matching session record exists with id "a", session is updated successfully', expected: 'session updated successfully, returned data id is "a"' },
        { noTc: 7, fromEc: '', fromBva: 'BVA-2',      inputData: 'id: "a" (1 character), valid update data, no matching record exists (NotFoundError "Not found")',    expected: 'operation fails with message "Not found"' },
        { noTc: 8, fromEc: '', fromBva: 'BVA-3',      inputData: 'known existing session id, update data with duration: 0, session is updated successfully',           expected: 'session updated successfully' },
        { noTc: 9, fromEc: '', fromBva: 'BVA-4',      inputData: 'known existing session id, update data with notes: "A".repeat(1024), session is updated successfully', expected: 'session updated successfully' },
    ],
};

const updateWorkoutSessionWithExercisesCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-26',
    tcCount: 8,
    statement: 'updateWorkoutSessionWithExercises(id, data, exercises) – Validates the partial session update input and the exercises array, then returns an ActionResult<WorkoutSessionWithExercises>. Returns success with the updated session and all exercises on success. Returns a failure with message "At least one exercise is required" when the exercises array is empty. Returns a field-level validation error when session fields are invalid. Returns a failure with the service error message for TransactionError and NotFoundError.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'A known session id exists in the store. exercises array must contain at least one element. Per-exercise field ranges are the same as for createWorkoutSession (sets: 0–6, reps: 0–30, weight: 0.0–500.0).',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'On success: session and exercises updated successfully, returned data reflects the applied changes. On empty exercises: operation fails with message "At least one exercise is required". On session validation failure: field-level validation error returned, the service is not called. On TransactionError or NotFoundError: operation fails with the service error message.',
    ecRows: [
        { number: 1, condition: 'Input validity',   validEc: 'All session fields and exercises valid → session updated successfully, returned data matches the updated session', invalidEc: '' },
        { number: 2, condition: 'exercises array',  validEc: '', invalidEc: 'exercises: [] (empty array) → operation fails with message "At least one exercise is required"' },
        { number: 3, condition: 'Session fields',   validEc: '', invalidEc: 'Session data with duration: 1000 (above maximum) → validation fails: duration field error returned' },
        { number: 4, condition: 'Service error',    validEc: '', invalidEc: 'A database transaction failure occurs (TransactionError "DB failure") → operation fails with message "DB failure"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing session id, valid update data, valid exercises array, session is updated successfully',                                 expected: 'session updated successfully, returned data matches the updated session' },
        { noTc: 2, ec: 'EC-2', inputData: 'known existing session id, valid update data, exercises: [] (empty array)',                                                           expected: 'operation fails with message "At least one exercise is required"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing session id, update data with duration: 1000 (above maximum), valid exercises array',                                  expected: 'validation fails: duration field error returned' },
        { noTc: 4, ec: 'EC-4', inputData: 'known existing session id, valid update data, valid exercises array, a database transaction failure occurs (TransactionError "DB failure")', expected: 'operation fails with message "DB failure"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length',   testCase: 'id: "a" (length 1), a matching session record exists → session updated successfully, returned data id is "a"' },
        { number: 2, condition: 'ID length',   testCase: 'id: "a" (length 1), no matching record exists (NotFoundError "Not found") → operation fails with message "Not found"' },
        { number: 3, condition: 'reps range',  testCase: 'reps: 30 (max): at maximum → session updated successfully' },
        { number: 4, condition: 'weight range', testCase: 'weight: 500 (max): at maximum → session updated successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (id=1, hit)',    inputData: 'id: "a" (1 character), valid update data, valid exercises array, a matching session record exists with id "a", session is updated successfully', expected: 'session updated successfully, returned data id is "a"' },
        { noTc: 2, bva: 'BVA-2 (id=1, miss)',   inputData: 'id: "a" (1 character), valid update data, valid exercises array, no matching record exists (NotFoundError "Not found")',                         expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (reps=30)',      inputData: 'known existing session id, valid update data, one exercise with reps: 30 (maximum), session is updated successfully',                            expected: 'session updated successfully' },
        { noTc: 4, bva: 'BVA-4 (weight=500)',   inputData: 'known existing session id, valid update data, one exercise with weight: 500 (maximum), session is updated successfully',                         expected: 'session updated successfully' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',     inputData: 'known existing session id, valid update data, valid exercises array, session is updated successfully',                                 expected: 'session updated successfully, returned data matches the updated session' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',     inputData: 'known existing session id, valid update data, exercises: [] (empty array)',                                                           expected: 'operation fails with message "At least one exercise is required"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',     inputData: 'known existing session id, update data with duration: 1000 (above maximum), valid exercises array',                                  expected: 'validation fails: duration field error returned' },
        { noTc: 4, fromEc: 'EC-4', fromBva: '',     inputData: 'known existing session id, valid update data, valid exercises array, a database transaction failure occurs (TransactionError "DB failure")', expected: 'operation fails with message "DB failure"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-1',    inputData: 'id: "a" (1 character), valid update data, valid exercises array, a matching session record exists with id "a", session is updated successfully', expected: 'session updated successfully, returned data id is "a"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-2',    inputData: 'id: "a" (1 character), valid update data, valid exercises array, no matching record exists (NotFoundError "Not found")',             expected: 'operation fails with message "Not found"' },
        { noTc: 7, fromEc: '', fromBva: 'BVA-3',    inputData: 'known existing session id, valid update data, one exercise with reps: 30 (maximum), session is updated successfully',                expected: 'session updated successfully' },
        { noTc: 8, fromEc: '', fromBva: 'BVA-4',    inputData: 'known existing session id, valid update data, one exercise with weight: 500 (maximum), session is updated successfully',             expected: 'session updated successfully' },
    ],
};

const deleteWorkoutSessionCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-27',
    tcCount: 6,
    statement: 'deleteWorkoutSession(id) – Deletes the workout session identified by id and returns an ActionResult<void>. Returns success with undefined data on success. Returns a failure with the service error message for NotFoundError. Returns a failure with message "An unexpected error occurred" for any other unexpected error.',
    data: 'Input: id: string',
    precondition: 'A known session id exists in the store. A non-existent id has no matching record.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'On success: session deleted successfully, returned data is undefined. On NotFoundError: operation fails with the service error message. On unexpected error: operation fails with message "An unexpected error occurred".',
    ecRows: [
        { number: 1, condition: 'ID existence', validEc: 'Known existing id → session deleted successfully, returned data is undefined', invalidEc: '' },
        { number: 2, condition: 'ID existence', validEc: '', invalidEc: 'Non-existent id (NotFoundError "Not found") → operation fails with message "Not found"' },
        { number: 3, condition: 'Error type',   validEc: '', invalidEc: 'Unexpected error occurs → operation fails with message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'known existing session id, session is deleted successfully',                          expected: 'session deleted successfully, returned data is undefined' },
        { noTc: 2, ec: 'EC-2', inputData: 'non-existent id, no matching record exists (NotFoundError "Not found")',               expected: 'operation fails with message "Not found"' },
        { noTc: 3, ec: 'EC-3', inputData: 'known existing session id, an unexpected error occurs during deletion',               expected: 'operation fails with message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1, condition: 'ID length', testCase: 'id: "" (length 0): no record can match (NotFoundError "Not found") → operation fails with message "Not found"' },
        { number: 2, condition: 'ID length', testCase: 'id: "a" (length 1), no matching record exists (NotFoundError "Not found") → operation fails with message "Not found"' },
        { number: 3, condition: 'ID length', testCase: 'id: "a" (length 1), a matching session record exists → session deleted successfully' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (len=0)',       inputData: 'id: "" (empty string), no matching record exists (NotFoundError "Not found")',                          expected: 'operation fails with message "Not found"' },
        { noTc: 2, bva: 'BVA-2 (len=1, miss)', inputData: 'id: "a" (1 character), no matching record exists (NotFoundError "Not found")',                         expected: 'operation fails with message "Not found"' },
        { noTc: 3, bva: 'BVA-3 (len=1, hit)',  inputData: 'id: "a" (1 character), a matching session record exists with id "a", session is deleted successfully', expected: 'session deleted successfully, returned data is undefined' },
    ],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '',     inputData: 'known existing session id, session is deleted successfully',                                          expected: 'session deleted successfully, returned data is undefined' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '',     inputData: 'non-existent id, no matching record exists (NotFoundError "Not found")',                               expected: 'operation fails with message "Not found"' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '',     inputData: 'known existing session id, an unexpected error occurs during deletion',                               expected: 'operation fails with message "An unexpected error occurred"' },
        { noTc: 4, fromEc: '', fromBva: 'BVA-1',    inputData: 'id: "" (empty string), no matching record exists (NotFoundError "Not found")',                        expected: 'operation fails with message "Not found"' },
        { noTc: 5, fromEc: '', fromBva: 'BVA-2',    inputData: 'id: "a" (1 character), no matching record exists (NotFoundError "Not found")',                        expected: 'operation fails with message "Not found"' },
        { noTc: 6, fromEc: '', fromBva: 'BVA-3',    inputData: 'id: "a" (1 character), a matching session record exists with id "a", session is deleted successfully', expected: 'session deleted successfully, returned data is undefined' },
    ],
};

const getMemberProgressReportCtrlBbt: BbtDescriptor = {
    reqId: 'CTRL-28',
    tcCount: 21,
    statement: 'getMemberProgressReport(memberId, startDate, endDate) – Validates the input parameters and returns an ActionResult<Report>. Returns success with the generated report on success. memberId must be a non-empty, non-whitespace-only string; surrounding whitespace is trimmed before validation. startDate and endDate must be present and in YYYY-MM-DD format. A report with no sessions in range returns zero-valued aggregates. Exercise breakdown is sorted by totalVolume descending. Returns a field-level validation error for schema failures without calling the service. Returns a failure with the service error message for NotFoundError. Returns a failure with message "An unexpected error occurred" for any other unexpected error.',
    data: 'Input: memberId: string, startDate: string (YYYY-MM-DD), endDate: string (YYYY-MM-DD)',
    precondition: 'memberId: non-empty, non-whitespace-only string (trimmed before validation). startDate and endDate: YYYY-MM-DD format, both required. startDate equal to endDate is accepted (single-day range).',
    results: 'Output: Promise<ActionResult<Report>>',
    postcondition: 'On success: report generated successfully, returned data contains memberId, aggregated stats, exerciseBreakdown sorted by totalVolume descending, and sessionDetails. On validation failure: field-level validation error returned, the service is not called. On NotFoundError: operation fails with the service error message. On unexpected error: operation fails with message "An unexpected error occurred".',
    ecRows: [
        { number: 1,  condition: 'Input validity',       validEc: 'All fields valid → report generated successfully, returned data contains memberId, exerciseBreakdown (length 1) and sessionDetails (length 1)', invalidEc: '' },
        { number: 2,  condition: 'Session count',        validEc: 'No sessions in the date range → report generated successfully with totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown empty', invalidEc: '' },
        { number: 3,  condition: 'Session count',        validEc: 'Two sessions in the date range → report generated successfully with totalSessions: 2, correct averageSessionDuration and totalVolume', invalidEc: '' },
        { number: 4,  condition: 'Exercise count',       validEc: 'Two distinct exercises → report generated successfully with exerciseBreakdown length 2 and correct per-exercise aggregates', invalidEc: '' },
        { number: 5,  condition: 'Exercise sort order',  validEc: 'Multiple exercises → exerciseBreakdown sorted by totalVolume descending (highest first)', invalidEc: '' },
        { number: 6,  condition: 'memberId required',    validEc: '', invalidEc: 'memberId: undefined → validation fails: memberId field error returned' },
        { number: 7,  condition: 'startDate required',   validEc: '', invalidEc: 'startDate: undefined → validation fails: startDate field error returned' },
        { number: 8,  condition: 'endDate required',     validEc: '', invalidEc: 'endDate: undefined → validation fails: endDate field error returned' },
        { number: 9,  condition: 'startDate format',     validEc: '', invalidEc: 'startDate: "2024.01.01" (invalid format) → validation fails: startDate field error returned' },
        { number: 10, condition: 'endDate format',       validEc: '', invalidEc: 'endDate: "12/31/2024" (invalid format) → validation fails: endDate field error returned' },
        { number: 11, condition: 'Service error',        validEc: '', invalidEc: 'Member does not exist (NotFoundError "Member not found") → operation fails with message "Member not found"' },
        { number: 12, condition: 'Error type',           validEc: '', invalidEc: 'Unexpected error occurs → operation fails with message "An unexpected error occurred"' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all fields valid (memberId, startDate "2024-01-01", endDate "2024-12-31"), report is generated successfully with one exercise and one session',                              expected: 'report generated successfully, returned data memberId matches, exerciseBreakdown has length 1 and sessionDetails has length 1' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'all fields valid, no sessions exist in the date range, report is generated successfully',                                                                                    expected: 'report generated successfully with totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown empty' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'all fields valid, two sessions exist in the date range (durationMinutes 60 and 90), report is generated successfully',                                                      expected: 'report generated successfully, returned data totalSessions is 2, averageSessionDuration is 75, totalVolume is 3000' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'all fields valid, two distinct exercises exist in the breakdown (Bench Press and Squat), report is generated successfully',                                                  expected: 'report generated successfully, exerciseBreakdown has length 2, second exercise name is "Squat"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'all fields valid, two exercises with totalVolume 10000 ("ex-high") and 1000 ("ex-low"), report is generated successfully with exerciseBreakdown sorted descending',         expected: 'report generated successfully, exerciseBreakdown[0].totalVolume is greater than exerciseBreakdown[1].totalVolume, exerciseBreakdown[0].exerciseId is "ex-high"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'memberId: undefined, startDate "2024-01-01", endDate "2024-12-31"',                                                                                                         expected: 'validation fails: memberId field error returned' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid memberId, startDate: undefined, endDate "2024-12-31"',                                                                                                                expected: 'validation fails: startDate field error returned' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid memberId, startDate "2024-01-01", endDate: undefined',                                                                                                                expected: 'validation fails: endDate field error returned' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid memberId, startDate: "2024.01.01" (dot-separated, invalid format), endDate "2024-12-31"',                                                                             expected: 'validation fails: startDate field error returned' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid memberId, startDate "2024-01-01", endDate: "12/31/2024" (MM/DD/YYYY, invalid format)',                                                                                 expected: 'validation fails: endDate field error returned' },
        { noTc: 11, ec: 'EC-11', inputData: 'all fields valid, member does not exist (NotFoundError "Member not found")',                                                                                                 expected: 'operation fails with message "Member not found"' },
        { noTc: 12, ec: 'EC-12', inputData: 'all fields valid, an unexpected error occurs during report generation',                                                                                                     expected: 'operation fails with message "An unexpected error occurred"' },
    ],
    bvaRows: [
        { number: 1, condition: 'memberId length',       testCase: 'memberId: "" (length 0): empty → validation fails: memberId field error returned' },
        { number: 2, condition: 'memberId length',       testCase: 'memberId: "A" (length 1, min): shortest valid id → report generated successfully, returned data memberId is "A"' },
        { number: 3, condition: 'memberId length',       testCase: 'memberId: "AB" (length 2, min + 1): above minimum → report generated successfully, returned data memberId is "AB"' },
        { number: 4, condition: 'memberId content',      testCase: 'memberId: "   " (whitespace-only): empty after trim → validation fails: memberId field error returned' },
        { number: 5, condition: 'memberId trim',         testCase: 'memberId: "  member-uuid-001  " (surrounding whitespace): trimmed before validation → report generated successfully, returned data memberId is "member-uuid-001"' },
        { number: 6, condition: 'date range boundary',   testCase: 'startDate === endDate ("2024-06-15"): single-day range → report generated successfully, returned data startDate and endDate are both 2024-06-15' },
        { number: 7, condition: 'exercise weight',       testCase: 'one exercise with weight: 0 → report generated successfully, returned data totalVolume is 0 and exerciseBreakdown[0].totalVolume is 0' },
        { number: 8, condition: 'exercise reps',         testCase: 'one exercise with reps: 0 → report generated successfully, returned data totalVolume is 0' },
        { number: 9, condition: 'session duration',      testCase: 'one session with durationMinutes: 0 → report generated successfully, returned data averageSessionDuration is 0' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (memberId=0)',      inputData: 'memberId: "" (empty string), startDate "2024-01-01", endDate "2024-12-31"',                                                                               expected: 'validation fails: memberId field error returned' },
        { noTc: 2, bva: 'BVA-2 (memberId=1)',      inputData: 'memberId: "A" (1 character), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully',                                             expected: 'report generated successfully, returned data memberId is "A"' },
        { noTc: 3, bva: 'BVA-3 (memberId=2)',      inputData: 'memberId: "AB" (2 characters), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully',                                           expected: 'report generated successfully, returned data memberId is "AB"' },
        { noTc: 4, bva: 'BVA-4 (memberId=ws)',     inputData: 'memberId: "   " (whitespace-only), startDate "2024-01-01", endDate "2024-12-31"',                                                                         expected: 'validation fails: memberId field error returned' },
        { noTc: 5, bva: 'BVA-5 (memberId=trim)',   inputData: 'memberId: "  member-uuid-001  " (surrounding whitespace), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully after trimming', expected: 'report generated successfully, returned data memberId is "member-uuid-001"' },
        { noTc: 6, bva: 'BVA-6 (same date)',       inputData: 'memberId valid, startDate: "2024-06-15", endDate: "2024-06-15" (same date, single-day range), report is generated successfully',                          expected: 'report generated successfully, returned data startDate and endDate are both the 2024-06-15 Date' },
        { noTc: 7, bva: 'BVA-7 (weight=0)',        inputData: 'all fields valid, one exercise with weight: 0 in session details, report is generated successfully',                                                      expected: 'report generated successfully, returned data totalVolume is 0 and exerciseBreakdown[0].totalVolume is 0' },
        { noTc: 8, bva: 'BVA-8 (reps=0)',          inputData: 'all fields valid, one exercise with reps: 0 in session details, report is generated successfully',                                                        expected: 'report generated successfully, returned data totalVolume is 0' },
        { noTc: 9, bva: 'BVA-9 (duration=0)',      inputData: 'all fields valid, one session with durationMinutes: 0, report is generated successfully',                                                                 expected: 'report generated successfully, returned data averageSessionDuration is 0' },
    ],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '',      inputData: 'all fields valid (memberId, startDate "2024-01-01", endDate "2024-12-31"), report is generated successfully with one exercise and one session',       expected: 'report generated successfully, returned data memberId matches, exerciseBreakdown has length 1 and sessionDetails has length 1' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '',      inputData: 'all fields valid, no sessions exist in the date range, report is generated successfully',                                                             expected: 'report generated successfully with totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown empty' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '',      inputData: 'all fields valid, two sessions exist in the date range (durationMinutes 60 and 90), report is generated successfully',                               expected: 'report generated successfully, returned data totalSessions is 2, averageSessionDuration is 75, totalVolume is 3000' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '',      inputData: 'all fields valid, two distinct exercises exist in the breakdown (Bench Press and Squat), report is generated successfully',                          expected: 'report generated successfully, exerciseBreakdown has length 2, second exercise name is "Squat"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '',      inputData: 'all fields valid, two exercises with totalVolume 10000 ("ex-high") and 1000 ("ex-low"), report is generated successfully with exerciseBreakdown sorted descending', expected: 'report generated successfully, exerciseBreakdown[0].totalVolume is greater than exerciseBreakdown[1].totalVolume, exerciseBreakdown[0].exerciseId is "ex-high"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '',      inputData: 'memberId: undefined, startDate "2024-01-01", endDate "2024-12-31"',                                                                                   expected: 'validation fails: memberId field error returned' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '',      inputData: 'valid memberId, startDate: undefined, endDate "2024-12-31"',                                                                                          expected: 'validation fails: startDate field error returned' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '',      inputData: 'valid memberId, startDate "2024-01-01", endDate: undefined',                                                                                          expected: 'validation fails: endDate field error returned' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '',      inputData: 'valid memberId, startDate: "2024.01.01" (dot-separated, invalid format), endDate "2024-12-31"',                                                       expected: 'validation fails: startDate field error returned' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '',      inputData: 'valid memberId, startDate "2024-01-01", endDate: "12/31/2024" (MM/DD/YYYY, invalid format)',                                                          expected: 'validation fails: endDate field error returned' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '',      inputData: 'all fields valid, member does not exist (NotFoundError "Member not found")',                                                                          expected: 'operation fails with message "Member not found"' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '',      inputData: 'all fields valid, an unexpected error occurs during report generation',                                                                               expected: 'operation fails with message "An unexpected error occurred"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-1',      inputData: 'memberId: "" (empty string), startDate "2024-01-01", endDate "2024-12-31"',                                                                           expected: 'validation fails: memberId field error returned' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-2',      inputData: 'memberId: "A" (1 character), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully',                                         expected: 'report generated successfully, returned data memberId is "A"' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-3',      inputData: 'memberId: "AB" (2 characters), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully',                                       expected: 'report generated successfully, returned data memberId is "AB"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-4',      inputData: 'memberId: "   " (whitespace-only), startDate "2024-01-01", endDate "2024-12-31"',                                                                     expected: 'validation fails: memberId field error returned' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-5',      inputData: 'memberId: "  member-uuid-001  " (surrounding whitespace), startDate "2024-01-01", endDate "2024-12-31", report is generated successfully after trimming', expected: 'report generated successfully, returned data memberId is "member-uuid-001"' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-6',      inputData: 'memberId valid, startDate: "2024-06-15", endDate: "2024-06-15" (same date, single-day range), report is generated successfully',                      expected: 'report generated successfully, returned data startDate and endDate are both the 2024-06-15 Date' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-7',      inputData: 'all fields valid, one exercise with weight: 0 in session details, report is generated successfully',                                                  expected: 'report generated successfully, returned data totalVolume is 0 and exerciseBreakdown[0].totalVolume is 0' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-8',      inputData: 'all fields valid, one exercise with reps: 0 in session details, report is generated successfully',                                                    expected: 'report generated successfully, returned data totalVolume is 0' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-9',      inputData: 'all fields valid, one session with durationMinutes: 0, report is generated successfully',                                                             expected: 'report generated successfully, returned data averageSessionDuration is 0' },
    ],
};

// ── main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const AUTH_CTRL = path.join(CTRL_BASE, 'auth-controller');
  const USER_CTRL = path.join(CTRL_BASE, 'user-controller');
  const EXM_CTRL  = path.join(CTRL_BASE, 'exercise-controller');
  const WS_CTRL   = path.join(CTRL_BASE, 'workout-session-controller');
  const RPT_CTRL  = path.join(CTRL_BASE, 'report-controller');

  console.log('Generating controller BBT forms…');
  await writeBbt(loginCtrlBbt, path.join(AUTH_CTRL, 'login-bbt-form.xlsx'));
  await writeBbt(logoutCtrlBbt, path.join(AUTH_CTRL, 'logout-bbt-form.xlsx'));
  await writeBbt(createMemberCtrlBbt, path.join(USER_CTRL, 'createMember-bbt-form.xlsx'));
  await writeBbt(createMemberWithTempPasswordCtrlBbt, path.join(USER_CTRL, 'createMemberWithTempPassword-bbt-form.xlsx'));
  await writeBbt(createAdminCtrlBbt, path.join(USER_CTRL, 'createAdmin-bbt-form.xlsx'));
  await writeBbt(getMemberCtrlBbt, path.join(USER_CTRL, 'getMember-bbt-form.xlsx'));
  await writeBbt(getAdminCtrlBbt, path.join(USER_CTRL, 'getAdmin-bbt-form.xlsx'));
  await writeBbt(listMembersCtrlBbt, path.join(USER_CTRL, 'listMembers-bbt-form.xlsx'));
  await writeBbt(listAdminsCtrlBbt, path.join(USER_CTRL, 'listAdmins-bbt-form.xlsx'));
  await writeBbt(updateMemberCtrlBbt, path.join(USER_CTRL, 'updateMember-bbt-form.xlsx'));
  await writeBbt(updateAdminCtrlBbt, path.join(USER_CTRL, 'updateAdmin-bbt-form.xlsx'));
  await writeBbt(suspendMemberCtrlBbt, path.join(USER_CTRL, 'suspendMember-bbt-form.xlsx'));
  await writeBbt(activateMemberCtrlBbt, path.join(USER_CTRL, 'activateMember-bbt-form.xlsx'));
  await writeBbt(deleteMemberCtrlBbt, path.join(USER_CTRL, 'deleteMember-bbt-form.xlsx'));
  await writeBbt(deleteAdminCtrlBbt, path.join(USER_CTRL, 'deleteAdmin-bbt-form.xlsx'));
  await writeBbt(createExerciseCtrlBbt, path.join(EXM_CTRL, 'createExercise-bbt-form.xlsx'));
  await writeBbt(getExerciseCtrlBbt, path.join(EXM_CTRL, 'getExercise-bbt-form.xlsx'));
  await writeBbt(listExercisesCtrlBbt, path.join(EXM_CTRL, 'listExercises-bbt-form.xlsx'));
  await writeBbt(updateExerciseCtrlBbt, path.join(EXM_CTRL, 'updateExercise-bbt-form.xlsx'));
  await writeBbt(archiveExerciseCtrlBbt, path.join(EXM_CTRL, 'archiveExercise-bbt-form.xlsx'));
  await writeBbt(unarchiveExerciseCtrlBbt, path.join(EXM_CTRL, 'unarchiveExercise-bbt-form.xlsx'));
  await writeBbt(deleteExerciseCtrlBbt, path.join(EXM_CTRL, 'deleteExercise-bbt-form.xlsx'));
  await writeBbt(createWorkoutSessionCtrlBbt, path.join(WS_CTRL, 'createWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getWorkoutSessionCtrlBbt, path.join(WS_CTRL, 'getWorkoutSession-bbt-form.xlsx'));
  await writeBbt(listMemberWorkoutSessionsCtrlBbt, path.join(WS_CTRL, 'listMemberWorkoutSessions-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionCtrlBbt, path.join(WS_CTRL, 'updateWorkoutSession-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionWithExercisesCtrlBbt, path.join(WS_CTRL, 'updateWorkoutSessionWithExercises-bbt-form.xlsx'));
  await writeBbt(deleteWorkoutSessionCtrlBbt, path.join(WS_CTRL, 'deleteWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getMemberProgressReportCtrlBbt, path.join(RPT_CTRL, 'getMemberProgressReport-bbt-form.xlsx'));

  console.log('\nDone — generated forms.');
}

main().catch(console.error);
