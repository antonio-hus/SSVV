'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

type DateRangeInput = {
    startDate: string;
    endDate: string;
}

/**
 * Renders a date range filter form that pushes `startDate` and `endDate` into the URL as search params.
 *
 * @returns A controlled form component that triggers a report fetch on submit via URL navigation.
 */
export const ReportFilter = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [inputs, setInputs] = useState<DateRangeInput>({
        startDate: searchParams.get('startDate') ?? '',
        endDate: searchParams.get('endDate') ?? '',
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputs(prev => ({...prev, [e.target.name]: e.target.value}));
    }, []);

    const handleSubmit = useCallback((e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const params = new URLSearchParams({
            startDate: inputs.startDate,
            endDate: inputs.endDate,
        });
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }, [inputs, pathname, router]);

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-4 mb-6">
            <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={inputs.startDate}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={inputs.endDate}
                    onChange={handleChange}
                    required
                />
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Loading…' : 'Generate Report'}
            </Button>
        </form>
    );
};