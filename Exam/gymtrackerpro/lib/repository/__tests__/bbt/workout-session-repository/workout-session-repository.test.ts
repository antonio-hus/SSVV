import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {NotFoundError, TransactionError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from "@/lib/schema/workout-session-schema";
import type {Member} from "@/lib/domain/user";
import type {Exercise} from "@/lib/domain/exercise";
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {
    WorkoutSessionWithExercises,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSessionExerciseWithExercise,
    WorkoutSessionListOptions,
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

const mockTransaction = () => {
    prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
};

beforeEach(() => {
    mockReset(prismaMock);
    (WorkoutSessionRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('create', () => {
    describe('Equivalence Classes', () => {
        it('create_EC_validDataWithExercises_returnsSessionWithExercises', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
            prismaMock.workoutSession.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await repo.create(inputSessionData, inputExercises);

            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
            expect(result.exercises[0].exerciseId).toBe(EXERCISE_ID);
        });

        it('create_EC_multipleExercises_returnsSessionWithAllExercises', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [
                ...EXERCISE_INPUT,
                {exerciseId: 'exercise-uuid-002', sets: 4, reps: 8, weight: 60.0},
            ];
            const multiExerciseSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [
                    MOCK_SESSION_EXERCISE,
                    {...MOCK_SESSION_EXERCISE, id: 'se-uuid-002', exerciseId: 'exercise-uuid-002', sets: 4, reps: 8, weight: 60.0},
                ],
            };
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
            prismaMock.workoutSession.create.mockResolvedValue(multiExerciseSession);

            const result = await repo.create(inputSessionData, inputExercises);

            expect(result.exercises).toHaveLength(2);
            expect(result.exercises[1].exerciseId).toBe('exercise-uuid-002');
            expect(result.exercises[1].sets).toBe(4);
        });

        it('create_EC_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
            await expect(act).rejects.toThrow('A workout session must include at least one exercise.');
        });

        it('create_EC_nonExistentMemberId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });

        it('create_EC_databaseWriteFails_throwsTransactionError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
            prismaMock.workoutSession.create.mockRejectedValue(new Error('DB error'));

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB error');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('create_BVA_emptyMemberId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: ''};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('create_BVA_inexistentOneCharMemberId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: 'a'};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue(null);

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('create_BVA_existingOneCharMemberId_returnsSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: 'a'};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.member.findUnique.mockResolvedValue({...MOCK_MEMBER, id: 'a'});
            const expectedReturn = {...MOCK_SESSION_WITH_EXERCISES, memberId: 'a'};
            prismaMock.workoutSession.create.mockResolvedValue(expectedReturn);

            const result = await repo.create(inputSessionData, inputExercises);

            expect(result.memberId).toBe('a');
            expect(result).toEqual(expectedReturn);
        });

        it('create_BVA_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const act = repo.create(inputSessionData, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        });

        it('create_BVA_oneExercise_returnsSessionWithOneExercise', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputSessionData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [{
                exerciseId: EXERCISE_ID,
                sets: 3,
                reps: 10,
                weight: 80.0
            }];
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER);
            prismaMock.workoutSession.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await repo.create(inputSessionData, inputExercises);

            expect(result.exercises).toHaveLength(1);
            expect(result.exercises[0].exerciseId).toBe(EXERCISE_ID);
        });
    });
});

describe('findById', () => {
    describe('Equivalence Classes', () => {
        it('findById_EC_existingSessionId_returnsSessionWithExercises', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await repo.findById(inputId);

            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
        });

        it('findById_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Workout session not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findById_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.findById(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_existingOneCharId_returnsSessionWithExercises', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            const expectedReturn = {...MOCK_SESSION_WITH_EXERCISES, id: 'a'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(expectedReturn);

            const result = await repo.findById(inputId);

            expect(result.id).toBe('a');
            expect(result).toEqual(expectedReturn);
        });
    });
});

describe('findAll', () => {
    describe('Equivalence Classes', () => {
        it('findAll_EC_noOptions_returnsAllSessionsUnpaginated', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002', date: new Date('2024-07-01')};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll();

            expect(result.items).toHaveLength(2);
            expect(result.items[0]).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(result.items[1]).toEqual(session2);
            expect(result.total).toBe(2);
        });

        it('findAll_EC_withMemberId_returnsMemberSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {memberId: MEMBER_ID};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].memberId).toBe(MEMBER_ID);
            expect(result.items[0]).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('findAll_EC_withStartDate_returnsSessionsFromDate', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const startDate = new Date('2024-06-01');
            const inputOptions: WorkoutSessionListOptions = {startDate};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        });

        it('findAll_EC_withEndDate_returnsSessionsUntilDate', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const endDate = new Date('2024-06-30');
            const inputOptions: WorkoutSessionListOptions = {endDate};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].date.getTime()).toBeLessThanOrEqual(endDate.getTime());
        });

        it('findAll_EC_withDateRange_returnsSessionsInRange', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const inputOptions: WorkoutSessionListOptions = {startDate, endDate};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(result.items[0].date.getTime()).toBeLessThanOrEqual(endDate.getTime());
        });

        it('findAll_EC_withMemberIdAndDateRange_returnsFilteredSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {
                memberId: MEMBER_ID,
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-06-30'),
            };
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].memberId).toBe(MEMBER_ID);
        });

        it('findAll_EC_withPagination_returnsPaginatedSubset', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 10};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(25);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(25);
        });

        it('findAll_EC_noMatchingSessions_returnsEmptyPageResult', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {memberId: NONEXISTENT_ID};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([]);
            prismaMock.workoutSession.count.mockResolvedValue(0);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_EC_unpaginatedMultipleSessions_returnsSessionsOrderedByDateAscending', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const olderSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                id: 'older',
                date: new Date('2024-01-01'),
            };
            const newerSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                id: 'newer',
                date: new Date('2024-12-01'),
            };
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([olderSession, newerSession]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll();

            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe('older');
            expect(result.items[1].id).toBe('newer');
            expect(result.items[0].date.getTime()).toBeLessThan(result.items[1].date.getTime());
        });

        it('findAll_EC_paginatedMultipleSessions_returnsSessionsOrderedByDateDescending', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 10};
            const olderSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                id: 'older',
                date: new Date('2024-01-01'),
            };
            const newerSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                id: 'newer',
                date: new Date('2024-12-01'),
            };
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([newerSession, olderSession]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe('newer');
            expect(result.items[1].id).toBe('older');
            expect(result.items[0].date.getTime()).toBeGreaterThan(result.items[1].date.getTime());
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findAll_BVA_memberIdUndefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {memberId: undefined};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_memberIdEmpty_returnsNoSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {memberId: ''};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([]);
            prismaMock.workoutSession.count.mockResolvedValue(0);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_memberIdOneChar_returnsMatchingItems', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {memberId: 'a'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].memberId).toBe(MEMBER_ID);
        });

        it('findAll_BVA_startDateUndefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {startDate: undefined};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_endDateUndefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {endDate: undefined};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_startDateEqualsEndDate_returnsSameDaySessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const sameDay = new Date('2024-06-01');
            const inputOptions: WorkoutSessionListOptions = {startDate: sameDay, endDate: sameDay};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(1);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].date).toEqual(sameDay);
        });

        it('findAll_BVA_pageAndPageSizeUndefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: undefined, pageSize: undefined};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            const session3: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-003'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2, session3]);
            prismaMock.workoutSession.count.mockResolvedValue(3);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(3);
            expect(result.total).toBe(3);
        });

        it('findAll_BVA_pageUndefinedPageSizeDefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: undefined, pageSize: 10};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_pageDefinedPageSizeUndefined_returnsAllSessions', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: undefined};
            const session2: WorkoutSessionWithExercises = {...MOCK_SESSION_WITH_EXERCISES, id: 'session-uuid-002'};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES, session2]);
            prismaMock.workoutSession.count.mockResolvedValue(2);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_page0_returnsFirstPage', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 0, pageSize: 10};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(5);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });

        it('findAll_BVA_page1_returnsFirstPage', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 10};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(25);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(25);
        });

        it('findAll_BVA_page2_returnsSecondPage', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 10};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([]);
            prismaMock.workoutSession.count.mockResolvedValue(25);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(25);
        });

        it('findAll_BVA_pageSize1_returnsOneItemPerPage', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 1};
            mockTransaction();
            prismaMock.workoutSession.findMany.mockResolvedValue([MOCK_SESSION_WITH_EXERCISES]);
            prismaMock.workoutSession.count.mockResolvedValue(5);

            const result = await repo.findAll(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(5);
        });
    });
});

describe('update', () => {
    describe('Equivalence Classes', () => {
        it('update_EC_existingSessionValidData_returnsUpdatedSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            const expectedReturn = {...MOCK_SESSION, duration: 75};
            prismaMock.workoutSession.update.mockResolvedValue(expectedReturn);

            const result = await repo.update(inputId, inputData);

            expect(result.duration).toBe(75);
            expect(result).toEqual(expectedReturn);
        });

        it('update_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.update(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Workout session not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('update_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = '';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.update(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('update_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.update(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('update_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const existing = {...MOCK_SESSION, id: 'a'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(existing);
            const expectedReturn = {...existing, duration: 75};
            prismaMock.workoutSession.update.mockResolvedValue(expectedReturn);

            const result = await repo.update(inputId, inputData);

            expect(result.id).toBe('a');
            expect(result.duration).toBe(75);
            expect(result).toEqual(expectedReturn);
        });
    });
});

describe('updateWithExercises', () => {
    describe('Equivalence Classes', () => {
        it('updateWithExercises_EC_existingSessionWithNewExercises_returnsUpdatedSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
                const tx = mockDeep<PrismaClient>();
                tx.workoutSessionExercise.findMany.mockResolvedValue([]);
                tx.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
                tx.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
                return (fn as (tx: PrismaClient) => Promise<never>)(tx);
            });

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_EC_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const act = repo.updateWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        });

        it('updateWithExercises_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.updateWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Workout session not found');
        });

        it('updateWithExercises_EC_existingExerciseIdKept_returnsUpdatedSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {id: 'se-uuid-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0},
            ];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            const updatedMock = {
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [{...MOCK_SESSION_EXERCISE, sets: 4, reps: 8, weight: 90.0}]
            };
            prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
                const tx = mockDeep<PrismaClient>();
                tx.workoutSessionExercise.findMany.mockResolvedValue([{id: 'se-uuid-001'}] as WorkoutSessionExercise[]);
                tx.workoutSessionExercise.update.mockResolvedValue(MOCK_SESSION_EXERCISE);
                tx.workoutSession.update.mockResolvedValue(updatedMock);
                return (fn as (tx: PrismaClient) => Promise<never>)(tx);
            });

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
            expect(result.exercises[0].sets).toBe(4);
            expect(result).toEqual(updatedMock);
        });

        it('updateWithExercises_EC_staleExerciseRemoved_returnsUpdatedSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {exerciseId: EXERCISE_ID, sets: 5, reps: 5, weight: 100.0},
            ];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            const txMock = mockDeep<PrismaClient>();
            txMock.workoutSessionExercise.findMany.mockResolvedValue([{id: 'se-uuid-001'}] as WorkoutSessionExercise[]);
            txMock.workoutSessionExercise.deleteMany.mockResolvedValue({count: 1});
            txMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            txMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
            prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
                (fn as (tx: PrismaClient) => Promise<never>)(txMock),
            );

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_EC_mixedExercises_returnsUpdatedSession', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {id: 'se-uuid-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0},
                {exerciseId: 'exercise-uuid-002', sets: 2, reps: 15, weight: 30.0},
            ];
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

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_EC_transactionFails_throwsTransactionError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            prismaMock.$transaction.mockRejectedValue(new Error('DB connection lost'));

            const act = repo.updateWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(TransactionError);
            await expect(act).rejects.toThrow('DB connection lost');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWithExercises_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = '';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.updateWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWithExercises_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.updateWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWithExercises_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            prismaMock.workoutSession.findUnique.mockResolvedValue({...MOCK_SESSION, id: 'a'});
            const expectedReturn = {...MOCK_SESSION_WITH_EXERCISES, id: 'a'};
            prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
                const tx = mockDeep<PrismaClient>();
                tx.workoutSessionExercise.findMany.mockResolvedValue([]);
                tx.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
                tx.workoutSession.update.mockResolvedValue(expectedReturn);
                return (fn as (tx: PrismaClient) => Promise<never>)(tx);
            });

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe('a');
            expect(result).toEqual(expectedReturn);
        });

        it('updateWithExercises_BVA_oneExercise_returnsUpdatedSessionWithOneExercise', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [{
                exerciseId: EXERCISE_ID,
                sets: 3,
                reps: 10,
                weight: 80.0
            }];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
                const tx = mockDeep<PrismaClient>();
                tx.workoutSessionExercise.findMany.mockResolvedValue([]);
                tx.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
                tx.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
                return (fn as (tx: PrismaClient) => Promise<never>)(tx);
            });

            const result = await repo.updateWithExercises(inputId, inputData, inputExercises);

            expect(result.exercises).toHaveLength(1);
            expect(result.exercises[0].exerciseId).toBe(EXERCISE_ID);
        });
    });
});

describe('delete', () => {
    describe('Equivalence Classes', () => {
        it('delete_EC_existingSessionId_resolvesSuccessfully', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = SESSION_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION);
            prismaMock.workoutSession.delete.mockResolvedValue(MOCK_SESSION);

            const act = repo.delete(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('delete_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = NONEXISTENT_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Workout session not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('delete_BVA_emptyId_throwsNotFoundError', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repo.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const repoActual = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const act = repoActual.delete(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const repo = WorkoutSessionRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.workoutSession.findUnique.mockResolvedValue({...MOCK_SESSION, id: 'a'});
            prismaMock.workoutSession.delete.mockResolvedValue({...MOCK_SESSION, id: 'a'});

            const act = repo.delete(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});
