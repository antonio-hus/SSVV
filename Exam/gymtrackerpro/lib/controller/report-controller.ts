'use server';

import {ReportServiceInterface} from '@/lib/service/report-service-interface';
import {ReportControllerInterface} from '@/lib/controller/report-controller-interface';
import {ActionResult} from '@/lib/domain/action-result';
import {Report} from '@/lib/domain/report';
import {z} from 'zod';
import {memberProgressReportSchema} from '@/lib/schema/report-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Implementation of {@link ReportControllerInterface} — progress report server actions.
 */
export class ReportController implements ReportControllerInterface {
    private static instance: ReportController;
    private readonly reportService: ReportServiceInterface;

    private constructor(reportService: ReportServiceInterface) {
        this.reportService = reportService;
    }

    /**
     * Returns the singleton instance, creating it with the given service on first call.
     *
     * @param reportService - The report service to use for progress report generation.
     */
    static getInstance(reportService: ReportServiceInterface): ReportController {
        if (!ReportController.instance) {
            ReportController.instance = new ReportController(reportService);
        }
        return ReportController.instance;
    }

    /** @inheritdoc */
    async getMemberProgressReport(
        memberId: string,
        startDate: string,
        endDate: string,
    ): Promise<ActionResult<Report>> {
        const result = memberProgressReportSchema.safeParse({memberId, startDate, endDate});
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            const report = await this.reportService.getMemberProgressReport(
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
}
