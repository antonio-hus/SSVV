/**
 * A paginated list result containing items and total count.
 *
 * @template T The item type.
 */
export type PageResult<T> = {
    items: T[];
    total: number;
};

/**
 * Common pagination parameters for list queries.
 */
export type PaginationOptions = {
    page?: number;
    pageSize?: number;
};
