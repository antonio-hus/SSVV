jest.mock('@/lib/di', () => ({
    reportService: {
        getMemberProgressReport: jest.fn(),
    },
}));

import {getMemberProgressReport} from '@/lib/controller/report-controller';
import {reportService} from '@/lib/di';
import {NotFoundError} from '@/lib/domain/errors';
import {Report, ExerciseStats, SessionDetail} from '@/lib/domain/report';
import {ActionResult} from "@/lib/domain/action-result";

const reportServiceMock = reportService as unknown as { getMemberProgressReport: jest.Mock };

const MEMBER_ID: string = 'member-uuid-001';
const START_DATE_STR: string = '2024-01-01';
const END_DATE_STR: string = '2024-12-31';
const START_DATE: Date = new Date(START_DATE_STR);
const END_DATE: Date = new Date(END_DATE_STR);

const MOCK_EXERCISE_STATS: ExerciseStats = {
    exerciseId: 'ex-uuid-001',
    exerciseName: 'Bench Press',
    muscleGroup: 'CHEST',
    totalSets: 12,
    totalReps: 120,
    totalVolume: 6000,
    sessionCount: 4,
};

const MOCK_SESSION_DETAIL: SessionDetail = {
    sessionId: 'sess-uuid-001',
    date: new Date('2024-06-15'),
    durationMinutes: 60,
    notes: 'Good session',
    totalVolume: 1500,
    exercises: [
        {
            exerciseId: 'ex-uuid-001',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            weight: 50,
            volume: 1500,
        }
    ],
};

const MOCK_REPORT: Report = {
    memberId: MEMBER_ID,
    memberName: 'John Michael Doe',
    startDate: START_DATE,
    endDate: END_DATE,
    totalSessions: 1,
    totalVolume: 1500,
    averageSessionDuration: 60,
    exerciseBreakdown: [MOCK_EXERCISE_STATS],
    sessionDetails: [MOCK_SESSION_DETAIL],
};

const EMPTY_REPORT: Report = {
    memberId: MEMBER_ID,
    memberName: 'John Michael Doe',
    startDate: START_DATE,
    endDate: END_DATE,
    totalSessions: 0,
    totalVolume: 0,
    averageSessionDuration: 0,
    exerciseBreakdown: [],
    sessionDetails: [],
};

beforeEach(() => {
    reportServiceMock.getMemberProgressReport.mockReset();
});

describe('getMemberProgressReport', () => {
    describe('Equivalence Classes', () => {
        it('getMemberProgressReport_EC_allFieldsValid_returnsSuccessWithReport', async () => {
            reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);

            const result: ActionResult<Report> = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(MOCK_REPORT);
                expect(result.data.memberId).toBe(MEMBER_ID);
                expect(result.data.exerciseBreakdown).toHaveLength(1);
                expect(result.data.sessionDetails).toHaveLength(1);
            }
        });

        it('getMemberProgressReport_EC_noSessionsInRange_returnsZeroStats', async () => {
            reportServiceMock.getMemberProgressReport.mockResolvedValue(EMPTY_REPORT);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.totalSessions).toBe(0);
                expect(result.data.totalVolume).toBe(0);
                expect(result.data.averageSessionDuration).toBe(0);
                expect(result.data.exerciseBreakdown).toHaveLength(0);
            }
        });

        it('getMemberProgressReport_EC_multipleSessions_computesCorrectAggregates', async () => {
            const multiSessionReport: Report = {
                ...MOCK_REPORT,
                totalSessions: 2,
                totalVolume: 3000,
                averageSessionDuration: 75,
                sessionDetails: [
                    MOCK_SESSION_DETAIL,
                    {...MOCK_SESSION_DETAIL, sessionId: 'sess-002', durationMinutes: 90}
                ]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(multiSessionReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.totalSessions).toBe(2);
                expect(result.data.averageSessionDuration).toBe(75);
                expect(result.data.totalVolume).toBe(3000);
            }
        });

        it('getMemberProgressReport_EC_multipleExercises_aggregatesCorrectly', async () => {
            const multiExerciseReport: Report = {
                ...MOCK_REPORT,
                exerciseBreakdown: [
                    MOCK_EXERCISE_STATS,
                    {...MOCK_EXERCISE_STATS, exerciseId: 'ex-002', exerciseName: 'Squat', totalVolume: 8000}
                ]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(multiExerciseReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseBreakdown).toHaveLength(2);
                expect(result.data.exerciseBreakdown[1].exerciseName).toBe('Squat');
            }
        });

        it('getMemberProgressReport_EC_sortingByVolumeDescending', async () => {
            const sortedReport: Report = {
                ...MOCK_REPORT,
                exerciseBreakdown: [
                    {...MOCK_EXERCISE_STATS, exerciseId: 'ex-high', totalVolume: 10000},
                    {...MOCK_EXERCISE_STATS, exerciseId: 'ex-low', totalVolume: 1000}
                ]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(sortedReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseBreakdown[0].totalVolume).toBeGreaterThan(result.data.exerciseBreakdown[1].totalVolume);
                expect(result.data.exerciseBreakdown[0].exerciseId).toBe('ex-high');
            }
        });

        it('getMemberProgressReport_EC_missingMemberId_returnsValidationError', async () => {
            const result = await getMemberProgressReport(undefined as unknown as string, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('getMemberProgressReport_EC_missingStartDate_returnsValidationError', async () => {
            const result = await getMemberProgressReport(MEMBER_ID, undefined as unknown as string, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.startDate).toBeDefined();
            }
        });

        it('getMemberProgressReport_EC_missingEndDate_returnsValidationError', async () => {
            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, undefined as unknown as string);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.endDate).toBeDefined();
            }
        });

        it('getMemberProgressReport_EC_startDateWrongFormat_returnsValidationError', async () => {
            const result = await getMemberProgressReport(MEMBER_ID, '2024.01.01', END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.startDate).toBeDefined();
            }
        });

        it('getMemberProgressReport_EC_endDateWrongFormat_returnsValidationError', async () => {
            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, '12/31/2024');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.endDate).toBeDefined();
            }
        });

        it('getMemberProgressReport_EC_memberNotFound_returnsFailureWithMessage', async () => {
            reportServiceMock.getMemberProgressReport.mockRejectedValue(new NotFoundError('Member not found'));

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('Member not found');
            }
        });

        it('getMemberProgressReport_EC_unexpectedError_returnsGenericFailure', async () => {
            reportServiceMock.getMemberProgressReport.mockRejectedValue(new Error('Internal failure'));

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toBe('An unexpected error occurred');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('getMemberProgressReport_BVA_memberId0Chars_returnsValidationError', async () => {
            const result = await getMemberProgressReport('', START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('getMemberProgressReport_BVA_memberId1Char_returnsSuccess', async () => {
            const inputId = 'A';
            const expectedReport = {...MOCK_REPORT, memberId: inputId};
            reportServiceMock.getMemberProgressReport.mockResolvedValue(expectedReport);

            const result = await getMemberProgressReport(inputId, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputId);
            }
        });

        it('getMemberProgressReport_BVA_memberId2Chars_returnsSuccess', async () => {
            const inputId = 'AB';
            const expectedReport = {...MOCK_REPORT, memberId: inputId};
            reportServiceMock.getMemberProgressReport.mockResolvedValue(expectedReport);

            const result = await getMemberProgressReport(inputId, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputId);
            }
        });

        it('getMemberProgressReport_BVA_memberIdWhitespace_returnsValidationError', async () => {
            const result = await getMemberProgressReport('   ', START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors?.memberId).toBeDefined();
            }
        });

        it('getMemberProgressReport_BVA_memberIdWithSurroundingWhitespace_parsesSuccessfully', async () => {
            reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);

            const result = await getMemberProgressReport('  ' + MEMBER_ID + '  ', START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(MEMBER_ID);
            }
        });

        it('getMemberProgressReport_BVA_startDateSameAsEndDate_returnsSuccess', async () => {
            const sameDateStr = '2024-06-15';
            const sameDate = new Date(sameDateStr);
            const expectedReport = {
                ...MOCK_REPORT,
                startDate: sameDate,
                endDate: sameDate
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(expectedReport);

            const result = await getMemberProgressReport(MEMBER_ID, sameDateStr, sameDateStr);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.startDate).toEqual(sameDate);
                expect(result.data.endDate).toEqual(sameDate);
            }
        });

        it('getMemberProgressReport_BVA_weightZero_returnsReportWithZeroVolume', async () => {
            const zeroVolumeReport: Report = {
                ...MOCK_REPORT,
                totalVolume: 0,
                exerciseBreakdown: [{...MOCK_EXERCISE_STATS, totalVolume: 0}],
                sessionDetails: [{...MOCK_SESSION_DETAIL, totalVolume: 0, exercises: [{...MOCK_SESSION_DETAIL.exercises[0], weight: 0, volume: 0}]}]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(zeroVolumeReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.totalVolume).toBe(0);
                expect(result.data.exerciseBreakdown[0].totalVolume).toBe(0);
            }
        });

        it('getMemberProgressReport_BVA_repsZero_returnsReportWithZeroVolume', async () => {
            const zeroVolumeReport: Report = {
                ...MOCK_REPORT,
                totalVolume: 0,
                exerciseBreakdown: [{...MOCK_EXERCISE_STATS, totalVolume: 0}],
                sessionDetails: [{...MOCK_SESSION_DETAIL, totalVolume: 0, exercises: [{...MOCK_SESSION_DETAIL.exercises[0], reps: 0, volume: 0}]}]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(zeroVolumeReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.totalVolume).toBe(0);
            }
        });

        it('getMemberProgressReport_BVA_durationZero_returnsReportWithZeroAverageDuration', async () => {
            const zeroDurationReport: Report = {
                ...MOCK_REPORT,
                averageSessionDuration: 0,
                sessionDetails: [{...MOCK_SESSION_DETAIL, durationMinutes: 0}]
            };
            reportServiceMock.getMemberProgressReport.mockResolvedValue(zeroDurationReport);

            const result = await getMemberProgressReport(MEMBER_ID, START_DATE_STR, END_DATE_STR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.averageSessionDuration).toBe(0);
            }
        });
    });
});
