import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {getMember} from '@/lib/controller/user-controller';
import {getMemberProgressReport} from '@/lib/controller/report-controller';
import {PageHeader} from '@/components/page-header';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ReportStats} from '@/components/report/report-stats';
import {ReportExerciseBreakdown} from '@/components/report/report-exercise-breakdown';
import {ReportWorkoutSessionDetails} from '@/components/report/report-workout-session-details';
import {ReportFilter} from '@/components/report/report-filter';

type AdminMemberReportPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

/**
 * Admin member report page.
 * Fetches the member profile and an optional progress report server-side based
 * on the provided date range. Delegates rendering to shared report sub-components.
 *
 * @param params - Resolved route params containing the member `id`.
 * @param searchParams - Resolved search params containing optional `startDate` and `endDate`.
 * @returns A report view scoped to the given date range, or just the filter form if no dates are set.
 */
export default async function AdminMemberReportPage({params, searchParams}: AdminMemberReportPageProps) {
    const {id} = await params;
    const {startDate, endDate} = await searchParams;

    const memberResult = await getMember(id);
    if (!memberResult.success) notFound();

    let reportContent = null;

    if (startDate && endDate) {
        const result = await getMemberProgressReport(id, startDate, endDate);

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
            <PageHeader
                title={`Report: ${memberResult.data.user.fullName}`}
                description="Workout progress over a date range"
            >
                <Button render={<Link href={`/admin/members/${id}`} />} nativeButton={false} variant="outline">
                    Back
                </Button>
            </PageHeader>
            <ReportFilter/>
            {reportContent}
        </div>
    );
}