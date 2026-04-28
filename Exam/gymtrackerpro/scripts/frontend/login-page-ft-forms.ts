/**
 * login-page-ft-forms.ts
 *
 * FT form descriptors for LoginPage.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'app', '(auth)', 'login', '__tests__', 'ft', 'page');

const loginPageDescriptor: FtDescriptor = {
    componentName: 'LoginPage',
    reqId: 'FT-15',
    statement: 'LoginPage - renders a centred login layout containing the GymTracker Pro branding, a "Sign in" heading, a subtitle, and the LoginForm organism inside a Card.',
    props: 'None - the component accepts no props and reads no URL params.',
    precondition: [
        'No router mock required - the page itself performs no navigation.',
        'No providers required - the page uses no React context.',
        'Page is an async server component; render via: render(await LoginPage()).',
    ].join('\n'),
    renderOutput: [
        'An <h1> with text "Sign in".',
        'A <p> with text "Enter your credentials to continue.".',
        'A <span> with text "GymTracker Pro".',
        'A <svg> Dumbbell icon inside the branding container.',
        'The LoginForm stub (data-testid="login-form-stub") rendered inside the Card.',
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
        'Run: npx jest page.test.tsx --testPathPattern=app/login',
        'LoginPage is an async server component - must be awaited before passing to render(): render(await LoginPage()).',
        'LoginForm is mocked to a stub - its behaviour is verified in FT-14.',
        'This test covers only what the page itself contributes: layout, branding, and organism mounting.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders the "Sign in" heading and the subtitle paragraph without crashing.',
            arrange: [
                'LoginForm mocked as a no-op stub.',
                'const page = await LoginPage();',
                'render(page)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("heading", {name: "Sign in"}) is in the document.',
                'getByText("Enter your credentials to continue.") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders the GymTracker Pro brand name and the Dumbbell SVG icon.',
            arrange: [
                'LoginForm mocked as a no-op stub.',
                'const page = await LoginPage();',
                'render(page)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("GymTracker Pro") is in the document.',
                'An <svg> element is present inside the branding container.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Mounts the LoginForm organism inside the Card.',
            arrange: [
                'LoginForm mocked as a stub rendering <div data-testid="login-form-stub" />.',
                'const page = await LoginPage();',
                'render(page)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByTestId("login-form-stub") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(loginPageDescriptor, path.join(outDir, 'page-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});