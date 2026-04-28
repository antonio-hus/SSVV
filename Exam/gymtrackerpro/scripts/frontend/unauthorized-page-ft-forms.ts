/**
 * unauthorized-page-ft-forms.ts
 *
 * FT form descriptors for UnauthorizedPage.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', '(auth)', 'unauthorized', '__tests__', 'ft', 'page',
);

const unauthorizedPageDescriptor: FtDescriptor = {
    componentName: 'UnauthorizedPage',
    reqId: 'FT-16',
    statement: 'UnauthorizedPage - renders a static access-denied layout with a heading, a description, and two navigation links: one to the home page and one to the login page.',
    props: 'None - the component accepts no props and reads no URL params.',
    precondition: [
        'next/link must be shimmed so it renders a plain <a> element - this is expected to be configured globally in jest.setup.ts.',
        'No server action mocks required - the page is purely presentational.',
        'No providers required - the page uses no React context.',
        'Component is a synchronous server component; render directly: render(<UnauthorizedPage />).',
    ].join('\n'),
    renderOutput: [
        'A <p> element with text "Access Denied".',
        'An <h1> with text "You don\'t have permission here."',
        'A <p> with text "This page isn\'t available with your current account."',
        'An <a> element with accessible name "Go to Home" and href="/".',
        'An <a> element with accessible name "Sign in with another account" and href="/login".',
    ].join('\n'),
    postcondition: 'None - the page is purely presentational; it triggers no side-effects.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest page.test.tsx --testPathPattern=app/unauthorized',
        'next/link renders as <a> in jsdom when the global shim is in place; links are queryable via getByRole("link").',
        'No server actions, no navigation logic, no async - no mocking is required in the test file itself.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders the "Access Denied" label, the heading, and the description paragraph without crashing.',
            arrange: 'render(<UnauthorizedPage />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("Access Denied") is in the document.',
                'getByRole("heading", {name: "You don\'t have permission here."}) is in the document.',
                'getByText("This page isn\'t available with your current account.") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders a "Go to Home" link pointing to the root path.',
            arrange: 'render(<UnauthorizedPage />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: "Go to Home"}) is in the document.',
                'The link element has attribute href="/".',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Renders a "Sign in with another account" link pointing to /login.',
            arrange: 'render(<UnauthorizedPage />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: "Sign in with another account"}) is in the document.',
                'The link element has attribute href="/login".',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(unauthorizedPageDescriptor, path.join(outDir, 'page-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});