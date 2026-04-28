import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import type {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {Equipment, MuscleGroup} from '@/lib/domain/exercise';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {ExerciseRepository} from '@/lib/repository/exercise-repository';

const prismaMock = mockDeep<PrismaClient>();

const EXERCISE_ID: string = 'exercise-uuid-001';
const OTHER_EXERCISE_ID: string = 'exercise-uuid-002';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Standard Bench Press',
    description: 'Classic chest compound exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const MOCK_EXERCISE_BACK: Exercise = {
    id: OTHER_EXERCISE_ID,
    name: 'Deadlift',
    description: 'Classic back compound exercise',
    muscleGroup: MuscleGroup.BACK,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const VALID_CREATE_INPUT: CreateExerciseInput = {
    name: 'Standard Bench Press',
    description: 'Classic chest compound exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL
};

const mockTransaction = () => {
    prismaMock.$transaction.mockImplementation((fns: unknown) => {
        if (Array.isArray(fns)) {
            return Promise.all(fns);
        }
        if (typeof fns === 'function') {
            return fns(prismaMock);
        }
        return Promise.resolve(fns);
    });
};

beforeEach(() => {
    mockReset(prismaMock);
    (ExerciseRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('create', () => {
    describe('Equivalence Classes', () => {
        it('create_EC_newExerciseName_returnsCreatedExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputExercise = VALID_CREATE_INPUT;
            const expectedReturn = MOCK_EXERCISE;
            prismaMock.exercise.findUnique.mockResolvedValue(null);
            prismaMock.exercise.create.mockResolvedValue(expectedReturn);

            // Act
            const result = await repo.create(inputExercise);

            // Assert
            expect(result).toEqual(expectedReturn);
            expect(result.name).toBe(inputExercise.name);
        });

        it('create_EC_duplicateExerciseName_throwsConflictError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputExercise = VALID_CREATE_INPUT;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);

            // Act
            const act = repo.create(inputExercise);

            // Assert
            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise name already in use');
        });
    });
});

describe('findById', () => {
    describe('Equivalence Classes', () => {
        it('findById_EC_existingExerciseId_returnsExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);

            // Act
            const result = await repo.findById(inputId);

            // Assert
            expect(result).toEqual(MOCK_EXERCISE);
            expect(result.id).toBe(inputId);
        });

        it('findById_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'non-existent-id';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.findById(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findById_BVA_emptyId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.findById(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.findById(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('findById_BVA_existingOneCharId_returnsExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const expectedReturn = {...MOCK_EXERCISE, id: 'a'};
            prismaMock.exercise.findUnique.mockResolvedValue(expectedReturn);

            // Act
            const result = await repo.findById(inputId);

            // Assert
            expect(result.id).toBe('a');
            expect(result).toEqual(expectedReturn);
        });
    });
});

describe('findAll', () => {
    describe('Equivalence Classes', () => {
        it('findAll_EC_noOptions_returnsOnlyActiveExercises', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll();

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(1);
        });

        it('findAll_EC_includeInactiveFalse_returnsOnlyActiveExercises', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {includeInactive: false};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(1);
        });

        it('findAll_EC_includeInactiveTrue_returnsAllExercises', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {includeInactive: true};
            const inactiveExercise = {...MOCK_EXERCISE_BACK, isActive: false};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, inactiveExercise]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(inactiveExercise);
            expect(result.total).toBe(2);
        });

        it('findAll_EC_withMuscleGroupFilter_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.BACK);
            expect(result.items[0]).toEqual(MOCK_EXERCISE_BACK);
        });

        it('findAll_EC_withSearchAndMuscleGroupFilter_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {search: 'Bench', muscleGroup: MuscleGroup.CHEST};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.CHEST);
            expect(result.items[0].name).toContain('Bench');
        });

        it('findAll_EC_multipleExercises_returnsExercisesOrderedByNameAscending', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const exerciseA = {...MOCK_EXERCISE, id: 'a', name: 'A Exercise'};
            const exerciseB = {...MOCK_EXERCISE, id: 'b', name: 'B Exercise'};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([exerciseA, exerciseB]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll();

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.items[0].name).toBe('A Exercise');
            expect(result.items[1].name).toBe('B Exercise');
        });

        it('findAll_EC_noSearchNoMuscleGroup_returnsAllActiveExercises', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(MOCK_EXERCISE_BACK);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('findAll_BVA_searchUndefined_returnsItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {search: undefined};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_searchEmpty_returnsItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {search: ''};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_searchOneCharacter_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {search: 'a'};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('findAll_BVA_muscleGroupChest_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CHEST};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.CHEST);
        });

        it('findAll_BVA_muscleGroupShoulders_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.SHOULDERS};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(0);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_muscleGroupArms_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.ARMS};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(0);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_muscleGroupBack_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.BACK);
        });

        it('findAll_BVA_muscleGroupCore_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CORE};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(0);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_muscleGroupLegs_returnsMatchingItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.LEGS};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(0);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_muscleGroupInvalid_returnsEmptyResult', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const invalidMuscleGroup = 'INVALID' as unknown as MuscleGroup;
            const inputOptions: ExerciseListOptions = {muscleGroup: invalidMuscleGroup};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(0);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('findAll_BVA_includeInactiveUndefined_defaultsToActiveOnly', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {includeInactive: undefined};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].isActive).toBe(true);
        });

        it('findAll_BVA_includeInactiveFalse_returnsActiveItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {includeInactive: false};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0].isActive).toBe(true);
        });

        it('findAll_BVA_includeInactiveTrue_returnsAllItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {includeInactive: true};
            const inactiveExercise = {...MOCK_EXERCISE_BACK, isActive: false};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE, inactiveExercise]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(inactiveExercise);
        });

        it('findAll_BVA_pageUndefined_returnsFirstPage', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {page: undefined};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('findAll_BVA_page0_returnsFirstPage', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {page: 0};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('findAll_BVA_page1_returnsFirstPage', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {page: 1};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('findAll_BVA_page2_returnsSecondPage', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {page: 2, pageSize: 10};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE_BACK]);
            prismaMock.exercise.count.mockResolvedValue(11);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE_BACK);
            expect(result.total).toBe(11);
        });

        it('findAll_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {pageSize: undefined};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(1);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('findAll_BVA_pageSize0_returnsNoItems', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {pageSize: 0};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(2);
        });

        it('findAll_BVA_pageSize1_returnsOneItem', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputOptions: ExerciseListOptions = {pageSize: 1};
            mockTransaction();
            prismaMock.exercise.findMany.mockResolvedValue([MOCK_EXERCISE]);
            prismaMock.exercise.count.mockResolvedValue(2);

            // Act
            const result = await repo.findAll(inputOptions);

            // Assert
            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(2);
        });
    });
});

describe('update', () => {
    describe('Equivalence Classes', () => {
        it('update_EC_existingExerciseValidData_returnsUpdatedExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Updated Bench Press'};
            const expectedReturn = {...MOCK_EXERCISE, name: inputData.name!};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE).mockResolvedValueOnce(null);
            prismaMock.exercise.update.mockResolvedValue(expectedReturn);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.name).toBe(inputData.name);
            expect(result).toEqual(expectedReturn);
        });

        it('update_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'non-existent-id';
            const inputData: UpdateExerciseInput = {description: 'New description'};
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.update(inputId, inputData);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });

        it('update_EC_duplicateExerciseName_throwsConflictError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Existing Exercise'};
            prismaMock.exercise.findUnique
                .mockResolvedValueOnce(MOCK_EXERCISE)
                .mockResolvedValueOnce({...MOCK_EXERCISE, id: OTHER_EXERCISE_ID, name: inputData.name!});

            // Act
            const act = repo.update(inputId, inputData);

            // Assert
            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise name already in use');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('update_BVA_emptyId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = '';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.update(inputId, inputData);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('update_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.update(inputId, inputData);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('update_BVA_existingOneCharId_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            const existing = {...MOCK_EXERCISE, id: 'a'};
            const updated = {...existing, description: 'Updated description'};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
            prismaMock.exercise.update.mockResolvedValue(updated);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.id).toBe('a');
            expect(result.description).toBe('Updated description');
            expect(result).toEqual(updated);
        });

        it('update_BVA_nameUndefined_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: undefined};
            const expected = {...MOCK_EXERCISE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
        });

        it('update_BVA_nameEmpty_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: ''};
            const expected = {...MOCK_EXERCISE, name: ''};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
            expect(result.name).toBe('');
        });

        it('update_BVA_nameOneChar_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'a'};
            const expected = {...MOCK_EXERCISE, name: 'a'};
            prismaMock.exercise.findUnique
                .mockResolvedValueOnce(MOCK_EXERCISE)
                .mockResolvedValueOnce(null);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
            expect(result.name).toBe('a');
        });

        it('update_BVA_descriptionUndefined_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: undefined};
            const expected = {...MOCK_EXERCISE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
        });

        it('update_BVA_descriptionEmpty_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: ''};
            const expected = {...MOCK_EXERCISE, description: ''};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
            expect(result.description).toBe('');
        });

        it('update_BVA_descriptionOneChar_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'a'};
            const expected = {...MOCK_EXERCISE, description: 'a'};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
            expect(result.description).toBe('a');
        });

        it('update_BVA_muscleGroupUndefined_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: undefined};
            const expected = {...MOCK_EXERCISE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupChest_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CHEST};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.CHEST};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.CHEST);
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupShoulders_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.SHOULDERS};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.SHOULDERS};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.SHOULDERS);
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupArms_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.ARMS};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.ARMS};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.ARMS);
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupBack_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.BACK};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.BACK};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.BACK);
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupCore_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CORE};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.CORE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.CORE);
            expect(result).toEqual(expected);
        });

        it('update_BVA_muscleGroupLegs_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.LEGS};
            const expected = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.LEGS};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.muscleGroup).toBe(MuscleGroup.LEGS);
            expect(result).toEqual(expected);
        });

        it('update_BVA_equipmentNeededUndefined_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: undefined};
            const expected = {...MOCK_EXERCISE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result).toEqual(expected);
        });

        it('update_BVA_equipmentNeededCable_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.CABLE};
            const expected = {...MOCK_EXERCISE, equipmentNeeded: Equipment.CABLE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.equipmentNeeded).toBe(Equipment.CABLE);
            expect(result).toEqual(expected);
        });

        it('update_BVA_equipmentNeededDumbbell_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.DUMBBELL};
            const expected = {...MOCK_EXERCISE, equipmentNeeded: Equipment.DUMBBELL};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.equipmentNeeded).toBe(Equipment.DUMBBELL);
            expect(result).toEqual(expected);
        });

        it('update_BVA_equipmentNeededBarbell_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.BARBELL};
            const expected = {...MOCK_EXERCISE, equipmentNeeded: Equipment.BARBELL};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
            expect(result).toEqual(expected);
        });

        it('update_BVA_equipmentNeededMachine_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.MACHINE};
            const expected = {...MOCK_EXERCISE, equipmentNeeded: Equipment.MACHINE};
            prismaMock.exercise.findUnique.mockResolvedValueOnce(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.update(inputId, inputData);

            // Assert
            expect(result.equipmentNeeded).toBe(Equipment.MACHINE);
            expect(result).toEqual(expected);
        });
    });
});

describe('setActive', () => {
    describe('Equivalence Classes', () => {
        it('setActive_EC_existingExerciseSetFalse_archivesExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            const inputIsActive = false;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            const expected = {...MOCK_EXERCISE, isActive: false};
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.setActive(inputId, inputIsActive);

            // Assert
            expect(result.isActive).toBe(false);
            expect(result).toEqual(expected);
        });

        it('setActive_EC_existingExerciseSetTrue_activatesExercise', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            const inputIsActive = true;
            const inactiveExercise = {...MOCK_EXERCISE, isActive: false};
            prismaMock.exercise.findUnique.mockResolvedValue(inactiveExercise);
            const expected = {...MOCK_EXERCISE, isActive: true};
            prismaMock.exercise.update.mockResolvedValue(expected);

            // Act
            const result = await repo.setActive(inputId, inputIsActive);

            // Assert
            expect(result.isActive).toBe(true);
            expect(result).toEqual(expected);
        });

        it('setActive_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'non-existent-id';
            const inputIsActive = true;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.setActive(inputId, inputIsActive);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('setActive_BVA_emptyId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = '';
            const inputIsActive = true;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.setActive(inputId, inputIsActive);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('setActive_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputIsActive = true;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.setActive(inputId, inputIsActive);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('setActive_BVA_existingOneCharId_updatesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const inputIsActive = false;
            const existing = {...MOCK_EXERCISE, id: 'a', isActive: true};
            const updated = {...existing, isActive: false};
            prismaMock.exercise.findUnique.mockResolvedValue(existing);
            prismaMock.exercise.update.mockResolvedValue(updated);

            // Act
            const result = await repo.setActive(inputId, inputIsActive);

            // Assert
            expect(result.id).toBe('a');
            expect(result.isActive).toBe(false);
            expect(result).toEqual(updated);
        });
    });
});

describe('delete', () => {
    describe('Equivalence Classes', () => {
        it('delete_EC_existingUnreferencedExercise_resolvesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(0);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).resolves.toBeUndefined();
        });

        it('delete_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'non-existent-id';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });

        it('delete_EC_exerciseReferencedInWorkoutSession_throwsConflictError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(5);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise is used in existing workout sessions and cannot be deleted');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('delete_BVA_usageCount0_resolvesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(0);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).resolves.toBeUndefined();
        });

        it('delete_BVA_usageCount1_throwsConflictError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(1);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise is used in existing workout sessions and cannot be deleted');
        });

        it('delete_BVA_emptyId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = '';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('delete_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            // Arrange
            const repo = ExerciseRepository.getInstance(prismaMock);
            const inputId = 'a';
            const existing = {...MOCK_EXERCISE, id: 'a'};
            prismaMock.exercise.findUnique.mockResolvedValue(existing);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(0);

            // Act
            const act = repo.delete(inputId);

            // Assert
            await expect(act).resolves.toBeUndefined();
        });
    });
});
