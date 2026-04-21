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
    (AuthService as unknown as { instance: unknown }).instance = undefined;
});

describe('login', () => {
    describe('Equivalence Classes', () => {
        it('login_EC_validAdminCredentials_returnsSessionData', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'admin@gymtrackerpro.com', password: 'CorrectPass1!'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_ADMIN_USER);
            mockPasswordMatch(true);

            const result = await service.login(inputData);

            expect(result.userId).toBe(USER_ID);
            expect(result.email).toBe(MOCK_ADMIN_USER.email);
            expect(result.fullName).toBe(MOCK_ADMIN_USER.fullName);
            expect(result.role).toBe(Role.ADMIN);
            expect(result.adminId).toBe(ADMIN_ID);
            expect(result.memberId).toBeUndefined();
            expect(result.isActive).toBeUndefined();
        });

        it('login_EC_validMemberCredentials_returnsSessionData', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: 'CorrectPass1!'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(true);

            const result = await service.login(inputData);

            expect(result.userId).toBe('user-uuid-002');
            expect(result.email).toBe(MOCK_MEMBER_USER.email);
            expect(result.fullName).toBe(MOCK_MEMBER_USER.fullName);
            expect(result.role).toBe(Role.MEMBER);
            expect(result.memberId).toBe(MEMBER_ID);
            expect(result.adminId).toBeUndefined();
            expect(result.isActive).toBe(true);
        });

        it('login_EC_validInactiveMemberCredentials_returnsSessionDataWithIsActiveFalse', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: 'CorrectPass1!'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_INACTIVE_MEMBER_USER);
            mockPasswordMatch(true);

            const result = await service.login(inputData);

            expect(result.isActive).toBe(false);
            expect(result.memberId).toBe(MEMBER_ID);
            expect(result.userId).toBe('user-uuid-002');
            expect(result.role).toBe(Role.MEMBER);
        });

        it('login_EC_userNotFound_throwsNotFoundError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'unknown@example.com', password: 'AnyPassword1!'};
            mockUserRepo.findByEmail.mockResolvedValue(null);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });

        it('login_EC_wrongPassword_throwsAuthorizationError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: 'WrongPassword1!'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(false);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(AuthorizationError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('login_BVA_emptyEmail_throwsNotFoundError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: '', password: 'SomePassword1!'};
            mockUserRepo.findByEmail.mockResolvedValue(null);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });

        it('login_BVA_inexistentOneCharEmail_throwsNotFoundError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'a', password: 'SomePassword1!'};
            mockUserRepo.findByEmail.mockResolvedValue(null);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });

        it('login_BVA_existingOneCharEmail_authenticatesSuccessfully', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'a', password: 'CorrectPass1!'};
            const oneCharUser = {...MOCK_MEMBER_USER, email: 'a'};
            mockUserRepo.findByEmail.mockResolvedValue(oneCharUser);
            mockPasswordMatch(true);

            const result = await service.login(inputData);

            expect(result.email).toBe('a');
            expect(result.userId).toBe(oneCharUser.id);
        });

        it('login_BVA_emptyPassword_throwsAuthorizationError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: ''};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(false);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(AuthorizationError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });

        it('login_BVA_inexistentOneCharPassword_throwsAuthorizationError', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: 'p'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(false);

            const act = service.login(inputData);

            await expect(act).rejects.toThrow(AuthorizationError);
            await expect(act).rejects.toThrow('Invalid email or password');
        });

        it('login_BVA_existingOneCharPassword_authenticatesSuccessfully', async () => {
            const service = AuthService.getInstance(mockUserRepo);
            const inputData = {email: 'member@example.com', password: 'p'};
            mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
            mockPasswordMatch(true);

            const result = await service.login(inputData);

            expect(result.userId).toBe('user-uuid-002');
            expect(result.email).toBe(MOCK_MEMBER_USER.email);
        });
    });
});
