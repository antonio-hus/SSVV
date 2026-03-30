import type {ActionResult} from '@/lib/domain/action-result';
import type {Report} from '@/lib/domain/report';

/**
 * Contract for member progress report server actions.
 */
export interface ReportControllerInterface {
    /**
     * Generates a progress report for a member over a date range.
     *
     * @param memberId - The member ID.
     * @param startDate - Inclusive start of the reporting period in YYYY-MM-DD format — validated internally.
     * @param endDate - Inclusive end of the reporting period in YYYY-MM-DD format — validated internally.
     * @returns The full progress report on success, or a validation / not-found error.
     */
    getMemberProgressReport(
        memberId: string,
        startDate: string,
        endDate: string
    ): Promise<ActionResult<Report>>;
}
