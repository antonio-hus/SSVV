import {redirect} from 'next/navigation';
import {Dumbbell} from 'lucide-react';
import {getSession} from '@/lib/session';
import {Role} from '@/lib/domain/user';
import {AdminNav} from './_components/admin-nav';
import {LogoutButton} from '@/components/auth/logout-button';
import React from "react";

export default async function AdminLayout({children}: { children: React.ReactNode }) {
    const session = await getSession();

    if (!session.userId || session.role !== Role.ADMIN) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-14 md:w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
                <div className="flex items-center gap-3 px-3 md:px-4 py-4 min-h-[56px]">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary shrink-0">
                        <Dumbbell className="h-4 w-4 text-white"/>
                    </div>
                    <div className="hidden md:block min-w-0">
                        <p className="font-semibold text-sm text-gray-900 leading-tight truncate">GymTracker Pro</p>
                        <p className="text-xs text-gray-400 leading-tight">Admin Panel</p>
                    </div>
                </div>

                <div className="h-px bg-gray-100 mx-2"/>

                <div className="flex-1 p-2 pt-3">
                    <AdminNav/>
                </div>

                <div className="h-px bg-gray-100 mx-2"/>

                <div className="p-2 pt-3 pb-3">
                    <div className="hidden md:flex items-center gap-2 px-3 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">
                                {session.fullName?.[0]?.toUpperCase() ?? 'A'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 truncate">{session.fullName ?? 'Admin'}</span>
                    </div>
                    <LogoutButton className="text-gray-500 hover:bg-gray-100 hover:text-gray-900"/>
                </div>
            </aside>
            <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">{children}</main>
        </div>
    );
}
