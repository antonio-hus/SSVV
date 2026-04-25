import {cn, escapeLike} from '@/lib/utils';

describe('escapeLike', () => {

    describe('Independent Paths', () => {

        it('escapeLike_Path1_emptyString_returnsEmpty', () => {
            const input: string = '';

            const result = escapeLike(input);

            expect(result).toBe('');
        });

        it('escapeLike_Path1_noSpecialChars_returnsUnchanged', () => {
            const input: string = 'hello';

            const result = escapeLike(input);

            expect(result).toBe('hello');
        });

        it('escapeLike_Path1_percentChar_returnsEscapedPercent', () => {
            const input: string = '50%';

            const result = escapeLike(input);

            expect(result).toBe('50\\%');
        });

        it('escapeLike_Path1_underscoreChar_returnsEscapedUnderscore', () => {
            const input: string = 'col_name';

            const result = escapeLike(input);

            expect(result).toBe('col\\_name');
        });

        it('escapeLike_Path1_backslashChar_returnsEscapedBackslash', () => {
            const input: string = 'C:\\path';

            const result = escapeLike(input);

            expect(result).toBe('C:\\\\path');
        });

        it('escapeLike_Path1_allSpecialChars_returnsAllEscaped', () => {
            const input: string = '%_\\';

            const result = escapeLike(input);

            expect(result).toBe('\\%\\_\\\\');
        });

    });

});

/**
 * Frontend test for TailwindCSS.
 */
describe('cn utility', () => {
    it('merges tailwind classes correctly', () => {
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
});