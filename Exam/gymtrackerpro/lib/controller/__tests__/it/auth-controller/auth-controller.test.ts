import {prisma} from '@/lib/database';
import {userService} from '@/lib/di';
import {login, logout} from '@/lib/controller/auth-controller';
import {getSession} from '@/lib/session';
import {SessionData} from '@/lib/domain/session';
import {ActionResult} from '@/lib/domain/action-result';
import {CreateMemberInput, LoginUserInput} from '@/lib/schema/user-schema';

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
        // Arrange
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        const seededMember = await userService.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: memberInput.password};

        // Act
        const result: ActionResult<SessionData> = await login(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: {
                userId: seededMember.user.id,
                email: seededMember.user.email,
                fullName: seededMember.user.fullName,
                role: 'MEMBER',
                memberId: seededMember.id,
                isActive: true,
                adminId: undefined,
            },
        });
        expect(mockSession).toMatchObject({
            userId: seededMember.user.id,
            email: seededMember.user.email,
            role: 'MEMBER',
            memberId: seededMember.id,
            isActive: true,
        });
        expect(mockSession.adminId).toBeUndefined();
        expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('login_invalidInputFormat_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {email: 'not-an-email', password: 'weak'} as unknown as LoginUserInput;

        // Act
        const result: ActionResult<SessionData> = await login(input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                email: expect.anything(),
                password: expect.anything(),
            }),
        });
        expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('login_emailNotRegistered_returnsFailureWithInvalidCredentialsMessage', async () => {
        // Arrange
        const input: LoginUserInput = {email: 'ghost@gym.test', password: 'ValidPass123!'};

        // Act
        const result: ActionResult<SessionData> = await login(input);

        // Assert
        expect(result).toEqual({success: false, message: 'Invalid email or password'});
        expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('login_incorrectPassword_returnsFailureWithInvalidCredentialsMessage', async () => {
        // Arrange
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        await userService.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: 'WrongPass999!'};

        // Act
        const result: ActionResult<SessionData> = await login(input);

        // Assert
        expect(result).toEqual({success: false, message: 'Invalid email or password'});
        expect(mockSession.save).not.toHaveBeenCalled();
    });

});

describe('logout', () => {

    it('logout_sessionExists_destroysSessionAndReturnsSuccess', async () => {
        // Arrange
        mockSession.destroy.mockResolvedValue(undefined);

        // Act
        const result: ActionResult<void> = await logout();

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        expect(mockSession.destroy).toHaveBeenCalledTimes(1);
    });

    it('logout_sessionDestroyThrowsUnexpectedError_returnsGenericFailureMessage', async () => {
        // Arrange
        mockSession.destroy.mockRejectedValue(new Error('Storage failure'));

        // Act
        const result: ActionResult<void> = await logout();

        // Assert
        expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
    });

});