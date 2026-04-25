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

import {exerciseService} from '@/lib/di';
import {Exercise, ExerciseListOptions, MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {
    createExercise,
    getExercise,
    listExercises,
    updateExercise,
    archiveExercise,
    unarchiveExercise,
    deleteExercise,
} from '@/lib/controller/exercise-controller';

const exerciseServiceMock = exerciseService as unknown as {
    createExercise: jest.Mock;
    getExercise: jest.Mock;
    listExercises: jest.Mock;
    updateExercise: jest.Mock;
    archiveExercise: jest.Mock;
    unarchiveExercise: jest.Mock;
    deleteExercise: jest.Mock;
};

const EXERCISE_ID: string = 'exercise-uuid-001';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
    isActive: true,
};

const MOCK_ARCHIVED_EXERCISE: Exercise = {...MOCK_EXERCISE, isActive: false};

const VALID_CREATE_INPUT: CreateExerciseInput = {
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
};

const VALID_UPDATE_INPUT: UpdateExerciseInput = {
    description: 'Updated description',
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe('createExercise', () => {

    describe('Independent Paths', () => {

        it('createExercise_Path1_validInputServiceSucceeds_returnsCreatedExercise', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);

            const result = await createExercise(inputData);

            expect(result).toEqual({success: true, data: MOCK_EXERCISE});
            expect(exerciseServiceMock.createExercise).toHaveBeenCalledWith(inputData);
        });

        it('createExercise_Path2_invalidInput_returnsValidationError', async () => {
            const inputData = {name: ''} as unknown as CreateExerciseInput;

            const result = await createExercise(inputData);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(exerciseServiceMock.createExercise).not.toHaveBeenCalled();
        });

        it('createExercise_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockRejectedValue(new ConflictError('Exercise name already in use: Bicep Curls'));

            const result = await createExercise(inputData);

            expect(result).toEqual({success: false, message: 'Exercise name already in use: Bicep Curls'});
        });

        it('createExercise_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockRejectedValue(new Error('Database failure'));

            const result = await createExercise(inputData);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('getExercise', () => {

    describe('Independent Paths', () => {

        it('getExercise_Path1_serviceSucceeds_returnsExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.getExercise.mockResolvedValue(MOCK_EXERCISE);

            const result = await getExercise(inputId);

            expect(result).toEqual({success: true, data: MOCK_EXERCISE});
            expect(exerciseServiceMock.getExercise).toHaveBeenCalledWith(inputId);
        });

        it('getExercise_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.getExercise.mockRejectedValue(new NotFoundError(`Exercise not found: ${EXERCISE_ID}`));

            const result = await getExercise(inputId);

            expect(result).toEqual({success: false, message: `Exercise not found: ${EXERCISE_ID}`});
        });

        it('getExercise_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.getExercise.mockRejectedValue(new Error('Database failure'));

            const result = await getExercise(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('listExercises', () => {

    describe('Independent Paths', () => {

        it('listExercises_Path1_serviceSucceeds_returnsPageResult', async () => {
            const inputOptions: ExerciseListOptions | undefined = undefined;
            const pageResult: PageResult<Exercise> = {items: [MOCK_EXERCISE], total: 1};
            exerciseServiceMock.listExercises.mockResolvedValue(pageResult);

            const result = await listExercises(inputOptions);

            expect(result).toEqual({success: true, data: pageResult});
            expect(exerciseServiceMock.listExercises).toHaveBeenCalledWith(inputOptions);
        });

        it('listExercises_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputOptions: ExerciseListOptions | undefined = undefined;
            exerciseServiceMock.listExercises.mockRejectedValue(new NotFoundError('Not found'));

            const result = await listExercises(inputOptions);

            expect(result).toEqual({success: false, message: 'Not found'});
        });

        it('listExercises_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputOptions: ExerciseListOptions | undefined = undefined;
            exerciseServiceMock.listExercises.mockRejectedValue(new Error('Database failure'));

            const result = await listExercises(inputOptions);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('updateExercise', () => {

    describe('Independent Paths', () => {

        it('updateExercise_Path1_validInputServiceSucceeds_returnsUpdatedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {...VALID_UPDATE_INPUT};
            const updatedExercise: Exercise = {...MOCK_EXERCISE, description: 'Updated description'};
            exerciseServiceMock.updateExercise.mockResolvedValue(updatedExercise);

            const result = await updateExercise(inputId, inputData);

            expect(result).toEqual({success: true, data: updatedExercise});
            expect(exerciseServiceMock.updateExercise).toHaveBeenCalledWith(inputId, inputData);
        });

        it('updateExercise_Path2_invalidInput_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData = {name: ''} as unknown as UpdateExerciseInput;

            const result = await updateExercise(inputId, inputData);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(exerciseServiceMock.updateExercise).not.toHaveBeenCalled();
        });

        it('updateExercise_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {...VALID_UPDATE_INPUT};
            exerciseServiceMock.updateExercise.mockRejectedValue(new ConflictError('Exercise name already in use: New Name'));

            const result = await updateExercise(inputId, inputData);

            expect(result).toEqual({success: false, message: 'Exercise name already in use: New Name'});
        });

        it('updateExercise_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {...VALID_UPDATE_INPUT};
            exerciseServiceMock.updateExercise.mockRejectedValue(new Error('Database failure'));

            const result = await updateExercise(inputId, inputData);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('archiveExercise', () => {

    describe('Independent Paths', () => {

        it('archiveExercise_Path1_serviceSucceeds_returnsArchivedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.archiveExercise.mockResolvedValue(MOCK_ARCHIVED_EXERCISE);

            const result = await archiveExercise(inputId);

            expect(result).toEqual({success: true, data: MOCK_ARCHIVED_EXERCISE});
            expect(exerciseServiceMock.archiveExercise).toHaveBeenCalledWith(inputId);
        });

        it('archiveExercise_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.archiveExercise.mockRejectedValue(new NotFoundError(`Exercise not found: ${EXERCISE_ID}`));

            const result = await archiveExercise(inputId);

            expect(result).toEqual({success: false, message: `Exercise not found: ${EXERCISE_ID}`});
        });

        it('archiveExercise_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.archiveExercise.mockRejectedValue(new Error('Database failure'));

            const result = await archiveExercise(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('unarchiveExercise', () => {

    describe('Independent Paths', () => {

        it('unarchiveExercise_Path1_serviceSucceeds_returnsUnarchivedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.unarchiveExercise.mockResolvedValue(MOCK_EXERCISE);

            const result = await unarchiveExercise(inputId);

            expect(result).toEqual({success: true, data: MOCK_EXERCISE});
            expect(exerciseServiceMock.unarchiveExercise).toHaveBeenCalledWith(inputId);
        });

        it('unarchiveExercise_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.unarchiveExercise.mockRejectedValue(new NotFoundError(`Exercise not found: ${EXERCISE_ID}`));

            const result = await unarchiveExercise(inputId);

            expect(result).toEqual({success: false, message: `Exercise not found: ${EXERCISE_ID}`});
        });

        it('unarchiveExercise_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.unarchiveExercise.mockRejectedValue(new Error('Database failure'));

            const result = await unarchiveExercise(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});

describe('deleteExercise', () => {

    describe('Independent Paths', () => {

        it('deleteExercise_Path1_serviceSucceeds_returnsVoid', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.deleteExercise.mockResolvedValue(undefined);

            const result = await deleteExercise(inputId);

            expect(result).toEqual({success: true, data: undefined});
            expect(exerciseServiceMock.deleteExercise).toHaveBeenCalledWith(inputId);
        });

        it('deleteExercise_Path2_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.deleteExercise.mockRejectedValue(new ConflictError('Exercise is used in existing workout sessions and cannot be deleted'));

            const result = await deleteExercise(inputId);

            expect(result).toEqual({
                success: false,
                message: 'Exercise is used in existing workout sessions and cannot be deleted'
            });
        });

        it('deleteExercise_Path3_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.deleteExercise.mockRejectedValue(new Error('Database failure'));

            const result = await deleteExercise(inputId);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});