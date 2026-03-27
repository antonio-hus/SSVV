import {getIronSession, IronSession} from 'iron-session';
import {cookies} from 'next/headers';
import {SessionData} from '@/lib/domain/session';

/**
 * Configuration options for Iron Session.
 *
 * - `password`: Session encryption key from environment variables.
 * - `cookieName`: Name of the session cookie.
 * - `cookieOptions`:
 *    - `secure`: True in production to enforce HTTPS-only cookies.
 *    - `httpOnly`: True to prevent client-side access to cookies.
 */
export const sessionOptions = {
    password: process.env.IRON_SESSION_SECRET!,
    cookieName: 'gymtracker-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    },
};

/**
 * Retrieves the current session from incoming request cookies.
 *
 * @async
 * @returns {Promise<IronSession<SessionData>>} The IronSession containing user session data.
 */
export const getSession = async (): Promise<IronSession<SessionData>> => {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
};