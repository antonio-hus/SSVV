'use client';

import React, {useCallback, useTransition} from 'react';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {Input} from '@/components/ui/input';

type SearchInputProps = {
    placeholder?: string;
    paramName?: string;
}

/**
 * Renders a search input that syncs its value to a URL query parameter on change.
 *
 * @param placeholder - Input placeholder text.
 * @param paramName - Query param key used for storing the search value.
 * @returns A controlled search input component tied to the router state.
 */
const SearchInput = ({placeholder = 'Search...', paramName = 'search'}: SearchInputProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const buildQueryString = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(paramName, value);
            } else {
                params.delete(paramName);
            }
            params.delete('page');
            return params.toString();
        },
        [searchParams, paramName]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            startTransition(() => {
                router.push(`${pathname}?${buildQueryString(e.target.value)}`);
            });
        },
        [buildQueryString, pathname, router]
    );

    return (
        <Input
            placeholder={placeholder}
            defaultValue={searchParams.get(paramName) ?? ''}
            onChange={handleChange}
            className={isPending ? 'opacity-50' : ''}
        />
    );
};

export {SearchInput};