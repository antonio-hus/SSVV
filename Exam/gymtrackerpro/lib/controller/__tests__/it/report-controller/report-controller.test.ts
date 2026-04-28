import {prisma} from '@/lib/database';
import {exerciseService, userService, workoutSessionService} from '@/lib/di';
import {getMemberProgressReport} from '@/lib/controller/report-controller';
import {MuscleGroup, Equipment} from '@/prisma/generated/prisma/client';
import {ActionResult} from '@/lib/domain/action-result';
import {Report} from '@/lib/domain/report';
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

describe('getMemberProgressReport', () => {

    it('getMemberProgressReport_oneSessionOneExercise_returnsSuccessWithCorrectlyComputedReport', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise({name: 'Bench Press'});
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-01-15', duration: 60, notes: 'First session'},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 100}],
        );

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            seededMember.id,
            '2024-01-01',
            '2024-01-31'
        );

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                memberId: seededMember.id,
                memberName: seededMember.user.fullName,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                totalSessions: 1,
                totalVolume: 3000,
                averageSessionDuration: 60,
            }),
        });
        const report = (result as { success: true; data: Report }).data;
        expect(report.sessionDetails).toHaveLength(1);
        expect(report.sessionDetails[0].durationMinutes).toBe(60);
        expect(report.sessionDetails[0].notes).toBe('First session');
        expect(report.sessionDetails[0].exercises).toHaveLength(1);
        expect(report.sessionDetails[0].exercises[0].exerciseName).toBe('Bench Press');
        expect(report.sessionDetails[0].exercises[0].sets).toBe(3);
        expect(report.sessionDetails[0].exercises[0].reps).toBe(10);
        expect(report.sessionDetails[0].exercises[0].weight).toBe(100);
        expect(report.sessionDetails[0].exercises[0].volume).toBe(3000);
        expect(report.exerciseBreakdown).toHaveLength(1);
        expect(report.exerciseBreakdown[0].exerciseName).toBe('Bench Press');
        expect(report.exerciseBreakdown[0].muscleGroup).toBe(MuscleGroup.CHEST);
        expect(report.exerciseBreakdown[0].totalSets).toBe(3);
        expect(report.exerciseBreakdown[0].totalReps).toBe(30);
        expect(report.exerciseBreakdown[0].totalVolume).toBe(3000);
        expect(report.exerciseBreakdown[0].sessionCount).toBe(1);
    });

    it('getMemberProgressReport_multipleSessionsMultipleExercises_returnsSuccessWithCorrectAggregatesAndBreakdownSortedByVolumeDescending', async () => {
        // Arrange
        const seededMember = await seedMember();
        const benchPress = await seedExercise({name: 'Bench Press', muscleGroup: MuscleGroup.CHEST});
        const deadlift = await seedExercise({name: 'Deadlift', muscleGroup: MuscleGroup.BACK});
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-01-10', duration: 60},
            [{exerciseId: benchPress.id, sets: 3, reps: 10, weight: 100}],
        );
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-01-20', duration: 90},
            [
                {exerciseId: deadlift.id, sets: 4, reps: 5, weight: 150},
                {exerciseId: benchPress.id, sets: 2, reps: 8, weight: 80},
            ],
        );

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            seededMember.id,
            '2024-01-01',
            '2024-01-31'
        );

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                totalSessions: 2,
                totalVolume: 7280,
                averageSessionDuration: 75,
            }),
        });
        const report = (result as { success: true; data: Report }).data;
        expect(report.sessionDetails).toHaveLength(2);
        expect(report.exerciseBreakdown).toHaveLength(2);
        expect(report.exerciseBreakdown[0].exerciseName).toBe('Bench Press');
        expect(report.exerciseBreakdown[0].totalVolume).toBe(4280);
        expect(report.exerciseBreakdown[0].totalSets).toBe(5);
        expect(report.exerciseBreakdown[0].totalReps).toBe(46);
        expect(report.exerciseBreakdown[0].sessionCount).toBe(2);
        expect(report.exerciseBreakdown[1].exerciseName).toBe('Deadlift');
        expect(report.exerciseBreakdown[1].totalVolume).toBe(3000);
        expect(report.exerciseBreakdown[1].sessionCount).toBe(1);
    });

    it('getMemberProgressReport_sameExerciseAcrossMultipleSessions_returnsSuccessWithSessionCountReflectingDistinctSessions', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise({name: 'Back Squat', muscleGroup: MuscleGroup.LEGS});
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-01-10', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-01-20', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            seededMember.id,
            '2024-01-01',
            '2024-01-31'
        );

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({totalSessions: 2, totalVolume: 3000}),
        });
        const report = (result as { success: true; data: Report }).data;
        expect(report.exerciseBreakdown).toHaveLength(1);
        expect(report.exerciseBreakdown[0].exerciseName).toBe('Back Squat');
        expect(report.exerciseBreakdown[0].totalSets).toBe(6);
        expect(report.exerciseBreakdown[0].totalReps).toBe(60);
        expect(report.exerciseBreakdown[0].totalVolume).toBe(3000);
        expect(report.exerciseBreakdown[0].sessionCount).toBe(2);
    });

    it('getMemberProgressReport_noSessionsInDateWindow_returnsSuccessWithZeroedAggregatesAndEmptyArrays', async () => {
        // Arrange
        const seededMember = await seedMember();
        const seededExercise = await seedExercise({name: 'Bench Press'});
        await workoutSessionService.createWorkoutSession(
            {memberId: seededMember.id, date: '2024-03-01', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 100}],
        );

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            seededMember.id,
            '2024-01-01',
            '2024-01-31'
        );

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                totalSessions: 0,
                totalVolume: 0,
                averageSessionDuration: 0,
                exerciseBreakdown: [],
                sessionDetails: [],
            }),
        });
    });

    it('getMemberProgressReport_nonExistentMemberId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const memberId = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            memberId,
            '2024-01-01',
            '2024-01-31'
        );

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('getMemberProgressReport_invalidDateFormat_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const memberId = 'any-id';

        // Act
        const result: ActionResult<Report> = await getMemberProgressReport(
            memberId,
            'not-a-date',
            'also-not-a-date'
        );

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                startDate: expect.anything(),
                endDate: expect.anything(),
            }),
        });
    });

});