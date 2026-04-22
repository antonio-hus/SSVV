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

import {
    createExercise,
    getExercise,
    listExercises,
    updateExercise,
    archiveExercise,
    unarchiveExercise,
    deleteExercise
} from '@/lib/controller/exercise-controller';
import {exerciseService} from '@/lib/di';
import {Equipment, Exercise, MuscleGroup, ExerciseListOptions} from '@/lib/domain/exercise';
import {PageResult} from "@/lib/domain/pagination";
import {ConflictError, NotFoundError, AppError} from '@/lib/domain/errors';
import {CreateExerciseInput, UpdateExerciseInput} from "@/lib/schema/exercise-schema";
import {ActionResult} from "@/lib/domain/action-result";

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
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Standard Bench Press',
    description: 'Classic chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const VALID_CREATE_INPUT: CreateExerciseInput = {
    name: 'Standard Bench Press',
    description: 'Classic chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
};

const MOCK_PAGE_RESULT: PageResult<Exercise> = {
    items: [MOCK_EXERCISE],
    total: 1
};

beforeEach(() => {
    Object.values(exerciseServiceMock).forEach(fn => fn.mockReset());
});

describe('createExercise', () => {
    describe('Equivalence Classes', () => {
        it('createExercise_EC_allFieldsValid_returnsSuccessWithExercise', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_EXERCISE);
            }
        });

        it('createExercise_EC_missingDescription_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {
                name: 'Standard Bench Press',
                muscleGroup: MuscleGroup.CHEST,
                equipmentNeeded: Equipment.BARBELL,
            };
            const mockResult = {...MOCK_EXERCISE, description: undefined};
            exerciseServiceMock.createExercise.mockResolvedValue(mockResult);

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
                expect(result.data.description).toBeUndefined();
            }
        });

        it('createExercise_EC_missingName_returnsValidationError', async () => {
            const inputData = {...VALID_CREATE_INPUT, name: undefined as unknown as string};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('createExercise_EC_missingMuscleGroup_returnsValidationError', async () => {
            const inputData = {...VALID_CREATE_INPUT, muscleGroup: undefined as unknown as MuscleGroup};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.muscleGroup).toBeDefined();
            }
        });

        it('createExercise_EC_missingEquipment_returnsValidationError', async () => {
            const inputData = {...VALID_CREATE_INPUT, equipmentNeeded: undefined as unknown as Equipment};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.equipmentNeeded).toBeDefined();
            }
        });

        it('createExercise_EC_emptyName_returnsValidationError', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: ''};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('createExercise_EC_duplicateName_returnsFailureWithMessage', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockRejectedValue(new ConflictError('Name already in use'));

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Name already in use');
            }
        });

        it('createExercise_EC_unexpectedError_returnsGenericFailure', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT};
            exerciseServiceMock.createExercise.mockRejectedValue(new Error('Internal failure'));

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createExercise_BVA_nameWhitespaceOnly_returnsValidationError', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: '         '};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('createExercise_BVA_namePaddedWithWhitespace_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: '   Bench Press   '};
            exerciseServiceMock.createExercise.mockResolvedValue(MOCK_EXERCISE);

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_EXERCISE);
            }
        });

        it('createExercise_BVA_nameLength7Chars_returnsValidationError', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(7)};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('createExercise_BVA_nameLength8Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(8)};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('createExercise_BVA_nameLength9Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(9)};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('createExercise_BVA_nameLength63Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(63)};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('createExercise_BVA_nameLength64Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(64)};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('createExercise_BVA_nameLength65Chars_returnsValidationError', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, name: 'A'.repeat(65)};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('createExercise_BVA_descriptionLength1023Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, description: 'A'.repeat(1023)};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                description: inputData.description!
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe(inputData.description);
            }
        });

        it('createExercise_BVA_descriptionLength1024Chars_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, description: 'A'.repeat(1024)};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                description: inputData.description!
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe(inputData.description);
            }
        });

        it('createExercise_BVA_descriptionLength1025Chars_returnsValidationError', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, description: 'A'.repeat(1025)};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.description).toBeDefined();
            }
        });

        it('createExercise_BVA_muscleGroupCHEST_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.CHEST};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.CHEST});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.CHEST);
            }
        });

        it('createExercise_BVA_muscleGroupBACK_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.BACK};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.BACK});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.BACK);
            }
        });

        it('createExercise_BVA_muscleGroupLEGS_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.LEGS};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.LEGS});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.LEGS);
            }
        });

        it('createExercise_BVA_muscleGroupSHOULDERS_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.SHOULDERS};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                muscleGroup: MuscleGroup.SHOULDERS
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.SHOULDERS);
            }
        });

        it('createExercise_BVA_muscleGroupARMS_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.ARMS};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.ARMS});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.ARMS);
            }
        });

        it('createExercise_BVA_muscleGroupCORE_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, muscleGroup: MuscleGroup.CORE};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.CORE});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.CORE);
            }
        });

        it('createExercise_BVA_invalidMuscleGroup_returnsValidationError', async () => {
            const inputData = {...VALID_CREATE_INPUT, muscleGroup: 'INVALID' as unknown as MuscleGroup};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.muscleGroup).toBeDefined();
            }
        });

        it('createExercise_BVA_equipmentBARBELL_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, equipmentNeeded: Equipment.BARBELL};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.BARBELL
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.BARBELL);
            }
        });

        it('createExercise_BVA_equipmentDUMBBELL_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, equipmentNeeded: Equipment.DUMBBELL};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.DUMBBELL
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.DUMBBELL);
            }
        });

        it('createExercise_BVA_equipmentMACHINE_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, equipmentNeeded: Equipment.MACHINE};
            exerciseServiceMock.createExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.MACHINE
            });

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.MACHINE);
            }
        });

        it('createExercise_BVA_equipmentCABLE_returnsSuccess', async () => {
            const inputData: CreateExerciseInput = {...VALID_CREATE_INPUT, equipmentNeeded: Equipment.CABLE};
            exerciseServiceMock.createExercise.mockResolvedValue({...MOCK_EXERCISE, equipmentNeeded: Equipment.CABLE});

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.CABLE);
            }
        });

        it('createExercise_BVA_invalidEquipment_returnsValidationError', async () => {
            const inputData = {...VALID_CREATE_INPUT, equipmentNeeded: 'INVALID' as unknown as Equipment};

            const result: ActionResult<Exercise> = await createExercise(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.equipmentNeeded).toBeDefined();
            }
        });
    });
});

describe('getExercise', () => {
    describe('Equivalence Classes', () => {
        it('getExercise_EC_existingId_returnsSuccessWithExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.getExercise.mockResolvedValue(MOCK_EXERCISE);

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_EXERCISE);
            }
        });

        it('getExercise_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId: string = NONEXISTENT_ID;
            exerciseServiceMock.getExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Exercise not found');
            }
        });

        it('getExercise_EC_unexpectedError_returnsGenericFailure', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.getExercise.mockRejectedValue(new Error('Internal failure'));

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getExercise_BVA_emptyId_returnsFailure', async () => {
            const inputId: string = '';
            exerciseServiceMock.getExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(false);
        });

        it('getExercise_BVA_existingOneCharId_returnsSuccess', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.getExercise.mockResolvedValue({...MOCK_EXERCISE, id: 'a'});

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
            }
        });

        it('getExercise_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.getExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await getExercise(inputId);

            expect(result.success).toBe(false);
        });
    });
});

describe('listExercises', () => {
    describe('Equivalence Classes', () => {
        it('listExercises_EC_noOptions_returnsActiveExercises', async () => {
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_EXERCISE);
            }
        });

        it('listExercises_EC_inactiveFalse_returnsActiveExercises', async () => {
            const inputOptions: ExerciseListOptions = {includeInactive: false};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_EXERCISE);
            }
        });

        it('listExercises_EC_inactiveTrue_returnsAllExercises', async () => {
            const inputOptions: ExerciseListOptions = {includeInactive: true};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0]).toEqual(MOCK_EXERCISE);
            }
        });

        it('listExercises_EC_muscleGroup_returnsMatchingExercises', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CHEST};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.CHEST);
            }
        });

        it('listExercises_EC_search_returnsMatchingExercises', async () => {
            const inputOptions: ExerciseListOptions = {search: 'Bench'};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
                expect(result.data.items[0].name).toContain('Bench');
            }
        });

        it('listExercises_EC_multipleExercises_returnsOrderedExercises', async () => {
            const exerciseA = {...MOCK_EXERCISE, id: 'a', name: 'A Exercise'};
            const exerciseB = {...MOCK_EXERCISE, id: 'b', name: 'B Exercise'};
            const mockPage: PageResult<Exercise> = {
                items: [exerciseA, exerciseB],
                total: 2
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPage);

            const result: ActionResult<PageResult<Exercise>> = await listExercises();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(2);
                expect(result.data.items[0].name).toBe('A Exercise');
                expect(result.data.items[1].name).toBe('B Exercise');
            }
        });

        it('listExercises_EC_throwsAppError_returnsFailureWithMessage', async () => {
            exerciseServiceMock.listExercises.mockRejectedValue(new AppError('Service failed'));

            const result: ActionResult<PageResult<Exercise>> = await listExercises();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Service failed');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('listExercises_BVA_searchUndefined_returnsAll', async () => {
            const inputOptions: ExerciseListOptions = {search: undefined};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(1);
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_searchEmpty_returnsAll', async () => {
            const inputOptions: ExerciseListOptions = {search: ''};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(1);
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_searchOneChar_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {search: 'a'};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(1);
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_muscleGroupCHEST_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CHEST};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.CHEST);
            }
        });

        it('listExercises_BVA_muscleGroupBACK_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};
            const mockPageResult: PageResult<Exercise> = {
                items: [{...MOCK_EXERCISE, muscleGroup: MuscleGroup.BACK}],
                total: 1
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPageResult);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.BACK);
            }
        });

        it('listExercises_BVA_muscleGroupLEGS_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.LEGS};
            const mockPageResult: PageResult<Exercise> = {
                items: [{...MOCK_EXERCISE, muscleGroup: MuscleGroup.LEGS}],
                total: 1
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPageResult);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.LEGS);
            }
        });

        it('listExercises_BVA_muscleGroupSHOULDERS_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.SHOULDERS};
            const mockPageResult: PageResult<Exercise> = {
                items: [{...MOCK_EXERCISE, muscleGroup: MuscleGroup.SHOULDERS}],
                total: 1
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPageResult);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.SHOULDERS);
            }
        });

        it('listExercises_BVA_muscleGroupARMS_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.ARMS};
            const mockPageResult: PageResult<Exercise> = {
                items: [{...MOCK_EXERCISE, muscleGroup: MuscleGroup.ARMS}],
                total: 1
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPageResult);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.ARMS);
            }
        });

        it('listExercises_BVA_muscleGroupCORE_returnsMatching', async () => {
            const inputOptions: ExerciseListOptions = {muscleGroup: MuscleGroup.CORE};
            const mockPageResult: PageResult<Exercise> = {
                items: [{...MOCK_EXERCISE, muscleGroup: MuscleGroup.CORE}],
                total: 1
            };
            exerciseServiceMock.listExercises.mockResolvedValue(mockPageResult);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].muscleGroup).toBe(MuscleGroup.CORE);
            }
        });

        it('listExercises_BVA_page0_returnsFirstPage', async () => {
            const inputOptions: ExerciseListOptions = {page: 0};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_page1_returnsFirstPage', async () => {
            const inputOptions: ExerciseListOptions = {page: 1};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_page2_returnsSecondPage', async () => {
            const inputOptions: ExerciseListOptions = {page: 2};
            exerciseServiceMock.listExercises.mockResolvedValue({items: [], total: 1});

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
                expect(result.data.total).toBe(1);
            }
        });

        it('listExercises_BVA_pageUndefined_returnsFirstPage', async () => {
            const inputOptions: ExerciseListOptions = {page: undefined};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_pageSize0_returnsNoItems', async () => {
            const inputOptions: ExerciseListOptions = {pageSize: 0};
            exerciseServiceMock.listExercises.mockResolvedValue({items: [], total: 1});

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(0);
            }
        });

        it('listExercises_BVA_pageSize1_returnsOneItem', async () => {
            const inputOptions: ExerciseListOptions = {pageSize: 1};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });

        it('listExercises_BVA_pageSizeUndefined_returnsDefaultSize', async () => {
            const inputOptions: ExerciseListOptions = {pageSize: undefined};
            exerciseServiceMock.listExercises.mockResolvedValue(MOCK_PAGE_RESULT);

            const result: ActionResult<PageResult<Exercise>> = await listExercises(inputOptions);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items).toHaveLength(1);
            }
        });
    });
});

describe('updateExercise', () => {
    describe('Equivalence Classes', () => {
        it('updateExercise_EC_validUpdateData_returnsSuccessWithUpdatedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                description: 'Updated description'
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('Updated description');
            }
        });

        it('updateExercise_EC_emptyObject_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {};
            exerciseServiceMock.updateExercise.mockResolvedValue(MOCK_EXERCISE);

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_EXERCISE);
            }
        });

        it('updateExercise_EC_invalidMuscleGroup_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData = {muscleGroup: 'INVALID' as unknown as MuscleGroup};

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.muscleGroup).toBeDefined();
            }
        });

        it('updateExercise_EC_invalidEquipment_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData = {equipmentNeeded: 'INVALID' as unknown as Equipment};

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.equipmentNeeded).toBeDefined();
            }
        });

        it('updateExercise_EC_throwsNotFoundError_returnsFailureWithMessage', async () => {
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateExerciseInput = {name: 'New Exercise Name'};
            exerciseServiceMock.updateExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Exercise not found');
            }
        });

        it('updateExercise_EC_duplicateName_returnsFailureWithMessage', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Existing Name'};
            exerciseServiceMock.updateExercise.mockRejectedValue(new ConflictError('Name taken'));

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Name taken');
            }
        });

        it('updateExercise_EC_unexpectedError_returnsGenericFailure', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Any Name'};
            exerciseServiceMock.updateExercise.mockRejectedValue(new Error('Internal failure'));

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateExercise_BVA_nameLength7Chars_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'A'.repeat(7)};

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('updateExercise_BVA_nameLength8Chars_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'A'.repeat(8)};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name!});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('updateExercise_BVA_nameLength64Chars_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'A'.repeat(64)};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, name: inputData.name!});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(inputData.name);
            }
        });

        it('updateExercise_BVA_nameLength65Chars_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'A'.repeat(65)};

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.name).toBeDefined();
            }
        });

        it('updateExercise_BVA_descriptionLength1023Chars_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'A'.repeat(1023)};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                description: inputData.description!
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe(inputData.description);
            }
        });

        it('updateExercise_BVA_descriptionLength1024Chars_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'A'.repeat(1024)};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                description: inputData.description!
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe(inputData.description);
            }
        });

        it('updateExercise_BVA_descriptionLength1025Chars_returnsValidationError', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'A'.repeat(1025)};

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                const errors: Record<string, string[]> = result.errors || {};
                expect(errors.description).toBeDefined();
            }
        });

        it('updateExercise_BVA_muscleGroupCHEST_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CHEST};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.CHEST});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.CHEST);
            }
        });

        it('updateExercise_BVA_muscleGroupBACK_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.BACK};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.BACK});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.BACK);
            }
        });

        it('updateExercise_BVA_muscleGroupLEGS_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.LEGS};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.LEGS});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.LEGS);
            }
        });

        it('updateExercise_BVA_muscleGroupSHOULDERS_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.SHOULDERS};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                muscleGroup: MuscleGroup.SHOULDERS
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.SHOULDERS);
            }
        });

        it('updateExercise_BVA_muscleGroupARMS_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.ARMS};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.ARMS});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.ARMS);
            }
        });

        it('updateExercise_BVA_muscleGroupCORE_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.CORE};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, muscleGroup: MuscleGroup.CORE});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.muscleGroup).toBe(MuscleGroup.CORE);
            }
        });

        it('updateExercise_BVA_equipmentBARBELL_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.BARBELL};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.BARBELL
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.BARBELL);
            }
        });

        it('updateExercise_BVA_equipmentDUMBBELL_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.DUMBBELL};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.DUMBBELL
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.DUMBBELL);
            }
        });

        it('updateExercise_BVA_equipmentMACHINE_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.MACHINE};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                equipmentNeeded: Equipment.MACHINE
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.MACHINE);
            }
        });

        it('updateExercise_BVA_equipmentCABLE_returnsSuccess', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {equipmentNeeded: Equipment.CABLE};
            exerciseServiceMock.updateExercise.mockResolvedValue({...MOCK_EXERCISE, equipmentNeeded: Equipment.CABLE});

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.equipmentNeeded).toBe(Equipment.CABLE);
            }
        });

        it('updateExercise_BVA_existingOneCharId_updatesSuccessfully', async () => {
            const inputId: string = 'a';
            const inputData: UpdateExerciseInput = {muscleGroup: MuscleGroup.BACK};
            exerciseServiceMock.updateExercise.mockResolvedValue({
                ...MOCK_EXERCISE,
                id: 'a',
                muscleGroup: MuscleGroup.BACK
            });

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
                expect(result.data.muscleGroup).toBe(MuscleGroup.BACK);
            }
        });

        it('updateExercise_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId: string = 'a';
            const inputData: UpdateExerciseInput = {description: 'New'};
            exerciseServiceMock.updateExercise.mockRejectedValue(new NotFoundError('Not found'));

            const result: ActionResult<Exercise> = await updateExercise(inputId, inputData);

            expect(result.success).toBe(false);
        });
    });
});

describe('archiveExercise', () => {
    describe('Equivalence Classes', () => {
        it('archiveExercise_EC_existingId_returnsSuccessWithArchivedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.archiveExercise.mockResolvedValue({...MOCK_EXERCISE, isActive: false});

            const result: ActionResult<Exercise> = await archiveExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(false);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('archiveExercise_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId: string = NONEXISTENT_ID;
            exerciseServiceMock.archiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await archiveExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Exercise not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('archiveExercise_BVA_emptyId_returnsFailure', async () => {
            const inputId: string = '';
            exerciseServiceMock.archiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await archiveExercise(inputId);

            expect(result.success).toBe(false);
        });

        it('archiveExercise_BVA_existingOneCharId_archivesSuccessfully', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.archiveExercise.mockResolvedValue({...MOCK_EXERCISE, id: 'a', isActive: false});

            const result: ActionResult<Exercise> = await archiveExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
                expect(result.data.isActive).toBe(false);
            }
        });

        it('archiveExercise_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.archiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await archiveExercise(inputId);

            expect(result.success).toBe(false);
        });
    });
});

describe('unarchiveExercise', () => {
    describe('Equivalence Classes', () => {
        it('unarchiveExercise_EC_existingArchivedId_returnsSuccessWithActiveExercise', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.unarchiveExercise.mockResolvedValue({...MOCK_EXERCISE, isActive: true});

            const result: ActionResult<Exercise> = await unarchiveExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(true);
                expect(result.data.id).toBe(inputId);
            }
        });

        it('unarchiveExercise_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId: string = NONEXISTENT_ID;
            exerciseServiceMock.unarchiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await unarchiveExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Exercise not found');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('unarchiveExercise_BVA_emptyId_returnsFailure', async () => {
            const inputId: string = '';
            exerciseServiceMock.unarchiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await unarchiveExercise(inputId);

            expect(result.success).toBe(false);
        });

        it('unarchiveExercise_BVA_existingOneCharId_unarchivesSuccessfully', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.unarchiveExercise.mockResolvedValue({...MOCK_EXERCISE, id: 'a', isActive: true});

            const result: ActionResult<Exercise> = await unarchiveExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('a');
                expect(result.data.isActive).toBe(true);
            }
        });

        it('unarchiveExercise_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.unarchiveExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<Exercise> = await unarchiveExercise(inputId);

            expect(result.success).toBe(false);
        });
    });
});

describe('deleteExercise', () => {
    describe('Equivalence Classes', () => {
        it('deleteExercise_EC_existingUnreferencedId_returnsSuccessWithUndefinedData', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.deleteExercise.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });

        it('deleteExercise_EC_nonExistentId_returnsFailureWithMessage', async () => {
            const inputId: string = NONEXISTENT_ID;
            exerciseServiceMock.deleteExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Exercise not found');
            }
        });

        it('deleteExercise_EC_referencedInSession_returnsConflictError', async () => {
            const inputId: string = EXERCISE_ID;
            exerciseServiceMock.deleteExercise.mockRejectedValue(new ConflictError('Referenced in sessions'));

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Referenced in sessions');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('deleteExercise_BVA_emptyId_returnsFailure', async () => {
            const inputId: string = '';
            exerciseServiceMock.deleteExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(false);
        });

        it('deleteExercise_BVA_existingOneCharId_deletesSuccessfully', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.deleteExercise.mockResolvedValue(undefined);

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(true);
        });

        it('deleteExercise_BVA_inexistentOneCharId_returnsFailure', async () => {
            const inputId: string = 'a';
            exerciseServiceMock.deleteExercise.mockRejectedValue(new NotFoundError('Exercise not found'));

            const result: ActionResult<void> = await deleteExercise(inputId);

            expect(result.success).toBe(false);
        });
    });
});
