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
    'report-stats',
);

const reportStatsDescriptor: FtDescriptor = {
    componentName: 'ReportStats',
    reqId: 'FT-09',
    statement:
        'ReportStats - renders three StatCard components in a responsive grid, threading totalSessions, totalVolume (locale-formatted + " kg"), and averageSessionDuration (Math.round + " min") from the Report data prop.',
    props: 'data: Report  - required; full progress report object; only totalSessions, totalVolume, and averageSessionDuration are consumed by this component.',
    precondition: 'None - component and StatCard are purely presentational with no hooks, server actions, or context dependencies.',
    renderOutput: [
        'A <div> grid containing three StatCard instances.',
        'First card: title="Total Sessions", value={data.totalSessions}, no description.',
        'Second card: title="Total Volume", value=`${data.totalVolume.toLocaleString()} kg`, description="sets × reps × weight".',
        'Third card: title="Avg Duration", value=`${Math.round(data.averageSessionDuration)} min`, description="per session".',
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
        'Run: npx jest report-stats.test.tsx',
        'StatCard is used as-is - assertions use getByText which finds text nodes regardless of StatCard internal structure.',
        'toLocaleString() assertion computes the expected string in the test itself ((10000).toLocaleString()) to remain locale-agnostic across CI environments.',
        'Math.round boundary case (TC-07) uses averageSessionDuration: 45.7 to verify rounding rather than truncation.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Renders all three card titles in the DOM.',
            arrange:
                'render(<ReportStats data={mockReport} />) where mockReport has totalSessions: 12, totalVolume: 10000, averageSessionDuration: 45.',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText("Total Sessions") is in the document.\ngetByText("Total Volume") is in the document.\ngetByText("Avg Duration") is in the document.',
        },
        {
            noTc: 'TC-02',
            description:
                'Passes totalSessions directly as the value to the first StatCard.',
            arrange: 'render(<ReportStats data={mockReport} />) with totalSessions: 12.',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("12") is in the document.',
        },
        {
            noTc: 'TC-03',
            description:
                'Passes totalVolume formatted with toLocaleString() and a " kg" suffix as the value to the second StatCard.',
            arrange: 'render(<ReportStats data={mockReport} />) with totalVolume: 10000.',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText(`${(10000).toLocaleString()} kg`) is in the document.',
        },
        {
            noTc: 'TC-04',
            description:
                'Passes averageSessionDuration rounded via Math.round with a " min" suffix as the value to the third StatCard.',
            arrange: 'render(<ReportStats data={mockReport} />) with averageSessionDuration: 45.',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("45 min") is in the document.',
        },
        {
            noTc: 'TC-05',
            description:
                'Passes the description "sets × reps × weight" to the Total Volume StatCard.',
            arrange: 'render(<ReportStats data={mockReport} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("sets × reps × weight") is in the document.',
        },
        {
            noTc: 'TC-06',
            description:
                'Passes the description "per session" to the Avg Duration StatCard.',
            arrange: 'render(<ReportStats data={mockReport} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("per session") is in the document.',
        },
        {
            noTc: 'TC-07',
            description:
                'Rounds a decimal averageSessionDuration to the nearest integer before appending " min".',
            arrange:
                'render(<ReportStats data={{...mockReport, averageSessionDuration: 45.7}} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("46 min") is in the document.',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        reportStatsDescriptor,
        path.join(outDir, 'report-stats-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});