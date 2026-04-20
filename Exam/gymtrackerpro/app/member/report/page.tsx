import {PageHeader} from '@/components/page-header';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ReportStats} from '@/components/report/report-stats';
import {ReportExerciseBreakdown} from '@/components/report/report-exercise-breakdown';
import {ReportWorkoutSessionDetails} from '@/components/report/report-workout-session-details';
import {ReportFilter} from "@/components/report/report-filter";
import {getSession} from '@/lib/session';
import {getMemberProgressReport} from '@/lib/controller/report-controller';

type MemberReportPageProps = {
    searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

/**
 * Member progress report page.
 * Reads an optional date range from search params and fetches a progress report
 * server-side when both dates are present. Delegates rendering to focused sub-components.
 *
 * @param searchParams - Resolved search params containing optional `startDate` and `endDate`.
 * @returns A report view scoped to the given date range, or just the filter form if no dates are set.
 */
export default async function MemberReportPage({searchParams}: MemberReportPageProps) {
    const {startDate, endDate} = await searchParams;

    const session = await getSession();
    if (!session.memberId) {
        return null;
    }

    let reportContent = null;
    if (startDate && endDate) {
        const result = await getMemberProgressReport(session.memberId, startDate, endDate);

        reportContent = !result.success ? (
            <Alert variant="destructive">
                <AlertDescription>{result.message}</AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-6">
                <ReportStats data={result.data}/>
                <ReportExerciseBreakdown breakdown={result.data.exerciseBreakdown}/>
                <ReportWorkoutSessionDetails sessions={result.data.sessionDetails}/>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="My Progress Report" description="View your workout progress over time"/>
            <ReportFilter/>
            {reportContent}
        </div>
    );
}