jest.mock('@/lib/di', () => ({
    workoutSessionService: {
        createWorkoutSession: jest.fn(),
        getWorkoutSession: jest.fn(),
        listMemberWorkoutSessions: jest.fn(),
        updateWorkoutSession: jest.fn(),
        updateWorkoutSessionWithExercises: jest.fn(),
        deleteWorkoutSession: jest.fn(),
    },
}));

import {
    createWorkoutSession,
    getWorkoutSession,
    listMemberWorkoutSessions,
    updateWorkoutSession,
    updateWorkoutSessionWithExercises,
    deleteWorkoutSession
} from '@/lib/controller/workout-session-controller';
import {workoutSessionService} from '@/lib/di';
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import type {WorkoutSession, WorkoutSessionWithExercises, WorkoutSessionListOptions} from '@/lib/domain/workout-session';
import type {PageResult} from '@/lib/domain/pagination';
import {NotFoundError, TransactionError} from '@/lib/domain/errors';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput
} from "@/lib/schema/workout-session-schema";
import {ActionResult} from "@/lib/domain/action-result";

const workoutSessionServiceMock = workoutSessionService as unknown as {
    createWorkoutSession: jest.Mock;
    getWorkoutSession: jest.Mock;
    listMemberWorkoutSessions: jest.Mock;
    updateWorkoutSession: jest.Mock;
    updateWorkoutSessionWithExercises: jest.Mock;
    deleteWorkoutSession: jest.Mock;
};

const SESSION_ID: string = 'session-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const EXERCISE_ID: string = 'exercise-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const VALID_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-06-15',
    duration: 90,
};

const VALID_EXERCISES: WorkoutSessionExerciseInput[] = [
    {exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 50.0},
];

const VALID_UPDATE_INPUT: UpdateWorkoutSessionInput = {
    date: '2024-06-20',
    duration: 60,
};

const VALID_UPDATE_EXERCISES: WorkoutSessionExerciseUpdateInput[] = [
    {exerciseId: EXERCISE_ID, sets: 4, reps: 12, weight: 55.0},
];

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-06-15'),
    duration: 90,
    notes: null,
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    ...MOCK_SESSION,
    exercises: [
        {
            id: 'wse-uuid-001',
            workoutSessionId: SESSION_ID,
            exerciseId: EXERCISE_ID,
            sets: 3,
            reps: 10,
            weight: 50.0,
            exercise: {
                id: EXERCISE_ID,
                name: 'Bench Press Classic',
                description: null,
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
                isActive: true,
            },
        },
    ],
};

const MOCK_PAGE_SESSIONS: PageResult<WorkoutSessionWithExercises> = {
    items: [MOCK_SESSION_WITH_EXERCISES],
    total: 1,
};

beforeEach(() => {
    Object.values(workoutSessionServiceMock).forEach(fn => fn.mockReset());
});

describe('createWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('createWorkoutSession_EC_validSessionAndExercises_returnsSuccessWithSession', async () => {
            const inputSession: CreateWorkoutSessionInput = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
                expect(result.data.memberId).toBe(inputSession.memberId);
            }
        });

        it('createWorkoutSession_EC_missingMemberId_returnsValidationError', async () => {
            const inputSession = {date: '2024-06-15', duration: 90};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession as any, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_invalidDate_returnsValidationError', async () => {
            const inputSession: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT, date: 'not-a-date'};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.date).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_emptyExercises_returnsFailureWithMessage', async () => {
            const inputSession: CreateWorkoutSessionInput = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('At least one exercise is required');
            }
        });

        it('createWorkoutSession_EC_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
            const inputSession: CreateWorkoutSessionInput = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new NotFoundError('Member not found'));

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });

        it('createWorkoutSession_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputSession: CreateWorkoutSessionInput = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new TransactionError('DB failure'));

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createWorkoutSession_BVA_duration0_returnsSuccess', async () => {
            const inputSession: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT, duration: 0};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 0});

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('createWorkoutSession_BVA_duration180_returnsSuccess', async () => {
            const inputSession: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT, duration: 180};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 180});

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('createWorkoutSession_BVA_duration181_returnsValidationError', async () => {
            const inputSession: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT, duration: 181};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('createWorkoutSession_BVA_existingOneCharMemberId_returnsSuccess', async () => {
            const inputSession: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT, memberId: 'a'};
            const inputExercises: WorkoutSessionExerciseInput[] = VALID_EXERCISES;
            const expectedReturn = {...MOCK_SESSION_WITH_EXERCISES, memberId: 'a'};
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(expectedReturn);

            const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('a');
            }
        });
    });
});

describe('getWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('getWorkoutSession_EC_existingId_returnsSuccessWithSession', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('getWorkoutSession_EC_nonExistentId_returnsFailure', async () => {
            const inputId: string = NONEXISTENT_ID;
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));

            const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Session not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getWorkoutSession_BVA_existingOneCharId_returnsSession', async () => {
            const inputId: string = 'a';
            workoutSessionServiceMock.getWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, id: 'a'});

            const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
            }
        });
    });
});

describe('listMemberWorkoutSessions', () => {
    describe('Equivalence Classes', () => {
        it('listMemberWorkoutSessions_EC_existingMemberId_returnsSuccessWithPage', async () => {
            const inputMemberId: string = MEMBER_ID;
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_SESSION_WITH_EXERCISES);
                expect(result.data.total).toBe(1);
            }
        });

        it('listMemberWorkoutSessions_EC_multipleSessions_returnsOrderedSessions', async () => {
            const inputMemberId: string = MEMBER_ID;
            const sessionA = {...MOCK_SESSION_WITH_EXERCISES, id: 'older', date: new Date('2024-01-01')};
            const sessionB = {...MOCK_SESSION_WITH_EXERCISES, id: 'newer', date: new Date('2024-12-01')};
            const mockPage: PageResult<WorkoutSessionWithExercises> = {
                items: [sessionA, sessionB], // asc
                total: 2
            };
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(2);
                expect(result.data.items[0].id).toBe('older');
                expect(result.data.items[1].id).toBe('newer');
            }
        });

        it('listMemberWorkoutSessions_EC_multipleSessionsPaginated_returnsOrderedSessionsDescending', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 10};
            const sessionA = {...MOCK_SESSION_WITH_EXERCISES, id: 'older', date: new Date('2024-01-01')};
            const sessionB = {...MOCK_SESSION_WITH_EXERCISES, id: 'newer', date: new Date('2024-12-01')};
            const mockPage: PageResult<WorkoutSessionWithExercises> = {
                items: [sessionB, sessionA], // desc
                total: 2
            };
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(2);
                expect(result.data.items[0].id).toBe('newer');
                expect(result.data.items[1].id).toBe('older');
            }
        });

        it('listMemberWorkoutSessions_EC_withDateRangeOptions_returnsMatchingItems', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31')
            };
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMemberWorkoutSessions_BVA_page0_returnsFirstPage', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {page: 0};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });
    });
});

describe('updateWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSession_EC_validInput_returnsUpdatedSession', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = VALID_UPDATE_INPUT;
            const expectedReturn = {...MOCK_SESSION, duration: 60};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(expectedReturn);

            const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(60);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateWorkoutSession_EC_invalidDuration_returnsValidationError', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {duration: -5};

            const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSession_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = {duration: 45};
            const expectedReturn = {...MOCK_SESSION, id: 'a', duration: 45};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(expectedReturn);

            const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
                expect(result.data.duration).toBe(45);
            }
        });
    });
});

describe('updateWorkoutSessionWithExercises', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSessionWithExercises_EC_validInputAndExercises_returnsUpdatedSession', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = VALID_UPDATE_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = VALID_UPDATE_EXERCISES;
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateWorkoutSessionWithExercises_EC_emptyExercises_returnsFailure', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = VALID_UPDATE_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('At least one exercise is required');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSessionWithExercises_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId: string = 'a';
            const inputData: UpdateWorkoutSessionInput = VALID_UPDATE_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = VALID_UPDATE_EXERCISES;
            const expectedReturn = {...MOCK_SESSION_WITH_EXERCISES, id: 'a'};
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(expectedReturn);

            const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
            }
        });
    });
});

describe('deleteWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('deleteWorkoutSession_EC_existingId_resolvesSuccessfully', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });

        it('deleteWorkoutSession_EC_nonExistentId_returnsFailure', async () => {
            const inputId: string = NONEXISTENT_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result: ActionResult<void> = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteWorkoutSession_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const inputId: string = 'a';
            workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });
    });
});
