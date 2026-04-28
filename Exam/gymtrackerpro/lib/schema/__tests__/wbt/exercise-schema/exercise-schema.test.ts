import {createExerciseSchema, updateExerciseSchema} from '@/lib/schema/exercise-schema';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';

describe('createExerciseSchema', () => {

    describe('Independent Paths', () => {

        it('createExerciseSchema_Path1_validInputAllFields_returnsSuccess', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_Path2_nameInvalidType_returnsError', () => {
            // Arrange
            const inputData = {
                name: 123 as never,
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('createExerciseSchema_Path3_nameTooShort_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Short',
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
                expect(result.error.issues[0].message).toBe('Name must be at least 8 characters');
            }
        });

        it('createExerciseSchema_Path4_nameTooLong_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'A'.repeat(65),
                description: 'Standard curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
                expect(result.error.issues[0].message).toBe('Name must be at most 64 characters');
            }
        });

        it('createExerciseSchema_Path5_descriptionTooLong_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                description: 'A'.repeat(1025),
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
                expect(result.error.issues[0].message).toBe('Description must be at most 1024 characters');
            }
        });

        it('createExerciseSchema_Path6_descriptionUndefined_returnsSuccess', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createExerciseSchema_Path7_descriptionInvalidType_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                description: 123 as never,
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('createExerciseSchema_Path8_muscleGroupInvalidEnum_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                description: 'Curls',
                muscleGroup: 'INVALID' as never,
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('createExerciseSchema_Path9_equipmentNeededInvalidEnum_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
                description: 'Curls',
                muscleGroup: MuscleGroup.ARMS,
                equipmentNeeded: 'INVALID' as never,
            };

            // Act
            const result = createExerciseSchema.safeParse(inputData);

            // Assert
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
            // Arrange
            const inputData = {};

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path2_nameValidStringWithinLength_returnsSuccess', () => {
            // Arrange
            const inputData = {
                name: 'Bicep Curls',
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path3_descriptionValidStringWithinLength_returnsSuccess', () => {
            // Arrange
            const inputData = {
                description: 'Updated description',
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path4_muscleGroupValidEnumValue_returnsSuccess', () => {
            // Arrange
            const inputData = {
                muscleGroup: MuscleGroup.ARMS,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path5_equipmentNeededValidEnumValue_returnsSuccess', () => {
            // Arrange
            const inputData = {
                equipmentNeeded: Equipment.DUMBBELL,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateExerciseSchema_Path6_nameInvalidType_returnsError', () => {
            // Arrange
            const inputData = {
                name: 123 as never,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path7_nameTooShort_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'Short',
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path8_nameTooLong_returnsError', () => {
            // Arrange
            const inputData = {
                name: 'A'.repeat(65),
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('updateExerciseSchema_Path9_descriptionInvalidType_returnsError', () => {
            // Arrange
            const inputData = {
                description: 123 as never,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('updateExerciseSchema_Path10_descriptionTooLong_returnsError', () => {
            // Arrange
            const inputData = {
                description: 'A'.repeat(1025),
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('updateExerciseSchema_Path11_muscleGroupInvalidEnum_returnsError', () => {
            // Arrange
            const inputData = {
                muscleGroup: 'INVALID' as never,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('muscleGroup');
            }
        });

        it('updateExerciseSchema_Path12_equipmentNeededInvalidEnum_returnsError', () => {
            // Arrange
            const inputData = {
                equipmentNeeded: 'INVALID' as never,
            };

            // Act
            const result = updateExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('equipmentNeeded');
            }
        });

    });

});
