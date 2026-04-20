import {z} from 'zod';
import {isoDateRegex} from "@/lib/schema/utils";

const sessionFields = {
    date: z
        .string()
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
};

const exerciseFields = {
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
};

/** Schema for creating a workout session. */
export const createWorkoutSessionSchema = z.object({
    memberId: z
        .string()
        .min(1, 'Member is required')
        .describe('ID of the member'),
    ...sessionFields,
    date: sessionFields.date.min(1, 'Date is required'),
});

/** Schema for updating a workout session. All fields are optional. */
export const updateWorkoutSessionSchema = z.object({
    date: sessionFields.date.optional(),
    duration: sessionFields.duration.optional(),
    notes: sessionFields.notes,
});

/** Schema for a single exercise entry. */
export const workoutSessionExerciseSchema = z.object(exerciseFields);

/** Schema for a list of exercise entries. Requires at least one. */
export const workoutSessionExercisesSchema = z
    .array(workoutSessionExerciseSchema)
    .min(1, 'At least one exercise is required');

/** Schema for a single exercise entry in a session update. The optional `id` identifies an existing row; omit for new rows. */
export const workoutSessionExerciseUpdateSchema = z.object({
    id: z.string().optional(),
    ...exerciseFields,
});

/** Schema for a list of exercise entries in a session update. Requires at least one. */
export const workoutSessionExercisesUpdateSchema = z
    .array(workoutSessionExerciseUpdateSchema)
    .min(1, 'At least one exercise is required');

/** Input type for creating a workout session. */
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;

/** Input type for updating a workout session. */
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;

/** Input type for a single exercise entry when creating a session. */
export type WorkoutSessionExerciseInput = z.infer<typeof workoutSessionExerciseSchema>;

/** Input type for a single exercise entry when updating a session. */
export type WorkoutSessionExerciseUpdateInput = z.infer<typeof workoutSessionExerciseUpdateSchema>;
