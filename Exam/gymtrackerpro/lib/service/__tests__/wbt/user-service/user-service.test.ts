import {mock, mockReset} from 'jest-mock-extended';
import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, Role} from '@/lib/domain/user';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import {PageResult} from '@/lib/domain/pagination';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {UserService} from '@/lib/service/user-service';

const mockUserRepo = mock<UserRepositoryInterface>();

const USER_ID: string = 'user-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const ADMIN_USER_ID: string = 'user-uuid-002';
const TEMP_PASSWORD: string = 'MockTmpPwd9!XYZQ';

const MOCK_MEMBER_WITH_USER: MemberWithUser = {
    id: MEMBER_ID,
    userId: USER_ID,
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: {
        id: USER_ID,
        email: 'member@example.com',
        fullName: 'John Doe',
        phone: '+40712345678',
        dateOfBirth: new Date('1990-01-15'),
        passwordHash: '$2b$12$hashedpassword',
        role: Role.MEMBER,
    },
};

const MOCK_ADMIN_WITH_USER: AdminWithUser = {
    id: ADMIN_ID,
    userId: ADMIN_USER_ID,
    user: {
        id: ADMIN_USER_ID,
        email: 'admin@gymtrackerpro.com',
        fullName: 'Admin User',
        phone: '+40712345678',
        dateOfBirth: new Date('1985-06-20'),
        passwordHash: '$2b$12$hashedpassword',
        role: Role.ADMIN,
    },
};

const CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: 'member@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecurePass123!',
    membershipStart: '2024-01-01',
};

const CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT: CreateMemberWithTempPasswordInput = {
    email: 'member@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    membershipStart: '2024-01-01',
};

const CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminPass123!',
};

const UPDATE_MEMBER_INPUT: UpdateMemberInput = {
    fullName: 'John Updated',
};

const UPDATE_ADMIN_INPUT: UpdateAdminInput = {
    fullName: 'Admin Updated',
};

beforeEach(() => {
    mockReset(mockUserRepo);
    jest.restoreAllMocks();
    (UserService as unknown as {instance: unknown}).instance = undefined;
});

describe('generateTempPassword', () => {

    describe('Independent Paths', () => {

        it('generateTempPassword_Path1_normalExecution_returns16CharPassword', () => {
            jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
                (array as Uint8Array).fill(0);
                return array as Uint8Array;
            });

            const service = UserService.getInstance(mockUserRepo);
            const result = (service as any).generateTempPassword();

            expect(result).toHaveLength(16);
            expect(result).toMatch(/[A-Z]/);
            expect(result).toMatch(/[0-9]/);
            expect(result).toMatch(/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/);
        });

    });

    describe('Loop Coverage', () => {

        it('generateTempPassword_Loop_n_shuffles15Times_returns16CharPassword', () => {
            const callCounts: number[] = [];
            let callIndex = 0;
            jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
                callCounts.push(++callIndex);
                (array as Uint8Array).fill(0);
                return array as Uint8Array;
            });

            const service = UserService.getInstance(mockUserRepo);
            const result = (service as any).generateTempPassword();

            // 3 required + 13 remaining + 15 shuffle iterations = 31 total getRandomValues calls
            expect(callIndex).toBe(31);
            expect(result).toHaveLength(16);
            expect(result).toMatch(/[A-Z]/);
            expect(result).toMatch(/[0-9]/);
            expect(result).toMatch(/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/);
        });

    });

});

describe('createMember', () => {

    describe('Independent Paths', () => {

        it('createMember_Path1_validInput_returnsMemberWithUser', async () => {
            const inputData: CreateMemberInput = {...CREATE_MEMBER_INPUT};
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.createMember(inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
            expect(mockUserRepo.createMember).toHaveBeenCalledWith(inputData);
        });

    });

});

describe('createMemberWithTempPassword', () => {

    describe('Independent Paths', () => {

        it('createMemberWithTempPassword_Path1_validInput_returnsMemberWithTempPassword', async () => {
            const inputData: CreateMemberWithTempPasswordInput = {...CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT};
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const service = UserService.getInstance(mockUserRepo);
            jest.spyOn(service as any, 'generateTempPassword').mockReturnValue(TEMP_PASSWORD);
            const result = await service.createMemberWithTempPassword(inputData);

            expect(result).toEqual({...MOCK_MEMBER_WITH_USER, tempPassword: TEMP_PASSWORD});
            expect(mockUserRepo.createMember).toHaveBeenCalledWith({...inputData, password: TEMP_PASSWORD});
        });

    });

});

describe('createAdmin', () => {

    describe('Independent Paths', () => {

        it('createAdmin_Path1_validInput_returnsAdminWithUser', async () => {
            const inputData: CreateAdminInput = {...CREATE_ADMIN_INPUT};
            mockUserRepo.createAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.createAdmin(inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
            expect(mockUserRepo.createAdmin).toHaveBeenCalledWith(inputData);
        });

    });

});

describe('getMember', () => {

    describe('Independent Paths', () => {

        it('getMember_Path1_validId_returnsMemberWithUser', async () => {
            const inputId: string = MEMBER_ID;
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.getMember(inputId);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
            expect(mockUserRepo.findMemberById).toHaveBeenCalledWith(inputId);
        });

    });

});

describe('getAdmin', () => {

    describe('Independent Paths', () => {

        it('getAdmin_Path1_validId_returnsAdminWithUser', async () => {
            const inputId: string = ADMIN_ID;
            mockUserRepo.findAdminById.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.getAdmin(inputId);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
            expect(mockUserRepo.findAdminById).toHaveBeenCalledWith(inputId);
        });

    });

});

describe('listMembers', () => {

    describe('Independent Paths', () => {

        it('listMembers_Path1_noOptions_returnsPageResult', async () => {
            const inputOptions: MemberListOptions | undefined = undefined;
            const pageResult: PageResult<MemberWithUser> = {items: [MOCK_MEMBER_WITH_USER], total: 1};
            mockUserRepo.findMembers.mockResolvedValue(pageResult);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.listMembers(inputOptions);

            expect(result).toEqual(pageResult);
            expect(mockUserRepo.findMembers).toHaveBeenCalledWith(inputOptions);
        });

    });

});

describe('listAdmins', () => {

    describe('Independent Paths', () => {

        it('listAdmins_Path1_noOptions_returnsPageResult', async () => {
            const inputOptions: AdminListOptions | undefined = undefined;
            const pageResult: PageResult<AdminWithUser> = {items: [MOCK_ADMIN_WITH_USER], total: 1};
            mockUserRepo.findAdmins.mockResolvedValue(pageResult);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.listAdmins(inputOptions);

            expect(result).toEqual(pageResult);
            expect(mockUserRepo.findAdmins).toHaveBeenCalledWith(inputOptions);
        });

    });

});

describe('updateMember', () => {

    describe('Independent Paths', () => {

        it('updateMember_Path1_validInput_returnsUpdatedMemberWithUser', async () => {
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {...UPDATE_MEMBER_INPUT};
            const updatedMember: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_MEMBER_WITH_USER.user, fullName: 'John Updated'},
            };
            mockUserRepo.updateMember.mockResolvedValue(updatedMember);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(updatedMember);
            expect(mockUserRepo.updateMember).toHaveBeenCalledWith(inputId, inputData);
        });

    });

});

describe('suspendMember', () => {

    describe('Independent Paths', () => {

        it('suspendMember_Path1_validId_returnsSuspendedMemberWithUser', async () => {
            const inputId: string = MEMBER_ID;
            const suspendedMember: MemberWithUser = {...MOCK_MEMBER_WITH_USER, isActive: false};
            mockUserRepo.setMemberActive.mockResolvedValue(suspendedMember);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.suspendMember(inputId);

            expect(result).toEqual(suspendedMember);
            expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, false);
        });

    });

});

describe('activateMember', () => {

    describe('Independent Paths', () => {

        it('activateMember_Path1_validId_returnsActivatedMemberWithUser', async () => {
            const inputId: string = MEMBER_ID;
            const activatedMember: MemberWithUser = {...MOCK_MEMBER_WITH_USER, isActive: true};
            mockUserRepo.setMemberActive.mockResolvedValue(activatedMember);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.activateMember(inputId);

            expect(result).toEqual(activatedMember);
            expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, true);
        });

    });

});

describe('updateAdmin', () => {

    describe('Independent Paths', () => {

        it('updateAdmin_Path1_validInput_returnsUpdatedAdminWithUser', async () => {
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {...UPDATE_ADMIN_INPUT};
            const updatedAdmin: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_ADMIN_WITH_USER.user, fullName: 'Admin Updated'},
            };
            mockUserRepo.updateAdmin.mockResolvedValue(updatedAdmin);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(updatedAdmin);
            expect(mockUserRepo.updateAdmin).toHaveBeenCalledWith(inputId, inputData);
        });

    });

});

describe('deleteMember', () => {

    describe('Independent Paths', () => {

        it('deleteMember_Path1_validId_resolvesVoid', async () => {
            const inputId: string = MEMBER_ID;
            mockUserRepo.delete.mockResolvedValue(undefined);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.deleteMember(inputId);

            expect(result).toBeUndefined();
            expect(mockUserRepo.delete).toHaveBeenCalledWith(inputId);
        });

    });

});

describe('deleteAdmin', () => {

    describe('Independent Paths', () => {

        it('deleteAdmin_Path1_validId_resolvesVoid', async () => {
            const inputId: string = ADMIN_ID;
            mockUserRepo.delete.mockResolvedValue(undefined);

            const service = UserService.getInstance(mockUserRepo);
            const result = await service.deleteAdmin(inputId);

            expect(result).toBeUndefined();
            expect(mockUserRepo.delete).toHaveBeenCalledWith(inputId);
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
        const instance = UserService.getInstance(mockUserRepo);

        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(UserService);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        const firstCall = UserService.getInstance(mockUserRepo);

        const secondRepo = mock<UserRepositoryInterface>();
        const secondCall = UserService.getInstance(secondRepo);

        expect(secondCall).toBe(firstCall);

        const internalRepo = (secondCall as unknown as { userRepository: unknown }).userRepository;

        expect(internalRepo).toBe(mockUserRepo);
        expect(internalRepo).not.toBe(secondRepo);
    });

});