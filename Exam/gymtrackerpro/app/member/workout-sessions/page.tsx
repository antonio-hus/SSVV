import {PageHeader} from '@/components/layout/page-header';
import {Pagination} from '@/components/layout/pagination';
import {WorkoutSessionsTable} from './_components/workout-sessions-table';
import {getSession} from '@/lib/session';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';

const PAGE_SIZE = 10;

type MemberWorkoutSessionsPageProps = {
    searchParams: Promise<{ page?: string }>;
}

/**
 * Member workout sessions page.
 * Fetches a paginated list of the member's workout sessions server-side
 * and renders them in a table with pagination controls.
 *
 * @param searchParams - Resolved search params containing an optional `page` number.
 * @returns A paginated table of workout sessions, or an error message on failure.
 */
export default async function MemberWorkoutSessionsPage({searchParams}: MemberWorkoutSessionsPageProps) {
    const {page: pageStr = '1'} = await searchParams;
    const page = Number(pageStr);

    const session = await getSession();
    if (!session.memberId) {
        return null;
    }

    const result = await listMemberWorkoutSessions(session.memberId, {page, pageSize: PAGE_SIZE,});
    if (!result.success) {
        return <p className="text-destructive">{result.message}</p>;
    }

    const {items, total} = result.data;

    return (
        <div>
            <PageHeader title="My Sessions" description="Your workout history"/>
            <WorkoutSessionsTable sessions={items}/>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseUrl="/member/sessions"/>
        </div>
    );
}