jest.mock('@/lib/di', () => ({
    reportService: {
        getMemberProgressReport: jest.fn(),
    },
}));

import {getMemberProgressReport} from '@/lib/controller/report-controller';
import {reportService} from '@/lib/di';
import {NotFoundError} from '@/lib/domain/errors';
import {Report} from '@/lib/domain/report';

const reportServiceMock = reportService as unknown as { getMemberProgressReport: jest.Mock };

const MOCK_REPORT: Report = {
    memberId: 'member-001',
    memberName: 'John Doe',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    totalSessions: 12,
    totalVolume: 45600,
    averageSessionDuration: 65,
    exerciseBreakdown: [],
    sessionDetails: [],
};

beforeEach(() => {
    reportServiceMock.getMemberProgressReport.mockReset();
});

describe('getMemberProgressReport', () => {
    it('getMemberProgressReport_validMemberIdAndDates_returnsSuccessWithReport', async () => {
        reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(true);
        expect((result as { success: true; data: Report }).data).toEqual(MOCK_REPORT);
    });

    it('getMemberProgressReport_validInput_passesCorrectArgumentsToService', async () => {
        reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(reportServiceMock.getMemberProgressReport).toHaveBeenCalledWith(
            'member-001',
            new Date('2024-01-01'),
            new Date('2024-03-31'),
        );
    });

    it('getMemberProgressReport_memberIdAtLowerBoundary1Char_passesValidation', async () => {
        reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);
        const inputMemberId = 'x';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(reportServiceMock.getMemberProgressReport).toHaveBeenCalled();
    });

    it('getMemberProgressReport_memberIdBelowLowerBoundary0Chars_returnsValidationError', async () => {
        const inputMemberId = '';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_memberIdWhitespaceOnly_returnsValidationError', async () => {
        const inputMemberId = '   ';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_startDateValidIsoFormat_passesValidation', async () => {
        reportServiceMock.getMemberProgressReport.mockResolvedValue(MOCK_REPORT);
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-06-15';
        const inputEndDate = '2024-12-31';

        await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(reportServiceMock.getMemberProgressReport).toHaveBeenCalled();
    });

    it('getMemberProgressReport_startDateSlashSeparated_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '01/01/2024';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_startDateDotSeparated_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '01.01.2024';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_startDateFreeText_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = 'not-a-date';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_startDateEmpty_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_endDateSlashSeparated_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '31/03/2024';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_endDateDotSeparated_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '31.03.2024';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_endDateFreeText_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = 'not-a-date';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_endDateEmpty_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_bothDatesInvalidFormat_returnsValidationError', async () => {
        const inputMemberId = 'member-001';
        const inputStartDate = '01/01/2024';
        const inputEndDate = '31-03-2024';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; errors?: Record<string, string[]> }).errors).toBeDefined();
        expect(reportServiceMock.getMemberProgressReport).not.toHaveBeenCalled();
    });

    it('getMemberProgressReport_serviceThrowsNotFoundError_returnsFailureWithMessage', async () => {
        reportServiceMock.getMemberProgressReport.mockRejectedValue(new NotFoundError('Member not found'));
        const inputMemberId = 'nonexistent-member';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('Member not found');
    });

    it('getMemberProgressReport_serviceThrowsUnexpectedError_returnsGenericFailure', async () => {
        reportServiceMock.getMemberProgressReport.mockRejectedValue(new Error('DB error'));
        const inputMemberId = 'member-001';
        const inputStartDate = '2024-01-01';
        const inputEndDate = '2024-03-31';

        const result = await getMemberProgressReport(inputMemberId, inputStartDate, inputEndDate);

        expect(result.success).toBe(false);
        expect((result as { success: false; message: string }).message).toBe('An unexpected error occurred');
    });
});