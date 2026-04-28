import {
    createMemberSchema,
    createMemberWithTempPasswordSchema,
    createAdminSchema,
    updateMemberSchema,
    updateAdminSchema,
    loginUserSchema,
    CreateMemberInput,
    CreateMemberWithTempPasswordInput,
    CreateAdminInput,
    LoginUserInput,
    UpdateMemberInput,
    UpdateAdminInput, createUserSchema, CreateUserInput, UpdateUserInput, updateUserSchema,
} from '@/lib/schema/user-schema';

const VALID_USER: CreateUserInput = {
    email: 'john.doe@example.com',
    fullName: 'John Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1!',
};

const VALID_MEMBER: CreateMemberInput = {
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

const VALID_ADMIN: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin User Test',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminP@ss1!',
};

const VALID_LOGIN: LoginUserInput = {
    email: 'admin@gymtrackerpro.com',
    password: 'ValidPassword1!',
};

const getYesterdayIso = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
};

const getTodayIso = (): string => new Date().toISOString().slice(0, 10);

const getTomorrowIso = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
};

describe('createUserSchema', () => {
    describe('Equivalence Classes', () => {
        it('createUserSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputUser);
            }
        });

        it('createUserSchema_EC_missingEmail_returnsValidationError', () => {
            // Arrange
            const { email, ...inputUser } = VALID_USER;

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createUserSchema_EC_missingFullName_returnsValidationError', () => {
            // Arrange
            const { fullName, ...inputUser } = VALID_USER;

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_EC_missingPhone_returnsValidationError', () => {
            // Arrange
            const { phone, ...inputUser } = VALID_USER;

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createUserSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            // Arrange
            const { dateOfBirth, ...inputUser } = VALID_USER;

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createUserSchema_EC_missingPassword_returnsValidationError', () => {
            // Arrange
            const { password, ...inputUser } = VALID_USER;

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                email: 'invalidemail.com'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createUserSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                password: 'secure1@pass'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                password: 'SecureP@ss'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                password: 'SecurePass1'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                phone: '0712345678'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createUserSchema_EC_dateOfBirthInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                dateOfBirth: '15-01-1990'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createUserSchema_EC_dateOfBirthInTheFuture_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                dateOfBirth: '2099-01-01'
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createUserSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                fullName: '         '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: '  John Doe Test  '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('John Doe Test');
            }
        });

        it('createUserSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                email: '  john.doe@example.com  '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('john.doe@example.com');
            }
        });

        it('createUserSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                phone: '  +40712345678  '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createUserSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createUserSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('createUserSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('createUserSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createUserSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                fullName: ' '.repeat(8)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createUserSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createUserSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createUserSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUser.password);
            }
        });

        it('createUserSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUser.password);
            }
        });

        it('createUserSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUser.password);
            }
        });

        it('createUserSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUser.password);
            }
        });

        it('createUserSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createUserSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUser: CreateUserInput = {
                ...VALID_USER,
                dateOfBirth: yesterday
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('createUserSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createUserSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputUser = {
                ...VALID_USER,
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = createUserSchema.safeParse(inputUser);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('createMemberSchema', () => {
    describe('Equivalence Classes', () => {
        it('createMemberSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputMember);
            }
        });

        it('createMemberSchema_EC_missingEmail_returnsValidationError', () => {
            // Arrange
            const {email, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createMemberSchema_EC_missingFullName_returnsValidationError', () => {
            // Arrange
            const {fullName, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_EC_missingPhone_returnsValidationError', () => {
            // Arrange
            const {phone, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createMemberSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            // Arrange
            const {dateOfBirth, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberSchema_EC_missingPassword_returnsValidationError', () => {
            // Arrange
            const {password, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_EC_missingMembershipStart_returnsValidationError', () => {
            // Arrange
            const {membershipStart, ...inputMember} = VALID_MEMBER;

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('membershipStart');
            }
        });

        it('createMemberSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                email: 'invalidemail.com'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createMemberSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                password: 'secure1@pass'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                password: 'SecureP@ss'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                password: 'SecurePass1'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                phone: '0712345678'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createMemberSchema_EC_dateOfBirthInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: '15-01-1990'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberSchema_EC_dateOfBirthInTheFuture_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: '2099-01-01'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                membershipStart: '01/01/2024'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('membershipStart');
            }
        });

        it('createMemberSchema_EC_membershipStartInTheFuture_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                membershipStart: '2099-01-01'
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.membershipStart).toBe('2099-01-01');
            }
        });

        it('createMemberSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                fullName: '         '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: '  John Doe Test  '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('John Doe Test');
            }
        });

        it('createMemberSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                email: '  john.doe@example.com  '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('john.doe@example.com');
            }
        });

        it('createMemberSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                phone: '  +40712345678  '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createMemberSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('createMemberSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('createMemberSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createMemberSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                fullName: ' '.repeat(8)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createMemberSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createMemberSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputMember.password);
            }
        });

        it('createMemberSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputMember.password);
            }
        });

        it('createMemberSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputMember.password);
            }
        });

        it('createMemberSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputMember.password);
            }
        });

        it('createMemberSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createMemberSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                dateOfBirth: yesterday
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('createMemberSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = createMemberSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('createMemberWithTempPasswordSchema', () => {
    describe('Equivalence Classes', () => {
        it('createMemberWithTempPasswordSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputMember);
            }
        });

        it('createMemberWithTempPasswordSchema_EC_missingEmail_returnsValidationError', () => {
            // Arrange
            const {email, ...inputMember} = VALID_MEMBER_NO_PWD;

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_missingFullName_returnsValidationError', () => {
            // Arrange
            const {fullName, ...inputMember} = VALID_MEMBER_NO_PWD;

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_missingPhone_returnsValidationError', () => {
            // Arrange
            const {phone, ...inputMember} = VALID_MEMBER_NO_PWD;

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            // Arrange
            const {dateOfBirth, ...inputMember} = VALID_MEMBER_NO_PWD;

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_missingMembershipStart_returnsValidationError', () => {
            // Arrange
            const {membershipStart, ...inputMember} = VALID_MEMBER_NO_PWD;

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('membershipStart');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                email: 'no'
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                phone: '0712345678'
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                membershipStart: '01/01/2024'
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('membershipStart');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_passwordFieldIgnored_parsesSuccessfully', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                password: 'Any'
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect((result.data as any).password).toBeUndefined();
                expect(result.data.email).toBe(VALID_MEMBER_NO_PWD.email);
            }
        });

        it('createMemberWithTempPasswordSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: '         '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: '  Jane Doe Test  '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Jane Doe Test');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                email: '  jane.doe@example.com  '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('jane.doe@example.com');
            }
        });

        it('createMemberWithTempPasswordSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                phone: '  +40712345678  '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberWithTempPasswordSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' '.repeat(8)
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: yesterday
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('loginUserSchema', () => {
    describe('Equivalence Classes', () => {
        it('loginUserSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputLogin);
            }
        });

        it('loginUserSchema_EC_missingEmail_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                password: 'admin'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('loginUserSchema_EC_missingPassword_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                email: 'admin@gymtrackerpro.com'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('loginUserSchema_EC_emptyPassword_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: ''
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('loginUserSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                email: 'invalidemail.com'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('loginUserSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                email: '  admin@gymtrackerpro.com  '
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('admin@gymtrackerpro.com');
            }
        });

        it('loginUserSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: 'validpassword1!'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('loginUserSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: 'ValidPassword!'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('loginUserSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: 'ValidPassword1'
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('loginUserSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('loginUserSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputLogin.password);
            }
        });

        it('loginUserSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputLogin.password);
            }
        });

        it('loginUserSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputLogin.password);
            }
        });

        it('loginUserSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputLogin.password);
            }
        });

        it('loginUserSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputLogin = {
                ...VALID_LOGIN,
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = loginUserSchema.safeParse(inputLogin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });
    });
});

describe('createAdminSchema', () => {
    describe('Equivalence Classes', () => {
        it('createAdminSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputAdmin);
            }
        });

        it('createAdminSchema_EC_missingEmail_returnsValidationError', () => {
            // Arrange
            const {email, ...inputAdmin} = VALID_ADMIN;

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createAdminSchema_EC_missingFullName_returnsValidationError', () => {
            // Arrange
            const {fullName, ...inputAdmin} = VALID_ADMIN;

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_EC_missingPhone_returnsValidationError', () => {
            // Arrange
            const {phone, ...inputAdmin} = VALID_ADMIN;

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createAdminSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            // Arrange
            const {dateOfBirth, ...inputAdmin} = VALID_ADMIN;

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createAdminSchema_EC_missingPassword_returnsValidationError', () => {
            // Arrange
            const {password, ...inputAdmin} = VALID_ADMIN;

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                email: 'invalidemail.com'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('createAdminSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                phone: '0712345678'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('createAdminSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'secure1@pass'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'SecureP@ss'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'SecurePass1'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_EC_dateOfBirthInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: '15.01.1990'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createAdminSchema_EC_dateOfBirthInTheFuture_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: '2099-01-01'
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createAdminSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: '         '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: '  Admin User Test  '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Admin User Test');
            }
        });

        it('createAdminSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                email: '  admin@example.com  '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('admin@example.com');
            }
        });

        it('createAdminSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                phone: '  +40712345678  '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createAdminSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createAdminSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('createAdminSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('createAdminSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createAdminSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: ' '.repeat(8)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('createAdminSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('createAdminSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('createAdminSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputAdmin.password);
            }
        });

        it('createAdminSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputAdmin.password);
            }
        });

        it('createAdminSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputAdmin.password);
            }
        });

        it('createAdminSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputAdmin.password);
            }
        });

        it('createAdminSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('createAdminSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                dateOfBirth: yesterday
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('createAdminSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('createAdminSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = createAdminSchema.safeParse(inputAdmin);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('updateUserSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateUserSchema_EC_emptyObject_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {};

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateUserSchema_EC_validEmail_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                email: 'new@example.com'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('new@example.com');
            }
        });

        it('updateUserSchema_EC_validFullName_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'Updated Name Test'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Name Test');
            }
        });

        it('updateUserSchema_EC_validPhone_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                phone: '+40712345678'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });

        it('updateUserSchema_EC_validPassword_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'NewP@ss1'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe('NewP@ss1');
            }
        });

        it('updateUserSchema_EC_validDateOfBirth_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateUserInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateUserSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                email: 'bad-email'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('updateUserSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                phone: '0712345678'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('updateUserSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'secure1@pass'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateUserSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecureP@ss'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateUserSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecurePass1'
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateUserSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: '         '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateUserSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: '  Updated Name Test  '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Name Test');
            }
        });

        it('updateUserSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                email: '  new@example.com  '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('new@example.com');
            }
        });

        it('updateUserSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                phone: '  +40712345678  '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateUserSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateUserSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateUserSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('updateUserSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('updateUserSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateUserSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateUserSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: ' '.repeat(8)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateUserSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateUserSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateUserSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateUserSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateUserSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateUserSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateUserSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateUserSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateUserSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateUserSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateUserInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateUserSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('updateUserSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateUserInput = {
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = updateUserSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('updateMemberSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateMemberSchema_EC_emptyObject_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {};

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateMemberSchema_EC_validEmail_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                email: 'new@example.com'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('new@example.com');
            }
        });

        it('updateMemberSchema_EC_validFullName_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'Updated Name Test'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Name Test');
            }
        });

        it('updateMemberSchema_EC_validPhone_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                phone: '+40712345678'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });

        it('updateMemberSchema_EC_validPassword_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'NewP@ss1'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe('NewP@ss1');
            }
        });

        it('updateMemberSchema_EC_validDateOfBirth_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateMemberSchema_EC_validMembershipStart_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                membershipStart: '2024-06-01'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.membershipStart).toBe('2024-06-01');
            }
        });

        it('updateMemberSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                email: 'bad-email'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('updateMemberSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                phone: '0712345678'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('updateMemberSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'secure1@pass'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateMemberSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecureP@ss'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateMemberSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecurePass1'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateMemberSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                membershipStart: '01/01/2024'
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('membershipStart');
            }
        });

        it('updateMemberSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: '         '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateMemberSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: '  Updated Name Test  '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Name Test');
            }
        });

        it('updateMemberSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                email: '  new@example.com  '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('new@example.com');
            }
        });

        it('updateMemberSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                phone: '  +40712345678  '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMemberSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateMemberSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateMemberSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('updateMemberSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('updateMemberSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateMemberSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateMemberSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: ' '.repeat(8)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateMemberSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateMemberSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateMemberSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateMemberSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateMemberSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateMemberSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateMemberSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateMemberSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateMemberSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateMemberSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateMemberSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('updateMemberSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = updateMemberSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});

describe('updateAdminSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateAdminSchema_EC_emptyObject_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {};

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateAdminSchema_EC_validEmail_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                email: 'admin-new@example.com'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('admin-new@example.com');
            }
        });

        it('updateAdminSchema_EC_validFullName_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'Updated Admin Test'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Admin Test');
            }
        });

        it('updateAdminSchema_EC_validPhone_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                phone: '+40712345678'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });

        it('updateAdminSchema_EC_validPassword_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'NewP@ss1'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe('NewP@ss1');
            }
        });

        it('updateAdminSchema_EC_validDateOfBirth_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateAdminSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                email: 'not-valid'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('email');
            }
        });

        it('updateAdminSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                phone: 'invalid-phone'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('phone');
            }
        });

        it('updateAdminSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'secure1@pass'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateAdminSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecureP@ss'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateAdminSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                password: 'SecurePass1'
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateAdminSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: '         '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateAdminSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: '  Updated Admin Test  '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('Updated Admin Test');
            }
        });

        it('updateAdminSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                email: '  admin-new@example.com  '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('admin-new@example.com');
            }
        });

        it('updateAdminSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                phone: '  +40712345678  '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+40712345678');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateAdminSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(7)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateAdminSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(8)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateAdminSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(9)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(9));
            }
        });

        it('updateAdminSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(63)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(63));
            }
        });

        it('updateAdminSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(64)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateAdminSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(65)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateAdminSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                fullName: ' '.repeat(8)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateAdminSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(8));
            }
        });

        it('updateAdminSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.fullName).toBe('A'.repeat(64));
            }
        });

        it('updateAdminSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('fullName');
            }
        });

        it('updateAdminSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(4)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateAdminSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(5)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateAdminSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(6)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateAdminSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(60)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateAdminSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(61)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.password).toBe(inputUpdate.password);
            }
        });

        it('updateAdminSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(62)
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('password');
            }
        });

        it('updateAdminSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            // Arrange
            const yesterday = getYesterdayIso();
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: yesterday
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dateOfBirth).toBe(yesterday);
            }
        });

        it('updateAdminSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getTodayIso()
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });

        it('updateAdminSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            // Arrange
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getTomorrowIso()
            };

            // Act
            const result = updateAdminSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('dateOfBirth');
            }
        });
    });
});
