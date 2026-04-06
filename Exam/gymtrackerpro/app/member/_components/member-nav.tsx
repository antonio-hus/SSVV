'use client';

import {LayoutDashboard, Dumbbell, TrendingUp, UserCircle} from 'lucide-react';
import {SidebarNav} from '@/components/layout/sidebar-nav';
import type {NavItem} from '@/components/layout/sidebar-nav';

const NAV_ITEMS: NavItem[] = [
    {label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard},
    {label: 'My Workout Sessions', href: '/member/workout-sessions', icon: Dumbbell},
    {label: 'My Report', href: '/member/report', icon: TrendingUp},
    {label: 'Profile', href: '/member/profile', icon: UserCircle},
];

/**
 * Sidebar navigation for the member section.
 * Delegates rendering to the shared SidebarNav component.
 *
 * @returns Member sidebar navigation.
 */
export const MemberNav = () => <SidebarNav items={NAV_ITEMS} ariaLabel="Member Navigation"/>;
