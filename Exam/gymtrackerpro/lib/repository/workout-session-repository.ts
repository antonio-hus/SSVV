import {PrismaClient} from '@/prisma/generated/prisma/client';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput,} from '@/lib/schema/workout-session-schema';
import {ExerciseStats, Report, SessionDetail, SessionExerciseDetail} from '@/lib/domain/report';
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
    async findByMember(
        memberId: string,
        options: WorkoutSessionListOptions = {},
    ): Promise<PageResult<WorkoutSessionWithExercises>> {
        const {page = 1, pageSize = 10} = options;
        const where = {memberId};

        const [items, total] = await this.database.$transaction([
            this.database.workoutSession.findMany({
                where,
                include: {exercises: {include: {exercise: true}}},
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: {date: 'desc'},
            }),
            this.database.workoutSession.count({where}),
        ]);

        return {items, total};
    }

    /** @inheritdoc */
    async generateReport(memberId: string, startDate: Date, endDate: Date): Promise<Report> {
        const member = await this.database.member.findUnique({
            where: {id: memberId},
            include: {user: true},
        });
        if (!member) {
            throw new NotFoundError(`Member not found: ${memberId}`);
        }

        const dateFilter = {memberId, date: {gte: startDate, lte: endDate}};

        const sessions = await this.database.workoutSession.findMany({
            where: dateFilter,
            include: {exercises: {include: {exercise: true}}},
            orderBy: {date: 'asc'},
        });

        const exerciseStatsMap = new Map<string, ExerciseStats>();
        const exerciseSessionSets = new Map<string, Set<string>>();

        const sessionDetails: SessionDetail[] = sessions.map((session) => {
            const exerciseDetails: SessionExerciseDetail[] = session.exercises.map((entry) => {
                const weight = Number(entry.weight);
                const volume = entry.sets * entry.reps * weight;

                if (!exerciseStatsMap.has(entry.exerciseId)) {
                    exerciseStatsMap.set(entry.exerciseId, {
                        exerciseId: entry.exerciseId,
                        exerciseName: entry.exercise.name,
                        muscleGroup: entry.exercise.muscleGroup,
                        totalSets: 0,
                        totalReps: 0,
                        totalVolume: 0,
                        sessionCount: 0,
                    });
                    exerciseSessionSets.set(entry.exerciseId, new Set());
                }

                const stats = exerciseStatsMap.get(entry.exerciseId)!;
                stats.totalSets += entry.sets;
                stats.totalReps += entry.reps;
                stats.totalVolume += volume;
                exerciseSessionSets.get(entry.exerciseId)!.add(session.id);

                return {
                    exerciseId: entry.exerciseId,
                    exerciseName: entry.exercise.name,
                    sets: entry.sets,
                    reps: entry.reps,
                    weight,
                    volume,
                };
            });

            const totalVolume = exerciseDetails.reduce(
                (sum, exerciseDetail) => sum + exerciseDetail.volume,
                0,
            );

            return {
                sessionId: session.id,
                date: session.date,
                durationMinutes: session.duration,
                notes: session.notes,
                exercises: exerciseDetails,
                totalVolume,
            };
        });

        for (const [exerciseId, sessionIdSet] of exerciseSessionSets) {
            exerciseStatsMap.get(exerciseId)!.sessionCount = sessionIdSet.size;
        }

        const exerciseBreakdown = Array.from(exerciseStatsMap.values()).sort(
            (first, second) => second.totalVolume - first.totalVolume,
        );

        const totalVolume = sessionDetails.reduce(
            (sum, sessionDetail) => sum + sessionDetail.totalVolume,
            0,
        );

        const averageSessionDuration =
            sessions.length > 0
                ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length
                : 0;

        return {
            memberId,
            memberName: member.user.fullName,
            startDate,
            endDate,
            totalSessions: sessions.length,
            totalVolume,
            averageSessionDuration,
            exerciseBreakdown,
            sessionDetails,
        };
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
