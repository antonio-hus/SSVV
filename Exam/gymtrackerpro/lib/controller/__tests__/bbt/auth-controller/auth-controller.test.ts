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
} as const;

const makeMockSession = (): Partial<SessionData> & { save: jest.Mock; destroy: jest.Mock } => ({
    save: jest.fn(),
    destroy: jest.fn(),
});

beforeEach(() => {
    authServiceMock.login.mockReset();
    getSessionMock.mockReset();
});

describe('login', () => {
    it('login_validCredentials_savesSessionAndReturnsSuccessWithSessionData', async () => {
        const mockSession = makeMockSession();
        authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
        getSessionMock.mockResolvedValue(mockSession);
        const inputValidCredentials = {...VALID_LOGIN_INPUT};

        const result = await login(inputValidCredentials);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: SessionData }).data).toEqual(MOCK_SESSION_DATA);
        expect(mockSession.save).toHaveBeenCalled();
    });

    it('login_validCredentials_populatesAllSessionFields', async () => {
        const mockSession = makeMockSession();
        authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
        getSessionMock.mockResolvedValue(mockSession);
        const inputValidCredentials = {...VALID_LOGIN_INPUT};

        await login(inputValidCredentials);

        expect(mockSession.userId).toBe(MOCK_SESSION_DATA.userId);
        expect(mockSession.email).toBe(MOCK_SESSION_DATA.email);
        expect(mockSession.fullName).toBe(MOCK_SESSION_DATA.fullName);
        expect(mockSession.role).toBe(MOCK_SESSION_DATA.role);
        expect(mockSession.adminId).toBe(MOCK_SESSION_DATA.adminId);
        expect(mockSession.memberId).toBe(MOCK_SESSION_DATA.memberId);
        expect(mockSession.isActive).toBe(MOCK_SESSION_DATA.isActive);
    });

    it('login_validEmailFormat_passesEmailValidation', async () => {
        const mockSession = makeMockSession();
        authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
        getSessionMock.mockResolvedValue(mockSession);
        const inputValidEmail = {email: 'user@example.com', password: 'SomePass1!'};

        const result = await login(inputValidEmail);

        expect(result.success).toBe(true);
        expect(authServiceMock.login).toHaveBeenCalled();
    });

    it('login_emailMissingAtSymbol_returnsValidationFailureWithFieldErrors', async () => {
        const inputNoAt = {email: 'notanemail', password: 'ValidPass1!'};

        const result = await login(inputNoAt);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('login_emailMissingDomain_returnsValidationFailureWithFieldErrors', async () => {
        const inputNoDomain = {email: 'user@', password: 'ValidPass1!'};

        const result = await login(inputNoDomain);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('login_emailMissingLocalPart_returnsValidationFailureWithFieldErrors', async () => {
        const inputNoLocal = {email: '@example.com', password: 'ValidPass1!'};

        const result = await login(inputNoLocal);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('login_emptyEmail_returnsValidationFailureWithFieldErrors', async () => {
        const inputEmptyEmail = {email: '', password: 'ValidPass1!'};

        const result = await login(inputEmptyEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('login_passwordAtLowerBoundary1Char_passesPasswordValidation', async () => {
        const mockSession = makeMockSession();
        authServiceMock.login.mockResolvedValue(MOCK_SESSION_DATA);
        getSessionMock.mockResolvedValue(mockSession);
        const inputMinPassword = {email: 'admin@gymtrackerpro.com', password: 'x'};

        const result = await login(inputMinPassword);

        expect(authServiceMock.login).toHaveBeenCalled();
    });

    it('login_passwordBelowLowerBoundary0Chars_returnsValidationFailureWithFieldErrors', async () => {
        const inputEmptyPassword = {email: 'admin@gymtrackerpro.com', password: ''};

        const result = await login(inputEmptyPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('login_serviceThrowsAuthorizationError_returnsFailureWithErrorMessage', async () => {
        authServiceMock.login.mockRejectedValue(new AuthorizationError('Invalid email or password'));
        getSessionMock.mockResolvedValue(makeMockSession());
        const inputWrongPassword = {email: 'admin@gymtrackerpro.com', password: 'WrongPass1!'};

        const result = await login(inputWrongPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Invalid email or password');
    });

    it('login_serviceThrowsNotFoundError_returnsFailureWithErrorMessage', async () => {
        authServiceMock.login.mockRejectedValue(new NotFoundError('User not found'));
        getSessionMock.mockResolvedValue(makeMockSession());
        const inputUnknownEmail = {email: 'nonexistent@gymtrackerpro.com', password: 'ValidPass1!'};

        const result = await login(inputUnknownEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('User not found');
    });

    it('login_serviceThrowsUnexpectedError_returnsGenericFailureMessage', async () => {
        authServiceMock.login.mockRejectedValue(new Error('DB down'));
        getSessionMock.mockResolvedValue(makeMockSession());
        const inputValidCredentials = {...VALID_LOGIN_INPUT};

        const result = await login(inputValidCredentials);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('logout', () => {
    it('logout_called_destroysSessionAndReturnsSuccess', async () => {
        const mockSession = makeMockSession();
        getSessionMock.mockResolvedValue(mockSession);

        const result = await logout();

        expect(result.success).toBe(true);
        expect(mockSession.destroy).toHaveBeenCalled();
    });

    it('logout_called_returnsSuccessWithUndefinedData', async () => {
        const mockSession = makeMockSession();
        getSessionMock.mockResolvedValue(mockSession);

        const result = await logout();

        expect(result.success).toBe(true);
        expect((result as { success: true; data: undefined }).data).toBeUndefined();
    });
});