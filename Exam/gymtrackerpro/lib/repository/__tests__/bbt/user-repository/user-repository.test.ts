import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import type {
    User,
    UserWithProfile,
    MemberWithUser,
    AdminWithUser,
    AdminListOptions,
    MemberListOptions
} from "@/lib/domain/user";
import {Role} from "@/lib/domain/user";
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {CreateAdminInput, CreateMemberInput, UpdateAdminInput, UpdateMemberInput} from "@/lib/schema/user-schema";
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

const mockTransaction = () => {
    prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
};

beforeEach(() => {
    mockReset(prismaMock);
    (UserRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('createMember', () => {
    describe('Equivalence Classes', () => {
        it('createMember_EC_emailNotRegistered_returnsUserWithProfile', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                ...MOCK_USER,
                member: {id: MEMBER_ID, userId: USER_ID, membershipStart: new Date('2024-01-01'), isActive: true},
            } as UserWithProfile);

            const result = await repo.createMember(inputMember);

            expect(result.id).toBe(MEMBER_ID);
            expect(result.user).toBeDefined();
        });

        it('createMember_EC_emailAlreadyRegistered_throwsConflictError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);

            const act = repo.createMember(inputMember);

            await expect(act).rejects.toThrow(ConflictError);
        });

        it('createMember_EC_databaseWriteFails_throwsTransactionError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockRejectedValue(new Error('DB connection failed'));

            const act = repo.createMember(inputMember);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });
});

describe('createAdmin', () => {
    describe('Equivalence Classes', () => {
        it('createAdmin_EC_emailNotRegistered_returnsUserWithProfile', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                ...MOCK_USER,
                role: Role.ADMIN,
                admin: {id: ADMIN_ID, userId: USER_ID},
            } as UserWithProfile);

            const result = await repo.createAdmin(inputAdmin);

            expect(result.id).toBe(ADMIN_ID);
            expect(result.user).toBeDefined();
        });

        it('createAdmin_EC_emailAlreadyRegistered_throwsConflictError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);

            const act = repo.createAdmin(inputAdmin);

            await expect(act).rejects.toThrow(ConflictError);
        });

        it('createAdmin_EC_databaseWriteFails_throwsTransactionError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockRejectedValue(new Error('DB connection failed'));

            const act = repo.createAdmin(inputAdmin);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });
});

describe('findById', () => {
    describe('Equivalence Classes', () => {
        it('findById_EC_existingUserId_returnsUserWithProfile', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = USER_ID;
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);

            const result = await repo.findById(inputId);

            expect(result.id).toBe(USER_ID);
            expect(result.email).toBe(MOCK_USER.email);
        });

        it('findById_EC_nonExistentUserId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.user.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findById_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_existingOneCharId_returnsUserWithProfile', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.user.findUnique.mockResolvedValue({...MOCK_USER_WITH_PROFILE, id: 'a'});

            const result = await repo.findById(inputId);

            expect(result.id).toBe('a');
        });
    });
});

describe('findMemberById', () => {
    describe('Equivalence Classes', () => {
        it('findMemberById_EC_existingMemberId_returnsMemberWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.findMemberById(inputId);

            expect(result.id).toBe(MEMBER_ID);
            expect(result.user).toBeDefined();
        });

        it('findMemberById_EC_nonExistentMemberId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.findMemberById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findMemberById_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.findMemberById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findMemberById_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.findMemberById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findMemberById_BVA_existingOneCharId_returnsMemberWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.member.findUnique.mockResolvedValue({...MOCK_MEMBER_WITH_USER, id: 'a'});

            const result = await repo.findMemberById(inputId);

            expect(result.id).toBe('a');
        });
    });
});

describe('findAdminById', () => {
    describe('Equivalence Classes', () => {
        it('findAdminById_EC_existingAdminId_returnsAdminWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.findAdminById(inputId);

            expect(result.id).toBe(ADMIN_ID);
            expect(result.user).toBeDefined();
        });

        it('findAdminById_EC_nonExistentAdminId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.findAdminById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findAdminById_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.findAdminById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findAdminById_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.findAdminById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findAdminById_BVA_existingOneCharId_returnsAdminWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.admin.findUnique.mockResolvedValue({...MOCK_ADMIN_WITH_USER, id: 'a'});

            const result = await repo.findAdminById(inputId);

            expect(result.id).toBe('a');
        });
    });
});

describe('findByEmail', () => {
    describe('Equivalence Classes', () => {
        it('findByEmail_EC_registeredEmail_returnsUserWithProfile', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputEmail = 'john@example.com';
            prismaMock.user.findUnique.mockResolvedValue(MOCK_USER_WITH_PROFILE);

            const result = await repo.findByEmail(inputEmail);

            expect(result).not.toBeNull();
            expect(result?.email).toBe('john@example.com');
        });

        it('findByEmail_EC_unregisteredEmail_returnsNull', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputEmail = 'notfound@example.com';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await repo.findByEmail(inputEmail);

            expect(result).toBeNull();
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findByEmail_BVA_emptyEmail_returnsNull', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputEmail = '';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await repo.findByEmail(inputEmail);

            expect(result).toBeNull();
        });

        it('findByEmail_BVA_oneCharEmail_returnsNull', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputEmail = 'a';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await repo.findByEmail(inputEmail);

            expect(result).toBeNull();
        });
    });
});

describe('findMembers', () => {
    describe('Equivalence Classes', () => {
        it('findMembers_EC_noOptions_returnsDefaultPageWithTotal', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers();

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findMembers_EC_withSearchTerm_returnsMatchingItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions = {search: 'John'};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findMembers_EC_multipleMembers_returnsMembersOrderedByFullNameAscending', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const memberAlice: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                id: 'member-uuid-002',
                user: {...MOCK_USER, fullName: 'Alice Brown'},
            };
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([memberAlice, MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(2);

            const result = await repo.findMembers();

            expect(result.items[0].user.fullName).toBe('Alice Brown');
            expect(result.items[1].user.fullName).toBe('John Doe');
        });

        it('findMembers_EC_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([]);
            prismaMock.member.count.mockResolvedValue(0);

            const result = await repo.findMembers();

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findMembers_BVA_searchUndefined_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {search: undefined};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_searchEmpty_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {search: ''};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_searchOneChar_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {search: 'a'};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_pageUndefined_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {page: undefined};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_page0_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {page: 0, pageSize: 10};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_page1_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {page: 1, pageSize: 10};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_page2_returnsSecondPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {page: 2, pageSize: 10};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([]);
            prismaMock.member.count.mockResolvedValue(15);

            const result = await repo.findMembers(inputOptions);

            expect(result.total).toBe(15);
            expect(result.items).toHaveLength(0);
        });

        it('findMembers_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {pageSize: undefined};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(1);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findMembers_BVA_pageSize0_returnsNoItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {pageSize: 0};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([]);
            prismaMock.member.count.mockResolvedValue(5);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(5);
        });

        it('findMembers_BVA_pageSize1_returnsOneItem', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: MemberListOptions = {pageSize: 1};
            mockTransaction();
            prismaMock.member.findMany.mockResolvedValue([MOCK_MEMBER_WITH_USER]);
            prismaMock.member.count.mockResolvedValue(5);

            const result = await repo.findMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });
    });
});

describe('findAdmins', () => {
    describe('Equivalence Classes', () => {
        it('findAdmins_EC_noOptions_returnsDefaultPageWithTotal', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins();

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findAdmins_EC_withSearchTerm_returnsMatchingItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {search: 'Admin'};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findAdmins_EC_multipleAdmins_returnsAdminsOrderedByFullNameAscending', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const adminAlice: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                id: 'admin-uuid-002',
                user: {...MOCK_USER, role: Role.ADMIN, fullName: 'Alice Brown'},
            };
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([adminAlice, MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(2);

            const result = await repo.findAdmins();

            expect(result.items[0].user.fullName).toBe('Alice Brown');
            expect(result.items[1].user.fullName).toBe('John Doe');
        });

        it('findAdmins_EC_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([]);
            prismaMock.admin.count.mockResolvedValue(0);

            const result = await repo.findAdmins();

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findAdmins_BVA_searchUndefined_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {search: undefined};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_searchEmpty_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {search: ''};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_searchOneChar_returnsItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {search: 'a'};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_pageUndefined_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {page: undefined};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_page0_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {page: 0, pageSize: 10};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_page1_returnsFirstPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {page: 1, pageSize: 10};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_page2_returnsSecondPage', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {page: 2, pageSize: 10};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([]);
            prismaMock.admin.count.mockResolvedValue(15);

            const result = await repo.findAdmins(inputOptions);

            expect(result.total).toBe(15);
            expect(result.items).toHaveLength(0);
        });

        it('findAdmins_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {pageSize: undefined};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(1);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('findAdmins_BVA_pageSize0_returnsNoItems', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {pageSize: 0};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([]);
            prismaMock.admin.count.mockResolvedValue(5);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(5);
        });

        it('findAdmins_BVA_pageSize1_returnsOneItem', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputOptions: AdminListOptions = {pageSize: 1};
            mockTransaction();
            prismaMock.admin.findMany.mockResolvedValue([MOCK_ADMIN_WITH_USER]);
            prismaMock.admin.count.mockResolvedValue(5);

            const result = await repo.findAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });
    });
});

describe('updateMember', () => {
    describe('Equivalence Classes', () => {
        it('updateMember_EC_existingMemberValidData_returnsMemberWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue({
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_USER, fullName: 'Updated Name'},
            } as MemberWithUser);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.user.fullName).toBe('Updated Name');
        });

        it('updateMember_EC_nonExistentMember_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateMemberInput = {fullName: 'New Name'};
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateMember_EC_newEmailAlreadyRegistered_throwsConflictError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'taken@example.com'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue({...MOCK_USER, id: 'other-user-id'});

            const act = repo.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(ConflictError);
        });

        it('updateMember_EC_sameEmailAsCurrentUser_returnsUpdatedMember', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: MOCK_USER.email};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_EC_withNewPassword_returnsUpdatedMember', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: 'NewPass1!'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_EC_databaseWriteFails_throwsTransactionError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'New Name'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockRejectedValue(new Error('DB connection failed'));

            const act = repo.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMember_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            const inputData: UpdateMemberInput = {fullName: 'New Name'};
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateMemberInput = {fullName: 'New Name'};
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateMember_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateMemberInput = {fullName: 'New Name'};
            const existing = {...MOCK_MEMBER_WITH_USER, id: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(existing);
            prismaMock.member.update.mockResolvedValue({...existing, user: {...MOCK_USER, fullName: 'New Name'}} as never);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe('a');
        });

        it('updateMember_BVA_emailUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_emailEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_emailOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_fullNameEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_fullNameOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'A'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_phoneEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_phoneOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_dateOfBirthEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_dateOfBirthOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_passwordEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_passwordOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_membershipStartUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: undefined};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_membershipStartEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: ''};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });

        it('updateMember_BVA_membershipStartOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await repo.updateMember(inputId, inputData);

            expect(result.id).toBe(MEMBER_ID);
        });
    });
});

describe('setMemberActive', () => {
    describe('Equivalence Classes', () => {
        it('setMemberActive_EC_existingMemberSetFalse_suspendsMember', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputIsActive = false;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.member.update.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: false});

            const result = await repo.setMemberActive(inputId, inputIsActive);

            expect(result.isActive).toBe(false);
        });

        it('setMemberActive_EC_existingMemberSetTrue_activatesMember', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            const inputIsActive = true;
            prismaMock.member.findUnique.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: false});
            prismaMock.member.update.mockResolvedValue({...MOCK_MEMBER_WITH_USER, isActive: true});

            const result = await repo.setMemberActive(inputId, inputIsActive);

            expect(result.isActive).toBe(true);
        });

        it('setMemberActive_EC_nonExistentMember_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            const inputIsActive = true;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.setMemberActive(inputId, inputIsActive);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('setMemberActive_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.setMemberActive(inputId, true);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('setMemberActive_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.setMemberActive(inputId, true);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('setMemberActive_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            const existing = {...MOCK_MEMBER_WITH_USER, id: 'a'};
            prismaMock.member.findUnique.mockResolvedValue(existing);
            prismaMock.member.update.mockResolvedValue({...existing, isActive: true});

            const result = await repo.setMemberActive(inputId, true);

            expect(result.id).toBe('a');
        });
    });
});

describe('updateAdmin', () => {
    describe('Equivalence Classes', () => {
        it('updateAdmin_EC_existingAdminValidData_returnsAdminWithUser', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Updated Admin'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue({
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_USER, fullName: 'Updated Admin'},
            } as AdminWithUser);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.user.fullName).toBe('Updated Admin');
        });

        it('updateAdmin_EC_nonExistentAdmin_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateAdminInput = {fullName: 'Name'};
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateAdmin_EC_newEmailAlreadyRegistered_throwsConflictError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'taken@example.com'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue({...MOCK_USER, id: 'other-user-id'});

            const act = repo.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(ConflictError);
        });

        it('updateAdmin_EC_sameEmailAsCurrentUser_returnsUpdatedAdmin', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: MOCK_ADMIN_WITH_USER.user.email};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_EC_withNewPassword_returnsUpdatedAdmin', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: 'NewAdminPass1!'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_EC_databaseWriteFails_throwsTransactionError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'New Name'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockRejectedValue(new Error('DB connection failed'));

            const act = repo.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateAdmin_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            const inputData: UpdateAdminInput = {fullName: 'New Name'};
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateAdmin_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateAdminInput = {fullName: 'New Name'};
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateAdmin_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateAdminInput = {fullName: 'New Name'};
            const existing = {...MOCK_ADMIN_WITH_USER, id: 'a'};
            prismaMock.admin.findUnique.mockResolvedValue(existing);
            prismaMock.admin.update.mockResolvedValue({...existing, user: {...MOCK_USER, fullName: 'New Name'}} as never);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe('a');
        });

        it('updateAdmin_BVA_emailUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: undefined};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_emailEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: ''};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_emailOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'a'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: undefined};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_fullNameEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: ''};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_fullNameOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'A'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: undefined};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_phoneEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: ''};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_phoneOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: 'a'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: undefined};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_dateOfBirthEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: ''};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_dateOfBirthOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: 'a'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: undefined};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_passwordEmpty_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: ''};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });

        it('updateAdmin_BVA_passwordOneChar_updatesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: 'a'};
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.admin.update.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await repo.updateAdmin(inputId, inputData);

            expect(result.id).toBe(ADMIN_ID);
        });
    });
});

describe('delete', () => {
    describe('Equivalence Classes', () => {
        it('delete_EC_existingMemberId_resolvesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = MEMBER_ID;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER_WITH_USER);
            prismaMock.admin.findUnique.mockResolvedValue(null);
            prismaMock.user.delete.mockResolvedValue(MOCK_USER);

            const act = repo.delete(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('delete_EC_existingAdminId_resolvesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = ADMIN_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(MOCK_ADMIN_WITH_USER);
            prismaMock.user.delete.mockResolvedValue(MOCK_USER);

            const act = repo.delete(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('delete_EC_nonExistentId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('delete_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.member.findUnique.mockResolvedValue(null);
            prismaMock.admin.findUnique.mockResolvedValue(null);

            const act = repo.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const repo = UserRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.member.findUnique.mockResolvedValue({...MOCK_MEMBER_WITH_USER, id: 'a'});
            prismaMock.admin.findUnique.mockResolvedValue(null);
            prismaMock.user.delete.mockResolvedValue(MOCK_USER);

            const act = repo.delete(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});
