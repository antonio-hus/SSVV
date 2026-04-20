'use client';

import {useRouter} from 'next/navigation';
import {useTransition, useCallback} from 'react';
import {LogOut} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {logout} from '@/lib/controller/auth-controller';

type LogoutButtonProps = {
    className?: string;
}

/**
 * Renders a sign-out button that logs the user out and redirects to the login page.
 * The button shows a loading state while the logout is in progress.
 *
 * @param className - Optional class overrides for the button element.
 * @returns JSX element rendering a sign-out button.
 */
export const LogoutButton = ({className}: LogoutButtonProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClick = useCallback(() => {
        startTransition(async () => {
            try {
                await logout();
            } finally {
                router.push('/login');
            }
        });
    }, [router]);

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleClick}
            className={cn('w-full justify-start gap-2', className)}
        >
            <LogOut className="h-4 w-4 shrink-0"/>
            <span className="hidden md:inline">{isPending ? 'Signing out...' : 'Sign out'}</span>
        </Button>
    );
};
