/**
 * page-header-ft-forms.ts
 *
 * FT form descriptors for PageHeader.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'components', 'layout', '__tests__', 'ft', 'page-header');

const pageHeaderDescriptor: FtDescriptor = {
    componentName: 'PageHeader',
    reqId: 'FT-03',
    statement: 'PageHeader - renders a page heading with a title, optional description below it, and optional right-aligned action children.',
    props: [
        'title: string             - required. Main heading text rendered in an <h1>.',
        'description?: string      - optional. Supporting text below the title. Omitted = element not rendered.',
        'children?: React.ReactNode - optional. Action elements rendered right-aligned. Omitted = wrapper div not rendered.',
    ].join('\n'),
    precondition: 'None - component uses no React context, no server actions, no routing.',
    renderOutput: [
        'A container div with flex layout.',
        'An <h1> element containing the title text.',
        'When description is provided: a <p> element with the description text.',
        'When children are provided: a div wrapping the children on the right.',
        'When description is omitted: no description <p> in the DOM.',
        'When children are omitted: no right-side wrapper div in the DOM.',
    ].join('\n'),
    postcondition: 'None - purely presentational, no callbacks or side-effects.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest page-header.test.tsx',
        'No providers required.',
        'Both description and children are independently conditional - all four combinations (neither, description only, children only, both) are tested.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders an h1 with the title text when only the required title prop is supplied.',
            arrange: 'render(<PageHeader title="Exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("heading", {level: 1, name: "Exercises"}) is in the document.\nNo description element present.\nNo children wrapper present.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders the description text when the description prop is provided.',
            arrange: 'render(<PageHeader title="Exercises" description="Browse your exercise library." />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("Browse your exercise library.") is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Does not render a description element when the description prop is omitted.',
            arrange: 'render(<PageHeader title="Exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'queryByText("Browse your exercise library.") returns null.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Renders children on the right when a child element is provided.',
            arrange: 'render(<PageHeader title="Exercises"><button>Add</button></PageHeader>)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("button", {name: "Add"}) is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Does not render a children wrapper when no children are provided.',
            arrange: 'render(<PageHeader title="Exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'queryByRole("button") returns null.\nOnly the h1 and no sibling action container are present.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-06',
            description: 'Renders correctly when both description and children are provided simultaneously.',
            arrange: 'render(<PageHeader title="Exercises" description="Browse your library."><button>Add</button></PageHeader>)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("heading", {level: 1, name: "Exercises"}) is in the document.',
                'getByText("Browse your library.") is in the document.',
                'getByRole("button", {name: "Add"}) is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-07',
            description: 'Renders multiple children elements inside the right-aligned wrapper.',
            arrange: 'render(<PageHeader title="Exercises"><button>Import</button><button>Add</button></PageHeader>)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("button", {name: "Import"}) is in the document.\ngetByRole("button", {name: "Add"}) is in the document.',
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(pageHeaderDescriptor, path.join(outDir, 'page-header-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});