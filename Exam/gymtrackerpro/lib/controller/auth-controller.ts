'use server';

import {authService} from '@/lib/di';
import {ActionResult} from '@/lib/domain/action-result';
import {SessionData} from '@/lib/domain/session';
import {z} from 'zod';
import {LoginUserInput, loginUserSchema} from '@/lib/schema/user-schema';
import {getSession} from '@/lib/session';
import {AppError} from '@/lib/domain/errors';

/**
 * Validates the provided credentials, creates a session for the authenticated user,
 * and returns the session data.
 *
 * @param data - Login input containing email and password.
 * @returns Session data on success, or a validation/auth error message.
 */
export async function login(data: LoginUserInput): Promise<ActionResult<SessionData>> {
    const result = loginUserSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }

    try {
        const sessionData = await authService.login(result.data);
        const session = await getSession();
        session.userId = sessionData.userId;
        session.email = sessionData.email;
        session.fullName = sessionData.fullName;
        session.role = sessionData.role;
        session.memberId = sessionData.memberId;
        session.adminId = sessionData.adminId;
        session.isActive = sessionData.isActive;
        await session.save();
        return {success: true, data: sessionData};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Destroys the current session, effectively logging the user out.
 *
 * @returns A success result with no data.
 */
export async function logout(): Promise<ActionResult<void>> {
    try {
        const session = await getSession();
        await session.destroy();
        return {success: true, data: undefined};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}
