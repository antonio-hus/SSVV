import {MemberProgressReportInput, memberProgressReportSchema} from '@/lib/schema/report-schema';

const VALID_QUERY: MemberProgressReportInput = {
    memberId: 'member-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
};

describe('memberProgressReportSchema', () => {
    describe('Equivalence Classes', () => {
        it('memberProgressReportSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            const inputQuery: MemberProgressReportInput = {
                ...VALID_QUERY
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(true);
        });

        it('memberProgressReportSchema_EC_missingMemberId_returnsValidationError', () => {
            const inputQuery = {
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_missingStartDate_returnsValidationError', () => {
            const inputQuery = {
                memberId: 'member-123',
                endDate: '2024-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_missingEndDate_returnsValidationError', () => {
            const inputQuery = {
                memberId: 'member-123',
                startDate: '2024-01-01',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_memberIdWhitespace_returnsValidationError', () => {
            const inputQuery = {
                ...VALID_QUERY,
                memberId: '   ',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_startDateWrongFormat_returnsValidationError', () => {
            const inputQuery = {
                ...VALID_QUERY,
                startDate: '01/01/2024',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_endDateWrongFormat_returnsValidationError', () => {
            const inputQuery = {
                ...VALID_QUERY,
                endDate: '2024.12.31',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_EC_startDateSameDayAsEndDate_parsesSuccessfully', () => {
            const inputQuery: MemberProgressReportInput = {
                ...VALID_QUERY,
                startDate: '2024-01-01',
                endDate: '2024-01-01',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(true);
        });

        it('memberProgressReportSchema_EC_endDateBeforeStartDate_parsesSuccessfully', () => {
            const inputQuery: MemberProgressReportInput = {
                ...VALID_QUERY,
                startDate: '2024-06-01',
                endDate: '2024-01-01',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(true);
        });
    });

    describe('Boundary Value Analysis', () => {
        it('memberProgressReportSchema_BVA_memberId0Chars_returnsValidationError', () => {
            const inputQuery = {
                ...VALID_QUERY,
                memberId: '',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(false);
        });

        it('memberProgressReportSchema_BVA_memberId1Char_parsesSuccessfully', () => {
            const inputQuery: MemberProgressReportInput = {
                ...VALID_QUERY,
                memberId: 'A',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(true);
        });

        it('memberProgressReportSchema_BVA_memberId2Chars_parsesSuccessfully', () => {
            const inputQuery: MemberProgressReportInput = {
                ...VALID_QUERY,
                memberId: 'AB',
            };

            const result = memberProgressReportSchema.safeParse(inputQuery);

            expect(result.success).toBe(true);
        });
    });
});