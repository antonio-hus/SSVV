import {mock, mockReset} from 'jest-mock-extended';
import {Equipment, Exercise, ExerciseListOptions, MuscleGroup} from '@/lib/domain/exercise';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {ExerciseRepositoryInterface} from '@/lib/repository/exercise-repository-interface';
import {ExerciseService} from '@/lib/service/exercise-service';
import {CreateExerciseInput, UpdateExerciseInput} from "@/lib/schema/exercise-schema";

const mockExerciseRepo = mock<ExerciseRepositoryInterface>();

const EXERCISE_ID: string = 'exercise-uuid-001';
const OTHER_EXERCISE_ID: string = 'exercise-uuid-002';
const NONEXISTENT_ID: string = 'nonexistent-id';

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

beforeEach(() => {
    mockReset(mockExerciseRepo);
    (ExerciseService as unknown as { instance: unknown }).instance = undefined;
});

describe('createExercise', () => {
    describe('Equivalence Classes', () => {
        it('createExercise_EC_newExerciseName_returnsCreatedExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputExercise: CreateExerciseInput = VALID_CREATE_INPUT;
            mockExerciseRepo.create.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.createExercise(inputExercise);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('createExercise_EC_duplicateExerciseName_throwsConflictError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputExercise: CreateExerciseInput = VALID_CREATE_INPUT;
            mockExerciseRepo.create.mockRejectedValue(new ConflictError('Exercise name already in use'));

            const act = service.createExercise(inputExercise);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise name already in use');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createExercise_BVA_minValidName_returnsCreatedExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputData: CreateExerciseInput = { ...VALID_CREATE_INPUT, name: 'A' };
            const expectedReturn = { ...MOCK_EXERCISE, name: 'A' };
            mockExerciseRepo.create.mockResolvedValue(expectedReturn);

            const result = await service.createExercise(inputData);

            expect(result.name).toBe('A');
            expect(result.id).toBe(MOCK_EXERCISE.id);
        });
    });
});

describe('getExercise', () => {
    describe('Equivalence Classes', () => {
        it('getExercise_EC_existingExerciseId_returnsExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.findById.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.getExercise(inputId);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('getExercise_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = NONEXISTENT_ID;
            mockExerciseRepo.findById.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.getExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getExercise_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = '';
            mockExerciseRepo.findById.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.getExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getExercise_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            mockExerciseRepo.findById.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.getExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getExercise_BVA_existingOneCharId_returnsExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            const expectedReturn: Exercise = {...MOCK_EXERCISE, id: 'a'};
            mockExerciseRepo.findById.mockResolvedValue(expectedReturn);

            const result = await service.getExercise(inputId);

            expect(result.id).toBe('a');
            expect(result.name).toBe(MOCK_EXERCISE.name);
        });
    });
});

describe('listExercises', () => {
    describe('Equivalence Classes', () => {
        it('listExercises_EC_noOptions_returnsOnlyActiveExercises', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises();

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(1);
        });

        it('listExercises_EC_includeInactiveFalse_returnsOnlyActiveExercises', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {includeInactive: false};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(1);
        });

        it('listExercises_EC_includeInactiveTrue_returnsAllExercises', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {includeInactive: true};
            const inactiveExercise: Exercise = {...MOCK_EXERCISE_BACK, isActive: false};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, inactiveExercise], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(inactiveExercise);
            expect(result.total).toBe(2);
        });

        it('listExercises_EC_withMuscleGroupFilter_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE_BACK], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE_BACK);
            expect(result.total).toBe(1);
        });

        it('listExercises_EC_withSearchAndMuscleGroupFilter_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {search: 'Bench', muscleGroup: MuscleGroup.CHEST};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(1);
        });

        it('listExercises_EC_multipleExercises_returnsExercisesOrderedByNameAscending', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE_BACK, MOCK_EXERCISE], total: 2});

            const result = await service.listExercises();

            expect(result.items[0].name).toBe('Deadlift');
            expect(result.items[1].name).toBe('Standard Bench Press');
        });

        it('listExercises_EC_noSearchNoMuscleGroup_returnsAllActiveExercises', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, MOCK_EXERCISE_BACK], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(MOCK_EXERCISE_BACK);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listExercises_BVA_searchUndefined_returnsItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {search: undefined};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, MOCK_EXERCISE_BACK], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('listExercises_BVA_searchEmpty_returnsItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {search: ''};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, MOCK_EXERCISE_BACK], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('listExercises_BVA_searchOneCharacter_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {search: 'a'};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('listExercises_BVA_muscleGroupChest_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CHEST};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.CHEST);
        });

        it('listExercises_BVA_muscleGroupShoulders_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.SHOULDERS};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('listExercises_BVA_muscleGroupArms_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.ARMS};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('listExercises_BVA_muscleGroupBack_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE_BACK], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].muscleGroup).toBe(MuscleGroup.BACK);
        });

        it('listExercises_BVA_muscleGroupCore_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CORE};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
        });

        it('listExercises_BVA_muscleGroupLegs_returnsMatchingItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.LEGS};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
        });

        it('listExercises_BVA_muscleGroupInvalid_returnsEmptyResult', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const invalidMuscleGroup = 'INVALID' as unknown as MuscleGroup;
            const inputOptions: ExerciseListOptions = {muscleGroup: invalidMuscleGroup};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
        });

        it('listExercises_BVA_includeInactiveUndefined_defaultsToActiveOnly', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {includeInactive: undefined};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].isActive).toBe(true);
        });

        it('listExercises_BVA_includeInactiveFalse_returnsActiveItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {includeInactive: false};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0].isActive).toBe(true);
        });

        it('listExercises_BVA_includeInactiveTrue_returnsAllItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {includeInactive: true};
            const inactiveExercise: Exercise = {...MOCK_EXERCISE_BACK, isActive: false};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, inactiveExercise], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items).toContainEqual(MOCK_EXERCISE);
            expect(result.items).toContainEqual(inactiveExercise);
        });

        it('listExercises_BVA_pageUndefined_returnsFirstPage', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {page: undefined};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('listExercises_BVA_page0_returnsFirstPage', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {page: 0};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('listExercises_BVA_page1_returnsFirstPage', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {page: 1};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('listExercises_BVA_page2_returnsSecondPage', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {page: 2, pageSize: 10};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE_BACK], total: 11});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE_BACK);
            expect(result.total).toBe(11);
        });

        it('listExercises_BVA_pageSizeUndefined_returnsDefaultPageSize', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {pageSize: undefined};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
        });

        it('listExercises_BVA_pageSize0_returnsNoItems', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {pageSize: 0};
            mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(2);
        });

        it('listExercises_BVA_pageSize1_returnsOneItem', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputOptions: ExerciseListOptions = {pageSize: 1};
            mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 2});

            const result = await service.listExercises(inputOptions);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(MOCK_EXERCISE);
            expect(result.total).toBe(2);
        });
    });
});

describe('updateExercise', () => {
    describe('Equivalence Classes', () => {
        it('updateExercise_EC_existingExerciseValidData_returnsUpdatedExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Updated Bench Press'};
            const expectedReturn: Exercise = {...MOCK_EXERCISE, name: inputData.name!};
            mockExerciseRepo.update.mockResolvedValue(expectedReturn);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.name).toBe(inputData.name);
            expect(result.id).toBe(inputId);
        });

        it('updateExercise_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateExerciseInput = {description: 'New description'};
            mockExerciseRepo.update.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.updateExercise(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });

        it('updateExercise_EC_duplicateExerciseName_throwsConflictError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Existing Exercise'};
            mockExerciseRepo.update.mockRejectedValue(new ConflictError('Exercise name already in use'));

            const act = service.updateExercise(inputId, inputData);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise name already in use');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateExercise_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = '';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            mockExerciseRepo.update.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.updateExercise(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateExercise_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            mockExerciseRepo.update.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.updateExercise(inputId, inputData);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('updateExercise_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            const expectedReturn: Exercise = {...MOCK_EXERCISE, id: 'a', description: 'Updated description'};
            mockExerciseRepo.update.mockResolvedValue(expectedReturn);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.id).toBe('a');
            expect(result.description).toBe('Updated description');
            expect(result.name).toBe(MOCK_EXERCISE.name);
        });

        it('updateExercise_BVA_nameUndefined_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: undefined};
            mockExerciseRepo.update.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('updateExercise_BVA_nameEmpty_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: ''};
            const expected: Exercise = {...MOCK_EXERCISE, name: ''};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(expected);
        });

        it('updateExercise_BVA_nameOneChar_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'a'};
            const expected: Exercise = {...MOCK_EXERCISE, name: 'a'};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(expected);
        });

        it('updateExercise_BVA_descriptionUndefined_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: undefined};
            mockExerciseRepo.update.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('updateExercise_BVA_descriptionEmpty_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: ''};
            const expected: Exercise = {...MOCK_EXERCISE, description: ''};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(expected);
        });

        it('updateExercise_BVA_descriptionOneChar_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'a'};
            const expected: Exercise = {...MOCK_EXERCISE, description: 'a'};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(expected);
        });

        it('updateExercise_BVA_muscleGroupUndefined_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: undefined};
            mockExerciseRepo.update.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('updateExercise_BVA_muscleGroupChest_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CHEST};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.CHEST};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.CHEST);
        });

        it('updateExercise_BVA_muscleGroupShoulders_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.SHOULDERS};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.SHOULDERS};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.SHOULDERS);
        });

        it('updateExercise_BVA_muscleGroupArms_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.ARMS};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.ARMS};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.ARMS);
        });

        it('updateExercise_BVA_muscleGroupBack_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.BACK};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.BACK};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.BACK);
        });

        it('updateExercise_BVA_muscleGroupCore_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CORE};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.CORE};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.CORE);
        });

        it('updateExercise_BVA_muscleGroupLegs_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.LEGS};
            const expected: Exercise = {...MOCK_EXERCISE, muscleGroup: MuscleGroup.LEGS};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.muscleGroup).toBe(MuscleGroup.LEGS);
        });

        it('updateExercise_BVA_equipmentNeededUndefined_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: undefined};
            mockExerciseRepo.update.mockResolvedValue(MOCK_EXERCISE);

            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('updateExercise_BVA_equipmentNeededCable_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.CABLE};
            const expected: Exercise = {...MOCK_EXERCISE, equipmentNeeded: Equipment.CABLE};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.equipmentNeeded).toBe(Equipment.CABLE);
        });

        it('updateExercise_BVA_equipmentNeededDumbbell_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.DUMBBELL};
            const expected: Exercise = {...MOCK_EXERCISE, equipmentNeeded: Equipment.DUMBBELL};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.equipmentNeeded).toBe(Equipment.DUMBBELL);
        });

        it('updateExercise_BVA_equipmentNeededBarbell_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.BARBELL};
            const expected: Exercise = {...MOCK_EXERCISE, equipmentNeeded: Equipment.BARBELL};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
        });

        it('updateExercise_BVA_equipmentNeededMachine_updatesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.MACHINE};
            const expected: Exercise = {...MOCK_EXERCISE, equipmentNeeded: Equipment.MACHINE};
            mockExerciseRepo.update.mockResolvedValue(expected);

            const result = await service.updateExercise(inputId, inputData);

            expect(result.equipmentNeeded).toBe(Equipment.MACHINE);
        });
    });
});

describe('archiveExercise', () => {
    describe('Equivalence Classes', () => {
        it('archiveExercise_EC_existingExercise_archivesExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const expectedReturn: Exercise = {...MOCK_EXERCISE, isActive: false};
            mockExerciseRepo.setActive.mockResolvedValue(expectedReturn);

            const result = await service.archiveExercise(inputId);

            expect(result.isActive).toBe(false);
            expect(result.id).toBe(inputId);
        });

        it('archiveExercise_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = NONEXISTENT_ID;
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.archiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('archiveExercise_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = '';
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.archiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('archiveExercise_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.archiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('archiveExercise_BVA_existingOneCharId_archivesExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            const expectedReturn: Exercise = {...MOCK_EXERCISE, id: 'a', isActive: false};
            mockExerciseRepo.setActive.mockResolvedValue(expectedReturn);

            const result = await service.archiveExercise(inputId);

            expect(result.id).toBe('a');
            expect(result.isActive).toBe(false);
            expect(result.name).toBe(MOCK_EXERCISE.name);
        });
    });
});

describe('unarchiveExercise', () => {
    describe('Equivalence Classes', () => {
        it('unarchiveExercise_EC_existingExercise_activatesExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            const expectedReturn: Exercise = {...MOCK_EXERCISE, isActive: true};
            mockExerciseRepo.setActive.mockResolvedValue(expectedReturn);

            const result = await service.unarchiveExercise(inputId);

            expect(result.isActive).toBe(true);
            expect(result.id).toBe(inputId);
        });

        it('unarchiveExercise_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = NONEXISTENT_ID;
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.unarchiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });
    });

    describe('Boundary Value Analysis', () => {
        it('unarchiveExercise_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = '';
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.unarchiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('unarchiveExercise_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.unarchiveExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('unarchiveExercise_BVA_existingOneCharId_activatesExercise', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            const expectedReturn: Exercise = {...MOCK_EXERCISE, id: 'a', isActive: true};
            mockExerciseRepo.setActive.mockResolvedValue(expectedReturn);

            const result = await service.unarchiveExercise(inputId);

            expect(result.id).toBe('a');
            expect(result.isActive).toBe(true);
            expect(result.name).toBe(MOCK_EXERCISE.name);
        });
    });
});

describe('deleteExercise', () => {
    describe('Equivalence Classes', () => {
        it('deleteExercise_EC_existingUnreferencedExercise_resolvesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteExercise(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('deleteExercise_EC_nonExistentExerciseId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = NONEXISTENT_ID;
            mockExerciseRepo.delete.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.deleteExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Exercise not found');
        });

        it('deleteExercise_EC_exerciseReferencedInWorkoutSession_throwsConflictError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.delete.mockRejectedValue(new ConflictError('Exercise name already in use'));

            const act = service.deleteExercise(inputId);

            await expect(act).rejects.toThrow(ConflictError);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteExercise_BVA_usageCount0_resolvesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteExercise(inputId);

            await expect(act).resolves.toBeUndefined();
        });

        it('deleteExercise_BVA_usageCount1_throwsConflictError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.delete.mockRejectedValue(new ConflictError('Exercise is referenced by workout sessions'));

            const act = service.deleteExercise(inputId);

            await expect(act).rejects.toThrow(ConflictError);
            await expect(act).rejects.toThrow('Exercise is referenced by workout sessions');
        });

        it('deleteExercise_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = '';
            mockExerciseRepo.delete.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.deleteExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteExercise_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            mockExerciseRepo.delete.mockRejectedValue(new NotFoundError('Exercise not found'));

            const act = service.deleteExercise(inputId);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('deleteExercise_BVA_existingOneCharId_resolvesSuccessfully', async () => {
            const service = ExerciseService.getInstance(mockExerciseRepo);
            const inputId: string = 'a';
            mockExerciseRepo.delete.mockResolvedValue(undefined);

            const act = service.deleteExercise(inputId);

            await expect(act).resolves.toBeUndefined();
        });
    });
});
