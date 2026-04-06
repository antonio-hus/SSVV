import {StatCard} from '@/components/data/stat-card';
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
 * @returns A responsive grid of stat cards showing duration, exercise count, and total volume.
 */
export const WorkoutSessionStats = ({workoutSession, totalVolume}: SessionStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard title="Duration" value={`${workoutSession.duration} min`}/>
            <StatCard title="Exercises" value={workoutSession.exercises.length}/>
            <StatCard title="Total Volume" value={`${totalVolume.toLocaleString()} kg`}/>
        </div>
    );
}
