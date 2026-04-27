import * as path from 'path';
import {writeIt, ItDescriptor} from './generate-it-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'repository', '__tests__', 'it');

const SHARED_REMARKS = [
    'Run:  npm run test:integration',
    'Tear down:  npm run test:integration:down',
    'All repository singletons are instantiated and accessed via the lib/di module, which configures them to use the shared PrismaClient instance.',
];

const createIt: ItDescriptor = {
    reqId: 'REPO-1',
    statement: 'ExerciseRepository.create(data: CreateExerciseInput): Promise<Exercise> - validates name uniqueness then inserts a new exercise row and returns the persisted entity.',
    data: 'data: CreateExerciseInput  { name: string, description?: string, muscleGroup: MuscleGroup, equipmentNeeded: Equipment }',
    precondition: 'Database is clean. No exercise with the given name exists.',
    results: 'Exercise - the newly inserted row with all fields populated and isActive defaulting to true.',
    postcondition: 'One new row exists in the exercises table. If a duplicate name was given, no row is inserted and ConflictError is thrown.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async create(data: CreateExerciseInput): Promise<Exercise> {',
        '    const existing = await this.database.exercise.findUnique({',
        '        where: { name: data.name },',
        '    });',
        '    if (existing) {',
        '        throw new ConflictError(',
        '            `Exercise name already in use: ${data.name}`',
        '        );',
        '    }',
        '    return this.database.exercise.create({ data });',
        '}',
    ],

    moduleDot: `digraph create {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.create()"];

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

  method -> findUnique    [label="check uniqueness"];
  method -> create        [label="insert row"];
  method -> ConflictError [label="throws (duplicate)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nInput: { name: "Deadlift", description: "Posterior chain compound movement", muscleGroup: BACK, equipmentNeeded: BARBELL }',
            act: 'repository.create(input)',
            expectedReturn: 'Exercise with id defined, name = "Deadlift", muscleGroup = BACK, isActive = true',
            expectedDbState: 'One row in exercises with all input fields matching and isActive = true',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise "Bench Press" already seeded.\nInput: { name: "Bench Press", ... }',
            act: 'repository.create(input)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'exercises table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nTwo inputs with different names: "Squat", "Leg Press"',
            act: 'repository.create("Squat"), then repository.create("Leg Press")',
            expectedReturn: 'Two distinct Exercise objects with different ids',
            expectedDbState: 'exercises table contains exactly 2 rows',
            actualResult: 'Passed',
        },
    ],
};

// ── findById ──────────────────────────────────────────────────────────────────

const findByIdIt: ItDescriptor = {
    reqId: 'REPO-2',
    statement: 'ExerciseRepository.findById(id: string): Promise<Exercise> - looks up a single exercise by primary key.',
    data: 'id: string - the UUID of the exercise to retrieve.',
    precondition: 'Database may or may not contain a row with the given id.',
    results: 'Exercise - the matching row, or NotFoundError if no row exists with that id.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findById(id: string): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({',
        '        where: { id },',
        '    });',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    return exercise;',
        '}',
    ],

    moduleDot: `digraph findById {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.findById()"];

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

  method -> findUnique    [label="look up by id"];
  method -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise seeded: { name: "Cable Fly", muscleGroup: CHEST, equipmentNeeded: CABLE }.',
            act: 'repository.findById(seededExercise.id)',
            expectedReturn: 'Exercise object with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.findById(nonExistentId)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findAll ───────────────────────────────────────────────────────────────────

const findAllIt: ItDescriptor = {
    reqId: 'REPO-3',
    statement: 'ExerciseRepository.findAll(options?: ExerciseListOptions): Promise<PageResult<Exercise>> - returns a paginated, filtered, name-ordered list of exercises.',
    data: 'options?: { search?: string, muscleGroup?: MuscleGroup, includeInactive?: boolean, page?: number, pageSize?: number }',
    precondition: 'Database may contain any number of exercise rows in any active/inactive state.',
    results: 'PageResult<Exercise>  { items: Exercise[], total: number } - items ordered by name ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findAll(options: ExerciseListOptions = {}): Promise<PageResult<Exercise>> {',
        '    const { search, muscleGroup,',
        '            includeInactive = false,',
        '            page = 1, pageSize = 10 } = options;',
        '    const safePage   = Math.max(1, page);',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = {',
        '        ...(includeInactive ? {} : { isActive: true }),',
        '        ...(muscleGroup  ? { muscleGroup }  : {}),',
        '        ...(safeSearch   ? { name: { contains: safeSearch,',
        "                                     mode: 'insensitive' } } : {}),",
        '    };',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.exercise.findMany({',
        '            where, skip: (safePage - 1) * pageSize,',
        "            take: pageSize, orderBy: { name: 'asc' },",
        '        }),',
        '        this.database.exercise.count({ where }),',
        '    ]);',
        '    return { items, total };',
        '}',
    ],

    moduleDot: `digraph findAll {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.findAll()"];

  subgraph cluster_utils {
    label="lib/utils";
    escapeLike;
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="exercise\\n.findMany()"];
    count       [label="exercise\\n.count()"];
  }

  method      -> escapeLike  [label="sanitise search term"];
  method      -> transaction [label="atomic read"];
  transaction -> findMany    [label="paginated rows"];
  transaction -> count       [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded: Squat (active), Bench Press (active), Leg Press (inactive).',
            act: 'repository.findAll()',
            expectedReturn: 'items = [Bench Press, Squat], total = 2',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Seeded: Bench Press (active), Leg Press (inactive).',
            act: 'repository.findAll({ includeInactive: true })',
            expectedReturn: 'total = 2, items contains both active and inactive exercises',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: Bench Press (CHEST), Deadlift (BACK), Cable Row (BACK).',
            act: 'repository.findAll({ muscleGroup: BACK })',
            expectedReturn: 'total = 2, all items have muscleGroup = BACK',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded: Bench Press, Incline Press, Deadlift.',
            act: 'repository.findAll({ search: "PRESS" })',
            expectedReturn: 'total = 2, all item names contain "press" (case-insensitive)',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded: Bench Press (CHEST), Incline Press (CHEST), Shoulder Press (SHOULDERS).',
            act: 'repository.findAll({ search: "press", muscleGroup: CHEST })',
            expectedReturn: 'total = 2, all items have muscleGroup = CHEST and name contains "press"',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded: Exercise A, Exercise B, Exercise C (all active).',
            act: 'repository.findAll({ page: 1, pageSize: 2 }), then ({ page: 2, pageSize: 2 })',
            expectedReturn: 'Page 1: 2 items, total = 3. Page 2: 1 item, total = 3. No id overlap.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: Bench Press (CHEST, active), Cable Fly (CHEST, inactive), Deadlift (BACK, active).',
            act: 'repository.findAll({ includeInactive: true, muscleGroup: CHEST })',
            expectedReturn: 'total = 2, all items have muscleGroup = CHEST, at least one item has isActive = false',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Seeded: Bench Press (active), Incline Press (inactive), Deadlift (active).',
            act: 'repository.findAll({ includeInactive: true, search: "press" })',
            expectedReturn: 'total = 2, all item names contain "press", at least one item has isActive = false',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '9',
            arrange: 'Seeded: Squat (active), Bench Press (active).',
            act: 'repository.findAll({ page: 1, pageSize: 100 })',
            expectedReturn: 'total = 2, items contains both rows',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '10',
            arrange: 'Seeded: Bench Press, Deadlift (both active). Search term contains SQL LIKE wildcard: "Bench%".',
            act: 'repository.findAll({ search: "Bench%" })',
            expectedReturn: 'total = 0, items = []. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── update ────────────────────────────────────────────────────────────────────

const updateIt: ItDescriptor = {
    reqId: 'REPO-4',
    statement: 'ExerciseRepository.update(id: string, data: UpdateExerciseInput): Promise<Exercise> - finds the exercise, validates name uniqueness, writes changes, and returns the updated row.',
    data: 'id: string, data: UpdateExerciseInput  { name?: string, description?: string, muscleGroup?: MuscleGroup, equipmentNeeded?: Equipment }',
    precondition: 'Exercise with the given id exists in the database.',
    results: 'Exercise - the updated row, or NotFoundError / ConflictError when applicable.',
    postcondition: 'The target row reflects the supplied changes. Unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async update(id: string, data: UpdateExerciseInput): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({',
        '        where: { id },',
        '    });',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    if (data.name && data.name !== exercise.name) {',
        '        const conflict = await this.database.exercise.findUnique({',
        '            where: { name: data.name },',
        '        });',
        '        if (conflict) {',
        '            throw new ConflictError(',
        '                `Exercise name already in use: ${data.name}`',
        '            );',
        '        }',
        '    }',
        '    return this.database.exercise.update({ where: { id }, data });',
        '}',
    ],

    moduleDot: `digraph update {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.update()"];

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

  method -> findById     [label="existence check"];
  method -> findByName   [label="name uniqueness check\\n(only if name changed)"];
  method -> update       [label="persist changes"];
  method -> NotFoundError [label="throws (id missing)",  style=dashed];
  method -> ConflictError [label="throws (name taken)",  style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Exercise "Squat" (LEGS, BARBELL) seeded.',
            act: 'repository.update(id, { name: "Barbell Back Squat", description: "Updated description" })',
            expectedReturn: 'Exercise with name = "Barbell Back Squat", description = "Updated description"',
            expectedDbState: 'Row name and description updated in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Exercise seeded: description = "Original description", muscleGroup = LEGS, equipmentNeeded = BARBELL.',
            act: 'repository.update(id, { name: "Barbell Back Squat" })',
            expectedReturn: 'Updated Exercise object',
            expectedDbState: 'description, muscleGroup, equipmentNeeded unchanged in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Exercise "Bench Press" seeded.',
            act: 'repository.update(id, { name: "Bench Press", description: "New description" })',
            expectedReturn: 'Exercise with name = "Bench Press", description = "New description"',
            expectedDbState: 'description updated, name unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.',
            act: 'repository.update("00000000-...", { name: "Ghost" })',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: '"Bench Press" seeded, "Squat" seeded.',
            act: 'repository.update(squatId, { name: "Bench Press" })',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'Squat row name unchanged in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Exercise seeded: name = "Squat", description = "Original description", muscleGroup = LEGS, equipmentNeeded = BARBELL.',
            act: 'repository.update(id, {})',
            expectedReturn: 'Exercise with all fields identical to the seeded row',
            expectedDbState: 'All fields in the exercises row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── setActive ─────────────────────────────────────────────────────────────────

const setActiveIt: ItDescriptor = {
    reqId: 'REPO-5',
    statement: 'ExerciseRepository.setActive(id: string, isActive: boolean): Promise<Exercise> - finds the exercise and sets its isActive flag to the given value.',
    data: 'id: string, isActive: boolean',
    precondition: 'Exercise with the given id exists in the database.',
    results: 'Exercise - the updated row with the new isActive value, or NotFoundError if the id does not exist.',
    postcondition: 'The isActive field of the target row reflects the supplied value.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async setActive(id: string, isActive: boolean): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({',
        '        where: { id },',
        '    });',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    return this.database.exercise.update({',
        '        where: { id },',
        '        data:  { isActive },',
        '    });',
        '}',
    ],

    moduleDot: `digraph setActive {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.setActive()"];

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

  method -> findUnique    [label="existence check"];
  method -> update        [label="write isActive flag"];
  method -> NotFoundError [label="throws (id missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active exercise seeded (isActive = true).',
            act: 'repository.setActive(id, false)',
            expectedReturn: 'Exercise with isActive = false',
            expectedDbState: 'isActive = false in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Inactive exercise seeded (isActive = false).',
            act: 'repository.setActive(id, true)',
            expectedReturn: 'Exercise with isActive = true',
            expectedDbState: 'isActive = true in the exercises row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'repository.setActive("00000000-...", false)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── delete ────────────────────────────────────────────────────────────────────

const deleteIt: ItDescriptor = {
    reqId: 'REPO-6',
    statement: 'ExerciseRepository.delete(id: string): Promise<void> - finds the exercise, checks it is unreferenced, then removes the row.',
    data: 'id: string - the UUID of the exercise to delete.',
    precondition: 'Exercise with the given id may or may not exist. It may or may not be referenced by workout session exercises.',
    results: 'void - or NotFoundError if id does not exist, or ConflictError if the exercise is referenced by a WorkoutSessionExercise.',
    postcondition: 'On success, the row is absent from exercises. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const exercise = await this.database.exercise.findUnique({',
        '        where: { id },',
        '    });',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    const usageCount =',
        '        await this.database.workoutSessionExercise.count({',
        '            where: { exerciseId: id },',
        '        });',
        '    if (usageCount > 0) {',
        '        throw new ConflictError(',
        '            `Exercise is used in existing workout sessions` +',
        '            ` and cannot be deleted`',
        '        );',
        '    }',
        '    await this.database.exercise.delete({ where: { id } });',
        '}',
    ],

    moduleDot: `digraph delete {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="ExerciseRepository\\n.delete()"];

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

  method -> findUnique    [label="existence check"];
  method -> wseCount      [label="reference check"];
  method -> deleteOp      [label="remove row"];
  method -> NotFoundError [label="throws (id missing)",  style=dashed];
  method -> ConflictError [label="throws (referenced)",  style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One exercise seeded. No WorkoutSessionExercise rows.',
            act: 'repository.delete(id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: '"Bench Press" and "Deadlift" seeded.',
            act: 'repository.delete(benchPressId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Only the "Deadlift" row remains in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'repository.delete("00000000-...")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Exercise seeded. User → Member → WorkoutSession → WorkoutSessionExercise chain referencing that exercise.',
            act: 'repository.delete(id)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'Exercise row still present in exercises table',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: '"Bench Press" seeded and referenced by a WorkoutSessionExercise. "Deadlift" seeded with no references.',
            act: 'repository.delete(benchPressId) - expects ConflictError. Then repository.delete(deadliftId).',
            expectedReturn: 'First call throws ConflictError. Second call returns undefined.',
            expectedDbState: 'After both calls: only "Bench Press" row remains in exercises table.',
            actualResult: 'Passed',
        },
    ],
};

const userRepoCreateMemberIt: ItDescriptor = {
    reqId: 'REPO-7',
    statement: 'UserRepository.createMember(data: CreateMemberInput): Promise<MemberWithUser> - hashes the password, inserts a user row (role=MEMBER) and a linked member row in one nested write, and returns the persisted member with its user.',
    data: 'data: CreateMemberInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string, membershipStart: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'MemberWithUser - the newly inserted member row with its user nested and isActive defaulting to true, or ConflictError if the email is already in use.',
    postcondition: 'One new user row (role=MEMBER) and one new member row exist in the database. If the email was already taken, no rows are inserted and ConflictError is thrown.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createMember(data: CreateMemberInput): Promise<MemberWithUser> {',
        '    const existing = await this.database.user.findUnique({',
        '        where: {email: data.email}',
        '    });',
        '    if (existing) {',
        '        throw new ConflictError(`Email already in use: ${data.email}`);',
        '    }',
        '',
        '    const passwordHash = await bcrypt.hash(data.password, 12);',
        '',
        '    try {',
        '        const result = await this.database.user.create({',
        '            data: {',
        '                email: data.email,',
        '                fullName: data.fullName,',
        '                phone: data.phone,',
        '                dateOfBirth: new Date(data.dateOfBirth),',
        '                passwordHash,',
        '                role: Role.MEMBER,',
        '                member: {',
        '                    create: {membershipStart: new Date(data.membershipStart)},',
        '                },',
        '            },',
        '            include: {member: true},',
        '        });',
        '',
        '        const {member: memberRecord, ...userRecord} = result;',
        '        return {...memberRecord!, user: userRecord as User};',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to create member: ${(error as Error).message}`);',
        '    }',
        '}',
    ],

    moduleDot: `digraph createMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.createMember()"];

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

  method -> findUnique       [label="check duplicate email"];
  method -> ConflictError    [label="throws (duplicate)", style=dashed];
  method -> hash             [label="hash password"];
  method -> userCreate       [label="persist user + member"];
  method -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nInput: { email: "alice@test.com", fullName: "Alice Smith", phone: "0700000001", dateOfBirth: "1990-05-15", password: "Secret123!", membershipStart: "2024-01-01" }',
            act: 'repository.createMember(input)',
            expectedReturn: 'MemberWithUser with user.email = "alice@test.com", user.role = MEMBER, isActive = true, membershipStart = 2024-01-01',
            expectedDbState: 'One user row (role = MEMBER) and one member row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User "alice@test.com" already seeded.\nInput: { email: "alice@test.com", fullName: "Alice Smith 2", ... }',
            act: 'repository.createMember(input)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'users table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'User "alice@test.com" already seeded.\nAttempt 1: createMember with email "alice@test.com" → ConflictError (discarded).\nInput attempt 2: { email: "bob@test.com", fullName: "Bob Jones", ... }',
            act: 'repository.createMember(attempt2Input)',
            expectedReturn: 'MemberWithUser with user.email = "bob@test.com"',
            expectedDbState: 'users: 2 rows. members: 2 rows.',
            actualResult: 'Passed',
        },
    ],
};

// ── createAdmin ───────────────────────────────────────────────────────────────

const userRepoCreateAdminIt: ItDescriptor = {
    reqId: 'REPO-8',
    statement: 'UserRepository.createAdmin(data: CreateAdminInput): Promise<AdminWithUser> - hashes the password, inserts a user row (role=ADMIN) and a linked admin row, and returns the persisted admin with its user.',
    data: 'data: CreateAdminInput  { email: string, fullName: string, phone: string, dateOfBirth: string, password: string }',
    precondition: 'Database may or may not contain a user with the given email.',
    results: 'AdminWithUser - the newly inserted admin row with its user nested, or ConflictError if the email is already in use.',
    postcondition: 'One new user row (role=ADMIN) and one new admin row exist in the database. If the email was already taken, no rows are inserted and ConflictError is thrown.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {',
        '    const existing = await this.database.user.findUnique({',
        '        where: {email: data.email}',
        '    });',
        '    if (existing) {',
        '        throw new ConflictError(`Email already in use: ${data.email}`);',
        '    }',
        '',
        '    const passwordHash = await bcrypt.hash(data.password, 12);',
        '',
        '    try {',
        '        const result = await this.database.user.create({',
        '            data: {',
        '                email: data.email,',
        '                fullName: data.fullName,',
        '                phone: data.phone,',
        '                dateOfBirth: new Date(data.dateOfBirth),',
        '                passwordHash,',
        '                role: Role.ADMIN,',
        '                admin: {create: {}},',
        '            },',
        '            include: {admin: true},',
        '        });',
        '',
        '        const {admin: adminRecord, ...userRecord} = result;',
        '        return {...adminRecord!, user: userRecord as User};',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to create admin: ${(error as Error).message}`);',
        '    }',
        '}',
    ],

    moduleDot: `digraph createAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.createAdmin()"];

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

  method -> findUnique       [label="check duplicate email"];
  method -> ConflictError    [label="throws (duplicate)", style=dashed];
  method -> hash             [label="hash password"];
  method -> userCreate       [label="persist user + admin"];
  method -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Empty database.\nInput: { email: "admin@test.com", fullName: "Admin User", phone: "0700000099", dateOfBirth: "1985-03-20", password: "AdminPass1!" }',
            act: 'repository.createAdmin(input)',
            expectedReturn: 'AdminWithUser with user.email = "admin@test.com", user.role = ADMIN',
            expectedDbState: 'One user row (role = ADMIN) and one admin row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User "admin@test.com" already seeded.\nInput: { email: "admin@test.com", ... }',
            act: 'repository.createAdmin(input)',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'users table still contains exactly 1 row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'User "admin@test.com" already seeded.\nAttempt 1: createAdmin with email "admin@test.com" → ConflictError (discarded).\nInput attempt 2: { email: "admin2@test.com", ... }',
            act: 'repository.createAdmin(attempt2Input)',
            expectedReturn: 'AdminWithUser with user.email = "admin2@test.com"',
            expectedDbState: 'users: 2 rows. admins: 2 rows.',
            actualResult: 'Passed',
        },
    ],
};

// ── findById ──────────────────────────────────────────────────────────────────

const userRepoFindByIdIt: ItDescriptor = {
    reqId: 'REPO-9',
    statement: 'UserRepository.findById(id: string): Promise<UserWithProfile> - looks up a user by user.id including both member and admin relations, or throws NotFoundError if no row exists with that id.',
    data: 'id: string - the user.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain a user row with the given id.',
    results: 'UserWithProfile - the matching user row with member and admin relations attached (null for the relation that does not apply), or NotFoundError if absent.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findById(id: string): Promise<UserWithProfile> {',
        '    const user = await this.database.user.findUnique({',
        '        where: {id},',
        '        include: {member: true, admin: true},',
        '    });',
        '    if (!user) {',
        '        throw new NotFoundError(`User not found: ${id}`);',
        '    }',
        '',
        '    return user;',
        '}',
    ],

    moduleDot: `digraph findById {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findById()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }

  method -> findUnique    [label="look up by user.id"];
  method -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'User (role=MEMBER) with a linked member row seeded. id = seededMember.userId.',
            act: 'repository.findById(id)',
            expectedReturn: 'UserWithProfile with role = MEMBER, member ≠ null, admin = null, all fields matching the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'User (role=ADMIN) with a linked admin row seeded. id = seededAdmin.userId.',
            act: 'repository.findById(id)',
            expectedReturn: 'UserWithProfile with role = ADMIN, admin ≠ null, member = null, all fields matching the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.findById("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findMemberById ────────────────────────────────────────────────────────────

const userRepoFindMemberByIdIt: ItDescriptor = {
    reqId: 'REPO-10',
    statement: 'UserRepository.findMemberById(memberId: string): Promise<MemberWithUser> - looks up a single member by member.id including its user, or throws NotFoundError if no row exists.',
    data: 'memberId: string - the member.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain a member row with the given id.',
    results: 'MemberWithUser - the matching member row with its user nested, or NotFoundError if absent.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findMemberById(memberId: string): Promise<MemberWithUser> {',
        '    const member = await this.database.member.findUnique({',
        '        where: {id: memberId},',
        '        include: {user: true},',
        '    });',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '',
        '    return member;',
        '}',
    ],

    moduleDot: `digraph findMemberById {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findMemberById()"];

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

  method -> findUnique    [label="look up by member.id"];
  method -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded: { email: "alice@test.com", fullName: "Alice Smith" }.',
            act: 'repository.findMemberById(seededMember.id)',
            expectedReturn: 'MemberWithUser with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.findMemberById("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findAdminById ─────────────────────────────────────────────────────────────

const userRepoFindAdminByIdIt: ItDescriptor = {
    reqId: 'REPO-11',
    statement: 'UserRepository.findAdminById(adminId: string): Promise<AdminWithUser> - looks up a single admin by admin.id including its user, or throws NotFoundError if no row exists.',
    data: 'adminId: string - the admin.id (UUID) to retrieve.',
    precondition: 'Database may or may not contain an admin row with the given id.',
    results: 'AdminWithUser - the matching admin row with its user nested, or NotFoundError if absent.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findAdminById(adminId: string): Promise<AdminWithUser> {',
        '    const admin = await this.database.admin.findUnique({',
        '        where: {id: adminId},',
        '        include: {user: true},',
        '    });',
        '    if (!admin) {',
        '        throw new NotFoundError(`Admin not found: ${adminId}`);',
        '    }',
        '',
        '    return admin;',
        '}',
    ],

    moduleDot: `digraph findAdminById {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findAdminById()"];

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

  method -> findUnique    [label="look up by admin.id"];
  method -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin seeded: { email: "admin@test.com", fullName: "Admin User" }.',
            act: 'repository.findAdminById(seededAdmin.id)',
            expectedReturn: 'AdminWithUser with all fields identical to the seeded row',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.findAdminById("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findByEmail ───────────────────────────────────────────────────────────────

const userRepoFindByEmailIt: ItDescriptor = {
    reqId: 'REPO-12',
    statement: 'UserRepository.findByEmail(email: string): Promise<UserWithProfile | null> - looks up a user by unique email address including both profile relations, returning null (not a throw) when absent.',
    data: 'email: string - the email address to look up.',
    precondition: 'Database may or may not contain a user row with the given email.',
    results: 'UserWithProfile with member and admin relations attached when found; null when no matching row exists.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findByEmail(email: string): Promise<UserWithProfile | null> {',
        '    return this.database.user.findUnique({',
        '        where: {email},',
        '        include: {member: true, admin: true},',
        '    });',
        '}',
    ],

    moduleDot: `digraph findByEmail {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findByEmail()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()"];
  }

  method -> findUnique [label="look up by email"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'User (role=MEMBER) with a linked member row seeded: email = "alice@test.com".',
            act: 'repository.findByEmail("alice@test.com")',
            expectedReturn: 'UserWithProfile with email = "alice@test.com", role = MEMBER, member ≠ null, admin = null',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.findByEmail("nobody@test.com")',
            expectedReturn: 'null - no error thrown',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findMembers ───────────────────────────────────────────────────────────────

const userRepoFindMembersIt: ItDescriptor = {
    reqId: 'REPO-13',
    statement: 'UserRepository.findMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>> - returns a paginated, optionally searched list of members ordered by user.fullName ASC; search applies escapeLike and matches fullName or email case-insensitively; page is clamped to Math.max(1, page).',
    data: 'options?: { search?: string, page?: number, pageSize?: number } - all optional; defaults: page = 1, pageSize = 10',
    precondition: 'Database may contain any number of member rows.',
    results: 'PageResult<MemberWithUser>  { items: MemberWithUser[], total: number } - items ordered by user.fullName ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findMembers(options: MemberListOptions = {}): Promise<PageResult<MemberWithUser>> {',
        '    const {search, page = 1, pageSize = 10} = options;',
        '    const safePage = Math.max(1, page);',
        '',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = safeSearch',
        '        ? {',
        '            user: {',
        '                OR: [',
        '                    {fullName: {contains: safeSearch, mode: \'insensitive\' as const}},',
        '                    {email: {contains: safeSearch, mode: \'insensitive\' as const}},',
        '                ],',
        '            },',
        '          }',
        '        : undefined;',
        '',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.member.findMany({',
        '            where,',
        '            include: {user: true},',
        '            skip: (safePage - 1) * pageSize,',
        '            take: pageSize,',
        '            orderBy: {user: {fullName: \'asc\'}},',
        '        }),',
        '        this.database.member.count({where}),',
        '    ]);',
        '',
        '    return {items, total};',
        '}',
    ],

    moduleDot: `digraph findMembers {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findMembers()"];

  subgraph cluster_utils {
    label="lib/utils";
    escapeLike;
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="member\\n.findMany()"];
    count       [label="member\\n.count()"];
  }

  method      -> escapeLike  [label="sanitise search term"];
  method      -> transaction [label="atomic read"];
  transaction -> findMany    [label="paginated rows"];
  transaction -> count       [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded: Charlie (charlie@test.com), Alice (alice@test.com), Bob (bob@test.com) - all active.',
            act: 'repository.findMembers()',
            expectedReturn: 'items = [Alice, Bob, Charlie], total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.findMembers()',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: Alice Smith (alice@test.com), Bob Jones (bob@test.com).',
            act: 'repository.findMembers({ search: "alice" })',
            expectedReturn: 'items = [Alice Smith], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded: Alice Smith (alice@test.com), Bob Jones (bob@test.com).',
            act: 'repository.findMembers({ search: "bob@test.com" })',
            expectedReturn: 'items = [Bob Jones], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded: Alice (active), Bob (active).',
            act: 'repository.findMembers({ pageSize: 100 })',
            expectedReturn: 'total = 2, items contains both members',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded: Alice Smith (alice@test.com). Search term contains SQL LIKE wildcard: "%".',
            act: 'repository.findMembers({ search: "%" })',
            expectedReturn: 'items = [], total = 0. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: Member1, Member2, Member3, Member4, Member5 (fullNames sort alphabetically M1 < ... < M5).',
            act: 'repository.findMembers({ page: 2, pageSize: 2 })',
            expectedReturn: 'items = [Member3, Member4], total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findAdmins ────────────────────────────────────────────────────────────────

const userRepoFindAdminsIt: ItDescriptor = {
    reqId: 'REPO-14',
    statement: 'UserRepository.findAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>> - identical pagination and search logic to findMembers, applied to the admins table.',
    data: 'options?: { search?: string, page?: number, pageSize?: number } - all optional; defaults: page = 1, pageSize = 10',
    precondition: 'Database may contain any number of admin rows.',
    results: 'PageResult<AdminWithUser>  { items: AdminWithUser[], total: number } - items ordered by user.fullName ascending, total reflecting the unsliced count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findAdmins(options: AdminListOptions = {}): Promise<PageResult<AdminWithUser>> {',
        '    const {search, page = 1, pageSize = 10} = options;',
        '    const safePage = Math.max(1, page);',
        '',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = safeSearch',
        '        ? {',
        '            user: {',
        '                OR: [',
        '                    {fullName: {contains: safeSearch, mode: \'insensitive\' as const}},',
        '                    {email: {contains: safeSearch, mode: \'insensitive\' as const}},',
        '                ],',
        '            },',
        '          }',
        '        : undefined;',
        '',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.admin.findMany({',
        '            where,',
        '            include: {user: true},',
        '            skip: (safePage - 1) * pageSize,',
        '            take: pageSize,',
        '            orderBy: {user: {fullName: \'asc\'}},',
        '        }),',
        '        this.database.admin.count({where}),',
        '    ]);',
        '',
        '    return {items, total};',
        '}',
    ],

    moduleDot: `digraph findAdmins {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.findAdmins()"];

  subgraph cluster_utils {
    label="lib/utils";
    escapeLike;
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="admin\\n.findMany()"];
    count       [label="admin\\n.count()"];
  }

  method      -> escapeLike  [label="sanitise search term"];
  method      -> transaction [label="atomic read"];
  transaction -> findMany    [label="paginated rows"];
  transaction -> count       [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded: Charlie Admin (charlie-a@test.com), Alice Admin (alice-a@test.com).',
            act: 'repository.findAdmins()',
            expectedReturn: 'items = [Alice Admin, Charlie Admin], total = 2',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.findAdmins()',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: Alice Admin (alice-a@test.com), Bob Admin (bob-a@test.com).',
            act: 'repository.findAdmins({ search: "alice" })',
            expectedReturn: 'items = [Alice Admin], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded: Alice Admin (alice-a@test.com), Bob Admin (bob-a@test.com).',
            act: 'repository.findAdmins({ search: "bob-a@test.com" })',
            expectedReturn: 'items = [Bob Admin], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded: Alice Admin (active), Bob Admin (active).',
            act: 'repository.findAdmins({ pageSize: 50 })',
            expectedReturn: 'total = 2, items contains both admins',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded: Alice Admin (alice-a@test.com). Search term contains SQL LIKE wildcard: "%".',
            act: 'repository.findAdmins({ search: "%" })',
            expectedReturn: 'items = [], total = 0. The "%" is treated as a literal character, not a wildcard.',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: Admin1, Admin2, Admin3, Admin4, Admin5 (fullNames sort alphabetically A1 < ... < A5).',
            act: 'repository.findAdmins({ page: 2, pageSize: 2 })',
            expectedReturn: 'items = [Admin3, Admin4], total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateMember ──────────────────────────────────────────────────────────────

const userRepoUpdateMemberIt: ItDescriptor = {
    reqId: 'REPO-15',
    statement: 'UserRepository.updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> - finds the member, validates email uniqueness when the email has changed, applies only the supplied fields, and returns the updated row.',
    data: 'memberId: string, data: UpdateMemberInput  { email?, fullName?, phone?, dateOfBirth?, password?, membershipStart? } - all fields optional',
    precondition: 'Member row with the given memberId exists in the database.',
    results: 'MemberWithUser - the updated row with all changes reflected, or NotFoundError if the id does not exist, or ConflictError if the new email is already owned by a different user.',
    postcondition: 'The target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {',
        '    const current = await this.database.member.findUnique({',
        '        where: {id: memberId},',
        '        include: {user: true},',
        '    });',
        '    if (!current) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '',
        '    if (data.email && data.email !== current.user.email) {',
        '        const conflict = await this.database.user.findUnique({',
        '            where: {email: data.email}',
        '        });',
        '        if (conflict) {',
        '            throw new ConflictError(`Email already in use: ${data.email}`);',
        '        }',
        '    }',
        '',
        '    const passwordHash = data.password',
        '        ? await bcrypt.hash(data.password, 12)',
        '        : undefined;',
        '',
        '    try {',
        '        return await this.database.member.update({',
        '            where: {id: memberId},',
        '            data: {',
        '                ...(data.membershipStart',
        '                    ? {membershipStart: new Date(data.membershipStart)}',
        '                    : {}),',
        '                user: {',
        '                    update: {',
        '                        ...(data.email ? {email: data.email} : {}),',
        '                        ...(data.fullName ? {fullName: data.fullName} : {}),',
        '                        ...(data.phone ? {phone: data.phone} : {}),',
        '                        ...(data.dateOfBirth ? {dateOfBirth: new Date(data.dateOfBirth)} : {}),',
        '                        ...(passwordHash ? {passwordHash} : {}),',
        '                    },',
        '                },',
        '            },',
        '            include: {user: true},',
        '        });',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to update member: ${(error as Error).message}`);',
        '    }',
        '}',
    ],

    moduleDot: `digraph updateMember {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.updateMember()"];

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

  method -> findMember       [label="existence check"];
  method -> NotFoundError    [label="throws (id missing)", style=dashed];
  method -> findUser         [label="email uniqueness check\\n(only if email changed)"];
  method -> ConflictError    [label="throws (email taken)", style=dashed];
  method -> hash             [label="hash new password"];
  method -> update           [label="persist changes"];
  method -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member seeded: email = "alice@test.com", fullName = "Alice Smith", phone = "0700000001", membershipStart = 2024-01-01.',
            act: 'repository.updateMember(memberId, { email: "alice2@test.com", fullName: "Alice Updated", phone: "0700000002", dateOfBirth: "1991-06-20", password: "NewPass1!", membershipStart: "2025-03-01" })',
            expectedReturn: 'MemberWithUser with user.email = "alice2@test.com", user.fullName = "Alice Updated", membershipStart = 2025-03-01',
            expectedDbState: 'users row email and fullName updated; members row membershipStart updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.updateMember("00000000-0000-0000-0000-000000000000", { fullName: "X" })',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: "alice@test.com" (target), "bob@test.com" (conflict owner).',
            act: 'repository.updateMember(aliceMemberId, { email: "bob@test.com" })',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'alice users row email unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member seeded: email = "alice@test.com", fullName = "Alice Smith", phone = "0700000001", membershipStart = 2024-01-01.',
            act: 'repository.updateMember(memberId, { fullName: "Alice Renamed" })',
            expectedReturn: 'MemberWithUser with user.fullName = "Alice Renamed"',
            expectedDbState: 'user.fullName updated; email, phone, membershipStart unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member seeded: email = "alice@test.com", fullName = "Alice Smith".',
            act: 'repository.updateMember(memberId, {})',
            expectedReturn: 'MemberWithUser with all fields identical to the seeded row',
            expectedDbState: 'All fields in users and members rows unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Member seeded: email = "alice@test.com", fullName = "Alice Smith".',
            act: 'repository.updateMember(memberId, { email: "alice@test.com", fullName: "Alice Still" })',
            expectedReturn: 'MemberWithUser with user.email = "alice@test.com", user.fullName = "Alice Still"',
            expectedDbState: 'email column unchanged, fullName updated in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: "alice@test.com" (target), "bob@test.com" (conflict owner).\nAttempt 1: updateMember(aliceId, { email: "bob@test.com" }) → ConflictError (discarded).',
            act: 'repository.updateMember(aliceId, { fullName: "Alice Renamed" })',
            expectedReturn: 'MemberWithUser with user.fullName = "Alice Renamed"',
            expectedDbState: 'alice fullName updated in users row; bob row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── setMemberActive ───────────────────────────────────────────────────────────

const userRepoSetMemberActiveIt: ItDescriptor = {
    reqId: 'REPO-16',
    statement: 'UserRepository.setMemberActive(memberId: string, isActive: boolean): Promise<MemberWithUser> - finds the member and sets its isActive flag to the given value.',
    data: 'memberId: string, isActive: boolean',
    precondition: 'Member row with the given memberId exists in the database.',
    results: 'MemberWithUser - the updated row with the new isActive value, or NotFoundError if the id does not exist.',
    postcondition: 'The isActive field of the target members row reflects the supplied value. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async setMemberActive(memberId: string, isActive: boolean): Promise<MemberWithUser> {',
        '    const member = await this.database.member.findUnique({',
        '        where: {id: memberId}',
        '    });',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '',
        '    return this.database.member.update({where: {id: memberId}, data: {isActive}, include: {user: true}});',
        '}',
    ],

    moduleDot: `digraph setMemberActive {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.setMemberActive()"];

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

  method -> findUnique    [label="existence check"];
  method -> update        [label="write isActive flag"];
  method -> NotFoundError [label="throws (id missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Active member seeded (isActive = true).',
            act: 'repository.setMemberActive(memberId, false)',
            expectedReturn: 'MemberWithUser with isActive = false',
            expectedDbState: 'isActive = false in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Inactive member seeded (isActive = false).',
            act: 'repository.setMemberActive(memberId, true)',
            expectedReturn: 'MemberWithUser with isActive = true',
            expectedDbState: 'isActive = true in the members row',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.',
            act: 'repository.setMemberActive("00000000-0000-0000-0000-000000000000", false)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── updateAdmin ───────────────────────────────────────────────────────────────

const userRepoUpdateAdminIt: ItDescriptor = {
    reqId: 'REPO-17',
    statement: 'UserRepository.updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> - finds the admin, validates email uniqueness when the email has changed, applies only the supplied fields, and returns the updated row.',
    data: 'adminId: string, data: UpdateAdminInput  { email?, fullName?, phone?, dateOfBirth?, password? } - all fields optional',
    precondition: 'Admin row with the given adminId exists in the database.',
    results: 'AdminWithUser - the updated row with all changes reflected, or NotFoundError if the id does not exist, or ConflictError if the new email is already owned by a different user.',
    postcondition: 'The target row reflects the supplied changes; unspecified fields are unchanged. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {',
        '    const current = await this.database.admin.findUnique({',
        '        where: {id: adminId},',
        '        include: {user: true},',
        '    });',
        '    if (!current) {',
        '        throw new NotFoundError(`Admin not found: ${adminId}`);',
        '    }',
        '',
        '    if (data.email && data.email !== current.user.email) {',
        '        const conflict = await this.database.user.findUnique({',
        '            where: {email: data.email}',
        '        });',
        '        if (conflict) {',
        '            throw new ConflictError(`Email already in use: ${data.email}`);',
        '        }',
        '    }',
        '',
        '    const passwordHash = data.password',
        '        ? await bcrypt.hash(data.password, 12)',
        '        : undefined;',
        '',
        '    try {',
        '        return await this.database.admin.update({',
        '            where: {id: adminId},',
        '            data: {',
        '                user: {',
        '                    update: {',
        '                        ...(data.email ? {email: data.email} : {}),',
        '                        ...(data.fullName ? {fullName: data.fullName} : {}),',
        '                        ...(data.phone ? {phone: data.phone} : {}),',
        '                        ...(data.dateOfBirth ? {dateOfBirth: new Date(data.dateOfBirth)} : {}),',
        '                        ...(passwordHash ? {passwordHash} : {}),',
        '                    },',
        '                },',
        '            },',
        '            include: {user: true},',
        '        });',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to update admin: ${(error as Error).message}`);',
        '    }',
        '}',
    ],

    moduleDot: `digraph updateAdmin {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="UserRepository\\n.updateAdmin()"];

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

  method -> findAdmin        [label="existence check"];
  method -> NotFoundError    [label="throws (id missing)", style=dashed];
  method -> findUser         [label="email uniqueness check\\n(only if email changed)"];
  method -> ConflictError    [label="throws (email taken)", style=dashed];
  method -> hash             [label="hash new password"];
  method -> update           [label="persist changes"];
  method -> TransactionError [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Admin seeded: email = "admin@test.com", fullName = "Admin User", phone = "0700000099".',
            act: 'repository.updateAdmin(adminId, { email: "admin2@test.com", fullName: "Admin Updated", phone: "0700000098", dateOfBirth: "1986-07-10", password: "NewAdminPass1!" })',
            expectedReturn: 'AdminWithUser with user.email = "admin2@test.com", user.fullName = "Admin Updated"',
            expectedDbState: 'users row email, fullName, and phone updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.updateAdmin("00000000-0000-0000-0000-000000000000", { fullName: "X" })',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: "admin-a@test.com" (target), "admin-b@test.com" (conflict owner).',
            act: 'repository.updateAdmin(adminAId, { email: "admin-b@test.com" })',
            expectedReturn: 'Throws ConflictError',
            expectedDbState: 'admin-a users row email unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Admin seeded: email = "admin@test.com", fullName = "Admin User", phone = "0700000099".',
            act: 'repository.updateAdmin(adminId, { fullName: "Admin Renamed" })',
            expectedReturn: 'AdminWithUser with user.fullName = "Admin Renamed"',
            expectedDbState: 'user.fullName updated; email and phone unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Admin seeded: email = "admin@test.com", fullName = "Admin User".',
            act: 'repository.updateAdmin(adminId, {})',
            expectedReturn: 'AdminWithUser with all fields identical to the seeded row',
            expectedDbState: 'All fields in the users row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Admin seeded: email = "admin@test.com", fullName = "Admin User".',
            act: 'repository.updateAdmin(adminId, { email: "admin@test.com", fullName: "Admin Still" })',
            expectedReturn: 'AdminWithUser with user.email = "admin@test.com", user.fullName = "Admin Still"',
            expectedDbState: 'email column unchanged, fullName updated in users row',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: "admin-a@test.com" (target), "admin-b@test.com" (conflict owner).\nAttempt 1: updateAdmin(adminAId, { email: "admin-b@test.com" }) → ConflictError (discarded).',
            act: 'repository.updateAdmin(adminAId, { fullName: "Admin Renamed" })',
            expectedReturn: 'AdminWithUser with user.fullName = "Admin Renamed"',
            expectedDbState: 'admin A fullName updated in users row; admin B row unchanged',
            actualResult: 'Passed',
        }
    ],
};

// ── delete ────────────────────────────────────────────────────────────────────

const userRepoDeleteIt: ItDescriptor = {
    reqId: 'REPO-18',
    statement: 'UserRepository.delete(id: string): Promise<void> — accepts a member.id or admin.id, locates the matching profile, and deletes the parent user row which cascades to the member or admin row.',
    data: 'id: string — a member.id or admin.id (UUID).',
    precondition: 'Database may or may not contain a member or admin row with the given id.',
    results: 'void — or NotFoundError if neither the members nor admins table contains the id.',
    postcondition: 'On success, the user row and its cascaded profile row are absent from the database. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const profile = await this.database.member.findUnique({where: {id}})',
        '        ?? await this.database.admin.findUnique({where: {id}});',
        '',
        '    if (!profile) {',
        '        throw new NotFoundError(`Member or admin not found: ${id}`);',
        '    }',
        '',
        '    await this.database.user.delete({where: {id: profile.userId}});',
        '}',
    ],

    moduleDot: `digraph delete {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];
 
  method [label="UserRepository\\n.delete()"];
 
  subgraph cluster_prisma {
    label="PrismaClient";
    findMember     [label="member\\n.findUnique()"];
    findAdmin      [label="admin\\n.findUnique()"];
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
 
  method -> findMember       [label="try member lookup"];
  method -> findAdmin        [label="fallback admin lookup"];
  method -> NotFoundError    [label="throws (both missing)", style=dashed];
  method -> userDelete       [label="delete user"];
  userDelete -> memberCascade [label="cascades to"];
  memberCascade -> sessionCascade [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'One member seeded. id = seededMember.id.',
            act: 'repository.delete(id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users or members tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'One admin seeded. id = seededAdmin.id.',
            act: 'repository.delete(id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users or admins tables',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'One member seeded with one WorkoutSession linked to it.',
            act: 'repository.delete(seededMember.id)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in users, members, or workout_sessions tables',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.',
            act: 'repository.delete("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded: alice (member), bob (member).\nAttempt 1: delete("00000000-...") → NotFoundError (discarded).',
            act: 'repository.delete(bob.memberId)',
            expectedReturn: 'undefined',
            expectedDbState: 'alice user and member rows still present; bob user and member rows removed',
            actualResult: 'Passed',
        },
    ],
};

const wsRepoCreateIt: ItDescriptor = {
    reqId: 'REPO-19',
    statement: 'WorkoutSessionRepository.create(data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]): Promise<WorkoutSessionWithExercises> — validates exercises are non-empty and the member exists, then inserts the session and all exercise links in one nested write.',
    data: 'data: CreateWorkoutSessionInput  { memberId: string, date: string, duration: number, notes?: string }, exercises: WorkoutSessionExerciseInput[]  { exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Database may or may not contain the member identified by data.memberId. Each exerciseId in the exercises array must reference an existing exercise row.',
    results: 'WorkoutSessionWithExercises — the newly inserted session row with all linked exercise rows included, or WorkoutSessionRequiresExercisesError if exercises is empty, or NotFoundError if the member does not exist.',
    postcondition: 'One new workout_sessions row and one workout_session_exercises row per exercise entry exist in the database. On error, no rows are inserted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async create(',
        '    data: CreateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseInput[],',
        '): Promise<WorkoutSessionWithExercises> {',
        '    if (exercises.length === 0) {',
        '        throw new WorkoutSessionRequiresExercisesError(',
        '            \'A workout session must include at least one exercise.\',',
        '        );',
        '    }',
        '',
        '    const member = await this.database.member.findUnique({',
        '        where: {id: data.memberId}',
        '    });',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${data.memberId}`);',
        '    }',
        '',
        '    try {',
        '        return await this.database.workoutSession.create({',
        '            data: {',
        '                memberId: data.memberId,',
        '                date: new Date(data.date),',
        '                duration: data.duration,',
        '                notes: data.notes,',
        '                exercises: {',
        '                    create: exercises.map((exercise) => ({',
        '                        exerciseId: exercise.exerciseId,',
        '                        sets: exercise.sets,',
        '                        reps: exercise.reps,',
        '                        weight: exercise.weight,',
        '                    })),',
        '                },',
        '            },',
        '            include: {exercises: {include: {exercise: true}}},',
        '        });',
        '    } catch (error) {',
        '        throw new TransactionError(',
        '            `Failed to create workout session: ${(error as Error).message}`,',
        '        );',
        '    }',
        '}',
    ],

    moduleDot: `digraph create {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.create()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique      [label="member\\n.findUnique()"];
    sessionCreate   [label="workoutSession\\n.create()"];
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

  method -> WorkoutSessionRequiresExercisesError [label="throws (empty exercises)", style=dashed];
  method -> findUnique                           [label="check member exists"];
  method -> NotFoundError                        [label="throws (member missing)", style=dashed];
  method -> sessionCreate                        [label="persist session + exercises"];
  method -> TransactionError                     [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded.\nInput: { memberId, date: "2024-06-01", duration: 60, notes: "Test" }. exercises: [{ exerciseId, sets: 3, reps: 10, weight: 50 }]',
            act: 'repository.create(inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with memberId matching seeded member, duration = 60, exercises array of length 1',
            expectedDbState: 'One workout_sessions row and one workout_session_exercises row linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member and two exercises seeded.\nInput: { memberId, date: "2024-06-01", duration: 45 }. exercises: [{ exerciseId1, sets: 3, reps: 10, weight: 50 }, { exerciseId2, sets: 4, reps: 8, weight: 80 }]',
            act: 'repository.create(inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2',
            expectedDbState: 'One workout_sessions row and two workout_session_exercises rows linked to it exist in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member seeded.\nInput: { memberId, date: "2024-06-01", duration: 60 }. exercises: []',
            act: 'repository.create(inputData, [])',
            expectedReturn: 'Throws WorkoutSessionRequiresExercisesError',
            expectedDbState: 'workout_sessions table contains no rows',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Empty database.\nInput: { memberId: "00000000-0000-0000-0000-000000000000", date: "2024-06-01", duration: 60 }. exercises: [{ exerciseId: "any", sets: 3, reps: 10, weight: 50 }]',
            act: 'repository.create(inputData, inputExercises)',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'workout_sessions table contains no rows',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member and exercise seeded.\nAttempt 1: create with memberId = "00000000-..." → NotFoundError (discarded).\nInput attempt 2: { memberId: validMemberId, date: "2024-06-01", duration: 60 }. exercises: [{ exerciseId, sets: 3, reps: 10, weight: 50 }]',
            act: 'repository.create(attempt2Data, attempt2Exercises)',
            expectedReturn: 'WorkoutSessionWithExercises with memberId matching seeded member',
            expectedDbState: 'One workout_sessions row and one workout_session_exercises row exist in the database',
            actualResult: 'Passed',
        },
    ],
};

// ── findById ──────────────────────────────────────────────────────────────────

const wsRepoFindByIdIt: ItDescriptor = {
    reqId: 'REPO-20',
    statement: 'WorkoutSessionRepository.findById(id: string): Promise<WorkoutSessionWithExercises> — looks up a single workout session by primary key including all linked exercises, or throws NotFoundError if no row exists.',
    data: 'id: string — the workout_sessions UUID to retrieve.',
    precondition: 'Database may or may not contain a workout_sessions row with the given id.',
    results: 'WorkoutSessionWithExercises — the matching session row with all workout_session_exercises rows included, or NotFoundError if absent.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findById(id: string): Promise<WorkoutSessionWithExercises> {',
        '    const session = await this.database.workoutSession.findUnique({',
        '        where: {id},',
        '        include: {exercises: {include: {exercise: true}}},',
        '    });',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '',
        '    return session;',
        '}',
    ],

    moduleDot: `digraph findById {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.findById()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="workoutSession\\n.findUnique()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }

  method -> findUnique    [label="look up by id"];
  method -> NotFoundError [label="throws (missing)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded with that exercise.',
            act: 'repository.findById(seededSession.id)',
            expectedReturn: 'WorkoutSessionWithExercises with all fields identical to the seeded row and exercises array of length 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.findById("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── findAll ───────────────────────────────────────────────────────────────────

const wsRepoFindAllIt: ItDescriptor = {
    reqId: 'REPO-21',
    statement: 'WorkoutSessionRepository.findAll(options?: WorkoutSessionListOptions): Promise<PageResult<WorkoutSessionWithExercises>> — returns a filtered list of sessions; pagination activates only when both page and pageSize are provided, switching the order from date ASC to date DESC and applying skip/take.',
    data: 'options?: { memberId?: string, startDate?: Date, endDate?: Date, page?: number, pageSize?: number } — all optional',
    precondition: 'Database may contain any number of workout_sessions rows.',
    results: 'PageResult<WorkoutSessionWithExercises>  { items: WorkoutSessionWithExercises[], total: number } — items ordered by date ascending when not paginated, date descending when paginated; total reflecting the unsliced filtered count.',
    postcondition: 'No rows are inserted, updated, or deleted.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async findAll(options: WorkoutSessionListOptions = {}): Promise<PageResult<WorkoutSessionWithExercises>> {',
        '    const {memberId, startDate, endDate, page, pageSize} = options;',
        '    const safePage = page !== undefined ? Math.max(1, page) : page;',
        '    const paginated = safePage !== undefined && pageSize !== undefined;',
        '',
        '    const where = {',
        '        ...(memberId ? {memberId} : {}),',
        '        ...(startDate || endDate',
        '            ? {date: {gte: startDate, lte: endDate}}',
        '            : {}),',
        '    };',
        '',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.workoutSession.findMany({',
        '            where,',
        '            include: {exercises: {include: {exercise: true}}},',
        '            ...(paginated ? {skip: (safePage! - 1) * pageSize!, take: pageSize} : {}),',
        '            orderBy: {date: paginated ? \'desc\' : \'asc\'},',
        '        }),',
        '        this.database.workoutSession.count({where}),',
        '    ]);',
        '',
        '    return {items, total};',
        '}',
    ],

    moduleDot: `digraph findAll {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.findAll()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    transaction [label="\\$transaction()"];
    findMany    [label="workoutSession\\n.findMany()"];
    count       [label="workoutSession\\n.count()"];
  }

  method      -> transaction [label="atomic read"];
  transaction -> findMany    [label="filtered + paginated rows"];
  transaction -> count       [label="total count"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Seeded: session A (2024-01-01), session B (2024-03-01), session C (2024-06-01) — all for the same member.',
            act: 'repository.findAll()',
            expectedReturn: 'items = [A, B, C] (date ASC), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.',
            act: 'repository.findAll()',
            expectedReturn: 'items = [], total = 0',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Seeded: session1 for member1 (2024-01-01), session2 for member2 (2024-01-01).',
            act: 'repository.findAll({ memberId: member1.id })',
            expectedReturn: 'items = [session1], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Seeded: session A (2024-01-01), session B (2024-06-01) — same member.',
            act: 'repository.findAll({ startDate: new Date("2024-03-01") })',
            expectedReturn: 'items = [session B], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Seeded: session A (2024-01-01), session B (2024-06-01) — same member.',
            act: 'repository.findAll({ endDate: new Date("2024-03-01") })',
            expectedReturn: 'items = [session A], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Seeded: session A (2024-01-01), session B (2024-04-01), session C (2024-08-01) — same member.',
            act: 'repository.findAll({ startDate: new Date("2024-03-01"), endDate: new Date("2024-06-01") })',
            expectedReturn: 'items = [session B], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Seeded: sessions dated 2024-01-01, 2024-02-01, 2024-03-01, 2024-04-01, 2024-05-01 — same member.',
            act: 'repository.findAll({ page: 2, pageSize: 2 })',
            expectedReturn: 'items = [2024-03-01, 2024-02-01] (date DESC, page 2 of 3), total = 5',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Seeded: sessions dated 2024-01-01, 2024-02-01, 2024-03-01 — same member.',
            act: 'repository.findAll({ page: 0, pageSize: 2 })',
            expectedReturn: 'items = [2024-03-01, 2024-02-01] (date DESC, page clamped to 1), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '9',
            arrange: 'Seeded: sessions dated 2024-01-01, 2024-02-01, 2024-03-01 — same member.',
            act: 'repository.findAll({ page: 1, pageSize: 100 })',
            expectedReturn: 'items contains all 3 sessions (date DESC), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '10',
            arrange: 'Seeded: session1 for member1 (2024-01-01), session2 for member1 (2024-06-01), session3 for member2 (2024-06-01).',
            act: 'repository.findAll({ memberId: member1.id, startDate: new Date("2024-03-01") })',
            expectedReturn: 'items = [session2], total = 1',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '11',
            arrange: 'Seeded: sessions dated 2024-01-01, 2024-02-01, 2024-03-01 — same member.',
            act: 'repository.findAll({ page: 2 })',
            expectedReturn: 'items = [session A, session B, session C] (date ASC, not paginated — pageSize absent), total = 3',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
    ],
};

// ── update ────────────────────────────────────────────────────────────────────

const wsRepoUpdateIt: ItDescriptor = {
    reqId: 'REPO-22',
    statement: 'WorkoutSessionRepository.update(id: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession> — finds the session and applies only the supplied scalar fields (date, duration, notes); does not touch exercise links.',
    data: 'id: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? } — all fields optional',
    precondition: 'Workout session with the given id exists in the database.',
    results: 'WorkoutSession — the updated row with all changes reflected (exercise links are not included), or NotFoundError if the id does not exist.',
    postcondition: 'The target workout_sessions row reflects the supplied changes; unspecified fields are unchanged. workout_session_exercises rows are not modified. On error, no row is modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async update(id: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession> {',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '',
        '    return this.database.workoutSession.update({',
        '        where: {id},',
        '        data: {',
        '            ...(data.date ? {date: new Date(data.date)} : {}),',
        '            ...(data.duration !== undefined ? {duration: data.duration} : {}),',
        '            ...(data.notes !== undefined ? {notes: data.notes} : {}),',
        '        },',
        '    });',
        '}',
    ],

    moduleDot: `digraph update {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.update()"];

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

  method -> findUnique    [label="existence check"];
  method -> NotFoundError [label="throws (id missing)", style=dashed];
  method -> update        [label="persist changes"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Session seeded: date = 2024-06-01, duration = 60, notes = "Original".',
            act: 'repository.update(sessionId, { date: "2025-01-15", duration: 90, notes: "Updated" })',
            expectedReturn: 'WorkoutSession with date = 2025-01-15, duration = 90, notes = "Updated"',
            expectedDbState: 'workout_sessions row date, duration, and notes updated',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.update("00000000-0000-0000-0000-000000000000", { duration: 90 })',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Session seeded: date = 2024-06-01, duration = 60, notes = "Original".',
            act: 'repository.update(sessionId, { duration: 90 })',
            expectedReturn: 'WorkoutSession with duration = 90',
            expectedDbState: 'workout_sessions row duration updated; date and notes unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Session seeded: date = 2024-06-01, duration = 60, notes = "Original".',
            act: 'repository.update(sessionId, {})',
            expectedReturn: 'WorkoutSession with all fields identical to the seeded row',
            expectedDbState: 'All fields in the workout_sessions row unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Two sessions seeded: sessionA and sessionB.\nAttempt 1: update("00000000-...") → NotFoundError (discarded).',
            act: 'repository.update(sessionB.id, { duration: 90 })',
            expectedReturn: 'WorkoutSession with duration = 90',
            expectedDbState: 'sessionB duration updated; sessionA row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── updateWithExercises ───────────────────────────────────────────────────────

const wsRepoUpdateWithExercisesIt: ItDescriptor = {
    reqId: 'REPO-23',
    statement: 'WorkoutSessionRepository.updateWithExercises(id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]): Promise<WorkoutSessionWithExercises> — validates exercises non-empty, checks session exists, then in one transaction reconciles the exercise links (deletes unlisted, updates kept, creates new) and updates session scalar fields.',
    data: 'id: string, data: UpdateWorkoutSessionInput  { date?, duration?, notes? }, exercises: WorkoutSessionExerciseUpdateInput[]  { id?: string, exerciseId: string, sets: number, reps: number, weight: number }[]',
    precondition: 'Workout session with the given id exists in the database. Each exerciseId in exercises references an existing exercise row.',
    results: 'WorkoutSessionWithExercises — the updated session with the reconciled exercise links, or WorkoutSessionRequiresExercisesError if exercises is empty, or NotFoundError if the session does not exist.',
    postcondition: 'Session scalar fields updated; workout_session_exercises rows reconciled (deleted, updated, and created as needed). On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async updateWithExercises(id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]): Promise<WorkoutSessionWithExercises> {',
        '    if (exercises.length === 0) {',
        '        throw new WorkoutSessionRequiresExercisesError(\'A workout session must include at least one exercise.\');',
        '    }',
        '',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '',
        '    try {',
        '        return await this.database.$transaction(async (tx) => {',
        '            const existingIds = (await tx.workoutSessionExercise.findMany({',
        '                where: {workoutSessionId: id},',
        '                select: {id: true},',
        '            })).map((e) => e.id);',
        '',
        '            const keptIds = exercises.filter((e) => e.id).map((e) => e.id!);',
        '            const toDeleteIds = existingIds.filter((eid) => !keptIds.includes(eid));',
        '',
        '            if (toDeleteIds.length > 0) {',
        '                await tx.workoutSessionExercise.deleteMany({where: {id: {in: toDeleteIds}}});',
        '            }',
        '',
        '            for (const e of exercises.filter((e) => e.id)) {',
        '                await tx.workoutSessionExercise.update({',
        '                    where: {id: e.id},',
        '                    data: {exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, weight: e.weight},',
        '                });',
        '            }',
        '',
        '            const newExercises = exercises.filter((e) => !e.id);',
        '            if (newExercises.length > 0) {',
        '                await tx.workoutSessionExercise.createMany({',
        '                    data: newExercises.map((e) => ({',
        '                        workoutSessionId: id,',
        '                        exerciseId: e.exerciseId,',
        '                        sets: e.sets,',
        '                        reps: e.reps,',
        '                        weight: e.weight,',
        '                    })),',
        '                });',
        '            }',
        '',
        '            return tx.workoutSession.update({',
        '                where: {id},',
        '                data: {',
        '                    ...(data.date ? {date: new Date(data.date)} : {}),',
        '                    ...(data.duration !== undefined ? {duration: data.duration} : {}),',
        '                    ...(data.notes !== undefined ? {notes: data.notes} : {}),',
        '                },',
        '                include: {exercises: {include: {exercise: true}}},',
        '            });',
        '        });',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to update workout session: ${(error as Error).message}`);',
        '    }',
        '}',
    ],

    moduleDot: `digraph updateWithExercises {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.updateWithExercises()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findSession  [label="workoutSession\\n.findUnique()"];
    transaction  [label="\\$transaction()"];
    wseFindMany  [label="workoutSessionExercise\\n.findMany()"];
    wseDeleteMany [label="workoutSessionExercise\\n.deleteMany()"];
    wseUpdate    [label="workoutSessionExercise\\n.update()"];
    wseCreateMany [label="workoutSessionExercise\\n.createMany()"];
    sessionUpdate [label="workoutSession\\n.update()"];
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

  method -> WorkoutSessionRequiresExercisesError [label="throws (empty exercises)", style=dashed];
  method -> findSession                          [label="existence check"];
  method -> NotFoundError                        [label="throws (id missing)", style=dashed];
  method -> transaction                          [label="reconcile exercises"];
  transaction -> wseFindMany                     [label="get existing WSE ids"];
  transaction -> wseDeleteMany                   [label="remove unlisted"];
  transaction -> wseUpdate                       [label="update kept (by id)"];
  transaction -> wseCreateMany                   [label="add new (no id)"];
  transaction -> sessionUpdate                   [label="update session fields"];
  method -> TransactionError                     [label="throws (db error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded with that exercise (WSE1).\nInput: { duration: 90 }. exercises: [{ id: WSE1.id, exerciseId, sets: 5, reps: 8, weight: 100 }]',
            act: 'repository.updateWithExercises(sessionId, inputData, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with duration = 90, exercises[0].sets = 5',
            expectedDbState: 'workout_sessions duration updated; WSE1 sets = 5, reps = 8, weight = 100 in workout_session_exercises',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Member and exercise seeded. Session seeded.',
            act: 'repository.updateWithExercises(sessionId, {}, [])',
            expectedReturn: 'Throws WorkoutSessionRequiresExercisesError',
            expectedDbState: 'All workout_sessions and workout_session_exercises rows unchanged',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.updateWithExercises("00000000-0000-0000-0000-000000000000", {}, [{ exerciseId: "any", sets: 3, reps: 10, weight: 50 }])',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member and two exercises seeded. Session seeded with both exercises (WSE1 for exercise1, WSE2 for exercise2).\nexercises: [{ id: WSE1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }] — exercise2 omitted.',
            act: 'repository.updateWithExercises(sessionId, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 1 containing only exercise1',
            expectedDbState: 'WSE2 row removed from workout_session_exercises; WSE1 row still present',
            actualResult: 'Passed',
        },
        {
            noTc: '5',
            arrange: 'Member and exercise seeded. Session seeded with that exercise (WSE1, sets = 3, reps = 10, weight = 50).\nexercises: [{ id: WSE1.id, exerciseId, sets: 5, reps: 8, weight: 100 }]',
            act: 'repository.updateWithExercises(sessionId, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises[0].sets = 5, reps = 8, weight = 100',
            expectedDbState: 'WSE1 sets = 5, reps = 8, weight = 100 in workout_session_exercises',
            actualResult: 'Passed',
        },
        {
            noTc: '6',
            arrange: 'Member and two exercises seeded. Session seeded with exercise1 only (WSE1).\nexercises: [{ id: WSE1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50 }, { exerciseId: exercise2.id, sets: 2, reps: 15, weight: 20 }]',
            act: 'repository.updateWithExercises(sessionId, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2',
            expectedDbState: 'Two workout_session_exercises rows exist for the session',
            actualResult: 'Passed',
        },
        {
            noTc: '7',
            arrange: 'Member and three exercises seeded. Session seeded with exercise1 (WSE1) and exercise2 (WSE2).\nexercises: [{ id: WSE1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60 }, { exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40 }] — exercise2 omitted.',
            act: 'repository.updateWithExercises(sessionId, {}, inputExercises)',
            expectedReturn: 'WorkoutSessionWithExercises with exercises array of length 2 — WSE1 updated, exercise3 present, exercise2 absent',
            expectedDbState: 'WSE1 sets = 4 in workout_session_exercises; WSE2 row removed; one new WSE row for exercise3 created',
            actualResult: 'Passed',
        },
        {
            noTc: '8',
            arrange: 'Member and exercise seeded. Session seeded with that exercise (WSE1).\nAttempt 1: updateWithExercises(sessionId, {}, []) → WorkoutSessionRequiresExercisesError (discarded).',
            act: 'repository.updateWithExercises(sessionId, { duration: 90 }, [{ id: WSE1.id, exerciseId, sets: 3, reps: 10, weight: 50 }])',
            expectedReturn: 'WorkoutSessionWithExercises with duration = 90',
            expectedDbState: 'workout_sessions duration updated; workout_session_exercises row unchanged',
            actualResult: 'Passed',
        },
    ],
};

// ── delete ────────────────────────────────────────────────────────────────────

const wsRepoDeleteIt: ItDescriptor = {
    reqId: 'REPO-24',
    statement: 'WorkoutSessionRepository.delete(id: string): Promise<void> — finds the session and removes it; the onDelete: Cascade relation cascades the deletion to all linked workout_session_exercises rows.',
    data: 'id: string — the workout_sessions UUID to delete.',
    precondition: 'Database may or may not contain a workout_sessions row with the given id.',
    results: 'void — or NotFoundError if no row exists with that id.',
    postcondition: 'On success, the session row and all linked workout_session_exercises rows are absent from the database. On error, no rows are modified.',
    remarks: SHARED_REMARKS,
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '',
        '    await this.database.workoutSession.delete({where: {id}});',
        '}',
    ],

    moduleDot: `digraph delete {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  method [label="WorkoutSessionRepository\\n.delete()"];

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="workoutSession\\n.findUnique()"];
    deleteOp   [label="workoutSession\\n.delete()"];
    deleteOpWSE   [label="workoutSessionExercises\\n(cascade)"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
    NotFoundError;
    NotFoundError -> AppError [label="extends"];
  }

  method -> findUnique    [label="existence check"];
  method -> NotFoundError [label="throws (id missing)", style=dashed];
  method -> deleteOp      [label="remove row"];
  deleteOp -> deleteOpWSE [label="cascades to"];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member and exercise seeded. Session seeded with that exercise. id = seededSession.id.',
            act: 'repository.delete(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Row no longer present in workout_sessions or workout_session_exercises tables',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nid = "00000000-0000-0000-0000-000000000000"',
            act: 'repository.delete("00000000-0000-0000-0000-000000000000")',
            expectedReturn: 'Throws NotFoundError',
            expectedDbState: 'No change',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Member and two exercises seeded. Session seeded with both exercises (two WSE rows). id = seededSession.id.',
            act: 'repository.delete(inputId)',
            expectedReturn: 'undefined',
            expectedDbState: 'Session row and both workout_session_exercises rows no longer present in the database',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member and exercise seeded. Two sessions seeded: sessionA and sessionB, each with one exercise.\nAttempt 1: delete("00000000-...") → NotFoundError (discarded).',
            act: 'repository.delete(sessionB.id)',
            expectedReturn: 'undefined',
            expectedDbState: 'sessionA and its workout_session_exercises row still present; sessionB and its workout_session_exercises row removed',
            actualResult: 'Passed',
        },
    ],
};

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const EXERCISE_REPO = path.join(BASE, 'exercise-repository');
    await writeIt(createIt, path.join(EXERCISE_REPO, 'create-it-form.xlsx'));
    await writeIt(findByIdIt, path.join(EXERCISE_REPO, 'findById-it-form.xlsx'));
    await writeIt(findAllIt, path.join(EXERCISE_REPO, 'findAll-it-form.xlsx'));
    await writeIt(updateIt, path.join(EXERCISE_REPO, 'update-it-form.xlsx'));
    await writeIt(setActiveIt, path.join(EXERCISE_REPO, 'setActive-it-form.xlsx'));
    await writeIt(deleteIt, path.join(EXERCISE_REPO, 'delete-it-form.xlsx'));

    const USER_REPO = path.join(BASE, 'user-repository');
    await writeIt(userRepoCreateMemberIt, path.join(USER_REPO, 'createMember-it-form.xlsx'));
    await writeIt(userRepoCreateAdminIt, path.join(USER_REPO, 'createAdmin-it-form.xlsx'));
    await writeIt(userRepoFindByIdIt, path.join(USER_REPO, 'findById-it-form.xlsx'));
    await writeIt(userRepoFindMemberByIdIt, path.join(USER_REPO, 'findMemberById-it-form.xlsx'));
    await writeIt(userRepoFindAdminByIdIt, path.join(USER_REPO, 'findAdminById-it-form.xlsx'));
    await writeIt(userRepoFindByEmailIt, path.join(USER_REPO, 'findByEmail-it-form.xlsx'));
    await writeIt(userRepoFindMembersIt, path.join(USER_REPO, 'findMembers-it-form.xlsx'));
    await writeIt(userRepoFindAdminsIt, path.join(USER_REPO, 'findAdmins-it-form.xlsx'));
    await writeIt(userRepoUpdateMemberIt, path.join(USER_REPO, 'updateMember-it-form.xlsx'));
    await writeIt(userRepoSetMemberActiveIt, path.join(USER_REPO, 'setMemberActive-it-form.xlsx'));
    await writeIt(userRepoUpdateAdminIt, path.join(USER_REPO, 'updateAdmin-it-form.xlsx'));
    await writeIt(userRepoDeleteIt, path.join(USER_REPO, 'delete-it-form.xlsx'));

    const WS_REPO = path.join(BASE, 'workout-session-repository');
    await writeIt(wsRepoCreateIt, path.join(WS_REPO, 'create-it-form.xlsx'));
    await writeIt(wsRepoFindByIdIt, path.join(WS_REPO, 'findById-it-form.xlsx'));
    await writeIt(wsRepoFindAllIt, path.join(WS_REPO, 'findAll-it-form.xlsx'));
    await writeIt(wsRepoUpdateIt, path.join(WS_REPO, 'update-it-form.xlsx'));
    await writeIt(wsRepoUpdateWithExercisesIt, path.join(WS_REPO, 'updateWithExercises-it-form.xlsx'));
    await writeIt(wsRepoDeleteIt, path.join(WS_REPO, 'delete-it-form.xlsx'));

    console.log('Done.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});