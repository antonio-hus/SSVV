import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'app',
    '__tests__',
    'ft',
    'page',
);

const rootPageDescriptor: FtDescriptor = {
    componentName: 'RootPage',
    reqId: 'FT-11',
    statement:
        'RootPage - renders a static landing page with the app brand, a headline, a description, and a "Get Started" link that navigates to /login.',
    props: 'None - page component accepts no props.',
    precondition: 'None - component is purely static with no hooks, server actions, or context dependencies.',
    renderOutput: [
        'The brand name "GymTracker Pro" is visible.',
        'An <h1> with text "Your fitness, tracked.".',
        'A paragraph describing the app.',
        'A link with text "Get Started" pointing to /login.',
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
        'Run: npx jest page.test.tsx',
        'No mocking required - component uses no hooks, router, or server actions.',
        'next/link renders as a plain <a> in the Jest environment; href assertion is reliable.',
        'RootPage is a default export; import accordingly.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Renders the brand name, heading, description paragraph, and Get Started CTA without crashing.',
            arrange: 'render(<RootPage />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByText("GymTracker Pro") is in the document.\ngetByRole("heading", {name: "Your fitness, tracked."}) is in the document.\ngetByText(/Manage your gym/) is in the document.\ngetByRole("link", {name: "Get Started"}) is in the document.',
        },
        {
            noTc: 'TC-02',
            description:
                'The "Get Started" link has an href pointing to /login.',
            arrange: 'render(<RootPage />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByRole("link", {name: "Get Started"}) has attribute href="/login".',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        rootPageDescriptor,
        path.join(outDir, 'page-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});