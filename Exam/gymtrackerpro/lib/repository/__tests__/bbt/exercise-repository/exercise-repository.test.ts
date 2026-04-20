import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import type {Exercise} from "@/lib/domain/exercise";
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {CreateExerciseInput, UpdateExerciseInput} from "@/lib/schema/exercise-schema";
import {ExerciseRepository} from '@/lib/repository/exercise-repository';

const prismaMock = mockDeep<PrismaClient>();

const EXERCISE_ID: string = 'exercise-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bench Press',
    description: 'Classic chest compound exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const CREATE_EXERCISE_INPUT: CreateExerciseInput = {
    name: 'Bench Press',
    description: 'Classic chest compound exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
};

const UPDATE_EXERCISE_INPUT: UpdateExerciseInput = {
    name: 'Incline Bench Press',
};

beforeEach(() => {
    mockReset(prismaMock);
    (ExerciseRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('create', () => {
    it('create_newExerciseName_returnsCreatedExercise', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(null);
        prismaMock.exercise.create.mockResolvedValue(MOCK_EXERCISE);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputData = CREATE_EXERCISE_INPUT;

        const result = await repo.create(inputData);

        expect(result.id).toBe(EXERCISE_ID);
        expect(result.name).toBe('Bench Press');
    });

    it('create_duplicateExerciseName_throwsConflictError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputData = CREATE_EXERCISE_INPUT;

        const act = repo.create(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('findById', () => {
    it('findById_existingExerciseId_returnsExercise', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;

        const result = await repo.findById(inputId);

        expect(result.id).toBe(EXERCISE_ID);
        expect(result.name).toBe('Bench Press');
    });

    it('findById_nonExistentExerciseId_throwsNotFoundError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(null);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.findById(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('findAll', () => {
    it('findAll_noOptions_returnsOnlyActiveExercises', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);

        const result = await repo.findAll();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('findAll_withSearchTerm_passesNameFilterToQuery', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {search: 'Bench'};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('findAll_withMuscleGroup_filtersByMuscleGroup', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {muscleGroup: MuscleGroup.CHEST};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
    });

    it('findAll_withIncludeInactiveTrue_returnsAllExercises', async () => {
        const inactiveExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, inactiveExercise]);
        prismaMock.exercise.count.mockResolvedValue(2);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {includeInactive: true};

        const result = await repo.findAll(inputOptions);

        expect(result.total).toBe(2);
    });

    it('findAll_withPagination_returnsRequestedPage', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([]);
        prismaMock.exercise.count.mockResolvedValue(25);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {page: 3, pageSize: 10};

        const result = await repo.findAll(inputOptions);

        expect(result.total).toBe(25);
        expect(result.items).toHaveLength(0);
    });

    it('findAll_noMatchingExercises_returnsEmptyPageResult', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([]);
        prismaMock.exercise.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {search: 'NonExistentExercise'};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('findAll_defaultPagination_usesPageOneAndPageSizeTen', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);

        await repo.findAll();

        const findManyCall = prismaMock.exercise.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(0);
        expect(findManyCall?.take).toBe(10);
    });

    it('findAll_pageOneBoundary_skipIsZero', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {page: 1, pageSize: 10};

        await repo.findAll(inputOptions);

        const findManyCall = prismaMock.exercise.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(0);
    });

    it('findAll_pageTwoBoundary_skipIs10', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([]);
        prismaMock.exercise.count.mockResolvedValue(15);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {page: 2, pageSize: 10};

        await repo.findAll(inputOptions);

        const findManyCall = prismaMock.exercise.findMany.mock.calls[0][0];
        expect(findManyCall?.skip).toBe(10);
    });

    it('findAll_withIncludeInactiveFalse_returnsOnlyActiveExercises', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {includeInactive: false};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(result.items[0].isActive).toBe(true);
    });

    it('findAll_withSearchAndMuscleGroup_returnsFilteredExercises', async () => {
        prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
        prismaMock.exercise.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((fns: unknown) => Promise.all(fns as Promise<unknown>[]));
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputOptions = {search: 'Bench', muscleGroup: MuscleGroup.CHEST};

        const result = await repo.findAll(inputOptions);

        expect(result.items).toHaveLength(1);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });
});

describe('update', () => {
    it('update_existingExerciseValidData_returnsUpdatedExercise', async () => {
        prismaMock.exercise.findUnique
            .mockResolvedValueOnce(MOCK_EXERCISE)
            .mockResolvedValueOnce(null);
        prismaMock.exercise.update.mockResolvedValue({...MOCK_EXERCISE, name: 'Incline Bench Press'});
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputData = UPDATE_EXERCISE_INPUT;

        const result = await repo.update(inputId, inputData);

        expect(result.name).toBe('Incline Bench Press');
    });

    it('update_nonExistentExerciseId_throwsNotFoundError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(null);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_EXERCISE_INPUT;

        const act = repo.update(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('update_duplicateExerciseName_throwsConflictError', async () => {
        prismaMock.exercise.findUnique
            .mockResolvedValueOnce(MOCK_EXERCISE)
            .mockResolvedValueOnce({...MOCK_EXERCISE, id: 'other-exercise-id'});
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputData = {name: 'Existing Exercise'};

        const act = repo.update(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('update_sameNameAsCurrentExercise_skipsConflictCheckAndUpdates', async () => {
        prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
        prismaMock.exercise.update.mockResolvedValue(MOCK_EXERCISE);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputData = {name: MOCK_EXERCISE.name};

        const result = await repo.update(inputId, inputData);

        expect(result.name).toBe('Bench Press');
        expect(prismaMock.exercise.findUnique).toHaveBeenCalledTimes(1);
    });

    it('update_withoutNameField_doesNotCheckForConflict', async () => {
        prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
        prismaMock.exercise.update.mockResolvedValue({...MOCK_EXERCISE, description: 'Updated description'});
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputData = {description: 'Updated description'};

        const result = await repo.update(inputId, inputData);

        expect(result.description).toBe('Updated description');
    });
});

describe('setActive', () => {
    it('setActive_existingExerciseSetFalse_archivesExercise', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        prismaMock.exercise.update.mockResolvedValue({...MOCK_EXERCISE, isActive: false});
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputIsActive = false;

        const result = await repo.setActive(inputId, inputIsActive);

        expect(result.isActive).toBe(false);
    });

    it('setActive_existingExerciseSetTrue_restoresExercise', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue({...MOCK_EXERCISE, isActive: false});
        prismaMock.exercise.update.mockResolvedValue({...MOCK_EXERCISE, isActive: true});
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;
        const inputIsActive = true;

        const result = await repo.setActive(inputId, inputIsActive);

        expect(result.isActive).toBe(true);
    });

    it('setActive_nonExistentExerciseId_throwsNotFoundError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(null);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;
        const inputIsActive = false;

        const act = repo.setActive(inputId, inputIsActive);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('delete', () => {
    it('delete_existingUnreferencedExercise_resolvesWithoutError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        prismaMock.workoutSessionExercise.count.mockResolvedValue(0);
        prismaMock.exercise.delete.mockResolvedValue(MOCK_EXERCISE);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;

        const act = repo.delete(inputId);

        await expect(act).resolves.toBeUndefined();
    });

    it('delete_nonExistentExerciseId_throwsNotFoundError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(null);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = NONEXISTENT_ID;

        const act = repo.delete(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('delete_exerciseReferencedInWorkoutSession_throwsConflictError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        prismaMock.workoutSessionExercise.count.mockResolvedValue(3);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;

        const act = repo.delete(inputId);

        await expect(act).rejects.toThrow(ConflictError);
    });

    it('delete_exerciseReferencedExactlyOnce_throwsConflictError', async () => {
        prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
        prismaMock.workoutSessionExercise.count.mockResolvedValue(1);
        const repo = ExerciseRepository.getInstance(prismaMock);
        const inputId = EXERCISE_ID;

        const act = repo.delete(inputId);

        await expect(act).rejects.toThrow(ConflictError);
    });
});