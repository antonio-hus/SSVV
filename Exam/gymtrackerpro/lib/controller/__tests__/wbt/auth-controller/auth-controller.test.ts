jest.mock('@/lib/di', () => ({
    authService: {login: jest.fn()},
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

import {authService} from '@/lib/di';
import {getSession} from '@/lib/session';
import {Role} from '@/lib/domain/user';
import {SessionData} from '@/lib/domain/session';
import {AuthorizationError} from '@/lib/domain/errors';
import {LoginUserInput} from '@/lib/schema/user-schema';
import {login, logout} from '@/lib/controller/auth-controller';

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

    describe('Independent Paths', () => {

        it('login_Path1_validInputAuthSucceeds_returnsSuccessWithSessionData', async () => {
            const inputData: LoginUserInput = {...VALID_LOGIN_INPUT};
            const mockSession = makeMockSession();
            authServiceMock.login.mockResolvedValue(MOCK_ADMIN_SESSION);
            getSessionMock.mockResolvedValue(mockSession);

            const result = await login(inputData);

            expect(result).toEqual({success: true, data: MOCK_ADMIN_SESSION});
            expect(authServiceMock.login).toHaveBeenCalledWith(inputData);
            expect(mockSession.save).toHaveBeenCalled();
        });

        it('login_Path2_invalidInput_returnsValidationError', async () => {
            const inputData = {email: 'not-an-email', password: ''} as LoginUserInput;

            const result = await login(inputData);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(authServiceMock.login).not.toHaveBeenCalled();
        });

        it('login_Path3_authServiceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputData: LoginUserInput = {...VALID_LOGIN_INPUT};
            authServiceMock.login.mockRejectedValue(new AuthorizationError('Invalid credentials'));

            const result = await login(inputData);

            expect(result).toEqual({success: false, message: 'Invalid credentials'});
        });

        it('login_Path4_authServiceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputData: LoginUserInput = {...VALID_LOGIN_INPUT};
            authServiceMock.login.mockRejectedValue(new Error('Database connection failed'));

            const result = await login(inputData);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('logout', () => {

    describe('Independent Paths', () => {

        it('logout_Path1_sessionDestroySucceeds_returnsSuccess', async () => {
            const mockSession = makeMockSession();
            getSessionMock.mockResolvedValue(mockSession);

            const result = await logout();

            expect(result).toEqual({success: true, data: undefined});
            expect(mockSession.destroy).toHaveBeenCalled();
        });

        it('logout_Path2_getSessionThrowsAppError_returnsAppErrorMessage', async () => {
            getSessionMock.mockRejectedValue(new AuthorizationError('Session expired'));

            const result = await logout();

            expect(result).toEqual({success: false, message: 'Session expired'});
        });

        it('logout_Path3_getSessionThrowsUnknownError_returnsGenericMessage', async () => {
            getSessionMock.mockRejectedValue(new Error('Network error'));

            const result = await logout();

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});