import Link from 'next/link';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

/**
 * Renders a friendly Unauthorized page when a user tries to access a page
 * they are not allowed to view.
 *
 * @returns A React component with a message and navigation options.
 */
export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Link href="/">
                        <Button className="w-full">Go to Home</Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">Sign in with another account</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}