import type {WorkoutSession} from '@/lib/domain/workout-session';
import type {WorkoutSessionWithExercises, WorkoutSessionListOptions} from '@/lib/domain/workout-session';
import type {CreateWorkoutSessionInput, WorkoutSessionExerciseInput, UpdateWorkoutSessionInput} from '@/lib/schema/workout-session-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for workout session data access.
 */
export interface WorkoutSessionRepositoryInterface {
    /**
     * Creates a workout session with all its exercises atomically via a single nested write.
     *
     * @param data - Validated session creation input (member, date, duration, notes).
     * @param exercises - At least one exercise entry (sets, reps, weight).
     * @returns The newly created session record with all exercises included.
     * @throws {SessionRequiresExercisesError} If the exercises array is empty.
     * @throws {NotFoundError} If the referenced member does not exist.
     * @throws {TransactionError} If the atomic write fails.
     */
    create(data: CreateWorkoutSessionInput, exercises: WorkoutSessionExerciseInput[]): Promise<WorkoutSessionWithExercises>;

    /**
     * Finds a workout session by its unique identifier, including all exercises.
     *
     * @param id - The workout session ID.
     * @returns The session record with all exercises and their catalogue entries.
     * @throws {NotFoundError} If no session with the given ID exists.
     */
    findById(id: string): Promise<WorkoutSessionWithExercises>;

    /**
     * Returns a filtered, paginated list of workout sessions.
     *
     * When `page` and `pageSize` are omitted all matching records are returned.
     * Results are ordered newest-first when paginating, oldest-first otherwise
     * (chronological order is required for report aggregation).
     *
     * @param options - Filters (member, date range) and optional pagination parameters.
     * @returns A page of session records (each with exercises) and the total matching count.
     */
    findAll(options?: WorkoutSessionListOptions): Promise<PageResult<WorkoutSessionWithExercises>>;

    /**
     * Updates session metadata (date, duration, notes).
     *
     * @param id - The workout session ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated session record (without exercises).
     * @throws {NotFoundError} If no session with the given ID exists.
     */
    update(id: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession>;

    /**
     * Permanently removes a workout session and all its exercises (cascade delete).
     *
     * @param id - The workout session ID.
     * @throws {NotFoundError} If no session with the given ID exists.
     */
    delete(id: string): Promise<void>;
}
