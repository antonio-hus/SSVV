import {prisma} from '@/lib/database';
import {exerciseRepository, userRepository, workoutSessionRepository, workoutSessionService} from '@/lib/di';
import {NotFoundError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {Equipment, MuscleGroup} from '@/lib/domain/exercise';
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {CreateMemberInput} from '@/lib/schema/user-schema';
import {WorkoutSessionListOptions} from '@/lib/domain/workout-session';

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
    return userRepository.createMember({
        email: overrides.email ?? 'member@test.com',
        fullName: overrides.fullName ?? 'Test Member',
        phone: overrides.phone ?? '0700000000',
        dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
        password: overrides.password ?? 'Secret123!',
        membershipStart: overrides.membershipStart ?? '2024-01-01',
    });
};

const seedExercise = async (name = 'Bench Press') => {
    return exerciseRepository.create({
        name,
        description: `${name} description`,
        muscleGroup: MuscleGroup.CHEST,
        equipmentNeeded: Equipment.BARBELL,
    });
};

const seedWorkoutSession = async (
    memberId: string,
    exerciseIds: string[],
    overrides: { date?: string; duration?: number; notes?: string } = {},
) => {
    return workoutSessionRepository.create(
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

    it('createWorkoutSession_newSessionWithOneExercise_returnsPersistedSessionAndCreatesWseRow', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
            notes: 'Test session',
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result = await workoutSessionService.createWorkoutSession(inputData, inputExercises);

        expect(result.id).toBeDefined();
        expect(result.memberId).toBe(seededMember.id);
        expect(result.duration).toBe(60);
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].exerciseId).toBe(seededExercise.id);

        const sessionInRepository = await workoutSessionRepository.findById(result.id);
        expect(sessionInRepository).toBeDefined();
        expect(sessionInRepository.exercises).toHaveLength(1);
        expect(sessionInRepository.exercises[0].sets).toBe(3);
    });

    it('createWorkoutSession_newSessionWithMultipleExercises_createsOneWseRowPerExercise', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise('Bench Press');
        const exercise2 = await seedExercise('Deadlift');
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 45,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: exercise2.id, sets: 4, reps: 8, weight: 80},
        ];

        const result = await workoutSessionService.createWorkoutSession(inputData, inputExercises);

        expect(result.exercises).toHaveLength(2);
        const sessionInRepository = await workoutSessionRepository.findById(result.id);
        expect(sessionInRepository.exercises).toHaveLength(2);
    });

    it('createWorkoutSession_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        const seededMember = await seedMember();
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
        };

        const action = () => workoutSessionService.createWorkoutSession(inputData, []);

        await expect(action()).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        const { total: sessionCount } = await workoutSessionRepository.findAll();
        expect(sessionCount).toBe(0);
    });

    it('createWorkoutSession_memberNotFound_throwsNotFoundError', async () => {
        const seededExercise = await seedExercise();
        const inputData: CreateWorkoutSessionInput = {
            memberId: '00000000-0000-0000-0000-000000000000',
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const action = () => workoutSessionService.createWorkoutSession(inputData, inputExercises);

        await expect(action()).rejects.toThrow(NotFoundError);
        const { total: sessionCount } = await workoutSessionRepository.findAll();
        expect(sessionCount).toBe(0);
    });

    it('createWorkoutSession_afterNotFoundError_subsequentValidCallSucceeds', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await workoutSessionService.createWorkoutSession(
            {memberId: '00000000-0000-0000-0000-000000000000', date: '2024-06-01', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        ).catch(() => {
        });
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result = await workoutSessionService.createWorkoutSession(inputData, inputExercises);

        expect(result.memberId).toBe(seededMember.id);
        const { total: sessionCount } = await workoutSessionRepository.findAll();
        expect(sessionCount).toBe(1);
    });

});

describe('getWorkoutSession', () => {

    it('getWorkoutSession_existingSession_returnsSessionWithAllFieldsAndExercisesMatching', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Rest day',
        });
        const inputId: string = seededSession.id;

        const result = await workoutSessionService.getWorkoutSession(inputId);

        expect(result.id).toBe(seededSession.id);
        expect(result.memberId).toBe(seededMember.id);
        expect(result.duration).toBe(60);
        expect(result.notes).toBe('Rest day');
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].exerciseId).toBe(seededExercise.id);
    });

    it('getWorkoutSession_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => workoutSessionService.getWorkoutSession(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('listMemberWorkoutSessions', () => {

    it('listMemberWorkoutSessions_noOptions_returnsAllSessionsForMemberOrderedByDateAsc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-01-01'));
        expect(result.items[1].date).toEqual(new Date('2024-03-01'));
        expect(result.items[2].date).toEqual(new Date('2024-06-01'));
    });

    it('listMemberWorkoutSessions_noSessions_returnsEmptyPage', async () => {
        const seededMember = await seedMember();

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('listMemberWorkoutSessions_otherMemberSessionsExist_returnsOnlySessionsForSpecifiedMember', async () => {
        const member1 = await seedMember({email: 'm1@test.com', fullName: 'M1'});
        const member2 = await seedMember({email: 'm2@test.com', fullName: 'M2'});
        const seededExercise = await seedExercise();
        const session1 = await seedWorkoutSession(member1.id, [seededExercise.id]);
        await seedWorkoutSession(member2.id, [seededExercise.id]);

        const result = await workoutSessionService.listMemberWorkoutSessions(member1.id);

        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(session1.id);
    });

    it('listMemberWorkoutSessions_startDateFilter_returnsOnlySessionsOnOrAfterStartDate', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const laterSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});
        const inputOptions: WorkoutSessionListOptions = {startDate: new Date('2024-03-01')};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(laterSession.id);
    });

    it('listMemberWorkoutSessions_endDateFilter_returnsOnlySessionsOnOrBeforeEndDate', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const earlySession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});
        const inputOptions: WorkoutSessionListOptions = {endDate: new Date('2024-03-01')};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(earlySession.id);
    });

    it('listMemberWorkoutSessions_startDateAndEndDate_returnsOnlySessionsWithinRange', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const midSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-04-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-08-01'});
        const inputOptions: WorkoutSessionListOptions = {
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-06-01'),
        };

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(midSession.id);
    });

    it('listMemberWorkoutSessions_pageAndPageSize_returnsPaginatedSliceOrderedByDateDesc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        for (let month = 1; month <= 5; month++) {
            await seedWorkoutSession(seededMember.id, [seededExercise.id], {
                date: `2024-0${month}-01`,
            });
        }
        const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 2};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
        expect(result.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('listMemberWorkoutSessions_pageZeroWithPageSize_clampedToPageOneReturnsFirstSliceDesc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        const inputOptions: WorkoutSessionListOptions = {page: 0, pageSize: 2};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
        expect(result.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('listMemberWorkoutSessions_pageSizeExceedsTotalWithPage_returnsAllRowsDesc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 100};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
    });

    it('listMemberWorkoutSessions_onlyPageWithoutPageSize_notPaginatedReturnsAllSessionsAsc', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        const inputOptions: WorkoutSessionListOptions = {page: 2};

        const result = await workoutSessionService.listMemberWorkoutSessions(seededMember.id, inputOptions);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-01-01'));
        expect(result.items[1].date).toEqual(new Date('2024-02-01'));
    });

});

describe('updateWorkoutSession', () => {

    it('updateWorkoutSession_allFields_returnsUpdatedSessionAndPersistsAllChanges', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {date: '2025-01-15', duration: 90, notes: 'Updated'};

        const result = await workoutSessionService.updateWorkoutSession(inputId, inputData);

        expect(result.date).toEqual(new Date('2025-01-15'));
        expect(result.duration).toBe(90);
        expect(result.notes).toBe('Updated');

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.date).toEqual(new Date('2025-01-15'));
        expect(sessionInRepository.duration).toBe(90);
        expect(sessionInRepository.notes).toBe('Updated');
    });

    it('updateWorkoutSession_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputData: UpdateWorkoutSessionInput = {duration: 90};

        const action = () => workoutSessionService.updateWorkoutSession(inputId, inputData);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateWorkoutSession_partialInput_onlyDurationChangedOtherFieldsUntouched', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};

        const result = await workoutSessionService.updateWorkoutSession(inputId, inputData);

        expect(result.duration).toBe(90);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.duration).toBe(90);
        expect(sessionInRepository.date).toEqual(new Date('2024-06-01'));
        expect(sessionInRepository.notes).toBe('Original');
    });

    it('updateWorkoutSession_emptyInput_noFieldsMutated', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {};

        const result = await workoutSessionService.updateWorkoutSession(inputId, inputData);

        expect(result.date).toEqual(new Date('2024-06-01'));
        expect(result.duration).toBe(60);
        expect(result.notes).toBe('Original');

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.date).toEqual(new Date('2024-06-01'));
        expect(sessionInRepository.duration).toBe(60);
        expect(sessionInRepository.notes).toBe('Original');
    });

    it('updateWorkoutSession_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const sessionA = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-01-01',
            duration: 60
        });
        const sessionB = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-02-01',
            duration: 45
        });
        await workoutSessionService.updateWorkoutSession('00000000-0000-0000-0000-000000000000', {duration: 90}).catch(() => {
        });
        const inputId: string = sessionB.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};

        const result = await workoutSessionService.updateWorkoutSession(inputId, inputData);

        expect(result.duration).toBe(90);

        const sessionAInRepository = await workoutSessionRepository.findById(sessionA.id);
        const sessionBInRepository = await workoutSessionRepository.findById(sessionB.id);
        expect(sessionAInRepository.duration).toBe(60);
        expect(sessionBInRepository.duration).toBe(90);
    });

});

describe('updateWorkoutSessionWithExercises', () => {

    it('updateWorkoutSessionWithExercises_sessionFieldsAndExistingExercise_updatesSessionAndWseRow', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {duration: 60});
        const wse1 = seededSession.exercises;
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1[0].id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        expect(result.duration).toBe(90);
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].sets).toBe(5);
        expect(result.exercises[0].reps).toBe(8);
        expect(result.exercises[0].weight).toBe(100);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        const wseInRepository = sessionInRepository.exercises.find(e => e.id === wse1[0].id);
        expect(sessionInRepository.duration).toBe(90);
        expect(wseInRepository).toBeDefined();
        expect(wseInRepository!.sets).toBe(5);
        expect(wseInRepository!.reps).toBe(8);
        expect(wseInRepository!.weight).toBe(100);
    });

    it('updateWorkoutSessionWithExercises_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const inputId: string = seededSession.id;

        const action = () => workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, []);

        await expect(action()).rejects.toThrow(WorkoutSessionRequiresExercisesError);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.duration).toBe(60);
        expect(sessionInRepository.exercises).toHaveLength(1);
    });

    it('updateWorkoutSessionWithExercises_nonExistentSession_throwsNotFoundError', async () => {
        const seededExercise = await seedExercise();
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const action = () => workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateWorkoutSessionWithExercises_exerciseOmittedFromInput_deletesItsWseRow', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise('Bench Press');
        const exercise2 = await seedExercise('Deadlift');
        const seededSession = await seedWorkoutSession(seededMember.id, [exercise1.id, exercise2.id]);
        const wse1 = seededSession.exercises.find(e => e.exerciseId === exercise1.id)!;
        const wse2 = seededSession.exercises.find(e => e.exerciseId === exercise2.id)!;
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].id).toBe(wse1.id);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        const wse2InRepository = sessionInRepository.exercises.find(e => e.id === wse2.id);
        expect(wse2InRepository).toBeUndefined();
    });

    it('updateWorkoutSessionWithExercises_exerciseWithIdInInput_updatesItsWseFields', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const wse1 = seededSession.exercises;
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1[0].id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        expect(result.exercises[0].sets).toBe(5);
        expect(result.exercises[0].reps).toBe(8);
        expect(result.exercises[0].weight).toBe(100);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        const wse1InRepository = sessionInRepository.exercises.find(e => e.id === wse1[0].id);
        expect(wse1InRepository).toBeDefined();
        expect(wse1InRepository!.sets).toBe(5);
        expect(wse1InRepository!.reps).toBe(8);
        expect(wse1InRepository!.weight).toBe(100);
    });

    it('updateWorkoutSessionWithExercises_exerciseWithoutIdInInput_createsNewWseRow', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise('Bench Press');
        const exercise2 = await seedExercise('Deadlift');
        const seededSession = await seedWorkoutSession(seededMember.id, [exercise1.id]);
        const wse1 = seededSession.exercises;
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1[0].id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: exercise2.id, sets: 2, reps: 15, weight: 20},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        expect(result.exercises).toHaveLength(2);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.exercises).toHaveLength(2);
    });

    it('updateWorkoutSessionWithExercises_mixKeepDeleteAdd_reconcileAllThreeBranchesCorrectly', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise('Bench Press');
        const exercise2 = await seedExercise('Deadlift');
        const exercise3 = await seedExercise('Squat');
        const seededSession = await seedWorkoutSession(seededMember.id, [exercise1.id, exercise2.id]);
        const wse1 = seededSession.exercises.find(e => e.exerciseId === exercise1.id)!;
        const wse2 = seededSession.exercises.find(e => e.exerciseId === exercise2.id)!;
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60},
            {exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        expect(result.exercises).toHaveLength(2);
        expect(result.exercises.find(e => e.id === wse1.id)?.sets).toBe(4);
        expect(result.exercises.find(e => e.id === wse2.id)).toBeUndefined();
        expect(result.exercises.find(e => e.exerciseId === exercise3.id)).toBeDefined();

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        const wse1InRepository = sessionInRepository.exercises.find(e => e.id === wse1.id);
        const wse2InRepository = sessionInRepository.exercises.find(e => e.id === wse2.id);

        expect(wse1InRepository).toBeDefined();
        expect(wse1InRepository!.sets).toBe(4);
        expect(wse2InRepository).toBeUndefined();
        expect(sessionInRepository.exercises).toHaveLength(2);
    });

    it('updateWorkoutSessionWithExercises_afterRequiresExercisesError_subsequentValidCallSucceeds', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const wse1 = seededSession.exercises;
        const inputId: string = seededSession.id;
        await workoutSessionService.updateWorkoutSessionWithExercises(inputId, {}, []).catch(() => {
        });
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1[0].id, exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];

        const result = await workoutSessionService.updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        expect(result.duration).toBe(90);

        const sessionInRepository = await workoutSessionRepository.findById(inputId);
        expect(sessionInRepository.duration).toBe(90);
    });

});

describe('deleteWorkoutSession', () => {

    it('deleteWorkoutSession_existingSession_removesSessionAndItsWseRowsViaCascade', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const inputId: string = seededSession.id;

        await workoutSessionService.deleteWorkoutSession(inputId);

        await expect(workoutSessionRepository.findById(inputId)).rejects.toThrow(NotFoundError);
    });

    it('deleteWorkoutSession_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => workoutSessionService.deleteWorkoutSession(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('deleteWorkoutSession_sessionWithMultipleWseRows_cascadesAllWseRowsDeletion', async () => {
        const seededMember = await seedMember();
        const exercise1 = await seedExercise('Bench Press');
        const exercise2 = await seedExercise('Deadlift');
        const seededSession = await seedWorkoutSession(seededMember.id, [exercise1.id, exercise2.id]);
        const inputId: string = seededSession.id;

        await workoutSessionService.deleteWorkoutSession(inputId);

        await expect(workoutSessionRepository.findById(inputId)).rejects.toThrow(NotFoundError);
    });

    it('deleteWorkoutSession_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const sessionA = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const sessionB = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await workoutSessionService.deleteWorkoutSession('00000000-0000-0000-0000-000000000000').catch(() => {
        });
        const inputId: string = sessionB.id;

        await workoutSessionService.deleteWorkoutSession(inputId);

        const sessionAInRepository = await workoutSessionRepository.findById(sessionA.id);
        expect(sessionAInRepository).toBeDefined();
        await expect(workoutSessionRepository.findById(sessionB.id)).rejects.toThrow(NotFoundError);
    });

});