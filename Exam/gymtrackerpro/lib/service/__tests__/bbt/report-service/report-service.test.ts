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

const MEMBER_ID: string = 'member-uuid-001';
const SESSION_ID_1: string = 'session-uuid-001';
const SESSION_ID_2: string = 'session-uuid-002';
const EXERCISE_ID: string = 'exercise-uuid-001';

const MOCK_MEMBER: MemberWithUser = {
    id: MEMBER_ID,
    userId: 'user-uuid-001',
    membershipStart: new Date('2024-01-01'),
    isActive: true,
    user: {
        id: 'user-uuid-001',
        email: 'john@example.com',
        fullName: 'John Michael Doe',
        phone: '+40712345678',
        dateOfBirth: new Date('1990-01-15'),
        passwordHash: 'hashed',
        role: 'MEMBER',
    },
};

const MOCK_EXERCISE_ENTRY: Exercise = {
    id: EXERCISE_ID,
    name: 'Bench Press',
    description: 'Chest exercise',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
    isActive: true,
};

const makeSession = (id: string, duration: number, sets: number, reps: number, weight: number, date = new Date('2024-06-15')): WorkoutSessionWithExercises => ({
    id,
    memberId: MEMBER_ID,
    date,
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
    describe('Equivalence Classes', () => {
        it('getMemberProgressReport_EC_memberNotFound_throwsNotFoundError', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            await expect(act).rejects.toThrow(NotFoundError);
            await expect(act).rejects.toThrow('Member not found');
        });

        it('getMemberProgressReport_EC_noSessionsInRange_returnsZeroStats', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.memberId).toBe(MEMBER_ID);
            expect(result.memberName).toBe(MOCK_MEMBER.user.fullName);
            expect(result.totalSessions).toBe(0);
            expect(result.totalVolume).toBe(0);
            expect(result.averageSessionDuration).toBe(0);
            expect(result.exerciseBreakdown).toHaveLength(0);
            expect(result.sessionDetails).toHaveLength(0);
        });

        it('getMemberProgressReport_EC_multipleSessions_computesCorrectAggregates', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [
                makeSession(SESSION_ID_1, 60, 3, 10, 50),
                makeSession(SESSION_ID_2, 90, 3, 10, 50)
            ];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({
                items: sessions,
                total: 2
            });

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalSessions).toBe(2);
            expect(result.averageSessionDuration).toBe(75);
            expect(result.totalVolume).toBe(3000); // (3*10*50) * 2
            expect(result.exerciseBreakdown).toHaveLength(1);
            expect(result.exerciseBreakdown[0].exerciseId).toBe(EXERCISE_ID);
            expect(result.exerciseBreakdown[0].sessionCount).toBe(2);
            expect(result.exerciseBreakdown[0].totalVolume).toBe(3000);
            expect(result.sessionDetails).toHaveLength(2);
            expect(result.sessionDetails[0].sessionId).toBe(SESSION_ID_1);
            expect(result.sessionDetails[1].sessionId).toBe(SESSION_ID_2);
        });

        it('getMemberProgressReport_EC_multipleExercises_aggregatesCorrectly', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const inputSessions: WorkoutSessionWithExercises[] = [{
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
            }];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: inputSessions, total: 1});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.exerciseBreakdown).toHaveLength(2);
            const bench = result.exerciseBreakdown.find(e => e.exerciseId === 'ex-a');
            const ohp = result.exerciseBreakdown.find(e => e.exerciseId === 'ex-b');
            expect(bench?.totalVolume).toBe(1500);
            expect(ohp?.totalVolume).toBe(1920);
            expect(result.totalVolume).toBe(1500 + 1920);
        });

        it('getMemberProgressReport_EC_sortingByVolumeDescending', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const inputSessions: WorkoutSessionWithExercises[] = [{
                id: SESSION_ID_1,
                memberId: MEMBER_ID,
                date: new Date('2024-06-15'),
                duration: 60,
                notes: null,
                exercises: [
                    {
                        id: 'se-1', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-low',
                        sets: 1, reps: 1, weight: 1,
                        exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-low', name: 'Light'},
                    },
                    {
                        id: 'se-2', workoutSessionId: SESSION_ID_1, exerciseId: 'ex-high',
                        sets: 10, reps: 10, weight: 100,
                        exercise: {...MOCK_EXERCISE_ENTRY, id: 'ex-high', name: 'Heavy'},
                    },
                ],
            }];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: inputSessions, total: 1});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.exerciseBreakdown[0].exerciseId).toBe('ex-high');
            expect(result.exerciseBreakdown[1].exerciseId).toBe('ex-low');
            expect(result.exerciseBreakdown[0].totalVolume).toBeGreaterThan(result.exerciseBreakdown[1].totalVolume);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getMemberProgressReport_BVA_emptyId_throwsNotFoundError', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = '';
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getMemberProgressReport_BVA_inexistentOneCharId_throwsNotFoundError', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = 'a';
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockUserRepo.findMemberById.mockRejectedValue(new NotFoundError('Member not found'));

            const act = service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            await expect(act).rejects.toThrow(NotFoundError);
        });

        it('getMemberProgressReport_BVA_existingOneCharId_returnsReport', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = 'a';
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockUserRepo.findMemberById.mockResolvedValue({...MOCK_MEMBER, id: 'a'});
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.memberId).toBe('a');
            expect(result.totalSessions).toBe(0);
        });

        it('getMemberProgressReport_BVA_startDateEqualsEndDate_returnsReport', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const sameDate: Date = new Date('2024-06-15');
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: [], total: 0});

            const result = await service.getMemberProgressReport(inputMemberId, sameDate, sameDate);

            expect(result.startDate).toEqual(sameDate);
            expect(result.endDate).toEqual(sameDate);
        });

        it('getMemberProgressReport_BVA_weightZero_returnsReportWithZeroVolume', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const inputSessions: WorkoutSessionWithExercises[] = [makeSession(SESSION_ID_1, 60, 3, 10, 0)];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: inputSessions, total: 1});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalVolume).toBe(0);
            expect(result.exerciseBreakdown[0].totalVolume).toBe(0);
        });

        it('getMemberProgressReport_BVA_repsZero_returnsReportWithZeroVolume', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const inputSessions: WorkoutSessionWithExercises[] = [makeSession(SESSION_ID_1, 60, 3, 0, 50)];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: inputSessions, total: 1});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalVolume).toBe(0);
            expect(result.exerciseBreakdown[0].totalVolume).toBe(0);
        });

        it('getMemberProgressReport_BVA_durationZero_returnsReportWithZeroAverageDuration', async () => {
            const service = ReportService.getInstance(mockSessionRepo, mockUserRepo);
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const inputSessions: WorkoutSessionWithExercises[] = [makeSession(SESSION_ID_1, 0, 3, 10, 50)];
            mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER);
            mockSessionRepo.findAll.mockResolvedValue({items: inputSessions, total: 1});

            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.averageSessionDuration).toBe(0);
            expect(result.totalSessions).toBe(1);
        });
    });
});
