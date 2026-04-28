/**
 * logout-button-ft-forms.ts
 *
 * FT form descriptors for LogoutButton.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'components', 'auth', '__tests__', 'ft', 'logout-button');

const logoutButtonDescriptor: FtDescriptor = {
    componentName: 'LogoutButton',
    reqId: 'FT-01',
    statement: 'LogoutButton - renders a ghost sign-out button that calls the logout server action and navigates to /login, showing a disabled loading state while the action is in flight.',
    props: 'className?: string  - optional class overrides merged onto the inner Button element via cn()  [default: undefined]',
    precondition: [
        'Mock next/navigation: useRouter returns { push: jest.fn() }.',
        'Mock @/lib/controller/auth-controller: logout is a jest.fn().',
        'No providers required - component uses no React context.',
    ].join('\n'),
    renderOutput: [
        'A <button> element with role="button".',
        'Accessible name "Sign out" (from the inner <span>).',
        'Button is enabled (not disabled).',
        'A LogOut SVG icon is present inside the button.',
    ].join('\n'),
    postcondition: [
        'logout() is called once when the button is clicked.',
        'router.push("/login") is called once after logout resolves or rejects.',
        'router.push("/login") is called even when logout throws (finally block).',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest logout-button.test.tsx',
        'isPending state relies on React 19 async-transition support - startTransition(async fn) keeps isPending=true until the promise resolves.',
        'The <span> containing the text is visually hidden on mobile (hidden md:inline) but present in the DOM; RTL queries work against the DOM, not visual state.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders an enabled button with "Sign out" text and a LogOut icon in the default idle state.',
            arrange: 'mockLogout not configured (not called).\nrender(<LogoutButton />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("button", {name: "Sign out"}) is in the document and is not disabled.\nA <svg> element is present inside the button.',
        },
        {
            noTc: 'TC-02',
            description: 'Applies an optional className prop to the underlying button element alongside the default classes.',
            arrange: 'render(<LogoutButton className="custom-class" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'The button element has class "custom-class".',
        },
        {
            noTc: 'TC-03',
            description: 'Calls the logout server action once when the button is clicked.',
            arrange: 'mockLogout.mockResolvedValueOnce(undefined).\nrender(<LogoutButton />)',
            act: 'userEvent.click(getByRole("button", {name: "Sign out"}))',
            expectedOutput: 'mockLogout has been called exactly once.',
        },
        {
            noTc: 'TC-04',
            description: 'Navigates to /login after logout resolves successfully.',
            arrange: 'mockLogout.mockResolvedValueOnce(undefined).\nrender(<LogoutButton />)',
            act: 'userEvent.click(button)',
            expectedOutput: 'mockPush has been called once with "/login".',
        },
        {
            noTc: 'TC-05',
            description: 'Navigates to /login even when logout throws, because router.push is in the finally block.',
            arrange: 'mockLogout.mockRejectedValueOnce(new Error("session expired")).\nrender(<LogoutButton />)',
            act: 'userEvent.click(button)',
            expectedOutput: 'mockPush has been called once with "/login" despite the rejection.',
        },
        {
            noTc: 'TC-06',
            description: 'Disables the button and shows "Signing out..." while the logout action is in flight.',
            arrange: 'mockLogout returns a manually-controlled promise that never resolves during the assertion.\nrender(<LogoutButton />)',
            act: 'userEvent.click(button) - do not await resolution of the logout promise.',
            expectedOutput: 'Button is disabled.\nText "Signing out..." is in the document.\nText "Sign out" is not in the document.',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(logoutButtonDescriptor, path.join(outDir, 'logout-button-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});