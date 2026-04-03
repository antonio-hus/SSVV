import {StatCard} from '@/components/stat-card';
import type {Report} from '@/lib/domain/report';

type ReportStatsProps = {
    data: Report;
}

/**
 * Renders a row of top-level stat cards summarising a member's progress report.
 *
 * @param data - The full progress report data.
 * @returns A responsive grid of stat cards for sessions, volume, and average duration.
 */
export const ReportStats = ({data}: ReportStatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Total Sessions"
                value={data.totalSessions}
            />
            <StatCard
                title="Total Volume"
                value={`${data.totalVolume.toLocaleString()} kg`}
                description="sets × reps × weight"
            />
            <StatCard
                title="Avg Duration"
                value={`${Math.round(data.averageSessionDuration)} min`}
                description="per session"
            />
        </div>
    );
}