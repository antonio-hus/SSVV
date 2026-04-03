'use client';

import React, {useMemo} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';

/**
 * List of navigation items for the member sidebar.
 * `href` should match the route exactly or as a prefix for active highlighting.
 */
const NAV_ITEMS = [
    {label: 'Dashboard', href: '/member/dashboard'},
    {label: 'My Workout Sessions', href: '/member/workout-sessions'},
    {label: 'My Report', href: '/member/report'},
    {label: 'Profile', href: '/member/profile'},
] as const;

/**
 * Sidebar navigation component for the member section.
 * Highlights the active route based on the current pathname.
 *
 * @returns JSX element containing the sidebar navigation.
 */
export const MemberNav = () => {
    const pathname = usePathname();

    const activeMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        NAV_ITEMS.forEach(({href}) => {
            map[href] = pathname.startsWith(href);
        });

        return map;
    }, [pathname]);

    return (
        <nav aria-label="Member Navigation">
            <ul className="space-y-1">
                {NAV_ITEMS.map(({label, href}) => (
                    <li key={href}>
                        <Link
                            href={href}
                            className={cn(
                                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                activeMap[href]
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};