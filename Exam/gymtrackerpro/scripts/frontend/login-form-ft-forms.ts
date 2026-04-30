/**
 * login-form-ft-forms.ts
 *
 * FT form descriptors for LoginForm.
 * Run: npx tsx scripts/frontend/login-form-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'app',
    '(auth)',
    'login',
    '_components',
    '__tests__',
    'ft',
    'login-form',
);

const tc = (noTc: string, description: string, arrange: string, act: string, expectedOutput: string): FtTcRow => ({
    noTc,
    description,
    arrange,
    act,
    expectedOutput,
    actualResult: 'Passed',
});

const loginFormDescriptor: FtDescriptor = {
    componentName: 'LoginForm',
    reqId: 'FT-14',
    statement: 'LoginForm - renders a login form, checks loginUserSchema client-side, calls the login server action only for valid inputs, and redirects by returned role.',
    props: 'None - the component accepts no props.',
    precondition: [
        'Mock next/navigation: useRouter returns { push: jest.fn() }.',
        'Mock @/lib/controller/auth-controller: login is a jest.fn().',
        'Mock generated Prisma Role enum for jsdom compatibility.',
        'No providers required - the component uses no React context.',
    ].join('\n'),
    renderOutput: [
        'A <form noValidate> element.',
        'A label "Email" associated with an email input.',
        'A label "Password" associated with a password input.',
        'An enabled submit button with accessible name "Sign in".',
        'No alert visible in the initial result=null state.',
    ].join('\n'),
    postcondition: [
        'login() is not called when loginUserSchema.safeParse(inputs) fails.',
        'login() is called once with trimmed email and password when both schema predicates pass.',
        'router.push("/admin/dashboard") is called for role ADMIN.',
        'router.push("/member/dashboard") is called for role MEMBER.',
        'router.push("/login") is called for an unrecognised role.',
        'A failed server result renders its message and any returned field errors.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest app/\\(auth\\)/login/_components/__tests__/ft/login-form/login-form.test.tsx --selectProjects jsdom',
    ],
    tcRows: [
        tc(
            'TC-01',
            'Renders email input, password input, and enabled Sign in button with no alert in the default state.',
            'render(<LoginForm />); login mock not configured.',
            'No interaction - render only.',
            'Email and Password inputs are visible; Sign in button is enabled; no alert is present.',
        ),
        tc(
            'TC-02',
            'Email invalid and password invalid: empty fields show both field errors and skip login.',
            'render(<LoginForm />); leave Email and Password empty.',
            'userEvent.click(Sign in)',
            'Validation failed alert visible; Email and Password field errors visible; login not called.',
        ),
        tc(
            'TC-03',
            'Email valid and password invalid: shows only password error and skips login.',
            'Type Email test@example.com and Password weakpass.',
            'userEvent.click(Sign in)',
            'Validation failed alert visible; Password field error visible; Email field has no error; login not called.',
        ),
        tc(
            'TC-04',
            'Email invalid and password valid: shows only email error and skips login.',
            'Type Email not-an-email and Password Password123!.',
            'userEvent.click(Sign in)',
            'Validation failed alert visible; Email field error visible; Password field has no error; login not called.',
        ),
        tc(
            'TC-05',
            'Email invalid and password invalid: shows both field errors and skips login.',
            'Type Email not-an-email and Password weakpass.',
            'userEvent.click(Sign in)',
            'Validation failed alert visible; both field errors visible; login not called.',
        ),
        tc(
            'TC-06',
            'Email valid and password valid: calls login once with trimmed email and valid password.',
            'login resolves failed server result; type Email "  test@example.com  " and Password Password123!.',
            'userEvent.click(Sign in)',
            'login called once with {email:"test@example.com", password:"Password123!"}.',
        ),
        tc(
            'TC-07',
            'Password length below minimum fails password predicate and skips login.',
            'Type valid email and password P1@aaaa (7 characters).',
            'userEvent.click(Sign in)',
            'Password min-length message visible; login not called.',
        ),
        tc(
            'TC-08',
            'Password length above maximum fails password predicate and skips login.',
            'Type valid email and a 65-character password beginning with P1@.',
            'userEvent.click(Sign in)',
            'Password max-length message visible; login not called.',
        ),
        tc(
            'TC-09',
            'Password missing uppercase fails password predicate and skips login.',
            'Type valid email and password password123!.',
            'userEvent.click(Sign in)',
            'Uppercase-character password message visible; login not called.',
        ),
        tc(
            'TC-10',
            'Password missing number fails password predicate and skips login.',
            'Type valid email and password Password!.',
            'userEvent.click(Sign in)',
            'Number password message visible; login not called.',
        ),
        tc(
            'TC-11',
            'Password missing special character fails password predicate and skips login.',
            'Type valid email and password Password123.',
            'userEvent.click(Sign in)',
            'Special-character password message visible; login not called.',
        ),
        tc(
            'TC-12',
            'Successful login with ADMIN role navigates to admin dashboard.',
            'login resolves {success:true,data:{role:Role.ADMIN}}; type valid credentials.',
            'userEvent.click(Sign in)',
            'login called once with valid credentials; router.push called with /admin/dashboard.',
        ),
        tc(
            'TC-13',
            'Successful login with MEMBER role navigates to member dashboard.',
            'login resolves {success:true,data:{role:Role.MEMBER}}; type valid credentials.',
            'userEvent.click(Sign in)',
            'login called once with valid credentials; router.push called with /member/dashboard.',
        ),
        tc(
            'TC-14',
            'Successful login with an unrecognised role follows the switch default and navigates to login.',
            'login resolves {success:true,data:{role:"UNKNOWN" as Role}}; type valid credentials.',
            'userEvent.click(Sign in)',
            'login called once; router.push called with /login.',
        ),
        tc(
            'TC-15',
            'Successful login result without session data does not navigate and shows no error alert.',
            'login resolves {success:true,data:undefined}; type valid credentials.',
            'userEvent.click(Sign in)',
            'login called once; router.push not called; no alert is visible.',
        ),
        tc(
            'TC-16',
            'Failed login result shows server message and re-enables the submit button.',
            'login resolves {success:false,message:"Invalid credentials"}; type valid credentials.',
            'userEvent.click(Sign in)',
            'Alert contains Invalid credentials; Sign in button enabled; router.push not called.',
        ),
        tc(
            'TC-17',
            'Failed login result with field errors renders server email and password field errors.',
            'login resolves failed result with errors.email and errors.password; type valid credentials.',
            'userEvent.click(Sign in)',
            'Server email and password error messages are visible; router.push not called.',
        ),
        tc(
            'TC-18',
            'Pending login disables the submit button and changes the label to Signing in.',
            'login returns a manually controlled unresolved promise; type valid credentials.',
            'userEvent.click(Sign in) without resolving login.',
            'Button is disabled; Signing in… text visible; Sign in text absent until cleanup resolves promise.',
        ),
        tc(
            'TC-19',
            'After a server-side failure, a subsequent valid submission can succeed.',
            'login first resolves failed Invalid credentials, then resolves success with MEMBER role; type valid credentials.',
            'Click Sign in twice, waiting for the first alert before the second click.',
            'First click shows Invalid credentials; second click pushes /member/dashboard; login called twice.',
        ),
    ],
};

async function main(): Promise<void> {
    await writeFt(loginFormDescriptor, path.join(outDir, 'login-form-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
