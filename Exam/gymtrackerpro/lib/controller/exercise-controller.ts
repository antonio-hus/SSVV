'use server';

import {ExerciseServiceInterface} from '@/lib/service/exercise-service-interface';
import {ExerciseControllerInterface} from '@/lib/controller/exercise-controller-interface';
import {ActionResult} from '@/lib/domain/action-result';
import {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateExerciseInput, createExerciseSchema, UpdateExerciseInput, updateExerciseSchema} from '@/lib/schema/exercise-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Implementation of {@link ExerciseControllerInterface} — exercise catalogue server actions.
 */
export class ExerciseController implements ExerciseControllerInterface {
    private static instance: ExerciseController;
    private readonly exerciseService: ExerciseServiceInterface;

    private constructor(exerciseService: ExerciseServiceInterface) {
        this.exerciseService = exerciseService;
    }

    /**
     * Returns the singleton instance, creating it with the given service on first call.
     *
     * @param exerciseService - The exercise service to use for catalogue operations.
     */
    static getInstance(exerciseService: ExerciseServiceInterface): ExerciseController {
        if (!ExerciseController.instance) {
            ExerciseController.instance = new ExerciseController(exerciseService);
        }
        return ExerciseController.instance;
    }

    /** @inheritdoc */
    async createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>> {
        const result = createExerciseSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.exerciseService.createExercise(result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async getExercise(id: string): Promise<ActionResult<Exercise>> {
        try {
            return {success: true, data: await this.exerciseService.getExercise(id)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>> {
        try {
            return {success: true, data: await this.exerciseService.listExercises(options)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>> {
        const result = updateExerciseSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.exerciseService.updateExercise(id, result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async archiveExercise(id: string): Promise<ActionResult<Exercise>> {
        try {
            return {success: true, data: await this.exerciseService.archiveExercise(id)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async unarchiveExercise(id: string): Promise<ActionResult<Exercise>> {
        try {
            return {success: true, data: await this.exerciseService.unarchiveExercise(id)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async deleteExercise(id: string): Promise<ActionResult<void>> {
        try {
            await this.exerciseService.deleteExercise(id);
            return {success: true, data: undefined};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }
}
