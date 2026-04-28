import {prisma} from '@/lib/database';
import {exerciseService, userService, workoutSessionService} from '@/lib/di';
import {
    createExercise,
    getExercise,
    listExercises,
    updateExercise,
    archiveExercise,
    unarchiveExercise,
    deleteExercise,
} from '@/lib/controller/exercise-controller';
import {MuscleGroup, Equipment} from '@/prisma/generated/prisma/client';
import {ActionResult} from '@/lib/domain/action-result';
import {Exercise, ExerciseListOptions} from '@/lib/domain/exercise';
import {PageResult} from '@/lib/domain/pagination';
import {CreateExerciseInput, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import {CreateMemberInput} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.user.deleteMany();
    await prisma.exercise.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

const seedExercise = async (
    overrides: Partial<CreateExerciseInput & { isActive: boolean }> = {},
) => {
    const exercise = await exerciseService.createExercise({
        name: overrides.name ?? 'Bench Press',
        description: overrides.description ?? 'Classic chest compound exercise',
        muscleGroup: overrides.muscleGroup ?? MuscleGroup.CHEST,
        equipmentNeeded: overrides.equipmentNeeded ?? Equipment.BARBELL,
    });
    if (overrides.isActive === false) {
        return exerciseService.archiveExercise(exercise.id);
    }
    return exercise;
};

const seedReferencedExercise = async (overrides: Partial<CreateExerciseInput> = {}) => {
    const exercise = await seedExercise(overrides);

    const memberInput: CreateMemberInput = {
        email: 'member@gym.test',
        fullName: 'Test Member',
        phone: '+40700000000',
        dateOfBirth: '1990-01-01',
        password: 'ValidPass123!',
        membershipStart: '2024-01-01',
    };
    const seededMember = await userService.createMember(memberInput);

    await workoutSessionService.createWorkoutSession(
        {memberId: seededMember.id, date: '2024-01-01', duration: 60},
        [{exerciseId: exercise.id, sets: 3, reps: 10, weight: 80}],
    );

    return exercise;
};

describe('createExercise', () => {

    it('createExercise_validInput_returnsSuccessWithPersistedExercise', async () => {
        // Arrange
        const input: CreateExerciseInput = {
            name: 'Deadlift',
            description: 'Posterior chain compound movement',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const result: ActionResult<Exercise> = await createExercise(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: expect.any(String),
                name: 'Deadlift',
                description: 'Posterior chain compound movement',
                muscleGroup: MuscleGroup.BACK,
                equipmentNeeded: Equipment.BARBELL,
                isActive: true,
            }),
        });
        const fetched = await exerciseService.getExercise((result as { success: true; data: Exercise }).data.id);
        expect(fetched).toMatchObject({name: 'Deadlift', isActive: true});
    });

    it('createExercise_duplicateName_returnsFailureWithConflictMessage', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press'});
        const input: CreateExerciseInput = {
            name: 'Bench Press',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        };

        // Act
        const result: ActionResult<Exercise> = await createExercise(input);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await exerciseService.listExercises();
        expect(list.total).toBe(1);
    });

    it('createExercise_secondExerciseWithUniqueName_returnsBothSuccessResultsAndPersistsTwoRows', async () => {
        // Arrange
        const firstInput: CreateExerciseInput = {
            name: 'Bulgarian Split Squats',
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
        const firstResult: ActionResult<Exercise> = await createExercise(firstInput);
        const secondResult: ActionResult<Exercise> = await createExercise(secondInput);

        // Assert
        expect(firstResult).toEqual({success: true, data: expect.objectContaining({name: 'Bulgarian Split Squats'})});
        expect(secondResult).toEqual({success: true, data: expect.objectContaining({name: 'Leg Press'})});
        expect((firstResult as { success: true; data: Exercise }).data.id).not.toBe(
            (secondResult as { success: true; data: Exercise }).data.id,
        );
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(2);
    });

    it('createExercise_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {} as unknown as CreateExerciseInput;

        // Act
        const result: ActionResult<Exercise> = await createExercise(input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                name: expect.anything(),
                muscleGroup: expect.anything(),
                equipmentNeeded: expect.anything(),
            }),
        });
        const list = await exerciseService.listExercises();
        expect(list.total).toBe(0);
    });

});

describe('getExercise', () => {

    it('getExercise_existingId_returnsSuccessWithMatchingExercise', async () => {
        // Arrange
        const seeded = await seedExercise({
            name: 'Cable Fly',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.CABLE,
        });

        // Act
        const result: ActionResult<Exercise> = await getExercise(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                name: 'Cable Fly',
                muscleGroup: MuscleGroup.CHEST,
                isActive: true,
            }),
        });
    });

    it('getExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<Exercise> = await getExercise(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listExercises', () => {

    it('listExercises_defaultOptions_returnsSuccessWithActiveExercisesOnly', async () => {
        // Arrange
        await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        await seedExercise({name: 'Leg Press', muscleGroup: MuscleGroup.LEGS, isActive: false});

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises();

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 2,
                items: expect.arrayContaining([
                    expect.objectContaining({name: 'Back Squat', isActive: true}),
                    expect.objectContaining({name: 'Bench Press', isActive: true}),
                ]),
            }),
        });
    });

    it('listExercises_includeInactiveTrue_returnsSuccessWithAllRows', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        await seedExercise({name: 'Leg Press', muscleGroup: MuscleGroup.LEGS, isActive: false});
        const options: ExerciseListOptions = {includeInactive: true};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items).toHaveLength(2);
        expect(data.items.some(e => !e.isActive)).toBe(true);
    });

    it('listExercises_muscleGroupFilter_returnsSuccessWithOnlyRowsMatchingThatMuscleGroup', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Cable Row', muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.CABLE});
        const options: ExerciseListOptions = {muscleGroup: MuscleGroup.BACK};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items).toHaveLength(2);
        expect(data.items.every(e => e.muscleGroup === MuscleGroup.BACK)).toBe(true);
    });

    it('listExercises_searchTerm_returnsSuccessWithRowsWhoseNameContainsTermCaseInsensitively', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({
            name: 'Incline Press',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL
        });
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.BARBELL});
        const options: ExerciseListOptions = {search: 'PRESS'};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('listExercises_searchAndMuscleGroup_returnsSuccessWithRowsMatchingBothFilters', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({
            name: 'Incline Press',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL
        });
        await seedExercise({
            name: 'Shoulder Press',
            muscleGroup: MuscleGroup.SHOULDERS,
            equipmentNeeded: Equipment.BARBELL
        });
        const options: ExerciseListOptions = {search: 'press', muscleGroup: MuscleGroup.CHEST};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items.every(e => e.muscleGroup === MuscleGroup.CHEST)).toBe(true);
        expect(data.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
    });

    it('listExercises_pagination_returnsCorrectSliceAndReportsFullTotalFromDatabase', async () => {
        // Arrange
        await seedExercise({name: 'Exercise A', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Exercise B', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Exercise C', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        const firstOptions: ExerciseListOptions = {page: 1, pageSize: 2};
        const secondOptions: ExerciseListOptions = {page: 2, pageSize: 2};

        // Act
        const firstPageResult: ActionResult<PageResult<Exercise>> = await listExercises(firstOptions);
        const secondPageResult: ActionResult<PageResult<Exercise>> = await listExercises(secondOptions);

        // Assert
        const firstData = (firstPageResult as { success: true; data: PageResult<Exercise> }).data;
        const secondData = (secondPageResult as { success: true; data: PageResult<Exercise> }).data;
        expect(firstPageResult).toEqual({success: true, data: expect.objectContaining({total: 3})});
        expect(firstData.items).toHaveLength(2);
        expect(secondPageResult).toEqual({success: true, data: expect.objectContaining({total: 3})});
        expect(secondData.items).toHaveLength(1);
        const firstPageIds = firstData.items.map(e => e.id);
        secondData.items.forEach(e => expect(firstPageIds).not.toContain(e.id));
    });

    it('listExercises_includeInactiveWithMuscleGroupFilter_returnsSuccessWithMatchingRows', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        await seedExercise({name: 'Cable Fly', muscleGroup: MuscleGroup.CHEST, isActive: false});
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const options: ExerciseListOptions = {includeInactive: true, muscleGroup: MuscleGroup.CHEST};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 2,
                items: expect.arrayContaining([
                    expect.objectContaining({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, isActive: true}),
                    expect.objectContaining({name: 'Cable Fly', muscleGroup: MuscleGroup.CHEST, isActive: false}),
                ]),
            }),
        });
    });

    it('listExercises_includeInactiveWithSearchFilter_returnsSuccessWithMatchingRowsRegardlessOfActiveStatus', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({
            name: 'Incline Press',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.DUMBBELL,
            isActive: false
        });
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.BARBELL});
        const options: ExerciseListOptions = {includeInactive: true, search: 'press'};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items).toHaveLength(2);
        expect(data.items.every(e => e.name.toLowerCase().includes('press'))).toBe(true);
        expect(data.items.some(e => !e.isActive)).toBe(true);
    });

    it('listExercises_pageSizeExceedsTotalRowCount_returnsSuccessWithAllRowsInSinglePage', async () => {
        // Arrange
        await seedExercise({name: 'Squat', muscleGroup: MuscleGroup.LEGS, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        const options: ExerciseListOptions = {page: 1, pageSize: 100};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<Exercise> }).data;
        expect(data.items).toHaveLength(2);
    });

    it('listExercises_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipmentNeeded: Equipment.BARBELL});
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK, equipmentNeeded: Equipment.BARBELL});
        const options: ExerciseListOptions = {search: 'Bench%'};

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

    it('listExercises_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        // Arrange
        // (no seeding — database is empty after beforeEach)

        // Act
        const result: ActionResult<PageResult<Exercise>> = await listExercises();

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('updateExercise', () => {

    it('updateExercise_validPartialInput_returnsSuccessWithUpdatedFields', async () => {
        // Arrange
        const seeded = await seedExercise({
            name: 'Back Squat',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {name: 'Barbell Back Squat', description: 'Updated description'};

        // Act
        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                name: 'Barbell Back Squat',
                description: 'Updated description',
                muscleGroup: MuscleGroup.LEGS,
            }),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched).toMatchObject({
            name: 'Barbell Back Squat',
            description: 'Updated description',
            muscleGroup: MuscleGroup.LEGS,
        });
    });

    it('updateExercise_partialInput_doesNotOverwriteUnspecifiedFields', async () => {
        // Arrange
        const seeded = await seedExercise({
            name: 'Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {name: 'Barbell Back Squat'};

        // Act
        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({name: 'Barbell Back Squat'}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.description).toBe('Original description');
        expect(fetched.muscleGroup).toBe(MuscleGroup.LEGS);
        expect(fetched.equipmentNeeded).toBe(Equipment.BARBELL);
    });

    it('updateExercise_sameNameAsSelf_returnsSuccessAndUpdatesOtherFields', async () => {
        // Arrange
        const seeded = await seedExercise({name: 'Bench Press'});
        const data: UpdateExerciseInput = {name: 'Bench Press', description: 'New description'};

        // Act
        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({name: 'Bench Press', description: 'New description'}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched).toMatchObject({name: 'Bench Press', description: 'New description'});
    });

    it('updateExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const data: UpdateExerciseInput = {name: 'Ghost Exercise'};

        // Act
        const result: ActionResult<Exercise> = await updateExercise('00000000-0000-0000-0000-000000000000', data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateExercise_nameTakenByAnotherExercise_returnsFailureWithConflictMessage', async () => {
        // Arrange
        await seedExercise({name: 'Bench Press'});
        const seededSquat = await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        const data: UpdateExerciseInput = {name: 'Bench Press'};

        // Act
        const result: ActionResult<Exercise> = await updateExercise(seededSquat.id, data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await exerciseService.getExercise(seededSquat.id);
        expect(fetched.name).toBe('Back Squat');
    });

    it('updateExercise_invalidFieldType_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {name: 123} as unknown as UpdateExerciseInput;

        // Act
        const result: ActionResult<Exercise> = await updateExercise('00000000-0000-0000-0000-000000000000', input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({name: expect.anything()}),
        });
    });

    it('updateExercise_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        // Arrange
        const seeded = await seedExercise({
            name: 'Back Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {};

        // Act
        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                name: 'Back Squat',
                description: 'Original description',
                muscleGroup: MuscleGroup.LEGS,
                equipmentNeeded: Equipment.BARBELL,
            }),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched).toMatchObject({
            name: 'Back Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
    });

});

describe('archiveExercise', () => {

    it('archiveExercise_activeExercise_returnsSuccessWithIsActiveFalse', async () => {
        // Arrange
        const seeded = await seedExercise();

        // Act
        const result: ActionResult<Exercise> = await archiveExercise(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: false}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.isActive).toBe(false);
    });

    it('archiveExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<Exercise> = await archiveExercise(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('unarchiveExercise', () => {

    it('unarchiveExercise_archivedExercise_returnsSuccessWithIsActiveTrue', async () => {
        // Arrange
        const seeded = await seedExercise({isActive: false});

        // Act
        const result: ActionResult<Exercise> = await unarchiveExercise(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: true}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.isActive).toBe(true);
    });

    it('unarchiveExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<Exercise> = await unarchiveExercise(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('deleteExercise', () => {

    it('deleteExercise_unreferencedExercise_returnsSuccessAndExerciseNoLongerExists', async () => {
        // Arrange
        const seeded = await seedExercise();

        // Act
        const result: ActionResult<void> = await deleteExercise(seeded.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(0);
    });

    it('deleteExercise_oneOfManyExercises_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        // Arrange
        const seededBenchPress = await seedExercise({name: 'Bench Press'});
        const seededDeadlift = await seedExercise({
            name: 'Deadlift',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        });

        // Act
        const result: ActionResult<void> = await deleteExercise(seededBenchPress.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(seededDeadlift.id);
    });

    it('deleteExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<void> = await deleteExercise(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteExercise_exerciseReferencedByWorkoutSession_returnsFailureAndExerciseStillExists', async () => {
        // Arrange
        const seeded = await seedReferencedExercise({name: 'Bench Press'});

        // Act
        const result: ActionResult<void> = await deleteExercise(seeded.id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.id).toBe(seeded.id);
    });

    it('deleteExercise_afterConflictOnReferencedRow_subsequentDeleteOnUnreferencedRowSucceeds', async () => {
        // Arrange
        const benchPress = await seedReferencedExercise({name: 'Bench Press'});
        const deadlift = await seedExercise({
            name: 'Deadlift',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        });

        // Act
        const conflictResult: ActionResult<void> = await deleteExercise(benchPress.id);
        const successResult: ActionResult<void> = await deleteExercise(deadlift.id);

        // Assert
        expect(conflictResult).toEqual({success: false, message: expect.any(String)});
        expect(successResult).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(benchPress.id);
    });

});