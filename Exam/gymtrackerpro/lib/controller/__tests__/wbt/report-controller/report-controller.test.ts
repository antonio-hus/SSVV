jest.mock('@/lib/di', () => ({
    reportService: {
        getMemberProgressReport: jest.fn(),
    },
}));

import {reportService} from '@/lib/di';
import {Report} from '@/lib/domain/report';
import {NotFoundError} from '@/lib/domain/errors';
import {getMemberProgressReport} from '@/lib/controller/report-controller';

const reportServiceMock = reportService as unknown as {
    getMemberProgressReport: jest.Mock;
};

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

beforeEach(() => {
    jest.resetAllMocks();
});

describe('getMemberProgressReport', () => {

    describe('Independent Paths', () => {

        it('getMemberProgressReport_Path1_validInputServiceSucceeds_returnsReport', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = START_DATE;
            const inputEndDate: string = END_DATE;
            reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({success: true, data: MOCK_REPORT});
            expect(reportServiceMock.getMemberProgressReport).toHaveBeenCalledWith(
                MEMBER_ID,
                new Date(START_DATE),
                new Date(END_DATE),
            );
        });

        it('getMemberProgressReport_Path2_invalidStartDate_returnsValidationError', async () => {
            const inputMemberId: string = MEMBER_ID;
            const inputStartDate: string = 'not-a-date';
            const inputEndDate: string = END_DATE;

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
            reportServiceMock.getMemberProgressReport.mockRejectedValue(new Error('Database failure'));

            const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

            expect(result).toEqual({success: false, message: 'An unexpected error occurred'});
        });

    });

});