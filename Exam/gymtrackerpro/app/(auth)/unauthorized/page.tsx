import Link from 'next/link';
import {Button} from '@/components/ui/button';

/**
 * Renders the unauthorized access page.
 *
 * @returns A React component with a message and navigation options.
 */
export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="max-w-xs w-full">
                <p className="text-xs font-semibold text-destructive uppercase tracking-widest mb-3">Access Denied</p>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">You don&apos;t have permission here.</h1>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
                    This page isn&apos;t available with your current account.
                </p>
                <div className="flex flex-col gap-3">
                    <Link href="/">
                        <Button className="w-full">Go to Home</Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">Sign in with another account</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
