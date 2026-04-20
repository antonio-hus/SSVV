import Link from 'next/link';
import {Dumbbell} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function RootPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
            <div className="flex items-center gap-3 mb-10">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
                    <Dumbbell className="h-5 w-5 text-white"/>
                </div>
                <span className="text-lg font-semibold text-gray-900">GymTracker Pro</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-center mb-3">
                Your fitness, tracked.
            </h1>
            <p className="text-gray-500 text-[15px] text-center max-w-xs leading-relaxed mb-8">
                Manage your gym, log every workout, and stay on top of your progress.
            </p>
            <Link href="/login">
                <Button size="lg" className="px-10">Get Started</Button>
            </Link>
        </div>
    );
}
