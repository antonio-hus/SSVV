import { z } from 'zod';
import { MuscleGroup, Equipment } from '@/lib/domain/exercise';

/**
 * Reusable validation rules for exercise fields.
 */
const exerciseFields = {
    /**
     * The name of the exercise.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Minimum length: 8 characters
     * - Maximum length: 64 characters
     */
    name: z
        .string()
        .trim()
        .min(8, 'Name must be at least 8 characters')
        .max(64, 'Name must be at most 64 characters')
        .describe('Name of the exercise'),

    /**
     * Optional description providing additional details about the exercise.
     *
     * Constraints:
     * - Must be a string if provided
     * - Leading and trailing whitespace is trimmed
     * - Maximum length: 1024 characters
     * - Field is optional
     */
    description: z
        .string()
        .trim()
        .max(1024, 'Description must be at most 1024 characters')
        .optional()
        .describe('Optional description of the exercise'),

    /**
     * The primary muscle group targeted by the exercise.
     *
     * Constraints:
     * - Must be one of the predefined {@link MuscleGroup} enum values
     * - Required field
     */
    muscleGroup: z
        .enum(Object.values(MuscleGroup), { error: 'Invalid muscle group' })
        .describe('Muscle group targeted by the exercise'),

    /**
     * The equipment required to perform the exercise.
     *
     * Constraints:
     * - Must be one of the predefined {@link Equipment} enum values
     * - Required field
     */
    equipmentNeeded: z
        .enum(Object.values(Equipment), { error: 'Invalid equipment' })
        .describe('Equipment required for the exercise'),
};

/** Schema for creating a new exercise. */
export const createExerciseSchema = z.object(exerciseFields);

/** Schema for updating an existing exercise. All fields are optional. */
export const updateExerciseSchema = z.object({
    name: exerciseFields.name.optional(),
    description: exerciseFields.description,
    muscleGroup: exerciseFields.muscleGroup.optional(),
    equipmentNeeded: exerciseFields.equipmentNeeded.optional(),
});

/** Input type for creating an exercise. */
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

/** Input type for updating an exercise. */
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;