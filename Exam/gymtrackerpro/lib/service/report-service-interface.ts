import type {Report} from '@/lib/domain/report';

/**
 * Contract for member progress report business logic.
 */
export interface ReportServiceInterface {
    /**
     * Returns a progress report for a member over a date range.
     *
     * Includes total session count, total volume, average duration, per-exercise
     * breakdowns, and chronological session details.
     *
     * @param memberId - The member ID.
     * @param startDate - Inclusive start of the reporting period.
     * @param endDate - Inclusive end of the reporting period.
     * @returns A full report including session details and per-exercise breakdowns.
     * @throws {NotFoundError} If the member does not exist.
     */
    getMemberProgressReport(memberId: string, startDate: Date, endDate: Date): Promise<Report>;
}
