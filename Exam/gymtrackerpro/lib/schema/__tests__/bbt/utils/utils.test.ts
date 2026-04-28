import {isoDateRegex, e164PhoneRegex, emailRegex} from '@/lib/schema/utils';

describe('isoDateRegex', () => {
    describe('Equivalence Classes', () => {
        it('isoDateRegex_EC_validIsoDate_matches', () => {
            // Arrange
            const inputValidDate = '2024-01-01';

            // Act
            const result = isoDateRegex.test(inputValidDate);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_anotherValidIsoDate_matches', () => {
            // Arrange
            const inputValidDate = '1990-12-31';

            // Act
            const result = isoDateRegex.test(inputValidDate);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_slashSeparator_doesNotMatch', () => {
            // Arrange
            const inputSlashDate = '2024/01/01';

            // Act
            const result = isoDateRegex.test(inputSlashDate);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_dotSeparator_doesNotMatch', () => {
            // Arrange
            const inputDotDate = '2024.01.01';

            // Act
            const result = isoDateRegex.test(inputDotDate);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_withTimeComponent_doesNotMatch', () => {
            // Arrange
            const inputDateTime = '2024-01-01T00:00:00';

            // Act
            const result = isoDateRegex.test(inputDateTime);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_noSeparators_doesNotMatch', () => {
            // Arrange
            const inputNoSeparators = '20240101';

            // Act
            const result = isoDateRegex.test(inputNoSeparators);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_ddMMYYYYFormat_doesNotMatch', () => {
            // Arrange
            const inputReversedDate = '01-01-2024';

            // Act
            const result = isoDateRegex.test(inputReversedDate);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_emptyString_doesNotMatch', () => {
            // Arrange
            const inputEmptyString = '';

            // Act
            const result = isoDateRegex.test(inputEmptyString);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_monthZeroPassesFormatCheck_matches', () => {
            // Arrange
            const inputMonthZero = '2024-00-15';

            // Act
            const result = isoDateRegex.test(inputMonthZero);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_dayZeroPassesFormatCheck_matches', () => {
            // Arrange
            const inputDayZero = '2024-01-00';

            // Act
            const result = isoDateRegex.test(inputDayZero);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_month99PassesFormatCheck_matches', () => {
            // Arrange
            const inputMonth99 = '2024-99-01';

            // Act
            const result = isoDateRegex.test(inputMonth99);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_day99PassesFormatCheck_matches', () => {
            // Arrange
            const inputDay99 = '2024-01-99';

            // Act
            const result = isoDateRegex.test(inputDay99);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_allZeroesPassesFormatCheck_matches', () => {
            // Arrange
            const inputAllZeroes = '0000-00-00';

            // Act
            const result = isoDateRegex.test(inputAllZeroes);

            // Assert
            expect(result).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('isoDateRegex_BVA_threeDigitYear_doesNotMatch', () => {
            // Arrange
            const inputThreeDigitYear = '202-01-01';

            // Act
            const result = isoDateRegex.test(inputThreeDigitYear);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_fourDigitYear_matches', () => {
            // Arrange
            const inputFourDigitYear = '2024-01-01';

            // Act
            const result = isoDateRegex.test(inputFourDigitYear);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_fiveDigitYear_doesNotMatch', () => {
            // Arrange
            const inputFiveDigitYear = '20240-01-01';

            // Act
            const result = isoDateRegex.test(inputFiveDigitYear);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_singleDigitMonth_doesNotMatch', () => {
            // Arrange
            const inputSingleDigitMonth = '2024-1-01';

            // Act
            const result = isoDateRegex.test(inputSingleDigitMonth);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_twoDigitMonth_matches', () => {
            // Arrange
            const inputTwoDigitMonth = '2024-01-01';

            // Act
            const result = isoDateRegex.test(inputTwoDigitMonth);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_threeDigitMonth_doesNotMatch', () => {
            // Arrange
            const inputThreeDigitMonth = '2024-011-01';

            // Act
            const result = isoDateRegex.test(inputThreeDigitMonth);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_singleDigitDay_doesNotMatch', () => {
            // Arrange
            const inputSingleDigitDay = '2024-01-1';

            // Act
            const result = isoDateRegex.test(inputSingleDigitDay);

            // Assert
            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_twoDigitDay_matches', () => {
            // Arrange
            const inputTwoDigitDay = '2024-01-01';

            // Act
            const result = isoDateRegex.test(inputTwoDigitDay);

            // Assert
            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_threeDigitDay_doesNotMatch', () => {
            // Arrange
            const inputThreeDigitDay = '2024-01-011';

            // Act
            const result = isoDateRegex.test(inputThreeDigitDay);

            // Assert
            expect(result).toBe(false);
        });
    });
});

describe('e164PhoneRegex', () => {
    describe('Equivalence Classes', () => {
        it('e164PhoneRegex_EC_validNumberWithPlusPrefix_matches', () => {
            // Arrange
            const inputPlusPhone = '+40712345678';

            // Act
            const result = e164PhoneRegex.test(inputPlusPhone);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_EC_validNumberWithoutPlusPrefix_matches', () => {
            // Arrange
            const inputNoPlusPhone = '40712345678';

            // Act
            const result = e164PhoneRegex.test(inputNoPlusPhone);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_EC_startsWithZero_doesNotMatch', () => {
            // Arrange
            const inputZeroPrefixPhone = '0712345678';

            // Act
            const result = e164PhoneRegex.test(inputZeroPrefixPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_startsWithPlusZero_doesNotMatch', () => {
            // Arrange
            const inputPlusZeroPhone = '+0712345678';

            // Act
            const result = e164PhoneRegex.test(inputPlusZeroPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsSpaces_doesNotMatch', () => {
            // Arrange
            const inputSpacedPhone = '+44 20 1234 5678';

            // Act
            const result = e164PhoneRegex.test(inputSpacedPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsDashes_doesNotMatch', () => {
            // Arrange
            const inputDashedPhone = '+1-800-555-5555';

            // Act
            const result = e164PhoneRegex.test(inputDashedPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsParentheses_doesNotMatch', () => {
            // Arrange
            const inputParenthesesPhone = '+1(800)5551234';

            // Act
            const result = e164PhoneRegex.test(inputParenthesesPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_alphabeticCharsOnly_doesNotMatch', () => {
            // Arrange
            const inputAlphaPhone = 'ABCDEFG';

            // Act
            const result = e164PhoneRegex.test(inputAlphaPhone);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_onlyPlusSign_doesNotMatch', () => {
            // Arrange
            const inputOnlyPlus = '+';

            // Act
            const result = e164PhoneRegex.test(inputOnlyPlus);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_emptyString_doesNotMatch', () => {
            // Arrange
            const inputEmptyString = '';

            // Act
            const result = e164PhoneRegex.test(inputEmptyString);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('e164PhoneRegex_BVA_1DigitAfterPlus_doesNotMatch', () => {
            // Arrange
            const inputOneDigit = '1';

            // Act
            const result = e164PhoneRegex.test(inputOneDigit);

            // Assert
            expect(result).toBe(false);
        });

        it('e164PhoneRegex_BVA_2DigitsAfterPlus_matches', () => {
            // Arrange
            const inputTwoDigits = '12';

            // Act
            const result = e164PhoneRegex.test(inputTwoDigits);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_3DigitsAfterPlus_matches', () => {
            // Arrange
            const inputThreeDigits = '+123';

            // Act
            const result = e164PhoneRegex.test(inputThreeDigits);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_14DigitsAfterPlus_matches', () => {
            // Arrange
            const inputFourteenDigits = '+12345678901234';

            // Act
            const result = e164PhoneRegex.test(inputFourteenDigits);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_15DigitsAfterPlus_matches', () => {
            // Arrange
            const inputFifteenDigits = '+123456789012345';

            // Act
            const result = e164PhoneRegex.test(inputFifteenDigits);

            // Assert
            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_16DigitsAfterPlus_doesNotMatch', () => {
            // Arrange
            const inputSixteenDigits = '+1234567890123456';

            // Act
            const result = e164PhoneRegex.test(inputSixteenDigits);

            // Assert
            expect(result).toBe(false);
        });
    });
});

describe('emailRegex', () => {
    describe('Equivalence Classes', () => {
        it('emailRegex_EC_validBasicEmail_matches', () => {
            // Arrange
            const inputBasicEmail = 'user@example.com';

            // Act
            const result = emailRegex.test(inputBasicEmail);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithSubdomain_matches', () => {
            // Arrange
            const inputSubdomainEmail = 'user@mail.example.com';

            // Act
            const result = emailRegex.test(inputSubdomainEmail);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithPlusTag_matches', () => {
            // Arrange
            const inputPlusTagEmail = 'user+tag@domain.com';

            // Act
            const result = emailRegex.test(inputPlusTagEmail);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithDotInLocalPart_matches', () => {
            // Arrange
            const inputDotLocalEmail = 'first.last@domain.com';

            // Act
            const result = emailRegex.test(inputDotLocalEmail);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_validNumericLocalPart_matches', () => {
            // Arrange
            const inputNumericLocal = '12345@domain.com';

            // Act
            const result = emailRegex.test(inputNumericLocal);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_validSpecialCharsInLocalPart_matches', () => {
            // Arrange
            const inputSpecialLocal = 'user.name+tag@example.org';

            // Act
            const result = emailRegex.test(inputSpecialLocal);

            // Assert
            expect(result).toBe(true);
        });

        it('emailRegex_EC_noAtSymbol_doesNotMatch', () => {
            // Arrange
            const inputNoAtEmail = 'invalidemail.com';

            // Act
            const result = emailRegex.test(inputNoAtEmail);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyLocalPart_doesNotMatch', () => {
            // Arrange
            const inputEmptyLocalPart = '@domain.com';

            // Act
            const result = emailRegex.test(inputEmptyLocalPart);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_noDomainAfterAt_doesNotMatch', () => {
            // Arrange
            const inputNoDomain = 'user@';

            // Act
            const result = emailRegex.test(inputNoDomain);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_noDotInDomain_doesNotMatch', () => {
            // Arrange
            const inputNoDotDomain = 'user@domain';

            // Act
            const result = emailRegex.test(inputNoDotDomain);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_spaceInLocalPart_doesNotMatch', () => {
            // Arrange
            const inputSpacedLocal = 'user name@domain.com';

            // Act
            const result = emailRegex.test(inputSpacedLocal);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_spaceAfterAt_doesNotMatch', () => {
            // Arrange
            const inputSpaceAfterAt = 'user@ domain.com';

            // Act
            const result = emailRegex.test(inputSpaceAfterAt);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_multipleAtSymbols_doesNotMatch', () => {
            // Arrange
            const inputMultipleAt = 'a@b@example.com';

            // Act
            const result = emailRegex.test(inputMultipleAt);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyDomainBeforeDot_doesNotMatch', () => {
            // Arrange
            const inputEmptyDomainBeforeDot = 'user@.com';

            // Act
            const result = emailRegex.test(inputEmptyDomainBeforeDot);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_trailingDotInDomain_doesNotMatch', () => {
            // Arrange
            const inputTrailingDot = 'user@domain.';

            // Act
            const result = emailRegex.test(inputTrailingDot);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyString_doesNotMatch', () => {
            // Arrange
            const inputEmptyString = '';

            // Act
            const result = emailRegex.test(inputEmptyString);

            // Assert
            expect(result).toBe(false);
        });

        it('emailRegex_EC_atSymbolOnly_doesNotMatch', () => {
            // Arrange
            const inputAtOnly = '@';

            // Act
            const result = emailRegex.test(inputAtOnly);

            // Assert
            expect(result).toBe(false);
        });
    });
});