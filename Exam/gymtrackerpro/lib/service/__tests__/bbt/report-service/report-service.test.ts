import {mock, mockReset} from 'jest-mock-extended';
import type {MemberWithUser} from '@/lib/domain/user';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import {NotFoundError} from '@/lib/domain/errors';
import {Equipment, Exercise, MuscleGroup} from '@/lib/domain/exercise';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {ReportService} from '@/lib/service/report-service';

const mockSessionRepo = mock<WorkoutSessionRepositoryInterface>();
const mockUserRepo = mock<UserRepositoryInterface>();

const MEMBER_ID: string = 'member-001';
const SESSION_ID_1: string = 'session-001';
const SESSION_ID_2: string = 'session-002';
const EXERCISE_ID: string = 'exercise-001';

const MOCK_MEMBER: MemberWithUser = {
    id: MEMBER_ID,
    userId: 'user-001',
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: {
        id: 'user-001',
        email: 'john@example.com',
        fullName: 'John Michael Doe',
        phone: '+40712345678',
        dateOfBirth: new Date('1990-01-15'),
        passwordHash: 'hashed',
        role: 'MEMBER',
    },
};

const MOCK_EXERCISE_ENTRY: Exercise = {
    id: 'ex-001',
    name: 'Bench Press',
    description: 'Chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const makeSession = (id: string, duration: number, sets: number, reps: number, weight: number): WorkoutSessionWithExercises => ({
    id,
    memberId: MEMBER_ID,
    date: new Date('2024-06-15'),
    duration,
    notes: null,
    exercises: [
        {
            id: `se-${id}`,
            workoutSessionId: id,
            exerciseId: EXERCISE_ID,
            sets,
            reps,
            weight,
            exercise: MOCK_EXERCISE_ENTRY,
        },
    ],
});

const START_DATE: Date = new Date('2024-01-01');
const END_DATE: Date = new Date('2024-12-31');

beforeEach(() => {
    mockReset(mockSessionRepo);
    mockReset(mockUserRepo);
    (ReportService as unknown as { instance: unknown }).instance = undefined;
});

describe('getMemberProgressReport', () => {
    it('getMemberProgressReport_memberNotFound_throwsNotFoundError', async () => {
        mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const act = service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        await expect(act).rejects.toThrow(NotFoundError);
    });

    it('getMemberProgressReport_noSessionsInRange_returnsZeroStats', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.totalSessions).toBe(0);
        expect(result.totalVolume).toBe(0);
        expect(result.averageSessionDuration).toBe(0);
        expect(result.exerciseBreakdown).toHaveLength(0);
        expect(result.sessionDetails).toHaveLength(0);
    });

    it('getMemberProgressReport_singleSessionWithOneExercise_computesCorrectTotalVolume', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [makeSession(SESSION_ID_1, 90, 3, 10, 50)], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.totalSessions).toBe(1);
        expect(result.totalVolume).toBe(3 * 10 * 50);
        expect(result.averageSessionDuration).toBe(90);
    });

    it('getMemberProgressReport_twoSessionsDifferentDurations_computesCorrectAverageDuration', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({
            items: [makeSession(SESSION_ID_1, 60, 3, 10, 50), makeSession(SESSION_ID_2, 90, 3, 10, 50)],
            total: 2
        });
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.totalSessions).toBe(2);
        expect(result.averageSessionDuration).toBe(75);
    });

    it('getMemberProgressReport_twoSessionsSameExercise_aggregatesTotalSetsAndRepsAcrossSessions', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({
            items: [makeSession(SESSION_ID_1, 60, 3, 10, 50), makeSession(SESSION_ID_2, 60, 2, 8, 60)],
            total: 2
        });
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        const stat = result.exerciseBreakdown.find(e => e.exerciseId === EXERCISE_ID);
        expect(stat).toBeDefined();
        expect(stat!.totalSets).toBe(3 + 2);
        expect(stat!.totalReps).toBe(10 + 8);
        expect(stat!.sessionCount).toBe(2);
    });

    it('getMemberProgressReport_twoSessionsSameExercise_computesCorrectTotalVolume', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({
            items: [makeSession(SESSION_ID_1, 60, 3, 10, 50), makeSession(SESSION_ID_2, 60, 2, 8, 60)],
            total: 2
        });
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        const expectedVolume = (3 * 10 * 50) + (2 * 8 * 60);
        expect(result.totalVolume).toBe(expectedVolume);
    });

    it('getMemberProgressReport_validData_reportContainsMemberName', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.memberId).toBe(MEMBER_ID);
        expect(result.memberName).toBe('John Michael Doe');
        expect(result.startDate).toEqual(inputStartDate);
        expect(result.endDate).toEqual(inputEndDate);
    });

    it('getMemberProgressReport_exerciseBreakdown_sortedDescendingByTotalVolume', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        const inputSession: WorkoutSessionWithExercises = {
            id: SESSION_ID_1,
            memberId: MEMBER_ID,
            date: new Date('2024-06-15'),
            duration: 60,
            notes: null,
            exercises: [
                {
                    id: 'se-1', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-low',
                    sets: 1, reps: 1, weight: 10,
                    exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-low', name: 'Low Volume Exercise'},
                },
                {
                    id: 'se-2', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-high',
                    sets: 5, reps: 10, weight: 100,
                    exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-high', name: 'High Volume Exercise'},
                },
            ],
        };
        mockSessionRepo.findAll.mockResolvedValue({items: [inputSession], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.exerciseBreakdown[0].exerciseId).toBe('ex-high');
        expect(result.exerciseBreakdown[1].exerciseId).toBe('ex-low');
    });

    it('getMemberProgressReport_singleSessionWithTwoExercises_computesSessionTotalVolumeAsSumOfBoth', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        const inputSession: WorkoutSessionWithExercises = {
            id: SESSION_ID_1,
            memberId: MEMBER_ID,
            date: new Date('2024-06-15'),
            duration: 60,
            notes: null,
            exercises: [
                {
                    id: 'se-1', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-a',
                    sets: 3, reps: 10, weight: 50,
                    exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-a', name: 'Bench Press'},
                },
                {
                    id: 'se-2', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-b',
                    sets: 4, reps: 12, weight: 40,
                    exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-b', name: 'Overhead Press'},
                },
            ],
        };
        mockSessionRepo.findAll.mockResolvedValue({items: [inputSession], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        const expectedVolume = (3 * 10 * 50) + (4 * 12 * 40);
        expect(result.totalVolume).toBe(expectedVolume);
        expect(result.exerciseBreakdown).toHaveLength(2);
        expect(result.sessionDetails[0].totalVolume).toBe(expectedVolume);
    });

    it('getMemberProgressReport_sameExerciseTwiceInOneSession_sessionCountIsOne', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        const inputSession: WorkoutSessionWithExercises = {
            id: SESSION_ID_1,
            memberId: MEMBER_ID,
            date: new Date('2024-06-15'),
            duration: 60,
            notes: null,
            exercises: [
                {
                    id: 'se-1', workoutSessionId: SESSION_ID_1, exerciseId: EXERCISE_ID,
                    sets: 3, reps: 10, weight: 50,
                    exercise: MOCK_EXERCISE_ENTRY,
                },
                {
                    id: 'se-2', workoutSessionId: SESSION_ID_1, exerciseId: EXERCISE_ID,
                    sets: 2, reps: 8, weight: 55,
                    exercise: MOCK_EXERCISE_ENTRY,
                },
            ],
        };
        mockSessionRepo.findAll.mockResolvedValue({items: [inputSession], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        const stat = result.exerciseBreakdown.find(e => e.exerciseId === EXERCISE_ID);
        expect(stat!.sessionCount).toBe(1);
        expect(stat!.totalSets).toBe(3 + 2);
    });

    it('getMemberProgressReport_sessionWithNullNotes_sessionDetailNotesIsNull', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [makeSession(SESSION_ID_1, 60, 3, 10, 50)], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.sessionDetails[0].notes).toBeNull();
    });

    it('getMemberProgressReport_singleSession_averageDurationEqualsSessionDuration', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [makeSession(SESSION_ID_1, 75, 3, 10, 50)], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.averageSessionDuration).toBe(75);
    });

    it('getMemberProgressReport_sessionWithNonNullNotes_sessionDetailNotesIsPreserved', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        const sessionWithNotes: WorkoutSessionWithExercises = {
            ...makeSession(SESSION_ID_1, 60, 3, 10, 50),
            notes: 'Personal record on squats today',
        };
        mockSessionRepo.findAll.mockResolvedValue({items: [sessionWithNotes], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.sessionDetails[0].notes).toBe('Personal record on squats today');
    });

    it('getMemberProgressReport_exerciseWithZeroWeight_volumeIsZero', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [makeSession(SESSION_ID_1, 60, 3, 10, 0)], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = START_DATE;
        const inputEndDate = END_DATE;

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.totalVolume).toBe(0);
        const stat = result.exerciseBreakdown.find(e => e.exerciseId === EXERCISE_ID);
        expect(stat!.totalVolume).toBe(0);
    });

    it('getMemberProgressReport_startDateEqualsEndDate_returnsSingleDayReport', async () => {
        const sameDate = new Date('2024-06-15');
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [makeSession(SESSION_ID_1, 45, 3, 8, 60)], total: 1});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;

        const result = await service.getMemberProgressReport(inputId, sameDate, sameDate);

        expect(result.totalSessions).toBe(1);
        expect(result.startDate).toEqual(sameDate);
        expect(result.endDate).toEqual(sameDate);
    });

    it('getMemberProgressReport_validData_reportContainsCorrectDateRange', async () => {
        mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
        mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});
        const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
        const inputId = MEMBER_ID;
        const inputStartDate = new Date('2024-03-01');
        const inputEndDate = new Date('2024-09-30');

        const result = await service.getMemberProgressReport(inputId, inputStartDate, inputEndDate);

        expect(result.startDate).toEqual(inputStartDate);
        expect(result.endDate).toEqual(inputEndDate);
    });
});