/**
 * admin-layout-ft-forms.ts
 *
 * FT form descriptors for AdminLayout.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', 'admin', '__tests__', 'ft', 'layout',
);

const adminLayoutDescriptor: FtDescriptor = {
    componentName: 'AdminLayout',
    reqId: 'FT-19',
    statement: 'AdminLayout - guards the admin section by verifying the session contains a userId and the ADMIN role, redirecting to /login on failure, and rendering the branded sidebar with AdminNav, a user avatar, and LogoutButton alongside the page children on success.',
    props: 'children: React.ReactNode - the nested page content rendered inside the main element.',
    precondition: [
        'Mock next/navigation: redirect is a jest.fn() that throws an error containing the target URL, preventing further execution.',
        'Mock next/navigation: usePathname returns "/admin/dashboard".',
        'Mock next/navigation: useRouter returns { push: jest.fn() }.',
        'Mock @/lib/session: getSession is a jest.fn().',
        'Mock @/lib/controller/auth-controller: logout is a jest.fn().',
        'children is supplied as <div data-testid="page-content" />.',
    ].join('\n'),
    renderOutput: [
        'An <aside> element containing the Dumbbell SVG icon, "GymTracker Pro" brand name, and "Admin Panel" subtitle.',
        'AdminNav rendered inside the sidebar.',
        'A user avatar displaying the first letter of session.fullName (or "A" as fallback).',
        'The fullName (or "Admin" as fallback) displayed beside the avatar.',
        'A LogoutButton rendered inside the sidebar.',
        'A <main> element containing the children.',
    ].join('\n'),
    postcondition: [
        'redirect("/login") is called when the session has no userId or the role is not ADMIN.',
        'No redirect is called for a valid ADMIN session.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest layout.test.tsx --testPathPattern=app/admin',
        'AdminLayout is an async server component; invoke as render(await AdminLayout({children})).',
        'redirect() in Next.js terminates execution by throwing internally; the mock must replicate this behaviour to prevent the component rendering past the guard.',
        'usePathname and useRouter are mocked to satisfy AdminNav and LogoutButton respectively.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Redirects to /login when the session contains no userId.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: null, role: null, fullName: null }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await AdminLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/login".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Redirects to /login when the session role is not ADMIN.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, fullName: "Jane Doe" }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await AdminLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/login".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Renders the full admin layout including sidebar, nav, and children for a valid ADMIN session.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.ADMIN, fullName: "John Smith" }).',
                'mockLogout.mockResolvedValueOnce(undefined).',
                'const children = <div data-testid="page-content" />',
                'render(await AdminLayout({ children }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("navigation", {name: "Admin Navigation"}) is in the document.',
                'getByRole("button", {name: "Sign out"}) is in the document.',
                'getByTestId("page-content") is in the document.',
                'mockRedirect has not been called.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Displays the first letter of session.fullName as the avatar initial and the full name beside it.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.ADMIN, fullName: "John Smith" }).',
                'render(await AdminLayout({ children: <div /> }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("J") is in the document (avatar initial).',
                'getByText("John Smith") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Displays the fallback avatar letter "A" and the label "Admin" when session.fullName is null.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.ADMIN, fullName: null }).',
                'render(await AdminLayout({ children: <div /> }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("A") is in the document (fallback avatar initial).',
                'getByText("Admin") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(adminLayoutDescriptor, path.join(outDir, 'layout-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});