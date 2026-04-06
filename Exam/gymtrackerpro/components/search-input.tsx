'use client';

import React, {useCallback, useEffect, useState, useTransition} from 'react';
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
    const [value, setValue] = useState(searchParams.get(paramName) ?? '');

    useEffect(() => {
        setValue(searchParams.get(paramName) ?? '');
    }, [searchParams, paramName]);

    const buildQueryString = useCallback(
        (val: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (val) {
                params.set(paramName, val);
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
            setValue(e.target.value);
            startTransition(() => {
                router.push(`${pathname}?${buildQueryString(e.target.value)}`);
            });
        },
        [buildQueryString, pathname, router]
    );

    return (
        <Input
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            className={isPending ? 'opacity-50' : ''}
        />
    );
};

export {SearchInput};