import {PrismaClient} from '@/prisma/generated/prisma/client';
import {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {ExerciseRepositoryInterface} from '@/lib/repository/exercise-repository-interface';
import {escapeLike} from '@/lib/utils';

/**
 * Prisma-backed implementation of {@link ExerciseRepositoryInterface}.
 */
export class ExerciseRepository implements ExerciseRepositoryInterface {
    private static instance: ExerciseRepository;
    private readonly database: PrismaClient;

    private constructor(database: PrismaClient) {
        this.database = database;
    }

    /**
     * Returns the singleton instance, creating it with the given client on first call.
     *
     * @param database - The Prisma client to use for database access.
     */
    static getInstance(database: PrismaClient): ExerciseRepository {
        if (!ExerciseRepository.instance) {
            ExerciseRepository.instance = new ExerciseRepository(database);
        }
        return ExerciseRepository.instance;
    }

    /** @inheritdoc */
    async create(data: CreateExerciseInput): Promise<Exercise> {
        const existing = await this.database.exercise.findUnique({where: {name: data.name}});
        if (existing) {
            throw new ConflictError(`Exercise name already in use: ${data.name}`);
        }

        return this.database.exercise.create({data});
    }

    /** @inheritdoc */
    async findById(id: string): Promise<Exercise> {
        const exercise = await this.database.exercise.findUnique({where: {id}});
        if (!exercise) {
            throw new NotFoundError(`Exercise not found: ${id}`);
        }

        return exercise;
    }

    /** @inheritdoc */
    async findAll(options: ExerciseListOptions = {}): Promise<PageResult<Exercise>> {
        const {search, muscleGroup, includeInactive = false, page = 1, pageSize = 10} = options;

        const safeSearch = search ? escapeLike(search) : undefined;
        const where = {
            ...(includeInactive ? {} : {isActive: true}),
            ...(muscleGroup ? {muscleGroup} : {}),
            ...(safeSearch ? {name: {contains: safeSearch, mode: 'insensitive' as const}} : {}),
        };

        const [items, total] = await this.database.$transaction([
            this.database.exercise.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: {name: 'asc'},
            }),
            this.database.exercise.count({where}),
        ]);

        return {items, total};
    }

    /** @inheritdoc */
    async update(id: string, data: UpdateExerciseInput): Promise<Exercise> {
        const exercise = await this.database.exercise.findUnique({where: {id}});
        if (!exercise) {
            throw new NotFoundError(`Exercise not found: ${id}`);
        }

        if (data.name && data.name !== exercise.name) {
            const conflict = await this.database.exercise.findUnique({where: {name: data.name}});
            if (conflict) {
                throw new ConflictError(`Exercise name already in use: ${data.name}`);
            }
        }

        return this.database.exercise.update({where: {id}, data});
    }

    /** @inheritdoc */
    async setActive(id: string, isActive: boolean): Promise<Exercise> {
        const exercise = await this.database.exercise.findUnique({where: {id}});
        if (!exercise) {
            throw new NotFoundError(`Exercise not found: ${id}`);
        }

        return this.database.exercise.update({where: {id}, data: {isActive}});
    }

    /** @inheritdoc */
    async delete(id: string): Promise<void> {
        const exercise = await this.database.exercise.findUnique({where: {id}});
        if (!exercise) {
            throw new NotFoundError(`Exercise not found: ${id}`);
        }

        const usageCount = await this.database.workoutSessionExercise.count({where: {exerciseId: id}});
        if (usageCount > 0) {
            throw new ConflictError(`Exercise is used in existing workout sessions and cannot be deleted`);
        }

        await this.database.exercise.delete({where: {id}});
    }
}
