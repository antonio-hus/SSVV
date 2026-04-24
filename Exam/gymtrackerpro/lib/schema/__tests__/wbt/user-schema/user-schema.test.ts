import {
    createMemberSchema,
    updateMemberSchema,
    CreateMemberInput,
    UpdateMemberInput,
    createUserSchema,
    updateUserSchema,
    loginUserSchema,
    createMemberWithTempPasswordSchema,
    createAdminSchema,
    updateAdminSchema,
    CreateUserInput,
    UpdateUserInput,
    LoginUserInput,
    CreateMemberWithTempPasswordInput,
    CreateAdminInput,
    UpdateAdminInput
} from '@/lib/schema/user-schema';

describe('createMemberSchema', () => {

    describe('Independent Paths', () => {

        it('createMemberSchema_Path1_allFieldsValid_returnsSuccess', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createMemberSchema_Path2_emailNotString_returnsError', () => {
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path3_emailInvalidFormat_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path4_fullNameNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path5_fullNameTooShort_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path6_fullNameTooLong_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path7_phoneNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path8_phoneInvalidFormat_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path9_dateOfBirthNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path10_dateOfBirthInvalidFormat_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path11_dateOfBirthNotInPast_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path12_passwordNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 123,
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path13_passwordTooShort_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Short1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path14_passwordTooLong_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'A'.repeat(65),
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path15_passwordNoUppercase_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'lowercase1!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path16_passwordNoDigit_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase!',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path17_passwordNoSpecial_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase1',
                membershipStart: '2026-01-01',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path18_membershipStartNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: 123,
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path19_membershipStartInvalidFormat_returnsError', () => {
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '01-01-2026',
            };

            const result = createMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

    });

});

describe('updateMemberSchema', () => {

    describe('Independent Paths', () => {

        it('updateMemberSchema_Path1_allFieldsValid_returnsSuccess', () => {
            const inputData: UpdateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path2_emptyObject_returnsSuccess', () => {
            const inputData: UpdateMemberInput = {};

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path3_emailNotString_returnsError', () => {
            const inputData: any = { email: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path4_emailInvalidFormat_returnsError', () => {
            const inputData: UpdateMemberInput = { email: 'bad' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path5_nameNotString_returnsError', () => {
            const inputData: any = { fullName: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path6_nameTooShort_returnsError', () => {
            const inputData: UpdateMemberInput = { fullName: 'Short' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path7_nameTooLong_returnsError', () => {
            const inputData: UpdateMemberInput = { fullName: 'A'.repeat(65) };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path8_phoneNotString_returnsError', () => {
            const inputData: any = { phone: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path9_phoneInvalidFormat_returnsError', () => {
            const inputData: UpdateMemberInput = { phone: 'abc' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path10_DOBNotString_returnsError', () => {
            const inputData: any = { dateOfBirth: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path11_DOBInvalidFormat_returnsError', () => {
            const inputData: UpdateMemberInput = { dateOfBirth: '01-01' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path12_DOBNotInPast_returnsError', () => {
            const inputData: UpdateMemberInput = { dateOfBirth: '2099-01-01' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path13_pwdNotString_returnsError', () => {
            const inputData: any = { password: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path14_pwdTooShort_returnsError', () => {
            const inputData: UpdateMemberInput = { password: 'S' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path15_pwdTooLong_returnsError', () => {
            const inputData: UpdateMemberInput = { password: 'A'.repeat(65) };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path16_pwdNoUpper_returnsError', () => {
            const inputData: UpdateMemberInput = { password: 'low1!' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path17_pwdNoDigit_returnsError', () => {
            const inputData: UpdateMemberInput = { password: 'UP!' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path18_pwdNoSpecial_returnsError', () => {
            const inputData: UpdateMemberInput = { password: 'UP1' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path19_mStartNotString_returnsError', () => {
            const inputData: any = { membershipStart: 123 };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path20_mStartInvalidFormat_returnsError', () => {
            const inputData: UpdateMemberInput = { membershipStart: 'bad' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path21_emailOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { email: 'test@example.com' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path22_nameOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { fullName: 'John Doe Junior' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path23_phoneOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { phone: '+1234567890' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path24_DOBOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { dateOfBirth: '1990-01-01' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path25_pwdOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { password: 'Password1!' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path26_mStartOnly_returnsSuccess', () => {
            const inputData: UpdateMemberInput = { membershipStart: '2026-01-01' };

            const result = updateMemberSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

    });

});

describe('loginUserSchema', () => {

    describe('Independent Paths', () => {

        it('loginUserSchema_Path1_valid_returnsSuccess', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Password1!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('loginUserSchema_Path2_emailNotString_returnsError', () => {
            const inputData: any = {
                email: 123,
                password: 'Password1!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path3_emailInvalid_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'invalid-email',
                password: 'Password1!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path4_pwdNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                password: 123,
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path5_pwdTooShort_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Short1!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path6_pwdTooLong_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'A'.repeat(65),
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path7_pwdNoUpper_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'lowercase1!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path8_pwdNoDigit_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Uppercase!',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path9_pwdNoSpecial_returnsError', () => {
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Uppercase1',
            };

            const result = loginUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

    });

});

describe('createMemberWithTempPasswordSchema', () => {

    describe('Independent Paths', () => {

        it('createMemberWithTempPasswordSchema_Path1_valid_returnsSuccess', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_Path2_emailNotString_returnsError', () => {
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path3_emailInvalid_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path4_nameNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path5_nameTooShort_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path6_nameTooLong_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path7_phoneNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path8_phoneInvalid_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path9_DOBNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path10_DOBInvalid_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path11_DOBNotInPast_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                membershipStart: '2026-01-01',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path12_mStartNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: 123,
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path13_mStartInvalid_returnsError', () => {
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '01-01-2026',
            };

            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

    });

});

describe('createUserSchema', () => {

    describe('Independent Paths', () => {

        it('createUserSchema_Path1_valid_returnsSuccess', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createUserSchema_Path2_emailNotString_returnsError', () => {
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path3_emailInvalid_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path4_nameNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path5_nameTooShort_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path6_nameTooLong_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path7_phoneNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path8_phoneInvalid_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path9_DOBNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path10_DOBInvalid_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path11_DOBNotInPast_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path12_pwdNotString_returnsError', () => {
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 123,
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path13_pwdTooShort_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Short1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path14_pwdTooLong_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'A'.repeat(65),
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path15_pwdNoUpper_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'lowercase1!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path16_pwdNoDigit_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase!',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path17_pwdNoSpecial_returnsError', () => {
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase1',
            };

            const result = createUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

    });

});

describe('updateUserSchema', () => {

    describe('Independent Paths', () => {

        it('updateUserSchema_Path1_allValid_returnsSuccess', () => {
            const inputData: UpdateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path2_empty_returnsSuccess', () => {
            const inputData: UpdateUserInput = {};

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path3_emailNotString_returnsError', () => {
            const inputData: any = { email: 123 };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path4_emailInvalid_returnsError', () => {
            const inputData: UpdateUserInput = { email: 'bad' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path5_nameNotString_returnsError', () => {
            const inputData: any = { fullName: 123 };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path6_nameShort_returnsError', () => {
            const inputData: UpdateUserInput = { fullName: 'Short' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path7_nameLong_returnsError', () => {
            const inputData: UpdateUserInput = { fullName: 'A'.repeat(65) };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path8_phoneNotString_returnsError', () => {
            const inputData: any = { phone: 123 };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path9_phoneInvalid_returnsError', () => {
            const inputData: UpdateUserInput = { phone: 'abc' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path10_DOBNotString_returnsError', () => {
            const inputData: any = { dateOfBirth: 123 };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path11_DOBInvalid_returnsError', () => {
            const inputData: UpdateUserInput = { dateOfBirth: '01-01' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path12_DOBNotPast_returnsError', () => {
            const inputData: UpdateUserInput = { dateOfBirth: '2099-01-01' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path13_pwdNotString_returnsError', () => {
            const inputData: any = { password: 123 };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path14_pwdShort_returnsError', () => {
            const inputData: UpdateUserInput = { password: 'S' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path15_pwdLong_returnsError', () => {
            const inputData: UpdateUserInput = { password: 'A'.repeat(65) };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path16_pwdNoUpper_returnsError', () => {
            const inputData: UpdateUserInput = { password: 'low1!' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path17_pwdNoDigit_returnsError', () => {
            const inputData: UpdateUserInput = { password: 'UP!' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path18_pwdNoSpecial_returnsError', () => {
            const inputData: UpdateUserInput = { password: 'UP1' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path19_emailOnly_returnsSuccess', () => {
            const inputData: UpdateUserInput = { email: 'test@example.com' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path20_nameOnly_returnsSuccess', () => {
            const inputData: UpdateUserInput = { fullName: 'John Doe Junior' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path21_phoneOnly_returnsSuccess', () => {
            const inputData: UpdateUserInput = { phone: '+1234567890' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path22_DOBOnly_returnsSuccess', () => {
            const inputData: UpdateUserInput = { dateOfBirth: '1990-01-01' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path23_pwdOnly_returnsSuccess', () => {
            const inputData: UpdateUserInput = { password: 'Password1!' };

            const result = updateUserSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

    });

});

describe('createAdminSchema', () => {

    describe('Independent Paths', () => {

        it('createAdminSchema_Path1_valid_returnsSuccess', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createAdminSchema_Path2_emailNotString_returnsError', () => {
            const inputData: any = {
                email: 123,
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path3_emailInvalid_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'bad',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path4_fullNameNotString_returnsError', () => {
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path5_fullNameShort_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path6_fullNameLong_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path7_phoneNotString_returnsError', () => {
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: 123,
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path8_phoneInvalid_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: 'abc',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path9_DOBNotString_returnsError', () => {
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path10_DOBInvalid_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path11_DOBNotPast_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path12_pwdNotString_returnsError', () => {
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 123,
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path13_pwdShort_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'S',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path14_pwdLong_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'A'.repeat(65),
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path15_pwdNoUpper_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'low1!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path16_pwdNoDigit_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'UP!',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path17_pwdNoSpecial_returnsError', () => {
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'UP1',
            };

            const result = createAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

    });

});

describe('updateAdminSchema', () => {

    describe('Independent Paths', () => {

        it('updateAdminSchema_Path1_valid_returnsSuccess', () => {
            const inputData: UpdateAdminInput = {
                email: 'admin-upd@example.com',
                fullName: 'Admin User Updated',
                phone: '+9876543210',
                dateOfBirth: '1985-05-05',
                password: 'Password2@',
            };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path2_empty_returnsSuccess', () => {
            const inputData: UpdateAdminInput = {};

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path3_emailNotString_returnsError', () => {
            const inputData: any = { email: 123 };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path4_emailInvalid_returnsError', () => {
            const inputData: UpdateAdminInput = { email: 'bad' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path5_nameNotString_returnsError', () => {
            const inputData: any = { fullName: 123 };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path6_nameShort_returnsError', () => {
            const inputData: UpdateAdminInput = { fullName: 'Short' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path7_nameLong_returnsError', () => {
            const inputData: UpdateAdminInput = { fullName: 'A'.repeat(65) };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path8_phoneNotString_returnsError', () => {
            const inputData: any = { phone: 123 };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path9_phoneInvalid_returnsError', () => {
            const inputData: UpdateAdminInput = { phone: 'abc' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path10_DOBNotString_returnsError', () => {
            const inputData: any = { dateOfBirth: 123 };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path11_DOBInvalid_returnsError', () => {
            const inputData: UpdateAdminInput = { dateOfBirth: '01-01' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path12_DOBNotPast_returnsError', () => {
            const inputData: UpdateAdminInput = { dateOfBirth: '2099-01-01' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path13_pwdNotString_returnsError', () => {
            const inputData: any = { password: 123 };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path14_pwdShort_returnsError', () => {
            const inputData: UpdateAdminInput = { password: 'S' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path15_pwdLong_returnsError', () => {
            const inputData: UpdateAdminInput = { password: 'A'.repeat(65) };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path16_pwdNoUpper_returnsError', () => {
            const inputData: UpdateAdminInput = { password: 'low1!' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path17_pwdNoDigit_returnsError', () => {
            const inputData: UpdateAdminInput = { password: 'UP!' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path18_pwdNoSpecial_returnsError', () => {
            const inputData: UpdateAdminInput = { password: 'UP1' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path19_emailOnly_returnsSuccess', () => {
            const inputData: UpdateAdminInput = { email: 'admin-upd@example.com' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path20_nameOnly_returnsSuccess', () => {
            const inputData: UpdateAdminInput = { fullName: 'Admin User Updated' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path21_phoneOnly_returnsSuccess', () => {
            const inputData: UpdateAdminInput = { phone: '+9876543210' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path22_DOBOnly_returnsSuccess', () => {
            const inputData: UpdateAdminInput = { dateOfBirth: '1985-05-05' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path23_pwdOnly_returnsSuccess', () => {
            const inputData: UpdateAdminInput = { password: 'Password2@' };

            const result = updateAdminSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

    });

});
