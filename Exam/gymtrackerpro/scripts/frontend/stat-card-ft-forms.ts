/**
 * stat-card-ft-forms.ts
 *
 * FT form descriptors for StatCard.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'components', 'data', '__tests__', 'ft', 'stat-card');

const statCardDescriptor: FtDescriptor = {
    componentName: 'StatCard',
    reqId: 'FT-02',
    statement: 'StatCard - renders a metric card with a title label, a primary value, and an optional description in an Apple-style stats presentation.',
    props: [
        'title: string              - required. Label describing the metric.',
        'value: string | number     - required. Main value to highlight.',
        'description?: string       - optional. Secondary text for context. Omitted = element not rendered.',
    ].join('\n'),
    precondition: 'None - component uses no React context, no server actions, no routing.',
    renderOutput: [
        'A Card element wrapping a CardContent element.',
        'A <p> element containing the title text in uppercase muted style.',
        'A <div> element containing the value.',
        'When description is provided: a <p> element containing the description text.',
        'When description is omitted: no description element in the DOM.',
    ].join('\n'),
    postcondition: 'None - purely presentational component with no side-effects or callbacks.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest stat-card.test.tsx',
        'No providers required - Card/CardContent are self-contained shadcn/ui components.',
        'value accepts string | number - both types are tested to confirm numeric values render correctly.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders the title and a string value in the default state with no description.',
            arrange: 'render(<StatCard title="Total Workouts" value="42" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.getByText("Total Workouts") is in the document.\nscreen.getByText("42") is in the document.\nNo description element present.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders a numeric value correctly when value prop is a number.',
            arrange: 'render(<StatCard title="Sessions" value={7} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.getByText("7") is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Renders the optional description when the description prop is provided.',
            arrange: 'render(<StatCard title="Streak" value="14 days" description="Personal best" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.getByText("Personal best") is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Does not render a description element when the description prop is omitted.',
            arrange: 'render(<StatCard title="Streak" value="14 days" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.queryByText(/personal best/i) returns null.\nOnly two text nodes exist: the title and the value.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Renders a value of 0 correctly without suppressing it.',
            arrange: 'render(<StatCard title="Rest Days" value={0} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.getByText("0") is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-06',
            description: 'Renders a long title string without truncation or crash.',
            arrange: 'render(<StatCard title="Average Session Duration This Week" value="52 min" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'screen.getByText("Average Session Duration This Week") is in the document.',
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(statCardDescriptor, path.join(outDir, 'stat-card-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});