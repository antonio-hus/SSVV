import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/page-header';
import {CreateWorkoutSessionForm} from './_components/create-workout-session-form';
import {listExercises} from '@/lib/controller/exercise-controller';

type NewWorkoutSessionPageProps = {
    searchParams: Promise<{ memberId?: string }>;
}

/**
 * New workout session page.
 * Fetches the active exercise catalogue server-side and renders a form for
 * recording a workout session. Supports an optional `memberId` search param
 * to pre-fill the member field and scope the back link.
 *
 * @param searchParams - Resolved search params containing an optional `memberId`.
 * @returns A session creation form with a back link to the member or members list.
 */
export default async function NewWorkoutSessionPage({searchParams}: NewWorkoutSessionPageProps) {
    const {memberId} = await searchParams;

    const exercisesResult = await listExercises({pageSize: 200});
    const exercises = exercisesResult.success ? exercisesResult.data.items : [];

    return (
        <div>
            <PageHeader title="New Workout Session" description="Record a session for a member">
                <Button render={<Link href={memberId ? `/admin/members/${memberId}` : '/admin/members'} />} nativeButton={false} variant="outline">
                    Back
                </Button>
            </PageHeader>
            <CreateWorkoutSessionForm exercises={exercises} defaultMemberId={memberId}/>
        </div>
    );
}