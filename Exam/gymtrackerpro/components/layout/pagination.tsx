import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {ChevronLeft, ChevronRight} from 'lucide-react';

type PaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    baseUrl: string;
    searchParams?: Record<string, string>;
}

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
                Page {page} of {totalPages}
                <span className="hidden sm:inline"> ({total} total)</span>
            </p>
            <div className="flex gap-2">
                {page > 1 && (
                    <Button render={<Link href={buildUrl(baseUrl, searchParams, page - 1)}/>} nativeButton={false}
                            variant="outline" size="sm" className="gap-1">
                        <ChevronLeft className="h-3.5 w-3.5"/>
                        <span className="hidden sm:inline">Previous</span>
                    </Button>
                )}
                {page < totalPages && (
                    <Button render={<Link href={buildUrl(baseUrl, searchParams, page + 1)}/>} nativeButton={false}
                            variant="outline" size="sm" className="gap-1">
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-3.5 w-3.5"/>
                    </Button>
                )}
            </div>
        </div>
    );
};
