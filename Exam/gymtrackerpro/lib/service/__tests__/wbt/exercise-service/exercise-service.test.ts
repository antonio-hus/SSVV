import {mock, mockReset} from 'jest-mock-extended';
import {Exercise, ExerciseListOptions, MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ExerciseRepositoryInterface} from '@/lib/repository/exercise-repository-interface';
import {ExerciseService} from '@/lib/service/exercise-service';

const mockExerciseRepo = mock<ExerciseRepositoryInterface>();

const EXERCISE_ID: string = 'exercise-uuid-001';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
    isActive: true,
};

const CREATE_EXERCISE_INPUT: CreateExerciseInput = {
    name: 'Bicep Curls',
    description: 'Standard dumbbell curls',
    muscleGroup: MuscleGroup.ARMS,
    equipmentNeeded: Equipment.DUMBBELL,
};

beforeEach(() => {
    mockReset(mockExerciseRepo);
    (ExerciseService as unknown as {instance: unknown}).instance = undefined;
});

describe('createExercise', () => {

    describe('Independent Paths', () => {

        it('createExercise_Path1_validInput_returnsCreatedExercise', async () => {
            const inputData: CreateExerciseInput = {...CREATE_EXERCISE_INPUT};
            mockExerciseRepo.create.mockResolvedValue(MOCK_EXERCISE);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.createExercise(inputData);

            expect(result).toEqual(MOCK_EXERCISE);
            expect(mockExerciseRepo.create).toHaveBeenCalledWith(inputData);
        });

    });

});

describe('getExercise', () => {

    describe('Independent Paths', () => {

        it('getExercise_Path1_validId_returnsExercise', async () => {
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.findById.mockResolvedValue(MOCK_EXERCISE);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.getExercise(inputId);

            expect(result).toEqual(MOCK_EXERCISE);
            expect(mockExerciseRepo.findById).toHaveBeenCalledWith(inputId);
        });

    });

});

describe('listExercises', () => {

    describe('Independent Paths', () => {

        it('listExercises_Path1_noOptions_returnsPageResult', async () => {
            const inputOptions: ExerciseListOptions = {};
            const pageResult: PageResult<Exercise> = {items: [MOCK_EXERCISE], total: 1};
            mockExerciseRepo.findAll.mockResolvedValue(pageResult);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.listExercises(inputOptions);

            expect(result).toEqual(pageResult);
            expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(inputOptions);
        });

    });

});

describe('updateExercise', () => {

    describe('Independent Paths', () => {

        it('updateExercise_Path1_validInput_returnsUpdatedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            const updatedExercise: Exercise = {...MOCK_EXERCISE, description: 'Updated description'};
            mockExerciseRepo.update.mockResolvedValue(updatedExercise);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.updateExercise(inputId, inputData);

            expect(result).toEqual(updatedExercise);
            expect(mockExerciseRepo.update).toHaveBeenCalledWith(inputId, inputData);
        });

    });

});

describe('archiveExercise', () => {

    describe('Independent Paths', () => {

        it('archiveExercise_Path1_validId_returnsArchivedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            const archivedExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
            mockExerciseRepo.setActive.mockResolvedValue(archivedExercise);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.archiveExercise(inputId);

            expect(result).toEqual(archivedExercise);
            expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, false);
        });

    });

});

describe('unarchiveExercise', () => {

    describe('Independent Paths', () => {

        it('unarchiveExercise_Path1_validId_returnsUnarchivedExercise', async () => {
            const inputId: string = EXERCISE_ID;
            const unarchivedExercise: Exercise = {...MOCK_EXERCISE, isActive: true};
            mockExerciseRepo.setActive.mockResolvedValue(unarchivedExercise);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.unarchiveExercise(inputId);

            expect(result).toEqual(unarchivedExercise);
            expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, true);
        });

    });

});

describe('deleteExercise', () => {

    describe('Independent Paths', () => {

        it('deleteExercise_Path1_validId_resolvesVoid', async () => {
            const inputId: string = EXERCISE_ID;
            mockExerciseRepo.delete.mockResolvedValue(undefined);

            const service = ExerciseService.getInstance(mockExerciseRepo);
            const result = await service.deleteExercise(inputId);

            expect(result).toBeUndefined();
            expect(mockExerciseRepo.delete).toHaveBeenCalledWith(inputId);
        });

    });

});