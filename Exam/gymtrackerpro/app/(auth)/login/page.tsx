import {Dumbbell} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {LoginForm} from './_components/login-form';

export default async function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary shrink-0">
                        <Dumbbell className="h-4 w-4 text-white"/>
                    </div>
                    <span className="font-semibold text-gray-900">GymTracker Pro</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-center mb-1">Sign in</h1>
                <p className="text-gray-500 text-sm text-center mb-6">Enter your credentials to continue.</p>
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="px-6 py-6">
                        <LoginForm/>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
