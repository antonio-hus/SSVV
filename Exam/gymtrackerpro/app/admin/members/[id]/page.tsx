import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {PageHeader} from '@/components/layout/page-header';
import {MemberDetailInformation} from './_components/member-detail-information';
import {MemberRecentWorkoutSessions} from './_components/member-recent-workout-sessions';
import {getMember} from '@/lib/controller/user-controller';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';

type MemberDetailPageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Admin member detail page.
 * Fetches the member profile and their 10 most recent workout sessions in parallel,
 * then delegates rendering to focused sub-components.
 *
 * @param params - Resolved route params containing the member `id`.
 * @returns A detail view with contact info, membership status, and recent sessions, or a 404 if not found.
 */
export default async function MemberDetailPage({params}: MemberDetailPageProps) {
    const {id} = await params;

    const [memberResult, sessionsResult] = await Promise.all([
        getMember(id),
        listMemberWorkoutSessions(id, {page: 1, pageSize: 10}),
    ]);
    if (!memberResult.success) {
        notFound();
    }

    const sessions = sessionsResult.success ? sessionsResult.data.items : [];

    return (
        <div>
            <PageHeader title={memberResult.data.user.fullName} description="Member profile">
                <Button render={<Link href="/admin/members" />} nativeButton={false} variant="outline">Back</Button>
                <Button render={<Link href={`/admin/members/${id}/edit`} />} nativeButton={false} variant="outline">Edit</Button>
                <Button render={<Link href={`/admin/members/${id}/report`} />} nativeButton={false}>View Report</Button>
            </PageHeader>

            <MemberDetailInformation member={memberResult.data}/>

            <Separator className="mb-6"/>

            <MemberRecentWorkoutSessions memberId={id} sessions={sessions}/>
        </div>
    );
}