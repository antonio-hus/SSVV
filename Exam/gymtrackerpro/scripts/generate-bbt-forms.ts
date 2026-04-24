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
    tcCount: number; // Will be overriden by finalTcRows.length in statistics
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
    bugsFixed?: number | string;
    retested?: string;
    retestRun?: number | string;
    retestPassed?: number | string;
    retestFailed?: number | string;
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const THIN = {style: 'thin' as const};
const BORDER: Partial<ExcelJS.Borders> = {top: THIN, left: THIN, bottom: THIN, right: THIN};

const FILL_SECTION: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFBDD7EE'}};
const FILL_HEADER: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9E1F2'}};
const FILL_LABEL: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFEDEDED'}};
const FILL_PASS: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFE2EFDA'}};

function styleSection(cell: ExcelJS.Cell): void {
    cell.font = {bold: true, color: {argb: 'FF1F3864'}};
    cell.fill = FILL_SECTION;
    cell.border = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

function styleHeader(cell: ExcelJS.Cell): void {
    cell.font = {bold: true};
    cell.fill = FILL_HEADER;
    cell.border = BORDER;
    cell.alignment = {wrapText: true, vertical: 'middle', horizontal: 'center'};
}

function styleLabel(cell: ExcelJS.Cell): void {
    cell.font = {bold: true};
    cell.fill = FILL_LABEL;
    cell.border = BORDER;
    cell.alignment = {wrapText: true, vertical: 'top'};
}

function styleData(cell: ExcelJS.Cell): void {
    cell.border = BORDER;
    cell.alignment = {wrapText: true, vertical: 'top'};
}

function stylePassed(cell: ExcelJS.Cell): void {
    cell.font = {color: {argb: 'FF375623'}};
    cell.fill = FILL_PASS;
    cell.border = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

// ── Sheet builders ─────────────────────────────────────────────────────────────

function addProblemSheet(wb: ExcelJS.Workbook, d: BbtDescriptor): void {
    const ws = wb.addWorksheet('Problem');
    ws.columns = [{width: 22}, {width: 110}];

    // Statement (merged A:B)
    let row = ws.addRow([`Statement: ${d.statement}`, '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).border = BORDER;
    row.getCell(1).alignment = {wrapText: true, vertical: 'top'};
    row.height = 80;

    ws.addRow(['', '']);  // blank separator

    // Specification section
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

    ws.addRow(['', '']);  // blank separator

    // Results section
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
    // A=Req.ID  B-E=Testing(TCs run|passed|failed|Bugs)  F=Debugging(Bugs Fixed)  G-J=Re-testing(Re-tested|TCs run|passed|failed)
    ws.columns = [
        {width: 20},  // A: Req. ID
        {width: 10},  // B: TCs run
        {width: 12},  // C: TCs passed
        {width: 12},  // D: TCs failed
        {width: 12},  // E: No of BUGS
        {width: 13},  // F: Bugs Fixed (Debugging)
        {width: 12},  // G: Re-tested
        {width: 10},  // H: TCs run
        {width: 12},  // I: TCs passed
        {width: 12},  // J: TCs failed
    ];

    // Section header row: Testing (B-E), Debugging (F), Re-testing (G-J)
    const sRow = ws.addRow(['', 'Testing', '', '', '', 'Debugging', 'Re-testing', '', '', '']);
    ws.mergeCells(`B${sRow.number}:E${sRow.number}`);
    ws.mergeCells(`G${sRow.number}:J${sRow.number}`);
    sRow.getCell(1).border = BORDER;
    styleSection(sRow.getCell(2));  // Testing (top-left of merge)
    styleSection(sRow.getCell(6));  // Debugging
    styleSection(sRow.getCell(7));  // Re-testing (top-left of merge)
    [3, 4, 5, 8, 9, 10].forEach(c => {
        sRow.getCell(c).fill = FILL_SECTION;
        sRow.getCell(c).border = BORDER;
    });
    sRow.height = 20;

    // Column header row
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    const wb = await buildWorkbook(descriptor);
    await wb.xlsx.writeFile(outputPath);
    console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

const BASE = path.join(ROOT, 'lib', 'schema', '__tests__', 'bbt');

const createUserSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-01',
    tcCount: 38,
    statement: 'createUserSchema – Validates the input for creating a user using Zod safeParse. Returns { success: true, data } when all fields satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field on any violation. Required fields: email (valid email format), fullName (8–64 characters after trimming, not whitespace-only), phone (E.164 format: +[1-9]\\d{1,14}), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character). Surrounding whitespace is trimmed from fullName, email, and phone before validation.',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
    precondition: 'Input is passed directly to createUserSchema.safeParse(). fullName rules: 8–64 characters after trim, not whitespace-only. password rules: 8–64 characters with at least one uppercase letter, one digit, and one special character. dateOfBirth: YYYY-MM-DD, strictly before today (yesterday is valid, today is not).',
    results: 'Output: { success: boolean, data?: CreateUserInput, error?: ZodError }',
    postcondition: 'On success: parsed data matches the (trimmed) input. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Input validity',       validEc: 'All fields valid → success: true, parsed data equals input', invalidEc: '' },
        { number: 2,  condition: 'email presence',       validEc: '', invalidEc: 'email omitted → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName presence',    validEc: '', invalidEc: 'fullName omitted → success: false, error path contains "fullName"' },
        { number: 4,  condition: 'phone presence',       validEc: '', invalidEc: 'phone omitted → success: false, error path contains "phone"' },
        { number: 5,  condition: 'dateOfBirth presence', validEc: '', invalidEc: 'dateOfBirth omitted → success: false, error path contains "dateOfBirth"' },
        { number: 6,  condition: 'password presence',    validEc: '', invalidEc: 'password omitted → success: false, error path contains "password"' },
        { number: 7,  condition: 'email format',         validEc: '', invalidEc: 'email: "invalidemail.com" (missing @) → success: false, error path contains "email"' },
        { number: 8,  condition: 'password uppercase',   validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 9,  condition: 'password digit',       validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 10, condition: 'password special char',validEc: '', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 11, condition: 'phone format',         validEc: '', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 12, condition: 'dateOfBirth format',   validEc: '', invalidEc: 'dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format) → success: false, error path contains "dateOfBirth"' },
        { number: 13, condition: 'dateOfBirth value',    validEc: '', invalidEc: 'dateOfBirth: "2099-01-01" (future date) → success: false, error path contains "dateOfBirth"' },
        { number: 14, condition: 'fullName content',     validEc: 'fullName: "  John Doe Test  " (surrounding whitespace) → success: true, parsed fullName is "John Doe Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 15, condition: 'email whitespace',     validEc: 'email: "  john.doe@example.com  " (surrounding whitespace) → success: true, parsed email is "john.doe@example.com"', invalidEc: '' },
        { number: 16, condition: 'phone whitespace',     validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values',                                                                          expected: 'success: true, parsed data equals input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid user data with email field omitted',                                                                                expected: 'success: false, error path contains "email"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid user data with fullName field omitted',                                                                             expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid user data with phone field omitted',                                                                                expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid user data with dateOfBirth field omitted',                                                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'valid user data with password field omitted',                                                                             expected: 'success: false, error path contains "password"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid user data with email: "invalidemail.com" (missing @)',                                                              expected: 'success: false, error path contains "email"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid user data with password: "secure1@pass" (no uppercase letter)',                                                     expected: 'success: false, error path contains "password"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid user data with password: "SecureP@ss" (no digit)',                                                                  expected: 'success: false, error path contains "password"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid user data with password: "SecurePass1" (no special character)',                                                     expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid user data with phone: "0712345678" (no country code prefix)',                                                       expected: 'success: false, error path contains "phone"' },
        { noTc: 12, ec: 'EC-12', inputData: 'valid user data with dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format)',                                               expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 13, ec: 'EC-13', inputData: 'valid user data with dateOfBirth: "2099-01-01" (future date)',                                                            expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, ec: 'EC-14', inputData: 'valid user data with fullName: "         " (whitespace-only)',                                                            expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, ec: 'EC-14', inputData: 'valid user data with fullName: "  John Doe Test  " (surrounding whitespace)',                                             expected: 'success: true, parsed fullName is "John Doe Test"' },
        { noTc: 16, ec: 'EC-15', inputData: 'valid user data with email: "  john.doe@example.com  " (surrounding whitespace)',                                         expected: 'success: true, parsed email is "john.doe@example.com"' },
        { noTc: 17, ec: 'EC-16', inputData: 'valid user data with phone: "  +40712345678  " (surrounding whitespace)',                                                 expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim): invalid → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum): → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum): → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum): → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'valid user data with fullName: "A".repeat(7) (7 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'valid user data with fullName: "A".repeat(8) (8 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'valid user data with fullName: "A".repeat(9) (9 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'valid user data with fullName: "A".repeat(63) (63 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'valid user data with fullName: "A".repeat(64) (64 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'valid user data with fullName: "A".repeat(65) (65 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',         inputData: 'valid user data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',         inputData: 'valid user data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',         inputData: 'valid user data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',        inputData: 'valid user data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',        inputData: 'valid user data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',        inputData: 'valid user data with password: "P1@" + "a".repeat(62) (65 characters)',                               expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',      inputData: 'valid user data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                 expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',     inputData: 'valid user data with dateOfBirth set to today (YYYY-MM-DD)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',      inputData: 'valid user data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',          inputData: 'valid user data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',             expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',         inputData: 'valid user data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',        inputData: 'valid user data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',        inputData: 'valid user data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',           expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values',                                                        expected: 'success: true, parsed data equals input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid user data with email field omitted',                                                              expected: 'success: false, error path contains "email"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid user data with fullName field omitted',                                                           expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid user data with phone field omitted',                                                              expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid user data with dateOfBirth field omitted',                                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'valid user data with password field omitted',                                                           expected: 'success: false, error path contains "password"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid user data with email: "invalidemail.com" (missing @)',                                            expected: 'success: false, error path contains "email"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid user data with password: "secure1@pass" (no uppercase letter)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid user data with password: "SecureP@ss" (no digit)',                                                expected: 'success: false, error path contains "password"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid user data with password: "SecurePass1" (no special character)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid user data with phone: "0712345678" (no country code prefix)',                                     expected: 'success: false, error path contains "phone"' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: 'valid user data with dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format)',                             expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: 'valid user data with dateOfBirth: "2099-01-01" (future date)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: 'valid user data with fullName: "         " (whitespace-only)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, fromEc: 'EC-14', fromBva: '', inputData: 'valid user data with fullName: "  John Doe Test  " (surrounding whitespace)',                           expected: 'success: true, parsed fullName is "John Doe Test"' },
        { noTc: 16, fromEc: 'EC-15', fromBva: '', inputData: 'valid user data with email: "  john.doe@example.com  " (surrounding whitespace)',                       expected: 'success: true, parsed email is "john.doe@example.com"' },
        { noTc: 17, fromEc: 'EC-16', fromBva: '', inputData: 'valid user data with phone: "  +40712345678  " (surrounding whitespace)',                               expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 18, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid user data with fullName: "A".repeat(7) (7 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid user data with fullName: "A".repeat(8) (8 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid user data with fullName: "A".repeat(9) (9 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid user data with fullName: "A".repeat(63) (63 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid user data with fullName: "A".repeat(64) (64 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid user data with fullName: "A".repeat(65) (65 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid user data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid user data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid user data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-10', inputData: 'valid user data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-11', inputData: 'valid user data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-12', inputData: 'valid user data with password: "P1@" + "a".repeat(62) (65 characters)',                               expected: 'success: false, error path contains "password"' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-13', inputData: 'valid user data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                 expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-14', inputData: 'valid user data with dateOfBirth set to today (YYYY-MM-DD)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-15', inputData: 'valid user data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-16', inputData: 'valid user data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',             expected: 'success: false, error path contains "fullName"' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-17', inputData: 'valid user data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-18', inputData: 'valid user data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-19', inputData: 'valid user data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',           expected: 'success: false, error path contains "fullName"' },
        // ── Deduplicated (BVA-13–15 overlap with EC-13 on dateOfBirth) ───────
        // BVA-13/14/15 are already included above as noTc 30–32;
        // no separate EC row for dateOfBirth boundary existed, so no deduplication needed.
    ],
};

const createMemberSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-02',
    tcCount: 39,
    statement: 'createMemberSchema – Validates the input for creating a gym member using Zod safeParse. Returns { success: true, data } when all fields satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field on any violation. Required fields: email (valid email format), fullName (8–64 characters after trimming, not whitespace-only), phone (E.164 format: +[1-9]\\d{1,14}), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character), membershipStart (YYYY-MM-DD; future dates accepted). Surrounding whitespace is trimmed from fullName, email, and phone before validation.',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
    precondition: 'Input is passed directly to createMemberSchema.safeParse(). fullName rules: 8–64 characters after trim, not whitespace-only. password rules: 8–64 characters with at least one uppercase letter, one digit, and one special character. dateOfBirth: YYYY-MM-DD, strictly before today (yesterday is valid, today is not). membershipStart: YYYY-MM-DD, any date including future.',
    results: 'Output: { success: boolean, data?: CreateMemberInput, error?: ZodError }',
    postcondition: 'On success: parsed data matches the (trimmed) input. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Input validity',          validEc: 'All fields valid → success: true, parsed data equals input', invalidEc: '' },
        { number: 2,  condition: 'email presence',          validEc: '', invalidEc: 'email omitted → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName presence',       validEc: '', invalidEc: 'fullName omitted → success: false, error path contains "fullName"' },
        { number: 4,  condition: 'phone presence',          validEc: '', invalidEc: 'phone omitted → success: false, error path contains "phone"' },
        { number: 5,  condition: 'dateOfBirth presence',    validEc: '', invalidEc: 'dateOfBirth omitted → success: false, error path contains "dateOfBirth"' },
        { number: 6,  condition: 'password presence',       validEc: '', invalidEc: 'password omitted → success: false, error path contains "password"' },
        { number: 7,  condition: 'membershipStart presence',validEc: '', invalidEc: 'membershipStart omitted → success: false, error path contains "membershipStart"' },
        { number: 8,  condition: 'email format',            validEc: '', invalidEc: 'email: "invalidemail.com" (missing @) → success: false, error path contains "email"' },
        { number: 9,  condition: 'password uppercase',      validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 10, condition: 'password digit',          validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 11, condition: 'password special char',   validEc: '', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 12, condition: 'phone format',            validEc: '', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 13, condition: 'dateOfBirth format',      validEc: '', invalidEc: 'dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format) → success: false, error path contains "dateOfBirth"' },
        { number: 14, condition: 'dateOfBirth value',       validEc: '', invalidEc: 'dateOfBirth: "2099-01-01" (future date) → success: false, error path contains "dateOfBirth"' },
        { number: 15, condition: 'membershipStart format',  validEc: '', invalidEc: 'membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "membershipStart"' },
        { number: 16, condition: 'membershipStart value',   validEc: 'membershipStart: "2099-01-01" (future date accepted) → success: true, parsed membershipStart is "2099-01-01"', invalidEc: '' },
        { number: 17, condition: 'fullName content',        validEc: 'fullName: "  John Doe Test  " (surrounding whitespace) → success: true, parsed fullName is "John Doe Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 18, condition: 'email whitespace',        validEc: 'email: "  john.doe@example.com  " (surrounding whitespace) → success: true, parsed email is "john.doe@example.com"', invalidEc: '' },
        { number: 19, condition: 'phone whitespace',        validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values',                                                                                       expected: 'success: true, parsed data equals input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid member data with email field omitted',                                                                                           expected: 'success: false, error path contains "email"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid member data with fullName field omitted',                                                                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid member data with phone field omitted',                                                                                           expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid member data with dateOfBirth field omitted',                                                                                     expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'valid member data with password field omitted',                                                                                        expected: 'success: false, error path contains "password"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid member data with membershipStart field omitted',                                                                                 expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid member data with email: "invalidemail.com" (missing @)',                                                                         expected: 'success: false, error path contains "email"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid member data with password: "secure1@pass" (no uppercase letter)',                                                                expected: 'success: false, error path contains "password"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid member data with password: "SecureP@ss" (no digit)',                                                                             expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid member data with password: "SecurePass1" (no special character)',                                                                expected: 'success: false, error path contains "password"' },
        { noTc: 12, ec: 'EC-12', inputData: 'valid member data with phone: "0712345678" (no country code prefix)',                                                                  expected: 'success: false, error path contains "phone"' },
        { noTc: 13, ec: 'EC-13', inputData: 'valid member data with dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format)',                                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, ec: 'EC-14', inputData: 'valid member data with dateOfBirth: "2099-01-01" (future date)',                                                                       expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, ec: 'EC-15', inputData: 'valid member data with membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                      expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 16, ec: 'EC-16', inputData: 'valid member data with membershipStart: "2099-01-01" (future date)',                                                                   expected: 'success: true, parsed membershipStart is "2099-01-01"' },
        { noTc: 17, ec: 'EC-17', inputData: 'valid member data with fullName: "         " (whitespace-only)',                                                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 18, ec: 'EC-17', inputData: 'valid member data with fullName: "  John Doe Test  " (surrounding whitespace)',                                                        expected: 'success: true, parsed fullName is "John Doe Test"' },
        { noTc: 19, ec: 'EC-18', inputData: 'valid member data with email: "  john.doe@example.com  " (surrounding whitespace)',                                                    expected: 'success: true, parsed email is "john.doe@example.com"' },
        { noTc: 20, ec: 'EC-19', inputData: 'valid member data with phone: "  +40712345678  " (surrounding whitespace)',                                                            expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim): invalid → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum): → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum): → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum): → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'valid member data with fullName: "A".repeat(7) (7 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'valid member data with fullName: "A".repeat(8) (8 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'valid member data with fullName: "A".repeat(9) (9 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'valid member data with fullName: "A".repeat(63) (63 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'valid member data with fullName: "A".repeat(64) (64 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'valid member data with fullName: "A".repeat(65) (65 characters)',                                     expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',         inputData: 'valid member data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',         inputData: 'valid member data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',         inputData: 'valid member data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',        inputData: 'valid member data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',            expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',        inputData: 'valid member data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',            expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',        inputData: 'valid member data with password: "P1@" + "a".repeat(62) (65 characters)',                             expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',      inputData: 'valid member data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',               expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',     inputData: 'valid member data with dateOfBirth set to today (YYYY-MM-DD)',                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',      inputData: 'valid member data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                 expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',          inputData: 'valid member data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',           expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',         inputData: 'valid member data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',        inputData: 'valid member data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',         expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',        inputData: 'valid member data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',         expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values',                                                        expected: 'success: true, parsed data equals input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid member data with email field omitted',                                                            expected: 'success: false, error path contains "email"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid member data with fullName field omitted',                                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid member data with phone field omitted',                                                            expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid member data with dateOfBirth field omitted',                                                      expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'valid member data with password field omitted',                                                         expected: 'success: false, error path contains "password"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid member data with membershipStart field omitted',                                                  expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid member data with email: "invalidemail.com" (missing @)',                                          expected: 'success: false, error path contains "email"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid member data with password: "secure1@pass" (no uppercase letter)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid member data with password: "SecureP@ss" (no digit)',                                              expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid member data with password: "SecurePass1" (no special character)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: 'valid member data with phone: "0712345678" (no country code prefix)',                                   expected: 'success: false, error path contains "phone"' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: 'valid member data with dateOfBirth: "15-01-1990" (DD-MM-YYYY, wrong format)',                           expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: 'valid member data with dateOfBirth: "2099-01-01" (future date)',                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, fromEc: 'EC-15', fromBva: '', inputData: 'valid member data with membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                       expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 16, fromEc: 'EC-16', fromBva: '', inputData: 'valid member data with membershipStart: "2099-01-01" (future date)',                                    expected: 'success: true, parsed membershipStart is "2099-01-01"' },
        { noTc: 17, fromEc: 'EC-17', fromBva: '', inputData: 'valid member data with fullName: "         " (whitespace-only)',                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 18, fromEc: 'EC-17', fromBva: '', inputData: 'valid member data with fullName: "  John Doe Test  " (surrounding whitespace)',                         expected: 'success: true, parsed fullName is "John Doe Test"' },
        { noTc: 19, fromEc: 'EC-18', fromBva: '', inputData: 'valid member data with email: "  john.doe@example.com  " (surrounding whitespace)',                     expected: 'success: true, parsed email is "john.doe@example.com"' },
        { noTc: 20, fromEc: 'EC-19', fromBva: '', inputData: 'valid member data with phone: "  +40712345678  " (surrounding whitespace)',                             expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 21, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid member data with fullName: "A".repeat(7) (7 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid member data with fullName: "A".repeat(8) (8 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid member data with fullName: "A".repeat(9) (9 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid member data with fullName: "A".repeat(63) (63 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid member data with fullName: "A".repeat(64) (64 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid member data with fullName: "A".repeat(65) (65 characters)',                                     expected: 'success: false, error path contains "fullName"' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid member data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid member data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid member data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-10', inputData: 'valid member data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',            expected: 'success: true, parsed password matches input' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-11', inputData: 'valid member data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',            expected: 'success: true, parsed password matches input' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-12', inputData: 'valid member data with password: "P1@" + "a".repeat(62) (65 characters)',                             expected: 'success: false, error path contains "password"' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-13', inputData: 'valid member data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',               expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-14', inputData: 'valid member data with dateOfBirth set to today (YYYY-MM-DD)',                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-15', inputData: 'valid member data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                 expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-16', inputData: 'valid member data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',           expected: 'success: false, error path contains "fullName"' },
        { noTc: 37, fromEc: '', fromBva: 'BVA-17', inputData: 'valid member data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 38, fromEc: '', fromBva: 'BVA-18', inputData: 'valid member data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',         expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 39, fromEc: '', fromBva: 'BVA-19', inputData: 'valid member data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',         expected: 'success: false, error path contains "fullName"' },
    ],
};

const createMemberWithTempPasswordSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-03',
    tcCount: 27,
    statement: 'createMemberWithTempPasswordSchema – Validates the input for creating a member whose password is auto-generated. Returns { success: true, data } when all required fields satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field on any violation. Required fields: email (valid email format), fullName (8–64 characters after trimming, not whitespace-only), phone (E.164 format: +[1-9]\\d{1,14}), dateOfBirth (YYYY-MM-DD, strictly before today), membershipStart (YYYY-MM-DD; future dates accepted). The password field is not required and is stripped from the parsed output if supplied. Surrounding whitespace is trimmed from fullName, email, and phone before validation.',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, membershipStart: string, password?: string (ignored) }',
    precondition: 'Input is passed directly to createMemberWithTempPasswordSchema.safeParse(). fullName rules: 8–64 characters after trim, not whitespace-only. dateOfBirth: YYYY-MM-DD, strictly before today (yesterday is valid, today is not). membershipStart: YYYY-MM-DD, any date including future. password: silently stripped if present.',
    results: 'Output: { success: boolean, data?: CreateMemberWithTempPasswordInput, error?: ZodError }',
    postcondition: 'On success: parsed data matches the (trimmed) input and contains no password field. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Input validity',           validEc: 'All required fields valid → success: true, parsed data equals input', invalidEc: '' },
        { number: 2,  condition: 'email presence',           validEc: '', invalidEc: 'email omitted → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName presence',        validEc: '', invalidEc: 'fullName omitted → success: false, error path contains "fullName"' },
        { number: 4,  condition: 'phone presence',           validEc: '', invalidEc: 'phone omitted → success: false, error path contains "phone"' },
        { number: 5,  condition: 'dateOfBirth presence',     validEc: '', invalidEc: 'dateOfBirth omitted → success: false, error path contains "dateOfBirth"' },
        { number: 6,  condition: 'membershipStart presence', validEc: '', invalidEc: 'membershipStart omitted → success: false, error path contains "membershipStart"' },
        { number: 7,  condition: 'email format',             validEc: '', invalidEc: 'email: "no" (no @ sign) → success: false, error path contains "email"' },
        { number: 8,  condition: 'phone format',             validEc: '', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 9,  condition: 'membershipStart format',   validEc: '', invalidEc: 'membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "membershipStart"' },
        { number: 10, condition: 'password field',           validEc: 'password field supplied alongside required fields → success: true, parsed output contains no password field', invalidEc: '' },
        { number: 11, condition: 'fullName content',         validEc: 'fullName: "  Jane Doe Test  " (surrounding whitespace) → success: true, parsed fullName is "Jane Doe Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 12, condition: 'email whitespace',         validEc: 'email: "  jane.doe@example.com  " (surrounding whitespace) → success: true, parsed email is "jane.doe@example.com"', invalidEc: '' },
        { number: 13, condition: 'phone whitespace',         validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values (no password field)',                                                                    expected: 'success: true, parsed data equals input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid member data with email field omitted',                                                                                           expected: 'success: false, error path contains "email"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid member data with fullName field omitted',                                                                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid member data with phone field omitted',                                                                                           expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid member data with dateOfBirth field omitted',                                                                                     expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'valid member data with membershipStart field omitted',                                                                                 expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid member data with email: "no" (no @ sign)',                                                                                       expected: 'success: false, error path contains "email"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid member data with phone: "0712345678" (no country code prefix)',                                                                  expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid member data with membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                      expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 10, ec: 'EC-10', inputData: 'all required fields valid, an extra password field is included alongside the required fields',                                         expected: 'success: true, parsed output contains no password field' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid member data with fullName: "         " (whitespace-only)',                                                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 12, ec: 'EC-11', inputData: 'valid member data with fullName: "  Jane Doe Test  " (surrounding whitespace)',                                                        expected: 'success: true, parsed fullName is "Jane Doe Test"' },
        { noTc: 13, ec: 'EC-12', inputData: 'valid member data with email: "  jane.doe@example.com  " (surrounding whitespace)',                                                    expected: 'success: true, parsed email is "jane.doe@example.com"' },
        { noTc: 14, ec: 'EC-13', inputData: 'valid member data with phone: "  +40712345678  " (surrounding whitespace)',                                                            expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 7,  condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 8,  condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 9,  condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 10, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 11, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed fullName is "A".repeat(8)' },
        { number: 12, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed fullName is "A".repeat(64)' },
        { number: 13, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'valid member data (no password) with fullName: "A".repeat(7) (7 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'valid member data (no password) with fullName: "A".repeat(8) (8 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'valid member data (no password) with fullName: "A".repeat(9) (9 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'valid member data (no password) with fullName: "A".repeat(63) (63 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'valid member data (no password) with fullName: "A".repeat(64) (64 characters)',                                     expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'valid member data (no password) with fullName: "A".repeat(65) (65 characters)',                                     expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (dob=yest)',      inputData: 'valid member data (no password) with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',               expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 8,  bva: 'BVA-8  (dob=today)',     inputData: 'valid member data (no password) with dateOfBirth set to today (YYYY-MM-DD)',                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 9,  bva: 'BVA-9  (dob=tmrw)',      inputData: 'valid member data (no password) with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                 expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 10, bva: 'BVA-10 (ws=8)',          inputData: 'valid member data (no password) with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',           expected: 'success: false, error path contains "fullName"' },
        { noTc: 11, bva: 'BVA-11 (pad→8)',         inputData: 'valid member data (no password) with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 12, bva: 'BVA-12 (pad→64)',        inputData: 'valid member data (no password) with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',         expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 13, bva: 'BVA-13 (pad→65)',        inputData: 'valid member data (no password) with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',         expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values (no password field)',                                                  expected: 'success: true, parsed data equals input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid member data with email field omitted',                                                                         expected: 'success: false, error path contains "email"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid member data with fullName field omitted',                                                                      expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid member data with phone field omitted',                                                                         expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid member data with dateOfBirth field omitted',                                                                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'valid member data with membershipStart field omitted',                                                               expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid member data with email: "no" (no @ sign)',                                                                     expected: 'success: false, error path contains "email"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid member data with phone: "0712345678" (no country code prefix)',                                                expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid member data with membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                                    expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'all required fields valid, an extra password field is included alongside the required fields',                       expected: 'success: true, parsed output contains no password field' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid member data with fullName: "         " (whitespace-only)',                                                     expected: 'success: false, error path contains "fullName"' },
        { noTc: 12, fromEc: 'EC-11', fromBva: '', inputData: 'valid member data with fullName: "  Jane Doe Test  " (surrounding whitespace)',                                      expected: 'success: true, parsed fullName is "Jane Doe Test"' },
        { noTc: 13, fromEc: 'EC-12', fromBva: '', inputData: 'valid member data with email: "  jane.doe@example.com  " (surrounding whitespace)',                                  expected: 'success: true, parsed email is "jane.doe@example.com"' },
        { noTc: 14, fromEc: 'EC-13', fromBva: '', inputData: 'valid member data with phone: "  +40712345678  " (surrounding whitespace)',                                          expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 15, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid member data (no password) with fullName: "A".repeat(7) (7 characters)',                                      expected: 'success: false, error path contains "fullName"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid member data (no password) with fullName: "A".repeat(8) (8 characters)',                                      expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid member data (no password) with fullName: "A".repeat(9) (9 characters)',                                      expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid member data (no password) with fullName: "A".repeat(63) (63 characters)',                                    expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid member data (no password) with fullName: "A".repeat(64) (64 characters)',                                    expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid member data (no password) with fullName: "A".repeat(65) (65 characters)',                                    expected: 'success: false, error path contains "fullName"' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid member data (no password) with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',              expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid member data (no password) with dateOfBirth set to today (YYYY-MM-DD)',                                       expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid member data (no password) with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-10', inputData: 'valid member data (no password) with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',          expected: 'success: false, error path contains "fullName"' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-11', inputData: 'valid member data (no password) with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',          expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-12', inputData: 'valid member data (no password) with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',        expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-13', inputData: 'valid member data (no password) with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',        expected: 'success: false, error path contains "fullName"' },
    ],
};

const loginUserSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-04',
    tcCount: 15,
    statement: 'loginUserSchema – Validates login credentials using Zod safeParse. Returns { success: true, data } when both fields satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field on any violation. Required fields: email (valid email format; surrounding whitespace is trimmed), password (8–64 characters with at least one uppercase letter, one digit, and one special character; must not be empty).',
    data: 'Input: { email: string, password: string }',
    precondition: 'Input is passed directly to loginUserSchema.safeParse(). email rules: valid format, surrounding whitespace trimmed. password rules: 8–64 characters, at least one uppercase letter, one digit, one special character, must not be empty.',
    results: 'Output: { success: boolean, data?: LoginUserInput, error?: ZodError }',
    postcondition: 'On success: parsed data matches the (trimmed) input. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'Input validity',      validEc: 'Both email and password valid → success: true, parsed data equals input', invalidEc: '' },
        { number: 2, condition: 'email presence',      validEc: '', invalidEc: 'email omitted → success: false, error path contains "email"' },
        { number: 3, condition: 'password presence',   validEc: '', invalidEc: 'password omitted → success: false, error path contains "password"' },
        { number: 4, condition: 'password value',      validEc: '', invalidEc: 'password: "" (empty string) → success: false, error path contains "password"' },
        { number: 5, condition: 'email format',        validEc: '', invalidEc: 'email: "invalidemail.com" (missing @) → success: false, error path contains "email"' },
        { number: 6, condition: 'email whitespace',    validEc: 'email: "  admin@gymtrackerpro.com  " (surrounding whitespace) → success: true, parsed email is "admin@gymtrackerpro.com"', invalidEc: '' },
        { number: 7, condition: 'password uppercase',  validEc: '', invalidEc: 'password: "validpassword1!" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 8, condition: 'password digit',      validEc: '', invalidEc: 'password: "ValidPassword!" (no digit) → success: false, error path contains "password"' },
        { number: 9, condition: 'password special char', validEc: '', invalidEc: 'password: "ValidPassword1" (no special character) → success: false, error path contains "password"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'both email and password provided with valid values',                                                          expected: 'success: true, parsed data equals input' },
        { noTc: 2, ec: 'EC-2', inputData: 'valid login data with email field omitted',                                                                  expected: 'success: false, error path contains "email"' },
        { noTc: 3, ec: 'EC-3', inputData: 'valid login data with password field omitted',                                                               expected: 'success: false, error path contains "password"' },
        { noTc: 4, ec: 'EC-4', inputData: 'valid login data with password: "" (empty string)',                                                          expected: 'success: false, error path contains "password"' },
        { noTc: 5, ec: 'EC-5', inputData: 'valid login data with email: "invalidemail.com" (missing @)',                                                expected: 'success: false, error path contains "email"' },
        { noTc: 6, ec: 'EC-6', inputData: 'valid login data with email: "  admin@gymtrackerpro.com  " (surrounding whitespace)',                        expected: 'success: true, parsed email is "admin@gymtrackerpro.com"' },
        { noTc: 7, ec: 'EC-7', inputData: 'valid login data with password: "validpassword1!" (no uppercase letter)',                                    expected: 'success: false, error path contains "password"' },
        { noTc: 8, ec: 'EC-8', inputData: 'valid login data with password: "ValidPassword!" (no digit)',                                                expected: 'success: false, error path contains "password"' },
        { noTc: 9, ec: 'EC-9', inputData: 'valid login data with password: "ValidPassword1" (no special character)',                                    expected: 'success: false, error path contains "password"' },
    ],
    bvaRows: [
        { number: 1,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 2,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true, parsed password matches input' },
        { number: 3,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true, parsed password matches input' },
        { number: 4,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true, parsed password matches input' },
        { number: 5,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true, parsed password matches input' },
        { number: 6,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (pwd=7)',  inputData: 'valid login data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 2, bva: 'BVA-2 (pwd=8)',  inputData: 'valid login data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                       expected: 'success: true, parsed password matches input' },
        { noTc: 3, bva: 'BVA-3 (pwd=9)',  inputData: 'valid login data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                       expected: 'success: true, parsed password matches input' },
        { noTc: 4, bva: 'BVA-4 (pwd=63)', inputData: 'valid login data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',                     expected: 'success: true, parsed password matches input' },
        { noTc: 5, bva: 'BVA-5 (pwd=64)', inputData: 'valid login data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',                     expected: 'success: true, parsed password matches input' },
        { noTc: 6, bva: 'BVA-6 (pwd=65)', inputData: 'valid login data with password: "P1@" + "a".repeat(62) (65 characters)',                                      expected: 'success: false, error path contains "password"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'both email and password provided with valid values',                                       expected: 'success: true, parsed data equals input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'valid login data with email field omitted',                                                expected: 'success: false, error path contains "email"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'valid login data with password field omitted',                                             expected: 'success: false, error path contains "password"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'valid login data with password: "" (empty string)',                                        expected: 'success: false, error path contains "password"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'valid login data with email: "invalidemail.com" (missing @)',                              expected: 'success: false, error path contains "email"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'valid login data with email: "  admin@gymtrackerpro.com  " (surrounding whitespace)',      expected: 'success: true, parsed email is "admin@gymtrackerpro.com"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'valid login data with password: "validpassword1!" (no uppercase letter)',                  expected: 'success: false, error path contains "password"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: 'valid login data with password: "ValidPassword!" (no digit)',                              expected: 'success: false, error path contains "password"' },
        { noTc: 9,  fromEc: 'EC-9', fromBva: '', inputData: 'valid login data with password: "ValidPassword1" (no special character)',                  expected: 'success: false, error path contains "password"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'valid login data with password: "P1@" + "a".repeat(4) (7 characters)',                   expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'valid login data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)', expected: 'success: true, parsed password matches input' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3', inputData: 'valid login data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)', expected: 'success: true, parsed password matches input' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-4', inputData: 'valid login data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)', expected: 'success: true, parsed password matches input' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-5', inputData: 'valid login data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)', expected: 'success: true, parsed password matches input' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-6', inputData: 'valid login data with password: "P1@" + "a".repeat(62) (65 characters)',                  expected: 'success: false, error path contains "password"' },
    ],
};

const createAdminSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-05',
    tcCount: 36,
    statement: 'createAdminSchema – Validates the input for creating a gym administrator account using Zod safeParse. Returns { success: true, data } when all fields satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field on any violation. Required fields: email (valid email format; surrounding whitespace is trimmed), fullName (8–64 characters after trimming, not whitespace-only; surrounding whitespace is trimmed), phone (E.164 format: +[1-9]\\d{1,14}; surrounding whitespace is trimmed), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character).',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
    precondition: 'Input is passed directly to createAdminSchema.safeParse(). fullName rules: 8–64 characters after trim, not whitespace-only. password rules: 8–64 characters, at least one uppercase letter, one digit, one special character. dateOfBirth: YYYY-MM-DD, strictly before today (yesterday is valid, today is not). Surrounding whitespace is trimmed from fullName, email, and phone before validation.',
    results: 'Output: { success: boolean, data?: CreateAdminInput, error?: ZodError }',
    postcondition: 'On success: parsed data matches the (trimmed) input. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Input validity',          validEc: 'All required fields valid → success: true, parsed data equals input', invalidEc: '' },
        { number: 2,  condition: 'email presence',          validEc: '', invalidEc: 'email omitted → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName presence',       validEc: '', invalidEc: 'fullName omitted → success: false, error path contains "fullName"' },
        { number: 4,  condition: 'phone presence',          validEc: '', invalidEc: 'phone omitted → success: false, error path contains "phone"' },
        { number: 5,  condition: 'dateOfBirth presence',    validEc: '', invalidEc: 'dateOfBirth omitted → success: false, error path contains "dateOfBirth"' },
        { number: 6,  condition: 'password presence',       validEc: '', invalidEc: 'password omitted → success: false, error path contains "password"' },
        { number: 7,  condition: 'email format',            validEc: '', invalidEc: 'email: "invalidemail.com" (missing @) → success: false, error path contains "email"' },
        { number: 8,  condition: 'phone format',            validEc: '', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 9,  condition: 'password uppercase',      validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 10, condition: 'password digit',          validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 11, condition: 'password special char',   validEc: '', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 12, condition: 'dateOfBirth format',      validEc: '', invalidEc: 'dateOfBirth: "15.01.1990" (DD.MM.YYYY, wrong separator) → success: false, error path contains "dateOfBirth"' },
        { number: 13, condition: 'dateOfBirth value',       validEc: '', invalidEc: 'dateOfBirth: "2099-01-01" (future date) → success: false, error path contains "dateOfBirth"' },
        { number: 14, condition: 'fullName content',        validEc: 'fullName: "  Admin User Test  " (surrounding whitespace) → success: true, parsed fullName is "Admin User Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 15, condition: 'email whitespace',        validEc: 'email: "  admin@example.com  " (surrounding whitespace) → success: true, parsed email is "admin@example.com"', invalidEc: '' },
        { number: 16, condition: 'phone whitespace',        validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values',                                                              expected: 'success: true, parsed data equals input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid admin data with email field omitted',                                                                   expected: 'success: false, error path contains "email"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid admin data with fullName field omitted',                                                                expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid admin data with phone field omitted',                                                                   expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid admin data with dateOfBirth field omitted',                                                             expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'valid admin data with password field omitted',                                                                expected: 'success: false, error path contains "password"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid admin data with email: "invalidemail.com" (missing @)',                                                 expected: 'success: false, error path contains "email"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid admin data with phone: "0712345678" (no country code prefix)',                                          expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid admin data with password: "secure1@pass" (no uppercase letter)',                                        expected: 'success: false, error path contains "password"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid admin data with password: "SecureP@ss" (no digit)',                                                     expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-11', inputData: 'valid admin data with password: "SecurePass1" (no special character)',                                        expected: 'success: false, error path contains "password"' },
        { noTc: 12, ec: 'EC-12', inputData: 'valid admin data with dateOfBirth: "15.01.1990" (DD.MM.YYYY, wrong separator)',                               expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 13, ec: 'EC-13', inputData: 'valid admin data with dateOfBirth: "2099-01-01" (future date)',                                               expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, ec: 'EC-14', inputData: 'valid admin data with fullName: "         " (whitespace-only)',                                               expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, ec: 'EC-14', inputData: 'valid admin data with fullName: "  Admin User Test  " (surrounding whitespace)',                              expected: 'success: true, parsed fullName is "Admin User Test"' },
        { noTc: 16, ec: 'EC-15', inputData: 'valid admin data with email: "  admin@example.com  " (surrounding whitespace)',                               expected: 'success: true, parsed email is "admin@example.com"' },
        { noTc: 17, ec: 'EC-16', inputData: 'valid admin data with phone: "  +40712345678  " (surrounding whitespace)',                                    expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'valid admin data with fullName: "A".repeat(7) (7 characters)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'valid admin data with fullName: "A".repeat(8) (8 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'valid admin data with fullName: "A".repeat(9) (9 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'valid admin data with fullName: "A".repeat(63) (63 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'valid admin data with fullName: "A".repeat(64) (64 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'valid admin data with fullName: "A".repeat(65) (65 characters)',                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',         inputData: 'valid admin data with password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',         inputData: 'valid admin data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',         inputData: 'valid admin data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',        inputData: 'valid admin data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',        inputData: 'valid admin data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',        inputData: 'valid admin data with password: "P1@" + "a".repeat(62) (65 characters)',                                expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',      inputData: 'valid admin data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                  expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',     inputData: 'valid admin data with dateOfBirth set to today (YYYY-MM-DD)',                                           expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',      inputData: 'valid admin data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                    expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',          inputData: 'valid admin data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',              expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',         inputData: 'valid admin data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',              expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',        inputData: 'valid admin data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',            expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',        inputData: 'valid admin data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',            expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values',                                                         expected: 'success: true, parsed data equals input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid admin data with email field omitted',                                                              expected: 'success: false, error path contains "email"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid admin data with fullName field omitted',                                                           expected: 'success: false, error path contains "fullName"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid admin data with phone field omitted',                                                              expected: 'success: false, error path contains "phone"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid admin data with dateOfBirth field omitted',                                                        expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'valid admin data with password field omitted',                                                           expected: 'success: false, error path contains "password"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid admin data with email: "invalidemail.com" (missing @)',                                            expected: 'success: false, error path contains "email"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid admin data with phone: "0712345678" (no country code prefix)',                                     expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid admin data with password: "secure1@pass" (no uppercase letter)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid admin data with password: "SecureP@ss" (no digit)',                                                expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: 'valid admin data with password: "SecurePass1" (no special character)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: 'valid admin data with dateOfBirth: "15.01.1990" (DD.MM.YYYY, wrong separator)',                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: 'valid admin data with dateOfBirth: "2099-01-01" (future date)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: 'valid admin data with fullName: "         " (whitespace-only)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, fromEc: 'EC-14', fromBva: '', inputData: 'valid admin data with fullName: "  Admin User Test  " (surrounding whitespace)',                         expected: 'success: true, parsed fullName is "Admin User Test"' },
        { noTc: 16, fromEc: 'EC-15', fromBva: '', inputData: 'valid admin data with email: "  admin@example.com  " (surrounding whitespace)',                          expected: 'success: true, parsed email is "admin@example.com"' },
        { noTc: 17, fromEc: 'EC-16', fromBva: '', inputData: 'valid admin data with phone: "  +40712345678  " (surrounding whitespace)',                               expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 18, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid admin data with fullName: "A".repeat(7) (7 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid admin data with fullName: "A".repeat(8) (8 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid admin data with fullName: "A".repeat(9) (9 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid admin data with fullName: "A".repeat(63) (63 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid admin data with fullName: "A".repeat(64) (64 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid admin data with fullName: "A".repeat(65) (65 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid admin data with password: "P1@" + "a".repeat(4) (7 characters)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid admin data with password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid admin data with password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-10', inputData: 'valid admin data with password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-11', inputData: 'valid admin data with password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-12', inputData: 'valid admin data with password: "P1@" + "a".repeat(62) (65 characters)',                               expected: 'success: false, error path contains "password"' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-13', inputData: 'valid admin data with dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                 expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-14', inputData: 'valid admin data with dateOfBirth set to today (YYYY-MM-DD)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-15', inputData: 'valid admin data with dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-16', inputData: 'valid admin data with fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',             expected: 'success: false, error path contains "fullName"' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-17', inputData: 'valid admin data with fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-18', inputData: 'valid admin data with fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-19', inputData: 'valid admin data with fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',           expected: 'success: false, error path contains "fullName"' },
    ],
};

const updateUserSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-06',
    tcCount: 34,
    statement: 'updateUserSchema – Validates a partial update for a user using Zod safeParse. All fields are optional; an empty object is valid. Returns { success: true, data } when every supplied field satisfies its constraint. Returns { success: false, error } with a path pointing to the offending field when any supplied field violates its constraint. Field constraints when present: email (valid email format; surrounding whitespace trimmed), fullName (8–64 characters after trimming, not whitespace-only; surrounding whitespace trimmed), phone (E.164 format: +[1-9]\\d{1,14}; surrounding whitespace trimmed), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character).',
    data: 'Input: Partial<{ email: string, fullName: string, phone: string, dateOfBirth: string, password: string }>',
    precondition: 'Input is passed directly to updateUserSchema.safeParse(). All fields are optional. When a field is present it is subject to the same constraints as in createUserSchema. fullName: 8–64 characters after trim, not whitespace-only. password: 8–64 characters, at least one uppercase letter, one digit, one special character. dateOfBirth: YYYY-MM-DD, strictly before today.',
    results: 'Output: { success: boolean, data?: UpdateUserInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains only the supplied (trimmed) fields. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Empty input',           validEc: 'Empty object {} → success: true, parsed data is {}', invalidEc: '' },
        { number: 2,  condition: 'email value',           validEc: 'email: "new@example.com" → success: true, parsed email matches input', invalidEc: 'email: "bad-email" (missing @) → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName value',        validEc: 'fullName: "Updated Name Test" (valid length) → success: true, parsed fullName matches input', invalidEc: '' },
        { number: 4,  condition: 'phone value',           validEc: 'phone: "+40712345678" (valid E.164) → success: true, parsed phone matches input', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 5,  condition: 'password uppercase',    validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 6,  condition: 'password digit',        validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 7,  condition: 'password special char', validEc: 'password: "NewP@ss1" (meets all rules) → success: true, parsed password matches input', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 8,  condition: 'dateOfBirth value',     validEc: 'dateOfBirth: yesterday (YYYY-MM-DD, strictly before today) → success: true, parsed dateOfBirth matches input', invalidEc: '' },
        { number: 9,  condition: 'fullName content',      validEc: 'fullName: "  Updated Name Test  " (surrounding whitespace) → success: true, parsed fullName is "Updated Name Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 10, condition: 'email whitespace',      validEc: 'email: "  new@example.com  " (surrounding whitespace) → success: true, parsed email is "new@example.com"', invalidEc: '' },
        { number: 11, condition: 'phone whitespace',      validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'empty object {}',                                                                                  expected: 'success: true, parsed data is {}' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'object with only email: "new@example.com"',                                                        expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'object with only fullName: "Updated Name Test"',                                                   expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'object with only phone: "+40712345678"',                                                           expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  ec: 'EC-7',  inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                          expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  ec: 'EC-8',  inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                       expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  ec: 'EC-2',  inputData: 'object with only email: "bad-email" (missing @)',                                                  expected: 'success: false, error path contains "email"' },
        { noTc: 8,  ec: 'EC-4',  inputData: 'object with only phone: "0712345678" (no country code prefix)',                                    expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  ec: 'EC-5',  inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 10, ec: 'EC-6',  inputData: 'object with only password: "SecureP@ss" (no digit)',                                               expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-7',  inputData: 'object with only password: "SecurePass1" (no special character)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 12, ec: 'EC-9',  inputData: 'object with only fullName: "         " (whitespace-only)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 13, ec: 'EC-9',  inputData: 'object with only fullName: "  Updated Name Test  " (surrounding whitespace)',                      expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 14, ec: 'EC-10', inputData: 'object with only email: "  new@example.com  " (surrounding whitespace)',                           expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 15, ec: 'EC-11', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                              expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',         inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',         inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',         inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',        inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',        inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',        inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                                expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',      inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                  expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',     inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                           expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',      inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                    expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',          inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',              expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',         inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',              expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',        inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',            expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',        inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',            expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'empty object {}',                                                                                   expected: 'success: true, parsed data is {}' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "new@example.com"',                                                         expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'object with only fullName: "Updated Name Test"',                                                    expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "+40712345678"',                                                            expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                           expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  fromEc: 'EC-8',  fromBva: '', inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                        expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "bad-email" (missing @)',                                                   expected: 'success: false, error path contains "email"' },
        { noTc: 8,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "0712345678" (no country code prefix)',                                     expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  fromEc: 'EC-5',  fromBva: '', inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 10, fromEc: 'EC-6',  fromBva: '', inputData: 'object with only password: "SecureP@ss" (no digit)',                                                expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "SecurePass1" (no special character)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 12, fromEc: 'EC-9',  fromBva: '', inputData: 'object with only fullName: "         " (whitespace-only)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 13, fromEc: 'EC-9',  fromBva: '', inputData: 'object with only fullName: "  Updated Name Test  " (surrounding whitespace)',                       expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 14, fromEc: 'EC-10', fromBva: '', inputData: 'object with only email: "  new@example.com  " (surrounding whitespace)',                            expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 15, fromEc: 'EC-11', fromBva: '', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                               expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 16, fromEc: '', fromBva: 'BVA-1',  inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-2',  inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-3',  inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-4',  inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-5',  inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-6',  inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-7',  inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-8',  inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-9',  inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-10', inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-11', inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-12', inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                               expected: 'success: false, error path contains "password"' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-13', inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                 expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-14', inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-15', inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-16', inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',             expected: 'success: false, error path contains "fullName"' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-17', inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-18', inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-19', inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',           expected: 'success: false, error path contains "fullName"' },
    ],
};

const updateMemberSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-07',
    tcCount: 36,
    statement: 'updateMemberSchema – Validates a partial update for a member using Zod safeParse. All fields are optional; an empty object is valid. Returns { success: true, data } when every supplied field satisfies its constraint. Returns { success: false, error } with a path pointing to the offending field when any supplied field violates its constraint. Field constraints when present: email (valid email format; surrounding whitespace trimmed), fullName (8–64 characters after trimming, not whitespace-only; surrounding whitespace trimmed), phone (E.164 format: +[1-9]\\d{1,14}; surrounding whitespace trimmed), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character), membershipStart (YYYY-MM-DD; future dates accepted).',
    data: 'Input: Partial<{ email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }>',
    precondition: 'Input is passed directly to updateMemberSchema.safeParse(). All fields are optional. When a field is present it is subject to the same constraints as in createMemberSchema. fullName: 8–64 characters after trim, not whitespace-only. password: 8–64 characters, at least one uppercase letter, one digit, one special character. dateOfBirth: YYYY-MM-DD, strictly before today. membershipStart: YYYY-MM-DD, any date including future.',
    results: 'Output: { success: boolean, data?: UpdateMemberInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains only the supplied (trimmed) fields. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Empty input',              validEc: 'Empty object {} → success: true, parsed data is {}', invalidEc: '' },
        { number: 2,  condition: 'email value',              validEc: 'email: "new@example.com" → success: true, parsed email matches input', invalidEc: 'email: "bad-email" (missing @) → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName value',           validEc: 'fullName: "Updated Name Test" (valid length) → success: true, parsed fullName matches input', invalidEc: '' },
        { number: 4,  condition: 'phone value',              validEc: 'phone: "+40712345678" (valid E.164) → success: true, parsed phone matches input', invalidEc: 'phone: "0712345678" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 5,  condition: 'password uppercase',       validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 6,  condition: 'password digit',           validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 7,  condition: 'password special char',    validEc: 'password: "NewP@ss1" (meets all rules) → success: true, parsed password matches input', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 8,  condition: 'dateOfBirth value',        validEc: 'dateOfBirth: yesterday (YYYY-MM-DD, strictly before today) → success: true, parsed dateOfBirth matches input', invalidEc: '' },
        { number: 9,  condition: 'membershipStart format',   validEc: 'membershipStart: "2024-06-01" (valid YYYY-MM-DD) → success: true, parsed membershipStart matches input', invalidEc: 'membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "membershipStart"' },
        { number: 10, condition: 'fullName content',         validEc: 'fullName: "  Updated Name Test  " (surrounding whitespace) → success: true, parsed fullName is "Updated Name Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 11, condition: 'email whitespace',         validEc: 'email: "  new@example.com  " (surrounding whitespace) → success: true, parsed email is "new@example.com"', invalidEc: '' },
        { number: 12, condition: 'phone whitespace',         validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'empty object {}',                                                                                  expected: 'success: true, parsed data is {}' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'object with only email: "new@example.com"',                                                        expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'object with only fullName: "Updated Name Test"',                                                   expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'object with only phone: "+40712345678"',                                                           expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  ec: 'EC-7',  inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                          expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  ec: 'EC-8',  inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                       expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  ec: 'EC-9',  inputData: 'object with only membershipStart: "2024-06-01"',                                                   expected: 'success: true, parsed membershipStart is "2024-06-01"' },
        { noTc: 8,  ec: 'EC-2',  inputData: 'object with only email: "bad-email" (missing @)',                                                  expected: 'success: false, error path contains "email"' },
        { noTc: 9,  ec: 'EC-4',  inputData: 'object with only phone: "0712345678" (no country code prefix)',                                    expected: 'success: false, error path contains "phone"' },
        { noTc: 10, ec: 'EC-5',  inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-6',  inputData: 'object with only password: "SecureP@ss" (no digit)',                                               expected: 'success: false, error path contains "password"' },
        { noTc: 12, ec: 'EC-7',  inputData: 'object with only password: "SecurePass1" (no special character)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 13, ec: 'EC-9',  inputData: 'object with only membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                        expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 14, ec: 'EC-10', inputData: 'object with only fullName: "         " (whitespace-only)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, ec: 'EC-10', inputData: 'object with only fullName: "  Updated Name Test  " (surrounding whitespace)',                      expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 16, ec: 'EC-11', inputData: 'object with only email: "  new@example.com  " (surrounding whitespace)',                           expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 17, ec: 'EC-12', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                              expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',    inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',    inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',    inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                          expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)',   inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)',   inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)',   inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',         inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',         inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',         inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                 expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',        inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',        inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',        inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                                expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',      inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                  expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',     inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                           expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',      inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                    expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',          inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',              expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',         inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',              expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',        inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',            expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',        inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',            expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'empty object {}',                                                                                   expected: 'success: true, parsed data is {}' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "new@example.com"',                                                         expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'object with only fullName: "Updated Name Test"',                                                    expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "+40712345678"',                                                            expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                           expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  fromEc: 'EC-8',  fromBva: '', inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                        expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  fromEc: 'EC-9',  fromBva: '', inputData: 'object with only membershipStart: "2024-06-01"',                                                    expected: 'success: true, parsed membershipStart is "2024-06-01"' },
        { noTc: 8,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "bad-email" (missing @)',                                                   expected: 'success: false, error path contains "email"' },
        { noTc: 9,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "0712345678" (no country code prefix)',                                     expected: 'success: false, error path contains "phone"' },
        { noTc: 10, fromEc: 'EC-5',  fromBva: '', inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-6',  fromBva: '', inputData: 'object with only password: "SecureP@ss" (no digit)',                                                expected: 'success: false, error path contains "password"' },
        { noTc: 12, fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "SecurePass1" (no special character)',                                   expected: 'success: false, error path contains "password"' },
        { noTc: 13, fromEc: 'EC-9',  fromBva: '', inputData: 'object with only membershipStart: "01/01/2024" (MM/DD/YYYY, wrong format)',                         expected: 'success: false, error path contains "membershipStart"' },
        { noTc: 14, fromEc: 'EC-10', fromBva: '', inputData: 'object with only fullName: "         " (whitespace-only)',                                          expected: 'success: false, error path contains "fullName"' },
        { noTc: 15, fromEc: 'EC-10', fromBva: '', inputData: 'object with only fullName: "  Updated Name Test  " (surrounding whitespace)',                       expected: 'success: true, parsed fullName is "Updated Name Test"' },
        { noTc: 16, fromEc: 'EC-11', fromBva: '', inputData: 'object with only email: "  new@example.com  " (surrounding whitespace)',                            expected: 'success: true, parsed email is "new@example.com"' },
        { noTc: 17, fromEc: 'EC-12', fromBva: '', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                               expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 18, fromEc: '', fromBva: 'BVA-1',  inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-2',  inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-3',  inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-4',  inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-5',  inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                       expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-6',  inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                       expected: 'success: false, error path contains "fullName"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-7',  inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-8',  inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-9',  inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-10', inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-11', inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',              expected: 'success: true, parsed password matches input' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-12', inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                               expected: 'success: false, error path contains "password"' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-13', inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                 expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-14', inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                          expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-15', inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                   expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-16', inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',             expected: 'success: false, error path contains "fullName"' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-17', inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 35, fromEc: '', fromBva: 'BVA-18', inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',           expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 36, fromEc: '', fromBva: 'BVA-19', inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',           expected: 'success: false, error path contains "fullName"' },
    ],
};

const updateAdminSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-08',
    tcCount: 34,
    statement: 'updateAdminSchema – Validates a partial update for an admin using Zod safeParse. All fields are optional; an empty object is valid. Returns { success: true, data } when every supplied field satisfies its constraint. Returns { success: false, error } with a path pointing to the offending field when any supplied field violates its constraint. Field constraints when present: email (valid email format; surrounding whitespace trimmed), fullName (8–64 characters after trimming, not whitespace-only; surrounding whitespace trimmed), phone (E.164 format: +[1-9]\\d{1,14}; surrounding whitespace trimmed), dateOfBirth (YYYY-MM-DD, strictly before today), password (8–64 characters with at least one uppercase letter, one digit, and one special character). Note: updateAdminSchema has no membershipStart field.',
    data: 'Input: Partial<{ email: string, fullName: string, phone: string, dateOfBirth: string, password: string }>',
    precondition: 'Input is passed directly to updateAdminSchema.safeParse(). All fields are optional. When a field is present it is subject to the same constraints as in createAdminSchema. fullName: 8–64 characters after trim, not whitespace-only. password: 8–64 characters, at least one uppercase letter, one digit, one special character. dateOfBirth: YYYY-MM-DD, strictly before today.',
    results: 'Output: { success: boolean, data?: UpdateAdminInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains only the supplied (trimmed) fields. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'Empty input',           validEc: 'Empty object {} → success: true, parsed data is {}', invalidEc: '' },
        { number: 2,  condition: 'email value',           validEc: 'email: "admin-new@example.com" → success: true, parsed email matches input', invalidEc: 'email: "not-valid" (missing @) → success: false, error path contains "email"' },
        { number: 3,  condition: 'fullName value',        validEc: 'fullName: "Updated Admin Test" (valid length) → success: true, parsed fullName matches input', invalidEc: '' },
        { number: 4,  condition: 'phone value',           validEc: 'phone: "+40712345678" (valid E.164) → success: true, parsed phone matches input', invalidEc: 'phone: "invalid-phone" (no country code prefix) → success: false, error path contains "phone"' },
        { number: 5,  condition: 'password uppercase',    validEc: '', invalidEc: 'password: "secure1@pass" (no uppercase letter) → success: false, error path contains "password"' },
        { number: 6,  condition: 'password digit',        validEc: '', invalidEc: 'password: "SecureP@ss" (no digit) → success: false, error path contains "password"' },
        { number: 7,  condition: 'password special char', validEc: 'password: "NewP@ss1" (meets all rules) → success: true, parsed password matches input', invalidEc: 'password: "SecurePass1" (no special character) → success: false, error path contains "password"' },
        { number: 8,  condition: 'dateOfBirth value',     validEc: 'dateOfBirth: yesterday (YYYY-MM-DD, strictly before today) → success: true, parsed dateOfBirth matches input', invalidEc: '' },
        { number: 9,  condition: 'fullName content',      validEc: 'fullName: "  Updated Admin Test  " (surrounding whitespace) → success: true, parsed fullName is "Updated Admin Test"', invalidEc: 'fullName: "         " (whitespace-only) → success: false, error path contains "fullName"' },
        { number: 10, condition: 'email whitespace',      validEc: 'email: "  admin-new@example.com  " (surrounding whitespace) → success: true, parsed email is "admin-new@example.com"', invalidEc: '' },
        { number: 11, condition: 'phone whitespace',      validEc: 'phone: "  +40712345678  " (surrounding whitespace) → success: true, parsed phone is "+40712345678"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'empty object {}',                                                                              expected: 'success: true, parsed data is {}' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'object with only email: "admin-new@example.com"',                                              expected: 'success: true, parsed email is "admin-new@example.com"' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'object with only fullName: "Updated Admin Test"',                                              expected: 'success: true, parsed fullName is "Updated Admin Test"' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'object with only phone: "+40712345678"',                                                       expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  ec: 'EC-7',  inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                      expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  ec: 'EC-8',  inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                   expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  ec: 'EC-2',  inputData: 'object with only email: "not-valid" (missing @)',                                              expected: 'success: false, error path contains "email"' },
        { noTc: 8,  ec: 'EC-4',  inputData: 'object with only phone: "invalid-phone" (no country code prefix)',                             expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  ec: 'EC-5',  inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                              expected: 'success: false, error path contains "password"' },
        { noTc: 10, ec: 'EC-6',  inputData: 'object with only password: "SecureP@ss" (no digit)',                                           expected: 'success: false, error path contains "password"' },
        { noTc: 11, ec: 'EC-7',  inputData: 'object with only password: "SecurePass1" (no special character)',                              expected: 'success: false, error path contains "password"' },
        { noTc: 12, ec: 'EC-9',  inputData: 'object with only fullName: "         " (whitespace-only)',                                     expected: 'success: false, error path contains "fullName"' },
        { noTc: 13, ec: 'EC-9',  inputData: 'object with only fullName: "  Updated Admin Test  " (surrounding whitespace)',                 expected: 'success: true, parsed fullName is "Updated Admin Test"' },
        { noTc: 14, ec: 'EC-10', inputData: 'object with only email: "  admin-new@example.com  " (surrounding whitespace)',                 expected: 'success: true, parsed email is "admin-new@example.com"' },
        { noTc: 15, ec: 'EC-11', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                          expected: 'success: true, parsed phone is "+40712345678"' },
    ],
    bvaRows: [
        // ── fullName length ───────────────────────────────────────────────────
        { number: 1,  condition: 'fullName length', testCase: 'fullName: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'fullName length', testCase: 'fullName: "A".repeat(8) (min): at minimum → success: true, parsed fullName is "A".repeat(8)' },
        { number: 3,  condition: 'fullName length', testCase: 'fullName: "A".repeat(9) (min + 1): above minimum → success: true, parsed fullName is "A".repeat(9)' },
        { number: 4,  condition: 'fullName length', testCase: 'fullName: "A".repeat(63) (max - 1): below maximum → success: true, parsed fullName is "A".repeat(63)' },
        { number: 5,  condition: 'fullName length', testCase: 'fullName: "A".repeat(64) (max): at maximum → success: true, parsed fullName is "A".repeat(64)' },
        { number: 6,  condition: 'fullName length', testCase: 'fullName: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── password length ───────────────────────────────────────────────────
        { number: 7,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(4) (length 7, min - 1): below minimum → success: false' },
        { number: 8,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(5) (length 8, min): at minimum → success: true' },
        { number: 9,  condition: 'password length', testCase: 'password: "P1@" + "a".repeat(6) (length 9, min + 1): above minimum → success: true' },
        { number: 10, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(60) (length 63, max - 1): below maximum → success: true' },
        { number: 11, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(61) (length 64, max): at maximum → success: true' },
        { number: 12, condition: 'password length', testCase: 'password: "P1@" + "a".repeat(62) (length 65, max + 1): above maximum → success: false' },
        // ── dateOfBirth boundary ──────────────────────────────────────────────
        { number: 13, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: yesterday (one day before today, YYYY-MM-DD): strictly before today → success: true' },
        { number: 14, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: today (YYYY-MM-DD): not before today → success: false' },
        { number: 15, condition: 'dateOfBirth boundary', testCase: 'dateOfBirth: tomorrow (one day after today, YYYY-MM-DD): future → success: false' },
        // ── fullName whitespace + trim ────────────────────────────────────────
        { number: 16, condition: 'fullName whitespace + trim', testCase: 'fullName: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 17, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed fullName is "A".repeat(8)' },
        { number: 18, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed fullName is "A".repeat(64)' },
        { number: 19, condition: 'fullName whitespace + trim', testCase: 'fullName: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (fullName=7)',  inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                           expected: 'success: false, error path contains "fullName"' },
        { noTc: 2,  bva: 'BVA-2  (fullName=8)',  inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                           expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (fullName=9)',  inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                           expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (fullName=63)', inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (fullName=64)', inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                         expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (fullName=65)', inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 7,  bva: 'BVA-7  (pwd=7)',       inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters, meets all rules except minimum length)', expected: 'success: false, error path contains "password"' },
        { noTc: 8,  bva: 'BVA-8  (pwd=8)',       inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',                  expected: 'success: true, parsed password matches input' },
        { noTc: 9,  bva: 'BVA-9  (pwd=9)',       inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',                  expected: 'success: true, parsed password matches input' },
        { noTc: 10, bva: 'BVA-10 (pwd=63)',      inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 11, bva: 'BVA-11 (pwd=64)',      inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',                expected: 'success: true, parsed password matches input' },
        { noTc: 12, bva: 'BVA-12 (pwd=65)',      inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                                 expected: 'success: false, error path contains "password"' },
        { noTc: 13, bva: 'BVA-13 (dob=yest)',    inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                   expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 14, bva: 'BVA-14 (dob=today)',   inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                            expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 15, bva: 'BVA-15 (dob=tmrw)',    inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                     expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 16, bva: 'BVA-16 (ws=8)',        inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',               expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, bva: 'BVA-17 (pad→8)',       inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',               expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, bva: 'BVA-18 (pad→64)',      inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',             expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 19, bva: 'BVA-19 (pad→65)',      inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',             expected: 'success: false, error path contains "fullName"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'empty object {}',                                                                                  expected: 'success: true, parsed data is {}' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "admin-new@example.com"',                                                  expected: 'success: true, parsed email is "admin-new@example.com"' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'object with only fullName: "Updated Admin Test"',                                                  expected: 'success: true, parsed fullName is "Updated Admin Test"' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "+40712345678"',                                                           expected: 'success: true, parsed phone is "+40712345678"' },
        { noTc: 5,  fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "NewP@ss1" (meets all rules)',                                          expected: 'success: true, parsed password is "NewP@ss1"' },
        { noTc: 6,  fromEc: 'EC-8',  fromBva: '', inputData: 'object with only dateOfBirth set to yesterday (YYYY-MM-DD)',                                       expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 7,  fromEc: 'EC-2',  fromBva: '', inputData: 'object with only email: "not-valid" (missing @)',                                                  expected: 'success: false, error path contains "email"' },
        { noTc: 8,  fromEc: 'EC-4',  fromBva: '', inputData: 'object with only phone: "invalid-phone" (no country code prefix)',                                 expected: 'success: false, error path contains "phone"' },
        { noTc: 9,  fromEc: 'EC-5',  fromBva: '', inputData: 'object with only password: "secure1@pass" (no uppercase letter)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 10, fromEc: 'EC-6',  fromBva: '', inputData: 'object with only password: "SecureP@ss" (no digit)',                                               expected: 'success: false, error path contains "password"' },
        { noTc: 11, fromEc: 'EC-7',  fromBva: '', inputData: 'object with only password: "SecurePass1" (no special character)',                                  expected: 'success: false, error path contains "password"' },
        { noTc: 12, fromEc: 'EC-9',  fromBva: '', inputData: 'object with only fullName: "         " (whitespace-only)',                                         expected: 'success: false, error path contains "fullName"' },
        { noTc: 13, fromEc: 'EC-9',  fromBva: '', inputData: 'object with only fullName: "  Updated Admin Test  " (surrounding whitespace)',                     expected: 'success: true, parsed fullName is "Updated Admin Test"' },
        { noTc: 14, fromEc: 'EC-10', fromBva: '', inputData: 'object with only email: "  admin-new@example.com  " (surrounding whitespace)',                     expected: 'success: true, parsed email is "admin-new@example.com"' },
        { noTc: 15, fromEc: 'EC-11', fromBva: '', inputData: 'object with only phone: "  +40712345678  " (surrounding whitespace)',                              expected: 'success: true, parsed phone is "+40712345678"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 16, fromEc: '', fromBva: 'BVA-1',  inputData: 'object with only fullName: "A".repeat(7) (7 characters)',                                        expected: 'success: false, error path contains "fullName"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-2',  inputData: 'object with only fullName: "A".repeat(8) (8 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-3',  inputData: 'object with only fullName: "A".repeat(9) (9 characters)',                                        expected: 'success: true, parsed fullName is "A".repeat(9)' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-4',  inputData: 'object with only fullName: "A".repeat(63) (63 characters)',                                      expected: 'success: true, parsed fullName is "A".repeat(63)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-5',  inputData: 'object with only fullName: "A".repeat(64) (64 characters)',                                      expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-6',  inputData: 'object with only fullName: "A".repeat(65) (65 characters)',                                      expected: 'success: false, error path contains "fullName"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-7',  inputData: 'object with only password: "P1@" + "a".repeat(4) (7 characters)',                                expected: 'success: false, error path contains "password"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-8',  inputData: 'object with only password: "P1@" + "a".repeat(5) (8 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-9',  inputData: 'object with only password: "P1@" + "a".repeat(6) (9 characters, meets all rules)',               expected: 'success: true, parsed password matches input' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-10', inputData: 'object with only password: "P1@" + "a".repeat(60) (63 characters, meets all rules)',             expected: 'success: true, parsed password matches input' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-11', inputData: 'object with only password: "P1@" + "a".repeat(61) (64 characters, meets all rules)',             expected: 'success: true, parsed password matches input' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-12', inputData: 'object with only password: "P1@" + "a".repeat(62) (65 characters)',                              expected: 'success: false, error path contains "password"' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-13', inputData: 'object with only dateOfBirth set to yesterday (one day before today, YYYY-MM-DD)',                expected: 'success: true, parsed dateOfBirth is yesterday\'s date string' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-14', inputData: 'object with only dateOfBirth set to today (YYYY-MM-DD)',                                         expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-15', inputData: 'object with only dateOfBirth set to tomorrow (one day after today, YYYY-MM-DD)',                  expected: 'success: false, error path contains "dateOfBirth"' },
        { noTc: 31, fromEc: '', fromBva: 'BVA-16', inputData: 'object with only fullName: " ".repeat(8) (8 whitespace characters, empty after trim)',            expected: 'success: false, error path contains "fullName"' },
        { noTc: 32, fromEc: '', fromBva: 'BVA-17', inputData: 'object with only fullName: " " + "A".repeat(8) + " " (8 real characters after trim)',            expected: 'success: true, parsed fullName is "A".repeat(8)' },
        { noTc: 33, fromEc: '', fromBva: 'BVA-18', inputData: 'object with only fullName: " " + "A".repeat(64) + " " (64 real characters after trim)',          expected: 'success: true, parsed fullName is "A".repeat(64)' },
        { noTc: 34, fromEc: '', fromBva: 'BVA-19', inputData: 'object with only fullName: " " + "A".repeat(65) + " " (65 real characters after trim)',          expected: 'success: false, error path contains "fullName"' },
    ],
};

const createExerciseSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-09',
    tcCount: 30,
    statement: 'createExerciseSchema – Validates input for creating a new exercise using Zod safeParse. Returns { success: true, data } when all required fields are present and satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field when any constraint is violated. name is required (8–64 characters after trimming, not whitespace-only; surrounding whitespace trimmed; empty string rejected). description is optional; when absent the field is undefined; when present it accepts an empty string, a whitespace-only string (trimmed to ""), or a non-empty string up to 1024 characters after trimming; surrounding whitespace trimmed. muscleGroup is required and must be a valid MuscleGroup enum value. equipmentNeeded is required and must be a valid Equipment enum value.',
    data: 'Input: CreateExerciseInput { name: string, description?: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }',
    precondition: 'Input is passed directly to createExerciseSchema.safeParse(). name: required, 8–64 characters after trim, not whitespace-only, empty string rejected. description: optional; when present, trimmed before length check, max 1024 characters after trim, whitespace-only trimmed to "". muscleGroup: required, must be a valid MuscleGroup enum member. equipmentNeeded: required, must be a valid Equipment enum member.',
    results: 'Output: { success: boolean, data?: CreateExerciseInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains the supplied fields with name and description trimmed. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'All fields valid',          validEc: 'All required fields present with valid values, description present and valid → success: true, parsed data matches trimmed input', invalidEc: '' },
        { number: 2,  condition: 'description presence',      validEc: 'description field absent → success: true, parsed description is undefined', invalidEc: '' },
        { number: 3,  condition: 'description value',         validEc: 'description: "" (empty string) → success: true, parsed description is ""', invalidEc: '' },
        { number: 4,  condition: 'muscleGroup value',         validEc: 'muscleGroup: MuscleGroup.CHEST (valid enum member) → success: true', invalidEc: 'muscleGroup: "INVALID" (not a valid enum member) → success: false, error path contains "muscleGroup"' },
        { number: 5,  condition: 'equipmentNeeded value',     validEc: 'equipmentNeeded: Equipment.BARBELL (valid enum member) → success: true', invalidEc: 'equipmentNeeded: "INVALID" (not a valid enum member) → success: false, error path contains "equipmentNeeded"' },
        { number: 6,  condition: 'name presence',             validEc: '', invalidEc: 'name field absent → success: false, error path contains "name"' },
        { number: 7,  condition: 'name value',                validEc: '', invalidEc: 'name: "" (empty string) → success: false, error path contains "name"' },
        { number: 8,  condition: 'muscleGroup presence',      validEc: '', invalidEc: 'muscleGroup field absent → success: false, error path contains "muscleGroup"' },
        { number: 9,  condition: 'equipmentNeeded presence',  validEc: '', invalidEc: 'equipmentNeeded field absent → success: false, error path contains "equipmentNeeded"' },
        { number: 10, condition: 'name content',              validEc: 'name: "  Bench Press  " (surrounding whitespace) → success: true, parsed name is "Bench Press"', invalidEc: 'name: "         " (whitespace-only) → success: false, error path contains "name"' },
        { number: 11, condition: 'description content',       validEc: 'description: "  some description  " (surrounding whitespace) → success: true, parsed description is "some description"; description: "     " (whitespace-only) → success: true, parsed description is ""', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values: name "Bench Press", description "A chest exercise", muscleGroup MuscleGroup.CHEST, equipmentNeeded Equipment.BARBELL', expected: 'success: true, parsed data matches trimmed input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid exercise data with description field absent',                                                                                                                   expected: 'success: true, parsed description is undefined' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid exercise data with description: "" (empty string)',                                                                                                            expected: 'success: true, parsed description is ""' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'valid exercise data with muscleGroup: "INVALID" (not a valid enum member)',                                                                                          expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'valid exercise data with equipmentNeeded: "INVALID" (not a valid enum member)',                                                                                      expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'exercise data with name field absent',                                                                                                                               expected: 'success: false, error path contains "name"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid exercise data with name: "" (empty string)',                                                                                                                   expected: 'success: false, error path contains "name"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'exercise data with muscleGroup field absent',                                                                                                                        expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'exercise data with equipmentNeeded field absent',                                                                                                                    expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid exercise data with name: "         " (whitespace-only)',                                                                                                       expected: 'success: false, error path contains "name"' },
        { noTc: 11, ec: 'EC-10', inputData: 'valid exercise data with name: "  Bench Press  " (surrounding whitespace)',                                                                                          expected: 'success: true, parsed name is "Bench Press"' },
        { noTc: 12, ec: 'EC-11', inputData: 'valid exercise data with description: "     " (whitespace-only)',                                                                                                    expected: 'success: true, parsed description is ""' },
        { noTc: 13, ec: 'EC-11', inputData: 'valid exercise data with description: "  some description  " (surrounding whitespace)',                                                                              expected: 'success: true, parsed description is "some description"' },
    ],
    bvaRows: [
        // ── name length ───────────────────────────────────────────────────────
        { number: 1,  condition: 'name length',              testCase: 'name: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'name length',              testCase: 'name: "A".repeat(8) (min): at minimum → success: true, parsed name is "A".repeat(8)' },
        { number: 3,  condition: 'name length',              testCase: 'name: "A".repeat(9) (min + 1): above minimum → success: true, parsed name is "A".repeat(9)' },
        { number: 4,  condition: 'name length',              testCase: 'name: "A".repeat(63) (max - 1): below maximum → success: true, parsed name is "A".repeat(63)' },
        { number: 5,  condition: 'name length',              testCase: 'name: "A".repeat(64) (max): at maximum → success: true, parsed name is "A".repeat(64)' },
        { number: 6,  condition: 'name length',              testCase: 'name: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── name whitespace + trim ────────────────────────────────────────────
        { number: 7,  condition: 'name whitespace + trim',   testCase: 'name: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 8,  condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed name is "A".repeat(8)' },
        { number: 9,  condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed name is "A".repeat(64)' },
        { number: 10, condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
        // ── description length ────────────────────────────────────────────────
        { number: 11, condition: 'description length',       testCase: 'description: "" (length 0, min): at minimum → success: true, parsed description is ""' },
        { number: 12, condition: 'description length',       testCase: 'description: "A" (length 1, min + 1): above minimum → success: true, parsed description is "A"' },
        { number: 13, condition: 'description length',       testCase: 'description: "A".repeat(1023) (max - 1): below maximum → success: true' },
        { number: 14, condition: 'description length',       testCase: 'description: "A".repeat(1024) (max): at maximum → success: true' },
        { number: 15, condition: 'description length',       testCase: 'description: "A".repeat(1025) (max + 1): above maximum → success: false' },
        // ── description whitespace + trim ─────────────────────────────────────
        { number: 16, condition: 'description whitespace + trim', testCase: 'description: " " + "A".repeat(1024) + " " (1024 real chars after trim, at maximum) → success: true, parsed description is "A".repeat(1024)' },
        { number: 17, condition: 'description whitespace + trim', testCase: 'description: " " + "A".repeat(1025) + " " (1025 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (name=7)',       inputData: 'valid exercise data with name: "A".repeat(7) (7 characters)',                                             expected: 'success: false, error path contains "name"' },
        { noTc: 2,  bva: 'BVA-2  (name=8)',       inputData: 'valid exercise data with name: "A".repeat(8) (8 characters)',                                             expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (name=9)',       inputData: 'valid exercise data with name: "A".repeat(9) (9 characters)',                                             expected: 'success: true, parsed name is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (name=63)',      inputData: 'valid exercise data with name: "A".repeat(63) (63 characters)',                                           expected: 'success: true, parsed name is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (name=64)',      inputData: 'valid exercise data with name: "A".repeat(64) (64 characters)',                                           expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (name=65)',      inputData: 'valid exercise data with name: "A".repeat(65) (65 characters)',                                           expected: 'success: false, error path contains "name"' },
        { noTc: 7,  bva: 'BVA-7  (ws=8)',         inputData: 'valid exercise data with name: " ".repeat(8) (8 whitespace characters, empty after trim)',                 expected: 'success: false, error path contains "name"' },
        { noTc: 8,  bva: 'BVA-8  (pad→8)',        inputData: 'valid exercise data with name: " " + "A".repeat(8) + " " (8 real characters after trim)',                 expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 9,  bva: 'BVA-9  (pad→64)',       inputData: 'valid exercise data with name: " " + "A".repeat(64) + " " (64 real characters after trim)',               expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 10, bva: 'BVA-10 (pad→65)',       inputData: 'valid exercise data with name: " " + "A".repeat(65) + " " (65 real characters after trim)',               expected: 'success: false, error path contains "name"' },
        { noTc: 11, bva: 'BVA-11 (desc=0)',       inputData: 'valid exercise data with description: "" (0 characters)',                                                  expected: 'success: true, parsed description is ""' },
        { noTc: 12, bva: 'BVA-12 (desc=1)',       inputData: 'valid exercise data with description: "A" (1 character)',                                                  expected: 'success: true, parsed description is "A"' },
        { noTc: 13, bva: 'BVA-13 (desc=1023)',    inputData: 'valid exercise data with description: "A".repeat(1023) (1023 characters)',                                 expected: 'success: true, parsed description is "A".repeat(1023)' },
        { noTc: 14, bva: 'BVA-14 (desc=1024)',    inputData: 'valid exercise data with description: "A".repeat(1024) (1024 characters)',                                 expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 15, bva: 'BVA-15 (desc=1025)',    inputData: 'valid exercise data with description: "A".repeat(1025) (1025 characters)',                                 expected: 'success: false, error path contains "description"' },
        { noTc: 16, bva: 'BVA-16 (pad→1024)',     inputData: 'valid exercise data with description: " " + "A".repeat(1024) + " " (1024 real characters after trim)',    expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 17, bva: 'BVA-17 (pad→1025)',     inputData: 'valid exercise data with description: " " + "A".repeat(1025) + " " (1025 real characters after trim)',    expected: 'success: false, error path contains "description"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values: name "Bench Press", description "A chest exercise", muscleGroup MuscleGroup.CHEST, equipmentNeeded Equipment.BARBELL', expected: 'success: true, parsed data matches trimmed input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid exercise data with description field absent',                                                                                                                    expected: 'success: true, parsed description is undefined' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid exercise data with description: "" (empty string)',                                                                                                             expected: 'success: true, parsed description is ""' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'valid exercise data with muscleGroup: "INVALID" (not a valid enum member)',                                                                                           expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'valid exercise data with equipmentNeeded: "INVALID" (not a valid enum member)',                                                                                       expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'exercise data with name field absent',                                                                                                                                expected: 'success: false, error path contains "name"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid exercise data with name: "" (empty string)',                                                                                                                    expected: 'success: false, error path contains "name"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'exercise data with muscleGroup field absent',                                                                                                                         expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'exercise data with equipmentNeeded field absent',                                                                                                                     expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid exercise data with name: "         " (whitespace-only)',                                                                                                        expected: 'success: false, error path contains "name"' },
        { noTc: 11, fromEc: 'EC-10', fromBva: '', inputData: 'valid exercise data with name: "  Bench Press  " (surrounding whitespace)',                                                                                           expected: 'success: true, parsed name is "Bench Press"' },
        { noTc: 12, fromEc: 'EC-11', fromBva: '', inputData: 'valid exercise data with description: "     " (whitespace-only)',                                                                                                     expected: 'success: true, parsed description is ""' },
        { noTc: 13, fromEc: 'EC-11', fromBva: '', inputData: 'valid exercise data with description: "  some description  " (surrounding whitespace)',                                                                               expected: 'success: true, parsed description is "some description"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 14, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid exercise data with name: "A".repeat(7) (7 characters)',                                            expected: 'success: false, error path contains "name"' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid exercise data with name: "A".repeat(8) (8 characters)',                                            expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid exercise data with name: "A".repeat(9) (9 characters)',                                            expected: 'success: true, parsed name is "A".repeat(9)' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid exercise data with name: "A".repeat(63) (63 characters)',                                          expected: 'success: true, parsed name is "A".repeat(63)' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid exercise data with name: "A".repeat(64) (64 characters)',                                          expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid exercise data with name: "A".repeat(65) (65 characters)',                                          expected: 'success: false, error path contains "name"' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid exercise data with name: " ".repeat(8) (8 whitespace characters, empty after trim)',                expected: 'success: false, error path contains "name"' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid exercise data with name: " " + "A".repeat(8) + " " (8 real characters after trim)',                expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid exercise data with name: " " + "A".repeat(64) + " " (64 real characters after trim)',              expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-10', inputData: 'valid exercise data with name: " " + "A".repeat(65) + " " (65 real characters after trim)',              expected: 'success: false, error path contains "name"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-11', inputData: 'valid exercise data with description: "" (0 characters)',                                                 expected: 'success: true, parsed description is ""' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-12', inputData: 'valid exercise data with description: "A" (1 character)',                                                 expected: 'success: true, parsed description is "A"' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-13', inputData: 'valid exercise data with description: "A".repeat(1023) (1023 characters)',                                expected: 'success: true, parsed description is "A".repeat(1023)' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-14', inputData: 'valid exercise data with description: "A".repeat(1024) (1024 characters)',                                expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-15', inputData: 'valid exercise data with description: "A".repeat(1025) (1025 characters)',                                expected: 'success: false, error path contains "description"' },
        { noTc: 29, fromEc: '', fromBva: 'BVA-16', inputData: 'valid exercise data with description: " " + "A".repeat(1024) + " " (1024 real characters after trim)',   expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 30, fromEc: '', fromBva: 'BVA-17', inputData: 'valid exercise data with description: " " + "A".repeat(1025) + " " (1025 real characters after trim)',   expected: 'success: false, error path contains "description"' },
    ],
};

const updateExerciseSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-10',
    tcCount: 28,
    statement: 'updateExerciseSchema – Validates a partial update for an exercise using Zod safeParse. All fields are optional; an empty object is valid. Returns { success: true, data } when every supplied field satisfies its constraint. Returns { success: false, error } with a path pointing to the offending field when any supplied field violates its constraint. Field constraints when present: name (8–64 characters after trimming, not whitespace-only; surrounding whitespace trimmed), description (optional; when present accepts an empty string, a whitespace-only string trimmed to "", or a non-empty string up to 1024 characters after trimming; surrounding whitespace trimmed), muscleGroup (must be a valid MuscleGroup enum member), equipmentNeeded (must be a valid Equipment enum member).',
    data: 'Input: Partial<{ name: string, description: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }>',
    precondition: 'Input is passed directly to updateExerciseSchema.safeParse(). All fields are optional. When a field is present it is subject to the same constraints as in createExerciseSchema. name: 8–64 characters after trim, not whitespace-only. description: when present, trimmed before length check, max 1024 characters after trim, whitespace-only trimmed to "". muscleGroup: must be a valid MuscleGroup enum member. equipmentNeeded: must be a valid Equipment enum member.',
    results: 'Output: { success: boolean, data?: UpdateExerciseInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains only the supplied fields with name and description trimmed. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'Empty input',              validEc: 'Empty object {} → success: true, parsed data is {}', invalidEc: '' },
        { number: 2, condition: 'name value',               validEc: 'name: "New Name" (valid length) → success: true, parsed name is "New Name"', invalidEc: '' },
        { number: 3, condition: 'description value',        validEc: 'description: "Updated description text" (valid length) → success: true, parsed description matches input', invalidEc: '' },
        { number: 4, condition: 'muscleGroup value',        validEc: 'muscleGroup: MuscleGroup.CHEST (valid enum member) → success: true, parsed muscleGroup is MuscleGroup.CHEST', invalidEc: 'muscleGroup: "INVALID" (not a valid enum member) → success: false, error path contains "muscleGroup"' },
        { number: 5, condition: 'equipmentNeeded value',    validEc: 'equipmentNeeded: Equipment.BARBELL (valid enum member) → success: true, parsed equipmentNeeded is Equipment.BARBELL', invalidEc: 'equipmentNeeded: "INVALID" (not a valid enum member) → success: false, error path contains "equipmentNeeded"' },
        { number: 6, condition: 'name content',             validEc: 'name: "  New Exercise Name  " (surrounding whitespace) → success: true, parsed name is "New Exercise Name"', invalidEc: 'name: "         " (whitespace-only) → success: false, error path contains "name"' },
        { number: 7, condition: 'description content',      validEc: 'description: "  updated description  " (surrounding whitespace) → success: true, parsed description is "updated description"; description: "     " (whitespace-only) → success: true, parsed description is ""', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1', inputData: 'empty object {}',                                                                              expected: 'success: true, parsed data is {}' },
        { noTc: 2,  ec: 'EC-2', inputData: 'object with only name: "New Name"',                                                            expected: 'success: true, parsed name is "New Name"' },
        { noTc: 3,  ec: 'EC-3', inputData: 'object with only description: "Updated description text"',                                    expected: 'success: true, parsed description is "Updated description text"' },
        { noTc: 4,  ec: 'EC-4', inputData: 'object with only muscleGroup: MuscleGroup.CHEST (valid enum member)',                          expected: 'success: true, parsed muscleGroup is MuscleGroup.CHEST' },
        { noTc: 5,  ec: 'EC-5', inputData: 'object with only equipmentNeeded: Equipment.BARBELL (valid enum member)',                      expected: 'success: true, parsed equipmentNeeded is Equipment.BARBELL' },
        { noTc: 6,  ec: 'EC-4', inputData: 'object with only muscleGroup: "INVALID" (not a valid enum member)',                            expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 7,  ec: 'EC-5', inputData: 'object with only equipmentNeeded: "INVALID" (not a valid enum member)',                        expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 8,  ec: 'EC-6', inputData: 'object with only name: "         " (whitespace-only)',                                         expected: 'success: false, error path contains "name"' },
        { noTc: 9,  ec: 'EC-6', inputData: 'object with only name: "  New Exercise Name  " (surrounding whitespace)',                      expected: 'success: true, parsed name is "New Exercise Name"' },
        { noTc: 10, ec: 'EC-7', inputData: 'object with only description: "     " (whitespace-only)',                                      expected: 'success: true, parsed description is ""' },
        { noTc: 11, ec: 'EC-7', inputData: 'object with only description: "  updated description  " (surrounding whitespace)',             expected: 'success: true, parsed description is "updated description"' },
    ],
    bvaRows: [
        // ── name length ───────────────────────────────────────────────────────
        { number: 1,  condition: 'name length',              testCase: 'name: "A".repeat(7) (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'name length',              testCase: 'name: "A".repeat(8) (min): at minimum → success: true, parsed name is "A".repeat(8)' },
        { number: 3,  condition: 'name length',              testCase: 'name: "A".repeat(9) (min + 1): above minimum → success: true, parsed name is "A".repeat(9)' },
        { number: 4,  condition: 'name length',              testCase: 'name: "A".repeat(63) (max - 1): below maximum → success: true, parsed name is "A".repeat(63)' },
        { number: 5,  condition: 'name length',              testCase: 'name: "A".repeat(64) (max): at maximum → success: true, parsed name is "A".repeat(64)' },
        { number: 6,  condition: 'name length',              testCase: 'name: "A".repeat(65) (max + 1): above maximum → success: false' },
        // ── name whitespace + trim ────────────────────────────────────────────
        { number: 7,  condition: 'name whitespace + trim',   testCase: 'name: " ".repeat(8) (8 whitespace chars, empty after trim) → success: false' },
        { number: 8,  condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(8) + " " (8 real chars after trim, at minimum) → success: true, parsed name is "A".repeat(8)' },
        { number: 9,  condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(64) + " " (64 real chars after trim, at maximum) → success: true, parsed name is "A".repeat(64)' },
        { number: 10, condition: 'name whitespace + trim',   testCase: 'name: " " + "A".repeat(65) + " " (65 real chars after trim, above maximum) → success: false' },
        // ── description length ────────────────────────────────────────────────
        { number: 11, condition: 'description length',       testCase: 'description: "" (length 0, min): at minimum → success: true, parsed description is ""' },
        { number: 12, condition: 'description length',       testCase: 'description: "A" (length 1, min + 1): above minimum → success: true, parsed description is "A"' },
        { number: 13, condition: 'description length',       testCase: 'description: "A".repeat(1023) (max - 1): below maximum → success: true' },
        { number: 14, condition: 'description length',       testCase: 'description: "A".repeat(1024) (max): at maximum → success: true' },
        { number: 15, condition: 'description length',       testCase: 'description: "A".repeat(1025) (max + 1): above maximum → success: false' },
        // ── description whitespace + trim ─────────────────────────────────────
        { number: 16, condition: 'description whitespace + trim', testCase: 'description: " " + "A".repeat(1024) + " " (1024 real chars after trim, at maximum) → success: true, parsed description is "A".repeat(1024)' },
        { number: 17, condition: 'description whitespace + trim', testCase: 'description: " " + "A".repeat(1025) + " " (1025 real chars after trim, above maximum) → success: false' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (name=7)',    inputData: 'object with only name: "A".repeat(7) (7 characters)',                                             expected: 'success: false, error path contains "name"' },
        { noTc: 2,  bva: 'BVA-2  (name=8)',    inputData: 'object with only name: "A".repeat(8) (8 characters)',                                             expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 3,  bva: 'BVA-3  (name=9)',    inputData: 'object with only name: "A".repeat(9) (9 characters)',                                             expected: 'success: true, parsed name is "A".repeat(9)' },
        { noTc: 4,  bva: 'BVA-4  (name=63)',   inputData: 'object with only name: "A".repeat(63) (63 characters)',                                           expected: 'success: true, parsed name is "A".repeat(63)' },
        { noTc: 5,  bva: 'BVA-5  (name=64)',   inputData: 'object with only name: "A".repeat(64) (64 characters)',                                           expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 6,  bva: 'BVA-6  (name=65)',   inputData: 'object with only name: "A".repeat(65) (65 characters)',                                           expected: 'success: false, error path contains "name"' },
        { noTc: 7,  bva: 'BVA-7  (ws=8)',      inputData: 'object with only name: " ".repeat(8) (8 whitespace characters, empty after trim)',                 expected: 'success: false, error path contains "name"' },
        { noTc: 8,  bva: 'BVA-8  (pad→8)',     inputData: 'object with only name: " " + "A".repeat(8) + " " (8 real characters after trim)',                 expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 9,  bva: 'BVA-9  (pad→64)',    inputData: 'object with only name: " " + "A".repeat(64) + " " (64 real characters after trim)',               expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 10, bva: 'BVA-10 (pad→65)',    inputData: 'object with only name: " " + "A".repeat(65) + " " (65 real characters after trim)',               expected: 'success: false, error path contains "name"' },
        { noTc: 11, bva: 'BVA-11 (desc=0)',    inputData: 'object with only description: "" (0 characters)',                                                  expected: 'success: true, parsed description is ""' },
        { noTc: 12, bva: 'BVA-12 (desc=1)',    inputData: 'object with only description: "A" (1 character)',                                                  expected: 'success: true, parsed description is "A"' },
        { noTc: 13, bva: 'BVA-13 (desc=1023)', inputData: 'object with only description: "A".repeat(1023) (1023 characters)',                                 expected: 'success: true, parsed description is "A".repeat(1023)' },
        { noTc: 14, bva: 'BVA-14 (desc=1024)', inputData: 'object with only description: "A".repeat(1024) (1024 characters)',                                 expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 15, bva: 'BVA-15 (desc=1025)', inputData: 'object with only description: "A".repeat(1025) (1025 characters)',                                 expected: 'success: false, error path contains "description"' },
        { noTc: 16, bva: 'BVA-16 (pad→1024)',  inputData: 'object with only description: " " + "A".repeat(1024) + " " (1024 real characters after trim)',    expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 17, bva: 'BVA-17 (pad→1025)',  inputData: 'object with only description: " " + "A".repeat(1025) + " " (1025 real characters after trim)',    expected: 'success: false, error path contains "description"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'empty object {}',                                                                               expected: 'success: true, parsed data is {}' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'object with only name: "New Name"',                                                             expected: 'success: true, parsed name is "New Name"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'object with only description: "Updated description text"',                                     expected: 'success: true, parsed description is "Updated description text"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'object with only muscleGroup: MuscleGroup.CHEST (valid enum member)',                           expected: 'success: true, parsed muscleGroup is MuscleGroup.CHEST' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'object with only equipmentNeeded: Equipment.BARBELL (valid enum member)',                       expected: 'success: true, parsed equipmentNeeded is Equipment.BARBELL' },
        { noTc: 6,  fromEc: 'EC-4', fromBva: '', inputData: 'object with only muscleGroup: "INVALID" (not a valid enum member)',                             expected: 'success: false, error path contains "muscleGroup"' },
        { noTc: 7,  fromEc: 'EC-5', fromBva: '', inputData: 'object with only equipmentNeeded: "INVALID" (not a valid enum member)',                         expected: 'success: false, error path contains "equipmentNeeded"' },
        { noTc: 8,  fromEc: 'EC-6', fromBva: '', inputData: 'object with only name: "         " (whitespace-only)',                                          expected: 'success: false, error path contains "name"' },
        { noTc: 9,  fromEc: 'EC-6', fromBva: '', inputData: 'object with only name: "  New Exercise Name  " (surrounding whitespace)',                       expected: 'success: true, parsed name is "New Exercise Name"' },
        { noTc: 10, fromEc: 'EC-7', fromBva: '', inputData: 'object with only description: "     " (whitespace-only)',                                       expected: 'success: true, parsed description is ""' },
        { noTc: 11, fromEc: 'EC-7', fromBva: '', inputData: 'object with only description: "  updated description  " (surrounding whitespace)',              expected: 'success: true, parsed description is "updated description"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 12, fromEc: '', fromBva: 'BVA-1',  inputData: 'object with only name: "A".repeat(7) (7 characters)',                                        expected: 'success: false, error path contains "name"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-2',  inputData: 'object with only name: "A".repeat(8) (8 characters)',                                        expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3',  inputData: 'object with only name: "A".repeat(9) (9 characters)',                                        expected: 'success: true, parsed name is "A".repeat(9)' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-4',  inputData: 'object with only name: "A".repeat(63) (63 characters)',                                      expected: 'success: true, parsed name is "A".repeat(63)' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-5',  inputData: 'object with only name: "A".repeat(64) (64 characters)',                                      expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-6',  inputData: 'object with only name: "A".repeat(65) (65 characters)',                                      expected: 'success: false, error path contains "name"' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-7',  inputData: 'object with only name: " ".repeat(8) (8 whitespace characters, empty after trim)',            expected: 'success: false, error path contains "name"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-8',  inputData: 'object with only name: " " + "A".repeat(8) + " " (8 real characters after trim)',            expected: 'success: true, parsed name is "A".repeat(8)' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-9',  inputData: 'object with only name: " " + "A".repeat(64) + " " (64 real characters after trim)',          expected: 'success: true, parsed name is "A".repeat(64)' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-10', inputData: 'object with only name: " " + "A".repeat(65) + " " (65 real characters after trim)',          expected: 'success: false, error path contains "name"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-11', inputData: 'object with only description: "" (0 characters)',                                             expected: 'success: true, parsed description is ""' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-12', inputData: 'object with only description: "A" (1 character)',                                             expected: 'success: true, parsed description is "A"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-13', inputData: 'object with only description: "A".repeat(1023) (1023 characters)',                            expected: 'success: true, parsed description is "A".repeat(1023)' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-14', inputData: 'object with only description: "A".repeat(1024) (1024 characters)',                            expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-15', inputData: 'object with only description: "A".repeat(1025) (1025 characters)',                            expected: 'success: false, error path contains "description"' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-16', inputData: 'object with only description: " " + "A".repeat(1024) + " " (1024 real characters after trim)', expected: 'success: true, parsed description is "A".repeat(1024)' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-17', inputData: 'object with only description: " " + "A".repeat(1025) + " " (1025 real characters after trim)', expected: 'success: false, error path contains "description"' },
    ],
};

const createWorkoutSessionSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-11',
    tcCount: 27,
    statement: 'createWorkoutSessionSchema – Validates input for creating a workout session using Zod safeParse. Returns { success: true, data } when all required fields are present and satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field when any constraint is violated. memberId is required (at least 1 character after trimming, not whitespace-only; surrounding whitespace trimmed). date is required and must be in YYYY-MM-DD format. duration is required and must be an integer in the range 0–180 inclusive. notes is optional; when present it accepts an empty string, a whitespace-only string trimmed to "", or a non-empty string up to 1024 characters after trimming; surrounding whitespace trimmed.',
    data: 'Input: CreateWorkoutSessionInput { memberId: string, date: string, duration: number, notes?: string }',
    precondition: 'Input is passed directly to createWorkoutSessionSchema.safeParse(). memberId: required, at least 1 character after trim, not whitespace-only. date: required, YYYY-MM-DD format. duration: required, integer, 0 ≤ duration ≤ 180. notes: optional; when present, trimmed before length check, max 1024 characters after trim, whitespace-only trimmed to "".',
    results: 'Output: { success: boolean, data?: CreateWorkoutSessionInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains the supplied fields with memberId and notes trimmed. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1,  condition: 'All fields valid',      validEc: 'All required fields present with valid values, notes present and valid → success: true, parsed data matches trimmed input', invalidEc: '' },
        { number: 2,  condition: 'notes presence',        validEc: 'notes field absent → success: true, parsed notes is undefined', invalidEc: '' },
        { number: 3,  condition: 'notes value',           validEc: 'notes: "" (empty string) → success: true, parsed notes is ""', invalidEc: '' },
        { number: 4,  condition: 'memberId presence',     validEc: '', invalidEc: 'memberId field absent → success: false, error path contains "memberId"' },
        { number: 5,  condition: 'date presence',         validEc: '', invalidEc: 'date field absent → success: false, error path contains "date"' },
        { number: 6,  condition: 'duration presence',     validEc: '', invalidEc: 'duration field absent → success: false, error path contains "duration"' },
        { number: 7,  condition: 'memberId value',        validEc: '', invalidEc: 'memberId: "   " (whitespace-only) → success: false, error path contains "memberId"' },
        { number: 8,  condition: 'date format',           validEc: 'date: "2024-01-01" (valid YYYY-MM-DD) → success: true', invalidEc: 'date: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "date"' },
        { number: 9,  condition: 'memberId whitespace',   validEc: 'memberId: "  member-123  " (surrounding whitespace) → success: true, parsed memberId is "member-123"', invalidEc: '' },
        { number: 10, condition: 'notes content',         validEc: 'notes: "  some notes  " (surrounding whitespace) → success: true, parsed notes is "some notes"; notes: "     " (whitespace-only) → success: true, parsed notes is ""', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: 'all required fields provided with valid values: memberId "member-123", date "2024-01-01", duration 60, notes "Session notes"', expected: 'success: true, parsed data matches trimmed input' },
        { noTc: 2,  ec: 'EC-2',  inputData: 'valid session data with notes field absent',                                                                                   expected: 'success: true, parsed notes is undefined' },
        { noTc: 3,  ec: 'EC-3',  inputData: 'valid session data with notes: "" (empty string)',                                                                             expected: 'success: true, parsed notes is ""' },
        { noTc: 4,  ec: 'EC-4',  inputData: 'session data with memberId field absent',                                                                                      expected: 'success: false, error path contains "memberId"' },
        { noTc: 5,  ec: 'EC-5',  inputData: 'session data with date field absent',                                                                                          expected: 'success: false, error path contains "date"' },
        { noTc: 6,  ec: 'EC-6',  inputData: 'session data with duration field absent',                                                                                      expected: 'success: false, error path contains "duration"' },
        { noTc: 7,  ec: 'EC-7',  inputData: 'valid session data with memberId: "   " (whitespace-only)',                                                                    expected: 'success: false, error path contains "memberId"' },
        { noTc: 8,  ec: 'EC-8',  inputData: 'valid session data with date: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                        expected: 'success: false, error path contains "date"' },
        { noTc: 9,  ec: 'EC-9',  inputData: 'valid session data with memberId: "  member-123  " (surrounding whitespace)',                                                  expected: 'success: true, parsed memberId is "member-123"' },
        { noTc: 10, ec: 'EC-10', inputData: 'valid session data with notes: "     " (whitespace-only)',                                                                     expected: 'success: true, parsed notes is ""' },
        { noTc: 11, ec: 'EC-10', inputData: 'valid session data with notes: "  some notes  " (surrounding whitespace)',                                                     expected: 'success: true, parsed notes is "some notes"' },
    ],
    bvaRows: [
        // ── memberId length ───────────────────────────────────────────────────
        { number: 1, condition: 'memberId length',          testCase: 'memberId: "" (length 0, min - 1): below minimum → success: false' },
        { number: 2, condition: 'memberId length',          testCase: 'memberId: "A" (length 1, min): at minimum → success: true, parsed memberId is "A"' },
        { number: 3, condition: 'memberId length',          testCase: 'memberId: "AB" (length 2, min + 1): above minimum → success: true, parsed memberId is "AB"' },
        // ── duration range ────────────────────────────────────────────────────
        { number: 4, condition: 'duration range',           testCase: 'duration: -1 (min - 1): below minimum → success: false' },
        { number: 5, condition: 'duration range',           testCase: 'duration: 0 (min): at minimum → success: true, parsed duration is 0' },
        { number: 6, condition: 'duration range',           testCase: 'duration: 1 (min + 1): above minimum → success: true, parsed duration is 1' },
        { number: 7, condition: 'duration range',           testCase: 'duration: 179 (max - 1): below maximum → success: true, parsed duration is 179' },
        { number: 8, condition: 'duration range',           testCase: 'duration: 180 (max): at maximum → success: true, parsed duration is 180' },
        { number: 9, condition: 'duration range',           testCase: 'duration: 181 (max + 1): above maximum → success: false' },
        // ── notes length ──────────────────────────────────────────────────────
        { number: 10, condition: 'notes length',            testCase: 'notes: "" (length 0, min): at minimum → success: true, parsed notes is ""' },
        { number: 11, condition: 'notes length',            testCase: 'notes: "A" (length 1, min + 1): above minimum → success: true, parsed notes is "A"' },
        { number: 12, condition: 'notes length',            testCase: 'notes: "A".repeat(1023) (max - 1): below maximum → success: true' },
        { number: 13, condition: 'notes length',            testCase: 'notes: "A".repeat(1024) (max): at maximum → success: true' },
        { number: 14, condition: 'notes length',            testCase: 'notes: "A".repeat(1025) (max + 1): above maximum → success: false' },
        // ── memberId whitespace + trim ────────────────────────────────────────
        { number: 15, condition: 'memberId whitespace + trim', testCase: 'memberId: " A " (1 real char after trim, at minimum) → success: true, parsed memberId is "A"' },
        // ── notes whitespace + trim ───────────────────────────────────────────
        { number: 16, condition: 'notes whitespace + trim', testCase: 'notes: " " + "A".repeat(1024) + " " (1024 real chars after trim, at maximum) → success: true, parsed notes is "A".repeat(1024)' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (memberId=0)',    inputData: 'valid session data with memberId: "" (0 characters)',                                             expected: 'success: false, error path contains "memberId"' },
        { noTc: 2,  bva: 'BVA-2  (memberId=1)',    inputData: 'valid session data with memberId: "A" (1 character)',                                             expected: 'success: true, parsed memberId is "A"' },
        { noTc: 3,  bva: 'BVA-3  (memberId=2)',    inputData: 'valid session data with memberId: "AB" (2 characters)',                                           expected: 'success: true, parsed memberId is "AB"' },
        { noTc: 4,  bva: 'BVA-4  (dur=-1)',        inputData: 'valid session data with duration: -1',                                                            expected: 'success: false, error path contains "duration"' },
        { noTc: 5,  bva: 'BVA-5  (dur=0)',         inputData: 'valid session data with duration: 0',                                                             expected: 'success: true, parsed duration is 0' },
        { noTc: 6,  bva: 'BVA-6  (dur=1)',         inputData: 'valid session data with duration: 1',                                                             expected: 'success: true, parsed duration is 1' },
        { noTc: 7,  bva: 'BVA-7  (dur=179)',       inputData: 'valid session data with duration: 179',                                                           expected: 'success: true, parsed duration is 179' },
        { noTc: 8,  bva: 'BVA-8  (dur=180)',       inputData: 'valid session data with duration: 180',                                                           expected: 'success: true, parsed duration is 180' },
        { noTc: 9,  bva: 'BVA-9  (dur=181)',       inputData: 'valid session data with duration: 181',                                                           expected: 'success: false, error path contains "duration"' },
        { noTc: 10, bva: 'BVA-10 (notes=0)',       inputData: 'valid session data with notes: "" (0 characters)',                                                expected: 'success: true, parsed notes is ""' },
        { noTc: 11, bva: 'BVA-11 (notes=1)',       inputData: 'valid session data with notes: "A" (1 character)',                                                expected: 'success: true, parsed notes is "A"' },
        { noTc: 12, bva: 'BVA-12 (notes=1023)',    inputData: 'valid session data with notes: "A".repeat(1023) (1023 characters)',                               expected: 'success: true, parsed notes is "A".repeat(1023)' },
        { noTc: 13, bva: 'BVA-13 (notes=1024)',    inputData: 'valid session data with notes: "A".repeat(1024) (1024 characters)',                               expected: 'success: true, parsed notes is "A".repeat(1024)' },
        { noTc: 14, bva: 'BVA-14 (notes=1025)',    inputData: 'valid session data with notes: "A".repeat(1025) (1025 characters)',                               expected: 'success: false, error path contains "notes"' },
        { noTc: 15, bva: 'BVA-15 (pad→1)',         inputData: 'valid session data with memberId: " A " (1 real character after trim)',                           expected: 'success: true, parsed memberId is "A"' },
        { noTc: 16, bva: 'BVA-16 (pad→1024)',      inputData: 'valid session data with notes: " " + "A".repeat(1024) + " " (1024 real characters after trim)',  expected: 'success: true, parsed notes is "A".repeat(1024)' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: 'all required fields provided with valid values: memberId "member-123", date "2024-01-01", duration 60, notes "Session notes"', expected: 'success: true, parsed data matches trimmed input' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: 'valid session data with notes field absent',                                                                                   expected: 'success: true, parsed notes is undefined' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: 'valid session data with notes: "" (empty string)',                                                                             expected: 'success: true, parsed notes is ""' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: 'session data with memberId field absent',                                                                                      expected: 'success: false, error path contains "memberId"' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: 'session data with date field absent',                                                                                          expected: 'success: false, error path contains "date"' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: 'session data with duration field absent',                                                                                      expected: 'success: false, error path contains "duration"' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: 'valid session data with memberId: "   " (whitespace-only)',                                                                    expected: 'success: false, error path contains "memberId"' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: 'valid session data with date: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                        expected: 'success: false, error path contains "date"' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: 'valid session data with memberId: "  member-123  " (surrounding whitespace)',                                                  expected: 'success: true, parsed memberId is "member-123"' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'valid session data with notes: "     " (whitespace-only)',                                                                     expected: 'success: true, parsed notes is ""' },
        { noTc: 11, fromEc: 'EC-10', fromBva: '', inputData: 'valid session data with notes: "  some notes  " (surrounding whitespace)',                                                     expected: 'success: true, parsed notes is "some notes"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────
        { noTc: 12, fromEc: '', fromBva: 'BVA-1',  inputData: 'valid session data with memberId: "" (0 characters)',                                            expected: 'success: false, error path contains "memberId"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-2',  inputData: 'valid session data with memberId: "A" (1 character)',                                            expected: 'success: true, parsed memberId is "A"' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-3',  inputData: 'valid session data with memberId: "AB" (2 characters)',                                          expected: 'success: true, parsed memberId is "AB"' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-4',  inputData: 'valid session data with duration: -1',                                                           expected: 'success: false, error path contains "duration"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-5',  inputData: 'valid session data with duration: 0',                                                            expected: 'success: true, parsed duration is 0' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-6',  inputData: 'valid session data with duration: 1',                                                            expected: 'success: true, parsed duration is 1' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-7',  inputData: 'valid session data with duration: 179',                                                          expected: 'success: true, parsed duration is 179' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-8',  inputData: 'valid session data with duration: 180',                                                          expected: 'success: true, parsed duration is 180' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-9',  inputData: 'valid session data with duration: 181',                                                          expected: 'success: false, error path contains "duration"' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-10', inputData: 'valid session data with notes: "" (0 characters)',                                               expected: 'success: true, parsed notes is ""' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-11', inputData: 'valid session data with notes: "A" (1 character)',                                               expected: 'success: true, parsed notes is "A"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-12', inputData: 'valid session data with notes: "A".repeat(1023) (1023 characters)',                              expected: 'success: true, parsed notes is "A".repeat(1023)' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-13', inputData: 'valid session data with notes: "A".repeat(1024) (1024 characters)',                              expected: 'success: true, parsed notes is "A".repeat(1024)' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-14', inputData: 'valid session data with notes: "A".repeat(1025) (1025 characters)',                              expected: 'success: false, error path contains "notes"' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-15', inputData: 'valid session data with memberId: " A " (1 real character after trim)',                          expected: 'success: true, parsed memberId is "A"' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-16', inputData: 'valid session data with notes: " " + "A".repeat(1024) + " " (1024 real characters after trim)', expected: 'success: true, parsed notes is "A".repeat(1024)' },
    ],
};

const workoutSessionExerciseSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-12',
    tcCount: 26,
    statement: 'workoutSessionExerciseSchema – Validates a single workout session exercise entry using Zod safeParse. Returns { success: true, data } when all fields are valid. Returns { success: false, error } when any field violates a constraint. exerciseId is required (at least 1 character after trimming, not whitespace-only; surrounding whitespace trimmed). sets is required and must be coercible to a number in the range 0–6 inclusive. reps is required and must be coercible to a number in the range 0–30 inclusive. weight is required and must be coercible to a number in the range 0.0–500.0 inclusive.',
    data: 'Input: WorkoutSessionExerciseInput { exerciseId: string, sets: number, reps: number, weight: number }',
    precondition: 'Input is passed directly to workoutSessionExerciseSchema.safeParse(). exerciseId: required, at least 1 character after trim, not whitespace-only, surrounding whitespace trimmed. sets: required, coercible to number, 0 ≤ sets ≤ 6. reps: required, coercible to number, 0 ≤ reps ≤ 30. weight: required, coercible to number, 0.0 ≤ weight ≤ 500.0.',
    results: 'Output: { success: boolean, data?: WorkoutSessionExerciseInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains the supplied fields with exerciseId trimmed. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'All fields valid',      validEc: 'All required fields present with valid values → success: true, parsed data matches the input', invalidEc: '' },
        { number: 2, condition: 'exerciseId presence',   validEc: '', invalidEc: 'exerciseId field absent → success: false, error path contains "exerciseId"' },
        { number: 3, condition: 'exerciseId value',      validEc: '', invalidEc: 'exerciseId: "   " (whitespace-only) → success: false, error path contains "exerciseId"' },
        { number: 4, condition: 'exerciseId whitespace', validEc: 'exerciseId: "  exercise-123  " (surrounding whitespace) → success: true, parsed exerciseId is "exercise-123"', invalidEc: '' },
        { number: 5, condition: 'sets type',             validEc: '', invalidEc: 'sets: "invalid" (string not coercible to number) → success: false, error path contains "sets"' },
        { number: 6, condition: 'reps type',             validEc: '', invalidEc: 'reps: "invalid" (string not coercible to number) → success: false, error path contains "reps"' },
        { number: 7, condition: 'weight type',           validEc: '', invalidEc: 'weight: "invalid" (string not coercible to number) → success: false, error path contains "weight"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'all fields valid: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2, ec: 'EC-2', inputData: 'exerciseId field absent: { sets: 3, reps: 10, weight: 80.5 }',               expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 3, ec: 'EC-3', inputData: 'exerciseId: "   " (whitespace-only)',                                         expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 4, ec: 'EC-4', inputData: 'exerciseId: "  exercise-123  " (surrounding whitespace)',                     expected: 'success: true, parsed exerciseId is "exercise-123"' },
        { noTc: 5, ec: 'EC-5', inputData: 'sets: "invalid" (string not coercible)',                                      expected: 'success: false, error path contains "sets"' },
        { noTc: 6, ec: 'EC-6', inputData: 'reps: "invalid" (string not coercible)',                                      expected: 'success: false, error path contains "reps"' },
        { noTc: 7, ec: 'EC-7', inputData: 'weight: "invalid" (string not coercible)',                                    expected: 'success: false, error path contains "weight"' },
    ],
    bvaRows: [
        // ── sets range ────────────────────────────────────────────────────────
        { number: 1,  condition: 'sets range', testCase: 'sets: -1 (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'sets range', testCase: 'sets: 0 (min): at minimum → success: true, parsed sets is 0' },
        { number: 3,  condition: 'sets range', testCase: 'sets: 1 (min + 1): above minimum → success: true, parsed sets is 1' },
        { number: 4,  condition: 'sets range', testCase: 'sets: 5 (max - 1): below maximum → success: true, parsed sets is 5' },
        { number: 5,  condition: 'sets range', testCase: 'sets: 6 (max): at maximum → success: true, parsed sets is 6' },
        { number: 6,  condition: 'sets range', testCase: 'sets: 7 (max + 1): above maximum → success: false' },
        // ── reps range ────────────────────────────────────────────────────────
        { number: 7,  condition: 'reps range', testCase: 'reps: -1 (min - 1): below minimum → success: false' },
        { number: 8,  condition: 'reps range', testCase: 'reps: 0 (min): at minimum → success: true, parsed reps is 0' },
        { number: 9,  condition: 'reps range', testCase: 'reps: 1 (min + 1): above minimum → success: true, parsed reps is 1' },
        { number: 10, condition: 'reps range', testCase: 'reps: 29 (max - 1): below maximum → success: true, parsed reps is 29' },
        { number: 11, condition: 'reps range', testCase: 'reps: 30 (max): at maximum → success: true, parsed reps is 30' },
        { number: 12, condition: 'reps range', testCase: 'reps: 31 (max + 1): above maximum → success: false' },
        // ── weight range ──────────────────────────────────────────────────────
        { number: 13, condition: 'weight range', testCase: 'weight: -0.1 (min - 0.1): below minimum → success: false' },
        { number: 14, condition: 'weight range', testCase: 'weight: 0.0 (min): at minimum → success: true, parsed weight is 0' },
        { number: 15, condition: 'weight range', testCase: 'weight: 0.1 (min + 0.1): above minimum → success: true, parsed weight is 0.1' },
        { number: 16, condition: 'weight range', testCase: 'weight: 499.9 (max - 0.1): below maximum → success: true, parsed weight is 499.9' },
        { number: 17, condition: 'weight range', testCase: 'weight: 500.0 (max): at maximum → success: true, parsed weight is 500' },
        { number: 18, condition: 'weight range', testCase: 'weight: 500.1 (max + 0.1): above maximum → success: false' },
        // ── exerciseId whitespace + trim ──────────────────────────────────────
        { number: 19, condition: 'exerciseId whitespace + trim', testCase: 'exerciseId: " E " (1 real character after trim, at minimum) → success: true, parsed exerciseId is "E"' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (sets=-1)',   inputData: 'entry with sets: -1',                                                    expected: 'success: false, error path contains "sets"' },
        { noTc: 2,  bva: 'BVA-2  (sets=0)',    inputData: 'entry with sets: 0',                                                     expected: 'success: true, parsed sets is 0' },
        { noTc: 3,  bva: 'BVA-3  (sets=1)',    inputData: 'entry with sets: 1',                                                     expected: 'success: true, parsed sets is 1' },
        { noTc: 4,  bva: 'BVA-4  (sets=5)',    inputData: 'entry with sets: 5',                                                     expected: 'success: true, parsed sets is 5' },
        { noTc: 5,  bva: 'BVA-5  (sets=6)',    inputData: 'entry with sets: 6',                                                     expected: 'success: true, parsed sets is 6' },
        { noTc: 6,  bva: 'BVA-6  (sets=7)',    inputData: 'entry with sets: 7',                                                     expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  bva: 'BVA-7  (reps=-1)',   inputData: 'entry with reps: -1',                                                    expected: 'success: false, error path contains "reps"' },
        { noTc: 8,  bva: 'BVA-8  (reps=0)',    inputData: 'entry with reps: 0',                                                     expected: 'success: true, parsed reps is 0' },
        { noTc: 9,  bva: 'BVA-9  (reps=1)',    inputData: 'entry with reps: 1',                                                     expected: 'success: true, parsed reps is 1' },
        { noTc: 10, bva: 'BVA-10 (reps=29)',   inputData: 'entry with reps: 29',                                                    expected: 'success: true, parsed reps is 29' },
        { noTc: 11, bva: 'BVA-11 (reps=30)',   inputData: 'entry with reps: 30',                                                    expected: 'success: true, parsed reps is 30' },
        { noTc: 12, bva: 'BVA-12 (reps=31)',   inputData: 'entry with reps: 31',                                                    expected: 'success: false, error path contains "reps"' },
        { noTc: 13, bva: 'BVA-13 (wt=-0.1)',   inputData: 'entry with weight: -0.1',                                                expected: 'success: false, error path contains "weight"' },
        { noTc: 14, bva: 'BVA-14 (wt=0)',      inputData: 'entry with weight: 0',                                                   expected: 'success: true, parsed weight is 0' },
        { noTc: 15, bva: 'BVA-15 (wt=0.1)',    inputData: 'entry with weight: 0.1',                                                 expected: 'success: true, parsed weight is 0.1' },
        { noTc: 16, bva: 'BVA-16 (wt=499.9)',  inputData: 'entry with weight: 499.9',                                               expected: 'success: true, parsed weight is 499.9' },
        { noTc: 17, bva: 'BVA-17 (wt=500)',    inputData: 'entry with weight: 500',                                                 expected: 'success: true, parsed weight is 500' },
        { noTc: 18, bva: 'BVA-18 (wt=500.1)',  inputData: 'entry with weight: 500.1',                                               expected: 'success: false, error path contains "weight"' },
        { noTc: 19, bva: 'BVA-19 (pad→1)',     inputData: 'entry with exerciseId: " E " (1 real character after trim)',              expected: 'success: true, parsed exerciseId is "E"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'all fields valid: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'exerciseId field absent: { sets: 3, reps: 10, weight: 80.5 }',               expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'exerciseId: "   " (whitespace-only)',                                         expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'exerciseId: "  exercise-123  " (surrounding whitespace)',                     expected: 'success: true, parsed exerciseId is "exercise-123"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'sets: "invalid" (string not coercible)',                                      expected: 'success: false, error path contains "sets"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'reps: "invalid" (string not coercible)',                                      expected: 'success: false, error path contains "reps"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'weight: "invalid" (string not coercible)',                                    expected: 'success: false, error path contains "weight"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1',  inputData: 'entry with sets: -1',    expected: 'success: false, error path contains "sets"' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2',  inputData: 'entry with sets: 0',     expected: 'success: true, parsed sets is 0' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-3',  inputData: 'entry with sets: 1',     expected: 'success: true, parsed sets is 1' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-4',  inputData: 'entry with sets: 5',     expected: 'success: true, parsed sets is 5' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-5',  inputData: 'entry with sets: 6',     expected: 'success: true, parsed sets is 6' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-6',  inputData: 'entry with sets: 7',     expected: 'success: false, error path contains "sets"' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-7',  inputData: 'entry with reps: -1',    expected: 'success: false, error path contains "reps"' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-8',  inputData: 'entry with reps: 0',     expected: 'success: true, parsed reps is 0' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-9',  inputData: 'entry with reps: 1',     expected: 'success: true, parsed reps is 1' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-10', inputData: 'entry with reps: 29',    expected: 'success: true, parsed reps is 29' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-11', inputData: 'entry with reps: 30',    expected: 'success: true, parsed reps is 30' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-12', inputData: 'entry with reps: 31',    expected: 'success: false, error path contains "reps"' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-13', inputData: 'entry with weight: -0.1',   expected: 'success: false, error path contains "weight"' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-14', inputData: 'entry with weight: 0',      expected: 'success: true, parsed weight is 0' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-15', inputData: 'entry with weight: 0.1',    expected: 'success: true, parsed weight is 0.1' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-16', inputData: 'entry with weight: 499.9',  expected: 'success: true, parsed weight is 499.9' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-17', inputData: 'entry with weight: 500',    expected: 'success: true, parsed weight is 500' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-18', inputData: 'entry with weight: 500.1',  expected: 'success: false, error path contains "weight"' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-19', inputData: 'entry with exerciseId: " E " (1 real character after trim)', expected: 'success: true, parsed exerciseId is "E"' },
    ],
};

const workoutSessionExercisesSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-13',
    tcCount: 28,
    statement: 'workoutSessionExercisesSchema – Validates an array of workout session exercise entries using Zod safeParse. Returns { success: true, data } when the array contains at least one entry and every entry satisfies its field constraints. Returns { success: false, error } when the array is empty or any entry violates a constraint. Array constraints: minimum length 1. Per-entry constraints: exerciseId is required (at least 1 character after trimming, not whitespace-only; surrounding whitespace trimmed). sets is required and must be an integer in the range 0–6 inclusive. reps is required and must be an integer in the range 0–30 inclusive. weight is required and must be a number in the range 0.0–500.0 inclusive.',
    data: 'Input: Array<WorkoutSessionExerciseInput { exerciseId: string, sets: number, reps: number, weight: number }>',
    precondition: 'Input is passed directly to workoutSessionExercisesSchema.safeParse(). Array must contain at least 1 entry. Per entry: exerciseId is required, at least 1 character after trim, not whitespace-only, surrounding whitespace trimmed. sets: required, integer, 0 ≤ sets ≤ 6. reps: required, integer, 0 ≤ reps ≤ 30. weight: required, number, 0.0 ≤ weight ≤ 500.0.',
    results: 'Output: { success: boolean, data?: WorkoutSessionExerciseInput[], error?: ZodError }',
    postcondition: 'On success: parsed data is an array of entries with exerciseId trimmed. On failure: error.issues[0].path contains the index of the offending entry and/or the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'Array length',       validEc: 'Array with 1 entry (all fields valid) → success: true, parsed data has length 1', invalidEc: '' },
        { number: 2, condition: 'Array length',       validEc: 'Array with 2 entries (all fields valid) → success: true, parsed data has length 2', invalidEc: '' },
        { number: 3, condition: 'Array length',       validEc: '', invalidEc: 'Empty array [] → success: false' },
        { number: 4, condition: 'exerciseId presence',validEc: '', invalidEc: 'Entry with exerciseId field absent → success: false, error path contains "exerciseId"' },
        { number: 5, condition: 'exerciseId value',   validEc: '', invalidEc: 'Entry with exerciseId: "   " (whitespace-only) → success: false, error path contains "exerciseId"' },
        { number: 6, condition: 'sets type',          validEc: '', invalidEc: 'Entry with sets: "invalid" (string instead of number) → success: false, error path contains "sets"' },
        { number: 7, condition: 'reps type',          validEc: '', invalidEc: 'Entry with reps: "invalid" (string instead of number) → success: false, error path contains "reps"' },
        { number: 8, condition: 'weight type',        validEc: '', invalidEc: 'Entry with weight: "invalid" (string instead of number) → success: false, error path contains "weight"' },
        { number: 9, condition: 'exerciseId whitespace', validEc: 'Entry with exerciseId: "  exercise-123  " (surrounding whitespace) → success: true, parsed exerciseId is "exercise-123"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'array containing one entry with all fields valid: exerciseId "exercise-123", sets 3, reps 10, weight 80.5',        expected: 'success: true, parsed data has length 1 and matches the input' },
        { noTc: 2, ec: 'EC-2', inputData: 'array containing two entries, both with all fields valid, second entry has exerciseId "exercise-456"',              expected: 'success: true, parsed data has length 2, second entry exerciseId is "exercise-456"' },
        { noTc: 3, ec: 'EC-3', inputData: 'empty array []',                                                                                                   expected: 'success: false' },
        { noTc: 4, ec: 'EC-4', inputData: 'array with one entry where exerciseId field is absent: { sets: 3, reps: 10, weight: 80.5 }',                        expected: 'success: false, error path contains index 0 and "exerciseId"' },
        { noTc: 5, ec: 'EC-5', inputData: 'array with one entry where exerciseId: "   " (whitespace-only)',                                                   expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 6, ec: 'EC-6', inputData: 'array with one entry where sets: "invalid" (string)',                                                              expected: 'success: false, error path contains "sets"' },
        { noTc: 7, ec: 'EC-7', inputData: 'array with one entry where reps: "invalid" (string)',                                                              expected: 'success: false, error path contains "reps"' },
        { noTc: 8, ec: 'EC-8', inputData: 'array with one entry where weight: "invalid" (string)',                                                            expected: 'success: false, error path contains "weight"' },
        { noTc: 9, ec: 'EC-9', inputData: 'array with one entry where exerciseId: "  exercise-123  " (surrounding whitespace)',                               expected: 'success: true, parsed exerciseId is "exercise-123"' },
    ],
    bvaRows: [
        // ── sets range ────────────────────────────────────────────────────────
        { number: 1,  condition: 'sets range', testCase: 'sets: -1 (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'sets range', testCase: 'sets: 0 (min): at minimum → success: true, parsed sets is 0' },
        { number: 3,  condition: 'sets range', testCase: 'sets: 1 (min + 1): above minimum → success: true, parsed sets is 1' },
        { number: 4,  condition: 'sets range', testCase: 'sets: 5 (max - 1): below maximum → success: true, parsed sets is 5' },
        { number: 5,  condition: 'sets range', testCase: 'sets: 6 (max): at maximum → success: true, parsed sets is 6' },
        { number: 6,  condition: 'sets range', testCase: 'sets: 7 (max + 1): above maximum → success: false' },
        // ── reps range ────────────────────────────────────────────────────────
        { number: 7,  condition: 'reps range', testCase: 'reps: -1 (min - 1): below minimum → success: false' },
        { number: 8,  condition: 'reps range', testCase: 'reps: 0 (min): at minimum → success: true, parsed reps is 0' },
        { number: 9,  condition: 'reps range', testCase: 'reps: 1 (min + 1): above minimum → success: true, parsed reps is 1' },
        { number: 10, condition: 'reps range', testCase: 'reps: 29 (max - 1): below maximum → success: true, parsed reps is 29' },
        { number: 11, condition: 'reps range', testCase: 'reps: 30 (max): at maximum → success: true, parsed reps is 30' },
        { number: 12, condition: 'reps range', testCase: 'reps: 31 (max + 1): above maximum → success: false' },
        // ── weight range ──────────────────────────────────────────────────────
        { number: 13, condition: 'weight range', testCase: 'weight: -0.1 (min - 0.1): below minimum → success: false' },
        { number: 14, condition: 'weight range', testCase: 'weight: 0.0 (min): at minimum → success: true, parsed weight is 0' },
        { number: 15, condition: 'weight range', testCase: 'weight: 0.1 (min + 0.1): above minimum → success: true, parsed weight is 0.1' },
        { number: 16, condition: 'weight range', testCase: 'weight: 499.9 (max - 0.1): below maximum → success: true, parsed weight is 499.9' },
        { number: 17, condition: 'weight range', testCase: 'weight: 500.0 (max): at maximum → success: true, parsed weight is 500' },
        { number: 18, condition: 'weight range', testCase: 'weight: 500.1 (max + 0.1): above maximum → success: false' },
        // ── exerciseId whitespace + trim ──────────────────────────────────────
        { number: 19, condition: 'exerciseId whitespace + trim', testCase: 'exerciseId: " E " (1 real character after trim, at minimum) → success: true, parsed exerciseId is "E"' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (sets=-1)',     inputData: 'array with one entry where sets: -1',                                                               expected: 'success: false, error path contains "sets"' },
        { noTc: 2,  bva: 'BVA-2  (sets=0)',      inputData: 'array with one entry where sets: 0',                                                                expected: 'success: true, parsed sets is 0' },
        { noTc: 3,  bva: 'BVA-3  (sets=1)',      inputData: 'array with one entry where sets: 1',                                                                expected: 'success: true, parsed sets is 1' },
        { noTc: 4,  bva: 'BVA-4  (sets=5)',      inputData: 'array with one entry where sets: 5',                                                                expected: 'success: true, parsed sets is 5' },
        { noTc: 5,  bva: 'BVA-5  (sets=6)',      inputData: 'array with one entry where sets: 6',                                                                expected: 'success: true, parsed sets is 6' },
        { noTc: 6,  bva: 'BVA-6  (sets=7)',      inputData: 'array with one entry where sets: 7',                                                                expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  bva: 'BVA-7  (reps=-1)',     inputData: 'array with one entry where reps: -1',                                                               expected: 'success: false, error path contains "reps"' },
        { noTc: 8,  bva: 'BVA-8  (reps=0)',      inputData: 'array with one entry where reps: 0',                                                                expected: 'success: true, parsed reps is 0' },
        { noTc: 9,  bva: 'BVA-9  (reps=1)',      inputData: 'array with one entry where reps: 1',                                                                expected: 'success: true, parsed reps is 1' },
        { noTc: 10, bva: 'BVA-10 (reps=29)',     inputData: 'array with one entry where reps: 29',                                                               expected: 'success: true, parsed reps is 29' },
        { noTc: 11, bva: 'BVA-11 (reps=30)',     inputData: 'array with one entry where reps: 30',                                                               expected: 'success: true, parsed reps is 30' },
        { noTc: 12, bva: 'BVA-12 (reps=31)',     inputData: 'array with one entry where reps: 31',                                                               expected: 'success: false, error path contains "reps"' },
        { noTc: 13, bva: 'BVA-13 (wt=-0.1)',     inputData: 'array with one entry where weight: -0.1',                                                           expected: 'success: false, error path contains "weight"' },
        { noTc: 14, bva: 'BVA-14 (wt=0)',        inputData: 'array with one entry where weight: 0',                                                              expected: 'success: true, parsed weight is 0' },
        { noTc: 15, bva: 'BVA-15 (wt=0.1)',      inputData: 'array with one entry where weight: 0.1',                                                            expected: 'success: true, parsed weight is 0.1' },
        { noTc: 16, bva: 'BVA-16 (wt=499.9)',    inputData: 'array with one entry where weight: 499.9',                                                          expected: 'success: true, parsed weight is 499.9' },
        { noTc: 17, bva: 'BVA-17 (wt=500)',      inputData: 'array with one entry where weight: 500',                                                            expected: 'success: true, parsed weight is 500' },
        { noTc: 18, bva: 'BVA-18 (wt=500.1)',    inputData: 'array with one entry where weight: 500.1',                                                          expected: 'success: false, error path contains "weight"' },
        { noTc: 19, bva: 'BVA-19 (pad→1)',       inputData: 'array with one entry where exerciseId: " E " (1 real character after trim)',                        expected: 'success: true, parsed exerciseId is "E"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'array containing one entry with all fields valid: exerciseId "exercise-123", sets 3, reps 10, weight 80.5',      expected: 'success: true, parsed data has length 1 and matches the input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'array containing two entries, both with all fields valid, second entry has exerciseId "exercise-456"',            expected: 'success: true, parsed data has length 2, second entry exerciseId is "exercise-456"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'empty array []',                                                                                                 expected: 'success: false' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'array with one entry where exerciseId field is absent: { sets: 3, reps: 10, weight: 80.5 }',                     expected: 'success: false, error path contains index 0 and "exerciseId"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'array with one entry where exerciseId: "   " (whitespace-only)',                                                 expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'array with one entry where sets: "invalid" (string)',                                                            expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'array with one entry where reps: "invalid" (string)',                                                            expected: 'success: false, error path contains "reps"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: 'array with one entry where weight: "invalid" (string)',                                                          expected: 'success: false, error path contains "weight"' },
        { noTc: 9,  fromEc: 'EC-9', fromBva: '', inputData: 'array with one entry where exerciseId: "  exercise-123  " (surrounding whitespace)',                             expected: 'success: true, parsed exerciseId is "exercise-123"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 10, fromEc: '', fromBva: 'BVA-1',  inputData: 'array with one entry where sets: -1',                                                                          expected: 'success: false, error path contains "sets"' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2',  inputData: 'array with one entry where sets: 0',                                                                           expected: 'success: true, parsed sets is 0' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3',  inputData: 'array with one entry where sets: 1',                                                                           expected: 'success: true, parsed sets is 1' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-4',  inputData: 'array with one entry where sets: 5',                                                                           expected: 'success: true, parsed sets is 5' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-5',  inputData: 'array with one entry where sets: 6',                                                                           expected: 'success: true, parsed sets is 6' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-6',  inputData: 'array with one entry where sets: 7',                                                                           expected: 'success: false, error path contains "sets"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-7',  inputData: 'array with one entry where reps: -1',                                                                          expected: 'success: false, error path contains "reps"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-8',  inputData: 'array with one entry where reps: 0',                                                                           expected: 'success: true, parsed reps is 0' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-9',  inputData: 'array with one entry where reps: 1',                                                                           expected: 'success: true, parsed reps is 1' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-10', inputData: 'array with one entry where reps: 29',                                                                          expected: 'success: true, parsed reps is 29' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-11', inputData: 'array with one entry where reps: 30',                                                                          expected: 'success: true, parsed reps is 30' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-12', inputData: 'array with one entry where reps: 31',                                                                          expected: 'success: false, error path contains "reps"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-13', inputData: 'array with one entry where weight: -0.1',                                                                      expected: 'success: false, error path contains "weight"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-14', inputData: 'array with one entry where weight: 0',                                                                         expected: 'success: true, parsed weight is 0' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-15', inputData: 'array with one entry where weight: 0.1',                                                                       expected: 'success: true, parsed weight is 0.1' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-16', inputData: 'array with one entry where weight: 499.9',                                                                     expected: 'success: true, parsed weight is 499.9' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-17', inputData: 'array with one entry where weight: 500',                                                                       expected: 'success: true, parsed weight is 500' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-18', inputData: 'array with one entry where weight: 500.1',                                                                     expected: 'success: false, error path contains "weight"' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-19', inputData: 'array with one entry where exerciseId: " E " (1 real character after trim)',                                   expected: 'success: true, parsed exerciseId is "E"' },
    ],
};

const updateWorkoutSessionSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-14',
    tcCount: 19,
    statement: 'updateWorkoutSessionSchema – Validates a partial update for a workout session using Zod safeParse. All fields are optional; an empty object is valid. Returns { success: true, data } when every supplied field satisfies its constraint. Returns { success: false, error } with a path pointing to the offending field when any supplied field violates its constraint. Field constraints when present: date must be in YYYY-MM-DD format. duration must be an integer in the range 0–180 inclusive. notes accepts an empty string, a whitespace-only string trimmed to "", or a non-empty string up to 1024 characters after trimming; surrounding whitespace trimmed.',
    data: 'Input: Partial<{ date: string, duration: number, notes: string }>',
    precondition: 'Input is passed directly to updateWorkoutSessionSchema.safeParse(). All fields are optional. When present, each field is subject to the same constraints as in createWorkoutSessionSchema. date: YYYY-MM-DD format. duration: integer, 0 ≤ duration ≤ 180. notes: when present, trimmed before length check, max 1024 characters after trim, whitespace-only trimmed to "".',
    results: 'Output: { success: boolean, data?: UpdateWorkoutSessionInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains only the supplied fields with notes trimmed. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'Empty input',       validEc: 'Empty object {} → success: true, parsed data is {}', invalidEc: '' },
        { number: 2, condition: 'date value',         validEc: 'date: "2024-06-15" (valid YYYY-MM-DD) → success: true, parsed date is "2024-06-15"', invalidEc: 'date: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "date"' },
        { number: 3, condition: 'duration value',     validEc: 'duration: 45 (within range 0–180) → success: true, parsed duration is 45', invalidEc: '' },
        { number: 4, condition: 'notes value',        validEc: 'notes: "Updated notes" (valid length) → success: true, parsed notes matches input', invalidEc: '' },
        { number: 5, condition: 'notes content',      validEc: 'notes: "  updated notes  " (surrounding whitespace) → success: true, parsed notes is "updated notes"; notes: "     " (whitespace-only) → success: true, parsed notes is ""', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'empty object {}',                                                        expected: 'success: true, parsed data is {}' },
        { noTc: 2, ec: 'EC-2', inputData: 'object with only date: "2024-06-15"',                                    expected: 'success: true, parsed date is "2024-06-15"' },
        { noTc: 3, ec: 'EC-2', inputData: 'object with only date: "01/01/2024" (MM/DD/YYYY, wrong format)',         expected: 'success: false, error path contains "date"' },
        { noTc: 4, ec: 'EC-3', inputData: 'object with only duration: 45',                                          expected: 'success: true, parsed duration is 45' },
        { noTc: 5, ec: 'EC-4', inputData: 'object with only notes: "Updated notes"',                                expected: 'success: true, parsed notes is "Updated notes"' },
        { noTc: 6, ec: 'EC-5', inputData: 'object with only notes: "     " (whitespace-only)',                      expected: 'success: true, parsed notes is ""' },
        { noTc: 7, ec: 'EC-5', inputData: 'object with only notes: "  updated notes  " (surrounding whitespace)',   expected: 'success: true, parsed notes is "updated notes"' },
    ],
    bvaRows: [
        // ── duration range ────────────────────────────────────────────────────
        { number: 1, condition: 'duration range', testCase: 'duration: -1 (min - 1): below minimum → success: false' },
        { number: 2, condition: 'duration range', testCase: 'duration: 0 (min): at minimum → success: true, parsed duration is 0' },
        { number: 3, condition: 'duration range', testCase: 'duration: 1 (min + 1): above minimum → success: true, parsed duration is 1' },
        { number: 4, condition: 'duration range', testCase: 'duration: 179 (max - 1): below maximum → success: true, parsed duration is 179' },
        { number: 5, condition: 'duration range', testCase: 'duration: 180 (max): at maximum → success: true, parsed duration is 180' },
        { number: 6, condition: 'duration range', testCase: 'duration: 181 (max + 1): above maximum → success: false' },
        // ── notes length ──────────────────────────────────────────────────────
        { number: 7,  condition: 'notes length', testCase: 'notes: "" (length 0, min): at minimum → success: true, parsed notes is ""' },
        { number: 8,  condition: 'notes length', testCase: 'notes: "A" (length 1, min + 1): above minimum → success: true, parsed notes is "A"' },
        { number: 9,  condition: 'notes length', testCase: 'notes: "A".repeat(1023) (max - 1): below maximum → success: true' },
        { number: 10, condition: 'notes length', testCase: 'notes: "A".repeat(1024) (max): at maximum → success: true' },
        { number: 11, condition: 'notes length', testCase: 'notes: "A".repeat(1025) (max + 1): above maximum → success: false' },
        // ── notes whitespace + trim ───────────────────────────────────────────
        { number: 12, condition: 'notes whitespace + trim', testCase: 'notes: " " + "A".repeat(1024) + " " (1024 real characters after trim, at maximum) → success: true, parsed notes is "A".repeat(1024)' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (dur=-1)',    inputData: 'object with only duration: -1',                                                               expected: 'success: false, error path contains "duration"' },
        { noTc: 2,  bva: 'BVA-2  (dur=0)',     inputData: 'object with only duration: 0',                                                                expected: 'success: true, parsed duration is 0' },
        { noTc: 3,  bva: 'BVA-3  (dur=1)',     inputData: 'object with only duration: 1',                                                                expected: 'success: true, parsed duration is 1' },
        { noTc: 4,  bva: 'BVA-4  (dur=179)',   inputData: 'object with only duration: 179',                                                              expected: 'success: true, parsed duration is 179' },
        { noTc: 5,  bva: 'BVA-5  (dur=180)',   inputData: 'object with only duration: 180',                                                              expected: 'success: true, parsed duration is 180' },
        { noTc: 6,  bva: 'BVA-6  (dur=181)',   inputData: 'object with only duration: 181',                                                              expected: 'success: false, error path contains "duration"' },
        { noTc: 7,  bva: 'BVA-7  (notes=0)',   inputData: 'object with only notes: "" (0 characters)',                                                   expected: 'success: true, parsed notes is ""' },
        { noTc: 8,  bva: 'BVA-8  (notes=1)',   inputData: 'object with only notes: "A" (1 character)',                                                   expected: 'success: true, parsed notes is "A"' },
        { noTc: 9,  bva: 'BVA-9  (notes=1023)',inputData: 'object with only notes: "A".repeat(1023) (1023 characters)',                                  expected: 'success: true, parsed notes is "A".repeat(1023)' },
        { noTc: 10, bva: 'BVA-10 (notes=1024)',inputData: 'object with only notes: "A".repeat(1024) (1024 characters)',                                  expected: 'success: true, parsed notes is "A".repeat(1024)' },
        { noTc: 11, bva: 'BVA-11 (notes=1025)',inputData: 'object with only notes: "A".repeat(1025) (1025 characters)',                                  expected: 'success: false, error path contains "notes"' },
        { noTc: 12, bva: 'BVA-12 (pad→1024)', inputData: 'object with only notes: " " + "A".repeat(1024) + " " (1024 real characters after trim)',      expected: 'success: true, parsed notes is "A".repeat(1024)' },
    ],
    finalTcRows: [
        // ── From EC ───────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'empty object {}',                                                                           expected: 'success: true, parsed data is {}' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'object with only date: "2024-06-15"',                                                       expected: 'success: true, parsed date is "2024-06-15"' },
        { noTc: 3,  fromEc: 'EC-2', fromBva: '', inputData: 'object with only date: "01/01/2024" (MM/DD/YYYY, wrong format)',                            expected: 'success: false, error path contains "date"' },
        { noTc: 4,  fromEc: 'EC-3', fromBva: '', inputData: 'object with only duration: 45',                                                             expected: 'success: true, parsed duration is 45' },
        { noTc: 5,  fromEc: 'EC-4', fromBva: '', inputData: 'object with only notes: "Updated notes"',                                                   expected: 'success: true, parsed notes is "Updated notes"' },
        { noTc: 6,  fromEc: 'EC-5', fromBva: '', inputData: 'object with only notes: "     " (whitespace-only)',                                         expected: 'success: true, parsed notes is ""' },
        { noTc: 7,  fromEc: 'EC-5', fromBva: '', inputData: 'object with only notes: "  updated notes  " (surrounding whitespace)',                      expected: 'success: true, parsed notes is "updated notes"' },
        // ── From BVA ──────────────────────────────────────────────────────────────────────────────────────
        { noTc: 8,  fromEc: '', fromBva: 'BVA-1',  inputData: 'object with only duration: -1',                                                           expected: 'success: false, error path contains "duration"' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-2',  inputData: 'object with only duration: 0',                                                            expected: 'success: true, parsed duration is 0' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-3',  inputData: 'object with only duration: 1',                                                            expected: 'success: true, parsed duration is 1' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-4',  inputData: 'object with only duration: 179',                                                          expected: 'success: true, parsed duration is 179' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-5',  inputData: 'object with only duration: 180',                                                          expected: 'success: true, parsed duration is 180' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-6',  inputData: 'object with only duration: 181',                                                          expected: 'success: false, error path contains "duration"' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-7',  inputData: 'object with only notes: "" (0 characters)',                                               expected: 'success: true, parsed notes is ""' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-8',  inputData: 'object with only notes: "A" (1 character)',                                               expected: 'success: true, parsed notes is "A"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-9',  inputData: 'object with only notes: "A".repeat(1023) (1023 characters)',                              expected: 'success: true, parsed notes is "A".repeat(1023)' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-10', inputData: 'object with only notes: "A".repeat(1024) (1024 characters)',                              expected: 'success: true, parsed notes is "A".repeat(1024)' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-11', inputData: 'object with only notes: "A".repeat(1025) (1025 characters)',                              expected: 'success: false, error path contains "notes"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-12', inputData: 'object with only notes: " " + "A".repeat(1024) + " " (1024 real characters after trim)', expected: 'success: true, parsed notes is "A".repeat(1024)' },
    ],
};

const workoutSessionExerciseUpdateSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-15',
    tcCount: 28,
    statement: 'workoutSessionExerciseUpdateSchema – Validates a single workout session exercise update entry using Zod safeParse. Returns { success: true, data } when all fields are valid. Returns { success: false, error } when any field violates a constraint. id is optional (when present, must be a string). exerciseId is required (at least 1 character after trimming, not whitespace-only; surrounding whitespace trimmed). sets is required and must be coercible to a number in the range 0–6 inclusive. reps is required and must be coercible to a number in the range 0–30 inclusive. weight is required and must be coercible to a number in the range 0.0–500.0 inclusive.',
    data: 'Input: WorkoutSessionExerciseUpdateInput { id?: string, exerciseId: string, sets: number, reps: number, weight: number }',
    precondition: 'Input is passed directly to workoutSessionExerciseUpdateSchema.safeParse(). id: optional; when present, must be a string. exerciseId: required, at least 1 character after trim, not whitespace-only, surrounding whitespace trimmed. sets: required, coercible to number, 0 ≤ sets ≤ 6. reps: required, coercible to number, 0 ≤ reps ≤ 30. weight: required, coercible to number, 0.0 ≤ weight ≤ 500.0.',
    results: 'Output: { success: boolean, data?: WorkoutSessionExerciseUpdateInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains the supplied fields with exerciseId trimmed; id is present when supplied. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'id field presence',     validEc: 'Entry without id field (id omitted) → success: true, parsed data matches the input', invalidEc: '' },
        { number: 2, condition: 'id field presence',     validEc: 'Entry with id: "uuid-123" (id present, string) → success: true, parsed id is "uuid-123"', invalidEc: '' },
        { number: 3, condition: 'id field type',         validEc: '', invalidEc: 'Entry with id: 123 (number, not a string) → success: false, error path contains "id"' },
        { number: 4, condition: 'exerciseId presence',   validEc: '', invalidEc: 'Entry with exerciseId field absent → success: false, error path contains "exerciseId"' },
        { number: 5, condition: 'exerciseId value',      validEc: '', invalidEc: 'Entry with exerciseId: "   " (whitespace-only) → success: false, error path contains "exerciseId"' },
        { number: 6, condition: 'exerciseId whitespace', validEc: 'Entry with exerciseId: "  exercise-123  " (surrounding whitespace) → success: true, parsed exerciseId is "exercise-123"', invalidEc: '' },
        { number: 7, condition: 'sets type',             validEc: '', invalidEc: 'Entry with sets: "invalid" (string not coercible to number) → success: false, error path contains "sets"' },
        { number: 8, condition: 'reps type',             validEc: '', invalidEc: 'Entry with reps: "invalid" (string not coercible to number) → success: false, error path contains "reps"' },
        { number: 9, condition: 'weight type',           validEc: '', invalidEc: 'Entry with weight: "invalid" (string not coercible to number) → success: false, error path contains "weight"' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'entry with all fields valid and no id: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2, ec: 'EC-2', inputData: 'entry with id: "uuid-123", exerciseId "exercise-123", sets 3, reps 10, weight 80.5',             expected: 'success: true, parsed id is "uuid-123"' },
        { noTc: 3, ec: 'EC-3', inputData: 'entry with id: 123 (number, not a string)',                                                       expected: 'success: false, error path contains "id"' },
        { noTc: 4, ec: 'EC-4', inputData: 'entry with exerciseId field absent: { sets: 3, reps: 10, weight: 80.5 }',                         expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 5, ec: 'EC-5', inputData: 'entry with exerciseId: "   " (whitespace-only)',                                                  expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 6, ec: 'EC-6', inputData: 'entry with exerciseId: "  exercise-123  " (surrounding whitespace)',                              expected: 'success: true, parsed exerciseId is "exercise-123"' },
        { noTc: 7, ec: 'EC-7', inputData: 'entry with sets: "invalid" (string not coercible)',                                               expected: 'success: false, error path contains "sets"' },
        { noTc: 8, ec: 'EC-8', inputData: 'entry with reps: "invalid" (string not coercible)',                                               expected: 'success: false, error path contains "reps"' },
        { noTc: 9, ec: 'EC-9', inputData: 'entry with weight: "invalid" (string not coercible)',                                             expected: 'success: false, error path contains "weight"' },
    ],
    bvaRows: [
        // ── sets range ────────────────────────────────────────────────────────
        { number: 1,  condition: 'sets range', testCase: 'sets: -1 (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'sets range', testCase: 'sets: 0 (min): at minimum → success: true, parsed sets is 0' },
        { number: 3,  condition: 'sets range', testCase: 'sets: 1 (min + 1): above minimum → success: true, parsed sets is 1' },
        { number: 4,  condition: 'sets range', testCase: 'sets: 5 (max - 1): below maximum → success: true, parsed sets is 5' },
        { number: 5,  condition: 'sets range', testCase: 'sets: 6 (max): at maximum → success: true, parsed sets is 6' },
        { number: 6,  condition: 'sets range', testCase: 'sets: 7 (max + 1): above maximum → success: false' },
        // ── reps range ────────────────────────────────────────────────────────
        { number: 7,  condition: 'reps range', testCase: 'reps: -1 (min - 1): below minimum → success: false' },
        { number: 8,  condition: 'reps range', testCase: 'reps: 0 (min): at minimum → success: true, parsed reps is 0' },
        { number: 9,  condition: 'reps range', testCase: 'reps: 1 (min + 1): above minimum → success: true, parsed reps is 1' },
        { number: 10, condition: 'reps range', testCase: 'reps: 29 (max - 1): below maximum → success: true, parsed reps is 29' },
        { number: 11, condition: 'reps range', testCase: 'reps: 30 (max): at maximum → success: true, parsed reps is 30' },
        { number: 12, condition: 'reps range', testCase: 'reps: 31 (max + 1): above maximum → success: false' },
        // ── weight range ──────────────────────────────────────────────────────
        { number: 13, condition: 'weight range', testCase: 'weight: -0.1 (min - 0.1): below minimum → success: false' },
        { number: 14, condition: 'weight range', testCase: 'weight: 0.0 (min): at minimum → success: true, parsed weight is 0' },
        { number: 15, condition: 'weight range', testCase: 'weight: 0.1 (min + 0.1): above minimum → success: true, parsed weight is 0.1' },
        { number: 16, condition: 'weight range', testCase: 'weight: 499.9 (max - 0.1): below maximum → success: true, parsed weight is 499.9' },
        { number: 17, condition: 'weight range', testCase: 'weight: 500.0 (max): at maximum → success: true, parsed weight is 500' },
        { number: 18, condition: 'weight range', testCase: 'weight: 500.1 (max + 0.1): above maximum → success: false' },
        // ── exerciseId whitespace + trim ──────────────────────────────────────
        { number: 19, condition: 'exerciseId whitespace + trim', testCase: 'exerciseId: " E " (1 real character after trim, at minimum) → success: true, parsed exerciseId is "E"' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (sets=-1)',   inputData: 'entry with sets: -1',                                                    expected: 'success: false, error path contains "sets"' },
        { noTc: 2,  bva: 'BVA-2  (sets=0)',    inputData: 'entry with sets: 0',                                                     expected: 'success: true, parsed sets is 0' },
        { noTc: 3,  bva: 'BVA-3  (sets=1)',    inputData: 'entry with sets: 1',                                                     expected: 'success: true, parsed sets is 1' },
        { noTc: 4,  bva: 'BVA-4  (sets=5)',    inputData: 'entry with sets: 5',                                                     expected: 'success: true, parsed sets is 5' },
        { noTc: 5,  bva: 'BVA-5  (sets=6)',    inputData: 'entry with sets: 6',                                                     expected: 'success: true, parsed sets is 6' },
        { noTc: 6,  bva: 'BVA-6  (sets=7)',    inputData: 'entry with sets: 7',                                                     expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  bva: 'BVA-7  (reps=-1)',   inputData: 'entry with reps: -1',                                                    expected: 'success: false, error path contains "reps"' },
        { noTc: 8,  bva: 'BVA-8  (reps=0)',    inputData: 'entry with reps: 0',                                                     expected: 'success: true, parsed reps is 0' },
        { noTc: 9,  bva: 'BVA-9  (reps=1)',    inputData: 'entry with reps: 1',                                                     expected: 'success: true, parsed reps is 1' },
        { noTc: 10, bva: 'BVA-10 (reps=29)',   inputData: 'entry with reps: 29',                                                    expected: 'success: true, parsed reps is 29' },
        { noTc: 11, bva: 'BVA-11 (reps=30)',   inputData: 'entry with reps: 30',                                                    expected: 'success: true, parsed reps is 30' },
        { noTc: 12, bva: 'BVA-12 (reps=31)',   inputData: 'entry with reps: 31',                                                    expected: 'success: false, error path contains "reps"' },
        { noTc: 13, bva: 'BVA-13 (wt=-0.1)',   inputData: 'entry with weight: -0.1',                                                expected: 'success: false, error path contains "weight"' },
        { noTc: 14, bva: 'BVA-14 (wt=0)',      inputData: 'entry with weight: 0',                                                   expected: 'success: true, parsed weight is 0' },
        { noTc: 15, bva: 'BVA-15 (wt=0.1)',    inputData: 'entry with weight: 0.1',                                                 expected: 'success: true, parsed weight is 0.1' },
        { noTc: 16, bva: 'BVA-16 (wt=499.9)',  inputData: 'entry with weight: 499.9',                                               expected: 'success: true, parsed weight is 499.9' },
        { noTc: 17, bva: 'BVA-17 (wt=500)',    inputData: 'entry with weight: 500',                                                 expected: 'success: true, parsed weight is 500' },
        { noTc: 18, bva: 'BVA-18 (wt=500.1)',  inputData: 'entry with weight: 500.1',                                               expected: 'success: false, error path contains "weight"' },
        { noTc: 19, bva: 'BVA-19 (pad→1)',     inputData: 'entry with exerciseId: " E " (1 real character after trim)',              expected: 'success: true, parsed exerciseId is "E"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'entry with all fields valid and no id: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'entry with id: "uuid-123", exerciseId "exercise-123", sets 3, reps 10, weight 80.5',             expected: 'success: true, parsed id is "uuid-123"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'entry with id: 123 (number, not a string)',                                                       expected: 'success: false, error path contains "id"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'entry with exerciseId field absent: { sets: 3, reps: 10, weight: 80.5 }',                         expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'entry with exerciseId: "   " (whitespace-only)',                                                  expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'entry with exerciseId: "  exercise-123  " (surrounding whitespace)',                              expected: 'success: true, parsed exerciseId is "exercise-123"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'entry with sets: "invalid" (string not coercible)',                                               expected: 'success: false, error path contains "sets"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: 'entry with reps: "invalid" (string not coercible)',                                               expected: 'success: false, error path contains "reps"' },
        { noTc: 9,  fromEc: 'EC-9', fromBva: '', inputData: 'entry with weight: "invalid" (string not coercible)',                                             expected: 'success: false, error path contains "weight"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 10, fromEc: '', fromBva: 'BVA-1',  inputData: 'entry with sets: -1',    expected: 'success: false, error path contains "sets"' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2',  inputData: 'entry with sets: 0',     expected: 'success: true, parsed sets is 0' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3',  inputData: 'entry with sets: 1',     expected: 'success: true, parsed sets is 1' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-4',  inputData: 'entry with sets: 5',     expected: 'success: true, parsed sets is 5' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-5',  inputData: 'entry with sets: 6',     expected: 'success: true, parsed sets is 6' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-6',  inputData: 'entry with sets: 7',     expected: 'success: false, error path contains "sets"' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-7',  inputData: 'entry with reps: -1',    expected: 'success: false, error path contains "reps"' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-8',  inputData: 'entry with reps: 0',     expected: 'success: true, parsed reps is 0' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-9',  inputData: 'entry with reps: 1',     expected: 'success: true, parsed reps is 1' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-10', inputData: 'entry with reps: 29',    expected: 'success: true, parsed reps is 29' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-11', inputData: 'entry with reps: 30',    expected: 'success: true, parsed reps is 30' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-12', inputData: 'entry with reps: 31',    expected: 'success: false, error path contains "reps"' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-13', inputData: 'entry with weight: -0.1',   expected: 'success: false, error path contains "weight"' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-14', inputData: 'entry with weight: 0',      expected: 'success: true, parsed weight is 0' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-15', inputData: 'entry with weight: 0.1',    expected: 'success: true, parsed weight is 0.1' },
        { noTc: 25, fromEc: '', fromBva: 'BVA-16', inputData: 'entry with weight: 499.9',  expected: 'success: true, parsed weight is 499.9' },
        { noTc: 26, fromEc: '', fromBva: 'BVA-17', inputData: 'entry with weight: 500',    expected: 'success: true, parsed weight is 500' },
        { noTc: 27, fromEc: '', fromBva: 'BVA-18', inputData: 'entry with weight: 500.1',  expected: 'success: false, error path contains "weight"' },
        { noTc: 28, fromEc: '', fromBva: 'BVA-19', inputData: 'entry with exerciseId: " E " (1 real character after trim)', expected: 'success: true, parsed exerciseId is "E"' },
    ],
};

const workoutSessionExercisesUpdateSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-16',
    tcCount: 24,
    statement: 'workoutSessionExercisesUpdateSchema – Validates an array of workout session exercise entries for an update operation using Zod safeParse. Identical to workoutSessionExercisesSchema except each entry may optionally include an id field. Returns { success: true, data } when the array contains at least one entry and every entry satisfies its field constraints. Returns { success: false, error } when the array is empty or any entry violates a constraint. Array constraints: minimum length 1. Per-entry constraints: id is optional (when present, any non-empty string is accepted). exerciseId is required (at least 1 character after trimming, not whitespace-only; surrounding whitespace trimmed). sets is required and must be an integer in the range 0–6 inclusive. reps is required and must be an integer in the range 0–30 inclusive. weight is required and must be a number in the range 0.0–500.0 inclusive.',
    data: 'Input: Array<WorkoutSessionExerciseUpdateInput { id?: string, exerciseId: string, sets: number, reps: number, weight: number }>',
    precondition: 'Input is passed directly to workoutSessionExercisesUpdateSchema.safeParse(). Array must contain at least 1 entry. Per entry: id is optional. exerciseId is required, at least 1 character after trim, not whitespace-only, surrounding whitespace trimmed. sets: required, integer, 0 ≤ sets ≤ 6. reps: required, integer, 0 ≤ reps ≤ 30. weight: required, number, 0.0 ≤ weight ≤ 500.0.',
    results: 'Output: { success: boolean, data?: WorkoutSessionExerciseUpdateInput[], error?: ZodError }',
    postcondition: 'On success: parsed data is an array of entries with exerciseId trimmed; id is present when supplied. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'id field presence',      validEc: 'Entry without id field (id omitted) → success: true, parsed data matches the input', invalidEc: '' },
        { number: 2, condition: 'id field presence',      validEc: 'Entry with id: "uuid-123" (id present) → success: true, parsed entry id is "uuid-123"', invalidEc: '' },
        { number: 3, condition: 'Array length',           validEc: '', invalidEc: 'Empty array [] → success: false' },
        { number: 4, condition: 'exerciseId presence',    validEc: '', invalidEc: 'Entry with exerciseId field absent → success: false, error path contains "exerciseId"' },
        { number: 5, condition: 'exerciseId whitespace',  validEc: 'Entry with exerciseId: "  exercise-123  " (surrounding whitespace) → success: true, parsed exerciseId is "exercise-123"', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'array containing one entry with all fields valid and no id field: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2, ec: 'EC-2', inputData: 'array containing one entry with all fields valid and id: "uuid-123": exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed entry id is "uuid-123"' },
        { noTc: 3, ec: 'EC-3', inputData: 'empty array []',                                                                                                              expected: 'success: false' },
        { noTc: 4, ec: 'EC-4', inputData: 'array with one entry where exerciseId field is absent: { sets: 3, reps: 10, weight: 80.5 }',                                  expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 5, ec: 'EC-5', inputData: 'array with one entry where exerciseId: "  exercise-123  " (surrounding whitespace)',                                          expected: 'success: true, parsed exerciseId is "exercise-123"' },
    ],
    bvaRows: [
        // ── sets range ────────────────────────────────────────────────────────
        { number: 1,  condition: 'sets range', testCase: 'sets: -1 (min - 1): below minimum → success: false' },
        { number: 2,  condition: 'sets range', testCase: 'sets: 0 (min): at minimum → success: true, parsed sets is 0' },
        { number: 3,  condition: 'sets range', testCase: 'sets: 1 (min + 1): above minimum → success: true, parsed sets is 1' },
        { number: 4,  condition: 'sets range', testCase: 'sets: 5 (max - 1): below maximum → success: true, parsed sets is 5' },
        { number: 5,  condition: 'sets range', testCase: 'sets: 6 (max): at maximum → success: true, parsed sets is 6' },
        { number: 6,  condition: 'sets range', testCase: 'sets: 7 (max + 1): above maximum → success: false' },
        // ── reps range ────────────────────────────────────────────────────────
        { number: 7,  condition: 'reps range', testCase: 'reps: -1 (min - 1): below minimum → success: false' },
        { number: 8,  condition: 'reps range', testCase: 'reps: 0 (min): at minimum → success: true, parsed reps is 0' },
        { number: 9,  condition: 'reps range', testCase: 'reps: 1 (min + 1): above minimum → success: true, parsed reps is 1' },
        { number: 10, condition: 'reps range', testCase: 'reps: 29 (max - 1): below maximum → success: true, parsed reps is 29' },
        { number: 11, condition: 'reps range', testCase: 'reps: 30 (max): at maximum → success: true, parsed reps is 30' },
        { number: 12, condition: 'reps range', testCase: 'reps: 31 (max + 1): above maximum → success: false' },
        // ── weight range ──────────────────────────────────────────────────────
        { number: 13, condition: 'weight range', testCase: 'weight: -0.1 (min - 0.1): below minimum → success: false' },
        { number: 14, condition: 'weight range', testCase: 'weight: 0.0 (min): at minimum → success: true, parsed weight is 0' },
        { number: 15, condition: 'weight range', testCase: 'weight: 0.1 (min + 0.1): above minimum → success: true, parsed weight is 0.1' },
        { number: 16, condition: 'weight range', testCase: 'weight: 499.9 (max - 0.1): below maximum → success: true, parsed weight is 499.9' },
        { number: 17, condition: 'weight range', testCase: 'weight: 500.0 (max): at maximum → success: true, parsed weight is 500' },
        { number: 18, condition: 'weight range', testCase: 'weight: 500.1 (max + 0.1): above maximum → success: false' },
        // ── exerciseId whitespace + trim ──────────────────────────────────────
        { number: 19, condition: 'exerciseId whitespace + trim', testCase: 'exerciseId: " E " (1 real character after trim, at minimum) → success: true, parsed exerciseId is "E"' },
    ],
    bvaTcRows: [
        { noTc: 1,  bva: 'BVA-1  (sets=-1)',   inputData: 'array with one entry where sets: -1',                                                             expected: 'success: false, error path contains "sets"' },
        { noTc: 2,  bva: 'BVA-2  (sets=0)',    inputData: 'array with one entry where sets: 0',                                                              expected: 'success: true, parsed sets is 0' },
        { noTc: 3,  bva: 'BVA-3  (sets=1)',    inputData: 'array with one entry where sets: 1',                                                              expected: 'success: true, parsed sets is 1' },
        { noTc: 4,  bva: 'BVA-4  (sets=5)',    inputData: 'array with one entry where sets: 5',                                                              expected: 'success: true, parsed sets is 5' },
        { noTc: 5,  bva: 'BVA-5  (sets=6)',    inputData: 'array with one entry where sets: 6',                                                              expected: 'success: true, parsed sets is 6' },
        { noTc: 6,  bva: 'BVA-6  (sets=7)',    inputData: 'array with one entry where sets: 7',                                                              expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  bva: 'BVA-7  (reps=-1)',   inputData: 'array with one entry where reps: -1',                                                             expected: 'success: false, error path contains "reps"' },
        { noTc: 8,  bva: 'BVA-8  (reps=0)',    inputData: 'array with one entry where reps: 0',                                                              expected: 'success: true, parsed reps is 0' },
        { noTc: 9,  bva: 'BVA-9  (reps=1)',    inputData: 'array with one entry where reps: 1',                                                              expected: 'success: true, parsed reps is 1' },
        { noTc: 10, bva: 'BVA-10 (reps=29)',   inputData: 'array with one entry where reps: 29',                                                             expected: 'success: true, parsed reps is 29' },
        { noTc: 11, bva: 'BVA-11 (reps=30)',   inputData: 'array with one entry where reps: 30',                                                             expected: 'success: true, parsed reps is 30' },
        { noTc: 12, bva: 'BVA-12 (reps=31)',   inputData: 'array with one entry where reps: 31',                                                             expected: 'success: false, error path contains "reps"' },
        { noTc: 13, bva: 'BVA-13 (wt=-0.1)',   inputData: 'array with one entry where weight: -0.1',                                                         expected: 'success: false, error path contains "weight"' },
        { noTc: 14, bva: 'BVA-14 (wt=0)',      inputData: 'array with one entry where weight: 0',                                                            expected: 'success: true, parsed weight is 0' },
        { noTc: 15, bva: 'BVA-15 (wt=0.1)',    inputData: 'array with one entry where weight: 0.1',                                                          expected: 'success: true, parsed weight is 0.1' },
        { noTc: 16, bva: 'BVA-16 (wt=499.9)',  inputData: 'array with one entry where weight: 499.9',                                                        expected: 'success: true, parsed weight is 499.9' },
        { noTc: 17, bva: 'BVA-17 (wt=500)',    inputData: 'array with one entry where weight: 500',                                                          expected: 'success: true, parsed weight is 500' },
        { noTc: 18, bva: 'BVA-18 (wt=500.1)',  inputData: 'array with one entry where weight: 500.1',                                                        expected: 'success: false, error path contains "weight"' },
        { noTc: 19, bva: 'BVA-19 (pad→1)',     inputData: 'array with one entry where exerciseId: " E " (1 real character after trim)',                      expected: 'success: true, parsed exerciseId is "E"' },
    ],
    finalTcRows: [
        // ── From EC ──────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'array containing one entry with all fields valid and no id field: exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed data matches the input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'array containing one entry with all fields valid and id: "uuid-123": exerciseId "exercise-123", sets 3, reps 10, weight 80.5', expected: 'success: true, parsed entry id is "uuid-123"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'empty array []',                                                                                                              expected: 'success: false' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'array with one entry where exerciseId field is absent: { sets: 3, reps: 10, weight: 80.5 }',                                  expected: 'success: false, error path contains "exerciseId"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'array with one entry where exerciseId: "  exercise-123  " (surrounding whitespace)',                                          expected: 'success: true, parsed exerciseId is "exercise-123"' },
        // ── From BVA ─────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 6,  fromEc: '', fromBva: 'BVA-1',  inputData: 'array with one entry where sets: -1',                                                                                      expected: 'success: false, error path contains "sets"' },
        { noTc: 7,  fromEc: '', fromBva: 'BVA-2',  inputData: 'array with one entry where sets: 0',                                                                                       expected: 'success: true, parsed sets is 0' },
        { noTc: 8,  fromEc: '', fromBva: 'BVA-3',  inputData: 'array with one entry where sets: 1',                                                                                       expected: 'success: true, parsed sets is 1' },
        { noTc: 9,  fromEc: '', fromBva: 'BVA-4',  inputData: 'array with one entry where sets: 5',                                                                                       expected: 'success: true, parsed sets is 5' },
        { noTc: 10, fromEc: '', fromBva: 'BVA-5',  inputData: 'array with one entry where sets: 6',                                                                                       expected: 'success: true, parsed sets is 6' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-6',  inputData: 'array with one entry where sets: 7',                                                                                       expected: 'success: false, error path contains "sets"' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-7',  inputData: 'array with one entry where reps: -1',                                                                                      expected: 'success: false, error path contains "reps"' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-8',  inputData: 'array with one entry where reps: 0',                                                                                       expected: 'success: true, parsed reps is 0' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-9',  inputData: 'array with one entry where reps: 1',                                                                                       expected: 'success: true, parsed reps is 1' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-10', inputData: 'array with one entry where reps: 29',                                                                                      expected: 'success: true, parsed reps is 29' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-11', inputData: 'array with one entry where reps: 30',                                                                                      expected: 'success: true, parsed reps is 30' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-12', inputData: 'array with one entry where reps: 31',                                                                                      expected: 'success: false, error path contains "reps"' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-13', inputData: 'array with one entry where weight: -0.1',                                                                                  expected: 'success: false, error path contains "weight"' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-14', inputData: 'array with one entry where weight: 0',                                                                                     expected: 'success: true, parsed weight is 0' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-15', inputData: 'array with one entry where weight: 0.1',                                                                                   expected: 'success: true, parsed weight is 0.1' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-16', inputData: 'array with one entry where weight: 499.9',                                                                                 expected: 'success: true, parsed weight is 499.9' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-17', inputData: 'array with one entry where weight: 500',                                                                                   expected: 'success: true, parsed weight is 500' },
        { noTc: 23, fromEc: '', fromBva: 'BVA-18', inputData: 'array with one entry where weight: 500.1',                                                                                 expected: 'success: false, error path contains "weight"' },
        { noTc: 24, fromEc: '', fromBva: 'BVA-19', inputData: 'array with one entry where exerciseId: " E " (1 real character after trim)',                                               expected: 'success: true, parsed exerciseId is "E"' },
    ],
};

const memberProgressReportSchemaBbt: BbtDescriptor = {
    reqId: 'SCHEMA-17',
    tcCount: 12,
    statement: 'memberProgressReportSchema – Validates query parameters for a member progress report using Zod safeParse. Returns { success: true, data } when all required fields are present and satisfy their constraints. Returns { success: false, error } with a path pointing to the offending field when any constraint is violated. memberId is required (at least 1 character, not whitespace-only). startDate is required and must be in YYYY-MM-DD format. endDate is required and must be in YYYY-MM-DD format. The schema does not enforce date ordering; startDate equal to or after endDate is accepted.',
    data: 'Input: MemberProgressReportInput { memberId: string, startDate: string, endDate: string }',
    precondition: 'Input is passed directly to memberProgressReportSchema.safeParse(). memberId: required, at least 1 character, not whitespace-only. startDate: required, YYYY-MM-DD format. endDate: required, YYYY-MM-DD format. Date ordering is not enforced; startDate may equal or exceed endDate.',
    results: 'Output: { success: boolean, data?: MemberProgressReportInput, error?: ZodError }',
    postcondition: 'On success: parsed data contains the supplied fields matching the input. On failure: error.issues[0].path contains the name of the offending field.',
    ecRows: [
        { number: 1, condition: 'All fields valid',    validEc: 'All required fields present with valid values → success: true, parsed data matches the input', invalidEc: '' },
        { number: 2, condition: 'memberId presence',   validEc: '', invalidEc: 'memberId field absent → success: false, error path contains "memberId"' },
        { number: 3, condition: 'startDate presence',  validEc: '', invalidEc: 'startDate field absent → success: false, error path contains "startDate"' },
        { number: 4, condition: 'endDate presence',    validEc: '', invalidEc: 'endDate field absent → success: false, error path contains "endDate"' },
        { number: 5, condition: 'memberId value',      validEc: '', invalidEc: 'memberId: "   " (whitespace-only) → success: false, error path contains "memberId"' },
        { number: 6, condition: 'startDate format',    validEc: 'startDate: "2024-01-01" (valid YYYY-MM-DD) → success: true', invalidEc: 'startDate: "01/01/2024" (MM/DD/YYYY, wrong format) → success: false, error path contains "startDate"' },
        { number: 7, condition: 'endDate format',      validEc: 'endDate: "2024-01-31" (valid YYYY-MM-DD) → success: true', invalidEc: 'endDate: "2024.12.31" (dot-separated, wrong format) → success: false, error path contains "endDate"' },
        { number: 8, condition: 'date range ordering', validEc: 'startDate equals endDate ("2024-01-01" == "2024-01-01") → success: true; startDate after endDate ("2024-06-01" > "2024-01-01") → success: true (ordering not enforced)', invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1, ec: 'EC-1', inputData: 'all required fields provided with valid values: memberId "member-123", startDate "2024-01-01", endDate "2024-01-31"', expected: 'success: true, parsed data matches the input' },
        { noTc: 2, ec: 'EC-2', inputData: 'query with memberId field absent',                                                                                   expected: 'success: false, error path contains "memberId"' },
        { noTc: 3, ec: 'EC-3', inputData: 'query with startDate field absent',                                                                                  expected: 'success: false, error path contains "startDate"' },
        { noTc: 4, ec: 'EC-4', inputData: 'query with endDate field absent',                                                                                    expected: 'success: false, error path contains "endDate"' },
        { noTc: 5, ec: 'EC-5', inputData: 'valid query with memberId: "   " (whitespace-only)',                                                                 expected: 'success: false, error path contains "memberId"' },
        { noTc: 6, ec: 'EC-6', inputData: 'valid query with startDate: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                expected: 'success: false, error path contains "startDate"' },
        { noTc: 7, ec: 'EC-7', inputData: 'valid query with endDate: "2024.12.31" (dot-separated, wrong format)',                                               expected: 'success: false, error path contains "endDate"' },
        { noTc: 8, ec: 'EC-8', inputData: 'valid query with startDate: "2024-01-01" and endDate: "2024-01-01" (same day)',                                      expected: 'success: true, parsed startDate is "2024-01-01" and endDate is "2024-01-01"' },
        { noTc: 9, ec: 'EC-8', inputData: 'valid query with startDate: "2024-06-01" and endDate: "2024-01-01" (startDate after endDate)',                       expected: 'success: true, parsed startDate is "2024-06-01" and endDate is "2024-01-01"' },
    ],
    bvaRows: [
        { number: 1, condition: 'memberId length', testCase: 'memberId: "" (length 0, min - 1): below minimum → success: false' },
        { number: 2, condition: 'memberId length', testCase: 'memberId: "A" (length 1, min): at minimum → success: true, parsed memberId is "A"' },
        { number: 3, condition: 'memberId length', testCase: 'memberId: "AB" (length 2, min + 1): above minimum → success: true, parsed memberId is "AB"' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (memberId=0)', inputData: 'valid query with memberId: "" (0 characters)',  expected: 'success: false, error path contains "memberId"' },
        { noTc: 2, bva: 'BVA-2 (memberId=1)', inputData: 'valid query with memberId: "A" (1 character)',  expected: 'success: true, parsed memberId is "A"' },
        { noTc: 3, bva: 'BVA-3 (memberId=2)', inputData: 'valid query with memberId: "AB" (2 characters)', expected: 'success: true, parsed memberId is "AB"' },
    ],
    finalTcRows: [
        // ── From EC ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 1,  fromEc: 'EC-1', fromBva: '', inputData: 'all required fields provided with valid values: memberId "member-123", startDate "2024-01-01", endDate "2024-01-31"', expected: 'success: true, parsed data matches the input' },
        { noTc: 2,  fromEc: 'EC-2', fromBva: '', inputData: 'query with memberId field absent',                                                                                   expected: 'success: false, error path contains "memberId"' },
        { noTc: 3,  fromEc: 'EC-3', fromBva: '', inputData: 'query with startDate field absent',                                                                                  expected: 'success: false, error path contains "startDate"' },
        { noTc: 4,  fromEc: 'EC-4', fromBva: '', inputData: 'query with endDate field absent',                                                                                    expected: 'success: false, error path contains "endDate"' },
        { noTc: 5,  fromEc: 'EC-5', fromBva: '', inputData: 'valid query with memberId: "   " (whitespace-only)',                                                                 expected: 'success: false, error path contains "memberId"' },
        { noTc: 6,  fromEc: 'EC-6', fromBva: '', inputData: 'valid query with startDate: "01/01/2024" (MM/DD/YYYY, wrong format)',                                                expected: 'success: false, error path contains "startDate"' },
        { noTc: 7,  fromEc: 'EC-7', fromBva: '', inputData: 'valid query with endDate: "2024.12.31" (dot-separated, wrong format)',                                               expected: 'success: false, error path contains "endDate"' },
        { noTc: 8,  fromEc: 'EC-8', fromBva: '', inputData: 'valid query with startDate: "2024-01-01" and endDate: "2024-01-01" (same day)',                                      expected: 'success: true, parsed startDate is "2024-01-01" and endDate is "2024-01-01"' },
        { noTc: 9,  fromEc: 'EC-8', fromBva: '', inputData: 'valid query with startDate: "2024-06-01" and endDate: "2024-01-01" (startDate after endDate)',                       expected: 'success: true, parsed startDate is "2024-06-01" and endDate is "2024-01-01"' },
        // ── From BVA ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
        { noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'valid query with memberId: "" (0 characters)',   expected: 'success: false, error path contains "memberId"' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-2', inputData: 'valid query with memberId: "A" (1 character)',   expected: 'success: true, parsed memberId is "A"' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-3', inputData: 'valid query with memberId: "AB" (2 characters)', expected: 'success: true, parsed memberId is "AB"' },
    ],
};

const isoDateRegexBbt: BbtDescriptor = {
    reqId: 'SCHEMA-18',
    tcCount: 22,
    statement: 'isoDateRegex – Tests whether a string matches the pattern /^\\d{4}-\\d{2}-\\d{2}$/. Returns true when the input is exactly four digits, a hyphen, two digits, a hyphen, and two digits with no additional characters. Returns false for any other format. The regex validates structure only; it does not validate calendar correctness (e.g. month 99 or day 00 pass the format check).',
    data: 'Input: string s passed to isoDateRegex.test(s)',
    precondition: 'No preconditions. The regex is applied directly to the input string.',
    results: 'Output: boolean — true if the string matches the YYYY-MM-DD pattern, false otherwise.',
    postcondition: 'Result reflects only structural conformance to /^\\d{4}-\\d{2}-\\d{2}$/. Calendar validity is not checked.',
    ecRows: [
        { number: 1,  condition: 'Valid YYYY-MM-DD input',   validEc: '"2024-01-01" → true',                                           invalidEc: '' },
        { number: 2,  condition: 'Valid YYYY-MM-DD input',   validEc: '"1990-12-31" → true',                                           invalidEc: '' },
        { number: 3,  condition: 'Separator character',      validEc: '',                                                              invalidEc: '"2024/01/01" (slash separator) → false' },
        { number: 4,  condition: 'Separator character',      validEc: '',                                                              invalidEc: '"2024.01.01" (dot separator) → false' },
        { number: 5,  condition: 'Extra content',            validEc: '',                                                              invalidEc: '"2024-01-01T00:00:00" (datetime with time component) → false' },
        { number: 6,  condition: 'No separators',            validEc: '',                                                              invalidEc: '"20240101" (compact form, no separators) → false' },
        { number: 7,  condition: 'Reversed format',          validEc: '',                                                              invalidEc: '"01-01-2024" (DD-MM-YYYY) → false' },
        { number: 8,  condition: 'Empty string',             validEc: '',                                                              invalidEc: '"" (empty string) → false' },
        { number: 9,  condition: 'Out-of-range month value', validEc: '"2024-00-15" (month 00 passes format check) → true',            invalidEc: '' },
        { number: 10, condition: 'Out-of-range day value',   validEc: '"2024-01-00" (day 00 passes format check) → true',              invalidEc: '' },
        { number: 11, condition: 'Out-of-range month value', validEc: '"2024-99-01" (month 99 passes format check) → true',            invalidEc: '' },
        { number: 12, condition: 'Out-of-range day value',   validEc: '"2024-01-99" (day 99 passes format check) → true',              invalidEc: '' },
        { number: 13, condition: 'All-zero digits',          validEc: '"0000-00-00" (all zeroes pass format check) → true',            invalidEc: '' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: '"2024-01-01"',          expected: 'true' },
        { noTc: 2,  ec: 'EC-2',  inputData: '"1990-12-31"',          expected: 'true' },
        { noTc: 3,  ec: 'EC-3',  inputData: '"2024/01/01"',          expected: 'false' },
        { noTc: 4,  ec: 'EC-4',  inputData: '"2024.01.01"',          expected: 'false' },
        { noTc: 5,  ec: 'EC-5',  inputData: '"2024-01-01T00:00:00"', expected: 'false' },
        { noTc: 6,  ec: 'EC-6',  inputData: '"20240101"',            expected: 'false' },
        { noTc: 7,  ec: 'EC-7',  inputData: '"01-01-2024"',          expected: 'false' },
        { noTc: 8,  ec: 'EC-8',  inputData: '"" (empty string)',     expected: 'false' },
        { noTc: 9,  ec: 'EC-9',  inputData: '"2024-00-15"',          expected: 'true' },
        { noTc: 10, ec: 'EC-10', inputData: '"2024-01-00"',          expected: 'true' },
        { noTc: 11, ec: 'EC-11', inputData: '"2024-99-01"',          expected: 'true' },
        { noTc: 12, ec: 'EC-12', inputData: '"2024-01-99"',          expected: 'true' },
        { noTc: 13, ec: 'EC-13', inputData: '"0000-00-00"',          expected: 'true' },
    ],
    bvaRows: [
        { number: 1, condition: 'Year digit count',  testCase: 'year of 3 digits ("202-01-01", min − 1): below required length → false; year of 4 digits ("2024-01-01", min): exactly the required length → true; year of 5 digits ("20240-01-01", min + 1): exceeds required length → false' },
        { number: 2, condition: 'Month digit count', testCase: 'month of 1 digit ("2024-1-01", min − 1): below required length → false; month of 2 digits ("2024-01-01", min): exactly the required length → true; month of 3 digits ("2024-011-01", min + 1): exceeds required length → false' },
        { number: 3, condition: 'Day digit count',   testCase: 'day of 1 digit ("2024-01-1", min − 1): below required length → false; day of 2 digits ("2024-01-01", min): exactly the required length → true; day of 3 digits ("2024-01-011", min + 1): exceeds required length → false' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (year=3)', inputData: '"202-01-01" (3-digit year)',  expected: 'false' },
        { noTc: 2, bva: 'BVA-1 (year=4)', inputData: '"2024-01-01" (4-digit year)', expected: 'true' },
        { noTc: 3, bva: 'BVA-1 (year=5)', inputData: '"20240-01-01" (5-digit year)', expected: 'false' },
        { noTc: 4, bva: 'BVA-2 (month=1)', inputData: '"2024-1-01" (1-digit month)',   expected: 'false' },
        { noTc: 5, bva: 'BVA-2 (month=2)', inputData: '"2024-01-01" (2-digit month)',  expected: 'true' },
        { noTc: 6, bva: 'BVA-2 (month=3)', inputData: '"2024-011-01" (3-digit month)', expected: 'false' },
        { noTc: 7, bva: 'BVA-3 (day=1)', inputData: '"2024-01-1" (1-digit day)',   expected: 'false' },
        { noTc: 8, bva: 'BVA-3 (day=2)', inputData: '"2024-01-01" (2-digit day)',  expected: 'true' },
        { noTc: 9, bva: 'BVA-3 (day=3)', inputData: '"2024-01-011" (3-digit day)', expected: 'false' },
    ],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: '"2024-01-01" (valid YYYY-MM-DD)',              expected: 'true' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: '"1990-12-31" (valid YYYY-MM-DD)',              expected: 'true' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: '"2024/01/01" (slash separator)',               expected: 'false' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: '"2024.01.01" (dot separator)',                 expected: 'false' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: '"2024-01-01T00:00:00" (datetime with time)',   expected: 'false' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: '"20240101" (no separators)',                   expected: 'false' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: '"01-01-2024" (DD-MM-YYYY, reversed)',          expected: 'false' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: '"" (empty string)',                            expected: 'false' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: '"2024-00-15" (month 00, format-only check)',   expected: 'true' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"2024-01-00" (day 00, format-only check)',     expected: 'true' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: '"2024-99-01" (month 99, format-only check)',   expected: 'true' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: '"2024-01-99" (day 99, format-only check)',     expected: 'true' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: '"0000-00-00" (all zeroes, format-only check)', expected: 'true' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: '"202-01-01" (3-digit year)',   expected: 'false' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: '"2024-01-01" (4-digit year)',  expected: 'true' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: '"20240-01-01" (5-digit year)', expected: 'false' },
        { noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-1-01" (1-digit month)',   expected: 'false' },
        { noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-01-01" (2-digit month)',  expected: 'true' },
        { noTc: 19, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-011-01" (3-digit month)', expected: 'false' },
        { noTc: 20, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-1" (1-digit day)',   expected: 'false' },
        { noTc: 21, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-01" (2-digit day)',  expected: 'true' },
        { noTc: 22, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-011" (3-digit day)', expected: 'false' },
    ],
};

const e164PhoneRegexBbt: BbtDescriptor = {
    reqId: 'SCHEMA-19',
    tcCount: 16,
    statement: 'e164PhoneRegex – Tests whether a string matches the pattern /^\\+?[1-9]\\d{1,14}$/. Returns true for strings that optionally start with "+", begin with a non-zero digit, and contain between 2 and 15 digits in total (excluding the optional "+"). Returns false for strings that start with "0", contain spaces, dashes, parentheses, or non-digit characters, consist of "+" alone, or are empty.',
    data: 'Input: string s passed to e164PhoneRegex.test(s)',
    precondition: 'No preconditions. The regex is applied directly to the input string.',
    results: 'Output: boolean — true if the string satisfies /^\\+?[1-9]\\d{1,14}$/, false otherwise.',
    postcondition: 'Result reflects structural conformance only. Real-world carrier or country-code validity is not checked.',
    ecRows: [
        { number: 1,  condition: 'Optional "+" prefix',     validEc: '"+40712345678" (with + prefix) → true',         invalidEc: '' },
        { number: 2,  condition: 'Optional "+" prefix',     validEc: '"40712345678" (without + prefix) → true',        invalidEc: '' },
        { number: 3,  condition: 'Leading digit',           validEc: '',                                               invalidEc: '"0712345678" (starts with 0) → false' },
        { number: 4,  condition: 'Leading digit after "+"', validEc: '',                                               invalidEc: '"+0712345678" (starts with +0) → false' },
        { number: 5,  condition: 'Non-digit characters',    validEc: '',                                               invalidEc: '"+44 20 1234 5678" (contains spaces) → false' },
        { number: 6,  condition: 'Non-digit characters',    validEc: '',                                               invalidEc: '"+1-800-555-5555" (contains dashes) → false' },
        { number: 7,  condition: 'Non-digit characters',    validEc: '',                                               invalidEc: '"+1(800)5551234" (contains parentheses) → false' },
        { number: 8,  condition: 'Alphabetic input',        validEc: '',                                               invalidEc: '"ABCDEFG" (alphabetic only) → false' },
        { number: 9,  condition: 'Bare "+" sign',           validEc: '',                                               invalidEc: '"+" (plus sign only, no digits) → false' },
        { number: 10, condition: 'Empty string',            validEc: '',                                               invalidEc: '"" (empty string) → false' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: '"+40712345678"',      expected: 'true' },
        { noTc: 2,  ec: 'EC-2',  inputData: '"40712345678"',       expected: 'true' },
        { noTc: 3,  ec: 'EC-3',  inputData: '"0712345678"',        expected: 'false' },
        { noTc: 4,  ec: 'EC-4',  inputData: '"+0712345678"',       expected: 'false' },
        { noTc: 5,  ec: 'EC-5',  inputData: '"+44 20 1234 5678"',  expected: 'false' },
        { noTc: 6,  ec: 'EC-6',  inputData: '"+1-800-555-5555"',   expected: 'false' },
        { noTc: 7,  ec: 'EC-7',  inputData: '"+1(800)5551234"',    expected: 'false' },
        { noTc: 8,  ec: 'EC-8',  inputData: '"ABCDEFG"',           expected: 'false' },
        { noTc: 9,  ec: 'EC-9',  inputData: '"+" (plus only)',     expected: 'false' },
        { noTc: 10, ec: 'EC-10', inputData: '"" (empty string)',   expected: 'false' },
    ],
    bvaRows: [
        { number: 1, condition: 'Total digit count (excl. optional "+")', testCase: '1 digit ("1", min − 1): below minimum → false; 2 digits ("12", min): at minimum → true; 3 digits ("+123", min + 1): above minimum → true; 14 digits ("+12345678901234", max − 1): below maximum → true; 15 digits ("+123456789012345", max): at maximum → true; 16 digits ("+1234567890123456", max + 1): above maximum → false' },
    ],
    bvaTcRows: [
        { noTc: 1, bva: 'BVA-1 (digits=1)',  inputData: '"1" (1 digit, below minimum)',                        expected: 'false' },
        { noTc: 2, bva: 'BVA-1 (digits=2)',  inputData: '"12" (2 digits, at minimum)',                         expected: 'true' },
        { noTc: 3, bva: 'BVA-1 (digits=3)',  inputData: '"+123" (3 digits with +, above minimum)',             expected: 'true' },
        { noTc: 4, bva: 'BVA-1 (digits=14)', inputData: '"+12345678901234" (14 digits with +, below maximum)', expected: 'true' },
        { noTc: 5, bva: 'BVA-1 (digits=15)', inputData: '"+123456789012345" (15 digits with +, at maximum)',   expected: 'true' },
        { noTc: 6, bva: 'BVA-1 (digits=16)', inputData: '"+1234567890123456" (16 digits with +, above maximum)', expected: 'false' },
    ],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: '"+40712345678" (with + prefix)',               expected: 'true' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: '"40712345678" (without + prefix)',              expected: 'true' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: '"0712345678" (starts with 0)',                  expected: 'false' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: '"+0712345678" (starts with +0)',                expected: 'false' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: '"+44 20 1234 5678" (contains spaces)',          expected: 'false' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: '"+1-800-555-5555" (contains dashes)',           expected: 'false' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: '"+1(800)5551234" (contains parentheses)',       expected: 'false' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: '"ABCDEFG" (alphabetic only)',                   expected: 'false' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: '"+" (plus sign only, no digits)',               expected: 'false' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"" (empty string)',                             expected: 'false' },
        { noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: '"1" (1 digit, below minimum)',                  expected: 'false' },
        { noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: '"12" (2 digits, at minimum)',                   expected: 'true' },
        { noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: '"+123" (3 digits with +, above minimum)',       expected: 'true' },
        { noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: '"+12345678901234" (14 digits with +, below maximum)', expected: 'true' },
        { noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: '"+123456789012345" (15 digits with +, at maximum)',   expected: 'true' },
        { noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: '"+1234567890123456" (16 digits with +, above maximum)', expected: 'false' },
    ],
};

const emailRegexBbt: BbtDescriptor = {
    reqId: 'SCHEMA-20',
    tcCount: 17,
    statement: 'emailRegex – Tests whether a string matches the pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/. Returns true when the string contains exactly one "@" separating a non-empty local part from a domain that itself contains at least one "." with non-empty segments on both sides, and no whitespace anywhere. Returns false for any deviation: missing "@", empty local part, missing or empty domain, no "." in domain, trailing dot, spaces, multiple "@" symbols, or empty input.',
    data: 'Input: string s passed to emailRegex.test(s)',
    precondition: 'No preconditions. The regex is applied directly to the input string.',
    results: 'Output: boolean — true if the string matches /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, false otherwise.',
    postcondition: 'Result reflects structural conformance only. DNS existence or full RFC 5321 compliance is not checked.',
    ecRows: [
        { number: 1,  condition: 'Standard valid email',          validEc: '"user@example.com" → true',                        invalidEc: '' },
        { number: 2,  condition: 'Subdomain in domain part',      validEc: '"user@mail.example.com" → true',                   invalidEc: '' },
        { number: 3,  condition: 'Plus tag in local part',        validEc: '"user+tag@domain.com" → true',                     invalidEc: '' },
        { number: 4,  condition: 'Dot in local part',             validEc: '"first.last@domain.com" → true',                   invalidEc: '' },
        { number: 5,  condition: 'Numeric local part',            validEc: '"12345@domain.com" → true',                        invalidEc: '' },
        { number: 6,  condition: 'Special chars in local part',   validEc: '"user.name+tag@example.org" → true',               invalidEc: '' },
        { number: 7,  condition: '"@" symbol presence',           validEc: '',                                                 invalidEc: '"invalidemail.com" (no "@" symbol) → false' },
        { number: 8,  condition: 'Non-empty local part',          validEc: '',                                                 invalidEc: '"@domain.com" (empty local part) → false' },
        { number: 9,  condition: 'Non-empty domain part',         validEc: '',                                                 invalidEc: '"user@" (no domain after "@") → false' },
        { number: 10, condition: '"." in domain part',            validEc: '',                                                 invalidEc: '"user@domain" (no dot in domain) → false' },
        { number: 11, condition: 'No whitespace in local part',   validEc: '',                                                 invalidEc: '"user name@domain.com" (space in local part) → false' },
        { number: 12, condition: 'No whitespace after "@"',       validEc: '',                                                 invalidEc: '"user@ domain.com" (space after "@") → false' },
        { number: 13, condition: 'Exactly one "@" symbol',        validEc: '',                                                 invalidEc: '"a@b@example.com" (multiple "@" symbols) → false' },
        { number: 14, condition: 'Non-empty segment before "."',  validEc: '',                                                 invalidEc: '"user@.com" (empty domain segment before dot) → false' },
        { number: 15, condition: 'Non-empty segment after "."',   validEc: '',                                                 invalidEc: '"user@domain." (trailing dot, empty TLD) → false' },
        { number: 16, condition: 'Empty string',                  validEc: '',                                                 invalidEc: '"" (empty string) → false' },
        { number: 17, condition: '"@" symbol alone',              validEc: '',                                                 invalidEc: '"@" (at symbol only) → false' },
    ],
    epTcRows: [
        { noTc: 1,  ec: 'EC-1',  inputData: '"user@example.com"',          expected: 'true' },
        { noTc: 2,  ec: 'EC-2',  inputData: '"user@mail.example.com"',     expected: 'true' },
        { noTc: 3,  ec: 'EC-3',  inputData: '"user+tag@domain.com"',       expected: 'true' },
        { noTc: 4,  ec: 'EC-4',  inputData: '"first.last@domain.com"',     expected: 'true' },
        { noTc: 5,  ec: 'EC-5',  inputData: '"12345@domain.com"',          expected: 'true' },
        { noTc: 6,  ec: 'EC-6',  inputData: '"user.name+tag@example.org"', expected: 'true' },
        { noTc: 7,  ec: 'EC-7',  inputData: '"invalidemail.com"',          expected: 'false' },
        { noTc: 8,  ec: 'EC-8',  inputData: '"@domain.com"',               expected: 'false' },
        { noTc: 9,  ec: 'EC-9',  inputData: '"user@"',                     expected: 'false' },
        { noTc: 10, ec: 'EC-10', inputData: '"user@domain"',               expected: 'false' },
        { noTc: 11, ec: 'EC-11', inputData: '"user name@domain.com"',      expected: 'false' },
        { noTc: 12, ec: 'EC-12', inputData: '"user@ domain.com"',          expected: 'false' },
        { noTc: 13, ec: 'EC-13', inputData: '"a@b@example.com"',           expected: 'false' },
        { noTc: 14, ec: 'EC-14', inputData: '"user@.com"',                 expected: 'false' },
        { noTc: 15, ec: 'EC-15', inputData: '"user@domain."',              expected: 'false' },
        { noTc: 16, ec: 'EC-16', inputData: '"" (empty string)',           expected: 'false' },
        { noTc: 17, ec: 'EC-17', inputData: '"@" (at symbol only)',        expected: 'false' },
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        { noTc: 1,  fromEc: 'EC-1',  fromBva: '', inputData: '"user@example.com" (standard valid email)',              expected: 'true' },
        { noTc: 2,  fromEc: 'EC-2',  fromBva: '', inputData: '"user@mail.example.com" (subdomain in domain part)',     expected: 'true' },
        { noTc: 3,  fromEc: 'EC-3',  fromBva: '', inputData: '"user+tag@domain.com" (plus tag in local part)',         expected: 'true' },
        { noTc: 4,  fromEc: 'EC-4',  fromBva: '', inputData: '"first.last@domain.com" (dot in local part)',            expected: 'true' },
        { noTc: 5,  fromEc: 'EC-5',  fromBva: '', inputData: '"12345@domain.com" (numeric local part)',                expected: 'true' },
        { noTc: 6,  fromEc: 'EC-6',  fromBva: '', inputData: '"user.name+tag@example.org" (special chars in local)',  expected: 'true' },
        { noTc: 7,  fromEc: 'EC-7',  fromBva: '', inputData: '"invalidemail.com" (no "@" symbol)',                     expected: 'false' },
        { noTc: 8,  fromEc: 'EC-8',  fromBva: '', inputData: '"@domain.com" (empty local part)',                       expected: 'false' },
        { noTc: 9,  fromEc: 'EC-9',  fromBva: '', inputData: '"user@" (no domain after "@")',                          expected: 'false' },
        { noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"user@domain" (no dot in domain)',                       expected: 'false' },
        { noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: '"user name@domain.com" (space in local part)',           expected: 'false' },
        { noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: '"user@ domain.com" (space after "@")',                   expected: 'false' },
        { noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: '"a@b@example.com" (multiple "@" symbols)',               expected: 'false' },
        { noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: '"user@.com" (empty domain segment before dot)',          expected: 'false' },
        { noTc: 15, fromEc: 'EC-15', fromBva: '', inputData: '"user@domain." (trailing dot, empty TLD)',               expected: 'false' },
        { noTc: 16, fromEc: 'EC-16', fromBva: '', inputData: '"" (empty string)',                                      expected: 'false' },
        { noTc: 17, fromEc: 'EC-17', fromBva: '', inputData: '"@" (at symbol only)',                                   expected: 'false' },
    ],
};

(async () => {
    console.log('Generating BBT form Excel files…\n');

    await writeBbt(createUserSchemaBbt, path.join(BASE, 'user-schema', 'createUserSchema-bbt-form.xlsx'));
    await writeBbt(createMemberSchemaBbt, path.join(BASE, 'user-schema', 'createMemberSchema-bbt-form.xlsx'));
    await writeBbt(createMemberWithTempPasswordSchemaBbt, path.join(BASE, 'user-schema', 'createMemberWithTempPasswordSchema-bbt-form.xlsx'));
    await writeBbt(loginUserSchemaBbt, path.join(BASE, 'user-schema', 'loginUserSchema-bbt-form.xlsx'));
    await writeBbt(createAdminSchemaBbt, path.join(BASE, 'user-schema', 'createAdminSchema-bbt-form.xlsx'));
    await writeBbt(updateUserSchemaBbt, path.join(BASE, 'user-schema', 'updateUserSchema-bbt-form.xlsx'));
    await writeBbt(updateMemberSchemaBbt, path.join(BASE, 'user-schema', 'updateMemberSchema-bbt-form.xlsx'));
    await writeBbt(updateAdminSchemaBbt, path.join(BASE, 'user-schema', 'updateAdminSchema-bbt-form.xlsx'));
    await writeBbt(createExerciseSchemaBbt, path.join(BASE, 'exercise-schema', 'createExerciseSchema-bbt-form.xlsx'));
    await writeBbt(updateExerciseSchemaBbt, path.join(BASE, 'exercise-schema', 'updateExerciseSchema-bbt-form.xlsx'));
    await writeBbt(createWorkoutSessionSchemaBbt, path.join(BASE, 'workout-session-schema', 'createWorkoutSessionSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExerciseSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExerciseSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExercisesSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesSchema-bbt-form.xlsx'));
    await writeBbt(updateWorkoutSessionSchemaBbt, path.join(BASE, 'workout-session-schema', 'updateWorkoutSessionSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExerciseUpdateSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExerciseUpdateSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExercisesUpdateSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesUpdateSchema-bbt-form.xlsx'));
    await writeBbt(memberProgressReportSchemaBbt, path.join(BASE, 'report-schema', 'memberProgressReportSchema-bbt-form.xlsx'));
    await writeBbt(isoDateRegexBbt, path.join(BASE, 'utils', 'isoDateRegex-bbt-form.xlsx'));
    await writeBbt(e164PhoneRegexBbt, path.join(BASE, 'utils', 'e164PhoneRegex-bbt-form.xlsx'));
    await writeBbt(emailRegexBbt, path.join(BASE, 'utils', 'emailRegex-bbt-form.xlsx'));

    console.log('\nDone.');
})();
