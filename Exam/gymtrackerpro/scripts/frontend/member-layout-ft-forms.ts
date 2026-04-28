/**
 * member-layout-ft-forms.ts
 *
 * FT form descriptors for MemberLayout.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname, '..', '..', 'app', 'member', '__tests__', 'ft', 'layout',
);

const memberLayoutDescriptor: FtDescriptor = {
    componentName: 'MemberLayout',
    reqId: 'FT-20',
    statement: 'MemberLayout - guards the member section by verifying the session contains a userId and the MEMBER role and that the resolved member record is active, redirecting to /login or /unauthorized on failure, and rendering the branded sidebar with MemberNav, a user avatar, and LogoutButton alongside the page children on success.',
    props: 'children: React.ReactNode - the nested page content rendered inside the main element.',
    precondition: [
        'Mock next/navigation: redirect is a jest.fn() that throws an error containing the target URL, preventing further execution.',
        'Mock next/navigation: usePathname returns "/member/dashboard".',
        'Mock next/navigation: useRouter returns { push: jest.fn() }.',
        'Mock @/lib/session: getSession is a jest.fn().',
        'Mock @/lib/controller/user-controller: getMember is a jest.fn().',
        'Mock @/lib/controller/auth-controller: logout is a jest.fn().',
        'children is supplied as <div data-testid="page-content" />.',
    ].join('\n'),
    renderOutput: [
        'An <aside> element containing the Dumbbell SVG icon, "GymTracker Pro" brand name, and "Member Portal" subtitle.',
        'MemberNav rendered inside the sidebar.',
        'A user avatar displaying the first letter of session.fullName (or "M" as fallback).',
        'The fullName (or "Member" as fallback) displayed beside the avatar.',
        'A LogoutButton rendered inside the sidebar.',
        'A <main> element containing the children.',
    ].join('\n'),
    postcondition: [
        'redirect("/login") is called when the session has no userId or the role is not MEMBER.',
        'redirect("/unauthorized") is called when getMember returns success: false or the member isActive is false.',
        'No redirect is called for a valid MEMBER session with an active member record.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest layout.test.tsx --testPathPattern=app/member',
        'MemberLayout is an async server component; invoke as render(await MemberLayout({children})).',
        'redirect() in Next.js terminates execution by throwing internally; the mock must replicate this behaviour to prevent the component rendering past the guard.',
        'MemberLayout has two independent redirect guards; each guard has its own set of test cases.',
        'usePathname and useRouter are mocked to satisfy MemberNav and LogoutButton respectively.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Redirects to /login when the session contains no userId.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: null, role: null, fullName: null }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await MemberLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/login".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Redirects to /login when the session role is not MEMBER.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.ADMIN, fullName: "Jane Doe" }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await MemberLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/login".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Redirects to /unauthorized when getMember returns success: false.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, memberId: "m-1", fullName: "Jane Doe" }).',
                'mockGetMember.mockResolvedValueOnce({ success: false, message: "Not found" }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await MemberLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/unauthorized".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Redirects to /unauthorized when the member record exists but isActive is false.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, memberId: "m-1", fullName: "Jane Doe" }).',
                'mockGetMember.mockResolvedValueOnce({ success: true, data: { isActive: false } }).',
                'const children = <div data-testid="page-content" />',
            ].join('\n'),
            act: 'await MemberLayout({ children }) - expect the returned promise to reject.',
            expectedOutput: [
                'mockRedirect has been called once with "/unauthorized".',
                'The promise rejects (redirect throws).',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Renders the full member layout including sidebar, nav, and children for a valid MEMBER session with an active member record.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, memberId: "m-1", fullName: "Jane Doe" }).',
                'mockGetMember.mockResolvedValueOnce({ success: true, data: { isActive: true } }).',
                'mockLogout.mockResolvedValueOnce(undefined).',
                'const children = <div data-testid="page-content" />',
                'render(await MemberLayout({ children }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("navigation", {name: "Member Navigation"}) is in the document.',
                'getByRole("button", {name: "Sign out"}) is in the document.',
                'getByTestId("page-content") is in the document.',
                'mockRedirect has not been called.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-06',
            description: 'Displays the first letter of session.fullName as the avatar initial and the full name beside it.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, memberId: "m-1", fullName: "Jane Doe" }).',
                'mockGetMember.mockResolvedValueOnce({ success: true, data: { isActive: true } }).',
                'render(await MemberLayout({ children: <div /> }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("J") is in the document (avatar initial).',
                'getByText("Jane Doe") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-07',
            description: 'Displays the fallback avatar letter "M" and the label "Member" when session.fullName is null.',
            arrange: [
                'mockGetSession.mockResolvedValueOnce({ userId: "u-1", role: Role.MEMBER, memberId: "m-1", fullName: null }).',
                'mockGetMember.mockResolvedValueOnce({ success: true, data: { isActive: true } }).',
                'render(await MemberLayout({ children: <div /> }))',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByText("M") is in the document (fallback avatar initial).',
                'getByText("Member") is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(memberLayoutDescriptor, path.join(outDir, 'layout-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});