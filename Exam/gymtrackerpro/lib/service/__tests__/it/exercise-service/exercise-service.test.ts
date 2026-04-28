import {prisma} from '@/lib/database';
import {exerciseRepository, exerciseService, userRepository, workoutSessionRepository} from '@/lib/di';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {Equipment, ExerciseListOptions, MuscleGroup} from '@/lib/domain/exercise';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {CreateMemberInput} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('createExercise', () => {

    it('createExercise_newExercise_returnsPersistedRowWithAllFields', async () => {
        // Arrange
        const input: CreateExerciseInput = {
            name: 'Deadlift',
            description: 'Posterior chain compound movement',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const result = await exerciseService.createExercise(input);

        // Assert
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Deadlift');
        expect(result.description).toBe('Posterior chain compound movement');
        expect(result.muscleGroup).toBe(MuscleGroup.BACK);
        expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
        expect(result.isActive).toBe(true);
        const rowInRepository = await exerciseRepository.findById(result.id);
        expect(rowInRepository).toBeDefined();
        expect(rowInRepository.name).toBe(input.name);
        expect(rowInRepository.muscleGroup).toBe(input.muscleGroup);
        expect(rowInRepository.isActive).toBe(true);
    });

    it('createExercise_duplicateName_throwsConflictErrorAndLeavesOnlyOneRowInRepository', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const input: CreateExerciseInput = {
            name: 'Bench Press',
            description: 'Duplicate attempt',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const action = () => exerciseService.createExercise(input);

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const {total: totalRowsInRepository} = await exerciseRepository.findAll({includeInactive: true});
        expect(totalRowsInRepository).toBe(1);
    });

    it('createExercise_secondExerciseWithUniqueName_persistsBothRowsIndependently', async () => {
        // Arrange
        const firstInput: CreateExerciseInput = {
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        };
        const secondInput: CreateExerciseInput = {
            name: 'Leg Press',
            description: 'Quad focused',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.MACHINE,
        };

        // Act
        const firstResult = await exerciseService.createExercise(firstInput);
        const secondResult = await exerciseService.createExercise(secondInput);

        // Assert
        expect(firstResult.id).not.toBe(secondResult.id);
        const {total: totalRowsInRepository} = await exerciseRepository.findAll({includeInactive: true});
        expect(totalRowsInRepository).toBe(2);
    });

});

describe('getExercise', () => {

    it('getExercise_existingId_returnsExactRowFromDatabase', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Cable Fly',
            description: 'Chest isolation',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.CABLE,
        });
        const id: string = seededExercise.id;

        // Act
        const result = await exerciseService.getExercise(id);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.name).toBe(seededExercise.name);
        expect(result.description).toBe(seededExercise.description);
        expect(result.muscleGroup).toBe(seededExercise.muscleGroup);
        expect(result.equipmentNeeded).toBe(seededExercise.equipmentNeeded);
        expect(result.isActive).toBe(seededExercise.isActive);
    });

    it('getExercise_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const id: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseService.getExercise(id);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('listExercises', () => {

    it('listExercises_noOptions_returnsOnlyActiveExercisesOrderedByNameAscending', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const legPress = await exerciseRepository.create({
            name: 'Leg Press',
            description: 'Quad focused',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.MACHINE
        });
        await exerciseRepository.setActive(legPress.id, false);

        // Act
        const result = await exerciseService.listExercises();

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(e => e.isActive)).toBe(true);
        expect(result.items[0].name).toBe('Bench Press');
        expect(result.items[1].name).toBe('Squat');
    });

    it('listExercises_includeInactiveTrue_returnsAllRowsFromDatabase', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const legPress = await exerciseRepository.create({
            name: 'Leg Press',
            description: 'Quad focused',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.MACHINE
        });
        await exerciseRepository.setActive(legPress.id, false);
        const options: ExerciseListOptions = {includeInactive: true};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.some(e => !e.isActive)).toBe(true);
    });

    it('listExercises_muscleGroupFilter_returnsOnlyRowsMatchingThatMuscleGroup', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Cable Row',
            description: 'Back isolation',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.CABLE
        });
        const options: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(e => e.muscleGroup === MuscleGroup.BACK)).toBe(true);
    });

    it('listExercises_searchTerm_returnsOnlyRowsWhoseNameContainsTermCaseInsensitively', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Incline Press',
            description: 'Upper chest',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL
        });
        await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {search: 'PRESS'};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('listExercises_searchAndMuscleGroup_returnsOnlyRowsMatchingBothFilters', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Incline Press',
            description: 'Upper chest',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL
        });
        await exerciseRepository.create({
            name: 'Shoulder Press',
            description: 'Delt compound',
            muscleGroup: MuscleGroup.SHOULDERS,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {search: 'press', muscleGroup: MuscleGroup.CHEST};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items.every(e => e.muscleGroup === MuscleGroup.CHEST)).toBe(true);
        expect(result.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('listExercises_pagination_returnsCorrectSliceAndReportsFullTotalFromDatabase', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Exercise A',
            description: 'A',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Exercise B',
            description: 'B',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Exercise C',
            description: 'C',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const firstOptions: ExerciseListOptions = {page: 1, pageSize: 2};
        const secondOptions: ExerciseListOptions = {page: 2, pageSize: 2};

        // Act
        const firstPageResult = await exerciseService.listExercises(firstOptions);
        const secondPageResult = await exerciseService.listExercises(secondOptions);

        // Assert
        expect(firstPageResult.total).toBe(3);
        expect(firstPageResult.items).toHaveLength(2);
        expect(secondPageResult.total).toBe(3);
        expect(secondPageResult.items).toHaveLength(1);
        const firstPageIds = firstPageResult.items.map(e => e.id);
        secondPageResult.items.forEach(e => expect(firstPageIds).not.toContain(e.id));
    });

    it('listExercises_includeInactiveWithMuscleGroupFilter_returnsBothActiveAndInactiveRowsMatchingThatMuscleGroup', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const cableFly = await exerciseRepository.create({
            name: 'Cable Fly',
            description: 'Chest isolation',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.CABLE
        });
        await exerciseRepository.setActive(cableFly.id, false);
        await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {includeInactive: true, muscleGroup: MuscleGroup.CHEST};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(e => e.muscleGroup === MuscleGroup.CHEST)).toBe(true);
        expect(result.items.some(e => !e.isActive)).toBe(true);
    });

    it('listExercises_includeInactiveWithSearchFilter_returnsMatchingRowsRegardlessOfActiveStatus', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const inclinePress = await exerciseRepository.create({
            name: 'Incline Press',
            description: 'Upper chest',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL
        });
        await exerciseRepository.setActive(inclinePress.id, false);
        await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {includeInactive: true, search: 'press'};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
        expect(result.items.some(e => !e.isActive)).toBe(true);
    });

    it('listExercises_pageSizeExceedsTotalRowCount_returnsAllRowsInSinglePage', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {page: 1, pageSize: 100};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('listExercises_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {search: 'Bench%'};

        // Act
        const result = await exerciseService.listExercises(options);

        // Assert
        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

});

describe('updateExercise', () => {

    it('updateExercise_validData_returnsUpdatedRowAndPersistsChangesToDatabase', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {name: 'Barbell Back Squat', description: 'Updated description'};

        // Act
        const result = await exerciseService.updateExercise(seededExercise.id, data);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.name).toBe('Barbell Back Squat');
        expect(result.description).toBe('Updated description');
        const rowInRepository = await exerciseRepository.findById(seededExercise.id);
        expect(rowInRepository.name).toBe('Barbell Back Squat');
        expect(rowInRepository.description).toBe('Updated description');
    });

    it('updateExercise_partialInput_doesNotOverwriteUnspecifiedFieldsInRepository', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {name: 'Barbell Back Squat'};

        // Act
        await exerciseService.updateExercise(seededExercise.id, data);

        // Assert
        const rowInRepository = await exerciseRepository.findById(seededExercise.id);
        expect(rowInRepository.description).toBe('Original description');
        expect(rowInRepository.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(rowInRepository.equipmentNeeded).toBe(Equipment.BARBELL);
    });

    it('updateExercise_sameNameAsCurrentExercise_doesNotThrowAndPersistsOtherChanges', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {name: 'Bench Press', description: 'New description'};

        // Act
        const result = await exerciseService.updateExercise(seededExercise.id, data);

        // Assert
        expect(result.name).toBe('Bench Press');
        expect(result.description).toBe('New description');
        const rowInRepository = await exerciseRepository.findById(seededExercise.id);
        expect(rowInRepository.description).toBe('New description');
    });

    it('updateExercise_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const id: string = '00000000-0000-0000-0000-000000000000';
        const data: UpdateExerciseInput = {name: 'Ghost'};

        // Act
        const action = () => exerciseService.updateExercise(id, data);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateExercise_nameAlreadyTakenByAnotherExercise_throwsConflictErrorAndLeavesOriginalNameInRepository', async () => {
        // Arrange
        await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const seededSquat = await exerciseRepository.create({
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL
        });
        const data: UpdateExerciseInput = {name: 'Bench Press'};

        // Act
        const action = () => exerciseService.updateExercise(seededSquat.id, data);

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const rowInRepository = await exerciseRepository.findById(seededSquat.id);
        expect(rowInRepository.name).toBe('Squat');
    });

    it('updateExercise_emptyInput_returnsUnchangedRowAndLeavesAllFieldsInRepository', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {};

        // Act
        const result = await exerciseService.updateExercise(seededExercise.id, data);

        // Assert
        expect(result.name).toBe('Squat');
        expect(result.description).toBe('Original description');
        expect(result.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
        const rowInRepository = await exerciseRepository.findById(seededExercise.id);
        expect(rowInRepository.name).toBe('Squat');
        expect(rowInRepository.description).toBe('Original description');
        expect(rowInRepository.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(rowInRepository.equipmentNeeded).toBe(Equipment.BARBELL);
    });

});

describe('archiveExercise', () => {

    it('archiveExercise_activeExercise_returnsRowWithIsActiveFalseAndPersistsToDatabase', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const id: string = seededExercise.id;

        // Act
        const result = await exerciseService.archiveExercise(id);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.isActive).toBe(false);
        const rowInRepository = await exerciseRepository.findById(id);
        expect(rowInRepository.isActive).toBe(false);
    });

    it('archiveExercise_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const id: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseService.archiveExercise(id);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('unarchiveExercise', () => {

    it('unarchiveExercise_inactiveExercise_returnsRowWithIsActiveTrueAndPersistsToDatabase', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        await exerciseRepository.setActive(seededExercise.id, false);
        const id: string = seededExercise.id;

        // Act
        const result = await exerciseService.unarchiveExercise(id);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.isActive).toBe(true);
        const rowInRepository = await exerciseRepository.findById(id);
        expect(rowInRepository.isActive).toBe(true);
    });

    it('unarchiveExercise_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const id: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseService.unarchiveExercise(id);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('deleteExercise', () => {

    it('deleteExercise_unreferencedExercise_removesRowFromDatabase', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const id: string = seededExercise.id;

        // Act
        await exerciseService.deleteExercise(id);

        // Assert
        await expect(exerciseRepository.findById(id)).rejects.toThrow(NotFoundError);
    });

    it('deleteExercise_oneOfManyExercises_removesOnlyTargetRowFromDatabase', async () => {
        // Arrange
        const seededBenchPress = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const seededDeadlift = await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });

        // Act
        await exerciseService.deleteExercise(seededBenchPress.id);

        // Assert
        const {items: remainingRows} = await exerciseRepository.findAll({includeInactive: true});
        expect(remainingRows).toHaveLength(1);
        expect(remainingRows[0].id).toBe(seededDeadlift.id);
    });

    it('deleteExercise_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const id: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseService.deleteExercise(id);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('deleteExercise_exerciseReferencedByWorkoutSession_throwsConflictErrorAndRowRemainsInRepository', async () => {
        // Arrange
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Classic chest compound exercise',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const memberInput: CreateMemberInput = {
            email: `it-${Date.now()}@gym.test`,
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        const seededMember = await userRepository.createMember(memberInput);
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-01', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );
        const id: string = seededExercise.id;

        // Act
        const action = () => exerciseService.deleteExercise(id);

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const rowInRepository = await exerciseRepository.findById(id);
        expect(rowInRepository.id).toBe(id);
    });

    it('deleteExercise_afterConflictOnReferencedExercise_unreferencedSiblingExerciseRemainsDeleteable', async () => {
        // Arrange
        const referencedExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL
        });
        const unreferencedExercise = await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });
        const memberInput: CreateMemberInput = {
            email: `it-${Date.now()}@gym.test`,
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        const seededMember = await userRepository.createMember(memberInput);
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-01', duration: 60},
            [{exerciseId: referencedExercise.id, sets: 3, reps: 10, weight: 50}],
        );

        // Act
        await expect(exerciseService.deleteExercise(referencedExercise.id)).rejects.toThrow(ConflictError);

        await exerciseService.deleteExercise(unreferencedExercise.id);

        // Assert
        const {items: remainingRows} = await exerciseRepository.findAll({includeInactive: true});
        expect(remainingRows).toHaveLength(1);
        expect(remainingRows[0].id).toBe(referencedExercise.id);
    });

});