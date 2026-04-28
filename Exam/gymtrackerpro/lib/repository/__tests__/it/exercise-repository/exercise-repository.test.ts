import {prisma} from '@/lib/database';
import {exerciseRepository} from '@/lib/di';
import {Equipment, MuscleGroup} from '@/lib/domain/exercise';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {CreateExerciseInput} from '@/lib/schema/exercise-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

const seedExercise = async (overrides: Partial<CreateExerciseInput & { isActive: boolean }> = {}) => {
    return prisma.exercise.create({
        data: {
            name: overrides.name ?? 'Bench Press',
            description: overrides.description ?? 'Classic chest compound exercise',
            muscleGroup: overrides.muscleGroup ?? MuscleGroup.CHEST,
            equipmentNeeded: overrides.equipmentNeeded ?? Equipment.BARBELL,
            isActive: overrides.isActive ?? true,
        },
    });
};

const seedWorkoutSessionExercise = async (exerciseId: string) => {
    const user = await prisma.user.create({
        data: {
            email: `integration-test-${Date.now()}@gym.test`,
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: new Date('1990-01-01'),
            passwordHash: 'hashed-password',
            role: 'MEMBER',
        },
    });

    const member = await prisma.member.create({
        data: {
            userId: user.id,
            membershipStart: new Date(),
        },
    });

    const workoutSession = await prisma.workoutSession.create({
        data: {
            memberId: member.id,
            date: new Date(),
            duration: 60,
        },
    });

    return prisma.workoutSessionExercise.create({
        data: {
            workoutSessionId: workoutSession.id,
            exerciseId: exerciseId,
            sets: 3,
            reps: 10,
            weight: 50.0,
        },
    });
};

describe('create', () => {

    it('create_newExercise_returnsPersistedRowWithAllFields', async () => {
        // Arrange
        const input: CreateExerciseInput = {
            name: 'Deadlift',
            description: 'Posterior chain compound movement',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const result = await exerciseRepository.create(input);

        // Assert
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Deadlift');
        expect(result.description).toBe('Posterior chain compound movement');
        expect(result.muscleGroup).toBe(MuscleGroup.BACK);
        expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
        expect(result.isActive).toBe(true);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: result.id}});
        expect(rowInDatabase).not.toBeNull();
        expect(rowInDatabase!.name).toBe(input.name);
        expect(rowInDatabase!.muscleGroup).toBe(input.muscleGroup);
        expect(rowInDatabase!.isActive).toBe(true);
    });

    it('create_duplicateName_throwsConflictErrorAndLeavesOnlyOneRowInDatabase', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press'});
        const duplicateInput: CreateExerciseInput = {
            name: 'Bench Press',
            description: 'Duplicate attempt',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const action = () => exerciseRepository.create(duplicateInput);

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const totalRowsInDatabase = await prisma.exercise.count();
        expect(totalRowsInDatabase).toBe(1);
    });

    it('create_secondExerciseWithUniqueName_persistsBothRowsIndependently', async () => {
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
        const firstResult = await exerciseRepository.create(firstInput);
        const secondResult = await exerciseRepository.create(secondInput);

        // Assert
        expect(firstResult.id).not.toBe(secondResult.id);
        const totalRowsInDatabase = await prisma.exercise.count();
        expect(totalRowsInDatabase).toBe(2);
    });

});

describe('findById', () => {

    it('findById_existingId_returnsExactRowFromDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({
            name: 'Cable Fly',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.CABLE,
        });

        // Act
        const result = await exerciseRepository.findById(seededExercise.id);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.name).toBe(seededExercise.name);
        expect(result.description).toBe(seededExercise.description);
        expect(result.muscleGroup).toBe(seededExercise.muscleGroup);
        expect(result.equipmentNeeded).toBe(seededExercise.equipmentNeeded);
        expect(result.isActive).toBe(seededExercise.isActive);
    });

    it('findById_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseRepository.findById(nonExistentId);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('findAll', () => {

    it('findAll_noOptions_returnsOnlyActiveExercisesOrderedByNameAscending', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Squat',
                    description: 'Leg compound',
                    muscleGroup: MuscleGroup.LEGS,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Leg Press',
                    description: 'Quad focused',
                    muscleGroup: MuscleGroup.LEGS,
                    equipmentNeeded: Equipment.MACHINE,
                    isActive: false
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll();

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(exercise => exercise.isActive)).toBe(true);
        expect(result.items[0].name).toBe('Bench Press');
        expect(result.items[1].name).toBe('Squat');
    });

    it('findAll_includeInactiveTrue_returnsAllRowsFromDatabase', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Leg Press',
                    description: 'Quad focused',
                    muscleGroup: MuscleGroup.LEGS,
                    equipmentNeeded: Equipment.MACHINE,
                    isActive: false
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({includeInactive: true});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.some(exercise => !exercise.isActive)).toBe(true);
    });

    it('findAll_muscleGroupFilter_returnsOnlyRowsMatchingThatMuscleGroup', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Deadlift',
                    description: 'Back compound',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Cable Row',
                    description: 'Back isolation',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.CABLE,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({muscleGroup: MuscleGroup.BACK});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(exercise => exercise.muscleGroup === MuscleGroup.BACK)).toBe(true);
    });

    it('findAll_searchTerm_returnsOnlyRowsWhoseNameContainsTermCaseInsensitively', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Incline Press',
                    description: 'Upper chest',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.DUMBBELL,
                    isActive: true
                },
                {
                    name: 'Deadlift',
                    description: 'Back compound',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({search: 'PRESS'});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items.every(exercise => exercise.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('findAll_searchAndMuscleGroup_returnsOnlyRowsMatchingBothFilters', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Incline Press',
                    description: 'Upper chest',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.DUMBBELL,
                    isActive: true
                },
                {
                    name: 'Shoulder Press',
                    description: 'Delt compound',
                    muscleGroup: MuscleGroup.SHOULDERS,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({search: 'press', muscleGroup: MuscleGroup.CHEST});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items.every(exercise => exercise.muscleGroup === MuscleGroup.CHEST)).toBe(true);
        expect(result.items.every(exercise => exercise.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('findAll_pagination_returnsCorrectSliceAndReportsFullTotalFromDatabase', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Exercise A',
                    description: 'A',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Exercise B',
                    description: 'B',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Exercise C',
                    description: 'C',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const firstPageResult = await exerciseRepository.findAll({page: 1, pageSize: 2});
        const secondPageResult = await exerciseRepository.findAll({page: 2, pageSize: 2});

        // Assert
        expect(firstPageResult.total).toBe(3);
        expect(firstPageResult.items).toHaveLength(2);
        expect(secondPageResult.total).toBe(3);
        expect(secondPageResult.items).toHaveLength(1);
        const firstPageIds = firstPageResult.items.map(exercise => exercise.id);
        secondPageResult.items.forEach(exercise => expect(firstPageIds).not.toContain(exercise.id));
    });

    it('findAll_includeInactiveWithMuscleGroupFilter_returnsBothActiveAndInactiveRowsMatchingThatMuscleGroup', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Cable Fly',
                    description: 'Chest isolation',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.CABLE,
                    isActive: false
                },
                {
                    name: 'Deadlift',
                    description: 'Back compound',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({includeInactive: true, muscleGroup: MuscleGroup.CHEST});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(exercise => exercise.muscleGroup === MuscleGroup.CHEST)).toBe(true);
        expect(result.items.some(exercise => !exercise.isActive)).toBe(true);
    });

    it('findAll_includeInactiveWithSearchFilter_returnsMatchingRowsRegardlessOfActiveStatus', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Incline Press',
                    description: 'Upper chest',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.DUMBBELL,
                    isActive: false
                },
                {
                    name: 'Deadlift',
                    description: 'Back compound',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({includeInactive: true, search: 'press'});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(exercise => exercise.name.toLowerCase().includes('press'))).toBe(true);
        expect(result.items.some(exercise => !exercise.isActive)).toBe(true);
    });

    it('findAll_pageSizeExceedsTotalRowCount_returnsAllRowsInSinglePage', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Squat',
                    description: 'Leg compound',
                    muscleGroup: MuscleGroup.LEGS,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({page: 1, pageSize: 100});

        // Assert
        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('findAll_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        // Arrange
        await prisma.exercise.createMany({
            data: [
                {
                    name: 'Bench Press',
                    description: 'Chest compound',
                    muscleGroup: MuscleGroup.CHEST,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
                {
                    name: 'Deadlift',
                    description: 'Back compound',
                    muscleGroup: MuscleGroup.BACK,
                    equipmentNeeded: Equipment.BARBELL,
                    isActive: true
                },
            ],
        });

        // Act
        const result = await exerciseRepository.findAll({search: 'Bench%'});

        // Assert
        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

});

describe('update', () => {

    it('update_validData_returnsUpdatedRowAndPersistsChangesToDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({name: 'Squat', muscleGroup: MuscleGroup.LEGS});

        // Act
        const result = await exerciseRepository.update(seededExercise.id, {
            name: 'Barbell Back Squat',
            description: 'Updated description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.name).toBe('Barbell Back Squat');
        expect(result.description).toBe('Updated description');
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.name).toBe('Barbell Back Squat');
        expect(rowInDatabase!.description).toBe('Updated description');
    });

    it('update_partialInput_doesNotOverwriteUnspecifiedFieldsInDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({
            name: 'Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });

        // Act
        await exerciseRepository.update(seededExercise.id, {name: 'Barbell Back Squat'});

        // Assert
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.description).toBe('Original description');
        expect(rowInDatabase!.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(rowInDatabase!.equipmentNeeded).toBe(Equipment.BARBELL);
    });

    it('update_sameNameAsCurrentExercise_doesNotThrowAndPersistsOtherChanges', async () => {
        // Arrange
        const seededExercise = await seedExercise({name: 'Bench Press'});

        // Act
        const result = await exerciseRepository.update(seededExercise.id, {
            name: 'Bench Press',
            description: 'New description',
        });

        // Assert
        expect(result.name).toBe('Bench Press');
        expect(result.description).toBe('New description');
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.description).toBe('New description');
    });

    it('update_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseRepository.update(nonExistentId, {name: 'Ghost'});

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('update_nameAlreadyTakenByAnotherExercise_throwsConflictErrorAndLeavesOriginalNameInDatabase', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press'});
        const secondSeededExercise = await seedExercise({name: 'Squat'});

        // Act
        const action = () => exerciseRepository.update(secondSeededExercise.id, {name: 'Bench Press'});

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: secondSeededExercise.id}});
        expect(rowInDatabase!.name).toBe('Squat');
    });

    it('update_emptyInput_returnsUnchangedRowAndLeavesAllFieldsInDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({
            name: 'Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });

        // Act
        const result = await exerciseRepository.update(seededExercise.id, {});

        // Assert
        expect(result.name).toBe('Squat');
        expect(result.description).toBe('Original description');
        expect(result.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(result.equipmentNeeded).toBe(Equipment.BARBELL);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.name).toBe('Squat');
        expect(rowInDatabase!.description).toBe('Original description');
        expect(rowInDatabase!.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(rowInDatabase!.equipmentNeeded).toBe(Equipment.BARBELL);
    });

});

describe('setActive', () => {

    it('setActive_falseOnActiveExercise_returnsRowWithIsActiveFalseAndPersistsToDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({isActive: true});

        // Act
        const result = await exerciseRepository.setActive(seededExercise.id, false);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.isActive).toBe(false);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.isActive).toBe(false);
    });

    it('setActive_trueOnInactiveExercise_returnsRowWithIsActiveTrueAndPersistsToDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise({isActive: false});

        // Act
        const result = await exerciseRepository.setActive(seededExercise.id, true);

        // Assert
        expect(result.id).toBe(seededExercise.id);
        expect(result.isActive).toBe(true);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase!.isActive).toBe(true);
    });

    it('setActive_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseRepository.setActive(nonExistentId, false);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('delete', () => {

    it('delete_existingUnreferencedExercise_removesRowFromDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise();

        // Act
        await exerciseRepository.delete(seededExercise.id);

        // Assert
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase).toBeNull();
    });

    it('delete_oneOfManyExercises_removesOnlyTargetRowFromDatabase', async () => {
        // Arrange
        const firstSeededExercise = await seedExercise({name: 'Bench Press'});
        const secondSeededExercise = await seedExercise({name: 'Deadlift'});

        // Act
        await exerciseRepository.delete(firstSeededExercise.id);

        // Assert
        const remainingRows = await prisma.exercise.findMany();
        expect(remainingRows).toHaveLength(1);
        expect(remainingRows[0].id).toBe(secondSeededExercise.id);
    });

    it('delete_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => exerciseRepository.delete(nonExistentId);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('delete_exerciseReferencedByWorkoutSession_throwsConflictErrorAndRowRemainsInDatabase', async () => {
        // Arrange
        const seededExercise = await seedExercise();
        await seedWorkoutSessionExercise(seededExercise.id);

        // Act
        const action = () => exerciseRepository.delete(seededExercise.id);

        // Assert
        await expect(action()).rejects.toThrow(ConflictError);
        const rowInDatabase = await prisma.exercise.findUnique({where: {id: seededExercise.id}});
        expect(rowInDatabase).not.toBeNull();
    });

    it('delete_afterConflictOnReferencedExercise_unreferencedSiblingExerciseRemainsDeleteable', async () => {
        // Arrange
        const referencedExercise = await seedExercise({name: 'Bench Press'});
        const unreferencedExercise = await seedExercise({name: 'Deadlift'});
        await seedWorkoutSessionExercise(referencedExercise.id);

        // Act
        await expect(exerciseRepository.delete(referencedExercise.id)).rejects.toThrow(ConflictError);
        await exerciseRepository.delete(unreferencedExercise.id);

        // Assert
        const remainingRows = await prisma.exercise.findMany();
        expect(remainingRows).toHaveLength(1);
        expect(remainingRows[0].id).toBe(referencedExercise.id);
    });

});
