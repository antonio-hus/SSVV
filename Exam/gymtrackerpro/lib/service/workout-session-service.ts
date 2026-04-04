import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput, WorkoutSessionExerciseUpdateInput} from '@/lib/schema/workout-session-schema';
import {PageResult} from '@/lib/domain/pagination';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {WorkoutSessionServiceInterface} from '@/lib/service/workout-session-service-interface';

/**
 * Implementation of {@link WorkoutSessionServiceInterface} providing workout session management.
 */
export class WorkoutSessionService implements WorkoutSessionServiceInterface {
    private static instance: WorkoutSessionService;
    private readonly workoutSessionRepository: WorkoutSessionRepositoryInterface;

    private constructor(workoutSessionRepository: WorkoutSessionRepositoryInterface) {
        this.workoutSessionRepository = workoutSessionRepository;
    }

    /**
     * Returns the singleton instance, creating it with the given repository on first call.
     *
     * @param workoutSessionRepository - The workout session repository to use for data access.
     */
    static getInstance(workoutSessionRepository: WorkoutSessionRepositoryInterface): WorkoutSessionService {
        if (!WorkoutSessionService.instance) {
            WorkoutSessionService.instance = new WorkoutSessionService(workoutSessionRepository);
        }
        return WorkoutSessionService.instance;
    }

    /** @inheritdoc */
    async createWorkoutSession(
        data: CreateWorkoutSessionInput,
        exercises: WorkoutSessionExerciseInput[],
    ): Promise<WorkoutSessionWithExercises> {
        return this.workoutSessionRepository.create(data, exercises);
    }

    /** @inheritdoc */
    async getWorkoutSession(workoutSessionId: string): Promise<WorkoutSessionWithExercises> {
        return this.workoutSessionRepository.findById(workoutSessionId);
    }

    /** @inheritdoc */
    async listMemberWorkoutSessions(
        memberId: string,
        options?: WorkoutSessionListOptions,
    ): Promise<PageResult<WorkoutSessionWithExercises>> {
        return this.workoutSessionRepository.findAll({memberId, ...options});
    }

    /** @inheritdoc */
    async updateWorkoutSession(
        workoutSessionId: string,
        data: UpdateWorkoutSessionInput,
    ): Promise<WorkoutSession> {
        return this.workoutSessionRepository.update(workoutSessionId, data);
    }

    /** @inheritdoc */
    async updateWorkoutSessionWithExercises(
        workoutSessionId: string,
        data: UpdateWorkoutSessionInput,
        exercises: WorkoutSessionExerciseUpdateInput[],
    ): Promise<WorkoutSessionWithExercises> {
        return this.workoutSessionRepository.updateWithExercises(workoutSessionId, data, exercises);
    }

    /** @inheritdoc */
    async deleteWorkoutSession(workoutSessionId: string): Promise<void> {
        return this.workoutSessionRepository.delete(workoutSessionId);
    }
}
