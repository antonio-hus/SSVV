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

const createMemberSchemaBbt: BbtDescriptor = {
    reqId: 'MEM-01',
    tcCount: 39,
    statement: 'createMemberSchema – validate input for creating a gym member. Fields: fullName (8-64 chars), email (simplified RFC 5321), dateOfBirth (YYYY-MM-DD, must be strictly past), phone (E.164: +?[1-9]\\d{1,14}), password (8-64 chars, uppercase+digit+special), membershipStart (YYYY-MM-DD).',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
    precondition: 'Input values passed to Zod.safeParse()',
    results: 'Output: { success: boolean, data?, error? }',
    postcondition: 'Validation results match schema constraints',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All fields correct', invalidEc: ''},
        {number: 2, condition: 'Email presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 3, condition: 'FullName presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 4, condition: 'Phone presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'DateOfBirth presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 6, condition: 'Password presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 7, condition: 'MembershipStart presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 8, condition: 'Email format', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 9, condition: 'Password uppercase', validEc: 'Has uppercase', invalidEc: 'Missing uppercase'},
        {number: 10, condition: 'Password number', validEc: 'Has number', invalidEc: 'Missing number'},
        {
            number: 11,
            condition: 'Password special char',
            validEc: 'Has special char',
            invalidEc: 'Missing special char'
        },
        {number: 12, condition: 'Phone format', validEc: 'Valid E.164', invalidEc: 'Invalid format'},
        {number: 13, condition: 'DateOfBirth format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 14, condition: 'DateOfBirth value', validEc: 'Past date', invalidEc: 'Future date'},
        {number: 15, condition: 'MembershipStart format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 16, condition: 'MembershipStart value', validEc: 'Any valid date (inc future)', invalidEc: ''},
        {
            number: 17,
            condition: 'FullName whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {number: 18, condition: 'Email whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
        {number: 19, condition: 'Phone whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid member data', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Missing email', expected: 'success: false'},
        {noTc: 3, ec: 'EC-3', inputData: 'Missing fullName', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing phone', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'Missing dateOfBirth', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'Missing password', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'Missing membershipStart', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'Email="invalidemail.com"', expected: 'success: false'},
        {noTc: 9, ec: 'EC-9', inputData: 'Password="secure1@pass"', expected: 'success: false'},
        {noTc: 10, ec: 'EC-10', inputData: 'Password="SecureP@ss"', expected: 'success: false'},
        {noTc: 11, ec: 'EC-11', inputData: 'Password="SecurePass1"', expected: 'success: false'},
        {noTc: 12, ec: 'EC-12', inputData: 'Phone="0712345678"', expected: 'success: false'},
        {noTc: 13, ec: 'EC-13', inputData: 'DateOfBirth="15-01-1990"', expected: 'success: false'},
        {noTc: 14, ec: 'EC-14', inputData: 'DateOfBirth="2099-01-01"', expected: 'success: false'},
        {noTc: 15, ec: 'EC-15', inputData: 'MembershipStart="01/01/2024"', expected: 'success: false'},
        {noTc: 16, ec: 'EC-16', inputData: 'MembershipStart="2099-01-01"', expected: 'success: true'},
        {noTc: 17, ec: 'EC-17', inputData: 'fullName="         " (whitespace only)', expected: 'success: false'},
        {
            noTc: 18,
            ec: 'EC-17',
            inputData: 'fullName="  John Doe Test  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 19,
            ec: 'EC-18',
            inputData: 'email="  john.doe@example.com  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 20,
            ec: 'EC-19',
            inputData: 'phone="  +40712345678  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'FullName length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 2, condition: 'Password length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 3, condition: 'DateOfBirth boundary', testCase: 'Yesterday (Valid)'},
        {number: '', condition: '', testCase: 'Today (Invalid)'},
        {number: '', condition: '', testCase: 'Tomorrow (Invalid)'},
        {number: 4, condition: 'FullName whitespace', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 FullName 7ch', inputData: 'fullName len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 FullName 8ch', inputData: 'fullName len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 FullName 9ch', inputData: 'fullName len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 FullName 63ch', inputData: 'fullName len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 FullName 64ch', inputData: 'fullName len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 FullName 65ch', inputData: 'fullName len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Password 7ch', inputData: 'password len 7', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Password 8ch', inputData: 'password len 8', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Password 9ch', inputData: 'password len 9', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Password 63ch', inputData: 'password len 63', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Password 64ch', inputData: 'password len 64', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Password 65ch', inputData: 'password len 65', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 DOB Yesterday', inputData: 'dob Yesterday', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-3 DOB Today', inputData: 'dob Today', expected: 'success: false'},
        {noTc: 15, bva: 'BVA-3 DOB Tomorrow', inputData: 'dob Tomorrow', expected: 'success: false'},
        {noTc: 16, bva: 'BVA-4 FullName whitespace 8ch', inputData: 'fullName=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 17,
            bva: 'BVA-4 FullName padded 8ch after trim',
            inputData: 'fullName=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 18,
            bva: 'BVA-4 FullName padded 64ch after trim',
            inputData: 'fullName=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 19,
            bva: 'BVA-4 FullName padded 65ch after trim',
            inputData: 'fullName=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid member data (All fields)', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Missing email field', expected: 'success: false'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Missing fullName field', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Missing phone field', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Missing dateOfBirth field', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Missing password field', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'Missing membershipStart field', expected: 'success: false'},
        {
            noTc: 8,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'Email="invalidemail.com" (Wrong format)',
            expected: 'success: false'
        },
        {
            noTc: 9,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'Password="secure1@pass" (No uppercase)',
            expected: 'success: false'
        },
        {
            noTc: 10,
            fromEc: 'EC-10',
            fromBva: '',
            inputData: 'Password="SecureP@ss" (No number)',
            expected: 'success: false'
        },
        {
            noTc: 11,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'Password="SecurePass1" (No special)',
            expected: 'success: false'
        },
        {
            noTc: 12,
            fromEc: 'EC-12',
            fromBva: '',
            inputData: 'Phone="0712345678" (No + prefix)',
            expected: 'success: false'
        },
        {
            noTc: 13,
            fromEc: 'EC-13',
            fromBva: '',
            inputData: 'DateOfBirth="15-01-1990" (Wrong separator)',
            expected: 'success: false'
        },
        {
            noTc: 14,
            fromEc: 'EC-14',
            fromBva: '',
            inputData: 'DateOfBirth="2099-01-01" (Future date)',
            expected: 'success: false'
        },
        {
            noTc: 15,
            fromEc: 'EC-15',
            fromBva: '',
            inputData: 'MembershipStart="01/01/2024" (Wrong separator)',
            expected: 'success: false'
        },
        {
            noTc: 16,
            fromEc: 'EC-16',
            fromBva: '',
            inputData: 'MembershipStart="2099-01-01" (Future membership)',
            expected: 'success: true'
        },
        {
            noTc: 17,
            fromEc: 'EC-17',
            fromBva: '',
            inputData: 'FullName whitespace-only',
            expected: 'success: false'
        },
        {
            noTc: 18,
            fromEc: 'EC-17',
            fromBva: '',
            inputData: 'FullName with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 19,
            fromEc: 'EC-18',
            fromBva: '',
            inputData: 'Email with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 20,
            fromEc: 'EC-19',
            fromBva: '',
            inputData: 'Phone with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 21, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 7 (Below Min)', expected: 'success: false'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 8 (At Min)', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 9 (Above Min)', expected: 'success: true'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 63 (Below Max)', expected: 'success: true'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 64 (At Max)', expected: 'success: true'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 65 (Above Max)', expected: 'success: false'},
        {noTc: 27, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 7 (Below Min)', expected: 'success: false'},
        {noTc: 28, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 8 (At Min)', expected: 'success: true'},
        {noTc: 29, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 9 (Above Min)', expected: 'success: true'},
        {noTc: 30, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 63 (Below Max)', expected: 'success: true'},
        {noTc: 31, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 64 (At Max)', expected: 'success: true'},
        {noTc: 32, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 65 (Above Max)', expected: 'success: false'},
        {
            noTc: 33,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Yesterday (Boundary valid)',
            expected: 'success: true'
        },
        {noTc: 34, fromEc: '', fromBva: 'BVA-3', inputData: 'dob Today (Boundary invalid)', expected: 'success: false'},
        {
            noTc: 35,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Tomorrow (Boundary invalid)',
            expected: 'success: false'
        },
        {
            noTc: 36,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 37,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 38,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 39,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const createMemberWithTempPasswordSchemaBbt: BbtDescriptor = {
    reqId: 'MEM-01/MEM-02',
    tcCount: 27,
    statement: 'createMemberWithTempPasswordSchema – validate input for creating a member whose password is auto-generated.',
    data: 'Input: { email: string, fullName: string, phone: string, dateOfBirth: string, membershipStart: string }',
    precondition: '8 ≤ len(fullName) ≤ 64 | email valid RFC | dateOfBirth past | phone E.164 | membershipStart YYYY-MM-DD',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'password field is stripped if supplied.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All fields correct', invalidEc: ''},
        {number: 2, condition: 'Email presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 3, condition: 'FullName presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 4, condition: 'Phone presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'DateOfBirth presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 6, condition: 'MembershipStart presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 7, condition: 'Email format', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 8, condition: 'Phone format', validEc: 'Valid E.164', invalidEc: 'Invalid format'},
        {number: 9, condition: 'MembershipStart format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 10, condition: 'Password field', validEc: 'Ignored and stripped', invalidEc: ''},
        {
            number: 11,
            condition: 'FullName whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {number: 12, condition: 'Email whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
        {number: 13, condition: 'Phone whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid member data', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Missing email', expected: 'success: false'},
        {noTc: 3, ec: 'EC-3', inputData: 'Missing fullName', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing phone', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'Missing dateOfBirth', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'Missing membershipStart', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'Email="no" (Invalid)', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'Phone="0712345678" (Invalid)', expected: 'success: false'},
        {noTc: 9, ec: 'EC-9', inputData: 'MembershipStart="01/01/2024" (Invalid format)', expected: 'success: false'},
        {noTc: 10, ec: 'EC-10', inputData: 'Including password field', expected: 'success: true, password stripped'},
        {
            noTc: 11,
            ec: 'EC-11',
            inputData: 'fullName="         " (whitespace only)',
            expected: 'success: false'
        },
        {
            noTc: 12,
            ec: 'EC-11',
            inputData: 'fullName="  Jane Doe Test  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 13,
            ec: 'EC-12',
            inputData: 'email="  jane.doe@example.com  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 14,
            ec: 'EC-13',
            inputData: 'phone="  +40712345678  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'FullName length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 2, condition: 'DateOfBirth boundary', testCase: 'Yesterday (Valid)'},
        {number: '', condition: '', testCase: 'Today (Invalid)'},
        {number: '', condition: '', testCase: 'Tomorrow (Invalid)'},
        {number: 3, condition: 'FullName whitespace', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 FullName 7ch', inputData: 'fullName len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 FullName 8ch', inputData: 'fullName len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 FullName 9ch', inputData: 'fullName len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 FullName 63ch', inputData: 'fullName len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 FullName 64ch', inputData: 'fullName len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 FullName 65ch', inputData: 'fullName len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 DOB Yesterday', inputData: 'dob Yesterday', expected: 'success: true'},
        {noTc: 8, bva: 'BVA-2 DOB Today', inputData: 'dob Today', expected: 'success: false'},
        {noTc: 9, bva: 'BVA-2 DOB Tomorrow', inputData: 'dob Tomorrow', expected: 'success: false'},
        {noTc: 10, bva: 'BVA-3 FullName whitespace 8ch', inputData: 'fullName=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 11,
            bva: 'BVA-3 FullName padded 8ch after trim',
            inputData: 'fullName=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 12,
            bva: 'BVA-3 FullName padded 64ch after trim',
            inputData: 'fullName=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 13,
            bva: 'BVA-3 FullName padded 65ch after trim',
            inputData: 'fullName=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {
            noTc: 1,
            fromEc: 'EC-1',
            fromBva: '',
            inputData: 'Valid member data (No password needed)',
            expected: 'success: true'
        },
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Missing email field', expected: 'success: false'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Missing fullName field', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Missing phone field', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Missing dateOfBirth field', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Missing membershipStart field', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'Email="no" (Invalid format)', expected: 'success: false'},
        {
            noTc: 8,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'Phone="0712345678" (Wrong format)',
            expected: 'success: false'
        },
        {
            noTc: 9,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'MembershipStart="01/01/2024" (Wrong separators)',
            expected: 'success: false'
        },
        {
            noTc: 10,
            fromEc: 'EC-10',
            fromBva: '',
            inputData: 'Input contains extra password field',
            expected: 'success: true (Stripped)'
        },
        {
            noTc: 11,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'FullName whitespace-only',
            expected: 'success: false'
        },
        {
            noTc: 12,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'FullName with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 13,
            fromEc: 'EC-12',
            fromBva: '',
            inputData: 'Email with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 14,
            fromEc: 'EC-13',
            fromBva: '',
            inputData: 'Phone with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 7 (Below Min)', expected: 'success: false'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 8 (At Min)', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 9 (Above Min)', expected: 'success: true'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 63 (Below Max)', expected: 'success: true'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 64 (At Max)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 65 (Above Max)', expected: 'success: false'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-2', inputData: 'dob Yesterday (Valid)', expected: 'success: true'},
        {
            noTc: 22,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'dob Today (At boundary - invalid)',
            expected: 'success: false'
        },
        {
            noTc: 23,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'dob Tomorrow (Future - invalid)',
            expected: 'success: false'
        },
        {
            noTc: 24,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 25,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 26,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 27,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'fullName padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const loginUserSchemaBbt: BbtDescriptor = {
    reqId: 'AUTH-01',
    tcCount: 9,
    statement: 'loginUserSchema – validate login credentials. Fields: email, password.',
    data: 'Input: { email: string, password: string }',
    precondition: 'email format | len(password) ≥ 1',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match schema.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'Email + Password correct', invalidEc: ''},
        {number: 2, condition: 'Email presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 3, condition: 'Password presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 4, condition: 'Password value', validEc: 'Non-empty', invalidEc: 'Empty string'},
        {number: 5, condition: 'Email format', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 6, condition: 'Email whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid credentials', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Missing email', expected: 'success: false'},
        {noTc: 3, ec: 'EC-3', inputData: 'Missing password', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Empty password', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'Email="invalidemail.com"', expected: 'success: false'},
        {
            noTc: 6,
            ec: 'EC-6',
            inputData: 'email="  admin@gymtrackerpro.com  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Password length', testCase: '0 chars (Below Min)'},
        {number: '', condition: '', testCase: '1 char (At Min)'},
        {number: '', condition: '', testCase: '2 chars (Above Min)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Pass len 0', inputData: 'password len 0', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Pass len 1', inputData: 'password len 1', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Pass len 2', inputData: 'password len 2', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid credentials (All fields)', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Missing email field', expected: 'success: false'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Missing password field', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Empty password string', expected: 'success: false'},
        {
            noTc: 5,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: 'Email="invalidemail.com" (Format error)',
            expected: 'success: false'
        },
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: 'Email with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 7, fromEc: '', fromBva: 'BVA-1', inputData: 'password len 0 (Below Min)', expected: 'success: false'},
        {noTc: 8, fromEc: '', fromBva: 'BVA-1', inputData: 'password len 1 (At Min)', expected: 'success: true'},
        {noTc: 9, fromEc: '', fromBva: 'BVA-1', inputData: 'password len 2 (Above Min)', expected: 'success: true'},
    ],
};

const createAdminSchemaBbt: BbtDescriptor = {
    reqId: 'AUTH-06',
    tcCount: 36,
    statement: 'createAdminSchema – validate input for creating a gym administrator account.',
    data: 'Input: { email, fullName, phone, dateOfBirth, password }',
    precondition: 'fullName 8-64 | email RFC | dateOfBirth past | phone E.164 | password complexity',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All fields correct', invalidEc: ''},
        {number: 2, condition: 'Email presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 3, condition: 'FullName presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 4, condition: 'Phone presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'DateOfBirth presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 6, condition: 'Password presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 7, condition: 'Email format', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 8, condition: 'Phone format', validEc: 'Valid E.164', invalidEc: 'Invalid format'},
        {number: 9, condition: 'Password uppercase', validEc: 'Has uppercase', invalidEc: 'Missing uppercase'},
        {number: 10, condition: 'Password number', validEc: 'Has number', invalidEc: 'Missing number'},
        {
            number: 11,
            condition: 'Password special char',
            validEc: 'Has special char',
            invalidEc: 'Missing special char'
        },
        {number: 12, condition: 'DateOfBirth format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 13, condition: 'DateOfBirth value', validEc: 'Past date', invalidEc: 'Future date'},
        {
            number: 14,
            condition: 'FullName whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {number: 15, condition: 'Email whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
        {number: 16, condition: 'Phone whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid admin data', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Missing email', expected: 'success: false'},
        {noTc: 3, ec: 'EC-3', inputData: 'Missing fullName', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing phone', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'Missing dateOfBirth', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'Missing password', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'Email="invalidemail.com"', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'Phone="0712345678"', expected: 'success: false'},
        {noTc: 9, ec: 'EC-9', inputData: 'Password="secure1@pass"', expected: 'success: false'},
        {noTc: 10, ec: 'EC-10', inputData: 'Password="SecureP@ss"', expected: 'success: false'},
        {noTc: 11, ec: 'EC-11', inputData: 'Password="SecurePass1"', expected: 'success: false'},
        {noTc: 12, ec: 'EC-12', inputData: 'DateOfBirth="15.01.1990"', expected: 'success: false'},
        {noTc: 13, ec: 'EC-13', inputData: 'DateOfBirth="2099-01-01"', expected: 'success: false'},
        {noTc: 14, ec: 'EC-14', inputData: 'fullName="         " (whitespace only)', expected: 'success: false'},
        {
            noTc: 15,
            ec: 'EC-14',
            inputData: 'fullName="  Admin User Test  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 16,
            ec: 'EC-15',
            inputData: 'email="  admin@example.com  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 17,
            ec: 'EC-16',
            inputData: 'phone="  +40712345678  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'FullName length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 2, condition: 'Password length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 3, condition: 'DateOfBirth boundary', testCase: 'Yesterday (Valid)'},
        {number: '', condition: '', testCase: 'Today (Invalid)'},
        {number: '', condition: '', testCase: 'Tomorrow (Invalid)'},
        {number: 4, condition: 'FullName whitespace', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 FullName 7ch', inputData: 'fullName len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 FullName 8ch', inputData: 'fullName len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 FullName 9ch', inputData: 'fullName len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 FullName 63ch', inputData: 'fullName len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 FullName 64ch', inputData: 'fullName len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 FullName 65ch', inputData: 'fullName len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Password 7ch', inputData: 'password len 7', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Password 8ch', inputData: 'password len 8', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Password 9ch', inputData: 'password len 9', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Password 63ch', inputData: 'password len 63', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Password 64ch', inputData: 'password len 64', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Password 65ch', inputData: 'password len 65', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 DOB Yesterday', inputData: 'dob Yesterday', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-3 DOB Today', inputData: 'dob Today', expected: 'success: false'},
        {noTc: 15, bva: 'BVA-3 DOB Tomorrow', inputData: 'dob Tomorrow', expected: 'success: false'},
        {noTc: 16, bva: 'BVA-4 FullName whitespace 8ch', inputData: 'fullName=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 17,
            bva: 'BVA-4 FullName padded 8ch after trim',
            inputData: 'fullName=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 18,
            bva: 'BVA-4 FullName padded 64ch after trim',
            inputData: 'fullName=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 19,
            bva: 'BVA-4 FullName padded 65ch after trim',
            inputData: 'fullName=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid admin data (All fields)', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Missing email field', expected: 'success: false'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Missing fullName field', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Missing phone field', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Missing dateOfBirth field', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Missing password field', expected: 'success: false'},
        {
            noTc: 7,
            fromEc: 'EC-7',
            fromBva: '',
            inputData: 'Email="invalidemail.com" (Format error)',
            expected: 'success: false'
        },
        {
            noTc: 8,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'Phone="0712345678" (No + prefix)',
            expected: 'success: false'
        },
        {
            noTc: 9,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'Password="secure1@pass" (No uppercase)',
            expected: 'success: false'
        },
        {
            noTc: 10,
            fromEc: 'EC-10',
            fromBva: '',
            inputData: 'Password="SecureP@ss" (No number)',
            expected: 'success: false'
        },
        {
            noTc: 11,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'Password="SecurePass1" (No special)',
            expected: 'success: false'
        },
        {
            noTc: 12,
            fromEc: 'EC-12',
            fromBva: '',
            inputData: 'DateOfBirth="15.01.1990" (Wrong separators)',
            expected: 'success: false'
        },
        {
            noTc: 13,
            fromEc: 'EC-13',
            fromBva: '',
            inputData: 'DateOfBirth="2099-01-01" (Future date)',
            expected: 'success: false'
        },
        {
            noTc: 14,
            fromEc: 'EC-14',
            fromBva: '',
            inputData: 'FullName whitespace-only',
            expected: 'success: false'
        },
        {
            noTc: 15,
            fromEc: 'EC-14',
            fromBva: '',
            inputData: 'FullName with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 16,
            fromEc: 'EC-15',
            fromBva: '',
            inputData: 'Email with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 17,
            fromEc: 'EC-16',
            fromBva: '',
            inputData: 'Phone with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 18, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 7 (Below Min)', expected: 'success: false'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 8 (At Min)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 9 (Above Min)', expected: 'success: true'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 63 (Below Max)', expected: 'success: true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 64 (At Max)', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 65 (Above Max)', expected: 'success: false'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 7 (Below Min)', expected: 'success: false'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 8 (At Min)', expected: 'success: true'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 9 (Above Min)', expected: 'success: true'},
        {noTc: 27, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 63 (Below Max)', expected: 'success: true'},
        {noTc: 28, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 64 (At Max)', expected: 'success: true'},
        {noTc: 29, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 65 (Above Max)', expected: 'success: false'},
        {noTc: 30, fromEc: '', fromBva: 'BVA-3', inputData: 'dob Yesterday (Valid)', expected: 'success: true'},
        {
            noTc: 31,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Today (At boundary - invalid)',
            expected: 'success: false'
        },
        {
            noTc: 32,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Tomorrow (Future - invalid)',
            expected: 'success: false'
        },
        {
            noTc: 33,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 34,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 35,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 36,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const updateMemberSchemaBbt: BbtDescriptor = {
    reqId: 'MEM-05',
    tcCount: 36,
    statement: 'updateMemberSchema – validate partial update for a member. All fields optional.',
    data: 'Input: Partial<{ email, fullName, phone, dateOfBirth, password, membershipStart }>',
    precondition: 'Same constraints as createMemberSchema when field is present.',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Empty object', validEc: '{}', invalidEc: ''},
        {number: 2, condition: 'Email', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 3, condition: 'FullName', validEc: '8-64 chars', invalidEc: 'Invalid length'},
        {number: 4, condition: 'Phone', validEc: 'Valid E.164', invalidEc: 'Invalid format'},
        {number: 5, condition: 'Password', validEc: 'Has complexity', invalidEc: 'Missing complexity'},
        {number: 6, condition: 'DateOfBirth', validEc: 'Past date', invalidEc: 'Future date'},
        {number: 7, condition: 'MembershipStart', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {
            number: 8,
            condition: 'FullName whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {number: 9, condition: 'Email whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
        {number: 10, condition: 'Phone whitespace', validEc: 'Surrounding whitespace (trimmed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '{}', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: '{email: "new@example.com"}', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '{fullName: "Updated Name Test"}', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: '{phone: "+40712345678"}', expected: 'success: true'},
        {noTc: 5, ec: 'EC-5', inputData: '{password: "NewP@ss1"}', expected: 'success: true'},
        {noTc: 6, ec: 'EC-6', inputData: '{dateOfBirth: "yesterday"}', expected: 'success: true'},
        {noTc: 7, ec: 'EC-7', inputData: '{membershipStart: "2024-06-01"}', expected: 'success: true'},
        {noTc: 8, ec: 'EC-2', inputData: '{email: "bad-email"}', expected: 'success: false'},
        {noTc: 9, ec: 'EC-4', inputData: '{phone: "0712345678"}', expected: 'success: false'},
        {noTc: 10, ec: 'EC-5', inputData: '{password: "secure1@pass"}', expected: 'success: false'},
        {noTc: 11, ec: 'EC-5', inputData: '{password: "SecureP@ss"}', expected: 'success: false'},
        {noTc: 12, ec: 'EC-5', inputData: '{password: "SecurePass1"}', expected: 'success: false'},
        {noTc: 13, ec: 'EC-7', inputData: '{membershipStart: "01/01/2024"}', expected: 'success: false'},
        {noTc: 14, ec: 'EC-8', inputData: 'fullName="         " (whitespace only)', expected: 'success: false'},
        {
            noTc: 15,
            ec: 'EC-8',
            inputData: 'fullName="  Updated Name Test  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 16,
            ec: 'EC-9',
            inputData: 'email="  new@example.com  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 17,
            ec: 'EC-10',
            inputData: 'phone="  +40712345678  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'FullName length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 2, condition: 'Password length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 3, condition: 'DateOfBirth boundary', testCase: 'Yesterday (Valid)'},
        {number: '', condition: '', testCase: 'Today (Invalid)'},
        {number: '', condition: '', testCase: 'Tomorrow (Invalid)'},
        {number: 4, condition: 'FullName whitespace', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 FullName 7ch', inputData: 'fullName len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 FullName 8ch', inputData: 'fullName len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 FullName 9ch', inputData: 'fullName len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 FullName 63ch', inputData: 'fullName len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 FullName 64ch', inputData: 'fullName len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 FullName 65ch', inputData: 'fullName len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Password 7ch', inputData: 'password len 7', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Password 8ch', inputData: 'password len 8', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Password 9ch', inputData: 'password len 9', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Password 63ch', inputData: 'password len 63', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Password 64ch', inputData: 'password len 64', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Password 65ch', inputData: 'password len 65', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 DOB Yesterday', inputData: 'dob Yesterday', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-3 DOB Today', inputData: 'dob Today', expected: 'success: false'},
        {noTc: 15, bva: 'BVA-3 DOB Tomorrow', inputData: 'dob Tomorrow', expected: 'success: false'},
        {noTc: 16, bva: 'BVA-4 FullName whitespace 8ch', inputData: 'fullName=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 17,
            bva: 'BVA-4 FullName padded 8ch after trim',
            inputData: 'fullName=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 18,
            bva: 'BVA-4 FullName padded 64ch after trim',
            inputData: 'fullName=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 19,
            bva: 'BVA-4 FullName padded 65ch after trim',
            inputData: 'fullName=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Empty object {}', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Valid email only', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Valid fullName only', expected: 'success: true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Valid phone only', expected: 'success: true'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Valid password only', expected: 'success: true'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Valid dob (Yesterday)', expected: 'success: true'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'Valid membershipStart', expected: 'success: true'},
        {noTc: 8, fromEc: 'EC-2', fromBva: '', inputData: 'Email format invalid', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Phone format invalid', expected: 'success: false'},
        {noTc: 10, fromEc: 'EC-5', fromBva: '', inputData: 'Password no uppercase', expected: 'success: false'},
        {noTc: 11, fromEc: 'EC-5', fromBva: '', inputData: 'Password no number', expected: 'success: false'},
        {noTc: 12, fromEc: 'EC-5', fromBva: '', inputData: 'Password no special', expected: 'success: false'},
        {noTc: 13, fromEc: 'EC-7', fromBva: '', inputData: 'MembershipStart format error', expected: 'success: false'},
        {
            noTc: 14,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'FullName whitespace-only',
            expected: 'success: false'
        },
        {
            noTc: 15,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'FullName with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 16,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'Email with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 17,
            fromEc: 'EC-10',
            fromBva: '',
            inputData: 'Phone with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 18, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 7 (Below Min)', expected: 'success: false'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 8 (At Min)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 9 (Above Min)', expected: 'success: true'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 63 (Below Max)', expected: 'success: true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 64 (At Max)', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 65 (Above Max)', expected: 'success: false'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 7 (Below Min)', expected: 'success: false'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 8 (At Min)', expected: 'success: true'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 9 (Above Min)', expected: 'success: true'},
        {noTc: 27, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 63 (Below Max)', expected: 'success: true'},
        {noTc: 28, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 64 (At Max)', expected: 'success: true'},
        {noTc: 29, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 65 (Above Max)', expected: 'success: false'},
        {
            noTc: 30,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Yesterday (Valid boundary)',
            expected: 'success: true'
        },
        {noTc: 31, fromEc: '', fromBva: 'BVA-3', inputData: 'dob Today (Invalid boundary)', expected: 'success: false'},
        {
            noTc: 32,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Tomorrow (Future boundary)',
            expected: 'success: false'
        },
        {
            noTc: 33,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 34,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 35,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 36,
            fromEc: '',
            fromBva: 'BVA-4',
            inputData: 'fullName padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const updateAdminSchemaBbt: BbtDescriptor = {
    reqId: 'AUTH-06',
    tcCount: 26,
    statement: 'updateAdminSchema – validate partial update for an admin. All optional.',
    data: 'Input: Partial<{ email, fullName, phone, dateOfBirth, password }>',
    precondition: 'Same constraints apply when present.',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Empty object', validEc: '{}', invalidEc: ''},
        {number: 2, condition: 'Email', validEc: 'Valid RFC', invalidEc: 'Invalid format'},
        {number: 3, condition: 'FullName', validEc: '8-64 chars', invalidEc: 'Invalid length'},
        {number: 4, condition: 'Phone', validEc: 'Valid E.164', invalidEc: 'Invalid format'},
        {number: 5, condition: 'Password', validEc: 'Has complexity', invalidEc: 'Missing complexity'},
        {number: 6, condition: 'DateOfBirth', validEc: 'Past date', invalidEc: 'Future date'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '{}', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: '{email: "admin-new@example.com"}', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '{fullName: "Updated Admin Test"}', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: '{phone: "+40712345678"}', expected: 'success: true'},
        {noTc: 5, ec: 'EC-5', inputData: '{password: "NewP@ss1"}', expected: 'success: true'},
        {noTc: 6, ec: 'EC-6', inputData: '{dateOfBirth: "yesterday"}', expected: 'success: true'},
        {noTc: 7, ec: 'EC-2', inputData: '{email: "not-valid"}', expected: 'success: false'},
        {noTc: 8, ec: 'EC-4', inputData: '{phone: "invalid-phone"}', expected: 'success: false'},
        {noTc: 9, ec: 'EC-5', inputData: '{password: "secure1@pass"}', expected: 'success: false'},
        {noTc: 10, ec: 'EC-5', inputData: '{password: "SecureP@ss"}', expected: 'success: false'},
        {noTc: 11, ec: 'EC-5', inputData: '{password: "SecurePass1"}', expected: 'success: false'},
    ],
    bvaRows: [
        {number: 1, condition: 'FullName length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 2, condition: 'Password length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: 3, condition: 'DateOfBirth boundary', testCase: 'Yesterday (Valid)'},
        {number: '', condition: '', testCase: 'Today (Invalid)'},
        {number: '', condition: '', testCase: 'Tomorrow (Invalid)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 FullName 7ch', inputData: 'fullName len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 FullName 8ch', inputData: 'fullName len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 FullName 9ch', inputData: 'fullName len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 FullName 63ch', inputData: 'fullName len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 FullName 64ch', inputData: 'fullName len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 FullName 65ch', inputData: 'fullName len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Password 7ch', inputData: 'password len 7', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Password 8ch', inputData: 'password len 8', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Password 9ch', inputData: 'password len 9', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Password 63ch', inputData: 'password len 63', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Password 64ch', inputData: 'password len 64', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Password 65ch', inputData: 'password len 65', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 DOB Yesterday', inputData: 'dob Yesterday', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-3 DOB Today', inputData: 'dob Today', expected: 'success: false'},
        {noTc: 15, bva: 'BVA-3 DOB Tomorrow', inputData: 'dob Tomorrow', expected: 'success: false'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Empty object {}', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Valid email only', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Valid fullName only', expected: 'success: true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Valid phone only', expected: 'success: true'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Valid password only', expected: 'success: true'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Valid dob (Yesterday)', expected: 'success: true'},
        {noTc: 7, fromEc: 'EC-2', fromBva: '', inputData: 'Email format invalid', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-4', fromBva: '', inputData: 'Phone format invalid', expected: 'success: false'},
        {noTc: 9, fromEc: 'EC-5', fromBva: '', inputData: 'Password no uppercase', expected: 'success: false'},
        {noTc: 10, fromEc: 'EC-5', fromBva: '', inputData: 'Password no number', expected: 'success: false'},
        {noTc: 11, fromEc: 'EC-5', fromBva: '', inputData: 'Password no special', expected: 'success: false'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 7 (Below Min)', expected: 'success: false'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 8 (At Min)', expected: 'success: true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 9 (Above Min)', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 63 (Below Max)', expected: 'success: true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 64 (At Max)', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-1', inputData: 'fullName len 65 (Above Max)', expected: 'success: false'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 7 (Below Min)', expected: 'success: false'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 8 (At Min)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 9 (Above Min)', expected: 'success: true'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 63 (Below Max)', expected: 'success: true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 64 (At Max)', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-2', inputData: 'password len 65 (Above Max)', expected: 'success: false'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-3', inputData: 'dob Yesterday (Valid)', expected: 'success: true'},
        {
            noTc: 25,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Today (At boundary - invalid)',
            expected: 'success: false'
        },
        {
            noTc: 26,
            fromEc: '',
            fromBva: 'BVA-3',
            inputData: 'dob Tomorrow (Future boundary)',
            expected: 'success: false'
        },
    ],
};

const createExerciseSchemaBbt: BbtDescriptor = {
    reqId: 'EXM-01',
    tcCount: 27,
    statement: 'createExerciseSchema – validate input for creating a new exercise.',
    data: 'Input: CreateExerciseInput { name, description, muscleGroup, equipmentNeeded }',
    precondition: 'Input values passed to Zod.safeParse()',
    results: 'Output: { success: boolean, data?, error? }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All constraints met', invalidEc: ''},
        {number: 2, condition: 'Description presence', validEc: 'Absent', invalidEc: ''},
        {number: 3, condition: 'Description value', validEc: 'Empty string ""', invalidEc: ''},
        {number: 4, condition: 'MuscleGroup', validEc: 'Valid enum', invalidEc: 'Invalid enum'},
        {number: 5, condition: 'EquipmentNeeded', validEc: 'Valid enum', invalidEc: 'Invalid enum'},
        {number: 6, condition: 'Name presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 7, condition: 'Name value', validEc: 'Non-empty', invalidEc: 'Empty string'},
        {number: 8, condition: 'MuscleGroup presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 9, condition: 'EquipmentNeeded presence', validEc: 'Present', invalidEc: 'Missing'},
        {
            number: 10,
            condition: 'Name whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {
            number: 11,
            condition: 'Description whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only → trimmed to ""'
        },
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid all fields', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Description absent', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: 'Description=""', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: 'muscleGroup="INVALID"', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'equipmentNeeded="INVALID"', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'Missing name', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'name=""', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'Missing muscleGroup', expected: 'success: false'},
        {noTc: 9, ec: 'EC-9', inputData: 'Missing equipmentNeeded', expected: 'success: false'},
        {noTc: 10, ec: 'EC-10', inputData: 'name="         " (whitespace only)', expected: 'success: false'},
        {
            noTc: 11,
            ec: 'EC-10',
            inputData: 'name="  Bench Press  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 12,
            ec: 'EC-11',
            inputData: 'description="     " (whitespace only)',
            expected: 'success: true'
        },
        {
            noTc: 13,
            ec: 'EC-11',
            inputData: 'description="  some description  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Name length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: '', condition: '', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
        {number: 2, condition: 'Description length', testCase: '0 chars (At Min)'},
        {number: '', condition: '', testCase: '1 char (Above Min)'},
        {number: '', condition: '', testCase: '1023 chars (Below Max)'},
        {number: '', condition: '', testCase: '1024 chars (At Max)'},
        {number: '', condition: '', testCase: '1025 chars (Above Max)'},
        {number: '', condition: '', testCase: '1024 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '1025 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Name 7ch', inputData: 'name len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Name 8ch', inputData: 'name len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Name 9ch', inputData: 'name len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 Name 63ch', inputData: 'name len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 Name 64ch', inputData: 'name len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 Name 65ch', inputData: 'name len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-1 Name whitespace 8ch', inputData: 'name=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 8,
            bva: 'BVA-1 Name padded 8ch after trim',
            inputData: 'name=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 9,
            bva: 'BVA-1 Name padded 64ch after trim',
            inputData: 'name=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 10,
            bva: 'BVA-1 Name padded 65ch after trim',
            inputData: 'name=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
        {noTc: 11, bva: 'BVA-2 Desc 0ch', inputData: 'description len 0', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Desc 1ch', inputData: 'description len 1', expected: 'success: true'},
        {noTc: 13, bva: 'BVA-2 Desc 1023ch', inputData: 'description len 1023', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-2 Desc 1024ch', inputData: 'description len 1024', expected: 'success: true'},
        {noTc: 15, bva: 'BVA-2 Desc 1025ch', inputData: 'description len 1025', expected: 'success: false'},
        {
            noTc: 16,
            bva: 'BVA-2 Desc padded 1024ch after trim',
            inputData: 'description=" "+"A".repeat(1024)+" "',
            expected: 'success: true'
        },
        {
            noTc: 17,
            bva: 'BVA-2 Desc padded 1025ch after trim',
            inputData: 'description=" "+"A".repeat(1025)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid exercise data', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Description field absent', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Description empty string', expected: 'success: true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'MuscleGroup invalid enum', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Equipment invalid enum', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Name field missing', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'Name empty string', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: 'MuscleGroup field missing', expected: 'success: false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: 'Equipment field missing', expected: 'success: false'},
        {noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'Name whitespace-only', expected: 'success: false'},
        {
            noTc: 11,
            fromEc: 'EC-10',
            fromBva: '',
            inputData: 'Name with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 12,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'Description whitespace-only',
            expected: 'success: true'
        },
        {
            noTc: 13,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: 'Description with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 7 (Below Min)', expected: 'success: false'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 8 (At Min)', expected: 'success: true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 9 (Above Min)', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 63 (Below Max)', expected: 'success: true'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 64 (At Max)', expected: 'success: true'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 65 (Above Max)', expected: 'success: false'},
        {
            noTc: 20,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 22,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 23,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
        {noTc: 24, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 0 (Min)', expected: 'success: true'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1 (Above Min)', expected: 'success: true'},
        {
            noTc: 26,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description len 1023 (Below Max)',
            expected: 'success: true'
        },
        {noTc: 27, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1024 (Max)', expected: 'success: true'},
        {
            noTc: 28,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description len 1025 (Above Max)',
            expected: 'success: false'
        },
        {
            noTc: 29,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description padded → 1024ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 30,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description padded → 1025ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const updateExerciseSchemaBbt: BbtDescriptor = {
    reqId: 'EXM-03',
    tcCount: 25,
    statement: 'updateExerciseSchema – validate partial update for an exercise. All fields optional.',
    data: 'Input: UpdateExerciseInput { name?, description?, muscleGroup?, equipmentNeeded? }',
    precondition: 'Input values passed to Zod.safeParse()',
    results: 'Output: { success: boolean, data?, error? }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Empty object', validEc: '{}', invalidEc: ''},
        {number: 2, condition: 'Name only', validEc: 'Valid name', invalidEc: ''},
        {number: 3, condition: 'Description only', validEc: 'Valid description', invalidEc: ''},
        {number: 4, condition: 'MuscleGroup only', validEc: 'Valid enum', invalidEc: 'Invalid enum'},
        {number: 5, condition: 'EquipmentNeeded only', validEc: 'Valid enum', invalidEc: 'Invalid enum'},
        {number: 6, condition: 'MuscleGroup value', validEc: '', invalidEc: 'Invalid enum string'},
        {number: 7, condition: 'EquipmentNeeded value', validEc: '', invalidEc: 'Invalid enum string'},
        {
            number: 8,
            condition: 'Name whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only'
        },
        {
            number: 9,
            condition: 'Description whitespace',
            validEc: 'Surrounding whitespace (trimmed)',
            invalidEc: 'Whitespace-only → trimmed to ""'
        },
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '{}', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: '{name: "New Name"}', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '{description: "Updated desc"}', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: '{muscleGroup: "CHEST"}', expected: 'success: true'},
        {noTc: 5, ec: 'EC-5', inputData: '{equipmentNeeded: "BARBELL"}', expected: 'success: true'},
        {noTc: 6, ec: 'EC-6', inputData: '{muscleGroup: "INVALID"}', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: '{equipmentNeeded: "INVALID"}', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'name="         " (whitespace only)', expected: 'success: false'},
        {
            noTc: 9,
            ec: 'EC-8',
            inputData: 'name="  New Exercise Name  " (padded)',
            expected: 'success: true'
        },
        {
            noTc: 10,
            ec: 'EC-9',
            inputData: 'description="     " (whitespace only)',
            expected: 'success: true'
        },
        {
            noTc: 11,
            ec: 'EC-9',
            inputData: 'description="  updated description  " (padded)',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Name length', testCase: '7 chars (Below Min)'},
        {number: '', condition: '', testCase: '8 chars (At Min)'},
        {number: '', condition: '', testCase: '9 chars (Above Min)'},
        {number: '', condition: '', testCase: '63 chars (Below Max)'},
        {number: '', condition: '', testCase: '64 chars (At Max)'},
        {number: '', condition: '', testCase: '65 chars (Above Max)'},
        {number: '', condition: '', testCase: '8 whitespace chars (Whitespace At Min)'},
        {number: '', condition: '', testCase: '8 chars padded with whitespace (At Min after trim)'},
        {number: '', condition: '', testCase: '64 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '65 chars padded with whitespace (Above Max after trim)'},
        {number: 2, condition: 'Description length', testCase: '0 chars (At Min)'},
        {number: '', condition: '', testCase: '1 char (Above Min)'},
        {number: '', condition: '', testCase: '1023 chars (Below Max)'},
        {number: '', condition: '', testCase: '1024 chars (At Max)'},
        {number: '', condition: '', testCase: '1025 chars (Above Max)'},
        {number: '', condition: '', testCase: '1024 chars padded with whitespace (At Max after trim)'},
        {number: '', condition: '', testCase: '1025 chars padded with whitespace (Above Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Name 7ch', inputData: 'name len 7', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Name 8ch', inputData: 'name len 8', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Name 9ch', inputData: 'name len 9', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 Name 63ch', inputData: 'name len 63', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 Name 64ch', inputData: 'name len 64', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 Name 65ch', inputData: 'name len 65', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-1 Name whitespace 8ch', inputData: 'name=" ".repeat(8)', expected: 'success: false'},
        {
            noTc: 8,
            bva: 'BVA-1 Name padded 8ch after trim',
            inputData: 'name=" "+"A".repeat(8)+" "',
            expected: 'success: true'
        },
        {
            noTc: 9,
            bva: 'BVA-1 Name padded 64ch after trim',
            inputData: 'name=" "+"A".repeat(64)+" "',
            expected: 'success: true'
        },
        {
            noTc: 10,
            bva: 'BVA-1 Name padded 65ch after trim',
            inputData: 'name=" "+"A".repeat(65)+" "',
            expected: 'success: false'
        },
        {noTc: 11, bva: 'BVA-2 Desc 0ch', inputData: 'description len 0', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Desc 1ch', inputData: 'description len 1', expected: 'success: true'},
        {noTc: 13, bva: 'BVA-2 Desc 1023ch', inputData: 'description len 1023', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-2 Desc 1024ch', inputData: 'description len 1024', expected: 'success: true'},
        {noTc: 15, bva: 'BVA-2 Desc 1025ch', inputData: 'description len 1025', expected: 'success: false'},
        {
            noTc: 16,
            bva: 'BVA-2 Desc padded 1024ch after trim',
            inputData: 'description=" "+"A".repeat(1024)+" "',
            expected: 'success: true'
        },
        {
            noTc: 17,
            bva: 'BVA-2 Desc padded 1025ch after trim',
            inputData: 'description=" "+"A".repeat(1025)+" "',
            expected: 'success: false'
        },
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Empty object {}', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Update name only', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Update description only', expected: 'success: true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Update muscleGroup only', expected: 'success: true'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Update equipment only', expected: 'success: true'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Invalid muscleGroup enum', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'Invalid equipment enum', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: 'Name whitespace-only', expected: 'success: false'},
        {
            noTc: 9,
            fromEc: 'EC-8',
            fromBva: '',
            inputData: 'Name with surrounding whitespace',
            expected: 'success: true'
        },
        {
            noTc: 10,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'Description whitespace-only',
            expected: 'success: true'
        },
        {
            noTc: 11,
            fromEc: 'EC-9',
            fromBva: '',
            inputData: 'Description with surrounding whitespace',
            expected: 'success: true'
        },
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 7 (Below Min)', expected: 'success: false'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 8 (At Min)', expected: 'success: true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 9 (Above Min)', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 63 (Below Max)', expected: 'success: true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 64 (At Max)', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-1', inputData: 'name len 65 (Above Max)', expected: 'success: false'},
        {
            noTc: 18,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name whitespace 8ch',
            expected: 'success: false'
        },
        {
            noTc: 19,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 8ch after trim (At Min)',
            expected: 'success: true'
        },
        {
            noTc: 20,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 64ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 21,
            fromEc: '',
            fromBva: 'BVA-1',
            inputData: 'name padded → 65ch after trim (Above Max)',
            expected: 'success: false'
        },
        {noTc: 22, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 0', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1', expected: 'success: true'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1023', expected: 'success: true'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1024', expected: 'success: true'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-2', inputData: 'description len 1025', expected: 'success: false'},
        {
            noTc: 27,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description padded → 1024ch after trim (At Max)',
            expected: 'success: true'
        },
        {
            noTc: 28,
            fromEc: '',
            fromBva: 'BVA-2',
            inputData: 'description padded → 1025ch after trim (Above Max)',
            expected: 'success: false'
        },
    ],
};

const createWorkoutSessionSchemaBbt: BbtDescriptor = {
    reqId: 'WSM-01',
    tcCount: 27,
    statement: 'createWorkoutSessionSchema – validate input for creating a workout session.',
    data: 'Input: { memberId: string, date: string, duration: number, notes?: string }',
    precondition: 'memberId non-empty | date YYYY-MM-DD | 0 ≤ duration ≤ 180 | notes 0-1024',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All fields correct', invalidEc: ''},
        {number: 2, condition: 'Notes presence', validEc: 'Absent', invalidEc: ''},
        {number: 3, condition: 'Notes value', validEc: 'Empty string', invalidEc: ''},
        {number: 4, condition: 'MemberId presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'Date presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 6, condition: 'Duration presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 7, condition: 'MemberId value', validEc: 'Non-whitespace', invalidEc: 'Whitespace only'},
        {number: 8, condition: 'Date format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 9, condition: 'MemberId whitespace', validEc: 'Surrounding (trimmed)', invalidEc: ''},
        {number: 10, condition: 'Notes whitespace', validEc: 'Surrounding (trimmed)', invalidEc: 'Whitespace only (trimmed to "")'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid session data', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Notes absent', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: 'Notes=""', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing memberId', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'Missing date', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'Missing duration', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'memberId="   "', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'date="01/01/2024"', expected: 'success: false'},
        {noTc: 9, ec: 'EC-9', inputData: 'memberId="  member-123  " (padded)', expected: 'success: true'},
        {noTc: 10, ec: 'EC-10', inputData: 'notes="     " (whitespace only)', expected: 'success: true'},
        {noTc: 11, ec: 'EC-10', inputData: 'notes="  some notes  " (padded)', expected: 'success: true'},
    ],
    bvaRows: [
        {number: 1, condition: 'MemberId length', testCase: '0 chars (Below Min)'},
        {number: '', condition: '', testCase: '1 char (At Min)'},
        {number: '', condition: '', testCase: '2 chars (Above Min)'},
        {number: 2, condition: 'Duration range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '179 (Below Max)'},
        {number: '', condition: '', testCase: '180 (At Max)'},
        {number: '', condition: '', testCase: '181 (Above Max)'},
        {number: 3, condition: 'Notes length', testCase: '0 chars (At Min)'},
        {number: '', condition: '', testCase: '1 char (Above Min)'},
        {number: '', condition: '', testCase: '1023 chars (Below Max)'},
        {number: '', condition: '', testCase: '1024 chars (At Max)'},
        {number: '', condition: '', testCase: '1025 chars (Above Max)'},
        {number: 4, condition: 'MemberId whitespace', testCase: '1 char padded (At Min after trim)'},
        {number: 5, condition: 'Notes whitespace', testCase: '1024 chars padded (At Max after trim)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 MemId 0ch', inputData: 'memberId=""', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 MemId 1ch', inputData: 'memberId="A"', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 MemId 2ch', inputData: 'memberId="AB"', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-2 Dur -1', inputData: 'duration=-1', expected: 'success: false'},
        {noTc: 5, bva: 'BVA-2 Dur 0', inputData: 'duration=0', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-2 Dur 1', inputData: 'duration=1', expected: 'success: true'},
        {noTc: 7, bva: 'BVA-2 Dur 179', inputData: 'duration=179', expected: 'success: true'},
        {noTc: 8, bva: 'BVA-2 Dur 180', inputData: 'duration=180', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Dur 181', inputData: 'duration=181', expected: 'success: false'},
        {noTc: 10, bva: 'BVA-3 Notes 0ch', inputData: 'notes len 0', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-3 Notes 1ch', inputData: 'notes len 1', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-3 Notes 1023ch', inputData: 'notes len 1023', expected: 'success: true'},
        {noTc: 13, bva: 'BVA-3 Notes 1024ch', inputData: 'notes len 1024', expected: 'success: true'},
        {noTc: 14, bva: 'BVA-3 Notes 1025ch', inputData: 'notes len 1025', expected: 'success: false'},
        {noTc: 15, bva: 'BVA-4 MemId padded 1ch', inputData: 'memberId=" A "', expected: 'success: true'},
        {noTc: 16, bva: 'BVA-5 Notes padded 1024ch', inputData: 'notes=" "+"A".repeat(1024)+" "', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid session (All fields)', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Notes field absent', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Notes empty string', expected: 'success: true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'MemberId missing', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'Date field missing', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Duration field missing', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'MemberId whitespace "   "', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: 'Date format wrong "01/01/2024"', expected: 'success: false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: 'MemberId with surrounding whitespace', expected: 'success: true'},
        {noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: 'Notes whitespace-only', expected: 'success: true'},
        {noTc: 11, fromEc: 'EC-10', fromBva: '', inputData: 'Notes with surrounding whitespace', expected: 'success: true'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId empty ""', expected: 'success: false'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId length 1', expected: 'success: true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId length 2', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'duration -1 (Below Min)', expected: 'success: false'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'duration 0 (At Min)', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'duration 1 (Above Min)', expected: 'success: true'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: 'duration 179 (Below Max)', expected: 'success: true'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-2', inputData: 'duration 180 (At Max)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-2', inputData: 'duration 181 (Above Max)', expected: 'success: false'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-3', inputData: 'notes len 0', expected: 'success: true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-3', inputData: 'notes len 1', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-3', inputData: 'notes len 1023', expected: 'success: true'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-3', inputData: 'notes len 1024', expected: 'success: true'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-3', inputData: 'notes len 1025', expected: 'success: false'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-4', inputData: 'memberId length 1 padded with whitespace', expected: 'success: true'},
        {noTc: 27, fromEc: '', fromBva: 'BVA-5', inputData: 'notes length 1024 padded with whitespace', expected: 'success: true'},
    ],
};

const workoutSessionExercisesSchemaBbt: BbtDescriptor = {
    reqId: 'WSM-02/WSM-03',
    tcCount: 28,
    statement: 'workoutSessionExercisesSchema – validate the array of exercises in a session. Minimum one entry.',
    data: 'Input: Array<{ exerciseId: string, sets: number, reps: number, weight: number }>',
    precondition: 'length ≥ 1 | 0 ≤ sets ≤ 6 | 0 ≤ reps ≤ 30 | 0.0 ≤ weight ≤ 500.0',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Single exercise', validEc: 'Length=1', invalidEc: ''},
        {number: 2, condition: 'Multiple exercises', validEc: 'Length > 1', invalidEc: ''},
        {number: 3, condition: 'Empty array', validEc: '', invalidEc: 'Length=0'},
        {number: 4, condition: 'ExerciseId presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'ExerciseId value', validEc: 'Non-whitespace', invalidEc: 'Whitespace only'},
        {number: 6, condition: 'Sets type', validEc: 'Number', invalidEc: 'String'},
        {number: 7, condition: 'Reps type', validEc: 'Number', invalidEc: 'String'},
        {number: 8, condition: 'Weight type', validEc: 'Number', invalidEc: 'String'},
        {number: 9, condition: 'ExerciseId whitespace', validEc: 'Surrounding whitespace', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Single valid exercise', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Multiple valid exercises', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '[] (empty array)', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing exerciseId field', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'exerciseId="   "', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'sets="invalid" (String)', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'reps="invalid" (String)', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'weight="invalid" (String)', expected: 'success: false'},
        {
            noTc: 9,
            ec: 'EC-9',
            inputData: 'exerciseId="  exercise-123  "',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Sets range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '5 (Below Max)'},
        {number: '', condition: '', testCase: '6 (At Max)'},
        {number: '', condition: '', testCase: '7 (Above Max)'},
        {number: 2, condition: 'Reps range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '29 (Below Max)'},
        {number: '', condition: '', testCase: '30 (At Max)'},
        {number: '', condition: '', testCase: '31 (Above Max)'},
        {number: 3, condition: 'Weight range', testCase: '-0.1 (Below Min)'},
        {number: '', condition: '', testCase: '0.0 (At Min)'},
        {number: '', condition: '', testCase: '0.1 (Above Min)'},
        {number: '', condition: '', testCase: '499.9 (Below Max)'},
        {number: '', condition: '', testCase: '500.0 (At Max)'},
        {number: '', condition: '', testCase: '500.1 (Above Max)'},
        {number: 4, condition: 'ExerciseId whitespace', testCase: '1 char padded'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Sets -1', inputData: 'sets=-1', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Sets 0', inputData: 'sets=0', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Sets 1', inputData: 'sets=1', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 Sets 5', inputData: 'sets=5', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 Sets 6', inputData: 'sets=6', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 Sets 7', inputData: 'sets=7', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Reps -1', inputData: 'reps=-1', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Reps 0', inputData: 'reps=0', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Reps 1', inputData: 'reps=1', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Reps 29', inputData: 'reps=29', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Reps 30', inputData: 'reps=30', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Reps 31', inputData: 'reps=31', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 Weight -0.1', inputData: 'weight=-0.1', expected: 'success: false'},
        {noTc: 14, bva: 'BVA-3 Weight 0', inputData: 'weight=0', expected: 'success: true'},
        {noTc: 15, bva: 'BVA-3 Weight 0.1', inputData: 'weight=0.1', expected: 'success: true'},
        {noTc: 16, bva: 'BVA-3 Weight 499.9', inputData: 'weight=499.9', expected: 'success: true'},
        {noTc: 17, bva: 'BVA-3 Weight 500', inputData: 'weight=500', expected: 'success: true'},
        {noTc: 18, bva: 'BVA-3 Weight 500.1', inputData: 'weight=500.1', expected: 'success: false'},
        {noTc: 19, bva: 'BVA-4 ExerciseId padded', inputData: 'exerciseId=" E "', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Single valid exercise row', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Multiple valid exercise rows', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Empty exercises array []', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Exercise entry missing id', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'exerciseId="   " (Whitespace)', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'sets="invalid" (Type error)', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'reps="invalid" (Type error)', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: 'weight="invalid" (Type error)', expected: 'success: false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: 'ExerciseId with surrounding whitespace', expected: 'success: true'},
        {noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=-1 (Below range)', expected: 'success: false'},
        {noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=0 (At boundary)', expected: 'success: true'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=1 (Inside range)', expected: 'success: true'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=5 (Inside range)', expected: 'success: true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=6 (At boundary)', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=7 (Above range)', expected: 'success: false'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=-1 (Below range)', expected: 'success: false'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=0 (At boundary)', expected: 'success: true'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=1 (Inside range)', expected: 'success: true'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=29 (Inside range)', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=30 (At boundary)', expected: 'success: true'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=31 (Above range)', expected: 'success: false'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=-0.1 (Below range)', expected: 'success: false'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=0 (At boundary)', expected: 'success: true'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=0.1 (Inside range)', expected: 'success: true'},
        {noTc: 25, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=499.9 (Inside range)', expected: 'success: true'},
        {noTc: 26, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=500 (At boundary)', expected: 'success: true'},
        {noTc: 27, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=500.1 (Above range)', expected: 'success: false'},
        {noTc: 28, fromEc: '', fromBva: 'BVA-4', inputData: 'exerciseId 1 char padded with whitespace', expected: 'success: true'},
    ],
};

const updateWorkoutSessionSchemaBbt: BbtDescriptor = {
    reqId: 'WSM-06',
    tcCount: 19,
    statement: 'updateWorkoutSessionSchema – validate partial update for a workout session.',
    data: 'Input: Partial<{ date: string, duration: number, notes: string }>',
    precondition: 'All optional. same constraints as create.',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Empty object', validEc: '{}', invalidEc: ''},
        {number: 2, condition: 'Date only', validEc: 'Valid format', invalidEc: 'Invalid format'},
        {number: 3, condition: 'Duration only', validEc: '0-180', invalidEc: ''},
        {number: 4, condition: 'Notes only', validEc: '0-1024 chars', invalidEc: ''},
        {number: 5, condition: 'Date format', validEc: '', invalidEc: 'Invalid format string'},
        {number: 6, condition: 'Notes whitespace', validEc: 'Surrounding whitespace', invalidEc: 'Whitespace only'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '{}', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: '{date: "2024-06-15"}', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '{duration: 45}', expected: 'success: true'},
        {noTc: 4, ec: 'EC-4', inputData: '{notes: "Updated notes"}', expected: 'success: true'},
        {noTc: 5, ec: 'EC-5', inputData: '{date: "01/01/2024"}', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'notes="     "', expected: 'success: true'},
        {noTc: 7, ec: 'EC-6', inputData: 'notes="  updated notes  "', expected: 'success: true'},
    ],
    bvaRows: [
        {number: 1, condition: 'Duration range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '179 (Below Max)'},
        {number: '', condition: '', testCase: '180 (At Max)'},
        {number: '', condition: '', testCase: '181 (Above Max)'},
        {number: 2, condition: 'Notes length', testCase: '0 chars (At Min)'},
        {number: '', condition: '', testCase: '1 char (Above Min)'},
        {number: '', condition: '', testCase: '1023 chars (Below Max)'},
        {number: '', condition: '', testCase: '1024 chars (At Max)'},
        {number: '', condition: '', testCase: '1025 chars (Above Max)'},
        {number: 3, condition: 'Notes whitespace', testCase: '1024 chars padded'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Dur -1', inputData: 'duration=-1', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Dur 0', inputData: 'duration=0', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Dur 1', inputData: 'duration=1', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 Dur 179', inputData: 'duration=179', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 Dur 180', inputData: 'duration=180', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 Dur 181', inputData: 'duration=181', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Notes 0ch', inputData: 'notes len 0', expected: 'success: true'},
        {noTc: 8, bva: 'BVA-2 Notes 1ch', inputData: 'notes len 1', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Notes 1023ch', inputData: 'notes len 1023', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Notes 1024ch', inputData: 'notes len 1024', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Notes 1025ch', inputData: 'notes len 1025', expected: 'success: false'},
        {noTc: 12, bva: 'BVA-3 Notes padded', inputData: 'notes=" " + "A".repeat(1024) + " "', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Empty update object {}', expected: 'success: true'},
        {
            noTc: 2,
            fromEc: 'EC-2',
            fromBva: '',
            inputData: '{date: "2024-06-15"} (Valid date)',
            expected: 'success: true'
        },
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: '{duration: 45} (Valid duration)', expected: 'success: true'},
        {
            noTc: 4,
            fromEc: 'EC-4',
            fromBva: '',
            inputData: '{notes: "Updated notes"} (Valid notes)',
            expected: 'success: true'
        },
        {
            noTc: 5,
            fromEc: 'EC-5',
            fromBva: '',
            inputData: '{date: "01/01/2024"} (Wrong format)',
            expected: 'success: false'
        },
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'Notes whitespace only', expected: 'success: true'},
        {noTc: 7, fromEc: 'EC-6', fromBva: '', inputData: 'Notes with surrounding whitespace', expected: 'success: true'},
        {noTc: 8, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=-1 (Below Min)', expected: 'success: false'},
        {noTc: 9, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=0 (At Min)', expected: 'success: true'},
        {noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=1 (Above Min)', expected: 'success: true'},
        {noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=179 (Below Max)', expected: 'success: true'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=180 (At Max)', expected: 'success: true'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: 'duration=181 (Above Max)', expected: 'success: false'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-2', inputData: 'notes len 0', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'notes len 1', expected: 'success: true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'notes len 1023', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'notes len 1024', expected: 'success: true'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: 'notes len 1025', expected: 'success: false'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-3', inputData: 'notes padded with whitespace', expected: 'success: true'},
    ],
};

const workoutSessionExercisesUpdateSchemaBbt: BbtDescriptor = {
    reqId: 'WSM-07',
    tcCount: 24,
    statement: 'workoutSessionExercisesUpdateSchema – validate the array of exercises when updating a session.',
    data: 'Input: Array<{ id?: string, exerciseId: string, sets: number, reps: number, weight: number }>',
    precondition: 'Same as workoutSessionExercisesSchema + optional id field.',
    results: 'Output: { success: true, data } OR { success: false, error }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'Exercise without ID', validEc: 'Valid entry', invalidEc: ''},
        {number: 2, condition: 'Exercise with ID', validEc: 'Valid entry', invalidEc: ''},
        {number: 3, condition: 'Empty array', validEc: '', invalidEc: 'Length=0'},
        {number: 4, condition: 'ExerciseId presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'ExerciseId whitespace', validEc: 'Surrounding whitespace', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid entry without ID', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Valid entry with ID', expected: 'success: true'},
        {noTc: 3, ec: 'EC-3', inputData: '[] (empty array)', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing exerciseId field', expected: 'success: false'},
        {
            noTc: 5,
            ec: 'EC-5',
            inputData: 'exerciseId="  exercise-123  "',
            expected: 'success: true'
        },
    ],
    bvaRows: [
        {number: 1, condition: 'Sets range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '5 (Below Max)'},
        {number: '', condition: '', testCase: '6 (At Max)'},
        {number: '', condition: '', testCase: '7 (Above Max)'},
        {number: 2, condition: 'Reps range', testCase: '-1 (Below Min)'},
        {number: '', condition: '', testCase: '0 (At Min)'},
        {number: '', condition: '', testCase: '1 (Above Min)'},
        {number: '', condition: '', testCase: '29 (Below Max)'},
        {number: '', condition: '', testCase: '30 (At Max)'},
        {number: '', condition: '', testCase: '31 (Above Max)'},
        {number: 3, condition: 'Weight range', testCase: '-0.1 (Below Min)'},
        {number: '', condition: '', testCase: '0.0 (At Min)'},
        {number: '', condition: '', testCase: '0.1 (Above Min)'},
        {number: '', condition: '', testCase: '499.9 (Below Max)'},
        {number: '', condition: '', testCase: '500.0 (At Max)'},
        {number: '', condition: '', testCase: '500.1 (Above Max)'},
        {number: 4, condition: 'ExerciseId whitespace', testCase: '1 char padded'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Sets -1', inputData: 'sets=-1', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 Sets 0', inputData: 'sets=0', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 Sets 1', inputData: 'sets=1', expected: 'success: true'},
        {noTc: 4, bva: 'BVA-1 Sets 5', inputData: 'sets=5', expected: 'success: true'},
        {noTc: 5, bva: 'BVA-1 Sets 6', inputData: 'sets=6', expected: 'success: true'},
        {noTc: 6, bva: 'BVA-1 Sets 7', inputData: 'sets=7', expected: 'success: false'},
        {noTc: 7, bva: 'BVA-2 Reps -1', inputData: 'reps=-1', expected: 'success: false'},
        {noTc: 8, bva: 'BVA-2 Reps 0', inputData: 'reps=0', expected: 'success: true'},
        {noTc: 9, bva: 'BVA-2 Reps 1', inputData: 'reps=1', expected: 'success: true'},
        {noTc: 10, bva: 'BVA-2 Reps 29', inputData: 'reps=29', expected: 'success: true'},
        {noTc: 11, bva: 'BVA-2 Reps 30', inputData: 'reps=30', expected: 'success: true'},
        {noTc: 12, bva: 'BVA-2 Reps 31', inputData: 'reps=31', expected: 'success: false'},
        {noTc: 13, bva: 'BVA-3 Weight -0.1', inputData: 'weight=-0.1', expected: 'success: false'},
        {noTc: 14, bva: 'BVA-3 Weight 0', inputData: 'weight=0', expected: 'success: true'},
        {noTc: 15, bva: 'BVA-3 Weight 0.1', inputData: 'weight=0.1', expected: 'success: true'},
        {noTc: 16, bva: 'BVA-3 Weight 499.9', inputData: 'weight=499.9', expected: 'success: true'},
        {noTc: 17, bva: 'BVA-3 Weight 500', inputData: 'weight=500', expected: 'success: true'},
        {noTc: 18, bva: 'BVA-3 Weight 500.1', inputData: 'weight=500.1', expected: 'success: false'},
        {noTc: 19, bva: 'BVA-4 ExerciseId padded', inputData: 'exerciseId=" E "', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid update entry without ID', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'Valid update entry with ID', expected: 'success: true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'Empty array []', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'Entry missing exerciseId', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'ExerciseId with surrounding whitespace', expected: 'success: true'},
        {noTc: 6, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=-1', expected: 'success: false'},
        {noTc: 7, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=0', expected: 'success: true'},
        {noTc: 8, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=1', expected: 'success: true'},
        {noTc: 9, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=5', expected: 'success: true'},
        {noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=6', expected: 'success: true'},
        {noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: 'sets=7', expected: 'success: false'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=-1', expected: 'success: false'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=0', expected: 'success: true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=1', expected: 'success: true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=29', expected: 'success: true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=30', expected: 'success: true'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: 'reps=31', expected: 'success: false'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=-0.1', expected: 'success: false'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=0', expected: 'success: true'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=0.1', expected: 'success: true'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=499.9', expected: 'success: true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=500', expected: 'success: true'},
        {noTc: 23, fromEc: '', fromBva: 'BVA-3', inputData: 'weight=500.1', expected: 'success: false'},
        {noTc: 24, fromEc: '', fromBva: 'BVA-4', inputData: 'exerciseId 1 char padded with whitespace', expected: 'success: true'},
    ],
};

const memberProgressReportSchemaBbt: BbtDescriptor = {
    reqId: 'RPT-01',
    tcCount: 12,
    statement: 'memberProgressReportSchema – validate query parameters for member progress report.',
    data: 'Input: MemberProgressReportInput { memberId, startDate, endDate }',
    precondition: 'memberId non-empty | YYYY-MM-DD format for dates',
    results: 'Output: { success: boolean, data?, error? }',
    postcondition: 'Validation results match constraints.',
    ecRows: [
        {number: 1, condition: 'All fields valid', validEc: 'All fields correct', invalidEc: ''},
        {number: 2, condition: 'MemberId presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 3, condition: 'StartDate presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 4, condition: 'EndDate presence', validEc: 'Present', invalidEc: 'Missing'},
        {number: 5, condition: 'MemberId value', validEc: 'Non-whitespace', invalidEc: 'Whitespace only'},
        {number: 6, condition: 'StartDate format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 7, condition: 'EndDate format', validEc: 'YYYY-MM-DD', invalidEc: 'Invalid format'},
        {number: 8, condition: 'Same day range', validEc: 'Start == End', invalidEc: ''},
        {number: 9, condition: 'Reverse range', validEc: 'Start > End (Allowed)', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: 'Valid query params', expected: 'success: true'},
        {noTc: 2, ec: 'EC-2', inputData: 'Missing memberId', expected: 'success: false'},
        {noTc: 3, ec: 'EC-3', inputData: 'Missing startDate', expected: 'success: false'},
        {noTc: 4, ec: 'EC-4', inputData: 'Missing endDate', expected: 'success: false'},
        {noTc: 5, ec: 'EC-5', inputData: 'memberId="   " (Spaces)', expected: 'success: false'},
        {noTc: 6, ec: 'EC-6', inputData: 'startDate="01/01/2024"', expected: 'success: false'},
        {noTc: 7, ec: 'EC-7', inputData: 'endDate="2024.12.31"', expected: 'success: false'},
        {noTc: 8, ec: 'EC-8', inputData: 'startDate == endDate', expected: 'success: true'},
        {noTc: 9, ec: 'EC-9', inputData: 'startDate > endDate', expected: 'success: true'},
    ],
    bvaRows: [
        {number: 1, condition: 'MemberId length', testCase: '0 chars (Below Min)'},
        {number: '', condition: '', testCase: '1 char (At Min)'},
        {number: '', condition: '', testCase: '2 chars (Above Min)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 MemId 0ch', inputData: 'memberId=""', expected: 'success: false'},
        {noTc: 2, bva: 'BVA-1 MemId 1ch', inputData: 'memberId="A"', expected: 'success: true'},
        {noTc: 3, bva: 'BVA-1 MemId 2ch', inputData: 'memberId="AB"', expected: 'success: true'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: 'Valid query parameters', expected: 'success: true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: 'MemberId field missing', expected: 'success: false'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: 'StartDate field missing', expected: 'success: false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: 'EndDate field missing', expected: 'success: false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: 'MemberId whitespace "   "', expected: 'success: false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: 'StartDate format wrong', expected: 'success: false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: 'EndDate format wrong', expected: 'success: false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: 'Same day range (Start == End)', expected: 'success: true'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: 'Reverse range (Start > End)', expected: 'success: true'},
        {noTc: 10, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId empty ""', expected: 'success: false'},
        {noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId length 1', expected: 'success: true'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: 'memberId length 2', expected: 'success: true'},
    ],
};

const isoDateRegexBbt: BbtDescriptor = {
    reqId: 'UTILS-ISO',
    tcCount: 22,
    statement: 'isoDateRegex – pattern /^\\d{4}-\\d{2}-\\d{2}$/ used throughout the application.',
    data: 'Input: string s',
    precondition: 'None',
    results: 'Output: boolean',
    postcondition: 'True if YYYY-MM-DD format matches.',
    ecRows: [
        {number: 1, condition: 'Valid date 1', validEc: '2024-01-01', invalidEc: ''},
        {number: 2, condition: 'Valid date 2', validEc: '1990-12-31', invalidEc: ''},
        {number: 3, condition: 'Slash separator', validEc: '', invalidEc: '2024/01/01'},
        {number: 4, condition: 'Dot separator', validEc: '', invalidEc: '2024.01.01'},
        {number: 5, condition: 'DateTime format', validEc: '', invalidEc: '2024-01-01T00:00:00'},
        {number: 6, condition: 'No separators', validEc: '', invalidEc: '20240101'},
        {number: 7, condition: 'Reversed format', validEc: '', invalidEc: '01-01-2024'},
        {number: 8, condition: 'Empty string', validEc: '', invalidEc: '""'},
        {number: 9, condition: 'Month 00', validEc: '2024-00-15', invalidEc: ''},
        {number: 10, condition: 'Day 00', validEc: '2024-01-00', invalidEc: ''},
        {number: 11, condition: 'Month 99', validEc: '2024-99-01', invalidEc: ''},
        {number: 12, condition: 'Day 99', validEc: '2024-01-99', invalidEc: ''},
        {number: 13, condition: 'All zeroes', validEc: '0000-00-00', invalidEc: ''},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '"2024-01-01"', expected: 'true'},
        {noTc: 2, ec: 'EC-2', inputData: '"1990-12-31"', expected: 'true'},
        {noTc: 3, ec: 'EC-3', inputData: '"2024/01/01"', expected: 'false'},
        {noTc: 4, ec: 'EC-4', inputData: '"2024.01.01"', expected: 'false'},
        {noTc: 5, ec: 'EC-5', inputData: '"2024-01-01T00:00:00"', expected: 'false'},
        {noTc: 6, ec: 'EC-6', inputData: '"20240101"', expected: 'false'},
        {noTc: 7, ec: 'EC-7', inputData: '"01-01-2024"', expected: 'false'},
        {noTc: 8, ec: 'EC-8', inputData: '""', expected: 'false'},
        {noTc: 9, ec: 'EC-9', inputData: '"2024-00-15"', expected: 'true'},
        {noTc: 10, ec: 'EC-10', inputData: '"2024-01-00"', expected: 'true'},
        {noTc: 11, ec: 'EC-11', inputData: '"2024-99-01"', expected: 'true'},
        {noTc: 12, ec: 'EC-12', inputData: '"2024-01-99"', expected: 'true'},
        {noTc: 13, ec: 'EC-13', inputData: '"0000-00-00"', expected: 'true'},
    ],
    bvaRows: [
        {number: 1, condition: 'Year length', testCase: '3 digits (Below Min)'},
        {number: '', condition: '', testCase: '4 digits (At Min)'},
        {number: '', condition: '', testCase: '5 digits (Above Min)'},
        {number: 2, condition: 'Month length', testCase: '1 digit (Below)'},
        {number: '', condition: '', testCase: '2 digits (At)'},
        {number: '', condition: '', testCase: '3 digits (Above)'},
        {number: 3, condition: 'Day length', testCase: '1 digit (Below)'},
        {number: '', condition: '', testCase: '2 digits (At)'},
        {number: '', condition: '', testCase: '3 digits (Above)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 Year 3d', inputData: '"202-01-01"', expected: 'false'},
        {noTc: 2, bva: 'BVA-1 Year 4d', inputData: '"2024-01-01"', expected: 'true'},
        {noTc: 3, bva: 'BVA-1 Year 5d', inputData: '"20240-01-01"', expected: 'false'},
        {noTc: 4, bva: 'BVA-2 Month 1d', inputData: '"2024-1-01"', expected: 'false'},
        {noTc: 5, bva: 'BVA-2 Month 2d', inputData: '"2024-01-01"', expected: 'true'},
        {noTc: 6, bva: 'BVA-2 Month 3d', inputData: '"2024-011-01"', expected: 'false'},
        {noTc: 7, bva: 'BVA-3 Day 1d', inputData: '"2024-01-1"', expected: 'false'},
        {noTc: 8, bva: 'BVA-3 Day 2d', inputData: '"2024-01-01"', expected: 'true'},
        {noTc: 9, bva: 'BVA-3 Day 3d', inputData: '"2024-01-011"', expected: 'false'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: '"2024-01-01" (ISO format)', expected: 'true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: '"1990-12-31" (ISO format)', expected: 'true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: '"2024/01/01" (Slashes)', expected: 'false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: '"2024.01.01" (Dots)', expected: 'false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: '"2024-01-01T00:00:00" (DateTime)', expected: 'false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: '"20240101" (No separators)', expected: 'false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: '"01-01-2024" (Reversed)', expected: 'false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: '"" (Empty string)', expected: 'false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: '"2024-00-15" (Month 00)', expected: 'true'},
        {noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"2024-01-00" (Day 00)', expected: 'true'},
        {noTc: 11, fromEc: 'EC-11', fromBva: '', inputData: '"2024-99-01" (Month 99)', expected: 'true'},
        {noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: '"2024-01-99" (Day 99)', expected: 'true'},
        {noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: '"0000-00-00" (All zeroes)', expected: 'true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: '"202-01-01" (3-digit year)', expected: 'false'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: '"2024-01-01" (4-digit year)', expected: 'true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: '"20240-01-01" (5-digit year)', expected: 'false'},
        {noTc: 17, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-1-01" (1-digit month)', expected: 'false'},
        {noTc: 18, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-01-01" (2-digit month)', expected: 'true'},
        {noTc: 19, fromEc: '', fromBva: 'BVA-2', inputData: '"2024-011-01" (3-digit month)', expected: 'false'},
        {noTc: 20, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-1" (1-digit day)', expected: 'false'},
        {noTc: 21, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-01" (2-digit day)', expected: 'true'},
        {noTc: 22, fromEc: '', fromBva: 'BVA-3', inputData: '"2024-01-011" (3-digit day)', expected: 'false'},
    ],
};

const e164PhoneRegexBbt: BbtDescriptor = {
    reqId: 'UTILS-E164',
    tcCount: 16,
    statement: 'e164PhoneRegex – pattern /^\\+?[1-9]\\d{1,14}$/ validates simplified E.164 phone numbers.',
    data: 'Input: string s',
    precondition: 'None',
    results: 'Output: boolean',
    postcondition: 'True if format matches.',
    ecRows: [
        {number: 1, condition: 'Plus prefix', validEc: '+40712345678', invalidEc: ''},
        {number: 2, condition: 'No plus prefix', validEc: '40712345678', invalidEc: ''},
        {number: 3, condition: 'Starts with 0', validEc: '', invalidEc: '0712345678'},
        {number: 4, condition: 'Starts with +0', validEc: '', invalidEc: '+0712345678'},
        {number: 5, condition: 'Spaces', validEc: '', invalidEc: '+44 20 1234 5678'},
        {number: 6, condition: 'Dashes', validEc: '', invalidEc: '+1-800-555-5555'},
        {number: 7, condition: 'Parentheses', validEc: '', invalidEc: '+1(800)5551234'},
        {number: 8, condition: 'Alpha chars', validEc: '', invalidEc: 'ABCDEFG'},
        {number: 9, condition: 'Only plus', validEc: '', invalidEc: '+'},
        {number: 10, condition: 'Empty string', validEc: '', invalidEc: '""'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '"+40712345678"', expected: 'true'},
        {noTc: 2, ec: 'EC-2', inputData: '"40712345678"', expected: 'true'},
        {noTc: 3, ec: 'EC-3', inputData: '"0712345678"', expected: 'false'},
        {noTc: 4, ec: 'EC-4', inputData: '"+0712345678"', expected: 'false'},
        {noTc: 5, ec: 'EC-5', inputData: '"+44 20 1234 5678"', expected: 'false'},
        {noTc: 6, ec: 'EC-6', inputData: '"+1-800-555-5555"', expected: 'false'},
        {noTc: 7, ec: 'EC-7', inputData: '"+1(800)5551234"', expected: 'false'},
        {noTc: 8, ec: 'EC-8', inputData: '"ABCDEFG"', expected: 'false'},
        {noTc: 9, ec: 'EC-9', inputData: '"+"', expected: 'false'},
        {noTc: 10, ec: 'EC-10', inputData: '""', expected: 'false'},
    ],
    bvaRows: [
        {number: 1, condition: 'Digit count', testCase: '1 digit after + (Below Min)'},
        {number: '', condition: '', testCase: '2 digits after + (At Min)'},
        {number: '', condition: '', testCase: '3 digits after + (Above Min)'},
        {number: '', condition: '', testCase: '14 digits after + (Below Max)'},
        {number: '', condition: '', testCase: '15 digits after + (At Max)'},
        {number: '', condition: '', testCase: '16 digits after + (Above Max)'},
    ],
    bvaTcRows: [
        {noTc: 1, bva: 'BVA-1 len 1', inputData: '"1"', expected: 'false'},
        {noTc: 2, bva: 'BVA-1 len 2', inputData: '"12"', expected: 'true'},
        {noTc: 3, bva: 'BVA-1 len 3', inputData: '"+123"', expected: 'true'},
        {noTc: 4, bva: 'BVA-1 len 14', inputData: '"+12345678901234"', expected: 'true'},
        {noTc: 5, bva: 'BVA-1 len 15', inputData: '"+123456789012345"', expected: 'true'},
        {noTc: 6, bva: 'BVA-1 len 16', inputData: '"+1234567890123456"', expected: 'false'},
    ],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: '"+40712345678" (With +)', expected: 'true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: '"40712345678" (Without +)', expected: 'true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: '"0712345678" (Starts with 0)', expected: 'false'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: '"+0712345678" (Starts with +0)', expected: 'false'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: '"+44 20 1234 5678" (Spaces)', expected: 'false'},
        {noTc: 6, fromEc: 'EC-6', fromBva: '', inputData: '"+1-800-555-5555" (Dashes)', expected: 'false'},
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: '"+1(800)5551234" (Parentheses)', expected: 'false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: '"ABCDEFG" (Alpha)', expected: 'false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: '"+" (Plus only)', expected: 'false'},
        {noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"" (Empty)', expected: 'false'},
        {noTc: 11, fromEc: '', fromBva: 'BVA-1', inputData: '1 digit after + (Too short)', expected: 'false'},
        {noTc: 12, fromEc: '', fromBva: 'BVA-1', inputData: '2 digits after + (Min)', expected: 'true'},
        {noTc: 13, fromEc: '', fromBva: 'BVA-1', inputData: '3 digits after + (Inside)', expected: 'true'},
        {noTc: 14, fromEc: '', fromBva: 'BVA-1', inputData: '14 digits after + (Inside)', expected: 'true'},
        {noTc: 15, fromEc: '', fromBva: 'BVA-1', inputData: '15 digits after + (Max)', expected: 'true'},
        {noTc: 16, fromEc: '', fromBva: 'BVA-1', inputData: '16 digits after + (Too long)', expected: 'false'},
    ],
};

const emailRegexBbt: BbtDescriptor = {
    reqId: 'UTILS-EMAIL',
    tcCount: 17,
    statement: 'emailRegex – pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ validates simplified RFC 5321 email addresses.',
    data: 'Input: string s',
    precondition: 'None',
    results: 'Output: boolean',
    postcondition: 'True if format matches.',
    ecRows: [
        {number: 1, condition: 'Basic email', validEc: 'user@example.com', invalidEc: ''},
        {number: 2, condition: 'Subdomain', validEc: 'user@mail.example.com', invalidEc: ''},
        {number: 3, condition: 'Plus tag', validEc: 'user+tag@domain.com', invalidEc: ''},
        {number: 4, condition: 'Dot in local', validEc: 'first.last@domain.com', invalidEc: ''},
        {number: 5, condition: 'Numeric local', validEc: '12345@domain.com', invalidEc: ''},
        {number: 6, condition: 'Special local', validEc: 'user.name+tag@example.org', invalidEc: ''},
        {number: 7, condition: 'No at symbol', validEc: '', invalidEc: 'invalidemail.com'},
        {number: 8, condition: 'Empty local', validEc: '', invalidEc: '@domain.com'},
        {number: 9, condition: 'No domain after @', validEc: '', invalidEc: 'user@'},
        {number: 10, condition: 'No dot in domain', validEc: '', invalidEc: 'user@domain'},
        {number: 11, condition: 'Space in local', validEc: '', invalidEc: 'user name@domain.com'},
        {number: 12, condition: 'Space after @', validEc: '', invalidEc: 'user@ domain.com'},
        {number: 13, condition: 'Multiple @ symbols', validEc: '', invalidEc: 'a@b@example.com'},
        {number: 14, condition: 'Empty domain before dot', validEc: '', invalidEc: 'user@.com'},
        {number: 15, condition: 'Trailing dot', validEc: '', invalidEc: 'user@domain.'},
        {number: 16, condition: 'Empty string', validEc: '', invalidEc: '""'},
        {number: 17, condition: 'At symbol only', validEc: '', invalidEc: '@'},
    ],
    epTcRows: [
        {noTc: 1, ec: 'EC-1', inputData: '"user@example.com"', expected: 'true'},
        {noTc: 2, ec: 'EC-2', inputData: '"user@mail.example.com"', expected: 'true'},
        {noTc: 3, ec: 'EC-3', inputData: '"user+tag@domain.com"', expected: 'true'},
        {noTc: 4, ec: 'EC-4', inputData: '"first.last@domain.com"', expected: 'true'},
        {noTc: 5, ec: 'EC-5', inputData: '"12345@domain.com"', expected: 'true'},
        {noTc: 6, ec: 'EC-6', inputData: '"user.name+tag@example.org"', expected: 'true'},
        {noTc: 7, ec: 'EC-7', inputData: '"invalidemail.com"', expected: 'false'},
        {noTc: 8, ec: 'EC-8', inputData: '"@domain.com"', expected: 'false'},
        {noTc: 9, ec: 'EC-9', inputData: '"user@"', expected: 'false'},
        {noTc: 10, ec: 'EC-10', inputData: '"user@domain"', expected: 'false'},
        {noTc: 11, ec: 'EC-11', inputData: '"user name@domain.com"', expected: 'false'},
        {noTc: 12, ec: 'EC-12', inputData: '"user@ domain.com"', expected: 'false'},
        {noTc: 13, ec: 'EC-13', inputData: '"a@b@example.com"', expected: 'false'},
        {noTc: 14, ec: 'EC-14', inputData: '"user@.com"', expected: 'false'},
        {noTc: 15, ec: 'EC-15', inputData: '"user@domain."', expected: 'false'},
        {noTc: 16, ec: 'EC-16', inputData: '""', expected: 'false'},
        {noTc: 17, ec: 'EC-17', inputData: '"@"', expected: 'false'},
    ],
    bvaRows: [],
    bvaTcRows: [],
    finalTcRows: [
        {noTc: 1, fromEc: 'EC-1', fromBva: '', inputData: '"user@example.com" (Standard)', expected: 'true'},
        {noTc: 2, fromEc: 'EC-2', fromBva: '', inputData: '"user@mail.example.com" (Subdomain)', expected: 'true'},
        {noTc: 3, fromEc: 'EC-3', fromBva: '', inputData: '"user+tag@domain.com" (Plus tag)', expected: 'true'},
        {noTc: 4, fromEc: 'EC-4', fromBva: '', inputData: '"first.last@domain.com" (Dot in local)', expected: 'true'},
        {noTc: 5, fromEc: 'EC-5', fromBva: '', inputData: '"12345@domain.com" (Numeric local)', expected: 'true'},
        {
            noTc: 6,
            fromEc: 'EC-6',
            fromBva: '',
            inputData: '"user.name+tag@example.org" (Special local)',
            expected: 'true'
        },
        {noTc: 7, fromEc: 'EC-7', fromBva: '', inputData: '"invalidemail.com" (No @)', expected: 'false'},
        {noTc: 8, fromEc: 'EC-8', fromBva: '', inputData: '"@domain.com" (Empty local)', expected: 'false'},
        {noTc: 9, fromEc: 'EC-9', fromBva: '', inputData: '"user@" (No domain)', expected: 'false'},
        {noTc: 10, fromEc: 'EC-10', fromBva: '', inputData: '"user@domain" (No dot in domain)', expected: 'false'},
        {
            noTc: 11,
            fromEc: 'EC-11',
            fromBva: '',
            inputData: '"user name@domain.com" (Space in local)',
            expected: 'false'
        },
        {noTc: 12, fromEc: 'EC-12', fromBva: '', inputData: '"user@ domain.com" (Space after @)', expected: 'false'},
        {noTc: 13, fromEc: 'EC-13', fromBva: '', inputData: '"a@b@example.com" (Multiple @)', expected: 'false'},
        {noTc: 14, fromEc: 'EC-14', fromBva: '', inputData: '"user@.com" (Empty domain before dot)', expected: 'false'},
        {noTc: 15, fromEc: 'EC-15', fromBva: '', inputData: '"user@domain." (Trailing dot)', expected: 'false'},
        {noTc: 16, fromEc: 'EC-16', fromBva: '', inputData: '"" (Empty string)', expected: 'false'},
        {noTc: 17, fromEc: 'EC-17', fromBva: '', inputData: '"@" (At symbol only)', expected: 'false'},
    ],
};

(async () => {
    console.log('Generating BBT form Excel files…\n');

    await writeBbt(createMemberSchemaBbt, path.join(BASE, 'user-schema', 'createMemberSchema-bbt-form.xlsx'));
    await writeBbt(createMemberWithTempPasswordSchemaBbt, path.join(BASE, 'user-schema', 'createMemberWithTempPasswordSchema-bbt-form.xlsx'));
    await writeBbt(loginUserSchemaBbt, path.join(BASE, 'user-schema', 'loginUserSchema-bbt-form.xlsx'));
    await writeBbt(createAdminSchemaBbt, path.join(BASE, 'user-schema', 'createAdminSchema-bbt-form.xlsx'));
    await writeBbt(updateMemberSchemaBbt, path.join(BASE, 'user-schema', 'updateMemberSchema-bbt-form.xlsx'));
    await writeBbt(updateAdminSchemaBbt, path.join(BASE, 'user-schema', 'updateAdminSchema-bbt-form.xlsx'));
    await writeBbt(createExerciseSchemaBbt, path.join(BASE, 'exercise-schema', 'createExerciseSchema-bbt-form.xlsx'));
    await writeBbt(updateExerciseSchemaBbt, path.join(BASE, 'exercise-schema', 'updateExerciseSchema-bbt-form.xlsx'));
    await writeBbt(createWorkoutSessionSchemaBbt, path.join(BASE, 'workout-session-schema', 'createWorkoutSessionSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExercisesSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesSchema-bbt-form.xlsx'));
    await writeBbt(updateWorkoutSessionSchemaBbt, path.join(BASE, 'workout-session-schema', 'updateWorkoutSessionSchema-bbt-form.xlsx'));
    await writeBbt(workoutSessionExercisesUpdateSchemaBbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesUpdateSchema-bbt-form.xlsx'));
    await writeBbt(memberProgressReportSchemaBbt, path.join(BASE, 'report-schema', 'memberProgressReportSchema-bbt-form.xlsx'));
    await writeBbt(isoDateRegexBbt, path.join(BASE, 'utils', 'isoDateRegex-bbt-form.xlsx'));
    await writeBbt(e164PhoneRegexBbt, path.join(BASE, 'utils', 'e164PhoneRegex-bbt-form.xlsx'));
    await writeBbt(emailRegexBbt, path.join(BASE, 'utils', 'emailRegex-bbt-form.xlsx'));

    console.log('\nDone.');
})();
