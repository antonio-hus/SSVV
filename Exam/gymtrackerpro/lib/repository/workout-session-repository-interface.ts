import type {WorkoutSession} from '@/lib/domain/workout-session';
import type {WorkoutSessionWithExercises, WorkoutSessionListOptions} from '@/lib/domain/workout-session';
import type {CreateWorkoutSessionInput, WorkoutSessionExerciseInput, UpdateWorkoutSessionInput} from '@/lib/schema/workout-session-schema';
import type {PageResult} from '@/lib/domain/pagination';
import type {Report} from '@/lib/domain/report';

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
     * Returns a paginated list of sessions for a specific member, ordered newest first.
     *
     * @param memberId - The member ID.
     * @param options - Optional pagination parameters.
     * @returns A page of session records (each with exercises) and the total count.
     */
    findByMember(memberId: string, options?: WorkoutSessionListOptions): Promise<PageResult<WorkoutSessionWithExercises>>;

    /**
     * Generates a progress report for a member over a date range.
     *
     * Session-level statistics (total count, average duration) are computed with
     * Prisma's `aggregate`. Exercise volume and breakdowns are derived from the
     * fetched session data in application memory.
     *
     * @param memberId - The member ID.
     * @param startDate - Inclusive start of the reporting period.
     * @param endDate - Inclusive end of the reporting period.
     * @returns A full report including session details and per-exercise breakdowns.
     * @throws {NotFoundError} If the member does not exist.
     */
    generateReport(memberId: string, startDate: Date, endDate: Date): Promise<Report>;

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
