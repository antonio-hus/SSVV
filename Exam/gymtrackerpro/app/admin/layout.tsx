import {redirect} from 'next/navigation';
import {getSession} from '@/lib/session';
import {Role} from '@/lib/domain/user';
import {Separator} from '@/components/ui/separator';
import {AdminNav} from './_components/admin-nav';
import {LogoutButton} from '@/components/logout-button';
import React from "react";

/**
 * Root layout for the admin panel.
 * Fetches the current session server-side and redirects to login if the user
 * is unauthenticated or not an admin. Renders a persistent sidebar with branding,
 * navigation, and user identity alongside the page content.
 *
 * @param children - The active admin page rendered in the main content area.
 * @returns A two-column layout with a fixed sidebar and a scrollable content region.
 */
export default async function AdminLayout({children}: { children: React.ReactNode }) {
    const session = await getSession();

    if (!session.userId || session.role !== Role.ADMIN) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-56 border-r bg-card flex flex-col">
                <div className="p-4">
                    <p className="font-semibold text-sm">GymTracker Pro</p>
                    <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
                <Separator/>
                <div className="flex-1 p-3">
                    <AdminNav/>
                </div>
                <Separator/>
                <div className="p-3">
                    <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{session.fullName ?? 'Admin'}</p>
                    <LogoutButton/>
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
    );
}