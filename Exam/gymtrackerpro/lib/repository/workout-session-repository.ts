import {PrismaClient} from '@/prisma/generated/prisma/client';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput,} from '@/lib/schema/workout-session-schema';
import {PageResult} from '@/lib/domain/pagination';
import {NotFoundError, SessionRequiresExercisesError, TransactionError} from '@/lib/domain/errors';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';

/**
 * Prisma-backed implementation of {@link WorkoutSessionRepositoryInterface}.
 */
export class WorkoutSessionRepository implements WorkoutSessionRepositoryInterface {
    private static instance: WorkoutSessionRepository;
    private readonly database: PrismaClient;

    private constructor(database: PrismaClient) {
        this.database = database;
    }

    /**
     * Returns the singleton instance, creating it with the given client on first call.
     *
     * @param database - The Prisma client to use for database access.
     */
    static getInstance(database: PrismaClient): WorkoutSessionRepository {
        if (!WorkoutSessionRepository.instance) {
            WorkoutSessionRepository.instance = new WorkoutSessionRepository(database);
        }
        return WorkoutSessionRepository.instance;
    }

    /** @inheritdoc */
    async create(
        data: CreateWorkoutSessionInput,
        exercises: WorkoutSessionExerciseInput[],
    ): Promise<WorkoutSessionWithExercises> {
        if (exercises.length === 0) {
            throw new SessionRequiresExercisesError(
                'A workout session must include at least one exercise.',
            );
        }

        const member = await this.database.member.findUnique({
            where: {id: data.memberId}
        });
        if (!member) {
            throw new NotFoundError(`Member not found: ${data.memberId}`);
        }

        try {
            return await this.database.workoutSession.create({
                data: {
                    memberId: data.memberId,
                    date: new Date(data.date),
                    duration: data.duration,
                    notes: data.notes,
                    exercises: {
                        create: exercises.map((exercise) => ({
                            exerciseId: exercise.exerciseId,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            weight: exercise.weight,
                        })),
                    },
                },
                include: {exercises: {include: {exercise: true}}},
            });
        } catch (error) {
            throw new TransactionError(
                `Failed to create workout session: ${(error as Error).message}`,
            );
        }
    }

    /** @inheritdoc */
    async findById(id: string): Promise<WorkoutSessionWithExercises> {
        const session = await this.database.workoutSession.findUnique({
            where: {id},
            include: {exercises: {include: {exercise: true}}},
        });
        if (!session) {
            throw new NotFoundError(`Workout session not found: ${id}`);
        }

        return session;
    }

    /** @inheritdoc */
    async findAll(options: WorkoutSessionListOptions = {}): Promise<PageResult<WorkoutSessionWithExercises>> {
        const {memberId, startDate, endDate, page, pageSize} = options;
        const paginated = page !== undefined && pageSize !== undefined;

        const where = {
            ...(memberId ? {memberId} : {}),
            ...(startDate || endDate
                ? {date: {gte: startDate, lte: endDate}}
                : {}),
        };

        const [items, total] = await this.database.$transaction([
            this.database.workoutSession.findMany({
                where,
                include: {exercises: {include: {exercise: true}}},
                ...(paginated ? {skip: (page - 1) * pageSize, take: pageSize} : {}),
                orderBy: {date: paginated ? 'desc' : 'asc'},
            }),
            this.database.workoutSession.count({where}),
        ]);

        return {items, total};
    }

    /** @inheritdoc */
    async update(id: string, data: UpdateWorkoutSessionInput): Promise<WorkoutSession> {
        const session = await this.database.workoutSession.findUnique({
            where: {id}
        });
        if (!session) {
            throw new NotFoundError(`Workout session not found: ${id}`);
        }

        return this.database.workoutSession.update({
            where: {id},
            data: {
                ...(data.date ? {date: new Date(data.date)} : {}),
                ...(data.duration !== undefined ? {duration: data.duration} : {}),
                ...(data.notes !== undefined ? {notes: data.notes} : {}),
            },
        });
    }

    /** @inheritdoc */
    async delete(id: string): Promise<void> {
        const session = await this.database.workoutSession.findUnique({
            where: {id}
        });
        if (!session) {
            throw new NotFoundError(`Workout session not found: ${id}`);
        }

        await this.database.workoutSession.delete({where: {id}});
    }
}
