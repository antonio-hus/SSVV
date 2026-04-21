import {escapeLike} from '@/lib/utils';

describe('escapeLike', () => {
    describe('Equivalence Classes', () => {
        it('escapeLike_EC_plainString_returnsUnchanged', () => {
            const result = escapeLike('benchpress');
            expect(result).toBe('benchpress');
        });

        it('escapeLike_EC_emptyString_returnsEmptyString', () => {
            const result = escapeLike('');
            expect(result).toBe('');
        });

        it('escapeLike_EC_containsPercent_escapesPercent', () => {
            const result = escapeLike('100%');
            expect(result).toBe('100\\%');
        });

        it('escapeLike_EC_containsUnderscore_escapesUnderscore', () => {
            const result = escapeLike('bench_press');
            expect(result).toBe('bench\\_press');
        });

        it('escapeLike_EC_containsBackslash_escapesBackslash', () => {
            const result = escapeLike('path\\value');
            expect(result).toBe('path\\\\value');
        });

        it('escapeLike_EC_containsAllSpecialChars_escapesAll', () => {
            const result = escapeLike('100%_bench\\press');
            expect(result).toBe('100\\%\\_bench\\\\press');
        });

        it('escapeLike_EC_multiplePercents_escapesAll', () => {
            const result = escapeLike('%%');
            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_EC_multipleUnderscores_escapesAll', () => {
            const result = escapeLike('__');
            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_EC_multipleBackslashes_escapesAll', () => {
            const result = escapeLike('\\\\');
            expect(result).toBe('\\\\\\\\');
        });

    });

    describe('Boundary Value Analysis', () => {
        it('escapeLike_BVA_lengthZero_returnsEmptyString', () => {
            const result = escapeLike('');
            expect(result).toBe('');
        });

        it('escapeLike_BVA_lengthOne_plainChar_returnsUnchanged', () => {
            const result = escapeLike('a');
            expect(result).toBe('a');
        });

        it('escapeLike_BVA_lengthOne_percent_escapesPercent', () => {
            const result = escapeLike('%');
            expect(result).toBe('\\%');
        });

        it('escapeLike_BVA_lengthOne_underscore_escapesUnderscore', () => {
            const result = escapeLike('_');
            expect(result).toBe('\\_');
        });

        it('escapeLike_BVA_lengthOne_backslash_escapesBackslash', () => {
            const result = escapeLike('\\');
            expect(result).toBe('\\\\');
        });

        it('escapeLike_BVA_lengthTwo_plainChars_returnsUnchanged', () => {
            const result = escapeLike('ab');
            expect(result).toBe('ab');
        });

        it('escapeLike_BVA_lengthTwo_twoPercents_escapesBoth', () => {
            const result = escapeLike('%%');
            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_BVA_lengthTwo_twoUnderscores_escapesBoth', () => {
            const result = escapeLike('__');
            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_BVA_lengthTwo_twoBackslashes_escapesBoth', () => {
            const result = escapeLike('\\\\');
            expect(result).toBe('\\\\\\\\');
        });
    });
});