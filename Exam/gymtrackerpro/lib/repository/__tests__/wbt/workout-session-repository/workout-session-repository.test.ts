import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';
import type {Member} from '@/lib/domain/user';
import type {Exercise} from '@/lib/domain/exercise';
import type {WorkoutSession, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {NotFoundError, WorkoutSessionRequiresExercisesError, TransactionError} from '@/lib/domain/errors';
import {WorkoutSessionRepository} from '@/lib/repository/workout-session-repository';

const prismaMock = mockDeep<PrismaClient>();

const SESSION_ID: string = 'session-uuid-001';
const MEMBER_ID: string = 'member-uuid-001';
const EXERCISE_ID: string = 'exercise-uuid-001';
const WSE_ID: string = 'wse-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_MEMBER: Member = {
    id: MEMBER_ID,
    userId: 'user-uuid-001',
    membershipStart: new Date('2024-01-01'),
    isActive: true,
};

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
    isActive: true,
};

const MOCK_WSE = {
    id: WSE_ID,
    workoutSessionId: SESSION_ID,
    exerciseId: EXERCISE_ID,
    sets: 3,
    reps: 10,
    weight: 20.0,
    exercise: MOCK_EXERCISE,
};

const MOCK_SESSION: WorkoutSession = {
    id: SESSION_ID,
    memberId: MEMBER_ID,
    date: new Date('2024-01-15'),
    duration: 60,
    notes: 'Morning workout',
};

const MOCK_SESSION_WITH_EXERCISES: WorkoutSessionWithExercises = {
    ...MOCK_SESSION,
    exercises: [MOCK_WSE],
};

const CREATE_SESSION_INPUT: CreateWorkoutSessionInput = {
    memberId: MEMBER_ID,
    date: '2024-01-15',
    duration: 60,
    notes: 'Morning workout',
} as const;

const EXERCISE_INPUT: WorkoutSessionExerciseInput = {
    exerciseId: EXERCISE_ID,
    sets: 3,
    reps: 10,
    weight: 20.0,
} as const;

const EXERCISE_UPDATE_NEW: WorkoutSessionExerciseUpdateInput = {
    exerciseId: EXERCISE_ID,
    sets: 3,
    reps: 10,
    weight: 20.0,
};

const EXERCISE_UPDATE_EXISTING: WorkoutSessionExerciseUpdateInput = {
    id: WSE_ID,
    exerciseId: EXERCISE_ID,
    sets: 3,
    reps: 10,
    weight: 20.0,
};

beforeEach(() => {
    mockReset(prismaMock);
    (WorkoutSessionRepository as unknown as {instance: unknown}).instance = undefined;
});

describe('create', () => {

    describe('Independent Paths', () => {

        it('create_Path1_memberExistsAndCreateSucceeds_returnsSessionWithExercises', async () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [EXERCISE_INPUT];
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER as never);
            prismaMock.workoutSession.create.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.create(inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('create_Path2_exercisesEmpty_throwsWorkoutSessionRequiresExercisesError', async () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.create(inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(WorkoutSessionRequiresExercisesError);
            await expect(action).rejects.toThrow('A workout session must include at least one exercise.');
        });

        it('create_Path3_memberNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [EXERCISE_INPUT];
            prismaMock.member.findUnique.mockResolvedValue(null);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.create(inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Member not found: ${inputData.memberId}`);
        });

        it('create_Path4_createThrows_throwsTransactionError', async () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {...CREATE_SESSION_INPUT};
            const inputExercises: WorkoutSessionExerciseInput[] = [EXERCISE_INPUT];
            prismaMock.member.findUnique.mockResolvedValue(MOCK_MEMBER as never);
            prismaMock.workoutSession.create.mockRejectedValue(new Error('db error'));

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.create(inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(TransactionError);
            await expect(action).rejects.toThrow('Failed to create workout session: db error');
        });

    });

});

describe('findById', () => {

    describe('Independent Paths', () => {

        it('findById_Path1_sessionExists_returnsSessionWithExercises', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findById(inputId);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('findById_Path2_sessionNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.findById(inputId);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Workout session not found: ${inputId}`);
        });

    });

});

describe('findAll', () => {

    describe('Independent Paths', () => {

        it('findAll_Path1_noOptions_returnsUnpaginatedAscResult', async () => {
            // Arrange
            const inputOptions = {};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path2_pageOnlyNoPageSize_returnsUnpaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path3_memberIdOnly_buildsMemberIdFilter', async () => {
            // Arrange
            const inputOptions = {memberId: MEMBER_ID};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path4_startDateOnly_buildsDateFilter', async () => {
            // Arrange
            const inputOptions = {startDate: new Date('2024-01-01')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path5_pageAndPageSize_returnsPaginatedDescResult', async () => {
            // Arrange
            const inputOptions = {page: 1, pageSize: 10};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_MCC_D3_endDateOnly_buildsDateFilter', async () => {
            // Arrange
            const inputOptions = {endDate: new Date('2024-01-31')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_MCC_D4_pageSizeOnlyNoPage_returnsUnpaginatedResult', async () => {
            // Arrange
            const inputOptions = {pageSize: 10};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path6_memberIdAndBothDates_returnsFilteredResult', async () => {
            // Arrange
            const inputOptions = {memberId: MEMBER_ID, startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path7_pageAndMemberId_returnsUnpaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, memberId: MEMBER_ID};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path8_pageAndStartDate_returnsUnpaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, startDate: new Date('2024-01-01')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path9_pageAndMemberIdAndStartDate_returnsUnpaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, memberId: MEMBER_ID, startDate: new Date('2024-01-01')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path10_paginatedWithMemberId_returnsPaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, pageSize: 10, memberId: MEMBER_ID};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path11_paginatedWithStartDate_returnsPaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, pageSize: 10, startDate: new Date('2024-01-01')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

        it('findAll_Path12_paginatedWithMemberIdAndBothDates_returnsPaginatedResult', async () => {
            // Arrange
            const inputOptions = {page: 1, pageSize: 10, memberId: MEMBER_ID, startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31')};
            prismaMock.$transaction.mockResolvedValue([[MOCK_SESSION_WITH_EXERCISES], 1] as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_SESSION_WITH_EXERCISES], total: 1});
        });

    });

});

describe('update', () => {

    describe('Independent Paths', () => {

        it('update_Path1_sessionFoundNoFields_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(MOCK_SESSION);
        });

        it('update_Path2_sessionNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.update(inputId, inputData);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Workout session not found: ${inputId}`);
        });

        it('update_Path3_dateProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: '2024-02-01'};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, date: new Date('2024-02-01')};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path4_durationProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {duration: 90};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, duration: 90};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path5_notesProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {notes: 'Updated notes'};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, notes: 'Updated notes'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path6_dateAndDurationProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: '2024-02-01', duration: 90};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, date: new Date('2024-02-01'), duration: 90};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path7_dateAndNotesProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: '2024-02-01', notes: 'Updated notes'};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, date: new Date('2024-02-01'), notes: 'Updated notes'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path8_durationAndNotesProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {duration: 90, notes: 'Updated notes'};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, duration: 90, notes: 'Updated notes'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

        it('update_Path9_allFieldsProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: '2024-02-01', duration: 90, notes: 'Updated notes'};
            const updatedSession: WorkoutSession = {...MOCK_SESSION, date: new Date('2024-02-01'), duration: 90, notes: 'Updated notes'};
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.update.mockResolvedValue(updatedSession as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedSession);
        });

    });

});

describe('updateWithExercises', () => {

    describe('Independent Paths', () => {

        it('updateWithExercises_Path1_allNewExercisesNoDeletes_returnsSessionWithExercises', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([]);
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_Path2_exercisesEmpty_throwsWorkoutSessionRequiresExercisesError', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(WorkoutSessionRequiresExercisesError);
            await expect(action).rejects.toThrow('A workout session must include at least one exercise.');
        });

        it('updateWithExercises_Path3_sessionNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Workout session not found: ${inputId}`);
        });

        it('updateWithExercises_Path4_hasExercisesToDelete_deletesAndCreatesNew', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([{id: WSE_ID} as never]);
            prismaMock.workoutSessionExercise.deleteMany.mockResolvedValue({count: 1});
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(prismaMock.workoutSessionExercise.deleteMany).toHaveBeenCalledTimes(1);
        });

        it('updateWithExercises_Path5_existingExercisesToUpdate_loopOnce', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_EXISTING];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([{id: WSE_ID} as never]);
            prismaMock.workoutSessionExercise.update.mockResolvedValue(MOCK_WSE as never);
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
            expect(prismaMock.workoutSessionExercise.update).toHaveBeenCalledTimes(1);
        });

        it('updateWithExercises_Path6_dateProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {date: '2024-02-01'};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([]);
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_Path7_durationProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {duration: 90};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([]);
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_Path8_notesProvided_returnsUpdatedSession', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {notes: 'Evening workout'};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([]);
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(result).toEqual(MOCK_SESSION_WITH_EXERCISES);
        });

        it('updateWithExercises_Path9_transactionThrows_throwsTransactionError', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockRejectedValue(new Error('tx error'));

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            await expect(action).rejects.toThrow(TransactionError);
            await expect(action).rejects.toThrow('Failed to update workout session: tx error');
        });

    });

    describe('Loop Coverage', () => {

        it('updateWithExercises_Loop_no_skipsUpdateLoop', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_NEW];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([]);
            prismaMock.workoutSessionExercise.createMany.mockResolvedValue({count: 1});
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(prismaMock.workoutSessionExercise.update).not.toHaveBeenCalled();
        });

        it('updateWithExercises_Loop_once_updatesOneExistingExercise', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [EXERCISE_UPDATE_EXISTING];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([{id: WSE_ID} as never]);
            prismaMock.workoutSessionExercise.update.mockResolvedValue(MOCK_WSE as never);
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(prismaMock.workoutSessionExercise.update).toHaveBeenCalledTimes(1);
        });

        it('updateWithExercises_Loop_twice_updatesTwoExistingExercises', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const wse2Id: string = 'wse-uuid-002';
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                EXERCISE_UPDATE_EXISTING,
                {id: wse2Id, exerciseId: EXERCISE_ID, sets: 4, reps: 12, weight: 25.0},
            ];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([
                {id: WSE_ID} as never,
                {id: wse2Id} as never,
            ]);
            prismaMock.workoutSessionExercise.update.mockResolvedValue(MOCK_WSE as never);
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(prismaMock.workoutSessionExercise.update).toHaveBeenCalledTimes(2);
        });

        it('updateWithExercises_Loop_n_updatesThreeExistingExercises', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            const inputData: UpdateWorkoutSessionInput = {};
            const wse2Id: string = 'wse-uuid-002';
            const wse3Id: string = 'wse-uuid-003';
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                EXERCISE_UPDATE_EXISTING,
                {id: wse2Id, exerciseId: EXERCISE_ID, sets: 4, reps: 12, weight: 25.0},
                {id: wse3Id, exerciseId: EXERCISE_ID, sets: 5, reps: 8, weight: 30.0},
            ];
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
            prismaMock.workoutSessionExercise.findMany.mockResolvedValue([
                {id: WSE_ID} as never,
                {id: wse2Id} as never,
                {id: wse3Id} as never,
            ]);
            prismaMock.workoutSessionExercise.update.mockResolvedValue(MOCK_WSE as never);
            prismaMock.workoutSession.update.mockResolvedValue(MOCK_SESSION_WITH_EXERCISES as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            await repository.updateWithExercises(inputId, inputData, inputExercises);

            // Assert
            expect(prismaMock.workoutSessionExercise.update).toHaveBeenCalledTimes(3);
        });

    });

});

describe('delete', () => {

    describe('Independent Paths', () => {

        it('delete_Path1_sessionExists_resolvesVoid', async () => {
            // Arrange
            const inputId: string = SESSION_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(MOCK_SESSION as never);
            prismaMock.workoutSession.delete.mockResolvedValue(MOCK_SESSION as never);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const result = await repository.delete(inputId);

            // Assert
            expect(result).toBeUndefined();
            expect(prismaMock.workoutSession.delete).toHaveBeenCalledWith({where: {id: inputId}});
        });

        it('delete_Path2_sessionNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.workoutSession.findUnique.mockResolvedValue(null);

            const repository = WorkoutSessionRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.delete(inputId);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Workout session not found: ${inputId}`);
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
        // Act
        const instance = WorkoutSessionRepository.getInstance(prismaMock);

        // Assert
        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(WorkoutSessionRepository);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        // Arrange
        const firstCall = WorkoutSessionRepository.getInstance(prismaMock);
        const secondPrismaMock = mockDeep<PrismaClient>();

        // Act
        const secondCall = WorkoutSessionRepository.getInstance(secondPrismaMock);

        // Assert
        expect(secondCall).toBe(firstCall);

        const internalClient = (secondCall as unknown as { database: unknown }).database;
        expect(internalClient).toBe(prismaMock);
        expect(internalClient).not.toBe(secondPrismaMock);
    });

});
