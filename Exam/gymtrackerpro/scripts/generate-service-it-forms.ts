import * as path from 'path';
import {writeIt, ItDescriptor} from './generate-it-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'service', '__tests__', 'it');

const SHARED_REMARKS = [
    'Run:  npm run test:integration',
    'Tear down:  npm run test:integration:down',
    'All service and repository singletons are instantiated and accessed via the lib/di module, which configures them to use the shared PrismaClient instance.',
];

// ── Descriptors ───────────────────────────────────────────────────────────────

const authServiceLoginIt: ItDescriptor = {
    reqId: 'SERV-01',
    statement: 'AuthService.login(data: LoginUserInput): Promise<SessionData> - verifies email and password against stored credentials and returns a session payload.',
    data: 'data: LoginUserInput  { email: string, password: string }',
    precondition: 'Database may or may not contain a user with the given email. If it does, the stored passwordHash may or may not match the supplied password, and the user may or may not have an associated member or admin row.',
    results: 'SessionData - { userId, email, fullName, role, memberId?, adminId?, isActive? } drawn from the matched user row and its relations. NotFoundError if no user exists with the email. AuthorizationError if the password does not match.',
    postcondition: 'No database rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async login(data: LoginUserInput): Promise<SessionData> {',
        '    const user = await this.userRepository.findByEmail(data.email);',
        '    if (!user) {',
        "        throw new NotFoundError('Invalid email or password');",
        '    }',
        '    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);',
        '    if (!passwordMatch) {',
        "        throw new AuthorizationError('Invalid email or password');",
        '    }',
        '    return {',
        '        userId: user.id,',
        '        email: user.email,',
        '        fullName: user.fullName,',
        '        role: user.role,',
        '        memberId: user.member?.id,',
        '        adminId: user.admin?.id,',
        '        isActive: user.member?.isActive,',
        '    };',
        '}',
    ],

    moduleDot: `digraph login {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="AuthService\\n.login()"];

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

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    AuthorizationError;
    NotFoundError -> AppError [label="extends"];
    AuthorizationError -> AppError [label="extends"];
  }

  method      -> findByEmail        [label="look up by email"];
  findByEmail -> findUnique         [label="query with relations"];
  method      -> compare            [label="verify password"];
  method      -> NotFoundError      [label="throws (email missing)",  style=dashed];
  method      -> AuthorizationError [label="throws (wrong password)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member user seeded via userRepository.createMember: email = "member@gym.test", password = "ValidPass123!", associated member row with isActive = true.\nInput: { email: "member@gym.test", password: "ValidPass123!" }',
            act: 'service.login(input)',
            expectedReturn: 'SessionData with userId, email, fullName, role = MEMBER, memberId = member.id, isActive = true, adminId = undefined',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Admin user seeded via userRepository.createAdmin: email = "admin@gym.test", password = "ValidPass123!", associated admin row.\nInput: { email: "admin@gym.test", password: "ValidPass123!" }',
            act: 'service.login(input)',
            expectedReturn: 'SessionData with userId, email, fullName, role = ADMIN, adminId = admin.id, memberId = undefined, isActive = undefined',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nInput: { email: "ghost@gym.test", password: "AnyPass123!" }',
            act: 'service.login(input)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member user seeded via userRepository.createMember: email = "member@gym.test", password hashed from "ValidPass123!".\nInput: { email: "member@gym.test", password: "WrongPass999!" }',
            act: 'service.login(input)',
            expectedReturn: 'Throws AuthorizationError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── createExercise ────────────────────────────────────────────────────────────

const exerciseServiceCreateExerciseIt: ItDescriptor = {
    reqId: 'SERV-02',
    statement: 'ExerciseService.createExercise(data: CreateExerciseInput): Promise<Exercise> - delegates to exerciseRepository.create() and returns the persisted entity.',
    data: 'data: CreateExerciseInput  { name: string, description?: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }',
    precondition: 'Database may or may not contain an exercise with the given name.',
    results: 'Exercise - the newly inserted row with all fields populated and isActive defaulting to true. ConflictError if the name is already in use.',
    postcondition: 'On success, one new row exists in the exercises table. On ConflictError, no row is inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createExercise(data: CreateExerciseInput): Promise<Exercise> {',
        '    return this.exerciseRepository.create(data);',
        '}',
    ],

    moduleDot: `digraph createExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.createExercise()"];

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

  method     -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="check uniqueness"];
  repoCreate -> create        [label="insert row"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst input: CreateExerciseInput = { name: "Deadlift", description: "Posterior chain compound movement", muscleGroup: BACK, equipmentNeeded: BARBELL }',
            act: 'service.createExercise(input)',
            expectedReturn: 'Exercise with id defined, name = "Deadlift", muscleGroup = BACK, isActive = true',
            expectedDbState: 'One row in exercises with all input fields matching and isActive = true',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise "Bench Press" seeded via exerciseRepository.create().\nconst input: CreateExerciseInput = { name: "Bench Press", description: "Duplicate attempt", muscleGroup: CHEST, equipmentNeeded: BARBELL }',
            act: 'service.createExercise(input)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'exercises table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst firstInput: CreateExerciseInput = { name: "Squat", muscleGroup: LEGS, equipmentNeeded: BARBELL }\nconst secondInput: CreateExerciseInput = { name: "Leg Press", muscleGroup: LEGS, equipmentNeeded: MACHINE }',
            act: 'service.createExercise(firstInput), then service.createExercise(secondInput)',
            expectedReturn: 'Two distinct Exercise objects with different ids',
            expectedDbState: 'exercises table contains exactly 2 rows',
            actualResult: 'Passed',
        },
    ],
};

// ── getExercise ───────────────────────────────────────────────────────────────

const exerciseServiceGetExerciseIt: ItDescriptor = {
    reqId: 'SERV-03',
    statement: 'ExerciseService.getExercise(id: string): Promise<Exercise> - delegates to exerciseRepository.findById() and returns the matching entity.',
    data: 'id: string - the UUID of the exercise to retrieve.',
    precondition: 'Database may or may not contain a row with the given id.',
    results: 'Exercise - the matching row. NotFoundError if no row exists with that id.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async getExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.findById(id);',
        '}',
    ],

    moduleDot: `digraph getExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.getExercise()"];

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

  method   -> findById      [label="delegate"];
  findById -> findUnique    [label="look up by id"];
  findById -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise seeded via exerciseRepository.create(): { name: "Cable Fly", muscleGroup: CHEST, equipmentNeeded: CABLE }.\nconst id: string = seededExercise.id',
            act: 'service.getExercise(id)',
            expectedReturn: 'Exercise object with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.getExercise(id)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listExercises ─────────────────────────────────────────────────────────────

const exerciseServiceListExercisesIt: ItDescriptor = {
    reqId: 'SERV-04',
    statement: 'ExerciseService.listExercises(options?: ExerciseListOptions): Promise<PageResult<Exercise>> - delegates to exerciseRepository.findAll() and returns the paginated result.',
    data: 'options?: { search?: string, muscleGroup?: MuscleGroup, includeInactive?: boolean, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of exercise rows in any active/inactive state.',
    results: 'PageResult<Exercise>  { items: Exercise[], total: number } - items ordered by name ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async listExercises(options?: ExerciseListOptions): Promise<PageResult<Exercise>> {',
        '    return this.exerciseRepository.findAll(options);',
        '}',
    ],

    moduleDot: `digraph listExercises {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.listExercises()"];

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

  method  -> findAll      [label="delegate"];
  findAll -> transaction  [label="atomic read"];
  transaction -> findMany [label="paginated rows"];
  transaction -> count    [label="total count"];
  method  -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via exerciseRepository.create(): Squat (active), Bench Press (active). Leg Press seeded then archived via exerciseRepository.setActive(id, false).',
            act: 'service.listExercises()',
            expectedReturn: 'items = [Bench Press, Squat], total = 2',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Bench Press (active) seeded via exerciseRepository.create(). Leg Press seeded then archived via exerciseRepository.setActive(id, false).\nconst options: ExerciseListOptions = { includeInactive: true }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, items contains both active and inactive exercises',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via exerciseRepository.create(): Bench Press (CHEST), Deadlift (BACK), Cable Row (BACK).\nconst options: ExerciseListOptions = { muscleGroup: MuscleGroup.BACK }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, all items have muscleGroup = BACK',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via exerciseRepository.create(): Bench Press, Incline Press, Deadlift.\nconst options: ExerciseListOptions = { search: "PRESS" }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, all item names contain "press" (case-insensitive)',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded via exerciseRepository.create(): Bench Press (CHEST), Incline Press (CHEST), Shoulder Press (SHOULDERS).\nconst options: ExerciseListOptions = { search: "press", muscleGroup: MuscleGroup.CHEST }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, all items have muscleGroup = CHEST and name contains "press"',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded via exerciseRepository.create(): Exercise A, Exercise B, Exercise C (all active).\nconst firstOptions: ExerciseListOptions = { page: 1, pageSize: 2 }\nconst secondOptions: ExerciseListOptions = { page: 2, pageSize: 2 }',
            act: 'service.listExercises(firstOptions), then service.listExercises(secondOptions)',
            expectedReturn: 'Page 1: 2 items, total = 3. Page 2: 1 item, total = 3. No id overlap.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Bench Press (CHEST) seeded via exerciseRepository.create(). Cable Fly (CHEST) seeded then archived via exerciseRepository.setActive(id, false). Deadlift (BACK) seeded active.\nconst options: ExerciseListOptions = { includeInactive: true, muscleGroup: MuscleGroup.CHEST }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, all items have muscleGroup = CHEST, at least one item has isActive = false',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Bench Press (active) seeded via exerciseRepository.create(). Incline Press seeded then archived via exerciseRepository.setActive(id, false). Deadlift (active) seeded.\nconst options: ExerciseListOptions = { includeInactive: true, search: "press" }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, all item names contain "press", at least one item has isActive = false',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '9',
            arrange: 'Seeded via exerciseRepository.create(): Squat (active), Bench Press (active).\nconst options: ExerciseListOptions = { page: 1, pageSize: 100 }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 2, items contains both rows',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '10',
            arrange: 'Seeded via exerciseRepository.create(): Bench Press, Deadlift (both active).\nconst options: ExerciseListOptions = { search: "Bench%" }',
            act: 'service.listExercises(options)',
            expectedReturn: 'total = 0, items = []. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateExercise ────────────────────────────────────────────────────────────

const exerciseServiceUpdateExerciseIt: ItDescriptor = {
    reqId: 'SERV-05',
    statement: 'ExerciseService.updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise> - delegates to exerciseRepository.update() and returns the updated entity.',
    data: 'id: string, data: UpdateExerciseInput  { name?: string, description?: string, muscleGroup?: MuscleGroup, equipmentNeeded?: Equipment }',
    precondition: 'Exercise with the given id may or may not exist. The given name may or may not be in use by another exercise.',
    results: 'Exercise - the updated row. NotFoundError if the id does not exist. ConflictError if the name is taken by another exercise.',
    postcondition: 'On success, the target row reflects the supplied changes. Unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise> {',
        '    return this.exerciseRepository.update(id, data);',
        '}',
    ],

    moduleDot: `digraph updateExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.updateExercise()"];

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

  method     -> repoUpdate    [label="delegate"];
  repoUpdate -> findById      [label="existence check"];
  repoUpdate -> findByName    [label="name uniqueness check"];
  repoUpdate -> update        [label="persist changes"];
  repoUpdate -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoUpdate -> ConflictError [label="throws (name taken)",  style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise "Squat" (LEGS, BARBELL) seeded via exerciseRepository.create().\nconst data: UpdateExerciseInput = { name: "Barbell Back Squat", description: "Updated description" }',
            act: 'service.updateExercise(seededExercise.id, data)',
            expectedReturn: 'Exercise with name = "Barbell Back Squat", description = "Updated description"',
            expectedDbState: 'Row name and description updated in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise seeded via exerciseRepository.create(): description = "Original description", muscleGroup = LEGS, equipmentNeeded = BARBELL.\nconst data: UpdateExerciseInput = { name: "Barbell Back Squat" }',
            act: 'service.updateExercise(seededExercise.id, data)',
            expectedReturn: 'Updated Exercise object',
            expectedDbState: 'description, muscleGroup, equipmentNeeded unchanged in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Exercise "Bench Press" seeded via exerciseRepository.create().\nconst data: UpdateExerciseInput = { name: "Bench Press", description: "New description" }',
            act: 'service.updateExercise(seededExercise.id, data)',
            expectedReturn: 'Exercise with name = "Bench Press", description = "New description"',
            expectedDbState: 'description updated, name unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"\nconst data: UpdateExerciseInput = { name: "Ghost" }',
            act: 'service.updateExercise(id, data)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: '"Bench Press" seeded via exerciseRepository.create(). "Squat" seeded via exerciseRepository.create().\nconst data: UpdateExerciseInput = { name: "Bench Press" }',
            act: 'service.updateExercise(seededSquat.id, data)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'Squat row name unchanged in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Exercise seeded via exerciseRepository.create(): name = "Squat", description = "Original description", muscleGroup = LEGS, equipmentNeeded = BARBELL.\nconst data: UpdateExerciseInput = {}',
            act: 'service.updateExercise(seededExercise.id, data)',
            expectedReturn: 'Exercise with all fields identical to the seeded row',
            expectedDbState: 'All fields in the exercises row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── archiveExercise ───────────────────────────────────────────────────────────

const exerciseServiceArchiveExerciseIt: ItDescriptor = {
    reqId: 'SERV-06',
    statement: 'ExerciseService.archiveExercise(id: string): Promise<Exercise> - delegates to exerciseRepository.setActive(id, false) and returns the updated entity with isActive = false.',
    data: 'id: string - the UUID of the exercise to archive.',
    precondition: 'Exercise with the given id may or may not exist.',
    results: 'Exercise - the updated row with isActive = false. NotFoundError if the id does not exist.',
    postcondition: 'On success, isActive is false in the target row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async archiveExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.setActive(id, false);',
        '}',
    ],

    moduleDot: `digraph archiveExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.archiveExercise()"];

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

  method    -> setActive     [label="delegate (false)"];
  setActive -> findUnique    [label="existence check"];
  setActive -> update        [label="write isActive = false"];
  setActive -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active exercise seeded via exerciseRepository.create() (isActive = true).\nconst id: string = seededExercise.id',
            act: 'service.archiveExercise(id)',
            expectedReturn: 'Exercise with isActive = false',
            expectedDbState: 'isActive = false in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.archiveExercise(id)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── unarchiveExercise ─────────────────────────────────────────────────────────

const exerciseServiceUnarchiveExerciseIt: ItDescriptor = {
    reqId: 'SERV-07',
    statement: 'ExerciseService.unarchiveExercise(id: string): Promise<Exercise> - delegates to exerciseRepository.setActive(id, true) and returns the updated entity with isActive = true.',
    data: 'id: string - the UUID of the exercise to unarchive.',
    precondition: 'Exercise with the given id may or may not exist.',
    results: 'Exercise - the updated row with isActive = true. NotFoundError if the id does not exist.',
    postcondition: 'On success, isActive is true in the target row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async unarchiveExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.setActive(id, true);',
        '}',
    ],

    moduleDot: `digraph unarchiveExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.unarchiveExercise()"];

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

  method    -> setActive     [label="delegate (true)"];
  setActive -> findUnique    [label="existence check"];
  setActive -> update        [label="write isActive = true"];
  setActive -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise seeded via exerciseRepository.create() then archived via exerciseRepository.setActive(id, false).\nconst id: string = seededExercise.id',
            act: 'service.unarchiveExercise(id)',
            expectedReturn: 'Exercise with isActive = true',
            expectedDbState: 'isActive = true in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.unarchiveExercise(id)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteExercise ────────────────────────────────────────────────────────────

const exerciseServiceDeleteExerciseIt: ItDescriptor = {
    reqId: 'SERV-08',
    statement: 'ExerciseService.deleteExercise(id: string): Promise<void> - delegates to exerciseRepository.delete() and removes the row if it is unreferenced.',
    data: 'id: string - the UUID of the exercise to delete.',
    precondition: 'Exercise with the given id may or may not exist. It may or may not be referenced by a WorkoutSessionExercise row.',
    results: 'void. NotFoundError if id does not exist. ConflictError if the exercise is referenced by a workout session.',
    postcondition: 'On success, the row is absent from exercises. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async deleteExercise(id: string): Promise<void> {',
        '    return this.exerciseRepository.delete(id);',
        '}',
    ],

    moduleDot: `digraph deleteExercise {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseService\\n.deleteExercise()"];

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

  method     -> repoDelete    [label="delegate"];
  repoDelete -> findUnique    [label="existence check"];
  repoDelete -> wseCount      [label="reference check"];
  repoDelete -> deleteOp      [label="remove row"];
  repoDelete -> NotFoundError [label="throws (id missing)",  style=dashed];
  repoDelete -> ConflictError [label="throws (referenced)",  style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One exercise seeded via exerciseRepository.create(). No WorkoutSessionExercise rows.\nconst id: string = seededExercise.id',
            act: 'service.deleteExercise(id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: '"Bench Press" and "Deadlift" seeded via exerciseRepository.create().\nconst id: string = seededBenchPress.id',
            act: 'service.deleteExercise(id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Only the "Deadlift" row remains in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst id: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.deleteExercise(id)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Exercise seeded via exerciseRepository.create(). Member seeded via userRepository.createMember(). WorkoutSession seeded via workoutSessionRepository.create() referencing that exercise.\nconst id: string = seededExercise.id',
            act: 'service.deleteExercise(id)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'Exercise row still present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: '"Bench Press" seeded via exerciseRepository.create() and referenced via workoutSessionRepository.create(). "Deadlift" seeded via exerciseRepository.create() with no references.',
            act: 'service.deleteExercise(benchPressId) - expects ConflictError. Then service.deleteExercise(deadliftId).',
            expectedReturn: 'First call throws ConflictError. Second call returns undefined.',
            expectedDbState: 'After both calls: only "Bench Press" row remains in exercises table.',
            actualResult: 'Passed',
        },
    ],
};

// ── createMember ──────────────────────────────────────────────────────────────

const createMemberIt: ItDescriptor = {
    reqId: 'SERV-09',
    statement: 'UserService.createMember(data: CreateMemberInput): Promise<MemberWithUser> - delegates to userRepository.createMember() and returns the persisted member with its user.',
    data: 'data: CreateMemberInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'MemberWithUser - the newly inserted member with its user nested. ConflictError if the email is already in use.',
    postcondition: 'On success, one new user row (role = MEMBER) and one new member row exist in the database. On ConflictError, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createMember(data: CreateMemberInput): Promise<MemberWithUser> {',
        '    return this.userRepository.createMember(data);',
        '}',
    ],

    moduleDot: `digraph createMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.createMember()"];

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
    TransactionError;
    ConflictError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="check duplicate email"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  repoCreate -> hash          [label="hash password"];
  repoCreate -> userCreate    [label="persist user + member"];
  repoCreate -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst inputCreateMember: CreateMemberInput = { email: "alice@test.com", fullName: "Alice Smith", phone: "0700000001", dateOfBirth: "1990-05-15", password: "Secret123!", membershipStart: "2024-01-01" }',
            act: 'service.createMember(inputCreateMember)',
            expectedReturn: 'MemberWithUser with user.email = "alice@test.com", user.role = MEMBER, isActive = true, membershipStart = 2024-01-01',
            expectedDbState: 'One user row (role = MEMBER) and one member row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User "alice@test.com" seeded via userRepository.createMember().\nconst inputCreateMember: CreateMemberInput = { email: "alice@test.com", fullName: "Alice Smith 2", phone: "0700000002", dateOfBirth: "1991-01-01", password: "Secret123!", membershipStart: "2024-06-01" }',
            act: 'service.createMember(inputCreateMember)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'users table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'User "alice@test.com" seeded via userRepository.createMember(). ConflictError attempt with same email discarded.\nconst inputCreateMember: CreateMemberInput = { email: "bob@test.com", fullName: "Bob Jones", phone: "0700000003", dateOfBirth: "1988-03-10", password: "Secret456!", membershipStart: "2024-02-01" }',
            act: 'service.createMember(inputCreateMember)',
            expectedReturn: 'MemberWithUser with user.email = "bob@test.com"',
            expectedDbState: 'users table contains exactly 2 rows',
            actualResult: 'Passed',
        },
    ],
};

// ── createMemberWithTempPassword ──────────────────────────────────────────────

const createMemberWithTempPasswordIt: ItDescriptor = {
    reqId: 'SERV-10',
    statement: 'UserService.createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<MemberWithUserAndTempPassword> - generates a random temporary password, delegates to userRepository.createMember(), and returns the persisted member with the plaintext tempPassword attached.',
    data: 'data: CreateMemberWithTempPasswordInput  { email: string, fullName: string, phone: string, dateOfBirth: string, membershipStart: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'MemberWithUserAndTempPassword - the newly inserted member with its user and a non-null tempPassword string. ConflictError if the email is already in use.',
    postcondition: 'On success, one new user row (role = MEMBER) and one new member row exist in the database. On ConflictError, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<MemberWithUserAndTempPassword> {',
        '    const tempPassword = this.generateTempPassword();',
        '    const member = await this.userRepository.createMember({...data, password: tempPassword});',
        '    return {...member, tempPassword};',
        '}',
    ],

    moduleDot: `digraph createMemberWithTempPassword {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.createMemberWithTempPassword()"];

  subgraph cluster_crypto {
    label="crypto";
    getRandomValues [label="crypto\\n.getRandomValues()"];
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
    TransactionError;
    ConflictError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> getRandomValues [label="generate temp password"];
  method     -> repoCreate      [label="delegate with temp password"];
  repoCreate -> findUnique      [label="check duplicate email"];
  repoCreate -> ConflictError   [label="throws (duplicate)", style=dashed];
  repoCreate -> hash            [label="hash temp password"];
  repoCreate -> userCreate      [label="persist user + member"];
  repoCreate -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst inputCreateMember: CreateMemberWithTempPasswordInput = { email: "alice@test.com", fullName: "Alice Smith", phone: "0700000001", dateOfBirth: "1990-05-15", membershipStart: "2024-01-01" }',
            act: 'service.createMemberWithTempPassword(inputCreateMember)',
            expectedReturn: 'MemberWithUserAndTempPassword with user.email = "alice@test.com", user.role = MEMBER, tempPassword defined and non-empty',
            expectedDbState: 'One user row (role = MEMBER) and one member row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User "alice@test.com" seeded via userRepository.createMember().\nconst inputCreateMember: CreateMemberWithTempPasswordInput = { email: "alice@test.com", fullName: "Alice Smith 2", phone: "0700000002", dateOfBirth: "1991-01-01", membershipStart: "2024-06-01" }',
            act: 'service.createMemberWithTempPassword(inputCreateMember)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'users table still contains exactly 1 row',
            actualResult: 'Passed',
        },
    ],
};

// ── createAdmin ───────────────────────────────────────────────────────────────

const createAdminIt: ItDescriptor = {
    reqId: 'SERV-11',
    statement: 'UserService.createAdmin(data: CreateAdminInput): Promise<AdminWithUser> - delegates to userRepository.createAdmin() and returns the persisted admin with its user.',
    data: 'data: CreateAdminInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'AdminWithUser - the newly inserted admin with its user nested. ConflictError if the email is already in use.',
    postcondition: 'On success, one new user row (role = ADMIN) and one new admin row exist in the database. On ConflictError, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {',
        '    return this.userRepository.createAdmin(data);',
        '}',
    ],

    moduleDot: `digraph createAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.createAdmin()"];

  subgraph cluster_repo {
    label="UserRepository";
    repoCreate [label="userRepository\\n.createAdmin()"];
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
    TransactionError;
    ConflictError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoCreate    [label="delegate"];
  repoCreate -> findUnique    [label="check duplicate email"];
  repoCreate -> ConflictError [label="throws (duplicate)", style=dashed];
  repoCreate -> hash          [label="hash password"];
  repoCreate -> userCreate    [label="persist user + admin"];
  repoCreate -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nconst inputCreateAdmin: CreateAdminInput = { email: "admin@test.com", fullName: "Admin User", phone: "0700000099", dateOfBirth: "1985-03-20", password: "AdminPass1!" }',
            act: 'service.createAdmin(inputCreateAdmin)',
            expectedReturn: 'AdminWithUser with user.email = "admin@test.com", user.role = ADMIN',
            expectedDbState: 'One user row (role = ADMIN) and one admin row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User "admin@test.com" seeded via userRepository.createAdmin().\nconst inputCreateAdmin: CreateAdminInput = { email: "admin@test.com", fullName: "Admin Two", phone: "0700000098", dateOfBirth: "1986-01-01", password: "AdminPass2!" }',
            act: 'service.createAdmin(inputCreateAdmin)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'users table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'User "admin@test.com" seeded via userRepository.createAdmin(). ConflictError attempt with same email discarded.\nconst inputCreateAdmin: CreateAdminInput = { email: "admin2@test.com", fullName: "Admin Two", phone: "0700000097", dateOfBirth: "1987-04-15", password: "AdminPass3!" }',
            act: 'service.createAdmin(inputCreateAdmin)',
            expectedReturn: 'AdminWithUser with user.email = "admin2@test.com"',
            expectedDbState: 'users table contains exactly 2 rows',
            actualResult: 'Passed',
        },
    ],
};

// ── getMember ─────────────────────────────────────────────────────────────────

const getMemberIt: ItDescriptor = {
    reqId: 'SERV-12',
    statement: 'UserService.getMember(memberId: string): Promise<MemberWithUser> - delegates to userRepository.findMemberById() and returns the matching member with its user.',
    data: 'memberId: string - the member.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain a member row with the given id.',
    results: 'MemberWithUser - the matching member with its user nested. NotFoundError if no member exists with that id.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async getMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.findMemberById(memberId);',
        '}',
    ],

    moduleDot: `digraph getMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.getMember()"];

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

  method         -> findMemberById [label="delegate"];
  findMemberById -> findUnique     [label="look up by member.id"];
  findMemberById -> NotFoundError  [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userRepository.createMember(): { email: "alice@test.com", fullName: "Alice Smith" }.\nconst inputId: string = seededMember.id',
            act: 'service.getMember(inputId)',
            expectedReturn: 'MemberWithUser with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.getMember(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── getAdmin ──────────────────────────────────────────────────────────────────

const getAdminIt: ItDescriptor = {
    reqId: 'SERV-13',
    statement: 'UserService.getAdmin(adminId: string): Promise<AdminWithUser> - delegates to userRepository.findAdminById() and returns the matching admin with its user.',
    data: 'adminId: string - the admin.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain an admin row with the given id.',
    results: 'AdminWithUser - the matching admin with its user nested. NotFoundError if no admin exists with that id.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async getAdmin(adminId: string): Promise<AdminWithUser> {',
        '    return this.userRepository.findAdminById(adminId);',
        '}',
    ],

    moduleDot: `digraph getAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.getAdmin()"];

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

  method        -> findAdminById [label="delegate"];
  findAdminById -> findUnique    [label="look up by admin.id"];
  findAdminById -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin seeded via userRepository.createAdmin(): { email: "admin@test.com", fullName: "Admin User" }.\nconst inputId: string = seededAdmin.id',
            act: 'service.getAdmin(inputId)',
            expectedReturn: 'AdminWithUser with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.getAdmin(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listMembers ───────────────────────────────────────────────────────────────

const listMembersIt: ItDescriptor = {
    reqId: 'SERV-14',
    statement: 'UserService.listMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>> - delegates to userRepository.findMembers() and returns the paginated result.',
    data: 'options?: { search?: string, page?: number, pageSize?: number } - all optional; defaults: page = 1, pageSize = 10',
    precondition: 'Database may contain any number of member rows.',
    results: 'PageResult<MemberWithUser>  { items: MemberWithUser[], total: number } - items ordered by user.fullName ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async listMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>> {',
        '    return this.userRepository.findMembers(options);',
        '}',
    ],

    moduleDot: `digraph listMembers {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.listMembers()"];

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

  method      -> findMembers  [label="delegate"];
  findMembers -> transaction  [label="atomic read"];
  transaction -> findMany     [label="paginated rows"];
  transaction -> count        [label="total count"];
  method      -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via userRepository.createMember(): Charlie (charlie@test.com), Alice (alice@test.com), Bob (bob@test.com).',
            act: 'service.listMembers()',
            expectedReturn: 'items = [Alice, Bob, Charlie], total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'service.listMembers()',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via userRepository.createMember(): Alice Smith (alice@test.com), Bob Jones (bob@test.com).\nconst inputOptions: MemberListOptions = { search: "alice" }',
            act: 'service.listMembers(inputOptions)',
            expectedReturn: 'items = [Alice Smith], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via userRepository.createMember(): Alice Smith (alice@test.com), Bob Jones (bob@test.com).\nconst inputOptions: MemberListOptions = { search: "bob@test.com" }',
            act: 'service.listMembers(inputOptions)',
            expectedReturn: 'items = [Bob Jones], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded via userRepository.createMember(): Alice, Bob.\nconst inputOptions: MemberListOptions = { pageSize: 100 }',
            act: 'service.listMembers(inputOptions)',
            expectedReturn: 'total = 2, items contains both members',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded via userRepository.createMember(): Alice Smith (alice@test.com).\nconst inputOptions: MemberListOptions = { search: "%" }',
            act: 'service.listMembers(inputOptions)',
            expectedReturn: 'items = [], total = 0. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded via userRepository.createMember(): Member1 through Member5 (fullNames sort alphabetically).\nconst inputOptions: MemberListOptions = { page: 2, pageSize: 2 }',
            act: 'service.listMembers(inputOptions)',
            expectedReturn: 'items = [Member3, Member4], total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listAdmins ────────────────────────────────────────────────────────────────

const listAdminsIt: ItDescriptor = {
    reqId: 'SERV-15',
    statement: 'UserService.listAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>> - delegates to userRepository.findAdmins() and returns the paginated result.',
    data: 'options?: { search?: string, page?: number, pageSize?: number } - all optional; defaults: page = 1, pageSize = 10',
    precondition: 'Database may contain any number of admin rows.',
    results: 'PageResult<AdminWithUser>  { items: AdminWithUser[], total: number } - items ordered by user.fullName ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async listAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>> {',
        '    return this.userRepository.findAdmins(options);',
        '}',
    ],

    moduleDot: `digraph listAdmins {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.listAdmins()"];

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

  method     -> findAdmins   [label="delegate"];
  findAdmins -> transaction  [label="atomic read"];
  transaction -> findMany    [label="paginated rows"];
  transaction -> count       [label="total count"];
  method     -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded via userRepository.createAdmin(): Charlie Admin (charlie-a@test.com), Alice Admin (alice-a@test.com).',
            act: 'service.listAdmins()',
            expectedReturn: 'items = [Alice Admin, Charlie Admin], total = 2',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'service.listAdmins()',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via userRepository.createAdmin(): Alice Admin (alice-a@test.com), Bob Admin (bob-a@test.com).\nconst inputOptions: AdminListOptions = { search: "alice" }',
            act: 'service.listAdmins(inputOptions)',
            expectedReturn: 'items = [Alice Admin], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via userRepository.createAdmin(): Alice Admin (alice-a@test.com), Bob Admin (bob-a@test.com).\nconst inputOptions: AdminListOptions = { search: "bob-a@test.com" }',
            act: 'service.listAdmins(inputOptions)',
            expectedReturn: 'items = [Bob Admin], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded via userRepository.createAdmin(): Alice Admin, Bob Admin.\nconst inputOptions: AdminListOptions = { pageSize: 50 }',
            act: 'service.listAdmins(inputOptions)',
            expectedReturn: 'total = 2, items contains both admins',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded via userRepository.createAdmin(): Alice Admin (alice-a@test.com).\nconst inputOptions: AdminListOptions = { search: "%" }',
            act: 'service.listAdmins(inputOptions)',
            expectedReturn: 'items = [], total = 0. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded via userRepository.createAdmin(): Admin1 through Admin5 (fullNames sort alphabetically).\nconst inputOptions: AdminListOptions = { page: 2, pageSize: 2 }',
            act: 'service.listAdmins(inputOptions)',
            expectedReturn: 'items = [Admin3, Admin4], total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateMember ──────────────────────────────────────────────────────────────

const updateMemberIt: ItDescriptor = {
    reqId: 'SERV-16',
    statement: 'UserService.updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> - delegates to userRepository.updateMember() and returns the updated member with its user.',
    data: 'memberId: string, data: UpdateMemberInput  { email?, fullName?, phone?, dateOfBirth?, password?, membershipStart? } - all fields optional',
    precondition: 'Member row with the given memberId may or may not exist.',
    results: 'MemberWithUser - the updated row with all changes reflected. NotFoundError if the id does not exist. ConflictError if the new email is already owned by a different user.',
    postcondition: 'On success, the target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {',
        '    return this.userRepository.updateMember(memberId, data);',
        '}',
    ],

    moduleDot: `digraph updateMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.updateMember()"];

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

  subgraph cluster_bcrypt {
    label="bcryptjs";
    hash [label="bcrypt.hash()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    TransactionError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoUpdate       [label="delegate"];
  repoUpdate -> findMember       [label="existence check"];
  repoUpdate -> NotFoundError    [label="throws (id missing)",   style=dashed];
  repoUpdate -> findUser         [label="email uniqueness check"];
  repoUpdate -> ConflictError    [label="throws (email taken)",  style=dashed];
  repoUpdate -> hash             [label="hash new password"];
  repoUpdate -> update           [label="persist changes"];
  repoUpdate -> TransactionError [label="throws (db error)",     style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userRepository.createMember(): email = "alice@test.com", fullName = "Alice Smith", phone = "0700000001".\nconst inputId: string = seededMember.id\nconst inputUpdate: UpdateMemberInput = { email: "alice2@test.com", fullName: "Alice Updated", phone: "0700000002", dateOfBirth: "1991-06-20", password: "NewPass1!", membershipStart: "2025-03-01" }',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'MemberWithUser with user.email = "alice2@test.com", user.fullName = "Alice Updated", membershipStart = 2025-03-01',
            expectedDbState: 'users row email and fullName updated; members row membershipStart updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"\nconst inputUpdate: UpdateMemberInput = { fullName: "X" }',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via userRepository.createMember(): "alice@test.com" (target), "bob@test.com" (conflict owner).\nconst inputId: string = alice.id\nconst inputUpdate: UpdateMemberInput = { email: "bob@test.com" }',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'alice users row email unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded via userRepository.createMember(): email = "alice@test.com", fullName = "Alice Smith", phone = "0700000001".\nconst inputId: string = seededMember.id\nconst inputUpdate: UpdateMemberInput = { fullName: "Alice Renamed" }',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'MemberWithUser with user.fullName = "Alice Renamed"',
            expectedDbState: 'user.fullName updated; email and phone unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member seeded via userRepository.createMember(): email = "alice@test.com", fullName = "Alice Smith".\nconst inputId: string = seededMember.id\nconst inputUpdate: UpdateMemberInput = {}',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'MemberWithUser with all fields identical to the seeded row',
            expectedDbState: 'All fields in users and members rows unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Member seeded via userRepository.createMember(): email = "alice@test.com", fullName = "Alice Smith".\nconst inputId: string = seededMember.id\nconst inputUpdate: UpdateMemberInput = { email: "alice@test.com", fullName: "Alice Still" }',
            act: 'service.updateMember(inputId, inputUpdate)',
            expectedReturn: 'MemberWithUser with user.email = "alice@test.com", user.fullName = "Alice Still"',
            expectedDbState: 'email column unchanged, fullName updated in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded via userRepository.createMember(): "alice@test.com" (target), "bob@test.com" (conflict owner). ConflictError attempt { email: "bob@test.com" } discarded.\nconst inputValidId: string = alice.id\nconst inputValidUpdate: UpdateMemberInput = { fullName: "Alice Renamed" }',
            act: 'service.updateMember(inputValidId, inputValidUpdate)',
            expectedReturn: 'MemberWithUser with user.fullName = "Alice Renamed"',
            expectedDbState: 'alice fullName updated in users row; bob row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── suspendMember ─────────────────────────────────────────────────────────────

const suspendMemberIt: ItDescriptor = {
    reqId: 'SERV-17',
    statement: 'UserService.suspendMember(memberId: string): Promise<MemberWithUser> - delegates to userRepository.setMemberActive(memberId, false) and returns the updated member with isActive = false.',
    data: 'memberId: string - the member.id (UUID) to suspend.',
    precondition: 'Member row with the given memberId may or may not exist.',
    results: 'MemberWithUser - the updated row with isActive = false. NotFoundError if the id does not exist.',
    postcondition: 'On success, isActive is false in the target members row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async suspendMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.setMemberActive(memberId, false);',
        '}',
    ],

    moduleDot: `digraph suspendMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.suspendMember()"];

  subgraph cluster_repo {
    label="UserRepository";
    setMemberActive [label="userRepository\\n.setMemberActive(id, false)"];
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

  method          -> setMemberActive [label="delegate (false)"];
  setMemberActive -> findUnique      [label="existence check"];
  setMemberActive -> update          [label="write isActive = false"];
  setMemberActive -> NotFoundError   [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active member seeded via userRepository.createMember() (isActive = true by default).\nconst inputId: string = seededMember.id\nconst inputIsActive: boolean = false',
            act: 'service.suspendMember(inputId)',
            expectedReturn: 'MemberWithUser with isActive = false',
            expectedDbState: 'isActive = false in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.suspendMember(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── activateMember ────────────────────────────────────────────────────────────

const activateMemberIt: ItDescriptor = {
    reqId: 'SERV-18',
    statement: 'UserService.activateMember(memberId: string): Promise<MemberWithUser> - delegates to userRepository.setMemberActive(memberId, true) and returns the updated member with isActive = true.',
    data: 'memberId: string - the member.id (UUID) to activate.',
    precondition: 'Member row with the given memberId may or may not exist.',
    results: 'MemberWithUser - the updated row with isActive = true. NotFoundError if the id does not exist.',
    postcondition: 'On success, isActive is true in the target members row. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async activateMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.setMemberActive(memberId, true);',
        '}',
    ],

    moduleDot: `digraph activateMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.activateMember()"];

  subgraph cluster_repo {
    label="UserRepository";
    setMemberActive [label="userRepository\\n.setMemberActive(id, true)"];
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

  method          -> setMemberActive [label="delegate (true)"];
  setMemberActive -> findUnique      [label="existence check"];
  setMemberActive -> update          [label="write isActive = true"];
  setMemberActive -> NotFoundError   [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Inactive member seeded via userRepository.createMember() then suspended via userRepository.setMemberActive(id, false).\nconst inputId: string = seededMember.id',
            act: 'service.activateMember(inputId)',
            expectedReturn: 'MemberWithUser with isActive = true',
            expectedDbState: 'isActive = true in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.activateMember(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateAdmin ───────────────────────────────────────────────────────────────

const updateAdminIt: ItDescriptor = {
    reqId: 'SERV-19',
    statement: 'UserService.updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> - delegates to userRepository.updateAdmin() and returns the updated admin with its user.',
    data: 'adminId: string, data: UpdateAdminInput  { email?, fullName?, phone?, dateOfBirth?, password? } - all fields optional',
    precondition: 'Admin row with the given adminId may or may not exist.',
    results: 'AdminWithUser - the updated row with all changes reflected. NotFoundError if the id does not exist. ConflictError if the new email is already owned by a different user.',
    postcondition: 'On success, the target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {',
        '    return this.userRepository.updateAdmin(adminId, data);',
        '}',
    ],

    moduleDot: `digraph updateAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.updateAdmin()"];

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

  subgraph cluster_bcrypt {
    label="bcryptjs";
    hash [label="bcrypt.hash()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    ConflictError;
    TransactionError;
    NotFoundError -> AppError [label="extends"];
    ConflictError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoUpdate       [label="delegate"];
  repoUpdate -> findAdmin        [label="existence check"];
  repoUpdate -> NotFoundError    [label="throws (id missing)",  style=dashed];
  repoUpdate -> findUser         [label="email uniqueness check"];
  repoUpdate -> ConflictError    [label="throws (email taken)", style=dashed];
  repoUpdate -> hash             [label="hash new password"];
  repoUpdate -> update           [label="persist changes"];
  repoUpdate -> TransactionError [label="throws (db error)",    style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin seeded via userRepository.createAdmin(): email = "admin@test.com", fullName = "Admin User", phone = "0700000099".\nconst inputId: string = seededAdmin.id\nconst inputUpdate: UpdateAdminInput = { email: "admin2@test.com", fullName: "Admin Updated", phone: "0700000098", dateOfBirth: "1986-07-10", password: "NewAdminPass1!" }',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'AdminWithUser with user.email = "admin2@test.com", user.fullName = "Admin Updated"',
            expectedDbState: 'users row email, fullName, and phone updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"\nconst inputUpdate: UpdateAdminInput = { fullName: "X" }',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via userRepository.createAdmin(): "admin-a@test.com" (target), "admin-b@test.com" (conflict owner).\nconst inputId: string = adminA.id\nconst inputUpdate: UpdateAdminInput = { email: "admin-b@test.com" }',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'admin-a users row email unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Admin seeded via userRepository.createAdmin(): email = "admin@test.com", fullName = "Admin User", phone = "0700000099".\nconst inputId: string = seededAdmin.id\nconst inputUpdate: UpdateAdminInput = { fullName: "Admin Renamed" }',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'AdminWithUser with user.fullName = "Admin Renamed"',
            expectedDbState: 'user.fullName updated; email and phone unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Admin seeded via userRepository.createAdmin(): email = "admin@test.com", fullName = "Admin User".\nconst inputId: string = seededAdmin.id\nconst inputUpdate: UpdateAdminInput = {}',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'AdminWithUser with all fields identical to the seeded row',
            expectedDbState: 'All fields in the users row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Admin seeded via userRepository.createAdmin(): email = "admin@test.com", fullName = "Admin User".\nconst inputId: string = seededAdmin.id\nconst inputUpdate: UpdateAdminInput = { email: "admin@test.com", fullName: "Admin Still" }',
            act: 'service.updateAdmin(inputId, inputUpdate)',
            expectedReturn: 'AdminWithUser with user.email = "admin@test.com", user.fullName = "Admin Still"',
            expectedDbState: 'email column unchanged, fullName updated in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded via userRepository.createAdmin(): "admin-a@test.com" (target), "admin-b@test.com" (conflict owner). ConflictError attempt { email: "admin-b@test.com" } discarded.\nconst inputValidUpdate: UpdateAdminInput = { fullName: "Admin Renamed" }',
            act: 'service.updateAdmin(adminA.id, inputValidUpdate)',
            expectedReturn: 'AdminWithUser with user.fullName = "Admin Renamed"',
            expectedDbState: 'admin A fullName updated in users row; admin B row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteMember ──────────────────────────────────────────────────────────────

const deleteMemberIt: ItDescriptor = {
    reqId: 'SERV-20',
    statement: 'UserService.deleteMember(memberId: string): Promise<void> - delegates to userRepository.delete(memberId) and removes the member and its parent user row via cascade.',
    data: 'memberId: string - the member.id (UUID) to delete.',
    precondition: 'Member row with the given id may or may not exist.',
    results: 'void. NotFoundError if the id does not exist.',
    postcondition: 'On success, the user row and cascaded member and workout session rows are absent from the database. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async deleteMember(memberId: string): Promise<void> {',
        '    return this.userRepository.delete(memberId);',
        '}',
    ],

    moduleDot: `digraph deleteMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.deleteMember()"];

  subgraph cluster_repo {
    label="UserRepository";
    repoDelete [label="userRepository\\n.delete()"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    findMember     [label="member\\n.findUnique()"];
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

  method     -> repoDelete       [label="delegate"];
  repoDelete -> findMember       [label="try member lookup"];
  repoDelete -> NotFoundError    [label="throws (missing)", style=dashed];
  repoDelete -> userDelete       [label="delete user"];
  userDelete -> memberCascade    [label="cascades to"];
  memberCascade -> sessionCascade [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One member seeded via userRepository.createMember().\nconst inputId: string = seededMember.id',
            act: 'service.deleteMember(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users or members tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'One member seeded via userRepository.createMember(). One WorkoutSession seeded via workoutSessionRepository.create() linked to that member.\nconst inputId: string = seededMember.id',
            act: 'service.deleteMember(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users, members, or workout_sessions tables',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.deleteMember(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded via userRepository.createMember(): alice, bob. NotFoundError attempt with non-existent id discarded.\nconst inputValidId: string = bob.id',
            act: 'service.deleteMember(inputValidId)',
            expectedReturn: 'undefined',
            expectedDbState: 'alice user and member rows still present; bob user and member rows removed',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteAdmin ───────────────────────────────────────────────────────────────

const deleteAdminIt: ItDescriptor = {
    reqId: 'SERV-21',
    statement: 'UserService.deleteAdmin(adminId: string): Promise<void> - delegates to userRepository.delete(adminId) and removes the admin and its parent user row via cascade.',
    data: 'adminId: string - the admin.id (UUID) to delete.',
    precondition: 'Admin row with the given id may or may not exist.',
    results: 'void. NotFoundError if the id does not exist.',
    postcondition: 'On success, the user row and cascaded admin row are absent from the database. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async deleteAdmin(adminId: string): Promise<void> {',
        '    return this.userRepository.delete(adminId);',
        '}',
    ],

    moduleDot: `digraph deleteAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserService\\n.deleteAdmin()"];

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

  method     -> repoDelete    [label="delegate"];
  repoDelete -> findAdmin     [label="admin lookup"];
  repoDelete -> NotFoundError [label="throws (missing)", style=dashed];
  repoDelete -> userDelete    [label="delete user"];
  userDelete -> adminCascade  [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One admin seeded via userRepository.createAdmin().\nconst inputId: string = seededAdmin.id',
            act: 'service.deleteAdmin(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users or admins tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.deleteAdmin(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded via userRepository.createAdmin(): adminA, adminB. NotFoundError attempt with non-existent id discarded.\nconst inputValidId: string = adminB.id',
            act: 'service.deleteAdmin(inputValidId)',
            expectedReturn: 'undefined',
            expectedDbState: 'adminA user and admin rows still present; adminB user and admin rows removed',
            actualResult: 'Passed',
        },
    ],
};

const getMemberProgressReportIt: ItDescriptor = {
    reqId: 'SERV-22',
    statement: 'ReportService.getMemberProgressReport(memberId: string, startDate: Date, endDate: Date): Promise<Report> - resolves the member, fetches all sessions in the date window, aggregates per-exercise statistics and session details, and returns a fully computed Report.',
    data: 'memberId: string, startDate: Date, endDate: Date',
    precondition: 'Member with the given memberId may or may not exist. The date window may or may not contain workout sessions for that member.',
    results: 'Report - { memberId, memberName, startDate, endDate, totalSessions, totalVolume, averageSessionDuration, exerciseBreakdown, sessionDetails }. NotFoundError if the member does not exist.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async getMemberProgressReport(memberId: string, startDate: Date, endDate: Date): Promise<Report> {',
        '    const member = await this.userRepository.findMemberById(memberId);',
        '    const {items: sessions} = await this.workoutSessionRepository.findAll({memberId, startDate, endDate});',
        '',
        '    const exerciseStatsMap = new Map<string, ExerciseStats>();',
        '    const exerciseSessionSets = new Map<string, Set<string>>();',
        '',
        '    const sessionDetails: SessionDetail[] = sessions.map((session) => {',
        '        const exerciseDetails: SessionExerciseDetail[] = session.exercises.map((entry) => {',
        '            const weight = Number(entry.weight);',
        '            const volume = entry.sets * entry.reps * weight;',
        '',
        '            if (!exerciseStatsMap.has(entry.exerciseId)) {',
        '                exerciseStatsMap.set(entry.exerciseId, {',
        '                    exerciseId: entry.exerciseId,',
        '                    exerciseName: entry.exercise.name,',
        '                    muscleGroup: entry.exercise.muscleGroup,',
        '                    totalSets: 0, totalReps: 0, totalVolume: 0, sessionCount: 0,',
        '                });',
        '                exerciseSessionSets.set(entry.exerciseId, new Set());',
        '            }',
        '',
        '            const stats = exerciseStatsMap.get(entry.exerciseId)!;',
        '            stats.totalSets += entry.sets;',
        '            stats.totalReps += entry.reps * entry.reps;',
        '            stats.totalVolume += volume;',
        '            exerciseSessionSets.get(entry.exerciseId)!.add(session.id);',
        '',
        '            return {exerciseId: entry.exerciseId, exerciseName: entry.exercise.name,',
        '                    sets: entry.sets, reps: entry.reps, weight, volume};',
        '        });',
        '',
        '        const totalVolume = exerciseDetails.reduce((sum, e) => sum + e.volume, 0);',
        '        return {sessionId: session.id, date: session.date, durationMinutes: session.duration,',
        '                notes: session.notes, exercises: exerciseDetails, totalVolume};',
        '    });',
        '',
        '    for (const [exerciseId, sessionIdSet] of exerciseSessionSets) {',
        '        exerciseStatsMap.get(exerciseId)!.sessionCount = sessionIdSet.size;',
        '    }',
        '',
        '    const exerciseBreakdown = Array.from(exerciseStatsMap.values())',
        '        .sort((a, b) => b.totalVolume - a.totalVolume);',
        '',
        '    const totalVolume = sessionDetails.reduce((sum, s) => sum + s.totalVolume, 0);',
        '    const averageSessionDuration = sessions.length > 0',
        '        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length',
        '        : 0;',
        '',
        '    return {memberId, memberName: member.user.fullName, startDate, endDate,',
        '            totalSessions: sessions.length, totalVolume, averageSessionDuration,',
        '            exerciseBreakdown, sessionDetails};',
        '}',
    ],

    moduleDot: `digraph getMemberProgressReport {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ReportService\\n.getMemberProgressReport()"];

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
    memberFind [label="member\\n.findUnique()"];
    transaction  [label="$transaction()"];
    findMany     [label="workoutSession\\n.findMany()\\n{ include: exercises.exercise }"];
    count        [label="workoutSession\\n.count()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }

  method         -> findMemberById [label="resolve member"];
  findMemberById -> memberFind     [label="look up by member.id"];
  findMemberById -> NotFoundError  [label="throws (missing)", style=dashed];

  method         -> findAll        [label="fetch sessions in window"];
  findAll        -> transaction    [label="atomic read"];
  transaction    -> findMany       [label="filtered rows"];
  transaction    -> count          [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userRepository.createMember(). Exercise seeded via exerciseRepository.create(): { name: "Bench Press", muscleGroup: CHEST }. One session seeded via workoutSessionRepository.create() on date "2024-01-15" with duration 60, one exercise entry: { sets: 3, reps: 10, weight: 100 }.\nconst inputMemberId: string = seededMember.id\nconst inputStartDate: Date = new Date("2024-01-01")\nconst inputEndDate: Date = new Date("2024-01-31")',
            act: 'service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate)',
            expectedReturn: 'Report with memberId, memberName = seededMember.user.fullName, totalSessions = 1, totalVolume = 3000, averageSessionDuration = 60, exerciseBreakdown.length = 1, exerciseBreakdown[0].totalSets = 3, exerciseBreakdown[0].sessionCount = 1, sessionDetails.length = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded. Two exercises seeded: "Bench Press" (CHEST), "Deadlift" (BACK). Two sessions seeded on dates "2024-01-10" (duration 60) and "2024-01-20" (duration 90). Session 1: Bench Press { sets: 3, reps: 10, weight: 100 } = volume 3000. Session 2: Deadlift { sets: 4, reps: 5, weight: 150 } = volume 3000, Bench Press { sets: 2, reps: 8, weight: 80 } = volume 1280.\nconst inputStartDate: Date = new Date("2024-01-01")\nconst inputEndDate: Date = new Date("2024-01-31")',
            act: 'service.getMemberProgressReport(seededMember.id, inputStartDate, inputEndDate)',
            expectedReturn: 'Report with totalSessions = 2, totalVolume = 7280, averageSessionDuration = 75. exerciseBreakdown sorted by totalVolume descending: Deadlift (volume 3000, sessionCount = 1) before Bench Press (volume 4280, sessionCount = 2) - wait, Bench Press total = 3000 + 1280 = 4280, Deadlift = 3000. exerciseBreakdown[0].exerciseName = "Bench Press" (highest volume 4280), exerciseBreakdown[1].exerciseName = "Deadlift". Bench Press sessionCount = 2.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded. Exercise seeded. Two sessions seeded on dates "2024-01-10" and "2024-01-20", both containing the same exercise: { sets: 3, reps: 10, weight: 50 } each.\nconst inputStartDate: Date = new Date("2024-01-01")\nconst inputEndDate: Date = new Date("2024-01-31")',
            act: 'service.getMemberProgressReport(seededMember.id, inputStartDate, inputEndDate)',
            expectedReturn: 'Report with exerciseBreakdown.length = 1, exerciseBreakdown[0].totalSets = 6, exerciseBreakdown[0].totalReps = 60, exerciseBreakdown[0].totalVolume = 3000, exerciseBreakdown[0].sessionCount = 2',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded. Exercise seeded. One session seeded outside the query window on date "2024-03-01".\nconst inputStartDate: Date = new Date("2024-01-01")\nconst inputEndDate: Date = new Date("2024-01-31")',
            act: 'service.getMemberProgressReport(seededMember.id, inputStartDate, inputEndDate)',
            expectedReturn: 'Report with totalSessions = 0, totalVolume = 0, averageSessionDuration = 0, exerciseBreakdown = [], sessionDetails = []',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Empty database.\nconst inputMemberId: string = "00000000-0000-0000-0000-000000000000"\nconst inputStartDate: Date = new Date("2024-01-01")\nconst inputEndDate: Date = new Date("2024-01-31")',
            act: 'service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── createWorkoutSession ──────────────────────────────────────────────────────

const createWorkoutSessionIt: ItDescriptor = {
    reqId: 'SERV-23',
    statement: 'WorkoutSessionService.createWorkoutSession(data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]): Promise<WorkoutSessionWithExercises> — delegates to workoutSessionRepository.create() and returns the persisted session with all exercise relations.',
    data: 'data: CreateWorkoutSessionInput  { memberId: string, date: string, duration: number, notes?: string }, exercises: WorkoutSessionExerciseInput[]  { exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Database may or may not contain the member identified by data.memberId. Each exerciseId in the exercises array must reference an existing exercise row.',
    results: 'WorkoutSessionWithExercises — the newly inserted session row with all linked exercise rows included, or WorkoutSessionRequiresExercisesError if exercises is empty, or NotFoundError if the member does not exist.',
    postcondition: 'One new workout_sessions row and one workout_session_exercises row per exercise entry exist in the database. On error, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createWorkoutSession(',
        '    data: CreateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseInput[],',
        '): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.create(data, exercises);',
        '}',
    ],

    moduleDot: `digraph createWorkoutSession {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.createWorkoutSession()"];

  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoCreate [label="workoutSessionRepository\\n.create()"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    findMember    [label="member\\n.findUnique()"];
    createSession [label="workoutSession\\n.create()\\n{ include: exercises.exercise }"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    WorkoutSessionRequiresExercisesError;
    NotFoundError;
    TransactionError;
    WorkoutSessionRequiresExercisesError -> AppError [label="extends"];
    NotFoundError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoCreate       [label="delegate"];
  repoCreate -> WsreError        [label="throws (empty exercises)", style=dashed];
  repoCreate -> findMember       [label="member existence check"];
  repoCreate -> NotFoundError    [label="throws (member missing)", style=dashed];
  repoCreate -> createSession    [label="insert session + exercises"];
  repoCreate -> TransactionError [label="throws (db failure)",     style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded via userRepository.createMember(). Exercise seeded via exerciseRepository.create().\nconst inputData: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 60, notes: "Test" }\nconst inputExercises: WorkoutSessionExerciseInput[] = [{ exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'service.createWorkoutSession(inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with memberId matching seeded member, duration = 60, exercises array of length 1',
            expectedDbState: 'One workout_sessions row and one workout_session_exercises row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userRepository.createMember(). Two exercises seeded via exerciseRepository.create().\nconst inputData: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 45 }\nconst inputExercises: WorkoutSessionExerciseInput[] = [{ exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }, { exerciseId: exercise2.id, sets: 4, reps: 8, weight: 80 }]',
            act: 'service.createWorkoutSession(inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2',
            expectedDbState: 'One workout_sessions row and two workout_session_exercises rows linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded via userRepository.createMember().\nconst inputData: CreateWorkoutSessionInput = { memberId: seededMember.id, date: "2024-06-01", duration: 60 }\nconst inputExercises: WorkoutSessionExerciseInput[] = []',
            act: 'service.createWorkoutSession(inputData, inputExercises)',
            expectedReturn: 'Throws WorkoutSessionRequiresExercisesError',
            expectedDbState: 'workout_sessions table contains no rows',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.\nconst inputData: CreateWorkoutSessionInput = { memberId: "00000000-0000-0000-0000-000000000000", date: "2024-06-01", duration: 60 }\nconst inputExercises: WorkoutSessionExerciseInput[] = [{ exerciseId: "00000000-0000-0000-0000-000000000001", sets: 3, reps: 10, weight: 50 }]',
            act: 'service.createWorkoutSession(inputData, inputExercises)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'workout_sessions table contains no rows',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member seeded via userRepository.createMember(). Exercise seeded via exerciseRepository.create().\nAttempt 1: createWorkoutSession with memberId = "00000000-..." → NotFoundError (discarded).\nconst inputData: CreateWorkoutSessionInput = { memberId: validMemberId, date: "2024-06-01", duration: 60 }\nconst inputExercises: WorkoutSessionExerciseInput[] = [{ exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'service.createWorkoutSession(inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with memberId matching seeded member',
            expectedDbState: 'One workout_sessions row and one workout_session_exercises row exist in the database',
            actualResult: 'Passed',
        },
    ],
};

// ── getWorkoutSession ─────────────────────────────────────────────────────────

const getWorkoutSessionIt: ItDescriptor = {
    reqId: 'SERV-24',
    statement: 'WorkoutSessionService.getWorkoutSession(workoutSessionId: string): Promise<WorkoutSessionWithExercises> — delegates to workoutSessionRepository.findById() and returns the matching session with full exercise relations.',
    data: 'workoutSessionId: string — the workout_sessions UUID to retrieve.',
    precondition: 'Database may or may not contain a workout_sessions row with the given id.',
    results: 'WorkoutSessionWithExercises — the matching session row with all linked exercise rows included. NotFoundError if no row exists with that id.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async getWorkoutSession(workoutSessionId: string): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.findById(workoutSessionId);',
        '}',
    ],

    moduleDot: `digraph getWorkoutSession {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.getWorkoutSession()"];

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

  method   -> findById      [label="delegate"];
  findById -> findUnique    [label="look up by id"];
  findById -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create() with notes = "Rest day", duration = 60.\nconst inputId: string = seededSession.id',
            act: 'service.getWorkoutSession(inputId)',
            expectedReturn: 'WorkoutSessionWithExercises with all fields identical to the seeded row, exercises array of length 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.getWorkoutSession(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── listMemberWorkoutSessions ─────────────────────────────────────────────────

const listMemberWorkoutSessionsIt: ItDescriptor = {
    reqId: 'SERV-25',
    statement: 'WorkoutSessionService.listMemberWorkoutSessions(memberId: string, options?: WorkoutSessionListOptions): Promise<PageResult<WorkoutSessionWithExercises>> — delegates to workoutSessionRepository.findAll() with memberId always injected; pagination activates only when both page and pageSize are present, switching order from date ASC to date DESC.',
    data: 'memberId: string, options?: { startDate?: Date, endDate?: Date, page?: number, pageSize?: number } — all optional',
    precondition: 'Database may contain any number of workout_sessions rows for the given member.',
    results: 'PageResult<WorkoutSessionWithExercises>  { items, total } — items ordered by date ASC without pagination, date DESC with pagination; total reflecting the unsliced filtered count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async listMemberWorkoutSessions(',
        '    memberId: string,',
        '    options?: WorkoutSessionListOptions,',
        '): Promise<PageResult<WorkoutSessionWithExercises>> {',
        '    return this.workoutSessionRepository.findAll({memberId, ...options});',
        '}',
    ],

    moduleDot: `digraph listMemberWorkoutSessions {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.listMemberWorkoutSessions()"];

  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    findAll [label="workoutSessionRepository\\n.findAll()\\n{ memberId, ...options }"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
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

  method  -> findAll      [label="delegate (memberId always set)"];
  findAll -> transaction  [label="atomic read"];
  transaction -> findMany [label="filtered + paginated rows"];
  transaction -> count    [label="total count"];
  method  -> AppError     [label="catches", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded. Exercise seeded. Three sessions seeded via workoutSessionRepository.create(): dates "2024-01-01", "2024-03-01", "2024-06-01".',
            act: 'service.listMemberWorkoutSessions(seededMember.id)',
            expectedReturn: 'items = [2024-01-01, 2024-03-01, 2024-06-01] (date ASC), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member seeded via userRepository.createMember(). No sessions seeded.',
            act: 'service.listMemberWorkoutSessions(seededMember.id)',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Two members seeded. Exercise seeded. One session per member seeded via workoutSessionRepository.create().',
            act: 'service.listMemberWorkoutSessions(member1.id)',
            expectedReturn: 'items = [session1], total = 1 — session for member2 excluded',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded. Exercise seeded. Two sessions seeded: "2024-01-01", "2024-06-01".\nconst inputOptions: WorkoutSessionListOptions = { startDate: new Date("2024-03-01") }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-06-01], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member seeded. Exercise seeded. Two sessions seeded: "2024-01-01", "2024-06-01".\nconst inputOptions: WorkoutSessionListOptions = { endDate: new Date("2024-03-01") }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-01-01], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Member seeded. Exercise seeded. Three sessions seeded: "2024-01-01", "2024-04-01", "2024-08-01".\nconst inputOptions: WorkoutSessionListOptions = { startDate: new Date("2024-03-01"), endDate: new Date("2024-06-01") }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-04-01], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Two members seeded: member1 (m1@test.com), member2 (m2@test.com). Exercise seeded. Sessions seeded: member1 → "2024-01-01", member1 → "2024-06-01", member2 → "2024-06-01".\nconst inputOptions: WorkoutSessionListOptions = { startDate: new Date(\'2024-03-01\') }',
            act: 'service.listMemberWorkoutSessions(member1.id, inputOptions)',
            expectedReturn: 'items = [member1\'s 2024-06-01 session only], total = 1 (member1\'s 2024-01-01 session excluded by startDate; member2\'s 2024-06-01 session excluded by memberId)',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Member seeded. Exercise seeded. Five sessions seeded via workoutSessionRepository.create(): dates "2024-01-01" through "2024-05-01".\nconst inputOptions: WorkoutSessionListOptions = { page: 2, pageSize: 2 }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-03-01, 2024-02-01] (date DESC, page 2 of 3), total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '9',
            arrange: 'Member seeded. Exercise seeded. Three sessions seeded: "2024-01-01", "2024-02-01", "2024-03-01".\nconst inputOptions: WorkoutSessionListOptions = { page: 0, pageSize: 2 }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-03-01, 2024-02-01] (date DESC, page clamped to 1), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '10',
            arrange: 'Member seeded. Exercise seeded. Three sessions seeded: "2024-01-01", "2024-02-01", "2024-03-01".\nconst inputOptions: WorkoutSessionListOptions = { page: 1, pageSize: 100 }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items contains all 3 sessions (date DESC), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '11',
            arrange: 'Member seeded. Exercise seeded. Three sessions seeded: "2024-01-01", "2024-02-01", "2024-03-01".\nconst inputOptions: WorkoutSessionListOptions = { page: 2 }',
            act: 'service.listMemberWorkoutSessions(seededMember.id, inputOptions)',
            expectedReturn: 'items = [2024-01-01, 2024-02-01, 2024-03-01] (date ASC, not paginated — pageSize absent), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateWorkoutSession ──────────────────────────────────────────────────────

const updateWorkoutSessionIt: ItDescriptor = {
    reqId: 'SERV-26',
    statement: 'WorkoutSessionService.updateWorkoutSession(workoutSessionId: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession> — delegates to workoutSessionRepository.update() and returns the updated session without exercises.',
    data: 'workoutSessionId: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? } — all fields optional',
    precondition: 'Workout session with the given id may or may not exist.',
    results: 'WorkoutSession — the updated row with all changes reflected (exercise links not included). NotFoundError if the id does not exist.',
    postcondition: 'The target workout_sessions row reflects the supplied changes; unspecified fields are unchanged. workout_session_exercises rows are not modified. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateWorkoutSession(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '): Promise<WorkoutSession> {',
        '    return this.workoutSessionRepository.update(workoutSessionId, data);',
        '}',
    ],

    moduleDot: `digraph updateWorkoutSession {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.updateWorkoutSession()"];

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

  method     -> repoUpdate    [label="delegate"];
  repoUpdate -> findUnique    [label="existence check"];
  repoUpdate -> NotFoundError [label="throws (id missing)", style=dashed];
  repoUpdate -> update        [label="persist changes"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create(): date = "2024-06-01", duration = 60, notes = "Original".\nconst inputId: string = seededSession.id\nconst inputData: UpdateWorkoutSessionInput = { date: "2025-01-15", duration: 90, notes: "Updated" }',
            act: 'service.updateWorkoutSession(inputId, inputData)',
            expectedReturn: 'WorkoutSession with date = 2025-01-15, duration = 90, notes = "Updated"',
            expectedDbState: 'workout_sessions row date, duration, and notes updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"\nconst inputData: UpdateWorkoutSessionInput = { duration: 90 }',
            act: 'service.updateWorkoutSession(inputId, inputData)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create(): date = "2024-06-01", duration = 60, notes = "Original".\nconst inputId: string = seededSession.id\nconst inputData: UpdateWorkoutSessionInput = { duration: 90 }',
            act: 'service.updateWorkoutSession(inputId, inputData)',
            expectedReturn: 'WorkoutSession with duration = 90',
            expectedDbState: 'workout_sessions row duration updated; date and notes unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create(): date = "2024-06-01", duration = 60, notes = "Original".\nconst inputId: string = seededSession.id\nconst inputData: UpdateWorkoutSessionInput = {}',
            act: 'service.updateWorkoutSession(inputId, inputData)',
            expectedReturn: 'WorkoutSession with all fields identical to the seeded row',
            expectedDbState: 'All fields in the workout_sessions row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member and exercise seeded. Two sessions seeded via workoutSessionRepository.create(): sessionA (duration = 60) and sessionB (duration = 45).\nAttempt 1: updateWorkoutSession("00000000-...") → NotFoundError (discarded).\nconst inputId: string = sessionB.id\nconst inputData: UpdateWorkoutSessionInput = { duration: 90 }',
            act: 'service.updateWorkoutSession(inputId, inputData)',
            expectedReturn: 'WorkoutSession with duration = 90',
            expectedDbState: 'sessionB duration updated; sessionA row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── updateWorkoutSessionWithExercises ─────────────────────────────────────────

const updateWorkoutSessionWithExercisesIt: ItDescriptor = {
    reqId: 'SERV-27',
    statement: 'WorkoutSessionService.updateWorkoutSessionWithExercises(workoutSessionId: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]): Promise<WorkoutSessionWithExercises> — delegates to workoutSessionRepository.updateWithExercises() and returns the updated session with the reconciled exercise list.',
    data: 'workoutSessionId: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? }, exercises: WorkoutSessionExerciseUpdateInput[]  { id?: string, exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Workout session with the given id may or may not exist. Each exerciseId references an existing exercise row.',
    results: 'WorkoutSessionWithExercises — the updated session with the reconciled exercise links. WorkoutSessionRequiresExercisesError if exercises is empty. NotFoundError if the session does not exist.',
    postcondition: 'Session scalar fields updated; workout_session_exercises rows reconciled (deleted, updated, and created as needed). On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateWorkoutSessionWithExercises(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseUpdateInput[],',
        '): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.updateWithExercises(workoutSessionId, data, exercises);',
        '}',
    ],

    moduleDot: `digraph updateWorkoutSessionWithExercises {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.updateWorkoutSessionWithExercises()"];

  subgraph cluster_repo {
    label="WorkoutSessionRepository";
    repoUpdate [label="workoutSessionRepository\\n.updateWithExercises()"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    findSession   [label="workoutSession\\n.findUnique()"];
    transaction   [label="\\$transaction()"];
    wseFindMany   [label="workoutSessionExercise\\n.findMany()"];
    wseDeleteMany [label="workoutSessionExercise\\n.deleteMany()"];
    wseUpdate     [label="workoutSessionExercise\\n.update()"];
    wseCreateMany [label="workoutSessionExercise\\n.createMany()"];
    sessionUpdate [label="workoutSession\\n.update()\\n{ include: exercises.exercise }"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    WorkoutSessionRequiresExercisesError;
    NotFoundError;
    TransactionError;
    WorkoutSessionRequiresExercisesError -> AppError [label="extends"];
    NotFoundError -> AppError [label="extends"];
    TransactionError -> AppError [label="extends"];
  }

  method     -> repoUpdate      [label="delegate"];
  repoUpdate -> WsreError       [label="throws (empty exercises)", style=dashed];
  repoUpdate -> findSession     [label="existence check"];
  repoUpdate -> NotFoundError   [label="throws (id missing)",      style=dashed];
  repoUpdate -> transaction     [label="reconcile exercises"];
  transaction -> wseFindMany    [label="get existing WSE ids"];
  transaction -> wseDeleteMany  [label="remove unlisted"];
  transaction -> wseUpdate      [label="update kept (by id)"];
  transaction -> wseCreateMany  [label="add new (no id)"];
  transaction -> sessionUpdate  [label="update session fields"];
  repoUpdate -> TransactionError [label="throws (db error)",       style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create() with that exercise (WSE1).\nconst inputId: string = seededSession.id\nconst inputData: UpdateWorkoutSessionInput = { duration: 90 }\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100 }]',
            act: 'service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with duration = 90, exercises[0].sets = 5, exercises[0].reps = 8, exercises[0].weight = 100',
            expectedDbState: 'workout_sessions duration updated; WSE1 sets = 5, reps = 8, weight = 100 in workout_session_exercises',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create().\nconst inputId: string = seededSession.id\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = []',
            act: 'service.updateWorkoutSessionWithExercises(inputId, {}, inputExercises)',
            expectedReturn: 'Throws WorkoutSessionRequiresExercisesError',
            expectedDbState: 'All workout_sessions and workout_session_exercises rows unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ exerciseId: "00000000-0000-0000-0000-000000000001", sets: 3, reps: 10, weight: 50 }]',
            act: 'service.updateWorkoutSessionWithExercises(inputId, {}, inputExercises)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member and two exercises seeded. Session seeded via workoutSessionRepository.create() with both exercises (WSE1 for exercise1, WSE2 for exercise2).\nconst inputId: string = seededSession.id\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }] — exercise2 omitted',
            act: 'service.updateWorkoutSessionWithExercises(inputId, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 1 containing only exercise1',
            expectedDbState: 'WSE2 row removed from workout_session_exercises; WSE1 row still present',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create() with that exercise (WSE1, sets = 3, reps = 10, weight = 50).\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100 }]',
            act: 'service.updateWorkoutSessionWithExercises(seededSession.id, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises[0].sets = 5, reps = 8, weight = 100',
            expectedDbState: 'WSE1 sets = 5, reps = 8, weight = 100 in workout_session_exercises',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Member and two exercises seeded. Session seeded via workoutSessionRepository.create() with exercise1 only (WSE1).\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }, { exerciseId: exercise2.id, sets: 2, reps: 15, weight: 20 }]',
            act: 'service.updateWorkoutSessionWithExercises(seededSession.id, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2',
            expectedDbState: 'Two workout_session_exercises rows exist for the session',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Member and three exercises seeded. Session seeded via workoutSessionRepository.create() with exercise1 (WSE1) and exercise2 (WSE2).\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60 }, { exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40 }] — exercise2 omitted',
            act: 'service.updateWorkoutSessionWithExercises(seededSession.id, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2 — WSE1 updated, exercise3 present, exercise2 absent',
            expectedDbState: 'WSE1 sets = 4 in workout_session_exercises; WSE2 row removed; one new WSE row for exercise3 created',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create() with that exercise (WSE1).\nAttempt 1: updateWorkoutSessionWithExercises(sessionId, {}, []) → WorkoutSessionRequiresExercisesError (discarded).\nconst inputData: UpdateWorkoutSessionInput = { duration: 90 }\nconst inputExercises: WorkoutSessionExerciseUpdateInput[] = [{ id: WSE1.id, exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50 }]',
            act: 'service.updateWorkoutSessionWithExercises(seededSession.id, inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with duration = 90',
            expectedDbState: 'workout_sessions duration updated; workout_session_exercises row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── deleteWorkoutSession ──────────────────────────────────────────────────────

const deleteWorkoutSessionIt: ItDescriptor = {
    reqId: 'SERV-28',
    statement: 'WorkoutSessionService.deleteWorkoutSession(workoutSessionId: string): Promise<void> — delegates to workoutSessionRepository.delete() and removes the session row, cascading to all linked workout_session_exercises rows.',
    data: 'workoutSessionId: string — the workout_sessions UUID to delete.',
    precondition: 'Workout session with the given id may or may not exist.',
    results: 'void. NotFoundError if no row exists with that id.',
    postcondition: 'On success, the session row and all linked workout_session_exercises rows are absent from the database. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async deleteWorkoutSession(workoutSessionId: string): Promise<void> {',
        '    return this.workoutSessionRepository.delete(workoutSessionId);',
        '}',
    ],

    moduleDot: `digraph deleteWorkoutSession {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionService\\n.deleteWorkoutSession()"];

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

  method     -> repoDelete    [label="delegate"];
  repoDelete -> findUnique    [label="existence check"];
  repoDelete -> NotFoundError [label="throws (id missing)", style=dashed];
  repoDelete -> deleteOp      [label="remove row"];
  deleteOp -> deleteOpWSE [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded via workoutSessionRepository.create() with that exercise.\nconst inputId: string = seededSession.id\nconst wseId: string = seededSession.exercises[0].id',
            act: 'service.deleteWorkoutSession(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in workout_sessions or workout_session_exercises tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nconst inputId: string = "00000000-0000-0000-0000-000000000000"',
            act: 'service.deleteWorkoutSession(inputId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member and two exercises seeded. Session seeded via workoutSessionRepository.create() with both exercises (two WSE rows).\nconst inputId: string = seededSession.id',
            act: 'service.deleteWorkoutSession(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Session row and both workout_session_exercises rows no longer present in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member and exercise seeded. Two sessions seeded via workoutSessionRepository.create(): sessionA ("2024-01-01") and sessionB ("2024-02-01"), each with one exercise.\nAttempt 1: deleteWorkoutSession("00000000-...") → NotFoundError (discarded).\nconst inputId: string = sessionB.id',
            act: 'service.deleteWorkoutSession(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'sessionA and its workout_session_exercises row still present; sessionB and its workout_session_exercises row removed',
            actualResult: 'Passed',
        },
    ],
};

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const AUTH_SERV = path.join(BASE, 'auth-service');
    await writeIt(authServiceLoginIt, path.join(AUTH_SERV, 'login-it-form.xlsx'));

    const EXERCISE_SERV = path.join(BASE, 'exercise-service');
    await writeIt(exerciseServiceCreateExerciseIt, path.join(EXERCISE_SERV, 'createExercise-it-form.xlsx'));
    await writeIt(exerciseServiceGetExerciseIt, path.join(EXERCISE_SERV, 'getExercise-it-form.xlsx'));
    await writeIt(exerciseServiceListExercisesIt, path.join(EXERCISE_SERV, 'listExercises-it-form.xlsx'));
    await writeIt(exerciseServiceUpdateExerciseIt, path.join(EXERCISE_SERV, 'updateExercise-it-form.xlsx'));
    await writeIt(exerciseServiceArchiveExerciseIt, path.join(EXERCISE_SERV, 'archiveExercise-it-form.xlsx'));
    await writeIt(exerciseServiceUnarchiveExerciseIt, path.join(EXERCISE_SERV, 'unarchiveExercise-it-form.xlsx'));
    await writeIt(exerciseServiceDeleteExerciseIt, path.join(EXERCISE_SERV, 'deleteExercise-it-form.xlsx'));

    const USER_SERV = path.join(BASE, 'user-service');
    await writeIt(createMemberIt, path.join(USER_SERV, 'createMember-it-form.xlsx'));
    await writeIt(createMemberWithTempPasswordIt, path.join(USER_SERV, 'createMemberWithTempPassword-it-form.xlsx'));
    await writeIt(createAdminIt, path.join(USER_SERV, 'createAdmin-it-form.xlsx'));
    await writeIt(getMemberIt, path.join(USER_SERV, 'getMember-it-form.xlsx'));
    await writeIt(getAdminIt, path.join(USER_SERV, 'getAdmin-it-form.xlsx'));
    await writeIt(listMembersIt, path.join(USER_SERV, 'listMembers-it-form.xlsx'));
    await writeIt(listAdminsIt, path.join(USER_SERV, 'listAdmins-it-form.xlsx'));
    await writeIt(updateMemberIt, path.join(USER_SERV, 'updateMember-it-form.xlsx'));
    await writeIt(suspendMemberIt, path.join(USER_SERV, 'suspendMember-it-form.xlsx'));
    await writeIt(activateMemberIt, path.join(USER_SERV, 'activateMember-it-form.xlsx'));
    await writeIt(updateAdminIt, path.join(USER_SERV, 'updateAdmin-it-form.xlsx'));
    await writeIt(deleteMemberIt, path.join(USER_SERV, 'deleteMember-it-form.xlsx'));
    await writeIt(deleteAdminIt, path.join(USER_SERV, 'deleteAdmin-it-form.xlsx'));

    const REPORT_SERV = path.join(BASE, 'report-service');
    await writeIt(getMemberProgressReportIt, path.join(REPORT_SERV, 'getMemberProgressReport-it-form.xlsx'));

    const WS_SERV = path.join(BASE, 'workout-session-service');
    await writeIt(createWorkoutSessionIt, path.join(WS_SERV, 'createWorkoutSession-it-form.xlsx'));
    await writeIt(getWorkoutSessionIt, path.join(WS_SERV, 'getWorkoutSession-it-form.xlsx'));
    await writeIt(listMemberWorkoutSessionsIt, path.join(WS_SERV, 'listMemberWorkoutSessions-it-form.xlsx'));
    await writeIt(updateWorkoutSessionIt, path.join(WS_SERV, 'updateWorkoutSession-it-form.xlsx'));
    await writeIt(updateWorkoutSessionWithExercisesIt, path.join(WS_SERV, 'updateWorkoutSessionWithExercises-it-form.xlsx'));
    await writeIt(deleteWorkoutSessionIt, path.join(WS_SERV, 'deleteWorkoutSession-it-form.xlsx'));

    console.log('Done.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});