jest.mock('@/lib/di', () => ({
    userService: {
        createMember: jest.fn(),
        createMemberWithTempPassword: jest.fn(),
        createAdmin: jest.fn(),
        getMember: jest.fn(),
        getAdmin: jest.fn(),
        listMembers: jest.fn(),
        listAdmins: jest.fn(),
        updateMember: jest.fn(),
        updateAdmin: jest.fn(),
        suspendMember: jest.fn(),
        activateMember: jest.fn(),
        deleteMember: jest.fn(),
        deleteAdmin: jest.fn(),
    },
}));

import {userService} from '@/lib/di';
import type {
    MemberWithUser,
    AdminWithUser,
    MemberWithUserAndTempPassword,
    MemberListOptions,
    AdminListOptions,
    User
} from '@/lib/domain/user';
import {Role} from '@/lib/domain/user';
import {PageResult} from "@/lib/domain/pagination";
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput, UpdateAdminInput, UpdateMemberInput} from "@/lib/schema/user-schema";
import {
    createMember,
    createMemberWithTempPassword,
    createAdmin,
    getMember,
    getAdmin,
    listMembers,
    listAdmins,
    updateMember,
    updateAdmin,
    suspendMember,
    activateMember,
    deleteMember,
    deleteAdmin
} from '@/lib/controller/user-controller';
import {ActionResult} from "@/lib/domain/action-result";

const userServiceMock = userService as unknown as {
    createMember: jest.Mock;
    createMemberWithTempPassword: jest.Mock;
    createAdmin: jest.Mock;
    getMember: jest.Mock;
    getAdmin: jest.Mock;
    listMembers: jest.Mock;
    listAdmins: jest.Mock;
    updateMember: jest.Mock;
    updateAdmin: jest.Mock;
    suspendMember: jest.Mock;
    activateMember: jest.Mock;
    deleteMember: jest.Mock;
    deleteAdmin: jest.Mock;
};

const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const USER_ID: string = 'user-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const VALID_MEMBER_INPUT: CreateMemberInput = {
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecurePass1!',
    membershipStart: '2024-01-01',
};

const VALID_MEMBER_NO_PWD: CreateMemberWithTempPasswordInput = {
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    membershipStart: '2024-01-01',
};

const VALID_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin Full Name',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminPass1!',
};

const MOCK_USER: User = {
    id: USER_ID,
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: new Date('1990-01-15'),
    passwordHash: 'hashed',
    role: Role.MEMBER,
};

const MOCK_MEMBER: MemberWithUser = {
    id: MEMBER_ID,
    userId: USER_ID,
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: MOCK_USER,
};

const MOCK_ADMIN: AdminWithUser = {
    id: ADMIN_ID,
    userId: 'user-uuid-002',
    user: {
        ...MOCK_USER,
        id: 'user-uuid-002',
        email: 'admin@example.com',
        fullName: 'Admin Full Name',
        role: Role.ADMIN,
        dateOfBirth: new Date('1985-06-20'),
    },
};

const MOCK_PAGE_MEMBERS: PageResult<MemberWithUser> = {items: [MOCK_MEMBER], total: 1};
const MOCK_PAGE_ADMINS: PageResult<AdminWithUser> = {items: [MOCK_ADMIN], total: 1};

beforeEach(() => {
    Object.values(userServiceMock).forEach(fn => fn.mockReset());
});

describe('createMember', () => {
    describe('Equivalence Classes', () => {
        it('createMember_EC_allFieldsValid_returnsSuccessWithMember', async () => {
            const inputData: CreateMemberInput = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_MEMBER);
                expect(result.data.user.email).toBe(inputData.email);
            }
        });

        it('createMember_EC_invalidEmail_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, email: 'invalid'};

            const result: ActionResult<MemberWithUser> = await createMember(inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('createMember_EC_missingField_returnsValidationError', async () => {
            const inputData = {fullName: 'John Doe'};

            const result: ActionResult<MemberWithUser> = await createMember(inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
                expect(result.errors?.phone).toBeDefined();
            }
        });

        it('createMember_EC_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
            const inputData: CreateMemberInput = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockRejectedValue(new ConflictError('Email already registered'));

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Email already registered');
            }
        });

        it('createMember_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputData: CreateMemberInput = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockRejectedValue(new TransactionError('DB failure'));

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMember_BVA_fullName7Chars_returnsValidationError', async () => {
            const inputData: CreateMemberInput = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(7)};

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_BVA_fullName8Chars_returnsSuccess', async () => {
            const inputData: CreateMemberInput = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(8)};
            const expectedReturn = {...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(8)}};
            userServiceMock.createMember.mockResolvedValue(expectedReturn);

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.fullName).toBe('A'.repeat(8));
            }
        });

        it('createMember_BVA_password7Chars_returnsValidationError', async () => {
            const inputData: CreateMemberInput = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(4)};

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_BVA_dateOfBirthToday_returnsValidationError', async () => {
            const today: string = new Date().toISOString().slice(0, 10);
            const inputData: CreateMemberInput = {...VALID_MEMBER_INPUT, dateOfBirth: today};

            const result: ActionResult<MemberWithUser> = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });
    });
});

describe('createMemberWithTempPassword', () => {
    describe('Equivalence Classes', () => {
        it('createMemberWithTempPassword_EC_validInput_returnsSuccessWithMemberAndTempPassword', async () => {
            const mockResult: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'GeneratedPass1!'};
            const inputData: CreateMemberWithTempPasswordInput = VALID_MEMBER_NO_PWD;
            userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockResult);

            const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.tempPassword).toBe('GeneratedPass1!');
                expect(result.data.user.email).toBe(inputData.email);
            }
        });

        it('createMemberWithTempPassword_EC_invalidEmail_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_NO_PWD, email: 'bad'};

            const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberWithTempPassword_BVA_fullName65Chars_returnsValidationError', async () => {
            const inputData: CreateMemberWithTempPasswordInput = {...VALID_MEMBER_NO_PWD, fullName: 'A'.repeat(65)};

            const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });
    });
});

describe('createAdmin', () => {
    describe('Equivalence Classes', () => {
        it('createAdmin_EC_validInput_returnsSuccessWithAdmin', async () => {
            const inputData: CreateAdminInput = VALID_ADMIN_INPUT;
            userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);

            const result: ActionResult<AdminWithUser> = await createAdmin(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_ADMIN);
                expect(result.data.user.role).toBe(Role.ADMIN);
            }
        });
    });
});

describe('getMember', () => {
    describe('Equivalence Classes', () => {
        it('getMember_EC_existingId_returnsSuccessWithMember', async () => {
            const inputId: string = MEMBER_ID;
            userServiceMock.getMember.mockResolvedValue(MOCK_MEMBER);

            const result: ActionResult<MemberWithUser> = await getMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_MEMBER);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('getMember_EC_nonExistentId_returnsFailure', async () => {
            const inputId: string = NONEXISTENT_ID;
            userServiceMock.getMember.mockRejectedValue(new NotFoundError('Member not found'));

            const result: ActionResult<MemberWithUser> = await getMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getMember_BVA_existingOneCharId_returnsMember', async () => {
            const inputId: string = 'a';
            const expectedReturn = {...MOCK_MEMBER, id: 'a'};
            userServiceMock.getMember.mockResolvedValue(expectedReturn);

            const result: ActionResult<MemberWithUser> = await getMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
            }
        });
    });
});

describe('getAdmin', () => {
    describe('Equivalence Classes', () => {
        it('getAdmin_EC_existingId_returnsSuccessWithAdmin', async () => {
            const inputId: string = ADMIN_ID;
            userServiceMock.getAdmin.mockResolvedValue(MOCK_ADMIN);

            const result: ActionResult<AdminWithUser> = await getAdmin(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_ADMIN);
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('listMembers', () => {
    describe('Equivalence Classes', () => {
        it('listMembers_EC_noOptions_returnsSuccessWithPage', async () => {
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_MEMBER);
                expect(result.data.total).toBe(1);
            }
        });

        it('listMembers_EC_multipleMembers_returnsOrderedMembers', async () => {
            const memberA = {...MOCK_MEMBER, id: 'a', user: {...MOCK_USER, fullName: 'A Member'}};
            const memberB = {...MOCK_MEMBER, id: 'b', user: {...MOCK_USER, fullName: 'B Member'}};
            const mockPage: PageResult<MemberWithUser> = {
                items: [memberA, memberB],
                total: 2
            };
            userServiceMock.listMembers.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(2);
                expect(result.data.items[0].user.fullName).toBe('A Member');
                expect(result.data.items[1].user.fullName).toBe('B Member');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMembers_BVA_pageSize1_returnsOneItem', async () => {
            const inputOptions: MemberListOptions = {pageSize: 1};
            const mockPage = {items: [MOCK_MEMBER], total: 5};
            userServiceMock.listMembers.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.total).toBe(5);
            }
        });
    });
});

describe('listAdmins', () => {
    describe('Equivalence Classes', () => {
        it('listAdmins_EC_noOptions_returnsSuccessWithPage', async () => {
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_ADMIN);
            }
        });

        it('listAdmins_EC_multipleAdmins_returnsOrderedAdmins', async () => {
            const adminA = {...MOCK_ADMIN, id: 'a', user: {...MOCK_USER, fullName: 'A Admin'}};
            const adminB = {...MOCK_ADMIN, id: 'b', user: {...MOCK_USER, fullName: 'B Admin'}};
            const mockPage: PageResult<AdminWithUser> = {
                items: [adminA, adminB],
                total: 2
            };
            userServiceMock.listAdmins.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(2);
                expect(result.data.items[0].user.fullName).toBe('A Admin');
                expect(result.data.items[1].user.fullName).toBe('B Admin');
            }
        });
    });
});

describe('updateMember', () => {
    describe('Equivalence Classes', () => {
        it('updateMember_EC_validInput_returnsUpdatedMember', async () => {
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            const updatedMock = {...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'Updated Name'}};
            userServiceMock.updateMember.mockResolvedValue(updatedMock);

            const result: ActionResult<MemberWithUser> = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.fullName).toBe('Updated Name');
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateMember_EC_invalidPhone_returnsValidationError', async () => {
            const inputId: string = MEMBER_ID;
            const inputData = {phone: 'invalid'};

            const result: ActionResult<MemberWithUser> = await updateMember(inputId, inputData as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.phone).toBeDefined();
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMember_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId: string = 'a';
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            const expectedReturn = {...MOCK_MEMBER, id: 'a'};
            userServiceMock.updateMember.mockResolvedValue(expectedReturn);

            const result: ActionResult<MemberWithUser> = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
            }
        });
    });
});

describe('updateAdmin', () => {
    describe('Equivalence Classes', () => {
        it('updateAdmin_EC_validInput_returnsUpdatedAdmin', async () => {
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            const updatedMock = {...MOCK_ADMIN, user: {...MOCK_ADMIN.user, fullName: 'Admin Updated'}};
            userServiceMock.updateAdmin.mockResolvedValue(updatedMock);

            const result: ActionResult<AdminWithUser> = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.fullName).toBe('Admin Updated');
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('suspendMember', () => {
    describe('Equivalence Classes', () => {
        it('suspendMember_EC_existingId_suspendsMember', async () => {
            const inputId: string = MEMBER_ID;
            const suspendedMock = {...MOCK_MEMBER, isActive: false};
            userServiceMock.suspendMember.mockResolvedValue(suspendedMock);

            const result: ActionResult<MemberWithUser> = await suspendMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(false);
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('activateMember', () => {
    describe('Equivalence Classes', () => {
        it('activateMember_EC_existingId_activatesMember', async () => {
            const inputId: string = MEMBER_ID;
            const activeMock = {...MOCK_MEMBER, isActive: true};
            userServiceMock.activateMember.mockResolvedValue(activeMock);

            const result: ActionResult<MemberWithUser> = await activateMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(true);
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('deleteMember', () => {
    describe('Equivalence Classes', () => {
        it('deleteMember_EC_existingId_deletesMember', async () => {
            const inputId: string = MEMBER_ID;
            userServiceMock.deleteMember.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });
    });
});

describe('deleteAdmin', () => {
    describe('Equivalence Classes', () => {
        it('deleteAdmin_EC_existingId_deletesAdmin', async () => {
            const inputId: string = ADMIN_ID;
            userServiceMock.deleteAdmin.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteAdmin(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });
    });
});
