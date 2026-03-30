import type {LoginUserInput} from '@/lib/schema/user-schema';
import type {SessionData} from '@/lib/domain/session';

/**
 * Contract for authentication business logic.
 */
export interface AuthServiceInterface {
    /**
     * Verifies the provided credentials and returns session data for the authenticated user.
     *
     * @param data - Validated login input containing email and password.
     * @returns Session data including user ID, email, full name, role, and role-specific profile ID.
     * @throws {NotFoundError} If no user with the given email exists.
     * @throws {AuthorizationError} If the provided password does not match the stored hash.
     */
    login(data: LoginUserInput): Promise<SessionData>;
}