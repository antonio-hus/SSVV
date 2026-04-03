import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {LoginForm} from './_components/login-form';

/**
 * Renders the login page.
 *
 * @returns A React component rendering a centered login card.
 * @throws {Error} If session retrieval fails.
 */
export default async function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">GymTracker Pro</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm/>
                </CardContent>
            </Card>
        </div>
    );
}