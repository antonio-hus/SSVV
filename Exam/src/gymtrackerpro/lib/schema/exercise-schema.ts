import {z} from 'zod';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';

/**
 * Schema for creating a new exercise.
 */
export const createExerciseSchema = z.object({
    name: z
        .string()
        .min(8, 'Name must be at least 8 characters')
        .max(64, 'Name must be at most 64 characters')
        .describe('Name of the exercise'),
    description: z
        .string()
        .max(1024, 'Description must be at most 1024 characters')
        .optional()
        .describe('Optional description of the exercise'),
    muscleGroup: z
        .enum(Object.values(MuscleGroup), {error: 'Invalid muscle group'})
        .describe('Muscle group targeted by the exercise'),
    equipmentNeeded: z
        .enum(Object.values(Equipment), {error: 'Invalid equipment'})
        .describe('Equipment required for the exercise'),
});

/**
 * Schema for updating an existing exercise.
 */
export const updateExerciseSchema = z.object({
    name: z
        .string()
        .min(8, 'Name must be at least 8 characters')
        .max(64, 'Name must be at most 64 characters')
        .optional()
        .describe('Updated name of the exercise'),
    description: z
        .string()
        .max(1024, 'Description must be at most 1024 characters')
        .optional()
        .describe('Updated description of the exercise'),
    muscleGroup: z
        .enum(Object.values(MuscleGroup), {error: 'Invalid muscle group'})
        .optional()
        .describe('Updated muscle group targeted by the exercise'),
    equipmentNeeded: z
        .enum(Object.values(Equipment), {error: 'Invalid equipment'})
        .optional()
        .describe('Updated equipment required for the exercise'),
});

/** Input type for creating an exercise. */
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

/** Input type for updating an exercise. */
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;