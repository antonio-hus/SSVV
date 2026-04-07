import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {getIronSession} from 'iron-session';
import type {SessionData} from '@/lib/domain/session';
import {sessionOptions} from '@/lib/session';
import {Role} from '@/lib/domain/user';

/**
 * Middleware to protect routes based on authentication and role.
 *
 * - Redirects to `/unauthorized` if user is logged in but does not have the required role.
 * - Redirects to `/login` if user is not logged in.
 *
 * @async
 * @param {NextRequest} request - Incoming Next.js request.
 * @returns {Promise<NextResponse>} NextResponse allowing or redirecting the request.
 */
export const proxy = async (request: NextRequest): Promise<NextResponse> => {
    const {pathname} = request.nextUrl;
    const response = NextResponse.next();

    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const isLoggedIn = !!session.userId;
    const role = session.role;

    // Admin route protection
    if (pathname.startsWith('/admin')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (role !== Role.ADMIN) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Member route protection
    if (pathname.startsWith('/member')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (role !== Role.MEMBER) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        if (session.isActive === false) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    return response;
};

/**
 * Configures which paths the middleware applies to.
 */
export const config = {
    matcher: ['/admin/:path*', '/member/:path*'],
};