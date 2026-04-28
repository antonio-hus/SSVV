import {isoDateRegex, e164PhoneRegex, emailRegex} from '@/lib/schema/utils';

describe('isoDateRegex', () => {

    describe('Independent Paths', () => {

        it('isoDateRegex_Path1_validIsoDate_returnsTrue', () => {
            // Arrange
            const input: string = '2024-01-15';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_Path2_missingHyphens_returnsFalse', () => {
            // Arrange
            const input: string = '20240115';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_singleDigitMonthAndDay_returnsFalse', () => {
            // Arrange
            const input: string = '2024-1-5';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_trailingTimestamp_returnsFalse', () => {
            // Arrange
            const input: string = '2024-01-15T00:00:00';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_emptyString_returnsFalse', () => {
            // Arrange
            const input: string = '';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_nonDigitCharactersInCorrectPositions_returnsFalse', () => {
            // Arrange
            const input: string = 'abcd-ef-gh';

            // Act
            const result = isoDateRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

    });

});

describe('e164PhoneRegex', () => {

    describe('Independent Paths', () => {

        it('e164PhoneRegex_Path1_validE164WithPlus_returnsTrue', () => {
            // Arrange
            const input: string = '+14155552671';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_Path1_validE164WithoutPlus_returnsTrue', () => {
            // Arrange
            const input: string = '14155552671';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_Path2_singleDigit_returnsFalse', () => {
            // Arrange
            const input: string = '1';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_leadingZeroAfterPlus_returnsFalse', () => {
            // Arrange
            const input: string = '+01234567890';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_exceedsMaxLength_returnsFalse', () => {
            // Arrange
            const input: string = '+1415555267100000';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_containsHyphens_returnsFalse', () => {
            // Arrange
            const input: string = '+1-415-555-2671';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_emptyString_returnsFalse', () => {
            // Arrange
            const input: string = '';

            // Act
            const result = e164PhoneRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

    });

});

describe('emailRegex', () => {

    describe('Independent Paths', () => {

        it('emailRegex_Path1_validStandardEmail_returnsTrue', () => {
            // Arrange
            const input: string = 'user@example.com';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_Path1_validEmailWithPlusTagAndSubdomain_returnsTrue', () => {
            // Arrange
            const input: string = 'user+tag@sub.domain.org';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_Path2_missingAtSymbol_returnsFalse', () => {
            // Arrange
            const input: string = 'userexample.com';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_missingDomainPart_returnsFalse', () => {
            // Arrange
            const input: string = 'user@';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_missingTld_returnsFalse', () => {
            // Arrange
            const input: string = 'user@example';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_spaceInLocalPart_returnsFalse', () => {
            // Arrange
            const input: string = 'user @example.com';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyLocalPart_returnsFalse', () => {
            // Arrange
            const input: string = '@example.com';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyDomainLabelBeforeDot_returnsFalse', () => {
            // Arrange
            const input: string = 'user@.com';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyString_returnsFalse', () => {
            // Arrange
            const input: string = '';

            // Act
            const result = emailRegex.test(input);

            // Assert
            expect(result).toBe(false);
        });

    });

});
