import {mock, mockReset} from 'jest-mock-extended';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {ReportService} from '@/lib/service/report-service';
import {MuscleGroup} from '@/lib/domain/exercise';

const mockWorkoutSessionRepo = mock<WorkoutSessionRepositoryInterface>();
const mockUserRepo = mock<UserRepositoryInterface>();

const MEMBER_ID: string = 'member-uuid-001';
const START_DATE: Date = new Date('2024-01-01');
const END_DATE: Date = new Date('2024-01-31');

const MOCK_MEMBER = {
    id: MEMBER_ID,
    userId: 'user-uuid-001',
    user: {fullName: 'John Doe'},
    membershipStart: new Date('2024-01-01'),
    isActive: true,
};

const makeEntry = (
    exerciseId: string,
    exerciseName: string,
    sets: number,
    reps: number,
    weight: number,
    sessionId: string,
) => {
    return {
        exerciseId,
        sets,
        reps,
        weight,
        exercise: {name: exerciseName, muscleGroup: MuscleGroup.ARMS},
        sessionId,
    };
};

const makeSession = (
    id: string,
    date: Date,
    duration: number,
    entries: ReturnType<typeof makeEntry>[],
    notes: string | null = null,
) => {
    return {id, date, duration, notes, exercises: entries};
};

const sessionEmpty = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, []);
};

const sessionOne = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 2, 5, 10, id),
    ]);
};

const sessionSameExTwice = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 3, 10, 20, id),
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 2, 8, 20, id),
    ]);
};

const sessionMDistinct = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 1, 5, 10, id),
        makeEntry(`ex_s${idx}_2`, `Exercise S${idx}-2`, 2, 8, 20, id),
    ]);
};

const sessionNMinus1Distinct = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 1, 5, 10, id),
        makeEntry(`ex_s${idx}_2`, `Exercise S${idx}-2`, 2, 8, 20, id),
        makeEntry(`ex_s${idx}_3`, `Exercise S${idx}-3`, 3, 6, 100, id),
    ]);
};

const sessionNDistinct = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 1, 5, 10, id),
        makeEntry(`ex_s${idx}_2`, `Exercise S${idx}-2`, 2, 8, 20, id),
        makeEntry(`ex_s${idx}_3`, `Exercise S${idx}-3`, 3, 6, 100, id),
        makeEntry(`ex_s${idx}_4`, `Exercise S${idx}-4`, 4, 10, 80, id),
    ]);
};

const sessionNPlus1Distinct = (idx: number) => {
    const id = `sess${idx}`;
    return makeSession(id, new Date(`2024-01-${String(idx).padStart(2, '0')}`), 30, [
        makeEntry(`ex_s${idx}_1`, `Exercise S${idx}-1`, 1, 5, 10, id),
        makeEntry(`ex_s${idx}_2`, `Exercise S${idx}-2`, 2, 8, 20, id),
        makeEntry(`ex_s${idx}_3`, `Exercise S${idx}-3`, 3, 6, 100, id),
        makeEntry(`ex_s${idx}_4`, `Exercise S${idx}-4`, 4, 10, 80, id),
        makeEntry(`ex_s${idx}_5`, `Exercise S${idx}-5`, 5, 12, 60, id),
    ]);
};

const VOL_ONE = 2 * 5 * 10;
const VOL_SAME_TWICE = 3 * 10 * 20 + 2 * 8 * 20;
const VOL_M = 5 * 10 + 2 * 8 * 20;
const VOL_N_MINUS1 = 5 * 10 + 2 * 8 * 20 + 3 * 6 * 100;
const VOL_N = VOL_N_MINUS1 + 4 * 10 * 80;
const VOL_N_PLUS1 = VOL_N + 5 * 12 * 60;

beforeEach(() => {
    mockReset(mockWorkoutSessionRepo);
    mockReset(mockUserRepo);
    (ReportService as unknown as { instance: unknown }).instance = undefined;
    mockUserRepo.findMemberById.mockResolvedValue(MOCK_MEMBER as never);
});

describe('getMemberProgressReport', () => {

    describe('Independent Paths', () => {

        it('Path1_outerOnce_innerOnce_D1True_loopForOnce_D2True', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [sessionOne(1)];
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalSessions).toBe(1);
            expect(result.totalVolume).toBe(VOL_ONE);
            expect(result.averageSessionDuration).toBe(30);
            expect(result.memberName).toBe('John Doe');
            expect(result.exerciseBreakdown).toHaveLength(1);
            expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_1');
            expect(result.exerciseBreakdown[0].totalSets).toBe(2);
            expect(result.exerciseBreakdown[0].totalReps).toBe(5);
            expect(result.exerciseBreakdown[0].totalVolume).toBe(VOL_ONE);
            expect(result.exerciseBreakdown[0].sessionCount).toBe(1);
            expect(result.sessionDetails).toHaveLength(1);
            expect(result.sessionDetails[0].exercises).toHaveLength(1);
            expect(result.sessionDetails[0].totalVolume).toBe(VOL_ONE);
        });

        it('Path2_outerZero_loopForZero_D2False_averageDurationZero', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: [], total: 0} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalSessions).toBe(0);
            expect(result.totalVolume).toBe(0);
            expect(result.averageSessionDuration).toBe(0);
            expect(result.exerciseBreakdown).toHaveLength(0);
            expect(result.sessionDetails).toHaveLength(0);
        });

        it('Path3_outerOnce_innerZero_loopForZero_D2True', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [sessionEmpty(1)];
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalSessions).toBe(1);
            expect(result.totalVolume).toBe(0);
            expect(result.averageSessionDuration).toBe(30);
            expect(result.exerciseBreakdown).toHaveLength(0);
            expect(result.sessionDetails).toHaveLength(1);
            expect(result.sessionDetails[0].exercises).toHaveLength(0);
        });

        it('Path4_outerOnce_innerTwiceSameEx_D1TrueThenFalse', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [sessionSameExTwice(1)];
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.exerciseBreakdown).toHaveLength(1);
            expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_1');
            expect(result.exerciseBreakdown[0].totalSets).toBe(5);
            expect(result.exerciseBreakdown[0].totalReps).toBe(18);
            expect(result.exerciseBreakdown[0].totalVolume).toBe(VOL_SAME_TWICE);
            expect(result.exerciseBreakdown[0].sessionCount).toBe(1);
            expect(result.sessionDetails).toHaveLength(1);
            expect(result.sessionDetails[0].exercises).toHaveLength(2);
        });

        it('Path5_outerTwice_innerOncePerSession', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [sessionOne(1), sessionOne(2)];
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.totalSessions).toBe(2);
            expect(result.totalVolume).toBe(VOL_ONE * 2);
            expect(result.averageSessionDuration).toBe(30);
            expect(result.exerciseBreakdown).toHaveLength(2);
        });

        it('Path6_outerOnce_innerTwoDistinct_loopForTwice_sortedDescByVolume', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: Date = START_DATE;
            const inputEndDate: Date = END_DATE;
            const sessions = [sessionMDistinct(1)];
            mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

            const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
            const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result.exerciseBreakdown).toHaveLength(2);
            expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_2');
            expect(result.exerciseBreakdown[1].exerciseId).toBe('ex_s1_1');
        });

    });

    describe('Loop Coverage', () => {

        describe('Outer_0', () => {

            it('Outer0_InnerNA_noSessions', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: [], total: 0} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(0);
                expect(result.totalVolume).toBe(0);
                expect(result.averageSessionDuration).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.sessionDetails).toHaveLength(0);
            });

        });

        describe('Outer_1', () => {

            it('Outer1_Inner0_sessionEmpty', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionEmpty(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(1);
                expect(result.totalVolume).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(0);
            });

            it('Outer1_Inner1_oneExercise', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionOne(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(1);
                expect(result.totalVolume).toBe(VOL_ONE);
                expect(result.exerciseBreakdown).toHaveLength(1);
                expect(result.exerciseBreakdown[0].sessionCount).toBe(1);
                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(1);
            });

            it('Outer1_Inner2_sameExerciseTwice_D1BothBranches', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionSameExTwice(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(2);
                expect(result.exerciseBreakdown).toHaveLength(1);
                expect(result.exerciseBreakdown[0].totalSets).toBe(5);
                expect(result.exerciseBreakdown[0].totalVolume).toBe(VOL_SAME_TWICE);
            });

            it('Outer1_InnerM_twoDistinctExercises', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionMDistinct(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(2);
                expect(result.exerciseBreakdown).toHaveLength(2);
                expect(result.totalVolume).toBe(VOL_M);
                expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_2');
            });

            it('Outer1_InnerNMinus1_threeDistinctExercises', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNMinus1Distinct(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(3);
                expect(result.exerciseBreakdown).toHaveLength(3);
                expect(result.totalVolume).toBe(VOL_N_MINUS1);
                expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_3');
            });

            it('Outer1_InnerN_fourDistinctExercises', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNDistinct(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(4);
                expect(result.exerciseBreakdown).toHaveLength(4);
                expect(result.totalVolume).toBe(VOL_N);
                expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_4');
            });

            it('Outer1_InnerNPlus1_fiveDistinctExercises', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNPlus1Distinct(1)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 1} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.sessionDetails).toHaveLength(1);
                expect(result.sessionDetails[0].exercises).toHaveLength(5);
                expect(result.exerciseBreakdown).toHaveLength(5);
                expect(result.totalVolume).toBe(VOL_N_PLUS1);
                expect(result.exerciseBreakdown[0].exerciseId).toBe('ex_s1_5');
            });

        });

        describe('Outer_2', () => {

            it('Outer2_Inner0_allSessionsEmpty', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionEmpty(1), sessionEmpty(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.sessionDetails).toHaveLength(2);
                expect(result.sessionDetails[0].exercises).toHaveLength(0);
                expect(result.sessionDetails[1].exercises).toHaveLength(0);
            });

            it('Outer2_Inner1_oneExercisePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionOne(1), sessionOne(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_ONE * 2);
                expect(result.exerciseBreakdown).toHaveLength(2);
                expect(result.exerciseBreakdown[0].sessionCount).toBe(1);
                expect(result.exerciseBreakdown[1].sessionCount).toBe(1);
            });

            it('Outer2_Inner2_sameExerciseTwicePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionSameExTwice(1), sessionSameExTwice(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_SAME_TWICE * 2);
                expect(result.exerciseBreakdown).toHaveLength(2);
                expect(result.exerciseBreakdown[0].totalSets).toBe(5);
                expect(result.exerciseBreakdown[1].totalSets).toBe(5);
            });

            it('Outer2_InnerM_twoDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionMDistinct(1), sessionMDistinct(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_M * 2);
                expect(result.exerciseBreakdown).toHaveLength(4);
            });

            it('Outer2_InnerNMinus1_threeDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNMinus1Distinct(1), sessionNMinus1Distinct(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_N_MINUS1 * 2);
                expect(result.exerciseBreakdown).toHaveLength(6);
            });

            it('Outer2_InnerN_fourDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNDistinct(1), sessionNDistinct(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_N * 2);
                expect(result.exerciseBreakdown).toHaveLength(8);
            });

            it('Outer2_InnerNPlus1_fiveDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = [sessionNPlus1Distinct(1), sessionNPlus1Distinct(2)];
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 2} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(2);
                expect(result.totalVolume).toBe(VOL_N_PLUS1 * 2);
                expect(result.exerciseBreakdown).toHaveLength(10);
            });

        });

        describe('Outer_NMinus1 (outer=4, n=5)', () => {

            it('Outer_NMinus1_Inner0_allSessionsEmpty', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionEmpty(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_NMinus1_Inner1_oneExercisePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionOne(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_ONE * 4);
                expect(result.exerciseBreakdown).toHaveLength(4);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_NMinus1_Inner2_sameExerciseTwicePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionSameExTwice(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_SAME_TWICE * 4);
                expect(result.exerciseBreakdown).toHaveLength(4);
            });

            it('Outer_NMinus1_InnerM_twoDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionMDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_M * 4);
                expect(result.exerciseBreakdown).toHaveLength(8);
            });

            it('Outer_NMinus1_InnerNMinus1_threeDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionNMinus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_N_MINUS1 * 4);
                expect(result.exerciseBreakdown).toHaveLength(12);
            });

            it('Outer_NMinus1_InnerN_fourDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionNDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_N * 4);
                expect(result.exerciseBreakdown).toHaveLength(16);
            });

            it('Outer_NMinus1_InnerNPlus1_fiveDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 4}, (_, i) => sessionNPlus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 4} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(4);
                expect(result.totalVolume).toBe(VOL_N_PLUS1 * 4);
                expect(result.exerciseBreakdown).toHaveLength(20);
            });

        });

        describe('Outer_N (outer=5, n=5)', () => {

            it('Outer_N_Inner0_allSessionsEmpty', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionEmpty(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_N_Inner1_oneExercisePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionOne(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_ONE * 5);
                expect(result.exerciseBreakdown).toHaveLength(5);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_N_Inner2_sameExerciseTwicePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionSameExTwice(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_SAME_TWICE * 5);
                expect(result.exerciseBreakdown).toHaveLength(5);
            });

            it('Outer_N_InnerM_twoDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionMDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_M * 5);
                expect(result.exerciseBreakdown).toHaveLength(10);
            });

            it('Outer_N_InnerNMinus1_threeDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionNMinus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_N_MINUS1 * 5);
                expect(result.exerciseBreakdown).toHaveLength(15);
            });

            it('Outer_N_InnerN_fourDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionNDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_N * 5);
                expect(result.exerciseBreakdown).toHaveLength(20);
            });

            it('Outer_N_InnerNPlus1_fiveDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 5}, (_, i) => sessionNPlus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 5} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(5);
                expect(result.totalVolume).toBe(VOL_N_PLUS1 * 5);
                expect(result.exerciseBreakdown).toHaveLength(25);
            });

        });

        describe('Outer_NPlus1 (outer=6, n=5)', () => {

            it('Outer_NPlus1_Inner0_allSessionsEmpty', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionEmpty(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(0);
                expect(result.exerciseBreakdown).toHaveLength(0);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_NPlus1_Inner1_oneExercisePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionOne(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_ONE * 6);
                expect(result.exerciseBreakdown).toHaveLength(6);
                expect(result.averageSessionDuration).toBe(30);
            });

            it('Outer_NPlus1_Inner2_sameExerciseTwicePerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionSameExTwice(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_SAME_TWICE * 6);
                expect(result.exerciseBreakdown).toHaveLength(6);
            });

            it('Outer_NPlus1_InnerM_twoDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionMDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_M * 6);
                expect(result.exerciseBreakdown).toHaveLength(12);
            });

            it('Outer_NPlus1_InnerNMinus1_threeDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionNMinus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_N_MINUS1 * 6);
                expect(result.exerciseBreakdown).toHaveLength(18);
            });

            it('Outer_NPlus1_InnerN_fourDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionNDistinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_N * 6);
                expect(result.exerciseBreakdown).toHaveLength(24);
            });

            it('Outer_NPlus1_InnerNPlus1_fiveDistinctPerSession', async () => {
                const inputMemberId: string = MEMBER_ID;
                const inputStartDate: Date = START_DATE;
                const inputEndDate: Date = END_DATE;
                const sessions = Array.from({length: 6}, (_, i) => sessionNPlus1Distinct(i + 1));
                mockWorkoutSessionRepo.findAll.mockResolvedValue({items: sessions, total: 6} as never);

                const service = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);
                const result = await service.getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

                expect(result.totalSessions).toBe(6);
                expect(result.totalVolume).toBe(VOL_N_PLUS1 * 6);
                expect(result.exerciseBreakdown).toHaveLength(30);
            });

        });

    });

});

/**
 * Singleton creation check.
 * Provided for enhanced coverage.
 * Not included in the scope of GymTrackerPro testing.
 */
describe('getInstance', () => {

    it('getInstance_Path1_returnsValidInstance', () => {
        const instance = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);

        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(ReportService);
    });

    it('getInstance_Path2_returnsExactSameInstanceOnSubsequentCalls', () => {
        const firstCall = ReportService.getInstance(mockWorkoutSessionRepo, mockUserRepo);

        const secondWsRepo = mock<WorkoutSessionRepositoryInterface>();
        const secondUserRepo = mock<UserRepositoryInterface>();
        const secondCall = ReportService.getInstance(secondWsRepo, secondUserRepo);

        expect(secondCall).toBe(firstCall);

        const internalWsRepo = (secondCall as unknown as { workoutSessionRepository: unknown }).workoutSessionRepository;
        const internalUserRepo = (secondCall as unknown as { userRepository: unknown }).userRepository;

        expect(internalWsRepo).toBe(mockWorkoutSessionRepo);
        expect(internalUserRepo).toBe(mockUserRepo);
        expect(internalWsRepo).not.toBe(secondWsRepo);
        expect(internalUserRepo).not.toBe(secondUserRepo);
    });

});