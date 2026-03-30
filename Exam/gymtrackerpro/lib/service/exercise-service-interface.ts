import type {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import type {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for exercise catalogue business logic.
 */
export interface ExerciseServiceInterface {
    /**
     * Adds a new exercise to the catalogue.
     *
     * @param data - Validated exercise creation input.
     * @returns The newly created exercise record.
     * @throws {ConflictError} If an exercise with the same name already exists.
     */
    createExercise(data: CreateExerciseInput): Promise<Exercise>;

    /**
     * Retrieves a single exercise by its unique identifier.
     *
     * @param id - The exercise ID.
     * @returns The exercise record.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    getExercise(id: string): Promise<Exercise>;

    /**
     * Returns a paginated list of exercises.
     * Only active exercises are returned by default.
     *
     * @param options - Filters (name substring, muscle group, active flag) and pagination.
     * @returns A page of exercises and the total matching count.
     */
    listExercises(options?: ExerciseListOptions): Promise<PageResult<Exercise>>;

    /**
     * Updates an existing exercise in the catalogue.
     *
     * @param id - The exercise ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated exercise record.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     * @throws {ConflictError} If the new name conflicts with an existing exercise.
     */
    updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise>;

    /**
     * Marks an exercise as inactive (soft delete).
     * Archived exercises are excluded from default list queries but preserved for
     * historical workout session references.
     *
     * @param id - The exercise ID.
     * @returns The updated exercise record with `isActive` set to `false`.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    archiveExercise(id: string): Promise<Exercise>;

    /**
     * Restores a previously archived exercise by setting `isActive` back to `true`.
     *
     * @param id - The exercise ID.
     * @returns The updated exercise record with `isActive` set to `true`.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    unarchiveExercise(id: string): Promise<Exercise>;

    /**
     * Permanently removes an exercise from the catalogue.
     *
     * @param id - The exercise ID.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    deleteExercise(id: string): Promise<void>;
}
