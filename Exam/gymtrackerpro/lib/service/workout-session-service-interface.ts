import type {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput} from '@/lib/schema/workout-session-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for workout session business logic.
 */
export interface WorkoutSessionServiceInterface {
    /**
     * Logs a complete workout session with all its exercises atomically.
     *
     * @param data - Validated session input (member, date, duration, notes).
     * @param exercises - At least one exercise entry (sets, reps, weight).
     * @returns The newly created workout session record with all exercises included.
     * @throws {SessionRequiresExercisesError} If the exercises array is empty.
     * @throws {NotFoundError} If the referenced member does not exist.
     * @throws {TransactionError} If the atomic write fails.
     */
    createWorkoutSession(
        data: CreateWorkoutSessionInput,
        exercises: WorkoutSessionExerciseInput[]
    ): Promise<WorkoutSessionWithExercises>;

    /**
     * Retrieves a single workout session by its unique identifier, including all exercises.
     *
     * @param workoutSessionId - The workout session ID.
     * @returns The workout session record with all exercises and their catalogue entries.
     * @throws {NotFoundError} If no workout session with the given ID exists.
     */
    getWorkoutSession(workoutSessionId: string): Promise<WorkoutSessionWithExercises>;

    /**
     * Returns a paginated list of workout sessions for a specific member, ordered newest first.
     *
     * @param memberId - The member ID.
     * @param options - Optional pagination parameters.
     * @returns A page of workout session records (each with exercises) and the total count.
     */
    listMemberWorkoutSessions(
        memberId: string,
        options?: WorkoutSessionListOptions
    ): Promise<PageResult<WorkoutSessionWithExercises>>;

    /**
     * Updates workout session metadata (date, duration, notes).
     * Exercise entries are not modified by this operation.
     *
     * @param workoutSessionId - The workout session ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated workout session record (without exercises).
     * @throws {NotFoundError} If no workout session with the given ID exists.
     */
    updateWorkoutSession(workoutSessionId: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession>;

    /**
     * Permanently removes a workout session and all its exercises (cascade delete).
     *
     * @param workoutSessionId - The workout session ID.
     * @throws {NotFoundError} If no workout session with the given ID exists.
     */
    deleteWorkoutSession(workoutSessionId: string): Promise<void>;
}
