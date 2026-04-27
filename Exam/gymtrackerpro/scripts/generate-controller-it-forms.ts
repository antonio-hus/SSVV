import * as path from 'path';
import {writeIt, ItDescriptor} from './generate-it-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'controller', '__tests__', 'it');

const SHARED_REMARKS = [
    'Run:  npm run test:integration',
    'Tear down:  npm run test:integration:down',
    'All service and repository singletons are instantiated and accessed via the lib/di module, which configures them to use the shared PrismaClient instance.',
];

// ── Descriptors ───────────────────────────────────────────────────────────────

const authControllerLoginActionIt: ItDescriptor = {
    reqId: 'CTRL-01',
    statement: 'login(data: LoginUserInput): Promise<ActionResult<SessionData>> - validates input, delegates to AuthService, writes the returned session data into the session store, and returns an ActionResult.',
    data: 'data: LoginUserInput  { email: string, password: string }',
    precondition: 'Database may or may not contain a user matching the supplied email. Session store is empty.',
    results: 'ActionResult<SessionData> - { success: true, data: SessionData } on success. { success: false, message, errors? } on validation failure or any thrown error.',
    postcondition: 'No database rows are inserted, updated, or deleted. On success, the session is populated with all SessionData fields and saved. On any error path the session is not written.',
    remarks: [
        ...SHARED_REMARKS,
        'getSession() is mocked as it calls cookies() from next/headers which is a Next.js request-context primitive unavailable in Jest; the mock returns a controlled session object in its place.'
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'export async function login(data: LoginUserInput): Promise<ActionResult<SessionData>> {',
        '    const result = loginUserSchema.safeParse(data);',
        '    if (!result.success) {',
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        '    }',
        '    try {',
        '        const sessionData = await authService.login(result.data);',
        '        const session = await getSession();',
        '        session.userId   = sessionData.userId;',
        '        session.email    = sessionData.email;',
        '        session.fullName = sessionData.fullName;',
        '        session.role     = sessionData.role;',
        '        session.memberId = sessionData.memberId;',
        '        session.adminId  = sessionData.adminId;',
        '        session.isActive = sessionData.isActive;',
        '        await session.save();',
        '        return {success: true, data: sessionData};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        "        return {success: false, message: 'An unexpected error occurred'};",
        '    }',
        '}',
    ],

    moduleDot: `digraph loginAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  action [label="login()\\nserver action"];

  subgraph cluster_zod {
    label="zod";
    safeParse [label="loginUserSchema\\n.safeParse()"];
  }

  subgraph cluster_authservice {
    label="AuthService";
    authLogin [label="authService\\n.login()"];
  }

  subgraph cluster_userrepo {
    label="UserRepository";
    findByEmail [label="userRepository\\n.findByEmail()"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()\\n{ include: member, admin }"];
  }

  subgraph cluster_bcrypt {
    label="bcryptjs";
    compare [label="bcrypt\\n.compare()"];
  }

  subgraph cluster_session {
    label="lib/session (mocked)";
    getSession  [label="getSession()"];
    sessionSave [label="session\\n.save()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    AuthorizationError;
    NotFoundError -> AppError [label="extends"];
    AuthorizationError -> AppError [label="extends"];
  }

  action      -> safeParse    [label="validate input"];
  action      -> authLogin    [label="verify credentials"];
  authLogin   -> findByEmail  [label="look up by email"];
  findByEmail -> findUnique   [label="query with relations"];
  authLogin   -> compare      [label="verify password"];
  action      -> getSession   [label="open session (mocked)"];
  getSession  -> sessionSave  [label="persist fields"];
  action      -> AppError     [label="catches (auth error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member user seeded via userService.createMember (from lib/di).\nmemberInput: { email: "member@gym.test", fullName: "Test Member", phone: "+40700000000", dateOfBirth: "1990-01-01", password: "ValidPass123!", membershipStart: "2024-01-01" }.\nmockSession satisfies Partial<SessionData> with save() and destroy() jest.fn().\nInput: { email: "member@gym.test", password: "ValidPass123!" }',
            act: 'login(input)',
            expectedReturn: '{ success: true, data: { userId, email, fullName, role: MEMBER, memberId, isActive: true, adminId: undefined } }',
            expectedDbState: 'No change. Session fields match SessionData and save() called once.',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nInput: { email: "not-an-email", password: "weak" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email: [...], password: [...] } }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nInput: { email: "ghost@gym.test", password: "ValidPass123!" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Invalid email or password" }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member user seeded via userService.createMember (from lib/di) with password "ValidPass123!".\nInput: { email: "member@gym.test", password: "WrongPass999!" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Invalid email or password" }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
    ],
};

// ── logout ────────────────────────────────────────────────────────────────────

const authControllerLogoutActionIt: ItDescriptor = {
    reqId: 'CTRL-02',
    statement: 'logout(): Promise<ActionResult<void>> - destroys the current session and returns a success result.',
    data: 'none',
    precondition: 'A session exists and can be retrieved via getSession().',
    results: 'ActionResult<void> - { success: true, data: undefined } on success. { success: false, message } if session destruction throws.',
    postcondition: 'No database rows are inserted, updated, or deleted. On success, the session is destroyed.',
    remarks: [
        ...SHARED_REMARKS,
        'getSession() is mocked as it calls cookies() from next/headers which is a Next.js request-context primitive unavailable in Jest; the mock returns a controlled session object in its place.'
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'export async function logout(): Promise<ActionResult<void>> {',
        '    try {',
        '        const session = await getSession();',
        '        await session.destroy();',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        "        return {success: false, message: 'An unexpected error occurred'};",
        '    }',
        '}',
    ],

    moduleDot: `digraph logoutAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  action [label="logout()\\nserver action"];

  subgraph cluster_session {
    label="lib/session (mocked)";
    getSession     [label="getSession()"];
    sessionDestroy [label="session\\n.destroy()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    AuthorizationError;
    AuthorizationError -> AppError [label="extends"];
  }

  action     -> getSession     [label="open session (mocked)"];
  getSession -> sessionDestroy [label="destroy"];
  action     -> AppError       [label="catches (session error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'mockSession satisfies Partial<SessionData> with destroy() resolving successfully.',
            act: 'logout()',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'No change. session.destroy() called once.',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'mockSession satisfies Partial<SessionData> with destroy() throwing a generic Error("Storage failure").',
            act: 'logout()',
            expectedReturn: '{ success: false, message: "An unexpected error occurred" }',
            expectedDbState: 'No change.',
            actualResult: 'Passed',
        },
    ],
};

const exerciseControllerCreateExerciseIt: ItDescriptor = {
    reqId: 'CTRL-03',
    statement: 'createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>> - validates input with Zod, delegates to exerciseService.createExercise(), and returns the persisted entity wrapped in ActionResult.',
    data: 'data: CreateExerciseInput  { name: string, description?: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }',
    precondition: 'Database may or may not contain an exercise with the given name.',
    results: 'ActionResult<Exercise> - { success: true, data: Exercise } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on ConflictError.',
    postcondition: 'On success, one new row exists in the exercises table. On validation failure or ConflictError, no row is inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>> {",
        "    const result = createExerciseSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await exerciseService.createExercise(result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph createExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="createExercise()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="createExerciseSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="ExerciseService";
    svcCreate [label="exerciseService\\n.createExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    repoCreate [label="exerciseRepository\\n.create()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="exercise\\n.findUnique()"];
    create     [label="exercise\\n.create()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    ConflictError;
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcCreate     [label="delegate"];
  svcCreate  -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="uniqueness check"];
  repoCreate -> create        [label="insert row"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  action     -> AppError      [label="catches (conflict)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst input: CreateExerciseInput = { name: "Deadlift", description: "Posterior chain compound movement", muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.BARBELL }',
            act: 'createExercise(input)',
            expectedReturn: '{ success: true, data: { id: defined, name: "Deadlift", muscleGroup: BACK, isActive: true } }',
            expectedDbState: 'One row in exercises with name = "Deadlift" and isActive = true',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise "Bench Press" seeded via exerciseService.create().\nconst input: CreateExerciseInput = { name: "Bench Press", muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL }',
            act: 'createExercise(input)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'exercises table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst input = {} as unknown as CreateExerciseInput (missing all required fields)',
            act: 'createExercise(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { name: [...], muscleGroup: [...], equipmentNeeded: [...] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── getExercise ────────────────────────────────────────────────────────────────

const exerciseControllerGetExerciseIt: ItDescriptor = {
    reqId: 'CTRL-04',
    statement: 'getExercise(id: string): Promise<ActionResult<Exercise>> - delegates to exerciseService.getExercise() and returns the matching entity wrapped in ActionResult.',
    data: 'id: string - the UUID of the exercise to retrieve.',
    precondition: 'Database may or may not contain a row with the given id.',
    results: 'ActionResult<Exercise> - { success: true, data: Exercise } on success. { success: false, message } on NotFoundError.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function getExercise(id: string): Promise<ActionResult<Exercise>> {",
        "    try {",
        "        return {success: true, data: await exerciseService.getExercise(id)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph getExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="getExercise()\\nserver action"];
 
  subgraph cluster_service {
    label="ExerciseService";
    svcGet [label="exerciseService\\n.getExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    findById [label="exerciseRepository\\n.findById()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="exercise\\n.findUnique()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action   -> svcGet       [label="delegate"];
  svcGet   -> findById     [label="delegate"];
  findById -> findUnique   [label="look up by id"];
  findById -> NotFoundError [label="throws (missing)", style=dashed];
  action   -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise seeded via exerciseService.create(): { name: "Cable Fly", muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.CABLE }.\nconst id: string = seededExercise.id',
            act: 'getExercise(id)',
            expectedReturn: '{ success: true, data: { id: seededExercise.id, name: "Cable Fly", muscleGroup: CHEST, isActive: true } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'getExercise(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listExercises ──────────────────────────────────────────────────────────────

const exerciseControllerListExercisesIt: ItDescriptor = {
    reqId: 'CTRL-05',
    statement: 'listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>> - delegates to exerciseService.listExercises() and returns the paginated result wrapped in ActionResult.',
    data: 'options?: { search?: string, muscleGroup?: MuscleGroup, includeInactive?: boolean, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of exercise rows in any active/inactive state.',
    results: 'ActionResult<PageResult<Exercise>> - { success: true, data: { items: Exercise[], total: number } }. This action does not throw under normal operation; it always returns a page (possibly empty).',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>> {",
        "    try {",
        "        return {success: true, data: await exerciseService.listExercises(options)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph listExercisesAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="listExercises()\\nserver action"];
 
  subgraph cluster_service {
    label="ExerciseService";
    svcList [label="exerciseService\\n.listExercises()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    findAll [label="exerciseRepository\\n.findAll()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="exercise\\n.findMany()"];
    count       [label="exercise\\n.count()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action      -> svcList      [label="delegate"];
  svcList     -> findAll      [label="delegate"];
  findAll     -> transaction  [label="atomic read"];
  transaction -> findMany     [label="paginated rows"];
  transaction -> count        [label="total count"];
  action      -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via exerciseService.create(): Squat (active), Bench Press (active). Leg Press seeded then archived via exerciseService.setActive(id, false).',
            act: 'listExercises()',
            expectedReturn: '{ success: true, data: { items: [Bench Press, Squat], total: 2 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Seeded via exerciseService.create(): Bench Press (CHEST, active), Cable Fly (CHEST) then archived, Deadlift (BACK, active).\nconst options: ExerciseListOptions = { includeInactive: true, muscleGroup: MuscleGroup.CHEST }',
            act: 'listExercises(options)',
            expectedReturn: '{ success: true, data: { total: 2, items: all have muscleGroup = CHEST, at least one has isActive = false } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'listExercises()',
            expectedReturn: '{ success: true, data: { items: [], total: 0 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateExercise ─────────────────────────────────────────────────────────────

const exerciseControllerUpdateExerciseIt: ItDescriptor = {
    reqId: 'CTRL-06',
    statement: 'updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>> - validates input with Zod, delegates to exerciseService.updateExercise(), and returns the updated entity wrapped in ActionResult.',
    data: 'id: string, data: UpdateExerciseInput  { name?: string, description?: string, muscleGroup?: MuscleGroup, equipmentNeeded?: Equipment }',
    precondition: 'Exercise with the given id may or may not exist. The given name may or may not be in use by another exercise.',
    results: 'ActionResult<Exercise> - { success: true, data: Exercise } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on NotFoundError or ConflictError.',
    postcondition: 'On success, the target row reflects the supplied changes. Unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>> {",
        "    const result = updateExerciseSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await exerciseService.updateExercise(id, result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph updateExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="updateExercise()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="updateExerciseSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="ExerciseService";
    svcUpdate [label="exerciseService\\n.updateExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    repoUpdate [label="exerciseRepository\\n.update()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findById   [label="exercise\\n.findUnique() by id"];
    findByName [label="exercise\\n.findUnique() by name"];
    update     [label="exercise\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcUpdate     [label="delegate"];
  svcUpdate  -> repoUpdate    [label="delegate"];
  repoUpdate -> findById      [label="existence check"];
  repoUpdate -> findByName    [label="name uniqueness check"];
  repoUpdate -> update        [label="persist changes"];
  repoUpdate -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoUpdate -> ConflictError [label="throws (name taken)",  style=dashed];
  action     -> AppError      [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise "Squat" (LEGS, BARBELL) seeded via exerciseService.create().\nconst data: UpdateExerciseInput = { name: "Barbell Back Squat", description: "Updated description" }',
            act: 'updateExercise(seededExercise.id, data)',
            expectedReturn: '{ success: true, data: { name: "Barbell Back Squat", description: "Updated description" } }',
            expectedDbState: 'Row name and description updated in exercises table; muscleGroup and equipmentNeeded unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise "Bench Press" (CHEST) seeded via exerciseService.create().\nconst data: UpdateExerciseInput = { name: "Bench Press", description: "New description" }',
            act: 'updateExercise(seededExercise.id, data)',
            expectedReturn: '{ success: true, data: { name: "Bench Press", description: "New description" } }',
            expectedDbState: 'description updated; name unchanged (self-reference permitted)',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"\nconst data: UpdateExerciseInput = { name: "Ghost" }',
            act: 'updateExercise(id, data)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: '"Bench Press" seeded via exerciseService.create(). "Squat" seeded via exerciseService.create().\nconst data: UpdateExerciseInput = { name: "Bench Press" }',
            act: 'updateExercise(seededSquat.id, data)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'Squat row name unchanged in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Empty database.\nconst input = { name: 123 } as unknown as UpdateExerciseInput (invalid type for name field)',
            act: 'updateExercise("any-id", input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { name: [...] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Exercise "Squat" (LEGS, BARBELL, description: "Original") seeded via exerciseService.create().\nconst data: UpdateExerciseInput = {}',
            act: 'updateExercise(seededExercise.id, data)',
            expectedReturn: '{ success: true, data: all fields identical to the seeded row }',
            expectedDbState: 'All fields in the exercises row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── archiveExercise ────────────────────────────────────────────────────────────

const exerciseControllerArchiveExerciseIt: ItDescriptor = {
    reqId: 'CTRL-07',
    statement: 'archiveExercise(id: string): Promise<ActionResult<Exercise>> - delegates to exerciseService.archiveExercise() and returns the updated entity with isActive = false wrapped in ActionResult.',
    data: 'id: string - the UUID of the exercise to archive.',
    precondition: 'Exercise with the given id may or may not exist.',
    results: 'ActionResult<Exercise> - { success: true, data: Exercise with isActive = false } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, isActive is false in the target row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function archiveExercise(id: string): Promise<ActionResult<Exercise>> {",
        "    try {",
        "        return {success: true, data: await exerciseService.archiveExercise(id)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph archiveExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="archiveExercise()\\nserver action"];
 
  subgraph cluster_service {
    label="ExerciseService";
    svcArchive [label="exerciseService\\n.archiveExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    setActive [label="exerciseRepository\\n.setActive(id, false)"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="exercise\\n.findUnique()"];
    update     [label="exercise\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcArchive   [label="delegate"];
  svcArchive -> setActive    [label="delegate (false)"];
  setActive  -> findUnique   [label="existence check"];
  setActive  -> update       [label="write isActive = false"];
  setActive  -> NotFoundError [label="throws (missing)", style=dashed];
  action     -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active exercise seeded via exerciseService.create() (isActive = true).\nconst id: string = seededExercise.id',
            act: 'archiveExercise(id)',
            expectedReturn: '{ success: true, data: { id: seededExercise.id, isActive: false } }',
            expectedDbState: 'isActive = false in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'archiveExercise(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── unarchiveExercise ──────────────────────────────────────────────────────────

const exerciseControllerUnarchiveExerciseIt: ItDescriptor = {
    reqId: 'CTRL-08',
    statement: 'unarchiveExercise(id: string): Promise<ActionResult<Exercise>> - delegates to exerciseService.unarchiveExercise() and returns the updated entity with isActive = true wrapped in ActionResult.',
    data: 'id: string - the UUID of the exercise to unarchive.',
    precondition: 'Exercise with the given id may or may not exist.',
    results: 'ActionResult<Exercise> - { success: true, data: Exercise with isActive = true } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, isActive is true in the target row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function unarchiveExercise(id: string): Promise<ActionResult<Exercise>> {",
        "    try {",
        "        return {success: true, data: await exerciseService.unarchiveExercise(id)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph unarchiveExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="unarchiveExercise()\\nserver action"];
 
  subgraph cluster_service {
    label="ExerciseService";
    svcUnarchive [label="exerciseService\\n.unarchiveExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    setActive [label="exerciseRepository\\n.setActive(id, true)"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="exercise\\n.findUnique()"];
    update     [label="exercise\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action       -> svcUnarchive [label="delegate"];
  svcUnarchive -> setActive    [label="delegate (true)"];
  setActive    -> findUnique   [label="existence check"];
  setActive    -> update       [label="write isActive = true"];
  setActive    -> NotFoundError [label="throws (missing)", style=dashed];
  action       -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise seeded via exerciseService.create() then archived via exerciseService.setActive(id, false) (isActive = false).\nconst id: string = seededExercise.id',
            act: 'unarchiveExercise(id)',
            expectedReturn: '{ success: true, data: { id: seededExercise.id, isActive: true } }',
            expectedDbState: 'isActive = true in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'unarchiveExercise(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteExercise ─────────────────────────────────────────────────────────────

const exerciseControllerDeleteExerciseIt: ItDescriptor = {
    reqId: 'CTRL-09',
    statement: 'deleteExercise(id: string): Promise<ActionResult<void>> - delegates to exerciseService.deleteExercise() and returns a void ActionResult on success.',
    data: 'id: string - the UUID of the exercise to delete.',
    precondition: 'Exercise with the given id may or may not exist. It may or may not be referenced by a WorkoutSessionExercise row.',
    results: 'ActionResult<void> - { success: true, data: undefined } on success. { success: false, message } on NotFoundError or ConflictError.',
    postcondition: 'On success, the row is absent from exercises. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        "export async function deleteExercise(id: string): Promise<ActionResult<void>> {",
        "    try {",
        "        await exerciseService.deleteExercise(id);",
        "        return {success: true, data: undefined};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph deleteExerciseAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="deleteExercise()\\nserver action"];
 
  subgraph cluster_service {
    label="ExerciseService";
    svcDelete [label="exerciseService\\n.deleteExercise()"];
  }
 
  subgraph cluster_repo {
    label="ExerciseRepository";
    repoDelete [label="exerciseRepository\\n.delete()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="exercise\\n.findUnique()"];
    wseCount   [label="workoutSessionExercise\\n.count()"];
    deleteOp   [label="exercise\\n.delete()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> svcDelete     [label="delegate"];
  svcDelete  -> repoDelete    [label="delegate"];
  repoDelete -> findUnique    [label="existence check"];
  repoDelete -> wseCount      [label="reference check"];
  repoDelete -> deleteOp      [label="remove row"];
  repoDelete -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoDelete -> ConflictError [label="throws (referenced)",  style=dashed];
  action     -> AppError      [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One exercise seeded via exerciseService.create(). No WorkoutSessionExercise rows.\nconst id: string = seededExercise.id',
            act: 'deleteExercise(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Row no longer present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: '"Bench Press" and "Deadlift" seeded via exerciseService.create().\nconst id: string = seededBenchPress.id',
            act: 'deleteExercise(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Only the "Deadlift" row remains in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'deleteExercise(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Exercise seeded via exerciseService.create(). Member seeded via userService.createMember(). WorkoutSession and WorkoutSessionExercise seeded via workoutSessionService.createWorkoutSession() referencing that exercise.',
            act: 'deleteExercise(seededExercise.id)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'Exercise row still present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: '"Bench Press" seeded and referenced via a WorkoutSessionExercise row. "Deadlift" seeded with no references.',
            act: 'deleteExercise(benchPressId) - expects failure. Then deleteExercise(deadliftId).',
            expectedReturn: 'First call: { success: false, message: defined }. Second call: { success: true, data: undefined }.',
            expectedDbState: 'After both calls: only "Bench Press" row remains in exercises table.',
            actualResult: 'Passed',
        },
    ],
};

const createMemberIt: ItDescriptor = {
    reqId: 'CTRL-10',
    statement: 'createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>> — validates input with Zod, delegates to userService.createMember(), and returns the persisted member wrapped in ActionResult.',
    data: 'data: CreateMemberInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'ActionResult<MemberWithUser> — { success: true, data: MemberWithUser } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on ConflictError.',
    postcondition: 'On success, one new user row (role = MEMBER) and one new member row exist. On validation failure or ConflictError, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>> {",
        "    const result = createMemberSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await userService.createMember(result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph createMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="createMember()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="createMemberSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="UserService";
    svcCreate [label="userService\\n.createMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoCreate [label="userRepository\\n.createMember()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()"];
    userCreate [label="user\\n.create()"];
  }
 
  subgraph cluster_bcrypt {
    label="bcryptjs";
    hash [label="bcrypt.hash()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    ConflictError;
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcCreate     [label="delegate"];
  svcCreate  -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="check duplicate email"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  repoCreate -> hash          [label="hash password"];
  repoCreate -> userCreate    [label="persist user + member"];
  action     -> AppError      [label="catches (conflict)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst input: CreateMemberInput = { email: "alice@gym.test", fullName: "Alice Smith", phone: "+40700000001", dateOfBirth: "1990-05-15", password: "ValidPass123!", membershipStart: "2024-01-01" }',
            act: 'createMember(input)',
            expectedReturn: '{ success: true, data: { id: defined, isActive: true, user: { email: "alice@gym.test", role: "MEMBER" } } }',
            expectedDbState: 'One user row (role = MEMBER) and one member row linked to it',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member "alice@gym.test" seeded via userService.createMember().\nconst input: CreateMemberInput = { email: "alice@gym.test", fullName: "Alice Clone", ... }',
            act: 'createMember(input)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'members table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst input = {} as unknown as CreateMemberInput (all required fields missing)',
            act: 'createMember(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email, fullName, phone, dateOfBirth, password, membershipStart: each defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── createMemberWithTempPassword ───────────────────────────────────────────────

const createMemberWithTempPasswordIt: ItDescriptor = {
    reqId: 'CTRL-11',
    statement: 'createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<ActionResult<MemberWithUserAndTempPassword>> — validates input with Zod, delegates to userService.createMemberWithTempPassword(), and returns the member with plaintext tempPassword wrapped in ActionResult.',
    data: 'data: CreateMemberWithTempPasswordInput  { email: string, fullName: string, phone: string, dateOfBirth: string, membershipStart: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'ActionResult<MemberWithUserAndTempPassword> — { success: true, data: MemberWithUserAndTempPassword } with tempPassword defined. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on ConflictError.',
    postcondition: 'On success, one new user row (role = MEMBER) and one new member row exist. On error, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<ActionResult<MemberWithUserAndTempPassword>> {",
        "    const result = createMemberWithTempPasswordSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await userService.createMemberWithTempPassword(result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph createMemberWithTempPasswordAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="createMemberWithTempPassword()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="createMemberWithTempPasswordSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="UserService";
    svcCreate [label="userService\\n.createMemberWithTempPassword()"];
    genTemp   [label="generateTempPassword()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoCreate [label="userRepository\\n.createMember()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()"];
    userCreate [label="user\\n.create()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    ConflictError;
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcCreate     [label="delegate"];
  svcCreate  -> genTemp       [label="generate temp password"];
  svcCreate  -> repoCreate    [label="delegate with temp password"];
  repoCreate -> findUnique    [label="check duplicate email"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  repoCreate -> userCreate    [label="persist user + member"];
  action     -> AppError      [label="catches (conflict)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst input: CreateMemberWithTempPasswordInput = { email: "alice@gym.test", fullName: "Alice Smith", phone: "+40700000001", dateOfBirth: "1990-05-15", membershipStart: "2024-01-01" }',
            act: 'createMemberWithTempPassword(input)',
            expectedReturn: '{ success: true, data: { id: defined, isActive: true, tempPassword: defined non-empty string, user: { email: "alice@gym.test", role: "MEMBER" } } }',
            expectedDbState: 'One user row (role = MEMBER) and one member row linked to it',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member "alice@gym.test" seeded via userService.createMember().\nconst input: CreateMemberWithTempPasswordInput = { email: "alice@gym.test", fullName: "Alice Clone", ... }',
            act: 'createMemberWithTempPassword(input)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'members table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst input = {} as unknown as CreateMemberWithTempPasswordInput (all required fields missing)',
            act: 'createMemberWithTempPassword(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email, fullName, phone, dateOfBirth, membershipStart: each defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── createAdmin ────────────────────────────────────────────────────────────────

const createAdminIt: ItDescriptor = {
    reqId: 'CTRL-12',
    statement: 'createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>> — validates input with Zod, delegates to userService.createAdmin(), and returns the persisted admin wrapped in ActionResult.',
    data: 'data: CreateAdminInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'ActionResult<AdminWithUser> — { success: true, data: AdminWithUser } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on ConflictError.',
    postcondition: 'On success, one new user row (role = ADMIN) and one new admin row exist. On error, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>> {",
        "    const result = createAdminSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await userService.createAdmin(result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph createAdminAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="createAdmin()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="createAdminSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="UserService";
    svcCreate [label="userService\\n.createAdmin()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoCreate [label="userRepository\\n.createAdmin()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()"];
    userCreate [label="user\\n.create()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    ConflictError;
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcCreate     [label="delegate"];
  svcCreate  -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="check duplicate email"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  repoCreate -> userCreate    [label="persist user + admin"];
  action     -> AppError      [label="catches (conflict)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst input: CreateAdminInput = { email: "admin@gym.test", fullName: "Admin User", phone: "+40700000010", dateOfBirth: "1985-03-20", password: "AdminPass123!" }',
            act: 'createAdmin(input)',
            expectedReturn: '{ success: true, data: { id: defined, user: { email: "admin@gym.test", role: "ADMIN" } } }',
            expectedDbState: 'One user row (role = ADMIN) and one admin row linked to it',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Admin "admin@gym.test" seeded via userService.createAdmin().\nconst input: CreateAdminInput = { email: "admin@gym.test", fullName: "Admin Clone", ... }',
            act: 'createAdmin(input)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'admins table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst input = {} as unknown as CreateAdminInput (all required fields missing)',
            act: 'createAdmin(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email, fullName, phone, dateOfBirth, password: each defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── getMember ──────────────────────────────────────────────────────────────────

const getMemberIt: ItDescriptor = {
    reqId: 'CTRL-13',
    statement: 'getMember(memberId: string): Promise<ActionResult<MemberWithUser>> — delegates to userService.getMember() and returns the matching member wrapped in ActionResult.',
    data: 'memberId: string — the member.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain a member row with the given id.',
    results: 'ActionResult<MemberWithUser> — { success: true, data: MemberWithUser } on success. { success: false, message } on NotFoundError.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function getMember(memberId: string): Promise<ActionResult<MemberWithUser>> {",
        "    try {",
        "        return {success: true, data: await userService.getMember(memberId)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph getMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="getMember()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcGet [label="userService\\n.getMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    findMemberById [label="userRepository\\n.findMemberById()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="member\\n.findUnique()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action         -> svcGet         [label="delegate"];
  svcGet         -> findMemberById [label="delegate"];
  findMemberById -> findUnique     [label="look up by member.id"];
  findMemberById -> NotFoundError  [label="throws (missing)", style=dashed];
  action         -> AppError       [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(): { email: "alice@gym.test", fullName: "Alice Smith" }.\nconst id: string = seededMember.id',
            act: 'getMember(id)',
            expectedReturn: '{ success: true, data: { id: seededMember.id, user: { email: "alice@gym.test", fullName: "Alice Smith", role: "MEMBER" } } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'getMember(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── getAdmin ───────────────────────────────────────────────────────────────────

const getAdminIt: ItDescriptor = {
    reqId: 'CTRL-14',
    statement: 'getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>> — delegates to userService.getAdmin() and returns the matching admin wrapped in ActionResult.',
    data: 'adminId: string — the admin.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain an admin row with the given id.',
    results: 'ActionResult<AdminWithUser> — { success: true, data: AdminWithUser } on success. { success: false, message } on NotFoundError.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>> {",
        "    try {",
        "        return {success: true, data: await userService.getAdmin(adminId)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph getAdminAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="getAdmin()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcGet [label="userService\\n.getAdmin()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    findAdminById [label="userRepository\\n.findAdminById()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="admin\\n.findUnique()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action        -> svcGet        [label="delegate"];
  svcGet        -> findAdminById [label="delegate"];
  findAdminById -> findUnique    [label="look up by admin.id"];
  findAdminById -> NotFoundError [label="throws (missing)", style=dashed];
  action        -> AppError      [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin seeded via userService.createAdmin(): { email: "admin@gym.test", fullName: "Admin User" }.\nconst id: string = seededAdmin.id',
            act: 'getAdmin(id)',
            expectedReturn: '{ success: true, data: { id: seededAdmin.id, user: { email: "admin@gym.test", fullName: "Admin User", role: "ADMIN" } } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'getAdmin(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listMembers ────────────────────────────────────────────────────────────────

const listMembersIt: ItDescriptor = {
    reqId: 'CTRL-15',
    statement: 'listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>> — delegates to userService.listMembers() and returns the paginated result wrapped in ActionResult.',
    data: 'options?: { search?: string, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of member rows.',
    results: 'ActionResult<PageResult<MemberWithUser>> — always { success: true, data: { items, total } }. This action does not throw under normal operation.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>> {",
        "    try {",
        "        return {success: true, data: await userService.listMembers(options)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph listMembersAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="listMembers()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcList [label="userService\\n.listMembers()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    findMembers [label="userRepository\\n.findMembers()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="member\\n.findMany()"];
    count       [label="member\\n.count()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action      -> svcList     [label="delegate"];
  svcList     -> findMembers [label="delegate"];
  findMembers -> transaction [label="atomic read"];
  transaction -> findMany    [label="paginated rows"];
  transaction -> count       [label="total count"];
  action      -> AppError    [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via userService.createMember(): Charlie Brown (charlie@gym.test), Alice Smith (alice@gym.test), Bob Johnson (bob@gym.test) — unique phones for each.',
            act: 'listMembers()',
            expectedReturn: '{ success: true, data: { total: 3, items: contains all three members } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Seeded via userService.createMember(): Alice Smith (alice@gym.test), Bob Johnson (bob@gym.test).\nconst options: MemberListOptions = { search: "alice" }',
            act: 'listMembers(options)',
            expectedReturn: '{ success: true, data: { total: 1, items: [Alice Smith] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'listMembers()',
            expectedReturn: '{ success: true, data: { items: [], total: 0 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listAdmins ─────────────────────────────────────────────────────────────────

const listAdminsIt: ItDescriptor = {
    reqId: 'CTRL-16',
    statement: 'listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>> — delegates to userService.listAdmins() and returns the paginated result wrapped in ActionResult.',
    data: 'options?: { search?: string, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of admin rows.',
    results: 'ActionResult<PageResult<AdminWithUser>> — always { success: true, data: { items, total } }. This action does not throw under normal operation.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>> {",
        "    try {",
        "        return {success: true, data: await userService.listAdmins(options)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph listAdminsAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="listAdmins()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcList [label="userService\\n.listAdmins()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    findAdmins [label="userRepository\\n.findAdmins()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="admin\\n.findMany()"];
    count       [label="admin\\n.count()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcList    [label="delegate"];
  svcList    -> findAdmins [label="delegate"];
  findAdmins -> transaction [label="atomic read"];
  transaction -> findMany  [label="paginated rows"];
  transaction -> count     [label="total count"];
  action     -> AppError   [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via userService.createAdmin(): Charlie Admin (charlie-a@gym.test), Alice Admin (alice-a@gym.test) — unique phones.',
            act: 'listAdmins()',
            expectedReturn: '{ success: true, data: { total: 2, items: contains both admins } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Seeded via userService.createAdmin(): Alice Admin (alice-a@gym.test), Bobby Admin (bob-a@gym.test).\nconst options: AdminListOptions = { search: "bob-a@gym.test" }',
            act: 'listAdmins(options)',
            expectedReturn: '{ success: true, data: { total: 1, items: [Bobby Admin] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'listAdmins()',
            expectedReturn: '{ success: true, data: { items: [], total: 0 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateMember ───────────────────────────────────────────────────────────────

const updateMemberIt: ItDescriptor = {
    reqId: 'CTRL-17',
    statement: 'updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>> — validates input with Zod, delegates to userService.updateMember(), and returns the updated member wrapped in ActionResult.',
    data: 'memberId: string, data: UpdateMemberInput  { email?, fullName?, phone?, dateOfBirth?, password?, membershipStart? }',
    precondition: 'Member with the given id may or may not exist. The given email may or may not be in use by another user.',
    results: 'ActionResult<MemberWithUser> — { success: true, data: MemberWithUser } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on NotFoundError or ConflictError.',
    postcondition: 'On success, the target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>> {",
        "    const result = updateMemberSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await userService.updateMember(memberId, result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph updateMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="updateMember()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="updateMemberSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="UserService";
    svcUpdate [label="userService\\n.updateMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoUpdate [label="userRepository\\n.updateMember()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findMember [label="member\\n.findUnique()"];
    findUser   [label="user\\n.findUnique()"];
    update     [label="member\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcUpdate     [label="delegate"];
  svcUpdate  -> repoUpdate    [label="delegate"];
  repoUpdate -> findMember    [label="existence check"];
  repoUpdate -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoUpdate -> findUser      [label="email uniqueness check"];
  repoUpdate -> ConflictError [label="throws (email taken)", style=dashed];
  repoUpdate -> update        [label="persist changes"];
  action     -> AppError      [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member "alice@gym.test" seeded via userService.createMember().\nconst data: UpdateMemberInput = { email: "alice2@gym.test", fullName: "Alice Updated", phone: "+40700000099", dateOfBirth: "1991-06-20", password: "NewValidPass1!", membershipStart: "2025-03-01" }',
            act: 'updateMember(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "alice2@gym.test", fullName: "Alice Updated" } } }',
            expectedDbState: 'users row email and fullName updated; members row membershipStart updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member "alice@gym.test" seeded via userService.createMember().\nconst data: UpdateMemberInput = { fullName: "Alice Renamed" }',
            act: 'updateMember(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "alice@gym.test", fullName: "Alice Renamed" } } }',
            expectedDbState: 'fullName updated; email and phone unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst data: UpdateMemberInput = { fullName: "Ghost Member" }',
            act: 'updateMember("00000000-0000-0000-0000-000000000000", data)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via userService.createMember(): alice (alice@gym.test), bob (bob@gym.test).\nconst data: UpdateMemberInput = { email: "bob@gym.test" }',
            act: 'updateMember(alice.id, data)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'alice email unchanged in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member "alice@gym.test" (fullName: "Alice Smith") seeded via userService.createMember().\nconst data: UpdateMemberInput = {}',
            act: 'updateMember(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "alice@gym.test", fullName: "Alice Smith" } } }',
            expectedDbState: 'All fields in users and members rows unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Empty database.\nconst input = { email: "not-an-email" } as unknown as UpdateMemberInput',
            act: 'updateMember("00000000-0000-0000-0000-000000000000", input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email: defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateAdmin ────────────────────────────────────────────────────────────────

const updateAdminIt: ItDescriptor = {
    reqId: 'CTRL-18',
    statement: 'updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>> — validates input with Zod, delegates to userService.updateAdmin(), and returns the updated admin wrapped in ActionResult.',
    data: 'adminId: string, data: UpdateAdminInput  { email?, fullName?, phone?, dateOfBirth?, password? }',
    precondition: 'Admin with the given id may or may not exist. The given email may or may not be in use by another user.',
    results: 'ActionResult<AdminWithUser> — { success: true, data: AdminWithUser } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on NotFoundError or ConflictError.',
    postcondition: 'On success, the target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>> {",
        "    const result = updateAdminSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await userService.updateAdmin(adminId, result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph updateAdminAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="updateAdmin()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="updateAdminSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="UserService";
    svcUpdate [label="userService\\n.updateAdmin()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoUpdate [label="userRepository\\n.updateAdmin()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findAdmin [label="admin\\n.findUnique()"];
    findUser  [label="user\\n.findUnique()"];
    update    [label="admin\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
  }
 
  action     -> safeParse     [label="validate input"];
  action     -> svcUpdate     [label="delegate"];
  svcUpdate  -> repoUpdate    [label="delegate"];
  repoUpdate -> findAdmin     [label="existence check"];
  repoUpdate -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoUpdate -> findUser      [label="email uniqueness check"];
  repoUpdate -> ConflictError [label="throws (email taken)", style=dashed];
  repoUpdate -> update        [label="persist changes"];
  action     -> AppError      [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin "admin@gym.test" seeded via userService.createAdmin().\nconst data: UpdateAdminInput = { email: "admin2@gym.test", fullName: "Admin Updated", phone: "+40700000099", dateOfBirth: "1986-07-10", password: "NewAdminPass1!" }',
            act: 'updateAdmin(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "admin2@gym.test", fullName: "Admin Updated" } } }',
            expectedDbState: 'users row email and fullName updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Admin "admin@gym.test" seeded via userService.createAdmin().\nconst data: UpdateAdminInput = { fullName: "Admin Renamed" }',
            act: 'updateAdmin(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "admin@gym.test", fullName: "Admin Renamed" } } }',
            expectedDbState: 'fullName updated; email and phone unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst data: UpdateAdminInput = { fullName: "Ghost Admin" }',
            act: 'updateAdmin("00000000-0000-0000-0000-000000000000", data)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via userService.createAdmin(): adminA (admin-a@gym.test), adminB (admin-b@gym.test).\nconst data: UpdateAdminInput = { email: "admin-b@gym.test" }',
            act: 'updateAdmin(adminA.id, data)',
            expectedReturn: '{ success: false, message: defined non-empty string (ConflictError message) }',
            expectedDbState: 'adminA email unchanged in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Admin "admin@gym.test" (fullName: "Admin User") seeded via userService.createAdmin().\nconst data: UpdateAdminInput = {}',
            act: 'updateAdmin(seeded.id, data)',
            expectedReturn: '{ success: true, data: { user: { email: "admin@gym.test", fullName: "Admin User" } } }',
            expectedDbState: 'All fields in the users row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Empty database.\nconst input = { email: "not-an-email" } as unknown as UpdateAdminInput',
            act: 'updateAdmin("00000000-0000-0000-0000-000000000000", input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email: defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── suspendMember ──────────────────────────────────────────────────────────────

const suspendMemberIt: ItDescriptor = {
    reqId: 'CTRL-19',
    statement: 'suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>> — delegates to userService.suspendMember() and returns the updated member with isActive = false wrapped in ActionResult.',
    data: 'memberId: string — the member.id (UUID) to suspend.',
    precondition: 'Member with the given id may or may not exist.',
    results: 'ActionResult<MemberWithUser> — { success: true, data: MemberWithUser with isActive = false } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, isActive is false in the target members row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>> {",
        "    try {",
        "        return {success: true, data: await userService.suspendMember(memberId)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph suspendMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="suspendMember()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcSuspend [label="userService\\n.suspendMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    setActive [label="userRepository\\n.setMemberActive(id, false)"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="member\\n.findUnique()"];
    update     [label="member\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcSuspend   [label="delegate"];
  svcSuspend -> setActive    [label="delegate (false)"];
  setActive  -> findUnique   [label="existence check"];
  setActive  -> update       [label="write isActive = false"];
  setActive  -> NotFoundError [label="throws (missing)", style=dashed];
  action     -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active member seeded via userService.createMember() (isActive = true by default).\nconst id: string = seededMember.id',
            act: 'suspendMember(id)',
            expectedReturn: '{ success: true, data: { id: seededMember.id, isActive: false } }',
            expectedDbState: 'isActive = false in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'suspendMember(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── activateMember ─────────────────────────────────────────────────────────────

const activateMemberIt: ItDescriptor = {
    reqId: 'CTRL-20',
    statement: 'activateMember(memberId: string): Promise<ActionResult<MemberWithUser>> — delegates to userService.activateMember() and returns the updated member with isActive = true wrapped in ActionResult.',
    data: 'memberId: string — the member.id (UUID) to activate.',
    precondition: 'Member with the given id may or may not exist.',
    results: 'ActionResult<MemberWithUser> — { success: true, data: MemberWithUser with isActive = true } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, isActive is true in the target members row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function activateMember(memberId: string): Promise<ActionResult<MemberWithUser>> {",
        "    try {",
        "        return {success: true, data: await userService.activateMember(memberId)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph activateMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="activateMember()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcActivate [label="userService\\n.activateMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    setActive [label="userRepository\\n.setMemberActive(id, true)"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="member\\n.findUnique()"];
    update     [label="member\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action      -> svcActivate  [label="delegate"];
  svcActivate -> setActive    [label="delegate (true)"];
  setActive   -> findUnique   [label="existence check"];
  setActive   -> update       [label="write isActive = true"];
  setActive   -> NotFoundError [label="throws (missing)", style=dashed];
  action      -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember() then suspended via userService.suspendMember() (isActive = false).\nconst id: string = seededMember.id',
            act: 'activateMember(id)',
            expectedReturn: '{ success: true, data: { id: seededMember.id, isActive: true } }',
            expectedDbState: 'isActive = true in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'activateMember(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteMember ───────────────────────────────────────────────────────────────

const deleteMemberIt: ItDescriptor = {
    reqId: 'CTRL-21',
    statement: 'deleteMember(memberId: string): Promise<ActionResult<void>> — delegates to userService.deleteMember() and returns a void ActionResult on success.',
    data: 'memberId: string — the member.id (UUID) to delete.',
    precondition: 'Member with the given id may or may not exist.',
    results: 'ActionResult<void> — { success: true, data: undefined } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, the user row and cascaded member rows are absent. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function deleteMember(memberId: string): Promise<ActionResult<void>> {",
        "    try {",
        "        await userService.deleteMember(memberId);",
        "        return {success: true, data: undefined};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph deleteMemberAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="deleteMember()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcDelete [label="userService\\n.deleteMember()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoDelete [label="userRepository\\n.delete()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findMember [label="member\\n.findUnique()"];
    userDelete     [label="user\\n.delete()"];
    memberCascade  [label="member\\n(cascade)"];
    sessionCascade [label="workout_session\\n(cascade)"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcDelete    [label="delegate"];
  svcDelete  -> repoDelete   [label="delegate"];
  repoDelete -> findMember   [label="existence check"];
  repoDelete -> NotFoundError [label="throws (missing)", style=dashed];
  repoDelete -> userDelete   [label="delete user (cascades)"];
  userDelete -> memberCascade    [label="cascades to"];
  memberCascade -> sessionCascade [label="cascades to"];
  action     -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One member seeded via userService.createMember().\nconst id: string = seededMember.id',
            act: 'deleteMember(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Row no longer present in users or members tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Two members seeded via userService.createMember(): alice, bob (distinct emails and phones).\nconst id: string = alice.id',
            act: 'deleteMember(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Only bob row remains in members table',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'deleteMember(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteAdmin ────────────────────────────────────────────────────────────────

const deleteAdminIt: ItDescriptor = {
    reqId: 'CTRL-22',
    statement: 'deleteAdmin(adminId: string): Promise<ActionResult<void>> — delegates to userService.deleteAdmin() and returns a void ActionResult on success.',
    data: 'adminId: string — the admin.id (UUID) to delete.',
    precondition: 'Admin with the given id may or may not exist.',
    results: 'ActionResult<void> — { success: true, data: undefined } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, the user row and cascaded admin row are absent. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function deleteAdmin(adminId: string): Promise<ActionResult<void>> {",
        "    try {",
        "        await userService.deleteAdmin(adminId);",
        "        return {success: true, data: undefined};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph deleteAdminAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="deleteAdmin()\\nserver action"];
 
  subgraph cluster_service {
    label="UserService";
    svcDelete [label="userService\\n.deleteAdmin()"];
  }
 
  subgraph cluster_repo {
    label="UserRepository";
    repoDelete [label="userRepository\\n.delete()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findAdmin  [label="admin\\n.findUnique()"];
    userDelete [label="user\\n.delete()"];
    adminCascade [label="admin\\n(cascade)"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcDelete    [label="delegate"];
  svcDelete  -> repoDelete   [label="delegate"];
  repoDelete -> findAdmin    [label="existence check"];
  repoDelete -> NotFoundError [label="throws (missing)", style=dashed];
  repoDelete -> userDelete   [label="delete user (cascades)"];
  userDelete -> adminCascade  [label="cascades to"];
  action     -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One admin seeded via userService.createAdmin().\nconst id: string = seededAdmin.id',
            act: 'deleteAdmin(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Row no longer present in users or admins tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Two admins seeded via userService.createAdmin(): adminA, adminB (distinct emails and phones).\nconst id: string = adminA.id',
            act: 'deleteAdmin(id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Only adminB row remains in admins table',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'deleteAdmin(id)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

const createWorkoutSessionIt: ItDescriptor = {
    reqId: 'CTRL-23',
    statement: 'createWorkoutSession(data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]): Promise<ActionResult<WorkoutSessionWithExercises>> — validates both the session data and the exercises array with Zod, then delegates to workoutSessionService.createWorkoutSession().',
    data: 'data: CreateWorkoutSessionInput  { memberId: string, date: string, duration: number, notes?: string }, exercises: WorkoutSessionExerciseInput[]  { exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Database may or may not contain the member identified by data.memberId. Each exerciseId must reference an existing exercise row.',
    results: 'ActionResult<WorkoutSessionWithExercises> — { success: true, data } on success. { success: false, message: "Validation failed", errors } on invalid session fields. { success: false, message } when exercises array fails schema (empty or invalid entries) or on NotFoundError.',
    postcondition: 'On success, one new workout_sessions row and one workout_session_exercises row per exercise exist. On any failure, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function createWorkoutSession(",
        "    data: CreateWorkoutSessionInput,",
        "    exercises: WorkoutSessionExerciseInput[],",
        "): Promise<ActionResult<WorkoutSessionWithExercises>> {",
        "    const sessionResult = createWorkoutSessionSchema.safeParse(data);",
        "    if (!sessionResult.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(sessionResult.error).fieldErrors};",
        "    }",
        "    const exercisesResult = workoutSessionExercisesSchema.safeParse(exercises);",
        "    if (!exercisesResult.success) {",
        "        const flat = z.flattenError(exercisesResult.error);",
        "        const message = flat.formErrors.length > 0 ? flat.formErrors[0] : 'Invalid exercises';",
        "        return {success: false, message};",
        "    }",
        "    try {",
        "        return {success: true, data: await workoutSessionService.createWorkoutSession(sessionResult.data, exercisesResult.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph createWorkoutSessionAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="createWorkoutSession()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    parseSession   [label="createWorkoutSessionSchema\\n.safeParse()"];
    parseExercises [label="workoutSessionExercisesSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcCreate [label="workoutSessionService\\n.createWorkoutSession()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoCreate [label="workoutSessionRepository\\n.create()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findMember    [label="member\\n.findUnique()"];
    createSession [label="workoutSession\\n.create()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    WorkoutSessionRequiresExercisesError;
    NotFoundError -> AppError [label="extends"];
    WorkoutSessionRequiresExercisesError -> AppError [label="extends"];
  }
 
  action        -> parseSession   [label="validate session data"];
  action        -> parseExercises [label="validate exercises array"];
  action        -> svcCreate      [label="delegate"];
  svcCreate     -> repoCreate     [label="delegate"];
  repoCreate    -> findMember     [label="member existence check"];
  repoCreate    -> createSession  [label="insert session + exercises"];
  repoCreate    -> NotFoundError  [label="throws (member missing)", style=dashed];
  repoCreate    -> WorkoutSessionRequiresExercisesError [label="throws (empty)", style=dashed];
  action        -> AppError       [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise().\nconst data: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 60, notes: "Test session" }\nconst exercises: WorkoutSessionExerciseInput[] = [{ exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'createWorkoutSession(data, exercises)',
            expectedReturn: '{ success: true, data: { id: defined, memberId: seededMember.id, duration: 60, exercises: [length 1] } }',
            expectedDbState: 'One workout_sessions row and one workout_session_exercises row linked to it exist',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userService.createMember(). Two exercises seeded via exerciseService.createExercise().\nconst data: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 45 }\nconst exercises: WorkoutSessionExerciseInput[] = [{ exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }, { exerciseId: exercise2.id, sets: 4, reps: 8, weight: 80 }]',
            act: 'createWorkoutSession(data, exercises)',
            expectedReturn: '{ success: true, data: { exercises: [length 2] } }',
            expectedDbState: 'One workout_sessions row and two workout_session_exercises rows linked to it exist',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded via userService.createMember().\nconst data: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 60 }\nconst exercises: WorkoutSessionExerciseInput[] = []',
            act: 'createWorkoutSession(data, exercises)',
            expectedReturn: '{ success: false, message: defined non-empty string ("At least one exercise is required") }',
            expectedDbState: 'No rows inserted',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.\nconst data = {} as unknown as CreateWorkoutSessionInput (all required fields missing)\nconst exercises: WorkoutSessionExerciseInput[] = []',
            act: 'createWorkoutSession(data, exercises)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { memberId, date, duration: each defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Exercise seeded via exerciseService.createExercise(). No member in database.\nconst data: CreateWorkoutSessionInput = { memberId: "00000000-0000-0000-0000-000000000000", date: "2024-06-01", duration: 60 }\nconst exercises: WorkoutSessionExerciseInput[] = [{ exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'createWorkoutSession(data, exercises)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No rows inserted',
            actualResult: 'Passed',
        },
    ],
};

// ── getWorkoutSession ──────────────────────────────────────────────────────────

const getWorkoutSessionIt: ItDescriptor = {
    reqId: 'CTRL-24',
    statement: 'getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>> — delegates to workoutSessionService.getWorkoutSession() and returns the matching session with exercises wrapped in ActionResult.',
    data: 'workoutSessionId: string — the workout_sessions UUID to retrieve.',
    precondition: 'Database may or may not contain a workout_sessions row with the given id.',
    results: 'ActionResult<WorkoutSessionWithExercises> — { success: true, data } on success. { success: false, message } on NotFoundError.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>> {",
        "    try {",
        "        return {success: true, data: await workoutSessionService.getWorkoutSession(workoutSessionId)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph getWorkoutSessionAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="getWorkoutSession()\\nserver action"];
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcGet [label="workoutSessionService\\n.getWorkoutSession()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    findById [label="workoutSessionRepository\\n.findById()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="workoutSession\\n.findUnique()\\n{ include: exercises.exercise }"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action   -> svcGet       [label="delegate"];
  svcGet   -> findById     [label="delegate"];
  findById -> findUnique   [label="look up by id"];
  findById -> NotFoundError [label="throws (missing)", style=dashed];
  action   -> AppError     [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession(): date = "2024-06-01", duration = 60, notes = "Rest day".',
            act: 'getWorkoutSession(seededSession.id)',
            expectedReturn: '{ success: true, data: { id: seededSession.id, memberId: seededMember.id, duration: 60, notes: "Rest day", exercises: [length 1] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'getWorkoutSession("00000000-0000-0000-0000-000000000000")',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listMemberWorkoutSessions ──────────────────────────────────────────────────

const listMemberWorkoutSessionsIt: ItDescriptor = {
    reqId: 'CTRL-25',
    statement: 'listMemberWorkoutSessions(memberId: string, options?: WorkoutSessionListOptions): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>> — delegates to workoutSessionService.listMemberWorkoutSessions() and returns the paginated result wrapped in ActionResult.',
    data: 'memberId: string, options?: { startDate?: Date, endDate?: Date, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of workout_sessions rows for the given member.',
    results: 'ActionResult<PageResult<WorkoutSessionWithExercises>> — always { success: true, data: { items, total } }. Items ordered date ASC without pagination, date DESC with pagination.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function listMemberWorkoutSessions(",
        "    memberId: string,",
        "    options?: WorkoutSessionListOptions,",
        "): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>> {",
        "    try {",
        "        return {success: true, data: await workoutSessionService.listMemberWorkoutSessions(memberId, options)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) return {success: false, message: error.message};",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph listMemberWorkoutSessionsAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="listMemberWorkoutSessions()\\nserver action"];
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcList [label="workoutSessionService\\n.listMemberWorkoutSessions()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    findAll [label="workoutSessionRepository\\n.findAll()\\n{ memberId, ...options }"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="workoutSession\\n.findMany()"];
    count       [label="workoutSession\\n.count()"];
  }
 
  action      -> svcList     [label="delegate"];
  svcList     -> findAll     [label="delegate (memberId always set)"];
  findAll     -> transaction [label="atomic read"];
  transaction -> findMany    [label="filtered + paginated rows"];
  transaction -> count       [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Three sessions seeded via workoutSessionService.createWorkoutSession(): dates "2024-01-01", "2024-03-01", "2024-06-01".',
            act: 'listMemberWorkoutSessions(seededMember.id)',
            expectedReturn: '{ success: true, data: { total: 3, items: ordered by date ASC } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userService.createMember(). No sessions seeded.',
            act: 'listMemberWorkoutSessions(seededMember.id)',
            expectedReturn: '{ success: true, data: { items: [], total: 0 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Two sessions seeded: "2024-01-01", "2024-06-01".\nconst options: WorkoutSessionListOptions = { startDate: new Date("2024-03-01") }',
            act: 'listMemberWorkoutSessions(seededMember.id, options)',
            expectedReturn: '{ success: true, data: { total: 1, items: [2024-06-01] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateWorkoutSession ───────────────────────────────────────────────────────

const updateWorkoutSessionIt: ItDescriptor = {
    reqId: 'CTRL-26',
    statement: 'updateWorkoutSession(workoutSessionId: string, data: UpdateWorkoutSessionInput): Promise<ActionResult<WorkoutSession>> — validates input with Zod, delegates to workoutSessionService.updateWorkoutSession(), and returns the updated session metadata wrapped in ActionResult.',
    data: 'workoutSessionId: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? } — all optional',
    precondition: 'Workout session with the given id may or may not exist.',
    results: 'ActionResult<WorkoutSession> — { success: true, data: WorkoutSession } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on NotFoundError.',
    postcondition: 'On success, the target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function updateWorkoutSession(",
        "    workoutSessionId: string,",
        "    data: UpdateWorkoutSessionInput,",
        "): Promise<ActionResult<WorkoutSession>> {",
        "    const result = updateWorkoutSessionSchema.safeParse(data);",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        return {success: true, data: await workoutSessionService.updateWorkoutSession(workoutSessionId, result.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph updateWorkoutSessionAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="updateWorkoutSession()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="updateWorkoutSessionSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcUpdate [label="workoutSessionService\\n.updateWorkoutSession()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoUpdate [label="workoutSessionRepository\\n.update()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="workoutSession\\n.findUnique()"];
    update     [label="workoutSession\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> safeParse    [label="validate input"];
  action     -> svcUpdate    [label="delegate"];
  svcUpdate  -> repoUpdate   [label="delegate"];
  repoUpdate -> findUnique   [label="existence check"];
  repoUpdate -> NotFoundError [label="throws (id missing)", style=dashed];
  repoUpdate -> update       [label="persist changes"];
  action     -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession(): date = "2024-06-01", duration = 60, notes = "Original".\nconst data: UpdateWorkoutSessionInput = { date: "2025-01-15", duration: 90, notes: "Updated" }',
            act: 'updateWorkoutSession(seededSession.id, data)',
            expectedReturn: '{ success: true, data: { date: 2025-01-15, duration: 90, notes: "Updated" } }',
            expectedDbState: 'workout_sessions row date, duration, and notes updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession().\nconst data: UpdateWorkoutSessionInput = { duration: 90 }',
            act: 'updateWorkoutSession(seededSession.id, data)',
            expectedReturn: '{ success: true, data: { duration: 90 } }',
            expectedDbState: 'duration updated; date and notes unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst data: UpdateWorkoutSessionInput = { duration: 90 }',
            act: 'updateWorkoutSession("00000000-0000-0000-0000-000000000000", data)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession(): date = "2024-06-01", duration = 60, notes = "Original".\nconst data: UpdateWorkoutSessionInput = {}',
            act: 'updateWorkoutSession(seededSession.id, data)',
            expectedReturn: '{ success: true, data: all fields identical to seeded row }',
            expectedDbState: 'All fields in workout_sessions row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Empty database.\nconst input = { date: "not-a-date" } as unknown as UpdateWorkoutSessionInput',
            act: 'updateWorkoutSession("00000000-0000-0000-0000-000000000000", input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { date: defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateWorkoutSessionWithExercises ──────────────────────────────────────────

const updateWorkoutSessionWithExercisesIt: ItDescriptor = {
    reqId: 'CTRL-27',
    statement: 'updateWorkoutSessionWithExercises(workoutSessionId: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]): Promise<ActionResult<WorkoutSessionWithExercises>> — validates both session and exercises with Zod, delegates to workoutSessionService.updateWorkoutSessionWithExercises(), and returns the reconciled session.',
    data: 'workoutSessionId: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? }, exercises: WorkoutSessionExerciseUpdateInput[]  { id?: string, exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Workout session with the given id may or may not exist.',
    results: 'ActionResult<WorkoutSessionWithExercises> — { success: true, data } on success. { success: false, message: "Validation failed", errors } on invalid session fields. { success: false, message } on empty/invalid exercises or NotFoundError.',
    postcondition: 'Session scalar fields updated; workout_session_exercises reconciled. On error, no rows modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function updateWorkoutSessionWithExercises(",
        "    workoutSessionId: string,",
        "    data: UpdateWorkoutSessionInput,",
        "    exercises: WorkoutSessionExerciseUpdateInput[],",
        "): Promise<ActionResult<WorkoutSessionWithExercises>> {",
        "    const sessionResult = updateWorkoutSessionSchema.safeParse(data);",
        "    if (!sessionResult.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(sessionResult.error).fieldErrors};",
        "    }",
        "    const exercisesResult = workoutSessionExercisesUpdateSchema.safeParse(exercises);",
        "    if (!exercisesResult.success) {",
        "        const flat = z.flattenError(exercisesResult.error);",
        "        const message = flat.formErrors.length > 0 ? flat.formErrors[0] : 'Invalid exercises';",
        "        return {success: false, message};",
        "    }",
        "    try {",
        "        return {success: true, data: await workoutSessionService.updateWorkoutSessionWithExercises(workoutSessionId, sessionResult.data, exercisesResult.data)};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph updateWorkoutSessionWithExercisesAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="updateWorkoutSessionWithExercises()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    parseSession   [label="updateWorkoutSessionSchema\\n.safeParse()"];
    parseExercises [label="workoutSessionExercisesUpdateSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcUpdate [label="workoutSessionService\\n.updateWorkoutSessionWithExercises()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoUpdate [label="workoutSessionRepository\\n.updateWithExercises()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findSession   [label="workoutSession\\n.findUnique()"];
    transaction   [label="\\$transaction()"];
    wseDeleteMany [label="workoutSessionExercise\\n.deleteMany()"];
    wseUpdate     [label="workoutSessionExercise\\n.update()"];
    wseCreateMany [label="workoutSessionExercise\\n.createMany()"];
    sessionUpdate [label="workoutSession\\n.update()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    WorkoutSessionRequiresExercisesError;
    NotFoundError -> AppError [label="extends"];
    WorkoutSessionRequiresExercisesError -> AppError [label="extends"];
  }
 
  action     -> parseSession    [label="validate session data"];
  action     -> parseExercises  [label="validate exercises array"];
  action     -> svcUpdate       [label="delegate"];
  svcUpdate  -> repoUpdate      [label="delegate"];
  repoUpdate -> findSession     [label="existence check"];
  repoUpdate -> NotFoundError   [label="throws (id missing)",  style=dashed];
  repoUpdate -> WorkoutSessionRequiresExercisesError [label="throws (empty)", style=dashed];
  repoUpdate -> transaction     [label="reconcile exercises"];
  transaction -> wseDeleteMany  [label="remove unlisted"];
  transaction -> wseUpdate      [label="update kept"];
  transaction -> wseCreateMany  [label="add new"];
  transaction -> sessionUpdate  [label="update session fields"];
  action     -> AppError        [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession() with that exercise (WSE1).\nconst data: UpdateWorkoutSessionInput = { duration: 90 }\nconst exercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100 }]',
            act: 'updateWorkoutSessionWithExercises(seededSession.id, data, exercises)',
            expectedReturn: '{ success: true, data: { duration: 90, exercises: [{ sets: 5, reps: 8, weight: 100 }] } }',
            expectedDbState: 'workout_sessions duration updated; WSE1 sets = 5, reps = 8, weight = 100',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession().\nconst exercises: WorkoutSessionExerciseUpdateInput[] = []',
            act: 'updateWorkoutSessionWithExercises(seededSession.id, {}, exercises)',
            expectedReturn: '{ success: false, message: defined non-empty string ("At least one exercise is required") }',
            expectedDbState: 'No rows modified',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Exercise seeded via exerciseService.createExercise(). No session in database.\nconst exercises: WorkoutSessionExerciseUpdateInput[] = [{ exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'updateWorkoutSessionWithExercises("00000000-0000-0000-0000-000000000000", {}, exercises)',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.\nconst input = { date: "not-a-date" } as unknown as UpdateWorkoutSessionInput\nconst exercises: WorkoutSessionExerciseUpdateInput[] = []',
            act: 'updateWorkoutSessionWithExercises("any-id", input, exercises)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { date: defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member seeded via userService.createMember(). Two exercises seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession() with both exercises (WSE1, WSE2). Third exercise seeded.\nconst exercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60 }, { exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40 }] — exercise2 omitted',
            act: 'updateWorkoutSessionWithExercises(seededSession.id, {}, exercises)',
            expectedReturn: '{ success: true, data: { exercises: [length 2, WSE1 updated, exercise3 present, exercise2 absent] } }',
            expectedDbState: 'WSE1 sets = 4; WSE2 row removed; new WSE row for exercise3 created',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteWorkoutSession ───────────────────────────────────────────────────────

const deleteWorkoutSessionIt: ItDescriptor = {
    reqId: 'CTRL-28',
    statement: 'deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>> — delegates to workoutSessionService.deleteWorkoutSession() and returns a void ActionResult on success.',
    data: 'workoutSessionId: string — the workout_sessions UUID to delete.',
    precondition: 'Workout session with the given id may or may not exist.',
    results: 'ActionResult<void> — { success: true, data: undefined } on success. { success: false, message } on NotFoundError.',
    postcondition: 'On success, the session row and all linked workout_session_exercises rows are absent. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>> {",
        "    try {",
        "        await workoutSessionService.deleteWorkoutSession(workoutSessionId);",
        "        return {success: true, data: undefined};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph deleteWorkoutSessionAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="deleteWorkoutSession()\\nserver action"];
 
  subgraph cluster_service {
    label="WorkoutSessionService";
    svcDelete [label="workoutSessionService\\n.deleteWorkoutSession()"];
  }
 
  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoDelete [label="workoutSessionRepository\\n.delete()"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="workoutSession\\n.findUnique()"];
    deleteOp   [label="workoutSession\\n.delete()\\n(cascades to WSE)"];
    deleteOpWSE   [label="workoutSession\\n(cascade)"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action     -> svcDelete    [label="delegate"];
  svcDelete  -> repoDelete   [label="delegate"];
  repoDelete -> findUnique   [label="existence check"];
  repoDelete -> NotFoundError [label="throws (id missing)", style=dashed];
  repoDelete -> deleteOp     [label="remove row"];
  action     -> AppError     [label="catches (not found)", style=dashed];
  deleteOp -> deleteOpWSE [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Session seeded via workoutSessionService.createWorkoutSession() with that exercise.',
            act: 'deleteWorkoutSession(seededSession.id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'Row no longer present in workout_sessions or workout_session_exercises tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'deleteWorkoutSession("00000000-0000-0000-0000-000000000000")',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Two sessions seeded via workoutSessionService.createWorkoutSession(): sessionA ("2024-01-01"), sessionB ("2024-02-01").',
            act: 'deleteWorkoutSession(sessionA.id)',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'sessionA and its workout_session_exercises rows removed; sessionB rows still present',
            actualResult: 'Passed',
        },
    ],
};

const getMemberProgressReportIt: ItDescriptor = {
    reqId: 'CTRL-29',
    statement: 'getMemberProgressReport(memberId: string, startDate: string, endDate: string): Promise<ActionResult<Report>> — validates the three inputs with Zod, converts the date strings to Date objects, delegates to reportService.getMemberProgressReport(), and returns the compiled report wrapped in ActionResult.',
    data: 'memberId: string, startDate: string (YYYY-MM-DD), endDate: string (YYYY-MM-DD)',
    precondition: 'Member with the given memberId may or may not exist. The date window may or may not contain workout sessions for that member.',
    results: 'ActionResult<Report> — { success: true, data: Report } on success. { success: false, message: "Validation failed", errors } on Zod failure. { success: false, message } on NotFoundError.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,
    coveragePercent: '100%',

    sourceCode: [
        "export async function getMemberProgressReport(",
        "    memberId: string,",
        "    startDate: string,",
        "    endDate: string,",
        "): Promise<ActionResult<Report>> {",
        "    const result = memberProgressReportSchema.safeParse({memberId, startDate, endDate});",
        "    if (!result.success) {",
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        "    }",
        "    try {",
        "        const report = await reportService.getMemberProgressReport(",
        "            result.data.memberId,",
        "            new Date(result.data.startDate),",
        "            new Date(result.data.endDate),",
        "        );",
        "        return {success: true, data: report};",
        "    } catch (error) {",
        "        if (error instanceof AppError) {",
        "            return {success: false, message: error.message};",
        "        }",
        "        return {success: false, message: 'An unexpected error occurred'};",
        "    }",
        "}",
    ],

    moduleDot: `digraph getMemberProgressReportAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  action [label="getMemberProgressReport()\\nserver action"];
 
  subgraph cluster_zod {
    label="zod";
    safeParse [label="memberProgressReportSchema\\n.safeParse()"];
  }
 
  subgraph cluster_service {
    label="ReportService";
    svcReport [label="reportService\\n.getMemberProgressReport()"];
  }
 
  subgraph cluster_userrepo {
    label="UserRepository";
    findMemberById [label="userRepository\\n.findMemberById()"];
  }
 
  subgraph cluster_wsrepo {
    label="WorkoutSessionRepository";
    findAll [label="workoutSessionRepository\\n.findAll()\\n{ memberId, startDate, endDate }"];
  }
 
  subgraph cluster_prisma {
    label="PrismaClient";
    memberFind  [label="member\\n.findUnique()"];
    transaction [label="\\$transaction()"];
    findMany    [label="workoutSession\\n.findMany()\\n{ include: exercises.exercise }"];
    count       [label="workoutSession\\n.count()"];
  }
 
  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }
 
  action         -> safeParse      [label="validate inputs"];
  action         -> svcReport      [label="delegate (dates converted)"];
  svcReport      -> findMemberById [label="resolve member"];
  findMemberById -> memberFind     [label="look up by member.id"];
  findMemberById -> NotFoundError  [label="throws (missing)", style=dashed];
  svcReport      -> findAll        [label="fetch sessions in window"];
  findAll        -> transaction    [label="atomic read"];
  transaction    -> findMany       [label="filtered rows"];
  transaction    -> count          [label="total count"];
  action         -> AppError       [label="catches (not found)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userService.createMember(). Exercise "Bench Press" (CHEST) seeded via exerciseService.createExercise(). One session seeded via workoutSessionService.createWorkoutSession(): date = "2024-01-15", duration = 60, notes = "First session", exercise entry: { sets: 3, reps: 10, weight: 100 }.',
            act: 'getMemberProgressReport(seededMember.id, "2024-01-01", "2024-01-31")',
            expectedReturn: '{ success: true, data: { memberId, memberName, totalSessions: 1, totalVolume: 3000, averageSessionDuration: 60, sessionDetails[0].exercises[0].volume: 3000, exerciseBreakdown[0].totalSets: 3, exerciseBreakdown[0].sessionCount: 1 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userService.createMember(). "Bench Press" (CHEST) and "Deadlift" (BACK) seeded via exerciseService.createExercise(). Session 1 ("2024-01-10", duration 60): Bench Press { sets: 3, reps: 10, weight: 100 } = 3000. Session 2 ("2024-01-20", duration 90): Deadlift { sets: 4, reps: 5, weight: 150 } = 3000, Bench Press { sets: 2, reps: 8, weight: 80 } = 1280.',
            act: 'getMemberProgressReport(seededMember.id, "2024-01-01", "2024-01-31")',
            expectedReturn: '{ success: true, data: { totalSessions: 2, totalVolume: 7280, averageSessionDuration: 75, exerciseBreakdown[0].exerciseName: "Bench Press" (volume 4280, sessionCount 2), exerciseBreakdown[1].exerciseName: "Deadlift" (volume 3000, sessionCount 1) } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). Two sessions seeded via workoutSessionService.createWorkoutSession() on "2024-01-10" and "2024-01-20", both with same exercise: { sets: 3, reps: 10, weight: 50 }.',
            act: 'getMemberProgressReport(seededMember.id, "2024-01-01", "2024-01-31")',
            expectedReturn: '{ success: true, data: { exerciseBreakdown[0].totalSets: 6, exerciseBreakdown[0].totalVolume: 3000, exerciseBreakdown[0].sessionCount: 2 } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded via userService.createMember(). Exercise seeded via exerciseService.createExercise(). One session seeded outside the query window on "2024-03-01".',
            act: 'getMemberProgressReport(seededMember.id, "2024-01-01", "2024-01-31")',
            expectedReturn: '{ success: true, data: { totalSessions: 0, totalVolume: 0, averageSessionDuration: 0, exerciseBreakdown: [], sessionDetails: [] } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Empty database.',
            act: 'getMemberProgressReport("00000000-0000-0000-0000-000000000000", "2024-01-01", "2024-01-31")',
            expectedReturn: '{ success: false, message: defined non-empty string (NotFoundError message) }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Empty database.\nInvalid date format strings: startDate = "not-a-date", endDate = "also-not-a-date".',
            act: 'getMemberProgressReport("any-id", "not-a-date", "also-not-a-date")',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { startDate: defined, endDate: defined } }',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {

    const AUTH_CTRL = path.join(BASE, 'auth-controller');
    await writeIt(authControllerLoginActionIt, path.join(AUTH_CTRL, 'login-it-form.xlsx'));
    await writeIt(authControllerLogoutActionIt, path.join(AUTH_CTRL, 'logout-it-form.xlsx'));

    const EXERCISE_CTRL = path.join(BASE, 'exercise-controller');
    await writeIt(exerciseControllerCreateExerciseIt, path.join(EXERCISE_CTRL, 'createExercise-it-form.xlsx'));
    await writeIt(exerciseControllerGetExerciseIt, path.join(EXERCISE_CTRL, 'getExercise-it-form.xlsx'));
    await writeIt(exerciseControllerListExercisesIt, path.join(EXERCISE_CTRL, 'listExercises-it-form.xlsx'));
    await writeIt(exerciseControllerUpdateExerciseIt, path.join(EXERCISE_CTRL, 'updateExercise-it-form.xlsx'));
    await writeIt(exerciseControllerArchiveExerciseIt, path.join(EXERCISE_CTRL, 'archiveExercise-it-form.xlsx'));
    await writeIt(exerciseControllerUnarchiveExerciseIt, path.join(EXERCISE_CTRL, 'unarchiveExercise-it-form.xlsx'));
    await writeIt(exerciseControllerDeleteExerciseIt, path.join(EXERCISE_CTRL, 'deleteExercise-it-form.xlsx'));

    const USER_CTRL = path.join(BASE, 'user-controller');
    await writeIt(createMemberIt, path.join(USER_CTRL, 'createMember-it-form.xlsx'));
    await writeIt(createMemberWithTempPasswordIt, path.join(USER_CTRL, 'createMemberWithTempPassword-it-form.xlsx'));
    await writeIt(createAdminIt, path.join(USER_CTRL, 'createAdmin-it-form.xlsx'));
    await writeIt(getMemberIt, path.join(USER_CTRL, 'getMember-it-form.xlsx'));
    await writeIt(getAdminIt, path.join(USER_CTRL, 'getAdmin-it-form.xlsx'));
    await writeIt(listMembersIt, path.join(USER_CTRL, 'listMembers-it-form.xlsx'));
    await writeIt(listAdminsIt, path.join(USER_CTRL, 'listAdmins-it-form.xlsx'));
    await writeIt(updateMemberIt, path.join(USER_CTRL, 'updateMember-it-form.xlsx'));
    await writeIt(updateAdminIt, path.join(USER_CTRL, 'updateAdmin-it-form.xlsx'));
    await writeIt(suspendMemberIt, path.join(USER_CTRL, 'suspendMember-it-form.xlsx'));
    await writeIt(activateMemberIt, path.join(USER_CTRL, 'activateMember-it-form.xlsx'));
    await writeIt(deleteMemberIt, path.join(USER_CTRL, 'deleteMember-it-form.xlsx'));
    await writeIt(deleteAdminIt, path.join(USER_CTRL, 'deleteAdmin-it-form.xlsx'));

    const WS_CTRL = path.join(BASE, 'workout-session-controller');
    await writeIt(createWorkoutSessionIt, path.join(WS_CTRL, 'createWorkoutSession-it-form.xlsx'));
    await writeIt(getWorkoutSessionIt, path.join(WS_CTRL, 'getWorkoutSession-it-form.xlsx'));
    await writeIt(listMemberWorkoutSessionsIt, path.join(WS_CTRL, 'listMemberWorkoutSessions-it-form.xlsx'));
    await writeIt(updateWorkoutSessionIt, path.join(WS_CTRL, 'updateWorkoutSession-it-form.xlsx'));
    await writeIt(updateWorkoutSessionWithExercisesIt, path.join(WS_CTRL, 'updateWorkoutSessionWithExercises-it-form.xlsx'));
    await writeIt(deleteWorkoutSessionIt, path.join(WS_CTRL, 'deleteWorkoutSession-it-form.xlsx'));

    const REPORT_CTRL = path.join(BASE, 'report-controller');
    await writeIt(getMemberProgressReportIt, path.join(REPORT_CTRL, 'getMemberProgressReport-it-form.xlsx'));

    console.log('Done.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});