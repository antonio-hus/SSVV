import {escapeLike} from '@/lib/utils';

describe('escapeLike', () => {
    describe('Equivalence Classes', () => {
        it('escapeLike_EC_plainString_returnsUnchanged', () => {
            // Arrange
            const input: string = 'benchpress';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('benchpress');
        });

        it('escapeLike_EC_emptyString_returnsEmptyString', () => {
            // Arrange
            const input: string = '';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('');
        });

        it('escapeLike_EC_containsPercent_escapesPercent', () => {
            // Arrange
            const input: string = '100%';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('100\\%');
        });

        it('escapeLike_EC_containsUnderscore_escapesUnderscore', () => {
            // Arrange
            const input: string = 'bench_press';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('bench\\_press');
        });

        it('escapeLike_EC_containsBackslash_escapesBackslash', () => {
            // Arrange
            const input: string = 'path\\value';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('path\\\\value');
        });

        it('escapeLike_EC_containsAllSpecialChars_escapesAll', () => {
            // Arrange
            const input: string = '100%_bench\\press';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('100\\%\\_bench\\\\press');
        });

        it('escapeLike_EC_multiplePercents_escapesAll', () => {
            // Arrange
            const input: string = '%%';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_EC_multipleUnderscores_escapesAll', () => {
            // Arrange
            const input: string = '__';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_EC_multipleBackslashes_escapesAll', () => {
            // Arrange
            const input: string = '\\\\';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\\\\\\\');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('escapeLike_BVA_lengthZero_returnsEmptyString', () => {
            // Arrange
            const input: string = '';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('');
        });

        it('escapeLike_BVA_lengthOne_plainChar_returnsUnchanged', () => {
            // Arrange
            const input: string = 'a';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('a');
        });

        it('escapeLike_BVA_lengthOne_percent_escapesPercent', () => {
            // Arrange
            const input: string = '%';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\%');
        });

        it('escapeLike_BVA_lengthOne_underscore_escapesUnderscore', () => {
            // Arrange
            const input: string = '_';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\_');
        });

        it('escapeLike_BVA_lengthOne_backslash_escapesBackslash', () => {
            // Arrange
            const input: string = '\\';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\\\');
        });

        it('escapeLike_BVA_lengthTwo_plainChars_returnsUnchanged', () => {
            // Arrange
            const input: string = 'ab';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('ab');
        });

        it('escapeLike_BVA_lengthTwo_twoPercents_escapesBoth', () => {
            // Arrange
            const input: string = '%%';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\%\\%');
        });

        it('escapeLike_BVA_lengthTwo_twoUnderscores_escapesBoth', () => {
            // Arrange
            const input: string = '__';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\_\\_');
        });

        it('escapeLike_BVA_lengthTwo_twoBackslashes_escapesBoth', () => {
            // Arrange
            const input: string = '\\\\';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\\\\\\\');
        });
    });
});