import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/page-header';
import {CreateMemberForm} from './_components/create-member-form';

/**
 * New member page.
 * Renders a form for creating a new gym member account with a generated temporary password.
 *
 * @returns A page with a creation form and a back link to the members list.
 */
export default async function NewMemberPage() {
    return (
        <div>
            <PageHeader title="Add Member" description="Create a new gym member account">
                <Button render={<Link href="/admin/members" />} nativeButton={false} variant="outline">
                    Back to Members
                </Button>
            </PageHeader>
            <CreateMemberForm/>
        </div>
    );
}