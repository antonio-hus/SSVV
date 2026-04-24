import {memberProgressReportSchema, MemberProgressReportInput} from '@/lib/schema/report-schema';

describe('memberProgressReportSchema', () => {

    describe('Independent Paths', () => {

        it('memberProgressReportSchema_Path1_validInput_returnsSuccess', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 'm-123',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('memberProgressReportSchema_Path2_memberIdNotString_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 123 as never,
                startDate: '2026-01-01',
                endDate: '2026-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
                expect(result.error.issues[0].message).toBe('Invalid input: expected string, received number');
            }
        });

        it('memberProgressReportSchema_Path3_memberIdEmpty_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: '   ',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
                expect(result.error.issues[0].message).toBe('Member ID is required');
            }
        });

        it('memberProgressReportSchema_Path4_startDateNotString_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 'm-123',
                startDate: 20260101 as never,
                endDate: '2026-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('startDate');
                expect(result.error.issues[0].message).toBe('Invalid input: expected string, received number');
            }
        });

        it('memberProgressReportSchema_Path5_startDateInvalidFormat_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 'm-123',
                startDate: '01-01-2026',
                endDate: '2026-01-31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('startDate');
                expect(result.error.issues[0].message).toBe('Start date must be in YYYY-MM-DD format');
            }
        });

        it('memberProgressReportSchema_Path6_endDateNotString_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 'm-123',
                startDate: '2026-01-01',
                endDate: null as never,
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('endDate');
                expect(result.error.issues[0].message).toBe('Invalid input: expected string, received null');
            }
        });

        it('memberProgressReportSchema_Path7_endDateInvalidFormat_returnsError', () => {
            const inputData: MemberProgressReportInput = {
                memberId: 'm-123',
                startDate: '2026-01-01',
                endDate: '2026/01/31',
            };

            const result = memberProgressReportSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('endDate');
                expect(result.error.issues[0].message).toBe('End date must be in YYYY-MM-DD format');
            }
        });

    });

});
