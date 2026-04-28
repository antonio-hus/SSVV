import {cn, escapeLike} from '@/lib/utils';

describe('escapeLike', () => {

    describe('Independent Paths', () => {

        it('escapeLike_Path1_emptyString_returnsEmpty', () => {
            // Arrange
            const input: string = '';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('');
        });

        it('escapeLike_Path1_noSpecialChars_returnsUnchanged', () => {
            // Arrange
            const input: string = 'hello';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('hello');
        });

        it('escapeLike_Path1_percentChar_returnsEscapedPercent', () => {
            // Arrange
            const input: string = '50%';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('50\\%');
        });

        it('escapeLike_Path1_underscoreChar_returnsEscapedUnderscore', () => {
            // Arrange
            const input: string = 'col_name';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('col\\_name');
        });

        it('escapeLike_Path1_backslashChar_returnsEscapedBackslash', () => {
            // Arrange
            const input: string = 'C:\\path';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('C:\\\\path');
        });

        it('escapeLike_Path1_allSpecialChars_returnsAllEscaped', () => {
            // Arrange
            const input: string = '%_\\';

            // Act
            const result: string = escapeLike(input);

            // Assert
            expect(result).toBe('\\%\\_\\\\');
        });

    });

});

/**
 * TailwindCSS Utility Test.
 * Provided for enhanced coverage.
 * Not included in the scope of GymTrackerPro testing.
 */
describe('cn utility', () => {
    it('merges tailwind classes correctly', () => {
        // Assert
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
});