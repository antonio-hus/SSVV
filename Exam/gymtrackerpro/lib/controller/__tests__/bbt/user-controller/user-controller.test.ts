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
    email: 'john.doe@example.com',
    fullName: 'John Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1!',
    membershipStart: '2024-01-01',
};

const VALID_MEMBER_NO_PWD: CreateMemberWithTempPasswordInput = {
    email: 'jane.doe@example.com',
    fullName: 'Jane Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1992-06-20',
    membershipStart: '2024-03-01',
};

const VALID_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin User Test',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminP@ss1!',
};

const MOCK_USER: User = {
    id: USER_ID,
    email: 'john.doe@example.com',
    fullName: 'John Doe Test',
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
        fullName: 'Admin User Test',
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
            const inputData = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_MEMBER);
            }
        });

        it('createMember_EC_missingEmail_returnsValidationError', async () => {
            const {email, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('createMember_EC_missingFullName_returnsValidationError', async () => {
            const {fullName, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_EC_missingPhone_returnsValidationError', async () => {
            const {phone, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.phone).toBeDefined();
            }
        });

        it('createMember_EC_missingDateOfBirth_returnsValidationError', async () => {
            const {dateOfBirth, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });

        it('createMember_EC_missingPassword_returnsValidationError', async () => {
            const {password, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_EC_missingMembershipStart_returnsValidationError', async () => {
            const {membershipStart, ...inputData} = VALID_MEMBER_INPUT;

            const result = await createMember(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.membershipStart).toBeDefined();
            }
        });

        it('createMember_EC_emailInvalidFormat_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, email: 'invalid'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('createMember_EC_passwordMissingUppercase_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'securep@ss1!'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_EC_passwordMissingNumber_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'SecurePass!'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_EC_passwordMissingSpecialChar_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'SecurePass1'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_EC_phoneInvalidFormat_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, phone: '0712345678'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.phone).toBeDefined();
            }
        });

        it('createMember_EC_dateOfBirthInvalidFormat_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, dateOfBirth: '15-01-1990'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });

        it('createMember_EC_dateOfBirthInTheFuture_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, dateOfBirth: '2099-01-01'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });

        it('createMember_EC_membershipStartInTheFuture_parsesSuccessfully', async () => {
            const inputData = {...VALID_MEMBER_INPUT, membershipStart: '2099-01-01'};
            userServiceMock.createMember.mockResolvedValue({...MOCK_MEMBER, membershipStart: new Date('2099-01-01')});

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_EC_membershipStartInvalidFormat_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, membershipStart: '01/01/2024'};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.membershipStart).toBeDefined();
            }
        });

        it('createMember_EC_fullNameWhitespaceOnly_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: '         '};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: '  John Doe Test  '};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_EC_emailWithSurroundingWhitespace_parsesSuccessfully', async () => {
            const inputData = {...VALID_MEMBER_INPUT, email: '  john.doe@example.com  '};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', async () => {
            const inputData = {...VALID_MEMBER_INPUT, phone: '  +40712345678  '};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_EC_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
            const inputData = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockRejectedValue(new ConflictError('Email already registered'));

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Email already registered');
            }
        });

        it('createMember_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputData = VALID_MEMBER_INPUT;
            userServiceMock.createMember.mockRejectedValue(new TransactionError('DB failure'));

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMember_BVA_fullNameLength7Chars_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(7)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_BVA_fullNameLength8Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(8)};
            userServiceMock.createMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(8)}});

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNameLength9Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(9)};
            userServiceMock.createMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(9)}});

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNameLength63Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(63)};
            userServiceMock.createMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(63)}});

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNameLength64Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(64)};
            userServiceMock.createMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(64)}});

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNameLength65Chars_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(65)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_BVA_fullNameWhitespace8Chars_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: ' '.repeat(8)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_BVA_fullNamePadded8CharsAfterTrim_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: ' ' + 'A'.repeat(8) + ' '};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNamePadded64CharsAfterTrim_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: ' ' + 'A'.repeat(64) + ' '};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, fullName: ' ' + 'A'.repeat(65) + ' '};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMember_BVA_passwordLength7Chars_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(4)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_BVA_passwordLength8Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(5)};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_passwordLength9Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(6)};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_passwordLength63Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(60)};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_passwordLength64Chars_returnsSuccess', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(61)};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_passwordLength65Chars_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, password: 'P1@' + 'a'.repeat(62)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.password).toBeDefined();
            }
        });

        it('createMember_BVA_dateOfBirthYesterday_returnsSuccess', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().slice(0, 10);
            const inputData = {...VALID_MEMBER_INPUT, dateOfBirth: dateStr};
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);

            const result = await createMember(inputData);

            expect(result.success).toBe(true);
        });

        it('createMember_BVA_dateOfBirthToday_returnsValidationError', async () => {
            const inputData = {...VALID_MEMBER_INPUT, dateOfBirth: new Date().toISOString().slice(0, 10)};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });

        it('createMember_BVA_dateOfBirthTomorrow_returnsValidationError', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().slice(0, 10);
            const inputData = {...VALID_MEMBER_INPUT, dateOfBirth: dateStr};

            const result = await createMember(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });
    });
});

describe('createMemberWithTempPassword', () => {
    describe('Equivalence Classes', () => {
        it('createMemberWithTempPassword_EC_validInput_returnsSuccess', async () => {
            const inputData = VALID_MEMBER_NO_PWD;
            const mockRes: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'Generated1!'};
            userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockRes);

            const result = await createMemberWithTempPassword(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.tempPassword).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_missingEmail_returnsValidationError', async () => {
            const {email, ...inputData} = VALID_MEMBER_NO_PWD;

            const result = await createMemberWithTempPassword(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_missingFullName_returnsValidationError', async () => {
            const {fullName, ...inputData} = VALID_MEMBER_NO_PWD;

            const result = await createMemberWithTempPassword(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.fullName).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_missingPhone_returnsValidationError', async () => {
            const {phone, ...inputData} = VALID_MEMBER_NO_PWD;

            const result = await createMemberWithTempPassword(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.phone).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_missingDateOfBirth_returnsValidationError', async () => {
            const {dateOfBirth, ...inputData} = VALID_MEMBER_NO_PWD;

            const result = await createMemberWithTempPassword(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.dateOfBirth).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_missingMembershipStart_returnsValidationError', async () => {
            const {membershipStart, ...inputData} = VALID_MEMBER_NO_PWD;

            const result = await createMemberWithTempPassword(inputData as never);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.membershipStart).toBeDefined();
            }
        });

        it('createMemberWithTempPassword_EC_duplicateEmail_returnsFailureWithMessage', async () => {
            const inputData = VALID_MEMBER_NO_PWD;
            userServiceMock.createMemberWithTempPassword.mockRejectedValue(new ConflictError('Email taken'));

            const result = await createMemberWithTempPassword(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Email taken');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberWithTempPassword_BVA_tempPasswordLength16', async () => {
            const inputData = VALID_MEMBER_NO_PWD;
            const mockRes: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'A'.repeat(16)};
            userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockRes);

            const result = await createMemberWithTempPassword(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.tempPassword).toHaveLength(16);
            }
        });
    });
});

describe('createAdmin', () => {
    describe('Equivalence Classes', () => {
        it('createAdmin_EC_validInput_returnsSuccess', async () => {
            const inputData = VALID_ADMIN_INPUT;
            userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await createAdmin(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.role).toBe(Role.ADMIN);
            }
        });

        it('createAdmin_EC_duplicateEmail_returnsFailureWithMessage', async () => {
            const inputData = VALID_ADMIN_INPUT;
            userServiceMock.createAdmin.mockRejectedValue(new ConflictError('Email taken'));

            const result = await createAdmin(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Email taken');
            }
        });

        it('createAdmin_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputData = VALID_ADMIN_INPUT;
            userServiceMock.createAdmin.mockRejectedValue(new TransactionError('DB failure'));

            const result = await createAdmin(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });
});

describe('getMember', () => {
    describe('Equivalence Classes', () => {
        it('getMember_EC_existingId_returnsMember', async () => {
            const inputId = MEMBER_ID;
            userServiceMock.getMember.mockResolvedValue(MOCK_MEMBER);

            const result = await getMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('getMember_EC_nonExistentId_returnsFailure', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.getMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getMember_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.getMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('getMember_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.getMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('getMember_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            userServiceMock.getMember.mockResolvedValue({...MOCK_MEMBER, id: inputId});

            const result = await getMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('getAdmin', () => {
    describe('Equivalence Classes', () => {
        it('getAdmin_EC_existingId_returnsAdmin', async () => {
            const inputId = ADMIN_ID;
            userServiceMock.getAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await getAdmin(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('getAdmin_EC_nonExistentId_returnsFailure', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.getAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getAdmin_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.getAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('getAdmin_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.getAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await getAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('getAdmin_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            userServiceMock.getAdmin.mockResolvedValue({...MOCK_ADMIN, id: inputId});

            const result = await getAdmin(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('listMembers', () => {
    describe('Equivalence Classes', () => {
        it('listMembers_EC_multipleMembers_returnsOrderedMembers', async () => {
            const memberA = {...MOCK_MEMBER, id: 'a', user: {...MOCK_USER, fullName: 'A Member'}};
            const memberB = {...MOCK_MEMBER, id: 'b', user: {...MOCK_USER, fullName: 'B Member'}};
            userServiceMock.listMembers.mockResolvedValue({items: [memberA, memberB], total: 2});

            const result = await listMembers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].user.fullName).toBe('A Member');
                expect(result.data.items[1].user.fullName).toBe('B Member');
            }
        });

        it('listMembers_EC_emptyDatabase_returnsEmptyPage', async () => {
            userServiceMock.listMembers.mockResolvedValue({items: [], total: 0});

            const result = await listMembers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
                expect(result.data.total).toBe(0);
            }
        });

        it('listMembers_EC_withSearchTerm_returnsMatchingItems', async () => {
            const inputOptions: MemberListOptions = {search: 'John'};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_EC_serviceThrowsAppError_returnsFailureWithMessage', async () => {
            userServiceMock.listMembers.mockRejectedValue(new NotFoundError('Member not found'));

            const result = await listMembers();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMembers_BVA_pageSize1_returnsOneItem', async () => {
            const inputOptions: MemberListOptions = {pageSize: 1};
            userServiceMock.listMembers.mockResolvedValue({items: [MOCK_MEMBER], total: 5});

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listMembers_BVA_pageSize0_returnsEmpty', async () => {
            const inputOptions: MemberListOptions = {pageSize: 0};
            userServiceMock.listMembers.mockResolvedValue({items: [], total: 5});

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listMembers_BVA_pageSizeUndefined_returnsSuccess', async () => {
            const inputOptions: MemberListOptions = {pageSize: undefined};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_searchEmpty_returnsAll', async () => {
            const inputOptions: MemberListOptions = {search: ''};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_searchUndefined_returnsAll', async () => {
            const inputOptions: MemberListOptions = {search: undefined};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_searchOneChar_returnsSuccess', async () => {
            const inputOptions: MemberListOptions = {search: 'A'};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_page0_returnsFirstPage', async () => {
            const inputOptions: MemberListOptions = {page: 0};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_page1_returnsFirstPage', async () => {
            const inputOptions: MemberListOptions = {page: 1};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMembers_BVA_page2_returnsEmptyPage', async () => {
            const inputOptions: MemberListOptions = {page: 2};
            userServiceMock.listMembers.mockResolvedValue({items: [], total: 1});

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listMembers_BVA_pageUndefined_returnsSuccess', async () => {
            const inputOptions: MemberListOptions = {page: undefined};
            userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

            const result = await listMembers(inputOptions);

            expect(result.success).toBe(true);
        });
    });
});

describe('listAdmins', () => {
    describe('Equivalence Classes', () => {
        it('listAdmins_EC_multipleAdmins_returnsOrderedAdmins', async () => {
            const adminA = {...MOCK_ADMIN, id: 'a', user: {...MOCK_ADMIN.user, fullName: 'A Admin'}};
            const adminB = {...MOCK_ADMIN, id: 'b', user: {...MOCK_ADMIN.user, fullName: 'B Admin'}};
            userServiceMock.listAdmins.mockResolvedValue({items: [adminA, adminB], total: 2});

            const result = await listAdmins();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].user.fullName).toBe('A Admin');
                expect(result.data.items[1].user.fullName).toBe('B Admin');
            }
        });

        it('listAdmins_EC_emptyDatabase_returnsEmptyPage', async () => {
            userServiceMock.listAdmins.mockResolvedValue({items: [], total: 0});

            const result = await listAdmins();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listAdmins_EC_withSearchTerm_returnsMatchingItems', async () => {
            const inputOptions: AdminListOptions = {search: 'Admin'};
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listAdmins_EC_serviceThrowsAppError_returnsFailureWithMessage', async () => {
            userServiceMock.listAdmins.mockRejectedValue(new NotFoundError('Admin not found'));

            const result = await listAdmins();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Admin not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listAdmins_BVA_pageSize1_returnsOneItem', async () => {
            const inputOptions: AdminListOptions = {pageSize: 1};
            userServiceMock.listAdmins.mockResolvedValue({items: [MOCK_ADMIN], total: 5});

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listAdmins_BVA_pageSize0_returnsEmpty', async () => {
            const inputOptions: AdminListOptions = {pageSize: 0};
            userServiceMock.listAdmins.mockResolvedValue({items: [], total: 5});

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listAdmins_BVA_searchEmpty_returnsAll', async () => {
            const inputOptions: AdminListOptions = {search: ''};
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listAdmins_BVA_searchOneChar_returnsSuccess', async () => {
            const inputOptions: AdminListOptions = {search: 'A'};
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listAdmins_BVA_page0_returnsFirstPage', async () => {
            const inputOptions: AdminListOptions = {page: 0};
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
        });

        it('listAdmins_BVA_page1_returnsFirstPage', async () => {
            const inputOptions: AdminListOptions = {page: 1};
            userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

            const result = await listAdmins(inputOptions);

            expect(result.success).toBe(true);
        });
    });
});

describe('updateMember', () => {
    describe('Equivalence Classes', () => {
        it('updateMember_EC_validInput_returnsUpdatedMember', async () => {
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'Updated Name'}});

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.fullName).toBe('Updated Name');
            }
        });

        it('updateMember_EC_emptyUpdateObject_returnsSuccess', async () => {
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_EC_invalidEmail_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'bad'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.email).toBeDefined();
            }
        });

        it('updateMember_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateMember_EC_emailTaken_returnsFailureWithMessage', async () => {
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {email: 'taken@example.com'};
            userServiceMock.updateMember.mockRejectedValue(new ConflictError('Email taken'));

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Email taken');
            }
        });

        it('updateMember_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputId = MEMBER_ID;
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockRejectedValue(new TransactionError('DB failure'));

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMember_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateMember_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateMember_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            const inputData: UpdateMemberInput = {fullName: 'Updated Name'};
            userServiceMock.updateMember.mockResolvedValue({...MOCK_MEMBER, id: inputId});

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateMember_BVA_fullNameLength8Chars_returnsSuccess', async () => {
            const inputId = MEMBER_ID;
            const inputData = {fullName: 'A'.repeat(8)};
            userServiceMock.updateMember.mockResolvedValue({...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'A'.repeat(8)}});

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_passwordLength64Chars_returnsSuccess', async () => {
            const inputId = MEMBER_ID;
            const inputData = {password: 'P1@' + 'a'.repeat(61)};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_emailUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {email: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_emailEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {email: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_emailOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {email: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {fullName: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_fullNameEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {fullName: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_fullNameOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {fullName: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {phone: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_phoneEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {phone: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_phoneOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {phone: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {dateOfBirth: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_dateOfBirthEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {dateOfBirth: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_dateOfBirthOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {dateOfBirth: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {password: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_passwordEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {password: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_passwordOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {password: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_membershipStartUndefined_updatesSuccessfully', async () => {
            const inputId = MEMBER_ID;
            const inputData = {membershipStart: undefined};
            userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateMember_BVA_membershipStartEmpty_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {membershipStart: ''};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateMember_BVA_membershipStartOneChar_returnsValidationError', async () => {
            const inputId = MEMBER_ID;
            const inputData = {membershipStart: 'a'};

            const result = await updateMember(inputId, inputData);

            expect(result.success).toBe(false);
        });
    });
});

describe('updateAdmin', () => {
    describe('Equivalence Classes', () => {
        it('updateAdmin_EC_validInput_returnsUpdatedAdmin', async () => {
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockResolvedValue({...MOCK_ADMIN, user: {...MOCK_ADMIN.user, fullName: 'Admin Updated'}});

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user.fullName).toBe('Admin Updated');
            }
        });

        it('updateAdmin_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateAdmin_EC_databaseWriteFails_throwsTransactionError', async () => {
            const inputId = ADMIN_ID;
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockRejectedValue(new TransactionError('DB Error'));

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB Error');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateAdmin_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateAdmin_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateAdmin_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            const inputData: UpdateAdminInput = {fullName: 'Admin Updated'};
            userServiceMock.updateAdmin.mockResolvedValue({...MOCK_ADMIN, id: inputId});

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateAdmin_BVA_emailUndefined_updatesSuccessfully', async () => {
            const inputId = ADMIN_ID;
            const inputData = {email: undefined};
            userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdmin_BVA_emailEmpty_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {email: ''};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_emailOneChar_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {email: 'a'};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_fullNameUndefined_updatesSuccessfully', async () => {
            const inputId = ADMIN_ID;
            const inputData = {fullName: undefined};
            userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdmin_BVA_fullNameEmpty_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {fullName: ''};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_fullNameOneChar_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {fullName: 'a'};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_phoneUndefined_updatesSuccessfully', async () => {
            const inputId = ADMIN_ID;
            const inputData = {phone: undefined};
            userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdmin_BVA_phoneEmpty_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {phone: ''};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_phoneOneChar_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {phone: 'a'};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_dateOfBirthUndefined_updatesSuccessfully', async () => {
            const inputId = ADMIN_ID;
            const inputData = {dateOfBirth: undefined};
            userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdmin_BVA_dateOfBirthEmpty_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {dateOfBirth: ''};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_dateOfBirthOneChar_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {dateOfBirth: 'a'};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_passwordUndefined_updatesSuccessfully', async () => {
            const inputId = ADMIN_ID;
            const inputData = {password: undefined};
            userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdmin_BVA_passwordEmpty_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {password: ''};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdmin_BVA_passwordOneChar_returnsValidationError', async () => {
            const inputId = ADMIN_ID;
            const inputData = {password: 'a'};

            const result = await updateAdmin(inputId, inputData);

            expect(result.success).toBe(false);
        });
    });
});

describe('suspendMember', () => {
    describe('Equivalence Classes', () => {
        it('suspendMember_EC_existingId_suspendsMember', async () => {
            const inputId = MEMBER_ID;
            userServiceMock.suspendMember.mockResolvedValue({...MOCK_MEMBER, isActive: false});

            const result = await suspendMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(false);
            }
        });

        it('suspendMember_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.suspendMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await suspendMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('suspendMember_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.suspendMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await suspendMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('suspendMember_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.suspendMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await suspendMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('suspendMember_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            userServiceMock.suspendMember.mockResolvedValue({...MOCK_MEMBER, id: inputId, isActive: false});

            const result = await suspendMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('activateMember', () => {
    describe('Equivalence Classes', () => {
        it('activateMember_EC_existingId_activatesMember', async () => {
            const inputId = MEMBER_ID;
            userServiceMock.activateMember.mockResolvedValue({...MOCK_MEMBER, isActive: true});

            const result = await activateMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(true);
            }
        });

        it('activateMember_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.activateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await activateMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('activateMember_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.activateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await activateMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('activateMember_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.activateMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await activateMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('activateMember_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            userServiceMock.activateMember.mockResolvedValue({...MOCK_MEMBER, id: inputId, isActive: true});

            const result = await activateMember(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('deleteMember', () => {
    describe('Equivalence Classes', () => {
        it('deleteMember_EC_existingId_deletesMember', async () => {
            const inputId = MEMBER_ID;
            userServiceMock.deleteMember.mockResolvedValue(undefined);

            const result = await deleteMember(inputId);

            expect(result.success).toBe(true);
        });

        it('deleteMember_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.deleteMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteMember_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.deleteMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteMember_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.deleteMember.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteMember(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteMember_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const inputId = 'a';
            userServiceMock.deleteMember.mockResolvedValue(undefined);

            const result = await deleteMember(inputId);

            expect(result.success).toBe(true);
        });
    });
});

describe('deleteAdmin', () => {
    describe('Equivalence Classes', () => {
        it('deleteAdmin_EC_existingId_deletesAdmin', async () => {
            const inputId = ADMIN_ID;
            userServiceMock.deleteAdmin.mockResolvedValue(undefined);

            const result = await deleteAdmin(inputId);

            expect(result.success).toBe(true);
        });

        it('deleteAdmin_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            userServiceMock.deleteAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteAdmin_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            userServiceMock.deleteAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteAdmin_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            userServiceMock.deleteAdmin.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteAdmin(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteAdmin_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const inputId = 'a';
            userServiceMock.deleteAdmin.mockResolvedValue(undefined);

            const result = await deleteAdmin(inputId);

            expect(result.success).toBe(true);
        });
    });
});
