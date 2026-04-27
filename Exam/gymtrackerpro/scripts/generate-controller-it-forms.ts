import * as path from 'path';
import {writeIt, ItDescriptor} from './generate-it-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib', 'controller', '__tests__', 'it');

const SHARED_REMARKS = [
    'Run:  npm run test:integration',
    'Tear down:  npm run test:integration:down',
    'All service and repository singletons are instantiated and accessed via the lib/di module, which configures them to use the shared PrismaClient instance.',
];

// ── Descriptors ───────────────────────────────────────────────────────────────

const authControllerLoginActionIt: ItDescriptor = {
    reqId: 'CTRL-1',
    statement: 'login(data: LoginUserInput): Promise<ActionResult<SessionData>> - validates input, delegates to AuthService, writes the returned session data into the session store, and returns an ActionResult.',
    data: 'data: LoginUserInput  { email: string, password: string }',
    precondition: 'Database may or may not contain a user matching the supplied email. Session store is empty.',
    results: 'ActionResult<SessionData> - { success: true, data: SessionData } on success. { success: false, message, errors? } on validation failure or any thrown error.',
    postcondition: 'No database rows are inserted, updated, or deleted. On success, the session is populated with all SessionData fields and saved. On any error path the session is not written.',
    remarks: [
        ...SHARED_REMARKS,
        'getSession() is mocked as it calls cookies() from next/headers which is a Next.js request-context primitive unavailable in Jest; the mock returns a controlled session object in its place.'
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'export async function login(data: LoginUserInput): Promise<ActionResult<SessionData>> {',
        '    const result = loginUserSchema.safeParse(data);',
        '    if (!result.success) {',
        "        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};",
        '    }',
        '    try {',
        '        const sessionData = await authService.login(result.data);',
        '        const session = await getSession();',
        '        session.userId   = sessionData.userId;',
        '        session.email    = sessionData.email;',
        '        session.fullName = sessionData.fullName;',
        '        session.role     = sessionData.role;',
        '        session.memberId = sessionData.memberId;',
        '        session.adminId  = sessionData.adminId;',
        '        session.isActive = sessionData.isActive;',
        '        await session.save();',
        '        return {success: true, data: sessionData};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        "        return {success: false, message: 'An unexpected error occurred'};",
        '    }',
        '}',
    ],

    moduleDot: `digraph loginAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  action [label="login()\\nserver action"];

  subgraph cluster_zod {
    label="zod";
    safeParse [label="loginUserSchema\\n.safeParse()"];
  }

  subgraph cluster_authservice {
    label="AuthService";
    authLogin [label="authService\\n.login()"];
  }

  subgraph cluster_userrepo {
    label="UserRepository";
    findByEmail [label="userRepository\\n.findByEmail()"];
  }

  subgraph cluster_prisma {
    label="PrismaClient";
    findUnique [label="user\\n.findUnique()\\n{ include: member, admin }"];
  }

  subgraph cluster_bcrypt {
    label="bcryptjs";
    compare [label="bcrypt\\n.compare()"];
  }

  subgraph cluster_session {
    label="lib/session (mocked)";
    getSession  [label="getSession()"];
    sessionSave [label="session\\n.save()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
  }

  action      -> safeParse    [label="validate input"];
  action      -> authLogin    [label="verify credentials"];
  authLogin   -> findByEmail  [label="look up by email"];
  findByEmail -> findUnique   [label="query with relations"];
  authLogin   -> compare      [label="verify password"];
  action      -> getSession   [label="open session (mocked)"];
  getSession  -> sessionSave  [label="persist fields"];
  action      -> AppError     [label="catches (auth error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'Member user seeded via userRepository.createMember (from lib/di).\nmemberInput: { email: "member@gym.test", fullName: "Test Member", phone: "+40700000000", dateOfBirth: "1990-01-01", password: "ValidPass123!", membershipStart: "2024-01-01" }.\nmockSession satisfies Partial<SessionData> with save() and destroy() jest.fn().\nInput: { email: "member@gym.test", password: "ValidPass123!" }',
            act: 'login(input)',
            expectedReturn: '{ success: true, data: { userId, email, fullName, role: MEMBER, memberId, isActive: true, adminId: undefined } }',
            expectedDbState: 'No change. Session fields match SessionData and save() called once.',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'Empty database.\nInput: { email: "not-an-email", password: "weak" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Validation failed", errors: { email: [...], password: [...] } }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
        {
            noTc: '3',
            arrange: 'Empty database.\nInput: { email: "ghost@gym.test", password: "ValidPass123!" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Invalid email or password" }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
        {
            noTc: '4',
            arrange: 'Member user seeded via userRepository.createMember (from lib/di) with password "ValidPass123!".\nInput: { email: "member@gym.test", password: "WrongPass999!" }',
            act: 'login(input)',
            expectedReturn: '{ success: false, message: "Invalid email or password" }',
            expectedDbState: 'No change. Session not written.',
            actualResult: 'Passed',
        },
    ],
};

// ── logout ────────────────────────────────────────────────────────────────────

const authControllerLogoutActionIt: ItDescriptor = {
    reqId: 'CTRL-2',
    statement: 'logout(): Promise<ActionResult<void>> - destroys the current session and returns a success result.',
    data: 'none',
    precondition: 'A session exists and can be retrieved via getSession().',
    results: 'ActionResult<void> - { success: true, data: undefined } on success. { success: false, message } if session destruction throws.',
    postcondition: 'No database rows are inserted, updated, or deleted. On success, the session is destroyed.',
    remarks: [
        ...SHARED_REMARKS,
        'getSession() is mocked as it calls cookies() from next/headers which is a Next.js request-context primitive unavailable in Jest; the mock returns a controlled session object in its place.'
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0,

    sourceCode: [
        'export async function logout(): Promise<ActionResult<void>> {',
        '    try {',
        '        const session = await getSession();',
        '        await session.destroy();',
        '        return {success: true, data: undefined};',
        '    } catch (error) {',
        '        if (error instanceof AppError) {',
        '            return {success: false, message: error.message};',
        '        }',
        "        return {success: false, message: 'An unexpected error occurred'};",
        '    }',
        '}',
    ],

    moduleDot: `digraph logoutAction {
  rankdir=LR;
  node [fontname="Helvetica", fontsize=10, shape=box, margin="0.2,0.1"];
  edge [fontname="Helvetica", fontsize=9];

  action [label="logout()\\nserver action"];

  subgraph cluster_session {
    label="lib/session (mocked)";
    getSession     [label="getSession()"];
    sessionDestroy [label="session\\n.destroy()"];
  }

  subgraph cluster_errors {
    label="domain/errors";
    AppError;
  }

  action     -> getSession     [label="open session (mocked)"];
  getSession -> sessionDestroy [label="destroy"];
  action     -> AppError       [label="catches (session error)", style=dashed];
}`,

    tcRows: [
        {
            noTc: '1',
            arrange: 'mockSession satisfies Partial<SessionData> with destroy() resolving successfully.',
            act: 'logout()',
            expectedReturn: '{ success: true, data: undefined }',
            expectedDbState: 'No change. session.destroy() called once.',
            actualResult: 'Passed',
        },
        {
            noTc: '2',
            arrange: 'mockSession satisfies Partial<SessionData> with destroy() throwing a generic Error("Storage failure").',
            act: 'logout()',
            expectedReturn: '{ success: false, message: "An unexpected error occurred" }',
            expectedDbState: 'No change.',
            actualResult: 'Passed',
        },
    ],
};

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {

    const AUTH_CTRL = path.join(BASE, 'auth-controller');
    await writeIt(authControllerLoginActionIt, path.join(AUTH_CTRL, 'login-it-form.xlsx'));
    await writeIt(authControllerLogoutActionIt, path.join(AUTH_CTRL, 'logout-it-form.xlsx'));

    console.log('Done.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});