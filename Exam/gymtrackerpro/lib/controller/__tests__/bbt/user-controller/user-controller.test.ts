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
import {ConflictError, NotFoundError, AppError} from '@/lib/domain/errors';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput} from "@/lib/schema/user-schema";
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

const MEMBER_ID: string = 'member-001';
const ADMIN_ID: string = 'admin-001';
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
    id: 'user-001',
    email: 'john@example.com',
    fullName: 'John Michael Doe',
    phone: '+40712345678',
    dateOfBirth: new Date('1990-01-15'),
    passwordHash: 'hashed',
    role: Role.MEMBER,
};

const MOCK_MEMBER: MemberWithUser = {
    id: MEMBER_ID,
    userId: 'user-001',
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: MOCK_USER,
};

const MOCK_ADMIN: AdminWithUser = {
    id: ADMIN_ID,
    userId: 'user-002',
    user: {
        ...MOCK_USER,
        id: 'user-002',
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
    it('createMember_validInput_returnsSuccessWithMember', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputValidMember = {...VALID_MEMBER_INPUT};

        const result = await createMember(inputValidMember);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUser }).data).toEqual(MOCK_MEMBER);
    });


    it('createMember_fullNameAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputMinName = {...VALID_MEMBER_INPUT, fullName: 'John Doe'};

        const result = await createMember(inputMinName);

        expect(result.success).toBe(true);
    });

    it('createMember_fullNameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {...VALID_MEMBER_INPUT, fullName: 'JohnDo'};

        const result = await createMember(inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_fullNameAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputMaxName = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(64)};

        const result = await createMember(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('createMember_fullNameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {...VALID_MEMBER_INPUT, fullName: 'A'.repeat(65)};

        const result = await createMember(inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_validEmailFormat_passesEmailValidation', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputValidEmail = {...VALID_MEMBER_INPUT, email: 'valid@domain.com'};

        const result = await createMember(inputValidEmail);

        expect(result.success).toBe(true);
    });

    it('createMember_emailMissingAtSymbol_returnsValidationError', async () => {
        const inputInvalidEmail = {...VALID_MEMBER_INPUT, email: 'notanemail'};

        const result = await createMember(inputInvalidEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_emailMissingDomain_returnsValidationError', async () => {
        const inputNoDomain = {...VALID_MEMBER_INPUT, email: 'user@'};

        const result = await createMember(inputNoDomain);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_validE164Phone_passesPhoneValidation', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputValidPhone = {...VALID_MEMBER_INPUT, phone: '+40712345678'};

        const result = await createMember(inputValidPhone);

        expect(result.success).toBe(true);
    });

    it('createMember_phoneContainsLetters_returnsValidationError', async () => {
        const inputAlphaPhone = {...VALID_MEMBER_INPUT, phone: '+4071234abcd'};

        const result = await createMember(inputAlphaPhone);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_dateOfBirthValidIsoFormatInPast_passesValidation', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputValidDob = {...VALID_MEMBER_INPUT, dateOfBirth: '1990-01-15'};

        const result = await createMember(inputValidDob);

        expect(result.success).toBe(true);
    });

    it('createMember_dateOfBirthSlashSeparated_returnsValidationError', async () => {
        const inputSlashDob = {...VALID_MEMBER_INPUT, dateOfBirth: '15/01/1990'};

        const result = await createMember(inputSlashDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_dateOfBirthFutureDate_returnsValidationError', async () => {
        const inputFutureDob = {...VALID_MEMBER_INPUT, dateOfBirth: '2099-01-01'};

        const result = await createMember(inputFutureDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_passwordAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputMinPassword = {...VALID_MEMBER_INPUT, password: 'Secure1!'};

        const result = await createMember(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('createMember_passwordBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortPassword = {...VALID_MEMBER_INPUT, password: 'Sec1!ab'};

        const result = await createMember(inputShortPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_passwordAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputMaxPassword = {...VALID_MEMBER_INPUT, password: 'Secure1!' + 'a'.repeat(56)};

        const result = await createMember(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('createMember_passwordAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongPassword = {...VALID_MEMBER_INPUT, password: 'Secure1!' + 'a'.repeat(57)};

        const result = await createMember(inputLongPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_passwordMissingUppercase_returnsValidationError', async () => {
        const inputNoUppercase = {...VALID_MEMBER_INPUT, password: 'securepass1!'};

        const result = await createMember(inputNoUppercase);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_passwordMissingDigit_returnsValidationError', async () => {
        const inputNoDigit = {...VALID_MEMBER_INPUT, password: 'SecurePass!'};

        const result = await createMember(inputNoDigit);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_passwordMissingSpecialChar_returnsValidationError', async () => {
        const inputNoSpecial = {...VALID_MEMBER_INPUT, password: 'SecurePass1'};

        const result = await createMember(inputNoSpecial);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_membershipStartValidIsoFormat_passesValidation', async () => {
        userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER);
        const inputValidStart = {...VALID_MEMBER_INPUT, membershipStart: '2024-01-01'};

        const result = await createMember(inputValidStart);

        expect(result.success).toBe(true);
    });

    it('createMember_membershipStartSlashSeparated_returnsValidationError', async () => {
        const inputSlashStart = {...VALID_MEMBER_INPUT, membershipStart: '01/01/2024'};

        const result = await createMember(inputSlashStart);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });

    it('createMember_membershipStartFreeText_returnsValidationError', async () => {
        const inputFreeText = {...VALID_MEMBER_INPUT, membershipStart: 'not-a-date'};

        const result = await createMember(inputFreeText);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMember).not.toHaveBeenCalled();
    });


    it('createMember_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        userServiceMock.createMember.mockRejectedValue(new ConflictError('Email already registered'));
        const inputValidMember = {...VALID_MEMBER_INPUT};

        const result = await createMember(inputValidMember);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Email already registered');
    });

    it('createMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.createMember.mockRejectedValue(new Error('DB error'));
        const inputValidMember = {...VALID_MEMBER_INPUT};

        const result = await createMember(inputValidMember);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('createMemberWithTempPassword', () => {
    it('createMemberWithTempPassword_validInput_returnsSuccessWithMemberAndTempPassword', async () => {
        const mockResult: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'TempPass123!'};
        userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockResult);
        const inputValidMember = {...VALID_MEMBER_NO_PWD};

        const result = await createMemberWithTempPassword(inputValidMember);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUserAndTempPassword }).data.tempPassword).toBeDefined();
    });


    it('createMemberWithTempPassword_fullNameAtLowerBoundary8Chars_returnsSuccess', async () => {
        const mockResult: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'TempPass123!'};
        userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockResult);
        const inputMinName = {...VALID_MEMBER_NO_PWD, fullName: 'John Doe'};

        const result = await createMemberWithTempPassword(inputMinName);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPassword_fullNameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {...VALID_MEMBER_NO_PWD, fullName: 'JohnDo'};

        const result = await createMemberWithTempPassword(inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberWithTempPassword_fullNameAtUpperBoundary64Chars_returnsSuccess', async () => {
        const mockResult: MemberWithUserAndTempPassword = {...MOCK_MEMBER, tempPassword: 'TempPass123!'};
        userServiceMock.createMemberWithTempPassword.mockResolvedValue(mockResult);
        const inputMaxName = {...VALID_MEMBER_NO_PWD, fullName: 'A'.repeat(64)};

        const result = await createMemberWithTempPassword(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPassword_fullNameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {...VALID_MEMBER_NO_PWD, fullName: 'A'.repeat(65)};

        const result = await createMemberWithTempPassword(inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });


    it('createMemberWithTempPassword_emailMissingAtSymbol_returnsValidationError', async () => {
        const inputInvalidEmail = {...VALID_MEMBER_NO_PWD, email: 'bademail'};

        const result = await createMemberWithTempPassword(inputInvalidEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberWithTempPassword_dateOfBirthFutureDate_returnsValidationError', async () => {
        const inputFutureDob = {...VALID_MEMBER_NO_PWD, dateOfBirth: '2099-01-01'};

        const result = await createMemberWithTempPassword(inputFutureDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberWithTempPassword_dateOfBirthSlashSeparated_returnsValidationError', async () => {
        const inputSlashDob = {...VALID_MEMBER_NO_PWD, dateOfBirth: '15/01/1990'};

        const result = await createMemberWithTempPassword(inputSlashDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });


    it('createMemberWithTempPassword_membershipStartSlashSeparated_returnsValidationError', async () => {
        const inputSlashStart = {...VALID_MEMBER_NO_PWD, membershipStart: '01/01/2024'};

        const result = await createMemberWithTempPassword(inputSlashStart);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
    });


    it('createMemberWithTempPassword_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        userServiceMock.createMemberWithTempPassword.mockRejectedValue(new ConflictError('Email already registered'));
        const inputValidMember = {...VALID_MEMBER_NO_PWD};

        const result = await createMemberWithTempPassword(inputValidMember);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Email already registered');
    });

    it('createMemberWithTempPassword_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.createMemberWithTempPassword.mockRejectedValue(new Error('DB error'));
        const inputValidMember = {...VALID_MEMBER_NO_PWD};

        const result = await createMemberWithTempPassword(inputValidMember);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('createAdmin', () => {
    it('createAdmin_validInput_returnsSuccessWithAdmin', async () => {
        userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputValidAdmin = {...VALID_ADMIN_INPUT};

        const result = await createAdmin(inputValidAdmin);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: AdminWithUser }).data).toEqual(MOCK_ADMIN);
    });


    it('createAdmin_fullNameAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMinName = {...VALID_ADMIN_INPUT, fullName: 'John Doe'};

        const result = await createAdmin(inputMinName);

        expect(result.success).toBe(true);
    });

    it('createAdmin_fullNameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {...VALID_ADMIN_INPUT, fullName: 'JohnDo'};

        const result = await createAdmin(inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_fullNameAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMaxName = {...VALID_ADMIN_INPUT, fullName: 'A'.repeat(64)};

        const result = await createAdmin(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('createAdmin_fullNameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {...VALID_ADMIN_INPUT, fullName: 'A'.repeat(65)};

        const result = await createAdmin(inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });


    it('createAdmin_emailMissingAtSymbol_returnsValidationError', async () => {
        const inputInvalidEmail = {...VALID_ADMIN_INPUT, email: 'notanemail'};

        const result = await createAdmin(inputInvalidEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_emailMissingDomain_returnsValidationError', async () => {
        const inputNoDomain = {...VALID_ADMIN_INPUT, email: 'admin@'};

        const result = await createAdmin(inputNoDomain);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_phoneContainsLetters_returnsValidationError', async () => {
        const inputAlphaPhone = {...VALID_ADMIN_INPUT, phone: '+4071234abcd'};

        const result = await createAdmin(inputAlphaPhone);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });


    it('createAdmin_dateOfBirthFutureDate_returnsValidationError', async () => {
        const inputFutureDob = {...VALID_ADMIN_INPUT, dateOfBirth: '2099-01-01'};

        const result = await createAdmin(inputFutureDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_dateOfBirthSlashSeparated_returnsValidationError', async () => {
        const inputSlashDob = {...VALID_ADMIN_INPUT, dateOfBirth: '20/06/1985'};

        const result = await createAdmin(inputSlashDob);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });


    it('createAdmin_passwordAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMinPassword = {...VALID_ADMIN_INPUT, password: 'Secure1!'};

        const result = await createAdmin(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('createAdmin_passwordBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortPassword = {...VALID_ADMIN_INPUT, password: 'Sec1!ab'};

        const result = await createAdmin(inputShortPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_passwordAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMaxPassword = {...VALID_ADMIN_INPUT, password: 'Secure1!' + 'a'.repeat(56)};

        const result = await createAdmin(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('createAdmin_passwordAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongPassword = {...VALID_ADMIN_INPUT, password: 'Secure1!' + 'a'.repeat(57)};

        const result = await createAdmin(inputLongPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_passwordMissingUppercase_returnsValidationError', async () => {
        const inputNoUppercase = {...VALID_ADMIN_INPUT, password: 'securepass1!'};

        const result = await createAdmin(inputNoUppercase);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_passwordMissingDigit_returnsValidationError', async () => {
        const inputNoDigit = {...VALID_ADMIN_INPUT, password: 'SecurePass!'};

        const result = await createAdmin(inputNoDigit);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });

    it('createAdmin_passwordMissingSpecialChar_returnsValidationError', async () => {
        const inputNoSpecial = {...VALID_ADMIN_INPUT, password: 'SecurePass1'};

        const result = await createAdmin(inputNoSpecial);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
    });


    it('createAdmin_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        userServiceMock.createAdmin.mockRejectedValue(new ConflictError('Email already registered'));
        const inputValidAdmin = {...VALID_ADMIN_INPUT};

        const result = await createAdmin(inputValidAdmin);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Email already registered');
    });

    it('createAdmin_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.createAdmin.mockRejectedValue(new Error('DB error'));
        const inputValidAdmin = {...VALID_ADMIN_INPUT};

        const result = await createAdmin(inputValidAdmin);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('getMember', () => {
    it('getMember_existingMemberId_returnsSuccessWithMember', async () => {
        userServiceMock.getMember.mockResolvedValue(MOCK_MEMBER);
        const inputMemberId = MEMBER_ID;

        const result = await getMember(inputMemberId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUser }).data).toEqual(MOCK_MEMBER);
    });

    it('getMember_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.getMember.mockRejectedValue(new NotFoundError('Member not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await getMember(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('getMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.getMember.mockRejectedValue(new Error('DB error'));
        const inputMemberId = MEMBER_ID;

        const result = await getMember(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('getAdmin', () => {
    it('getAdmin_existingAdminId_returnsSuccessWithAdmin', async () => {
        userServiceMock.getAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputAdminId = ADMIN_ID;

        const result = await getAdmin(inputAdminId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: AdminWithUser }).data).toEqual(MOCK_ADMIN);
    });

    it('getAdmin_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.getAdmin.mockRejectedValue(new NotFoundError('Admin not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await getAdmin(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Admin not found');
    });

    it('getAdmin_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.getAdmin.mockRejectedValue(new Error('DB error'));
        const inputAdminId = ADMIN_ID;

        const result = await getAdmin(inputAdminId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('listMembers', () => {
    it('listMembers_noOptions_returnsSuccessWithMembersPage', async () => {
        userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);

        const result = await listMembers();

        expect(result.success).toBe(true);
        expect((result as { success: true; data: { items: MemberWithUser[]; total: number } }).data.total).toBe(1);
    });

    it('listMembers_withSearchOption_passesFilterToService', async () => {
        userServiceMock.listMembers.mockResolvedValue(MOCK_PAGE_MEMBERS);
        const inputFilter: MemberListOptions = {search: 'John'};

        const result = await listMembers(inputFilter);

        expect(result.success).toBe(true);
        expect(userServiceMock.listMembers).toHaveBeenCalledWith(inputFilter);
    });

    it('listMembers_withPagination_passesPaginationToService', async () => {
        userServiceMock.listMembers.mockResolvedValue({items: [], total: 50});
        const inputPagination: MemberListOptions = {page: 2, pageSize: 10};

        const result = await listMembers(inputPagination);

        expect(result.success).toBe(true);
        expect(userServiceMock.listMembers).toHaveBeenCalledWith(inputPagination);
    });

    it('listMembers_serviceThrowsAppError_returnsFailureWithMessage', async () => {
        userServiceMock.listMembers.mockRejectedValue(new AppError('Service error'));

        const result = await listMembers();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Service error');
    });

    it('listMembers_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.listMembers.mockRejectedValue(new Error('DB error'));

        const result = await listMembers();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('listAdmins', () => {
    it('listAdmins_noOptions_returnsSuccessWithAdminsPage', async () => {
        userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);

        const result = await listAdmins();

        expect(result.success).toBe(true);
        expect((result as { success: true; data: { items: AdminWithUser[]; total: number } }).data.total).toBe(1);
    });

    it('listAdmins_withSearchOption_passesFilterToService', async () => {
        userServiceMock.listAdmins.mockResolvedValue(MOCK_PAGE_ADMINS);
        const inputFilter: AdminListOptions = {search: 'Admin'};

        const result = await listAdmins(inputFilter);

        expect(result.success).toBe(true);
        expect(userServiceMock.listAdmins).toHaveBeenCalledWith(inputFilter);
    });

    it('listAdmins_withPagination_passesPaginationToService', async () => {
        userServiceMock.listAdmins.mockResolvedValue({items: [], total: 20});
        const inputPagination: AdminListOptions = {page: 2, pageSize: 5};

        const result = await listAdmins(inputPagination);

        expect(result.success).toBe(true);
        expect(userServiceMock.listAdmins).toHaveBeenCalledWith(inputPagination);
    });

    it('listAdmins_serviceThrowsAppError_returnsFailureWithMessage', async () => {
        userServiceMock.listAdmins.mockRejectedValue(new AppError('Service error'));

        const result = await listAdmins();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Service error');
    });

    it('listAdmins_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.listAdmins.mockRejectedValue(new Error('DB error'));

        const result = await listAdmins();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('updateMember', () => {
    it('updateMember_validInput_returnsSuccessWithUpdatedMember', async () => {
        const updatedMember: MemberWithUser = {...MOCK_MEMBER, user: {...MOCK_USER, fullName: 'John Updated Doe'}};
        userServiceMock.updateMember.mockResolvedValue(updatedMember);
        const inputUpdateData = {fullName: 'John Updated Doe'};

        const result = await updateMember(MEMBER_ID, inputUpdateData);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUser }).data.user.fullName).toBe('John Updated Doe');
    });

    it('updateMember_emptyObject_returnsSuccess', async () => {
        userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);
        const inputEmpty = {};

        const result = await updateMember(MEMBER_ID, inputEmpty);

        expect(result.success).toBe(true);
    });


    it('updateMember_fullNameAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);
        const inputMinName = {fullName: 'John Doe'};

        const result = await updateMember(MEMBER_ID, inputMinName);

        expect(result.success).toBe(true);
    });

    it('updateMember_fullNameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {fullName: 'JohnDo'};

        const result = await updateMember(MEMBER_ID, inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_fullNameAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);
        const inputMaxName = {fullName: 'A'.repeat(64)};

        const result = await updateMember(MEMBER_ID, inputMaxName);

        expect(result.success).toBe(true);
    });

    it('updateMember_fullNameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {fullName: 'A'.repeat(65)};

        const result = await updateMember(MEMBER_ID, inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });


    it('updateMember_emailMissingAtSymbol_returnsValidationError', async () => {
        const inputInvalidEmail = {email: 'bademail'};

        const result = await updateMember(MEMBER_ID, inputInvalidEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_passwordBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortPassword = {password: 'Sec1!ab'};

        const result = await updateMember(MEMBER_ID, inputShortPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_passwordAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);
        const inputMinPassword = {password: 'Secure1!'};

        const result = await updateMember(MEMBER_ID, inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('updateMember_passwordAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.updateMember.mockResolvedValue(MOCK_MEMBER);
        const inputMaxPassword = {password: 'Secure1!' + 'a'.repeat(56)};

        const result = await updateMember(MEMBER_ID, inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('updateMember_passwordAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongPassword = {password: 'Secure1!' + 'a'.repeat(57)};

        const result = await updateMember(MEMBER_ID, inputLongPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_passwordMissingDigit_returnsValidationError', async () => {
        const inputNoDigit = {password: 'SecurePass!'};

        const result = await updateMember(MEMBER_ID, inputNoDigit);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_passwordMissingUppercase_returnsValidationError', async () => {
        const inputNoUppercase = {password: 'securepass1!'};

        const result = await updateMember(MEMBER_ID, inputNoUppercase);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_passwordMissingSpecialChar_returnsValidationError', async () => {
        const inputNoSpecial = {password: 'SecurePass1'};

        const result = await updateMember(MEMBER_ID, inputNoSpecial);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_membershipStartSlashSeparated_returnsValidationError', async () => {
        const inputSlashStart = {membershipStart: '01/01/2024'};

        const result = await updateMember(MEMBER_ID, inputSlashStart);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateMember).not.toHaveBeenCalled();
    });

    it('updateMember_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.updateMember.mockRejectedValue(new NotFoundError('Member not found'));
        const inputUpdateData = {fullName: 'John Updated Doe'};

        const result = await updateMember(NONEXISTENT_ID, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('updateMember_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        userServiceMock.updateMember.mockRejectedValue(new ConflictError('Email already in use'));
        const inputDuplicateEmail = {email: 'taken@example.com'};

        const result = await updateMember(MEMBER_ID, inputDuplicateEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Email already in use');
    });

    it('updateMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.updateMember.mockRejectedValue(new Error('DB error'));
        const inputUpdateData = {fullName: 'John Updated Doe'};

        const result = await updateMember(MEMBER_ID, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('updateAdmin', () => {
    it('updateAdmin_validInput_returnsSuccessWithUpdatedAdmin', async () => {
        const updatedAdmin: AdminWithUser = {...MOCK_ADMIN, user: {...MOCK_ADMIN.user, fullName: 'Admin Updated Name'}};
        userServiceMock.updateAdmin.mockResolvedValue(updatedAdmin);
        const inputUpdateData = {fullName: 'Admin Updated Name'};

        const result = await updateAdmin(ADMIN_ID, inputUpdateData);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: AdminWithUser }).data.user.fullName).toBe('Admin Updated Name');
    });

    it('updateAdmin_emptyObject_returnsSuccess', async () => {
        userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputEmpty = {};

        const result = await updateAdmin(ADMIN_ID, inputEmpty);

        expect(result.success).toBe(true);
    });


    it('updateAdmin_fullNameAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMinName = {fullName: 'John Doe'};

        const result = await updateAdmin(ADMIN_ID, inputMinName);

        expect(result.success).toBe(true);
    });

    it('updateAdmin_fullNameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {fullName: 'JohnDo'};

        const result = await updateAdmin(ADMIN_ID, inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_fullNameAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMaxName = {fullName: 'A'.repeat(64)};

        const result = await updateAdmin(ADMIN_ID, inputMaxName);

        expect(result.success).toBe(true);
    });

    it('updateAdmin_fullNameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {fullName: 'A'.repeat(65)};

        const result = await updateAdmin(ADMIN_ID, inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });


    it('updateAdmin_emailMissingAtSymbol_returnsValidationError', async () => {
        const inputInvalidEmail = {email: 'bademail'};

        const result = await updateAdmin(ADMIN_ID, inputInvalidEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_passwordBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortPassword = {password: 'Sec1!ab'};

        const result = await updateAdmin(ADMIN_ID, inputShortPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_passwordAtLowerBoundary8Chars_returnsSuccess', async () => {
        userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMinPassword = {password: 'Secure1!'};

        const result = await updateAdmin(ADMIN_ID, inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('updateAdmin_passwordAtUpperBoundary64Chars_returnsSuccess', async () => {
        userServiceMock.updateAdmin.mockResolvedValue(MOCK_ADMIN);
        const inputMaxPassword = {password: 'Secure1!' + 'a'.repeat(56)};

        const result = await updateAdmin(ADMIN_ID, inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('updateAdmin_passwordAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongPassword = {password: 'Secure1!' + 'a'.repeat(57)};

        const result = await updateAdmin(ADMIN_ID, inputLongPassword);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_passwordMissingDigit_returnsValidationError', async () => {
        const inputNoDigit = {password: 'SecurePass!'};

        const result = await updateAdmin(ADMIN_ID, inputNoDigit);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_passwordMissingUppercase_returnsValidationError', async () => {
        const inputNoUppercase = {password: 'securepass1!'};

        const result = await updateAdmin(ADMIN_ID, inputNoUppercase);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });

    it('updateAdmin_passwordMissingSpecialChar_returnsValidationError', async () => {
        const inputNoSpecial = {password: 'SecurePass1'};

        const result = await updateAdmin(ADMIN_ID, inputNoSpecial);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
    });


    it('updateAdmin_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.updateAdmin.mockRejectedValue(new NotFoundError('Admin not found'));
        const inputUpdateData = {fullName: 'Admin Updated Name'};

        const result = await updateAdmin(NONEXISTENT_ID, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Admin not found');
    });

    it('updateAdmin_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        userServiceMock.updateAdmin.mockRejectedValue(new ConflictError('Email already in use'));
        const inputDuplicateEmail = {email: 'taken@example.com'};

        const result = await updateAdmin(ADMIN_ID, inputDuplicateEmail);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Email already in use');
    });

    it('updateAdmin_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.updateAdmin.mockRejectedValue(new Error('DB error'));
        const inputUpdateData = {fullName: 'Admin Updated Name'};

        const result = await updateAdmin(ADMIN_ID, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('suspendMember', () => {
    it('suspendMember_existingMemberId_returnsSuccessWithSuspendedMember', async () => {
        const suspendedMember: MemberWithUser = {...MOCK_MEMBER, isActive: false};
        userServiceMock.suspendMember.mockResolvedValue(suspendedMember);
        const inputMemberId = MEMBER_ID;

        const result = await suspendMember(inputMemberId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUser }).data.isActive).toBe(false);
    });

    it('suspendMember_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.suspendMember.mockRejectedValue(new NotFoundError('Member not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await suspendMember(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('suspendMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.suspendMember.mockRejectedValue(new Error('DB error'));
        const inputMemberId = MEMBER_ID;

        const result = await suspendMember(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('activateMember', () => {
    it('activateMember_existingSuspendedMemberId_returnsSuccessWithActiveMember', async () => {
        const activatedMember: MemberWithUser = {...MOCK_MEMBER, isActive: true};
        userServiceMock.activateMember.mockResolvedValue(activatedMember);
        const inputMemberId = MEMBER_ID;

        const result = await activateMember(inputMemberId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: MemberWithUser }).data.isActive).toBe(true);
    });

    it('activateMember_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.activateMember.mockRejectedValue(new NotFoundError('Member not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await activateMember(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('activateMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.activateMember.mockRejectedValue(new Error('DB error'));
        const inputMemberId = MEMBER_ID;

        const result = await activateMember(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('deleteMember', () => {
    it('deleteMember_existingMemberId_returnsSuccessWithUndefinedData', async () => {
        userServiceMock.deleteMember.mockResolvedValue(undefined);
        const inputMemberId = MEMBER_ID;

        const result = await deleteMember(inputMemberId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: undefined }).data).toBeUndefined();
    });

    it('deleteMember_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.deleteMember.mockRejectedValue(new NotFoundError('Member not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await deleteMember(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('deleteMember_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.deleteMember.mockRejectedValue(new Error('DB error'));
        const inputMemberId = MEMBER_ID;

        const result = await deleteMember(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('deleteAdmin', () => {
    it('deleteAdmin_existingAdminId_returnsSuccessWithUndefinedData', async () => {
        userServiceMock.deleteAdmin.mockResolvedValue(undefined);
        const inputAdminId = ADMIN_ID;

        const result = await deleteAdmin(inputAdminId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: undefined }).data).toBeUndefined();
    });

    it('deleteAdmin_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        userServiceMock.deleteAdmin.mockRejectedValue(new NotFoundError('Admin not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await deleteAdmin(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Admin not found');
    });

    it('deleteAdmin_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        userServiceMock.deleteAdmin.mockRejectedValue(new Error('DB error'));
        const inputAdminId = ADMIN_ID;

        const result = await deleteAdmin(inputAdminId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});