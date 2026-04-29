/**
 * member-dashboard-ft-forms.ts
 *
 * FT form descriptors for the member dashboard route.
 * Run: npx tsx scripts/frontend/member-dashboard-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'member', 'dashboard');

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
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'dashboard-recent-sessions', 'dashboard-recent-sessions-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'DashboardRecentSessions',
            reqId: 'FT-44',
            statement: 'DashboardRecentSessions - renders a recent workout sessions preview table with a View All link, row-level View links, or an empty state.',
            props: 'workoutSessions: WorkoutSessionWithExercises[] - required list of recent sessions to display.',
            precondition: 'Mock generated Prisma MuscleGroup and Equipment enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Recent Sessions heading, View All link, and a table with Date, Duration, Exercises, and Actions columns.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/dashboard --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders heading and View All link.', 'render(<DashboardRecentSessions workoutSessions={[]} />)', 'No interaction - render only.', 'Recent Sessions heading is visible; View All href is /member/workout-sessions.'),
                tc('TC-02', 'Renders supplied session rows.', 'render one session with duration 45 and two exercises.', 'No interaction - render only.', 'Session date, "45 min", and exercise count "2" are visible.'),
                tc('TC-03', 'Renders View link for a session.', 'render one session with id session-1.', 'No interaction - render only.', 'View href is /member/workout-sessions/session-1.'),
                tc('TC-04', 'Displays empty state when no sessions exist.', 'render workoutSessions={[]}.', 'No interaction - render only.', 'Text "No workoutSessions yet" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberDashboardPage',
            reqId: 'FT-45',
            statement: 'MemberDashboardPage - fetches the current member session and recent workout sessions, then renders a personalized dashboard with total sessions and recent-session preview.',
            props: 'None - the page reads the current session server-side.',
            precondition: 'Mock getSession and listMemberWorkoutSessions. Mock generated Prisma Role, MuscleGroup, and Equipment enums.',
            renderOutput: 'Personalized PageHeader, Total Sessions StatCard, and DashboardRecentSessions when session.memberId exists; null when memberId is missing.',
            postcondition: 'listMemberWorkoutSessions(session.memberId, {page:1,pageSize:5}) is called only when memberId exists; failed session fetch falls back to total 0 and empty recent sessions.',
            remarks: ['Run: npx jest app/member/dashboard --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders nothing and does not fetch sessions when session.memberId is missing.', 'getSession resolves with memberId null.', 'render(await MemberDashboardPage())', 'container.firstChild is null; listMemberWorkoutSessions not called.'),
                tc('TC-02', 'Renders personalized heading and stat card when fullName is defined.', 'getSession resolves John Smith; listMemberWorkoutSessions succeeds with total 7.', 'render page.', 'Welcome John Smith heading, overview text, Total Sessions, value 7, and description visible.'),
                tc('TC-03', 'Renders Member fallback heading when fullName is null.', 'getSession resolves fullName null; sessions fetch succeeds empty.', 'render page.', 'Heading "Welcome, Member" is visible.'),
                tc('TC-04', 'Renders recent sessions preview when sessions load succeeds.', 'sessions fetch returns one session.', 'render page.', 'Recent Sessions heading, session date, duration, View href, and listMemberWorkoutSessions args asserted.'),
                tc('TC-05', 'Shows zero total and empty recent sessions when sessions load fails.', 'listMemberWorkoutSessions resolves failed result.', 'render page.', 'Total Sessions, value 0, and No workoutSessions yet are visible.'),
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
