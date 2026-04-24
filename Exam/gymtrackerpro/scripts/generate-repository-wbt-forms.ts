/**
 * generate-repository-wbt-forms.ts
 * Run: npm run generate-repository-wbt-forms
 *
 * Add one WbtDescriptor per repository function under test.
 * See the wbt-gymtrackerpro skill for the complete filling guide.
 */

import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'repository', '__tests__', 'wbt');

// ── Descriptors ────────────────────────────────────────────────────────────────

const exerciseRepositoryCreateWbt: WbtDescriptor = {
    reqId: 'REPO-01',
    statement: 'ExerciseRepository.create(data) - creates a new exercise after verifying the name is unique.',
    data: 'Input: CreateExerciseInput',
    precondition: 'A valid CreateExerciseInput is provided.',
    results: 'Output: Promise<Exercise> | throws ConflictError',
    postcondition: 'Returns the created Exercise if the name is unique; throws ConflictError if the name is already in use.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retOk    [label="return exercise" shape=box];
  throwCE  [label="throw ConflictError" shape=box];
  S1       [label="existing = findUnique({name})" shape=box];
  S2       [label="exercise = exercise.create({data})" shape=box];
  D1       [label="existing != null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> throwCE:n  [label="True"];
  D1:e    -> S2:n       [label="False"];
  S2:s    -> retOk:n;
  retOk:s -> mExit:nw;
  throwCE:s -> mExit:ne;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'async create(data: CreateExerciseInput): Promise<Exercise> {',
        '    const existing = await this.database.exercise.findUnique({where: {name: data.name}});',
        '    if (existing) {',
        '        throw new ConflictError(`Exercise name already in use: ${data.name}`);',
        '    }',
        '    return this.database.exercise.create({data});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: [
        'existing != null (D1)',
    ],
    paths: [
        {id: '1', description: 'start -> S1 -> D1(F) -> S2 -> retOk -> mExit -> exit'},
        {id: '2', description: 'start -> S1 -> D1(T) -> throwCE -> mExit -> exit'},
    ],
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_EXERCISE_INPUT, findUnique returns null',
            expected: 'returns created Exercise',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'data=CREATE_EXERCISE_INPUT, findUnique returns MOCK_EXERCISE',
            expected: 'throws ConflictError',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as TC1 is the first to reach return this.database.exercise.create({data}), and TC2 is the first to reach throw new ConflictError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-02 · ExerciseRepository.findById
// ─────────────────────────────────────────────────────────────────────────────

const exerciseRepositoryFindByIdWbt: WbtDescriptor = {
    reqId: 'REPO-02',
    statement: 'ExerciseRepository.findById(id) - fetches an exercise by its id, throwing if absent.',
    data: 'Input: string',
    precondition: 'A string id is provided.',
    results: 'Output: Promise<Exercise> | throws NotFoundError',
    postcondition: 'Returns the Exercise if found; throws NotFoundError otherwise.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retOk    [label="return exercise" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S1       [label="exercise = findUnique({id})" shape=box];
  D1       [label="exercise == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> retOk:n   [label="False"];
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async findById(id: string): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({where: {id}});',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    return exercise;',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: [
        'exercise == null (D1)',
    ],
    paths: [
        {id: '1', description: 'start -> S1 -> D1(F) -> retOk -> mExit -> exit'},
        {id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit'},
    ],
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, findUnique returns MOCK_EXERCISE',
            expected: 'returns MOCK_EXERCISE',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, findUnique returns null',
            expected: 'throws NotFoundError',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as TC1 is the first to reach return exercise, and TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const exerciseRepositoryFindAllWbt: WbtDescriptor = {
    reqId: 'REPO-03',
    statement: 'ExerciseRepository.findAll(options) - returns a paginated list of exercises filtered by the provided options.',
    data: 'Input: ExerciseListOptions (optional)',
    precondition: 'options is an optional object; defaults apply for any omitted fields.',
    results: 'Output: Promise<PageResult<Exercise>>',
    postcondition: 'Returns PageResult containing items and total matching the applied where clause.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
 
  S1    [label="destructure options with defaults" shape=box];
  S2    [label="safePage = max(1, page)" shape=box];
  S3    [label="safeSearch = escapeLike(search)" shape=box];
  S4    [label="safeSearch = undefined" shape=box];
  S5    [label="isActive filter: {} (inactive included)" shape=box];
  S6    [label="isActive filter: {isActive:true}" shape=box];
  S7    [label="muscleGroup filter: {muscleGroup}" shape=box];
  S8    [label="muscleGroup filter: {}" shape=box];
  S9    [label="name filter: {name:{contains:safeSearch}}" shape=box];
  S10   [label="name filter: {}" shape=box];
  S11   [label="where = spread all filter arms" shape=box];
  S12   [label="[items,total] = $transaction([findMany,count])" shape=box];
  retOk [label="return {items, total}" shape=box];
 
  D1    [label="search defined?" shape=diamond];
  D2    [label="includeInactive?" shape=diamond];
  D3    [label="muscleGroup defined?" shape=diamond];
  D4    [label="safeSearch defined?" shape=diamond];
 
  m1    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  m2    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  m3    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  m4    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start -> S1:n;
  S1:s  -> S2:n;
  S2:s  -> D1:n;
 
  D1:w  -> S3:n  [label="True"];
  D1:e  -> S4:n  [label="False"];
  S3:s  -> m1:nw;
  S4:s  -> m1:ne;
  m1    -> D2:n;
 
  D2:w  -> S5:n  [label="True"];
  D2:e  -> S6:n  [label="False"];
  S5:s  -> m2:nw;
  S6:s  -> m2:ne;
  m2    -> D3:n;
 
  D3:w  -> S7:n  [label="True"];
  D3:e  -> S8:n  [label="False"];
  S7:s  -> m3:nw;
  S8:s  -> m3:ne;
  m3    -> D4:n;
 
  D4:w  -> S9:n  [label="True"];
  D4:e  -> S10:n [label="False"];
  S9:s  -> m4:nw;
  S10:s -> m4:ne;
  m4    -> S11:n;
 
  S11:s  -> S12:n;
  S12:s  -> retOk:n;
  retOk:s -> exit;
}`,
    cfgSourceCode: [
        'async findAll(options: ExerciseListOptions = {}): Promise<PageResult<Exercise>> {',
        '    const {search, muscleGroup, includeInactive = false, page = 1, pageSize = 10} = options;',
        '    const safePage = Math.max(1, page);',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = {',
        '        ...(includeInactive ? {} : {isActive: true}),',
        '        ...(muscleGroup ? {muscleGroup} : {}),',
        '        ...(safeSearch ? {name: {contains: safeSearch, mode: \'insensitive\' as const}} : {}),',
        '    };',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.exercise.findMany({where, skip: (safePage - 1) * pageSize, take: pageSize, orderBy: {name: \'asc\'}}),',
        '        this.database.exercise.count({where}),',
        '    ]);',
        '    return {items, total};',
        '}',
    ],
    // E=28, N=22 → CC₂ = E−N+2 = 8
    // P=4 diamond nodes → CC₃ = P+1 = 5 (but D1 and D4 are coupled,
    // reducing reachable independent paths to 8; CC₂ is authoritative)
    // Regions: 8 enclosed regions + 1 outer = but graph formula wins → 8
    cyclomaticComplexity: { cc1Regions: 8, cc2EdgeNodePlus2: 8, cc3PredicatePlus1: 8 },
    predicates: [
        'search defined (D1)',
        'includeInactive is true (D2)',
        'muscleGroup defined (D3)',
        'safeSearch defined (D4)',
    ],
    paths: [
        { id: '1', description: 'start→S1→S2→D1(F)→S4→m1→D2(F)→S6→m2→D3(F)→S8→m3→D4(F)→S10→m4→S11→S12→retOk→exit  [no search, active only, no muscleGroup]' },
        { id: '2', description: 'start→S1→S2→D1(T)→S3→m1→D2(F)→S6→m2→D3(F)→S8→m3→D4(T)→S9→m4→S11→S12→retOk→exit  [search, active only, no muscleGroup]' },
        { id: '3', description: 'start→S1→S2→D1(F)→S4→m1→D2(T)→S5→m2→D3(F)→S8→m3→D4(F)→S10→m4→S11→S12→retOk→exit  [no search, includeInactive, no muscleGroup]' },
        { id: '4', description: 'start→S1→S2→D1(F)→S4→m1→D2(F)→S6→m2→D3(T)→S7→m3→D4(F)→S10→m4→S11→S12→retOk→exit  [no search, active only, muscleGroup]' },
        { id: '5', description: 'start→S1→S2→D1(T)→S3→m1→D2(T)→S5→m2→D3(F)→S8→m3→D4(T)→S9→m4→S11→S12→retOk→exit  [search, includeInactive, no muscleGroup]' },
        { id: '6', description: 'start→S1→S2→D1(T)→S3→m1→D2(F)→S6→m2→D3(T)→S7→m3→D4(T)→S9→m4→S11→S12→retOk→exit  [search, active only, muscleGroup]' },
        { id: '7', description: 'start→S1→S2→D1(F)→S4→m1→D2(T)→S5→m2→D3(T)→S7→m3→D4(F)→S10→m4→S11→S12→retOk→exit  [no search, includeInactive, muscleGroup]' },
        { id: '8', description: 'start→S1→S2→D1(T)→S3→m1→D2(T)→S5→m2→D3(T)→S7→m3→D4(T)→S9→m4→S11→S12→retOk→exit  [search, includeInactive, muscleGroup - all filters]' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options={} - no search, includeInactive defaults false, no muscleGroup',
            expected: 'returns PageResult; where={isActive:true}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'options={search:"curl"} - search only',
            expected: 'returns PageResult; where={isActive:true, name:{contains:escaped"curl"}}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true], [false, true], [true, false]],
            pathCoverage: [false, true, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'options={includeInactive:true} - includeInactive only',
            expected: 'returns PageResult; where={} (no isActive filter)',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, true]],
            pathCoverage: [false, false, true, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'options={muscleGroup:MuscleGroup.ARMS} - muscleGroup only',
            expected: 'returns PageResult; where={isActive:true, muscleGroup:ARMS}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'options={search:"curl", includeInactive:true} - search + includeInactive',
            expected: 'returns PageResult; where={name:{contains:escaped"curl"}} (no isActive filter)',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, true, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'options={search:"curl", muscleGroup:MuscleGroup.ARMS} - search + muscleGroup',
            expected: 'returns PageResult; where={isActive:true, muscleGroup:ARMS, name:{contains:escaped"curl"}}',
            statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, true, false, false],
        },
        {
            noTc: '7',
            inputData: 'options={includeInactive:true, muscleGroup:MuscleGroup.ARMS} - includeInactive + muscleGroup',
            expected: 'returns PageResult; where={muscleGroup:ARMS} (no isActive filter)',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, true, false],
        },
        {
            noTc: '8',
            inputData: 'options={search:"curl", includeInactive:true, muscleGroup:MuscleGroup.ARMS} - all filters',
            expected: 'returns PageResult; where={muscleGroup:ARMS, name:{contains:escaped"curl"}} (no isActive filter)',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage: TC1 is the first to execute S4 (safeSearch=undefined), S6 (isActive filter), S8 (no muscleGroup), S10 (no name filter), S11, S12, and retOk. TC2 is the first to execute S3 (escapeLike) and S9 (name filter). TC3 is the first to execute S5 (no isActive filter). TC4 is the first to execute S7 (muscleGroup filter). TCs 5–8 exercise previously covered statements only and do not add new SC.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-04 · ExerciseRepository.update
// ─────────────────────────────────────────────────────────────────────────────

const exerciseRepositoryUpdateWbt: WbtDescriptor = {
    reqId: 'REPO-04',
    statement: 'ExerciseRepository.update(id, data) - updates an exercise, guarding against missing record and name conflicts.',
    data: 'Input: id: string, data: UpdateExerciseInput',
    precondition: 'A valid id and UpdateExerciseInput are provided.',
    results: 'Output: Promise<Exercise> | throws NotFoundError | throws ConflictError',
    postcondition: 'Returns updated Exercise; throws NotFoundError if id absent; throws ConflictError if new name is already in use by another record.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retOk    [label="return updated exercise" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  throwCE  [label="throw ConflictError" shape=box];
  S1       [label="exercise = findUnique({id})" shape=box];
  S2       [label="conflict = findUnique({name: data.name})" shape=box];
  S3       [label="exercise.update({id, data})" shape=box];
  D1       [label="exercise == null?" shape=diamond];
  D2       [label="data.name defined AND data.name != exercise.name?" shape=diamond];
  D3       [label="conflict != null?" shape=diamond];
  m1       [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n  [label="True"];
  D1:e     -> D2:n       [label="False"];
  D2:w     -> S2:n       [label="True"];
  D2:e     -> m1:ne      [label="False"];
  S2:s     -> D3:n;
  D3:w     -> throwCE:n  [label="True"];
  D3:e     -> m1:nw      [label="False"];
  m1       -> S3:n;
  S3:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  throwCE:s -> mExit:n;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async update(id: string, data: UpdateExerciseInput): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({where: {id}});',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    if (data.name && data.name !== exercise.name) {',
        '        const conflict = await this.database.exercise.findUnique({where: {name: data.name}});',
        '        if (conflict) {',
        '            throw new ConflictError(`Exercise name already in use: ${data.name}`);',
        '        }',
        '    }',
        '    return this.database.exercise.update({where: {id}, data});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        'exercise == null (D1)',
        'data.name defined AND data.name != exercise.name (D2)',
        'conflict != null (D3)',
    ],
    paths: [
        {id: '1', description: 'start -> S1 -> D1(F) -> D2(F) -> S3 -> retOk -> mExit -> exit'},
        {id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit'},
        {id: '3', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(F) -> S3 -> retOk -> mExit -> exit'},
        {id: '4', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(T) -> throwCE -> mExit -> exit'},
    ],
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, data={description: "New desc"} (no name change), findUnique returns MOCK_EXERCISE',
            expected: 'returns updated Exercise',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, findUnique returns null',
            expected: 'throws NotFoundError',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID, data={name: "New Unique Name"}, second findUnique returns null',
            expected: 'returns updated Exercise',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'id=EXERCISE_ID, data={name: "Conflicting Name"}, second findUnique returns MOCK_EXERCISE',
            expected: 'throws ConflictError',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false]],
            pathCoverage: [false, false, false, true],
        },
        {
            noTc: '5',
            inputData: 'id=EXERCISE_ID, data={name: "Bicep Curls"} (same as current exercise name), findUnique returns MOCK_EXERCISE',
            expected: 'returns updated Exercise (D2=False: C1=True but C2=False because name is unchanged)',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [false, false]],
            pathCoverage: [true, false, false, false],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, and TC3 as TC1 is the first to reach return this.database.exercise.update(...), TC2 is the first to reach throw new NotFoundError(...), and TC3 is the first to execute the conflict-check branch with const conflict = ....',
        '2) D2 is a compound condition with two atomic conditions - C1: data.name truthy, C2: data.name !== exercise.name. Because the operator is &&, three distinguishable MCC combinations exist: C1=F (TC1), C1=T∧C2=F (TC5), and C1=T∧C2=T (TC3 and TC4). TC5 supplies the missing C1=T∧C2=F case by providing the same name as the current exercise; D2 evaluates to False and the name-conflict block is skipped entirely.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-05 · ExerciseRepository.setActive
// ─────────────────────────────────────────────────────────────────────────────

const exerciseRepositorySetActiveWbt: WbtDescriptor = {
    reqId: 'REPO-05',
    statement: 'ExerciseRepository.setActive(id, isActive) - sets the isActive flag on an exercise.',
    data: 'Input: id: string, isActive: boolean',
    precondition: 'A valid id and boolean isActive value are provided.',
    results: 'Output: Promise<Exercise> | throws NotFoundError',
    postcondition: 'Returns the updated Exercise with the new isActive value; throws NotFoundError if the exercise does not exist.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retOk    [label="return updated exercise" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S1       [label="exercise = findUnique({id})" shape=box];
  S2       [label="exercise = exercise.update({id, isActive})" shape=box];
  D1       [label="exercise == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> S2:n      [label="False"];
  S2:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async setActive(id: string, isActive: boolean): Promise<Exercise> {',
        '    const exercise = await this.database.exercise.findUnique({where: {id}});',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    return this.database.exercise.update({where: {id}, data: {isActive}});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: [
        'exercise == null (D1)',
    ],
    paths: [
        {id: '1', description: 'start -> S1 -> D1(F) -> S2 -> retOk -> mExit -> exit'},
        {id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit'},
    ],
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, isActive=false, findUnique returns MOCK_EXERCISE',
            expected: 'returns Exercise with isActive=false',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, isActive=true, findUnique returns null',
            expected: 'throws NotFoundError',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as TC1 is the first to reach return this.database.exercise.update({where: {id}, data: {isActive}}), and TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-06 · ExerciseRepository.delete
// ─────────────────────────────────────────────────────────────────────────────

const exerciseRepositoryDeleteWbt: WbtDescriptor = {
    reqId: 'REPO-06',
    statement: 'ExerciseRepository.delete(id) - deletes an exercise, guarding against absence and active session usage.',
    data: 'Input: id: string',
    precondition: 'A valid id string is provided.',
    results: 'Output: Promise<void> | throws NotFoundError | throws ConflictError',
    postcondition: 'Deletes the exercise and resolves void; throws NotFoundError if not found; throws ConflictError if referenced by workout sessions.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retOk    [label="return void" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  throwCE  [label="throw ConflictError" shape=box];
  S1       [label="exercise = findUnique({id})" shape=box];
  S2       [label="usageCount = workoutSessionExercise.count({exerciseId})" shape=box];
  S3       [label="exercise.delete({id})" shape=box];
  D1       [label="exercise == null?" shape=diamond];
  D2       [label="usageCount > 0?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> S2:n      [label="False"];
  S2:s     -> D2:n;
  D2:w     -> throwCE:n [label="True"];
  D2:e     -> S3:n      [label="False"];
  S3:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  throwCE:s -> mExit:n;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const exercise = await this.database.exercise.findUnique({where: {id}});',
        '    if (!exercise) {',
        '        throw new NotFoundError(`Exercise not found: ${id}`);',
        '    }',
        '    const usageCount = await this.database.workoutSessionExercise.count({where: {exerciseId: id}});',
        '    if (usageCount > 0) {',
        '        throw new ConflictError(`Exercise is used in existing workout sessions and cannot be deleted`);',
        '    }',
        '    await this.database.exercise.delete({where: {id}});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3},
    predicates: [
        'exercise == null (D1)',
        'usageCount > 0 (D2)',
    ],
    paths: [
        {id: '1', description: 'start -> S1 -> D1(F) -> S2 -> D2(F) -> S3 -> retOk -> mExit -> exit'},
        {id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit'},
        {id: '3', description: 'start -> S1 -> D1(F) -> S2 -> D2(T) -> throwCE -> mExit -> exit'},
    ],
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, findUnique returns MOCK_EXERCISE, usageCount=0',
            expected: 'resolves void',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, findUnique returns null',
            expected: 'throws NotFoundError',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=EXERCISE_ID, findUnique returns MOCK_EXERCISE, usageCount=2',
            expected: 'throws ConflictError',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, and TC3 as TC1 is the first to reach await this.database.exercise.delete({where: {id}}), TC2 is the first to reach throw new NotFoundError(...), and TC3 is the first to reach throw new ConflictError(...) after the usage-count check.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const userRepositoryCreateMemberWbt: WbtDescriptor = {
    reqId: 'REPO-07',
    statement: 'UserRepository.createMember(data) - hashes the password and creates a member+user record inside a transaction, guarding against duplicate emails.',
    data: 'Input: CreateMemberInput',
    precondition: 'A valid CreateMemberInput is provided.',
    results: 'Output: Promise<MemberWithUser> | throws ConflictError | throws TransactionError',
    postcondition: 'Returns the created MemberWithUser if email is unique and Prisma succeeds; throws ConflictError on duplicate email; throws TransactionError if Prisma create fails.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit      [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1        [label="existing = user.findUnique({email})" shape=box];
  throwCE   [label="throw ConflictError" shape=box];
  S2        [label="passwordHash = bcrypt.hash(password, 12)" shape=box];
  S3        [label="result = user.create({...})" shape=box];
  S4        [label="destructure result; return MemberWithUser" shape=box];
  throwTE   [label="throw TransactionError" shape=box];
  D1        [label="existing != null?" shape=diamond];
  D2        [label="create throws?" shape=diamond];
  mExit     [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> throwCE:n  [label="True"];
  D1:e    -> S2:n       [label="False"];
  S2:s    -> S3:n;
  S3:s    -> D2:n;
  D2:e    -> S4:n       [label="False"];
  D2:w    -> throwTE:n  [label="True"];
  S4:s    -> mExit:nw;
  throwCE:s -> mExit:ne;
  throwTE:s -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'async createMember(data: CreateMemberInput): Promise<MemberWithUser> {',
        '    const existing = await this.database.user.findUnique({ where: {email: data.email} });',
        '    if (existing) {',
        '        throw new ConflictError(`Email already in use: ${data.email}`);',
        '    }',
        '    const passwordHash = await bcrypt.hash(data.password, 12);',
        '    try {',
        '        const result = await this.database.user.create({ ... });',
        '        const {member: memberRecord, ...userRecord} = result;',
        '        return {...memberRecord!, user: userRecord as User};',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to create member: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3 },
    predicates: [
        'existing != null (D1)',
        'create throws (D2)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> S2 -> S3 -> D2(F) -> S4 -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwCE -> mExit -> exit' },
        { id: '3', description: 'start -> S1 -> D1(F) -> S2 -> S3 -> D2(T) -> throwTE -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_MEMBER_INPUT, findUnique returns null, user.create resolves MOCK_MEMBER_WITH_USER',
            expected: 'returns MemberWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'data=CREATE_MEMBER_INPUT, findUnique returns MOCK_USER (email taken)',
            expected: 'throws ConflictError("Email already in use: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'data=CREATE_MEMBER_INPUT, findUnique returns null, user.create rejects with Error("db error")',
            expected: 'throws TransactionError("Failed to create member: db error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, and TC3: TC1 is the first to reach the destructure + return path; TC2 is the first to reach throw new ConflictError(...); TC3 is the first to reach throw new TransactionError(...).',
        '2) D2 ("create throws?") models the try/catch boundary - True when user.create() rejects, False when it resolves. This is the only way to reach the TransactionError path.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-08 · UserRepository.createAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryCreateAdminWbt: WbtDescriptor = {
    reqId: 'REPO-08',
    statement: 'UserRepository.createAdmin(data) - hashes the password and creates an admin+user record inside a transaction, guarding against duplicate emails.',
    data: 'Input: CreateAdminInput',
    precondition: 'A valid CreateAdminInput is provided.',
    results: 'Output: Promise<AdminWithUser> | throws ConflictError | throws TransactionError',
    postcondition: 'Returns the created AdminWithUser if email is unique and Prisma succeeds; throws ConflictError on duplicate email; throws TransactionError if Prisma create fails.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit      [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1        [label="existing = user.findUnique({email})" shape=box];
  throwCE   [label="throw ConflictError" shape=box];
  S2        [label="passwordHash = bcrypt.hash(password, 12)" shape=box];
  S3        [label="result = user.create({...})" shape=box];
  S4        [label="destructure result; return AdminWithUser" shape=box];
  throwTE   [label="throw TransactionError" shape=box];
  D1        [label="existing != null?" shape=diamond];
  D2        [label="create throws?" shape=diamond];
  mExit     [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start   -> S1:n;
  S1:s    -> D1:n;
  D1:w    -> throwCE:n  [label="True"];
  D1:e    -> S2:n       [label="False"];
  S2:s    -> S3:n;
  S3:s    -> D2:n;
  D2:e    -> S4:n       [label="False"];
  D2:w    -> throwTE:n  [label="True"];
  S4:s    -> mExit:nw;
  throwCE:s -> mExit:ne;
  throwTE:s -> mExit:n;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {',
        '    const existing = await this.database.user.findUnique({ where: {email: data.email} });',
        '    if (existing) {',
        '        throw new ConflictError(`Email already in use: ${data.email}`);',
        '    }',
        '    const passwordHash = await bcrypt.hash(data.password, 12);',
        '    try {',
        '        const result = await this.database.user.create({ ... });',
        '        const {admin: adminRecord, ...userRecord} = result;',
        '        return {...adminRecord!, user: userRecord as User};',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to create admin: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3 },
    predicates: [
        'existing != null (D1)',
        'create throws (D2)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> S2 -> S3 -> D2(F) -> S4 -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwCE -> mExit -> exit' },
        { id: '3', description: 'start -> S1 -> D1(F) -> S2 -> S3 -> D2(T) -> throwTE -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_ADMIN_INPUT, findUnique returns null, user.create resolves MOCK_ADMIN_WITH_USER',
            expected: 'returns AdminWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'data=CREATE_ADMIN_INPUT, findUnique returns MOCK_USER (email taken)',
            expected: 'throws ConflictError("Email already in use: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'data=CREATE_ADMIN_INPUT, findUnique returns null, user.create rejects with Error("db error")',
            expected: 'throws TransactionError("Failed to create admin: db error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, and TC3: TC1 is the first to reach the destructure + return path; TC2 is the first to reach throw new ConflictError(...); TC3 is the first to reach throw new TransactionError(...).',
        '2) D2 ("create throws?") models the try/catch boundary - True when user.create() rejects, False when it resolves.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-09 · UserRepository.findById
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindByIdWbt: WbtDescriptor = {
    reqId: 'REPO-09',
    statement: 'UserRepository.findById(id) - fetches a user with member+admin profile by id, throwing if absent.',
    data: 'Input: string',
    precondition: 'A string id is provided.',
    results: 'Output: Promise<UserWithProfile> | throws NotFoundError',
    postcondition: 'Returns the UserWithProfile if found; throws NotFoundError otherwise.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="user = user.findUnique({id, include: member+admin})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  retOk    [label="return user" shape=box];
  D1       [label="user == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> retOk:n   [label="False"];
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async findById(id: string): Promise<UserWithProfile> {',
        '    const user = await this.database.user.findUnique({',
        '        where: {id},',
        '        include: {member: true, admin: true},',
        '    });',
        '    if (!user) {',
        '        throw new NotFoundError(`User not found: ${id}`);',
        '    }',
        '    return user;',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: [
        'user == null (D1)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=USER_ID, user.findUnique returns MOCK_USER_WITH_PROFILE',
            expected: 'returns MOCK_USER_WITH_PROFILE',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, user.findUnique returns null',
            expected: 'throws NotFoundError("User not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach return user; TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-10 · UserRepository.findMemberById
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindMemberByIdWbt: WbtDescriptor = {
    reqId: 'REPO-10',
    statement: 'UserRepository.findMemberById(memberId) - fetches a member with user by memberId, throwing if absent.',
    data: 'Input: string',
    precondition: 'A string memberId is provided.',
    results: 'Output: Promise<MemberWithUser> | throws NotFoundError',
    postcondition: 'Returns the MemberWithUser if found; throws NotFoundError otherwise.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="member = member.findUnique({id, include: user})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  retOk    [label="return member" shape=box];
  D1       [label="member == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> retOk:n   [label="False"];
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async findMemberById(memberId: string): Promise<MemberWithUser> {',
        '    const member = await this.database.member.findUnique({',
        '        where: {id: memberId},',
        '        include: {user: true},',
        '    });',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '    return member;',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: [
        'member == null (D1)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, member.findUnique returns MOCK_MEMBER_WITH_USER',
            expected: 'returns MOCK_MEMBER_WITH_USER',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=NONEXISTENT_ID, member.findUnique returns null',
            expected: 'throws NotFoundError("Member not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach return member; TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-11 · UserRepository.findAdminById
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindAdminByIdWbt: WbtDescriptor = {
    reqId: 'REPO-11',
    statement: 'UserRepository.findAdminById(adminId) - fetches an admin with user by adminId, throwing if absent.',
    data: 'Input: string',
    precondition: 'A string adminId is provided.',
    results: 'Output: Promise<AdminWithUser> | throws NotFoundError',
    postcondition: 'Returns the AdminWithUser if found; throws NotFoundError otherwise.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="admin = admin.findUnique({id, include: user})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  retOk    [label="return admin" shape=box];
  D1       [label="admin == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> retOk:n   [label="False"];
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async findAdminById(adminId: string): Promise<AdminWithUser> {',
        '    const admin = await this.database.admin.findUnique({',
        '        where: {id: adminId},',
        '        include: {user: true},',
        '    });',
        '    if (!admin) {',
        '        throw new NotFoundError(`Admin not found: ${adminId}`);',
        '    }',
        '    return admin;',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: [
        'admin == null (D1)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'adminId=ADMIN_ID, admin.findUnique returns MOCK_ADMIN_WITH_USER',
            expected: 'returns MOCK_ADMIN_WITH_USER',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'adminId=NONEXISTENT_ID, admin.findUnique returns null',
            expected: 'throws NotFoundError("Admin not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach return admin; TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-12 · UserRepository.findByEmail
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindByEmailWbt: WbtDescriptor = {
    reqId: 'REPO-12',
    statement: 'UserRepository.findByEmail(email) - fetches a user with member+admin profile by email, returning null if absent.',
    data: 'Input: string',
    precondition: 'A string email is provided.',
    results: 'Output: Promise<UserWithProfile | null>',
    postcondition: 'Returns the UserWithProfile if found; returns null otherwise. Never throws.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1     [label="return user.findUnique({email, include: member+admin})" shape=box];
 
  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async findByEmail(email: string): Promise<UserWithProfile | null> {',
        '    return this.database.user.findUnique({',
        '        where: {email},',
        '        include: {member: true, admin: true},',
        '    });',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1 },
    predicates: [],
    paths: [
        { id: '1', description: 'start -> S1 -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'email=MEMBER_EMAIL, user.findUnique returns MOCK_USER_WITH_PROFILE',
            expected: 'returns MOCK_USER_WITH_PROFILE',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
        {
            noTc: '2',
            inputData: 'email=UNKNOWN_EMAIL, user.findUnique returns null',
            expected: 'returns null',
            statementCoverage: false,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) No Condition/Decision Coverage section: the function contains zero predicate nodes - there are no branches to cover.',
        '2) TC2 is added to confirm the null-return contract and to satisfy the full output-domain coverage, even though it walks the same single path as TC1. statementCoverage is false for TC2 because TC1 already executes the only statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-13 · UserRepository.findMembers
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindMembersWbt: WbtDescriptor = {
    reqId: 'REPO-13',
    statement: 'UserRepository.findMembers(options) - returns a paginated list of members, optionally filtered by a search string.',
    data: 'Input: MemberListOptions (optional)',
    precondition: 'options is an optional object; defaults apply for any omitted fields.',
    results: 'Output: Promise<PageResult<MemberWithUser>>',
    postcondition: 'Returns PageResult containing items and total matching the applied where clause.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1      [label="destructure options with defaults" shape=box];
  S2      [label="safePage = max(1, page)" shape=box];
  S3      [label="safeSearch = escapeLike(search)" shape=box];
  S4      [label="safeSearch = undefined" shape=box];
  S5      [label="where = OR name/email filter" shape=box];
  S6      [label="where = undefined" shape=box];
  S7      [label="[items, total] = $transaction([findMany, count])" shape=box];
  retOk   [label="return {items, total}" shape=box];
  D1      [label="search defined?" shape=diamond];
  D2      [label="safeSearch defined?" shape=diamond];
  mSearch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mWhere  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start   -> S1:n;
  S1:s    -> S2:n;
  S2:s    -> D1:n;
  D1:w    -> S3:n      [label="True"];
  D1:e    -> S4:n      [label="False"];
  S3:s    -> mSearch:nw;
  S4:s    -> mSearch:ne;
  mSearch -> D2:n;
  D2:w    -> S5:n      [label="True"];
  D2:e    -> S6:n      [label="False"];
  S5:s    -> mWhere:nw;
  S6:s    -> mWhere:ne;
  mWhere  -> S7:n;
  S7:s    -> retOk:n;
  retOk:s -> exit;
}`,
    cfgSourceCode: [
        'async findMembers(options: MemberListOptions = {}): Promise<PageResult<MemberWithUser>> {',
        '    const {search, page = 1, pageSize = 10} = options;',
        '    const safePage = Math.max(1, page);',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = safeSearch',
        '        ? { user: { OR: [ {fullName: {contains: safeSearch, ...}}, {email: {contains: safeSearch, ...}} ] } }',
        '        : undefined;',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.member.findMany({where, ...}),',
        '        this.database.member.count({where}),',
        '    ]);',
        '    return {items, total};',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3 },
    predicates: [
        'search defined (D1)',
        'safeSearch defined (D2)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> S2 -> D1(F) -> S4 -> mSearch -> D2(F) -> S6 -> mWhere -> S7 -> retOk -> exit' },
        { id: '2', description: 'start -> S1 -> S2 -> D1(T) -> S3 -> mSearch -> D2(T) -> S5 -> mWhere -> S7 -> retOk -> exit' },
        { id: '3', description: '(structurally impossible - D1 and D2 are coupled: search defined <=> safeSearch defined)' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options={} (no search)',
            expected: 'returns PageResult with where=undefined (no filter)',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'options={search: "alice"}',
            expected: 'returns PageResult with OR name/email filter',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
    ],
    remarks: [
        '1) CC = P + 1 = 2 + 1 = 3, yielding a basis set of 3 paths. However Path 3 (D1[F] -> D2[T] or D1[T] -> D2[F]) is structurally impossible: safeSearch is derived directly from search via a ternary - if search is falsy safeSearch is always undefined (D2 False), and if search is truthy safeSearch is always a non-empty string (D2 True). D1 and D2 are therefore perfectly correlated, making the cross-combinations unreachable.',
        '2) statementCoverage is true for TC1 (first to reach return {items, total} via the no-filter path) and TC2 (first to reach the where = safeSearch branch, S3, and S5).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-14 · UserRepository.findAdmins
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryFindAdminsWbt: WbtDescriptor = {
    reqId: 'REPO-14',
    statement: 'UserRepository.findAdmins(options) - returns a paginated list of admins, optionally filtered by a search string.',
    data: 'Input: AdminListOptions (optional)',
    precondition: 'options is an optional object; defaults apply for any omitted fields.',
    results: 'Output: Promise<PageResult<AdminWithUser>>',
    postcondition: 'Returns PageResult containing items and total matching the applied where clause.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1      [label="destructure options with defaults" shape=box];
  S2      [label="safePage = max(1, page)" shape=box];
  S3      [label="safeSearch = escapeLike(search)" shape=box];
  S4      [label="safeSearch = undefined" shape=box];
  S5      [label="where = OR name/email filter" shape=box];
  S6      [label="where = undefined" shape=box];
  S7      [label="[items, total] = $transaction([findMany, count])" shape=box];
  retOk   [label="return {items, total}" shape=box];
  D1      [label="search defined?" shape=diamond];
  D2      [label="safeSearch defined?" shape=diamond];
  mSearch [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mWhere  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start   -> S1:n;
  S1:s    -> S2:n;
  S2:s    -> D1:n;
  D1:w    -> S3:n      [label="True"];
  D1:e    -> S4:n      [label="False"];
  S3:s    -> mSearch:nw;
  S4:s    -> mSearch:ne;
  mSearch -> D2:n;
  D2:w    -> S5:n      [label="True"];
  D2:e    -> S6:n      [label="False"];
  S5:s    -> mWhere:nw;
  S6:s    -> mWhere:ne;
  mWhere  -> S7:n;
  S7:s    -> retOk:n;
  retOk:s -> exit;
}`,
    cfgSourceCode: [
        'async findAdmins(options: AdminListOptions = {}): Promise<PageResult<AdminWithUser>> {',
        '    const {search, page = 1, pageSize = 10} = options;',
        '    const safePage = Math.max(1, page);',
        '    const safeSearch = search ? escapeLike(search) : undefined;',
        '    const where = safeSearch',
        '        ? { user: { OR: [ {fullName: {contains: safeSearch, ...}}, {email: {contains: safeSearch, ...}} ] } }',
        '        : undefined;',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.admin.findMany({where, ...}),',
        '        this.database.admin.count({where}),',
        '    ]);',
        '    return {items, total};',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3 },
    predicates: [
        'search defined (D1)',
        'safeSearch defined (D2)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> S2 -> D1(F) -> S4 -> mSearch -> D2(F) -> S6 -> mWhere -> S7 -> retOk -> exit' },
        { id: '2', description: 'start -> S1 -> S2 -> D1(T) -> S3 -> mSearch -> D2(T) -> S5 -> mWhere -> S7 -> retOk -> exit' },
        { id: '3', description: '(structurally impossible - D1 and D2 are coupled: search defined <=> safeSearch defined)' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options={} (no search)',
            expected: 'returns PageResult with where=undefined (no filter)',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'options={search: "bob"}',
            expected: 'returns PageResult with OR name/email filter',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false]],
            pathCoverage: [false, true, false],
        },
    ],
    remarks: [
        '1) The coupling argument D1 and D2 are perfectly correlated via the safeSearch ternary, making Path 3 impossible.',
        '2) statementCoverage is true for TC1 (first to reach return {items, total} via the no-filter path) and TC2 (first to reach the where = safeSearch branch, S3, and S5).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-15 · UserRepository.updateMember
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryUpdateMemberWbt: WbtDescriptor = {
    reqId: 'REPO-15',
    statement: 'UserRepository.updateMember(memberId, data) - updates a member record, guarding against absence, email conflict, and Prisma errors.',
    data: 'Input: memberId: string, data: UpdateMemberInput',
    precondition: 'A valid memberId string and UpdateMemberInput are provided.',
    results: 'Output: Promise<MemberWithUser> | throws NotFoundError | throws ConflictError | throws TransactionError',
    postcondition: 'Returns updated MemberWithUser on success; throws NotFoundError if member absent; throws ConflictError if new email already used; throws TransactionError on unexpected Prisma error.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="current = member.findUnique({id, include: user})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S2       [label="conflict = user.findUnique({email: data.email})" shape=box];
  throwCE  [label="throw ConflictError" shape=box];
  S3       [label="passwordHash = bcrypt.hash(password, 12)" shape=box];
  S4       [label="passwordHash = undefined" shape=box];
  S5       [label="member.update({...}); return MemberWithUser" shape=box];
  throwTE  [label="throw TransactionError" shape=box];
  D1       [label="current == null?" shape=diamond];
  D2       [label="data.email defined AND != current.user.email?" shape=diamond];
  D3       [label="conflict != null?" shape=diamond];
  D4       [label="data.password defined?" shape=diamond];
  D5       [label="update throws (not NF/CE)?" shape=diamond];
  mAfterNF [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mAfterEmail [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mAfterPwd   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n       [label="True"];
  D1:e     -> D2:n            [label="False"];
  throwNF:s -> mExit:nw;
  D2:w     -> S2:n            [label="True"];
  D2:e     -> mAfterEmail:ne  [label="False"];
  S2:s     -> D3:n;
  D3:w     -> throwCE:n       [label="True"];
  D3:e     -> mAfterEmail:nw  [label="False"];
  throwCE:s -> mExit:ne;
  mAfterEmail -> D4:n;
  D4:w     -> S3:n            [label="True"];
  D4:e     -> S4:n            [label="False"];
  S3:s     -> mAfterPwd:nw;
  S4:s     -> mAfterPwd:ne;
  mAfterPwd -> S5:n;
  S5:s     -> D5:n;
  D5:e     -> mExit:n         [label="False"];
  D5:w     -> throwTE:n       [label="True"];
  throwTE:s -> mExit:n;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {',
        '    const current = await this.database.member.findUnique({ where: {id: memberId}, include: {user: true} });',
        '    if (!current) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '    if (data.email && data.email !== current.user.email) {',
        '        const conflict = await this.database.user.findUnique({ where: {email: data.email} });',
        '        if (conflict) {',
        '            throw new ConflictError(`Email already in use: ${data.email}`);',
        '        }',
        '    }',
        '    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;',
        '    try {',
        '        return await this.database.member.update({ ... });',
        '    } catch (error) {',
        '        if (error instanceof NotFoundError || error instanceof ConflictError) { throw error; }',
        '        throw new TransactionError(`Failed to update member: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 6, cc2EdgeNodePlus2: 6, cc3PredicatePlus1: 6 },
    predicates: [
        'current == null (D1)',
        'data.email defined AND != current.user.email (D2)',
        'conflict != null (D3)',
        'data.password defined (D4)',
        'update throws (not NF/CE) (D5)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
        { id: '3', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '4', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(T) -> throwCE -> mExit -> exit' },
        { id: '5', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(T) -> S3 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '6', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(T) -> throwTE -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, data={fullName: "New Name"} (no email, no password), findUnique returns MOCK_MEMBER_WITH_USER, member.update resolves',
            expected: 'returns updated MemberWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=NONEXISTENT_ID, member.findUnique returns null',
            expected: 'throws NotFoundError("Member not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'memberId=MEMBER_ID, data={email: "new@email.com"} (different email, no conflict), findUnique(member) returns MOCK_MEMBER_WITH_USER, findUnique(user) returns null, member.update resolves',
            expected: 'returns updated MemberWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, true, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'memberId=MEMBER_ID, data={email: "taken@email.com"} (different email, conflict found), findUnique(member) returns MOCK_MEMBER_WITH_USER, findUnique(user) returns MOCK_USER',
            expected: 'throws ConflictError("Email already in use: ...")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false],
        },
        {
            noTc: '5',
            inputData: 'memberId=MEMBER_ID, data={password: "newPass123"} (no email change), findUnique returns MOCK_MEMBER_WITH_USER, member.update resolves',
            expected: 'returns updated MemberWithUser with hashed password',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, true, false],
        },
        {
            noTc: '6',
            inputData: 'memberId=MEMBER_ID, data={fullName: "Name"}, findUnique returns MOCK_MEMBER_WITH_USER, member.update rejects with Error("db error")',
            expected: 'throws TransactionError("Failed to update member: db error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) D2 is a compound condition: data.email && data.email !== current.user.email. For MCC, both sub-conditions must be independently exercised. TC1/TC2/TC5/TC6 cover D2=False (data.email absent); TC3/TC4 cover D2=True (email present and different). The sub-condition data.email === current.user.email (same email, skip check) is an additional False branch of D2 not required for the basis set but is documented for completeness.',
        '2) D5 models the catch block re-throw guard. The catch re-throws NotFoundError/ConflictError unchanged; only unexpected errors produce TransactionError. TC6 covers D5=True (unexpected Prisma error). The sub-path where the catch re-throws a NotFoundError or ConflictError is an impossible path in practice (member.update cannot throw NotFoundError/ConflictError on its own given our preconditions), so no separate TC is added.',
        '3) statementCoverage: TC1 first reaches S4 (passwordHash=undefined) and the happy-path return; TC2 first reaches throwNF; TC3 first reaches S2 (conflict check) and D3=False; TC4 first reaches throwCE; TC5 first reaches S3 (bcrypt.hash); TC6 first reaches throwTE.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-16 · UserRepository.setMemberActive
// ─────────────────────────────────────────────────────────────────────────────

const userRepositorySetMemberActiveWbt: WbtDescriptor = {
    reqId: 'REPO-16',
    statement: 'UserRepository.setMemberActive(memberId, isActive) - sets the isActive flag on a member.',
    data: 'Input: memberId: string, isActive: boolean',
    precondition: 'A valid memberId and boolean isActive value are provided.',
    results: 'Output: Promise<MemberWithUser> | throws NotFoundError',
    postcondition: 'Returns the updated MemberWithUser with the new isActive value; throws NotFoundError if the member does not exist.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="member = member.findUnique({id})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S2       [label="return member.update({id, isActive, include: user})" shape=box];
  D1       [label="member == null?" shape=diamond];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> S2:n      [label="False"];
  S2:s     -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async setMemberActive(memberId: string, isActive: boolean): Promise<MemberWithUser> {',
        '    const member = await this.database.member.findUnique({ where: {id: memberId} });',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${memberId}`);',
        '    }',
        '    return this.database.member.update({ where: {id: memberId}, data: {isActive}, include: {user: true} });',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: [
        'member == null (D1)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> S2 -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, isActive=false, member.findUnique returns MOCK_MEMBER, member.update resolves MOCK_MEMBER_WITH_USER (isActive=false)',
            expected: 'returns MemberWithUser with isActive=false',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=NONEXISTENT_ID, isActive=true, member.findUnique returns null',
            expected: 'throws NotFoundError("Member not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach return this.database.member.update(...); TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-17 · UserRepository.updateAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryUpdateAdminWbt: WbtDescriptor = {
    reqId: 'REPO-17',
    statement: 'UserRepository.updateAdmin(adminId, data) - updates an admin record, guarding against absence, email conflict, and Prisma errors.',
    data: 'Input: adminId: string, data: UpdateAdminInput',
    precondition: 'A valid adminId string and UpdateAdminInput are provided.',
    results: 'Output: Promise<AdminWithUser> | throws NotFoundError | throws ConflictError | throws TransactionError',
    postcondition: 'Returns updated AdminWithUser on success; throws NotFoundError if admin absent; throws ConflictError if new email already used; throws TransactionError on unexpected Prisma error.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
 
  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="current = admin.findUnique({id, include: user})" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S2       [label="conflict = user.findUnique({email: data.email})" shape=box];
  throwCE  [label="throw ConflictError" shape=box];
  S3       [label="passwordHash = bcrypt.hash(password, 12)" shape=box];
  S4       [label="passwordHash = undefined" shape=box];
  S5       [label="admin.update({...}); return AdminWithUser" shape=box];
  throwTE  [label="throw TransactionError" shape=box];
  D1       [label="current == null?" shape=diamond];
  D2       [label="data.email defined AND != current.user.email?" shape=diamond];
  D3       [label="conflict != null?" shape=diamond];
  D4       [label="data.password defined?" shape=diamond];
  D5       [label="update throws (not NF/CE)?" shape=diamond];
  mAfterNF    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mAfterEmail [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mAfterPwd   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];
 
  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n       [label="True"];
  D1:e     -> D2:n            [label="False"];
  throwNF:s -> mExit:nw;
  D2:w     -> S2:n            [label="True"];
  D2:e     -> mAfterEmail:ne  [label="False"];
  S2:s     -> D3:n;
  D3:w     -> throwCE:n       [label="True"];
  D3:e     -> mAfterEmail:nw  [label="False"];
  throwCE:s -> mExit:ne;
  mAfterEmail -> D4:n;
  D4:w     -> S3:n            [label="True"];
  D4:e     -> S4:n            [label="False"];
  S3:s     -> mAfterPwd:nw;
  S4:s     -> mAfterPwd:ne;
  mAfterPwd -> S5:n;
  S5:s     -> D5:n;
  D5:e     -> mExit:n         [label="False"];
  D5:w     -> throwTE:n       [label="True"];
  throwTE:s -> mExit:n;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {',
        '    const current = await this.database.admin.findUnique({ where: {id: adminId}, include: {user: true} });',
        '    if (!current) {',
        '        throw new NotFoundError(`Admin not found: ${adminId}`);',
        '    }',
        '    if (data.email && data.email !== current.user.email) {',
        '        const conflict = await this.database.user.findUnique({ where: {email: data.email} });',
        '        if (conflict) {',
        '            throw new ConflictError(`Email already in use: ${data.email}`);',
        '        }',
        '    }',
        '    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;',
        '    try {',
        '        return await this.database.admin.update({ ... });',
        '    } catch (error) {',
        '        if (error instanceof NotFoundError || error instanceof ConflictError) { throw error; }',
        '        throw new TransactionError(`Failed to update admin: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 6, cc2EdgeNodePlus2: 6, cc3PredicatePlus1: 6 },
    predicates: [
        'current == null (D1)',
        'data.email defined AND != current.user.email (D2)',
        'conflict != null (D3)',
        'data.password defined (D4)',
        'update throws (not NF/CE) (D5)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '2', description: 'start -> S1 -> D1(T) -> throwNF -> mExit -> exit' },
        { id: '3', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '4', description: 'start -> S1 -> D1(F) -> D2(T) -> S2 -> D3(T) -> throwCE -> mExit -> exit' },
        { id: '5', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(T) -> S3 -> mAfterPwd -> S5 -> D5(F) -> mExit -> exit' },
        { id: '6', description: 'start -> S1 -> D1(F) -> D2(F) -> mAfterEmail -> D4(F) -> S4 -> mAfterPwd -> S5 -> D5(T) -> throwTE -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'adminId=ADMIN_ID, data={fullName: "New Name"} (no email, no password), findUnique returns MOCK_ADMIN_WITH_USER, admin.update resolves',
            expected: 'returns updated AdminWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'adminId=NONEXISTENT_ID, admin.findUnique returns null',
            expected: 'throws NotFoundError("Admin not found: ...")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'adminId=ADMIN_ID, data={email: "new@email.com"} (different email, no conflict), findUnique(admin) returns MOCK_ADMIN_WITH_USER, findUnique(user) returns null, admin.update resolves',
            expected: 'returns updated AdminWithUser',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, true, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'adminId=ADMIN_ID, data={email: "taken@email.com"} (different email, conflict found), findUnique(admin) returns MOCK_ADMIN_WITH_USER, findUnique(user) returns MOCK_USER',
            expected: 'throws ConflictError("Email already in use: ...")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false],
        },
        {
            noTc: '5',
            inputData: 'adminId=ADMIN_ID, data={password: "newPass123"} (no email change), findUnique returns MOCK_ADMIN_WITH_USER, admin.update resolves',
            expected: 'returns updated AdminWithUser with hashed password',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, true, false],
        },
        {
            noTc: '6',
            inputData: 'adminId=ADMIN_ID, data={fullName: "Name"}, findUnique returns MOCK_ADMIN_WITH_USER, admin.update rejects with Error("db error")',
            expected: 'throws TransactionError("Failed to update admin: db error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) D2 is a compound condition: data.email && data.email !== current.user.email. For MCC, both sub-conditions must be independently exercised. TC1/TC2/TC5/TC6 cover D2=False (data.email absent); TC3/TC4 cover D2=True (email present and different). The sub-condition data.email === current.user.email (same email, skip check) is an additional False branch of D2 not required for the basis set but is documented for completeness.',
        '2) D5 models the catch block re-throw guard. The catch re-throws NotFoundError/ConflictError unchanged; only unexpected errors produce TransactionError. TC6 covers D5=True (unexpected Prisma error). The sub-path where the catch re-throws a NotFoundError or ConflictError is an impossible path in practice (member.update cannot throw NotFoundError/ConflictError on its own given our preconditions), so no separate TC is added.',
        '3) statementCoverage: TC1 first reaches S4 (passwordHash=undefined) and the happy-path return; TC2 first reaches throwNF; TC3 first reaches S2 (conflict check) and D3=False; TC4 first reaches throwCE; TC5 first reaches S3 (bcrypt.hash); TC6 first reaches throwTE.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-18 · UserRepository.delete
// ─────────────────────────────────────────────────────────────────────────────

const userRepositoryDeleteWbt: WbtDescriptor = {
    reqId: 'REPO-18',
    statement: 'UserRepository.delete(id) - deletes a user by resolving their profile via member or admin lookup, throwing if neither exists.',
    data: 'Input: id: string',
    precondition: 'A string id is provided (may be a memberId or adminId).',
    results: 'Output: Promise<void> | throws NotFoundError',
    postcondition: 'Deletes the user record and resolves void; throws NotFoundError if no member or admin profile is found for the given id.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="memberProfile = member.findUnique({id})" shape=box];
  S2       [label="adminProfile = admin.findUnique({id})" shape=box];
  sPMember [label="profile = memberProfile" shape=box];
  sPAdmin  [label="profile = adminProfile" shape=box];
  throwNF  [label="throw NotFoundError" shape=box];
  S4       [label="user.delete({id: profile.userId})" shape=box];
  D1       [label="memberProfile != null?" shape=diamond];
  D2       [label="profile == null?" shape=diamond];
  mProfile [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start      -> S1:n;
  S1:s       -> D1:n;
  D1:w       -> sPMember:n   [label="True"];
  D1:e       -> S2:n         [label="False"];
  S2:s       -> sPAdmin:n;
  sPMember:s -> mProfile:nw;
  sPAdmin:s  -> mProfile:ne;
  mProfile   -> D2:n;
  D2:w       -> throwNF:n    [label="True"];
  D2:e       -> S4:n         [label="False"];
  throwNF:s  -> mExit:nw;
  S4:s       -> mExit:ne;
  mExit      -> exit;
}`,
    cfgSourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const profile = await this.database.member.findUnique({where: {id}})',
        '        ?? await this.database.admin.findUnique({where: {id}});',
        '    if (!profile) {',
        '        throw new NotFoundError(`Member or admin not found: ${id}`);',
        '    }',
        '    await this.database.user.delete({where: {id: profile.userId}});',
        '}',
    ],
    cyclomaticComplexity: { cc1Regions: 3, cc2EdgeNodePlus2: 3, cc3PredicatePlus1: 3 },
    predicates: [
        'memberProfile != null (D1)',
        'profile == null (D2)',
    ],
    paths: [
        { id: '1', description: 'start -> S1 -> D1(T) -> sPMember -> mProfile -> D2(F) -> S4 -> mExit -> exit  (member found, delete)' },
        { id: '2', description: 'start -> S1 -> D1(F) -> S2 -> sPAdmin -> mProfile -> D2(F) -> S4 -> mExit -> exit  (admin found, delete)' },
        { id: '3', description: 'start -> S1 -> D1(F) -> S2 -> sPAdmin -> mProfile -> D2(T) -> throwNF -> mExit -> exit  (neither found)' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=MEMBER_ID, member.findUnique returns MOCK_MEMBER (userId=USER_ID), user.delete resolves',
            expected: 'resolves void; user.delete called with {id: USER_ID}',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=ADMIN_ID, member.findUnique returns null, admin.findUnique returns MOCK_ADMIN (userId=USER_ID), user.delete resolves',
            expected: 'resolves void; user.delete called with {id: USER_ID}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '3',
            inputData: 'id=NONEXISTENT_ID, member.findUnique returns null, admin.findUnique returns null',
            expected: 'throws NotFoundError("Member or admin not found: ...")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false]],
            pathCoverage: [false, false, true],
        },
    ],
    remarks: [
        '1) The ?? (nullish coalescing) is modelled explicitly: D1 (memberProfile != null?) branches to sPMember (profile = memberProfile) on True and to S2+sPAdmin (profile = adminProfile) on False. This avoids a statement node containing a hidden conditional and makes the assignment unconditional in each branch. No new predicate is introduced, so CC remains 3.',
        '2) statementCoverage: TC1 is the first to reach sPMember and S4; TC2 is the first to execute S2 and sPAdmin; TC3 is the first to reach throwNF.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};


// ─────────────────────────────────────────────────────────────────────────────
// REPO-19 · WorkoutSessionRepository.create
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryCreateWbt: WbtDescriptor = {
    reqId: 'REPO-19',
    statement: 'WorkoutSessionRepository.create(data, exercises) - creates a new workout session with its exercises atomically, guarding against empty exercise list and missing member.',
    data: 'Input: CreateWorkoutSessionInput, WorkoutSessionExerciseInput[]',
    precondition: 'A valid CreateWorkoutSessionInput and a non-empty exercises array are provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises> | throws WorkoutSessionRequiresExercisesError | throws NotFoundError | throws TransactionError',
    postcondition: 'Returns the created WorkoutSessionWithExercises if exercises are provided and member exists; throws WorkoutSessionRequiresExercisesError if exercises is empty; throws NotFoundError if member not found; throws TransactionError if Prisma create fails.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start      [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit       [label="" shape=circle width=0.25 style=filled fillcolor=black];
  D1         [label="exercises.length === 0?" shape=diamond];
  throwWSRE  [label="throw WorkoutSessionRequiresExercisesError" shape=box];
  S1         [label="member = member.findUnique({id: data.memberId})" shape=box];
  D2         [label="member != null?" shape=diamond];
  throwNF    [label="throw NotFoundError" shape=box];
  S2         [label="workoutSession.create({data, exercises, include})" shape=box];
  D3         [label="create throws?" shape=diamond];
  retOk      [label="return session" shape=box];
  throwTE    [label="throw TransactionError" shape=box];
  mExit      [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start     -> D1:n;
  D1:w      -> throwWSRE:n  [label="True"];
  D1:e      -> S1:n         [label="False"];
  S1:s      -> D2:n;
  D2:w      -> throwNF:n    [label="True"];
  D2:e      -> S2:n         [label="False"];
  S2:s      -> D3:n;
  D3:w      -> throwTE:n    [label="True"];
  D3:e      -> retOk:n      [label="False"];
  retOk:s   -> mExit:nw;
  throwWSRE:s -> mExit:ne;
  throwNF:s -> mExit:n;
  throwTE:s -> mExit;
  mExit     -> exit;
}`,
    cfgSourceCode: [
        'async create(data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]): Promise<WorkoutSessionWithExercises> {',
        '    if (exercises.length === 0) {',
        '        throw new WorkoutSessionRequiresExercisesError(\'A workout session must include at least one exercise.\');',
        '    }',
        '    const member = await this.database.member.findUnique({where: {id: data.memberId}});',
        '    if (!member) {',
        '        throw new NotFoundError(`Member not found: ${data.memberId}`);',
        '    }',
        '    try {',
        '        return await this.database.workoutSession.create({data: {...}, include: {exercises: {...}}});',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to create workout session: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4},
    predicates: [
        'exercises.length === 0 (D1)',
        '!member (D2)',
        'create throws (D3)',
    ],
    paths: [
        {id: '1', description: 'start → D1(F) → S1 → D2(F) → S2 → D3(F) → retOk → mExit → exit'},
        {id: '2', description: 'start → D1(T) → throwWSRE → mExit → exit'},
        {id: '3', description: 'start → D1(F) → S1 → D2(T) → throwNF → mExit → exit'},
        {id: '4', description: 'start → D1(F) → S1 → D2(F) → S2 → D3(T) → throwTE → mExit → exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_SESSION_INPUT, exercises=[EXERCISE_INPUT], member.findUnique resolves MOCK_MEMBER, workoutSession.create resolves MOCK_SESSION_WITH_EXERCISES',
            expected: 'returns WorkoutSessionWithExercises',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'data=CREATE_SESSION_INPUT, exercises=[]',
            expected: 'throws WorkoutSessionRequiresExercisesError',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false],
        },
        {
            noTc: '3',
            inputData: 'data=CREATE_SESSION_INPUT, exercises=[EXERCISE_INPUT], member.findUnique returns null',
            expected: 'throws NotFoundError("Member not found: ...")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, false]],
            pathCoverage: [false, false, true, false],
        },
        {
            noTc: '4',
            inputData: 'data=CREATE_SESSION_INPUT, exercises=[EXERCISE_INPUT], member.findUnique resolves MOCK_MEMBER, workoutSession.create rejects with Error("db error")',
            expected: 'throws TransactionError("Failed to create workout session: db error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [true, false]],
            pathCoverage: [false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for all four TCs: TC1 is the first to reach return session; TC2 is the first to reach throw WorkoutSessionRequiresExercisesError; TC3 is the first to reach throw NotFoundError; TC4 is the first to reach throw TransactionError.',
        '2) D3 ("create throws?") models the try/catch boundary — True when workoutSession.create() rejects, False when it resolves.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-20 · WorkoutSessionRepository.findById
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryFindByIdWbt: WbtDescriptor = {
    reqId: 'REPO-20',
    statement: 'WorkoutSessionRepository.findById(id) - fetches a workout session with all exercises by id, throwing if absent.',
    data: 'Input: string',
    precondition: 'A string id is provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises> | throws NotFoundError',
    postcondition: 'Returns the WorkoutSessionWithExercises if found; throws NotFoundError otherwise.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="session = workoutSession.findUnique({id, include})" shape=box];
  D1       [label="session != null?" shape=diamond];
  throwNF  [label="throw NotFoundError" shape=box];
  retOk    [label="return session" shape=box];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> retOk:n   [label="False"];
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async findById(id: string): Promise<WorkoutSessionWithExercises> {',
        '    const session = await this.database.workoutSession.findUnique({',
        '        where: {id},',
        '        include: {exercises: {include: {exercise: true}}},',
        '    });',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '    return session;',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: [
        '!session (D1)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → retOk → mExit → exit'},
        {id: '2', description: 'start → S1 → D1(T) → throwNF → mExit → exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=SESSION_ID, workoutSession.findUnique returns MOCK_SESSION_WITH_EXERCISES',
            expected: 'returns MOCK_SESSION_WITH_EXERCISES',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, workoutSession.findUnique returns null',
            expected: 'throws NotFoundError("Workout session not found: nonexistent-id")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach return session; TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-21 · WorkoutSessionRepository.findAll
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryFindAllWbt: WbtDescriptor = {
    reqId: 'REPO-21',
    statement: 'WorkoutSessionRepository.findAll(options) - returns a filtered, optionally paginated list of workout sessions.',
    data: 'Input: WorkoutSessionListOptions (optional)',
    precondition: 'options is an optional object; undefined fields default to undefined/omitted.',
    results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
    postcondition: 'Returns PageResult with items and total matching the applied where clause; pagination and ordering depend on page/pageSize presence.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];

  S1     [label="destructure {memberId, startDate, endDate, page, pageSize}" shape=box];
  D1     [label="page !== undefined?" shape=diamond];
  S2a    [label="safePage = Math.max(1, page)" shape=box];
  S2b    [label="safePage = page (= undefined)" shape=box];
  m1     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S3     [label="paginated = safePage !== undefined && pageSize !== undefined" shape=box];
  D2     [label="memberId !== undefined?" shape=diamond];
  S4a    [label="memberId filter = {memberId}" shape=box];
  S4b    [label="memberId filter = {}" shape=box];
  m2     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D3     [label="startDate !== undefined || endDate !== undefined?" shape=diamond];
  S5a    [label="date filter = {gte: startDate, lte: endDate}" shape=box];
  S5b    [label="date filter = {}" shape=box];
  m3     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S6     [label="where = {...memberId filter, ...date filter}" shape=box];
  D4     [label="paginated !== undefined?" shape=diamond];
  S7a    [label="params = {skip, take: pageSize}, orderBy = desc" shape=box];
  S7b    [label="params = {}, orderBy = asc" shape=box];
  m4     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S8     [label="[items, total] = $transaction([findMany({where,...}), count({where})])" shape=box];
  retOk  [label="return {items, total}" shape=box];

  start -> S1:n;
  S1:s  -> D1:n;
  D1:w  -> S2a:n  [label="True"];
  D1:e  -> S2b:n  [label="False"];
  S2a:s -> m1:nw;
  S2b:s -> m1:ne;
  m1    -> S3:n;
  S3:s  -> D2:n;
  D2:w  -> S4a:n  [label="True"];
  D2:e  -> S4b:n  [label="False"];
  S4a:s -> m2:nw;
  S4b:s -> m2:ne;
  m2    -> D3:n;
  D3:w  -> S5a:n  [label="True"];
  D3:e  -> S5b:n  [label="False"];
  S5a:s -> m3:nw;
  S5b:s -> m3:ne;
  m3    -> S6:n;
  S6:s  -> D4:n;
  D4:w  -> S7a:n  [label="True"];
  D4:e  -> S7b:n  [label="False"];
  S7a:s -> m4:nw;
  S7b:s -> m4:ne;
  m4    -> S8:n;
  S8:s  -> retOk:n;
  retOk:s -> exit;
}`,
    cfgSourceCode: [
        'async findAll(options: WorkoutSessionListOptions = {}): Promise<PageResult<WorkoutSessionWithExercises>> {',
        '    const {memberId, startDate, endDate, page, pageSize} = options;',
        '    const safePage = page !== undefined ? Math.max(1, page) : page;',
        '    const paginated = safePage !== undefined && pageSize !== undefined;',
        '    const where = {',
        '        ...(memberId ? {memberId} : {}),',
        '        ...(startDate || endDate ? {date: {gte: startDate, lte: endDate}} : {}),',
        '    };',
        '    const [items, total] = await this.database.$transaction([',
        '        this.database.workoutSession.findMany({where, include: {...},',
        '            ...(paginated ? {skip: (safePage! - 1) * pageSize!, take: pageSize} : {}),',
        '            orderBy: {date: paginated ? \'desc\' : \'asc\'}}),',
        '        this.database.workoutSession.count({where}),',
        '    ]);',
        '    return {items, total};',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 5, cc2EdgeNodePlus2: 5, cc3PredicatePlus1: 5},
    predicates: [
        'page !== undefined (D1)',
        'memberId truthy (D2)',
        'startDate || endDate truthy (D3)',
        'paginated (D4)',
    ],
    paths: [
        {id: '1',  description: 'start→S1→D1(F)→S2b→m1→S3→D2(F)→S4b→m2→D3(F)→S5b→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [no page, no memberId, no dates, unpaginated asc]'},
        {id: '2',  description: 'start→S1→D1(T)→S2a→m1→S3→D2(F)→S4b→m2→D3(F)→S5b→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [page only, pageSize absent → paginated=false]'},
        {id: '3',  description: 'start→S1→D1(F)→S2b→m1→S3→D2(T)→S4a→m2→D3(F)→S5b→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [memberId only]'},
        {id: '4',  description: 'start→S1→D1(F)→S2b→m1→S3→D2(F)→S4b→m2→D3(T)→S5a→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [startDate only]'},
        {id: '5',  description: 'start→S1→D1(T)→S2a→m1→S3→D2(F)→S4b→m2→D3(F)→S5b→m3→S6→D4(T)→S7a→m4→S8→retOk→exit  [page+pageSize → paginated desc]'},
        {id: '6',  description: 'start→S1→D1(F)→S2b→m1→S3→D2(T)→S4a→m2→D3(T)→S5a→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [memberId+startDate+endDate, no pagination — D3 TT MCC]'},
        {id: '7',  description: 'start→S1→D1(T)→S2a→m1→S3→D2(T)→S4a→m2→D3(F)→S5b→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [page+memberId, unpaginated]'},
        {id: '8',  description: 'start→S1→D1(T)→S2a→m1→S3→D2(F)→S4b→m2→D3(T)→S5a→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [page+startDate, unpaginated]'},
        {id: '9',  description: 'start→S1→D1(T)→S2a→m1→S3→D2(T)→S4a→m2→D3(T)→S5a→m3→S6→D4(F)→S7b→m4→S8→retOk→exit  [page+memberId+startDate, unpaginated]'},
        {id: '10', description: 'start→S1→D1(T)→S2a→m1→S3→D2(T)→S4a→m2→D3(F)→S5b→m3→S6→D4(T)→S7a→m4→S8→retOk→exit  [page+pageSize+memberId, paginated]'},
        {id: '11', description: 'start→S1→D1(T)→S2a→m1→S3→D2(F)→S4b→m2→D3(T)→S5a→m3→S6→D4(T)→S7a→m4→S8→retOk→exit  [page+pageSize+startDate, paginated]'},
        {id: '12', description: 'start→S1→D1(T)→S2a→m1→S3→D2(T)→S4a→m2→D3(T)→S5a→m3→S6→D4(T)→S7a→m4→S8→retOk→exit  [page+pageSize+memberId+startDate+endDate, paginated — D3 TT MCC]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options={} — no page, no memberId, no dates',
            expected: 'returns PageResult; orderBy=asc, no pagination params',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'options={page:1} — page defined, pageSize absent',
            expected: 'returns PageResult; safePage=1 but paginated=false, orderBy=asc',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true], [false, true], [false, true]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'options={memberId:MEMBER_ID}',
            expected: 'returns PageResult; where={memberId:MEMBER_ID}',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, true]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'options={startDate: new Date("2024-01-01")} — startDate only',
            expected: 'returns PageResult; where={date:{gte:startDate, lte:undefined}}',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'options={page:1, pageSize:10} — both page and pageSize',
            expected: 'returns PageResult; paginated=true, skip=0, take=10, orderBy=desc',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'options={endDate: new Date("2024-01-31")} — endDate only (D3 FT for || MCC)',
            expected: 'returns PageResult; where={date:{gte:undefined, lte:endDate}}',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'options={pageSize:10} — pageSize without page (D4 FT for && MCC)',
            expected: 'returns PageResult; safePage=undefined → paginated=false, orderBy=asc',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'options={memberId:MEMBER_ID, startDate: new Date("2024-01-01"), endDate: new Date("2024-01-31")} — memberId+both dates (D3 TT for || MCC)',
            expected: 'returns PageResult; where includes memberId and date range filter',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '9',
            inputData: 'options={page:1, memberId:MEMBER_ID}',
            expected: 'returns PageResult; where={memberId}, safePage=1, paginated=false, orderBy=asc',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '10',
            inputData: 'options={page:1, startDate: new Date("2024-01-01")}',
            expected: 'returns PageResult; where={date filter}, safePage=1, paginated=false, orderBy=asc',
            statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '11',
            inputData: 'options={page:1, memberId:MEMBER_ID, startDate: new Date("2024-01-01")}',
            expected: 'returns PageResult; where includes memberId and date range, paginated=false',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '12',
            inputData: 'options={page:1, pageSize:10, memberId:MEMBER_ID}',
            expected: 'returns PageResult; where={memberId}, paginated=true, skip=0, take=10, orderBy=desc',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '13',
            inputData: 'options={page:1, pageSize:10, startDate: new Date("2024-01-01")}',
            expected: 'returns PageResult; where={date filter}, paginated=true, skip=0, take=10, orderBy=desc',
            statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '14',
            inputData: 'options={page:1, pageSize:10, memberId:MEMBER_ID, startDate: new Date("2024-01-01"), endDate: new Date("2024-01-31")}',
            expected: 'returns PageResult; all filters active, paginated=true, orderBy=desc',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1–TC5: TC1 first executes S2b, S4b, S5b, S7b, S8, retOk; TC2 first executes S2a; TC3 first executes S4a; TC4 first executes S5a; TC5 first executes S7a. TC6–TC14 re-execute already-covered statements and add no new SC.',
        '2) D3 is a compound condition (startDate || endDate). For full MCC of || all four sub-condition combinations are needed: FF → TC1; TF (startDate only) → TC4; FT (endDate only) → TC6; TT (both) → TC8 (P6). TC6 and TC8 are extra MCC TCs beyond the basis set.',
        '3) D4 (paginated = safePage !== undefined && pageSize !== undefined) is a compound condition with &&. D1=False forces safePage=undefined which forces paginated=False (D4=False). D4=True is only reachable when D1=True. MCC combinations: TT → TC5; TF (page, no pageSize) → TC2; FT (pageSize, no page) → TC7; FF → TC1/TC3/TC4/TC6/TC8.',
        '4) TCs 8–14 cover paths P6–P12, the remaining D1×D2×D3×D4 truth-value combinations not exercised by the basis-set paths P1–P5. P1–P5 form the cyclomatic-complexity basis set (CC=5) and achieve full edge coverage; P6–P12 are required for full MCC cross-combination coverage across all four independent predicates.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-22 · WorkoutSessionRepository.update
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryUpdateWbt: WbtDescriptor = {
    reqId: 'REPO-22',
    statement: 'WorkoutSessionRepository.update(id, data) - updates session metadata (date, duration, notes), throwing if the session is not found.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput',
    precondition: 'A valid id string and UpdateWorkoutSessionInput are provided.',
    results: 'Output: Promise<WorkoutSession> | throws NotFoundError',
    postcondition: 'Returns the updated WorkoutSession; throws NotFoundError if no session with the given id exists.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="session = workoutSession.findUnique({id})" shape=box];
  D1       [label="session != null?" shape=diamond];
  throwNF  [label="throw NotFoundError" shape=box];
  D2       [label="data.date !== undefined" shape=diamond];
  S2a      [label="date field = {date: new Date(data.date)}" shape=box];
  S2b      [label="date field = {}" shape=box];
  m1       [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D3       [label="data.duration !== undefined?" shape=diamond];
  S3a      [label="duration field = {duration: data.duration}" shape=box];
  S3b      [label="duration field = {}" shape=box];
  m2       [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D4       [label="data.notes !== undefined?" shape=diamond];
  S4a      [label="notes field = {notes: data.notes}" shape=box];
  S4b      [label="notes field = {}" shape=box];
  m3       [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S5       [label="workoutSession.update({where:{id}, data:{...fields}})" shape=box];
  retOk    [label="return session" shape=box];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> D2:n      [label="False"];
  D2:w     -> S2a:n     [label="True"];
  D2:e     -> S2b:n     [label="False"];
  S2a:s    -> m1:nw;
  S2b:s    -> m1:ne;
  m1       -> D3:n;
  D3:w     -> S3a:n     [label="True"];
  D3:e     -> S3b:n     [label="False"];
  S3a:s    -> m2:nw;
  S3b:s    -> m2:ne;
  m2       -> D4:n;
  D4:w     -> S4a:n     [label="True"];
  D4:e     -> S4b:n     [label="False"];
  S4a:s    -> m3:nw;
  S4b:s    -> m3:ne;
  m3       -> S5:n;
  S5:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async update(id: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession> {',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
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
    cyclomaticComplexity: {cc1Regions: 5, cc2EdgeNodePlus2: 5, cc3PredicatePlus1: 5},
    predicates: [
        '!session (D1)',
        'data.date truthy (D2)',
        'data.duration !== undefined (D3)',
        'data.notes !== undefined (D4)',
    ],
    paths: [
        {id: '1', description: 'start→S1→D1(F)→D2(F)→S2b→m1→D3(F)→S3b→m2→D4(F)→S4b→m3→S5→retOk→mExit→exit  [session found, no data fields]'},
        {id: '2', description: 'start→S1→D1(T)→throwNF→mExit→exit  [session not found]'},
        {id: '3', description: 'start→S1→D1(F)→D2(T)→S2a→m1→D3(F)→S3b→m2→D4(F)→S4b→m3→S5→retOk→mExit→exit  [date only]'},
        {id: '4', description: 'start→S1→D1(F)→D2(F)→S2b→m1→D3(T)→S3a→m2→D4(F)→S4b→m3→S5→retOk→mExit→exit  [duration only]'},
        {id: '5', description: 'start→S1→D1(F)→D2(F)→S2b→m1→D3(F)→S3b→m2→D4(T)→S4a→m3→S5→retOk→mExit→exit  [notes only]'},
        {id: '6', description: 'start→S1→D1(F)→D2(T)→S2a→m1→D3(T)→S3a→m2→D4(F)→S4b→m3→S5→retOk→mExit→exit  [date+duration]'},
        {id: '7', description: 'start→S1→D1(F)→D2(T)→S2a→m1→D3(F)→S3b→m2→D4(T)→S4a→m3→S5→retOk→mExit→exit  [date+notes]'},
        {id: '8', description: 'start→S1→D1(F)→D2(F)→S2b→m1→D3(T)→S3a→m2→D4(T)→S4a→m3→S5→retOk→mExit→exit  [duration+notes]'},
        {id: '9', description: 'start→S1→D1(F)→D2(T)→S2a→m1→D3(T)→S3a→m2→D4(T)→S4a→m3→S5→retOk→mExit→exit  [all three fields]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=SESSION_ID, data={}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with empty data update',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, data={}, workoutSession.findUnique returns null',
            expected: 'throws NotFoundError("Workout session not found: nonexistent-id")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'id=SESSION_ID, data={date:"2024-02-01"}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated date',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, true], [false, true]],
            pathCoverage: [false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'id=SESSION_ID, data={duration:90}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated duration',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'id=SESSION_ID, data={notes:"Updated notes"}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated notes',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'id=SESSION_ID, data={date:"2024-02-01", duration:90}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated date and duration',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'id=SESSION_ID, data={date:"2024-02-01", notes:"Updated notes"}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated date and notes',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '8',
            inputData: 'id=SESSION_ID, data={duration:90, notes:"Updated notes"}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with updated duration and notes',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '9',
            inputData: 'id=SESSION_ID, data={date:"2024-02-01", duration:90, notes:"Updated notes"}, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'returns session with all fields updated',
            statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1–TC5: TC1 covers S2b/S3b/S4b/S5/retOk; TC2 covers throwNF; TC3 covers S2a; TC4 covers S3a; TC5 covers S4a. TC6–TC9 re-execute already-covered statements and add no new SC.',
        '2) D2, D3, D4 each have a single condition, so T + F per decision satisfies MCC per decision. TCs 1–5 provide the basis-set edge coverage (CC=5). TCs 6–9 cover the four remaining D2×D3×D4 cross-combinations (D2T+D3T, D2T+D4T, D3T+D4T, all-three) required for full combination coverage across independent predicates.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-23 · WorkoutSessionRepository.updateWithExercises
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryUpdateWithExercisesWbt: WbtDescriptor = {
    reqId: 'REPO-23',
    statement: 'WorkoutSessionRepository.updateWithExercises(id, data, exercises) - atomically replaces all exercise entries and updates session metadata inside a transaction.',
    data: 'Input: id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'A valid id, UpdateWorkoutSessionInput, and non-empty exercises array are provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises> | throws WorkoutSessionRequiresExercisesError | throws NotFoundError | throws TransactionError',
    postcondition: 'Returns the updated session with exercises if successful; throws WorkoutSessionRequiresExercisesError if exercises is empty; throws NotFoundError if session absent; throws TransactionError if the transaction fails.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start      [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit       [label="" shape=circle width=0.25 style=filled fillcolor=black];
  D1         [label="exercises.length === 0?" shape=diamond];
  throwWSRE  [label="throw WorkoutSessionRequiresExercisesError" shape=box];
  S1         [label="session = workoutSession.findUnique({id})" shape=box];
  D2         [label="session == null?" shape=diamond];
  throwNF    [label="throw NotFoundError" shape=box];
  S2         [label="existingIds = workoutSessionExercise.findMany({...}).map(e=>e.id)" shape=box];
  S3         [label="keptIds = exercises.filter(e=>e.id).map(e=>e.id!)" shape=box];
  S4         [label="toDeleteIds = existingIds.filter(eid=>!keptIds.includes(eid))" shape=box];
  D3         [label="toDeleteIds.length > 0?" shape=diamond];
  S5         [label="workoutSessionExercise.deleteMany({where:{id:{in:toDeleteIds}}})" shape=box];
  m1         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S_loopInit [label="filtered = exercises.filter(e=>e.id); i = 0" shape=box];
  LD         [label="i < filtered.length?" shape=diamond];
  S6         [label="workoutSessionExercise.update({where:{id:e.id}, data:{...}})" shape=box];
  S_inc      [label="i++" shape=box];
  D4         [label="newExercises.length > 0?" shape=diamond];
  S7         [label="workoutSessionExercise.createMany({data: newExercises})" shape=box];
  m2         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D5         [label="data.date !== undefined" shape=diamond];
  S8a        [label="date field = {date: new Date(data.date)}" shape=box];
  S8b        [label="date field = {}" shape=box];
  m3         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D6         [label="data.duration !== undefined?" shape=diamond];
  S9a        [label="duration field = {duration: data.duration}" shape=box];
  S9b        [label="duration field = {}" shape=box];
  m4         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D7         [label="data.notes !== undefined?" shape=diamond];
  S10a       [label="notes field = {notes: data.notes}" shape=box];
  S10b       [label="notes field = {}" shape=box];
  m5         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S11        [label="workoutSession.update({where:{id}, data:{...fields}, include:{...}})" shape=box];
  D8         [label="transaction throws?" shape=diamond];
  retOk      [label="return session with exercises" shape=box];
  throwTE    [label="throw TransactionError" shape=box];
  mExit      [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start     -> D1:n;
  D1:w      -> throwWSRE:n   [label="True"];
  D1:e      -> S1:n          [label="False"];
  S1:s      -> D2:n;
  D2:w      -> throwNF:n     [label="True"];
  D2:e      -> S2:n          [label="False"];
  S2:s      -> S3:n;
  S3:s      -> S4:n;
  S4:s      -> D3:n;
  D3:w      -> S5:n          [label="True"];
  D3:e      -> m1:ne         [label="False"];
  S5:s      -> m1:nw;
  m1        -> S_loopInit:n;
  S_loopInit:s -> LD:n;
  LD:w      -> S6:n          [label="True"];
  S6:s      -> S_inc:n;
  S_inc:w   -> LD:n          [constraint=false];
  LD:e      -> D4:n          [label="False"];
  D4:w      -> S7:n          [label="True"];
  D4:e      -> m2:ne         [label="False"];
  S7:s      -> m2:nw;
  m2        -> D5:n;
  D5:w      -> S8a:n         [label="True"];
  D5:e      -> S8b:n         [label="False"];
  S8a:s     -> m3:nw;
  S8b:s     -> m3:ne;
  m3        -> D6:n;
  D6:w      -> S9a:n         [label="True"];
  D6:e      -> S9b:n         [label="False"];
  S9a:s     -> m4:nw;
  S9b:s     -> m4:ne;
  m4        -> D7:n;
  D7:w      -> S10a:n        [label="True"];
  D7:e      -> S10b:n        [label="False"];
  S10a:s    -> m5:nw;
  S10b:s    -> m5:ne;
  m5        -> S11:n;
  S11:s     -> D8:n;
  D8:e      -> retOk:n       [label="False"];
  D8:w      -> throwTE:n     [label="True"];
  retOk:s   -> mExit:nw;
  throwWSRE:s -> mExit:ne;
  throwNF:s -> mExit:n;
  throwTE:s -> mExit;
  mExit     -> exit;
}`,
    cfgSourceCode: [
        'async updateWithExercises(id: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]): Promise<WorkoutSessionWithExercises> {',
        '    if (exercises.length === 0) {',
        '        throw new WorkoutSessionRequiresExercisesError(\'A workout session must include at least one exercise.\');',
        '    }',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '    try {',
        '        return await this.database.$transaction(async (tx) => {',
        '            const existingIds = (await tx.workoutSessionExercise.findMany({where: {workoutSessionId: id}, select: {id: true}})).map((e) => e.id);',
        '            const keptIds = exercises.filter((e) => e.id).map((e) => e.id!);',
        '            const toDeleteIds = existingIds.filter((eid) => !keptIds.includes(eid));',
        '            if (toDeleteIds.length > 0) {',
        '                await tx.workoutSessionExercise.deleteMany({where: {id: {in: toDeleteIds}}});',
        '            }',
        '            for (const e of exercises.filter((e) => e.id)) {',
        '                await tx.workoutSessionExercise.update({where: {id: e.id}, data: {...}});',
        '            }',
        '            const newExercises = exercises.filter((e) => !e.id);',
        '            if (newExercises.length > 0) {',
        '                await tx.workoutSessionExercise.createMany({data: newExercises.map(...)});',
        '            }',
        '            return tx.workoutSession.update({where: {id}, data: {...fields}, include: {...}});',
        '        });',
        '    } catch (error) {',
        '        throw new TransactionError(`Failed to update workout session: ${(error as Error).message}`);',
        '    }',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 10, cc2EdgeNodePlus2: 10, cc3PredicatePlus1: 10},
    predicates: [
        'exercises.length === 0 (D1)',
        'session == null (D2)',
        'toDeleteIds.length > 0 (D3)',
        'i < filtered.length (LD)',
        'newExercises.length > 0 (D4)',
        'data.date truthy (D5)',
        'data.duration !== undefined (D6)',
        'data.notes !== undefined (D7)',
        'transaction throws (D8)',
    ],
    paths: [
        {id: '1',  description: 'start→D1(F)→S1→D2(F)→S2→S3→S4→D3(F)→m1→S_loopInit→LD(F)→D4(T)→S7→m2→D5(F)→D6(F)→D7(F)→S11→D8(F)→retOk→exit  [all new exercises, no deletions, no data fields]'},
        {id: '2',  description: 'start→D1(T)→throwWSRE→exit  [exercises empty]'},
        {id: '3',  description: 'start→D1(F)→S1→D2(T)→throwNF→exit  [session not found]'},
        {id: '4',  description: 'start→D1(F)→S1→D2(F)→S2→S3→S4→D3(T)→S5→m1→S_loopInit→LD(F)→D4(T)→S7→m2→D5(F)→D6(F)→D7(F)→S11→D8(F)→retOk→exit  [has exercises to delete, all inputs new]'},
        {id: '5',  description: 'start→D1(F)→S1→D2(F)→S2→S3→S4→D3(F)→m1→S_loopInit→LD(T)→S6→S_inc→LD(back)→LD(F)→D4(F)→m2→D5(F)→D6(F)→D7(F)→S11→D8(F)→retOk→exit  [update existing exercises, loop once]'},
        {id: '6',  description: 'start→D1(F)→S1→D2(F)→...→S_loopInit→LD(F)→D4(T)→S7→m2→D5(T)→S8a→...→S11→D8(F)→retOk→exit  [date provided]'},
        {id: '7',  description: 'start→D1(F)→S1→D2(F)→...→S_loopInit→LD(F)→D4(T)→S7→m2→D5(F)→D6(T)→S9a→...→S11→D8(F)→retOk→exit  [duration provided]'},
        {id: '8',  description: 'start→D1(F)→S1→D2(F)→...→S_loopInit→LD(F)→D4(T)→S7→m2→D5(F)→D6(F)→D7(T)→S10a→...→S11→D8(F)→retOk→exit  [notes provided]'},
        {id: '9',  description: 'start→D1(F)→S1→D2(F)→...→S11→D8(T)→throwTE→exit  [transaction throws]'},
        {id: '10', description: 'start→D1(F)→S1→D2(F)→S2→S3→S4→D3(F)→m1→S_loopInit→LD(T)→S6→S_inc→LD(back)→LD(T)→S6→S_inc→LD(back)→LD(F)→D4(F)→m2→...→exit  [loop twice — introduces the cycle back-edge a second time]'},
    ],
    hasLoopCoverage: true,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=SESSION_ID, data={}, exercises=[{no id}], findMany=[], createMany resolves',
            expected: 'returns WorkoutSessionWithExercises',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true], [true, false], [false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false],
            loopCoverage: {no: true},
        },
        {
            noTc: '2',
            inputData: 'exercises=[]',
            expected: 'throws WorkoutSessionRequiresExercisesError',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'id=NONEXISTENT_ID, exercises=[{no id}], findUnique returns null',
            expected: 'throws NotFoundError',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'id=SESSION_ID, data={}, exercises=[{no id}], findMany=[{id:WSE_ID}] (old to delete), createMany resolves',
            expected: 'returns session; deleteMany called once',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [true, false], [false, true], [true, false], [false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'id=SESSION_ID, data={}, exercises=[{id:WSE_ID}], findMany=[{id:WSE_ID}], update resolves (loop once)',
            expected: 'returns session; workoutSessionExercise.update called once',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [true, false], [false, true], [false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false],
            loopCoverage: {once: true},
        },
        {
            noTc: '6',
            inputData: 'id=SESSION_ID, data={date:"2024-02-01"}, exercises=[{no id}]',
            expected: 'returns session; workoutSession.update called with date field',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true], [true, false], [true, false], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'id=SESSION_ID, data={duration:90}, exercises=[{no id}]',
            expected: 'returns session; workoutSession.update called with duration field',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true], [true, false], [false, true], [true, false], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'id=SESSION_ID, data={notes:"Evening workout"}, exercises=[{no id}]',
            expected: 'returns session; workoutSession.update called with notes field',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, true], [false, true], [true, false], [false, true], [false, true], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '9',
            inputData: 'id=SESSION_ID, data={}, exercises=[{no id}], $transaction rejects with Error("tx error")',
            expected: 'throws TransactionError("Failed to update workout session: tx error")',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '10',
            inputData: 'id=SESSION_ID, data={}, exercises=[{id:WSE_ID},{id:wse2}], findMany=[{id:WSE_ID},{id:wse2}], update×2 resolves (loop twice)',
            expected: 'returns session; workoutSessionExercise.update called twice',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [false, true], [true, false], [false, true], [false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true],
            loopCoverage: {twice: true},
        },
        {
            noTc: '11',
            inputData: 'id=SESSION_ID, data={}, exercises=[{id:WSE_ID},{id:wse2},{id:wse3}], findMany=[{id:WSE_ID},{id:wse2},{id:wse3}], update×3 resolves (loop n=3)',
            expected: 'returns session; workoutSessionExercise.update called three times',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true], [false, true], [true, false], [false, true], [false, true], [false, true], [false, true], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false],
            loopCoverage: {n: true},
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1–TC9: each is the first to execute a previously uncovered statement. TC1 covers the all-new-exercises happy path (S2–S4, D4:T branch, S7, m2, D5–D7 False branches, S8b/S9b/S10b, S11, retOk). TC2 covers throwWSRE. TC3 covers throwNF. TC4 covers D3:T branch and S5. TC5 covers the loop body S6 and the LD:T edge. TC6 covers S8a (D5 True branch). TC7 covers S9a (D6 True). TC8 covers S10a (D7 True). TC9 covers throwTE. TC10 re-executes previously covered statements only — statementCoverage is false.',
        '2) D1 and D2 are guards that prevent entering the transaction. D3, LD, D4 are the exercise-management decisions inside the transaction callback. D5–D7 are the data-field ternaries inside the final update call. D8 models the outer try/catch.',
        '3) Loop LD is modeled as an explicit counter loop: S_loopInit initialises filtered=exercises.filter(e=>e.id) and i=0; LD checks i<filtered.length; S6 is the body; S_inc increments i; the back-edge S_inc:w→LD:n exits west per the WBT CFG rule. The loop has no fixed upper bound, so n is chosen as 3 (a representative "typical" value). Coverage variants: "no" (TC1/P1 — filtered is empty), "once" (TC5/P5), "twice" (TC10/P10), "n=3" (TC11). Variants nMinus1=2 and mLessThanN=2 are structurally identical to "twice" and add no new CFG edges; nPlus1 is similarly structural. TC11 is a loop-coverage-only TC and does not cover a new basis path.',
        '4) D9 (transaction throws) is modeled as a single decision wrapping the entire $transaction call: True when $transaction rejects, False when it resolves. TC9 triggers it by mocking $transaction.mockRejectedValue(...).',
        '5) TC9 covers D8=True by mocking $transaction to reject before the callback is invoked, so D3/LD/D4/D5–D7 are not reached — conditionDecision for those predicates is [false,false].',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPO-24 · WorkoutSessionRepository.delete
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionRepositoryDeleteWbt: WbtDescriptor = {
    reqId: 'REPO-24',
    statement: 'WorkoutSessionRepository.delete(id) - permanently deletes a workout session and all its exercises (cascade), throwing if not found.',
    data: 'Input: id: string',
    precondition: 'A valid id string is provided.',
    results: 'Output: Promise<void> | throws NotFoundError',
    postcondition: 'Deletes the session and resolves void; throws NotFoundError if no session with the given id exists.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1       [label="session = workoutSession.findUnique({id})" shape=box];
  D1       [label="session != null?" shape=diamond];
  throwNF  [label="throw NotFoundError" shape=box];
  S2       [label="workoutSession.delete({where:{id}})" shape=box];
  retOk    [label="return void" shape=box];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n [label="True"];
  D1:e     -> S2:n      [label="False"];
  S2:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'async delete(id: string): Promise<void> {',
        '    const session = await this.database.workoutSession.findUnique({where: {id}});',
        '    if (!session) {',
        '        throw new NotFoundError(`Workout session not found: ${id}`);',
        '    }',
        '    await this.database.workoutSession.delete({where: {id}});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: [
        '!session (D1)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S2 → retOk → mExit → exit'},
        {id: '2', description: 'start → S1 → D1(T) → throwNF → mExit → exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=SESSION_ID, workoutSession.findUnique returns MOCK_SESSION',
            expected: 'resolves void; workoutSession.delete called with {where:{id:SESSION_ID}}',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: 'id=NONEXISTENT_ID, workoutSession.findUnique returns null',
            expected: 'throws NotFoundError("Workout session not found: nonexistent-id")',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2: TC1 is the first to reach workoutSession.delete and return void; TC2 is the first to reach throw new NotFoundError(...).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('Generating repository WBT forms…');

    const EXERCISE_REPO = path.join(BASE, 'exercise-repository');
    await writeWbt(exerciseRepositoryCreateWbt,    path.join(EXERCISE_REPO, 'create-wbt-form.xlsx'));
    await writeWbt(exerciseRepositoryFindByIdWbt,  path.join(EXERCISE_REPO, 'findById-wbt-form.xlsx'));
    await writeWbt(exerciseRepositoryFindAllWbt,   path.join(EXERCISE_REPO, 'findAll-wbt-form.xlsx'));
    await writeWbt(exerciseRepositoryUpdateWbt,    path.join(EXERCISE_REPO, 'update-wbt-form.xlsx'));
    await writeWbt(exerciseRepositorySetActiveWbt, path.join(EXERCISE_REPO, 'setActive-wbt-form.xlsx'));
    await writeWbt(exerciseRepositoryDeleteWbt,    path.join(EXERCISE_REPO, 'delete-wbt-form.xlsx'));

    const USER_REPO = path.join(BASE, 'user-repository');
    await writeWbt(userRepositoryCreateMemberWbt,   path.join(USER_REPO, 'createMember-wbt-form.xlsx'));
    await writeWbt(userRepositoryCreateAdminWbt,    path.join(USER_REPO, 'createAdmin-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindByIdWbt,       path.join(USER_REPO, 'findById-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindMemberByIdWbt, path.join(USER_REPO, 'findMemberById-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindAdminByIdWbt,  path.join(USER_REPO, 'findAdminById-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindByEmailWbt,    path.join(USER_REPO, 'findByEmail-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindMembersWbt,    path.join(USER_REPO, 'findMembers-wbt-form.xlsx'));
    await writeWbt(userRepositoryFindAdminsWbt,     path.join(USER_REPO, 'findAdmins-wbt-form.xlsx'));
    await writeWbt(userRepositoryUpdateMemberWbt,   path.join(USER_REPO, 'updateMember-wbt-form.xlsx'));
    await writeWbt(userRepositorySetMemberActiveWbt, path.join(USER_REPO, 'setMemberActive-wbt-form.xlsx'));
    await writeWbt(userRepositoryUpdateAdminWbt,    path.join(USER_REPO, 'updateAdmin-wbt-form.xlsx'));
    await writeWbt(userRepositoryDeleteWbt,         path.join(USER_REPO, 'delete-wbt-form.xlsx'));

    const WORKOUT_SESSION_REPO = path.join(BASE, 'workout-session-repository');
    await writeWbt(workoutSessionRepositoryCreateWbt,              path.join(WORKOUT_SESSION_REPO, 'create-wbt-form.xlsx'));
    await writeWbt(workoutSessionRepositoryFindByIdWbt,            path.join(WORKOUT_SESSION_REPO, 'findById-wbt-form.xlsx'));
    await writeWbt(workoutSessionRepositoryFindAllWbt,             path.join(WORKOUT_SESSION_REPO, 'findAll-wbt-form.xlsx'));
    await writeWbt(workoutSessionRepositoryUpdateWbt,              path.join(WORKOUT_SESSION_REPO, 'update-wbt-form.xlsx'));
    await writeWbt(workoutSessionRepositoryUpdateWithExercisesWbt, path.join(WORKOUT_SESSION_REPO, 'updateWithExercises-wbt-form.xlsx'));
    await writeWbt(workoutSessionRepositoryDeleteWbt,              path.join(WORKOUT_SESSION_REPO, 'delete-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });