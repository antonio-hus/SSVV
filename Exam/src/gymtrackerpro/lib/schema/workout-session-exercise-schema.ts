import {z} from 'zod';

/**
 * Schema for creating a workout session exercise.
 */
export const createWorkoutSessionExerciseSchema = z.object({
    workoutSessionId: z
        .string()
        .min(1, 'Session is required')
        .describe('ID of the workout session'),
    exerciseId: z
        .string()
        .min(1, 'Exercise is required')
        .describe('ID of the exercise'),
    sets: z
        .coerce
        .number()
        .min(0, 'Sets must be greater or equal to 0')
        .max(6, 'Sets must be at most 6')
        .describe('Number of sets performed'),
    reps: z
        .coerce
        .number()
        .min(0, 'Reps must be greater or equal to 0')
        .max(30, 'Reps must be at most 30')
        .describe('Number of repetitions per set'),
    weight: z
        .coerce
        .number()
        .min(0, 'Weight must be greater or equal to 0.0')
        .max(500, 'Weight must be at most 500.0')
        .describe('Weight used in the exercise'),
});

/**
 * Schema for updating a workout session exercise.
 * All fields are optional, but min/max validation is preserved.
 */
export const updateWorkoutSessionExerciseSchema = z.object({
    sets: z
        .coerce
        .number()
        .min(0, 'Sets must be greater or equal to 0')
        .max(6, 'Sets must be at most 6')
        .optional()
        .describe('Updated number of sets performed'),
    reps: z
        .coerce
        .number()
        .min(0, 'Reps must be greater or equal to 0')
        .max(30, 'Reps must be at most 30')
        .optional()
        .describe('Updated number of repetitions per set'),
    weight: z
        .coerce
        .number()
        .min(0, 'Weight must be greater or equal to 0.0')
        .max(500, 'Weight must be at most 500.0')
        .optional()
        .describe('Updated weight used in the exercise'),
});

/** Input type for creating a workout session exercise. */
export type CreateWorkoutSessionExerciseInput = z.infer<typeof createWorkoutSessionExerciseSchema>;

/** Input type for updating a workout session exercise. */
export type UpdateWorkoutSessionExerciseInput = z.infer<typeof updateWorkoutSessionExerciseSchema>;