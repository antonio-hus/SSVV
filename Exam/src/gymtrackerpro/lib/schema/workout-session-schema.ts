import {z} from 'zod';
import {isoDateRegex} from "@/lib/schema/utils";

/**
 * Schema for creating a workout session.
 */
export const createWorkoutSessionSchema = z.object({
    memberId: z
        .string()
        .min(1, 'Member is required')
        .describe('ID of the member'),
    date: z
        .string()
        .min(1, 'Date is required')
        .regex(isoDateRegex, 'Date must be in YYYY-MM-DD format')
        .describe('Date of the workout session in YYYY-MM-DD format'),
    duration: z
        .coerce
        .number()
        .min(0, 'Duration must be greater or equal to 0')
        .max(180, 'Duration must be at most 180 minutes')
        .describe('Duration of the workout session in minutes'),
    notes: z
        .string()
        .max(1024, 'Notes must be at most 1024 characters')
        .optional()
        .describe('Optional notes for the session'),
});

/**
 * Schema for updating a workout session.
 */
export const updateWorkoutSessionSchema = z.object({
    date: z
        .string()
        .regex(isoDateRegex, 'Date must be in YYYY-MM-DD format')
        .optional()
        .describe('Updated date of the workout session in YYYY-MM-DD format'),
    duration: z
        .coerce
        .number()
        .min(0, 'Duration must be greater or equal to 0')
        .max(180, 'Duration must be at most 180 minutes')
        .optional()
        .describe('Updated duration of the workout session in minutes'),
    notes: z
        .string()
        .max(1024, 'Notes must be at most 1024 characters')
        .optional()
        .describe('Updated optional notes for the session'),
});

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

/** Input type for creating a workout session. */
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;

/** Input type for updating a workout session. */
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;

/** Input type for creating a workout session exercise. */
export type CreateWorkoutSessionExerciseInput = z.infer<typeof createWorkoutSessionExerciseSchema>;

/** Input type for updating a workout session exercise. */
export type UpdateWorkoutSessionExerciseInput = z.infer<typeof updateWorkoutSessionExerciseSchema>;