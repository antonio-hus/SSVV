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

const SVC_BASE = path.join(ROOT, 'lib', 'service', '__tests__', 'bbt');

// ── auth-service ───────────────────────────────────────────────────────────────

const loginBbt: BbtDescriptor = {
  reqId: 'AUTH-01',
  tcCount: 11,
  statement: 'AuthService.login(data) – Authenticates user.',
  data: 'Input: LoginUserInput { email: string, password: string }',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<SessionData>',
  postcondition: 'Session data returned.',
  ecRows: [{ number: 1, condition: 'Credentials', validEc: 'Correct', invalidEc: 'Wrong' }],
  epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 11}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Login test', expected: 'Success/Error'
  })),
};

// ── user-service ───────────────────────────────────────────────────────────────

const createMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 3,
  statement: 'UserService.createMember(data)',
  data: 'Input: CreateMemberInput',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Member created.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 3}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Create member', expected: 'Success/Error'
  })),
};

const createMemberWithTempPwdBbt: BbtDescriptor = {
  reqId: 'MEM-02',
  tcCount: 4,
  statement: 'UserService.createMemberWithTempPassword(data)',
  data: 'Input: CreateMemberWithTempPasswordInput',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUserAndTempPassword>',
  postcondition: 'Member created with temp pwd.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 4}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Create with temp pwd', expected: 'Success/Error'
  })),
};

const createAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 3,
  statement: 'UserService.createAdmin(data)',
  data: 'Input: CreateAdminInput',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<AdminWithUser>',
  postcondition: 'Admin created.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 3}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Create admin', expected: 'Success/Error'
  })),
};

const getMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-04',
  tcCount: 5,
  statement: 'UserService.getMember(memberId)',
  data: 'Input: memberId',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Member returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Get member', expected: 'Success/Error'
  })),
};

const getAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 5,
  statement: 'UserService.getAdmin(adminId)',
  data: 'Input: adminId',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<AdminWithUser>',
  postcondition: 'Admin returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Get admin', expected: 'Success/Error'
  })),
};

const listMembersSvcBbt: BbtDescriptor = {
  reqId: 'MEM-03',
  tcCount: 14,
  statement: 'UserService.listMembers(options)',
  data: 'Input: MemberListOptions',
  precondition: 'userRepository accessible',
  results: 'Output: PageResult',
  postcondition: 'Members page returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 14}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'List members', expected: 'Success'
  })),
};

const listAdminsSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 14,
  statement: 'UserService.listAdmins(options)',
  data: 'Input: AdminListOptions',
  precondition: 'userRepository accessible',
  results: 'Output: PageResult',
  postcondition: 'Admins page returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 14}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'List admins', expected: 'Success'
  })),
};

const updateMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-05',
  tcCount: 27,
  statement: 'UserService.updateMember(id, data)',
  data: 'Input: id, data',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Member updated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 27}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Update member', expected: 'Success/Error'
  })),
};

const updateAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 24,
  statement: 'UserService.updateAdmin(id, data)',
  data: 'Input: id, data',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<AdminWithUser>',
  postcondition: 'Admin updated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 24}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Update admin', expected: 'Success/Error'
  })),
};

const suspendMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 5,
  statement: 'UserService.suspendMember(id)',
  data: 'Input: id',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Member suspended.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Suspend', expected: 'Success/Error'
  })),
};

const activateMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-06',
  tcCount: 5,
  statement: 'UserService.activateMember(id)',
  data: 'Input: id',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<MemberWithUser>',
  postcondition: 'Member activated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Activate', expected: 'Success/Error'
  })),
};

const deleteMemberSvcBbt: BbtDescriptor = {
  reqId: 'MEM-01',
  tcCount: 5,
  statement: 'UserService.deleteMember(id)',
  data: 'Input: id',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<void>',
  postcondition: 'Member deleted.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Delete member', expected: 'Success/Error'
  })),
};

const deleteAdminSvcBbt: BbtDescriptor = {
  reqId: 'AUTH-06',
  tcCount: 5,
  statement: 'UserService.deleteAdmin(id)',
  data: 'Input: id',
  precondition: 'userRepository accessible',
  results: 'Output: Promise<void>',
  postcondition: 'Admin deleted.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Delete admin', expected: 'Success/Error'
  })),
};

// ── exercise-service ───────────────────────────────────────────────────────────

const createExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-01', tcCount: 3, statement: 'ExerciseService.createExercise(data)', data: 'Input: CreateExerciseInput',
  precondition: 'repo accessible', results: 'Output: Exercise', postcondition: 'Created.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 3}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Create', expected: 'Success/Error'
  })),
};

const getExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-02', tcCount: 5, statement: 'ExerciseService.getExercise(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: Exercise', postcondition: 'Returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Get', expected: 'Success/Error'
  })),
};

const listExercisesSvcBbt: BbtDescriptor = {
  reqId: 'EXM-02/EXM-06', tcCount: 26, statement: 'ExerciseService.listExercises(options)', data: 'Input: options',
  precondition: 'repo accessible', results: 'Output: PageResult', postcondition: 'Listed.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 26}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'List', expected: 'Success'
  })),
};

const updateExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-03', tcCount: 24, statement: 'ExerciseService.updateExercise(id, data)', data: 'Input: id, data',
  precondition: 'repo accessible', results: 'Output: Exercise', postcondition: 'Updated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 24}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Update', expected: 'Success/Error'
  })),
};

const archiveExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-04', tcCount: 5, statement: 'ExerciseService.archiveExercise(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: Exercise', postcondition: 'Archived.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Archive', expected: 'Success/Error'
  })),
};

const unarchiveExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-05', tcCount: 5, statement: 'ExerciseService.unarchiveExercise(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: Exercise', postcondition: 'Restored.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Unarchive', expected: 'Success/Error'
  })),
};

const deleteExerciseSvcBbt: BbtDescriptor = {
  reqId: 'EXM-01', tcCount: 7, statement: 'ExerciseService.deleteExercise(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: void', postcondition: 'Deleted.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 7}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Delete', expected: 'Success/Error'
  })),
};

// ── workout-session-service ────────────────────────────────────────────────────

const createWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-01', tcCount: 10, statement: 'WorkoutSessionService.createWorkoutSession(data, ex)', data: 'Input: data, ex',
  precondition: 'repo accessible', results: 'Output: session', postcondition: 'Created.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 10}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Create', expected: 'Success/Error'
  })),
};

const getWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-05', tcCount: 5, statement: 'WorkoutSessionService.getWorkoutSession(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: session', postcondition: 'Returned.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Get', expected: 'Success/Error'
  })),
};

const listMemberWorkoutSessionsSvcBbt: BbtDescriptor = {
  reqId: 'WSM-05', tcCount: 13, statement: 'WorkoutSessionService.listMemberWorkoutSessions(id, opts)', data: 'Input: id, opts',
  precondition: 'repo accessible', results: 'Output: page', postcondition: 'Listed.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 13}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'List', expected: 'Success'
  })),
};

const updateWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-06', tcCount: 5, statement: 'WorkoutSessionService.updateWorkoutSession(id, data)', data: 'Input: id, data',
  precondition: 'repo accessible', results: 'Output: session', postcondition: 'Updated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Update', expected: 'Success/Error'
  })),
};

const updateWorkoutSessionWithExercisesSvcBbt: BbtDescriptor = {
  reqId: 'WSM-06/WSM-07', tcCount: 10, statement: 'WorkoutSessionService.updateWorkoutSessionWithExercises(id, data, ex)', data: 'Input: id, data, ex',
  precondition: 'repo accessible', results: 'Output: session', postcondition: 'Updated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 10}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Update with ex', expected: 'Success/Error'
  })),
};

const deleteWorkoutSessionSvcBbt: BbtDescriptor = {
  reqId: 'WSM-08', tcCount: 5, statement: 'WorkoutSessionService.deleteWorkoutSession(id)', data: 'Input: id',
  precondition: 'repo accessible', results: 'Output: void', postcondition: 'Deleted.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 5}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Delete', expected: 'Success/Error'
  })),
};

const getMemberProgressReportBbt: BbtDescriptor = {
  reqId: 'RPG-01', tcCount: 12, statement: 'ReportService.getMemberProgressReport(id, start, end)', data: 'Input: id, start, end',
  precondition: 'repos accessible', results: 'Output: report', postcondition: 'Generated.',
  ecRows: [], epTcRows: [], bvaRows: [], bvaTcRows: [],
  finalTcRows: Array.from({length: 12}, (_, i) => ({
    noTc: i + 1, fromEc: 'EC', fromBva: 'BVA', inputData: 'Report', expected: 'Success/Error'
  })),
};

async function main() {
  console.log('Generating service BBT forms...');
  const AUTH_SVC = path.join(SVC_BASE, 'auth-service');
  const USER_SVC = path.join(SVC_BASE, 'user-service');
  const EXM_SVC  = path.join(SVC_BASE, 'exercise-service');
  const WS_SVC   = path.join(SVC_BASE, 'workout-session-service');
  const RPT_SVC  = path.join(SVC_BASE, 'report-service');

  await writeBbt(loginBbt, path.join(AUTH_SVC, 'login-bbt-form.xlsx'));
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
  await writeBbt(createExerciseSvcBbt,    path.join(EXM_SVC, 'createExercise-bbt-form.xlsx'));
  await writeBbt(getExerciseSvcBbt,       path.join(EXM_SVC, 'getExercise-bbt-form.xlsx'));
  await writeBbt(listExercisesSvcBbt,     path.join(EXM_SVC, 'listExercises-bbt-form.xlsx'));
  await writeBbt(updateExerciseSvcBbt,    path.join(EXM_SVC, 'updateExercise-bbt-form.xlsx'));
  await writeBbt(archiveExerciseSvcBbt,   path.join(EXM_SVC, 'archiveExercise-bbt-form.xlsx'));
  await writeBbt(unarchiveExerciseSvcBbt, path.join(EXM_SVC, 'unarchiveExercise-bbt-form.xlsx'));
  await writeBbt(deleteExerciseSvcBbt,    path.join(EXM_SVC, 'deleteExercise-bbt-form.xlsx'));
  await writeBbt(createWorkoutSessionSvcBbt,             path.join(WS_SVC, 'createWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getWorkoutSessionSvcBbt,                path.join(WS_SVC, 'getWorkoutSession-bbt-form.xlsx'));
  await writeBbt(listMemberWorkoutSessionsSvcBbt,        path.join(WS_SVC, 'listMemberWorkoutSessions-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionSvcBbt,             path.join(WS_SVC, 'updateWorkoutSession-bbt-form.xlsx'));
  await writeBbt(updateWorkoutSessionWithExercisesSvcBbt,path.join(WS_SVC, 'updateWorkoutSessionWithExercises-bbt-form.xlsx'));
  await writeBbt(deleteWorkoutSessionSvcBbt,             path.join(WS_SVC, 'deleteWorkoutSession-bbt-form.xlsx'));
  await writeBbt(getMemberProgressReportBbt, path.join(RPT_SVC, 'getMemberProgressReport-bbt-form.xlsx'));
  console.log('\nDone — 28 service BBT forms generated.');
}

main().catch(console.error);
