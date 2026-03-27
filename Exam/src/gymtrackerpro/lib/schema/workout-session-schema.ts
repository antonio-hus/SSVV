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
 * All fields are optional, but validations are preserved.
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

/** Input type for creating a workout session. */
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;

/** Input type for updating a workout session. */
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;