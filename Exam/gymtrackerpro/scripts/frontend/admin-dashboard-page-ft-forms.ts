/**
 * admin-dashboard-page-ft-forms.ts
 *
 * FT form descriptors for AdminDashboardPage.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', 'admin', 'dashboard', '__tests__', 'ft', 'page',
);

const adminDashboardPageDescriptor: FtDescriptor = {
    componentName: 'AdminDashboardPage',
    reqId: 'FT-20',
    statement: 'AdminDashboardPage - fetches the current session and a one-item member page, then renders a personalized admin dashboard header and a total members stat card.',
    props: 'None - the page accepts no props and reads no URL params.',
    precondition: [
        'Mock @/lib/session: getSession is a jest.fn().',
        'Mock @/lib/controller/user-controller: listMembers is a jest.fn().',
        'No router mock required - the page itself performs no navigation.',
        'No providers required - the page uses no React context.',
        'Page is an async server component; render via: render(await AdminDashboardPage()).',
    ].join('\n'),
    renderOutput: [
        'An <h1> with text "Welcome, {session.fullName}" when session.fullName is defined.',
        'An <h1> with text "Welcome, Admin" when session.fullName is null.',
        'A description paragraph with text "Admin dashboard overview".',
        'A StatCard showing title "Total Members", the resolved total member count, and description "Registered gym members".',
    ].join('\n'),
    postcondition: [
        'getSession() is called once before rendering the personalized heading.',
        'listMembers({ page: 1, pageSize: 1 }) is called once to retrieve the total member count.',
        'When listMembers returns { success: false }, the displayed total falls back to 0.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest app/admin/dashboard/__tests__/ft/page/page.test.tsx --selectProjects jsdom',
        'AdminDashboardPage is an async server component - must be awaited before passing to render(): render(await AdminDashboardPage()).',
        'This page test covers only page-owned data fetching and prop threading into the visible dashboard output.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders a personalized welcome heading and dashboard description when the session has a fullName.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ fullName: "John Smith" }).',
                'mockListMembers.mockResolvedValueOnce({ success: true, data: { items: [], total: 12 } }).',
                'render(await AdminDashboardPage())',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("heading", {name: "Welcome, John Smith"}) is in the document.',
                'getByText("Admin dashboard overview") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders the fallback "Welcome, Admin" heading when session.fullName is null.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ fullName: null }).',
                'mockListMembers.mockResolvedValueOnce({ success: true, data: { items: [], total: 4 } }).',
                'render(await AdminDashboardPage())',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("heading", {name: "Welcome, Admin"}) is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Displays the total member count returned by listMembers in the Total Members stat card.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ fullName: "Admin User" }).',
                'mockListMembers.mockResolvedValueOnce({ success: true, data: { items: [], total: 27 } }).',
                'render(await AdminDashboardPage())',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("Total Members") is in the document.',
                'getByText("27") is in the document.',
                'getByText("Registered gym members") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Displays 0 as the total member count when listMembers returns a failed action result.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ fullName: "Admin User" }).',
                'mockListMembers.mockResolvedValueOnce({ success: false, message: "Could not load members" }).',
                'render(await AdminDashboardPage())',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("Total Members") is in the document.',
                'getByText("0") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Requests exactly one member from the first page so the page can use the returned total count.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ fullName: "Admin User" }).',
                'mockListMembers.mockResolvedValueOnce({ success: true, data: { items: [], total: 8 } }).',
                'render(await AdminDashboardPage())',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'mockGetSession has been called once.',
                'mockListMembers has been called once with { page: 1, pageSize: 1 }.',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(adminDashboardPageDescriptor, path.join(outDir, 'page-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
