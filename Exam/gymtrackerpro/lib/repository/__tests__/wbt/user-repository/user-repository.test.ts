import bcrypt from 'bcryptjs';
import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {
    AdminWithUser,
    MemberWithUser,
    Role,
    User,
    UserWithProfile,
} from '@/lib/domain/user';
import {
    CreateAdminInput,
    CreateMemberInput,
    UpdateAdminInput,
    UpdateMemberInput,
} from '@/lib/schema/user-schema';
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {UserRepository} from '@/lib/repository/user-repository';

jest.mock('bcryptjs', () => ({hash: jest.fn()}));

const prismaMock = mockDeep<PrismaClient>();

const USER_ID: string = 'user-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-002';
const NONEXISTENT_ID: string = 'nonexistent-id';
const MEMBER_EMAIL: string = 'member@example.com';
const ADMIN_EMAIL: string = 'admin@example.com';
const UNKNOWN_EMAIL: string = 'unknown@example.com';

const MOCK_USER: User = {
    id: USER_ID,
    email: MEMBER_EMAIL,
    fullName: 'Alice Smith',
    phone: '+40700000001',
    dateOfBirth: new Date('1990-01-01'),
    passwordHash: 'hashed-password',
    role: Role.MEMBER,
};

const MOCK_ADMIN_USER: User = {
    ...MOCK_USER,
    id: 'user-uuid-admin',
    email: ADMIN_EMAIL,
    role: Role.ADMIN,
};

const MOCK_MEMBER_RAW = {
    id: MEMBER_ID,
    userId: USER_ID,
    membershipStart: new Date('2024-01-01'),
    isActive: true,
};

const MOCK_ADMIN_RAW = {
    id: ADMIN_ID,
    userId: 'user-uuid-admin',
};

const MOCK_MEMBER_WITH_USER: MemberWithUser = {
    ...MOCK_MEMBER_RAW,
    user: MOCK_USER,
};

const MOCK_ADMIN_WITH_USER: AdminWithUser = {
    ...MOCK_ADMIN_RAW,
    user: MOCK_ADMIN_USER,
};

const MOCK_USER_WITH_PROFILE: UserWithProfile = {
    ...MOCK_USER,
    member: MOCK_MEMBER_RAW,
    admin: null,
};

const CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: MEMBER_EMAIL,
    fullName: 'Alice Smith',
    phone: '+40700000001',
    dateOfBirth: '1990-01-01',
    password: 'plainPassword123',
    membershipStart: '2024-01-01',
} as const;

const CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: ADMIN_EMAIL,
    fullName: 'Bob Admin',
    phone: '+40700000002',
    dateOfBirth: '1985-05-15',
    password: 'adminPassword123',
} as const;

beforeEach(() => {
    mockReset(prismaMock);
    (UserRepository as unknown as { instance: unknown }).instance = undefined;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
});

describe('createMember', () => {

    describe('Independent Paths', () => {

        it('createMember_Path1_emailUnique_returnsMemberWithUser', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...CREATE_MEMBER_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                ...MOCK_USER,
                member: MOCK_MEMBER_RAW,
            } as UserWithProfile);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.createMember(inputData);

            // Assert
            expect(result).toMatchObject({
                id: MOCK_MEMBER_RAW.id,
                userId: USER_ID,
                user: expect.objectContaining({email: MEMBER_EMAIL}),
            });
        });

        it('createMember_Path2_emailConflicts_throwsConflictError', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...CREATE_MEMBER_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.createMember(inputData);

            // Assert
            await expect(action()).rejects.toThrow(ConflictError);
            await expect(action()).rejects.toThrow(`Email already in use: ${inputData.email}`);
        });

        it('createMember_Path3_prismaCreateFails_throwsTransactionError', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...CREATE_MEMBER_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockRejectedValue(new Error('db error'));

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.createMember(inputData);

            // Assert
            await expect(action()).rejects.toThrow(TransactionError);
            await expect(action()).rejects.toThrow('Failed to create member: db error');
        });

    });

});

describe('createAdmin', () => {

    describe('Independent Paths', () => {

        it('createAdmin_Path1_emailUnique_returnsAdminWithUser', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...CREATE_ADMIN_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                ...MOCK_ADMIN_USER,
                admin: MOCK_ADMIN_RAW,
            } as UserWithProfile);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.createAdmin(inputData);

            // Assert
            expect(result).toMatchObject({
                id: MOCK_ADMIN_RAW.id,
                userId: MOCK_ADMIN_RAW.userId,
                user: expect.objectContaining({email: ADMIN_EMAIL}),
            });
        });

        it('createAdmin_Path2_emailConflicts_throwsConflictError', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...CREATE_ADMIN_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(MOCK_ADMIN_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.createAdmin(inputData);

            // Assert
            await expect(action()).rejects.toThrow(ConflictError);
            await expect(action()).rejects.toThrow(`Email already in use: ${inputData.email}`);
        });

        it('createAdmin_Path3_prismaCreateFails_throwsTransactionError', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...CREATE_ADMIN_INPUT};
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockRejectedValue(new Error('db error'));

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.createAdmin(inputData);

            // Assert
            await expect(action()).rejects.toThrow(TransactionError);
            await expect(action()).rejects.toThrow('Failed to create admin: db error');
        });

    });

});

describe('findById', () => {

    describe('Independent Paths', () => {

        it('findById_Path1_userExists_returnsUserWithProfile', async () => {
            // Arrange
            const inputId: string = USER_ID;
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findById(inputId);

            // Assert
            expect(result).toEqual(MOCK_USER_WITH_PROFILE);
        });

        it('findById_Path2_userNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.user.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.findById(inputId);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`User not found: ${inputId}`);
        });

    });

});

describe('findMemberById', () => {

    describe('Independent Paths', () => {

        it('findMemberById_Path1_memberExists_returnsMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findMemberById(inputId);

            // Assert
            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('findMemberById_Path2_memberNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.findMemberById(inputId);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Member not found: ${inputId}`);
        });

    });

});

describe('findAdminById', () => {

    describe('Independent Paths', () => {

        it('findAdminById_Path1_adminExists_returnsAdminWithUser', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAdminById(inputId);

            // Assert
            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('findAdminById_Path2_adminNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.findAdminById(inputId);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Admin not found: ${inputId}`);
        });

    });

});

describe('findByEmail', () => {

    describe('Independent Paths', () => {

        it('findByEmail_Path1_userExists_returnsUserWithProfile', async () => {
            // Arrange
            const inputEmail: string = MEMBER_EMAIL;
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findByEmail(inputEmail);

            // Assert
            expect(result).toEqual(MOCK_USER_WITH_PROFILE);
        });

        it('findByEmail_Path1_userNotFound_returnsNull', async () => {
            // Arrange
            const inputEmail: string = UNKNOWN_EMAIL;
            prismaMock.user.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findByEmail(inputEmail);

            // Assert
            expect(result).toBeNull();
        });

    });

});

describe('findMembers', () => {

    describe('Independent Paths', () => {

        it('findMembers_Path1_noSearch_returnsPageResultWithNoFilter', async () => {
            // Arrange
            const inputOptions = {};
            prismaMock.$transaction.mockResolvedValue([[MOCK_MEMBER_WITH_USER], 1]);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findMembers(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_MEMBER_WITH_USER], total: 1});
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

        it('findMembers_Path2_searchProvided_returnsPageResultWithNameEmailFilter', async () => {
            // Arrange
            const inputOptions = {search: 'alice'};
            prismaMock.$transaction.mockResolvedValue([[MOCK_MEMBER_WITH_USER], 1]);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findMembers(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_MEMBER_WITH_USER], total: 1});
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

    });

});

describe('findAdmins', () => {

    describe('Independent Paths', () => {

        it('findAdmins_Path1_noSearch_returnsPageResultWithNoFilter', async () => {
            // Arrange
            const inputOptions = {};
            prismaMock.$transaction.mockResolvedValue([[MOCK_ADMIN_WITH_USER], 1]);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAdmins(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_ADMIN_WITH_USER], total: 1});
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

        it('findAdmins_Path2_searchProvided_returnsPageResultWithNameEmailFilter', async () => {
            // Arrange
            const inputOptions = {search: 'bob'};
            prismaMock.$transaction.mockResolvedValue([[MOCK_ADMIN_WITH_USER], 1]);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAdmins(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_ADMIN_WITH_USER], total: 1});
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

    });

});

describe('updateMember', () => {

    describe('Independent Paths', () => {

        it('updateMember_Path1_noEmailNoPassword_returnsUpdatedMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            const updatedMember: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_USER, fullName: 'Updated Name'}
            };
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(updatedMember);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedMember);
        });

        it('updateMember_Path2_memberNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            prismaMock.member.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateMember(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Member not found: ${inputId}`);
        });

        it('updateMember_Path3_newEmailNoConflict_returnsUpdatedMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'new@example.com'};
            const updatedMember: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_USER, email: 'new@example.com'}
            };
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.member.update.mockResolvedValue(updatedMember);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedMember);
        });

        it('updateMember_Path4_newEmailConflicts_throwsConflictError', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'taken@example.com'};
            const conflictUser: User = {...MOCK_USER, id: 'other-user-id', email: 'taken@example.com'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(conflictUser);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateMember(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(ConflictError);
            await expect(action()).rejects.toThrow(`Email already in use: ${inputData.email}`);
        });

        it('updateMember_Path5_passwordProvided_hashesAndReturnsUpdatedMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: 'newPass123'};
            const updatedMember: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_USER, passwordHash: 'hashed-password'}
            };
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(updatedMember);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateMember(inputId, inputData);

            // Assert
            expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 12);
            expect(result).toEqual(updatedMember);
        });

        it('updateMember_Path6_prismaUpdateFails_throwsTransactionError', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Name'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockRejectedValue(new Error('db error'));

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateMember(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(TransactionError);
            await expect(action()).rejects.toThrow('Failed to update member: db error');
        });

    });

});

describe('setMemberActive', () => {

    describe('Independent Paths', () => {

        it('setMemberActive_Path1_memberExists_returnsDeactivatedMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputIsActive: boolean = false;
            const deactivatedMember: MemberWithUser = {...MOCK_MEMBER_WITH_USER, isActive: false};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_RAW);
            prismaMock.member.update.mockResolvedValue(deactivatedMember);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.setMemberActive(inputId, inputIsActive);

            // Assert
            expect(result).toEqual(deactivatedMember);
            expect(result.isActive).toBe(false);
        });

        it('setMemberActive_Path2_memberNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputIsActive: boolean = true;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.setMemberActive(inputId, inputIsActive);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Member not found: ${inputId}`);
        });

    });

});

describe('updateAdmin', () => {

    describe('Independent Paths', () => {

        it('updateAdmin_Path1_noEmailNoPassword_returnsUpdatedAdminWithUser', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Updated Admin Name'};
            const updatedAdmin: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_ADMIN_USER, fullName: 'Updated Admin Name'}
            };
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(updatedAdmin);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedAdmin);
        });

        it('updateAdmin_Path2_adminNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateAdminInput = {fullName: 'Updated Admin Name'};
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateAdmin(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Admin not found: ${inputId}`);
        });

        it('updateAdmin_Path3_newEmailNoConflict_returnsUpdatedAdminWithUser', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'newadmin@example.com'};
            const updatedAdmin: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_ADMIN_USER, email: 'newadmin@example.com'}
            };
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.admin.update.mockResolvedValue(updatedAdmin);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedAdmin);
        });

        it('updateAdmin_Path4_newEmailConflicts_throwsConflictError', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'taken@example.com'};
            const conflictUser: User = {...MOCK_ADMIN_USER, id: 'other-user-id', email: 'taken@example.com'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(conflictUser);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateAdmin(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(ConflictError);
            await expect(action()).rejects.toThrow(`Email already in use: ${inputData.email}`);
        });

        it('updateAdmin_Path5_passwordProvided_hashesAndReturnsUpdatedAdminWithUser', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: 'newAdminPass123'};
            const updatedAdmin: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_ADMIN_USER, passwordHash: 'hashed-password'}
            };
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(updatedAdmin);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateAdmin(inputId, inputData);

            // Assert
            expect(bcrypt.hash).toHaveBeenCalledWith('newAdminPass123', 12);
            expect(result).toEqual(updatedAdmin);
        });

        it('updateAdmin_Path6_prismaUpdateFails_throwsTransactionError', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Name'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockRejectedValue(new Error('db error'));

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.updateAdmin(inputId, inputData);

            // Assert
            await expect(action()).rejects.toThrow(TransactionError);
            await expect(action()).rejects.toThrow('Failed to update admin: db error');
        });

    });

});

describe('delete', () => {

    describe('Independent Paths', () => {

        it('delete_Path1_memberProfileFound_resolvesVoid', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_RAW);
            prismaMock.user.delete.mockResolvedValue(MOCK_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.delete(inputId);

            // Assert
            expect(result).toBeUndefined();
            expect(prismaMock.user.delete).toHaveBeenCalledWith({where: {id: MOCK_MEMBER_RAW.userId}});
            expect(prismaMock.admin.findUnique).not.toHaveBeenCalled();
        });

        it('delete_Path2_adminProfileFound_resolvesVoid', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_RAW);
            prismaMock.user.delete.mockResolvedValue(MOCK_ADMIN_USER);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const result = await repository.delete(inputId);

            // Assert
            expect(result).toBeUndefined();
            expect(prismaMock.user.delete).toHaveBeenCalledWith({where: {id: MOCK_ADMIN_RAW.userId}});
        });

        it('delete_Path3_noProfileFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const repository = UserRepository.getInstance(prismaMock);

            // Act
            const action = async () => repository.delete(inputId);

            // Assert
            await expect(action()).rejects.toThrow(NotFoundError);
            await expect(action()).rejects.toThrow(`Member or admin not found: ${inputId}`);
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
        const instance = UserRepository.getInstance(prismaMock);

        // Assert
        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(UserRepository);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        // Arrange
        const firstCall = UserRepository.getInstance(prismaMock);
        const secondPrismaMock = mockDeep<PrismaClient>();

        // Act
        const secondCall = UserRepository.getInstance(secondPrismaMock);

        // Assert
        expect(secondCall).toBe(firstCall);

        const internalClient = (secondCall as unknown as { database: unknown }).database;
        expect(internalClient).toBe(prismaMock);
        expect(internalClient).not.toBe(secondPrismaMock);
    });

});
