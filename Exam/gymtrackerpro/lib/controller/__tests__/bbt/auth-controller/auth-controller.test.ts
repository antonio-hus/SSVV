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

const MOCK_SESSION_DATA: SessionData = {
    userId: 'user-001',
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    role: Role.ADMIN,
    memberId: undefined,
    adminId: 'admin-001',
    isActive: undefined,
};

const VALID_LOGIN_INPUT: LoginUserInput = {
    email: 'admin@gymtrackerpro.com',
    password: 'ValidPass1!',
};

const makeMockSession = (): Partial<SessionData> & { save: jest.Mock; destroy: jest.Mock } => ({
    save: jest.fn(),
    destroy: jest.fn(),
});

beforeEach(() => {
    authServiceMock.login.mockReset();
    getSessionMock.mockReset();
});

describe('login', () => {
    describe('Equivalence Classes', () => {
        it('login_EC_validCredentials_returnsSuccessWithSessionData', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = VALID_LOGIN_INPUT;
            authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_DATA);
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
            const inputData: LoginUserInput = {email: 'nonexistent@test.com', password: 'AnyPassword1!'};
            authServiceMock.login.mockRejectedValue(new NotFoundError('User not found'));
            getSessionMock.mockResolvedValue(makeMockSession());

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('User not found');
            }
        });

        it('login_EC_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
            const inputData: LoginUserInput = VALID_LOGIN_INPUT;
            authServiceMock.login.mockRejectedValue(new Error('Unknown error'));
            getSessionMock.mockResolvedValue(makeMockSession());

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('login_BVA_emptyEmail_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: '', password: 'ValidPass1!'};

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('login_BVA_password1Char_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: 'x'};
            authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
            getSessionMock.mockResolvedValue(mockSession);

            const result: ActionResult<SessionData> = await login(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_DATA);
            }
        });

        it('login_BVA_passwordEmpty_returnsValidationError', async () => {
            const inputData: LoginUserInput = {email: 'admin@gymtrackerpro.com', password: ''};

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
        });
    });
});
