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
const OTHER_EXERCISE_ID: string = 'exercise-uuid-002';
const NONEXISTENT_ID: string = 'nonexistent-id';
const DATE_STR: string = '2024-06-15';
const DATE_OBJ: Date = new Date(DATE_STR);

const VALID_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: DATE_STR,
    duration: 60,
    notes: 'Good session',
};

const VALID_EXERCISES: WorkoutSessionExerciseInput[] = [
    {exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 80.0},
];

const VALID_UPDATE_INPUT: UpdateWorkoutSessionInput = {
    date: '2024-06-20',
    duration: 75,
    notes: 'Updated notes',
};

const VALID_UPDATE_EXERCISES: WorkoutSessionExerciseUpdateInput[] = [
    {exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 90.0},
];

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: DATE_OBJ,
    duration: 60,
    notes: 'Good session',
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
            weight: 80.0,
            exercise: {
                id: EXERCISE_ID,
                name: 'Bench Press',
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
        it('createWorkoutSession_EC_allFieldsValid_returnsSuccessWithSession', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
            }
        });

        it('createWorkoutSession_EC_multipleExercises_returnsSuccessWithAllExercises', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [
                ...VALID_EXERCISES,
                {exerciseId: OTHER_EXERCISE_ID, sets: 4, reps: 12, weight: 20.0},
            ];
            const multiMock = {
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [
                    MOCK_SESSION_WITH_EXERCISES.exercises[0],
                    {...MOCK_SESSION_WITH_EXERCISES.exercises[0], id: 'wse-002', exerciseId: OTHER_EXERCISE_ID}
                ]
            };
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(multiMock);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exercises).toHaveLength(2);
            }
        });

        it('createWorkoutSession_EC_notesAbsent_returnsSuccess', async () => {
            const {notes, ...inputSession} = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;
            const mockNoNotes = {...MOCK_SESSION_WITH_EXERCISES, notes: null};
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(mockNoNotes);

            const result = await createWorkoutSession(inputSession as never, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBeNull();
            }
        });

        it('createWorkoutSession_EC_notesEmptyString_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, notes: ''};
            const inputExercises = VALID_EXERCISES;
            const mockEmptyNotes = {...MOCK_SESSION_WITH_EXERCISES, notes: ''};
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(mockEmptyNotes);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSession_EC_missingMemberId_returnsValidationError', async () => {
            const {memberId, ...inputSession} = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession as never, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_memberIdWhitespaceOnly_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, memberId: '   '};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_missingDate_returnsValidationError', async () => {
            const {date, ...inputSession} = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession as never, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.date).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_invalidDateFormat_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, date: '15/06/2024'};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.date).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_missingDuration_returnsValidationError', async () => {
            const {duration, ...inputSession} = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession as never, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('createWorkoutSession_EC_emptyExercisesArray_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('At least one exercise is required');
            }
        });

        it('createWorkoutSession_EC_missingExerciseId_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{sets: 3, reps: 10, weight: 80}] as never;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_EC_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new NotFoundError('Member not found'));

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });

        it('createWorkoutSession_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new TransactionError('DB failure'));

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis - Session', () => {
        it('createWorkoutSession_BVA_memberId0Chars_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, memberId: ''};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('createWorkoutSession_BVA_memberId1Char_returnsSuccess', async () => {
            const inputId = 'A';
            const inputSession = {...VALID_SESSION_INPUT, memberId: inputId};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, memberId: inputId});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputId);
            }
        });

        it('createWorkoutSession_BVA_memberId2Chars_returnsSuccess', async () => {
            const inputId = 'AB';
            const inputSession = {...VALID_SESSION_INPUT, memberId: inputId};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, memberId: inputId});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputId);
            }
        });

        it('createWorkoutSession_BVA_durationMinus1_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: -1};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('createWorkoutSession_BVA_duration0_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: 0};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 0});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('createWorkoutSession_BVA_duration1_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: 1};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 1});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(1);
            }
        });

        it('createWorkoutSession_BVA_duration179_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: 179};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 179});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(179);
            }
        });

        it('createWorkoutSession_BVA_duration180_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: 180};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, duration: 180});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('createWorkoutSession_BVA_duration181_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, duration: 181};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('createWorkoutSession_BVA_notes0Chars_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, notes: ''};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, notes: ''});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSession_BVA_notes1Char_returnsSuccess', async () => {
            const inputSession = {...VALID_SESSION_INPUT, notes: 'A'};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, notes: 'A'});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A');
            }
        });

        it('createWorkoutSession_BVA_notes1023Chars_returnsSuccess', async () => {
            const inputNotes = 'A'.repeat(1023);
            const inputSession = {...VALID_SESSION_INPUT, notes: inputNotes};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, notes: inputNotes});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe(inputNotes);
            }
        });

        it('createWorkoutSession_BVA_notes1024Chars_returnsSuccess', async () => {
            const inputNotes = 'A'.repeat(1024);
            const inputSession = {...VALID_SESSION_INPUT, notes: inputNotes};
            const inputExercises = VALID_EXERCISES;
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, notes: inputNotes});

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe(inputNotes);
            }
        });

        it('createWorkoutSession_BVA_notes1025Chars_returnsValidationError', async () => {
            const inputSession = {...VALID_SESSION_INPUT, notes: 'A'.repeat(1025)};
            const inputExercises = VALID_EXERCISES;

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.notes).toBeDefined();
            }
        });
    });

    describe('Boundary Value Analysis - Exercises', () => {
        const testEx = VALID_EXERCISES[0];

        it('createWorkoutSession_BVA_setsMinus1_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: -1}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_BVA_sets0_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: 0}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_sets1_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: 1}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_sets5_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: 5}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_sets6_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: 6}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_sets7_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, sets: 7}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_BVA_repsMinus1_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: -1}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_BVA_reps0_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: 0}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_reps1_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: 1}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_reps29_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: 29}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_reps30_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: 30}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_reps31_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, reps: 31}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_BVA_weightMinus0point1_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: -0.1}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });

        it('createWorkoutSession_BVA_weight0_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: 0}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_weight0point1_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: 0.1}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_weight499point9_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: 499.9}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_weight500_returnsSuccess', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: 500}];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSession_BVA_weight500point1_returnsValidationError', async () => {
            const inputSession = VALID_SESSION_INPUT;
            const inputExercises = [{...testEx, weight: 500.1}];

            const result = await createWorkoutSession(inputSession, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Invalid exercises');
            }
        });
    });
});

describe('getWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('getWorkoutSession_EC_existingId_returnsSuccessWithSession', async () => {
            const inputId = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
            }
        });

        it('getWorkoutSession_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Session not found');
            }
        });

        it('getWorkoutSession_EC_unexpectedError_returnsGenericFailure', async () => {
            const inputId = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new Error('Internal failure'));

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getWorkoutSession_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Session not found');
            }
        });

        it('getWorkoutSession_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Session not found');
            }
        });

        it('getWorkoutSession_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId = 'a';
            workoutSessionServiceMock.getWorkoutSession.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, id: inputId});

            const result = await getWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });
    });
});

describe('listMemberWorkoutSessions', () => {
    describe('Equivalence Classes', () => {
        it('listMemberWorkoutSessions_EC_existingMemberId_returnsSuccessWithPage', async () => {
            const inputId = MEMBER_ID;
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result = await listMemberWorkoutSessions(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.total).toBe(1);
            }
        });

        it('listMemberWorkoutSessions_EC_withDateRangeOptions_returnsMatchingItems', async () => {
            const inputId = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions = {startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31')};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result = await listMemberWorkoutSessions(inputId, inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMemberWorkoutSessions_EC_multipleSessions_returnsOrderedSessionsAscending', async () => {
            const inputId = MEMBER_ID;
            const sessionA = {...MOCK_SESSION_WITH_EXERCISES, id: 'older', date: new Date('2024-01-01')};
            const sessionB = {...MOCK_SESSION_WITH_EXERCISES, id: 'newer', date: new Date('2024-12-31')};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue({items: [sessionA, sessionB], total: 2});

            const result = await listMemberWorkoutSessions(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].id).toBe('older');
                expect(result.data.items[1].id).toBe('newer');
            }
        });

        it('listMemberWorkoutSessions_EC_multipleSessionsPaginated_returnsOrderedSessionsDescending', async () => {
            const inputId = MEMBER_ID;
            const inputOptions = {page: 1, pageSize: 10};
            const sessionA = {...MOCK_SESSION_WITH_EXERCISES, id: 'older', date: new Date('2024-01-01')};
            const sessionB = {...MOCK_SESSION_WITH_EXERCISES, id: 'newer', date: new Date('2024-12-01')};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue({items: [sessionB, sessionA], total: 2});

            const result = await listMemberWorkoutSessions(inputId, inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].id).toBe('newer');
                expect(result.data.items[1].id).toBe('older');
            }
        });

        it('listMemberWorkoutSessions_EC_serviceThrowsAppError_returnsFailureWithMessage', async () => {
            const inputId = MEMBER_ID;
            workoutSessionServiceMock.listMemberWorkoutSessions.mockRejectedValue(new NotFoundError('Member not found'));

            const result = await listMemberWorkoutSessions(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listMemberWorkoutSessions_BVA_memberIdEmpty_returnsEmptyPage', async () => {
            const inputId = '';
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue({items: [], total: 0});

            const result = await listMemberWorkoutSessions(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listMemberWorkoutSessions_BVA_memberId1Char_returnsSuccess', async () => {
            const inputId = 'A';
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result = await listMemberWorkoutSessions(inputId);

            expect(result.success).toBe(true);
        });

        it('listMemberWorkoutSessions_BVA_page0_returnsFirstPage', async () => {
            const inputId = MEMBER_ID;
            const inputOptions = {page: 0};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result = await listMemberWorkoutSessions(inputId, inputOptions);

            expect(result.success).toBe(true);
        });

        it('listMemberWorkoutSessions_BVA_pageSize1_returnsOneItem', async () => {
            const inputId = MEMBER_ID;
            const inputOptions = {pageSize: 1};
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);

            const result = await listMemberWorkoutSessions(inputId, inputOptions);

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
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const expectedReturn = {...MOCK_SESSION, duration: 75};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(expectedReturn);

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(75);
            }
        });

        it('updateWorkoutSession_EC_emptyUpdateObject_returnsSuccess', async () => {
            const inputId = SESSION_ID;
            const inputData = {};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSession_EC_invalidDuration_returnsValidationError', async () => {
            const inputId = SESSION_ID;
            const inputData = {duration: -5};

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('updateWorkoutSession_EC_invalidDateFormat_returnsValidationError', async () => {
            const inputId = SESSION_ID;
            const inputData = {date: '2024.01.01'};

            const result = await updateWorkoutSession(inputId, inputData as never);

            expect(result.success).toBe(false);
        });

        it('updateWorkoutSession_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            const inputData = VALID_UPDATE_INPUT;
            workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSession_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId = 'a';
            const inputData = VALID_UPDATE_INPUT;
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue({...MOCK_SESSION, id: inputId});

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateWorkoutSession_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            const inputData = VALID_UPDATE_INPUT;
            workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateWorkoutSession_BVA_duration0_returnsSuccess', async () => {
            const inputId = SESSION_ID;
            const inputData = {duration: 0};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue({...MOCK_SESSION, duration: 0});

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSession_BVA_notes1024Chars_returnsSuccess', async () => {
            const inputNotes = 'A'.repeat(1024);
            const inputId = SESSION_ID;
            const inputData = {notes: inputNotes};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue({...MOCK_SESSION, notes: inputNotes});

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result.success).toBe(true);
        });
    });
});

describe('updateWorkoutSessionWithExercises', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSessionWithExercises_EC_validInputAndExercises_returnsUpdatedSession', async () => {
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = VALID_UPDATE_EXERCISES;
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_SESSION_WITH_EXERCISES);
            }
        });

        it('updateWorkoutSessionWithExercises_EC_emptyExercises_returnsFailureWithMessage', async () => {
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('At least one exercise is required');
            }
        });

        it('updateWorkoutSessionWithExercises_EC_invalidSessionData_returnsValidationError', async () => {
            const inputId = SESSION_ID;
            const inputData = {duration: 1000};
            const inputExercises = VALID_UPDATE_EXERCISES;

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.duration).toBeDefined();
            }
        });

        it('updateWorkoutSessionWithExercises_EC_serviceThrowsTransactionError_returnsFailureWithMessage', async () => {
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = VALID_UPDATE_EXERCISES;
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(new TransactionError('DB failure'));

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('DB failure');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSessionWithExercises_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId = 'a';
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = VALID_UPDATE_EXERCISES;
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue({...MOCK_SESSION_WITH_EXERCISES, id: inputId});

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(inputId);
            }
        });

        it('updateWorkoutSessionWithExercises_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = VALID_UPDATE_EXERCISES;
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(new NotFoundError('Not found'));

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('updateWorkoutSessionWithExercises_BVA_reps30_returnsSuccess', async () => {
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = [{...VALID_UPDATE_EXERCISES[0], reps: 30}];
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue({
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [{...MOCK_SESSION_WITH_EXERCISES.exercises[0], reps: 30}]
            });

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionWithExercises_BVA_weight500_returnsSuccess', async () => {
            const inputId = SESSION_ID;
            const inputData = VALID_UPDATE_INPUT;
            const inputExercises = [{...VALID_UPDATE_EXERCISES[0], weight: 500}];
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue({
                ...MOCK_SESSION_WITH_EXERCISES,
                exercises: [{...MOCK_SESSION_WITH_EXERCISES.exercises[0], weight: 500}]
            });

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result.success).toBe(true);
        });
    });
});

describe('deleteWorkoutSession', () => {
    describe('Equivalence Classes', () => {
        it('deleteWorkoutSession_EC_existingId_resolvesSuccessfully', async () => {
            const inputId = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });

        it('deleteWorkoutSession_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId = NONEXISTENT_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteWorkoutSession_EC_unexpectedError_returnsGenericFailure', async () => {
            const inputId = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new Error('Internal failure'));

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteWorkoutSession_BVA_emptyId_returnsFailure', async () => {
            const inputId = '';
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteWorkoutSession_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId = 'a';
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new NotFoundError('Not found'));

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Not found');
            }
        });

        it('deleteWorkoutSession_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const inputId = 'a';
            workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);

            const result = await deleteWorkoutSession(inputId);

            expect(result.success).toBe(true);
        });
    });
});
