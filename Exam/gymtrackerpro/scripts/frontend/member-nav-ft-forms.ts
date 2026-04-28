/**
 * member-nav-ft-forms.ts
 *
 * FT form descriptors for MemberNav.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', 'member', '_components', '__tests__', 'ft', 'member-nav',
);

const memberNavDescriptor: FtDescriptor = {
    componentName: 'MemberNav',
    reqId: 'FT-18',
    statement: 'MemberNav - renders the shared SidebarNav with the four member nav items (Dashboard, My Workout Sessions, My Report, Profile) and the accessible label "Member Navigation".',
    props: 'None - the component accepts no props; NAV_ITEMS and ariaLabel are hardcoded constants.',
    precondition: [
        'Mock next/navigation: usePathname returns "/some/other/path".',
        'No server action mocks required.',
    ].join('\n'),
    renderOutput: [
        'A <nav> element with aria-label "Member Navigation".',
        'Four <a> link elements with labels: "Dashboard", "My Workout Sessions", "My Report", "Profile".',
        'hrefs: "/member/dashboard", "/member/workout-sessions", "/member/report", "/member/profile".',
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
        'Run: npx jest member-nav.test.tsx',
        'usePathname is mocked to a non-matching path to keep active-state logic neutral as this behaviour is verified in SidebarNav\'s own test file.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders a nav landmark with the accessible label "Member Navigation".',
            arrange: [
                'mockUsePathname returns "/some/other/path".',
                'render(<MemberNav />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("navigation", {name: "Member Navigation"}) is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders all four member nav links with correct labels and hrefs.',
            arrange: [
                'mockUsePathname returns "/some/other/path".',
                'render(<MemberNav />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: "Dashboard"}) has href "/member/dashboard".',
                'getByRole("link", {name: "My Workout Sessions"}) has href "/member/workout-sessions".',
                'getByRole("link", {name: "My Report"}) has href "/member/report".',
                'getByRole("link", {name: "Profile"}) has href "/member/profile".',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(memberNavDescriptor, path.join(outDir, 'member-nav-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});