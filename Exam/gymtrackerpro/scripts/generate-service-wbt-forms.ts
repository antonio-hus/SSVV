/**
 * generate-service-wbt-forms.ts
 * Run: npm run generate-service-wbt-forms
 *
 * Add one WbtDescriptor per service function under test.
 * See the wbt-gymtrackerpro skill for the complete filling guide.
 */

import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'service', '__tests__', 'wbt');

const authServiceLoginWbt: WbtDescriptor = {
    reqId: 'SERV-01',
    statement: 'AuthService.login(data) — verifies credentials and returns a SessionData object, or throws if the user is not found or the password is wrong.',
    data: 'Input: LoginUserInput { email: string; password: string }',
    precondition: 'A valid LoginUserInput object is provided.',
    results: 'Output: Promise<SessionData> | throws NotFoundError | throws AuthorizationError',
    postcondition: 'Returns SessionData with userId, email, fullName, role, memberId, adminId, isActive when credentials are valid; throws NotFoundError for an unknown email; throws AuthorizationError for a wrong password.',

    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];

  S1      [label="user = findByEmail(data.email)" shape=box];
  S2      [label="passwordMatch = bcrypt.compare(data.password, user.passwordHash)" shape=box];
  S3      [label="build SessionData from user" shape=box];
  retOk   [label="return sessionData" shape=box];
  throwNF [label="throw NotFoundError" shape=box];
  throwAE [label="throw AuthorizationError" shape=box];

  D1      [label="user == null?" shape=diamond];
  D2      [label="passwordMatch == false?" shape=diamond];

  mExit   [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> S1:n;
  S1:s     -> D1:n;
  D1:w     -> throwNF:n  [label="True"];
  D1:e     -> S2:n       [label="False"];
  S2:s     -> D2:n;
  D2:w     -> throwAE:n  [label="True"];
  D2:e     -> S3:n       [label="False"];
  S3:s     -> retOk:n;
  retOk:s  -> mExit:nw;
  throwNF:s -> mExit:ne;
  throwAE:s -> mExit:n;
  mExit    -> exit;
}`,

    cfgSourceCode: [
        'async login(data: LoginUserInput): Promise<SessionData> {',
        '    const user = await this.userRepository.findByEmail(data.email);',
        '    if (!user) {',
        '        throw new NotFoundError(\'Invalid email or password\');',
        '    }',
        '    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);',
        '    if (!passwordMatch) {',
        '        throw new AuthorizationError(\'Invalid email or password\');',
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
    cyclomaticComplexity: {
        cc1Regions: 3,
        cc2EdgeNodePlus2: 3,
        cc3PredicatePlus1: 3,
    },
    predicates: [
        'user == null (D1)',
        '!passwordMatch (D2)',
    ],
    paths: [
        {id: '1', description: 'start → S1 → D1(F) → S2 → D2(F) → S3 → retOk → mExit → exit  [valid credentials — happy path]'},
        {id: '2', description: 'start → S1 → D1(T) → throwNF → mExit → exit  [email not found]'},
        {id: '3', description: 'start → S1 → D1(F) → S2 → D2(T) → throwAE → mExit → exit  [wrong password]'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data={email:"admin@gymtrackerpro.com", password:"secret"}, findByEmail returns MOCK_ADMIN_USER (admin, member=null), bcrypt.compare → true',
            expected: 'returns SessionData with adminId set, memberId=undefined, isActive=undefined',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '2',
            inputData: 'data={email:"member@example.com", password:"secret"}, findByEmail returns MOCK_MEMBER_USER (active member, admin=null), bcrypt.compare → true',
            expected: 'returns SessionData with memberId set, isActive=true, adminId=undefined',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '3',
            inputData: 'data={email:"member@example.com", password:"secret"}, findByEmail returns MOCK_INACTIVE_MEMBER_USER (isActive=false), bcrypt.compare → true',
            expected: 'returns SessionData with isActive=false',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, true]],
            pathCoverage: [true, false, false],
        },
        {
            noTc: '4',
            inputData: 'data={email:"unknown@example.com", password:"secret"}, findByEmail returns null',
            expected: 'throws NotFoundError("Invalid email or password")',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, false]],
            pathCoverage: [false, true, false],
        },
        {
            noTc: '5',
            inputData: 'data={email:"admin@gymtrackerpro.com", password:"wrong"}, findByEmail returns MOCK_ADMIN_USER, bcrypt.compare → false',
            expected: 'throws AuthorizationError("Invalid email or password")',
            statementCoverage: true,
            conditionDecision: [[false, true], [true, false]],
            pathCoverage: [false, false, true],
        },
    ],

    remarks: [
        '1) statementCoverage: TC1 is the first to execute S2 (bcrypt.compare), S3 (build SessionData), and retOk (return). TC4 is the first to execute throwNF. TC5 is the first to execute throwAE. TCs 2 and 3 re-execute already-covered statements and do not add new SC.',
        '2) TCs 2 and 3 are extra TCs beyond the basis set. They are added to exercise the three distinct null/defined combinations of user.member and user.admin within the single return statement: TC1 covers admin user (member=null, admin defined), TC2 covers active member (admin=null, member defined with isActive=true), TC3 covers inactive member (isActive=false). These combinations do not create new CFG edges but are required to verify the optional-chaining expressions (member?.id, admin?.id, member?.isActive) produce correct SessionData values.',
    ],

    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

const reportServiceGetMemberProgressReportWbt: WbtDescriptor = {
    reqId: 'SERV-02',
    statement: 'ReportService.getMemberProgressReport(memberId, startDate, endDate) — fetches sessions for a member in a date range, aggregates per-exercise stats, and returns a fully populated Report object.',
    data: 'Input: memberId: string, startDate: Date, endDate: Date',
    precondition: 'memberId resolves to an existing member; startDate ≤ endDate; workoutSessionRepository.findAll returns sessions with nested exercises.',
    results: 'Output: Promise<Report>',
    postcondition: 'Returns Report with totalSessions, totalVolume, averageSessionDuration, exerciseBreakdown (sorted desc by volume), and sessionDetails. averageSessionDuration is 0 when sessions is empty.',

    // ── CFG ──────────────────────────────────────────────────────────────────
    // N=45, E=49 → CC2 = 49−45+2 = 6
    // P=5 (loopOuter, loopInner, D1, loopFor, D2) → CC3 = 5+1 = 6
    // Enclosed regions: outer-loop, inner-loop, D1-branch, for..of-loop, D2-branch → CC1 = 5+1 = 6
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start      [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit       [label="" shape=circle width=0.25 style=filled fillcolor=black];

  S1         [label="member = userRepository.findMemberById(memberId)" shape=box];
  S2         [label="sessions = workoutSessionRepository.findAll({memberId,startDate,endDate}).items" shape=box];
  S3         [label="exerciseStatsMap = new Map()" shape=box];
  S4         [label="exerciseSessionSets = new Map()" shape=box];
  S5         [label="sessionDetails = []" shape=box];
  S6         [label="i = 0" shape=box];
  loopOuter  [label="i < sessions.length?" shape=diamond];
  S7         [label="session = sessions[i]" shape=box];
  S8         [label="exerciseDetails = []" shape=box];
  S9         [label="j = 0" shape=box];
  loopInner  [label="j < session.exercises.length?" shape=diamond];
  S10        [label="entry = session.exercises[j]" shape=box];
  S11        [label="weight = Number(entry.weight)" shape=box];
  S12        [label="volume = entry.sets * entry.reps * weight" shape=box];
  D1         [label="!exerciseStatsMap.has(entry.exerciseId)?" shape=diamond];
  S13        [label="exerciseStatsMap.set(entry.exerciseId, { exerciseId, exerciseName, muscleGroup, totalSets:0, totalReps:0, totalVolume:0, sessionCount:0 })" shape=box];
  S14        [label="exerciseSessionSets.set(entry.exerciseId, new Set())" shape=box];
  m1         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S15        [label="stats = exerciseStatsMap.get(entry.exerciseId)" shape=box];
  S16        [label="stats.totalSets += entry.sets" shape=box];
  S17        [label="stats.totalReps += entry.sets * entry.reps" shape=box];
  S18        [label="stats.totalVolume += volume" shape=box];
  S19        [label="exerciseSessionSets.get(entry.exerciseId).add(session.id)" shape=box];
  S20        [label="exerciseDetails.push({ exerciseId, exerciseName, sets, reps, weight, volume })" shape=box];
  S21        [label="j++" shape=box];
  S22        [label="totalVolume = exerciseDetails.reduce((sum, e) => sum + e.volume, 0)" shape=box];
  S23        [label="sessionDetails.push({ sessionId, date, durationMinutes, notes, exercises, totalVolume })" shape=box];
  S24        [label="i++" shape=box];
  S25        [label="entries = Array.from(exerciseSessionSets.entries())" shape=box];
  S26        [label="k = 0" shape=box];
  loopFor    [label="k < entries.length?" shape=diamond];
  S27        [label="[exerciseId, sessionIdSet] = entries[k]" shape=box];
  S28        [label="exerciseStatsMap.get(exerciseId).sessionCount = sessionIdSet.size" shape=box];
  S29        [label="k++" shape=box];
  S30        [label="exerciseBreakdown = Array.from(exerciseStatsMap.values())" shape=box];
  S31        [label="exerciseBreakdown.sort((a, b) => b.totalVolume - a.totalVolume)" shape=box];
  S32        [label="totalVolume = sessionDetails.reduce((sum, s) => sum + s.totalVolume, 0)" shape=box];
  D2         [label="sessions.length > 0?" shape=diamond];
  S33        [label="durationSum = sessions.reduce((sum, s) => sum + s.duration, 0)" shape=box];
  S34        [label="averageSessionDuration = durationSum / sessions.length" shape=box];
  S35        [label="averageSessionDuration = 0" shape=box];
  m2         [label="" shape=circle width=0.18 style=filled fillcolor=black];
  S36        [label="return { memberId, memberName, startDate, endDate, totalSessions, totalVolume, averageSessionDuration, exerciseBreakdown, sessionDetails }" shape=box];

  start:s    -> S1:n;
  S1:s       -> S2:n;
  S2:s       -> S3:n;
  S3:s       -> S4:n;
  S4:s       -> S5:n;
  S5:s       -> S6:n;
  S6:s       -> loopOuter:n;

  loopOuter:w -> S7:n        [label="True"];
  loopOuter:e -> S25:n       [label="False"];

  S7:s       -> S8:n;
  S8:s       -> S9:n;
  S9:s       -> loopInner:n;

  loopInner:w -> S10:n       [label="True"];
  loopInner:e -> S22:n       [label="False"];

  S10:s      -> S11:n;
  S11:s      -> S12:n;
  S12:s      -> D1:n;

  D1:w       -> S13:n        [label="True"];
  D1:e       -> m1:ne        [label="False"];

  S13:s      -> S14:n;
  S14:s      -> m1:nw;
  m1         -> S15:n;

  S15:s      -> S16:n;
  S16:s      -> S17:n;
  S17:s      -> S18:n;
  S18:s      -> S19:n;
  S19:s      -> S20:n;
  S20:s      -> S21:n;
  S21:s      -> loopInner:n  [constraint=false];

  S22:s      -> S23:n;
  S23:s      -> S24:n;
  S24:s      -> loopOuter:n  [constraint=false];

  S25:s      -> S26:n;
  S26:s      -> loopFor:n;

  loopFor:w  -> S27:n        [label="True"];
  loopFor:e  -> S30:n        [label="False"];

  S27:s      -> S28:n;
  S28:s      -> S29:n;
  S29:s      -> loopFor:n    [constraint=false];

  S30:s      -> S31:n;
  S31:s      -> S32:n;
  S32:s      -> D2:n;

  D2:w       -> S33:n        [label="True"];
  D2:e       -> S35:n        [label="False"];

  S33:s      -> S34:n;
  S34:s      -> m2:nw;
  S35:s      -> m2:ne;
  m2         -> S36:n;
  S36:s      -> exit;
}`,

    cfgSourceCode: [
        'async getMemberProgressReport(memberId: string, startDate: Date, endDate: Date): Promise<Report> {',
        '    const member = await this.userRepository.findMemberById(memberId);',
        '    const {items: sessions} = await this.workoutSessionRepository.findAll({memberId, startDate, endDate});',
        '    const exerciseStatsMap = new Map<string, ExerciseStats>();',
        '    const exerciseSessionSets = new Map<string, Set<string>>();',
        '    const sessionDetails: SessionDetail[] = sessions.map((session) => {',
        '        const exerciseDetails: SessionExerciseDetail[] = session.exercises.map((entry) => {',
        '            const weight = Number(entry.weight);',
        '            const volume = entry.sets * entry.reps * weight;',
        '            if (!exerciseStatsMap.has(entry.exerciseId)) {',
        '                exerciseStatsMap.set(entry.exerciseId, {',
        '                    exerciseId: entry.exerciseId,',
        '                    exerciseName: entry.exercise.name,',
        '                    muscleGroup: entry.exercise.muscleGroup,',
        '                    totalSets: 0, totalReps: 0, totalVolume: 0, sessionCount: 0,',
        '                });',
        '                exerciseSessionSets.set(entry.exerciseId, new Set());',
        '            }',
        '            const stats = exerciseStatsMap.get(entry.exerciseId)!;',
        '            stats.totalSets   += entry.sets;',
        '            stats.totalReps   += entry.sets * entry.reps;',
        '            stats.totalVolume += volume;',
        '            exerciseSessionSets.get(entry.exerciseId)!.add(session.id);',
        '            return { exerciseId: entry.exerciseId, exerciseName: entry.exercise.name,',
        '                     sets: entry.sets, reps: entry.reps, weight, volume };',
        '        });',
        '        const totalVolume = exerciseDetails.reduce((sum, e) => sum + e.volume, 0);',
        '        return { sessionId: session.id, date: session.date, durationMinutes: session.duration,',
        '                 notes: session.notes, exercises: exerciseDetails, totalVolume };',
        '    });',
        '    for (const [exerciseId, sessionIdSet] of exerciseSessionSets) {',
        '        exerciseStatsMap.get(exerciseId)!.sessionCount = sessionIdSet.size;',
        '    }',
        '    const exerciseBreakdown = Array.from(exerciseStatsMap.values())',
        '        .sort((a, b) => b.totalVolume - a.totalVolume);',
        '    const totalVolume = sessionDetails.reduce((sum, s) => sum + s.totalVolume, 0);',
        '    const averageSessionDuration =',
        '        sessions.length > 0',
        '            ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length',
        '            : 0;',
        '    return {',
        '        memberId, memberName: member.user.fullName,',
        '        startDate, endDate,',
        '        totalSessions: sessions.length,',
        '        totalVolume,',
        '        averageSessionDuration,',
        '        exerciseBreakdown,',
        '        sessionDetails,',
        '    };',
        '}',
    ],

    cyclomaticComplexity: {
        cc1Regions:        6,   // 5 enclosed (outer-loop, inner-loop, D1-branch, for..of-loop, D2-branch) + 1 outer
        cc2EdgeNodePlus2:  6,   // E=49, N=45 → 49−45+2 = 6
        cc3PredicatePlus1: 6,   // P=5 (loopOuter, loopInner, D1, loopFor, D2) → 5+1 = 6
    },

    predicates: [
        'i < sessions.length (loopOuter)',
        'j < session.exercises.length (loopInner)',
        '!exerciseStatsMap.has(entry.exerciseId) (D1)',
        'k < entries.length (loopFor)',
        'sessions.length > 0 (D2)',
    ],

    paths: [
        {
            id: '1',
            description: 'start → S1 → ... → loopOuter[T] → ... → loopInner[T] → D1[T] → ... → loopInner[F] → ... → loopOuter[F] → ... → loopFor[T] → ... → loopFor[F] → ... → D2[T] → exit [1 session, 1 exercise, first-seen exercise, k-loop once, avg computed]',
        },
        {
            id: '2',
            description: 'start → S1 → ... → loopOuter[F] → ... → loopFor[F] → ... → D2[F] → exit [0 sessions: outer loop skipped, k-loop skipped, avg = 0]',
        },
        {
            id: '3',
            description: 'start → S1 → ... → loopOuter[T] → ... → loopInner[F] → ... → loopOuter[F] → ... → loopFor[F] → ... → D2[T] → exit [1 session with 0 exercises: inner loop skipped]',
        },
        {
            id: '4',
            description: 'start → S1 → ... → loopOuter[T] → ... → loopInner[T] → D1[T] → ... → loopInner[T] → D1[F] → ... → loopInner[F] → ... → loopOuter[F] → ... → loopFor[T] → ... → D2[T] → exit [same exercise twice: D1 false branch on 2nd iteration]',
        },
        {
            id: '5',
            description: 'start → S1 → ... → loopOuter[T] → ... → loopOuter[T] → ... → loopOuter[F] → ... → loopFor[T] → ... → D2[T] → exit [2 sessions: outer loop executes twice]',
        },
        {
            id: '6',
            description: 'start → S1 → ... → loopOuter[T] → ... → loopOuter[F] → ... → loopFor[T] → ... → loopFor[T] → ... → loopFor[F] → ... → D2[T] → exit [2 distinct exercises: k-loop executes twice]',
        },
    ],

    hasLoopCoverage: true,

    tcRows: [
        // ── Independent Paths (Basis Set) ──────────────────────────────────────────────────
        {
            noTc: '1',
            inputData: '1 session (1 distinct exercise)',
            expected: 'All maps populated with exactly 1 element. Aggregations complete correctly.',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false],
            loopCoverage: { once: true }
        },
        {
            noTc: '2',
            inputData: '0 sessions returned from repo',
            expected: 'Immediate skip to end, averages return 0, arrays return empty.',
            statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, true], [false, true]],
            pathCoverage: [false, true, false, false, false, false],
            loopCoverage: { no: true }
        },
        {
            noTc: '3',
            inputData: '1 session (0 exercises)',
            expected: 'Outer runs once, Inner skips entirely. Average session duration computes correctly.',
            statementCoverage: true,
            conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]],
            pathCoverage: [false, false, true, false, false, false],
            loopCoverage: { once: true }
        },
        {
            noTc: '4',
            inputData: '1 session (2 exercises with identical ID)',
            expected: 'Inner loop triggers D1 T branch on 1st iteration, F branch on 2nd. Volume adds up accurately.',
            statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]],
            pathCoverage: [false, false, false, true, false, false],
            loopCoverage: { twice: true }
        },
        {
            noTc: '5',
            inputData: '2 sessions (each with 1 exercise)',
            expected: 'Outer triggers twice. Averages and breakdowns aggregated correctly across both.',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, true, false],
            loopCoverage: { twice: true }
        },
        {
            noTc: '6',
            inputData: '1 session (2 DISTINCT exercises)',
            expected: 'Inner triggers twice, distinct D1 sets. exerciseBreakdown tests sorting logic.',
            statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, true],
            loopCoverage: { mLessThanN: true }
        },

        // ── Outer 0 (Boundary) ─────────────────────────────────────────────────────────────
        {
            noTc: '7',
            inputData: '0 sessions returned',
            expected: 'TotalSessions=0, TotalVolume=0, avgSession=0.',
            statementCoverage: false,
            conditionDecision: [[false, true], [false, false], [false, false], [false, true], [false, true]],
            pathCoverage: [false, true, false, false, false, false],
            loopCoverage: { no: true }
        },

        // ── Outer 1 ────────────────────────────────────────────────────────────────────────
        { noTc: '8', inputData: '1 session, 0 exercises', expected: 'Volume=0, Avg=30', statementCoverage: false, conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]], pathCoverage: [false, false, true, false, false, false], loopCoverage: { no: true } },
        { noTc: '9', inputData: '1 session, 1 exercise', expected: 'Volume=VOL_ONE', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [true, false, false, false, false, false], loopCoverage: { once: true } },
        { noTc: '10', inputData: '1 session, 2 same exercises', expected: 'Volume=VOL_SAME_TWICE', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]], pathCoverage: [false, false, false, true, false, false], loopCoverage: { twice: true } },
        { noTc: '11', inputData: '1 session, 2 distinct exercises', expected: 'Volume=VOL_M', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, false, true], loopCoverage: { mLessThanN: true } },
        { noTc: '12', inputData: '1 session, 3 distinct exercises', expected: 'Volume=VOL_N_MINUS1', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, false, true], loopCoverage: { nMinus1: true } },
        { noTc: '13', inputData: '1 session, 4 distinct exercises', expected: 'Volume=VOL_N', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, false, true], loopCoverage: { n: true } },
        { noTc: '14', inputData: '1 session, 5 distinct exercises', expected: 'Volume=VOL_N_PLUS1', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, false, true], loopCoverage: { nPlus1: true } },

        // ── Outer 2 ────────────────────────────────────────────────────────────────────────
        { noTc: '15', inputData: '2 sessions, 0 exercises each', expected: 'Volume=0', statementCoverage: false, conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]], pathCoverage: [false, false, true, false, false, false], loopCoverage: { twice: true } },
        { noTc: '16', inputData: '2 sessions, 1 ex each', expected: 'Volume=VOL_ONE*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, false], loopCoverage: { twice: true } },
        { noTc: '17', inputData: '2 sessions, 2 same ex each', expected: 'Volume=VOL_SAME_TWICE*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]], pathCoverage: [false, false, false, true, true, false], loopCoverage: { twice: true } },
        { noTc: '18', inputData: '2 sessions, 2 distinct each', expected: 'Volume=VOL_M*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { twice: true } },
        { noTc: '19', inputData: '2 sessions, 3 distinct each', expected: 'Volume=VOL_N_MINUS1*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { twice: true } },
        { noTc: '20', inputData: '2 sessions, 4 distinct each', expected: 'Volume=VOL_N*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { twice: true } },
        { noTc: '21', inputData: '2 sessions, 5 distinct each', expected: 'Volume=VOL_N_PLUS1*2', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { twice: true } },

        // ── Outer N-1 (4) ──────────────────────────────────────────────────────────────────
        { noTc: '22', inputData: '4 sessions, 0 exercises', expected: 'Volume=0', statementCoverage: false, conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]], pathCoverage: [false, false, true, false, false, false], loopCoverage: { nMinus1: true } },
        { noTc: '23', inputData: '4 sessions, 1 ex each', expected: 'Volume=VOL_ONE*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, false], loopCoverage: { nMinus1: true } },
        { noTc: '24', inputData: '4 sessions, 2 same each', expected: 'Volume=VOL_SAME_TWICE*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]], pathCoverage: [false, false, false, true, true, false], loopCoverage: { nMinus1: true } },
        { noTc: '25', inputData: '4 sessions, 2 distinct each', expected: 'Volume=VOL_M*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nMinus1: true } },
        { noTc: '26', inputData: '4 sessions, 3 distinct each', expected: 'Volume=VOL_N_MINUS1*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nMinus1: true } },
        { noTc: '27', inputData: '4 sessions, 4 distinct each', expected: 'Volume=VOL_N*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nMinus1: true } },
        { noTc: '28', inputData: '4 sessions, 5 distinct each', expected: 'Volume=VOL_N_PLUS1*4', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nMinus1: true } },

        // ── Outer N (5) ────────────────────────────────────────────────────────────────────
        { noTc: '29', inputData: '5 sessions, 0 exercises', expected: 'Volume=0', statementCoverage: false, conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]], pathCoverage: [false, false, true, false, false, false], loopCoverage: { n: true } },
        { noTc: '30', inputData: '5 sessions, 1 ex each', expected: 'Volume=VOL_ONE*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, false], loopCoverage: { n: true } },
        { noTc: '31', inputData: '5 sessions, 2 same each', expected: 'Volume=VOL_SAME_TWICE*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]], pathCoverage: [false, false, false, true, true, false], loopCoverage: { n: true } },
        { noTc: '32', inputData: '5 sessions, 2 distinct each', expected: 'Volume=VOL_M*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { n: true } },
        { noTc: '33', inputData: '5 sessions, 3 distinct each', expected: 'Volume=VOL_N_MINUS1*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { n: true } },
        { noTc: '34', inputData: '5 sessions, 4 distinct each', expected: 'Volume=VOL_N*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { n: true } },
        { noTc: '35', inputData: '5 sessions, 5 distinct each', expected: 'Volume=VOL_N_PLUS1*5', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { n: true } },

        // ── Outer N+1 (6) ──────────────────────────────────────────────────────────────────
        { noTc: '36', inputData: '6 sessions, 0 exercises', expected: 'Volume=0', statementCoverage: false, conditionDecision: [[true, false], [false, true], [false, false], [false, true], [true, false]], pathCoverage: [false, false, true, false, false, false], loopCoverage: { nPlus1: true } },
        { noTc: '37', inputData: '6 sessions, 1 ex each', expected: 'Volume=VOL_ONE*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, false], loopCoverage: { nPlus1: true } },
        { noTc: '38', inputData: '6 sessions, 2 same each', expected: 'Volume=VOL_SAME_TWICE*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, true], [true, false], [true, false]], pathCoverage: [false, false, false, true, true, false], loopCoverage: { nPlus1: true } },
        { noTc: '39', inputData: '6 sessions, 2 distinct each', expected: 'Volume=VOL_M*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nPlus1: true } },
        { noTc: '40', inputData: '6 sessions, 3 distinct each', expected: 'Volume=VOL_N_MINUS1*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nPlus1: true } },
        { noTc: '41', inputData: '6 sessions, 4 distinct each', expected: 'Volume=VOL_N*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nPlus1: true } },
        { noTc: '42', inputData: '6 sessions, 5 distinct each', expected: 'Volume=VOL_N_PLUS1*6', statementCoverage: false, conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false]], pathCoverage: [false, false, false, false, true, true], loopCoverage: { nPlus1: true } },
    ],

    remarks: [
        '1) statementCoverage is marked TRUE exclusively for the 4 primary basis tests that traverse the execution blocks for the first time. The rest act to push limits and cover permutations without adding new unique line coverage.',
        '2) Includes a mathematically complete matrix for boundary value analysis testing for BOTH nested loops. Outer (sessions loop) hits 0, 1, 2, n-1(4), n(5), n+1(6) AND inner hits 0, 1, 2-same, 2-distinct(m), n-1(3), n(4), n+1(5). N=5 for outer loops, N=4 for inner loops.',
        '3) The post-processing `for..of` loop mapping over `exerciseSessionSets` is triggered proportionately with distinct exercises passed in the tests, proving scale aggregation independently of session boundaries.',
    ],

    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-03 · ExerciseService.createExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceCreateExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-03',
    statement: 'ExerciseService.createExercise(data) - delegates exercise creation to the repository.',
    data: 'Input: CreateExerciseInput',
    precondition: 'A valid CreateExerciseInput is provided.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.create(data)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async createExercise(data: CreateExerciseInput): Promise<Exercise> {',
        '    return this.exerciseRepository.create(data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_EXERCISE_INPUT, repo.create resolves MOCK_EXERCISE',
            expected: 'returns MOCK_EXERCISE',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-04 · ExerciseService.getExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceGetExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-04',
    statement: 'ExerciseService.getExercise(id) - delegates exercise lookup by id to the repository.',
    data: 'Input: string',
    precondition: 'A non-empty string id is provided.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.findById(id)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async getExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.findById(id);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, repo.findById resolves MOCK_EXERCISE',
            expected: 'returns MOCK_EXERCISE',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-05 · ExerciseService.listExercises
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceListExercisesWbt: WbtDescriptor = {
    reqId: 'SERV-05',
    statement: 'ExerciseService.listExercises(options?) - delegates paginated exercise listing to the repository.',
    data: 'Input: ExerciseListOptions (optional)',
    precondition: 'options is optional; if omitted the repository applies its own defaults.',
    results: 'Output: Promise<PageResult<Exercise>>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.findAll(options)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async listExercises(options?: ExerciseListOptions): Promise<PageResult<Exercise>> {',
        '    return this.exerciseRepository.findAll(options);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'options={}, repo.findAll resolves {items:[MOCK_EXERCISE], total:1}',
            expected: 'returns {items:[MOCK_EXERCISE], total:1}',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The optional/undefined branching of the options parameter is handled entirely inside the repository; from the service CFG perspective the argument is passed through unconditionally.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-06 · ExerciseService.updateExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceUpdateExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-06',
    statement: 'ExerciseService.updateExercise(id, data) - delegates exercise update to the repository.',
    data: 'Input: id: string, data: UpdateExerciseInput',
    precondition: 'A valid id and UpdateExerciseInput are provided.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.update(id, data)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise> {',
        '    return this.exerciseRepository.update(id, data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, data={description:"Updated description"}, repo.update resolves updated Exercise',
            expected: 'returns updated Exercise',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-07 · ExerciseService.archiveExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceArchiveExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-07',
    statement: 'ExerciseService.archiveExercise(id) - sets the exercise isActive flag to false via the repository.',
    data: 'Input: id: string',
    precondition: 'A valid id string is provided.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.setActive(id, false)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async archiveExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.setActive(id, false);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, repo.setActive(id, false) resolves Exercise with isActive=false',
            expected: 'returns Exercise with isActive=false',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The boolean literal false is hardcoded at the call site; no decision node exists in the CFG of this function.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-08 · ExerciseService.unarchiveExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceUnarchiveExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-08',
    statement: 'ExerciseService.unarchiveExercise(id) - sets the exercise isActive flag to true via the repository.',
    data: 'Input: id: string',
    precondition: 'A valid id string is provided.',
    results: 'Output: Promise<Exercise>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.setActive(id, true)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async unarchiveExercise(id: string): Promise<Exercise> {',
        '    return this.exerciseRepository.setActive(id, true);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, repo.setActive(id, true) resolves Exercise with isActive=true',
            expected: 'returns Exercise with isActive=true',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The boolean literal true is hardcoded at the call site; no decision node exists in the CFG of this function.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-09 · ExerciseService.deleteExercise
// ─────────────────────────────────────────────────────────────────────────────

const exerciseServiceDeleteExerciseWbt: WbtDescriptor = {
    reqId: 'SERV-09',
    statement: 'ExerciseService.deleteExercise(id) - delegates exercise deletion to the repository.',
    data: 'Input: id: string',
    precondition: 'A valid id string is provided.',
    results: 'Output: Promise<void>',
    postcondition: 'Resolves void; propagates any error the repository throws.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return exerciseRepository.delete(id)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async deleteExercise(id: string): Promise<void> {',
        '    return this.exerciseRepository.delete(id);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'id=EXERCISE_ID, repo.delete resolves void',
            expected: 'resolves void (result is undefined)',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-10 · WorkoutSessionService.createWorkoutSession
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceCreateWbt: WbtDescriptor = {
    reqId: 'SERV-10',
    statement: 'WorkoutSessionService.createWorkoutSession(data, exercises) - delegates workout session creation to the repository.',
    data: 'Input: CreateWorkoutSessionInput, WorkoutSessionExerciseInput[]',
    precondition: 'A valid CreateWorkoutSessionInput and a non-null exercises array are provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.create(data, exercises)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async createWorkoutSession(',
        '    data: CreateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseInput[],',
        '): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.create(data, exercises);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'data=CREATE_WORKOUT_SESSION_INPUT, exercises=WORKOUT_SESSION_EXERCISE_INPUTS, repo.create resolves MOCK_SESSION_WITH_EXERCISES',
            expected: 'returns MOCK_SESSION_WITH_EXERCISES',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-11 · WorkoutSessionService.getWorkoutSession
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceGetWbt: WbtDescriptor = {
    reqId: 'SERV-11',
    statement: 'WorkoutSessionService.getWorkoutSession(workoutSessionId) - delegates workout session lookup by id to the repository.',
    data: 'Input: string',
    precondition: 'A non-empty workout session id string is provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.findById(workoutSessionId)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async getWorkoutSession(workoutSessionId: string): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.findById(workoutSessionId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, repo.findById resolves MOCK_SESSION_WITH_EXERCISES',
            expected: 'returns MOCK_SESSION_WITH_EXERCISES',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-12 · WorkoutSessionService.listMemberWorkoutSessions
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceListWbt: WbtDescriptor = {
    reqId: 'SERV-12',
    statement: 'WorkoutSessionService.listMemberWorkoutSessions(memberId, options?) - merges memberId into the options object and delegates paginated listing to the repository.',
    data: 'Input: memberId: string, options?: WorkoutSessionListOptions',
    precondition: 'A non-empty memberId string is provided; options is optional.',
    results: 'Output: Promise<PageResult<WorkoutSessionWithExercises>>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.findAll({memberId, ...options})" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async listMemberWorkoutSessions(',
        '    memberId: string,',
        '    options?: WorkoutSessionListOptions,',
        '): Promise<PageResult<WorkoutSessionWithExercises>> {',
        '    return this.workoutSessionRepository.findAll({memberId, ...options});',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'memberId=MEMBER_ID, options=undefined, repo.findAll resolves MOCK_PAGE_RESULT',
            expected: 'returns MOCK_PAGE_RESULT; repo called with {memberId: MEMBER_ID}',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-13 · WorkoutSessionService.updateWorkoutSession
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceUpdateWbt: WbtDescriptor = {
    reqId: 'SERV-13',
    statement: 'WorkoutSessionService.updateWorkoutSession(workoutSessionId, data) - delegates workout session update to the repository.',
    data: 'Input: workoutSessionId: string, data: UpdateWorkoutSessionInput',
    precondition: 'A valid workout session id and UpdateWorkoutSessionInput are provided.',
    results: 'Output: Promise<WorkoutSession>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.update(workoutSessionId, data)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async updateWorkoutSession(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '): Promise<WorkoutSession> {',
        '    return this.workoutSessionRepository.update(workoutSessionId, data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, data=UPDATE_WORKOUT_SESSION_INPUT, repo.update resolves MOCK_SESSION',
            expected: 'returns MOCK_SESSION',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-14 · WorkoutSessionService.updateWorkoutSessionWithExercises
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceUpdateWithExercisesWbt: WbtDescriptor = {
    reqId: 'SERV-14',
    statement: 'WorkoutSessionService.updateWorkoutSessionWithExercises(workoutSessionId, data, exercises) - delegates a combined session-and-exercises update to the repository.',
    data: 'Input: workoutSessionId: string, data: UpdateWorkoutSessionInput, exercises: WorkoutSessionExerciseUpdateInput[]',
    precondition: 'A valid workout session id, UpdateWorkoutSessionInput, and a non-null exercises array are provided.',
    results: 'Output: Promise<WorkoutSessionWithExercises>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.updateWithExercises(workoutSessionId, data, exercises)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async updateWorkoutSessionWithExercises(',
        '    workoutSessionId: string,',
        '    data: UpdateWorkoutSessionInput,',
        '    exercises: WorkoutSessionExerciseUpdateInput[],',
        '): Promise<WorkoutSessionWithExercises> {',
        '    return this.workoutSessionRepository.updateWithExercises(workoutSessionId, data, exercises);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, data=UPDATE_WORKOUT_SESSION_INPUT, exercises=WORKOUT_SESSION_EXERCISE_UPDATE_INPUTS, repo.updateWithExercises resolves MOCK_SESSION_WITH_EXERCISES',
            expected: 'returns MOCK_SESSION_WITH_EXERCISES',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-15 · WorkoutSessionService.deleteWorkoutSession
// ─────────────────────────────────────────────────────────────────────────────

const workoutSessionServiceDeleteWbt: WbtDescriptor = {
    reqId: 'SERV-15',
    statement: 'WorkoutSessionService.deleteWorkoutSession(workoutSessionId) - delegates workout session deletion to the repository.',
    data: 'Input: string',
    precondition: 'A valid workout session id string is provided.',
    results: 'Output: Promise<void>',
    postcondition: 'Resolves void; propagates any error the repository throws.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return workoutSessionRepository.delete(workoutSessionId)" shape=box];

  start -> S1:n;
  S1:s  -> exit;
}`,
    cfgSourceCode: [
        'async deleteWorkoutSession(workoutSessionId: string): Promise<void> {',
        '    return this.workoutSessionRepository.delete(workoutSessionId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [
        {id: '1', description: 'start -> S1 -> exit'},
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'workoutSessionId=SESSION_ID, repo.delete resolves void',
            expected: 'resolves void (result is undefined)',
            statementCoverage: true,
            conditionDecision: [],
            pathCoverage: [true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-16 · UserService.generateTempPassword  (private)
// ─────────────────────────────────────────────────────────────────────────────

const userServiceGenerateTempPasswordWbt: WbtDescriptor = {
    reqId: 'SERV-16',
    statement: 'UserService.generateTempPassword() — generates a 16-character cryptographically random password guaranteeing at least one uppercase, digit, and special character, then Fisher-Yates shuffles the result.',
    data: 'Input: none (private method)',
    precondition: 'crypto.getRandomValues is available in the runtime environment.',
    results: 'Output: string (16 characters)',
    postcondition: 'Returned string has exactly 16 characters and contains at least one uppercase letter, one digit, and one special character.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1      [label="declare pools (upper/lower/digits/special/all) + randomChar" shape=box];
  S2      [label="required = [randomChar(upper), randomChar(digits), randomChar(special)]" shape=box];
  S3      [label="remaining = Array.from({length: 13}, () => randomChar(all))" shape=box];
  S4      [label="combined = [...required, ...remaining]" shape=box];
  S5      [label="i = combined.length - 1" shape=box];
  D1      [label="i > 0?" shape=diamond];
  S6      [label="bytes = new Uint8Array(1); getRandomValues(bytes); j = bytes[0] % (i+1); swap combined[i] ↔ combined[j]" shape=box];
  S7      [label="i--" shape=box];
  S8      [label="return combined.join('')" shape=box];

  start -> S1:n;
  S1:s  -> S2:n;
  S2:s  -> S3:n;
  S3:s  -> S4:n;
  S4:s  -> S5:n;
  S5:s  -> D1:n;
  D1:w  -> S6:n  [label="True"];
  S6:s  -> S7:n;
  S7:w  -> D1:n  [constraint=false];
  D1:e  -> S8:n  [label="False"];
  S8:s  -> exit;
}`,
    cfgSourceCode: [
        'private generateTempPassword(): string {',
        '    const LENGTH = 16;',
        '    const upper = \'ABCDEFGHIJKLMNOPQRSTUVWXYZ\';',
        '    const lower = \'abcdefghijklmnopqrstuvwxyz\';',
        '    const digits = \'0123456789\';',
        '    const special = \'!@#$%^&*()-_=+[]{}|;:,.<>?\';',
        '    const all = upper + lower + digits + special;',
        '    const randomChar = (pool: string) => {',
        '        const bytes = new Uint8Array(1);',
        '        crypto.getRandomValues(bytes);',
        '        return pool[bytes[0] % pool.length];',
        '    };',
        '    const required = [randomChar(upper), randomChar(digits), randomChar(special)];',
        '    const remaining = Array.from({length: LENGTH - required.length}, () => randomChar(all));',
        '    const combined = [...required, ...remaining];',
        '    for (let i = combined.length - 1; i > 0; i--) {',
        '        const bytes = new Uint8Array(1);',
        '        crypto.getRandomValues(bytes);',
        '        const j = bytes[0] % (i + 1);',
        '        [combined[i], combined[j]] = [combined[j], combined[i]];',
        '    }',
        '    return combined.join(\'\');',
        '}',
    ],
    // N=10 (start S1 S2 S3 S4 S5 D1 S6 S7 S8 exit), E=12 → CC₂=12-11+2=... wait
    // Nodes: start, S1, S2, S3, S4, S5, D1, S6, S7, S8, exit = 11
    // Edges: start→S1, S1→S2, S2→S3, S3→S4, S4→S5, S5→D1, D1(T)→S6, S6→S7, S7→D1(back), D1(F)→S8, S8→exit = 11
    // CC₂ = 11 - 11 + 2 = 2; CC₃ = 1+1 = 2; CC₁ = 1 loop region + 1 outer = 2
    cyclomaticComplexity: {cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2},
    predicates: ['i > 0 (D1)'],
    paths: [
        {id: '1', description: 'start → S1 → S2 → S3 → S4 → S5 → D1(T) → S6 → S7 → [D1 repeated] → D1(F) → S8 → exit  [loop runs 15 times]'},
        {id: '2', description: 'start → S1 → S2 → S3 → S4 → S5 → D1(F) → S8 → exit  [IMPOSSIBLE — i always starts at 15]'},
    ],
    hasLoopCoverage: true,
    tcRows: [
        {
            noTc: '1',
            inputData: 'no input; crypto.getRandomValues mocked to fill Uint8Array with 0',
            expected: '16-character string containing ≥1 uppercase, ≥1 digit, ≥1 special character',
            statementCoverage: true,
            conditionDecision: [[true, true]],
            pathCoverage: [true, false],
            loopCoverage: {n: true},
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and the first (and only) to execute every statement.',
        '2) Path 2 (D1 evaluates False on the first check, skipping the loop entirely) is structurally impossible: LENGTH is hardcoded to 16, required always contains exactly 3 elements, remaining always contains exactly 13, so combined always has 16 elements and i always starts at 15 > 0.',
        '3) All loop variants other than n=15 are impossible for the same reason — the loop iteration count is entirely determined by the hardcoded LENGTH constant.',
        '4) TC1 covers both the True branch of D1 (on each of the 15 shuffle iterations) and the False branch (when i decrements to 0 and the loop exits), achieving full MCC for D1 within a single execution.',
        '5) This method is private and is accessed in the test via (service as any).generateTempPassword() with crypto.getRandomValues mocked on globalThis.crypto.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-17 · UserService.createMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceCreateMemberWbt: WbtDescriptor = {
    reqId: 'SERV-17',
    statement: 'UserService.createMember(data) — delegates member creation to the repository.',
    data: 'Input: CreateMemberInput',
    precondition: 'A valid CreateMemberInput is provided.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.createMember(data)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async createMember(data: CreateMemberInput): Promise<MemberWithUser> {',
        '    return this.userRepository.createMember(data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'data=CREATE_MEMBER_INPUT, repo.createMember resolves MOCK_MEMBER_WITH_USER',
        expected: 'returns MOCK_MEMBER_WITH_USER',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-18 · UserService.createMemberWithTempPassword
// ─────────────────────────────────────────────────────────────────────────────

const userServiceCreateMemberWithTempPasswordWbt: WbtDescriptor = {
    reqId: 'SERV-18',
    statement: 'UserService.createMemberWithTempPassword(data) — generates a temporary password, creates the member via the repository with that password injected, and returns the member record augmented with the plaintext temp password.',
    data: 'Input: CreateMemberWithTempPasswordInput',
    precondition: 'A valid CreateMemberWithTempPasswordInput (without a password field) is provided.',
    results: 'Output: Promise<MemberWithUserAndTempPassword>',
    postcondition: 'Returns MemberWithUser spread with the generated tempPassword; repository was called with data merged with the generated password.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="tempPassword = this.generateTempPassword()" shape=box];
  S2    [label="member = await userRepository.createMember({...data, password: tempPassword})" shape=box];
  S3    [label="return {...member, tempPassword}" shape=box];
  start -> S1:n; S1:s -> S2:n; S2:s -> S3:n; S3:s -> exit;
}`,
    cfgSourceCode: [
        'async createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<MemberWithUserAndTempPassword> {',
        '    const tempPassword = this.generateTempPassword();',
        '    const member = await this.userRepository.createMember({...data, password: tempPassword});',
        '    return {...member, tempPassword};',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → S2 → S3 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'data=CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT; generateTempPassword spied to return TEMP_PASSWORD; repo.createMember resolves MOCK_MEMBER_WITH_USER',
        expected: 'returns {...MOCK_MEMBER_WITH_USER, tempPassword: TEMP_PASSWORD}; repo called with {...data, password: TEMP_PASSWORD}',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) generateTempPassword is isolated from this TC via jest.spyOn(service as any, "generateTempPassword").mockReturnValue(TEMP_PASSWORD), keeping this a true unit test of the composition logic.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-19 · UserService.createAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userServiceCreateAdminWbt: WbtDescriptor = {
    reqId: 'SERV-19',
    statement: 'UserService.createAdmin(data) — delegates admin creation to the repository.',
    data: 'Input: CreateAdminInput',
    precondition: 'A valid CreateAdminInput is provided.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.createAdmin(data)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {',
        '    return this.userRepository.createAdmin(data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'data=CREATE_ADMIN_INPUT, repo.createAdmin resolves MOCK_ADMIN_WITH_USER',
        expected: 'returns MOCK_ADMIN_WITH_USER',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-20 · UserService.getMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceGetMemberWbt: WbtDescriptor = {
    reqId: 'SERV-20',
    statement: 'UserService.getMember(memberId) — delegates member lookup by id to the repository.',
    data: 'Input: string',
    precondition: 'A non-empty memberId string is provided.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.findMemberById(memberId)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async getMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.findMemberById(memberId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'memberId=MEMBER_ID, repo.findMemberById resolves MOCK_MEMBER_WITH_USER',
        expected: 'returns MOCK_MEMBER_WITH_USER',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-21 · UserService.getAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userServiceGetAdminWbt: WbtDescriptor = {
    reqId: 'SERV-21',
    statement: 'UserService.getAdmin(adminId) — delegates admin lookup by id to the repository.',
    data: 'Input: string',
    precondition: 'A non-empty adminId string is provided.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.findAdminById(adminId)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async getAdmin(adminId: string): Promise<AdminWithUser> {',
        '    return this.userRepository.findAdminById(adminId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'adminId=ADMIN_ID, repo.findAdminById resolves MOCK_ADMIN_WITH_USER',
        expected: 'returns MOCK_ADMIN_WITH_USER',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-22 · UserService.listMembers
// ─────────────────────────────────────────────────────────────────────────────

const userServiceListMembersWbt: WbtDescriptor = {
    reqId: 'SERV-22',
    statement: 'UserService.listMembers(options?) — delegates paginated member listing to the repository.',
    data: 'Input: MemberListOptions (optional)',
    precondition: 'options is optional; the repository applies its own defaults if omitted.',
    results: 'Output: Promise<PageResult<MemberWithUser>>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.findMembers(options)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async listMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>> {',
        '    return this.userRepository.findMembers(options);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'options=undefined, repo.findMembers resolves {items:[MOCK_MEMBER_WITH_USER], total:1}',
        expected: 'returns {items:[MOCK_MEMBER_WITH_USER], total:1}',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The optional options parameter introduces no predicate node in this CFG; its handling is the repository\'s responsibility (covered in REPO tests).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-23 · UserService.listAdmins
// ─────────────────────────────────────────────────────────────────────────────

const userServiceListAdminsWbt: WbtDescriptor = {
    reqId: 'SERV-23',
    statement: 'UserService.listAdmins(options?) — delegates paginated admin listing to the repository.',
    data: 'Input: AdminListOptions (optional)',
    precondition: 'options is optional; the repository applies its own defaults if omitted.',
    results: 'Output: Promise<PageResult<AdminWithUser>>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.findAdmins(options)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async listAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>> {',
        '    return this.userRepository.findAdmins(options);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'options=undefined, repo.findAdmins resolves {items:[MOCK_ADMIN_WITH_USER], total:1}',
        expected: 'returns {items:[MOCK_ADMIN_WITH_USER], total:1}',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The optional options parameter introduces no predicate node in this CFG; its handling is the repository\'s responsibility (covered in REPO tests).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-24 · UserService.updateMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceUpdateMemberWbt: WbtDescriptor = {
    reqId: 'SERV-24',
    statement: 'UserService.updateMember(memberId, data) — delegates member update to the repository.',
    data: 'Input: memberId: string, data: UpdateMemberInput',
    precondition: 'A valid memberId and UpdateMemberInput are provided.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.updateMember(memberId, data)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {',
        '    return this.userRepository.updateMember(memberId, data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'memberId=MEMBER_ID, data=UPDATE_MEMBER_INPUT, repo.updateMember resolves updated MemberWithUser',
        expected: 'returns updated MemberWithUser',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-25 · UserService.suspendMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceSuspendMemberWbt: WbtDescriptor = {
    reqId: 'SERV-25',
    statement: 'UserService.suspendMember(memberId) — sets the member isActive flag to false via the repository.',
    data: 'Input: memberId: string',
    precondition: 'A valid memberId string is provided.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.setMemberActive(memberId, false)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async suspendMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.setMemberActive(memberId, false);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'memberId=MEMBER_ID, repo.setMemberActive(memberId, false) resolves MemberWithUser with isActive=false',
        expected: 'returns MemberWithUser with isActive=false',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The boolean literal false is hardcoded at the call site; no decision node exists in this function\'s CFG.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-26 · UserService.activateMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceActivateMemberWbt: WbtDescriptor = {
    reqId: 'SERV-26',
    statement: 'UserService.activateMember(memberId) — sets the member isActive flag to true via the repository.',
    data: 'Input: memberId: string',
    precondition: 'A valid memberId string is provided.',
    results: 'Output: Promise<MemberWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.setMemberActive(memberId, true)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async activateMember(memberId: string): Promise<MemberWithUser> {',
        '    return this.userRepository.setMemberActive(memberId, true);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'memberId=MEMBER_ID, repo.setMemberActive(memberId, true) resolves MemberWithUser with isActive=true',
        expected: 'returns MemberWithUser with isActive=true',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
        '2) The boolean literal true is hardcoded at the call site; no decision node exists in this function\'s CFG.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-27 · UserService.updateAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userServiceUpdateAdminWbt: WbtDescriptor = {
    reqId: 'SERV-27',
    statement: 'UserService.updateAdmin(adminId, data) — delegates admin update to the repository.',
    data: 'Input: adminId: string, data: UpdateAdminInput',
    precondition: 'A valid adminId and UpdateAdminInput are provided.',
    results: 'Output: Promise<AdminWithUser>',
    postcondition: 'Returns whatever the repository resolves with (or propagates any error the repository throws).',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.updateAdmin(adminId, data)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {',
        '    return this.userRepository.updateAdmin(adminId, data);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'adminId=ADMIN_ID, data=UPDATE_ADMIN_INPUT, repo.updateAdmin resolves updated AdminWithUser',
        expected: 'returns updated AdminWithUser',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-28 · UserService.deleteMember
// ─────────────────────────────────────────────────────────────────────────────

const userServiceDeleteMemberWbt: WbtDescriptor = {
    reqId: 'SERV-28',
    statement: 'UserService.deleteMember(memberId) — delegates member deletion to the repository.',
    data: 'Input: memberId: string',
    precondition: 'A valid memberId string is provided.',
    results: 'Output: Promise<void>',
    postcondition: 'Resolves void; propagates any error the repository throws.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.delete(memberId)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async deleteMember(memberId: string): Promise<void> {',
        '    return this.userRepository.delete(memberId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'memberId=MEMBER_ID, repo.delete resolves void',
        expected: 'resolves void (result is undefined)',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ─────────────────────────────────────────────────────────────────────────────
// SERV-29 · UserService.deleteAdmin
// ─────────────────────────────────────────────────────────────────────────────

const userServiceDeleteAdminWbt: WbtDescriptor = {
    reqId: 'SERV-29',
    statement: 'UserService.deleteAdmin(adminId) — delegates admin deletion to the repository.',
    data: 'Input: adminId: string',
    precondition: 'A valid adminId string is provided.',
    results: 'Output: Promise<void>',
    postcondition: 'Resolves void; propagates any error the repository throws.',
    cfgDot: `digraph CFG {
  rankdir=TB; splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
  start [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  S1    [label="return userRepository.delete(adminId)" shape=box];
  start -> S1:n; S1:s -> exit;
}`,
    cfgSourceCode: [
        'async deleteAdmin(adminId: string): Promise<void> {',
        '    return this.userRepository.delete(adminId);',
        '}',
    ],
    cyclomaticComplexity: {cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1},
    predicates: [],
    paths: [{id: '1', description: 'start → S1 → exit'}],
    hasLoopCoverage: false,
    tcRows: [{
        noTc: '1',
        inputData: 'adminId=ADMIN_ID, repo.delete resolves void',
        expected: 'resolves void (result is undefined)',
        statementCoverage: true,
        conditionDecision: [],
        pathCoverage: [true],
    }],
    remarks: [
        '1) statementCoverage is true for TC1 as it is the only TC and is the first (and only) to execute the sole statement.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('Generating service WBT forms…');

    const AUTH_SVC = path.join(BASE, 'auth-service');
    await writeWbt(authServiceLoginWbt, path.join(AUTH_SVC, 'login-wbt-form.xlsx'));

    const REPORT_SVC = path.join(BASE, 'report-service');
    await writeWbt(reportServiceGetMemberProgressReportWbt, path.join(REPORT_SVC, 'getMemberProgressReport-wbt-form.xlsx'));

    const EXERCISE_SVC = path.join(BASE, 'exercise-service');
    await writeWbt(exerciseServiceCreateExerciseWbt, path.join(EXERCISE_SVC, 'createExercise-wbt-form.xlsx'));
    await writeWbt(exerciseServiceGetExerciseWbt, path.join(EXERCISE_SVC, 'getExercise-wbt-form.xlsx'));
    await writeWbt(exerciseServiceListExercisesWbt, path.join(EXERCISE_SVC, 'listExercises-wbt-form.xlsx'));
    await writeWbt(exerciseServiceUpdateExerciseWbt, path.join(EXERCISE_SVC, 'updateExercise-wbt-form.xlsx'));
    await writeWbt(exerciseServiceArchiveExerciseWbt, path.join(EXERCISE_SVC, 'archiveExercise-wbt-form.xlsx'));
    await writeWbt(exerciseServiceUnarchiveExerciseWbt, path.join(EXERCISE_SVC, 'unarchiveExercise-wbt-form.xlsx'));
    await writeWbt(exerciseServiceDeleteExerciseWbt, path.join(EXERCISE_SVC, 'deleteExercise-wbt-form.xlsx'));

    const WS_SVC = path.join(BASE, 'workout-session-service');
    await writeWbt(workoutSessionServiceCreateWbt, path.join(WS_SVC, 'createWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionServiceGetWbt, path.join(WS_SVC, 'getWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionServiceListWbt, path.join(WS_SVC, 'listMemberWorkoutSessions-wbt-form.xlsx'));
    await writeWbt(workoutSessionServiceUpdateWbt, path.join(WS_SVC, 'updateWorkoutSession-wbt-form.xlsx'));
    await writeWbt(workoutSessionServiceUpdateWithExercisesWbt, path.join(WS_SVC, 'updateWorkoutSessionWithExercises-wbt-form.xlsx'));
    await writeWbt(workoutSessionServiceDeleteWbt, path.join(WS_SVC, 'deleteWorkoutSession-wbt-form.xlsx'));

    const USER_SVC = path.join(BASE, 'user-service');
    await writeWbt(userServiceGenerateTempPasswordWbt, path.join(USER_SVC, 'generateTempPassword-wbt-form.xlsx'));
    await writeWbt(userServiceCreateMemberWbt, path.join(USER_SVC, 'createMember-wbt-form.xlsx'));
    await writeWbt(userServiceCreateMemberWithTempPasswordWbt, path.join(USER_SVC, 'createMemberWithTempPassword-wbt-form.xlsx'));
    await writeWbt(userServiceCreateAdminWbt, path.join(USER_SVC, 'createAdmin-wbt-form.xlsx'));
    await writeWbt(userServiceGetMemberWbt, path.join(USER_SVC, 'getMember-wbt-form.xlsx'));
    await writeWbt(userServiceGetAdminWbt, path.join(USER_SVC, 'getAdmin-wbt-form.xlsx'));
    await writeWbt(userServiceListMembersWbt, path.join(USER_SVC, 'listMembers-wbt-form.xlsx'));
    await writeWbt(userServiceListAdminsWbt, path.join(USER_SVC, 'listAdmins-wbt-form.xlsx'));
    await writeWbt(userServiceUpdateMemberWbt, path.join(USER_SVC, 'updateMember-wbt-form.xlsx'));
    await writeWbt(userServiceSuspendMemberWbt, path.join(USER_SVC, 'suspendMember-wbt-form.xlsx'));
    await writeWbt(userServiceActivateMemberWbt, path.join(USER_SVC, 'activateMember-wbt-form.xlsx'));
    await writeWbt(userServiceUpdateAdminWbt, path.join(USER_SVC, 'updateAdmin-wbt-form.xlsx'));
    await writeWbt(userServiceDeleteMemberWbt, path.join(USER_SVC, 'deleteMember-wbt-form.xlsx'));
    await writeWbt(userServiceDeleteAdminWbt, path.join(USER_SVC, 'deleteAdmin-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });