import {mock, mockReset} from 'jest-mock-extended';
import type {WorkoutSession, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {NotFoundError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {WorkoutSessionService} from '@/lib/service/workout-session-service';
import {CreateWorkoutSessionInput, UpdateWorkoutSessionInput, WorkoutSessionExerciseInput} from "@/lib/schema/workout-session-schema";

const mockSessionRepo = mock<WorkoutSessionRepositoryInterface>();

const SESSION_ID: string = 'session-001';
const MEMBER_ID: string = 'member-001';
const EXERCISE_ID: string = 'exercise-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-06-15'),
    duration: 90,
    notes: 'Chest day',
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    ...MOCK_SESSION,
    exercises: [
        {
            id: 'se-001',
            workoutSessionId: SESSION_ID,
            exerciseId: EXERCISE_ID,
            sets: 3,
            reps: 10,
            weight: 50,
            exercise: {
                id: EXERCISE_ID,
                name: 'Bench Press',
                description: 'Chest exercise',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
                isActive: true,
            },
        },
    ],
};

const CREATE_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-06-15',
    duration: 90,
    notes: 'Chest day',
};

const CREATE_EXERCISES_INPUT: WorkoutSessionExerciseInput[] = [
    {
        exerciseId: EXERCISE_ID,
        sets: 3,
        reps: 10,
        weight: 50
    },
];

const UPDATE_SESSION_INPUT: UpdateWorkoutSessionInput = {
    date: '2024-06-20',
    duration: 60
};

beforeEach(() => {
    mockReset(mockSessionRepo);
    (WorkoutSessionService as unknown as { instance: unknown }).instance = undefined;
});

describe('createWorkoutSession', () => {
    it('createWorkoutSession_validDataWithExercises_returnsSessionWithExercises', async () => {
        mockSessionRepo.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = CREATE_EXERCISES_INPUT;

        const result = await service.createWorkoutSession(inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
        expect(mockSessionRepo.create).toHaveBeenCalledWith(inputData, inputExercises);
    });

    it('createWorkoutSession_emptyExercisesList_throwsWorkoutSessionRequiresExercisesError', async () => {
        mockSessionRepo.create.mockRejectedValue(
            new WorkoutSessionRequiresExercisesError('Session requires at least one exercise'),
        );
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises: typeof CREATE_EXERCISES_INPUT = [];

        const act = service.createWorkoutSession(inputData, inputExercises);

        await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
    });

    it('createWorkoutSession_memberNotFound_throwsNotFoundError', async () => {
        mockSessionRepo.create.mockRejectedValue(new NotFoundError('Member not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputData = {...CREATE_SESSION_INPUT, memberId: NONEXISTENT_ID};
        const inputExercises = CREATE_EXERCISES_INPUT;

        const act = service.createWorkoutSession(inputData, inputExercises);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('createWorkoutSession_exerciseNotFound_throwsNotFoundError', async () => {
        mockSessionRepo.create.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputData = CREATE_SESSION_INPUT;
        const inputExercises = [{...CREATE_EXERCISES_INPUT[0], exerciseId: NONEXISTENT_ID}];

        const act = service.createWorkoutSession(inputData, inputExercises);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('getWorkoutSession', () => {
    it('getWorkoutSession_existingSessionId_returnsSessionWithExercises', async () => {
        mockSessionRepo.findById.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = SESSION_ID;

        const result = await service.getWorkoutSession(inputId);

        expect(result.id).toBe(SESSION_ID);
        expect(result.exercises).toHaveLength(1);
        expect(mockSessionRepo.findById).toHaveBeenCalledWith(inputId);
    });

    it('getWorkoutSession_nonExistentSessionId_throwsNotFoundError', async () => {
        mockSessionRepo.findById.mockRejectedValue(new NotFoundError('Session not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.getWorkoutSession(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('listMemberWorkoutSessions', () => {
    it('listMemberWorkoutSessions_existingMemberId_returnsPageResult', async () => {
        mockSessionRepo.findAll.mockResolvedValue({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = MEMBER_ID;

        const result = await service.listMemberWorkoutSessions(inputId);

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockSessionRepo.findAll).toHaveBeenCalledWith({memberId: inputId});
    });

    it('listMemberWorkoutSessions_withDateRangeOptions_mergesMemberIdIntoOptions', async () => {
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = MEMBER_ID;
        const inputOptions = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            page: 1,
            pageSize: 10
        };

        await service.listMemberWorkoutSessions(inputId, inputOptions);

        expect(mockSessionRepo.findAll).toHaveBeenCalledWith({memberId: inputId, ...inputOptions});
    });

    it('listMemberWorkoutSessions_memberWithNoSessions_returnsEmptyPageResult', async () => {
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = MEMBER_ID;

        const result = await service.listMemberWorkoutSessions(inputId);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(mockSessionRepo.findAll).toHaveBeenCalledWith({memberId: inputId});
    });

    it('listMemberWorkoutSessions_withPaginationOptions_mergesMemberIdAndPagination', async () => {
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 5});
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = MEMBER_ID;
        const inputOptions = {page: 2, pageSize: 5};

        await service.listMemberWorkoutSessions(inputId, inputOptions);

        expect(mockSessionRepo.findAll).toHaveBeenCalledWith({memberId: inputId, ...inputOptions});
    });
});

describe('updateWorkoutSession', () => {
    it('updateWorkoutSession_existingSessionWithValidData_returnsUpdatedSession', async () => {
        const updated = {...MOCK_SESSION, duration: 60};
        mockSessionRepo.update.mockResolvedValue(updated);
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;

        const result = await service.updateWorkoutSession(inputId, inputData);

        expect(result.duration).toBe(60);
        expect(mockSessionRepo.update).toHaveBeenCalledWith(inputId, inputData);
    });

    it('updateWorkoutSession_nonExistentSessionId_throwsNotFoundError', async () => {
        mockSessionRepo.update.mockRejectedValue(new NotFoundError('Session not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_SESSION_INPUT;

        const act = service.updateWorkoutSession(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('updateWorkoutSessionWithExercises', () => {
    it('updateWorkoutSessionWithExercises_validData_returnsUpdatedSessionWithExercises', async () => {
        mockSessionRepo.updateWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = [{id: 'se-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 60}];

        const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        expect(result.id).toBe(SESSION_ID);
        expect(mockSessionRepo.updateWithExercises).toHaveBeenCalledWith(inputId, inputData, inputExercises);
    });

    it('updateWorkoutSessionWithExercises_emptyExercisesList_throwsWorkoutSessionRequiresExercisesError', async () => {
        mockSessionRepo.updateWithExercises.mockRejectedValue(
            new WorkoutSessionRequiresExercisesError('Session requires at least one exercise'),
        );
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = SESSION_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises: typeof CREATE_EXERCISES_INPUT = [];

        const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        await expect(act).rejects.toThrow(WorkoutSessionRequiresExercisesError);
    });

    it('updateWorkoutSessionWithExercises_nonExistentSessionId_throwsNotFoundError', async () => {
        mockSessionRepo.updateWithExercises.mockRejectedValue(new NotFoundError('Session not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_SESSION_INPUT;
        const inputExercises = [{id: 'se-001', exerciseId: EXERCISE_ID, sets: 4, reps: 8, weight: 60}];

        const act = service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('deleteWorkoutSession', () => {
    it('deleteWorkoutSession_existingSessionId_deletesSuccessfully', async () => {
        mockSessionRepo.delete.mockResolvedValue(undefined);
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = SESSION_ID;

        const act = service.deleteWorkoutSession(inputId);

        await expect(act).resolves.toBeUndefined();
        expect(mockSessionRepo.delete).toHaveBeenCalledWith(inputId);
    });

    it('deleteWorkoutSession_nonExistentSessionId_throwsNotFoundError', async () => {
        mockSessionRepo.delete.mockRejectedValue(new NotFoundError('Session not found'));
        const service = WorkoutSessionService.getInstance(mockSessionRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.deleteWorkoutSession(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});