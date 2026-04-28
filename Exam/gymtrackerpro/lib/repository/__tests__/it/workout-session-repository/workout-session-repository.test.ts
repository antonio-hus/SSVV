import {prisma} from '@/lib/database';
import {workoutSessionRepository} from '@/lib/di';
import {NotFoundError, WorkoutSessionRequiresExercisesError} from '@/lib/domain/errors';
import {Role} from "@/lib/domain/user";
import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
} from '@/lib/schema/workout-session-schema';
import {CreateMemberInput} from "@/lib/schema/user-schema";
import {CreateExerciseInput} from "@/lib/schema/exercise-schema";

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

const FIXED_HASH = '$2a$12$fixedHashValueUsedForDirectSeeding00000000000000000';

const seedMember = async (overrides: Partial<CreateMemberInput> = {}) => {
    const result = await prisma.user.create({
        data: {
            email: overrides.email ?? 'member@test.com',
            fullName: overrides.fullName ?? 'Test Member',
            phone: '0700000000',
            dateOfBirth: new Date('1990-01-01'),
            passwordHash: FIXED_HASH,
            role: Role.MEMBER,
            member: {
                create: {membershipStart: new Date('2024-01-01')},
            },
        },
        include: {member: true},
    });
    return result.member!;
};

const seedExercise = async (overrides: Partial<CreateExerciseInput & {isActive: boolean}> = {}) => {
    return prisma.exercise.create({
        data: {
            name: overrides.name ?? 'Bench Press',
            muscleGroup: overrides.muscleGroup ?? MuscleGroup.CHEST,
            equipmentNeeded: overrides.equipmentNeeded ?? Equipment.BARBELL,
            isActive: overrides.isActive ?? true,
        },
    });
};

const seedWorkoutSession = async (
    memberId: string,
    exerciseIds: string[],
    overrides: Partial<Omit<CreateWorkoutSessionInput, "date"> & {date: Date}> = {},
) => {
    return prisma.workoutSession.create({
        data: {
            memberId,
            date: overrides.date ?? new Date('2024-06-01'),
            duration: overrides.duration ?? 60,
            notes: overrides.notes,
            exercises: {
                create: exerciseIds.map((exerciseId) => ({
                    exerciseId,
                    sets: 3,
                    reps: 10,
                    weight: 50,
                })),
            },
        },
        include: {exercises: {include: {exercise: true}}},
    });
};

describe('create', () => {

    it('create_newSessionWithOneExercise_returnsPersistedSessionAndCreatesWseRow', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const inputData: CreateWorkoutSessionInput = {
            memberId: member.id,
            date: '2024-06-01',
            duration: 60,
            notes: 'Test session',
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const result = await workoutSessionRepository.create(inputData, inputExercises);

        // Assert
        expect(result.id).toBeDefined();
        expect(result.memberId).toBe(member.id);
        expect(result.duration).toBe(60);
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].exerciseId).toBe(exercise.id);
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: result.id}});
        const wseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: result.id}});
        expect(sessionInDb).not.toBeNull();
        expect(wseInDb).toHaveLength(1);
        expect(wseInDb[0].sets).toBe(3);
    });

    it('create_newSessionWithMultipleExercises_createsOneWseRowPerExercise', async () => {
        // Arrange
        const member = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift'});
        const inputData: CreateWorkoutSessionInput = {
            memberId: member.id,
            date: '2024-06-01',
            duration: 45,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: exercise2.id, sets: 4, reps: 8, weight: 80},
        ];

        // Act
        const result = await workoutSessionRepository.create(inputData, inputExercises);

        // Assert
        expect(result.exercises).toHaveLength(2);
        const wseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: result.id}});
        expect(wseInDb).toHaveLength(2);
    });

    it('create_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        // Arrange
        const member = await seedMember();
        const inputData: CreateWorkoutSessionInput = {
            memberId: member.id,
            date: '2024-06-01',
            duration: 60,
        };

        // Act
        const action = () => workoutSessionRepository.create(inputData, []);

        // Assert
        await expect(action()).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        const sessionCount = await prisma.workoutSession.count();
        expect(sessionCount).toBe(0);
    });

    it('create_memberNotFound_throwsNotFoundError', async () => {
        // Arrange
        const exercise = await seedExercise();
        const inputData: CreateWorkoutSessionInput = {
            memberId: '00000000-0000-0000-0000-000000000000',
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const action = () => workoutSessionRepository.create(inputData, inputExercises);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
        const sessionCount = await prisma.workoutSession.count();
        expect(sessionCount).toBe(0);
    });

    it('create_afterNotFoundError_subsequentValidCallSucceeds', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();

        await workoutSessionRepository.create(
            {memberId: '00000000-0000-0000-0000-000000000000', date: '2024-06-01', duration: 60},
            [{exerciseId: exercise.id, sets: 3, reps: 10, weight: 50}],
        ).catch(() => {
        });

        const inputData: CreateWorkoutSessionInput = {
            memberId: member.id,
            date: '2024-06-01',
            duration: 60,
        };
        const inputExercises: WorkoutSessionExerciseInput[] = [
            {exerciseId: exercise.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const result = await workoutSessionRepository.create(inputData, inputExercises);

        // Assert
        expect(result.memberId).toBe(member.id);
        const sessionCount = await prisma.workoutSession.count();
        expect(sessionCount).toBe(1);
    });

});

describe('findById', () => {

    it('findById_existingSession_returnsSessionWithAllFieldsAndExercisesMatching', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id], {
            date: new Date('2024-06-01'), duration: 60, notes: 'Rest day',
        });
        const inputId: string = seeded.id;

        // Act
        const result = await workoutSessionRepository.findById(inputId);

        // Assert
        expect(result.id).toBe(seeded.id);
        expect(result.memberId).toBe(member.id);
        expect(result.duration).toBe(60);
        expect(result.notes).toBe('Rest day');
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].exerciseId).toBe(exercise.id);
    });

    it('findById_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => workoutSessionRepository.findById(inputId);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('findAll', () => {

    it('findAll_noOptions_returnsAllSessionsOrderedByDateAsc', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-03-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-06-01')});

        // Act
        const result = await workoutSessionRepository.findAll();

        // Assert
        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-01-01'));
        expect(result.items[1].date).toEqual(new Date('2024-03-01'));
        expect(result.items[2].date).toEqual(new Date('2024-06-01'));
    });

    it('findAll_noSessions_returnsEmptyPage', async () => {
        // Act
        const result = await workoutSessionRepository.findAll();

        // Assert
        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('findAll_memberIdFilter_returnsOnlySessionsForThatMember', async () => {
        // Arrange
        const member1 = await seedMember({email: 'm1@test.com', fullName: 'M1'});
        const member2 = await seedMember({email: 'm2@test.com', fullName: 'M2'});
        const exercise = await seedExercise();
        const session1 = await seedWorkoutSession(member1.id, [exercise.id]);
        await seedWorkoutSession(member2.id, [exercise.id]);
        const inputMemberId: string = member1.id;

        // Act
        const result = await workoutSessionRepository.findAll({memberId: inputMemberId});

        // Assert
        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(session1.id);
    });

    it('findAll_startDateFilter_returnsOnlySessionsOnOrAfterStartDate', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        const laterSession = await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-06-01')});
        const inputStartDate: Date = new Date('2024-03-01');

        // Act
        const result = await workoutSessionRepository.findAll({startDate: inputStartDate});

        // Assert
        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(laterSession.id);
    });

    it('findAll_endDateFilter_returnsOnlySessionsOnOrBeforeEndDate', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const earlySession = await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-06-01')});
        const inputEndDate: Date = new Date('2024-03-01');

        // Act
        const result = await workoutSessionRepository.findAll({endDate: inputEndDate});

        // Assert
        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(earlySession.id);
    });

    it('findAll_startDateAndEndDate_returnsOnlySessionsWithinRange', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        const midSession = await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-04-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-08-01')});
        const inputStartDate: Date = new Date('2024-03-01');
        const inputEndDate: Date = new Date('2024-06-01');

        // Act
        const result = await workoutSessionRepository.findAll({startDate: inputStartDate, endDate: inputEndDate});

        // Assert
        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(midSession.id);
    });

    it('findAll_pageAndPageSize_returnsPaginatedSliceOrderedByDateDesc', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        for (let month = 1; month <= 5; month++) {
            await seedWorkoutSession(member.id, [exercise.id], {
                date: new Date(`2024-0${month}-01`),
            });
        }

        // Act
        const result = await workoutSessionRepository.findAll({page: 2, pageSize: 2});

        // Assert
        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
        expect(result.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('findAll_pageZeroWithPageSize_clampedToPageOneAndReturnsFirstSliceDesc', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-02-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-03-01')});

        // Act
        const result = await workoutSessionRepository.findAll({page: 0, pageSize: 2});

        // Assert
        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
        expect(result.items[1].date).toEqual(new Date('2024-02-01'));
    });

    it('findAll_pageSizeExceedsTotalWithPage_returnsAllRowsDesc', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-02-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-03-01')});

        // Act
        const result = await workoutSessionRepository.findAll({page: 1, pageSize: 100});

        // Assert
        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-03-01'));
    });

    it('findAll_memberIdAndStartDate_returnsOnlyMatchingMembersSessionsAfterStartDate', async () => {
        // Arrange
        const member1 = await seedMember({email: 'm1@test.com', fullName: 'M1'});
        const member2 = await seedMember({email: 'm2@test.com', fullName: 'M2'});
        const exercise = await seedExercise();
        await seedWorkoutSession(member1.id, [exercise.id], {date: new Date('2024-01-01')});
        const targetSession = await seedWorkoutSession(member1.id, [exercise.id], {date: new Date('2024-06-01')});
        await seedWorkoutSession(member2.id, [exercise.id], {date: new Date('2024-06-01')});
        const inputMemberId: string = member1.id;
        const inputStartDate: Date = new Date('2024-03-01');

        // Act
        const result = await workoutSessionRepository.findAll({memberId: inputMemberId, startDate: inputStartDate});

        // Assert
        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(targetSession.id);
    });

    it('findAll_onlyPageWithoutPageSize_notPaginatedReturnsAllSessionsAsc', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-02-01')});
        await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-03-01')});

        // Act
        const result = await workoutSessionRepository.findAll({page: 2});

        // Assert
        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].date).toEqual(new Date('2024-01-01'));
        expect(result.items[2].date).toEqual(new Date('2024-03-01'));
    });

});

describe('update', () => {

    it('update_allFields_returnsUpdatedSessionAndPersistsAllChanges', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id], {
            date: new Date('2024-06-01'), duration: 60, notes: 'Original',
        });
        const inputId: string = seeded.id;
        const inputData: UpdateWorkoutSessionInput = {
            date: '2025-01-15',
            duration: 90,
            notes: 'Updated',
        };

        // Act
        const result = await workoutSessionRepository.update(inputId, inputData);

        // Assert
        expect(result.date).toEqual(new Date('2025-01-15'));
        expect(result.duration).toBe(90);
        expect(result.notes).toBe('Updated');
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        expect(sessionInDb!.date).toEqual(new Date('2025-01-15'));
        expect(sessionInDb!.duration).toBe(90);
        expect(sessionInDb!.notes).toBe('Updated');
    });

    it('update_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => workoutSessionRepository.update(inputId, {duration: 90});

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('update_partialInput_onlyDurationChangedOtherFieldsUntouched', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id], {
            date: new Date('2024-06-01'), duration: 60, notes: 'Original',
        });
        const inputId: string = seeded.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};

        // Act
        const result = await workoutSessionRepository.update(inputId, inputData);

        // Assert
        expect(result.duration).toBe(90);
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        expect(sessionInDb!.duration).toBe(90);
        expect(sessionInDb!.date).toEqual(new Date('2024-06-01'));
        expect(sessionInDb!.notes).toBe('Original');
    });

    it('update_emptyInput_noFieldsMutated', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id], {
            date: new Date('2024-06-01'), duration: 60, notes: 'Original',
        });
        const inputId: string = seeded.id;
        const inputData: UpdateWorkoutSessionInput = {};

        // Act
        const result = await workoutSessionRepository.update(inputId, inputData);

        // Assert
        expect(result.date).toEqual(new Date('2024-06-01'));
        expect(result.duration).toBe(60);
        expect(result.notes).toBe('Original');
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        expect(sessionInDb!.date).toEqual(new Date('2024-06-01'));
        expect(sessionInDb!.duration).toBe(60);
        expect(sessionInDb!.notes).toBe('Original');
    });

    it('update_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const sessionA = await seedWorkoutSession(member.id, [exercise.id], {duration: 60});
        const sessionB = await seedWorkoutSession(member.id, [exercise.id], {
            date: new Date('2024-07-01'), duration: 45,
        });
        await workoutSessionRepository.update('00000000-0000-0000-0000-000000000000', {duration: 90}).catch(() => {
        });
        const inputId: string = sessionB.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};

        // Act
        const result = await workoutSessionRepository.update(inputId, inputData);

        // Assert
        expect(result.duration).toBe(90);
        const sessionAInDb = await prisma.workoutSession.findUnique({where: {id: sessionA.id}});
        const sessionBInDb = await prisma.workoutSession.findUnique({where: {id: sessionB.id}});
        expect(sessionAInDb!.duration).toBe(60);
        expect(sessionBInDb!.duration).toBe(90);
    });

});

describe('updateWithExercises', () => {

    it('updateWithExercises_sessionFieldsAndExistingExercise_updatesSessionAndWseRow', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id], {duration: 60});
        const wse1 = seeded.exercises[0];
        const inputId: string = seeded.id;
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise.id, sets: 5, reps: 8, weight: 100},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, inputData, inputExercises);

        // Assert
        expect(result.duration).toBe(90);
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].sets).toBe(5);
        expect(result.exercises[0].reps).toBe(8);
        expect(result.exercises[0].weight).toBe(100);
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        const wseInDb = await prisma.workoutSessionExercise.findUnique({where: {id: wse1.id}});
        expect(sessionInDb!.duration).toBe(90);
        expect(wseInDb!.sets).toBe(5);
        expect(wseInDb!.reps).toBe(8);
        expect(wseInDb!.weight).toBe(100);
    });

    it('updateWithExercises_emptyExercisesArray_throwsWorkoutSessionRequiresExercisesError', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id]);
        const inputId: string = seeded.id;

        // Act
        const action = () => workoutSessionRepository.updateWithExercises(inputId, {}, []);

        // Assert
        await expect(action()).rejects.toThrow(WorkoutSessionRequiresExercisesError);
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        const wseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: inputId}});
        expect(sessionInDb!.duration).toBe(60);
        expect(wseInDb).toHaveLength(1);
    });

    it('updateWithExercises_nonExistentSession_throwsNotFoundError', async () => {
        // Arrange
        const exercise = await seedExercise();
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {exerciseId: exercise.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const action = () => workoutSessionRepository.updateWithExercises(inputId, {}, inputExercises);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateWithExercises_exerciseOmittedFromInput_deletesItsWseRow', async () => {
        // Arrange
        const member = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift'});
        const seeded = await seedWorkoutSession(member.id, [exercise1.id, exercise2.id]);
        const wse1 = seeded.exercises.find((e) => e.exerciseId === exercise1.id)!;
        const wse2 = seeded.exercises.find((e) => e.exerciseId === exercise2.id)!;
        const inputId: string = seeded.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].id).toBe(wse1.id);
        const wse2InDb = await prisma.workoutSessionExercise.findUnique({where: {id: wse2.id}});
        expect(wse2InDb).toBeNull();
    });

    it('updateWithExercises_exerciseWithIdInInput_updatesItsWseFields', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id]);
        const wse1 = seeded.exercises[0];
        const inputId: string = seeded.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise.id, sets: 5, reps: 8, weight: 100},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result.exercises[0].sets).toBe(5);
        expect(result.exercises[0].reps).toBe(8);
        expect(result.exercises[0].weight).toBe(100);
        const wse1InDb = await prisma.workoutSessionExercise.findUnique({where: {id: wse1.id}});
        expect(wse1InDb!.sets).toBe(5);
        expect(wse1InDb!.reps).toBe(8);
        expect(wse1InDb!.weight).toBe(100);
    });

    it('updateWithExercises_exerciseWithoutIdInInput_createsNewWseRow', async () => {
        // Arrange
        const member = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift'});
        const seeded = await seedWorkoutSession(member.id, [exercise1.id]);
        const wse1 = seeded.exercises[0];
        const inputId: string = seeded.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 3, reps: 10, weight: 50},
            {exerciseId: exercise2.id, sets: 2, reps: 15, weight: 20},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result.exercises).toHaveLength(2);
        const allWseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: inputId}});
        expect(allWseInDb).toHaveLength(2);
    });

    it('updateWithExercises_mixKeepDeleteAdd_reconcileAllThreeBranchesCorrectly', async () => {
        // Arrange
        const member = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift'});
        const exercise3 = await seedExercise({name: 'Squat'});
        const seeded = await seedWorkoutSession(member.id, [exercise1.id, exercise2.id]);
        const wse1 = seeded.exercises.find((e) => e.exerciseId === exercise1.id)!;
        const wse2 = seeded.exercises.find((e) => e.exerciseId === exercise2.id)!;
        const inputId: string = seeded.id;
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise1.id, sets: 4, reps: 12, weight: 60},
            {exerciseId: exercise3.id, sets: 3, reps: 10, weight: 40},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, {}, inputExercises);

        // Assert
        expect(result.exercises).toHaveLength(2);
        expect(result.exercises.find((e) => e.id === wse1.id)?.sets).toBe(4);
        expect(result.exercises.find((e) => e.id === wse2.id)).toBeUndefined();
        expect(result.exercises.find((e) => e.exerciseId === exercise3.id)).toBeDefined();
        const wse1InDb = await prisma.workoutSessionExercise.findUnique({where: {id: wse1.id}});
        const wse2InDb = await prisma.workoutSessionExercise.findUnique({where: {id: wse2.id}});
        const allWseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: inputId}});
        expect(wse1InDb!.sets).toBe(4);
        expect(wse2InDb).toBeNull();
        expect(allWseInDb).toHaveLength(2);
    });

    it('updateWithExercises_afterRequiresExercisesError_subsequentValidCallSucceeds', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id]);
        const wse1 = seeded.exercises[0];
        const inputId: string = seeded.id;
        await workoutSessionRepository.updateWithExercises(inputId, {}, []).catch(() => {
        });
        const inputData: UpdateWorkoutSessionInput = {duration: 90};
        const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
            {id: wse1.id, exerciseId: exercise.id, sets: 3, reps: 10, weight: 50},
        ];

        // Act
        const result = await workoutSessionRepository.updateWithExercises(inputId, inputData, inputExercises);

        // Assert
        expect(result.duration).toBe(90);
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        expect(sessionInDb!.duration).toBe(90);
    });

});

describe('delete', () => {

    it('delete_existingSession_removesSessionAndItsWseRowsViaCascade', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const seeded = await seedWorkoutSession(member.id, [exercise.id]);
        const inputId: string = seeded.id;
        const wseId: string = seeded.exercises[0].id;

        // Act
        await workoutSessionRepository.delete(inputId);

        // Assert
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        const wseInDb = await prisma.workoutSessionExercise.findUnique({where: {id: wseId}});
        expect(sessionInDb).toBeNull();
        expect(wseInDb).toBeNull();
    });

    it('delete_nonExistentId_throwsNotFoundError', async () => {
        // Arrange
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        // Act
        const action = () => workoutSessionRepository.delete(inputId);

        // Assert
        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('delete_sessionWithMultipleWseRows_cascadesAllWseRowsDeletion', async () => {
        // Arrange
        const member = await seedMember();
        const exercise1 = await seedExercise({name: 'Bench Press'});
        const exercise2 = await seedExercise({name: 'Deadlift'});
        const seeded = await seedWorkoutSession(member.id, [exercise1.id, exercise2.id]);
        const inputId: string = seeded.id;

        // Act
        await workoutSessionRepository.delete(inputId);

        // Assert
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: inputId}});
        const allWseInDb = await prisma.workoutSessionExercise.findMany({where: {workoutSessionId: inputId}});
        expect(sessionInDb).toBeNull();
        expect(allWseInDb).toHaveLength(0);
    });

    it('delete_afterNotFoundError_subsequentValidCallOnDifferentSessionSucceeds', async () => {
        // Arrange
        const member = await seedMember();
        const exercise = await seedExercise();
        const sessionA = await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-01-01')});
        const sessionB = await seedWorkoutSession(member.id, [exercise.id], {date: new Date('2024-02-01')});
        await workoutSessionRepository.delete('00000000-0000-0000-0000-000000000000').catch(() => {
        });
        const inputId: string = sessionB.id;

        // Act
        await workoutSessionRepository.delete(inputId);

        // Assert
        const sessionAInDb = await prisma.workoutSession.findUnique({where: {id: sessionA.id}});
        const sessionBInDb = await prisma.workoutSession.findUnique({where: {id: sessionB.id}});
        expect(sessionAInDb).not.toBeNull();
        expect(sessionBInDb).toBeNull();
    });

});
