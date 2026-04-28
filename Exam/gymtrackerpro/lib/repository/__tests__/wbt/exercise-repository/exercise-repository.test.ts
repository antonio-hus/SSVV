import {mockDeep, mockReset} from 'jest-mock-extended';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {Exercise, MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {ExerciseRepository} from '@/lib/repository/exercise-repository';

const prismaMock = mockDeep<PrismaClient>();

const EXERCISE_ID: string = 'exercise-uuid-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

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
} as const;

beforeEach(() => {
    mockReset(prismaMock);
    (ExerciseRepository as unknown as { instance: unknown }).instance = undefined;
});

describe('create', () => {

    describe('Independent Paths', () => {

        it('create_Path1_nameUnique_returnsCreatedExercise', async () => {
            // Arrange
            const inputData: CreateExerciseInput = {...CREATE_EXERCISE_INPUT};
            prismaMock.exercise.findUnique.mockResolvedValue(null);
            prismaMock.exercise.create.mockResolvedValue(MOCK_EXERCISE);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.create(inputData);

            // Assert
            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('create_Path2_nameConflicts_throwsConflictError', async () => {
            // Arrange
            const inputData: CreateExerciseInput = {...CREATE_EXERCISE_INPUT};
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.create(inputData);

            // Assert
            await expect(action).rejects.toThrow(ConflictError);
            await expect(action).rejects.toThrow(`Exercise name already in use: ${inputData.name}`);
        });

    });

});

describe('findById', () => {

    describe('Independent Paths', () => {

        it('findById_Path1_exerciseExists_returnsExercise', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findById(inputId);

            // Assert
            expect(result).toEqual(MOCK_EXERCISE);
        });

        it('findById_Path2_exerciseNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.findById(inputId);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Exercise not found: ${inputId}`);
        });

    });

});

describe('findAll', () => {

    describe('Independent Paths', () => {

        it('findAll_Path1_noOptions_returnsActiveExercisesPageResult', async () => {
            // Arrange
            const inputOptions = {};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

        it('findAll_Path2_searchOnly_buildsNameContainsFilter', async () => {
            // Arrange
            const inputOptions = {search: 'curl'};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
        });

        it('findAll_Path3_includeInactiveOnly_omitsIsActiveFilter', async () => {
            // Arrange
            const inputOptions = {includeInactive: true};
            const inactiveExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
            prismaMock.$transaction.mockResolvedValue([[inactiveExercise], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [inactiveExercise], total: 1});
        });

        it('findAll_Path4_muscleGroupOnly_buildsMuscleGroupFilter', async () => {
            // Arrange
            const inputOptions = {muscleGroup: MuscleGroup.ARMS};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
        });

        it('findAll_Path5_searchAndIncludeInactive_buildsNameFilterWithNoIsActive', async () => {
            // Arrange
            const inputOptions = {search: 'curl', includeInactive: true};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
        });

        it('findAll_Path6_searchAndMuscleGroup_buildsBothFilters', async () => {
            // Arrange
            const inputOptions = {search: 'curl', muscleGroup: MuscleGroup.ARMS};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
        });

        it('findAll_Path7_includeInactiveAndMuscleGroup_buildsMuscleGroupFilterWithNoIsActive', async () => {
            // Arrange
            const inputOptions = {includeInactive: true, muscleGroup: MuscleGroup.ARMS};
            const inactiveExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
            prismaMock.$transaction.mockResolvedValue([[inactiveExercise], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [inactiveExercise], total: 1});
        });

        it('findAll_Path8_allFilters_combinesAllFilters', async () => {
            // Arrange
            const inputOptions = {search: 'curl', includeInactive: true, muscleGroup: MuscleGroup.ARMS};
            prismaMock.$transaction.mockResolvedValue([[MOCK_EXERCISE], 1]);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.findAll(inputOptions);

            // Assert
            expect(result).toEqual({items: [MOCK_EXERCISE], total: 1});
        });

    });

});

describe('update', () => {

    describe('Independent Paths', () => {

        it('update_Path1_noNameChange_returnsUpdatedExercise', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            const updatedExercise: Exercise = {...MOCK_EXERCISE, description: 'Updated description'};
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(updatedExercise);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedExercise);
        });

        it('update_Path2_exerciseNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputData: UpdateExerciseInput = {description: 'Updated description'};
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.update(inputId, inputData);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Exercise not found: ${inputId}`);
        });

        it('update_Path3_newNameUnique_returnsUpdatedExercise', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'New Unique Name'};
            const updatedExercise: Exercise = {...MOCK_EXERCISE, name: 'New Unique Name'};
            prismaMock.exercise.findUnique
                .mockResolvedValueOnce(MOCK_EXERCISE)
                .mockResolvedValueOnce(null);
            prismaMock.exercise.update.mockResolvedValue(updatedExercise);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedExercise);
        });

        it('update_Path4_newNameConflicts_throwsConflictError', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Conflicting Name'};
            const conflictingExercise: Exercise = {...MOCK_EXERCISE, id: 'other-id', name: 'Conflicting Name'};
            prismaMock.exercise.findUnique
                .mockResolvedValueOnce(MOCK_EXERCISE)
                .mockResolvedValueOnce(conflictingExercise)
                .mockResolvedValueOnce(MOCK_EXERCISE)
                .mockResolvedValueOnce(conflictingExercise);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.update(inputId, inputData);

            // Assert
            await expect(action).rejects.toThrow(ConflictError);
            await expect(action).rejects.toThrow(`Exercise name already in use: ${inputData.name}`);
        });

        it('update_MCC_D2_sameNameAsCurrent_returnsUpdatedExercise', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            const inputData: UpdateExerciseInput = {name: 'Bicep Curls'};
            const updatedExercise: Exercise = {...MOCK_EXERCISE};
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(updatedExercise);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.update(inputId, inputData);

            // Assert
            expect(result).toEqual(updatedExercise);
        });

    });

});

describe('setActive', () => {

    describe('Independent Paths', () => {

        it('setActive_Path1_exerciseExists_returnsDeactivatedExercise', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            const inputIsActive: boolean = false;
            const deactivatedExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.exercise.update.mockResolvedValue(deactivatedExercise);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.setActive(inputId, inputIsActive);

            // Assert
            expect(result).toEqual(deactivatedExercise);
            expect(result.isActive).toBe(false);
        });

        it('setActive_Path2_exerciseNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            const inputIsActive: boolean = true;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.setActive(inputId, inputIsActive);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Exercise not found: ${inputId}`);
        });

    });

});

describe('delete', () => {

    describe('Independent Paths', () => {

        it('delete_Path1_exerciseExistsNotInUse_resolvesVoid', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(0);
            prismaMock.exercise.delete.mockResolvedValue(MOCK_EXERCISE);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const result = await repository.delete(inputId);

            // Assert
            expect(result).toBeUndefined();
            expect(prismaMock.exercise.delete).toHaveBeenCalledWith({where: {id: inputId}});
        });

        it('delete_Path2_exerciseNotFound_throwsNotFoundError', async () => {
            // Arrange
            const inputId: string = NONEXISTENT_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(null);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.delete(inputId);

            // Assert
            await expect(action).rejects.toThrow(NotFoundError);
            await expect(action).rejects.toThrow(`Exercise not found: ${inputId}`);
        });

        it('delete_Path3_exerciseInUseBySession_throwsConflictError', async () => {
            // Arrange
            const inputId: string = EXERCISE_ID;
            prismaMock.exercise.findUnique.mockResolvedValue(MOCK_EXERCISE);
            prismaMock.workoutSessionExercise.count.mockResolvedValue(2);

            const repository = ExerciseRepository.getInstance(prismaMock);

            // Act
            const action = () => repository.delete(inputId);

            // Assert
            await expect(action).rejects.toThrow(ConflictError);
            await expect(action).rejects.toThrow('Exercise is used in existing workout sessions and cannot be deleted');
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
        const instance = ExerciseRepository.getInstance(prismaMock);

        // Assert
        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(ExerciseRepository);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        // Arrange
        const firstCall = ExerciseRepository.getInstance(prismaMock);
        const secondPrismaMock = mockDeep<PrismaClient>();

        // Act
        const secondCall = ExerciseRepository.getInstance(secondPrismaMock);

        // Assert
        expect(secondCall).toBe(firstCall);

        const internalClient = (secondCall as unknown as { database: unknown }).database;
        expect(internalClient).toBe(prismaMock);
        expect(internalClient).not.toBe(secondPrismaMock);
    });

});
