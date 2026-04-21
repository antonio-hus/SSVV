import {mock, mockReset} from 'jest-mock-extended';
import {AdminWithUser, MemberListOptions, MemberWithUser, Role, AdminListOptions} from '@/lib/domain/user';
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {UserService} from '@/lib/service/user-service';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput, UpdateAdminInput, UpdateMemberInput} from "@/lib/schema/user-schema";

const mockUserRepo = mock<UserRepositoryInterface>();

const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const USER_ID: string = 'user-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_USER = {
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

const CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: 'john@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1',
    membershipStart: '2024-01-01',
};

const CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin User Test',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminP@ss1',
};

beforeEach(() => {
    mockReset(mockUserRepo);
    (UserService as unknown as { instance: unknown }).instance = undefined;
});

describe('createMember', () => {
    describe('Equivalence Classes', () => {
        it('createMember_EC_emailNotRegistered_returnsMemberWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.createMember(inputMember);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
            expect(result.user.email).toBe(inputMember.email);
        });

        it('createMember_EC_emailAlreadyRegistered_throwsConflictError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            mockUserRepo.createMember.mockRejectedValue(new ConflictError('Email already registered'));

            const act = service.createMember(inputMember);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Email already registered');
        });

        it('createMember_EC_databaseWriteFails_throwsTransactionError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputMember: CreateMemberInput = CREATE_MEMBER_INPUT;
            mockUserRepo.createMember.mockRejectedValue(new TransactionError('DB failure'));

            const act = service.createMember(inputMember);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB failure');
        });
    });
});

describe('createMemberWithTempPassword', () => {
    describe('Equivalence Classes', () => {
        it('createMemberWithTempPassword_EC_validData_returnsMemberWithTempPassword', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'john@example.com',
                fullName: 'John Doe',
                phone: '+40712345678',
                dateOfBirth: '1990-01-15',
                membershipStart: '2024-01-01',
            };
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.createMemberWithTempPassword(inputData);

            expect(result.id).toBe(MEMBER_ID);
            expect(result.user.email).toBe(inputData.email);
            expect(result.tempPassword).toHaveLength(16);
        });

        it('createMemberWithTempPassword_EC_duplicateEmail_throwsConflictError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'taken@example.com',
                fullName: 'John Doe',
                phone: '+40712345678',
                dateOfBirth: '1990-01-15',
                membershipStart: '2024-01-01',
            };
            mockUserRepo.createMember.mockRejectedValue(new ConflictError('Email taken'));

            const act = service.createMemberWithTempPassword(inputData);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Email taken');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberWithTempPassword_BVA_tempPasswordLength16', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'john@example.com',
                fullName: 'John Doe',
                phone: '+40712345678',
                dateOfBirth: '1990-01-15',
                membershipStart: '2024-01-01',
            };
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.createMemberWithTempPassword(inputData);

            expect(result.tempPassword).toHaveLength(16);
        });

        it('createMemberWithTempPassword_BVA_tempPasswordStrength_containsRequiredCharacters', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'john@example.com',
                fullName: 'John Doe',
                phone: '+40712345678',
                dateOfBirth: '1990-01-15',
                membershipStart: '2024-01-01',
            };
            mockUserRepo.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.createMemberWithTempPassword(inputData);

            expect(/[A-Z]/.test(result.tempPassword)).toBe(true);
            expect(/[0-9]/.test(result.tempPassword)).toBe(true);
            expect(/[^A-Za-z0-9]/.test(result.tempPassword)).toBe(true);
        });
    });
});

describe('createAdmin', () => {
    describe('Equivalence Classes', () => {
        it('createAdmin_EC_emailNotRegistered_returnsAdminWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            const expectedReturn = {...MOCK_ADMIN_WITH_USER, user: {...MOCK_ADMIN_WITH_USER.user, email: CREATE_ADMIN_INPUT.email}};
            mockUserRepo.createAdmin.mockResolvedValue(expectedReturn);

            const result = await service.createAdmin(inputAdmin);

            expect(result).toEqual(expectedReturn);
            expect(result.user.email).toBe(CREATE_ADMIN_INPUT.email);
        });

        it('createAdmin_EC_emailAlreadyRegistered_throwsConflictError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            mockUserRepo.createAdmin.mockRejectedValue(new ConflictError('Email already registered'));

            const act = service.createAdmin(inputAdmin);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Email already registered');
        });

        it('createAdmin_EC_databaseWriteFails_throwsTransactionError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputAdmin: CreateAdminInput = CREATE_ADMIN_INPUT;
            mockUserRepo.createAdmin.mockRejectedValue(new TransactionError('DB failure'));

            const act = service.createAdmin(inputAdmin);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB failure');
        });
    });
});

describe('getMember', () => {
    describe('Equivalence Classes', () => {
        it('getMember_EC_existingMemberId_returnsMemberWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.getMember(inputId);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('getMember_EC_nonExistentMemberId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getMember_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getMember_BVA_existingOneCharId_returnsMemberWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const expectedReturn: MemberWithUser = {...MOCK_MEMBER_WITH_USER, id: 'a'};
            mockUserRepo.findMemberById.mockResolvedValue(expectedReturn);

            const result = await service.getMember(inputId);

            expect(result.id).toBe('a');
            expect(result.user).toEqual(MOCK_MEMBER_WITH_USER.user);
        });
    });
});

describe('getAdmin', () => {
    describe('Equivalence Classes', () => {
        it('getAdmin_EC_existingAdminId_returnsAdminWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            mockUserRepo.findAdminById.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.getAdmin(inputId);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('getAdmin_EC_nonExistentAdminId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.findAdminById.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.getAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Admin not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getAdmin_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.findAdminById.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.getAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getAdmin_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.findAdminById.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.getAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getAdmin_BVA_existingOneCharId_returnsAdminWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const expectedReturn: AdminWithUser = {...MOCK_ADMIN_WITH_USER, id: 'a'};
            mockUserRepo.findAdminById.mockResolvedValue(expectedReturn);

            const result = await service.getAdmin(inputId);

            expect(result.id).toBe('a');
            expect(result.user).toEqual(MOCK_ADMIN_WITH_USER.user);
        });
    });
});

describe('listMembers', () => {
    describe('Equivalence Classes', () => {
        it('listMembers_EC_noOptions_returnsDefaultPageWithTotal', async () => {
            const service = UserService.getInstance(mockUserRepo);
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers();

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_MEMBER_WITH_USER);
            expect(result.total).toBe(1);
        });

        it('listMembers_EC_withSearchTerm_returnsMatchingItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {search: 'John'};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_MEMBER_WITH_USER);
            expect(result.total).toBe(1);
        });

        it('listMembers_EC_multipleMembers_returnsMembersOrderedByFullNameAscending', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const memberAlice = {...MOCK_MEMBER_WITH_USER, user: {...MOCK_USER, fullName: 'Alice'}};
            mockUserRepo.findMembers.mockResolvedValue({items: [memberAlice, MOCK_MEMBER_WITH_USER], total: 2});

            const result = await service.listMembers();

            expect(result.items[0].user.fullName).toBe('Alice');
            expect(result.items[1].user.fullName).toBe('John Doe');
            expect(result.total).toBe(2);
        });

        it('listMembers_EC_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
            const service = UserService.getInstance(mockUserRepo);
            mockUserRepo.findMembers.mockResolvedValue({items: [], total: 0});

            const result = await service.listMembers();

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMembers_BVA_searchUndefined_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {search: undefined};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_searchEmpty_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {search: ''};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_searchOneChar_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {search: 'a'};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_pageUndefined_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {page: undefined};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_page0_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {page: 0};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_page1_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {page: 1};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_page2_returnsSecondPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {page: 2};
            mockUserRepo.findMembers.mockResolvedValue({items: [], total: 15});

            const result = await service.listMembers(inputOptions);

            expect(result.total).toBe(15);
            expect(result.items).toHaveLength(0);
        });

        it('listMembers_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {pageSize: undefined};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 1});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listMembers_BVA_pageSize0_returnsNoItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {pageSize: 0};
            mockUserRepo.findMembers.mockResolvedValue({items: [], total: 5});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(5);
        });

        it('listMembers_BVA_pageSize1_returnsOneItem', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: MemberListOptions = {pageSize: 1};
            mockUserRepo.findMembers.mockResolvedValue({items: [MOCK_MEMBER_WITH_USER], total: 5});

            const result = await service.listMembers(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });
    });
});

describe('listAdmins', () => {
    describe('Equivalence Classes', () => {
        it('listAdmins_EC_noOptions_returnsDefaultPageWithTotal', async () => {
            const service = UserService.getInstance(mockUserRepo);
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins();

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_ADMIN_WITH_USER);
            expect(result.total).toBe(1);
        });

        it('listAdmins_EC_withSearchTerm_returnsMatchingItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {search: 'Admin'};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_ADMIN_WITH_USER);
            expect(result.total).toBe(1);
        });

        it('listAdmins_EC_multipleAdmins_returnsAdminsOrderedByFullNameAscending', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const adminAlice = {...MOCK_ADMIN_WITH_USER, user: {...MOCK_USER, role: Role.ADMIN, fullName: 'Alice'}};
            mockUserRepo.findAdmins.mockResolvedValue({items: [adminAlice, MOCK_ADMIN_WITH_USER], total: 2});

            const result = await service.listAdmins();

            expect(result.items[0].user.fullName).toBe('Alice');
            expect(result.items[1].user.fullName).toBe('John Doe');
            expect(result.total).toBe(2);
        });

        it('listAdmins_EC_emptyDatabase_returnsEmptyPageWithZeroTotal', async () => {
            const service = UserService.getInstance(mockUserRepo);
            mockUserRepo.findAdmins.mockResolvedValue({items: [], total: 0});

            const result = await service.listAdmins();

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listAdmins_BVA_searchUndefined_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {search: undefined};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_searchEmpty_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {search: ''};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_searchOneChar_returnsItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {search: 'a'};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_pageUndefined_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {page: undefined};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_page0_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {page: 0};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_page1_returnsFirstPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {page: 1};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_page2_returnsSecondPage', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {page: 2};
            mockUserRepo.findAdmins.mockResolvedValue({items: [], total: 15});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(15);
        });

        it('listAdmins_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {pageSize: undefined};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 1});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('listAdmins_BVA_pageSize0_returnsNoItems', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {pageSize: 0};
            mockUserRepo.findAdmins.mockResolvedValue({items: [], total: 5});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(5);
        });

        it('listAdmins_BVA_pageSize1_returnsOneItem', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputOptions: AdminListOptions = {pageSize: 1};
            mockUserRepo.findAdmins.mockResolvedValue({items: [MOCK_ADMIN_WITH_USER], total: 5});

            const result = await service.listAdmins(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });
    });
});

describe('updateMember', () => {
    describe('Equivalence Classes', () => {
        it('updateMember_EC_existingMemberValidData_returnsMemberWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            const expectedReturn = {...MOCK_MEMBER_WITH_USER, user: {...MOCK_USER, fullName: 'Updated Name'}};
            mockUserRepo.updateMember.mockResolvedValue(expectedReturn);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(expectedReturn);
            expect(result.user.fullName).toBe('Updated Name');
        });

        it('updateMember_EC_nonExistentMember_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateMemberInput = {fullName: 'New'};
            mockUserRepo.updateMember.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });

        it('updateMember_EC_newEmailAlreadyRegistered_throwsConflictError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'taken@example.com'};
            mockUserRepo.updateMember.mockRejectedValue(new ConflictError('Email taken'));

            const act = service.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Email taken');
        });

        it('updateMember_EC_sameEmailAsCurrentUser_returnsUpdatedMember', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: MOCK_USER.email};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_EC_withNewPassword_returnsUpdatedMember', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: 'New1!'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_EC_databaseWriteFails_throwsTransactionError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'New'};
            mockUserRepo.updateMember.mockRejectedValue(new TransactionError('DB Error'));

            const act = service.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB Error');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMember_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            const inputData: UpdateMemberInput = {fullName: 'New'};
            mockUserRepo.updateMember.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const inputData: UpdateMemberInput = {fullName: 'New'};
            mockUserRepo.updateMember.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.updateMember(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateMember_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const inputData: UpdateMemberInput = {fullName: 'New'};
            const expectedReturn = {...MOCK_MEMBER_WITH_USER, id: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(expectedReturn);

            const result = await service.updateMember(inputId, inputData);

            expect(result.id).toBe('a');
            expect(result.user).toEqual(MOCK_MEMBER_WITH_USER.user);
        });

        it('updateMember_BVA_emailUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_emailEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_emailOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_fullNameEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_fullNameOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'A'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_phoneEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_phoneOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {phone: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_dateOfBirthEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_dateOfBirthOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {dateOfBirth: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_passwordEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_passwordOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {password: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_membershipStartUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: undefined};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_membershipStartEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: ''};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('updateMember_BVA_membershipStartOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {membershipStart: 'a'};
            mockUserRepo.updateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.updateMember(inputId, inputData);

            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });
    });
});

describe('updateAdmin', () => {
    describe('Equivalence Classes', () => {
        it('updateAdmin_EC_existingAdminValidData_returnsAdminWithUser', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Updated Admin'};
            const expectedReturn = {...MOCK_ADMIN_WITH_USER, user: {...MOCK_USER, role: Role.ADMIN, fullName: 'Updated Admin'}};
            mockUserRepo.updateAdmin.mockResolvedValue(expectedReturn);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(expectedReturn);
            expect(result.user.fullName).toBe('Updated Admin');
        });

        it('updateAdmin_EC_nonExistentAdmin_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateAdminInput = {fullName: 'Name'};
            mockUserRepo.updateAdmin.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Admin not found');
        });

        it('updateAdmin_EC_newEmailAlreadyRegistered_throwsConflictError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'taken@example.com'};
            mockUserRepo.updateAdmin.mockRejectedValue(new ConflictError('Email taken'));

            const act = service.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Email taken');
        });

        it('updateAdmin_EC_sameEmailAsCurrentUser_returnsUpdatedAdmin', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: MOCK_ADMIN_WITH_USER.user.email};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_EC_withNewPassword_returnsUpdatedAdmin', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: 'New1!'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_EC_databaseWriteFails_throwsTransactionError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'New'};
            mockUserRepo.updateAdmin.mockRejectedValue(new TransactionError('DB Error'));

            const act = service.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB Error');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateAdmin_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            const inputData: UpdateAdminInput = {fullName: 'New'};
            mockUserRepo.updateAdmin.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateAdmin_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const inputData: UpdateAdminInput = {fullName: 'New'};
            mockUserRepo.updateAdmin.mockRejectedValue(new NotFoundError('Admin not found'));

            const act = service.updateAdmin(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateAdmin_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const inputData: UpdateAdminInput = {fullName: 'New'};
            const expectedReturn = {...MOCK_ADMIN_WITH_USER, id: 'a'};
            mockUserRepo.updateAdmin.mockResolvedValue(expectedReturn);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result.id).toBe('a');
            expect(result.user).toEqual(MOCK_ADMIN_WITH_USER.user);
        });

        it('updateAdmin_BVA_emailUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: undefined};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_emailEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: ''};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_emailOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {email: 'a'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: undefined};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_fullNameEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: ''};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_fullNameOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'A'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: undefined};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_phoneEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: ''};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_phoneOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {phone: 'a'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: undefined};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_dateOfBirthEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: ''};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_dateOfBirthOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {dateOfBirth: 'a'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: undefined};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_passwordEmpty_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: ''};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });

        it('updateAdmin_BVA_passwordOneChar_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {password: 'a'};
            mockUserRepo.updateAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            const result = await service.updateAdmin(inputId, inputData);

            expect(result).toEqual(MOCK_ADMIN_WITH_USER);
        });
    });
});

describe('suspendMember', () => {
    describe('Equivalence Classes', () => {
        it('suspendMember_EC_existingMember_suspendsMember', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            const expectedReturn = {...MOCK_MEMBER_WITH_USER, isActive: false};
            mockUserRepo.setMemberActive.mockResolvedValue(expectedReturn);

            const result = await service.suspendMember(inputId);

            expect(result.isActive).toBe(false);
            expect(result.id).toBe(MEMBER_ID);
            expect(result.user).toEqual(MOCK_MEMBER_WITH_USER.user);
        });

        it('suspendMember_EC_nonExistentMember_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.suspendMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('suspendMember_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.suspendMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('suspendMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.suspendMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('suspendMember_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const expectedReturn = {...MOCK_MEMBER_WITH_USER, id: 'a', isActive: false};
            mockUserRepo.setMemberActive.mockResolvedValue(expectedReturn);

            const result = await service.suspendMember(inputId);

            expect(result.id).toBe('a');
            expect(result.isActive).toBe(false);
            expect(result.user).toEqual(MOCK_MEMBER_WITH_USER.user);
        });
    });
});

describe('activateMember', () => {
    describe('Equivalence Classes', () => {
        it('activateMember_EC_existingMember_activatesMember', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            mockUserRepo.setMemberActive.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            const result = await service.activateMember(inputId);

            expect(result.isActive).toBe(true);
            expect(result.id).toBe(MEMBER_ID);
            expect(result).toEqual(MOCK_MEMBER_WITH_USER);
        });

        it('activateMember_EC_nonExistentMember_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.activateMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('activateMember_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.activateMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('activateMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.setMemberActive.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.activateMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('activateMember_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            const expectedReturn = {...MOCK_MEMBER_WITH_USER, id: 'a'};
            mockUserRepo.setMemberActive.mockResolvedValue(expectedReturn);

            const result = await service.activateMember(inputId);

            expect(result.id).toBe('a');
            expect(result.isActive).toBe(true);
            expect(result.user).toEqual(MOCK_MEMBER_WITH_USER.user);
        });
    });
});

describe('deleteMember', () => {
    describe('Equivalence Classes', () => {
        it('deleteMember_EC_existingMemberId_resolvesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = MEMBER_ID;
            mockUserRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteMember(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('deleteMember_EC_nonExistentId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteMember_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteMember_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteMember(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteMember_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteMember(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});

describe('deleteAdmin', () => {
    describe('Equivalence Classes', () => {
        it('deleteAdmin_EC_existingAdminId_resolvesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = ADMIN_ID;
            mockUserRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteAdmin(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('deleteAdmin_EC_nonExistentId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = NONEXISTENT_ID;
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteAdmin_BVA_emptyId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = '';
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteAdmin_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.delete.mockRejectedValue(new NotFoundError('Not found'));

            const act = service.deleteAdmin(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteAdmin_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const service = UserService.getInstance(mockUserRepo);
            const inputId: string = 'a';
            mockUserRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteAdmin(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});
