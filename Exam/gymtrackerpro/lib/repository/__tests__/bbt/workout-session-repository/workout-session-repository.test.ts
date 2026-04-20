import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {NotFoundError, TransactionError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput
} from "@/lib/schema/workout-session-schema";
import type {Member} from "@/lib/domain/user";
import type {Exercise} from "@/lib/domain/exercise";
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {
    WorkoutSessionWithExercises,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSessionExerciseWithExercise
} from "@/lib/domain/workout-session";
import {WorkoutSessionRepository} from '@/lib/repository/workout-session-repository';

const prismaMock = mockDeep<PrismaClient>();

const SESSION_ID: string = 'session-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const EXERCISE_ID: string = 'exercise-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bench Press',
    description: 'Classic chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const MOCK_SESSION_EXERCISE: WorkoutSessionExerciseWithExercise = {
    id: 'se-uuid-001',
    workoutSessionId: SESSION_ID,
    exerciseId: EXERCISE_ID,
    sets: 3,
    reps: 10,
    weight: 80.0,
    exercise: MOCK_EXERCISE,
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-06-01'),
    duration: 60,
    notes: 'Good session',
    exercises: [MOCK_SESSION_EXERCISE],
};

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-06-01'),
    duration: 60,
    notes: 'Good session',
};

const MOCK_MEMBER: Member = {
    id: MEMBER_ID,
    userId: 'user-uuid-001',
    membershipStart: new Date('2024-01-01'),
    isActive: true,
};

const CREATE_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-06-01',
    duration: 60,
    notes: 'Good session',
} as const;

const EXERCISE_INPUT: WorkoutSessionExerciseInput[] = [
    {exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0},
];

const UPDATE_SESSION_INPUT: UpdateWorkoutSessionInput = {
    duration: 75,
} as const;

beforeEach(() => {
    mockReset(prismaMock);
    (WorkoutSessionRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('create', () => {
    it('create_validDataWithExercises_returnsSessionWithExercises', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
        prismaMock.workoutSession.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const result = await repo.create(inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
    });

    it('create_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises: typeof EXERCISE_INPUT = [];

        const act = repo.create(inputData, inputExercises);

        await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
    });

    it('create_nonExistentMemberId_throwsNotFoundError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const act = repo.create(inputData, inputExercises);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('create_databaseWriteFails_throwsTransactionError', async () => {
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
        prismaMock.workoutSession.create.mockRejectedValue(new Error('DB error'));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const act = repo.create(inputData, inputExercises);

        await expect(act).rejects.toThrow(TransactionError);
    });

    it('create_validDataWithNullNotes_returnsSessionWithNullNotes', async () => {
        const sessionWithNullNotes: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, notes: null};
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
        prismaMock.workoutSession.create.mockResolvedValue(sessionWithNullNotes);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = {...CREATE_SESSION_INPUT, notes: undefined};
        const inputExercises = EXERCISE_INPUT;

        const result = await repo.create(inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(result.notes).toBeNull();
    });

    it('create_multipleExercises_returnsSessionWithAllExercises', async () => {
        const multiExerciseSession: WorkoutSessionWithExercises = {
            ...MOCK_SESSION_WITH_EXERCISES,
            exercises: [
                MOCK_SESSION_EXERCISE,
                {...MOCK_SESSION_EXERCISE, id: 'se-uuid-002', exerciseId: 'exercise-uuid-002'},
            ],
        };
        prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
        prismaMock.workoutSession.create.mockResolvedValue(multiExerciseSession);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = [
            ...EXERCISE_INPUT,
            {exerciseId: 'exercise-uuid-002', sets: 4, reps: 8, weight: 60.0},
        ];

        const result = await repo.create(inputData, inputExercises);

        expect(result.exercises).toHaveLength(2);
    });
});

describe('findById', () => {
    it('findById_existingSessionId_returnsSessionWithExercises', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;

        const result = await repo.findById(inputId);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
    });

    it('findById_nonExistentSessionId_throwsNotFoundError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(null);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.findById(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('findAll', () => {
    it('findAll_noOptions_returnsAllSessionsWithTotal', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
        prismaMock.workoutSession.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);

        const result = await repo.findAll();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('findAll_withMemberId_filtersByMember', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
        prismaMock.workoutSession.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {memberId: MEMBER_ID};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('findAll_withDateRange_filtersSessionsByDateRange', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
        prismaMock.workoutSession.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31')};

        const result = await repo.findAll(inputOptions);

        expect(result.total).toBe(1);
    });

    it('findAll_withPagination_returnsRequestedPage', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([]);
        prismaMock.workoutSession.count.mockResolvedValue(30);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        const result = await repo.findAll(inputOptions);

        expect(result.total).toBe(30);
        expect(result.items).toHaveLength(0);
    });

    it('findAll_noOptions_ordersResultsAscending', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
        prismaMock.workoutSession.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);

        await repo.findAll();

        const findManyCall = prismaMock.workoutSession.findMany.mock.calls[0][0];
        expect(findManyCall?.orderBy).toEqual({date: 'asc'});
    });

    it('findAll_withPagination_ordersResultsDescending', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([]);
        prismaMock.workoutSession.count.mockResolvedValue(5);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {page: 1, pageSize: 10};

        await repo.findAll(inputOptions);

        const findManyCall = prismaMock.workoutSession.findMany.mock.calls[0][0];
        expect(findManyCall?.orderBy).toEqual({date: 'desc'});
        expect(findManyCall?.skip).toBe(0);
    });

    it('findAll_noMatchingSessions_returnsEmptyPageResult', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([]);
        prismaMock.workoutSession.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {memberId: NONEXISTENT_ID};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('findAll_page2_skipIs10', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([]);
        prismaMock.workoutSession.count.mockResolvedValue(25);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        await repo.findAll(inputOptions);

        const findManyCall = prismaMock.workoutSession.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(10);
        expect(findManyCall?.take).toBe(10);
    });

    it('findAll_withMemberIdAndDateRange_filtersSessionsByBothCriteria', async () => {
        prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
        prismaMock.workoutSession.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputOptions = {
            memberId: MEMBER_ID,
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-06-30'),
        };

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });
});

describe('update', () => {
    it('update_existingSessionValidData_returnsUpdatedSession', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        prismaMock.workoutSession.update.mockResolvedValue({...MOCK_SESSION, duration: 75});
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;

        const result = await repo.update(inputId, inputData);

        expect(result.duration).toBe(75);
    });

    it('update_nonExistentSessionId_throwsNotFoundError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(null);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_SESSION_INPUT;

        const act = repo.update(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('updateWithExercises', () => {
    it('updateWithExercises_existingSessionWithExercises_returnsUpdatedSessionWithExercises', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
            const tx = mockDeep<PrismaClient>();
            tx.workoutSessionExercise.findMany.mockResolvedValue([]);
            tx.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            tx.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
            return (fn as (tx: PrismaClient) => Promise<never>)(tx);
        });
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
    });

    it('updateWithExercises_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises: typeof EXERCISE_INPUT = [];

        const act = repo.updateWithExercises(inputId, inputData, inputExercises);

        await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
    });

    it('updateWithExercises_nonExistentSessionId_throwsNotFoundError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(null);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const act = repo.updateWithExercises(inputId, inputData, inputExercises);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateWithExercises_existingExerciseIdKept_updatesExerciseInPlace', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
            const tx = mockDeep<PrismaClient>();
            tx.workoutSessionExercise.findMany.mockResolvedValue([{id: 'se-uuid-001'}] as WorkoutSessionExercise[]);
            tx.workoutSessionExercise.update.mockResolvedValue(MOCK_SESSION_EXERCISE);
            tx.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
            return (fn as (tx: PrismaClient) => Promise<never>)(tx);
        });
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = [{id: 'se-uuid-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0}];

        const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
    });

    it('updateWithExercises_existingExerciseNotInNewList_deletesStaleExercise', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        const txMock = mockDeep<PrismaClient>();
        txMock.workoutSessionExercise.findMany.mockResolvedValue([{id: 'se-uuid-001'}] as WorkoutSessionExercise[]);
        txMock.workoutSessionExercise.deleteMany.mockResolvedValue({count: 1});
        txMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
        txMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
            (fn as (tx: PrismaClient) => Promise<never>)(txMock),
        );
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = [{exerciseId: EXERCISE_ID, sets: 5, reps: 5, weight: 100.0}];

        const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

        expect(txMock.workoutSessionExercise.deleteMany).toHaveBeenCalledWith({
            where: {id: {in: ['se-uuid-001']}},
        });
        expect(result.id).toBe(SESSION_ID);
    });

    it('updateWithExercises_mixedExercises_deletesStaleUpdatesKeptCreatesNew', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        const txMock = mockDeep<PrismaClient>();
        txMock.workoutSessionExercise.findMany.mockResolvedValue([
            {id: 'se-uuid-001'},
            {id: 'se-uuid-002'},
        ] as WorkoutSessionExercise[]);
        txMock.workoutSessionExercise.deleteMany.mockResolvedValue({count: 1});
        txMock.workoutSessionExercise.update.mockResolvedValue(MOCK_SESSION_EXERCISE);
        txMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
        txMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
            (fn as (tx: PrismaClient) => Promise<never>)(txMock),
        );
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = [
            {id: 'se-uuid-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0},
            {exerciseId: 'exercise-uuid-002', sets: 2, reps: 15, weight: 30.0},
        ];

        await repo.updateWithExercises(inputId, inputData, inputExercises);

        expect(txMock.workoutSessionExercise.deleteMany).toHaveBeenCalledWith({
            where: {id: {in: ['se-uuid-002']}},
        });
        expect(txMock.workoutSessionExercise.update).toHaveBeenCalledTimes(1);
        expect(txMock.workoutSessionExercise.createMany).toHaveBeenCalledTimes(1);
    });

    it('updateWithExercises_transactionFails_throwsTransactionError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        prismaMock.$transaction.mockRejectedValue(new Error('DB connection lost'));
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = EXERCISE_INPUT;

        const act = repo.updateWithExercises(inputId, inputData, inputExercises);

        await expect(act).rejects.toThrow(TransactionError);
    });
});

describe('delete', () => {
    it('delete_existingSessionId_resolvesWithoutError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
        prismaMock.workoutSession.delete.mockResolvedValue(MOCK_SESSION);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = SESSION_ID;

        const act = repo.delete(inputId);

        await expect(act).resolves.toBeUndefined();
    });

    it('delete_nonExistentSessionId_throwsNotFoundError', async () => {
        prismaMock.workoutSession.findUnique.mockResolvedValue(null);
        const repo = WorkoutSessionRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.delete(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});