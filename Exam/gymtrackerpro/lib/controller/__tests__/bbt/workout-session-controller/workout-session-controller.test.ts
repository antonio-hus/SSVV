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

import {createWorkoutSession, getWorkoutSession, listMemberWorkoutSessions, updateWorkoutSession, updateWorkoutSessionWithExercises, deleteWorkoutSession} from '@/lib/controller/workout-session-controller';
import {workoutSessionService} from '@/lib/di';
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import type {WorkoutSession, WorkoutSessionWithExercises, WorkoutSessionListOptions} from '@/lib/domain/workout-session';
import type {PageResult} from '@/lib/domain/pagination';
import {NotFoundError, AppError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput, WorkoutSessionExerciseUpdateInput} from "@/lib/schema/workout-session-schema";

const workoutSessionServiceMock = workoutSessionService as unknown as {
    createWorkoutSession: jest.Mock;
    getWorkoutSession: jest.Mock;
    listMemberWorkoutSessions: jest.Mock;
    updateWorkoutSession: jest.Mock;
    updateWorkoutSessionWithExercises: jest.Mock;
    deleteWorkoutSession: jest.Mock;
};

const SESSION_ID: string = 'session-001';
const MEMBER_ID: string = 'member-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const VALID_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-06-15',
    duration: 90,
};

const VALID_EXERCISES: WorkoutSessionExerciseInput[] = [
    {exerciseId: 'ex-001', sets: 3, reps: 10, weight: 50},
];

const VALID_UPDATE_INPUT: UpdateWorkoutSessionInput = {
    date: '2024-06-20',
    duration: 60,
};

const VALID_UPDATE_EXERCISES: WorkoutSessionExerciseUpdateInput[] = [
    {exerciseId: 'ex-001', sets: 4, reps: 12, weight: 55},
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
            id: 'wse-001',
            workoutSessionId: SESSION_ID,
            exerciseId: 'ex-001',
            sets: 3,
            reps: 10,
            weight: 50,
            exercise: {
                id: 'ex-001',
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
    it('createWorkoutSession_validSessionAndExercises_returnsSuccessWithSession', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(true);
        expect((result as {
            success: true;
            data: WorkoutSessionWithExercises
        }).data).toEqual(MOCK_SESSION_WITH_EXERCISES);
    });

    it('createWorkoutSession_validInput_passesCorrectArgumentsToService', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalledWith(inputSession, inputExercises);
    });

    it('createWorkoutSession_memberIdAtLowerBoundary1Char_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT, memberId: 'x'};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_memberIdBelowLowerBoundary0Chars_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, memberId: ''};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_memberIdWhitespaceOnly_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, memberId: '   '};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_dateValidIsoFormat_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT, date: '2024-06-15'};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_dateSlashSeparated_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, date: '15/06/2024'};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_dateFreeText_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, date: 'not-a-date'};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_durationAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT, duration: 0};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_durationBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, duration: -1};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_durationAtUpperBoundary180_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT, duration: 180};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_durationAboveUpperBoundary181_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, duration: 181};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_notesAtUpperBoundary1024Chars_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT, notes: 'a'.repeat(1024)};
        const inputExercises = [...VALID_EXERCISES];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_notesAboveUpperBoundary1025Chars_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT, notes: 'a'.repeat(1025)};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_exercisesArrayAtLowerBoundary1Item_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 50}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_exercisesArrayBelowLowerBoundaryEmpty_returnsFailureWithMessage', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises: typeof VALID_EXERCISES = [];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBeDefined();
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_exerciseIdEmpty_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: '', sets: 3, reps: 10, weight: 50}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_setsAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 0, reps: 10, weight: 50}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_setsBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: -1, reps: 10, weight: 50}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_setsAtUpperBoundary6_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 6, reps: 10, weight: 50}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_setsAboveUpperBoundary7_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 7, reps: 10, weight: 50}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_repsAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 0, weight: 50}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_repsBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: -1, weight: 50}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_repsAtUpperBoundary30_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 30, weight: 50}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_repsAboveUpperBoundary31_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 31, weight: 50}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_weightAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 0}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_weightBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: -1}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_weightAtUpperBoundary500_passesValidation', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 500}];

        await createWorkoutSession(inputSession, inputExercises);

        expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalled();
    });

    it('createWorkoutSession_weightAboveUpperBoundary501_returnsValidationError', async () => {
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 501}];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSession_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new NotFoundError('Member not found'));
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('createWorkoutSession_serviceThrowsWorkoutSessionRequiresExercisesError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(
            new WorkoutSessionRequiresExercisesError('At least one exercise is required'),
        );
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('At least one exercise is required');
    });

    it('createWorkoutSession_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new Error('DB error'));
        const inputSession = {...VALID_SESSION_INPUT};
        const inputExercises = [...VALID_EXERCISES];

        const result = await createWorkoutSession(inputSession, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('getWorkoutSession', () => {
    it('getWorkoutSession_existingSessionId_returnsSuccessWithSession', async () => {
        workoutSessionServiceMock.getWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;

        const result = await getWorkoutSession(inputSessionId);

        expect(result.success).toBe(true);
        expect((result as {
            success: true;
            data: WorkoutSessionWithExercises
        }).data).toEqual(MOCK_SESSION_WITH_EXERCISES);
    });

    it('getWorkoutSession_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new NotFoundError('Workout session not found'));
        const inputSessionId = NONEXISTENT_ID;

        const result = await getWorkoutSession(inputSessionId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Workout session not found');
    });

    it('getWorkoutSession_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new Error('DB error'));
        const inputSessionId = SESSION_ID;

        const result = await getWorkoutSession(inputSessionId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('listMemberWorkoutSessions', () => {
    it('listMemberWorkoutSessions_existingMemberId_returnsSuccessWithSessionsPage', async () => {
        workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);
        const inputMemberId = MEMBER_ID;

        const result = await listMemberWorkoutSessions(inputMemberId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: PageResult<WorkoutSessionWithExercises> }).data.total).toBe(1);
    });

    it('listMemberWorkoutSessions_withDateRangeOptions_passesOptionsToService', async () => {
        workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(MOCK_PAGE_SESSIONS);
        const inputMemberId = MEMBER_ID;
        const inputOptions: WorkoutSessionListOptions = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
        };

        const result = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        expect(result.success).toBe(true);
        expect(workoutSessionServiceMock.listMemberWorkoutSessions).toHaveBeenCalledWith(inputMemberId, inputOptions);
    });

    it('listMemberWorkoutSessions_withPagination_passesPaginationToService', async () => {
        workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue({items: [], total: 30});
        const inputMemberId = MEMBER_ID;
        const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 10};

        const result = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        expect(result.success).toBe(true);
        expect(workoutSessionServiceMock.listMemberWorkoutSessions).toHaveBeenCalledWith(inputMemberId, inputOptions);
    });

    it('listMemberWorkoutSessions_serviceThrowsAppError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.listMemberWorkoutSessions.mockRejectedValue(new AppError('Service error'));
        const inputMemberId = MEMBER_ID;

        const result = await listMemberWorkoutSessions(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Service error');
    });

    it('listMemberWorkoutSessions_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.listMemberWorkoutSessions.mockRejectedValue(new Error('DB error'));
        const inputMemberId = MEMBER_ID;

        const result = await listMemberWorkoutSessions(inputMemberId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('updateWorkoutSession', () => {
    it('updateWorkoutSession_validInput_returnsSuccessWithUpdatedSession', async () => {
        const updatedSession: WorkoutSession = {...MOCK_SESSION, duration: 60};
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(updatedSession);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: WorkoutSession }).data.duration).toBe(60);
    });

    it('updateWorkoutSession_emptyObject_returnsSuccess', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSession_durationAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {duration: 0};

        await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(workoutSessionServiceMock.updateWorkoutSession).toHaveBeenCalled();
    });

    it('updateWorkoutSession_durationBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {duration: -1};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('updateWorkoutSession_durationAtUpperBoundary180_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {duration: 180};

        await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(workoutSessionServiceMock.updateWorkoutSession).toHaveBeenCalled();
    });

    it('updateWorkoutSession_durationAboveUpperBoundary181_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {duration: 181};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('updateWorkoutSession_dateValidIsoFormat_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {date: '2024-07-01'};

        await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(workoutSessionServiceMock.updateWorkoutSession).toHaveBeenCalled();
    });

    it('updateWorkoutSession_dateSlashSeparated_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {date: '01/07/2024'};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('updateWorkoutSession_dateFreeText_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {date: 'bad-date'};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('updateWorkoutSession_notesAtUpperBoundary1024Chars_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(MOCK_SESSION);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {notes: 'a'.repeat(1024)};

        await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(workoutSessionServiceMock.updateWorkoutSession).toHaveBeenCalled();
    });

    it('updateWorkoutSession_notesAboveUpperBoundary1025Chars_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {notes: 'a'.repeat(1025)};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('updateWorkoutSession_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));
        const inputSessionId = NONEXISTENT_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Session not found');
    });

    it('updateWorkoutSession_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(new Error('DB error'));
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};

        const result = await updateWorkoutSession(inputSessionId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('updateWorkoutSessionWithExercises', () => {
    it('updateWorkoutSessionWithExercises_validInputAndExercises_returnsSuccessWithUpdatedSession', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [...VALID_UPDATE_EXERCISES];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(true);
        expect((result as {
            success: true;
            data: WorkoutSessionWithExercises
        }).data).toEqual(MOCK_SESSION_WITH_EXERCISES);
    });

    it('updateWorkoutSessionWithExercises_exercisesArrayAtLowerBoundary1Item_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 50}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_exercisesArrayBelowLowerBoundaryEmpty_returnsFailureWithMessage', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises: typeof VALID_UPDATE_EXERCISES = [];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_setsAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 0, reps: 10, weight: 50}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_setsBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: -1, reps: 10, weight: 50}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_setsAtUpperBoundary6_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 6, reps: 10, weight: 50}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_setsAboveUpperBoundary7_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 7, reps: 10, weight: 50}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_repsAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 0, weight: 50}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_repsBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: -1, weight: 50}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_repsAtUpperBoundary30_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 30, weight: 50}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_repsAboveUpperBoundary31_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 31, weight: 50}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_weightAtLowerBoundary0_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 0}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_weightBelowLowerBoundaryNegative1_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: -1}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_weightAtUpperBoundary500_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 500}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_weightAboveUpperBoundary501_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{exerciseId: 'ex-001', sets: 3, reps: 10, weight: 501}];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_durationAboveUpperBoundary181_returnsValidationError', async () => {
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {duration: 181};
        const inputExercises = [...VALID_UPDATE_EXERCISES];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_withOptionalExerciseId_passesValidation', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [{id: 'wse-001', exerciseId: 'ex-001', sets: 4, reps: 12, weight: 55}];

        await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalled();
    });

    it('updateWorkoutSessionWithExercises_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(new NotFoundError('Session not found'));
        const inputSessionId = NONEXISTENT_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [...VALID_UPDATE_EXERCISES];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Session not found');
    });

    it('updateWorkoutSessionWithExercises_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(new Error('DB error'));
        const inputSessionId = SESSION_ID;
        const inputUpdateData = {...VALID_UPDATE_INPUT};
        const inputExercises = [...VALID_UPDATE_EXERCISES];

        const result = await updateWorkoutSessionWithExercises(inputSessionId, inputUpdateData, inputExercises);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('deleteWorkoutSession', () => {
    it('deleteWorkoutSession_existingSessionId_returnsSuccessWithUndefinedData', async () => {
        workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);
        const inputSessionId = SESSION_ID;

        const result = await deleteWorkoutSession(inputSessionId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: undefined }).data).toBeUndefined();
    });

    it('deleteWorkoutSession_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new NotFoundError('Session not found'));
        const inputSessionId = NONEXISTENT_ID;

        const result = await deleteWorkoutSession(inputSessionId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Session not found');
    });

    it('deleteWorkoutSession_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new Error('DB error'));
        const inputSessionId = SESSION_ID;

        const result = await deleteWorkoutSession(inputSessionId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});