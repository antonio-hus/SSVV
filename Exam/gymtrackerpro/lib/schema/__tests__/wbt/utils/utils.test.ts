import {isoDateRegex, e164PhoneRegex, emailRegex} from '@/lib/schema/utils';

describe('isoDateRegex', () => {

    describe('Independent Paths', () => {

        it('isoDateRegex_Path1_validIsoDate_returnsTrue', () => {
            const input: string = '2024-01-15';

            const result = isoDateRegex.test(input);

            expect(result).toBe(true);
        });

        it('isoDateRegex_Path2_missingHyphens_returnsFalse', () => {
            const input: string = '20240115';

            const result = isoDateRegex.test(input);

            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_singleDigitMonthAndDay_returnsFalse', () => {
            const input: string = '2024-1-5';

            const result = isoDateRegex.test(input);

            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_trailingTimestamp_returnsFalse', () => {
            const input: string = '2024-01-15T00:00:00';

            const result = isoDateRegex.test(input);

            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_emptyString_returnsFalse', () => {
            const input: string = '';

            const result = isoDateRegex.test(input);

            expect(result).toBe(false);
        });

        it('isoDateRegex_Path2_nonDigitCharactersInCorrectPositions_returnsFalse', () => {
            const input: string = 'abcd-ef-gh';

            const result = isoDateRegex.test(input);

            expect(result).toBe(false);
        });

    });

});

describe('e164PhoneRegex', () => {

    describe('Independent Paths', () => {

        it('e164PhoneRegex_Path1_validE164WithPlus_returnsTrue', () => {
            const input: string = '+14155552671';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_Path1_validE164WithoutPlus_returnsTrue', () => {
            const input: string = '14155552671';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(true);
        });

        it('e164PhoneRegex_Path2_singleDigit_returnsFalse', () => {
            const input: string = '1';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_leadingZeroAfterPlus_returnsFalse', () => {
            const input: string = '+01234567890';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_exceedsMaxLength_returnsFalse', () => {
            const input: string = '+1415555267100000';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_containsHyphens_returnsFalse', () => {
            const input: string = '+1-415-555-2671';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(false);
        });

        it('e164PhoneRegex_Path2_emptyString_returnsFalse', () => {
            const input: string = '';

            const result = e164PhoneRegex.test(input);

            expect(result).toBe(false);
        });

    });

});

describe('emailRegex', () => {

    describe('Independent Paths', () => {

        it('emailRegex_Path1_validStandardEmail_returnsTrue', () => {
            const input: string = 'user@example.com';

            const result = emailRegex.test(input);

            expect(result).toBe(true);
        });

        it('emailRegex_Path1_validEmailWithPlusTagAndSubdomain_returnsTrue', () => {
            const input: string = 'user+tag@sub.domain.org';

            const result = emailRegex.test(input);

            expect(result).toBe(true);
        });

        it('emailRegex_Path2_missingAtSymbol_returnsFalse', () => {
            const input: string = 'userexample.com';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_missingDomainPart_returnsFalse', () => {
            const input: string = 'user@';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_missingTld_returnsFalse', () => {
            const input: string = 'user@example';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_spaceInLocalPart_returnsFalse', () => {
            const input: string = 'user @example.com';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyLocalPart_returnsFalse', () => {
            const input: string = '@example.com';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyDomainLabelBeforeDot_returnsFalse', () => {
            const input: string = 'user@.com';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

        it('emailRegex_Path2_emptyString_returnsFalse', () => {
            const input: string = '';

            const result = emailRegex.test(input);

            expect(result).toBe(false);
        });

    });

});