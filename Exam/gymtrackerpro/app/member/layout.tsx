import React from "react";
import {getSession} from '@/lib/session';
import {Separator} from '@/components/ui/separator';
import {LogoutButton} from '@/components/logout-button';
import {MemberNav} from './_components/member-nav';

/**
 * Root layout for the member portal.
 * Fetches the current session server-side and renders a persistent sidebar
 * with branding, navigation, and user identity alongside the page content.
 *
 * @param children - The active member page rendered in the main content area.
 * @returns A two-column layout with a fixed sidebar and a scrollable content region.
 */
export default async function MemberLayout({children}: { children: React.ReactNode }) {
    const session = await getSession();

    return (
        <div className="flex min-h-screen">
            <aside className="w-56 border-r bg-card flex flex-col">
                <div className="p-4">
                    <p className="font-semibold text-sm">GymTracker Pro</p>
                    <p className="text-xs text-muted-foreground">Member Portal</p>
                </div>
                <Separator/>
                <div className="flex-1 p-3">
                    <MemberNav/>
                </div>
                <Separator/>
                <div className="p-3">
                    <p className="text-xs text-muted-foreground px-3 mb-2 truncate">
                        {session.fullName ?? 'Unknown'}
                    </p>
                    <LogoutButton/>
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
    );
}