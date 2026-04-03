'use server';

import {reportService} from '@/lib/di';
import {ActionResult} from '@/lib/domain/action-result';
import {Report} from '@/lib/domain/report';
import {z} from 'zod';
import {memberProgressReportSchema} from '@/lib/schema/report-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Validates the date range and generates a progress report for the given member,
 * summarising workout frequency, volume, and exercise breakdown over the period.
 *
 * @param memberId - The member to generate the report for.
 * @param startDate - Report start date as an ISO date string (YYYY-MM-DD).
 * @param endDate - Report end date as an ISO date string (YYYY-MM-DD).
 * @returns The compiled progress report, or a validation/not-found error.
 */
export async function getMemberProgressReport(
    memberId: string,
    startDate: string,
    endDate: string,
): Promise<ActionResult<Report>> {
    const result = memberProgressReportSchema.safeParse({memberId, startDate, endDate});
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }

    try {
        const report = await reportService.getMemberProgressReport(
            result.data.memberId,
            new Date(result.data.startDate),
            new Date(result.data.endDate),
        );
        return {success: true, data: report};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}
