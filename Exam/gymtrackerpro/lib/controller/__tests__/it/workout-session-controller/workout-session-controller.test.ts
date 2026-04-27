import {prisma} from '@/lib/database';
import {exerciseService, userService, workoutSessionService} from '@/lib/di';
import {
    createWorkoutSession,
    getWorkoutSession,
    listMemberWorkoutSessions,
    updateWorkoutSession,
    updateWorkoutSessionWithExercises,
    deleteWorkoutSession,
} from '@/lib/controller/workout-session-controller';
import {MuscleGroup, Equipment} from '@/prisma/generated/prisma/client';
import {ActionResult} from '@/lib/domain/action-result';
import {WorkoutSession, WorkoutSessionListOptions, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {PageResult} from '@/lib/domain/pagination';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {CreateMemberInput} from '@/lib/schema/user-schema';
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

const seedMember = async (overrides: Partial<CreateMemberInput> = {}) => {
    return userService.createMember({
        email: overrides.email ?? 'member@gym.test',
        fullName: overrides.fullName ?? 'Test Member',
        phone: overrides.phone ?? '+40700000000',
        dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
        password: overrides.password ?? 'ValidPass123!',
        membershipStart: overrides.membershipStart ?? '2024-01-01',
    });
};

const seedExercise = async (overrides: Partial<CreateExerciseInput> = {}) => {
    return exerciseService.createExercise({
        name: overrides.name ?? 'Bench Press',
        description: overrides.description ?? 'Classic chest compound exercise',
        muscleGroup: overrides.muscleGroup ?? MuscleGroup.CHEST,
        equipmentNeeded: overrides.equipmentNeeded ?? Equipment.BARBELL,
    });
};

const seedWorkoutSession = async (
    memberId: string,
    exerciseIds: string[],
    overrides: { date?: string; duration?: number; notes?: string } = {},
) => {
    return workoutSessionService.createWorkoutSession(
        {
            memberId,
            date: overrides.date ?? '2024-06-01',
            duration: overrides.duration ?? 60,
            notes: overrides.notes,
        },
        exerciseIds.map(exerciseId => ({exerciseId, sets: 3, reps: 10, weight: 50})),
    );
};

describe('createWorkoutSession', () => {

    it('createWorkoutSession_validSessionAndOneExercise_returnsSuccessWithPersistedSessionAndExercises', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const data: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
            notes: 'Test session',
        };
        const exercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(data, exercises);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: expect.any(String),
                memberId: seededMember.id,
                duration: 60,
                notes: 'Test session',
                exercises: expect.arrayContaining([
                    expect.objectContaining({exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(
            (result as { success: true; data: WorkoutSessionWithExercises }).data.id,
        );
        expect(fetched.exercises).toHaveLength(1);
    });

    it('createWorkoutSession_validSessionAndMultipleExercises_returnsSuccessWithAllExercises', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const data: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 45,
        };
        const exercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: exercise2.id, sets: 4, reps: 8, weight: 80},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(data, exercises);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({exerciseId: exercise1.id}),
                    expect.objectContaining({exerciseId: exercise2.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(
            (result as { success: true; data: WorkoutSessionWithExercises }).data.id,
        );
        expect(fetched.exercises).toHaveLength(2);
    });

    it('createWorkoutSession_emptyExercisesArray_returnsFailureWithRequiresExercisesMessage', async () => {
        const seededMember = await seedMember();
        const data: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
        };

        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(data, []);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(0);
    });

    it('createWorkoutSession_invalidSessionData_returnsValidationFailureWithFieldErrors', async () => {
        const input = {} as unknown as CreateWorkoutSessionInput;

        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(input, []);

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                memberId: expect.anything(),
                date: expect.anything(),
                duration: expect.anything(),
            }),
        });
    });

    it('createWorkoutSession_memberNotFound_returnsFailureWithNotFoundMessage', async () => {
        const seededExercise = await seedExercise();
        const data: CreateWorkoutSessionInput = {
            memberId: '00000000-0000-0000-0000-000000000000',
            date: '2024-06-01',
            duration: 60,
        };
        const exercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(data, exercises);

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('getWorkoutSession', () => {

    it('getWorkoutSession_existingSession_returnsSuccessWithMatchingSessionAndExercises', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Rest day',
        });

        const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(seededSession.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seededSession.id,
                memberId: seededMember.id,
                duration: 60,
                notes: 'Rest day',
                exercises: expect.arrayContaining([
                    expect.objectContaining({exerciseId: seededExercise.id}),
                ]),
            }),
        });
    });

    it('getWorkoutSession_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listMemberWorkoutSessions', () => {

    it('listMemberWorkoutSessions_defaultOptions_returnsSuccessWithAllSessionsOrderedByDateAsc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});

        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(seededMember.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 3,
                items: expect.arrayContaining([
                    expect.objectContaining({date: new Date('2024-01-01')}),
                    expect.objectContaining({date: new Date('2024-03-01')}),
                    expect.objectContaining({date: new Date('2024-06-01')}),
                ]),
            }),
        });
    });

    it('listMemberWorkoutSessions_noSessions_returnsSuccessWithEmptyPage', async () => {
        const seededMember = await seedMember();

        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(seededMember.id);

        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

    it('listMemberWorkoutSessions_startDateFilter_returnsSuccessWithSessionsOnOrAfterStartDate', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const laterSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});
        const options: WorkoutSessionListOptions = {startDate: new Date('2024-03-01')};

        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(seededMember.id, options);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({id: laterSession.id}),
                ]),
            }),
        });
    });

});

describe('updateWorkoutSession', () => {

    it('updateWorkoutSession_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });
        const data: UpdateWorkoutSessionInput = {date: '2025-01-15', duration: 90, notes: 'Updated'};

        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(seededSession.id, data);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seededSession.id,
                date: new Date('2025-01-15'),
                duration: 90,
                notes: 'Updated',
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.date).toEqual(new Date('2025-01-15'));
        expect(fetched.duration).toBe(90);
        expect(fetched.notes).toBe('Updated');
    });

    it('updateWorkoutSession_partialInput_returnsSuccessAndLeavesUnspecifiedFieldsUnchanged', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });
        const data: UpdateWorkoutSessionInput = {duration: 90};

        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(seededSession.id, data);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({duration: 90, notes: 'Original'}),
        });
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.duration).toBe(90);
        expect(fetched.date).toEqual(new Date('2024-06-01'));
        expect(fetched.notes).toBe('Original');
    });

    it('updateWorkoutSession_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const data: UpdateWorkoutSessionInput = {duration: 90};

        const result: ActionResult<WorkoutSession> = await updateWorkoutSession('00000000-0000-0000-0000-000000000000', data);

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateWorkoutSession_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });

        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(seededSession.id, {});

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                date: new Date('2024-06-01'),
                duration: 60,
                notes: 'Original',
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.duration).toBe(60);
        expect(fetched.notes).toBe('Original');
    });

    it('updateWorkoutSession_invalidDateFormat_returnsValidationFailureWithFieldErrors', async () => {
        const input = {date: 'not-a-date'} as unknown as UpdateWorkoutSessionInput;

        const result: ActionResult<WorkoutSession> = await updateWorkoutSession('00000000-0000-0000-0000-000000000000', input);

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({date: expect.anything()}),
        });
    });

});

describe('updateWorkoutSessionWithExercises', () => {

    it('updateWorkoutSessionWithExercises_sessionFieldsAndUpdatedExercise_returnsSuccessWithReconciled', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {duration: 60});
        const wse1 = seededSession.exercises[0];
        const data: UpdateWorkoutSessionInput = {duration: 90};
        const exercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(seededSession.id, data, exercises);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                duration: 90,
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: wse1.id, sets: 5, reps: 8, weight: 100}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.duration).toBe(90);
        expect(fetched.exercises[0].sets).toBe(5);
    });

    it('updateWorkoutSessionWithExercises_emptyExercisesArray_returnsFailureWithRequiresExercisesMessage', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);

        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(seededSession.id, {}, []);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.exercises).toHaveLength(1);
    });

    it('updateWorkoutSessionWithExercises_nonExistentSession_returnsFailureWithNotFoundMessage', async () => {
        const seededExercise = await seedExercise();
        const exercises: WorkoutSessionExerciseUpdateInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(
            '00000000-0000-0000-0000-000000000000', {}, exercises,
        );

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateWorkoutSessionWithExercises_invalidSessionData_returnsValidationFailureWithFieldErrors', async () => {
        const input = {date: 'not-a-date'} as unknown as UpdateWorkoutSessionInput;

        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(
            '00000000-0000-0000-0000-000000000000', input, [],
        );

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({date: expect.anything()}),
        });
    });

    it('updateWorkoutSessionWithExercises_mixKeepDeleteAdd_returnsSuccessWithReconciledExercises', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const exercise3 = await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        const seededSession = await seedWorkoutSession(seededMember.id, [exercise1.id, exercise2.id]);
        const wse1 = seededSession.exercises.find(e => e.exerciseId === exercise1.id)!;
        const wse2 = seededSession.exercises.find(e => e.exerciseId === exercise2.id)!;
        const exercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60},
            {exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40},
        ];

        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(seededSession.id, {}, exercises);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: wse1.id, sets: 4}),
                    expect.objectContaining({exerciseId: exercise3.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(seededSession.id);
        expect(fetched.exercises).toHaveLength(2);
        expect(fetched.exercises.find(e => e.id === wse2.id)).toBeUndefined();
        expect(fetched.exercises.find(e => e.exerciseId === exercise3.id)).toBeDefined();
    });

});

describe('deleteWorkoutSession', () => {

    it('deleteWorkoutSession_existingSession_returnsSuccessAndSessionNoLongerExists', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);

        const result: ActionResult<void> = await deleteWorkoutSession(seededSession.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(0);
    });

    it('deleteWorkoutSession_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<void> = await deleteWorkoutSession('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteWorkoutSession_oneOfManySessions_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const sessionA = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const sessionB = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});

        const result: ActionResult<void> = await deleteWorkoutSession(sessionA.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(sessionB.id);
    });

});