jest.mock('@/lib/di', () => ({
    authService: {login: jest.fn()},
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

import {authService} from '@/lib/di';
import {getSession} from '@/lib/session';
import {Role} from "@/lib/domain/user";
import {SessionData} from '@/lib/domain/session';
import {AuthorizationError, NotFoundError} from '@/lib/domain/errors';
import {LoginUserInput} from "@/lib/schema/user-schema";
import {login, logout} from '@/lib/controller/auth-controller';
import {ActionResult} from "@/lib/domain/action-result";

const authServiceMock = authService as unknown as { login: jest.Mock };
const getSessionMock = getSession as jest.Mock;

const MOCK_ADMIN_SESSION: SessionData = {
    userId: 'user-001',
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    role: Role.ADMIN,
    memberId: undefined,
    adminId: 'admin-001',
    isActive: undefined,
};

const MOCK_MEMBER_SESSION: SessionData = {
    userId: 'user-002',
    email: 'member@example.com',
    fullName: 'John Doe',
    role: Role.MEMBER,
    memberId: 'member-001',
    adminId: undefined,
    isActive: true,
};

const VALID_LOGIN_INPUT: LoginUserInput = {
    email: 'admin@gymtrackerpro.com',
    password: 'ValidPass1!',
};

const makeMockSession = () => ({
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
    authServiceMock.login.mockReset();
    getSessionMock.mockReset();
});

describe('login', () => {
    describe('Equivalence Classes', () => {
        it('login_EC_validAdminCredentials_returnsSuccessWithAdminData', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = VALID_LOGIN_INPUT;
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_ADMIN_SESSION);
            }
            expect(mockSession.save).toHaveBeenCalled();
        });

        it('login_EC_validMemberCredentials_returnsSuccessWithMemberData', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'member@example.com', password: 'ValidPassword1!'};
            authServiceMock.login.mockResolvedValue(MOCK_MEMBER_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_MEMBER_SESSION);
                expect(result.data.role).toBe(Role.MEMBER);
            }
            expect(mockSession.save).toHaveBeenCalled();
        });

        it('login_EC_missingEmail_returnsValidationError', async () => {
            const inputData = {password: 'ValidPass1!'};

            const result: ActionResult<SessionData> = await login(inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('login_EC_missingPassword_returnsValidationError', async () => {
            const inputData = {email: 'admin@gymtrackerpro.com'};

            const result: ActionResult<SessionData> = await login(inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('login_EC_invalidEmailFormat_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'bad-email', password: 'ValidPass1!'};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('login_EC_passwordMissingUppercase_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'validpass1!'};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('login_EC_passwordMissingNumber_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'ValidPass!'};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('login_EC_passwordMissingSpecialChar_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'ValidPass1'};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('login_EC_serviceThrowsAuthorizationError_returnsFailureWithMessage', async () => {
            const inputData: LoginUserInput = VALID_LOGIN_INPUT;
            authServiceMock.login.mockRejectedValue(new AuthorizationError('Invalid email or password'));
            getSessionMock.mockResolvedValue(makeMockSession());

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid email or password');
            }
        });

        it('login_EC_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
            const inputData: LoginUserInput = VALID_LOGIN_INPUT;
            authServiceMock.login.mockRejectedValue(new NotFoundError('User not found'));
            getSessionMock.mockResolvedValue(makeMockSession());

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('User not found');
            }
        });

        it('login_EC_getSessionFails_returnsGenericFailure', async () => {
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockRejectedValue(new Error('Cookie store failed'));

            const result: ActionResult<SessionData> = await login(VALID_LOGIN_INPUT);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('login_BVA_password7Chars_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(4)};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('login_BVA_password8Chars_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(5)};
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
        });

        it('login_BVA_password9Chars_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(6)};
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
        });

        it('login_BVA_password63Chars_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(60)};
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
        });

        it('login_BVA_password64Chars_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(61)};
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
        });

        it('login_BVA_password65Chars_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'V1@' + 'a'.repeat(62)};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });
    });
});

describe('logout', () => {
    describe('Equivalence Classes', () => {
        it('logout_EC_called_returnsSuccessWithUndefinedData', async () => {
            const mockSession = makeMockSession();
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<void> = await logout();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
            expect(mockSession.destroy).toHaveBeenCalled();
        });

        it('logout_EC_getSessionFails_returnsGenericFailure', async () => {
            getSessionMock.mockRejectedValue(new Error('Session fetch failed'));

            const result: ActionResult<void> = await logout();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });

        it('logout_EC_sessionDestroyFails_returnsGenericFailure', async () => {
            const mockSession = makeMockSession();
            mockSession.destroy.mockRejectedValue(new Error('Destroy failed'));
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<void> = await logout();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });
});
