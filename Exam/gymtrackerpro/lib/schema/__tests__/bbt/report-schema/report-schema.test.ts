import {MemberProgressReportInput, memberProgressReportSchema} from '@/lib/schema/report-schema';

const VALID_REPORT_QUERY: MemberProgressReportInput = {
    memberId: 'member-abc-123',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
} as const;

describe('memberProgressReportSchema', () => {
    it('memberProgressReportSchema_allFieldsValid_parsesSuccessfully', () => {
        const inputValidReport = {...VALID_REPORT_QUERY};

        const result = memberProgressReportSchema.safeParse(inputValidReport);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_memberIdWhitespaceOnly_returnsValidationError', () => {
        const inputWhitespaceMemberId = {...VALID_REPORT_QUERY, memberId: '   '};

        const result = memberProgressReportSchema.safeParse(inputWhitespaceMemberId);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateEqualsEndDate_parsesSuccessfully', () => {
        const inputSameDates = {memberId: 'member-abc-123', startDate: '2024-06-15', endDate: '2024-06-15'};

        const result = memberProgressReportSchema.safeParse(inputSameDates);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_emptyMemberId_returnsValidationError', () => {
        const inputEmptyMemberId = {...VALID_REPORT_QUERY, memberId: ''};

        const result = memberProgressReportSchema.safeParse(inputEmptyMemberId);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Member ID is required')).toBe(true);
    });

    it('memberProgressReportSchema_missingMemberId_returnsValidationError', () => {
        const {memberId, ...inputWithoutMemberId} = VALID_REPORT_QUERY;

        const result = memberProgressReportSchema.safeParse(inputWithoutMemberId);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateWrongFormat_returnsValidationError', () => {
        const inputSlashStartDate = {...VALID_REPORT_QUERY, startDate: '01/01/2024'};

        const result = memberProgressReportSchema.safeParse(inputSlashStartDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Start date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('memberProgressReportSchema_startDateDashSeparatedDDMMYYYY_returnsValidationError', () => {
        const inputReversedStartDate = {...VALID_REPORT_QUERY, startDate: '01-01-2024'};

        const result = memberProgressReportSchema.safeParse(inputReversedStartDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Start date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('memberProgressReportSchema_missingStartDate_returnsValidationError', () => {
        const {startDate, ...inputWithoutStartDate} = VALID_REPORT_QUERY;

        const result = memberProgressReportSchema.safeParse(inputWithoutStartDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateLeapDay_parsesSuccessfully', () => {
        const inputLeapDay = {...VALID_REPORT_QUERY, startDate: '2024-02-29'};

        const result = memberProgressReportSchema.safeParse(inputLeapDay);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_startDateCalendarInvalidMonth13_parsesSuccessfully', () => {
        const inputMonth13 = {...VALID_REPORT_QUERY, startDate: '2024-13-01'};

        const result = memberProgressReportSchema.safeParse(inputMonth13);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_endDateWrongFormat_returnsValidationError', () => {
        const inputSlashEndDate = {...VALID_REPORT_QUERY, endDate: '12/31/2024'};

        const result = memberProgressReportSchema.safeParse(inputSlashEndDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'End date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('memberProgressReportSchema_endDateWithoutLeadingZeros_returnsValidationError', () => {
        const inputNoLeadingZerosEndDate = {...VALID_REPORT_QUERY, endDate: '2024-1-1'};

        const result = memberProgressReportSchema.safeParse(inputNoLeadingZerosEndDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'End date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('memberProgressReportSchema_missingEndDate_returnsValidationError', () => {
        const {endDate, ...inputWithoutEndDate} = VALID_REPORT_QUERY;

        const result = memberProgressReportSchema.safeParse(inputWithoutEndDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateValidAndEndDateInvalid_returnsValidationError', () => {
        const inputInvalidEndDate = {memberId: 'member-abc-123', startDate: '2024-01-01', endDate: 'invalid-date'};

        const result = memberProgressReportSchema.safeParse(inputInvalidEndDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateInvalidAndEndDateValid_returnsValidationError', () => {
        const inputInvalidStartDate = {memberId: 'member-abc-123', startDate: 'not-a-date', endDate: '2024-12-31'};

        const result = memberProgressReportSchema.safeParse(inputInvalidStartDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_startDateWithNoSeparators_returnsValidationError', () => {
        const inputNoSeparatorsStartDate = {...VALID_REPORT_QUERY, startDate: '20240101'};

        const result = memberProgressReportSchema.safeParse(inputNoSeparatorsStartDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_endDateWithExtraCharacters_returnsValidationError', () => {
        const inputDateTimeEndDate = {...VALID_REPORT_QUERY, endDate: '2024-12-31T00:00:00'};

        const result = memberProgressReportSchema.safeParse(inputDateTimeEndDate);

        expect(result.success).toBe(false);
    });

    it('memberProgressReportSchema_memberIdMinLength1Char_parsesSuccessfully', () => {
        const inputMinMemberId = {...VALID_REPORT_QUERY, memberId: 'a'};

        const result = memberProgressReportSchema.safeParse(inputMinMemberId);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_endDateLeapDay_parsesSuccessfully', () => {
        const inputLeapDayEnd = {...VALID_REPORT_QUERY, endDate: '2024-02-29'};

        const result = memberProgressReportSchema.safeParse(inputLeapDayEnd);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_startDateAfterEndDate_parsesSuccessfully', () => {
        const inputReversedRange = {...VALID_REPORT_QUERY, startDate: '2024-12-31', endDate: '2024-01-01'};

        const result = memberProgressReportSchema.safeParse(inputReversedRange);

        expect(result.success).toBe(true);
    });

    it('memberProgressReportSchema_endDateWithNoSeparators_returnsValidationError', () => {
        const inputNoSeparatorsEndDate = {...VALID_REPORT_QUERY, endDate: '20241231'};

        const result = memberProgressReportSchema.safeParse(inputNoSeparatorsEndDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'End date must be in YYYY-MM-DD format')).toBe(true);
    });
});