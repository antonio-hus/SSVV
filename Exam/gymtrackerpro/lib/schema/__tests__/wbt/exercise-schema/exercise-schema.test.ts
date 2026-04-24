import {createExerciseSchema, updateExerciseSchema} from '@/lib/schema/exercise-schema';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';

describe('createExerciseSchema', () => {

    describe('Independent Paths', () => {

        it('createExerciseSchema_Path1_validInputAllFields_returnsSuccess', () => {
            const inputData = {
                name: 'Bicep Curls',
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_Path2_nameInvalidType_returnsError', () => {
            const inputData = {
                name: 123 as never,
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_Path3_nameTooShort_returnsError', () => {
            const inputData = {
                name: 'Short',
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
                expect(result.error.issues[0].message).toBe('Name must be at least 8 characters');
            }
        });

        it('createExerciseSchema_Path4_nameTooLong_returnsError', () => {
            const inputData = {
                name: 'A'.repeat(65),
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
                expect(result.error.issues[0].message).toBe('Name must be at most 64 characters');
            }
        });

        it('createExerciseSchema_Path5_descriptionTooLong_returnsError', () => {
            const inputData = {
                name: 'Bicep Curls',
                description: 'A'.repeat(1025),
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
                expect(result.error.issues[0].message).toBe('Description must be at most 1024 characters');
            }
        });

        it('createExerciseSchema_Path6_descriptionUndefined_returnsSuccess', () => {
            const inputData = {
                name: 'Bicep Curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_Path7_descriptionInvalidType_returnsError', () => {
            const inputData = {
                name: 'Bicep Curls',
                description: 123 as never,
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('createExerciseSchema_Path8_muscleGroupInvalidEnum_returnsError', () => {
            const inputData = {
                name: 'Bicep Curls',
                description: 'Curls',
                muscleGroup: 'INVALID' as never,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('createExerciseSchema_Path9_equipmentNeededInvalidEnum_returnsError', () => {
            const inputData = {
                name: 'Bicep Curls',
                description: 'Curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: 'INVALID' as never,
            };

            const result = createExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });

    });

});

describe('updateExerciseSchema', () => {

    describe('Independent Paths', () => {

        it('updateExerciseSchema_Path1_allFieldsUndefined_returnsSuccess', () => {
            const inputData = {};

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path2_nameValidStringWithinLength_returnsSuccess', () => {
            const inputData = {
                name: 'Bicep Curls',
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path3_descriptionValidStringWithinLength_returnsSuccess', () => {
            const inputData = {
                description: 'Updated description',
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path4_muscleGroupValidEnumValue_returnsSuccess', () => {
            const inputData = {
                muscleGroup: MuscleGroup.ARMS,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path5_equipmentNeededValidEnumValue_returnsSuccess', () => {
            const inputData = {
                equipmentNeeded: Equipment.DUMBBELL,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path6_nameInvalidType_returnsError', () => {
            const inputData = {
                name: 123 as never,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path7_nameTooShort_returnsError', () => {
            const inputData = {
                name: 'Short',
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path8_nameTooLong_returnsError', () => {
            const inputData = {
                name: 'A'.repeat(65),
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path9_descriptionInvalidType_returnsError', () => {
            const inputData = {
                description: 123 as never,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('updateExerciseSchema_Path10_descriptionTooLong_returnsError', () => {
            const inputData = {
                description: 'A'.repeat(1025),
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('updateExerciseSchema_Path11_muscleGroupInvalidEnum_returnsError', () => {
            const inputData = {
                muscleGroup: 'INVALID' as never,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('updateExerciseSchema_Path12_equipmentNeededInvalidEnum_returnsError', () => {
            const inputData = {
                equipmentNeeded: 'INVALID' as never,
            };

            const result = updateExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });

    });

});
