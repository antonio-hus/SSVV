import {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ExerciseRepositoryInterface} from '@/lib/repository/exercise-repository-interface';
import {ExerciseServiceInterface} from '@/lib/service/exercise-service-interface';

/**
 * Implementation of {@link ExerciseServiceInterface} providing exercise catalogue management.
 */
export class ExerciseService implements ExerciseServiceInterface {
    private static instance: ExerciseService;
    private readonly exerciseRepository: ExerciseRepositoryInterface;

    private constructor(exerciseRepository: ExerciseRepositoryInterface) {
        this.exerciseRepository = exerciseRepository;
    }

    /**
     * Returns the singleton instance, creating it with the given repository on first call.
     *
     * @param exerciseRepository - The exercise repository to use for catalogue data access.
     */
    static getInstance(exerciseRepository: ExerciseRepositoryInterface): ExerciseService {
        if (!ExerciseService.instance) {
            ExerciseService.instance = new ExerciseService(exerciseRepository);
        }
        return ExerciseService.instance;
    }

    /** @inheritdoc */
    async createExercise(data: CreateExerciseInput): Promise<Exercise> {
        return this.exerciseRepository.create(data);
    }

    /** @inheritdoc */
    async getExercise(id: string): Promise<Exercise> {
        return this.exerciseRepository.findById(id);
    }

    /** @inheritdoc */
    async listExercises(options?: ExerciseListOptions): Promise<PageResult<Exercise>> {
        return this.exerciseRepository.findAll(options);
    }

    /** @inheritdoc */
    async updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise> {
        return this.exerciseRepository.update(id, data);
    }

    /** @inheritdoc */
    async archiveExercise(id: string): Promise<Exercise> {
        return this.exerciseRepository.setActive(id, false);
    }

    /** @inheritdoc */
    async unarchiveExercise(id: string): Promise<Exercise> {
        return this.exerciseRepository.setActive(id, true);
    }

    /** @inheritdoc */
    async deleteExercise(id: string): Promise<void> {
        return this.exerciseRepository.delete(id);
    }
}
