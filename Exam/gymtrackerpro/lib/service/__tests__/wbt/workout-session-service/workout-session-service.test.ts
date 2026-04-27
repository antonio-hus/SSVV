import {mock, mockReset} from 'jest-mock-extended';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {Exercise} from '@/lib/domain/exercise';
import {PageResult} from '@/lib/domain/pagination';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {WorkoutSessionService} from '@/lib/service/workout-session-service';
import {Equipment, MuscleGroup} from "@/prisma/generated/prisma/client";

const mockWorkoutSessionRepo = mock<WorkoutSessionRepositoryInterface>();

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

const CREATE_WORKOUT_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-03-15',
    duration: 60,
    notes: 'Morning workout',
};

const UPDATE_WORKOUT_SESSION_INPUT: UpdateWorkoutSessionInput = {
    notes: 'Updated notes',
};

const WORKOUT_SESSION_EXERCISE_INPUTS: WorkoutSessionExerciseInput[] = [
    {
        exerciseId: EXERCISE_ID,
        sets: 3,
        reps: 10,
        weight: 20,
    },
];

const WORKOUT_SESSION_EXERCISE_UPDATE_INPUTS: WorkoutSessionExerciseUpdateInput[] = [
    {
        id: WSE_ID,
        exerciseId: EXERCISE_ID,
        sets: 4,
        reps: 12,
        weight: 22.5,
    },
];

beforeEach(() => {
    mockReset(mockWorkoutSessionRepo);
    (WorkoutSessionService as unknown as { instance: unknown }).instance = undefined;
});

describe('createWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('createWorkoutSession_Path1_validInput_returnsCreatedSessionWithExercises', async () => {
            const inputData: CreateWorkoutSessionInput = {...CREATE_WORKOUT_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [...WORKOUT_SESSION_EXERCISE_INPUTS];
            mockWorkoutSessionRepo.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.createWorkoutSession(inputData, inputExercises);

            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(mockWorkoutSessionRepo.create).toHaveBeenCalledWith(inputData, inputExercises);
        });

    });

});

describe('getWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('getWorkoutSession_Path1_validId_returnsSessionWithExercises', async () => {
            const inputId: string = SESSION_ID;
            mockWorkoutSessionRepo.findById.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.getWorkoutSession(inputId);

            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(mockWorkoutSessionRepo.findById).toHaveBeenCalledWith(inputId);
        });

    });

});

describe('listMemberWorkoutSessions', () => {

    describe('Independent Paths', () => {

        it('listMemberWorkoutSessions_Path1_memberIdNoOptions_returnsPageResult', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputOptions: WorkoutSessionListOptions | undefined = undefined;
            const pageResult: PageResult<WorkoutSessionWithExercises> = {
                items: [MOCK_SESSION_WITH_EXERCISES],
                total: 1,
            };
            mockWorkoutSessionRepo.findAll.mockResolvedValue(pageResult);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.listMemberWorkoutSessions(inputMemberId, inputOptions);

            expect(result).toEqual(pageResult);
            expect(mockWorkoutSessionRepo.findAll).toHaveBeenCalledWith({memberId: inputMemberId});
        });

    });

});

describe('updateWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('updateWorkoutSession_Path1_validInput_returnsUpdatedSession', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...UPDATE_WORKOUT_SESSION_INPUT};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, notes: 'Updated notes'};
            mockWorkoutSessionRepo.update.mockResolvedValue(updatedSession);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.updateWorkoutSession(inputId, inputData);

            expect(result).toEqual(updatedSession);
            expect(mockWorkoutSessionRepo.update).toHaveBeenCalledWith(inputId, inputData);
        });

    });

});

describe('updateWorkoutSessionWithExercises', () => {

    describe('Independent Paths', () => {

        it('updateWorkoutSessionWithExercises_Path1_validInput_returnsUpdatedSessionWithExercises', async () => {
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {...UPDATE_WORKOUT_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [...WORKOUT_SESSION_EXERCISE_UPDATE_INPUTS];
            mockWorkoutSessionRepo.updateWithExercises.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(mockWorkoutSessionRepo.updateWithExercises).toHaveBeenCalledWith(inputId, inputData, inputExercises);
        });

    });

});

describe('deleteWorkoutSession', () => {

    describe('Independent Paths', () => {

        it('deleteWorkoutSession_Path1_validId_resolvesVoid', async () => {
            const inputId: string = SESSION_ID;
            mockWorkoutSessionRepo.delete.mockResolvedValue(undefined);

            const service = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);
            const result = await service.deleteWorkoutSession(inputId);

            expect(result).toBeUndefined();
            expect(mockWorkoutSessionRepo.delete).toHaveBeenCalledWith(inputId);
        });

    });

});

/**
 * Singleton creation check.
 * Provided for enhanced coverage.
 * Not included in the scope of GymTrackerPro testing.
 */
describe('getInstance', () => {

    it('getInstance_Path1_returnsValidInstance', () => {
        const instance = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);

        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(WorkoutSessionService);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        const firstCall = WorkoutSessionService.getInstance(mockWorkoutSessionRepo);

        const secondRepo = mock<WorkoutSessionRepositoryInterface>();
        const secondCall = WorkoutSessionService.getInstance(secondRepo);

        expect(secondCall).toBe(firstCall);

        const internalRepo = (secondCall as unknown as { workoutSessionRepository: unknown }).workoutSessionRepository;

        expect(internalRepo).toBe(mockWorkoutSessionRepo);
        expect(internalRepo).not.toBe(secondRepo);
    });

});