import {Role} from '@/lib/domain/user';

/**
 * Authenticated session data for the current user.
 */
export type SessionData = {
    userId: string;
    email: string;
    fullName: string;
    role: Role;
    memberId?: string;
};