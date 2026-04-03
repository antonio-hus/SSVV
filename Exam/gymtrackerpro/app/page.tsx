import Link from 'next/link';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

/**
 * Landing page for the app.
 * Shows a welcome message and provides a call-to-action for users to log in.
 *
 * @returns A React component with a welcome message and navigation buttons.
 */
export default function RootPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to GymTracker Pro</CardTitle>
                    <CardDescription>
                        Track your workouts, manage your gym, and stay on top of your fitness goals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Link href="/login">
                        <Button className="w-full">Sign in</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}