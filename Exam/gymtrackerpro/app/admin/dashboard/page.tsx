import {getSession} from '@/lib/session';
import {listMembers} from '@/lib/controller/user-controller';
import {PageHeader} from '@/components/layout/page-header';
import {StatCard} from '@/components/data/stat-card';

/**
 * Admin dashboard page.
 * Fetches the current session and total member count server-side,
 * then renders a stats overview for the admin.
 *
 * @returns A dashboard view with a total members stat card.
 */
export default async function AdminDashboardPage() {
    const session = await getSession();

    const membersResult = await listMembers({page: 1, pageSize: 1});
    const totalMembers = membersResult.success ? membersResult.data.total : 0;

    return (
        <div>
            <PageHeader
                title={`Welcome, ${session.fullName ?? 'Admin'}`}
                description="Admin dashboard overview"
            />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Members" value={totalMembers} description="Registered gym members"/>
            </div>
        </div>
    );
}