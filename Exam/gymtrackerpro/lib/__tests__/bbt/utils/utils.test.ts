import {escapeLike} from '@/lib/utils';

describe('escapeLike', () => {
    it('escapeLike_plainString_returnsUnchanged', () => {
        const inputPlain = 'benchpress';

        const result = escapeLike(inputPlain);

        expect(result).toBe('benchpress');
    });

    it('escapeLike_percentSign_escapesPercent', () => {
        const inputPercent = '100%';

        const result = escapeLike(inputPercent);

        expect(result).toBe('100\\%');
    });

    it('escapeLike_underscore_escapesUnderscore', () => {
        const inputUnderscore = 'bench_press';

        const result = escapeLike(inputUnderscore);

        expect(result).toBe('bench\\_press');
    });

    it('escapeLike_backslash_escapesBackslash', () => {
        const inputBackslash = 'path\\value';

        const result = escapeLike(inputBackslash);

        expect(result).toBe('path\\\\value');
    });

    it('escapeLike_multipleSpecialChars_escapesAll', () => {
        const inputMixed = '100%_bench\\press';

        const result = escapeLike(inputMixed);

        expect(result).toBe('100\\%\\_bench\\\\press');
    });

    it('escapeLike_emptyString_returnsEmptyString', () => {
        const inputEmpty = '';

        const result = escapeLike(inputEmpty);

        expect(result).toBe('');
    });

    it('escapeLike_onlySpecialChars_escapesAll', () => {
        const inputAllSpecial = '%_\\';

        const result = escapeLike(inputAllSpecial);

        expect(result).toBe('\\%\\_\\\\');
    });

    it('escapeLike_specialCharAtStart_escapesLeadingSpecial', () => {
        const inputLeadingSpecial = '%benchpress';

        const result = escapeLike(inputLeadingSpecial);

        expect(result).toBe('\\%benchpress');
    });

    it('escapeLike_specialCharAtEnd_escapesTrailingSpecial', () => {
        const inputTrailingSpecial = 'benchpress%';

        const result = escapeLike(inputTrailingSpecial);

        expect(result).toBe('benchpress\\%');
    });

    it('escapeLike_repeatedConsecutivePercents_escapesAll', () => {
        const inputDoublePercent = '100%%';

        const result = escapeLike(inputDoublePercent);

        expect(result).toBe('100\\%\\%');
    });

    it('escapeLike_repeatedConsecutiveUnderscores_escapesAll', () => {
        const inputDoubleUnderscore = 'bench__press';

        const result = escapeLike(inputDoubleUnderscore);

        expect(result).toBe('bench\\_\\_press');
    });

    it('escapeLike_singlePercent_escapesPercent', () => {
        const inputSinglePercent = '%';

        const result = escapeLike(inputSinglePercent);

        expect(result).toBe('\\%');
    });

    it('escapeLike_singleUnderscore_escapesUnderscore', () => {
        const inputSingleUnderscore = '_';

        const result = escapeLike(inputSingleUnderscore);

        expect(result).toBe('\\_');
    });
});