import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {
    CreateExerciseInput,
    createExerciseSchema,
    UpdateExerciseInput,
    updateExerciseSchema
} from '@/lib/schema/exercise-schema';

const VALID_EXERCISE: CreateExerciseInput = {
    name: 'Bench Press',
    description: 'Classic chest compound exercise with a barbell',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
};

describe('createExerciseSchema', () => {
    describe('Equivalence Classes', () => {
        it('createExerciseSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputExercise);
            }
        });

        it('createExerciseSchema_EC_descriptionAbsent_parsesSuccessfully', () => {
            // Arrange
            const inputExercise = {
                name: 'Bench Press',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputExercise.name);
                expect(result.data.description).toBeUndefined();
            }
        });

        it('createExerciseSchema_EC_descriptionEmptyString_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ''
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('');
            }
        });

        it('createExerciseSchema_EC_invalidMuscleGroup_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                muscleGroup: 'INVALID'
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('createExerciseSchema_EC_invalidEquipment_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                equipmentNeeded: 'INVALID'
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });

        it('createExerciseSchema_EC_missingName_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                description: 'Desc',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_EC_nameEmptyString_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ''
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_EC_nameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: '         '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_EC_nameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: '  Bench Press  '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Bench Press');
            }
        });

        it('createExerciseSchema_EC_descriptionWhitespaceOnly_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: '     '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('');
            }
        });

        it('createExerciseSchema_EC_descriptionWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: '  some description  '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('some description');
            }
        });

        it('createExerciseSchema_EC_missingMuscleGroup_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                name: 'Bench Press',
                description: 'Desc',
                equipmentNeeded: Equipment.BARBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('createExerciseSchema_EC_missingEquipment_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                name: 'Bench Press',
                description: 'Desc',
                muscleGroup: MuscleGroup.CHEST,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createExerciseSchema_BVA_name7Chars_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(7)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_BVA_name8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(8)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(8));
            }
        });

        it('createExerciseSchema_BVA_name9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(9)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(9));
            }
        });

        it('createExerciseSchema_BVA_name63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(63)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(63));
            }
        });

        it('createExerciseSchema_BVA_name64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(64)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(64));
            }
        });

        it('createExerciseSchema_BVA_name65Chars_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(65)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_BVA_nameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ' '.repeat(8)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_BVA_namePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(8));
            }
        });

        it('createExerciseSchema_BVA_namePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(64));
            }
        });

        it('createExerciseSchema_BVA_namePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_BVA_description0Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ''
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('');
            }
        });

        it('createExerciseSchema_BVA_description1Char_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A');
            }
        });

        it('createExerciseSchema_BVA_description1023Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1023)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1023));
            }
        });

        it('createExerciseSchema_BVA_description1024Chars_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1024)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1024));
            }
        });

        it('createExerciseSchema_BVA_description1025Chars_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1025)
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('createExerciseSchema_BVA_descriptionPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ' ' + 'A'.repeat(1024) + ' '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1024));
            }
        });

        it('createExerciseSchema_BVA_descriptionPadded1025CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputExercise = {
                ...VALID_EXERCISE,
                description: ' ' + 'A'.repeat(1025) + ' '
            };

            // Act
            const result = createExerciseSchema.safeParse(inputExercise);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });
    });
});

describe('updateExerciseSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateExerciseSchema_EC_emptyObject_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {};

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateExerciseSchema_EC_validNameOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: 'New Name'
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('New Name');
            }
        });

        it('updateExerciseSchema_EC_validDescriptionOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: 'Updated description text'
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('Updated description text');
            }
        });

        it('updateExerciseSchema_EC_validMuscleGroupOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                muscleGroup: MuscleGroup.CHEST
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.CHEST);
            }
        });

        it('updateExerciseSchema_EC_validEquipmentOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                equipmentNeeded: Equipment.BARBELL
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.BARBELL);
            }
        });

        it('updateExerciseSchema_EC_invalidMuscleGroup_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                muscleGroup: 'INVALID'
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('updateExerciseSchema_EC_invalidEquipment_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                equipmentNeeded: 'INVALID'
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });

        it('updateExerciseSchema_EC_nameWhitespaceOnly_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                name: '         '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_EC_nameWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: '  New Exercise Name  '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('New Exercise Name');
            }
        });

        it('updateExerciseSchema_EC_descriptionWhitespaceOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: '     '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('');
            }
        });

        it('updateExerciseSchema_EC_descriptionWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: '  updated description  '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('updated description');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateExerciseSchema_BVA_name7Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                name: 'A'.repeat(7)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_BVA_name8Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(8)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(8));
            }
        });

        it('updateExerciseSchema_BVA_name9Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(9)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(9));
            }
        });

        it('updateExerciseSchema_BVA_name63Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(63)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(63));
            }
        });

        it('updateExerciseSchema_BVA_name64Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(64)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(64));
            }
        });

        it('updateExerciseSchema_BVA_name65Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                name: 'A'.repeat(65)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_BVA_nameWhitespace8Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                name: ' '.repeat(8)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_BVA_namePadded8CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: ' ' + 'A'.repeat(8) + ' '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(8));
            }
        });

        it('updateExerciseSchema_BVA_namePadded64CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                name: ' ' + 'A'.repeat(64) + ' '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('A'.repeat(64));
            }
        });

        it('updateExerciseSchema_BVA_namePadded65CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                name: ' ' + 'A'.repeat(65) + ' '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_BVA_description0Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: ''
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('');
            }
        });

        it('updateExerciseSchema_BVA_description1Char_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A');
            }
        });

        it('updateExerciseSchema_BVA_description1023Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'.repeat(1023)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1023));
            }
        });

        it('updateExerciseSchema_BVA_description1024Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'.repeat(1024)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1024));
            }
        });

        it('updateExerciseSchema_BVA_description1025Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                description: 'A'.repeat(1025)
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('updateExerciseSchema_BVA_descriptionPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateExerciseInput = {
                description: ' ' + 'A'.repeat(1024) + ' '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('A'.repeat(1024));
            }
        });

        it('updateExerciseSchema_BVA_descriptionPadded1025CharsAfterTrim_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                description: ' ' + 'A'.repeat(1025) + ' '
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });
    });
});
