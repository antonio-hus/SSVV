'use server';

import {WorkoutSessionServiceInterface} from '@/lib/service/workout-session-service-interface';
import {WorkoutSessionControllerInterface} from '@/lib/controller/workout-session-controller-interface';
import {ActionResult} from '@/lib/domain/action-result';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateWorkoutSessionInput, createWorkoutSessionSchema, UpdateWorkoutSessionInput, updateWorkoutSessionSchema, WorkoutSessionExerciseInput, workoutSessionExercisesSchema} from '@/lib/schema/workout-session-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Implementation of {@link WorkoutSessionControllerInterface} — workout session server actions.
 */
export class WorkoutSessionController implements WorkoutSessionControllerInterface {
    private static instance: WorkoutSessionController;
    private readonly workoutSessionService: WorkoutSessionServiceInterface;

    private constructor(workoutSessionService: WorkoutSessionServiceInterface) {
        this.workoutSessionService = workoutSessionService;
    }

    /**
     * Returns the singleton instance, creating it with the given service on first call.
     *
     * @param workoutSessionService - The workout session service to use for session operations.
     */
    static getInstance(workoutSessionService: WorkoutSessionServiceInterface): WorkoutSessionController {
        if (!WorkoutSessionController.instance) {
            WorkoutSessionController.instance = new WorkoutSessionController(workoutSessionService);
        }
        return WorkoutSessionController.instance;
    }

    /** @inheritdoc */
    async createWorkoutSession(
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
            return {success: true, data: await this.workoutSessionService.createWorkoutSession(sessionResult.data, exercisesResult.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>> {
        try {
            return {success: true, data: await this.workoutSessionService.getWorkoutSession(workoutSessionId)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async listMemberWorkoutSessions(
        memberId: string,
        options?: WorkoutSessionListOptions,
    ): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>> {
        try {
            return {success: true, data: await this.workoutSessionService.listMemberWorkoutSessions(memberId, options)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async updateWorkoutSession(
        workoutSessionId: string,
        data: UpdateWorkoutSessionInput,
    ): Promise<ActionResult<WorkoutSession>> {
        const result = updateWorkoutSessionSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.workoutSessionService.updateWorkoutSession(workoutSessionId, result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>> {
        try {
            await this.workoutSessionService.deleteWorkoutSession(workoutSessionId);
            return {success: true, data: undefined};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }
}
