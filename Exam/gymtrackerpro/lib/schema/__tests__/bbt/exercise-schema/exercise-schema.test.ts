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
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_descriptionAbsent_parsesSuccessfully', () => {
            const inputExercise = {
                name: 'Bench Press',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_descriptionEmptyString_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ''
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_invalidMuscleGroup_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                muscleGroup: 'INVALID'
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_invalidEquipment_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                equipmentNeeded: 'INVALID'
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_missingName_returnsValidationError', () => {
            const inputExercise = {
                description: 'Desc',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_nameEmptyString_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ''
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_nameWhitespaceOnly_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: '         '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_nameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: '  Bench Press  '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_descriptionWhitespaceOnly_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: '     '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_descriptionWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: '  some description  '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_EC_missingMuscleGroup_returnsValidationError', () => {
            const inputExercise = {
                name: 'Bench Press',
                description: 'Desc',
                equipmentNeeded: Equipment.BARBELL,
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_EC_missingEquipment_returnsValidationError', () => {
            const inputExercise = {
                name: 'Bench Press',
                description: 'Desc',
                muscleGroup: MuscleGroup.CHEST,
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createExerciseSchema_BVA_name7Chars_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(7)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_BVA_name8Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(8)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_name9Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(9)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_name63Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(63)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_name64Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(64)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_name65Chars_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: 'A'.repeat(65)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_BVA_nameWhitespace8Chars_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ' '.repeat(8)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_BVA_namePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(8) + ' '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_namePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(64) + ' '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_namePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                name: ' ' + 'A'.repeat(65) + ' '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_BVA_description0Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ''
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_description1Char_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_description1023Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1023)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_description1024Chars_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1024)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_description1025Chars_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                description: 'A'.repeat(1025)
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });

        it('createExerciseSchema_BVA_descriptionPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            const inputExercise: CreateExerciseInput = {
                ...VALID_EXERCISE,
                description: ' ' + 'A'.repeat(1024) + ' '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_BVA_descriptionPadded1025CharsAfterTrim_returnsValidationError', () => {
            const inputExercise = {
                ...VALID_EXERCISE,
                description: ' ' + 'A'.repeat(1025) + ' '
            };

            const result = createExerciseSchema.safeParse(inputExercise);

            expect(result.success).toBe(false);
        });
    });
});

describe('updateExerciseSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateExerciseSchema_EC_emptyObject_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {};

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_validNameOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: 'New Name'
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_validDescriptionOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: 'Updated description text'
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_validMuscleGroupOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                muscleGroup: MuscleGroup.CHEST
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_validEquipmentOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                equipmentNeeded: Equipment.BARBELL
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_invalidMuscleGroup_returnsValidationError', () => {
            const inputUpdate = {
                muscleGroup: 'INVALID'
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_EC_invalidEquipment_returnsValidationError', () => {
            const inputUpdate = {
                equipmentNeeded: 'INVALID'
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_EC_nameWhitespaceOnly_returnsValidationError', () => {
            const inputUpdate = {
                name: '         '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_EC_nameWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: '  New Exercise Name  '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_descriptionWhitespaceOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: '     '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_EC_descriptionWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: '  updated description  '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateExerciseSchema_BVA_name7Chars_returnsValidationError', () => {
            const inputUpdate = {
                name: 'A'.repeat(7)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_BVA_name8Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(8)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_name9Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(9)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_name63Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(63)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_name64Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: 'A'.repeat(64)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_name65Chars_returnsValidationError', () => {
            const inputUpdate = {
                name: 'A'.repeat(65)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_BVA_nameWhitespace8Chars_returnsValidationError', () => {
            const inputUpdate = {
                name: ' '.repeat(8)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_BVA_namePadded8CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: ' ' + 'A'.repeat(8) + ' '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_namePadded64CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                name: ' ' + 'A'.repeat(64) + ' '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_namePadded65CharsAfterTrim_returnsValidationError', () => {
            const inputUpdate = {
                name: ' ' + 'A'.repeat(65) + ' '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_BVA_description0Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: ''
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_description1Char_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_description1023Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'.repeat(1023)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_description1024Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: 'A'.repeat(1024)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_description1025Chars_returnsValidationError', () => {
            const inputUpdate = {
                description: 'A'.repeat(1025)
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });

        it('updateExerciseSchema_BVA_descriptionPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateExerciseInput = {
                description: ' ' + 'A'.repeat(1024) + ' '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_BVA_descriptionPadded1025CharsAfterTrim_returnsValidationError', () => {
            const inputUpdate = {
                description: ' ' + 'A'.repeat(1025) + ' '
            };

            const result = updateExerciseSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
        });
    });
});