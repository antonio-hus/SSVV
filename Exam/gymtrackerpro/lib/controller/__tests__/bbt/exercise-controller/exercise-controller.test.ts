jest.mock('@/lib/di', () => ({
    exerciseService: {
        createExercise: jest.fn(),
        getExercise: jest.fn(),
        listExercises: jest.fn(),
        updateExercise: jest.fn(),
        archiveExercise: jest.fn(),
        unarchiveExercise: jest.fn(),
        deleteExercise: jest.fn(),
    },
}));

import {createExercise, getExercise, listExercises, updateExercise, archiveExercise, unarchiveExercise, deleteExercise} from '@/lib/controller/exercise-controller';
import {exerciseService} from '@/lib/di';
import {Exercise, ExerciseListOptions, MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {PageResult} from "@/lib/domain/pagination";
import {ConflictError, NotFoundError, AppError} from '@/lib/domain/errors';
import {CreateExerciseInput} from "@/lib/schema/exercise-schema";

const exerciseServiceMock = exerciseService as unknown as {
    createExercise: jest.Mock;
    getExercise: jest.Mock;
    listExercises: jest.Mock;
    updateExercise: jest.Mock;
    archiveExercise: jest.Mock;
    unarchiveExercise: jest.Mock;
    deleteExercise: jest.Mock;
};

const EXERCISE_ID: string = 'exercise-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const VALID_EXERCISE_INPUT: CreateExerciseInput = {
    name: 'Bench Press Classic',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
};

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bench Press Classic',
    description: null,
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const MOCK_PAGE_EXERCISES: PageResult<Exercise> = {items: [MOCK_EXERCISE], total: 1};

beforeEach(() => {
    Object.values(exerciseServiceMock).forEach(fn => fn.mockReset());
});

describe('createExercise', () => {
    it('createExercise_validInput_returnsSuccessWithExercise', async () => {
        exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputValidExercise = {...VALID_EXERCISE_INPUT};

        const result = await createExercise(inputValidExercise);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Exercise }).data).toEqual(MOCK_EXERCISE);
        expect(exerciseServiceMock.createExercise).toHaveBeenCalledWith(inputValidExercise);
    });

    it('createExercise_nameAtLowerBoundary8Chars_returnsSuccess', async () => {
        exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputMinName = {...VALID_EXERCISE_INPUT, name: 'BenchPrs'};

        const result = await createExercise(inputMinName);

        expect(result.success).toBe(true);
    });

    it('createExercise_nameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputShortName = {...VALID_EXERCISE_INPUT, name: 'BenchPr'};

        const result = await createExercise(inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_nameAtUpperBoundary64Chars_returnsSuccess', async () => {
        exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputMaxName = {...VALID_EXERCISE_INPUT, name: 'B'.repeat(64)};

        const result = await createExercise(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('createExercise_nameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputLongName = {...VALID_EXERCISE_INPUT, name: 'B'.repeat(65)};

        const result = await createExercise(inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_missingName_returnsValidationError', async () => {
        const {name, ...inputWithoutName} = VALID_EXERCISE_INPUT;

        const result = await createExercise(inputWithoutName as never);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_invalidMuscleGroup_returnsValidationError', async () => {
        const inputInvalidMuscleGroup = {...VALID_EXERCISE_INPUT, muscleGroup: 'INVALID_GROUP' as never};

        const result = await createExercise(inputInvalidMuscleGroup);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_missingMuscleGroup_returnsValidationError', async () => {
        const {muscleGroup, ...inputWithoutMuscleGroup} = VALID_EXERCISE_INPUT;

        const result = await createExercise(inputWithoutMuscleGroup as never);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_invalidEquipment_returnsValidationError', async () => {
        const inputInvalidEquipment = {...VALID_EXERCISE_INPUT, equipmentNeeded: 'INVALID_EQUIPMENT' as never};

        const result = await createExercise(inputInvalidEquipment);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_missingEquipment_returnsValidationError', async () => {
        const {equipmentNeeded, ...inputWithoutEquipment} = VALID_EXERCISE_INPUT;

        const result = await createExercise(inputWithoutEquipment as never);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
    });

    it('createExercise_withOptionalDescription_returnsSuccess', async () => {
        exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, description: 'Classic chest compound'});
        const inputWithDescription = {...VALID_EXERCISE_INPUT, description: 'Classic chest compound'};

        const result = await createExercise(inputWithDescription);

        expect(result.success).toBe(true);
    });

    it('createExercise_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.createExercise.mockRejectedValue(new ConflictError('Exercise with this name already exists'));
        const inputValidExercise = {...VALID_EXERCISE_INPUT};

        const result = await createExercise(inputValidExercise);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise with this name already exists');
    });

    it('createExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.createExercise.mockRejectedValue(new Error('DB error'));
        const inputValidExercise = {...VALID_EXERCISE_INPUT};

        const result = await createExercise(inputValidExercise);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('getExercise', () => {
    it('getExercise_existingExerciseId_returnsSuccessWithExercise', async () => {
        exerciseServiceMock.getExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputExerciseId = EXERCISE_ID;

        const result = await getExercise(inputExerciseId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Exercise }).data).toEqual(MOCK_EXERCISE);
    });

    it('getExercise_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.getExercise.mockRejectedValue(new NotFoundError('Exercise not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await getExercise(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise not found');
    });

    it('getExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.getExercise.mockRejectedValue(new Error('DB error'));
        const inputExerciseId = EXERCISE_ID;

        const result = await getExercise(inputExerciseId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('listExercises', () => {
    it('listExercises_noOptions_returnsSuccessWithExercisesPage', async () => {
        exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_EXERCISES);

        const result = await listExercises();

        expect(result.success).toBe(true);
        expect((result as { success: true; data: { items: Exercise[]; total: number } }).data.total).toBe(1);
    });

    it('listExercises_withMuscleGroupFilter_passesFilterToService', async () => {
        exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_EXERCISES);
        const inputFilter: ExerciseListOptions = {muscleGroup: MuscleGroup.CHEST};

        const result = await listExercises(inputFilter);

        expect(result.success).toBe(true);
        expect(exerciseServiceMock.listExercises).toHaveBeenCalledWith(inputFilter);
    });

    it('listExercises_withSearchTerm_passesFilterToService', async () => {
        exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_EXERCISES);
        const inputFilter: ExerciseListOptions = {search: 'Bench'};

        const result = await listExercises(inputFilter);

        expect(result.success).toBe(true);
        expect(exerciseServiceMock.listExercises).toHaveBeenCalledWith(inputFilter);
    });

    it('listExercises_withIncludeInactiveTrue_returnsAllExercises', async () => {
        const inactiveExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
        exerciseServiceMock.listExercises.mockResolvedValue({items: [MOCK_EXERCISE, inactiveExercise], total: 2});
        const inputFilter: ExerciseListOptions = {includeInactive: true};

        const result = await listExercises(inputFilter);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: { items: Exercise[]; total: number } }).data.total).toBe(2);
    });

    it('listExercises_withPagination_passesPaginationToService', async () => {
        exerciseServiceMock.listExercises.mockResolvedValue({items: [], total: 25});
        const inputPagination: ExerciseListOptions = {page: 3, pageSize: 10};

        const result = await listExercises(inputPagination);

        expect(result.success).toBe(true);
        expect(exerciseServiceMock.listExercises).toHaveBeenCalledWith(inputPagination);
    });

    it('listExercises_serviceThrowsAppError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.listExercises.mockRejectedValue(new AppError('Service error'));

        const result = await listExercises();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Service error');
    });

    it('listExercises_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.listExercises.mockRejectedValue(new Error('DB error'));

        const result = await listExercises();

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('updateExercise', () => {
    it('updateExercise_validInput_returnsSuccessWithUpdatedExercise', async () => {
        const updatedExercise: Exercise = {...MOCK_EXERCISE, name: 'Incline Bench Press Classic'};
        exerciseServiceMock.updateExercise.mockResolvedValue(updatedExercise);
        const inputExerciseId = EXERCISE_ID;
        const inputUpdateData = {name: 'Incline Bench Press Classic'};

        const result = await updateExercise(inputExerciseId, inputUpdateData);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Exercise }).data.name).toBe('Incline Bench Press Classic');
    });

    it('updateExercise_emptyObject_returnsSuccess', async () => {
        exerciseServiceMock.updateExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputExerciseId = EXERCISE_ID;
        const inputEmpty = {};

        const result = await updateExercise(inputExerciseId, inputEmpty);

        expect(result.success).toBe(true);
    });

    it('updateExercise_nameAtLowerBoundary8Chars_returnsSuccess', async () => {
        exerciseServiceMock.updateExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputExerciseId = EXERCISE_ID;
        const inputMinName = {name: 'BenchPrs'};

        const result = await updateExercise(inputExerciseId, inputMinName);

        expect(result.success).toBe(true);
    });

    it('updateExercise_nameBelowLowerBoundary7Chars_returnsValidationError', async () => {
        const inputExerciseId = EXERCISE_ID;
        const inputShortName = {name: 'BenchPr'};

        const result = await updateExercise(inputExerciseId, inputShortName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.updateExercise).not.toHaveBeenCalled();
    });

    it('updateExercise_nameAtUpperBoundary64Chars_returnsSuccess', async () => {
        exerciseServiceMock.updateExercise.mockResolvedValue(MOCK_EXERCISE);
        const inputExerciseId = EXERCISE_ID;
        const inputMaxName = {name: 'B'.repeat(64)};

        const result = await updateExercise(inputExerciseId, inputMaxName);

        expect(result.success).toBe(true);
    });

    it('updateExercise_nameAboveUpperBoundary65Chars_returnsValidationError', async () => {
        const inputExerciseId = EXERCISE_ID;
        const inputLongName = {name: 'B'.repeat(65)};

        const result = await updateExercise(inputExerciseId, inputLongName);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.updateExercise).not.toHaveBeenCalled();
    });

    it('updateExercise_invalidMuscleGroup_returnsValidationError', async () => {
        const inputExerciseId = EXERCISE_ID;
        const inputInvalidMuscleGroup = {muscleGroup: 'INVALID' as never};

        const result = await updateExercise(inputExerciseId, inputInvalidMuscleGroup);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.updateExercise).not.toHaveBeenCalled();
    });

    it('updateExercise_invalidEquipment_returnsValidationError', async () => {
        const inputExerciseId = EXERCISE_ID;
        const inputInvalidEquipment = {equipmentNeeded: 'INVALID' as never};

        const result = await updateExercise(inputExerciseId, inputInvalidEquipment);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(exerciseServiceMock.updateExercise).not.toHaveBeenCalled();
    });

    it('updateExercise_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.updateExercise.mockRejectedValue(new NotFoundError('Exercise not found'));
        const inputExerciseId = NONEXISTENT_ID;
        const inputUpdateData = {name: 'Incline Bench Press Classic'};

        const result = await updateExercise(inputExerciseId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise not found');
    });

    it('updateExercise_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.updateExercise.mockRejectedValue(new ConflictError('Name already in use'));
        const inputExerciseId = EXERCISE_ID;
        const inputDuplicateName = {name: 'Existing Exercise Name'};

        const result = await updateExercise(inputExerciseId, inputDuplicateName);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Name already in use');
    });

    it('updateExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.updateExercise.mockRejectedValue(new Error('DB error'));
        const inputExerciseId = EXERCISE_ID;
        const inputUpdateData = {name: 'Incline Bench Press Classic'};

        const result = await updateExercise(inputExerciseId, inputUpdateData);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('archiveExercise', () => {
    it('archiveExercise_existingExerciseId_returnsSuccessWithArchivedExercise', async () => {
        const archivedExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
        exerciseServiceMock.archiveExercise.mockResolvedValue(archivedExercise);
        const inputExerciseId = EXERCISE_ID;

        const result = await archiveExercise(inputExerciseId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Exercise }).data.isActive).toBe(false);
    });

    it('archiveExercise_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.archiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await archiveExercise(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise not found');
    });

    it('archiveExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.archiveExercise.mockRejectedValue(new Error('DB error'));
        const inputExerciseId = EXERCISE_ID;

        const result = await archiveExercise(inputExerciseId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('unarchiveExercise', () => {
    it('unarchiveExercise_existingArchivedExerciseId_returnsSuccessWithActiveExercise', async () => {
        const restoredExercise: Exercise = {...MOCK_EXERCISE, isActive: true};
        exerciseServiceMock.unarchiveExercise.mockResolvedValue(restoredExercise);
        const inputExerciseId = EXERCISE_ID;

        const result = await unarchiveExercise(inputExerciseId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Exercise }).data.isActive).toBe(true);
    });

    it('unarchiveExercise_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.unarchiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await unarchiveExercise(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise not found');
    });

    it('unarchiveExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.unarchiveExercise.mockRejectedValue(new Error('DB error'));
        const inputExerciseId = EXERCISE_ID;

        const result = await unarchiveExercise(inputExerciseId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});

describe('deleteExercise', () => {
    it('deleteExercise_existingExerciseId_returnsSuccessWithUndefinedData', async () => {
        exerciseServiceMock.deleteExercise.mockResolvedValue(undefined);
        const inputExerciseId = EXERCISE_ID;

        const result = await deleteExercise(inputExerciseId);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: undefined }).data).toBeUndefined();
    });

    it('deleteExercise_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.deleteExercise.mockRejectedValue(new NotFoundError('Exercise not found'));
        const inputNonExistentId = NONEXISTENT_ID;

        const result = await deleteExercise(inputNonExistentId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Exercise not found');
    });

    it('deleteExercise_serviceThrowsConflictError_returnsFailureWithMessage', async () => {
        exerciseServiceMock.deleteExercise.mockRejectedValue(new ConflictError('Exercise is referenced in workout sessions'));
        const inputExerciseId = EXERCISE_ID;

        const result = await deleteExercise(inputExerciseId);

        expect(result.success).toBe(false);
        expect((result as {
            success: false;
            message: string
        }).message).toBe('Exercise is referenced in workout sessions');
    });

    it('deleteExercise_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        exerciseServiceMock.deleteExercise.mockRejectedValue(new Error('DB error'));
        const inputExerciseId = EXERCISE_ID;

        const result = await deleteExercise(inputExerciseId);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});