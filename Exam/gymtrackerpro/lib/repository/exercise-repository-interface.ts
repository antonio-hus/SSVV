import type {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import type {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for exercise catalogue data access.
 */
export interface ExerciseRepositoryInterface {
    /**
     * Creates a new exercise in the catalogue.
     *
     * @param data - Validated exercise creation input.
     * @returns The newly created exercise record.
     * @throws {ConflictError} If an exercise with the same name already exists.
     */
    create(data: CreateExerciseInput): Promise<Exercise>;

    /**
     * Finds an exercise by its unique identifier.
     *
     * @param id - The exercise ID.
     * @returns The exercise record.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    findById(id: string): Promise<Exercise>;

    /**
     * Returns a paginated list of exercises.
     * Only active exercises are returned by default.
     *
     * @param options - Filters (name substring, muscle group, active flag) and pagination.
     * @returns A page of exercises and the total matching count.
     */
    findAll(options?: ExerciseListOptions): Promise<PageResult<Exercise>>;

    /**
     * Updates an existing exercise by its unique identifier.
     *
     * @param id - The exercise ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated exercise record.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     * @throws {ConflictError} If the new name conflicts with an existing exercise.
     */
    update(id: string, data: UpdateExerciseInput): Promise<Exercise>;

    /**
     * Marks an exercise as inactive (soft delete).
     * Archived exercises are excluded from default list queries.
     *
     * @param id - The exercise ID.
     * @returns The updated exercise record with `isActive` set to `false`.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    archive(id: string): Promise<Exercise>;

    /**
     * Permanently removes an exercise from the catalogue.
     *
     * @param id - The exercise ID.
     * @throws {NotFoundError} If no exercise with the given ID exists.
     */
    delete(id: string): Promise<void>;
}
