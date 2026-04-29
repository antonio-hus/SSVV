/**
 * proxy-ft-forms.ts
 *
 * FT form descriptor for the route protection proxy.
 * Run: npx tsx scripts/frontend/proxy-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', '__tests__', 'ft', 'proxy');

const tc = (noTc: string, description: string, arrange: string, act: string, expectedOutput: string): FtTcRow => ({
    noTc,
    description,
    arrange,
    act,
    expectedOutput,
    actualResult: 'Passed',
});

const proxyDescriptor: FtDescriptor = {
    componentName: 'proxy',
    reqId: 'FT-60',
    statement: 'proxy - protects admin and member routes by checking Iron Session authentication, role, and member active status before allowing or redirecting requests.',
    props: 'request: NextRequest - incoming request with nextUrl.pathname and url used to determine the protected route and redirect targets.',
    precondition: 'Mock iron-session getIronSession. Mock next/server NextResponse.next and NextResponse.redirect. Mock generated Prisma Role enum and sessionOptions.',
    renderOutput: 'No DOM output - returns a NextResponse-like object with status 200 for allowed requests or status 307 with a location header for redirects.',
    postcondition: 'getIronSession(request, response, sessionOptions) is called for every request. Protected routes redirect to /login when unauthenticated and /unauthorized when role or active-status checks fail.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest __tests__/ft/proxy/proxy.test.ts --selectProjects jsdom',
        'Although proxy has no rendered DOM, it is included in FT because it protects frontend route access. NextResponse is mocked so the suite can run in the jsdom FT project.',
        'Suite is kept in a single main describe block and covers matcher config plus every route/auth/role/active-status decision branch.',
    ],
    tcRows: [
        tc('TC-01', 'Exports matcher config for admin and member routes.', 'Import config from proxy.ts.', 'No interaction - inspect config.', 'config equals {matcher:["/admin/:path*","/member/:path*"]}.'),
        tc('TC-02', 'Allows an unprotected route after reading the session.', 'Mock getIronSession to resolve an empty session; request pathname /login.', 'await proxy(request).', 'Response status is 200, location header is null, and getIronSession is called with request, response, and sessionOptions.'),
        tc('TC-03', 'Redirects unauthenticated admin route requests to login.', 'Mock getIronSession to resolve an empty session; request pathname /admin.', 'await proxy(request).', 'Response status is 307 and location is https://gymtracker.test/login.'),
        tc('TC-04', 'Redirects logged-in non-admin users away from admin routes.', 'Mock getIronSession to resolve userId user-1 and role MEMBER; request pathname /admin/members.', 'await proxy(request).', 'Response status is 307 and location is https://gymtracker.test/unauthorized.'),
        tc('TC-05', 'Allows logged-in admin users on admin routes.', 'Mock getIronSession to resolve userId user-1 and role ADMIN; request pathname /admin/dashboard.', 'await proxy(request).', 'Response status is 200 and location header is null.'),
        tc('TC-06', 'Redirects unauthenticated member route requests to login.', 'Mock getIronSession to resolve an empty session; request pathname /member.', 'await proxy(request).', 'Response status is 307 and location is https://gymtracker.test/login.'),
        tc('TC-07', 'Redirects logged-in non-member users away from member routes.', 'Mock getIronSession to resolve userId user-1 and role ADMIN; request pathname /member/dashboard.', 'await proxy(request).', 'Response status is 307 and location is https://gymtracker.test/unauthorized.'),
        tc('TC-08', 'Redirects inactive members away from member routes.', 'Mock getIronSession to resolve userId user-1, role MEMBER, and isActive false; request pathname /member/profile.', 'await proxy(request).', 'Response status is 307 and location is https://gymtracker.test/unauthorized.'),
        tc('TC-09', 'Allows active members on member routes.', 'Mock getIronSession to resolve userId user-1, role MEMBER, and isActive true; request pathname /member/report.', 'await proxy(request).', 'Response status is 200 and location header is null.'),
    ],
};

async function main(): Promise<void> {
    await writeFt(proxyDescriptor, path.join(outDir, 'proxy-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
