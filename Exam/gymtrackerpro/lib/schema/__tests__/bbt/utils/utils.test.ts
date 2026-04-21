import {isoDateRegex, e164PhoneRegex, emailRegex} from '@/lib/schema/utils';

describe('isoDateRegex', () => {
    describe('Equivalence Classes', () => {
        it('isoDateRegex_EC_validIsoDate_matches', () => {
            const inputValidDate = '2024-01-01';

            const result = isoDateRegex.test(inputValidDate);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_anotherValidIsoDate_matches', () => {
            const inputValidDate = '1990-12-31';

            const result = isoDateRegex.test(inputValidDate);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_slashSeparator_doesNotMatch', () => {
            const inputSlashDate = '2024/01/01';

            const result = isoDateRegex.test(inputSlashDate);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_dotSeparator_doesNotMatch', () => {
            const inputDotDate = '2024.01.01';

            const result = isoDateRegex.test(inputDotDate);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_withTimeComponent_doesNotMatch', () => {
            const inputDateTime = '2024-01-01T00:00:00';

            const result = isoDateRegex.test(inputDateTime);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_noSeparators_doesNotMatch', () => {
            const inputNoSeparators = '20240101';

            const result = isoDateRegex.test(inputNoSeparators);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_ddMMYYYYFormat_doesNotMatch', () => {
            const inputReversedDate = '01-01-2024';

            const result = isoDateRegex.test(inputReversedDate);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_emptyString_doesNotMatch', () => {
            const inputEmptyString = '';

            const result = isoDateRegex.test(inputEmptyString);

            expect(result).toBe(false);
        });

        it('isoDateRegex_EC_monthZeroPassesFormatCheck_matches', () => {
            const inputMonthZero = '2024-00-15';

            const result = isoDateRegex.test(inputMonthZero);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_dayZeroPassesFormatCheck_matches', () => {
            const inputDayZero = '2024-01-00';

            const result = isoDateRegex.test(inputDayZero);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_month99PassesFormatCheck_matches', () => {
            const inputMonth99 = '2024-99-01';

            const result = isoDateRegex.test(inputMonth99);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_day99PassesFormatCheck_matches', () => {
            const inputDay99 = '2024-01-99';

            const result = isoDateRegex.test(inputDay99);

            expect(result).toBe(true);
        });

        it('isoDateRegex_EC_allZeroesPassesFormatCheck_matches', () => {
            const inputAllZeroes = '0000-00-00';

            const result = isoDateRegex.test(inputAllZeroes);

            expect(result).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('isoDateRegex_BVA_threeDigitYear_doesNotMatch', () => {
            const inputThreeDigitYear = '202-01-01';

            const result = isoDateRegex.test(inputThreeDigitYear);

            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_fourDigitYear_matches', () => {
            const inputFourDigitYear = '2024-01-01';

            const result = isoDateRegex.test(inputFourDigitYear);

            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_fiveDigitYear_doesNotMatch', () => {
            const inputFiveDigitYear = '20240-01-01';

            const result = isoDateRegex.test(inputFiveDigitYear);

            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_singleDigitMonth_doesNotMatch', () => {
            const inputSingleDigitMonth = '2024-1-01';

            const result = isoDateRegex.test(inputSingleDigitMonth);

            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_twoDigitMonth_matches', () => {
            const inputTwoDigitMonth = '2024-01-01';

            const result = isoDateRegex.test(inputTwoDigitMonth);

            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_threeDigitMonth_doesNotMatch', () => {
            const inputThreeDigitMonth = '2024-011-01';

            const result = isoDateRegex.test(inputThreeDigitMonth);

            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_singleDigitDay_doesNotMatch', () => {
            const inputSingleDigitDay = '2024-01-1';

            const result = isoDateRegex.test(inputSingleDigitDay);

            expect(result).toBe(false);
        });

        it('isoDateRegex_BVA_twoDigitDay_matches', () => {
            const inputTwoDigitDay = '2024-01-01';

            const result = isoDateRegex.test(inputTwoDigitDay);

            expect(result).toBe(true);
        });

        it('isoDateRegex_BVA_threeDigitDay_doesNotMatch', () => {
            const inputThreeDigitDay = '2024-01-011';

            const result = isoDateRegex.test(inputThreeDigitDay);

            expect(result).toBe(false);
        });
    });
});

describe('e164PhoneRegex', () => {
    describe('Equivalence Classes', () => {
        it('e164PhoneRegex_EC_validNumberWithPlusPrefix_matches', () => {
            const inputPlusPhone = '+40712345678';

            const result = e164PhoneRegex.test(inputPlusPhone);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_EC_validNumberWithoutPlusPrefix_matches', () => {
            const inputNoPlusPhone = '40712345678';

            const result = e164PhoneRegex.test(inputNoPlusPhone);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_EC_startsWithZero_doesNotMatch', () => {
            const inputZeroPrefixPhone = '0712345678';

            const result = e164PhoneRegex.test(inputZeroPrefixPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_startsWithPlusZero_doesNotMatch', () => {
            const inputPlusZeroPhone = '+0712345678';

            const result = e164PhoneRegex.test(inputPlusZeroPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsSpaces_doesNotMatch', () => {
            const inputSpacedPhone = '+44 20 1234 5678';

            const result = e164PhoneRegex.test(inputSpacedPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsDashes_doesNotMatch', () => {
            const inputDashedPhone = '+1-800-555-5555';

            const result = e164PhoneRegex.test(inputDashedPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_containsParentheses_doesNotMatch', () => {
            const inputParenthesesPhone = '+1(800)5551234';

            const result = e164PhoneRegex.test(inputParenthesesPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_alphabeticCharsOnly_doesNotMatch', () => {
            const inputAlphaPhone = 'ABCDEFG';

            const result = e164PhoneRegex.test(inputAlphaPhone);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_onlyPlusSign_doesNotMatch', () => {
            const inputOnlyPlus = '+';

            const result = e164PhoneRegex.test(inputOnlyPlus);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_EC_emptyString_doesNotMatch', () => {
            const inputEmptyString = '';

            const result = e164PhoneRegex.test(inputEmptyString);

            expect(result).toBe(false);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('e164PhoneRegex_BVA_1DigitAfterPlus_doesNotMatch', () => {
            const inputOneDigit = '1';

            const result = e164PhoneRegex.test(inputOneDigit);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_BVA_2DigitsAfterPlus_matches', () => {
            const inputTwoDigits = '12';

            const result = e164PhoneRegex.test(inputTwoDigits);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_3DigitsAfterPlus_matches', () => {
            const inputThreeDigits = '+123';

            const result = e164PhoneRegex.test(inputThreeDigits);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_14DigitsAfterPlus_matches', () => {
            const inputFourteenDigits = '+12345678901234';

            const result = e164PhoneRegex.test(inputFourteenDigits);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_15DigitsAfterPlus_matches', () => {
            const inputFifteenDigits = '+123456789012345';

            const result = e164PhoneRegex.test(inputFifteenDigits);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_BVA_16DigitsAfterPlus_doesNotMatch', () => {
            const inputSixteenDigits = '+1234567890123456';

            const result = e164PhoneRegex.test(inputSixteenDigits);

            expect(result).toBe(false);
        });
    });
});

describe('emailRegex', () => {
    describe('Equivalence Classes', () => {
        it('emailRegex_EC_validBasicEmail_matches', () => {
            const inputBasicEmail = 'user@example.com';

            const result = emailRegex.test(inputBasicEmail);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithSubdomain_matches', () => {
            const inputSubdomainEmail = 'user@mail.example.com';

            const result = emailRegex.test(inputSubdomainEmail);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithPlusTag_matches', () => {
            const inputPlusTagEmail = 'user+tag@domain.com';

            const result = emailRegex.test(inputPlusTagEmail);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_validEmailWithDotInLocalPart_matches', () => {
            const inputDotLocalEmail = 'first.last@domain.com';

            const result = emailRegex.test(inputDotLocalEmail);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_validNumericLocalPart_matches', () => {
            const inputNumericLocal = '12345@domain.com';

            const result = emailRegex.test(inputNumericLocal);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_validSpecialCharsInLocalPart_matches', () => {
            const inputSpecialLocal = 'user.name+tag@example.org';

            const result = emailRegex.test(inputSpecialLocal);

            expect(result).toBe(true);
        });

        it('emailRegex_EC_noAtSymbol_doesNotMatch', () => {
            const inputNoAtEmail = 'invalidemail.com';

            const result = emailRegex.test(inputNoAtEmail);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyLocalPart_doesNotMatch', () => {
            const inputEmptyLocalPart = '@domain.com';

            const result = emailRegex.test(inputEmptyLocalPart);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_noDomainAfterAt_doesNotMatch', () => {
            const inputNoDomain = 'user@';

            const result = emailRegex.test(inputNoDomain);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_noDotInDomain_doesNotMatch', () => {
            const inputNoDotDomain = 'user@domain';

            const result = emailRegex.test(inputNoDotDomain);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_spaceInLocalPart_doesNotMatch', () => {
            const inputSpacedLocal = 'user name@domain.com';

            const result = emailRegex.test(inputSpacedLocal);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_spaceAfterAt_doesNotMatch', () => {
            const inputSpaceAfterAt = 'user@ domain.com';

            const result = emailRegex.test(inputSpaceAfterAt);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_multipleAtSymbols_doesNotMatch', () => {
            const inputMultipleAt = 'a@b@example.com';

            const result = emailRegex.test(inputMultipleAt);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyDomainBeforeDot_doesNotMatch', () => {
            const inputEmptyDomainBeforeDot = 'user@.com';

            const result = emailRegex.test(inputEmptyDomainBeforeDot);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_trailingDotInDomain_doesNotMatch', () => {
            const inputTrailingDot = 'user@domain.';

            const result = emailRegex.test(inputTrailingDot);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_emptyString_doesNotMatch', () => {
            const inputEmptyString = '';

            const result = emailRegex.test(inputEmptyString);

            expect(result).toBe(false);
        });

        it('emailRegex_EC_atSymbolOnly_doesNotMatch', () => {
            const inputAtOnly = '@';

            const result = emailRegex.test(inputAtOnly);

            expect(result).toBe(false);
        });
    });
});