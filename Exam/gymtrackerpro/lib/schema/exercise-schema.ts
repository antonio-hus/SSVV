import {z} from 'zod';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';

const exerciseFields = {
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
