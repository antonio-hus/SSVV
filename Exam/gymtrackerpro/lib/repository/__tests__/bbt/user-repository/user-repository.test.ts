import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import type {User, UserWithProfile, MemberWithUser, AdminWithUser} from "@/lib/domain/user";
import {Role} from "@/lib/domain/user";
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {CreateAdminInput, CreateMemberInput} from "@/lib/schema/user-schema";
import {UserRepository} from '@/lib/repository/user-repository';

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const prismaMock = mockDeep<PrismaClient>();

const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const USER_ID: string = 'user-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_USER: User = {
    id: USER_ID,
    email: 'john@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: new Date('1990-01-15'),
    passwordHash: 'hashed_password',
    role: Role.MEMBER,
};

const MOCK_MEMBER_WITH_USER: MemberWithUser = {
    id: MEMBER_ID,
    userId: USER_ID,
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: {...MOCK_USER},
};

const MOCK_ADMIN_WITH_USER: AdminWithUser = {
    id: ADMIN_ID,
    userId: USER_ID,
    user: {...MOCK_USER, role: Role.ADMIN},
};

const MOCK_USER_WITH_PROFILE: UserWithProfile = {
    ...MOCK_USER,
    member: null,
    admin: null,
};

const CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: 'john@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1',
    membershipStart: '2024-01-01',
} as const;

const CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin User Test',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminP@ss1',
} as const;

beforeEach(() => {
    mockReset(prismaMock);
    (UserRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('createMember', () => {
    it('createMember_emailNotRegistered_returnsMemberWithUser', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            ...MOCK_USER,
            member: {id: MEMBER_ID, userId: USER_ID, membershipStart: new Date('2024-01-01'), isActive: true},
            admin: null,
        } as UserWithProfile);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_MEMBER_INPUT;

        const result = await repo.createMember(inputData);

        expect(result.id).toBe(MEMBER_ID);
        expect(result.user).toBeDefined();
    });

    it('createMember_emailAlreadyRegistered_throwsConflictError', async () => {
        prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_MEMBER_INPUT;

        const act = repo.createMember(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('createMember_databaseWriteFails_throwsTransactionError', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockRejectedValue(new Error('DB connection failed'));
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_MEMBER_INPUT;

        const act = repo.createMember(inputData);

        await expect(act).rejects.toThrow(TransactionError);
    });

    it('createMember_emailNotRegistered_storesHashedPasswordNotPlaintext', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            ...MOCK_USER,
            member: {id: MEMBER_ID, userId: USER_ID, membershipStart: new Date('2024-01-01'), isActive: true},
            admin: null,
        } as UserWithProfile);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_MEMBER_INPUT;

        await repo.createMember(inputData);

        const createCall = prismaMock.user.create.mock.calls[0][0];
        expect(createCall.data.passwordHash).toBe('hashed_password');
        expect(createCall.data.passwordHash).not.toBe(inputData.password);
    });
});

describe('createAdmin', () => {
    it('createAdmin_emailNotRegistered_returnsAdminWithUser', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            ...MOCK_USER,
            role: Role.ADMIN,
            member: null,
            admin: {id: ADMIN_ID, userId: USER_ID},
        } as UserWithProfile);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_ADMIN_INPUT;

        const result = await repo.createAdmin(inputData);

        expect(result.id).toBe(ADMIN_ID);
        expect(result.user).toBeDefined();
    });

    it('createAdmin_emailAlreadyRegistered_throwsConflictError', async () => {
        prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_ADMIN_INPUT;

        const act = repo.createAdmin(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('createAdmin_databaseWriteFails_throwsTransactionError', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockRejectedValue(new Error('DB connection failed'));
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_ADMIN_INPUT;

        const act = repo.createAdmin(inputData);

        await expect(act).rejects.toThrow(TransactionError);
    });

    it('createAdmin_emailNotRegistered_storesHashedPasswordNotPlaintext', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            ...MOCK_USER,
            role: Role.ADMIN,
            member: null,
            admin: {id: ADMIN_ID, userId: USER_ID},
        } as UserWithProfile);
        const repo = UserRepository.getInstance(prismaMock);
        const inputData = CREATE_ADMIN_INPUT;

        await repo.createAdmin(inputData);

        const createCall = prismaMock.user.create.mock.calls[0][0];
        expect(createCall.data.passwordHash).toBe('hashed_password');
        expect(createCall.data.passwordHash).not.toBe(inputData.password);
    });
});

describe('findById', () => {
    it('findById_existingUserId_returnsUserWithProfile', async () => {
        prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = USER_ID;

        const result = await repo.findById(inputId);

        expect(result.id).toBe(USER_ID);
        expect(result.email).toBe(MOCK_USER.email);
    });

    it('findById_nonExistentUserId_throwsNotFoundError', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.findById(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('findMemberById', () => {
    it('findMemberById_existingMemberId_returnsMemberWithUser', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;

        const result = await repo.findMemberById(inputId);

        expect(result.id).toBe(MEMBER_ID);
        expect(result.user).toBeDefined();
    });

    it('findMemberById_nonExistentMemberId_throwsNotFoundError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.findMemberById(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('findAdminById', () => {
    it('findAdminById_existingAdminId_returnsAdminWithUser', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;

        const result = await repo.findAdminById(inputId);

        expect(result.id).toBe(ADMIN_ID);
        expect(result.user).toBeDefined();
    });

    it('findAdminById_nonExistentAdminId_throwsNotFoundError', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.findAdminById(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('findByEmail', () => {
    it('findByEmail_registeredEmail_returnsUserWithProfile', async () => {
        prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);
        const repo = UserRepository.getInstance(prismaMock);
        const inputEmail = 'john@example.com';

        const result = await repo.findByEmail(inputEmail);

        expect(result).not.toBeNull();
        expect(result?.email).toBe('john@example.com');
    });

    it('findByEmail_unregisteredEmail_returnsNull', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputEmail = 'notfound@example.com';

        const result = await repo.findByEmail(inputEmail);

        expect(result).toBeNull();
    });
});

describe('findMembers', () => {
    it('findMembers_noOptions_returnsDefaultPageWithTotal', async () => {
        prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
        prismaMock.member.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        const result = await repo.findMembers();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('findMembers_withSearchTerm_passesSearchFilterToQuery', async () => {
        prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
        prismaMock.member.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {search: 'John'};

        const result = await repo.findMembers(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('findMembers_withPagination_returnsRequestedPage', async () => {
        prismaMock.member.findMany.mockResolvedValue([]);
        prismaMock.member.count.mockResolvedValue(15);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        const result = await repo.findMembers(inputOptions);

        expect(result.total).toBe(15);
        expect(result.items).toHaveLength(0);
    });

    it('findMembers_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
        prismaMock.member.findMany.mockResolvedValue([]);
        prismaMock.member.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        const result = await repo.findMembers();

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('findMembers_defaultPagination_skipIsZero', async () => {
        prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
        prismaMock.member.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        await repo.findMembers();

        const findManyCall = prismaMock.member.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(0);
        expect(findManyCall?.take).toBe(10);
    });

    it('findMembers_page2_skipIs10', async () => {
        prismaMock.member.findMany.mockResolvedValue([]);
        prismaMock.member.count.mockResolvedValue(15);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        await repo.findMembers(inputOptions);

        const findManyCall = prismaMock.member.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(10);
        expect(findManyCall?.take).toBe(10);
    });

    it('findMembers_withPageSize5_take5', async () => {
        prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
        prismaMock.member.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 1, pageSize: 5};

        await repo.findMembers(inputOptions);

        const findManyCall = prismaMock.member.findMany.mock.calls[0][0];
        expect(findManyCall?.take).toBe(5);
    });
});

describe('findAdmins', () => {
    it('findAdmins_noOptions_returnsDefaultPageWithTotal', async () => {
        prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
        prismaMock.admin.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        const result = await repo.findAdmins();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('findAdmins_withSearchTerm_passesSearchFilterToQuery', async () => {
        prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
        prismaMock.admin.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {search: 'Admin'};

        const result = await repo.findAdmins(inputOptions);

        expect(result.items).toHaveLength(1);
    });

    it('findAdmins_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
        prismaMock.admin.findMany.mockResolvedValue([]);
        prismaMock.admin.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        const result = await repo.findAdmins();

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('findAdmins_withPagination_returnsRequestedPage', async () => {
        prismaMock.admin.findMany.mockResolvedValue([]);
        prismaMock.admin.count.mockResolvedValue(15);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        const result = await repo.findAdmins(inputOptions);

        expect(result.total).toBe(15);
        expect(result.items).toHaveLength(0);
    });

    it('findAdmins_defaultPagination_skipIsZero', async () => {
        prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
        prismaMock.admin.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);

        await repo.findAdmins();

        const findManyCall = prismaMock.admin.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(0);
        expect(findManyCall?.take).toBe(10);
    });

    it('findAdmins_page2_skipIs10', async () => {
        prismaMock.admin.findMany.mockResolvedValue([]);
        prismaMock.admin.count.mockResolvedValue(15);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        await repo.findAdmins(inputOptions);

        const findManyCall = prismaMock.admin.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(10);
        expect(findManyCall?.take).toBe(10);
    });

    it('findAdmins_withPageSize5_take5', async () => {
        prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
        prismaMock.admin.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = UserRepository.getInstance(prismaMock);
        const inputOptions = {page: 1, pageSize: 5};

        await repo.findAdmins(inputOptions);

        const findManyCall = prismaMock.admin.findMany.mock.calls[0][0];
        expect(findManyCall?.take).toBe(5);
    });
});

describe('updateMember', () => {
    it('updateMember_existingMemberValidData_returnsMemberWithUser', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.member.update.mockResolvedValue({
            ...MOCK_MEMBER_WITH_USER,
            user: {...MOCK_USER, fullName: 'Updated Name'},
        } as MemberWithUser);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputData = {fullName: 'Updated Name'};

        const result = await repo.updateMember(inputId, inputData);

        expect(result.user.fullName).toBe('Updated Name');
    });

    it('updateMember_nonExistentMember_throwsNotFoundError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputData = {fullName: 'Name'};

        const act = repo.updateMember(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateMember_newEmailAlreadyRegistered_throwsConflictError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.user.findUnique.mockResolvedValue({...MOCK_USER, id: 'other-user-id'});
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputData = {email: 'taken@example.com'};

        const act = repo.updateMember(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('updateMember_sameEmailAsCurrentUser_skipsConflictCheck', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputData = {email: MOCK_USER.email};

        await repo.updateMember(inputId, inputData);

        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('updateMember_withNewPassword_hashesPasswordBeforePersisting', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputData = {password: 'NewPass1!'};

        await repo.updateMember(inputId, inputData);

        const updateCall = prismaMock.member.update.mock.calls[0][0];
        expect(updateCall.data.user?.update?.passwordHash).toBe('hashed_password');
    });

    it('updateMember_databaseWriteFails_throwsTransactionError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.member.update.mockRejectedValue(new Error('DB connection failed'));
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputData = {fullName: 'New Name'};

        const act = repo.updateMember(inputId, inputData);

        await expect(act).rejects.toThrow(TransactionError);
    });
});

describe('setMemberActive', () => {
    it('setMemberActive_existingMemberIsActiveFalse_suspendsMember', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.member.update.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: false});
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputIsActive = false;

        const result = await repo.setMemberActive(inputId, inputIsActive);

        expect(result.isActive).toBe(false);
    });

    it('setMemberActive_existingMemberIsActiveTrue_activatesMember', async () => {
        prismaMock.member.findUnique.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: false});
        prismaMock.member.update.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: true});
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;
        const inputIsActive = true;

        const result = await repo.setMemberActive(inputId, inputIsActive);

        expect(result.isActive).toBe(true);
    });

    it('setMemberActive_nonExistentMember_throwsNotFoundError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputIsActive = true;

        const act = repo.setMemberActive(inputId, inputIsActive);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('updateAdmin', () => {
    it('updateAdmin_existingAdminValidData_returnsAdminWithUser', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.admin.update.mockResolvedValue({
            ...MOCK_ADMIN_WITH_USER,
            user: {...MOCK_USER, fullName: 'Updated Admin'},
        } as AdminWithUser);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;
        const inputData = {fullName: 'Updated Admin'};

        const result = await repo.updateAdmin(inputId, inputData);

        expect(result.user.fullName).toBe('Updated Admin');
    });

    it('updateAdmin_nonExistentAdmin_throwsNotFoundError', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputData = {fullName: 'Name'};

        const act = repo.updateAdmin(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateAdmin_newEmailAlreadyRegistered_throwsConflictError', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.user.findUnique.mockResolvedValue({...MOCK_USER, id: 'other-user-id'});
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;
        const inputData = {email: 'taken@example.com'};

        const act = repo.updateAdmin(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('updateAdmin_sameEmailAsCurrentUser_skipsConflictCheck', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;
        const inputData = {email: MOCK_ADMIN_WITH_USER.user.email};

        await repo.updateAdmin(inputId, inputData);

        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('updateAdmin_withNewPassword_hashesPasswordBeforePersisting', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;
        const inputData = {password: 'NewAdminPass1!'};

        await repo.updateAdmin(inputId, inputData);

        const updateCall = prismaMock.admin.update.mock.calls[0][0];
        expect(updateCall.data.user?.update?.passwordHash).toBe('hashed_password');
    });

    it('updateAdmin_databaseWriteFails_throwsTransactionError', async () => {
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.admin.update.mockRejectedValue(new Error('DB connection failed'));
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;
        const inputData = {fullName: 'New Name'};

        const act = repo.updateAdmin(inputId, inputData);

        await expect(act).rejects.toThrow(TransactionError);
    });
});

describe('delete', () => {
    it('delete_existingMemberId_resolvesWithoutError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
        prismaMock.admin.findUnique.mockResolvedValue(null);
        prismaMock.user.delete.mockResolvedValue(MOCK_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = MEMBER_ID;

        const act = repo.delete(inputId);

        await expect(act).resolves.toBeUndefined();
    });

    it('delete_existingAdminId_resolvesWithoutError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
        prismaMock.user.delete.mockResolvedValue(MOCK_USER);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = ADMIN_ID;

        const act = repo.delete(inputId);

        await expect(act).resolves.toBeUndefined();
    });

    it('delete_nonExistentId_throwsNotFoundError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        prismaMock.admin.findUnique.mockResolvedValue(null);
        const repo = UserRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.delete(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});