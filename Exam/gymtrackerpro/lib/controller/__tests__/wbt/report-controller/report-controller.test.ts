jest.mock('@/lib/di', () => ({
    reportService: {
        getMemberProgressReport: jest.fn(),
    },
}));

jest.mock('@/lib/schema/report-schema', () => ({
    memberProgressReportSchema: {safeParse: jest.fn()},
}));

import {z} from 'zod';
import {reportService} from '@/lib/di';
import {memberProgressReportSchema} from '@/lib/schema/report-schema';
import {Report} from '@/lib/domain/report';
import {NotFoundError} from '@/lib/domain/errors';
import {getMemberProgressReport} from '@/lib/controller/report-controller';

const reportServiceMock = reportService as unknown as {
    getMemberProgressReport: jest.Mock;
};

const memberProgressReportSchemaMock = memberProgressReportSchema as unknown as { safeParse: jest.Mock };

const MEMBER_ID: string = 'member-uuid-001';
const START_DATE: string = '2024-01-01';
const END_DATE: string = '2024-03-31';

const MOCK_REPORT: Report = {
    memberId: MEMBER_ID,
    memberName: 'John Doe',
    startDate: new Date(START_DATE),
    endDate: new Date(END_DATE),
    totalSessions: 24,
    totalVolume: 15000,
    averageSessionDuration: 60,
    exerciseBreakdown: [],
    sessionDetails: [],
};

const MOCK_VALID_PARSED_DATA = {
    memberId: MEMBER_ID,
    startDate: START_DATE,
    endDate: END_DATE,
};

const MOCK_ZOD_ERROR = (
    z.object({startDate: z.string().min(100)}).safeParse({}) as { success: false; error: z.ZodError }
).error;

beforeEach(() => {
    jest.resetAllMocks();
});

describe('getMemberProgressReport', () => {

    describe('Independent Paths', () => {

        it('getMemberProgressReport_Path1_validInputServiceSucceeds_returnsReport', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = START_DATE;
            const inputEndDate: string = END_DATE;
            memberProgressReportSchemaMock.safeParse.mockReturnValue({success: true, data: MOCK_VALID_PARSED_DATA});
            reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({success: true, data: MOCK_REPORT});
            expect(memberProgressReportSchemaMock.safeParse).toHaveBeenCalledWith({
                memberId: inputMemberId,
                startDate: inputStartDate,
                endDate: inputEndDate,
            });
            expect(reportServiceMock.getMemberProgressReport).toHaveBeenCalledWith(
                MEMBER_ID,
                new Date(START_DATE),
                new Date(END_DATE),
            );
        });

        it('getMemberProgressReport_Path2_invalidInput_returnsValidationError', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = 'not-a-date';
            const inputEndDate: string = END_DATE;
            memberProgressReportSchemaMock.safeParse.mockReturnValue({success: false, error: MOCK_ZOD_ERROR});

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({
                success: false,
                message: 'Validation failed',
                errors: expect.any(Object),
            });
            expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
        });

        it('getMemberProgressReport_Path3_serviceThrowsAppError_returnsAppErrorMessage', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = START_DATE;
            const inputEndDate: string = END_DATE;
            memberProgressReportSchemaMock.safeParse.mockReturnValue({success: true, data: MOCK_VALID_PARSED_DATA});
            reportServiceMock.getMemberProgressReport.mockRejectedValue(
                new NotFoundError(`Member not found: ${MEMBER_ID}`),
            );

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({success: false, message: `Member not found: ${MEMBER_ID}`});
        });

        it('getMemberProgressReport_Path4_serviceThrowsUnknownError_returnsGenericMessage', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = START_DATE;
            const inputEndDate: string = END_DATE;
            memberProgressReportSchemaMock.safeParse.mockReturnValue({success: true, data: MOCK_VALID_PARSED_DATA});
            reportServiceMock.getMemberProgressReport.mockRejectedValue(new Error('Database failure'));

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});