import type {ActionResult} from '@/lib/domain/action-result';
import type {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput} from '@/lib/schema/workout-session-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for workout session server actions.
 */
export interface WorkoutSessionControllerInterface {
    /**
     * Logs a complete workout session with all its exercises atomically.
     *
     * @param data - Validated session creation input (member, date, duration, notes).
     * @param exercises - Validated exercise entries (sets, reps, weight) — at least one required.
     * @returns The created workout session with exercises on success, or a not-found error.
     */
    createWorkoutSession(
        data: CreateWorkoutSessionInput,
        exercises: WorkoutSessionExerciseInput[]
    ): Promise<ActionResult<WorkoutSessionWithExercises>>;

    /**
     * Retrieves a single workout session by its unique identifier.
     *
     * @param workoutSessionId - The workout session ID.
     * @returns The workout session with exercises on success, or a not-found error.
     */
    getWorkoutSession(workoutSessionId: string): Promise<ActionResult<WorkoutSessionWithExercises>>;

    /**
     * Returns a paginated list of workout sessions for a specific member.
     *
     * @param memberId - The member ID.
     * @param options - Optional pagination parameters.
     * @returns A page of workout session records and the total count.
     */
    listMemberWorkoutSessions(
        memberId: string,
        options?: WorkoutSessionListOptions
    ): Promise<ActionResult<PageResult<WorkoutSessionWithExercises>>>;

    /**
     * Updates workout session metadata (date, duration, notes).
     *
     * @param workoutSessionId - The workout session ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated workout session on success, or a not-found error.
     */
    updateWorkoutSession(workoutSessionId: string, data: UpdateWorkoutSessionInput): Promise<ActionResult<WorkoutSession>>;

    /**
     * Permanently removes a workout session and all its exercises.
     *
     * @param workoutSessionId - The workout session ID.
     * @returns A success result with no data, or a not-found error.
     */
    deleteWorkoutSession(workoutSessionId: string): Promise<ActionResult<void>>;
}
