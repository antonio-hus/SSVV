'use server';

import {AuthServiceInterface} from '@/lib/service/auth-service-interface';
import {AuthControllerInterface} from '@/lib/controller/auth-controller-interface';
import {ActionResult} from '@/lib/domain/action-result';
import {SessionData} from '@/lib/domain/session';
import {z} from 'zod';
import {LoginUserInput, loginUserSchema} from '@/lib/schema/user-schema';
import {getSession} from '@/lib/session';
import {AppError} from '@/lib/domain/errors';

/**
 * Implementation of {@link AuthControllerInterface} — authentication server actions.
 */
export class AuthController implements AuthControllerInterface {
    private static instance: AuthController;
    private readonly authService: AuthServiceInterface;

    private constructor(authService: AuthServiceInterface) {
        this.authService = authService;
    }

    /**
     * Returns the singleton instance, creating it with the given service on first call.
     *
     * @param authService - The authentication service to use for credential verification.
     */
    static getInstance(authService: AuthServiceInterface): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController(authService);
        }
        return AuthController.instance;
    }

    /** @inheritdoc */
    async login(data: LoginUserInput): Promise<ActionResult<SessionData>> {
        const result = loginUserSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            const sessionData = await this.authService.login(result.data);
            const session = await getSession();
            session.userId = sessionData.userId;
            session.email = sessionData.email;
            session.fullName = sessionData.fullName;
            session.role = sessionData.role;
            session.memberId = sessionData.memberId;
            session.adminId = sessionData.adminId;
            await session.save();
            return {success: true, data: sessionData};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async logout(): Promise<ActionResult<void>> {
        const session = await getSession();
        session.destroy();
        return {success: true, data: undefined};
    }
}
