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

jest.mock('@/lib/schema/user-schema', () => ({
    createMemberSchema: {safeParse: jest.fn()},
    createMemberWithTempPasswordSchema: {safeParse: jest.fn()},
    createAdminSchema: {safeParse: jest.fn()},
    updateMemberSchema: {safeParse: jest.fn()},
    updateAdminSchema: {safeParse: jest.fn()},
}));

import {z} from 'zod';
import {userService} from '@/lib/di';
import {
    createMemberSchema,
    createMemberWithTempPasswordSchema,
    createAdminSchema,
    updateMemberSchema,
    updateAdminSchema,
} from '@/lib/schema/user-schema';
import {
    AdminListOptions,
    AdminWithUser,
    MemberListOptions,
    MemberWithUser,
    MemberWithUserAndTempPassword,
    Role
} from '@/lib/domain/user';
import {
    CreateMemberInput,
    CreateMemberWithTempPasswordInput,
    CreateAdminInput,
    UpdateMemberInput,
    UpdateAdminInput,
} from '@/lib/schema/user-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
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
    deleteAdmin,
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

const createMemberSchemaMock = createMemberSchema as unknown as { safeParse: jest.Mock };
const createMemberWithTempPasswordSchemaMock = createMemberWithTempPasswordSchema as unknown as {
    safeParse: jest.Mock
};
const createAdminSchemaMock = createAdminSchema as unknown as { safeParse: jest.Mock };
const updateMemberSchemaMock = updateMemberSchema as unknown as { safeParse: jest.Mock };
const updateAdminSchemaMock = updateAdminSchema as unknown as { safeParse: jest.Mock };

const USER_ID: string = 'user-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const ADMIN_ID: string = 'admin-uuid-001';
const ADMIN_USER_ID: string = 'user-uuid-002';
const TEMP_PASSWORD: string = 'TempPass123!ABCD';

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

const MOCK_SUSPENDED_MEMBER: MemberWithUser = {...MOCK_MEMBER_WITH_USER, isActive: false};

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

const MOCK_MEMBER_WITH_TEMP_PASSWORD: MemberWithUserAndTempPassword = {
    ...MOCK_MEMBER_WITH_USER,
    tempPassword: TEMP_PASSWORD,
};

const VALID_CREATE_MEMBER_INPUT: CreateMemberInput = {
    email: 'member@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecurePass123!',
    membershipStart: '2024-01-01',
};

const VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT: CreateMemberWithTempPasswordInput = {
    email: 'member@example.com',
    fullName: 'John Doe',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    membershipStart: '2024-01-01',
};

const VALID_CREATE_ADMIN_INPUT: CreateAdminInput = {
    email: 'admin@gymtrackerpro.com',
    fullName: 'Admin User',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminPass123!',
};

const VALID_UPDATE_MEMBER_INPUT: UpdateMemberInput = {
    fullName: 'John Updated',
};

const VALID_UPDATE_ADMIN_INPUT: UpdateAdminInput = {
    fullName: 'Admin Updated',
};

const MOCK_ZOD_ERROR = (
    z.object({email: z.string().email()}).safeParse({}) as { success: false; error: z.ZodError }
).error;

beforeEach(() => {
    jest.resetAllMocks();
});

describe('createMember', () => {

    describe('Independent Paths', () => {

        it('createMember_Path1_validInputServiceSucceeds_returnsMemberWithUser', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...VALID_CREATE_MEMBER_INPUT};
            createMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            // Act
            const result = await createMember(inputData);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_MEMBER_WITH_USER});
            expect(createMemberSchemaMock.safeParse).toHaveBeenCalledWith(inputData);
            expect(userServiceMock.createMember).toHaveBeenCalledWith(inputData);
        });

        it('createMember_Path2_invalidInput_returnsValidationError', async () => {
            // Arrange
            const inputData = {} as CreateMemberInput;
            createMemberSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            // Act
            const result = await createMember(inputData);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(userServiceMock.createMember).not.toHaveBeenCalled();
        });

        it('createMember_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...VALID_CREATE_MEMBER_INPUT};
            createMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMember.mockRejectedValue(new ConflictError('Email already in use: member@example.com'));

            // Act
            const result = await createMember(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'Email already in use: member@example.com'});
        });

        it('createMember_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputData: CreateMemberInput = {...VALID_CREATE_MEMBER_INPUT};
            createMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await createMember(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('createMemberWithTempPassword', () => {

    describe('Independent Paths', () => {

        it('createMemberWithTempPassword_Path1_validInputServiceSucceeds_returnsMemberWithTempPassword', async () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {...VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT};
            createMemberWithTempPasswordSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMemberWithTempPassword.mockResolvedValue(MOCK_MEMBER_WITH_TEMP_PASSWORD);

            // Act
            const result = await createMemberWithTempPassword(inputData);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_MEMBER_WITH_TEMP_PASSWORD});
            expect(createMemberWithTempPasswordSchemaMock.safeParse).toHaveBeenCalledWith(inputData);
            expect(userServiceMock.createMemberWithTempPassword).toHaveBeenCalledWith(inputData);
        });

        it('createMemberWithTempPassword_Path2_invalidInput_returnsValidationError', async () => {
            // Arrange
            const inputData = {} as CreateMemberWithTempPasswordInput;
            createMemberWithTempPasswordSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            // Act
            const result = await createMemberWithTempPassword(inputData);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(userServiceMock.createMemberWithTempPassword).not.toHaveBeenCalled();
        });

        it('createMemberWithTempPassword_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {...VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT};
            createMemberWithTempPasswordSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMemberWithTempPassword.mockRejectedValue(new ConflictError('Email already in use: member@example.com'));

            // Act
            const result = await createMemberWithTempPassword(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'Email already in use: member@example.com'});
        });

        it('createMemberWithTempPassword_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {...VALID_CREATE_MEMBER_WITH_TEMP_PASSWORD_INPUT};
            createMemberWithTempPasswordSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createMemberWithTempPassword.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await createMemberWithTempPassword(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('createAdmin', () => {

    describe('Independent Paths', () => {

        it('createAdmin_Path1_validInputServiceSucceeds_returnsAdminWithUser', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...VALID_CREATE_ADMIN_INPUT};
            createAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            // Act
            const result = await createAdmin(inputData);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_ADMIN_WITH_USER});
            expect(createAdminSchemaMock.safeParse).toHaveBeenCalledWith(inputData);
            expect(userServiceMock.createAdmin).toHaveBeenCalledWith(inputData);
        });

        it('createAdmin_Path2_invalidInput_returnsValidationError', async () => {
            // Arrange
            const inputData = {} as CreateAdminInput;
            createAdminSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            // Act
            const result = await createAdmin(inputData);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(userServiceMock.createAdmin).not.toHaveBeenCalled();
        });

        it('createAdmin_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...VALID_CREATE_ADMIN_INPUT};
            createAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createAdmin.mockRejectedValue(new ConflictError('Email already in use: admin@gymtrackerpro.com'));

            // Act
            const result = await createAdmin(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'Email already in use: admin@gymtrackerpro.com'});
        });

        it('createAdmin_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputData: CreateAdminInput = {...VALID_CREATE_ADMIN_INPUT};
            createAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.createAdmin.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await createAdmin(inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('getMember', () => {

    describe('Independent Paths', () => {

        it('getMember_Path1_serviceSucceeds_returnsMemberWithUser', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.getMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            // Act
            const result = await getMember(inputId);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_MEMBER_WITH_USER});
            expect(userServiceMock.getMember).toHaveBeenCalledWith(inputId);
        });

        it('getMember_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.getMember.mockRejectedValue(new NotFoundError(`Member not found: ${MEMBER_ID}`));

            // Act
            const result = await getMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('getMember_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.getMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await getMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('getAdmin', () => {

    describe('Independent Paths', () => {

        it('getAdmin_Path1_serviceSucceeds_returnsAdminWithUser', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.getAdmin.mockResolvedValue(MOCK_ADMIN_WITH_USER);

            // Act
            const result = await getAdmin(inputId);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_ADMIN_WITH_USER});
            expect(userServiceMock.getAdmin).toHaveBeenCalledWith(inputId);
        });

        it('getAdmin_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.getAdmin.mockRejectedValue(new NotFoundError(`Admin not found: ${ADMIN_ID}`));

            // Act
            const result = await getAdmin(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Admin not found: ${ADMIN_ID}`});
        });

        it('getAdmin_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.getAdmin.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await getAdmin(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('listMembers', () => {

    describe('Independent Paths', () => {

        it('listMembers_Path1_serviceSucceeds_returnsPageResult', async () => {
            // Arrange
            const inputOptions: MemberListOptions | undefined = undefined;
            const pageResult: PageResult<MemberWithUser> = {items: [MOCK_MEMBER_WITH_USER], total: 1};
            userServiceMock.listMembers.mockResolvedValue(pageResult);

            // Act
            const result = await listMembers(inputOptions);

            // Assert
            expect(result).toEqual({success: true, data: pageResult});
            expect(userServiceMock.listMembers).toHaveBeenCalledWith(inputOptions);
        });

        it('listMembers_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputOptions: MemberListOptions | undefined = undefined;
            userServiceMock.listMembers.mockRejectedValue(new NotFoundError('Not found'));

            // Act
            const result = await listMembers(inputOptions);

            // Assert
            expect(result).toEqual({success: false, message: 'Not found'});
        });

        it('listMembers_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputOptions: MemberListOptions | undefined = undefined;
            userServiceMock.listMembers.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await listMembers(inputOptions);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('listAdmins', () => {

    describe('Independent Paths', () => {

        it('listAdmins_Path1_serviceSucceeds_returnsPageResult', async () => {
            // Arrange
            const inputOptions: AdminListOptions | undefined = undefined;
            const pageResult: PageResult<AdminWithUser> = {items: [MOCK_ADMIN_WITH_USER], total: 1};
            userServiceMock.listAdmins.mockResolvedValue(pageResult);

            // Act
            const result = await listAdmins(inputOptions);

            // Assert
            expect(result).toEqual({success: true, data: pageResult});
            expect(userServiceMock.listAdmins).toHaveBeenCalledWith(inputOptions);
        });

        it('listAdmins_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputOptions: AdminListOptions | undefined = undefined;
            userServiceMock.listAdmins.mockRejectedValue(new NotFoundError('Not found'));

            // Act
            const result = await listAdmins(inputOptions);

            // Assert
            expect(result).toEqual({success: false, message: 'Not found'});
        });

        it('listAdmins_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputOptions: AdminListOptions | undefined = undefined;
            userServiceMock.listAdmins.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await listAdmins(inputOptions);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('updateMember', () => {

    describe('Independent Paths', () => {

        it('updateMember_Path1_validInputServiceSucceeds_returnsUpdatedMember', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {...VALID_UPDATE_MEMBER_INPUT};
            const updatedMember: MemberWithUser = {
                ...MOCK_MEMBER_WITH_USER,
                user: {...MOCK_MEMBER_WITH_USER.user, fullName: 'John Updated'},
            };
            updateMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateMember.mockResolvedValue(updatedMember);

            // Act
            const result = await updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual({success: true, data: updatedMember});
            expect(updateMemberSchemaMock.safeParse).toHaveBeenCalledWith(inputData);
            expect(userServiceMock.updateMember).toHaveBeenCalledWith(inputId, inputData);
        });

        it('updateMember_Path2_invalidInput_returnsValidationError', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData = {} as UpdateMemberInput;
            updateMemberSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            // Act
            const result = await updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(userServiceMock.updateMember).not.toHaveBeenCalled();
        });

        it('updateMember_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {...VALID_UPDATE_MEMBER_INPUT};
            updateMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateMember.mockRejectedValue(new NotFoundError(`Member not found: ${MEMBER_ID}`));

            // Act
            const result = await updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('updateMember_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            const inputData: UpdateMemberInput = {...VALID_UPDATE_MEMBER_INPUT};
            updateMemberSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await updateMember(inputId, inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('updateAdmin', () => {

    describe('Independent Paths', () => {

        it('updateAdmin_Path1_validInputServiceSucceeds_returnsUpdatedAdmin', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {...VALID_UPDATE_ADMIN_INPUT};
            const updatedAdmin: AdminWithUser = {
                ...MOCK_ADMIN_WITH_USER,
                user: {...MOCK_ADMIN_WITH_USER.user, fullName: 'Admin Updated'},
            };
            updateAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateAdmin.mockResolvedValue(updatedAdmin);

            // Act
            const result = await updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual({success: true, data: updatedAdmin});
            expect(updateAdminSchemaMock.safeParse).toHaveBeenCalledWith(inputData);
            expect(userServiceMock.updateAdmin).toHaveBeenCalledWith(inputId, inputData);
        });

        it('updateAdmin_Path2_invalidInput_returnsValidationError', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData = {} as UpdateAdminInput;
            updateAdminSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            // Act
            const result = await updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(userServiceMock.updateAdmin).not.toHaveBeenCalled();
        });

        it('updateAdmin_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {...VALID_UPDATE_ADMIN_INPUT};
            updateAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateAdmin.mockRejectedValue(new NotFoundError(`Admin not found: ${ADMIN_ID}`));

            // Act
            const result = await updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual({success: false, message: `Admin not found: ${ADMIN_ID}`});
        });

        it('updateAdmin_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            const inputData: UpdateAdminInput = {...VALID_UPDATE_ADMIN_INPUT};
            updateAdminSchemaMock.safeParse.mockReturnValue({success: true, data: inputData});
            userServiceMock.updateAdmin.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await updateAdmin(inputId, inputData);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('suspendMember', () => {

    describe('Independent Paths', () => {

        it('suspendMember_Path1_serviceSucceeds_returnsSuspendedMember', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.suspendMember.mockResolvedValue(MOCK_SUSPENDED_MEMBER);

            // Act
            const result = await suspendMember(inputId);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_SUSPENDED_MEMBER});
            expect(userServiceMock.suspendMember).toHaveBeenCalledWith(inputId);
        });

        it('suspendMember_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.suspendMember.mockRejectedValue(new NotFoundError(`Member not found: ${MEMBER_ID}`));

            // Act
            const result = await suspendMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('suspendMember_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.suspendMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await suspendMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('activateMember', () => {

    describe('Independent Paths', () => {

        it('activateMember_Path1_serviceSucceeds_returnsActivatedMember', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.activateMember.mockResolvedValue(MOCK_MEMBER_WITH_USER);

            // Act
            const result = await activateMember(inputId);

            // Assert
            expect(result).toEqual({success: true, data: MOCK_MEMBER_WITH_USER});
            expect(userServiceMock.activateMember).toHaveBeenCalledWith(inputId);
        });

        it('activateMember_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.activateMember.mockRejectedValue(new NotFoundError(`Member not found: ${MEMBER_ID}`));

            // Act
            const result = await activateMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('activateMember_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.activateMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await activateMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('deleteMember', () => {

    describe('Independent Paths', () => {

        it('deleteMember_Path1_serviceSucceeds_returnsVoid', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.deleteMember.mockResolvedValue(undefined);

            // Act
            const result = await deleteMember(inputId);

            // Assert
            expect(result).toEqual({success: true, data: undefined});
            expect(userServiceMock.deleteMember).toHaveBeenCalledWith(inputId);
        });

        it('deleteMember_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.deleteMember.mockRejectedValue(new NotFoundError(`Member not found: ${MEMBER_ID}`));

            // Act
            const result = await deleteMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('deleteMember_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = MEMBER_ID;
            userServiceMock.deleteMember.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await deleteMember(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('deleteAdmin', () => {

    describe('Independent Paths', () => {

        it('deleteAdmin_Path1_serviceSucceeds_returnsVoid', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.deleteAdmin.mockResolvedValue(undefined);

            // Act
            const result = await deleteAdmin(inputId);

            // Assert
            expect(result).toEqual({success: true, data: undefined});
            expect(userServiceMock.deleteAdmin).toHaveBeenCalledWith(inputId);
        });

        it('deleteAdmin_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.deleteAdmin.mockRejectedValue(new NotFoundError(`Admin not found: ${ADMIN_ID}`));

            // Act
            const result = await deleteAdmin(inputId);

            // Assert
            expect(result).toEqual({success: false, message: `Admin not found: ${ADMIN_ID}`});
        });

        it('deleteAdmin_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            // Arrange
            const inputId: string = ADMIN_ID;
            userServiceMock.deleteAdmin.mockRejectedValue(new Error('Database failure'));

            // Act
            const result = await deleteAdmin(inputId);

            // Assert
            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});