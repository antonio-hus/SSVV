import {mock, mockReset} from 'jest-mock-extended';
import bcrypt from 'bcryptjs';
import {Role, UserWithProfile} from '@/lib/domain/user';
import {AuthorizationError, NotFoundError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {AuthService} from '@/lib/service/auth-service';

jest.mock('bcryptjs');
const mockedBcrypt = jest.mocked(bcrypt);

const mockUserRepo = mock<UserRepositoryInterface>();

const USER_ID: string = 'user-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';

const MOCK_ADMIN_USER: UserWithProfile = {
    id: USER_ID,
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    phone: '+40712345678',
    dateOfBirth: new Date('1985-06-20'),
    passwordHash: '$2b$12$hashedpassword',
    role: Role.ADMIN,
    member: null,
    admin: {id: ADMIN_ID, userId: USER_ID},
};

const MOCK_MEMBER_USER: UserWithProfile = {
    id: 'user-uuid-002',
    email: 'member@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: new Date('1990-01-15'),
    passwordHash: '$2b$12$hashedpassword',
    role: Role.MEMBER,
    admin: null,
    member: {id: MEMBER_ID, userId: 'user-uuid-002', membershipStart: new Date('2024-01-01'), isActive: true},
};

const MOCK_INACTIVE_MEMBER_USER: UserWithProfile = {
    ...MOCK_MEMBER_USER,
    member: {...MOCK_MEMBER_USER.member!, isActive: false},
};

const mockPasswordMatch = (matches: boolean) => {
    mockedBcrypt.compare.mockResolvedValue(matches as never);
};

beforeEach(() => {
    mockReset(mockUserRepo);
    jest.clearAllMocks();
    (AuthService as unknown as {instance: unknown}).instance = undefined;
});

describe('login', () => {

    describe('Independent Paths', () => {

        it('login_Path1_adminUser_validCredentials_returnsSessionDataWithAdminId', async () => {
            // Arrange
            const inputData = {email: 'admin@gymtrackerpro.com', password: 'secret'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_ADMIN_USER);
            mockPasswordMatch(true);

            const service = AuthService.getInstance(mockUserRepo);

            // Act
            const result = await service.login(inputData);

            // Assert
            expect(result).toEqual({
                userId: MOCK_ADMIN_USER.id,
                email: MOCK_ADMIN_USER.email,
                fullName: MOCK_ADMIN_USER.fullName,
                role: Role.ADMIN,
                memberId: undefined,
                adminId: ADMIN_ID,
                isActive: undefined,
            });
        });

        it('login_Path1_activeMemberUser_validCredentials_returnsSessionDataWithMemberId', async () => {
            // Arrange
            const inputData = {email: 'member@example.com', password: 'secret'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(true);

            const service = AuthService.getInstance(mockUserRepo);

            // Act
            const result = await service.login(inputData);

            // Assert
            expect(result).toEqual({
                userId: MOCK_MEMBER_USER.id,
                email: MOCK_MEMBER_USER.email,
                fullName: MOCK_MEMBER_USER.fullName,
                role: Role.MEMBER,
                memberId: MEMBER_ID,
                adminId: undefined,
                isActive: true,
            });
        });

        it('login_Path1_inactiveMemberUser_validCredentials_returnsSessionDataWithIsActiveFalse', async () => {
            // Arrange
            const inputData = {email: 'member@example.com', password: 'secret'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_INACTIVE_MEMBER_USER);
            mockPasswordMatch(true);

            const service = AuthService.getInstance(mockUserRepo);

            // Act
            const result = await service.login(inputData);

            // Assert
            expect(result).toEqual({
                userId: MOCK_INACTIVE_MEMBER_USER.id,
                email: MOCK_INACTIVE_MEMBER_USER.email,
                fullName: MOCK_INACTIVE_MEMBER_USER.fullName,
                role: Role.MEMBER,
                memberId: MEMBER_ID,
                adminId: undefined,
                isActive: false,
            });
        });

        it('login_Path2_emailNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputData = {email: 'unknown@example.com', password: 'secret'};
            mockUserRepo.findByEmail.mockResolvedValue(null);

            const service = AuthService.getInstance(mockUserRepo);

            // Act
            const action = async () => await service.login(inputData);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow('Invalid email or password');
        });

        it('login_Path3_wrongPassword_throwsAuthorizationError', async () => {
            // Arrange
            const inputData = {email: 'admin@gymtrackerpro.com', password: 'wrong'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_ADMIN_USER);
            mockPasswordMatch(false);

            const service = AuthService.getInstance(mockUserRepo);

            // Act
            const action = async () => await service.login(inputData);

            // Assert
            await expect(action()).rejects.toThrow(AuthorizationError);
            await expect(action()).rejects.toThrow('Invalid email or password');
        });

    });

});

/**
 * Singleton creation check.
 * Provided for enhanced coverage.
 * Not included in the scope of GymTrackerPro testing.
 */
describe('getInstance', () => {

    it('getInstance_Path1_returnsValidInstance', () => {
        // Act
        const instance = AuthService.getInstance(mockUserRepo);

        // Assert
        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(AuthService);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        // Arrange
        const firstCall = AuthService.getInstance(mockUserRepo);

        const secondUserRepo = mock<UserRepositoryInterface>();

        // Act
        const secondCall = AuthService.getInstance(secondUserRepo);

        // Assert
        expect(secondCall).toBe(firstCall);

        const internalRepo = (secondCall as unknown as { userRepository: unknown }).userRepository;

        expect(internalRepo).toBe(mockUserRepo);
        expect(internalRepo).not.toBe(secondUserRepo);
    });

});