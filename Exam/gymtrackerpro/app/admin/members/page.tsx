import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/page-header';
import {Pagination} from '@/components/pagination';
import {SearchInput} from '@/components/search-input';
import {MembersTable} from './_components/members-table';
import {listMembers} from '@/lib/controller/user-controller';

const PAGE_SIZE = 10;

type AdminMembersPageProps = {
    searchParams: Promise<{ search?: string; page?: string }>;
}

/**
 * Admin members page.
 * Fetches a filtered, paginated list of gym members server-side and renders
 * a searchable table with pagination controls.
 *
 * @param searchParams - Resolved search params containing optional `search` and `page`.
 * @returns A paginated, searchable table of members, or an error message on failure.
 */
export default async function AdminMembersPage({searchParams}: AdminMembersPageProps) {
    const {search = '', page: pageStr = '1'} = await searchParams;
    const page = Number(pageStr);

    const result = await listMembers({search, page, pageSize: PAGE_SIZE});
    if (!result.success) {
        return <p className="text-destructive">{result.message}</p>;
    }

    const {items, total} = result.data;

    return (
        <div>
            <PageHeader title="Members" description="Manage gym members">
                <Button render={<Link href="/admin/members/new" />} nativeButton={false}>
                    Add Member
                </Button>
            </PageHeader>

            <div className="mb-4 max-w-sm">
                <SearchInput placeholder="Search by name or email..."/>
            </div>

            <MembersTable members={items}/>

            <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                baseUrl="/admin/members"
                searchParams={search ? {search} : {}}
            />
        </div>
    );
}