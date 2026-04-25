/**
 * generate-controller-wbt-forms.ts
 * Run: npm run generate-controller-wbt-forms
 *
 * Add one WbtDescriptor per service function under test.
 * See the wbt-gymtrackerpro skill for the complete filling guide.
 */

import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'controller', '__tests__', 'wbt');

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-01 · login
// ─────────────────────────────────────────────────────────────────────────────

const authControllerLoginWbt: WbtDescriptor = {
    reqId: 'CTRL-01',
    statement: 'login(data) — validates credentials via Zod, delegates to authService.login, persists the session, and returns an ActionResult<SessionData>.',
    data: 'Input: LoginUserInput',
    precondition: 'A LoginUserInput object is provided. authService and getSession are injectable mocks.',
    results: 'Output: Promise<ActionResult<SessionData>>',
    postcondition: 'Returns {success:true, data:sessionData} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="result = loginUserSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="sessionData = authService.login(result.data)\\nsession = getSession()\\nassign session fields; session.save()" shape=box];
  S4     [label="return {success:true, data:sessionData}" shape=box];
  S5     [label="return {success:false, message:error.message}" shape=box];
  S6     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> S2:n    [label="True"];
  D1:e    -> S3:n    [label="False"];
  S3:s    -> D_TRY:n;
  D_TRY:w -> D2:n    [label="True"];
  D_TRY:e -> S4:n    [label="False"];
  D2:w    -> S5:n    [label="True"];
  D2:e    -> S6:n    [label="False"];
  S5:s    -> mCatch:nw;
  S6:s    -> mCatch:ne;
  S2:s    -> mExit:nw;
  S4:s    -> mExit:ne;
  mCatch  -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function login(data: LoginUserInput): Promise<ActionResult<SessionData>> {',
        '    const result = loginUserSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        const sessionData = await authService.login(result.data);',
        '        const session = await getSession();',
        '        session.userId = sessionData.userId;',
        '        session.email = sessionData.email;',
        '        session.fullName = sessionData.fullName;',
        '        session.role = sessionData.role;',
        '        session.memberId = sessionData.memberId;',
        '        session.adminId = sessionData.adminId;',
        '        session.isActive = sessionData.isActive;',
        '        await session.save();',
        '        return {success: true, data: sessionData};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    // N=13 (start S1 D1 S2 S3 D_TRY S4 D2 S5 S6 mCatch mExit exit)
    // E=15 → CC₂ = 15−13+2 = 4; CC₃ = 3+1 = 4; CC₁ = 3 enclosed regions + 1 outer = 4
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        '!result.success (D1)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → S4 → mExit → exit  [valid input, authService succeeds, session saved]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [invalid input, Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S5 → mCatch → mExit → exit  [authService throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S6 → mCatch → mExit → exit  [authService throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=VALID_LOGIN_INPUT; authService.login resolves MOCK_ADMIN_SESSION; getSession resolves mockSession',
            expected: '{success:true, data:MOCK_ADMIN_SESSION}; session fields assigned; session.save called',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'data={email:"not-an-email", password:""} (fails Zod validation)',
            expected: '{success:false, message:"Validation failed", errors:{...}}; authService.login not called',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'data=VALID_LOGIN_INPUT; authService.login rejects with AuthorizationError("Invalid credentials")',
            expected: '{success:false, message:"Invalid credentials"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'data=VALID_LOGIN_INPUT; authService.login rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (try body), D_TRY(False), and S4; TC2 is the first to execute D1(True) and S2; TC3 is the first to execute D_TRY(True), D2(True), and S5; TC4 is the first to execute D2(False) and S6.',
        '2) D_TRY is an implicit predicate node representing the try-catch exception mechanism. It has one condition ("does the try block throw?"), so 2 TC combinations suffice for MCC: TC1 covers False (no throw) and TC3/TC4 cover True (throws).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-02 · logout
// ─────────────────────────────────────────────────────────────────────────────

const authControllerLogoutWbt: WbtDescriptor = {
    reqId: 'CTRL-02',
    statement: 'logout() — destroys the current session and returns ActionResult<void>; catches AppError and unknown errors distinctly.',
    data: 'Input: none',
    precondition: 'getSession is an injectable mock.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'Returns {success:true, data:undefined} on the happy path; {success:false} with appropriate message on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="session = getSession()\\nsession.destroy()" shape=box];
  S2     [label="return {success:true, data:undefined}" shape=box];
  S3     [label="return {success:false, message:error.message}" shape=box];
  S4     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> S2:n    [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S3:n    [label="True"];
  D2:e    -> S4:n    [label="False"];
  S3:s    -> mCatch:nw;
  S4:s    -> mCatch:ne;
  S2:s    -> mExit:nw;
  mCatch  -> mExit:ne;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function logout(): Promise<ActionResult<void>> {',
        '    try {',
        '        const session = await getSession();',
        '        await session.destroy();',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    // N=10 (start S1 D_TRY S2 D2 S3 S4 mCatch mExit exit)
    // E=11 → CC₂ = 11−10+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 enclosed regions + 1 outer = 3
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: [
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → S2 → mExit → exit  [session destroyed successfully]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S3 → mCatch → mExit → exit  [getSession throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S4 → mCatch → mExit → exit  [getSession throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'getSession resolves mockSession; mockSession.destroy resolves',
            expected: '{success:true, data:undefined}; session.destroy called',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'getSession rejects with AuthorizationError("Session expired")',
            expected: '{success:false, message:"Session expired"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'getSession rejects with Error("Network error")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1, D_TRY(False), and S2; TC2 is the first to execute D_TRY(True), D2(True), and S3; TC3 is the first to execute D2(False) and S4.',
        '2) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers the False branch; TC2 and TC3 cover the True branch.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-03 · createExercise
// CC=4  (D1: validation fails?, D_TRY: try throws?, D2: instanceof AppError?)
// N=12, E=14  →  CC₂ = 14−12+2 = 4; CC₃ = 3+1 = 4; CC₁ = 3 regions+1 outer = 4
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerCreateWbt: WbtDescriptor = {
    reqId: 'CTRL-03',
    statement: 'createExercise(data) — validates input via Zod, delegates to exerciseService.createExercise, and returns an ActionResult<Exercise>.',
    data: 'Input: CreateExerciseInput',
    precondition: 'A CreateExerciseInput object is provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'Returns {success:true, data:exercise} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="result = createExerciseSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await exerciseService.createExercise(result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> S2:n    [label="True"];
  D1:e    -> S3:n    [label="False"];
  S3:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S4:n    [label="True"];
  D2:e    -> S5:n    [label="False"];
  S4:s    -> mCatch:nw;
  S5:s    -> mCatch:ne;
  S2:s    -> mExit:nw;
  mCatch  -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>> {',
        '    const result = createExerciseSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await exerciseService.createExercise(result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        '!result.success (D1)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=VALID_CREATE_INPUT; exerciseService.createExercise resolves MOCK_EXERCISE',
            expected: '{success:true, data:MOCK_EXERCISE}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'data={name:""} (empty name fails Zod min(1)); service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'data=VALID_CREATE_INPUT; exerciseService.createExercise rejects with ConflictError("Exercise name already in use")',
            expected: '{success:false, message:"Exercise name already in use"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'data=VALID_CREATE_INPUT; exerciseService.createExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 first executes S3 and the success return; TC2 first executes D1(True) and S2; TC3 first executes D_TRY(True), D2(True), and S4; TC4 first executes D2(False) and S5.',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3); there is no separate return node on the happy path.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-04 · getExercise
// CC=3  (D_TRY: try throws?, D2: instanceof AppError?)
// N=9, E=10  →  CC₂ = 10−9+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerGetWbt: WbtDescriptor = {
    reqId: 'CTRL-04',
    statement: 'getExercise(id) — delegates to exerciseService.getExercise and returns an ActionResult<Exercise>.',
    data: 'Input: string',
    precondition: 'A non-empty exercise id string is provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'Returns {success:true, data:exercise} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await exerciseService.getExercise(id)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S2:n    [label="True"];
  D2:e    -> S3:n    [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function getExercise(id: string): Promise<ActionResult<Exercise>> {',
        '    try {',
        '        return {success: true, data: await exerciseService.getExercise(id)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: [
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID; exerciseService.getExercise resolves MOCK_EXERCISE',
            expected: '{success:true, data:MOCK_EXERCISE}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=EXERCISE_ID; exerciseService.getExercise rejects with NotFoundError("Exercise not found")',
            expected: '{success:false, message:"Exercise not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID; exerciseService.getExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 first executes the combined call-and-return (S1) on the success path; TC2 first executes D_TRY(True), D2(True), and S2; TC3 first executes D2(False) and S3.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-05 · listExercises
// CC=3  — structurally identical to CTRL-04
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerListWbt: WbtDescriptor = {
    reqId: 'CTRL-05',
    statement: 'listExercises(options?) — delegates to exerciseService.listExercises and returns an ActionResult<PageResult<Exercise>>.',
    data: 'Input: ExerciseListOptions (optional)',
    precondition: 'options is optional. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<PageResult<Exercise>>>',
    postcondition: 'Returns {success:true, data:pageResult} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await exerciseService.listExercises(options)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S2:n    [label="True"];
  D2:e    -> S3:n    [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>> {',
        '    try {',
        '        return {success: true, data: await exerciseService.listExercises(options)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options=undefined; exerciseService.listExercises resolves {items:[MOCK_EXERCISE], total:1}',
            expected: '{success:true, data:{items:[MOCK_EXERCISE], total:1}}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'options=undefined; exerciseService.listExercises rejects with NotFoundError("Not found")',
            expected: '{success:false, message:"Not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'options=undefined; exerciseService.listExercises rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 first executes the combined call-and-return (S1) on the success path; TC2 first executes D_TRY(True), D2(True), and S2; TC3 first executes D2(False) and S3.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-06 · updateExercise
// CC=4  — structurally identical to CTRL-03
// N=12, E=14  →  CC₂=4; CC₃=4; CC₁=4
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerUpdateWbt: WbtDescriptor = {
    reqId: 'CTRL-06',
    statement: 'updateExercise(id, data) — validates input via Zod, delegates to exerciseService.updateExercise, and returns an ActionResult<Exercise>.',
    data: 'Input: id: string, data: UpdateExerciseInput',
    precondition: 'A valid exercise id and UpdateExerciseInput are provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'Returns {success:true, data:exercise} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="result = updateExerciseSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await exerciseService.updateExercise(id, result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> S2:n    [label="True"];
  D1:e    -> S3:n    [label="False"];
  S3:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S4:n    [label="True"];
  D2:e    -> S5:n    [label="False"];
  S4:s    -> mCatch:nw;
  S5:s    -> mCatch:ne;
  S2:s    -> mExit:nw;
  mCatch  -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>> {',
        '    const result = updateExerciseSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await exerciseService.updateExercise(id, result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        '!result.success (D1)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, data=VALID_UPDATE_INPUT; exerciseService.updateExercise resolves MOCK_EXERCISE',
            expected: '{success:true, data:MOCK_EXERCISE}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=EXERCISE_ID, data={name:""} (fails Zod); service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID, data=VALID_UPDATE_INPUT; exerciseService.updateExercise rejects with ConflictError("Name in use")',
            expected: '{success:false, message:"Name in use"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'id=EXERCISE_ID, data=VALID_UPDATE_INPUT; exerciseService.updateExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 first executes S3 and the success return; TC2 first executes D1(True) and S2; TC3 first executes D_TRY(True), D2(True), and S4; TC4 first executes D2(False) and S5.',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3); there is no separate return node on the happy path.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-07 · archiveExercise
// CC=3  — structurally identical to CTRL-04
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerArchiveWbt: WbtDescriptor = {
    reqId: 'CTRL-07',
    statement: 'archiveExercise(id) — delegates to exerciseService.archiveExercise and returns an ActionResult<Exercise>.',
    data: 'Input: string',
    precondition: 'A valid exercise id string is provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'Returns {success:true, data:exercise} with isActive=false on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await exerciseService.archiveExercise(id)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S2:n    [label="True"];
  D2:e    -> S3:n    [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function archiveExercise(id: string): Promise<ActionResult<Exercise>> {',
        '    try {',
        '        return {success: true, data: await exerciseService.archiveExercise(id)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds, exercise archived]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID; exerciseService.archiveExercise resolves MOCK_ARCHIVED_EXERCISE',
            expected: '{success:true, data:MOCK_ARCHIVED_EXERCISE}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=EXERCISE_ID; exerciseService.archiveExercise rejects with NotFoundError("Exercise not found")',
            expected: '{success:false, message:"Exercise not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID; exerciseService.archiveExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 first executes the combined call-and-return (S1) on the success path; TC2 first executes D_TRY(True), D2(True), and S2; TC3 first executes D2(False) and S3.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-08 · unarchiveExercise
// CC=3  — structurally identical to CTRL-04
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerUnarchiveWbt: WbtDescriptor = {
    reqId: 'CTRL-08',
    statement: 'unarchiveExercise(id) — delegates to exerciseService.unarchiveExercise and returns an ActionResult<Exercise>.',
    data: 'Input: string',
    precondition: 'A valid exercise id string is provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Exercise>>',
    postcondition: 'Returns {success:true, data:exercise} with isActive=true on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await exerciseService.unarchiveExercise(id)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  D2:w    -> S2:n    [label="True"];
  D2:e    -> S3:n    [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function unarchiveExercise(id: string): Promise<ActionResult<Exercise>> {',
        '    try {',
        '        return {success: true, data: await exerciseService.unarchiveExercise(id)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds, exercise unarchived]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID; exerciseService.unarchiveExercise resolves MOCK_EXERCISE (isActive:true)',
            expected: '{success:true, data:MOCK_EXERCISE}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=EXERCISE_ID; exerciseService.unarchiveExercise rejects with NotFoundError("Exercise not found")',
            expected: '{success:false, message:"Exercise not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID; exerciseService.unarchiveExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 first executes the combined call-and-return (S1) on the success path; TC2 first executes D_TRY(True), D2(True), and S2; TC3 first executes D2(False) and S3.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-09 · deleteExercise
// CC=3  (D_TRY: try throws?, D2: instanceof AppError?)
// N=10, E=11  →  CC₂ = 11−10+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const exerciseControllerDeleteWbt: WbtDescriptor = {
    reqId: 'CTRL-09',
    statement: 'deleteExercise(id) — delegates to exerciseService.deleteExercise and returns an ActionResult<void>.',
    data: 'Input: string',
    precondition: 'A valid exercise id string is provided. exerciseService is an injectable mock.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'Returns {success:true, data:undefined} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="await exerciseService.deleteExercise(id)" shape=box];
  S2     [label="return {success:true, data:undefined}" shape=box];
  S3     [label="return {success:false, message:error.message}" shape=box];
  S4     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> S2:n    [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  S2:s    -> mExit:nw;
  D2:w    -> S3:n    [label="True"];
  D2:e    -> S4:n    [label="False"];
  S3:s    -> mCatch:nw;
  S4:s    -> mCatch:ne;
  mCatch  -> mExit:ne;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function deleteExercise(id: string): Promise<ActionResult<void>> {',
        '    try {',
        '        await exerciseService.deleteExercise(id);',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → S2 → mExit → exit  [service succeeds, void returned]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S3 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S4 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID; exerciseService.deleteExercise resolves void',
            expected: '{success:true, data:undefined}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=EXERCISE_ID; exerciseService.deleteExercise rejects with ConflictError("Exercise is in use")',
            expected: '{success:false, message:"Exercise is in use"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID; exerciseService.deleteExercise rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 first executes S1 (the await call) and S2 (the explicit return statement, which is separate from S1 in this function); TC2 first executes D_TRY(True), D2(True), and S3; TC3 first executes D2(False) and S4.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-10 · createMember
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂ = 14−12+2 = 4; CC₃ = 3+1 = 4; CC₁ = 3 regions+1 outer = 4
// ─────────────────────────────────────────────────────────────────────────────

const userControllerCreateMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-10',
    statement: 'createMember(data) — validates input via Zod, delegates to userService.createMember, and returns an ActionResult<MemberWithUser>.',
    data: 'Input: CreateMemberInput',
    precondition: 'A CreateMemberInput object is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'Returns {success:true, data:member} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="result = createMemberSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await userService.createMember(result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D1:n;
  D1:w -> S2:n [label="True"]; D1:e -> S3:n [label="False"];
  S3:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S4:n [label="True"]; D2:e -> S5:n [label="False"];
  S4:s -> mCatch:nw; S5:s -> mCatch:ne;
  S2:s -> mExit:nw; mCatch -> mExit:n; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>> {',
        '    const result = createMemberSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await userService.createMember(result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'data=VALID_CREATE_MEMBER_INPUT; userService.createMember resolves MOCK_MEMBER_WITH_USER', expected: '{success:true, data:MOCK_MEMBER_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, true], [false, false]], pathCoverage: [true, false, false, false]},
        {noTc: '2', inputData: 'data={email:"not-an-email"} (fails Zod); service not called', expected: '{success:false, message:"Validation failed", errors:{...}}', statementCoverage: true, conditionDecision: [[true, false], [false, false], [false, false]], pathCoverage: [false, true, false, false]},
        {noTc: '3', inputData: 'data=VALID_CREATE_MEMBER_INPUT; userService.createMember rejects with ConflictError("Email already in use")', expected: '{success:false, message:"Email already in use"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [true, false]], pathCoverage: [false, false, true, false]},
        {noTc: '4', inputData: 'data=VALID_CREATE_MEMBER_INPUT; userService.createMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [false, true]], pathCoverage: [false, false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. It has a single condition ("does the try block throw?"), so 2 TC combinations suffice for MCC: TC1 covers False (no throw) and TC3/TC4 cover True (throws).',
        '4) No Loop Coverage section — the function contains no loops.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-11 · createMemberWithTempPassword
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂=4; CC₃=4; CC₁=4
// ─────────────────────────────────────────────────────────────────────────────

const userControllerCreateMemberWithTempPasswordWbt: WbtDescriptor = {
    reqId: 'CTRL-11',
    statement: 'createMemberWithTempPassword(data) — validates input via Zod, delegates to userService.createMemberWithTempPassword, and returns an ActionResult<MemberWithUserAndTempPassword>.',
    data: 'Input: CreateMemberWithTempPasswordInput',
    precondition: 'A CreateMemberWithTempPasswordInput object (no password field) is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUserAndTempPassword>>',
    postcondition: 'Returns {success:true, data:memberWithTempPassword} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="result = createMemberWithTempPasswordSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await userService.createMemberWithTempPassword(result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D1:n;
  D1:w -> S2:n [label="True"]; D1:e -> S3:n [label="False"];
  S3:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S4:n [label="True"]; D2:e -> S5:n [label="False"];
  S4:s -> mCatch:nw; S5:s -> mCatch:ne;
  S2:s -> mExit:nw; mCatch -> mExit:n; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<ActionResult<MemberWithUserAndTempPassword>> {',
        '    const result = createMemberWithTempPasswordSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await userService.createMemberWithTempPassword(result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'data=VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT; userService.createMemberWithTempPassword resolves MOCK_MEMBER_WITH_TEMP_PASSWORD', expected: '{success:true, data:MOCK_MEMBER_WITH_TEMP_PASSWORD}', statementCoverage: true, conditionDecision: [[false, true], [false, true], [false, false]], pathCoverage: [true, false, false, false]},
        {noTc: '2', inputData: 'data={email:"not-an-email"} (fails Zod); service not called', expected: '{success:false, message:"Validation failed", errors:{...}}', statementCoverage: true, conditionDecision: [[true, false], [false, false], [false, false]], pathCoverage: [false, true, false, false]},
        {noTc: '3', inputData: 'data=VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT; userService.createMemberWithTempPassword rejects with ConflictError("Email already in use")', expected: '{success:false, message:"Email already in use"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [true, false]], pathCoverage: [false, false, true, false]},
        {noTc: '4', inputData: 'data=VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT; userService.createMemberWithTempPassword rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [false, true]], pathCoverage: [false, false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
        '4) No Loop Coverage section — the function contains no loops.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-12 · createAdmin
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂=4; CC₃=4; CC₁=4
// ─────────────────────────────────────────────────────────────────────────────

const userControllerCreateAdminWbt: WbtDescriptor = {
    reqId: 'CTRL-12',
    statement: 'createAdmin(data) — validates input via Zod, delegates to userService.createAdmin, and returns an ActionResult<AdminWithUser>.',
    data: 'Input: CreateAdminInput',
    precondition: 'A CreateAdminInput object is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<AdminWithUser>>',
    postcondition: 'Returns {success:true, data:admin} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="result = createAdminSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await userService.createAdmin(result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D1:n;
  D1:w -> S2:n [label="True"]; D1:e -> S3:n [label="False"];
  S3:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S4:n [label="True"]; D2:e -> S5:n [label="False"];
  S4:s -> mCatch:nw; S5:s -> mCatch:ne;
  S2:s -> mExit:nw; mCatch -> mExit:n; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>> {',
        '    const result = createAdminSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await userService.createAdmin(result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'data=VALID_CREATE_ADMIN_INPUT; userService.createAdmin resolves MOCK_ADMIN_WITH_USER', expected: '{success:true, data:MOCK_ADMIN_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, true], [false, false]], pathCoverage: [true, false, false, false]},
        {noTc: '2', inputData: 'data={email:"not-an-email"} (fails Zod); service not called', expected: '{success:false, message:"Validation failed", errors:{...}}', statementCoverage: true, conditionDecision: [[true, false], [false, false], [false, false]], pathCoverage: [false, true, false, false]},
        {noTc: '3', inputData: 'data=VALID_CREATE_ADMIN_INPUT; userService.createAdmin rejects with ConflictError("Email already in use")', expected: '{success:false, message:"Email already in use"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [true, false]], pathCoverage: [false, false, true, false]},
        {noTc: '4', inputData: 'data=VALID_CREATE_ADMIN_INPUT; userService.createAdmin rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [false, true]], pathCoverage: [false, false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-13 · getMember
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂ = 10−9+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerGetMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-13',
    statement: 'getMember(memberId) — delegates to userService.getMember and returns an ActionResult<MemberWithUser>.',
    data: 'Input: string',
    precondition: 'A non-empty memberId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'Returns {success:true, data:member} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.getMember(memberId)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function getMember(memberId: string): Promise<ActionResult<MemberWithUser>> {',
        '    try {',
        '        return {success: true, data: await userService.getMember(memberId)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'memberId=MEMBER_ID; userService.getMember resolves MOCK_MEMBER_WITH_USER', expected: '{success:true, data:MOCK_MEMBER_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'memberId=MEMBER_ID; userService.getMember rejects with NotFoundError("Member not found")', expected: '{success:false, message:"Member not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'memberId=MEMBER_ID; userService.getMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-14 · getAdmin
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerGetAdminWbt: WbtDescriptor = {
    reqId: 'CTRL-14',
    statement: 'getAdmin(adminId) — delegates to userService.getAdmin and returns an ActionResult<AdminWithUser>.',
    data: 'Input: string',
    precondition: 'A non-empty adminId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<AdminWithUser>>',
    postcondition: 'Returns {success:true, data:admin} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.getAdmin(adminId)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>> {',
        '    try {',
        '        return {success: true, data: await userService.getAdmin(adminId)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'adminId=ADMIN_ID; userService.getAdmin resolves MOCK_ADMIN_WITH_USER', expected: '{success:true, data:MOCK_ADMIN_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'adminId=ADMIN_ID; userService.getAdmin rejects with NotFoundError("Admin not found")', expected: '{success:false, message:"Admin not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'adminId=ADMIN_ID; userService.getAdmin rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-15 · listMembers
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerListMembersWbt: WbtDescriptor = {
    reqId: 'CTRL-15',
    statement: 'listMembers(options?) — delegates to userService.listMembers and returns an ActionResult<PageResult<MemberWithUser>>.',
    data: 'Input: MemberListOptions (optional)',
    precondition: 'options is optional. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<PageResult<MemberWithUser>>>',
    postcondition: 'Returns {success:true, data:pageResult} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.listMembers(options)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>> {',
        '    try {',
        '        return {success: true, data: await userService.listMembers(options)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'options=undefined; userService.listMembers resolves {items:[MOCK_MEMBER_WITH_USER], total:1}', expected: '{success:true, data:{items:[...], total:1}}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'options=undefined; userService.listMembers rejects with NotFoundError("Not found")', expected: '{success:false, message:"Not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'options=undefined; userService.listMembers rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) The optional options parameter introduces no predicate node in the controller CFG; filtering logic is the service layer\'s responsibility.',
        '4) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-16 · listAdmins
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerListAdminsWbt: WbtDescriptor = {
    reqId: 'CTRL-16',
    statement: 'listAdmins(options?) — delegates to userService.listAdmins and returns an ActionResult<PageResult<AdminWithUser>>.',
    data: 'Input: AdminListOptions (optional)',
    precondition: 'options is optional. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<PageResult<AdminWithUser>>>',
    postcondition: 'Returns {success:true, data:pageResult} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.listAdmins(options)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>> {',
        '    try {',
        '        return {success: true, data: await userService.listAdmins(options)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'options=undefined; userService.listAdmins resolves {items:[MOCK_ADMIN_WITH_USER], total:1}', expected: '{success:true, data:{items:[...], total:1}}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'options=undefined; userService.listAdmins rejects with NotFoundError("Not found")', expected: '{success:false, message:"Not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'options=undefined; userService.listAdmins rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) The optional options parameter introduces no predicate node in the controller CFG; filtering logic is the service layer\'s responsibility.',
        '4) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-17 · updateMember
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂=4; CC₃=4; CC₁=4
// ─────────────────────────────────────────────────────────────────────────────

const userControllerUpdateMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-17',
    statement: 'updateMember(memberId, data) — validates input via Zod, delegates to userService.updateMember, and returns an ActionResult<MemberWithUser>.',
    data: 'Input: memberId: string, data: UpdateMemberInput',
    precondition: 'A valid memberId and UpdateMemberInput are provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'Returns {success:true, data:member} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="result = updateMemberSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await userService.updateMember(memberId, result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D1:n;
  D1:w -> S2:n [label="True"]; D1:e -> S3:n [label="False"];
  S3:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S4:n [label="True"]; D2:e -> S5:n [label="False"];
  S4:s -> mCatch:nw; S5:s -> mCatch:ne;
  S2:s -> mExit:nw; mCatch -> mExit:n; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>> {',
        '    const result = updateMemberSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await userService.updateMember(memberId, result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'memberId=MEMBER_ID, data=VALID_UPDATE_MEMBER_INPUT; userService.updateMember resolves MOCK_MEMBER_WITH_USER', expected: '{success:true, data:MOCK_MEMBER_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, true], [false, false]], pathCoverage: [true, false, false, false]},
        {noTc: '2', inputData: 'memberId=MEMBER_ID, data={email:"not-an-email"} (fails Zod); service not called', expected: '{success:false, message:"Validation failed", errors:{...}}', statementCoverage: true, conditionDecision: [[true, false], [false, false], [false, false]], pathCoverage: [false, true, false, false]},
        {noTc: '3', inputData: 'memberId=MEMBER_ID, data=VALID_UPDATE_MEMBER_INPUT; userService.updateMember rejects with NotFoundError("Member not found")', expected: '{success:false, message:"Member not found"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [true, false]], pathCoverage: [false, false, true, false]},
        {noTc: '4', inputData: 'memberId=MEMBER_ID, data=VALID_UPDATE_MEMBER_INPUT; userService.updateMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [false, true]], pathCoverage: [false, false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-18 · updateAdmin
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂=4; CC₃=4; CC₁=4
// ─────────────────────────────────────────────────────────────────────────────

const userControllerUpdateAdminWbt: WbtDescriptor = {
    reqId: 'CTRL-18',
    statement: 'updateAdmin(adminId, data) — validates input via Zod, delegates to userService.updateAdmin, and returns an ActionResult<AdminWithUser>.',
    data: 'Input: adminId: string, data: UpdateAdminInput',
    precondition: 'A valid adminId and UpdateAdminInput are provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<AdminWithUser>>',
    postcondition: 'Returns {success:true, data:admin} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="result = updateAdminSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await userService.updateAdmin(adminId, result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D1:n;
  D1:w -> S2:n [label="True"]; D1:e -> S3:n [label="False"];
  S3:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S4:n [label="True"]; D2:e -> S5:n [label="False"];
  S4:s -> mCatch:nw; S5:s -> mCatch:ne;
  S2:s -> mExit:nw; mCatch -> mExit:n; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>> {',
        '    const result = updateAdminSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await userService.updateAdmin(adminId, result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'adminId=ADMIN_ID, data=VALID_UPDATE_ADMIN_INPUT; userService.updateAdmin resolves MOCK_ADMIN_WITH_USER', expected: '{success:true, data:MOCK_ADMIN_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, true], [false, false]], pathCoverage: [true, false, false, false]},
        {noTc: '2', inputData: 'adminId=ADMIN_ID, data={email:"not-an-email"} (fails Zod); service not called', expected: '{success:false, message:"Validation failed", errors:{...}}', statementCoverage: true, conditionDecision: [[true, false], [false, false], [false, false]], pathCoverage: [false, true, false, false]},
        {noTc: '3', inputData: 'adminId=ADMIN_ID, data=VALID_UPDATE_ADMIN_INPUT; userService.updateAdmin rejects with NotFoundError("Admin not found")', expected: '{success:false, message:"Admin not found"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [true, false]], pathCoverage: [false, false, true, false]},
        {noTc: '4', inputData: 'adminId=ADMIN_ID, data=VALID_UPDATE_ADMIN_INPUT; userService.updateAdmin rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[false, true], [true, false], [false, true]], pathCoverage: [false, false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-19 · suspendMember
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerSuspendMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-19',
    statement: 'suspendMember(memberId) — delegates to userService.suspendMember and returns an ActionResult<MemberWithUser>.',
    data: 'Input: string',
    precondition: 'A valid memberId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'Returns {success:true, data:member} with isActive=false on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.suspendMember(memberId)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>> {',
        '    try {',
        '        return {success: true, data: await userService.suspendMember(memberId)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds, member suspended]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'memberId=MEMBER_ID; userService.suspendMember resolves MOCK_SUSPENDED_MEMBER (isActive:false)', expected: '{success:true, data:MOCK_SUSPENDED_MEMBER}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'memberId=MEMBER_ID; userService.suspendMember rejects with NotFoundError("Member not found")', expected: '{success:false, message:"Member not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'memberId=MEMBER_ID; userService.suspendMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-20 · activateMember
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerActivateMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-20',
    statement: 'activateMember(memberId) — delegates to userService.activateMember and returns an ActionResult<MemberWithUser>.',
    data: 'Input: string',
    precondition: 'A valid memberId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<MemberWithUser>>',
    postcondition: 'Returns {success:true, data:member} with isActive=true on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="return {success:true, data: await userService.activateMember(memberId)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"]; D_TRY:w -> D2:n [label="True"];
  D2:w -> S2:n [label="True"]; D2:e -> S3:n [label="False"];
  S2:s -> mCatch:nw; S3:s -> mCatch:ne;
  mCatch -> mExit:nw; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function activateMember(memberId: string): Promise<ActionResult<MemberWithUser>> {',
        '    try {',
        '        return {success: true, data: await userService.activateMember(memberId)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds, member activated]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'memberId=MEMBER_ID; userService.activateMember resolves MOCK_MEMBER_WITH_USER (isActive:true)', expected: '{success:true, data:MOCK_MEMBER_WITH_USER}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'memberId=MEMBER_ID; userService.activateMember rejects with NotFoundError("Member not found")', expected: '{success:false, message:"Member not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'memberId=MEMBER_ID; userService.activateMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-21 · deleteMember
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=10, E=11  →  CC₂ = 11−10+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerDeleteMemberWbt: WbtDescriptor = {
    reqId: 'CTRL-21',
    statement: 'deleteMember(memberId) — delegates to userService.deleteMember and returns an ActionResult<void>.',
    data: 'Input: string',
    precondition: 'A valid memberId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'Returns {success:true, data:undefined} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="await userService.deleteMember(memberId)" shape=box];
  S2     [label="return {success:true, data:undefined}" shape=box];
  S3     [label="return {success:false, message:error.message}" shape=box];
  S4     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> S2:n [label="False"]; D_TRY:w -> D2:n [label="True"];
  S2:s -> mExit:nw;
  D2:w -> S3:n [label="True"]; D2:e -> S4:n [label="False"];
  S3:s -> mCatch:nw; S4:s -> mCatch:ne;
  mCatch -> mExit:ne; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function deleteMember(memberId: string): Promise<ActionResult<void>> {',
        '    try {',
        '        await userService.deleteMember(memberId);',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → S2 → mExit → exit  [service succeeds, void returned]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S3 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S4 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'memberId=MEMBER_ID; userService.deleteMember resolves void', expected: '{success:true, data:undefined}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'memberId=MEMBER_ID; userService.deleteMember rejects with NotFoundError("Member not found")', expected: '{success:false, message:"Member not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'memberId=MEMBER_ID; userService.deleteMember rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the await call) and S2 (the explicit return statement); TC2 is the first to execute D_TRY(True), D2(True), and S3 (the AppError return); TC3 is the first to execute D2(False) and S4 (the unexpected error return).',
        '2) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC2 and TC3 cover D_TRY=True (throws). Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-22 · deleteAdmin
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=10, E=11  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const userControllerDeleteAdminWbt: WbtDescriptor = {
    reqId: 'CTRL-22',
    statement: 'deleteAdmin(adminId) — delegates to userService.deleteAdmin and returns an ActionResult<void>.',
    data: 'Input: string',
    precondition: 'A valid adminId string is provided. userService is an injectable mock.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'Returns {success:true, data:undefined} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S1     [label="await userService.deleteAdmin(adminId)" shape=box];
  S2     [label="return {success:true, data:undefined}" shape=box];
  S3     [label="return {success:false, message:error.message}" shape=box];
  S4     [label="return {success:false, 'An unexpected error occurred'}" shape=box];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];
  start -> S1:n; S1:s -> D_TRY:n;
  D_TRY:e -> S2:n [label="False"]; D_TRY:w -> D2:n [label="True"];
  S2:s -> mExit:nw;
  D2:w -> S3:n [label="True"]; D2:e -> S4:n [label="False"];
  S3:s -> mCatch:nw; S4:s -> mCatch:ne;
  mCatch -> mExit:ne; mExit -> exit;
}`,
    cfgSourceCode: [
        'export async function deleteAdmin(adminId: string): Promise<ActionResult<void>> {',
        '    try {',
        '        await userService.deleteAdmin(adminId);',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → S2 → mExit → exit  [service succeeds, void returned]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S3 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S4 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {noTc: '1', inputData: 'adminId=ADMIN_ID; userService.deleteAdmin resolves void', expected: '{success:true, data:undefined}', statementCoverage: true, conditionDecision: [[false, true], [false, false]], pathCoverage: [true, false, false]},
        {noTc: '2', inputData: 'adminId=ADMIN_ID; userService.deleteAdmin rejects with NotFoundError("Admin not found")', expected: '{success:false, message:"Admin not found"}', statementCoverage: true, conditionDecision: [[true, false], [true, false]], pathCoverage: [false, true, false]},
        {noTc: '3', inputData: 'adminId=ADMIN_ID; userService.deleteAdmin rejects with Error("Unexpected")', expected: '{success:false, message:"An unexpected error occurred"}', statementCoverage: true, conditionDecision: [[true, false], [false, true]], pathCoverage: [false, false, true]},
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the await call) and S2 (the explicit return statement); TC2 is the first to execute D_TRY(True), D2(True), and S3 (the AppError return); TC3 is the first to execute D2(False) and S4 (the unexpected error return).',
        '2) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC2 and TC3 cover D_TRY=True (throws). Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-23 · createWorkoutSession
// CC=6  (D1: !sessionResult.success?, D2: !exercisesResult.success?,
//        D_FORM: flat.formErrors.length > 0?, D_TRY: try throws?,
//        D3: error instanceof AppError?)
// N=21, E=25  →  CC₂ = 25−21+2 = 6; CC₃ = 5+1 = 6; CC₁ = 5 regions+1 outer = 6
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerCreateWbt: WbtDescriptor = {
    reqId: 'CTRL-23',
    statement: 'createWorkoutSession(data, exercises) — validates session and exercise inputs via two sequential Zod checks, then delegates to workoutSessionService.createWorkoutSession and returns an ActionResult<WorkoutSessionWithExercises>.',
    data: 'Input: CreateWorkoutSessionInput, WorkoutSessionExerciseInput[]',
    precondition: 'A CreateWorkoutSessionInput and an exercises array are provided. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'Returns {success:true, data:session} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  m4     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  m_val  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="sessionResult = createWorkoutSessionSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', session errors}" shape=box];
  S3     [label="exercisesResult = workoutSessionExercisesSchema.safeParse(exercises)" shape=box];
  S4a    [label="flat = z.flattenError(exercisesResult.error)" shape=box];
  S4b    [label="message = flat.formErrors[0]" shape=box];
  S4c    [label="message = 'Invalid exercises'" shape=box];
  S4d    [label="return {success:false, message}" shape=box];
  S5     [label="return {success:true, data: await workoutSessionService.createWorkoutSession(...)}" shape=box];
  S6     [label="return {success:false, message:error.message}" shape=box];
  S7     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!sessionResult.success?" shape=diamond];
  D2     [label="!exercisesResult.success?" shape=diamond];
  D_FORM [label="flat.formErrors.length > 0?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D3     [label="error instanceof AppError?" shape=diamond];

  start  -> S1:n;
  S1:s   -> D1:n;
  D1:w   -> S2:n     [label="True"];
  D1:e   -> S3:n     [label="False"];
  S3:s   -> D2:n;
  D2:w   -> S4a:n    [label="True"];
  D2:e   -> S5:n     [label="False"];
  S4a:s  -> D_FORM:n;
  D_FORM:w -> S4b:n  [label="True"];
  D_FORM:e -> S4c:n  [label="False"];
  S4b:s  -> m4:nw;
  S4c:s  -> m4:ne;
  m4     -> S4d:n;
  S2:s   -> m_val:nw;
  S4d:s  -> m_val:ne;
  m_val  -> mExit:nw;
  S5:s   -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D3:n    [label="True"];
  D3:w   -> S6:n     [label="True"];
  D3:e   -> S7:n     [label="False"];
  S6:s   -> mCatch:nw;
  S7:s   -> mCatch:ne;
  mCatch -> mExit:n;
  mExit  -> exit;
}`,
    cfgSourceCode: [
        'export async function createWorkoutSession(',
        '    data: CreateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseInput[],',
        '): Promise<ActionResult<WorkoutSessionWithExercises>> {',
        '    const sessionResult = createWorkoutSessionSchema.safeParse(data);',
        '    if (!sessionResult.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(sessionResult.error).fieldErrors};',
        '    }',
        '    const exercisesResult = workoutSessionExercisesSchema.safeParse(exercises);',
        '    if (!exercisesResult.success) {',
        '        const flat = z.flattenError(exercisesResult.error);',
        '        const message = flat.formErrors.length > 0 ? flat.formErrors[0] : \'Invalid exercises\';',
        '        return {success: false, message};',
        '    }',
        '    try {',
        '        return {success: true, data: await workoutSessionService.createWorkoutSession(sessionResult.data, exercisesResult.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 6, cc2EdgeNodePlus2: 6, cc3PredicatePlus1: 6},
    predicates: [
        '!sessionResult.success (D1)',
        '!exercisesResult.success (D2)',
        'flat.formErrors.length > 0 (D_FORM)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D3)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(F) → mExit → exit  [valid session & exercises, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → m_val → mExit → exit  [session validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D2(T) → S4a → D_FORM(T) → S4b → m4 → S4d → m_val → mExit → exit  [exercises fail with array-level error]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D2(T) → S4a → D_FORM(F) → S4c → m4 → S4d → m_val → mExit → exit  [exercises fail with item-level error, fallback message]'},
        {id: '5', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(T) → D3(T) → S6 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '6', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(T) → D3(F) → S7 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=VALID_SESSION_INPUT, exercises=VALID_EXERCISES; service.createWorkoutSession resolves MOCK_SESSION_WITH_EXERCISES',
            expected: '{success:true, data:MOCK_SESSION_WITH_EXERCISES}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [false, false]],
            pathCoverage: [true, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'data={date:"invalid"} (fails session schema); service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'data=VALID_SESSION_INPUT, exercises=[] (empty array, fails min(1)); service not called',
            expected: '{success:false, message:"At least one exercise is required"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'data=VALID_SESSION_INPUT, exercises=[{exerciseId:"", sets:3, reps:10, weight:20}] (item fails, no array-level error); service not called',
            expected: '{success:false, message:"Invalid exercises"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false],
        },
        {
            noTc: '5',
            inputData: 'data=VALID_SESSION_INPUT, exercises=VALID_EXERCISES; service.createWorkoutSession rejects with NotFoundError("Member not found")',
            expected: '{success:false, message:"Member not found"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, true, false],
        },
        {
            noTc: '6',
            inputData: 'data=VALID_SESSION_INPUT, exercises=VALID_EXERCISES; service.createWorkoutSession rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all six TCs: TC1 first executes S3, D2(False), S5, and D_TRY(False); TC2 first executes D1(True) and S2; TC3 first executes D2(True), S4a, D_FORM(True), S4b, m4, and S4d; TC4 first executes D_FORM(False) and S4c; TC5 first executes D_TRY(True), D3(True), and S6; TC6 first executes D3(False) and S7.',
        '2) D_FORM represents the inline ternary expression `flat.formErrors.length > 0 ? flat.formErrors[0] : \'Invalid exercises\'`. It is only reachable when D2=True (exercises fail). TC3 triggers it with an empty exercises array, which causes the array-level min(1) constraint to fire and populate flat.formErrors. TC4 triggers the False branch by passing one item with an invalid exerciseId field; the item-level error appears in flat.fieldErrors, leaving flat.formErrors empty and causing the fallback message.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC5 and TC6 cover D_TRY=True. Full MCC is achieved across the six TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-24 · getWorkoutSession
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂ = 10−9+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerGetWbt: WbtDescriptor = {
    reqId: 'CTRL-24',
    statement: 'getWorkoutSession(workoutSessionId) — delegates to workoutSessionService.getWorkoutSession and returns an ActionResult<WorkoutSessionWithExercises>.',
    data: 'Input: string',
    precondition: 'A non-empty workoutSessionId string is provided. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'Returns {success:true, data:session} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await workoutSessionService.getWorkoutSession(workoutSessionId)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n     [label="True"];
  D2:w    -> S2:n     [label="True"];
  D2:e    -> S3:n     [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>> {',
        '    try {',
        '        return {success: true, data: await workoutSessionService.getWorkoutSession(workoutSessionId)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID; service.getWorkoutSession resolves MOCK_SESSION_WITH_EXERCISES',
            expected: '{success:true, data:MOCK_SESSION_WITH_EXERCISES}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'workoutSessionId=SESSION_ID; service.getWorkoutSession rejects with NotFoundError("Workout session not found")',
            expected: '{success:false, message:"Workout session not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'workoutSessionId=SESSION_ID; service.getWorkoutSession rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-25 · listMemberWorkoutSessions
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=9, E=10  →  CC₂=3; CC₃=3; CC₁=3
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerListWbt: WbtDescriptor = {
    reqId: 'CTRL-25',
    statement: 'listMemberWorkoutSessions(memberId, options?) — delegates to workoutSessionService.listMemberWorkoutSessions and returns an ActionResult<PageResult<WorkoutSessionWithExercises>>.',
    data: 'Input: memberId: string, options?: WorkoutSessionListOptions',
    precondition: 'A non-empty memberId is provided; options is optional. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>>',
    postcondition: 'Returns {success:true, data:pageResult} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="return {success:true, data: await workoutSessionService.listMemberWorkoutSessions(memberId, options)}" shape=box];
  S2     [label="return {success:false, message:error.message}" shape=box];
  S3     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n     [label="True"];
  D2:w    -> S2:n     [label="True"];
  D2:e    -> S3:n     [label="False"];
  S2:s    -> mCatch:nw;
  S3:s    -> mCatch:ne;
  mCatch  -> mExit:nw;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function listMemberWorkoutSessions(',
        '    memberId: string,',
        '    options?: WorkoutSessionListOptions,',
        '): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>> {',
        '    try {',
        '        return {success: true, data: await workoutSessionService.listMemberWorkoutSessions(memberId, options)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) return {success: false, message: error.message};',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → mExit → exit  [service succeeds]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S2 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S3 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, options=undefined; service resolves {items:[MOCK_SESSION_WITH_EXERCISES], total:1}',
            expected: '{success:true, data:{items:[...], total:1}}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=MEMBER_ID, options=undefined; service rejects with NotFoundError("Member not found")',
            expected: '{success:false, message:"Member not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'memberId=MEMBER_ID, options=undefined; service rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the combined service call and success return) via D_TRY(False); TC2 is the first to execute D_TRY(True), D2(True), and S2 (the AppError return); TC3 is the first to execute D2(False) and S3 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S1) — there is no separate return node on the happy path.',
        '3) The optional options parameter introduces no predicate node in the controller CFG; its propagation to the service layer is unconditional.',
        '4) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC2 and TC3 cover D_TRY=True. Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-26 · updateWorkoutSession
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=12, E=14  →  CC₂ = 14−12+2 = 4; CC₃ = 3+1 = 4; CC₁ = 3 regions+1 outer = 4
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerUpdateWbt: WbtDescriptor = {
    reqId: 'CTRL-26',
    statement: 'updateWorkoutSession(workoutSessionId, data) — validates session input via Zod, delegates to workoutSessionService.updateWorkoutSession, and returns an ActionResult<WorkoutSession>.',
    data: 'Input: workoutSessionId: string, data: UpdateWorkoutSessionInput',
    precondition: 'A valid workoutSessionId and UpdateWorkoutSessionInput are provided. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<WorkoutSession>>',
    postcondition: 'Returns {success:true, data:session} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="result = updateWorkoutSessionSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="return {success:true, data: await workoutSessionService.updateWorkoutSession(workoutSessionId, result.data)}" shape=box];
  S4     [label="return {success:false, message:error.message}" shape=box];
  S5     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> S2:n     [label="True"];
  D1:e    -> S3:n     [label="False"];
  S3:s    -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D2:n     [label="True"];
  D2:w    -> S4:n     [label="True"];
  D2:e    -> S5:n     [label="False"];
  S4:s    -> mCatch:nw;
  S5:s    -> mCatch:ne;
  S2:s    -> mExit:nw;
  mCatch  -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function updateWorkoutSession(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '): Promise<ActionResult<WorkoutSession>> {',
        '    const result = updateWorkoutSessionSchema.safeParse(data);',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        return {success: true, data: await workoutSessionService.updateWorkoutSession(workoutSessionId, result.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: ['!result.success (D1)', 'try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → mExit → exit  [valid input, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S4 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S5 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT; service.updateWorkoutSession resolves MOCK_SESSION',
            expected: '{success:true, data:MOCK_SESSION}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'workoutSessionId=SESSION_ID, data={date:"invalid-date"} (fails schema); service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT; service.updateWorkoutSession rejects with NotFoundError("Workout session not found")',
            expected: '{success:false, message:"Workout session not found"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT; service.updateWorkoutSession rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the combined service call and success return) and reach D_TRY(False); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S4 (the AppError return); TC4 is the first to execute D2(False) and S5 (the unexpected error return).',
        '2) D_TRY(F) routes directly to mExit because the service call and the success return are a single combined statement (S3) — there is no separate return node on the happy path.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-27 · updateWorkoutSessionWithExercises
// CC=6  (D1: !sessionResult.success?, D2: !exercisesResult.success?,
//        D_FORM: flat.formErrors.length > 0?, D_TRY: try throws?,
//        D3: error instanceof AppError?)
// N=21, E=25  →  CC₂=6; CC₃=6; CC₁=6
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerUpdateWithExercisesWbt: WbtDescriptor = {
    reqId: 'CTRL-27',
    statement: 'updateWorkoutSessionWithExercises(workoutSessionId, data, exercises) — validates session and exercise update inputs via two sequential Zod checks, then delegates to workoutSessionService.updateWorkoutSessionWithExercises and returns an ActionResult<WorkoutSessionWithExercises>.',
    data: 'Input: workoutSessionId: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'A valid workoutSessionId, UpdateWorkoutSessionInput, and exercises array are provided. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<WorkoutSessionWithExercises>>',
    postcondition: 'Returns {success:true, data:session} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  m4     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  m_val  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="sessionResult = updateWorkoutSessionSchema.safeParse(data)" shape=box];
  S2     [label="return {success:false, 'Validation failed', session errors}" shape=box];
  S3     [label="exercisesResult = workoutSessionExercisesUpdateSchema.safeParse(exercises)" shape=box];
  S4a    [label="flat = z.flattenError(exercisesResult.error)" shape=box];
  S4b    [label="message = flat.formErrors[0]" shape=box];
  S4c    [label="message = 'Invalid exercises'" shape=box];
  S4d    [label="return {success:false, message}" shape=box];
  S5     [label="return {success:true, data: await workoutSessionService.updateWorkoutSessionWithExercises(...)}" shape=box];
  S6     [label="return {success:false, message:error.message}" shape=box];
  S7     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!sessionResult.success?" shape=diamond];
  D2     [label="!exercisesResult.success?" shape=diamond];
  D_FORM [label="flat.formErrors.length > 0?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D3     [label="error instanceof AppError?" shape=diamond];

  start  -> S1:n;
  S1:s   -> D1:n;
  D1:w   -> S2:n     [label="True"];
  D1:e   -> S3:n     [label="False"];
  S3:s   -> D2:n;
  D2:w   -> S4a:n    [label="True"];
  D2:e   -> S5:n     [label="False"];
  S4a:s  -> D_FORM:n;
  D_FORM:w -> S4b:n  [label="True"];
  D_FORM:e -> S4c:n  [label="False"];
  S4b:s  -> m4:nw;
  S4c:s  -> m4:ne;
  m4     -> S4d:n;
  S2:s   -> m_val:nw;
  S4d:s  -> m_val:ne;
  m_val  -> mExit:nw;
  S5:s   -> D_TRY:n;
  D_TRY:e -> mExit:ne [label="False"];
  D_TRY:w -> D3:n    [label="True"];
  D3:w   -> S6:n     [label="True"];
  D3:e   -> S7:n     [label="False"];
  S6:s   -> mCatch:nw;
  S7:s   -> mCatch:ne;
  mCatch -> mExit:n;
  mExit  -> exit;
}`,
    cfgSourceCode: [
        'export async function updateWorkoutSessionWithExercises(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseUpdateInput[],',
        '): Promise<ActionResult<WorkoutSessionWithExercises>> {',
        '    const sessionResult = updateWorkoutSessionSchema.safeParse(data);',
        '    if (!sessionResult.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(sessionResult.error).fieldErrors};',
        '    }',
        '    const exercisesResult = workoutSessionExercisesUpdateSchema.safeParse(exercises);',
        '    if (!exercisesResult.success) {',
        '        const flat = z.flattenError(exercisesResult.error);',
        '        const message = flat.formErrors.length > 0 ? flat.formErrors[0] : \'Invalid exercises\';',
        '        return {success: false, message};',
        '    }',
        '    try {',
        '        return {success: true, data: await workoutSessionService.updateWorkoutSessionWithExercises(workoutSessionId, sessionResult.data, exercisesResult.data)};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 6, cc2EdgeNodePlus2: 6, cc3PredicatePlus1: 6},
    predicates: [
        '!sessionResult.success (D1)',
        '!exercisesResult.success (D2)',
        'flat.formErrors.length > 0 (D_FORM)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D3)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(F) → mExit → exit  [valid session & exercises, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → m_val → mExit → exit  [session validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D2(T) → S4a → D_FORM(T) → S4b → m4 → S4d → m_val → mExit → exit  [exercises fail with array-level error]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D2(T) → S4a → D_FORM(F) → S4c → m4 → S4d → m_val → mExit → exit  [exercises fail with item-level error, fallback message]'},
        {id: '5', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(T) → D3(T) → S6 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '6', description: 'start → S1 → D1(F) → S3 → D2(F) → S5 → D_TRY(T) → D3(F) → S7 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT, exercises=VALID_UPDATE_EXERCISES; service resolves MOCK_SESSION_WITH_EXERCISES',
            expected: '{success:true, data:MOCK_SESSION_WITH_EXERCISES}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [false, false]],
            pathCoverage: [true, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'workoutSessionId=SESSION_ID, data={date:"invalid-date"} (fails session schema), exercises=VALID_UPDATE_EXERCISES; service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT, exercises=[] (empty array, fails min(1)); service not called',
            expected: '{success:false, message:"At least one exercise is required"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT, exercises=[{exerciseId:"", sets:4, reps:12, weight:22.5}] (item fails, no array-level error); service not called',
            expected: '{success:false, message:"Invalid exercises"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false],
        },
        {
            noTc: '5',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT, exercises=VALID_UPDATE_EXERCISES; service rejects with NotFoundError("Workout session not found")',
            expected: '{success:false, message:"Workout session not found"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, true, false],
        },
        {
            noTc: '6',
            inputData: 'workoutSessionId=SESSION_ID, data=VALID_UPDATE_SESSION_INPUT, exercises=VALID_UPDATE_EXERCISES; service rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all six TCs: TC1 first executes S3, D2(False), S5, and D_TRY(False); TC2 first executes D1(True) and S2; TC3 first executes D2(True), S4a, D_FORM(True), S4b, m4, and S4d; TC4 first executes D_FORM(False) and S4c; TC5 first executes D_TRY(True), D3(True), and S6; TC6 first executes D3(False) and S7.',
        '2) This function has two sequential validation gates — one for the session data (updateWorkoutSessionSchema) and one for the exercises list (workoutSessionExercisesUpdateSchema) — producing CC=6, identical in structure to createWorkoutSession (CTRL-23).',
        '3) D_FORM represents the inline ternary expression `flat.formErrors.length > 0 ? flat.formErrors[0] : \'Invalid exercises\'`. It is only reachable when D2=True. TC3 triggers D_FORM=True with an empty exercises array (fails the array-level min(1) constraint, populating flat.formErrors). TC4 triggers D_FORM=False by passing one item with an invalid exerciseId field (item-level error goes to flat.fieldErrors, leaving flat.formErrors empty).',
        '4) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False; TC5 and TC6 cover D_TRY=True. Full MCC is achieved across the six TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-28 · deleteWorkoutSession
// CC=3  (D_TRY: try throws?, D2: error instanceof AppError?)
// N=10, E=11  →  CC₂ = 11−10+2 = 3; CC₃ = 2+1 = 3; CC₁ = 2 regions+1 outer = 3
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionControllerDeleteWbt: WbtDescriptor = {
    reqId: 'CTRL-28',
    statement: 'deleteWorkoutSession(workoutSessionId) — delegates to workoutSessionService.deleteWorkoutSession and returns an ActionResult<void>.',
    data: 'Input: string',
    precondition: 'A valid workoutSessionId string is provided. workoutSessionService is an injectable mock.',
    results: 'Output: Promise<ActionResult<void>>',
    postcondition: 'Returns {success:true, data:undefined} on success; {success:false} on AppError or unknown error.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="await workoutSessionService.deleteWorkoutSession(workoutSessionId)" shape=box];
  S2     [label="return {success:true, data:undefined}" shape=box];
  S3     [label="return {success:false, message:error.message}" shape=box];
  S4     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D_TRY:n;
  D_TRY:e -> S2:n    [label="False"];
  D_TRY:w -> D2:n    [label="True"];
  S2:s    -> mExit:nw;
  D2:w    -> S3:n    [label="True"];
  D2:e    -> S4:n    [label="False"];
  S3:s    -> mCatch:nw;
  S4:s    -> mCatch:ne;
  mCatch  -> mExit:ne;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>> {',
        '    try {',
        '        await workoutSessionService.deleteWorkoutSession(workoutSessionId);',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) { return {success: false, message: error.message}; }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: ['try block throws (D_TRY)', 'error instanceof AppError (D2)'],
    paths: [
        {id: '1', description: 'start → S1 → D_TRY(F) → S2 → mExit → exit  [service succeeds, void returned]'},
        {id: '2', description: 'start → S1 → D_TRY(T) → D2(T) → S3 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '3', description: 'start → S1 → D_TRY(T) → D2(F) → S4 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID; service.deleteWorkoutSession resolves void',
            expected: '{success:true, data:undefined}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'workoutSessionId=SESSION_ID; service.deleteWorkoutSession rejects with NotFoundError("Workout session not found")',
            expected: '{success:false, message:"Workout session not found"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'workoutSessionId=SESSION_ID; service.deleteWorkoutSession rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all three TCs: TC1 is the first to execute S1 (the await call) and S2 (the explicit return statement); TC2 is the first to execute D_TRY(True), D2(True), and S3 (the AppError return); TC3 is the first to execute D2(False) and S4 (the unexpected error return).',
        '2) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC2 and TC3 cover D_TRY=True (throws). Full MCC is achieved across the three TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// CTRL-29 · getMemberProgressReport
// CC=4  (D1: !result.success?, D_TRY: try throws?, D2: error instanceof AppError?)
// N=13, E=15  →  CC₂ = 15−13+2 = 4; CC₃ = 3+1 = 4; CC₁ = 3 regions+1 outer = 4
// ─────────────────────────────────────────────────────────────────────────────

const reportControllerGetMemberProgressReportWbt: WbtDescriptor = {
    reqId: 'CTRL-29',
    statement: 'getMemberProgressReport(memberId, startDate, endDate) — validates the three parameters via Zod, delegates to reportService.getMemberProgressReport with Date-converted arguments, and returns an ActionResult<Report>.',
    data: 'Input: memberId: string, startDate: string, endDate: string',
    precondition: 'Three non-empty strings are provided. reportService is an injectable mock.',
    results: 'Output: Promise<ActionResult<Report>>',
    postcondition: 'Returns {success:true, data:report} on the happy path; {success:false} with appropriate message/errors on all failure paths.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  mCatch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  S1     [label="result = memberProgressReportSchema.safeParse({memberId, startDate, endDate})" shape=box];
  S2     [label="return {success:false, 'Validation failed', errors}" shape=box];
  S3     [label="report = await reportService.getMemberProgressReport(memberId, new Date(startDate), new Date(endDate))" shape=box];
  S4     [label="return {success:true, data:report}" shape=box];
  S5     [label="return {success:false, message:error.message}" shape=box];
  S6     [label="return {success:false, 'An unexpected error occurred'}" shape=box];

  D1     [label="!result.success?" shape=diamond];
  D_TRY  [label="try block throws?" shape=diamond];
  D2     [label="error instanceof AppError?" shape=diamond];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> S2:n     [label="True"];
  D1:e    -> S3:n     [label="False"];
  S3:s    -> D_TRY:n;
  D_TRY:e -> S4:n     [label="False"];
  D_TRY:w -> D2:n     [label="True"];
  S4:s    -> mExit:ne;
  S2:s    -> mExit:nw;
  D2:w    -> S5:n     [label="True"];
  D2:e    -> S6:n     [label="False"];
  S5:s    -> mCatch:nw;
  S6:s    -> mCatch:ne;
  mCatch  -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export async function getMemberProgressReport(',
        '    memberId: string,',
        '    startDate: string,',
        '    endDate: string,',
        '): Promise<ActionResult<Report>> {',
        '    const result = memberProgressReportSchema.safeParse({memberId, startDate, endDate});',
        '    if (!result.success) {',
        '        return {success: false, message: \'Validation failed\', errors: z.flattenError(result.error).fieldErrors};',
        '    }',
        '    try {',
        '        const report = await reportService.getMemberProgressReport(',
        '            result.data.memberId,',
        '            new Date(result.data.startDate),',
        '            new Date(result.data.endDate),',
        '        );',
        '        return {success: true, data: report};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        '        return {success: false, message: \'An unexpected error occurred\'};',
        '    }',
        '}',
    ],
    // N=13 (start S1 D1 S2 S3 D_TRY S4 D2 S5 S6 mCatch mExit exit)
    // E=15: start→S1, S1→D1, D1→S2, D1→S3, S3→D_TRY, D_TRY→S4, D_TRY→D2,
    //        S4→mExit, S2→mExit, D2→S5, D2→S6, S5→mCatch, S6→mCatch,
    //        mCatch→mExit, mExit→exit
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        '!result.success (D1)',
        'try block throws (D_TRY)',
        'error instanceof AppError (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S3 → D_TRY(F) → S4 → mExit → exit  [valid inputs, service succeeds]'},
        {id: '2', description: 'start → S1 → D1(T) → S2 → mExit → exit  [Zod validation fails]'},
        {id: '3', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(T) → S5 → mCatch → mExit → exit  [service throws AppError]'},
        {id: '4', description: 'start → S1 → D1(F) → S3 → D_TRY(T) → D2(F) → S6 → mCatch → mExit → exit  [service throws unknown Error]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, startDate="2024-01-01", endDate="2024-03-31"; service resolves MOCK_REPORT',
            expected: '{success:true, data:MOCK_REPORT}; service called with (MEMBER_ID, new Date("2024-01-01"), new Date("2024-03-31"))',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=MEMBER_ID, startDate="not-a-date", endDate="2024-03-31" (startDate fails isoDateRegex); service not called',
            expected: '{success:false, message:"Validation failed", errors:{...}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'memberId=MEMBER_ID, startDate="2024-01-01", endDate="2024-03-31"; service rejects with NotFoundError("Member not found")',
            expected: '{success:false, message:"Member not found"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'memberId=MEMBER_ID, startDate="2024-01-01", endDate="2024-03-31"; service rejects with Error("Unexpected")',
            expected: '{success:false, message:"An unexpected error occurred"}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to execute S3 (the service call), D_TRY(False), and S4 (the explicit success return); TC2 is the first to execute D1(True) and S2 (the validation error return); TC3 is the first to execute D_TRY(True), D2(True), and S5 (the AppError return); TC4 is the first to execute D2(False) and S6 (the unexpected error return).',
        '2) The controller converts the validated date strings to Date objects using new Date() before passing them to the service. TC1\'s toHaveBeenCalledWith assertion verifies that this conversion is performed correctly by comparing against the expected Date instances.',
        '3) D_TRY is an implicit predicate node representing the try-catch exception mechanism. TC1 covers D_TRY=False (no throw); TC3 and TC4 cover D_TRY=True (throws). Full MCC is achieved across the four TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('Generating controller WBT forms…');

    const AUTH_CTRL = path.join(BASE, 'auth-controller');
    await writeWbt(authControllerLoginWbt, path.join(AUTH_CTRL, 'login-wbt-form.xlsx'));
    await writeWbt(authControllerLogoutWbt, path.join(AUTH_CTRL, 'logout-wbt-form.xlsx'));

    const EXERCISE_CTRL = path.join(BASE, 'exercise-controller');
    await writeWbt(exerciseControllerCreateWbt, path.join(EXERCISE_CTRL, 'createExercise-wbt-form.xlsx'));
    await writeWbt(exerciseControllerGetWbt, path.join(EXERCISE_CTRL, 'getExercise-wbt-form.xlsx'));
    await writeWbt(exerciseControllerListWbt, path.join(EXERCISE_CTRL, 'listExercises-wbt-form.xlsx'));
    await writeWbt(exerciseControllerUpdateWbt, path.join(EXERCISE_CTRL, 'updateExercise-wbt-form.xlsx'));
    await writeWbt(exerciseControllerArchiveWbt, path.join(EXERCISE_CTRL, 'archiveExercise-wbt-form.xlsx'));
    await writeWbt(exerciseControllerUnarchiveWbt, path.join(EXERCISE_CTRL, 'unarchiveExercise-wbt-form.xlsx'));
    await writeWbt(exerciseControllerDeleteWbt, path.join(EXERCISE_CTRL, 'deleteExercise-wbt-form.xlsx'));

    const USER_CTRL = path.join(BASE, 'user-controller');
    await writeWbt(userControllerCreateMemberWbt, path.join(USER_CTRL, 'createMember-wbt-form.xlsx'));
    await writeWbt(userControllerCreateMemberWithTempPasswordWbt, path.join(USER_CTRL, 'createMemberWithTempPassword-wbt-form.xlsx'));
    await writeWbt(userControllerCreateAdminWbt, path.join(USER_CTRL, 'createAdmin-wbt-form.xlsx'));
    await writeWbt(userControllerGetMemberWbt, path.join(USER_CTRL, 'getMember-wbt-form.xlsx'));
    await writeWbt(userControllerGetAdminWbt, path.join(USER_CTRL, 'getAdmin-wbt-form.xlsx'));
    await writeWbt(userControllerListMembersWbt, path.join(USER_CTRL, 'listMembers-wbt-form.xlsx'));
    await writeWbt(userControllerListAdminsWbt, path.join(USER_CTRL, 'listAdmins-wbt-form.xlsx'));
    await writeWbt(userControllerUpdateMemberWbt, path.join(USER_CTRL, 'updateMember-wbt-form.xlsx'));
    await writeWbt(userControllerSuspendMemberWbt, path.join(USER_CTRL, 'suspendMember-wbt-form.xlsx'));
    await writeWbt(userControllerActivateMemberWbt, path.join(USER_CTRL, 'activateMember-wbt-form.xlsx'));
    await writeWbt(userControllerUpdateAdminWbt, path.join(USER_CTRL, 'updateAdmin-wbt-form.xlsx'));
    await writeWbt(userControllerDeleteMemberWbt, path.join(USER_CTRL, 'deleteMember-wbt-form.xlsx'));
    await writeWbt(userControllerDeleteAdminWbt, path.join(USER_CTRL, 'deleteAdmin-wbt-form.xlsx'));

    const WS_CTRL = path.join(BASE, 'workout-session-controller');
    await writeWbt(workoutSessionControllerCreateWbt, path.join(WS_CTRL, 'createWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionControllerGetWbt, path.join(WS_CTRL, 'getWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionControllerListWbt, path.join(WS_CTRL, 'listMemberWorkoutSessions-wbt-form.xlsx'));
    await writeWbt(workoutSessionControllerUpdateWbt, path.join(WS_CTRL, 'updateWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionControllerUpdateWithExercisesWbt, path.join(WS_CTRL, 'updateWorkoutSessionWithExercises-wbt-form.xlsx'));
    await writeWbt(workoutSessionControllerDeleteWbt, path.join(WS_CTRL, 'deleteWorkoutSession-wbt-form.xlsx'));

    const REPORT_CTRL = path.join(BASE, 'report-controller');
    await writeWbt(reportControllerGetMemberProgressReportWbt, path.join(REPORT_CTRL, 'getMemberProgressReport-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });