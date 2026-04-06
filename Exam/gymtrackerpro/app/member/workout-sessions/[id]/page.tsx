import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/layout/page-header';
import {WorkoutSessionStats} from './_components/workout-session-stats';
import {WorkoutSessionExercisesTable} from './_components/workout-session-exercises-table';
import {getSession} from '@/lib/session';
import {getWorkoutSession} from '@/lib/controller/workout-session-controller';

type MemberWorkoutSessionDetailPageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Member session detail page.
 * Fetches a single workout session server-side and verifies it belongs to the
 * current member before rendering. Delegates stats and exercise rendering to sub-components.
 *
 * @param params - Resolved route params containing the session `id`.
 * @returns A detailed view of a single workout session, or a 404 if not found or unauthorized.
 */
export default async function MemberWorkoutSessionDetailPage({params}: MemberWorkoutSessionDetailPageProps) {
    const {id} = await params;

    const session = await getSession();
    if (!session.memberId) {
        return null;
    }

    const result = await getWorkoutSession(id);
    if (!result.success) {
        return null;
    }

    const workoutSession = result.data;
    if (workoutSession.memberId !== session.memberId) {
        return null;
    }

    const totalVolume = workoutSession.exercises.reduce(
        (sum, exercise) => sum + exercise.sets * exercise.reps * Number(exercise.weight),
        0,
    );

    return (
        <div>
            <PageHeader
                title={`Session - ${new Date(workoutSession.date).toLocaleDateString()}`}
                description={`${workoutSession.duration} minutes`}
            >
                <Button render={<Link href="/member/workout-sessions" />} nativeButton={false} variant="outline">
                    Back
                </Button>
            </PageHeader>

            <WorkoutSessionStats workoutSession={workoutSession} totalVolume={totalVolume}/>

            {workoutSession.notes && (
                <div className="mb-6 p-4 bg-muted rounded-md text-sm">
                    <span className="font-medium">Notes: </span>{workoutSession.notes}
                </div>
            )}

            <WorkoutSessionExercisesTable exercises={workoutSession.exercises}/>
        </div>
    );
}