import Link from 'next/link';
import {Button} from '@/components/ui/button';

type PaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    baseUrl: string;
    searchParams?: Record<string, string>;
}

/**
 * Builds a paginated URL by merging existing search params with the target page number.
 *
 * @param baseUrl - Base URL to append query params to.
 * @param searchParams - Existing query params to preserve.
 * @param p - Target page number.
 * @returns Full URL string with updated page query param.
 */
const buildUrl = (baseUrl: string, searchParams: Record<string, string>, p: number) => {
    const params = new URLSearchParams({...searchParams, page: String(p)});
    return `${baseUrl}?${params.toString()}`;
};

/**
 * Renders a server-side pagination bar with previous/next navigation links.
 *
 * @param page - Current page number (1-based).
 * @param pageSize - Number of items per page.
 * @param total - Total number of items.
 * @param baseUrl - Base URL used to construct pagination links.
 * @param searchParams - Additional query params to preserve across pages.
 * @returns A pagination control component, or null if only one page exists.
 */
export const Pagination = ({page, pageSize, total, baseUrl, searchParams = {}}: PaginationProps) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
                {page > 1 && (
                    <Button render={<Link href={buildUrl(baseUrl, searchParams, page - 1)} />} nativeButton={false} variant="outline" size="sm">
                        Previous
                    </Button>
                )}
                {page < totalPages && (
                    <Button render={<Link href={buildUrl(baseUrl, searchParams, page + 1)} />} nativeButton={false} variant="outline" size="sm">
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
};