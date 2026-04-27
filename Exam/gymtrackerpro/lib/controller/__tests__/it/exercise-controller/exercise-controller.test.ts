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
        const input: CreateExerciseInput = {
            name: 'Deadlift',
            description: 'Posterior chain compound movement',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        };

        const result: ActionResult<Exercise> = await createExercise(input);

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
        await seedExercise({name: 'Bench Press'});
        const input: CreateExerciseInput = {
            name: 'Bench Press',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        };

        const result: ActionResult<Exercise> = await createExercise(input);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await exerciseService.listExercises();
        expect(list.total).toBe(1);
    });

    it('createExercise_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        const input = {} as unknown as CreateExerciseInput;

        const result: ActionResult<Exercise> = await createExercise(input);

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
        const seeded = await seedExercise({
            name: 'Cable Fly',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.CABLE
        });

        const result: ActionResult<Exercise> = await getExercise(seeded.id);

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
        const result: ActionResult<Exercise> = await getExercise('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listExercises', () => {

    it('listExercises_defaultOptions_returnsSuccessWithActiveExercisesOnly', async () => {
        await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        await seedExercise({name: 'Leg Press', muscleGroup: MuscleGroup.LEGS, isActive: false});

        const result: ActionResult<PageResult<Exercise>> = await listExercises();

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

    it('listExercises_includeInactiveWithMuscleGroupFilter_returnsSuccessWithMatchingRows', async () => {
        await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        await seedExercise({name: 'Cable Fly', muscleGroup: MuscleGroup.CHEST, isActive: false});
        await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const options: ExerciseListOptions = {includeInactive: true, muscleGroup: MuscleGroup.CHEST};

        const result: ActionResult<PageResult<Exercise>> = await listExercises(options);

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

    it('listExercises_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        const result: ActionResult<PageResult<Exercise>> = await listExercises();

        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('updateExercise', () => {

    it('updateExercise_validPartialInput_returnsSuccessWithUpdatedFields', async () => {
        const seeded = await seedExercise({
            name: 'Back Squat',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL
        });
        const data: UpdateExerciseInput = {name: 'Barbell Back Squat', description: 'Updated description'};

        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

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
            muscleGroup: MuscleGroup.LEGS
        });
    });

    it('updateExercise_sameNameAsSelf_returnsSuccessAndUpdatesOtherFields', async () => {
        const seeded = await seedExercise({name: 'Bench Press'});
        const data: UpdateExerciseInput = {name: 'Bench Press', description: 'New description'};

        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({name: 'Bench Press', description: 'New description'}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched).toMatchObject({name: 'Bench Press', description: 'New description'});
    });

    it('updateExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const data: UpdateExerciseInput = {name: 'Ghost Exercise'};

        const result: ActionResult<Exercise> = await updateExercise('00000000-0000-0000-0000-000000000000', data);

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateExercise_nameTakenByAnotherExercise_returnsFailureWithConflictMessage', async () => {
        await seedExercise({name: 'Bench Press'});
        const seededSquat = await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        const data: UpdateExerciseInput = {name: 'Bench Press'};

        const result: ActionResult<Exercise> = await updateExercise(seededSquat.id, data);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await exerciseService.getExercise(seededSquat.id);
        expect(fetched.name).toBe('Back Squat');
    });

    it('updateExercise_invalidFieldType_returnsValidationFailureWithFieldErrors', async () => {
        const input = {name: 123} as unknown as UpdateExerciseInput;

        const result: ActionResult<Exercise> = await updateExercise('00000000-0000-0000-0000-000000000000', input);

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({name: expect.anything()}),
        });
    });

    it('updateExercise_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        const seeded = await seedExercise({
            name: 'Back Squat',
            description: 'Original description',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        const data: UpdateExerciseInput = {};

        const result: ActionResult<Exercise> = await updateExercise(seeded.id, data);

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
        const seeded = await seedExercise();

        const result: ActionResult<Exercise> = await archiveExercise(seeded.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: false}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.isActive).toBe(false);
    });

    it('archiveExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<Exercise> = await archiveExercise('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('unarchiveExercise', () => {

    it('unarchiveExercise_archivedExercise_returnsSuccessWithIsActiveTrue', async () => {
        const seeded = await seedExercise({isActive: false});

        const result: ActionResult<Exercise> = await unarchiveExercise(seeded.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: true}),
        });
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.isActive).toBe(true);
    });

    it('unarchiveExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<Exercise> = await unarchiveExercise('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('deleteExercise', () => {

    it('deleteExercise_unreferencedExercise_returnsSuccessAndExerciseNoLongerExists', async () => {
        const seeded = await seedExercise();

        const result: ActionResult<void> = await deleteExercise(seeded.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(0);
    });

    it('deleteExercise_oneOfManyExercises_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        const seededBenchPress = await seedExercise({name: 'Bench Press'});
        const seededDeadlift = await seedExercise({
            name: 'Deadlift',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });

        const result: ActionResult<void> = await deleteExercise(seededBenchPress.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(seededDeadlift.id);
    });

    it('deleteExercise_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<void> = await deleteExercise('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteExercise_exerciseReferencedByWorkoutSession_returnsFailureAndExerciseStillExists', async () => {
        const seeded = await seedReferencedExercise({name: 'Bench Press'});

        const result: ActionResult<void> = await deleteExercise(seeded.id);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await exerciseService.getExercise(seeded.id);
        expect(fetched.id).toBe(seeded.id);
    });

    it('deleteExercise_afterConflictOnReferencedRow_subsequentDeleteOnUnreferencedRowSucceeds', async () => {
        const benchPress = await seedReferencedExercise({name: 'Bench Press'});
        const deadlift = await seedExercise({
            name: 'Deadlift',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL
        });

        const conflictResult: ActionResult<void> = await deleteExercise(benchPress.id);
        const successResult: ActionResult<void> = await deleteExercise(deadlift.id);

        expect(conflictResult).toEqual({success: false, message: expect.any(String)});
        expect(successResult).toEqual({success: true, data: undefined});
        const list = await exerciseService.listExercises({includeInactive: true});
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(benchPress.id);
    });

});