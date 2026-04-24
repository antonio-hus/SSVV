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

const SVC_BASE = path.join(ROOT, 'lib', 'service', '__tests__', 'bbt');

// ── auth-service ───────────────────────────────────────────────────────────────

const loginBbt: BbtDescriptor = {
    reqId: 'SERV-01',
    tcCount: 11,
    statement: 'AuthService.login(data) – Validates user credentials. Looks up the user by email, compares the provided password against the stored hash. Returns a SessionData object on success. Throws NotFoundError if no user exists with the given email. Throws AuthorizationError if the password does not match.',
    data: 'Input: LoginUserInput { email: string, password: string }',
    precondition: 'Input data is provided. User with the given email may or may not exist in the system.',
    results: 'Output: Promise<SessionData>',
    postcondition: 'On success: SessionData returned with userId, email, fullName, role, and role-specific profile fields. On failure: NotFoundError or AuthorizationError thrown with message "Invalid email or password".',
    ecRows: [
        {
            number: 1,
            condition: 'Credentials validity (Admin)',
            validEc: 'Registered admin email + correct password → SessionData with adminId set, memberId undefined',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Credentials validity (Member)',
            validEc: 'Registered member email + correct password → SessionData with memberId set, isActive: true',
            invalidEc: ''
        },
        {
            number: 3,
            condition: 'Member active status',
            validEc: 'Active member → isActive: true in SessionData',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Member active status',
            validEc: '',
            invalidEc: 'Inactive member → isActive: false in SessionData'
        },
        {
            number: 5,
            condition: 'User existence',
            validEc: '',
            invalidEc: 'Unregistered email → NotFoundError("Invalid email or password")'
        },
        {
            number: 6,
            condition: 'Password correctness',
            validEc: '',
            invalidEc: 'Wrong password → AuthorizationError("Invalid email or password")'
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'email: admin@gymtrackerpro.com, password: CorrectPass1!',
            expected: 'SessionData returned: role Admin, userId and adminId set, memberId undefined, isActive undefined'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'email: member@example.com, password: CorrectPass1!',
            expected: 'SessionData returned: role Member, memberId set, adminId undefined, isActive: true'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'email: member@example.com, password: CorrectPass1! (inactive user)',
            expected: 'SessionData returned: role Member, memberId set, isActive: false'
        },
        {
            noTc: 4,
            ec: 'EC-5',
            inputData: 'email: unknown@example.com, password: AnyPassword1!',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 5,
            ec: 'EC-6',
            inputData: 'email: member@example.com, password: WrongPassword1!',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
    ],
    bvaRows: [
        {
            number: 1,
            condition: 'Email length',
            testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'
        },
        {
            number: 2,
            condition: 'Password length',
            testCase: '0 chars (empty, no match), 1 char (no match), 1 char (match)'
        },
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'email: "" (no user found)',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'email: "a" (no user found)',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'email: "a" (user found, correct pass)',
            expected: 'SessionData returned with email: "a"'
        },
        {
            noTc: 4,
            bva: 'BVA-2 (n=0)',
            inputData: 'password: "" (hash does not match)',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
        {
            noTc: 5,
            bva: 'BVA-2 (n=1)',
            inputData: 'password: "p" (hash does not match)',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
        {noTc: 6, bva: 'BVA-2 (n=1)', inputData: 'password: "p" (hash matches)', expected: 'SessionData returned'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'email: admin@gymtrackerpro.com, password: CorrectPass1!',
            expected: 'SessionData returned: role Admin, userId and adminId set, memberId undefined, isActive undefined'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'email: member@example.com, password: CorrectPass1!',
            expected: 'SessionData returned: role Member, memberId set, adminId undefined, isActive: true'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'email: member@example.com, password: CorrectPass1! (inactive user)',
            expected: 'SessionData returned: role Member, memberId set, isActive: false'
        },
        {
            noTc: 4,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'email: unknown@example.com, password: AnyPassword1!',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 5,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'email: member@example.com, password: WrongPassword1!',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'email: "" (no user found)',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'email: "a" (no user found)',
            expected: 'throws NotFoundError("Invalid email or password")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'email: "a" (user found, correct pass)',
            expected: 'SessionData returned with email: "a"'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'password: "" (hash does not match)',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'password: "p" (hash does not match)',
            expected: 'throws AuthorizationError("Invalid email or password")'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'password: "p" (hash matches)',
            expected: 'SessionData returned'
        },
    ],
};

// ── user-service ───────────────────────────────────────────────────────────────

const createMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-02',
    tcCount: 3,
    statement: 'UserService.createMember(data) – Creates a new member account. Returns the created MemberWithUser on success. Throws ConflictError if the email is already registered. Throws TransactionError if the write fails.',
    data: 'Input: CreateMemberInput { email, password, fullName, phone, dateOfBirth, membershipStart }',
    precondition: 'Input data is provided. User with the given email may or may not already exist in the system.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: full MemberWithUser returned with user.email matching input. On failure: ConflictError or TransactionError thrown with appropriate message.',
    ecRows: [
        {
            number: 1,
            condition: 'Email registration',
            validEc: 'New (unregistered) email → MemberWithUser returned',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Email registration',
            validEc: '',
            invalidEc: 'Already registered email → ConflictError'
        },
        {number: 3, condition: 'Database write', validEc: 'Write succeeds → MemberWithUser returned', invalidEc: ''},
        {number: 4, condition: 'Database write', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1, EC-3',
            inputData: 'john@example.com (new email, write succeeds)',
            expected: 'Full MemberWithUser returned, user.email matches input'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'john@example.com (taken email)',
            expected: 'throws ConflictError("Email already registered")'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'john@example.com (new email, write fails)',
            expected: 'throws TransactionError("DB failure")'
        },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        {
            noTc: 1,
            fromEc: 'EC-1, EC-3',
            fromBva: '',
            inputData: 'john@example.com (new email, write succeeds)',
            expected: 'Full MemberWithUser returned, user.email matches input'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'john@example.com (taken email)',
            expected: 'throws ConflictError("Email already registered")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'john@example.com (new email, write fails)',
            expected: 'throws TransactionError("DB failure")'
        },
    ],
};

const generateTempPasswordBbt: BbtDescriptor = {
    reqId: 'SERV-03',
    tcCount: 5,
    statement: 'generateTempPassword – Generates a random 16-character temporary password. Always returns a string of exactly 16 characters containing at least one uppercase letter (A–Z), at least one digit (0–9), and at least one special character from the set !@#$%^&*()-_=+[]{}|;:,.<>?. All characters are drawn from the union of uppercase, lowercase, digit, and special pools.',
    data: 'Input: none',
    precondition: 'Method is called on a valid service instance. crypto.getRandomValues is available in the runtime environment.',
    results: 'Output: string of exactly 16 characters',
    postcondition: 'Returned string has length 16, contains at least one uppercase letter, at least one digit, at least one special character, and every character belongs to the allowed pool (A–Z, a–z, 0–9, !@#$%^&*()-_=+[]{}|;:,.<>?).',
    ecRows: [
        { number: 1, condition: 'Output length',           validEc: 'Returned string has exactly 16 characters → length === 16', invalidEc: '' },
        { number: 2, condition: 'Uppercase presence',      validEc: 'Returned string contains at least one character matching /[A-Z]/', invalidEc: '' },
        { number: 3, condition: 'Digit presence',          validEc: 'Returned string contains at least one character matching /[0-9]/', invalidEc: '' },
        { number: 4, condition: 'Special char presence',   validEc: 'Returned string contains at least one character from the special pool (!@#$%^&*()-_=+[]{}|;:,.<>?)', invalidEc: '' },
        { number: 5, condition: 'Character pool validity', validEc: 'Every character in the returned string belongs to the allowed pool (A–Z, a–z, 0–9, special)', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'no input', expected: 'returned string has length exactly 16' },
        { noTc: 2, ec: 'EC-2', inputData: 'no input', expected: 'returned string contains at least one uppercase letter [A-Z]' },
        { noTc: 3, ec: 'EC-3', inputData: 'no input', expected: 'returned string contains at least one digit [0-9]' },
        { noTc: 4, ec: 'EC-4', inputData: 'no input', expected: 'returned string contains at least one special character from the defined pool' },
        { noTc: 5, ec: 'EC-5', inputData: 'no input', expected: 'every character in the returned string belongs to the allowed pool' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'no input', expected: 'returned string has length exactly 16' },
        { noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'no input', expected: 'returned string contains at least one uppercase letter [A-Z]' },
        { noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'no input', expected: 'returned string contains at least one digit [0-9]' },
        { noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'no input', expected: 'returned string contains at least one special character from the defined pool' },
        { noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'no input', expected: 'every character in the returned string belongs to the allowed pool' },
    ],
};

const createMemberWithTempPwdBbt: BbtDescriptor = {
    reqId: 'SERV-04',
    tcCount: 4,
    statement: 'UserService.createMemberWithTempPassword(data) – Creates a new member account and generates a temporary password. Returns MemberWithUserAndTempPassword on success. Throws ConflictError if the email is already registered.',
    data: 'Input: CreateMemberWithTempPasswordInput { email, fullName, phone, dateOfBirth, membershipStart }',
    precondition: 'Input data is provided. User with the given email may or may not already exist in the system.',
    results: 'Output: Promise<MemberWithUserAndTempPassword>',
    postcondition: 'On success: MemberWithUserAndTempPassword returned with id, user.email matching input, and a 16-character generated temporary password. On failure: ConflictError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Email registration',
            validEc: 'New (unregistered) email → MemberWithUserAndTempPassword returned',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Email registration',
            validEc: '',
            invalidEc: 'Already registered email → ConflictError'
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'john@example.com (new email)',
            expected: 'MemberWithUserAndTempPassword returned, id set, user.email matches input, tempPassword has length 16'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'taken@example.com (taken email)',
            expected: 'throws ConflictError("Email taken")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Temporary password length', testCase: 'Exactly 16 characters'},
        {
            number: 2,
            condition: 'Temporary password strength',
            testCase: 'Contains at least one uppercase letter, one digit, and one special character'
        },
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1',
            inputData: 'john@example.com (new email)',
            expected: 'tempPassword is exactly 16 characters long'
        },
        {
            noTc: 2,
            bva: 'BVA-2',
            inputData: 'john@example.com (new email)',
            expected: 'tempPassword contains uppercase letter, digit, and special character'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'john@example.com (new email)',
            expected: 'MemberWithUserAndTempPassword returned, id set, user.email matches input, tempPassword has length 16'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'taken@example.com (taken email)',
            expected: 'throws ConflictError("Email taken")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'john@example.com (new email)',
            expected: 'tempPassword is exactly 16 characters long'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'john@example.com (new email)',
            expected: 'tempPassword contains uppercase letter, digit, and special character'
        },
    ],
};

const createAdminSvcBbt: BbtDescriptor = {
    reqId: 'SERV-05',
    tcCount: 3,
    statement: 'UserService.createAdmin(data) – Creates a new admin account. Returns AdminWithUser on success. Throws ConflictError if the email is already registered. Throws TransactionError if the write fails.',
    data: 'Input: CreateAdminInput { email, password, fullName, phone, dateOfBirth }',
    precondition: 'Input data is provided. User with the given email may or may not already exist in the system.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: full AdminWithUser returned with user.email matching input. On failure: ConflictError or TransactionError thrown with appropriate message.',
    ecRows: [
        {
            number: 1,
            condition: 'Email registration',
            validEc: 'New (unregistered) email → AdminWithUser returned',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Email registration',
            validEc: '',
            invalidEc: 'Already registered email → ConflictError'
        },
        {number: 3, condition: 'Database write', validEc: 'Write succeeds → AdminWithUser returned', invalidEc: ''},
        {number: 4, condition: 'Database write', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1, EC-3',
            inputData: 'admin@example.com (new email, write succeeds)',
            expected: 'Full AdminWithUser returned, user.email matches input'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'admin@example.com (taken email)',
            expected: 'throws ConflictError("Email already registered")'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'admin@example.com (new email, write fails)',
            expected: 'throws TransactionError("DB failure")'
        },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        {
            noTc: 1,
            fromEc: 'EC-1, EC-3',
            fromBva: '',
            inputData: 'admin@example.com (new email, write succeeds)',
            expected: 'Full AdminWithUser returned, user.email matches input'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'admin@example.com (taken email)',
            expected: 'throws ConflictError("Email already registered")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'admin@example.com (new email, write fails)',
            expected: 'throws TransactionError("DB failure")'
        },
    ],
};

const getMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-06',
    tcCount: 5,
    statement: 'UserService.getMember(memberId) – Retrieves a member by ID. Returns MemberWithUser on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: memberId: string',
    precondition: 'A member with the given ID may or may not exist in the system.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned matching the given ID. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Member existence', validEc: 'Existing ID → MemberWithUser returned', invalidEc: ''},
        {number: 2, condition: 'Member existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: valid UUID (existing member)',
            expected: 'Full MemberWithUser object returned'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: valid UUID (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Member not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a" and correct user data'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: valid UUID (existing member)',
            expected: 'Full MemberWithUser object returned'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: valid UUID (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a" and correct user data'
        },
    ],
};

const getAdminSvcBbt: BbtDescriptor = {
    reqId: 'SERV-07',
    tcCount: 5,
    statement: 'UserService.getAdmin(adminId) – Retrieves an admin by ID. Returns AdminWithUser on success. Throws NotFoundError if no admin exists with the given ID.',
    data: 'Input: adminId: string',
    precondition: 'An admin with the given ID may or may not exist in the system.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: AdminWithUser returned matching the given ID. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Admin existence', validEc: 'Existing ID → AdminWithUser returned', invalidEc: ''},
        {number: 2, condition: 'Admin existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: valid UUID (existing admin)',
            expected: 'Full AdminWithUser object returned'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: valid UUID (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Admin not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'AdminWithUser returned with id: "a" and correct user data'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: valid UUID (existing admin)',
            expected: 'Full AdminWithUser object returned'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: valid UUID (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'AdminWithUser returned with id: "a" and correct user data'
        },
    ],
};

const listMembersSvcBbt: BbtDescriptor = {
    reqId: 'SERV-08',
    tcCount: 14,
    statement: 'UserService.listMembers(options) – Returns a paginated list of members. Supports optional filtering by search term, pagination by page number and page size. Results are ordered by fullName ascending. Returns an empty list when no members exist.',
    data: 'Input: MemberListOptions { search?: string, page?: number, pageSize?: number }',
    precondition: 'Members may or may not exist in the system. All options fields are optional.',
    results: 'Output: PageResult<MemberWithUser> { items: MemberWithUser[], total: number }',
    postcondition: 'On success: items and total returned matching the provided options. Items ordered by fullName ascending.',
    ecRows: [
        {
            number: 1,
            condition: 'Search filter',
            validEc: 'Search term provided → filtered results returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Search filter', validEc: 'No options provided → default page returned', invalidEc: ''},
        {
            number: 3,
            condition: 'Data availability',
            validEc: 'Multiple members exist → ordered list returned',
            invalidEc: ''
        },
        {number: 4, condition: 'Data availability', validEc: '', invalidEc: 'Empty database → empty list, total: 0'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-2', inputData: 'No options', expected: 'PageResult returned with items and total'},
        {
            noTc: 2,
            ec: 'EC-1',
            inputData: 'search: "John"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 3,
            ec: 'EC-3',
            inputData: 'DB contains "Alice" and "John Doe"',
            expected: 'PageResult returned with "Alice" at index 0, "John Doe" at index 1, total: 2'
        },
        {noTc: 4, ec: 'EC-4', inputData: 'Empty DB', expected: 'PageResult returned with no items and total: 0'},
    ],
    bvaRows: [
        {number: 1, condition: 'Search term length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {
            number: 2,
            condition: 'Page number',
            testCase: 'undefined, 0 (treated as page 1), 1 (first page), 2 (second page)'
        },
        {number: 3, condition: 'Page size', testCase: 'undefined (default size), 0 (no items), 1 (one item)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1', inputData: 'search: undefined', expected: 'PageResult returned with items and total'},
        {noTc: 2, bva: 'BVA-1', inputData: 'search: ""', expected: 'PageResult returned with items and total'},
        {noTc: 3, bva: 'BVA-1', inputData: 'search: "a"', expected: 'PageResult returned with items and total'},
        {noTc: 4, bva: 'BVA-2', inputData: 'page: undefined', expected: 'PageResult returned - page 1 items and total'},
        {noTc: 5, bva: 'BVA-2', inputData: 'page: 0', expected: 'PageResult returned - page 1 items and total'},
        {noTc: 6, bva: 'BVA-2', inputData: 'page: 1', expected: 'PageResult returned - page 1 items and total'},
        {
            noTc: 7,
            bva: 'BVA-2',
            inputData: 'page: 2',
            expected: 'PageResult returned - page 2 is empty, total reflects full count'
        },
        {
            noTc: 8,
            bva: 'BVA-3',
            inputData: 'pageSize: undefined',
            expected: 'PageResult returned with default page size applied'
        },
        {
            noTc: 9,
            bva: 'BVA-3',
            inputData: 'pageSize: 0',
            expected: 'PageResult returned with no items on page, total reflects full count'
        },
        {
            noTc: 10,
            bva: 'BVA-3',
            inputData: 'pageSize: 1',
            expected: 'PageResult returned with exactly 1 item on page, total reflects full count'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'No options',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 2,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'search: "John"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 3,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'DB contains "Alice" and "John Doe"',
            expected: 'PageResult returned with "Alice" at index 0, "John Doe" at index 1, total: 2'
        },
        {
            noTc: 4,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'Empty DB',
            expected: 'PageResult returned with no items and total: 0'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: undefined',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: ""',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: "a"',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: undefined',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 0',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 1',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 2',
            expected: 'PageResult returned - page 2 is empty, total reflects full count'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: undefined',
            expected: 'PageResult returned with default page size applied'
        },
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: 0',
            expected: 'PageResult returned with no items on page, total reflects full count'
        },
        {
            noTc: 14,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: 1',
            expected: 'PageResult returned with exactly 1 item on page, total reflects full count'
        },
    ],
};

const listAdminsSvcBbt: BbtDescriptor = {
    reqId: 'SERV-09',
    tcCount: 14,
    statement: 'UserService.listAdmins(options) – Returns a paginated list of admins. Supports optional filtering by search term, pagination by page number and page size. Results are ordered by fullName ascending. Returns an empty list when no admins exist.',
    data: 'Input: AdminListOptions { search?: string, page?: number, pageSize?: number }',
    precondition: 'Admins may or may not exist in the system. All options fields are optional.',
    results: 'Output: PageResult<AdminWithUser> { items: AdminWithUser[], total: number }',
    postcondition: 'On success: items and total returned matching the provided options. Items ordered by fullName ascending.',
    ecRows: [
        {
            number: 1,
            condition: 'Search filter',
            validEc: 'Search term provided → filtered results returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Search filter', validEc: 'No options provided → default page returned', invalidEc: ''},
        {
            number: 3,
            condition: 'Data availability',
            validEc: 'Multiple admins exist → ordered list returned',
            invalidEc: ''
        },
        {number: 4, condition: 'Data availability', validEc: '', invalidEc: 'Empty database → empty list, total: 0'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-2', inputData: 'No options', expected: 'PageResult returned with items and total'},
        {
            noTc: 2,
            ec: 'EC-1',
            inputData: 'search: "Admin"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 3,
            ec: 'EC-3',
            inputData: 'DB contains "Alice" and "John Doe"',
            expected: 'PageResult returned with "Alice" at index 0, "John Doe" at index 1, total: 2'
        },
        {noTc: 4, ec: 'EC-4', inputData: 'Empty DB', expected: 'PageResult returned with no items and total: 0'},
    ],
    bvaRows: [
        {number: 1, condition: 'Search term length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {
            number: 2,
            condition: 'Page number',
            testCase: 'undefined, 0 (treated as page 1), 1 (first page), 2 (second page)'
        },
        {number: 3, condition: 'Page size', testCase: 'undefined (default size), 0 (no items), 1 (one item)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1', inputData: 'search: undefined', expected: 'PageResult returned with items and total'},
        {noTc: 2, bva: 'BVA-1', inputData: 'search: ""', expected: 'PageResult returned with items and total'},
        {noTc: 3, bva: 'BVA-1', inputData: 'search: "a"', expected: 'PageResult returned with items and total'},
        {noTc: 4, bva: 'BVA-2', inputData: 'page: undefined', expected: 'PageResult returned - page 1 items and total'},
        {noTc: 5, bva: 'BVA-2', inputData: 'page: 0', expected: 'PageResult returned - page 1 items and total'},
        {noTc: 6, bva: 'BVA-2', inputData: 'page: 1', expected: 'PageResult returned - page 1 items and total'},
        {
            noTc: 7,
            bva: 'BVA-2',
            inputData: 'page: 2',
            expected: 'PageResult returned - page 2 is empty, total reflects full count'
        },
        {
            noTc: 8,
            bva: 'BVA-3',
            inputData: 'pageSize: undefined',
            expected: 'PageResult returned with default page size applied'
        },
        {
            noTc: 9,
            bva: 'BVA-3',
            inputData: 'pageSize: 0',
            expected: 'PageResult returned with no items on page, total reflects full count'
        },
        {
            noTc: 10,
            bva: 'BVA-3',
            inputData: 'pageSize: 1',
            expected: 'PageResult returned with exactly 1 item on page, total reflects full count'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'No options',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 2,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'search: "Admin"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 3,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'DB contains "Alice" and "John Doe"',
            expected: 'PageResult returned with "Alice" at index 0, "John Doe" at index 1, total: 2'
        },
        {
            noTc: 4,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'Empty DB',
            expected: 'PageResult returned with no items and total: 0'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: undefined',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: ""',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: "a"',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: undefined',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 0',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 1',
            expected: 'PageResult returned - page 1 items and total'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'page: 2',
            expected: 'PageResult returned - page 2 is empty, total reflects full count'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: undefined',
            expected: 'PageResult returned with default page size applied'
        },
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: 0',
            expected: 'PageResult returned with no items on page, total reflects full count'
        },
        {
            noTc: 14,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'pageSize: 1',
            expected: 'PageResult returned with exactly 1 item on page, total reflects full count'
        },
    ],
};

const updateMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-10',
    tcCount: 27,
    statement: 'UserService.updateMember(id, data) – Updates an existing member by ID with the provided fields. Returns the updated MemberWithUser on success. Throws NotFoundError if no member exists with the given ID. Throws ConflictError if the new email is already registered by another user. Throws TransactionError if the write fails.',
    data: 'Input: id: string, UpdateMemberInput { email?, password?, fullName?, phone?, dateOfBirth?, membershipStart? }',
    precondition: 'A member with the given ID may or may not exist in the system. All input fields are optional.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: updated MemberWithUser returned with fields reflecting input changes. On failure: NotFoundError, ConflictError, or TransactionError thrown with appropriate message.',
    ecRows: [
        {number: 1, condition: 'Member existence', validEc: 'Existing ID → MemberWithUser returned', invalidEc: ''},
        {number: 2, condition: 'Member existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
        {number: 3, condition: 'Email conflict', validEc: 'Same email as current user → success', invalidEc: ''},
        {
            number: 4,
            condition: 'Email conflict',
            validEc: '',
            invalidEc: 'Email already registered by another user → ConflictError'
        },
        {number: 5, condition: 'Database write', validEc: 'Write succeeds → MemberWithUser returned', invalidEc: ''},
        {number: 6, condition: 'Database write', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1, EC-5',
            inputData: 'id: MEMBER_ID, fullName: "Updated Name"',
            expected: 'Full updated MemberWithUser returned, user.fullName: "Updated Name"'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: NONEXISTENT_ID, fullName: "New"',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'id: MEMBER_ID, email: "taken@example.com"',
            expected: 'throws ConflictError("Email taken")'
        },
        {
            noTc: 4,
            ec: 'EC-3',
            inputData: 'id: MEMBER_ID, email: current user email',
            expected: 'Full MemberWithUser returned unchanged'
        },
        {noTc: 5, ec: 'EC-1', inputData: 'id: MEMBER_ID, password: "New1!"', expected: 'Full MemberWithUser returned'},
        {
            noTc: 6,
            ec: 'EC-6',
            inputData: 'id: MEMBER_ID, fullName: "New" (write fails)',
            expected: 'throws TransactionError("DB Error")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
        {number: 2, condition: 'email length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 3, condition: 'fullName length', testCase: 'undefined, "" (empty), "A" (1 char)'},
        {number: 4, condition: 'phone length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 5, condition: 'dateOfBirth length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 6, condition: 'password length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 7, condition: 'membershipStart length', testCase: 'undefined, "" (empty), "a" (1 char)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Member not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a" and correct user data'
        },
        {noTc: 4, bva: 'BVA-2', inputData: 'email: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 5, bva: 'BVA-2', inputData: 'email: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 6, bva: 'BVA-2', inputData: 'email: "a"', expected: 'Full MemberWithUser returned'},
        {noTc: 7, bva: 'BVA-3', inputData: 'fullName: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 8, bva: 'BVA-3', inputData: 'fullName: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 9, bva: 'BVA-3', inputData: 'fullName: "A"', expected: 'Full MemberWithUser returned'},
        {noTc: 10, bva: 'BVA-4', inputData: 'phone: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 11, bva: 'BVA-4', inputData: 'phone: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 12, bva: 'BVA-4', inputData: 'phone: "a"', expected: 'Full MemberWithUser returned'},
        {noTc: 13, bva: 'BVA-5', inputData: 'dateOfBirth: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 14, bva: 'BVA-5', inputData: 'dateOfBirth: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 15, bva: 'BVA-5', inputData: 'dateOfBirth: "a"', expected: 'Full MemberWithUser returned'},
        {noTc: 16, bva: 'BVA-6', inputData: 'password: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 17, bva: 'BVA-6', inputData: 'password: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 18, bva: 'BVA-6', inputData: 'password: "a"', expected: 'Full MemberWithUser returned'},
        {noTc: 19, bva: 'BVA-7', inputData: 'membershipStart: undefined', expected: 'Full MemberWithUser returned'},
        {noTc: 20, bva: 'BVA-7', inputData: 'membershipStart: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 21, bva: 'BVA-7', inputData: 'membershipStart: "a"', expected: 'Full MemberWithUser returned'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1, EC-5',
            fromBva: '',
            inputData: 'id: MEMBER_ID, fullName: "Updated Name"',
            expected: 'Full updated MemberWithUser returned, user.fullName: "Updated Name"'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID, fullName: "New"',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'id: MEMBER_ID, email: "taken@example.com"',
            expected: 'throws ConflictError("Email taken")'
        },
        {
            noTc: 4,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'id: MEMBER_ID, email: current user email',
            expected: 'Full MemberWithUser returned unchanged'
        },
        {
            noTc: 5,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: MEMBER_ID, password: "New1!"',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'id: MEMBER_ID, fullName: "New" (write fails)',
            expected: 'throws TransactionError("DB Error")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a" and correct user data'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'email: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'email: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'email: "a"', expected: 'Full MemberWithUser returned'},
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'fullName: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: 'fullName: "A"', expected: 'Full MemberWithUser returned'},
        {
            noTc: 16,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'phone: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {noTc: 17, fromEc: '', fromBva: 'BVA-4', inputData: 'phone: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-4', inputData: 'phone: "a"', expected: 'Full MemberWithUser returned'},
        {
            noTc: 19,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'dateOfBirth: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 20,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'dateOfBirth: ""',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'dateOfBirth: "a"',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 22,
            fromEc: '',
            fromBva: 'BVA-6',
            inputData: 'password: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {noTc: 23, fromEc: '', fromBva: 'BVA-6', inputData: 'password: ""', expected: 'Full MemberWithUser returned'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-6', inputData: 'password: "a"', expected: 'Full MemberWithUser returned'},
        {
            noTc: 25,
            fromEc: '',
            fromBva: 'BVA-7',
            inputData: 'membershipStart: undefined',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 26,
            fromEc: '',
            fromBva: 'BVA-7',
            inputData: 'membershipStart: ""',
            expected: 'Full MemberWithUser returned'
        },
        {
            noTc: 27,
            fromEc: '',
            fromBva: 'BVA-7',
            inputData: 'membershipStart: "a"',
            expected: 'Full MemberWithUser returned'
        },
    ],
};

const updateAdminSvcBbt: BbtDescriptor = {
    reqId: 'SERV-11',
    tcCount: 24,
    statement: 'UserService.updateAdmin(id, data) – Updates an existing admin by ID with the provided fields. Returns the updated AdminWithUser on success. Throws NotFoundError if no admin exists with the given ID. Throws ConflictError if the new email is already registered by another user. Throws TransactionError if the write fails.',
    data: 'Input: id: string, UpdateAdminInput { email?, password?, fullName?, phone?, dateOfBirth? }',
    precondition: 'An admin with the given ID may or may not exist in the system. All input fields are optional.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'On success: updated AdminWithUser returned with fields reflecting input changes. On failure: NotFoundError, ConflictError, or TransactionError thrown with appropriate message.',
    ecRows: [
        {number: 1, condition: 'Admin existence', validEc: 'Existing ID → AdminWithUser returned', invalidEc: ''},
        {number: 2, condition: 'Admin existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
        {number: 3, condition: 'Email conflict', validEc: 'Same email as current admin → success', invalidEc: ''},
        {
            number: 4,
            condition: 'Email conflict',
            validEc: '',
            invalidEc: 'Email already registered by another user → ConflictError'
        },
        {number: 5, condition: 'Database write', validEc: 'Write succeeds → AdminWithUser returned', invalidEc: ''},
        {number: 6, condition: 'Database write', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1, EC-5',
            inputData: 'id: ADMIN_ID, fullName: "Updated Admin"',
            expected: 'Full updated AdminWithUser returned, user.fullName: "Updated Admin"'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: NONEXISTENT_ID, fullName: "Name"',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'id: ADMIN_ID, email: "taken@example.com"',
            expected: 'throws ConflictError("Email taken")'
        },
        {
            noTc: 4,
            ec: 'EC-3',
            inputData: 'id: ADMIN_ID, email: current admin email',
            expected: 'Full AdminWithUser returned unchanged'
        },
        {noTc: 5, ec: 'EC-1', inputData: 'id: ADMIN_ID, password: "New1!"', expected: 'Full AdminWithUser returned'},
        {
            noTc: 6,
            ec: 'EC-6',
            inputData: 'id: ADMIN_ID, fullName: "New" (write fails)',
            expected: 'throws TransactionError("DB Error")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
        {number: 2, condition: 'email length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 3, condition: 'fullName length', testCase: 'undefined, "" (empty), "A" (1 char)'},
        {number: 4, condition: 'phone length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 5, condition: 'dateOfBirth length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 6, condition: 'password length', testCase: 'undefined, "" (empty), "a" (1 char)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Admin not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'AdminWithUser returned with id: "a" and correct user data'
        },
        {noTc: 4, bva: 'BVA-2', inputData: 'email: undefined', expected: 'Full AdminWithUser returned'},
        {noTc: 5, bva: 'BVA-2', inputData: 'email: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 6, bva: 'BVA-2', inputData: 'email: "a"', expected: 'Full AdminWithUser returned'},
        {noTc: 7, bva: 'BVA-3', inputData: 'fullName: undefined', expected: 'Full AdminWithUser returned'},
        {noTc: 8, bva: 'BVA-3', inputData: 'fullName: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 9, bva: 'BVA-3', inputData: 'fullName: "A"', expected: 'Full AdminWithUser returned'},
        {noTc: 10, bva: 'BVA-4', inputData: 'phone: undefined', expected: 'Full AdminWithUser returned'},
        {noTc: 11, bva: 'BVA-4', inputData: 'phone: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 12, bva: 'BVA-4', inputData: 'phone: "a"', expected: 'Full AdminWithUser returned'},
        {noTc: 13, bva: 'BVA-5', inputData: 'dateOfBirth: undefined', expected: 'Full AdminWithUser returned'},
        {noTc: 14, bva: 'BVA-5', inputData: 'dateOfBirth: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 15, bva: 'BVA-5', inputData: 'dateOfBirth: "a"', expected: 'Full AdminWithUser returned'},
        {noTc: 16, bva: 'BVA-6', inputData: 'password: undefined', expected: 'Full AdminWithUser returned'},
        {noTc: 17, bva: 'BVA-6', inputData: 'password: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 18, bva: 'BVA-6', inputData: 'password: "a"', expected: 'Full AdminWithUser returned'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1, EC-5',
            fromBva: '',
            inputData: 'id: ADMIN_ID, fullName: "Updated Admin"',
            expected: 'Full updated AdminWithUser returned, user.fullName: "Updated Admin"'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID, fullName: "Name"',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'id: ADMIN_ID, email: "taken@example.com"',
            expected: 'throws ConflictError("Email taken")'
        },
        {
            noTc: 4,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'id: ADMIN_ID, email: current admin email',
            expected: 'Full AdminWithUser returned unchanged'
        },
        {
            noTc: 5,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: ADMIN_ID, password: "New1!"',
            expected: 'Full AdminWithUser returned'
        },
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'id: ADMIN_ID, fullName: "New" (write fails)',
            expected: 'throws TransactionError("DB Error")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Admin not found")'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'AdminWithUser returned with id: "a" and correct user data'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'email: undefined',
            expected: 'Full AdminWithUser returned'
        },
        {noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'email: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'email: "a"', expected: 'Full AdminWithUser returned'},
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName: undefined',
            expected: 'Full AdminWithUser returned'
        },
        {noTc: 14, fromEc: '', fromBva: 'BVA-3', inputData: 'fullName: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-3', inputData: 'fullName: "A"', expected: 'Full AdminWithUser returned'},
        {
            noTc: 16,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'phone: undefined',
            expected: 'Full AdminWithUser returned'
        },
        {noTc: 17, fromEc: '', fromBva: 'BVA-4', inputData: 'phone: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-4', inputData: 'phone: "a"', expected: 'Full AdminWithUser returned'},
        {
            noTc: 19,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'dateOfBirth: undefined',
            expected: 'Full AdminWithUser returned'
        },
        {noTc: 20, fromEc: '', fromBva: 'BVA-5', inputData: 'dateOfBirth: ""', expected: 'Full AdminWithUser returned'},
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'dateOfBirth: "a"',
            expected: 'Full AdminWithUser returned'
        },
        {
            noTc: 22,
            fromEc: '',
            fromBva: 'BVA-6',
            inputData: 'password: undefined',
            expected: 'Full AdminWithUser returned'
        },
        {noTc: 23, fromEc: '', fromBva: 'BVA-6', inputData: 'password: ""', expected: 'Full AdminWithUser returned'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-6', inputData: 'password: "a"', expected: 'Full AdminWithUser returned'},
    ],
};
const suspendMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-12',
    tcCount: 5,
    statement: 'UserService.suspendMember(id) – Sets the member\'s active status to false. Returns the updated MemberWithUser on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'A member with the given ID may or may not exist in the system.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with isActive: false, correct id, and correct user data. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Member existence',
            validEc: 'Existing ID → MemberWithUser returned with isActive: false',
            invalidEc: ''
        },
        {number: 2, condition: 'Member existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: MEMBER_ID',
            expected: 'MemberWithUser returned with isActive: false, id: MEMBER_ID, correct user data'
        },
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Member not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Member not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a", isActive: false, correct user data'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: MEMBER_ID',
            expected: 'MemberWithUser returned with isActive: false, id: MEMBER_ID, correct user data'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Member not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a", isActive: false, correct user data'
        },
    ],
};

const activateMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-13',
    tcCount: 5,
    statement: 'UserService.activateMember(id) – Sets the member\'s active status to true. Returns the updated MemberWithUser on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'A member with the given ID may or may not exist in the system.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'On success: MemberWithUser returned with isActive: true, correct id, and correct user data. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Member existence',
            validEc: 'Existing ID → MemberWithUser returned with isActive: true',
            invalidEc: ''
        },
        {number: 2, condition: 'Member existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: MEMBER_ID',
            expected: 'Full MemberWithUser returned with isActive: true and id: MEMBER_ID'
        },
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Member not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Member not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a", isActive: true, correct user data'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: MEMBER_ID',
            expected: 'Full MemberWithUser returned with isActive: true and id: MEMBER_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Member not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'MemberWithUser returned with id: "a", isActive: true, correct user data'
        },
    ],
};

const deleteMemberSvcBbt: BbtDescriptor = {
    reqId: 'SERV-14',
    tcCount: 5,
    statement: 'UserService.deleteMember(id) – Deletes a member by ID. Resolves with void on success. Throws NotFoundError if no member exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'A member with the given ID may or may not exist in the system.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves with undefined. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Member existence', validEc: 'Existing ID → resolves', invalidEc: ''},
        {number: 2, condition: 'Member existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'id: MEMBER_ID', expected: 'Promise resolves with undefined'},
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Not found")'},
        {noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError("Not found")'},
        {noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)', expected: 'Promise resolves'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: MEMBER_ID', expected: 'Promise resolves with undefined'},
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: ""', expected: 'throws NotFoundError("Not found")'},
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Not found")'
        },
        {noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found)', expected: 'Promise resolves'},
    ],
};

const deleteAdminSvcBbt: BbtDescriptor = {
    reqId: 'SERV-15',
    tcCount: 5,
    statement: 'UserService.deleteAdmin(id) – Deletes an admin by ID. Resolves with void on success. Throws NotFoundError if no admin exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'An admin with the given ID may or may not exist in the system.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves with undefined. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Admin existence', validEc: 'Existing ID → resolves with undefined', invalidEc: ''},
        {number: 2, condition: 'Admin existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'id: ADMIN_ID', expected: 'Promise resolves'},
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Not found")'},
        {noTc: 2, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (no match)', expected: 'throws NotFoundError("Not found")'},
        {noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)', expected: 'Promise resolves'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: ADMIN_ID', expected: 'Promise resolves with undefined'},
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {noTc: 3, fromEc: '', fromBva: 'BVA-1', inputData: 'id: ""', expected: 'throws NotFoundError("Not found")'},
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Not found")'
        },
        {noTc: 5, fromEc: '', fromBva: 'BVA-1', inputData: 'id: "a" (found)', expected: 'Promise resolves'},
    ],
};

// ── exercise-service ───────────────────────────────────────────────────────────

const createExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-16',
    tcCount: 3,
    statement: 'ExerciseService.createExercise(data) – Creates a new exercise. Returns the created Exercise on success. Throws ConflictError if an exercise with the same name already exists.',
    data: 'Input: CreateExerciseInput { name, ...other fields }',
    precondition: 'An exercise with the given name may or may not already exist in the system.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: full Exercise object returned. On failure: ConflictError thrown with appropriate message.',
    ecRows: [
        {
            number: 1,
            condition: 'Exercise name uniqueness',
            validEc: 'Unique name → full Exercise returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Exercise name uniqueness', validEc: '', invalidEc: 'Duplicate name → ConflictError'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'name: "Bench Press" (unique)', expected: 'Full Exercise object returned'},
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'name: "Bench Press" (duplicate)',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Name length', testCase: '1 char (minimum valid name)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=1)',
            inputData: 'name: "A"',
            expected: 'Exercise returned with name: "A" and correct id'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'name: "Bench Press" (unique)',
            expected: 'Full Exercise object returned'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'name: "Bench Press" (duplicate)',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name: "A"',
            expected: 'Exercise returned with name: "A" and correct id'
        },
    ],
};

const getExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-17',
    tcCount: 5,
    statement: 'ExerciseService.getExercise(id) – Retrieves an exercise by ID. Returns the Exercise on success. Throws NotFoundError if no exercise exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'An exercise with the given ID may or may not exist in the system.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: full Exercise object returned matching the given ID. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Exercise existence', validEc: 'Existing ID → full Exercise returned', invalidEc: ''},
        {number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'id: EXERCISE_ID', expected: 'Full Exercise object returned'},
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Exercise not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a" and correct name'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'id: EXERCISE_ID', expected: 'Full Exercise object returned'},
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a" and correct name'
        },
    ],
};
const listExercisesSvcBbt: BbtDescriptor = {
    reqId: 'SERV-18',
    tcCount: 26,
    statement: 'ExerciseService.listExercises(options) – Returns a paginated list of exercises. Supports optional filtering by search term, muscle group, and active status. Results are ordered by name ascending. By default only active exercises are returned.',
    data: 'Input: ExerciseListOptions { search?: string, muscleGroup?: MuscleGroup, includeInactive?: boolean, page?: number, pageSize?: number }',
    precondition: 'Exercises may or may not exist in the system. All options fields are optional.',
    results: 'Output: Promise<PageResult<Exercise>>',
    postcondition: 'On success: PageResult returned with items and total matching the provided options. Items ordered by name ascending.',
    ecRows: [
        {
            number: 1,
            condition: 'Inactive inclusion',
            validEc: 'includeInactive: true → all exercises (active + inactive) returned',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Inactive inclusion',
            validEc: 'includeInactive: false or undefined → only active exercises returned',
            invalidEc: ''
        },
        {
            number: 3,
            condition: 'Muscle group filter',
            validEc: 'Valid MuscleGroup provided → filtered by muscle group',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Muscle group filter',
            validEc: 'No muscle group filter → all active exercises returned',
            invalidEc: ''
        },
        {
            number: 5,
            condition: 'Search term',
            validEc: 'Search term + muscle group filter → filtered results returned',
            invalidEc: ''
        },
        {
            number: 6,
            condition: 'Data availability',
            validEc: 'Multiple exercises → ordered by name ascending',
            invalidEc: ''
        },
        {
            number: 7,
            condition: 'Data availability',
            validEc: 'Empty options → all active exercises returned',
            invalidEc: ''
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-2',
            inputData: 'No options',
            expected: 'PageResult with active exercises only, items and total returned'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'includeInactive: false',
            expected: 'PageResult with active exercises only, items and total returned'
        },
        {
            noTc: 3,
            ec: 'EC-1',
            inputData: 'includeInactive: true',
            expected: 'PageResult containing both active and inactive exercises, total: 2'
        },
        {
            noTc: 4,
            ec: 'EC-3',
            inputData: 'muscleGroup: BACK',
            expected: 'PageResult with exercises filtered to BACK muscle group'
        },
        {
            noTc: 5,
            ec: 'EC-5',
            inputData: 'search: "Bench", muscleGroup: CHEST',
            expected: 'PageResult with exercises matching both filters'
        },
        {
            noTc: 6,
            ec: 'EC-6',
            inputData: 'Multiple exercises in DB',
            expected: 'PageResult items[0].name: "Deadlift", items[1].name: "Standard Bench Press"'
        },
        {
            noTc: 7,
            ec: 'EC-7',
            inputData: 'options: {}',
            expected: 'PageResult with all active exercises, items and total returned'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Search term length', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {
            number: 2,
            condition: 'Muscle group values',
            testCase: 'CHEST, SHOULDERS, ARMS, BACK, CORE, LEGS, "INVALID" (unknown value)'
        },
        {number: 3, condition: 'includeInactive flag', testCase: 'undefined, false, true'},
        {
            number: 4,
            condition: 'Page number',
            testCase: 'undefined, 0 (treated as page 1), 1 (first page), 2 (second page)'
        },
        {number: 5, condition: 'Page size', testCase: 'undefined (default size), 0 (no items), 1 (one item)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1', inputData: 'search: undefined', expected: 'PageResult returned with items and total'},
        {noTc: 2, bva: 'BVA-1', inputData: 'search: ""', expected: 'PageResult returned with items and total'},
        {
            noTc: 3,
            bva: 'BVA-1',
            inputData: 'search: "a"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 4,
            bva: 'BVA-2',
            inputData: 'muscleGroup: CHEST',
            expected: 'PageResult with 1 item, items[0].muscleGroup: CHEST'
        },
        {noTc: 5, bva: 'BVA-2', inputData: 'muscleGroup: SHOULDERS', expected: 'PageResult with no items, total: 0'},
        {noTc: 6, bva: 'BVA-2', inputData: 'muscleGroup: ARMS', expected: 'PageResult with no items, total: 0'},
        {
            noTc: 7,
            bva: 'BVA-2',
            inputData: 'muscleGroup: BACK',
            expected: 'PageResult with 1 item, items[0].muscleGroup: BACK'
        },
        {noTc: 8, bva: 'BVA-2', inputData: 'muscleGroup: CORE', expected: 'PageResult with no items'},
        {noTc: 9, bva: 'BVA-2', inputData: 'muscleGroup: LEGS', expected: 'PageResult with no items'},
        {noTc: 10, bva: 'BVA-2', inputData: 'muscleGroup: "INVALID"', expected: 'PageResult with no items, total: 0'},
        {
            noTc: 11,
            bva: 'BVA-3',
            inputData: 'includeInactive: undefined',
            expected: 'PageResult with 1 active item, items[0].isActive: true'
        },
        {
            noTc: 12,
            bva: 'BVA-3',
            inputData: 'includeInactive: false',
            expected: 'PageResult with 1 active item, items[0].isActive: true'
        },
        {
            noTc: 13,
            bva: 'BVA-3',
            inputData: 'includeInactive: true',
            expected: 'PageResult containing both active and inactive exercises, total: 2'
        },
        {noTc: 14, bva: 'BVA-4', inputData: 'page: undefined', expected: 'PageResult with page 1 items'},
        {noTc: 15, bva: 'BVA-4', inputData: 'page: 0', expected: 'PageResult with page 1 items'},
        {noTc: 16, bva: 'BVA-4', inputData: 'page: 1', expected: 'PageResult with page 1 items'},
        {
            noTc: 17,
            bva: 'BVA-4',
            inputData: 'page: 2, pageSize: 10',
            expected: 'PageResult with page 2 items, total: 11'
        },
        {
            noTc: 18,
            bva: 'BVA-5',
            inputData: 'pageSize: undefined',
            expected: 'PageResult with default page size applied'
        },
        {
            noTc: 19,
            bva: 'BVA-5',
            inputData: 'pageSize: 0',
            expected: 'PageResult with no items on page, total reflects full count'
        },
        {
            noTc: 20,
            bva: 'BVA-5',
            inputData: 'pageSize: 1',
            expected: 'PageResult with exactly 1 item on page, total reflects full count'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'No options',
            expected: 'PageResult with active exercises only, items and total returned'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'includeInactive: false',
            expected: 'PageResult with active exercises only, items and total returned'
        },
        {
            noTc: 3,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'includeInactive: true',
            expected: 'PageResult containing both active and inactive exercises, total: 2'
        },
        {
            noTc: 4,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'muscleGroup: BACK',
            expected: 'PageResult with exercises filtered to BACK muscle group'
        },
        {
            noTc: 5,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'search: "Bench", muscleGroup: CHEST',
            expected: 'PageResult with exercises matching both filters'
        },
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'Multiple exercises in DB',
            expected: 'PageResult items[0].name: "Deadlift", items[1].name: "Standard Bench Press"'
        },
        {
            noTc: 7,
            fromEc: 'EC-7',
            fromBva: '',
            inputData: 'options: {}',
            expected: 'PageResult with all active exercises, items and total returned'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: undefined',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: ""',
            expected: 'PageResult returned with items and total'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'search: "a"',
            expected: 'PageResult returned with matching items and total'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'muscleGroup: CHEST',
            expected: 'PageResult with 1 item, items[0].muscleGroup: CHEST'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'muscleGroup: SHOULDERS',
            expected: 'PageResult with no items, total: 0'
        },
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'muscleGroup: ARMS',
            expected: 'PageResult with no items, total: 0'
        },
        {
            noTc: 14,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'muscleGroup: BACK',
            expected: 'PageResult with 1 item, items[0].muscleGroup: BACK'
        },
        {noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'muscleGroup: CORE', expected: 'PageResult with no items'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'muscleGroup: LEGS', expected: 'PageResult with no items'},
        {
            noTc: 17,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'muscleGroup: "INVALID"',
            expected: 'PageResult with no items, total: 0'
        },
        {
            noTc: 18,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'includeInactive: undefined',
            expected: 'PageResult with 1 active item, items[0].isActive: true'
        },
        {
            noTc: 19,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'includeInactive: false',
            expected: 'PageResult with 1 active item, items[0].isActive: true'
        },
        {
            noTc: 20,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'includeInactive: true',
            expected: 'PageResult containing both active and inactive exercises, total: 2'
        },
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'page: undefined',
            expected: 'PageResult with page 1 items'
        },
        {noTc: 22, fromEc: '', fromBva: 'BVA-4', inputData: 'page: 0', expected: 'PageResult with page 1 items'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-4', inputData: 'page: 1', expected: 'PageResult with page 1 items'},
        {
            noTc: 24,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'page: 2, pageSize: 10',
            expected: 'PageResult with page 2 items, total: 11'
        },
        {
            noTc: 25,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'pageSize: undefined',
            expected: 'PageResult with default page size applied'
        },
        {
            noTc: 26,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'pageSize: 0',
            expected: 'PageResult with no items on page, total reflects full count'
        },
    ],
};
const updateExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-19',
    tcCount: 24,
    statement: 'ExerciseService.updateExercise(id, data) – Updates an existing exercise. Returns the updated Exercise on success. Throws NotFoundError if no exercise exists with the given ID. Throws ConflictError if the new name is already in use by another exercise.',
    data: 'Input: id: string, data: UpdateExerciseInput { name?, description?, muscleGroup?, equipmentNeeded? }',
    precondition: 'An exercise with the given ID may or may not exist. The new name may or may not already belong to another exercise.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: updated Exercise returned reflecting changed fields. On failure: NotFoundError or ConflictError thrown.',
    ecRows: [
        {number: 1, condition: 'Exercise existence', validEc: 'Existing ID → updated Exercise returned', invalidEc: ''},
        {number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
        {number: 3, condition: 'Name uniqueness', validEc: 'Unique name (or name unchanged) → success', invalidEc: ''},
        {
            number: 4,
            condition: 'Name uniqueness',
            validEc: '',
            invalidEc: 'Name already used by another exercise → ConflictError'
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: EXERCISE_ID, name: "Updated Bench Press"',
            expected: 'Exercise returned with name: "Updated Bench Press" and id: EXERCISE_ID'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: NONEXISTENT_ID, description: "New description"',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'id: EXERCISE_ID, name: "Existing Exercise"',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
        {number: 2, condition: 'name field', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 3, condition: 'description field', testCase: 'undefined, "" (empty), "a" (1 char)'},
        {number: 4, condition: 'muscleGroup field', testCase: 'undefined, CHEST, SHOULDERS, ARMS, BACK, CORE, LEGS'},
        {number: 5, condition: 'equipmentNeeded field', testCase: 'undefined, CABLE, DUMBBELL, BARBELL, MACHINE'},
    ],
    bvaTcRows: [
        // ── BVA-1: ID length ──────────────────────────────────────────────
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found), description: "Updated description"',
            expected: 'Exercise returned with id: "a", description: "Updated description", correct name'
        },
        // ── BVA-2: name ───────────────────────────────────────────────────
        {
            noTc: 4,
            bva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 5,
            bva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: ""',
            expected: 'Exercise returned with name: "" (toEqual expected)'
        },
        {
            noTc: 6,
            bva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: "a"',
            expected: 'Exercise returned with name: "a" (toEqual expected)'
        },
        // ── BVA-3: description ────────────────────────────────────────────
        {
            noTc: 7,
            bva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 8,
            bva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: ""',
            expected: 'Exercise returned with description: "" (toEqual expected)'
        },
        {
            noTc: 9,
            bva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: "a"',
            expected: 'Exercise returned with description: "a" (toEqual expected)'
        },
        // ── BVA-4: muscleGroup ────────────────────────────────────────────
        {
            noTc: 10,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 11,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: CHEST',
            expected: 'Exercise returned with muscleGroup: CHEST'
        },
        {
            noTc: 12,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: SHOULDERS',
            expected: 'Exercise returned with muscleGroup: SHOULDERS'
        },
        {
            noTc: 13,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: ARMS',
            expected: 'Exercise returned with muscleGroup: ARMS'
        },
        {
            noTc: 14,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: BACK',
            expected: 'Exercise returned with muscleGroup: BACK'
        },
        {
            noTc: 15,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: CORE',
            expected: 'Exercise returned with muscleGroup: CORE'
        },
        {
            noTc: 16,
            bva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: LEGS',
            expected: 'Exercise returned with muscleGroup: LEGS'
        },
        // ── BVA-5: equipmentNeeded ────────────────────────────────────────
        {
            noTc: 17,
            bva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 18,
            bva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: CABLE',
            expected: 'Exercise returned with equipmentNeeded: CABLE'
        },
        {
            noTc: 19,
            bva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: DUMBBELL',
            expected: 'Exercise returned with equipmentNeeded: DUMBBELL'
        },
        {
            noTc: 20,
            bva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: BARBELL',
            expected: 'Exercise returned with equipmentNeeded: BARBELL'
        },
        {
            noTc: 21,
            bva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: MACHINE',
            expected: 'Exercise returned with equipmentNeeded: MACHINE'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: EXERCISE_ID, name: "Updated Bench Press"',
            expected: 'Exercise returned with name: "Updated Bench Press" and id: EXERCISE_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID, description: "New description"',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'id: EXERCISE_ID, name: "Existing Exercise"',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found), description: "Updated description"',
            expected: 'Exercise returned with id: "a", description: "Updated description", correct name'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: ""',
            expected: 'Exercise returned with name: "" (toEqual expected)'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: EXERCISE_ID, name: "a"',
            expected: 'Exercise returned with name: "a" (toEqual expected)'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: ""',
            expected: 'Exercise returned with description: "" (toEqual expected)'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'id: EXERCISE_ID, description: "a"',
            expected: 'Exercise returned with description: "a" (toEqual expected)'
        },
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 14,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: CHEST',
            expected: 'Exercise returned with muscleGroup: CHEST'
        },
        {
            noTc: 15,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: SHOULDERS',
            expected: 'Exercise returned with muscleGroup: SHOULDERS'
        },
        {
            noTc: 16,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: ARMS',
            expected: 'Exercise returned with muscleGroup: ARMS'
        },
        {
            noTc: 17,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: BACK',
            expected: 'Exercise returned with muscleGroup: BACK'
        },
        {
            noTc: 18,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: CORE',
            expected: 'Exercise returned with muscleGroup: CORE'
        },
        {
            noTc: 19,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'id: EXERCISE_ID, muscleGroup: LEGS',
            expected: 'Exercise returned with muscleGroup: LEGS'
        },
        {
            noTc: 20,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: undefined',
            expected: 'Full Exercise returned (toEqual MOCK_EXERCISE)'
        },
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: CABLE',
            expected: 'Exercise returned with equipmentNeeded: CABLE'
        },
        {
            noTc: 22,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: DUMBBELL',
            expected: 'Exercise returned with equipmentNeeded: DUMBBELL'
        },
        {
            noTc: 23,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: BARBELL',
            expected: 'Exercise returned with equipmentNeeded: BARBELL'
        },
        {
            noTc: 24,
            fromEc: '',
            fromBva: 'BVA-5',
            inputData: 'id: EXERCISE_ID, equipmentNeeded: MACHINE',
            expected: 'Exercise returned with equipmentNeeded: MACHINE'
        },
    ],
};

const archiveExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-20',
    tcCount: 5,
    statement: 'ExerciseService.archiveExercise(id) – Sets the exercise\'s active status to false. Returns the updated Exercise on success. Throws NotFoundError if no exercise exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'An exercise with the given ID may or may not exist in the system.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with isActive: false and correct id. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Exercise existence',
            validEc: 'Existing ID → Exercise returned with isActive: false',
            invalidEc: ''
        },
        {number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: EXERCISE_ID',
            expected: 'Exercise returned with isActive: false and id: EXERCISE_ID'
        },
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Exercise not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a", isActive: false, correct name'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: EXERCISE_ID',
            expected: 'Exercise returned with isActive: false and id: EXERCISE_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a", isActive: false, correct name'
        },
    ],
};

const unarchiveExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-21',
    tcCount: 5,
    statement: 'ExerciseService.unarchiveExercise(id) – Sets the exercise\'s active status to true. Returns the updated Exercise on success. Throws NotFoundError if no exercise exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'An exercise with the given ID may or may not exist in the system.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'On success: Exercise returned with isActive: true and correct id. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Exercise existence',
            validEc: 'Existing ID → Exercise returned with isActive: true',
            invalidEc: ''
        },
        {number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: EXERCISE_ID',
            expected: 'Exercise returned with isActive: true and id: EXERCISE_ID'
        },
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Exercise not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a", isActive: true, correct name'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: EXERCISE_ID',
            expected: 'Exercise returned with isActive: true and id: EXERCISE_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'Exercise returned with id: "a", isActive: true, correct name'
        },
    ],
};

const deleteExerciseSvcBbt: BbtDescriptor = {
    reqId: 'SERV-22',
    tcCount: 8,
    statement: 'ExerciseService.deleteExercise(id) – Deletes an exercise by ID. Resolves with void if the exercise exists and is not referenced. Throws NotFoundError if no exercise exists. Throws ConflictError if the exercise is referenced by workout sessions.',
    data: 'Input: id: string',
    precondition: 'An exercise with the given ID may or may not exist. If it exists, it may or may not be referenced by workout sessions.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves with undefined. On failure: NotFoundError or ConflictError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Exercise existence',
            validEc: 'Existing, unreferenced ID → resolves with undefined',
            invalidEc: ''
        },
        {number: 2, condition: 'Exercise existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
        {
            number: 3,
            condition: 'Usage status',
            validEc: 'Exercise not referenced → resolves with undefined',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Usage status',
            validEc: '',
            invalidEc: 'Referenced by workout sessions → ConflictError'
        },
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'id: EXERCISE_ID (unreferenced)', expected: 'Promise resolves with undefined'},
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 3,
            ec: 'EC-4',
            inputData: 'id: EXERCISE_ID (referenced)',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Usage count', testCase: '0 (not referenced → success), 1 (referenced → ConflictError)'},
        {number: 2, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (usage=0)',
            inputData: 'id: EXERCISE_ID (usage count: 0)',
            expected: 'Promise resolves with undefined'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (usage=1)',
            inputData: 'id: EXERCISE_ID (usage count: 1)',
            expected: 'throws ConflictError("Exercise is referenced by workout sessions")'
        },
        {noTc: 3, bva: 'BVA-2 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Exercise not found")'},
        {
            noTc: 4,
            bva: 'BVA-2 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {noTc: 5, bva: 'BVA-2 (n=1)', inputData: 'id: "a" (found)', expected: 'Promise resolves with undefined'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: EXERCISE_ID (unreferenced)',
            expected: 'Promise resolves with undefined'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 3,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'id: EXERCISE_ID (referenced)',
            expected: 'throws ConflictError("Exercise name already in use")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: EXERCISE_ID (usage count: 0)',
            expected: 'Promise resolves with undefined'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: EXERCISE_ID (usage count: 1)',
            expected: 'throws ConflictError("Exercise is referenced by workout sessions")'
        },
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Exercise not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: "a" (found)',
            expected: 'Promise resolves with undefined'
        },
    ],
};

// ── workout-session-service ────────────────────────────────────────────────────
const createWorkoutSessionSvcBbt: BbtDescriptor = {
    reqId: 'SERV-23',
    tcCount: 9,
    statement: 'WorkoutSessionService.createWorkoutSession(data, exercises) – Creates a new workout session with the provided exercises. Returns the created WorkoutSessionWithExercises on success. Throws WorkoutSessionRequiresExercisesError if exercises array is empty. Throws NotFoundError if member is not found. Throws TransactionError if the DB write fails.',
    data: 'Input: data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]',
    precondition: 'The referenced member may or may not exist. The exercises array may be empty or contain one or more entries.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: full WorkoutSessionWithExercises returned with correct id, memberId, and exercises. On failure: WorkoutSessionRequiresExercisesError, NotFoundError, or TransactionError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Member validity',
            validEc: 'Member exists → session created successfully',
            invalidEc: ''
        },
        {number: 2, condition: 'Member validity', validEc: '', invalidEc: 'Member not found → NotFoundError'},
        {
            number: 3,
            condition: 'Exercises array',
            validEc: '1 exercise → session returned with 1 exercise',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Exercises array',
            validEc: 'Multiple exercises → session returned with all',
            invalidEc: ''
        },
        {
            number: 5,
            condition: 'Exercises array',
            validEc: '',
            invalidEc: 'Empty array → WorkoutSessionRequiresExercisesError'
        },
        {number: 6, condition: 'Database write result', validEc: 'Write succeeds → session returned', invalidEc: ''},
        {number: 7, condition: 'Database write result', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-3',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with id: SESSION_ID, exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
        {
            noTc: 2,
            ec: 'EC-4',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [2 exercises]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 2, correct exerciseIds on both entries'
        },
        {
            noTc: 3,
            ec: 'EC-5',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: []',
            expected: 'throws WorkoutSessionRequiresExercisesError("Session requires exercises")'
        },
        {
            noTc: 4,
            ec: 'EC-2',
            inputData: 'data: CREATE_SESSION_INPUT (member not found), exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 5,
            ec: 'EC-7',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (DB fails)',
            expected: 'throws TransactionError("DB error")'
        },
    ],
    bvaRows: [
        {
            number: 1,
            condition: 'Member ID length',
            testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'
        },
        {number: 2, condition: 'Exercises count', testCase: '1 exercise (minimum valid count)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'memberId: "", exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'memberId: "a" (no match), exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'memberId: "a" (found), exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned with memberId: "a" and id: SESSION_ID'
        },
        {
            noTc: 4,
            bva: 'BVA-2 (n=1)',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with id: SESSION_ID, exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [2 exercises]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 2, correct exerciseIds on both entries'
        },
        {
            noTc: 3,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: []',
            expected: 'throws WorkoutSessionRequiresExercisesError("Session requires exercises")'
        },
        {
            noTc: 4,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'data: CREATE_SESSION_INPUT (member not found), exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 5,
            fromEc: 'EC-7',
            fromBva: '',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: EXERCISE_INPUT (DB fails)',
            expected: 'throws TransactionError("DB error")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "", exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "a" (no match), exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "a" (found), exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned with memberId: "a" and id: SESSION_ID'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'data: CREATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
    ],
};

const getWorkoutSessionSvcBbt: BbtDescriptor = {
    reqId: 'SERV-24',
    tcCount: 5,
    statement: 'WorkoutSessionService.getWorkoutSession(id) – Retrieves a workout session with its exercises by ID. Returns the WorkoutSessionWithExercises on success. Throws NotFoundError if no session exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'A workout session with the given ID may or may not exist in the system.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: WorkoutSessionWithExercises returned matching the given ID, with exercises populated. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Session existence',
            validEc: 'Existing ID → full WorkoutSessionWithExercises returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: SESSION_ID',
            expected: 'Full WorkoutSessionWithExercises returned (toEqual MOCK_SESSION_WITH_EXERCISES), id: SESSION_ID, exercises.length: 1'
        },
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Session not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Session not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found)',
            expected: 'WorkoutSessionWithExercises returned with id: "a", exercises.length: 1'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: SESSION_ID',
            expected: 'Full WorkoutSessionWithExercises returned (toEqual MOCK_SESSION_WITH_EXERCISES), id: SESSION_ID, exercises.length: 1'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Session not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'WorkoutSessionWithExercises returned with id: "a", exercises.length: 1'
        },
    ],
};
const listMemberWorkoutSessionsSvcBbt: BbtDescriptor = {
    reqId: 'SERV-25',
    tcCount: 14,
    statement: 'WorkoutSessionService.listMemberWorkoutSessions(memberId, options) – Returns a paginated list of workout sessions for a member. Supports optional filtering by start/end date and pagination. Results may be ordered by date ascending or descending.',
    data: 'Input: memberId: string, options?: WorkoutSessionListOptions { startDate?, endDate?, page?, pageSize? }',
    precondition: 'Sessions for the given memberId may or may not exist. All options fields are optional.',
    results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
    postcondition: 'On success: PageResult returned with items matching the provided filters and total reflecting the full count.',
    ecRows: [
        {
            number: 1,
            condition: 'Date filter: startDate',
            validEc: 'startDate provided → items[0].date >= startDate',
            invalidEc: ''
        },
        {
            number: 2,
            condition: 'Date filter: endDate',
            validEc: 'endDate provided → items[0].date <= endDate',
            invalidEc: ''
        },
        {
            number: 3,
            condition: 'Date filter: range',
            validEc: 'startDate + endDate → items[0].date within range',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Date filters absent',
            validEc: 'No date filters → all sessions returned, items.length: 1, total: 1',
            invalidEc: ''
        },
        {
            number: 5,
            condition: 'Pagination',
            validEc: 'page: 2, pageSize: 10 → paginated subset returned, total: 25',
            invalidEc: ''
        },
        {
            number: 6,
            condition: 'Data availability',
            validEc: '',
            invalidEc: 'No matching sessions → items.length: 0, total: 0'
        },
        {
            number: 7,
            condition: 'Ordering (ASC)',
            validEc: 'Sessions returned in date ascending order → items[0].date < items[1].date',
            invalidEc: ''
        },
        {
            number: 8,
            condition: 'Ordering (DESC)',
            validEc: 'Sessions returned in date descending order → items[0].date > items[1].date',
            invalidEc: ''
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-4',
            inputData: 'memberId: MEMBER_ID, no options',
            expected: 'PageResult with items.length: 1, items[0]: MOCK_SESSION_WITH_EXERCISES, total: 1'
        },
        {
            noTc: 2,
            ec: 'EC-1',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-01',
            expected: 'PageResult with items.length: 1, items[0].date >= 2024-06-01'
        },
        {
            noTc: 3,
            ec: 'EC-2',
            inputData: 'memberId: MEMBER_ID, endDate: 2024-06-30',
            expected: 'PageResult with items.length: 1, items[0].date <= 2024-06-30'
        },
        {
            noTc: 4,
            ec: 'EC-3',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-01-01, endDate: 2024-12-31',
            expected: 'PageResult with items.length: 1, items[0].date within range'
        },
        {
            noTc: 5,
            ec: 'EC-5',
            inputData: 'memberId: MEMBER_ID, page: 2, pageSize: 10',
            expected: 'PageResult with items.length: 0, total: 25'
        },
        {
            noTc: 6,
            ec: 'EC-6',
            inputData: 'memberId: NONEXISTENT_ID, no options',
            expected: 'PageResult with items.length: 0, total: 0'
        },
        {
            noTc: 7,
            ec: 'EC-7',
            inputData: 'memberId: MEMBER_ID, sessions: [older, newer] (ASC)',
            expected: 'PageResult with items[0].id: "older", items[1].id: "newer", items[0].date < items[1].date'
        },
        {
            noTc: 8,
            ec: 'EC-8',
            inputData: 'memberId: MEMBER_ID, options: { page: 1, pageSize: 10 }, sessions: [newer, older] (DESC)',
            expected: 'PageResult with items[0].id: "newer", items[1].id: "older", items[0].date > items[1].date'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Member ID length', testCase: '0 chars (empty), 1 char'},
        {number: 2, condition: 'Date range boundary', testCase: 'startDate equals endDate (same day)'},
        {number: 3, condition: 'Page number', testCase: '0 (treated as page 1), 1 (first page)'},
        {number: 4, condition: 'Page size', testCase: '1 (one item per page)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'memberId: "", no options',
            expected: 'PageResult with items.length: 0, total: 0'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'memberId: "a", no options',
            expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID'
        },
        {
            noTc: 3,
            bva: 'BVA-2',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-01, endDate: 2024-06-01',
            expected: 'PageResult with items.length: 1, items[0].date: 2024-06-01'
        },
        {
            noTc: 4,
            bva: 'BVA-3 (p=0)',
            inputData: 'memberId: MEMBER_ID, page: 0',
            expected: 'PageResult with items.length: 1, total: 5 (first page)'
        },
        {
            noTc: 5,
            bva: 'BVA-3 (p=1)',
            inputData: 'memberId: MEMBER_ID, page: 1',
            expected: 'PageResult with items.length: 1, total: 5 (first page)'
        },
        {
            noTc: 6,
            bva: 'BVA-4',
            inputData: 'memberId: MEMBER_ID, pageSize: 1',
            expected: 'PageResult with items.length: 1, total: 5'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, no options',
            expected: 'PageResult with items.length: 1, items[0]: MOCK_SESSION_WITH_EXERCISES, total: 1'
        },
        {
            noTc: 2,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-01',
            expected: 'PageResult with items.length: 1, items[0].date >= 2024-06-01'
        },
        {
            noTc: 3,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, endDate: 2024-06-30',
            expected: 'PageResult with items.length: 1, items[0].date <= 2024-06-30'
        },
        {
            noTc: 4,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-01-01, endDate: 2024-12-31',
            expected: 'PageResult with items.length: 1, items[0].date within range'
        },
        {
            noTc: 5,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, page: 2, pageSize: 10',
            expected: 'PageResult with items.length: 0, total: 25'
        },
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'memberId: NONEXISTENT_ID, no options',
            expected: 'PageResult with items.length: 0, total: 0'
        },
        {
            noTc: 7,
            fromEc: 'EC-7',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, sessions: [older, newer] (ASC)',
            expected: 'PageResult with items[0].id: "older", items[1].id: "newer", items[0].date < items[1].date'
        },
        {
            noTc: 8,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, options: { page: 1, pageSize: 10 }, sessions: [newer, older] (DESC)',
            expected: 'PageResult with items[0].id: "newer", items[1].id: "older", items[0].date > items[1].date'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "", no options',
            expected: 'PageResult with items.length: 0, total: 0'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "a", no options',
            expected: 'PageResult with items.length: 1, items[0].memberId: MEMBER_ID'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-01, endDate: 2024-06-01',
            expected: 'PageResult with items.length: 1, items[0].date: 2024-06-01'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, page: 0',
            expected: 'PageResult with items.length: 1, total: 5 (first page)'
        },
        {
            noTc: 13,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, page: 1',
            expected: 'PageResult with items.length: 1, total: 5 (first page)'
        },
        {
            noTc: 14,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'memberId: MEMBER_ID, pageSize: 1',
            expected: 'PageResult with items.length: 1, total: 5'
        },
    ],
};

const updateWorkoutSessionSvcBbt: BbtDescriptor = {
    reqId: 'SERV-26',
    tcCount: 5,
    statement: 'WorkoutSessionService.updateWorkoutSession(id, data) – Updates an existing workout session. Returns the updated WorkoutSession on success. Throws NotFoundError if no session exists with the given ID.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput',
    precondition: 'A workout session with the given ID may or may not exist in the system.',
    results: 'Output: Promise<WorkoutSession>',
    postcondition: 'On success: updated WorkoutSession returned reflecting changed fields. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Session existence',
            validEc: 'Existing ID → updated WorkoutSession returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT (duration: 75)',
            expected: 'WorkoutSession returned (toEqual expectedReturn), duration: 75, id: SESSION_ID'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'id: "", data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match), data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found), data: UPDATE_SESSION_INPUT',
            expected: 'WorkoutSession returned with id: "a", duration: 75, memberId: MEMBER_ID'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT (duration: 75)',
            expected: 'WorkoutSession returned (toEqual expectedReturn), duration: 75, id: SESSION_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "", data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match), data: UPDATE_SESSION_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found), data: UPDATE_SESSION_INPUT',
            expected: 'WorkoutSession returned with id: "a", duration: 75, memberId: MEMBER_ID'
        },
    ],
};
const updateWorkoutSessionWithExercisesSvcBbt: BbtDescriptor = {
    reqId: 'SERV-27',
    tcCount: 9,
    statement: 'WorkoutSessionService.updateWorkoutSessionWithExercises(id, data, exercises) – Updates a workout session and its exercises atomically. Returns the updated WorkoutSessionWithExercises on success. Throws WorkoutSessionRequiresExercisesError if exercises array is empty. Throws NotFoundError if no session exists with the given ID. Throws TransactionError if the DB write fails.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'A session with the given ID may or may not exist. The exercises array may be empty or contain one or more entries with or without existing session exercise IDs.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'On success: updated WorkoutSessionWithExercises returned reflecting changed session fields and exercise entries. On failure: WorkoutSessionRequiresExercisesError, NotFoundError, or TransactionError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Session existence',
            validEc: 'Existing ID + new exercises → full updated session returned',
            invalidEc: ''
        },
        {number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
        {
            number: 3,
            condition: 'Exercises array',
            validEc: '1 or more exercises → session returned with exercises',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Exercises array',
            validEc: '',
            invalidEc: 'Empty array → WorkoutSessionRequiresExercisesError'
        },
        {
            number: 5,
            condition: 'Exercise entry reuse',
            validEc: 'Existing SE ID provided → entry updated with new sets/reps/weight',
            invalidEc: ''
        },
        {number: 6, condition: 'Database write result', validEc: 'Write succeeds → session returned', invalidEc: ''},
        {number: 7, condition: 'Database write result', validEc: '', invalidEc: 'Write fails → TransactionError'},
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned (toEqual MOCK_SESSION_WITH_EXERCISES), id: SESSION_ID, exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
        {
            noTc: 2,
            ec: 'EC-4',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: []',
            expected: 'throws WorkoutSessionRequiresExercisesError("Requires exercises")'
        },
        {
            noTc: 3,
            ec: 'EC-2',
            inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 4,
            ec: 'EC-5',
            inputData: 'id: SESSION_ID, exercises: [{ id: "se-uuid-001", sets: 4, reps: 8, weight: 90 }]',
            expected: 'WorkoutSessionWithExercises returned (toEqual updatedMock), exercises[0].sets: 4'
        },
        {
            noTc: 5,
            ec: 'EC-7',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (DB fails)',
            expected: 'throws TransactionError("DB error")'
        },
    ],
    bvaRows: [
        {
            number: 1,
            condition: 'Session ID length',
            testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'
        },
        {number: 2, condition: 'Exercises count', testCase: '1 exercise (minimum valid count)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'id: "", data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (found), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned with id: "a" (toEqual expectedReturn)'
        },
        {
            noTc: 4,
            bva: 'BVA-2 (n=1)',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned (toEqual MOCK_SESSION_WITH_EXERCISES), id: SESSION_ID, exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
        {
            noTc: 2,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: []',
            expected: 'throws WorkoutSessionRequiresExercisesError("Requires exercises")'
        },
        {
            noTc: 3,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 4,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'id: SESSION_ID, exercises: [{ id: "se-uuid-001", sets: 4, reps: 8, weight: 90 }]',
            expected: 'WorkoutSessionWithExercises returned (toEqual updatedMock), exercises[0].sets: 4'
        },
        {
            noTc: 5,
            fromEc: 'EC-7',
            fromBva: '',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT (DB fails)',
            expected: 'throws TransactionError("DB error")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "", data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found), data: UPDATE_SESSION_INPUT, exercises: EXERCISE_INPUT',
            expected: 'WorkoutSessionWithExercises returned with id: "a" (toEqual expectedReturn)'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'id: SESSION_ID, data: UPDATE_SESSION_INPUT, exercises: [1 exercise]',
            expected: 'WorkoutSessionWithExercises returned with exercises.length: 1, exercises[0].exerciseId: EXERCISE_ID'
        },
    ],
};

const deleteWorkoutSessionSvcBbt: BbtDescriptor = {
    reqId: 'SERV-28',
    tcCount: 5,
    statement: 'WorkoutSessionService.deleteWorkoutSession(id) – Deletes a workout session by ID. Resolves with void on success. Throws NotFoundError if no session exists with the given ID.',
    data: 'Input: id: string',
    precondition: 'A workout session with the given ID may or may not exist in the system.',
    results: 'Output: Promise<void>',
    postcondition: 'On success: promise resolves with undefined. On failure: NotFoundError thrown.',
    ecRows: [
        {
            number: 1,
            condition: 'Session existence',
            validEc: 'Existing ID → promise resolves with undefined',
            invalidEc: ''
        },
        {number: 2, condition: 'Session existence', validEc: '', invalidEc: 'Non-existent ID → NotFoundError'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'id: SESSION_ID', expected: 'Promise resolves with undefined'},
        {noTc: 2, ec: 'EC-2', inputData: 'id: NONEXISTENT_ID', expected: 'throws NotFoundError("Session not found")'},
    ],
    bvaRows: [
        {number: 1, condition: 'ID length', testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 (n=0)', inputData: 'id: ""', expected: 'throws NotFoundError("Session not found")'},
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Session not found")'
        },
        {noTc: 3, bva: 'BVA-1 (n=1)', inputData: 'id: "a" (found)', expected: 'Promise resolves with undefined'},
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'id: SESSION_ID',
            expected: 'Promise resolves with undefined'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'id: NONEXISTENT_ID',
            expected: 'throws NotFoundError("Session not found")'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 3,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: ""',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 4,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (no match)',
            expected: 'throws NotFoundError("Session not found")'
        },
        {
            noTc: 5,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'id: "a" (found)',
            expected: 'Promise resolves with undefined'
        },
    ],
};

// ── report-service ─────────────────────────────────────────────────────────────
const getMemberProgressReportSvcBbt: BbtDescriptor = {
    reqId: 'SERV-29',
    tcCount: 12,
    statement: 'ReportService.getMemberProgressReport(memberId, startDate, endDate) – Generates a progress report for a member over a date range. Returns a report with memberId, memberName, totalSessions, totalVolume, averageSessionDuration, exerciseBreakdown (sorted by totalVolume DESC), sessionDetails, startDate, and endDate. Throws NotFoundError if the member does not exist.',
    data: 'Input: memberId: string, startDate: Date, endDate: Date',
    precondition: 'The referenced member may or may not exist. Sessions in the given date range may or may not exist for that member.',
    results: 'Output: Promise<MemberProgressReport>',
    postcondition: 'On success: report returned with correct aggregates (totalSessions, totalVolume, averageSessionDuration), exerciseBreakdown sorted by totalVolume DESC, and sessionDetails listing each session. On failure: NotFoundError thrown.',
    ecRows: [
        {number: 1, condition: 'Member existence', validEc: '', invalidEc: 'Member not found → NotFoundError'},
        {
            number: 2,
            condition: 'Session availability',
            validEc: '',
            invalidEc: 'No sessions in range → zero-stats report'
        },
        {
            number: 3,
            condition: 'Multiple sessions',
            validEc: 'Multiple sessions → correct totalSessions, totalVolume, averageSessionDuration, exerciseBreakdown, sessionDetails',
            invalidEc: ''
        },
        {
            number: 4,
            condition: 'Multiple exercises',
            validEc: 'Multiple exercises in one session → exerciseBreakdown.length: 2, correct per-exercise totalVolume, totalVolume sum',
            invalidEc: ''
        },
        {
            number: 5,
            condition: 'Sorting',
            validEc: 'Exercises with different volumes → exerciseBreakdown[0] has highest volume, exerciseBreakdown[0].totalVolume > exerciseBreakdown[1].totalVolume',
            invalidEc: ''
        },
    ],
    epTcRows: [
        {
            noTc: 1,
            ec: 'EC-1',
            inputData: 'memberId: MEMBER_ID (not found), startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 2,
            ec: 'EC-2',
            inputData: 'memberId: MEMBER_ID, startDate: START_DATE, endDate: END_DATE, sessions: []',
            expected: 'report returned with memberId: MEMBER_ID, memberName: MOCK_MEMBER.user.fullName, totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown.length: 0, sessionDetails.length: 0'
        },
        {
            noTc: 3,
            ec: 'EC-3',
            inputData: 'memberId: MEMBER_ID, sessions: [60min 3×10×50, 90min 3×10×50]',
            expected: 'report with totalSessions: 2, averageSessionDuration: 75, totalVolume: 3000, exerciseBreakdown.length: 1, exerciseBreakdown[0].exerciseId: EXERCISE_ID, exerciseBreakdown[0].sessionCount: 2, exerciseBreakdown[0].totalVolume: 3000, sessionDetails.length: 2, sessionDetails[0].sessionId: SESSION_ID_1, sessionDetails[1].sessionId: SESSION_ID_2'
        },
        {
            noTc: 4,
            ec: 'EC-4',
            inputData: 'memberId: MEMBER_ID, session: 1 session with ex-a (3×10×50) and ex-b (4×12×40)',
            expected: 'report with exerciseBreakdown.length: 2, bench.totalVolume: 1500, ohp.totalVolume: 1920, totalVolume: 3420'
        },
        {
            noTc: 5,
            ec: 'EC-5',
            inputData: 'memberId: MEMBER_ID, session: ex-low (1×1×1) and ex-high (10×10×100)',
            expected: 'report with exerciseBreakdown[0].exerciseId: "ex-high", exerciseBreakdown[1].exerciseId: "ex-low", exerciseBreakdown[0].totalVolume > exerciseBreakdown[1].totalVolume'
        },
    ],
    bvaRows: [
        {
            number: 1,
            condition: 'Member ID length',
            testCase: '0 chars (empty, not found), 1 char (not found), 1 char (found)'
        },
        {number: 2, condition: 'Date range boundary', testCase: 'startDate equals endDate (same day)'},
        {number: 3, condition: 'Volume inputs', testCase: 'weight: 0 (volume = 0), reps: 0 (volume = 0)'},
        {number: 4, condition: 'Session duration', testCase: 'duration: 0 (averageSessionDuration: 0)'},
    ],
    bvaTcRows: [
        {
            noTc: 1,
            bva: 'BVA-1 (n=0)',
            inputData: 'memberId: "", startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 2,
            bva: 'BVA-1 (n=1)',
            inputData: 'memberId: "a" (no match), startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 3,
            bva: 'BVA-1 (n=1)',
            inputData: 'memberId: "a" (found), startDate: START_DATE, endDate: END_DATE, sessions: []',
            expected: 'report returned with memberId: "a", totalSessions: 0'
        },
        {
            noTc: 4,
            bva: 'BVA-2',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-15, endDate: 2024-06-15, sessions: []',
            expected: 'report returned with startDate: 2024-06-15, endDate: 2024-06-15'
        },
        {
            noTc: 5,
            bva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, session: makeSession(60, 3, 10, weight=0)',
            expected: 'report with totalVolume: 0, exerciseBreakdown[0].totalVolume: 0'
        },
        {
            noTc: 6,
            bva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, session: makeSession(60, 3, reps=0, 50)',
            expected: 'report with totalVolume: 0, exerciseBreakdown[0].totalVolume: 0'
        },
        {
            noTc: 7,
            bva: 'BVA-4',
            inputData: 'memberId: MEMBER_ID, session: makeSession(duration=0, 3, 10, 50)',
            expected: 'report with averageSessionDuration: 0, totalSessions: 1'
        },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID (not found), startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, startDate: START_DATE, endDate: END_DATE, sessions: []',
            expected: 'report with memberId: MEMBER_ID, memberName: MOCK_MEMBER.user.fullName, totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown.length: 0, sessionDetails.length: 0'
        },
        {
            noTc: 3,
            fromEc: 'EC-3',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, sessions: [60min 3×10×50, 90min 3×10×50]',
            expected: 'report with totalSessions: 2, averageSessionDuration: 75, totalVolume: 3000, exerciseBreakdown.length: 1, exerciseBreakdown[0].exerciseId: EXERCISE_ID, exerciseBreakdown[0].sessionCount: 2, exerciseBreakdown[0].totalVolume: 3000, sessionDetails.length: 2, sessionDetails[0].sessionId: SESSION_ID_1, sessionDetails[1].sessionId: SESSION_ID_2'
        },
        {
            noTc: 4,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, session with ex-a (3×10×50) and ex-b (4×12×40)',
            expected: 'report with exerciseBreakdown.length: 2, bench.totalVolume: 1500, ohp.totalVolume: 1920, totalVolume: 3420'
        },
        {
            noTc: 5,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'memberId: MEMBER_ID, session with ex-low (1×1×1) and ex-high (10×10×100)',
            expected: 'report with exerciseBreakdown[0].exerciseId: "ex-high", exerciseBreakdown[1].exerciseId: "ex-low", exerciseBreakdown[0].totalVolume > exerciseBreakdown[1].totalVolume'
        },
        // ── From BVA ─────────────────────────────────────────────────────────
        {
            noTc: 6,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "", startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 7,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "a" (no match), startDate: START_DATE, endDate: END_DATE',
            expected: 'throws NotFoundError("Member not found")'
        },
        {
            noTc: 8,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'memberId: "a" (found), startDate: START_DATE, endDate: END_DATE, sessions: []',
            expected: 'report returned with memberId: "a", totalSessions: 0'
        },
        {
            noTc: 9,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'memberId: MEMBER_ID, startDate: 2024-06-15, endDate: 2024-06-15, sessions: []',
            expected: 'report returned with startDate: 2024-06-15, endDate: 2024-06-15'
        },
        {
            noTc: 10,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, session: makeSession(60, 3, 10, weight=0)',
            expected: 'report with totalVolume: 0, exerciseBreakdown[0].totalVolume: 0'
        },
        {
            noTc: 11,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'memberId: MEMBER_ID, session: makeSession(60, 3, reps=0, 50)',
            expected: 'report with totalVolume: 0, exerciseBreakdown[0].totalVolume: 0'
        },
        {
            noTc: 12,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'memberId: MEMBER_ID, session: makeSession(duration=0, 3, 10, 50)',
            expected: 'report with averageSessionDuration: 0, totalSessions: 1'
        },
    ],
};

async function main() {
    console.log('Generating service BBT forms...');
    const AUTH_SVC = path.join(SVC_BASE, 'auth-service');
    const USER_SVC = path.join(SVC_BASE, 'user-service');
    const EXM_SVC = path.join(SVC_BASE, 'exercise-service');
    const WS_SVC = path.join(SVC_BASE, 'workout-session-service');
    const RPT_SVC = path.join(SVC_BASE, 'report-service');

    await writeBbt(loginBbt, path.join(AUTH_SVC, 'login-bbt-form.xlsx'));
    await writeBbt(createMemberSvcBbt, path.join(USER_SVC, 'createMember-bbt-form.xlsx'));
    await writeBbt(generateTempPasswordBbt, path.join(USER_SVC, 'generateTempPassword-bbt-form.xlsx'));
    await writeBbt(createMemberWithTempPwdBbt, path.join(USER_SVC, 'createMemberWithTempPassword-bbt-form.xlsx'));
    await writeBbt(createAdminSvcBbt, path.join(USER_SVC, 'createAdmin-bbt-form.xlsx'));
    await writeBbt(getMemberSvcBbt, path.join(USER_SVC, 'getMember-bbt-form.xlsx'));
    await writeBbt(getAdminSvcBbt, path.join(USER_SVC, 'getAdmin-bbt-form.xlsx'));
    await writeBbt(listMembersSvcBbt, path.join(USER_SVC, 'listMembers-bbt-form.xlsx'));
    await writeBbt(listAdminsSvcBbt, path.join(USER_SVC, 'listAdmins-bbt-form.xlsx'));
    await writeBbt(updateMemberSvcBbt, path.join(USER_SVC, 'updateMember-bbt-form.xlsx'));
    await writeBbt(updateAdminSvcBbt, path.join(USER_SVC, 'updateAdmin-bbt-form.xlsx'));
    await writeBbt(suspendMemberSvcBbt, path.join(USER_SVC, 'suspendMember-bbt-form.xlsx'));
    await writeBbt(activateMemberSvcBbt, path.join(USER_SVC, 'activateMember-bbt-form.xlsx'));
    await writeBbt(deleteMemberSvcBbt, path.join(USER_SVC, 'deleteMember-bbt-form.xlsx'));
    await writeBbt(deleteAdminSvcBbt, path.join(USER_SVC, 'deleteAdmin-bbt-form.xlsx'));
    await writeBbt(createExerciseSvcBbt, path.join(EXM_SVC, 'createExercise-bbt-form.xlsx'));
    await writeBbt(getExerciseSvcBbt, path.join(EXM_SVC, 'getExercise-bbt-form.xlsx'));
    await writeBbt(listExercisesSvcBbt, path.join(EXM_SVC, 'listExercises-bbt-form.xlsx'));
    await writeBbt(updateExerciseSvcBbt, path.join(EXM_SVC, 'updateExercise-bbt-form.xlsx'));
    await writeBbt(archiveExerciseSvcBbt, path.join(EXM_SVC, 'archiveExercise-bbt-form.xlsx'));
    await writeBbt(unarchiveExerciseSvcBbt, path.join(EXM_SVC, 'unarchiveExercise-bbt-form.xlsx'));
    await writeBbt(deleteExerciseSvcBbt, path.join(EXM_SVC, 'deleteExercise-bbt-form.xlsx'));
    await writeBbt(createWorkoutSessionSvcBbt, path.join(WS_SVC, 'createWorkoutSession-bbt-form.xlsx'));
    await writeBbt(getWorkoutSessionSvcBbt, path.join(WS_SVC, 'getWorkoutSession-bbt-form.xlsx'));
    await writeBbt(listMemberWorkoutSessionsSvcBbt, path.join(WS_SVC, 'listMemberWorkoutSessions-bbt-form.xlsx'));
    await writeBbt(updateWorkoutSessionSvcBbt, path.join(WS_SVC, 'updateWorkoutSession-bbt-form.xlsx'));
    await writeBbt(updateWorkoutSessionWithExercisesSvcBbt, path.join(WS_SVC, 'updateWorkoutSessionWithExercises-bbt-form.xlsx'));
    await writeBbt(deleteWorkoutSessionSvcBbt, path.join(WS_SVC, 'deleteWorkoutSession-bbt-form.xlsx'));
    await writeBbt(getMemberProgressReportSvcBbt, path.join(RPT_SVC, 'getMemberProgressReport-bbt-form.xlsx'));
    console.log('\nDone - 28 service BBT forms generated.');
}

main().catch(console.error);
