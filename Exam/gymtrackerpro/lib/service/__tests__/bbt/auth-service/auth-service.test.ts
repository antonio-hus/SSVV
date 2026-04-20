import {mock, mockReset} from 'jest-mock-extended';
import bcrypt from 'bcryptjs';
import {Role, UserWithProfile} from '@/lib/domain/user';
import {AuthorizationError, NotFoundError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {AuthService} from '@/lib/service/auth-service';

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

const mockUserRepo = mock<UserRepositoryInterface>();

const MOCK_USER_WITH_PROFILE: UserWithProfile = {
    id: 'user-001',
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    phone: '+40712345678',
    dateOfBirth: new Date('1985-06-20'),
    passwordHash: '$2b$12$hashedpassword',
    role: Role.ADMIN,
    member: null,
    admin: {id: 'admin-001', userId: 'user-001'},
};

const MOCK_MEMBER_USER: UserWithProfile = {
    ...MOCK_USER_WITH_PROFILE,
    id: 'user-002',
    email: 'member@gym.com',
    role: Role.MEMBER,
    admin: null,
    member: {id: 'member-001', userId: 'user-002', membershipStart: new Date('2024-01-01'), isActive: true},
};

beforeEach(() => {
    mockReset(mockUserRepo);
    (AuthService as unknown as { instance: unknown }).instance = undefined;
});

describe('login', () => {
    it('login_userNotFound_throwsNotFoundError', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(null);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'unknown@test.com', password: 'AnyPass1!'};

        const act = service.login(inputCredentials);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('login_userNotFound_errorMessagePreventEnumeration', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(null);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'unknown@test.com', password: 'AnyPass1!'};

        const act = service.login(inputCredentials);

        await expect(act).rejects.toThrow('Invalid email or password');
    });

    it('login_wrongPassword_throwsAuthorizationError', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(MOCK_USER_WITH_PROFILE);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'admin@gymtrackerpro.com', password: 'WrongPass1!'};

        const act = service.login(inputCredentials);

        await expect(act).rejects.toThrow(AuthorizationError);
    });

    it('login_wrongPassword_sameMessageAsUserNotFound', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(MOCK_USER_WITH_PROFILE);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'admin@gymtrackerpro.com', password: 'WrongPass1!'};

        const act = service.login(inputCredentials);

        await expect(act).rejects.toThrow('Invalid email or password');
    });

    it('login_validAdminCredentials_returnsSessionDataWithAdminId', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(MOCK_USER_WITH_PROFILE);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'admin@gymtrackerpro.com', password: 'CorrectPass1!'};

        const result = await service.login(inputCredentials);

        expect(result.userId).toBe('user-001');
        expect(result.email).toBe('admin@gymtrackerpro.com');
        expect(result.role).toBe(Role.ADMIN);
        expect(result.adminId).toBe('admin-001');
        expect(result.memberId).toBeUndefined();
    });

    it('login_validMemberCredentials_returnsSessionDataWithMemberId', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'member@gym.com', password: 'CorrectPass1!'};

        const result = await service.login(inputCredentials);

        expect(result.userId).toBe('user-002');
        expect(result.role).toBe(Role.MEMBER);
        expect(result.memberId).toBe('member-001');
        expect(result.isActive).toBe(true);
        expect(result.adminId).toBeUndefined();
    });

    it('login_validMemberCredentials_returnsSessionDataWithFullName', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(MOCK_MEMBER_USER);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'member@gym.com', password: 'CorrectPass1!'};

        const result = await service.login(inputCredentials);

        expect(result.fullName).toBe('Admin User');
    });

    it('login_validInactiveMemberCredentials_returnsSessionDataWithIsActiveFalse', async () => {
        const inactiveMember: UserWithProfile = {
            ...MOCK_MEMBER_USER,
            member: {...MOCK_MEMBER_USER.member!, isActive: false},
        };
        mockUserRepo.findByEmail.mockResolvedValue(inactiveMember);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const service = AuthService.getInstance(mockUserRepo);
        const inputCredentials = {email: 'member@gym.com', password: 'CorrectPass1!'};

        const result = await service.login(inputCredentials);

        expect(result.isActive).toBe(false);
        expect(result.memberId).toBe('member-001');
    });
});