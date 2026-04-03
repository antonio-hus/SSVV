import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type SessionStatsProps = {
    workoutSession: WorkoutSessionWithExercises;
    totalVolume: number;
}

/**
 * Renders a row of stat cards summarising a single workout session.
 *
 * @param workoutSession - The workout session to display stats for.
 * @param totalVolume - The precomputed total volume (sets × reps × weight) across all exercises.
 * @returns A responsive grid of cards showing duration, exercise count, and total volume.
 */
export const WorkoutSessionStats = ({workoutSession, totalVolume}: SessionStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{workoutSession.duration} min</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{workoutSession.exercises.length}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{totalVolume.toLocaleString()} kg</p>
                </CardContent>
            </Card>
        </div>
    );
}