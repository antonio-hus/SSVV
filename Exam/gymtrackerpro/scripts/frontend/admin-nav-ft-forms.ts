/**
 * admin-nav-ft-forms.ts
 *
 * FT form descriptors for AdminNav.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', 'admin', '_components', '__tests__', 'ft', 'admin-nav',
);

const adminNavDescriptor: FtDescriptor = {
    componentName: 'AdminNav',
    reqId: 'FT-17',
    statement: 'AdminNav - renders the shared SidebarNav with the four admin nav items (Dashboard, Members, Exercises, Sessions) and the accessible label "Admin Navigation".',
    props: 'None - the component accepts no props; NAV_ITEMS and ariaLabel are hardcoded constants.',
    precondition: [
        'Mock next/navigation: usePathname returns "/some/other/path".',
        'No server action mocks required.',
    ].join('\n'),
    renderOutput: [
        'A <nav> element with aria-label "Admin Navigation".',
        'Four <a> link elements with labels: "Dashboard", "Members", "Exercises", "Sessions".',
        'hrefs: "/admin/dashboard", "/admin/members", "/admin/exercises", "/admin/workout-sessions".',
    ].join('\n'),
    postcondition: 'None - the component is purely presentational.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest admin-nav.test.tsx',
        'usePathname is mocked to a non-matching path to keep active-state logic neutral as this behaviour is verified in SidebarNav\'s own test file.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders a nav landmark with the accessible label "Admin Navigation".',
            arrange: [
                'mockUsePathname returns "/some/other/path".',
                'render(<AdminNav />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("navigation", {name: "Admin Navigation"}) is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders all four admin nav links with correct labels and hrefs.',
            arrange: [
                'mockUsePathname returns "/some/other/path".',
                'render(<AdminNav />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: "Dashboard"}) has href "/admin/dashboard".',
                'getByRole("link", {name: "Members"}) has href "/admin/members".',
                'getByRole("link", {name: "Exercises"}) has href "/admin/exercises".',
                'getByRole("link", {name: "Sessions"}) has href "/admin/workout-sessions".',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(adminNavDescriptor, path.join(outDir, 'admin-nav-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});