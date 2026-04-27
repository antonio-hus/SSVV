import {prisma} from '@/lib/database';
import {login, logout} from '@/lib/controller/auth-controller';
import {userRepository} from '@/lib/di';
import {getSession} from '@/lib/session';
import {SessionData} from '@/lib/domain/session';
import {ActionResult} from '@/lib/domain/action-result';
import {CreateMemberInput, LoginUserInput} from '@/lib/schema/user-schema';

/**
 * getSession() mock.
 *
 * This module cannot be used as is, because on the dependency for cookies() from next/headers
 * This is a Next.js request-context primitive that throws unconditionally outside a live request.
 * The mock replaces it with a plain object that satisfies the IronSession<SessionData> contract.
 */
jest.mock('@/lib/session');
const mockSession = {} as Partial<SessionData> & { save: jest.Mock; destroy: jest.Mock };
mockSession.save = jest.fn();
mockSession.destroy = jest.fn();

beforeEach(() => {
    mockSession.userId = undefined;
    mockSession.email = undefined;
    mockSession.fullName = undefined;
    mockSession.role = undefined;
    mockSession.memberId = undefined;
    mockSession.adminId = undefined;
    mockSession.isActive = undefined;
    mockSession.save.mockReset();
    mockSession.destroy.mockReset();
    (getSession as jest.Mock).mockResolvedValue(mockSession);
});

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('login', () => {

    it('login_validMemberCredentials_returnsSuccessWithSessionDataAndWritesSession', async () => {
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        const seededMember = await userRepository.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: memberInput.password};

        const result: ActionResult<SessionData> = await login(input);

        expect(result.success).toBe(true);
        if (!result.success) throw new Error('Expected success result');
        expect(result.data.userId).toBe(seededMember.user.id);
        expect(result.data.email).toBe(seededMember.user.email);
        expect(result.data.fullName).toBe(seededMember.user.fullName);
        expect(result.data.role).toBe('MEMBER');
        expect(result.data.memberId).toBe(seededMember.id);
        expect(result.data.isActive).toBe(true);
        expect(result.data.adminId).toBeUndefined();
        expect(mockSession.userId).toBe(seededMember.user.id);
        expect(mockSession.email).toBe(seededMember.user.email);
        expect(mockSession.role).toBe('MEMBER');
        expect(mockSession.memberId).toBe(seededMember.id);
        expect(mockSession.isActive).toBe(true);
        expect(mockSession.adminId).toBeUndefined();
        expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('login_invalidInputFormat_returnsValidationFailureWithFieldErrors', async () => {
        const input = {email: 'not-an-email', password: 'weak'} as unknown as LoginUserInput;

        const result: ActionResult<SessionData> = await login(input);

        expect(result.success).toBe(false);
        if (result.success) throw new Error('Expected failure result');
        expect(result.message).toBe('Validation failed');
        expect(result.errors?.email).toBeDefined();
        expect(result.errors?.password).toBeDefined();
        expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('login_emailNotRegistered_returnsFailureWithInvalidCredentialsMessage', async () => {
        const input: LoginUserInput = {email: 'ghost@gym.test', password: 'ValidPass123!'};

        const result: ActionResult<SessionData> = await login(input);

        expect(result.success).toBe(false);
        if (result.success) throw new Error('Expected failure result');
        expect(result.message).toBe('Invalid email or password');
        expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('login_incorrectPassword_returnsFailureWithInvalidCredentialsMessage', async () => {
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        await userRepository.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: 'WrongPass999!'};

        const result: ActionResult<SessionData> = await login(input);

        expect(result.success).toBe(false);
        if (result.success) throw new Error('Expected failure result');
        expect(result.message).toBe('Invalid email or password');
        expect(mockSession.save).not.toHaveBeenCalled();
    });

});

describe('logout', () => {

    it('logout_sessionExists_destroysSessionAndReturnsSuccess', async () => {
        mockSession.destroy.mockResolvedValue(undefined);

        const result: ActionResult<void> = await logout();

        expect(result.success).toBe(true);
        if (!result.success) throw new Error('Expected success result');
        expect(result.data).toBeUndefined();
        expect(mockSession.destroy).toHaveBeenCalledTimes(1);
    });

    it('logout_sessionDestroyThrowsUnexpectedError_returnsGenericFailureMessage', async () => {
        mockSession.destroy.mockRejectedValue(new Error('Storage failure'));

        const result: ActionResult<void> = await logout();

        expect(result.success).toBe(false);
        if (result.success) throw new Error('Expected failure result');
        expect(result.message).toBe('An unexpected error occurred');
    });

});