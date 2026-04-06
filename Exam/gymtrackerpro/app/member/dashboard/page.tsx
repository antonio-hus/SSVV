import {PageHeader} from '@/components/layout/page-header';
import {StatCard} from '@/components/data/stat-card';
import {DashboardRecentSessions} from './_components/dashboard-recent-sessions';
import {getSession} from '@/lib/session';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';

/**
 * Member dashboard page.
 * Fetches the current session and the member's most recent workout sessions server-side,
 * then renders a stats overview and a preview table with a link to the full sessions list.
 *
 * @returns A dashboard view with a total sessions stat card and the 5 most recent workout sessions.
 */
export default async function MemberDashboardPage() {
    const session = await getSession();
    if (!session.memberId) {
        return null;
    }

    const result = await listMemberWorkoutSessions(session.memberId, {
        page: 1,
        pageSize: 5,
    });

    const workoutSessions = result.success ? result.data.items : [];
    const total = result.success ? result.data.total : 0;

    return (
        <div>
            <PageHeader
                title={`Welcome, ${session.fullName ?? 'Member'}`}
                description="Your fitness overview"
            />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
                <StatCard title="Total Sessions" value={total} description="Recorded workouts"/>
            </div>
            <DashboardRecentSessions workoutSessions={workoutSessions}/>
        </div>
    );
}