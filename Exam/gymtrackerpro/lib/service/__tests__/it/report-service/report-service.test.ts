import {prisma} from '@/lib/database';
import {exerciseRepository, reportService, userRepository, workoutSessionRepository} from '@/lib/di';
import {NotFoundError} from '@/lib/domain/errors';
import {Equipment, MuscleGroup} from '@/lib/domain/exercise';
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

const seedMember = async (overrides: Partial<CreateMemberInput> = {}) => {
    return userRepository.createMember({
        email: overrides.email ?? 'member@test.com',
        fullName: overrides.fullName ?? 'Test Member',
        phone: overrides.phone ?? '0700000001',
        dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
        password: overrides.password ?? 'Secret123!',
        membershipStart: overrides.membershipStart ?? '2024-01-01',
    });
};

describe('getMemberProgressReport', () => {

    it('getMemberProgressReport_oneSesssionOneExercise_returnsCorrectlyComputedReport', async () => {
        const seededMember = await seedMember();
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-15', duration: 60, notes: 'First session'},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 100}],
        );
        const inputMemberId: string = seededMember.id;
        const inputStartDate: Date = new Date('2024-01-01');
        const inputEndDate: Date = new Date('2024-01-31');

        const result = await reportService.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.memberId).toBe(seededMember.id);
        expect(result.memberName).toBe(seededMember.user.fullName);
        expect(result.startDate).toEqual(inputStartDate);
        expect(result.endDate).toEqual(inputEndDate);
        expect(result.totalSessions).toBe(1);
        expect(result.totalVolume).toBe(3000);
        expect(result.averageSessionDuration).toBe(60);
        expect(result.sessionDetails).toHaveLength(1);
        expect(result.sessionDetails[0].durationMinutes).toBe(60);
        expect(result.sessionDetails[0].notes).toBe('First session');
        expect(result.sessionDetails[0].exercises).toHaveLength(1);
        expect(result.sessionDetails[0].exercises[0].exerciseName).toBe('Bench Press');
        expect(result.sessionDetails[0].exercises[0].sets).toBe(3);
        expect(result.sessionDetails[0].exercises[0].reps).toBe(10);
        expect(result.sessionDetails[0].exercises[0].weight).toBe(100);
        expect(result.sessionDetails[0].exercises[0].volume).toBe(3000);
        expect(result.exerciseBreakdown).toHaveLength(1);
        expect(result.exerciseBreakdown[0].exerciseName).toBe('Bench Press');
        expect(result.exerciseBreakdown[0].muscleGroup).toBe(MuscleGroup.CHEST);
        expect(result.exerciseBreakdown[0].totalSets).toBe(3);
        expect(result.exerciseBreakdown[0].totalReps).toBe(30);
        expect(result.exerciseBreakdown[0].totalVolume).toBe(3000);
        expect(result.exerciseBreakdown[0].sessionCount).toBe(1);
    });

    it('getMemberProgressReport_multipleSessionsMultipleExercises_aggregatesCorrectlyAndSortsBreakdownByVolumeDescending', async () => {
        const seededMember = await seedMember();
        const benchPress = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        const deadlift = await exerciseRepository.create({
            name: 'Deadlift',
            description: 'Back compound',
            muscleGroup: MuscleGroup.BACK,
            equipmentNeeded: Equipment.BARBELL,
        });
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-10', duration: 60},
            [{exerciseId: benchPress.id, sets: 3, reps: 10, weight: 100}],
        );
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-20', duration: 90},
            [
                {exerciseId: deadlift.id, sets: 4, reps: 5, weight: 150},
                {exerciseId: benchPress.id, sets: 2, reps: 8, weight: 80},
            ],
        );
        const inputMemberId: string = seededMember.id;
        const inputStartDate: Date = new Date('2024-01-01');
        const inputEndDate: Date = new Date('2024-01-31');

        const result = await reportService.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.totalSessions).toBe(2);
        expect(result.totalVolume).toBe(7280);
        expect(result.averageSessionDuration).toBe(75);
        expect(result.sessionDetails).toHaveLength(2);
        expect(result.exerciseBreakdown).toHaveLength(2);
        expect(result.exerciseBreakdown[0].exerciseName).toBe('Bench Press');
        expect(result.exerciseBreakdown[0].totalVolume).toBe(4280);
        expect(result.exerciseBreakdown[0].totalSets).toBe(5);
        expect(result.exerciseBreakdown[0].totalReps).toBe(46);
        expect(result.exerciseBreakdown[0].sessionCount).toBe(2);
        expect(result.exerciseBreakdown[1].exerciseName).toBe('Deadlift');
        expect(result.exerciseBreakdown[1].totalVolume).toBe(3000);
        expect(result.exerciseBreakdown[1].sessionCount).toBe(1);
    });

    it('getMemberProgressReport_sameExerciseAcrossMultipleSessions_sessionCountReflectsDistinctSessions', async () => {
        const seededMember = await seedMember();
        const seededExercise = await exerciseRepository.create({
            name: 'Squat',
            description: 'Leg compound',
            muscleGroup: MuscleGroup.LEGS,
            equipmentNeeded: Equipment.BARBELL,
        });
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-10', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-01-20', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 50}],
        );
        const inputMemberId: string = seededMember.id;
        const inputStartDate: Date = new Date('2024-01-01');
        const inputEndDate: Date = new Date('2024-01-31');

        const result = await reportService.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.exerciseBreakdown).toHaveLength(1);
        expect(result.exerciseBreakdown[0].exerciseName).toBe('Squat');
        expect(result.exerciseBreakdown[0].totalSets).toBe(6);
        expect(result.exerciseBreakdown[0].totalReps).toBe(60);
        expect(result.exerciseBreakdown[0].totalVolume).toBe(3000);
        expect(result.exerciseBreakdown[0].sessionCount).toBe(2);
    });

    it('getMemberProgressReport_noSessionsInDateWindow_returnsZeroedAggregatesAndEmptyArrays', async () => {
        const seededMember = await seedMember();
        const seededExercise = await exerciseRepository.create({
            name: 'Bench Press',
            description: 'Chest compound',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-03-01', duration: 60},
            [{exerciseId: seededExercise.id, sets: 3, reps: 10, weight: 100}],
        );
        const inputMemberId: string = seededMember.id;
        const inputStartDate: Date = new Date('2024-01-01');
        const inputEndDate: Date = new Date('2024-01-31');

        const result = await reportService.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.totalSessions).toBe(0);
        expect(result.totalVolume).toBe(0);
        expect(result.averageSessionDuration).toBe(0);
        expect(result.exerciseBreakdown).toHaveLength(0);
        expect(result.sessionDetails).toHaveLength(0);
    });

    it('getMemberProgressReport_nonExistentMemberId_throwsNotFoundError', async () => {
        const inputMemberId: string = '00000000-0000-0000-0000-000000000000';
        const inputStartDate: Date = new Date('2024-01-01');
        const inputEndDate: Date = new Date('2024-01-31');

        const action = () => reportService.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});