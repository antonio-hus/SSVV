'use server';

import {exerciseService} from '@/lib/di';
import {ActionResult} from '@/lib/domain/action-result';
import {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateExerciseInput, createExerciseSchema, UpdateExerciseInput, updateExerciseSchema} from '@/lib/schema/exercise-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Validates the input and creates a new exercise in the catalogue.
 *
 * @param data - Exercise creation input including name, muscle group, and equipment.
 * @returns The newly created exercise, or a validation error.
 */
export async function createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>> {
    const result = createExerciseSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await exerciseService.createExercise(result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Retrieves a single exercise by its ID.
 *
 * @param id - The exercise ID.
 * @returns The matching exercise, or a not-found error.
 */
export async function getExercise(id: string): Promise<ActionResult<Exercise>> {
    try {
        return {success: true, data: await exerciseService.getExercise(id)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Returns a paginated list of exercises, optionally filtered by name, muscle group, or equipment.
 *
 * @param options - Optional filter and pagination parameters.
 * @returns A page of exercises and the total count.
 */
export async function listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>> {
    try {
        return {success: true, data: await exerciseService.listExercises(options)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and updates an existing exercise.
 *
 * @param id - The exercise ID.
 * @param data - Fields to update (all optional).
 * @returns The updated exercise, or a validation/not-found error.
 */
export async function updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>> {
    const result = updateExerciseSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await exerciseService.updateExercise(id, result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Archives an exercise, hiding it from active use without deleting it.
 *
 * @param id - The exercise ID.
 * @returns The archived exercise, or a not-found error.
 */
export async function archiveExercise(id: string): Promise<ActionResult<Exercise>> {
    try {
        return {success: true, data: await exerciseService.archiveExercise(id)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Restores a previously archived exercise back to active status.
 *
 * @param id - The exercise ID.
 * @returns The unarchived exercise, or a not-found error.
 */
export async function unarchiveExercise(id: string): Promise<ActionResult<Exercise>> {
    try {
        return {success: true, data: await exerciseService.unarchiveExercise(id)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Permanently deletes an exercise from the catalogue.
 *
 * @param id - The exercise ID.
 * @returns A success result with no data, or a not-found error.
 */
export async function deleteExercise(id: string): Promise<ActionResult<void>> {
    try {
        await exerciseService.deleteExercise(id);
        return {success: true, data: undefined};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}
