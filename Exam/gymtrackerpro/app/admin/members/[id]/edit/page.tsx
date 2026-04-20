import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {getMember} from '@/lib/controller/user-controller';
import {PageHeader} from '@/components/page-header';
import {EditMemberForm} from './_components/edit-member-form';

type EditMemberPageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Edit member page.
 * Fetches the member by ID server-side and renders a form for updating
 * their profile, suspending/activating, and deleting their account.
 *
 * @param params - Resolved route params containing the member `id`.
 * @returns An edit form pre-populated with the member's data, or a 404 if not found.
 */
export default async function EditMemberPage({params}: EditMemberPageProps) {
    const {id} = await params;

    const result = await getMember(id);
    if (!result.success) {
        notFound();
    }

    return (
        <div>
            <PageHeader title={`Edit: ${result.data.user.fullName}`} description="Update member details">
                <Button render={<Link href={`/admin/members/${id}`} />} nativeButton={false} variant="outline">
                    Back
                </Button>
            </PageHeader>
            <EditMemberForm member={result.data} memberId={id}/>
        </div>
    );
}