'use server';

import {workoutSessionService} from '@/lib/di';
import {ActionResult} from '@/lib/domain/action-result';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateWorkoutSessionInput, createWorkoutSessionSchema, UpdateWorkoutSessionInput, updateWorkoutSessionSchema, WorkoutSessionExerciseInput, workoutSessionExercisesSchema} from '@/lib/schema/workout-session-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Validates the session and exercise inputs, then records a new workout session.
 *
 * @param data - Session creation input including member ID, date, duration, and notes.
 * @param exercises - List of exercises performed with sets, reps, and weight.
 * @returns The newly created session with all exercises included, or a validation error.
 */
export async function createWorkoutSession(
    data: CreateWorkoutSessionInput,
    exercises: WorkoutSessionExerciseInput[],
): Promise<ActionResult<WorkoutSessionWithExercises>> {
    const sessionResult = createWorkoutSessionSchema.safeParse(data);
    if (!sessionResult.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(sessionResult.error).fieldErrors};
    }

    const exercisesResult = workoutSessionExercisesSchema.safeParse(exercises);
    if (!exercisesResult.success) {
        const flat = z.flattenError(exercisesResult.error);
        const message = flat.formErrors.length > 0 ? flat.formErrors[0] : 'Invalid exercises';
        return {success: false, message};
    }

    try {
        return {success: true, data: await workoutSessionService.createWorkoutSession(sessionResult.data, exercisesResult.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Retrieves a single workout session with all its exercises by ID.
 *
 * @param workoutSessionId - The workout session ID.
 * @returns The session with exercises included, or a not-found error.
 */
export async function getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>> {
    try {
        return {success: true, data: await workoutSessionService.getWorkoutSession(workoutSessionId)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Returns a paginated list of workout sessions for a given member.
 *
 * @param memberId - The member whose sessions to fetch.
 * @param options - Optional date range and pagination parameters.
 * @returns A page of sessions with exercises and the total count.
 */
export async function listMemberWorkoutSessions(
    memberId: string,
    options?: WorkoutSessionListOptions,
): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>> {
    try {
        return {success: true, data: await workoutSessionService.listMemberWorkoutSessions(memberId, options)};
    } catch (error) {
        if (error instanceof AppError) return {success: false, message: error.message};
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and updates an existing workout session's metadata.
 *
 * @param workoutSessionId - The workout session ID.
 * @param data - Fields to update (date, duration, notes — all optional).
 * @returns The updated session, or a validation/not-found error.
 */
export async function updateWorkoutSession(
    workoutSessionId: string,
    data: UpdateWorkoutSessionInput,
): Promise<ActionResult<WorkoutSession>> {
    const result = updateWorkoutSessionSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await workoutSessionService.updateWorkoutSession(workoutSessionId, result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Permanently deletes a workout session and its associated exercises.
 *
 * @param workoutSessionId - The workout session ID.
 * @returns A success result with no data, or a not-found error.
 */
export async function deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>> {
    try {
        await workoutSessionService.deleteWorkoutSession(workoutSessionId);
        return {success: true, data: undefined};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}
