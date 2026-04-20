import {
    createMemberSchema,
    createMemberWithTempPasswordSchema,
    createAdminSchema,
    updateMemberSchema,
    updateAdminSchema,
    loginUserSchema,
    CreateMemberInput,
    CreateMemberWithTempPasswordInput, CreateAdminInput, LoginUserInput,
} from '@/lib/schema/user-schema';

const VALID_MEMBER: CreateMemberInput = {
    email: 'john.doe@example.com',
    fullName: 'John Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1990-01-15',
    password: 'SecureP@ss1',
    membershipStart: '2024-01-01',
} as const;

const VALID_MEMBER_NO_PWD: CreateMemberWithTempPasswordInput = {
    email: 'jane.doe@example.com',
    fullName: 'Jane Doe Test',
    phone: '+40712345678',
    dateOfBirth: '1992-06-20',
    membershipStart: '2024-03-01',
} as const;

const VALID_ADMIN: CreateAdminInput = {
    email: 'admin@example.com',
    fullName: 'Admin User Test',
    phone: '+40712345678',
    dateOfBirth: '1985-06-20',
    password: 'AdminP@ss1',
} as const;

const VALID_LOGIN: LoginUserInput = {
    email: 'admin@gymtrackerpro.com',
    password: 'admin',
} as const;

describe('createMemberSchema', () => {
    it('createMemberSchema_allFieldsValid_parsesSuccessfully', () => {
        const inputValidMember = {...VALID_MEMBER};

        const result = createMemberSchema.safeParse(inputValidMember);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_fullNameAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinFullName = {...VALID_MEMBER, fullName: 'Ab1 De2F'};

        const result = createMemberSchema.safeParse(inputMinFullName);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_fullNameBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortFullName = {...VALID_MEMBER, fullName: 'Ab1De2F'};

        const result = createMemberSchema.safeParse(inputShortFullName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Full name must be at least 8 characters')).toBe(true);
    });

    it('createMemberSchema_fullNameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxFullName = {...VALID_MEMBER, fullName: 'A'.repeat(64)};

        const result = createMemberSchema.safeParse(inputMaxFullName);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_fullNameAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongFullName = {...VALID_MEMBER, fullName: 'A'.repeat(65)};

        const result = createMemberSchema.safeParse(inputLongFullName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Full name must be at most 64 characters')).toBe(true);
    });

    it('createMemberSchema_passwordAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinPassword = {...VALID_MEMBER, password: 'Pass1@aA'};

        const result = createMemberSchema.safeParse(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_passwordBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortPassword = {...VALID_MEMBER, password: 'Pas1@aA'};

        const result = createMemberSchema.safeParse(inputShortPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at least 8 characters')).toBe(true);
    });

    it('createMemberSchema_passwordAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxPassword = {...VALID_MEMBER, password: 'A1@' + 'a'.repeat(61)};

        const result = createMemberSchema.safeParse(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_passwordAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongPassword = {...VALID_MEMBER, password: 'A1@' + 'a'.repeat(62)};

        const result = createMemberSchema.safeParse(inputLongPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at most 64 characters')).toBe(true);
    });

    it('createMemberSchema_passwordMissingUppercase_returnsValidationError', () => {
        const inputNoUppercase = {...VALID_MEMBER, password: 'secure1@pass'};

        const result = createMemberSchema.safeParse(inputNoUppercase);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one uppercase character')).toBe(true);
    });

    it('createMemberSchema_passwordMissingNumber_returnsValidationError', () => {
        const inputNoNumber = {...VALID_MEMBER, password: 'SecureP@ss'};

        const result = createMemberSchema.safeParse(inputNoNumber);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one number')).toBe(true);
    });

    it('createMemberSchema_passwordMissingSpecialCharacter_returnsValidationError', () => {
        const inputNoSpecial = {...VALID_MEMBER, password: 'SecurePass1'};

        const result = createMemberSchema.safeParse(inputNoSpecial);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one special character')).toBe(true);
    });

    it('createMemberSchema_passwordAllConstraintsMet_parsesSuccessfully', () => {
        const inputComplexPassword = {...VALID_MEMBER, password: 'Complex1@pass'};

        const result = createMemberSchema.safeParse(inputComplexPassword);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_emailWithoutAtSymbol_returnsValidationError', () => {
        const inputNoAtEmail = {...VALID_MEMBER, email: 'invalidemail.com'};

        const result = createMemberSchema.safeParse(inputNoAtEmail);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Invalid email address')).toBe(true);
    });

    it('createMemberSchema_emailWithoutDomain_returnsValidationError', () => {
        const inputNoDomainEmail = {...VALID_MEMBER, email: 'user@'};

        const result = createMemberSchema.safeParse(inputNoDomainEmail);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Invalid email address')).toBe(true);
    });

    it('createMemberSchema_dateOfBirthInFuture_returnsValidationError', () => {
        const inputFutureDateOfBirth = {...VALID_MEMBER, dateOfBirth: '2099-12-31'};

        const result = createMemberSchema.safeParse(inputFutureDateOfBirth);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createMemberSchema_dateOfBirthWrongFormat_returnsValidationError', () => {
        const inputWrongFormatDateOfBirth = {...VALID_MEMBER, dateOfBirth: '15/01/1990'};

        const result = createMemberSchema.safeParse(inputWrongFormatDateOfBirth);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in YYYY-MM-DD format')).toBe(true);
    });

    it('createMemberSchema_phoneStartingWithZero_returnsValidationError', () => {
        const inputZeroPrefixPhone = {...VALID_MEMBER, phone: '0712345678'};

        const result = createMemberSchema.safeParse(inputZeroPrefixPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createMemberSchema_membershipStartWrongFormat_returnsValidationError', () => {
        const inputWrongFormatMembershipStart = {...VALID_MEMBER, membershipStart: '01-01-2024'};

        const result = createMemberSchema.safeParse(inputWrongFormatMembershipStart);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Membership start date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('createMemberSchema_missingEmail_returnsValidationError', () => {
        const {email, ...inputWithoutEmail} = VALID_MEMBER;

        const result = createMemberSchema.safeParse(inputWithoutEmail);

        expect(result.success).toBe(false);
    });

    it('createMemberSchema_dateOfBirthToday_returnsValidationError', () => {
        const today = new Date().toISOString().slice(0, 10);
        const inputTodayDateOfBirth = {...VALID_MEMBER, dateOfBirth: today};

        const result = createMemberSchema.safeParse(inputTodayDateOfBirth);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createMemberSchema_missingPhone_returnsValidationError', () => {
        const {phone, ...inputWithoutPhone} = VALID_MEMBER;

        const result = createMemberSchema.safeParse(inputWithoutPhone);

        expect(result.success).toBe(false);
    });

    it('createMemberSchema_missingPassword_returnsValidationError', () => {
        const {password, ...inputWithoutPassword} = VALID_MEMBER;

        const result = createMemberSchema.safeParse(inputWithoutPassword);

        expect(result.success).toBe(false);
    });

    it('createMemberSchema_missingDateOfBirth_returnsValidationError', () => {
        const {dateOfBirth, ...inputWithoutDateOfBirth} = VALID_MEMBER;

        const result = createMemberSchema.safeParse(inputWithoutDateOfBirth);

        expect(result.success).toBe(false);
    });

    it('createMemberSchema_missingMembershipStart_returnsValidationError', () => {
        const {membershipStart, ...inputWithoutMembershipStart} = VALID_MEMBER;

        const result = createMemberSchema.safeParse(inputWithoutMembershipStart);

        expect(result.success).toBe(false);
    });

    it('createMemberSchema_dateOfBirthYesterday_parsesSuccessfully', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const inputYesterdayDateOfBirth = {...VALID_MEMBER, dateOfBirth: yesterday.toISOString().slice(0, 10)};

        const result = createMemberSchema.safeParse(inputYesterdayDateOfBirth);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_phoneMinLength2Digits_parsesSuccessfully', () => {
        const inputMinPhone = {...VALID_MEMBER, phone: '12'};

        const result = createMemberSchema.safeParse(inputMinPhone);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_phoneMaxLength15Digits_parsesSuccessfully', () => {
        const inputMaxPhone = {...VALID_MEMBER, phone: '+123456789012345'};

        const result = createMemberSchema.safeParse(inputMaxPhone);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_phoneBelowMinLength1Digit_returnsValidationError', () => {
        const inputTooShortPhone = {...VALID_MEMBER, phone: '1'};

        const result = createMemberSchema.safeParse(inputTooShortPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createMemberSchema_phoneAboveMaxLength16Digits_returnsValidationError', () => {
        const inputTooLongPhone = {...VALID_MEMBER, phone: '+1234567890123456'};

        const result = createMemberSchema.safeParse(inputTooLongPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createMemberSchema_fullNameExactly9Chars_parsesSuccessfully', () => {
        const inputFullName9 = {...VALID_MEMBER, fullName: 'Ab1 De2Fg'};

        const result = createMemberSchema.safeParse(inputFullName9);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_fullNameExactly63Chars_parsesSuccessfully', () => {
        const inputFullName63 = {...VALID_MEMBER, fullName: 'A'.repeat(63)};

        const result = createMemberSchema.safeParse(inputFullName63);

        expect(result.success).toBe(true);
    });

    it('createMemberSchema_dateOfBirthTomorrow_returnsValidationError', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const inputTomorrowDateOfBirth = {...VALID_MEMBER, dateOfBirth: tomorrow.toISOString().slice(0, 10)};

        const result = createMemberSchema.safeParse(inputTomorrowDateOfBirth);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createMemberSchema_membershipStartWithNoSeparators_returnsValidationError', () => {
        const inputNoSeparatorsMembershipStart = {...VALID_MEMBER, membershipStart: '20240101'};

        const result = createMemberSchema.safeParse(inputNoSeparatorsMembershipStart);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Membership start date must be in YYYY-MM-DD format')).toBe(true);
    });
});

describe('createMemberWithTempPasswordSchema', () => {
    it('createMemberWithTempPasswordSchema_allValidFields_parsesSuccessfully', () => {
        const inputValidMember = {...VALID_MEMBER_NO_PWD};

        const result = createMemberWithTempPasswordSchema.safeParse(inputValidMember);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_fullName8Chars_parsesSuccessfully', () => {
        const inputMinFullName = {...VALID_MEMBER_NO_PWD, fullName: 'Ab1 De2F'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputMinFullName);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_fullName7Chars_returnsValidationError', () => {
        const inputShortFullName = {...VALID_MEMBER_NO_PWD, fullName: 'Ab1De2F'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputShortFullName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Full name must be at least 8 characters')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_invalidEmail_returnsValidationError', () => {
        const inputInvalidEmail = {...VALID_MEMBER_NO_PWD, email: 'not-an-email'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputInvalidEmail);

        expect(result.success).toBe(false);
    });

    it('createMemberWithTempPasswordSchema_dateOfBirthInFuture_returnsValidationError', () => {
        const inputFutureDateOfBirth = {...VALID_MEMBER_NO_PWD, dateOfBirth: '2090-01-01'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputFutureDateOfBirth);

        expect(result.success).toBe(false);
    });

    it('createMemberWithTempPasswordSchema_invalidPhone_returnsValidationError', () => {
        const inputSpacedPhone = {...VALID_MEMBER_NO_PWD, phone: '+44 20 1234 5678'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputSpacedPhone);

        expect(result.success).toBe(false);
    });

    it('createMemberWithTempPasswordSchema_membershipStartWrongFormat_returnsValidationError', () => {
        const inputSlashMembershipStart = {...VALID_MEMBER_NO_PWD, membershipStart: '2024/01/01'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputSlashMembershipStart);

        expect(result.success).toBe(false);
    });

    it('createMemberWithTempPasswordSchema_passwordFieldIgnored_parsesSuccessfully', () => {
        const inputWithExtraPassword = {...VALID_MEMBER_NO_PWD, password: 'SomePass1!'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputWithExtraPassword);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_passwordFieldStrippedFromOutput_doesNotAppearInParsedData', () => {
        const inputWithExtraPassword = {...VALID_MEMBER_NO_PWD, password: 'SomePass1!'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputWithExtraPassword);

        expect(result.success).toBe(true);
        expect((result.data as Record<string, unknown>).password).toBeUndefined();
    });

    it('createMemberWithTempPasswordSchema_fullNameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxFullName = {...VALID_MEMBER_NO_PWD, fullName: 'B'.repeat(64)};

        const result = createMemberWithTempPasswordSchema.safeParse(inputMaxFullName);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_fullNameAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongFullName = {...VALID_MEMBER_NO_PWD, fullName: 'B'.repeat(65)};

        const result = createMemberWithTempPasswordSchema.safeParse(inputLongFullName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Full name must be at most 64 characters')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_dateOfBirthYesterday_parsesSuccessfully', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const inputYesterdayDob = {...VALID_MEMBER_NO_PWD, dateOfBirth: yesterday.toISOString().slice(0, 10)};

        const result = createMemberWithTempPasswordSchema.safeParse(inputYesterdayDob);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_phoneMinLength2Digits_parsesSuccessfully', () => {
        const inputMinPhone = {...VALID_MEMBER_NO_PWD, phone: '12'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputMinPhone);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_phoneMaxLength15Digits_parsesSuccessfully', () => {
        const inputMaxPhone = {...VALID_MEMBER_NO_PWD, phone: '+123456789012345'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputMaxPhone);

        expect(result.success).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_phoneBelowMinLength1Digit_returnsValidationError', () => {
        const inputTooShortPhone = {...VALID_MEMBER_NO_PWD, phone: '1'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputTooShortPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_phoneAboveMaxLength16Digits_returnsValidationError', () => {
        const inputTooLongPhone = {...VALID_MEMBER_NO_PWD, phone: '+1234567890123456'};

        const result = createMemberWithTempPasswordSchema.safeParse(inputTooLongPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_dateOfBirthToday_returnsValidationError', () => {
        const today = new Date().toISOString().slice(0, 10);
        const inputTodayDob = {...VALID_MEMBER_NO_PWD, dateOfBirth: today};

        const result = createMemberWithTempPasswordSchema.safeParse(inputTodayDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_dateOfBirthTomorrow_returnsValidationError', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const inputTomorrowDob = {...VALID_MEMBER_NO_PWD, dateOfBirth: tomorrow.toISOString().slice(0, 10)};

        const result = createMemberWithTempPasswordSchema.safeParse(inputTomorrowDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createMemberWithTempPasswordSchema_fullNameExactly63Chars_parsesSuccessfully', () => {
        const inputFullName63 = {...VALID_MEMBER_NO_PWD, fullName: 'B'.repeat(63)};

        const result = createMemberWithTempPasswordSchema.safeParse(inputFullName63);

        expect(result.success).toBe(true);
    });
});

describe('loginUserSchema', () => {
    it('loginUserSchema_validEmailAndPassword_parsesSuccessfully', () => {
        const inputValidLogin = {...VALID_LOGIN};

        const result = loginUserSchema.safeParse(inputValidLogin);

        expect(result.success).toBe(true);
    });

    it('loginUserSchema_invalidEmailFormat_returnsValidationError', () => {
        const inputInvalidEmail = {...VALID_LOGIN, email: 'notanemail'};

        const result = loginUserSchema.safeParse(inputInvalidEmail);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Invalid email address')).toBe(true);
    });

    it('loginUserSchema_emptyPassword_returnsValidationError', () => {
        const inputEmptyPassword = {...VALID_LOGIN, password: ''};

        const result = loginUserSchema.safeParse(inputEmptyPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password is required')).toBe(true);
    });

    it('loginUserSchema_missingEmail_returnsValidationError', () => {
        const inputWithoutEmail = {password: 'somePassword'};

        const result = loginUserSchema.safeParse(inputWithoutEmail);

        expect(result.success).toBe(false);
    });

    it('loginUserSchema_missingPassword_returnsValidationError', () => {
        const inputWithoutPassword = {email: 'admin@gymtrackerpro.com'};

        const result = loginUserSchema.safeParse(inputWithoutPassword);

        expect(result.success).toBe(false);
    });

    it('loginUserSchema_emptyEmail_returnsValidationError', () => {
        const inputEmptyEmail = {...VALID_LOGIN, email: ''};

        const result = loginUserSchema.safeParse(inputEmptyEmail);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Invalid email address')).toBe(true);
    });

    it('loginUserSchema_passwordAtLowerBoundary1Char_parsesSuccessfully', () => {
        const inputMinPassword = {...VALID_LOGIN, password: 'a'};

        const result = loginUserSchema.safeParse(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('loginUserSchema_passwordLongString_parsesSuccessfully', () => {
        const inputLongPassword = {...VALID_LOGIN, password: 'a'.repeat(100)};

        const result = loginUserSchema.safeParse(inputLongPassword);

        expect(result.success).toBe(true);
    });
});

describe('createAdminSchema', () => {
    it('createAdminSchema_allFieldsValid_parsesSuccessfully', () => {
        const inputValidAdmin = {...VALID_ADMIN};

        const result = createAdminSchema.safeParse(inputValidAdmin);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_fullName8Chars_parsesSuccessfully', () => {
        const inputMinFullName = {...VALID_ADMIN, fullName: 'AdminAcc'};

        const result = createAdminSchema.safeParse(inputMinFullName);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_fullName7Chars_returnsValidationError', () => {
        const inputShortFullName = {...VALID_ADMIN, fullName: 'Admin1A'};

        const result = createAdminSchema.safeParse(inputShortFullName);

        expect(result.success).toBe(false);
    });

    it('createAdminSchema_fullName64Chars_parsesSuccessfully', () => {
        const inputMaxFullName = {...VALID_ADMIN, fullName: 'B'.repeat(64)};

        const result = createAdminSchema.safeParse(inputMaxFullName);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_fullName65Chars_returnsValidationError', () => {
        const inputLongFullName = {...VALID_ADMIN, fullName: 'B'.repeat(65)};

        const result = createAdminSchema.safeParse(inputLongFullName);

        expect(result.success).toBe(false);
    });

    it('createAdminSchema_invalidEmail_returnsValidationError', () => {
        const inputInvalidEmail = {...VALID_ADMIN, email: 'no-at-sign'};

        const result = createAdminSchema.safeParse(inputInvalidEmail);

        expect(result.success).toBe(false);
    });

    it('createAdminSchema_dateOfBirthInFuture_returnsValidationError', () => {
        const inputFutureDateOfBirth = {...VALID_ADMIN, dateOfBirth: '2099-01-01'};

        const result = createAdminSchema.safeParse(inputFutureDateOfBirth);

        expect(result.success).toBe(false);
    });

    it('createAdminSchema_passwordAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinPassword = {...VALID_ADMIN, password: 'Pass1@aA'};

        const result = createAdminSchema.safeParse(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_passwordBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortPassword = {...VALID_ADMIN, password: 'Pas1@aA'};

        const result = createAdminSchema.safeParse(inputShortPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at least 8 characters')).toBe(true);
    });

    it('createAdminSchema_passwordAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxPassword = {...VALID_ADMIN, password: 'A1@' + 'a'.repeat(61)};

        const result = createAdminSchema.safeParse(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_passwordAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongPassword = {...VALID_ADMIN, password: 'A1@' + 'a'.repeat(62)};

        const result = createAdminSchema.safeParse(inputLongPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at most 64 characters')).toBe(true);
    });

    it('createAdminSchema_passwordMissingUppercase_returnsValidationError', () => {
        const inputNoUppercase = {...VALID_ADMIN, password: 'adminp@ss1'};

        const result = createAdminSchema.safeParse(inputNoUppercase);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one uppercase character')).toBe(true);
    });

    it('createAdminSchema_passwordMissingNumber_returnsValidationError', () => {
        const inputNoNumber = {...VALID_ADMIN, password: 'AdminP@ss'};

        const result = createAdminSchema.safeParse(inputNoNumber);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one number')).toBe(true);
    });

    it('createAdminSchema_passwordMissingSpecialCharacter_returnsValidationError', () => {
        const inputNoSpecial = {...VALID_ADMIN, password: 'AdminPass1'};

        const result = createAdminSchema.safeParse(inputNoSpecial);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one special character')).toBe(true);
    });

    it('createAdminSchema_dateOfBirthYesterday_parsesSuccessfully', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const inputYesterdayDob = {...VALID_ADMIN, dateOfBirth: yesterday.toISOString().slice(0, 10)};

        const result = createAdminSchema.safeParse(inputYesterdayDob);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_phoneMinLength2Digits_parsesSuccessfully', () => {
        const inputMinPhone = {...VALID_ADMIN, phone: '12'};

        const result = createAdminSchema.safeParse(inputMinPhone);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_phoneMaxLength15Digits_parsesSuccessfully', () => {
        const inputMaxPhone = {...VALID_ADMIN, phone: '+123456789012345'};

        const result = createAdminSchema.safeParse(inputMaxPhone);

        expect(result.success).toBe(true);
    });

    it('createAdminSchema_phoneBelowMinLength1Digit_returnsValidationError', () => {
        const inputTooShortPhone = {...VALID_ADMIN, phone: '1'};

        const result = createAdminSchema.safeParse(inputTooShortPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createAdminSchema_phoneAboveMaxLength16Digits_returnsValidationError', () => {
        const inputTooLongPhone = {...VALID_ADMIN, phone: '+1234567890123456'};

        const result = createAdminSchema.safeParse(inputTooLongPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('createAdminSchema_dateOfBirthToday_returnsValidationError', () => {
        const today = new Date().toISOString().slice(0, 10);
        const inputTodayDob = {...VALID_ADMIN, dateOfBirth: today};

        const result = createAdminSchema.safeParse(inputTodayDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('createAdminSchema_dateOfBirthTomorrow_returnsValidationError', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const inputTomorrowDob = {...VALID_ADMIN, dateOfBirth: tomorrow.toISOString().slice(0, 10)};

        const result = createAdminSchema.safeParse(inputTomorrowDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });
});

describe('updateMemberSchema', () => {
    it('updateMemberSchema_emptyObject_parsesSuccessfully', () => {
        const inputEmpty = {};

        const result = updateMemberSchema.safeParse(inputEmpty);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_validEmailOnly_parsesSuccessfully', () => {
        const inputEmail = {email: 'updated@example.com'};

        const result = updateMemberSchema.safeParse(inputEmail);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_validFullNameOnly_parsesSuccessfully', () => {
        const inputFullName = {fullName: 'Updated Full Name'};

        const result = updateMemberSchema.safeParse(inputFullName);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_fullNameBelowMinimum7Chars_returnsValidationError', () => {
        const inputShortFullName = {fullName: 'Short1A'};

        const result = updateMemberSchema.safeParse(inputShortFullName);

        expect(result.success).toBe(false);
    });

    it('updateMemberSchema_fullNameAboveMaximum65Chars_returnsValidationError', () => {
        const inputLongFullName = {fullName: 'C'.repeat(65)};

        const result = updateMemberSchema.safeParse(inputLongFullName);

        expect(result.success).toBe(false);
    });

    it('updateMemberSchema_invalidEmail_returnsValidationError', () => {
        const inputInvalidEmail = {email: 'bad-email'};

        const result = updateMemberSchema.safeParse(inputInvalidEmail);

        expect(result.success).toBe(false);
    });

    it('updateMemberSchema_invalidPhone_returnsValidationError', () => {
        const inputInvalidPhone = {phone: '00-invalid'};

        const result = updateMemberSchema.safeParse(inputInvalidPhone);

        expect(result.success).toBe(false);
    });

    it('updateMemberSchema_membershipStartWrongFormat_returnsValidationError', () => {
        const inputSlashMembershipStart = {membershipStart: '01/01/2024'};

        const result = updateMemberSchema.safeParse(inputSlashMembershipStart);

        expect(result.success).toBe(false);
    });

    it('updateMemberSchema_validPhone_parsesSuccessfully', () => {
        const inputPhone = {phone: '+40712345678'};

        const result = updateMemberSchema.safeParse(inputPhone);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_validMembershipStart_parsesSuccessfully', () => {
        const inputMembershipStart = {membershipStart: '2024-01-01'};

        const result = updateMemberSchema.safeParse(inputMembershipStart);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_dateOfBirthToday_returnsValidationError', () => {
        const today = new Date().toISOString().slice(0, 10);
        const inputTodayDateOfBirth = {dateOfBirth: today};

        const result = updateMemberSchema.safeParse(inputTodayDateOfBirth);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('updateMemberSchema_passwordAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinPassword = {password: 'Pass1@aA'};

        const result = updateMemberSchema.safeParse(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_passwordBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortPassword = {password: 'Pas1@aA'};

        const result = updateMemberSchema.safeParse(inputShortPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at least 8 characters')).toBe(true);
    });

    it('updateMemberSchema_passwordAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxPassword = {password: 'A1@' + 'a'.repeat(61)};

        const result = updateMemberSchema.safeParse(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_passwordAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongPassword = {password: 'A1@' + 'a'.repeat(62)};

        const result = updateMemberSchema.safeParse(inputLongPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at most 64 characters')).toBe(true);
    });

    it('updateMemberSchema_passwordMissingUppercase_returnsValidationError', () => {
        const inputNoUppercase = {password: 'newpass1@'};

        const result = updateMemberSchema.safeParse(inputNoUppercase);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one uppercase character')).toBe(true);
    });

    it('updateMemberSchema_passwordMissingNumber_returnsValidationError', () => {
        const inputNoNumber = {password: 'NewPass@!'};

        const result = updateMemberSchema.safeParse(inputNoNumber);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one number')).toBe(true);
    });

    it('updateMemberSchema_passwordMissingSpecialCharacter_returnsValidationError', () => {
        const inputNoSpecial = {password: 'NewPass1A'};

        const result = updateMemberSchema.safeParse(inputNoSpecial);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one special character')).toBe(true);
    });

    it('updateMemberSchema_validPassword_parsesSuccessfully', () => {
        const inputPassword = {password: 'NewPass1!'};

        const result = updateMemberSchema.safeParse(inputPassword);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_dateOfBirthYesterday_parsesSuccessfully', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const inputYesterdayDob = {dateOfBirth: yesterday.toISOString().slice(0, 10)};

        const result = updateMemberSchema.safeParse(inputYesterdayDob);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_fullNameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxFullName = {fullName: 'C'.repeat(64)};

        const result = updateMemberSchema.safeParse(inputMaxFullName);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_fullNameAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinFullName = {fullName: 'Ab1 De2F'};

        const result = updateMemberSchema.safeParse(inputMinFullName);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_phoneMinLength2Digits_parsesSuccessfully', () => {
        const inputMinPhone = {phone: '12'};

        const result = updateMemberSchema.safeParse(inputMinPhone);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_phoneMaxLength15Digits_parsesSuccessfully', () => {
        const inputMaxPhone = {phone: '+123456789012345'};

        const result = updateMemberSchema.safeParse(inputMaxPhone);

        expect(result.success).toBe(true);
    });

    it('updateMemberSchema_phoneBelowMinLength1Digit_returnsValidationError', () => {
        const inputTooShortPhone = {phone: '1'};

        const result = updateMemberSchema.safeParse(inputTooShortPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('updateMemberSchema_phoneAboveMaxLength16Digits_returnsValidationError', () => {
        const inputTooLongPhone = {phone: '+1234567890123456'};

        const result = updateMemberSchema.safeParse(inputTooLongPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('updateMemberSchema_dateOfBirthTomorrow_returnsValidationError', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const inputTomorrowDob = {dateOfBirth: tomorrow.toISOString().slice(0, 10)};

        const result = updateMemberSchema.safeParse(inputTomorrowDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('updateMemberSchema_membershipStartNoSeparators_returnsValidationError', () => {
        const inputNoSeparators = {membershipStart: '20240101'};

        const result = updateMemberSchema.safeParse(inputNoSeparators);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Membership start date must be in YYYY-MM-DD format')).toBe(true);
    });
});

describe('updateAdminSchema', () => {
    it('updateAdminSchema_emptyObject_parsesSuccessfully', () => {
        const inputEmpty = {};

        const result = updateAdminSchema.safeParse(inputEmpty);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_validEmailProvided_parsesSuccessfully', () => {
        const inputEmail = {email: 'new-admin@example.com'};

        const result = updateAdminSchema.safeParse(inputEmail);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_invalidEmail_returnsValidationError', () => {
        const inputInvalidEmail = {email: 'not-valid'};

        const result = updateAdminSchema.safeParse(inputInvalidEmail);

        expect(result.success).toBe(false);
    });

    it('updateAdminSchema_fullNameBelowMinimum_returnsValidationError', () => {
        const inputShortFullName = {fullName: 'Short'};

        const result = updateAdminSchema.safeParse(inputShortFullName);

        expect(result.success).toBe(false);
    });

    it('updateAdminSchema_invalidPhone_returnsValidationError', () => {
        const inputInvalidPhone = {phone: 'invalid-phone'};

        const result = updateAdminSchema.safeParse(inputInvalidPhone);

        expect(result.success).toBe(false);
    });

    it('updateAdminSchema_validFullName_parsesSuccessfully', () => {
        const inputFullName = {fullName: 'Updated Admin Name'};

        const result = updateAdminSchema.safeParse(inputFullName);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_validPhone_parsesSuccessfully', () => {
        const inputPhone = {phone: '+40712345678'};

        const result = updateAdminSchema.safeParse(inputPhone);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_dateOfBirthToday_returnsValidationError', () => {
        const today = new Date().toISOString().slice(0, 10);
        const inputTodayDateOfBirth = {dateOfBirth: today};

        const result = updateAdminSchema.safeParse(inputTodayDateOfBirth);

        expect(result.success).toBe(false);
    });

    it('updateAdminSchema_passwordAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinPassword = {password: 'Pass1@aA'};

        const result = updateAdminSchema.safeParse(inputMinPassword);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_passwordBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortPassword = {password: 'Pas1@aA'};

        const result = updateAdminSchema.safeParse(inputShortPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at least 8 characters')).toBe(true);
    });

    it('updateAdminSchema_passwordAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxPassword = {password: 'A1@' + 'a'.repeat(61)};

        const result = updateAdminSchema.safeParse(inputMaxPassword);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_passwordAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongPassword = {password: 'A1@' + 'a'.repeat(62)};

        const result = updateAdminSchema.safeParse(inputLongPassword);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must be at most 64 characters')).toBe(true);
    });

    it('updateAdminSchema_passwordMissingUppercase_returnsValidationError', () => {
        const inputNoUppercase = {password: 'adminp@ss1'};

        const result = updateAdminSchema.safeParse(inputNoUppercase);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one uppercase character')).toBe(true);
    });

    it('updateAdminSchema_passwordMissingNumber_returnsValidationError', () => {
        const inputNoNumber = {password: 'AdminP@ss'};

        const result = updateAdminSchema.safeParse(inputNoNumber);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one number')).toBe(true);
    });

    it('updateAdminSchema_passwordMissingSpecialCharacter_returnsValidationError', () => {
        const inputNoSpecial = {password: 'AdminPass1'};

        const result = updateAdminSchema.safeParse(inputNoSpecial);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Password must contain at least one special character')).toBe(true);
    });

    it('updateAdminSchema_validPassword_parsesSuccessfully', () => {
        const inputPassword = {password: 'NewAdminP@ss1'};

        const result = updateAdminSchema.safeParse(inputPassword);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_fullNameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxFullName = {fullName: 'D'.repeat(64)};

        const result = updateAdminSchema.safeParse(inputMaxFullName);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_fullNameAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongFullName = {fullName: 'D'.repeat(65)};

        const result = updateAdminSchema.safeParse(inputLongFullName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Full name must be at most 64 characters')).toBe(true);
    });

    it('updateAdminSchema_dateOfBirthYesterday_parsesSuccessfully', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const inputYesterdayDob = {dateOfBirth: yesterday.toISOString().slice(0, 10)};

        const result = updateAdminSchema.safeParse(inputYesterdayDob);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_phoneMinLength2Digits_parsesSuccessfully', () => {
        const inputMinPhone = {phone: '12'};

        const result = updateAdminSchema.safeParse(inputMinPhone);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_phoneMaxLength15Digits_parsesSuccessfully', () => {
        const inputMaxPhone = {phone: '+123456789012345'};

        const result = updateAdminSchema.safeParse(inputMaxPhone);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_fullNameAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinFullName = {fullName: 'AdminAcc'};

        const result = updateAdminSchema.safeParse(inputMinFullName);

        expect(result.success).toBe(true);
    });

    it('updateAdminSchema_dateOfBirthTomorrow_returnsValidationError', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const inputTomorrowDob = {dateOfBirth: tomorrow.toISOString().slice(0, 10)};

        const result = updateAdminSchema.safeParse(inputTomorrowDob);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date of birth must be in the past')).toBe(true);
    });

    it('updateAdminSchema_phoneBelowMinLength1Digit_returnsValidationError', () => {
        const inputTooShortPhone = {phone: '1'};

        const result = updateAdminSchema.safeParse(inputTooShortPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });

    it('updateAdminSchema_phoneAboveMaxLength16Digits_returnsValidationError', () => {
        const inputTooLongPhone = {phone: '+1234567890123456'};

        const result = updateAdminSchema.safeParse(inputTooLongPhone);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Phone number format is incorrect')).toBe(true);
    });
});