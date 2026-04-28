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
    'report-exercise-breakdown',
);

const reportExerciseBreakdownDescriptor: FtDescriptor = {
    componentName: 'ReportExerciseBreakdown',
    reqId: 'FT-07',
    statement:
        'ReportExerciseBreakdown - renders a headed table of per-exercise aggregates for the report period, or returns null when the breakdown array is empty.',
    props: [
        'breakdown: Report["exerciseBreakdown"]  - required; array of per-exercise aggregate objects each containing exerciseId, exerciseName, muscleGroup, sessionCount, totalSets, totalReps, and totalVolume',
    ].join('\n'),
    precondition: 'None - component is a pure server component with no hooks, no server actions, and no React context dependencies.',
    renderOutput: [
        'When breakdown is empty: nothing - the component returns null.',
        'When breakdown is non-empty: an <h2> with text "Exercise Breakdown" followed by a bordered <table>.',
        'The table header contains six <th> cells: Exercise, Muscle Group, Sessions, Sets, Reps, Volume.',
        'The table body contains one <tr> per breakdown entry with cells for exerciseName, muscleGroup, sessionCount, totalSets, totalReps, and totalVolume (formatted via toLocaleString()).',
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
        'Run: npx jest report-exercise-breakdown.test.tsx',
        'No mocking required - no hooks, server actions, or context.',
        'Null return is asserted via container.firstChild - the standard RTL pattern for components that conditionally return null.',
        'toLocaleString() formatting is asserted by computing the expected value in the test itself ((10000).toLocaleString()) so the assertion remains locale-agnostic across environments.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Returns null and renders nothing into the DOM when the breakdown array is empty.',
            arrange: 'render(<ReportExerciseBreakdown breakdown={[]} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.firstChild is null.',
        },
        {
            noTc: 'TC-02',
            description:
                'Renders the "Exercise Breakdown" heading and a table element when breakdown contains at least one entry.',
            arrange:
                'render(<ReportExerciseBreakdown breakdown={singleBreakdown} />) where singleBreakdown has one entry.',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("heading", {name: "Exercise Breakdown"}) is in the document.\ngetByRole("table") is in the document.',
        },
        {
            noTc: 'TC-03',
            description:
                'Renders all six expected column headers in the table header row.',
            arrange: 'render(<ReportExerciseBreakdown breakdown={singleBreakdown} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("columnheader", {name: "Exercise"}) is in the document.\ngetByRole("columnheader", {name: "Muscle Group"}) is in the document.\ngetByRole("columnheader", {name: "Sessions"}) is in the document.\ngetByRole("columnheader", {name: "Sets"}) is in the document.\ngetByRole("columnheader", {name: "Reps"}) is in the document.\ngetByRole("columnheader", {name: "Volume"}) is in the document.',
        },
        {
            noTc: 'TC-04',
            description:
                'Renders a table row with all correct cell values for a single breakdown entry.',
            arrange:
                'singleBreakdown = [{ exerciseId: "ex-1", exerciseName: "Bench Press", muscleGroup: "Chest", sessionCount: 3, totalSets: 9, totalReps: 81, totalVolume: 100 }].\nrender(<ReportExerciseBreakdown breakdown={singleBreakdown} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("cell", {name: "Bench Press"}) is in the document.\ngetByRole("cell", {name: "Chest"}) is in the document.\ngetByRole("cell", {name: "3"}) is in the document.\ngetByRole("cell", {name: "9"}) is in the document.\ngetByRole("cell", {name: "81"}) is in the document.\ngetByRole("cell", {name: "100"}) is in the document.',
        },
        {
            noTc: 'TC-05',
            description:
                'Renders one table row per entry when breakdown contains multiple items.',
            arrange:
                'multiBreakdown has two entries: "Bench Press" and "Deadlift".\nrender(<ReportExerciseBreakdown breakdown={multiBreakdown} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("cell", {name: "Bench Press"}) is in the document.\ngetByRole("cell", {name: "Deadlift"}) is in the document.',
        },
        {
            noTc: 'TC-06',
            description:
                'Formats the totalVolume value using toLocaleString() before rendering it into the cell.',
            arrange:
                'render(<ReportExerciseBreakdown breakdown={[{ ...entry, totalVolume: 10000 }]} />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("cell", {name: (10000).toLocaleString()}) is in the document.',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        reportExerciseBreakdownDescriptor,
        path.join(outDir, 'report-exercise-breakdown-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});