import {mock, mockReset} from 'jest-mock-extended';
import {Equipment, Exercise, MuscleGroup} from '@/lib/domain/exercise';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {ExerciseRepositoryInterface} from '@/lib/repository/exercise-repository-interface';
import {ExerciseService} from '@/lib/service/exercise-service';
import {CreateExerciseInput, UpdateExerciseInput} from "@/lib/schema/exercise-schema";

const mockExerciseRepo = mock<ExerciseRepositoryInterface>();

const EXERCISE_ID: string = 'exercise-001';
const NONEXISTENT_ID: string = 'nonexistent-id';

const MOCK_EXERCISE: Exercise = {
    id: EXERCISE_ID,
    name: 'Bench Press Classic',
    description: 'Classic chest compound movement',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const MOCK_ARCHIVED_EXERCISE: Exercise = {...MOCK_EXERCISE, isActive: false};

const CREATE_INPUT: CreateExerciseInput = {
    name: 'Bench Press Classic',
    description: 'Classic chest compound movement',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
};

const UPDATE_INPUT: UpdateExerciseInput = {
    name: 'Incline Bench Press'
};

beforeEach(() => {
    mockReset(mockExerciseRepo);
    (ExerciseService as unknown as { instance: unknown }).instance = undefined;
});

describe('createExercise', () => {
    it('createExercise_uniqueName_returnsCreatedExercise', async () => {
        mockExerciseRepo.create.mockResolvedValue(MOCK_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputData = CREATE_INPUT;

        const result = await service.createExercise(inputData);

        expect(result.id).toBe(EXERCISE_ID);
        expect(result.name).toBe('Bench Press Classic');
        expect(mockExerciseRepo.create).toHaveBeenCalledWith(inputData);
    });

    it('createExercise_duplicateName_throwsConflictError', async () => {
        mockExerciseRepo.create.mockRejectedValue(new ConflictError('Exercise name already in use'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputData = CREATE_INPUT;

        const act = service.createExercise(inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('getExercise', () => {
    it('getExercise_existingId_returnsExercise', async () => {
        mockExerciseRepo.findById.mockResolvedValue(MOCK_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const result = await service.getExercise(inputId);

        expect(result.id).toBe(EXERCISE_ID);
        expect(mockExerciseRepo.findById).toHaveBeenCalledWith(inputId);
    });

    it('getExercise_nonExistentId_throwsNotFoundError', async () => {
        mockExerciseRepo.findById.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.getExercise(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('listExercises', () => {
    it('listExercises_noOptions_returnsPageResult', async () => {
        mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});
        const service = ExerciseService.getInstance(mockExerciseRepo);

        const result = await service.listExercises();

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('listExercises_withOptions_passesOptionsToRepository', async () => {
        mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE], total: 1});
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputOptions = {search: 'Bench', muscleGroup: MuscleGroup.CHEST, page: 1, pageSize: 10};

        await service.listExercises(inputOptions);

        expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(inputOptions);
    });

    it('listExercises_withIncludeInactive_passesOptionToRepository', async () => {
        const archivedExercise: Exercise = {...MOCK_EXERCISE, isActive: false};
        mockExerciseRepo.findAll.mockResolvedValue({items: [MOCK_EXERCISE, archivedExercise], total: 2});
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputOptions = {includeInactive: true};

        const result = await service.listExercises(inputOptions);

        expect(result.total).toBe(2);
        expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(inputOptions);
    });

    it('listExercises_emptyRepository_returnsEmptyPageResult', async () => {
        mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = ExerciseService.getInstance(mockExerciseRepo);

        const result = await service.listExercises();

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('listExercises_withPaginationOptions_passesOptionsToRepository', async () => {
        mockExerciseRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputOptions = {page: 2, pageSize: 5};

        await service.listExercises(inputOptions);

        expect(mockExerciseRepo.findAll).toHaveBeenCalledWith(inputOptions);
    });
});

describe('updateExercise', () => {
    it('updateExercise_existingId_returnsUpdatedExercise', async () => {
        const updated = {...MOCK_EXERCISE, name: 'Incline Bench Press'};
        mockExerciseRepo.update.mockResolvedValue(updated);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;
        const inputData = UPDATE_INPUT;

        const result = await service.updateExercise(inputId, inputData);

        expect(result.name).toBe('Incline Bench Press');
        expect(mockExerciseRepo.update).toHaveBeenCalledWith(inputId, inputData);
    });

    it('updateExercise_nonExistentId_throwsNotFoundError', async () => {
        mockExerciseRepo.update.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = NONEXISTENT_ID;
        const inputData = UPDATE_INPUT;

        const act = service.updateExercise(inputId, inputData);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('updateExercise_duplicateName_throwsConflictError', async () => {
        mockExerciseRepo.update.mockRejectedValue(new ConflictError('Exercise name already in use'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;
        const inputData = {name: 'Squat'};

        const act = service.updateExercise(inputId, inputData);

        await expect(act).rejects.toThrow(ConflictError);
    });
});

describe('archiveExercise', () => {
    it('archiveExercise_existingId_callsSetActiveWithFalse', async () => {
        mockExerciseRepo.setActive.mockResolvedValue(MOCK_ARCHIVED_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const result = await service.archiveExercise(inputId);

        expect(result.isActive).toBe(false);
        expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, false);
    });

    it('archiveExercise_alreadyArchivedExercise_callsSetActiveWithFalse', async () => {
        mockExerciseRepo.setActive.mockResolvedValue(MOCK_ARCHIVED_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const result = await service.archiveExercise(inputId);

        expect(result.isActive).toBe(false);
        expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, false);
    });

    it('archiveExercise_nonExistentId_throwsNotFoundError', async () => {
        mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.archiveExercise(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('unarchiveExercise', () => {
    it('unarchiveExercise_archivedId_callsSetActiveWithTrue', async () => {
        mockExerciseRepo.setActive.mockResolvedValue(MOCK_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const result = await service.unarchiveExercise(inputId);

        expect(result.isActive).toBe(true);
        expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, true);
    });

    it('unarchiveExercise_alreadyActiveExercise_callsSetActiveWithTrue', async () => {
        mockExerciseRepo.setActive.mockResolvedValue(MOCK_EXERCISE);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const result = await service.unarchiveExercise(inputId);

        expect(result.isActive).toBe(true);
        expect(mockExerciseRepo.setActive).toHaveBeenCalledWith(inputId, true);
    });

    it('unarchiveExercise_nonExistentId_throwsNotFoundError', async () => {
        mockExerciseRepo.setActive.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.unarchiveExercise(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });
});

describe('deleteExercise', () => {
    it('deleteExercise_unreferencedExercise_deletesSuccessfully', async () => {
        mockExerciseRepo.delete.mockResolvedValue(undefined);
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const act = service.deleteExercise(inputId);

        await expect(act).resolves.toBeUndefined();
        expect(mockExerciseRepo.delete).toHaveBeenCalledWith(inputId);
    });

    it('deleteExercise_nonExistentId_throwsNotFoundError', async () => {
        mockExerciseRepo.delete.mockRejectedValue(new NotFoundError('Exercise not found'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = NONEXISTENT_ID;

        const act = service.deleteExercise(inputId);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('deleteExercise_referencedBySession_throwsConflictError', async () => {
        mockExerciseRepo.delete.mockRejectedValue(new ConflictError('Exercise is referenced by workout sessions'));
        const service = ExerciseService.getInstance(mockExerciseRepo);
        const inputId = EXERCISE_ID;

        const act = service.deleteExercise(inputId);

        await expect(act).rejects.toThrow(ConflictError);
    });
});