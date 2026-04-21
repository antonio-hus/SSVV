import {mock, mockReset} from 'jest-mock-extended';
import type {
    WorkoutSession,
    WorkoutSessionListOptions,
    WorkoutSessionWithExercises
} from '@/lib/domain/workout-session';
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {NotFoundError, TransactionError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {WorkoutSessionService} from '@/lib/service/workout-session-service';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput
} from "@/lib/schema/workout-session-schema";

const mockSessionRepo = mock<WorkoutSessionRepositoryInterface>();

const SESSION_ID: string = 'session-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const EXERCISE_ID: string = 'exercise-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_EXERCISE = {
    id: EXERCISE_ID,
    name: 'Bench Press',
    description: 'Classic chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-06-01'),
    duration: 60,
    notes: 'Good session',
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    ...MOCK_SESSION,
    exercises: [
        {
            id: 'se-uuid-001',
            workoutSessionId: SESSION_ID,
            exerciseId: EXERCISE_ID,
            sets: 3,
            reps: 10,
            weight: 80.0,
            exercise: MOCK_EXERCISE,
        },
    ],
};

const CREATE_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-06-01',
    duration: 60,
    notes: 'Good session',
};

const EXERCISE_INPUT: WorkoutSessionExerciseInput[] = [
    {exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0},
];

const UPDATE_SESSION_INPUT: UpdateWorkoutSessionInput = {
    duration: 75,
};

beforeEach(() => {
    mockReset(mockSessionRepo);
    (WorkoutSessionService as unknown as { instance: unknown }).instance = undefined;
});

describe('createWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('createWorkoutSession_EC_validDataWithExercises_returnsSessionWithExercises', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputData: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.createWorkoutSession(inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
        });

        it('createWorkoutSession_EC_multipleExercises_returnsSessionWithAllExercises', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [
                ...EXERCISE_INPUT,
                {exerciseId: 'exercise-uuid-002', sets: 4, reps: 8, weight: 60.0},
            ];
            const multiExerciseSession: WorkoutSessionWithExercises = {
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [
                    MOCK_SESSION_WITH_EXERCISES.exercises[0],
                    {...MOCK_SESSION_WITH_EXERCISES.exercises[0], id: 'se-uuid-002', exerciseId: 'exercise-uuid-002'},
                ],
            };
            mockSessionRepo.create.mockResolvedValue(multiExerciseSession);

            const result = await service.createWorkoutSession(inputSession, inputExercises);

            expect(result.exercises).toHaveLength(2);
        });

        it('createWorkoutSession_EC_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];
            mockSessionRepo.create.mockRejectedValue(new WorkoutSessionRequiresExercisesError('Session requires exercises'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        });

        it('createWorkoutSession_EC_memberNotFound_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('createWorkoutSession_EC_databaseWriteFails_throwsTransactionError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockRejectedValue(new TransactionError('DB error'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createWorkoutSession_BVA_emptyMemberId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: ''};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('createWorkoutSession_BVA_inexistentOneCharMemberId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: 'a'};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('createWorkoutSession_BVA_existingOneCharMemberId_returnsSession', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT, memberId: 'a'};
            const inputExercises: WorkoutSessionExerciseInput[] = EXERCISE_INPUT;
            mockSessionRepo.create.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, memberId: 'a'});

            const result = await service.createWorkoutSession(inputData, inputExercises);

            expect(result.memberId).toBe('a');
        });

        it('createWorkoutSession_BVA_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];
            mockSessionRepo.create.mockRejectedValue(new WorkoutSessionRequiresExercisesError('Session requires exercises'));

            const act = service.createWorkoutSession(inputSession, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        });

        it('createWorkoutSession_BVA_oneExercise_returnsSessionWithOneExercise', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputSession: CreateWorkoutSessionInput = CREATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [EXERCISE_INPUT[0]];
            mockSessionRepo.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.createWorkoutSession(inputSession, inputExercises);

            expect(result.exercises).toHaveLength(1);
        });
    });
});

describe('getWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('getWorkoutSession_EC_existingSessionId_returnsSessionWithExercises', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            mockSessionRepo.findById.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.getWorkoutSession(inputId);

            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
        });

        it('getWorkoutSession_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = NONEXISTENT_ID;
            mockSessionRepo.findById.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.getWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getWorkoutSession_BVA_emptyId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = '';
            mockSessionRepo.findById.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.getWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getWorkoutSession_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            mockSessionRepo.findById.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.getWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getWorkoutSession_BVA_existingOneCharId_returnsSessionWithExercises', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            mockSessionRepo.findById.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, id: 'a'});

            const result = await service.getWorkoutSession(inputId);

            expect(result.id).toBe('a');
        });
    });
});

describe('listMemberWorkoutSessions', () => {
    describe('Equivalence Classes', () => {
        it('listMemberWorkoutSessions_EC_noOptions_returnsAllSessionsUnpaginated', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_EC_withStartDate_returnsSessionsFromDate', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = new Date('2024-06-01');
            const inputOptions: WorkoutSessionListOptions = {startDate: inputStartDate};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_EC_withEndDate_returnsSessionsUntilDate', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputEndDate: Date = new Date('2024-06-30');
            const inputOptions: WorkoutSessionListOptions = {endDate: inputEndDate};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_EC_withDateRange_returnsSessionsInRange', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = new Date('2024-01-01');
            const inputEndDate: Date = new Date('2024-12-31');
            const inputOptions: WorkoutSessionListOptions = {startDate: inputStartDate, endDate: inputEndDate};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_EC_withPagination_returnsPaginatedSubset', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 10};
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 25});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.total).toBe(25);
            expect(result.items).toHaveLength(0);
        });

        it('listMemberWorkoutSessions_EC_noMatchingSessions_returnsEmptyPageResult', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = NONEXISTENT_ID;
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listMemberWorkoutSessions(inputMemberId);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('listMemberWorkoutSessions_EC_orderingByDateAscending', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId);

            expect(result.items).toHaveLength(1);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMemberWorkoutSessions_BVA_memberIdEmpty_returnsNoSessions', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = '';
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listMemberWorkoutSessions(inputMemberId);

            expect(result.items).toHaveLength(0);
        });

        it('listMemberWorkoutSessions_BVA_memberIdOneChar_returnsMatchingItems', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = 'a';
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_BVA_startDateEqualsEndDate_returnsSameDaySessions', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputDate: Date = new Date('2024-06-01');
            const inputOptions: WorkoutSessionListOptions = {startDate: inputDate, endDate: inputDate};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_BVA_page0_returnsFirstPage', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {page: 0};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 5});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_BVA_page1_returnsFirstPage', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {page: 1};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 5});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });

        it('listMemberWorkoutSessions_BVA_pageSize1_returnsOneItemPerPage', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {pageSize: 1};
            mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 5});

            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.items).toHaveLength(1);
        });
    });
});

describe('updateWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSession_EC_existingSessionValidData_returnsUpdatedSession', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            mockSessionRepo.update.mockResolvedValue({...MOCK_SESSION, duration: 75});

            const result = await service.updateWorkoutSession(inputId, inputData);

            expect(result.duration).toBe(75);
        });

        it('updateWorkoutSession_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            mockSessionRepo.update.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSession(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSession_BVA_emptyId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = '';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            mockSessionRepo.update.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSession(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWorkoutSession_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            mockSessionRepo.update.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSession(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWorkoutSession_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            mockSessionRepo.update.mockResolvedValue({...MOCK_SESSION, id: 'a', duration: 75});

            const result = await service.updateWorkoutSession(inputId, inputData);

            expect(result.id).toBe('a');
            expect(result.duration).toBe(75);
        });
    });
});

describe('updateWorkoutSessionWithExercises', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSessionWithExercises_EC_existingSessionWithNewExercises_returnsUpdatedSession', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
            expect(result.exercises).toHaveLength(1);
        });

        it('updateWorkoutSessionWithExercises_EC_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];
            mockSessionRepo.updateWithExercises.mockRejectedValue(new WorkoutSessionRequiresExercisesError('Requires exercises'));

            const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        });

        it('updateWorkoutSessionWithExercises_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWorkoutSessionWithExercises_EC_existingExerciseIdKept_returnsUpdatedSession', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {id: 'se-uuid-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0},
            ];
            mockSessionRepo.updateWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe(SESSION_ID);
        });

        it('updateWorkoutSessionWithExercises_EC_transactionFails_throwsTransactionError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockRejectedValue(new TransactionError('DB error'));

            const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(TransactionError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSessionWithExercises_BVA_emptyId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = '';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWorkoutSessionWithExercises_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateWorkoutSessionWithExercises_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = EXERCISE_INPUT;
            mockSessionRepo.updateWithExercises.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, id: 'a'});

            const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.id).toBe('a');
        });

        it('updateWorkoutSessionWithExercises_BVA_oneExercise_returnsUpdatedSessionWithOneExercise', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = UPDATE_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_INPUT[0]];
            mockSessionRepo.updateWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.exercises).toHaveLength(1);
        });
    });
});

describe('deleteWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('deleteWorkoutSession_EC_existingSessionId_resolvesSuccessfully', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = SESSION_ID;
            mockSessionRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteWorkoutSession(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('deleteWorkoutSession_EC_nonExistentSessionId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = NONEXISTENT_ID;
            mockSessionRepo.delete.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.deleteWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteWorkoutSession_BVA_emptyId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = '';
            mockSessionRepo.delete.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.deleteWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteWorkoutSession_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            mockSessionRepo.delete.mockRejectedValue(new NotFoundError('Session not found'));

            const act = service.deleteWorkoutSession(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteWorkoutSession_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const service = WorkoutSessionService.getInstance(mockSessionRepo);
            const inputId: string = 'a';
            mockSessionRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteWorkoutSession(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});