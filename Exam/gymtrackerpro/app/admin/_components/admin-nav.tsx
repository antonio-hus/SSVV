'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';
import {useMemo} from 'react';

/**
 * List of navigation items for the admin sidebar.
 * `href` is used both as the link destination and as a prefix for active route highlighting.
 */
const NAV_ITEMS = [
    {label: 'Dashboard', href: '/admin/dashboard'},
    {label: 'Members', href: '/admin/members'},
    {label: 'Exercises', href: '/admin/exercises'},
    {label: 'Sessions', href: '/admin/workout-sessions'},
] as const;

/**
 * Sidebar navigation component for the admin section.
 * Highlights the active route based on the current pathname.
 *
 * @returns JSX element containing the sidebar navigation.
 */
export const AdminNav = () => {
    const pathname = usePathname();

    const activeMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        NAV_ITEMS.forEach(({href}) => {
            map[href] = pathname.startsWith(href);
        });
        return map;
    }, [pathname]);

    return (
        <nav aria-label="Admin Navigation">
            <ul className="space-y-1">
                {NAV_ITEMS.map(({label, href}) => (
                    <li key={href}>
                        <Link
                            href={href}
                            className={cn(
                                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                activeMap[href]
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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