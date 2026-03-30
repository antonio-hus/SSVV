import type {ActionResult} from '@/lib/domain/action-result';
import type {SessionData} from '@/lib/domain/session';
import type {LoginUserInput} from '@/lib/schema/user-schema';

/**
 * Contract for authentication server actions.
 */
export interface AuthControllerInterface {
    /**
     * Validates credentials, writes the session, and returns the authenticated user's session data.
     *
     * @param data - Validated login input (email, password).
     * @returns The session data on success, or an authorization error.
     */
    login(data: LoginUserInput): Promise<ActionResult<SessionData>>;

    /**
     * Destroys the current session, effectively logging the user out.
     *
     * @returns A success result with no data.
     */
    logout(): Promise<ActionResult<void>>;
}
