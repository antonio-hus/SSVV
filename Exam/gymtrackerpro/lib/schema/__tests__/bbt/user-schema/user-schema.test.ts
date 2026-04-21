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
    UpdateAdminInput,
} from '@/lib/schema/user-schema';

const VALID_MEMBER: CreateMemberInput = {
    email: 'john.doe@example.com',
    fullName: 'John Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1',
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
    password: 'AdminP@ss1',
};

const VALID_LOGIN: LoginUserInput = {
    email: 'admin@gymtrackerpro.com',
    password: 'admin',
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

describe('createMemberSchema', () => {
    describe('Equivalence Classes', () => {
        it('createMemberSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_EC_missingEmail_returnsValidationError', () => {
            const {email, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_missingFullName_returnsValidationError', () => {
            const {fullName, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_missingPhone_returnsValidationError', () => {
            const {phone, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            const {dateOfBirth, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_missingPassword_returnsValidationError', () => {
            const {password, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_missingMembershipStart_returnsValidationError', () => {
            const {membershipStart, ...inputMember} = VALID_MEMBER;

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                email: 'invalidemail.com'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                password: 'secure1@pass'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                password: 'SecureP@ss'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                password: 'SecurePass1'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                phone: '0712345678'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_dateOfBirthInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: '15-01-1990'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_dateOfBirthInTheFuture_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: '2099-01-01'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                membershipStart: '01/01/2024'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_membershipStartInTheFuture_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                membershipStart: '2099-01-01'
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                fullName: '         '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: '  John Doe Test  '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                email: '  john.doe@example.com  '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                phone: '  +40712345678  '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(7)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(8)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(9)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(63)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(64)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                fullName: 'A'.repeat(65)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                fullName: ' '.repeat(8)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(4)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(5)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(6)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(60)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(61)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                password: 'P1@' + 'a'.repeat(62)
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            const inputMember: CreateMemberInput = {
                ...VALID_MEMBER,
                dateOfBirth: getYesterdayIso()
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: getTodayIso()
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER,
                dateOfBirth: getTomorrowIso()
            };

            const result = createMemberSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });
    });
});

describe('createMemberWithTempPasswordSchema', () => {
    describe('Equivalence Classes', () => {
        it('createMemberWithTempPasswordSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_EC_missingEmail_returnsValidationError', () => {
            const {email, ...inputMember} = VALID_MEMBER_NO_PWD;

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_missingFullName_returnsValidationError', () => {
            const {fullName, ...inputMember} = VALID_MEMBER_NO_PWD;

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_missingPhone_returnsValidationError', () => {
            const {phone, ...inputMember} = VALID_MEMBER_NO_PWD;

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            const {dateOfBirth, ...inputMember} = VALID_MEMBER_NO_PWD;

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_missingMembershipStart_returnsValidationError', () => {
            const {membershipStart, ...inputMember} = VALID_MEMBER_NO_PWD;

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                email: 'no'
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                phone: '0712345678'
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                membershipStart: '01/01/2024'
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_passwordFieldIgnored_parsesSuccessfully', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                password: 'Any'
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
            expect((result.data as any).password).toBeUndefined();
        });

        it('createMemberWithTempPasswordSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: '         '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: '  Jane Doe Test  '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                email: '  jane.doe@example.com  '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                phone: '  +40712345678  '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createMemberWithTempPasswordSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(7)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(8)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(9)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(63)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(64)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: 'A'.repeat(65)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' '.repeat(8)
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            const inputMember: CreateMemberWithTempPasswordInput = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: getYesterdayIso()
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: getTodayIso()
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            const inputMember = {
                ...VALID_MEMBER_NO_PWD,
                dateOfBirth: getTomorrowIso()
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputMember);

            expect(result.success).toBe(false);
        });
    });
});

describe('loginUserSchema', () => {
    describe('Equivalence Classes', () => {
        it('loginUserSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(true);
        });

        it('loginUserSchema_EC_missingEmail_returnsValidationError', () => {
            const inputLogin = {
                password: 'admin'
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_EC_missingPassword_returnsValidationError', () => {
            const inputLogin = {
                email: 'admin@gymtrackerpro.com'
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_EC_emptyPassword_returnsValidationError', () => {
            const inputLogin = {
                ...VALID_LOGIN,
                password: ''
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputLogin = {
                ...VALID_LOGIN,
                email: 'invalidemail.com'
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                email: '  admin@gymtrackerpro.com  '
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('loginUserSchema_BVA_passwordLength0Chars_returnsValidationError', () => {
            const inputLogin = {
                ...VALID_LOGIN,
                password: ''
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_BVA_passwordLength1Char_parsesSuccessfully', () => {
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'a'
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(true);
        });

        it('loginUserSchema_BVA_passwordLength2Chars_parsesSuccessfully', () => {
            const inputLogin: LoginUserInput = {
                ...VALID_LOGIN,
                password: 'ab'
            };

            const result = loginUserSchema.safeParse(inputLogin);

            expect(result.success).toBe(true);
        });
    });
});

describe('createAdminSchema', () => {
    describe('Equivalence Classes', () => {
        it('createAdminSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_EC_missingEmail_returnsValidationError', () => {
            const {email, ...inputAdmin} = VALID_ADMIN;

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_missingFullName_returnsValidationError', () => {
            const {fullName, ...inputAdmin} = VALID_ADMIN;

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_missingPhone_returnsValidationError', () => {
            const {phone, ...inputAdmin} = VALID_ADMIN;

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_missingDateOfBirth_returnsValidationError', () => {
            const {dateOfBirth, ...inputAdmin} = VALID_ADMIN;

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_missingPassword_returnsValidationError', () => {
            const {password, ...inputAdmin} = VALID_ADMIN;

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                email: 'invalidemail.com'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                phone: '0712345678'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'secure1@pass'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'SecureP@ss'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'SecurePass1'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_dateOfBirthInvalidFormat_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: '15.01.1990'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_dateOfBirthInTheFuture_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: '2099-01-01'
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: '         '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: '  Admin User Test  '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                email: '  admin@example.com  '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                phone: '  +40712345678  '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createAdminSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(7)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(8)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(9)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(63)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(64)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: 'A'.repeat(65)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: ' '.repeat(8)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(4)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(5)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(6)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(60)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(61)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                password: 'P1@' + 'a'.repeat(62)
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            const inputAdmin: CreateAdminInput = {
                ...VALID_ADMIN,
                dateOfBirth: getYesterdayIso()
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: getTodayIso()
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            const inputAdmin = {
                ...VALID_ADMIN,
                dateOfBirth: getTomorrowIso()
            };

            const result = createAdminSchema.safeParse(inputAdmin);

            expect(result.success).toBe(false);
        });
    });
});

describe('updateMemberSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateMemberSchema_EC_emptyObject_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {};

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validEmail_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                email: 'new@example.com'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validFullName_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'Updated Name Test'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validPhone_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                phone: '+40712345678'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validPassword_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'NewP@ss1'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validDateOfBirth_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getYesterdayIso()
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_validMembershipStart_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                membershipStart: '2024-06-01'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputUpdate = {
                email: 'bad-email'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            const inputUpdate = {
                phone: '0712345678'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            const inputUpdate = {
                password: 'secure1@pass'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            const inputUpdate = {
                password: 'SecureP@ss'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            const inputUpdate = {
                password: 'SecurePass1'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_membershipStartInvalidFormat_returnsValidationError', () => {
            const inputUpdate = {
                membershipStart: '01/01/2024'
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            const inputUpdate = {
                fullName: '         '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: '  Updated Name Test  '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                email: '  new@example.com  '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                phone: '  +40712345678  '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateMemberSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(7)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(8)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(9)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(63)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(64)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: 'A'.repeat(65)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            const inputUpdate = {
                fullName: ' '.repeat(8)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(4)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(5)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(6)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(60)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(61)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                password: 'P1@' + 'a'.repeat(62)
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getYesterdayIso()
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getTodayIso()
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            const inputUpdate: UpdateMemberInput = {
                dateOfBirth: getTomorrowIso()
            };

            const result = updateMemberSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });
    });
});

describe('updateAdminSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateAdminSchema_EC_emptyObject_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {};

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_validEmail_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                email: 'admin-new@example.com'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_validFullName_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'Updated Admin Test'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_validPhone_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                phone: '+40712345678'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_validPassword_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'NewP@ss1'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_validDateOfBirth_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getYesterdayIso()
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_emailInvalidFormat_returnsValidationError', () => {
            const inputUpdate = {
                email: 'not-valid'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_phoneInvalidFormat_returnsValidationError', () => {
            const inputUpdate = {
                phone: 'invalid-phone'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_passwordMissingUppercase_returnsValidationError', () => {
            const inputUpdate = {
                password: 'secure1@pass'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_passwordMissingNumber_returnsValidationError', () => {
            const inputUpdate = {
                password: 'SecureP@ss'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_passwordMissingSpecialChar_returnsValidationError', () => {
            const inputUpdate = {
                password: 'SecurePass1'
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_fullNameWhitespaceOnly_returnsValidationError', () => {
            const inputUpdate = {
                fullName: '         '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_EC_fullNameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: '  Updated Admin Test  '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_emailWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                email: '  admin-new@example.com  '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_EC_phoneWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                phone: '  +40712345678  '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateAdminSchema_BVA_fullNameLength7Chars_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(7)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_fullNameLength8Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(8)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNameLength9Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(9)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNameLength63Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(63)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNameLength64Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(64)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNameLength65Chars_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: 'A'.repeat(65)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_fullNameWhitespace8Chars_returnsValidationError', () => {
            const inputUpdate = {
                fullName: ' '.repeat(8)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_fullNamePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(8) + ' '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNamePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(64) + ' '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_fullNamePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                fullName: ' ' + 'A'.repeat(65) + ' '
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_passwordLength7Chars_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(4)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_passwordLength8Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(5)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_passwordLength9Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(6)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_passwordLength63Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(60)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_passwordLength64Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(61)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_passwordLength65Chars_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                password: 'P1@' + 'a'.repeat(62)
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_dateOfBirthYesterday_parsesSuccessfully', () => {
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getYesterdayIso()
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_BVA_dateOfBirthToday_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getTodayIso()
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_BVA_dateOfBirthTomorrow_returnsValidationError', () => {
            const inputUpdate: UpdateAdminInput = {
                dateOfBirth: getTomorrowIso()
            };

            const result = updateAdminSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });
    });
});