import {isoDateRegex, e164PhoneRegex, emailRegex} from '@/lib/schema/utils';

describe('isoDateRegex', () => {
    it('isoDateRegex_validDate2024_01_01_matches', () => {
        const inputValidDate = '2024-01-01';

        const result = isoDateRegex.test(inputValidDate);

        expect(result).toBe(true);
    });

    it('isoDateRegex_validDate1990_12_31_matches', () => {
        const inputValidDate = '1990-12-31';

        const result = isoDateRegex.test(inputValidDate);

        expect(result).toBe(true);
    });

    it('isoDateRegex_slashSeparator_doesNotMatch', () => {
        const inputSlashDate = '2024/01/01';

        const result = isoDateRegex.test(inputSlashDate);

        expect(result).toBe(false);
    });

    it('isoDateRegex_dotSeparator_doesNotMatch', () => {
        const inputDotDate = '2024.01.01';

        const result = isoDateRegex.test(inputDotDate);

        expect(result).toBe(false);
    });

    it('isoDateRegex_singleDigitMonth_doesNotMatch', () => {
        const inputSingleDigitMonth = '2024-1-01';

        const result = isoDateRegex.test(inputSingleDigitMonth);

        expect(result).toBe(false);
    });

    it('isoDateRegex_singleDigitDay_doesNotMatch', () => {
        const inputSingleDigitDay = '2024-01-1';

        const result = isoDateRegex.test(inputSingleDigitDay);

        expect(result).toBe(false);
    });

    it('isoDateRegex_withTimeComponent_doesNotMatch', () => {
        const inputDateTimeString = '2024-01-01T00:00:00';

        const result = isoDateRegex.test(inputDateTimeString);

        expect(result).toBe(false);
    });

    it('isoDateRegex_noSeparators_doesNotMatch', () => {
        const inputNoSeparators = '20240101';

        const result = isoDateRegex.test(inputNoSeparators);

        expect(result).toBe(false);
    });

    it('isoDateRegex_ddMMYYYYFormat_doesNotMatch', () => {
        const inputReversedDate = '01-01-2024';

        const result = isoDateRegex.test(inputReversedDate);

        expect(result).toBe(false);
    });

    it('isoDateRegex_emptyString_doesNotMatch', () => {
        const inputEmptyString = '';

        const result = isoDateRegex.test(inputEmptyString);

        expect(result).toBe(false);
    });

    it('isoDateRegex_monthZero_matches', () => {
        const inputMonthZero = '2024-00-15';

        const result = isoDateRegex.test(inputMonthZero);

        expect(result).toBe(true);
    });

    it('isoDateRegex_dayZero_matches', () => {
        const inputDayZero = '2024-01-00';

        const result = isoDateRegex.test(inputDayZero);

        expect(result).toBe(true);
    });

    it('isoDateRegex_threeDigitYear_doesNotMatch', () => {
        const inputThreeDigitYear = '202-01-01';

        const result = isoDateRegex.test(inputThreeDigitYear);

        expect(result).toBe(false);
    });

    it('isoDateRegex_fiveDigitYear_doesNotMatch', () => {
        const inputFiveDigitYear = '20240-01-01';

        const result = isoDateRegex.test(inputFiveDigitYear);

        expect(result).toBe(false);
    });

    it('isoDateRegex_twoDigitDay99_matches', () => {
        const inputDay99 = '2024-01-99';

        const result = isoDateRegex.test(inputDay99);

        expect(result).toBe(true);
    });

    it('isoDateRegex_twoDigitMonth99_matches', () => {
        const inputMonth99 = '2024-99-01';

        const result = isoDateRegex.test(inputMonth99);

        expect(result).toBe(true);
    });

    it('isoDateRegex_allZeroesDate_matches', () => {
        const inputAllZeroes = '0000-00-00';

        const result = isoDateRegex.test(inputAllZeroes);

        expect(result).toBe(true);
    });
});

describe('e164PhoneRegex', () => {
    it('e164PhoneRegex_validNumberWithPlusPrefix_matches', () => {
        const inputPlusPhone = '+40712345678';

        const result = e164PhoneRegex.test(inputPlusPhone);

        expect(result).toBe(true);
    });

    it('e164PhoneRegex_validNumberWithoutPlusPrefix_matches', () => {
        const inputNoPlusPhone = '40712345678';

        const result = e164PhoneRegex.test(inputNoPlusPhone);

        expect(result).toBe(true);
    });

    it('e164PhoneRegex_minimumLengthTwoDigits_matches', () => {
        const inputMinLengthPhone = '12';

        const result = e164PhoneRegex.test(inputMinLengthPhone);

        expect(result).toBe(true);
    });

    it('e164PhoneRegex_validMaxLength15Digits_matches', () => {
        const inputMaxLengthPhone = '+123456789012345';

        const result = e164PhoneRegex.test(inputMaxLengthPhone);

        expect(result).toBe(true);
    });

    it('e164PhoneRegex_startsWithZero_doesNotMatch', () => {
        const inputZeroPrefixPhone = '0712345678';

        const result = e164PhoneRegex.test(inputZeroPrefixPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_startsWithPlusZero_doesNotMatch', () => {
        const inputPlusZeroPhone = '+0712345678';

        const result = e164PhoneRegex.test(inputPlusZeroPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_containsSpaces_doesNotMatch', () => {
        const inputSpacedPhone = '+44 20 1234 5678';

        const result = e164PhoneRegex.test(inputSpacedPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_containsDashes_doesNotMatch', () => {
        const inputDashedPhone = '+1-800-555-5555';

        const result = e164PhoneRegex.test(inputDashedPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_onlyPlusSign_doesNotMatch', () => {
        const inputOnlyPlus = '+';

        const result = e164PhoneRegex.test(inputOnlyPlus);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_emptyString_doesNotMatch', () => {
        const inputEmptyString = '';

        const result = e164PhoneRegex.test(inputEmptyString);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_singleDigitBelowMinimumLength_doesNotMatch', () => {
        const inputSingleDigit = '1';

        const result = e164PhoneRegex.test(inputSingleDigit);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_sixteenDigitsAboveMaximumLength_doesNotMatch', () => {
        const inputTooLongPhone = '+1234567890123456';

        const result = e164PhoneRegex.test(inputTooLongPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_containsParentheses_doesNotMatch', () => {
        const inputParenthesesPhone = '+1(800)5551234';

        const result = e164PhoneRegex.test(inputParenthesesPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_alphabeticCharsOnly_doesNotMatch', () => {
        const inputAlphaPhone = 'ABCDEFG';

        const result = e164PhoneRegex.test(inputAlphaPhone);

        expect(result).toBe(false);
    });

    it('e164PhoneRegex_3DigitsInsideValidRange_matches', () => {
        const inputThreeDigits = '+123';

        const result = e164PhoneRegex.test(inputThreeDigits);

        expect(result).toBe(true);
    });

    it('e164PhoneRegex_14DigitsInsideValidRange_matches', () => {
        const inputFourteenDigits = '+12345678901234';

        const result = e164PhoneRegex.test(inputFourteenDigits);

        expect(result).toBe(true);
    });
});

describe('emailRegex', () => {
    it('emailRegex_validBasicEmail_matches', () => {
        const inputBasicEmail = 'user@example.com';

        const result = emailRegex.test(inputBasicEmail);

        expect(result).toBe(true);
    });

    it('emailRegex_validEmailWithSubdomain_matches', () => {
        const inputSubdomainEmail = 'user@mail.example.com';

        const result = emailRegex.test(inputSubdomainEmail);

        expect(result).toBe(true);
    });

    it('emailRegex_validEmailWithPlusTag_matches', () => {
        const inputPlusTagEmail = 'user+tag@domain.com';

        const result = emailRegex.test(inputPlusTagEmail);

        expect(result).toBe(true);
    });

    it('emailRegex_validAdminEmail_matches', () => {
        const inputAdminEmail = 'admin@gymtrackerpro.com';

        const result = emailRegex.test(inputAdminEmail);

        expect(result).toBe(true);
    });

    it('emailRegex_noAtSymbol_doesNotMatch', () => {
        const inputNoAtEmail = 'invalidemail.com';

        const result = emailRegex.test(inputNoAtEmail);

        expect(result).toBe(false);
    });

    it('emailRegex_emptyLocalPart_doesNotMatch', () => {
        const inputEmptyLocalPart = '@domain.com';

        const result = emailRegex.test(inputEmptyLocalPart);

        expect(result).toBe(false);
    });

    it('emailRegex_noDomainAfterAt_doesNotMatch', () => {
        const inputNoDomainEmail = 'user@';

        const result = emailRegex.test(inputNoDomainEmail);

        expect(result).toBe(false);
    });

    it('emailRegex_noDotInDomain_doesNotMatch', () => {
        const inputNoDotDomain = 'user@domain';

        const result = emailRegex.test(inputNoDotDomain);

        expect(result).toBe(false);
    });

    it('emailRegex_spaceInLocalPart_doesNotMatch', () => {
        const inputSpacedLocalPart = 'user name@domain.com';

        const result = emailRegex.test(inputSpacedLocalPart);

        expect(result).toBe(false);
    });

    it('emailRegex_spaceAfterAtSymbol_doesNotMatch', () => {
        const inputSpaceAfterAt = 'user@ domain.com';

        const result = emailRegex.test(inputSpaceAfterAt);

        expect(result).toBe(false);
    });

    it('emailRegex_emptyString_doesNotMatch', () => {
        const inputEmptyString = '';

        const result = emailRegex.test(inputEmptyString);

        expect(result).toBe(false);
    });

    it('emailRegex_multipleAtSymbols_doesNotMatch', () => {
        const inputMultipleAt = 'a@b@example.com';

        const result = emailRegex.test(inputMultipleAt);

        expect(result).toBe(false);
    });

    it('emailRegex_emptyDomainPartBeforeDot_doesNotMatch', () => {
        const inputEmptyDomainBeforeDot = 'user@.com';

        const result = emailRegex.test(inputEmptyDomainBeforeDot);

        expect(result).toBe(false);
    });

    it('emailRegex_trailingDotInDomain_doesNotMatch', () => {
        const inputTrailingDotDomain = 'user@domain.';

        const result = emailRegex.test(inputTrailingDotDomain);

        expect(result).toBe(false);
    });

    it('emailRegex_numericLocalPart_matches', () => {
        const inputNumericLocal = '12345@domain.com';

        const result = emailRegex.test(inputNumericLocal);

        expect(result).toBe(true);
    });

    it('emailRegex_specialCharsInLocalPart_matches', () => {
        const inputSpecialLocal = 'user.name+tag@example.org';

        const result = emailRegex.test(inputSpecialLocal);

        expect(result).toBe(true);
    });

    it('emailRegex_dotBeforeAtSymbol_matches', () => {
        const inputDotBeforeAt = 'first.last@domain.com';

        const result = emailRegex.test(inputDotBeforeAt);

        expect(result).toBe(true);
    });
});