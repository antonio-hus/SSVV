import type {ActionResult} from '@/lib/domain/action-result';
import type {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import type {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for exercise catalogue server actions.
 */
export interface ExerciseControllerInterface {
    /**
     * Adds a new exercise to the catalogue.
     *
     * @param data - Validated exercise creation input.
     * @returns The created exercise on success, or a conflict error.
     */
    createExercise(data: CreateExerciseInput): Promise<ActionResult<Exercise>>;

    /**
     * Retrieves a single exercise by its unique identifier.
     *
     * @param id - The exercise ID.
     * @returns The exercise record on success, or a not-found error.
     */
    getExercise(id: string): Promise<ActionResult<Exercise>>;

    /**
     * Returns a paginated list of exercises.
     *
     * @param options - Filters (name substring, muscle group, active flag) and pagination.
     * @returns A page of exercises and the total matching count.
     */
    listExercises(options?: ExerciseListOptions): Promise<ActionResult<PageResult<Exercise>>>;

    /**
     * Updates an existing exercise in the catalogue.
     *
     * @param id - The exercise ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated exercise on success, or a not-found / conflict error.
     */
    updateExercise(id: string, data: UpdateExerciseInput): Promise<ActionResult<Exercise>>;

    /**
     * Marks an exercise as inactive (soft delete).
     *
     * @param id - The exercise ID.
     * @returns The updated exercise on success, or a not-found error.
     */
    archiveExercise(id: string): Promise<ActionResult<Exercise>>;

    /**
     * Restores a previously archived exercise.
     *
     * @param id - The exercise ID.
     * @returns The updated exercise on success, or a not-found error.
     */
    unarchiveExercise(id: string): Promise<ActionResult<Exercise>>;

    /**
     * Permanently removes an exercise from the catalogue.
     *
     * @param id - The exercise ID.
     * @returns A success result with no data, or a not-found error.
     */
    deleteExercise(id: string): Promise<ActionResult<void>>;
}
