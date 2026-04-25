import {Exercise} from "@/prisma/generated/prisma/client";

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

import {workoutSessionService} from '@/lib/di';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {PageResult} from '@/lib/domain/pagination';
import {NotFoundError} from '@/lib/domain/errors';
import {
    createWorkoutSession,
    getWorkoutSession,
    listMemberWorkoutSessions,
    updateWorkoutSession,
    updateWorkoutSessionWithExercises,
    deleteWorkoutSession,
} from '@/lib/controller/workout-session-controller';
import {Equipment, MuscleGroup} from "@/prisma/generated/prisma/enums";

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
const WSE_ID: string = 'wse-uuid-001';

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-03-15'),
    duration: 60,
    notes: 'Morning workout',
};

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
    isActive: true,
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    ...MOCK_SESSION,
    exercises: [
        {
            id: WSE_ID,
            workoutSessionId: SESSION_ID,
            exerciseId: EXERCISE_ID,
            exercise: MOCK_EXERCISE,
            sets: 3,
            reps: 10,
            weight: 20,
        },
    ],
};

const VALID_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-03-15',
    duration: 60,
    notes: 'Morning workout',
};

const VALID_EXERCISES: WorkoutSessionExerciseInput[] = [
    {exerciseId: EXERCISE_ID, sets: 3, reps: 10, weight: 20},
];

const VALID_UPDATE_SESSION_INPUT: UpdateWorkoutSessionInput = {
    notes: 'Updated notes',
};

const VALID_UPDATE_EXERCISES: WorkoutSessionExerciseUpdateInput[] = [
    {id: WSE_ID, exerciseId: EXERCISE_ID, sets: 4, reps: 12, weight: 22.5},
];

beforeEach(() => {
    jest.resetAllMocks();
});

describe('createWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('createWorkoutSession_Path1_validInputServiceSucceeds_returnsSessionWithExercises', async () => {
            const inputData: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [...VALID_EXERCISES];
            workoutSessionServiceMock.createWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({success: true, data: MOCK_SESSION_WITH_EXERCISES});
            expect(workoutSessionServiceMock.createWorkoutSession).toHaveBeenCalledWith(inputData, inputExercises);
        });

        it('createWorkoutSession_Path2_invalidSessionData_returnsValidationError', async () => {
            const inputData: CreateWorkoutSessionInput = {memberId: MEMBER_ID, date: 'not-a-date', duration: 60};
            const inputExercises: WorkoutSessionExerciseInput[] = [...VALID_EXERCISES];

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
        });

        it('createWorkoutSession_Path3_emptyExercisesArray_returnsArrayLevelErrorMessage', async () => {
            const inputData: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'At least one exercise is required'});
            expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
        });

        it('createWorkoutSession_Path4_exerciseItemInvalid_returnsGenericExerciseMessage', async () => {
            const inputData: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {exerciseId: '', sets: 3, reps: 10, weight: 20},
            ];

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'Invalid exercises'});
            expect(workoutSessionServiceMock.createWorkoutSession).not.toHaveBeenCalled();
        });

        it('createWorkoutSession_Path5_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputData: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [...VALID_EXERCISES];
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(
                new NotFoundError(`Member not found: ${MEMBER_ID}`),
            );

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('createWorkoutSession_Path6_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputData: CreateWorkoutSessionInput = {...VALID_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [...VALID_EXERCISES];
            workoutSessionServiceMock.createWorkoutSession.mockRejectedValue(new Error('Database failure'));

            const result = await createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('getWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('getWorkoutSession_Path1_serviceSucceeds_returnsSessionWithExercises', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await getWorkoutSession(inputId);

            expect(result).toEqual({success: true, data: MOCK_SESSION_WITH_EXERCISES});
            expect(workoutSessionServiceMock.getWorkoutSession).toHaveBeenCalledWith(inputId);
        });

        it('getWorkoutSession_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(
                new NotFoundError(`Workout session not found: ${SESSION_ID}`),
            );

            const result = await getWorkoutSession(inputId);

            expect(result).toEqual({success: false, message: `Workout session not found: ${SESSION_ID}`});
        });

        it('getWorkoutSession_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.getWorkoutSession.mockRejectedValue(new Error('Database failure'));

            const result = await getWorkoutSession(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('listMemberWorkoutSessions', () => {

    describe('Independent Paths', () => {

        it('listMemberWorkoutSessions_Path1_serviceSucceeds_returnsPageResult', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions | undefined = undefined;
            const pageResult: PageResult<WorkoutSessionWithExercises> = {
                items: [MOCK_SESSION_WITH_EXERCISES],
                total: 1,
            };
            workoutSessionServiceMock.listMemberWorkoutSessions.mockResolvedValue(pageResult);

            const result = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result).toEqual({success: true, data: pageResult});
            expect(workoutSessionServiceMock.listMemberWorkoutSessions).toHaveBeenCalledWith(inputMemberId, inputOptions);
        });

        it('listMemberWorkoutSessions_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions | undefined = undefined;
            workoutSessionServiceMock.listMemberWorkoutSessions.mockRejectedValue(
                new NotFoundError(`Member not found: ${MEMBER_ID}`),
            );

            const result = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('listMemberWorkoutSessions_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions | undefined = undefined;
            workoutSessionServiceMock.listMemberWorkoutSessions.mockRejectedValue(new Error('Database failure'));

            const result = await listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('updateWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('updateWorkoutSession_Path1_validInputServiceSucceeds_returnsUpdatedSession', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, notes: 'Updated notes'};
            workoutSessionServiceMock.updateWorkoutSession.mockResolvedValue(updatedSession);

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result).toEqual({success: true, data: updatedSession});
            expect(workoutSessionServiceMock.updateWorkoutSession).toHaveBeenCalledWith(inputId, inputData);
        });

        it('updateWorkoutSession_Path2_invalidSessionData_returnsValidationError', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: 'not-a-valid-date'};

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(workoutSessionServiceMock.updateWorkoutSession).not.toHaveBeenCalled();
        });

        it('updateWorkoutSession_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(
                new NotFoundError(`Workout session not found: ${SESSION_ID}`),
            );

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result).toEqual({success: false, message: `Workout session not found: ${SESSION_ID}`});
        });

        it('updateWorkoutSession_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            workoutSessionServiceMock.updateWorkoutSession.mockRejectedValue(new Error('Database failure'));

            const result = await updateWorkoutSession(inputId, inputData);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('updateWorkoutSessionWithExercises', () => {

    describe('Independent Paths', () => {

        it('updateWorkoutSessionWithExercises_Path1_validInputServiceSucceeds_returnsSessionWithExercises', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [...VALID_UPDATE_EXERCISES];
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({success: true, data: MOCK_SESSION_WITH_EXERCISES});
            expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).toHaveBeenCalledWith(
                inputId, inputData, inputExercises,
            );
        });

        it('updateWorkoutSessionWithExercises_Path2_invalidSessionData_returnsValidationError', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: 'not-a-valid-date'};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [...VALID_UPDATE_EXERCISES];

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
        });

        it('updateWorkoutSessionWithExercises_Path3_emptyExercisesArray_returnsArrayLevelErrorMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'At least one exercise is required'});
            expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
        });

        it('updateWorkoutSessionWithExercises_Path4_exerciseItemInvalid_returnsGenericExerciseMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {exerciseId: '', sets: 4, reps: 12, weight: 22.5},
            ];

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'Invalid exercises'});
            expect(workoutSessionServiceMock.updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
        });

        it('updateWorkoutSessionWithExercises_Path5_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [...VALID_UPDATE_EXERCISES];
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(
                new NotFoundError(`Workout session not found: ${SESSION_ID}`),
            );

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({success: false, message: `Workout session not found: ${SESSION_ID}`});
        });

        it('updateWorkoutSessionWithExercises_Path6_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...VALID_UPDATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [...VALID_UPDATE_EXERCISES];
            workoutSessionServiceMock.updateWorkoutSessionWithExercises.mockRejectedValue(new Error('Database failure'));

            const result = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('deleteWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('deleteWorkoutSession_Path1_serviceSucceeds_returnsVoid', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockResolvedValue(undefined);

            const result = await deleteWorkoutSession(inputId);

            expect(result).toEqual({success: true, data: undefined});
            expect(workoutSessionServiceMock.deleteWorkoutSession).toHaveBeenCalledWith(inputId);
        });

        it('deleteWorkoutSession_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(
                new NotFoundError(`Workout session not found: ${SESSION_ID}`),
            );

            const result = await deleteWorkoutSession(inputId);

            expect(result).toEqual({success: false, message: `Workout session not found: ${SESSION_ID}`});
        });

        it('deleteWorkoutSession_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = SESSION_ID;
            workoutSessionServiceMock.deleteWorkoutSession.mockRejectedValue(new Error('Database failure'));

            const result = await deleteWorkoutSession(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});