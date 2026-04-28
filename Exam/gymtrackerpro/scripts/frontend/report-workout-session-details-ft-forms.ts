import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'components',
    'report',
    '__tests__',
    'ft',
    'report-workout-session-details',
);

const reportWorkoutSessionDetailsDescriptor: FtDescriptor = {
    componentName: 'ReportWorkoutSessionDetails',
    reqId: 'FT-10',
    statement:
        'ReportWorkoutSessionDetails - renders a stacked list of per-session detail cards showing date, duration, volume, optional notes, and exercise rows; returns null when the sessions array is empty.',
    props: 'sessions: Report["sessionDetails"]  - required; array of session records each containing sessionId, date, durationMinutes, totalVolume, notes (optional), and exercises (array of { exerciseId, exerciseName, sets, reps, weight }).',
    precondition: 'None - component is purely presentational with no hooks, server actions, or context dependencies.',
    renderOutput: [
        'When sessions is empty: nothing - component returns null.',
        'When sessions is non-empty: an <h2> with text "Session Details" followed by one card per session.',
        'Each card shows the date formatted via new Date(session.date).toLocaleDateString().',
        'Each card shows a span containing "{durationMinutes} min · {totalVolume.toLocaleString()} kg".',
        'Each card shows a <p> with session.notes when notes is truthy; the <p> is absent when notes is falsy.',
        'Each card lists exercise rows in the format "{sets}×{reps} @ {weight} kg" alongside the exercise name.',
    ].join('\n'),
    postcondition: 'None - component is purely presentational with no side effects.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest report-workout-session-details.test.tsx',
        'No mocking required - no hooks, server actions, or context.',
        'Date formatting is asserted by computing new Date(session.date).toLocaleDateString() in the test itself to remain locale-agnostic across CI environments.',
        'Volume formatting uses (session.totalVolume).toLocaleString() computed in the test for the same reason.',
        'The notes conditional branch (TC-05 / TC-06) is the only JSX && in the component and must have both branches tested.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Returns null and renders nothing into the DOM when the sessions array is empty.',
            arrange: 'render(<ReportWorkoutSessionDetails sessions={[]} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.firstChild is null.',
        },
        {
            noTc: 'TC-02',
            description:
                'Renders the "Session Details" heading when at least one session is present.',
            arrange:
                'render(<ReportWorkoutSessionDetails sessions={[mockSession]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("heading", {name: "Session Details"}) is in the document.',
        },
        {
            noTc: 'TC-03',
            description:
                'Formats the session date using toLocaleDateString() before rendering it.',
            arrange:
                'mockSession.date = "2024-01-15".\nrender(<ReportWorkoutSessionDetails sessions={[mockSession]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText(new Date("2024-01-15").toLocaleDateString()) is in the document.',
        },
        {
            noTc: 'TC-04',
            description:
                'Renders duration and volume together in the format "{durationMinutes} min · {totalVolume.toLocaleString()} kg".',
            arrange:
                'mockSession.durationMinutes = 45, mockSession.totalVolume = 10000.\nrender(<ReportWorkoutSessionDetails sessions={[mockSession]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText(`45 min · ${(10000).toLocaleString()} kg`) is in the document.',
        },
        {
            noTc: 'TC-05',
            description:
                'Renders the notes paragraph when session.notes is a non-empty string.',
            arrange:
                'mockSession.notes = "Felt strong today".\nrender(<ReportWorkoutSessionDetails sessions={[mockSession]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText("Felt strong today") is in the document.',
        },
        {
            noTc: 'TC-06',
            description:
                'Does not render a notes paragraph when session.notes is absent.',
            arrange:
                'mockSession.notes = undefined.\nrender(<ReportWorkoutSessionDetails sessions={[{...mockSession, notes: undefined}]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'queryByText("Felt strong today") is null.',
        },
        {
            noTc: 'TC-07',
            description:
                'Renders each exercise row with its name and the format "{sets}×{reps} @ {weight} kg".',
            arrange:
                'mockSession.exercises = [{ exerciseId: "ex-1", exerciseName: "Bench Press", sets: 3, reps: 10, weight: 80 }].\nrender(<ReportWorkoutSessionDetails sessions={[mockSession]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText("Bench Press") is in the document.\ngetByText("3×10 @ 80 kg") is in the document.',
        },
        {
            noTc: 'TC-08',
            description:
                'Renders one card per session when multiple sessions are provided.',
            arrange:
                'sessions = [mockSession, secondSession] with different dates.\nrender(<ReportWorkoutSessionDetails sessions={sessions} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText(new Date(mockSession.date).toLocaleDateString()) is in the document.\ngetByText(new Date(secondSession.date).toLocaleDateString()) is in the document.',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        reportWorkoutSessionDetailsDescriptor,
        path.join(outDir, 'report-workout-session-details-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});