'use client';

import {LayoutDashboard, Users, Dumbbell, CalendarDays} from 'lucide-react';
import {SidebarNav} from '@/components/layout/sidebar-nav';
import type {NavItem} from '@/components/layout/sidebar-nav';

const NAV_ITEMS: NavItem[] = [
    {label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard},
    {label: 'Members', href: '/admin/members', icon: Users},
    {label: 'Exercises', href: '/admin/exercises', icon: Dumbbell},
    {label: 'Sessions', href: '/admin/workout-sessions', icon: CalendarDays},
];

/**
 * Sidebar navigation for the admin section.
 * Delegates rendering to the shared SidebarNav component.
 *
 * @returns Admin sidebar navigation.
 */
export const AdminNav = () => <SidebarNav items={NAV_ITEMS} ariaLabel="Admin Navigation"/>;
