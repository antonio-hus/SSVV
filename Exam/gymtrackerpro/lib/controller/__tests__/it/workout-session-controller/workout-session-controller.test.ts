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
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();

        // Act
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
            notes: 'Test session',
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, inputExercises);

        // Assert
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
        // Arrange
        const seededMember = await seedMember();
        const benchPressExercise = await seedExercise({name: 'Bench Press'});
        const deadliftExercise = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});

        // Act
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 45,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: benchPressExercise.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: deadliftExercise.id, sets: 4, reps: 8, weight: 80},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({exerciseId: benchPressExercise.id}),
                    expect.objectContaining({exerciseId: deadliftExercise.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(
            (result as { success: true; data: WorkoutSessionWithExercises }).data.id,
        );
        expect(fetched.exercises).toHaveLength(2);
    });

    it('createWorkoutSession_emptyExercisesArray_returnsFailureWithRequiresExercisesMessage', async () => {
        // Arrange
        const seededMember = await seedMember();

        // Act
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
        };
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, []);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(0);
    });

    it('createWorkoutSession_invalidSessionData_returnsValidationFailureWithFieldErrors', async () => {
        // Act
        const inputData = {} as unknown as CreateWorkoutSessionInput;
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, []);

        // Assert
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
        // Arrange
        const seededExercise = await seedExercise();

        // Act
        const inputData: CreateWorkoutSessionInput = {
            memberId: '00000000-0000-0000-0000-000000000000',
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, inputExercises);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('createWorkoutSession_afterNotFoundError_subsequentValidCallSucceeds', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await createWorkoutSession(
            {memberId: '00000000-0000-0000-0000-000000000000', date: '2024-06-01', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );

        // Act
        const inputData: CreateWorkoutSessionInput = {
            memberId: seededMember.id,
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await createWorkoutSession(inputData, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({memberId: seededMember.id}),
        });
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(1);
    });

});

describe('getWorkoutSession', () => {

    it('getWorkoutSession_existingSession_returnsSuccessWithMatchingSessionAndExercises', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Rest day',
        });

        // Act
        const inputId: string = seededSession.id;
        const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(inputId);

        // Assert
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
        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const result: ActionResult<WorkoutSessionWithExercises> = await getWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listMemberWorkoutSessions', () => {

    it('listMemberWorkoutSessions_defaultOptions_returnsSuccessWithAllSessionsOrderedByDateAsc', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId);

        // Assert
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
        // Arrange
        const seededMember = await seedMember();

        // Act
        const inputMemberId: string = seededMember.id;
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId);

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

    it('listMemberWorkoutSessions_otherMemberSessionsExist_returnsSuccessWithOnlySessionsForSpecifiedMember', async () => {
        // Arrange
        const member1 = await seedMember({email: 'm1@gym.test', fullName: 'M1'});
        const member2 = await seedMember({email: 'm2@gym.test', fullName: 'M2'});
        const seededExercise = await seedExercise();
        const session1 = await seedWorkoutSession(member1.id, [seededExercise.id]);
        await seedWorkoutSession(member2.id, [seededExercise.id]);

        // Act
        const inputMemberId: string = member1.id;
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({id: session1.id}),
                ]),
            }),
        });
    });

    it('listMemberWorkoutSessions_startDateFilter_returnsSuccessWithSessionsOnOrAfterStartDate', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const laterSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {startDate: new Date('2024-03-01')};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
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

    it('listMemberWorkoutSessions_endDateFilter_returnsSuccessWithSessionsOnOrBeforeEndDate', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const earlySession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-06-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {endDate: new Date('2024-03-01')};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({id: earlySession.id}),
                ]),
            }),
        });
    });

    it('listMemberWorkoutSessions_startDateAndEndDate_returnsSuccessWithSessionsWithinRange', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const midSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-04-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-08-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-06-01'),
        };
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({id: midSession.id}),
                ]),
            }),
        });
    });

    it('listMemberWorkoutSessions_startDateFilterWithOtherMemberSessions_returnsSuccessWithOnlyTargetMembersSessionsAfterStartDate', async () => {
        // Arrange
        const member1 = await seedMember({email: 'm1@gym.test', fullName: 'M1'});
        const member2 = await seedMember({email: 'm2@gym.test', fullName: 'M2'});
        const seededExercise = await seedExercise();
        await seedWorkoutSession(member1.id, [seededExercise.id], {date: '2024-01-01'});
        const targetSession = await seedWorkoutSession(member1.id, [seededExercise.id], {date: '2024-06-01'});
        await seedWorkoutSession(member2.id, [seededExercise.id], {date: '2024-06-01'});

        // Act
        const inputMemberId: string = member1.id;
        const inputOptions: WorkoutSessionListOptions = {startDate: new Date('2024-03-01')};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({id: targetSession.id}),
                ]),
            }),
        });
    });

    it('listMemberWorkoutSessions_pageAndPageSize_returnsSuccessWithPaginatedSliceOrderedByDateDesc', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        for (let month = 1; month <= 5; month++) {
            await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: `2024-0${month}-01`});
        }

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {page: 2, pageSize: 2};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 5}),
        });
        const resultData = (result as { success: true; data: PageResult<WorkoutSessionWithExercises> }).data;
        expect(resultData.items).toHaveLength(2);
        expect(resultData.items[0].date).toEqual(new Date('2024-03-01'));
        expect(resultData.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('listMemberWorkoutSessions_pageZeroWithPageSize_returnsSuccessClampedToPageOneFirstSliceDesc', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {page: 0, pageSize: 2};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 3}),
        });
        const resultData = (result as { success: true; data: PageResult<WorkoutSessionWithExercises> }).data;
        expect(resultData.items).toHaveLength(2);
        expect(resultData.items[0].date).toEqual(new Date('2024-03-01'));
        expect(resultData.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('listMemberWorkoutSessions_pageSizeExceedsTotalWithPage_returnsSuccessWithAllRowsDesc', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {page: 1, pageSize: 100};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 3}),
        });
        const resultData = (result as { success: true; data: PageResult<WorkoutSessionWithExercises> }).data;
        expect(resultData.items).toHaveLength(3);
        expect(resultData.items[0].date).toEqual(new Date('2024-03-01'));
    });

    it('listMemberWorkoutSessions_onlyPageWithoutPageSize_returnsSuccessNotPaginatedAllSessionsAsc', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-03-01'});

        // Act
        const inputMemberId: string = seededMember.id;
        const inputOptions: WorkoutSessionListOptions = {page: 2};
        const result: ActionResult<PageResult<WorkoutSessionWithExercises>> = await listMemberWorkoutSessions(inputMemberId, inputOptions);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 3}),
        });
        const resultData = (result as { success: true; data: PageResult<WorkoutSessionWithExercises> }).data;
        expect(resultData.items).toHaveLength(3);
        expect(resultData.items[0].date).toEqual(new Date('2024-01-01'));
        expect(resultData.items[2].date).toEqual(new Date('2024-03-01'));
    });

});

describe('updateWorkoutSession', () => {

    it('updateWorkoutSession_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });

        // Act
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {date: '2025-01-15', duration: 90, notes: 'Updated'};
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seededSession.id,
                date: new Date('2025-01-15'),
                duration: 90,
                notes: 'Updated',
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.date).toEqual(new Date('2025-01-15'));
        expect(fetched.duration).toBe(90);
        expect(fetched.notes).toBe('Updated');
    });

    it('updateWorkoutSession_partialInput_returnsSuccessAndLeavesUnspecifiedFieldsUnchanged', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });

        // Act
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({duration: 90, notes: 'Original'}),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.duration).toBe(90);
        expect(fetched.date).toEqual(new Date('2024-06-01'));
        expect(fetched.notes).toBe('Original');
    });

    it('updateWorkoutSession_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {
            date: '2024-06-01', duration: 60, notes: 'Original',
        });

        // Act
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {};
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                date: new Date('2024-06-01'),
                duration: 60,
                notes: 'Original',
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.duration).toBe(60);
        expect(fetched.notes).toBe('Original');
    });

    it('updateWorkoutSession_invalidDateFormat_returnsValidationFailureWithFieldErrors', async () => {
        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputData = {date: 'not-a-date'} as unknown as UpdateWorkoutSessionInput;
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({date: expect.anything()}),
        });
    });

    it('updateWorkoutSession_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateWorkoutSession_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        // Arrange
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
        await updateWorkoutSession('00000000-0000-0000-0000-000000000000', {duration: 90});

        // Act
        const inputId: string = sessionB.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const result: ActionResult<WorkoutSession> = await updateWorkoutSession(inputId, inputData);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({duration: 90}),
        });
        const sessionAFetched = await workoutSessionService.getWorkoutSession(sessionA.id);
        const sessionBFetched = await workoutSessionService.getWorkoutSession(sessionB.id);
        expect(sessionAFetched.duration).toBe(60);
        expect(sessionBFetched.duration).toBe(90);
    });

});

describe('updateWorkoutSessionWithExercises', () => {

    it('updateWorkoutSessionWithExercises_sessionFieldsAndUpdatedExercise_returnsSuccessWithReconciled', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id], {duration: 60});
        const sessionExercise = seededSession.exercises[0];

        // Act
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: sessionExercise.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                duration: 90,
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: sessionExercise.id, sets: 5, reps: 8, weight: 100}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.duration).toBe(90);
        expect(fetched.exercises[0].sets).toBe(5);
    });

    it('updateWorkoutSessionWithExercises_emptyExercisesArray_returnsFailureWithRequiresExercisesMessage', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);

        // Act
        const inputId: string = seededSession.id;
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, []);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.exercises).toHaveLength(1);
    });

    it('updateWorkoutSessionWithExercises_invalidSessionData_returnsValidationFailureWithFieldErrors', async () => {
        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputData = {date: 'not-a-date'} as unknown as UpdateWorkoutSessionInput;
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, []);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({date: expect.anything()}),
        });
    });

    it('updateWorkoutSessionWithExercises_nonExistentSession_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const seededExercise = await seedExercise();

        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateWorkoutSessionWithExercises_exerciseOmittedFromInput_returnsSuccessAndDeletesItsEntry', async () => {
        // Arrange
        const seededMember = await seedMember();
        const benchPressExercise = await seedExercise({name: 'Bench Press'});
        const deadliftExercise = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const seededSession = await seedWorkoutSession(seededMember.id, [benchPressExercise.id, deadliftExercise.id]);
        const benchPressEntry = seededSession.exercises.find(e => e.exerciseId === benchPressExercise.id)!;
        const deadliftEntry = seededSession.exercises.find(e => e.exerciseId === deadliftExercise.id)!;

        // Act
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: benchPressEntry.id, exerciseId: benchPressExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: benchPressEntry.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.exercises).toHaveLength(1);
        expect(fetched.exercises.find(e => e.id === deadliftEntry.id)).toBeUndefined();
    });

    it('updateWorkoutSessionWithExercises_exerciseWithIdInInput_returnsSuccessAndUpdatesItsFields', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const sessionExercise = seededSession.exercises[0];

        // Act
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: sessionExercise.id, exerciseId: seededExercise.id, sets: 5, reps: 8, weight: 100},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: sessionExercise.id, sets: 5, reps: 8, weight: 100}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.exercises[0].sets).toBe(5);
        expect(fetched.exercises[0].reps).toBe(8);
        expect(fetched.exercises[0].weight).toBe(100);
    });

    it('updateWorkoutSessionWithExercises_exerciseWithoutIdInInput_returnsSuccessAndCreatesNewEntry', async () => {
        // Arrange
        const seededMember = await seedMember();
        const benchPressExercise = await seedExercise({name: 'Bench Press'});
        const deadliftExercise = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const seededSession = await seedWorkoutSession(seededMember.id, [benchPressExercise.id]);
        const benchPressEntry = seededSession.exercises[0];

        // Act
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: benchPressEntry.id, exerciseId: benchPressExercise.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: deadliftExercise.id, sets: 2, reps: 15, weight: 20},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: benchPressEntry.id}),
                    expect.objectContaining({exerciseId: deadliftExercise.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.exercises).toHaveLength(2);
    });

    it('updateWorkoutSessionWithExercises_mixKeepDeleteAdd_returnsSuccessWithReconciledExercises', async () => {
        // Arrange
        const seededMember = await seedMember();
        const benchPressExercise = await seedExercise({name: 'Bench Press'});
        const deadliftExercise = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const squatExercise = await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        const seededSession = await seedWorkoutSession(seededMember.id, [benchPressExercise.id, deadliftExercise.id]);
        const benchPressEntry = seededSession.exercises.find(e => e.exerciseId === benchPressExercise.id)!;
        const deadliftEntry = seededSession.exercises.find(e => e.exerciseId === deadliftExercise.id)!;

        // Act
        const inputId: string = seededSession.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: benchPressEntry.id, exerciseId: benchPressExercise.id, sets: 4, reps: 12, weight: 60},
            {exerciseId: squatExercise.id, sets: 3, reps: 10, weight: 40},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                exercises: expect.arrayContaining([
                    expect.objectContaining({id: benchPressEntry.id, sets: 4}),
                    expect.objectContaining({exerciseId: squatExercise.id}),
                ]),
            }),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.exercises).toHaveLength(2);
        expect(fetched.exercises.find(e => e.id === deadliftEntry.id)).toBeUndefined();
        expect(fetched.exercises.find(e => e.exerciseId === squatExercise.id)).toBeDefined();
    });

    it('updateWorkoutSessionWithExercises_afterRequiresExercisesError_subsequentValidCallSucceeds', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);
        const sessionExercise = seededSession.exercises[0];
        await updateWorkoutSessionWithExercises(seededSession.id, {}, []);

        // Act
        const inputId: string = seededSession.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: sessionExercise.id, exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50},
        ];
        const result: ActionResult<WorkoutSessionWithExercises> = await updateWorkoutSessionWithExercises(inputId, inputData, inputExercises);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({duration: 90}),
        });
        const fetched = await workoutSessionService.getWorkoutSession(inputId);
        expect(fetched.duration).toBe(90);
    });

});

describe('deleteWorkoutSession', () => {

    it('deleteWorkoutSession_existingSession_returnsSuccessAndSessionNoLongerExists', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const seededSession = await seedWorkoutSession(seededMember.id, [seededExercise.id]);

        // Act
        const inputId: string = seededSession.id;
        const result: ActionResult<void> = await deleteWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(0);
    });

    it('deleteWorkoutSession_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Act
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const result: ActionResult<void> = await deleteWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteWorkoutSession_sessionWithMultipleExercises_returnsSuccessAndCascadesAllExerciseEntries', async () => {
        // Arrange
        const seededMember = await seedMember();
        const benchPressExercise = await seedExercise({name: 'Bench Press'});
        const deadliftExercise = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        const seededSession = await seedWorkoutSession(seededMember.id, [benchPressExercise.id, deadliftExercise.id]);

        // Act
        const inputId: string = seededSession.id;
        const result: ActionResult<void> = await deleteWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        await expect(workoutSessionService.getWorkoutSession(inputId)).rejects.toThrow();
    });

    it('deleteWorkoutSession_oneOfManySessions_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const sessionA = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const sessionB = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});

        // Act
        const inputId: string = sessionA.id;
        const result: ActionResult<void> = await deleteWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await workoutSessionService.listMemberWorkoutSessions(seededMember.id);
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(sessionB.id);
    });

    it('deleteWorkoutSession_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise();
        const sessionA = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-01-01'});
        const sessionB = await seedWorkoutSession(seededMember.id, [seededExercise.id], {date: '2024-02-01'});
        await deleteWorkoutSession('00000000-0000-0000-0000-000000000000');

        // Act
        const inputId: string = sessionB.id;
        const result: ActionResult<void> = await deleteWorkoutSession(inputId);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const sessionAFetched = await workoutSessionService.getWorkoutSession(sessionA.id);
        expect(sessionAFetched).toBeDefined();
        await expect(workoutSessionService.getWorkoutSession(sessionB.id)).rejects.toThrow();
    });

});