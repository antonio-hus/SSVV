/**
 * member-workout-sessions-ft-forms.ts
 *
 * FT form descriptors for the member workout sessions route.
 * Run: npx tsx scripts/frontend/member-workout-sessions-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'member', 'workout-sessions');

const tc = (noTc: string, description: string, arrange: string, act: string, expectedOutput: string): FtTcRow => ({
    noTc,
    description,
    arrange,
    act,
    expectedOutput,
    actualResult: 'Passed',
});

const commonStats = {
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
};

const descriptors: Array<{descriptor: FtDescriptor; outFile: string}> = [
    {
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'workout-sessions-table', 'workout-sessions-table-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'WorkoutSessionsTable',
            reqId: 'FT-51',
            statement: 'WorkoutSessionsTable - renders member workout sessions with date, duration, exercise count, notes, and a View link, or an empty state.',
            props: 'sessions: WorkoutSessionWithExercises[] - required list of workout sessions to display.',
            precondition: 'Mock generated Prisma MuscleGroup and Equipment enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'A bordered table with Date, Duration, Exercises, Notes, and Actions columns; one row per session or "No sessions yet" when empty.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders all column headers.', 'render(<WorkoutSessionsTable sessions={[]} />)', 'No interaction - render only.', 'Date, Duration, Exercises, Notes, and Actions column headers are visible.'),
                tc('TC-02', 'Displays an empty-state message when no sessions are supplied.', 'render(<WorkoutSessionsTable sessions={[]} />)', 'No interaction - render only.', 'Text "No sessions yet" is visible.'),
                tc('TC-03', 'Renders supplied session date, duration, exercise count, and notes.', 'render(<WorkoutSessionsTable sessions={[session]} />)', 'No interaction - render only.', 'Formatted date, "45 min", exercise count "2", and "Solid effort" are visible.'),
                tc('TC-04', 'Displays a dash placeholder when a session has no notes.', 'render session with notes null.', 'No interaction - render only.', 'Text "—" is visible in the Notes cell.'),
                tc('TC-05', 'Renders a member detail View link for each session.', 'render session id session-1.', 'No interaction - render only.', 'Row View button has href /member/workout-sessions/session-1.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '_components', '__tests__', 'ft', 'workout-session-stats', 'workout-session-stats-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'WorkoutSessionStats',
            reqId: 'FT-52',
            statement: 'WorkoutSessionStats - renders duration, exercise count, and total volume stat cards for one workout session.',
            props: 'workoutSession: WorkoutSessionWithExercises - session used for duration and exercise count; totalVolume: number - precomputed volume displayed in kg.',
            precondition: 'Mock generated Prisma MuscleGroup and Equipment enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Three StatCard components: Duration, Exercises, and Total Volume.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders duration, exercise count, and locale-formatted total volume.', 'render(<WorkoutSessionStats workoutSession={sessionWithTwoExercises} totalVolume={9600} />)', 'No interaction - render only.', 'Duration 45 min, Exercises 2, and Total Volume 9,600 kg are visible.'),
                tc('TC-02', 'Renders zero exercise count and zero volume for an empty session.', 'render with workoutSession.exercises=[] and totalVolume=0.', 'No interaction - render only.', 'Values 0 and 0 kg are visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '_components', '__tests__', 'ft', 'workout-session-exercises-table', 'workout-session-exercises-table-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'WorkoutSessionExercisesTable',
            reqId: 'FT-53',
            statement: 'WorkoutSessionExercisesTable - renders exercise rows for a session and calculates per-row volume from sets, reps, and weight.',
            props: 'exercises: WorkoutSessionWithExercises["exercises"] - required session exercise rows with related exercise data.',
            precondition: 'Mock generated Prisma MuscleGroup and Equipment enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Exercises heading and a table with Exercise, Muscle Group, Sets, Reps, Weight (kg), and Volume columns.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders heading and all column headers.', 'render(<WorkoutSessionExercisesTable exercises={[]} />)', 'No interaction - render only.', 'Exercises heading and all six column headers are visible.'),
                tc('TC-02', 'Renders supplied exercise names and muscle groups.', 'render two exercises.', 'No interaction - render only.', 'Barbell Bench Press, CHEST, Cable Row, and BACK are visible.'),
                tc('TC-03', 'Calculates volume for each exercise row.', 'render bench 3x10x80 and row 4x8x60.', 'No interaction - render only.', 'Volumes 2400 and 1920 are visible.'),
                tc('TC-04', 'Displays decimal weights and calculated decimal-weight volume.', 'render one exercise with weight 22.5.', 'No interaction - render only.', 'Weight 22.5 and volume 675 are visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberWorkoutSessionsPage',
            reqId: 'FT-54',
            statement: 'MemberWorkoutSessionsPage - fetches paginated workout sessions for the current member and renders header, table, pagination, or an error.',
            props: 'searchParams: Promise<{ page?: string }> - optional page query param; defaults to page 1.',
            precondition: 'Mock getSession and listMemberWorkoutSessions. Mock generated Prisma Role, MuscleGroup, and Equipment enums.',
            renderOutput: 'My Sessions PageHeader, WorkoutSessionsTable, and Pagination when total exceeds page size; null when session.memberId is missing.',
            postcondition: 'listMemberWorkoutSessions(session.memberId, {page, pageSize:10}) is called only when memberId exists.',
            remarks: [
                'Run: npx jest app/member/workout-sessions/__tests__/ft/page/page.test.tsx --selectProjects jsdom',
                'Suite is kept in a single main describe block and covers member-session gating, list success/failure, empty states, default/provided/non-numeric page params, and pagination edge branches.',
            ],
            tcRows: [
                tc('TC-01', 'Renders nothing and does not fetch sessions when session.memberId is missing.', 'getSession resolves memberId null.', 'render(await MemberWorkoutSessionsPage({searchParams}))', 'container.firstChild is null; listMemberWorkoutSessions is not called.'),
                tc('TC-02', 'Fetches page 1 by default and renders returned session table.', 'getSession resolves mem-1; listMemberWorkoutSessions succeeds with one session and total 1; searchParams resolves {}.', 'render page.', 'My Sessions heading, description, table headers, date, duration, exercise count, notes, View href, and page 1 list call are asserted; pagination is absent.'),
                tc('TC-03', 'Renders multiple session rows and dash placeholder for missing notes.', 'listMemberWorkoutSessions succeeds with two sessions, one with notes null.', 'render page.', 'Three table rows are present including header; second date/duration visible; dash placeholder and second View href are asserted.'),
                tc('TC-04', 'Renders only the Next link on the first page when more results exist.', 'searchParams resolves {}; list total is 25.', 'render page.', 'Page 1 of 3 and 25 total visible; Previous absent; Next href /member/workout-sessions?page=2; list called with page 1.'),
                tc('TC-05', 'Uses the middle page query param and renders Previous/Next pagination links.', 'searchParams resolves {page:"2"}; total 25.', 'render page.', 'Page 2 of 3 visible; Previous href /member/workout-sessions?page=1; Next href /member/workout-sessions?page=3; list called with page 2.'),
                tc('TC-06', 'Renders only the Previous link on the last page.', 'searchParams resolves {page:"3"}; total 25.', 'render page.', 'Page 3 of 3 visible; Previous href /member/workout-sessions?page=2; Next absent; list called with page 3.'),
                tc('TC-07', 'Passes a non-numeric page param through as NaN and renders the resulting pagination label.', 'searchParams resolves {page:"abc"}; total 25.', 'render page.', 'Page NaN of 3 visible; Previous and Next absent; list called with page NaN and pageSize 10.'),
                tc('TC-08', 'Renders table empty state and no pagination when result is empty.', 'listMemberWorkoutSessions succeeds with items [] and total 0.', 'render page.', 'No sessions yet is visible inside the table; page indicator is absent; list called with page 1.'),
                tc('TC-09', 'Shows returned error message without header or table when session listing fails.', 'listMemberWorkoutSessions resolves {success:false,message:"Could not load sessions"}.', 'render page.', 'Text "Could not load sessions" is visible; My Sessions heading and table are absent; list called with page 1.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberWorkoutSessionDetailPage',
            reqId: 'FT-55',
            statement: 'MemberWorkoutSessionDetailPage - fetches one workout session, verifies it belongs to the current member, and renders stats, notes, and exercise details.',
            props: 'params: Promise<{ id: string }> - route params containing the workout session ID.',
            precondition: 'Mock getSession and getWorkoutSession. Mock generated Prisma Role, MuscleGroup, and Equipment enums.',
            renderOutput: 'Session date PageHeader, Back link, WorkoutSessionStats, optional notes block, and WorkoutSessionExercisesTable for authorized sessions.',
            postcondition: 'getWorkoutSession(id) is called only when session.memberId exists; unauthorized or missing sessions render null.',
            remarks: ['Run: npx jest app/member/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders nothing and does not fetch when session.memberId is missing.', 'getSession resolves memberId null.', 'render(await MemberWorkoutSessionDetailPage({params}))', 'container.firstChild is null; getWorkoutSession is not called.'),
                tc('TC-02', 'Renders nothing when getWorkoutSession fails.', 'getSession resolves mem-1; getWorkoutSession resolves failed result.', 'render page with id missing-session.', 'container.firstChild is null; getWorkoutSession called with missing-session.'),
                tc('TC-03', 'Renders nothing when the fetched session belongs to a different member.', 'getSession resolves mem-1; getWorkoutSession returns memberId mem-2.', 'render page.', 'container.firstChild is null.'),
                tc('TC-04', 'Renders header, stats, notes, and exercise rows for an authorized session.', 'getWorkoutSession returns session for mem-1 with two exercises and notes.', 'render page.', 'Session date heading, 45 minutes, Back href, 4,320 kg, Notes, and exercise names are visible; getWorkoutSession called with session-1.'),
                tc('TC-05', 'Omits the notes block when session notes are null.', 'getWorkoutSession returns authorized session with notes null.', 'render page.', 'Notes label is absent and exercise row remains visible.'),
            ],
        },
    },
];

async function main(): Promise<void> {
    for (const {descriptor, outFile} of descriptors) {
        await writeFt(descriptor, outFile);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
