import {mock, mockReset} from 'jest-mock-extended';
import {AdminWithUser, MemberWithUser, Role} from '@/lib/domain/user';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {UserService} from '@/lib/service/user-service';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput} from "@/lib/schema/user-schema";

const mockUserRepo = mock<UserRepositoryInterface>();

const USER_ID: string = 'user-001';
const MEMBER_ID: string = 'member-001';
const ADMIN_ID: string = 'admin-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_MEMBER_WITH_USER: MemberWithUser = {
    id: MEMBER_ID,
    userId: USER_ID,
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: {
        id: USER_ID,
        email: 'john@example.com',
        fullName: 'John Michael Doe',
        phone: '+40712345678',
        dateOfBirth: new Date('1990-01-15'),
        passwordHash: 'hashed',
        role: Role.MEMBER,
    },
};

const MOCK_ADMIN_WITH_USER: AdminWithUser = {
    id: ADMIN_ID,
    userId: USER_ID,
    user: {
        id: USER_ID,
        email: 'admin@gymtrackerpro.com',
        fullName: 'Admin Manager User',
        phone: '+40712345678',
        dateOfBirth: new Date('1985-06-20'),
        passwordHash: 'hashed',
        role: Role.ADMIN,
    },
};

const CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecurePass1!',
    membershipStart: '2024-01-01',
};

const CREATE_MEMBER_NO_PWD_INPUT: CreateMemberWithTempPasswordInput = {
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    membershipStart: '2024-01-01',
};

const CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin Manager User',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminPass1!',
};

beforeEach(() => {
    mockReset(mockUserRepo);
    (UserService as unknown as { instance: unknown }).instance = undefined;
});

describe('createMember', () => {
    it('createMember_uniqueEmail_returnsMemberWithUser', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_INPUT;

        const result = await service.createMember(inputData);

        expect(result.id).toBe(MEMBER_ID);
        expect(result.user.email).toBe('john@example.com');
        expect(mockUserRepo.createMember).toHaveBeenCalledWith(inputData);
    });

    it('createMember_duplicateEmail_throwsConflictError', async () => {
        mockUserRepo.createMember.mockRejectedValue(new ConflictError('Email already registered'));
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_INPUT;

        const act = service.createMember(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('createMemberWithTempPassword', () => {
    it('createMemberWithTempPassword_validData_tempPasswordIsExactly16Chars', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        expect(result.tempPassword).toHaveLength(16);
    });

    it('createMemberWithTempPassword_validData_tempPasswordContainsUppercaseLetter', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        expect(/[A-Z]/.test(result.tempPassword)).toBe(true);
    });

    it('createMemberWithTempPassword_validData_tempPasswordContainsDigit', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        expect(/[0-9]/.test(result.tempPassword)).toBe(true);
    });

    it('createMemberWithTempPassword_validData_tempPasswordContainsSpecialChar', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        expect(/[^A-Za-z0-9]/.test(result.tempPassword)).toBe(true);
    });

    it('createMemberWithTempPassword_validData_returnsMemberWithTempPassword', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        expect(result.id).toBe(MEMBER_ID);
        expect(result.user).toBeDefined();
        expect(typeof result.tempPassword).toBe('string');
    });

    it('createMemberWithTempPassword_duplicateEmail_throwsConflictError', async () => {
        mockUserRepo.createMember.mockRejectedValue(new ConflictError('Email already registered'));
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const act = service.createMemberWithTempPassword(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('createMemberWithTempPassword_validData_callsCreateMemberWithGeneratedPassword', async () => {
        mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_MEMBER_NO_PWD_INPUT;

        const result = await service.createMemberWithTempPassword(inputData);

        const calledWith = (mockUserRepo.createMember.mock.calls[0][0] as typeof CREATE_MEMBER_INPUT);
        expect(calledWith.password).toBe(result.tempPassword);
        expect(calledWith.email).toBe(inputData.email);
    });
});

describe('createAdmin', () => {
    it('createAdmin_uniqueEmail_returnsAdminWithUser', async () => {
        mockUserRepo.createAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_ADMIN_INPUT;

        const result = await service.createAdmin(inputData);

        expect(result.id).toBe(ADMIN_ID);
        expect(mockUserRepo.createAdmin).toHaveBeenCalledWith(inputData);
    });

    it('createAdmin_duplicateEmail_throwsConflictError', async () => {
        mockUserRepo.createAdmin.mockRejectedValue(new ConflictError('Email already registered'));
        const service = UserService.getInstance(mockUserRepo);
        const inputData = CREATE_ADMIN_INPUT;

        const act = service.createAdmin(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('getMember', () => {
    it('getMember_existingMemberId_returnsMemberWithUser', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.getMember(inputId);

        expect(result.id).toBe(MEMBER_ID);
        expect(mockUserRepo.findMemberById).toHaveBeenCalledWith(inputId);
    });

    it('getMember_nonExistentMemberId_throwsNotFoundError', async () => {
        mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.getMember(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('getAdmin', () => {
    it('getAdmin_existingAdminId_returnsAdminWithUser', async () => {
        mockUserRepo.findAdminById.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = ADMIN_ID;

        const result = await service.getAdmin(inputId);

        expect(result.id).toBe(ADMIN_ID);
        expect(mockUserRepo.findAdminById).toHaveBeenCalledWith(inputId);
    });

    it('getAdmin_nonExistentAdminId_throwsNotFoundError', async () => {
        mockUserRepo.findAdminById.mockRejectedValue(new NotFoundError('Admin not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.getAdmin(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('listMembers', () => {
    it('listMembers_noOptions_returnsPageResult', async () => {
        mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});
        const service = UserService.getInstance(mockUserRepo);

        const result = await service.listMembers();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockUserRepo.findMembers).toHaveBeenCalledWith(undefined);
    });

    it('listMembers_withSearchOptions_passesOptionsToRepository', async () => {
        mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});
        const service = UserService.getInstance(mockUserRepo);
        const inputOptions = {search: 'John', page: 1, pageSize: 10};

        await service.listMembers(inputOptions);

        expect(mockUserRepo.findMembers).toHaveBeenCalledWith(inputOptions);
    });

    it('listMembers_emptyRepository_returnsEmptyPageResult', async () => {
        mockUserRepo.findMembers.mockResolvedValue({items: [], total: 0});
        const service = UserService.getInstance(mockUserRepo);

        const result = await service.listMembers();

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });
});

describe('listAdmins', () => {
    it('listAdmins_noOptions_returnsPageResult', async () => {
        mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});
        const service = UserService.getInstance(mockUserRepo);

        const result = await service.listAdmins();

        expect(result.items).toHaveLength(1);
        expect(mockUserRepo.findAdmins).toHaveBeenCalledWith(undefined);
    });

    it('listAdmins_withSearchOptions_passesOptionsToRepository', async () => {
        mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});
        const service = UserService.getInstance(mockUserRepo);
        const inputOptions = {search: 'Admin', page: 1, pageSize: 10};

        await service.listAdmins(inputOptions);

        expect(mockUserRepo.findAdmins).toHaveBeenCalledWith(inputOptions);
    });

    it('listAdmins_emptyRepository_returnsEmptyPageResult', async () => {
        mockUserRepo.findAdmins.mockResolvedValue({items: [], total: 0});
        const service = UserService.getInstance(mockUserRepo);

        const result = await service.listAdmins();

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });
});

describe('updateMember', () => {
    it('updateMember_existingMemberWithValidData_returnsUpdatedMember', async () => {
        const updated = {
            ...MOCK_MEMBER_WITH_USER,
            user: {...MOCK_MEMBER_WITH_USER.user, fullName: 'John Updated Name'}
        };
        mockUserRepo.updateMember.mockResolvedValue(updated);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;
        const inputData = {fullName: 'John Updated Name'};

        const result = await service.updateMember(inputId, inputData);

        expect(result.user.fullName).toBe('John Updated Name');
        expect(mockUserRepo.updateMember).toHaveBeenCalledWith(inputId, inputData);
    });

    it('updateMember_nonExistentMemberId_throwsNotFoundError', async () => {
        mockUserRepo.updateMember.mockRejectedValue(new NotFoundError('Member not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;
        const inputData = {fullName: 'New Name Here'};

        const act = service.updateMember(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateMember_duplicateEmail_throwsConflictError', async () => {
        mockUserRepo.updateMember.mockRejectedValue(new ConflictError('Email already in use'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;
        const inputData = {email: 'other@example.com'};

        const act = service.updateMember(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('updateAdmin', () => {
    it('updateAdmin_existingAdminWithValidData_returnsUpdatedAdmin', async () => {
        const updated = {...MOCK_ADMIN_WITH_USER, user: {...MOCK_ADMIN_WITH_USER.user, fullName: 'Updated Admin Name'}};
        mockUserRepo.updateAdmin.mockResolvedValue(updated);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = ADMIN_ID;
        const inputData = {fullName: 'Updated Admin Name'};

        const result = await service.updateAdmin(inputId, inputData);

        expect(result.user.fullName).toBe('Updated Admin Name');
        expect(mockUserRepo.updateAdmin).toHaveBeenCalledWith(inputId, inputData);
    });

    it('updateAdmin_nonExistentAdminId_throwsNotFoundError', async () => {
        mockUserRepo.updateAdmin.mockRejectedValue(new NotFoundError('Admin not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;
        const inputData = {};

        const act = service.updateAdmin(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateAdmin_duplicateEmail_throwsConflictError', async () => {
        mockUserRepo.updateAdmin.mockRejectedValue(new ConflictError('Email already in use'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = ADMIN_ID;
        const inputData = {email: 'other@example.com'};

        const act = service.updateAdmin(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('suspendMember', () => {
    it('suspendMember_activeMember_callsSetMemberActiveWithFalse', async () => {
        const suspended = {...MOCK_MEMBER_WITH_USER, isActive: false};
        mockUserRepo.setMemberActive.mockResolvedValue(suspended);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.suspendMember(inputId);

        expect(result.isActive).toBe(false);
        expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, false);
    });

    it('suspendMember_alreadySuspendedMember_callsSetMemberActiveWithFalse', async () => {
        const alreadySuspended = {...MOCK_MEMBER_WITH_USER, isActive: false};
        mockUserRepo.setMemberActive.mockResolvedValue(alreadySuspended);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.suspendMember(inputId);

        expect(result.isActive).toBe(false);
        expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, false);
    });

    it('suspendMember_nonExistentMemberId_throwsNotFoundError', async () => {
        mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.suspendMember(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('activateMember', () => {
    it('activateMember_suspendedMember_callsSetMemberActiveWithTrue', async () => {
        mockUserRepo.setMemberActive.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.activateMember(inputId);

        expect(result.isActive).toBe(true);
        expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, true);
    });

    it('activateMember_alreadyActiveMember_callsSetMemberActiveWithTrue', async () => {
        mockUserRepo.setMemberActive.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.activateMember(inputId);

        expect(result.isActive).toBe(true);
        expect(mockUserRepo.setMemberActive).toHaveBeenCalledWith(inputId, true);
    });

    it('activateMember_nonExistentMemberId_throwsNotFoundError', async () => {
        mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.activateMember(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('deleteMember', () => {
    it('deleteMember_existingMemberId_callsRepositoryDelete', async () => {
        mockUserRepo.delete.mockResolvedValue(undefined);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = MEMBER_ID;

        const act = service.deleteMember(inputId);

        await expect(act).resolves.toBeUndefined();
        expect(mockUserRepo.delete).toHaveBeenCalledWith(inputId);
    });

    it('deleteMember_nonExistentMemberId_throwsNotFoundError', async () => {
        mockUserRepo.delete.mockRejectedValue(new NotFoundError('Member not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.deleteMember(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('deleteAdmin', () => {
    it('deleteAdmin_existingAdminId_callsRepositoryDelete', async () => {
        mockUserRepo.delete.mockResolvedValue(undefined);
        const service = UserService.getInstance(mockUserRepo);
        const inputId = ADMIN_ID;

        const act = service.deleteAdmin(inputId);

        await expect(act).resolves.toBeUndefined();
        expect(mockUserRepo.delete).toHaveBeenCalledWith(inputId);
    });

    it('deleteAdmin_nonExistentAdminId_throwsNotFoundError', async () => {
        mockUserRepo.delete.mockRejectedValue(new NotFoundError('Admin not found'));
        const service = UserService.getInstance(mockUserRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.deleteAdmin(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});