import {z} from 'zod';
import {isoDateRegex} from '@/lib/schema/utils';

/**
 * Schema for validating a member progress report query.
 */
export const memberProgressReportSchema = z.object({
    memberId: z
        .string()
        .min(1, 'Member ID is required')
        .describe('ID of the member'),
    startDate: z
        .string()
        .regex(isoDateRegex, 'Start date must be in YYYY-MM-DD format')
        .describe('Inclusive start of the reporting period in YYYY-MM-DD format'),
    endDate: z
        .string()
        .regex(isoDateRegex, 'End date must be in YYYY-MM-DD format')
        .describe('Inclusive end of the reporting period in YYYY-MM-DD format'),
});

/** Input type for a member progress report query. */
export type MemberProgressReportInput = z.infer<typeof memberProgressReportSchema>;
