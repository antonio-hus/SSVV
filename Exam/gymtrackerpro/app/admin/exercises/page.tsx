import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {listExercises} from '@/lib/controller/exercise-controller';
import {PageHeader} from '@/components/layout/page-header';
import {Pagination} from '@/components/layout/pagination';
import {SearchInput} from '@/components/data/search-input';
import {ExercisesTable} from './_components/exercises-table';

const PAGE_SIZE = 10;

type AdminExercisesPageProps = {
    searchParams: Promise<{ search?: string; page?: string; includeInactive?: string }>;
}

/**
 * Admin exercises page.
 * Fetches a filtered, paginated list of exercises server-side and renders
 * a searchable table with an archived toggle and pagination controls.
 *
 * @param searchParams - Resolved search params containing optional `search`, `page`, and `includeInactive`.
 * @returns A paginated, filterable table of exercises, or an error message on failure.
 */
export default async function AdminExercisesPage({searchParams}: AdminExercisesPageProps) {
    const {search = '', page: pageStr = '1', includeInactive} = await searchParams;
    const page = Number(pageStr);
    const showArchived = includeInactive === 'true';

    const result = await listExercises({
        search,
        page,
        pageSize: PAGE_SIZE,
        includeInactive: showArchived
    });
    if (!result.success) {
        return <p className="text-destructive">{result.message}</p>;
    }

    const {items, total} = result.data;

    const extraParams: Record<string, string> = {};
    if (search) {
        extraParams.search = search;
    }
    if (showArchived) {
        extraParams.includeInactive = 'true';
    }

    return (
        <div>
            <PageHeader title="Exercises" description="Manage the exercise catalogue">
                <Button render={<Link href="/admin/exercises/new" />} nativeButton={false}>Add Exercise</Button>
            </PageHeader>

            <div className="flex items-center gap-4 mb-4">
                <div className="max-w-sm flex-1">
                    <SearchInput placeholder="Search exercises…"/>
                </div>
                <Button render={<Link href={showArchived ? '/admin/exercises' : '/admin/exercises?includeInactive=true'} />} nativeButton={false} variant="outline" size="sm">
                    {showArchived ? 'Hide Archived' : 'Show Archived'}
                </Button>
            </div>

            <ExercisesTable exercises={items}/>

            <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                baseUrl="/admin/exercises"
                searchParams={extraParams}
            />
        </div>
    );
}