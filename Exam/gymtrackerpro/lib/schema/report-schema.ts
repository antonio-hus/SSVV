import { z } from 'zod';
import { isoDateRegex } from '@/lib/schema/utils';

/**
 * Schema for validating a member progress report query.
 */
export const memberProgressReportSchema = z.object({
    /**
     * Unique identifier of the member.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Cannot be empty (minimum length: 1)
     */
    memberId: z
        .string()
        .trim()
        .min(1, 'Member ID is required')
        .describe('ID of the member'),

    /**
     * Inclusive start date of the reporting period.
     *
     * Constraints:
     * - Must be a string
     * - Must match ISO date format: YYYY-MM-DD
     * - Must satisfy the {@link isoDateRegex} pattern
     *
     * Notes:
     * - This value represents the beginning of the reporting interval (inclusive)
     */
    startDate: z
        .string()
        .regex(isoDateRegex, 'Start date must be in YYYY-MM-DD format')
        .describe('Inclusive start of the reporting period in YYYY-MM-DD format'),

    /**
     * Inclusive end date of the reporting period.
     *
     * Constraints:
     * - Must be a string
     * - Must match ISO date format: YYYY-MM-DD
     * - Must satisfy the {@link isoDateRegex} pattern
     *
     * Notes:
     * - This value represents the end of the reporting interval (inclusive)
     * - Should be greater than or equal to `startDate` (not enforced at schema level)
     */
    endDate: z
        .string()
        .regex(isoDateRegex, 'End date must be in YYYY-MM-DD format')
        .describe('Inclusive end of the reporting period in YYYY-MM-DD format'),
});

/** Input type for a member progress report query. */
export type MemberProgressReportInput = z.infer<typeof memberProgressReportSchema>;