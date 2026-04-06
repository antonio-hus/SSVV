'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useMemo} from 'react';
import {cn} from '@/lib/utils';
import type {LucideIcon} from 'lucide-react';

export type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

type SidebarNavProps = {
    items: NavItem[];
    ariaLabel?: string;
};

/**
 * Shared sidebar navigation component used by admin and member layouts.
 * Collapses to icon-only below the md breakpoint.
 *
 * @param items - Navigation items with label, href, and icon.
 * @param ariaLabel - Accessible label for the nav element.
 */
export const SidebarNav = ({items, ariaLabel = 'Navigation'}: SidebarNavProps) => {
    const pathname = usePathname();

    const activeMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        items.forEach(({href}) => {
            map[href] = pathname.startsWith(href);
        });
        return map;
    }, [pathname, items]);

    return (
        <nav aria-label={ariaLabel}>
            <ul className="space-y-0.5">
                {items.map(({label, href, icon: Icon}) => (
                    <li key={href}>
                        <Link
                            href={href}
                            title={label}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                activeMap[href]
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0"/>
                            <span className="hidden md:inline">{label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
