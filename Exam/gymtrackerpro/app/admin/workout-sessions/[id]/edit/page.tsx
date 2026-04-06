import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {getWorkoutSession} from '@/lib/controller/workout-session-controller';
import {listExercises} from '@/lib/controller/exercise-controller';
import {PageHeader} from '@/components/layout/page-header';
import {EditWorkoutSessionForm} from './_components/edit-workout-session-form';

type EditWorkoutSessionPageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Edit workout session page.
 * Fetches the workout session by ID server-side and renders a form for
 * updating its date, duration, and notes.
 *
 * @param params - Resolved route params containing the session `id`.
 * @returns An edit form pre-populated with the session data, or a 404 if not found.
*/
export default async function EditWorkoutSessionPage({params}: EditWorkoutSessionPageProps) {
    const {id} = await params;

    const [result, exercisesResult] = await Promise.all([
        getWorkoutSession(id),
        listExercises({pageSize: 200}),
    ]);

    if (!result.success) {
        notFound();
    }

    const session = result.data;
    const exercises = exercisesResult.success ? exercisesResult.data.items : [];

    return (
        <div>
            <PageHeader
                title="Edit Session"
                description={`Session on ${new Date(result.data.date).toLocaleDateString()}`}
            >
                <Button render={<Link href={`/admin/members/${result.data.memberId}`} />} nativeButton={false} variant="outline">
                    Back to Member
                </Button>
            </PageHeader>
            <EditWorkoutSessionForm session={session} exercises={exercises} sessionId={id}/>
        </div>
    );
}