import {escapeLike} from '@/lib/utils';

describe('escapeLike', () => {
    describe('Equivalence Classes', () => {
        it('escapeLike_EC_plainString_returnsUnchanged', () => {
            const input: string = 'benchpress';

            const result = escapeLike(input);

            expect(result).toBe('benchpress');
        });

        it('escapeLike_EC_emptyString_returnsEmptyString', () => {
            const input: string = '';

            const result = escapeLike(input);

            expect(result).toBe('');
        });

        it('escapeLike_EC_containsPercent_escapesPercent', () => {
            const input: string = '100%';

            const result = escapeLike(input);

            expect(result).toBe('100\\%');
        });

        it('escapeLike_EC_containsUnderscore_escapesUnderscore', () => {
            const input: string = 'bench_press';

            const result = escapeLike(input);

            expect(result).toBe('bench\\_press');
        });

        it('escapeLike_EC_containsBackslash_escapesBackslash', () => {
            const input: string = 'path\\value';

            const result = escapeLike(input);

            expect(result).toBe('path\\\\value');
        });

        it('escapeLike_EC_containsAllSpecialChars_escapesAll', () => {
            const input: string = '100%_bench\\press';

            const result = escapeLike(input);

            expect(result).toBe('100\\%\\_bench\\\\press');
        });

        it('escapeLike_EC_multiplePercents_escapesAll', () => {
            const input: string = '%%';

            const result = escapeLike(input);

            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_EC_multipleUnderscores_escapesAll', () => {
            const input: string = '__';

            const result = escapeLike(input);

            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_EC_multipleBackslashes_escapesAll', () => {
            const input: string = '\\\\';

            const result = escapeLike(input);

            expect(result).toBe('\\\\\\\\');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('escapeLike_BVA_lengthZero_returnsEmptyString', () => {
            const input: string = '';

            const result = escapeLike(input);

            expect(result).toBe('');
        });

        it('escapeLike_BVA_lengthOne_plainChar_returnsUnchanged', () => {
            const input: string = 'a';

            const result = escapeLike(input);

            expect(result).toBe('a');
        });

        it('escapeLike_BVA_lengthOne_percent_escapesPercent', () => {
            const input: string = '%';

            const result = escapeLike(input);

            expect(result).toBe('\\%');
        });

        it('escapeLike_BVA_lengthOne_underscore_escapesUnderscore', () => {
            const input: string = '_';

            const result = escapeLike(input);

            expect(result).toBe('\\_');
        });

        it('escapeLike_BVA_lengthOne_backslash_escapesBackslash', () => {
            const input: string = '\\';

            const result = escapeLike(input);

            expect(result).toBe('\\\\');
        });

        it('escapeLike_BVA_lengthTwo_plainChars_returnsUnchanged', () => {
            const input: string = 'ab';

            const result = escapeLike(input);

            expect(result).toBe('ab');
        });

        it('escapeLike_BVA_lengthTwo_twoPercents_escapesBoth', () => {
            const input: string = '%%';

            const result = escapeLike(input);

            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_BVA_lengthTwo_twoUnderscores_escapesBoth', () => {
            const input: string = '__';

            const result = escapeLike(input);

            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_BVA_lengthTwo_twoBackslashes_escapesBoth', () => {
            const input: string = '\\\\';

            const result = escapeLike(input);

            expect(result).toBe('\\\\\\\\');
        });
    });
});