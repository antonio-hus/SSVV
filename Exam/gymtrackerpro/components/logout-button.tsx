'use client';

import {useRouter} from 'next/navigation';
import {useTransition, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {logout} from '@/lib/controller/auth-controller';

/**
 * Renders a sign-out button that logs the user out and redirects to the login page.
 * The button shows a loading state while the logout is in progress.
 *
 * @returns JSX element rendering a sign-out button.
 */
export const LogoutButton = () => {
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
            className="w-full justify-start"
        >
            {isPending ? 'Signing out...' : 'Sign out'}
        </Button>
    );
};