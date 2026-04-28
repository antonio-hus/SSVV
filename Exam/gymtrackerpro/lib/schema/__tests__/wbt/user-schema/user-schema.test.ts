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
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createMemberSchema_Path2_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path3_emailInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path4_fullNameNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path5_fullNameTooShort_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path6_fullNameTooLong_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path7_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path8_phoneInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path9_dateOfBirthNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path10_dateOfBirthInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path11_dateOfBirthNotInPast_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path12_passwordNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 123,
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path13_passwordTooShort_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Short1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path14_passwordTooLong_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'A'.repeat(65),
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path15_passwordNoUppercase_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'lowercase1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path16_passwordNoDigit_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path17_passwordNoSpecial_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase1',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path18_membershipStartNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: 123,
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberSchema_Path19_membershipStartInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: CreateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '01-01-2026',
            };

            // Act
            const result = createMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

    });

});

describe('updateMemberSchema', () => {

    describe('Independent Paths', () => {

        it('updateMemberSchema_Path1_allFieldsValid_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path2_emptyObject_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = {};

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path3_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = { email: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path4_emailInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { email: 'bad' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path5_nameNotString_returnsError', () => {
            // Arrange
            const inputData: any = { fullName: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path6_nameTooShort_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { fullName: 'Short' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path7_nameTooLong_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { fullName: 'A'.repeat(65) };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path8_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = { phone: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path9_phoneInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { phone: 'abc' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path10_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = { dateOfBirth: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path11_DOBInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { dateOfBirth: '01-01' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path12_DOBNotInPast_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { dateOfBirth: '2099-01-01' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path13_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = { password: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path14_pwdTooShort_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'S' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path15_pwdTooLong_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'A'.repeat(65) };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path16_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'low1!' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path17_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'UP!' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path18_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'UP1' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path19_mStartNotString_returnsError', () => {
            // Arrange
            const inputData: any = { membershipStart: 123 };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path20_mStartInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: UpdateMemberInput = { membershipStart: 'bad' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateMemberSchema_Path21_emailOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { email: 'test@example.com' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path22_nameOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { fullName: 'John Doe Junior' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path23_phoneOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { phone: '+1234567890' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path24_DOBOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { dateOfBirth: '1990-01-01' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path25_pwdOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { password: 'Password1!' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateMemberSchema_Path26_mStartOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateMemberInput = { membershipStart: '2026-01-01' };

            // Act
            const result = updateMemberSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

    });

});

describe('loginUserSchema', () => {

    describe('Independent Paths', () => {

        it('loginUserSchema_Path1_valid_returnsSuccess', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Password1!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('loginUserSchema_Path2_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 123,
                password: 'Password1!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path3_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'invalid-email',
                password: 'Password1!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path4_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                password: 123,
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path5_pwdTooShort_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Short1!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path6_pwdTooLong_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'A'.repeat(65),
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path7_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'lowercase1!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path8_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Uppercase!',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('loginUserSchema_Path9_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: LoginUserInput = {
                email: 'test@example.com',
                password: 'Uppercase1',
            };

            // Act
            const result = loginUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

    });

});

describe('createMemberWithTempPasswordSchema', () => {

    describe('Independent Paths', () => {

        it('createMemberWithTempPasswordSchema_Path1_valid_returnsSuccess', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createMemberWithTempPasswordSchema_Path2_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path3_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path4_nameNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path5_nameTooShort_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path6_nameTooLong_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path7_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path8_phoneInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path9_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path10_DOBInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path11_DOBNotInPast_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                membershipStart: '2026-01-01',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path12_mStartNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: 123,
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createMemberWithTempPasswordSchema_Path13_mStartInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateMemberWithTempPasswordInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                membershipStart: '01-01-2026',
            };

            // Act
            const result = createMemberWithTempPasswordSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

    });

});

describe('createUserSchema', () => {

    describe('Independent Paths', () => {

        it('createUserSchema_Path1_valid_returnsSuccess', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createUserSchema_Path2_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 123,
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path3_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'bad',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path4_nameNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path5_nameTooShort_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path6_nameTooLong_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path7_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 123,
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path8_phoneInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: 'abc',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path9_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path10_DOBInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '01-01-1990',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path11_DOBNotInPast_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path12_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 123,
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path13_pwdTooShort_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Short1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path14_pwdTooLong_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'A'.repeat(65),
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path15_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'lowercase1!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path16_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase!',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createUserSchema_Path17_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: CreateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Uppercase1',
            };

            // Act
            const result = createUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

    });

});

describe('updateUserSchema', () => {

    describe('Independent Paths', () => {

        it('updateUserSchema_Path1_allValid_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = {
                email: 'test@example.com',
                fullName: 'John Doe Junior',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                password: 'Password1!',
            };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path2_empty_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = {};

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path3_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = { email: 123 };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path4_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { email: 'bad' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path5_nameNotString_returnsError', () => {
            // Arrange
            const inputData: any = { fullName: 123 };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path6_nameShort_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { fullName: 'Short' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path7_nameLong_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { fullName: 'A'.repeat(65) };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path8_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = { phone: 123 };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path9_phoneInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { phone: 'abc' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path10_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = { dateOfBirth: 123 };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path11_DOBInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { dateOfBirth: '01-01' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path12_DOBNotPast_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { dateOfBirth: '2099-01-01' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path13_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = { password: 123 };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path14_pwdShort_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'S' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path15_pwdLong_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'A'.repeat(65) };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path16_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'low1!' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path17_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'UP!' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path18_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'UP1' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateUserSchema_Path19_emailOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = { email: 'test@example.com' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path20_nameOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = { fullName: 'John Doe Junior' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path21_phoneOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = { phone: '+1234567890' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path22_DOBOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = { dateOfBirth: '1990-01-01' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateUserSchema_Path23_pwdOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateUserInput = { password: 'Password1!' };

            // Act
            const result = updateUserSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

    });

});

describe('createAdminSchema', () => {

    describe('Independent Paths', () => {

        it('createAdminSchema_Path1_valid_returnsSuccess', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createAdminSchema_Path2_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 123,
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path3_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'bad',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path4_fullNameNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 123,
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path5_fullNameShort_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Short',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path6_fullNameLong_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'A'.repeat(65),
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path7_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: 123,
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path8_phoneInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: 'abc',
                dateOfBirth: '1980-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path9_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: 123,
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path10_DOBInvalid_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path11_DOBNotPast_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '2099-01-01',
                password: 'Password1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path12_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 123,
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path13_pwdShort_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'S',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path14_pwdLong_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'A'.repeat(65),
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path15_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'low1!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path16_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'UP!',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('createAdminSchema_Path17_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: CreateAdminInput = {
                email: 'admin@example.com',
                fullName: 'Admin User Account',
                phone: '+1234567890',
                dateOfBirth: '1980-01-01',
                password: 'UP1',
            };

            // Act
            const result = createAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

    });

});

describe('updateAdminSchema', () => {

    describe('Independent Paths', () => {

        it('updateAdminSchema_Path1_valid_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = {
                email: 'admin-upd@example.com',
                fullName: 'Admin User Updated',
                phone: '+9876543210',
                dateOfBirth: '1985-05-05',
                password: 'Password2@',
            };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path2_empty_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = {};

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path3_emailNotString_returnsError', () => {
            // Arrange
            const inputData: any = { email: 123 };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path4_emailInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { email: 'bad' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path5_nameNotString_returnsError', () => {
            // Arrange
            const inputData: any = { fullName: 123 };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path6_nameShort_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { fullName: 'Short' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path7_nameLong_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { fullName: 'A'.repeat(65) };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path8_phoneNotString_returnsError', () => {
            // Arrange
            const inputData: any = { phone: 123 };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path9_phoneInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { phone: 'abc' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path10_DOBNotString_returnsError', () => {
            // Arrange
            const inputData: any = { dateOfBirth: 123 };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path11_DOBInvalid_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { dateOfBirth: '01-01' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path12_DOBNotPast_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { dateOfBirth: '2099-01-01' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path13_pwdNotString_returnsError', () => {
            // Arrange
            const inputData: any = { password: 123 };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path14_pwdShort_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'S' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path15_pwdLong_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'A'.repeat(65) };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path16_pwdNoUpper_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'low1!' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path17_pwdNoDigit_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'UP!' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path18_pwdNoSpecial_returnsError', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'UP1' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('updateAdminSchema_Path19_emailOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = { email: 'admin-upd@example.com' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path20_nameOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = { fullName: 'Admin User Updated' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path21_phoneOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = { phone: '+9876543210' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path22_DOBOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = { dateOfBirth: '1985-05-05' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateAdminSchema_Path23_pwdOnly_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateAdminInput = { password: 'Password2@' };

            // Act
            const result = updateAdminSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

    });

});
