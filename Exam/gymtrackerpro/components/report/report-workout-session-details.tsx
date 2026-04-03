import type {Report} from '@/lib/domain/report';

type ReportSessionDetailsProps = {
    sessions: Report['sessionDetails'];
}

/**
 * Renders a list of per-session detail cards showing exercises, volume, and notes.
 *
 * @param sessions - Array of individual session records from the progress report.
 * @returns A stacked list of session cards, or null if no sessions exist.
 */
export const ReportWorkoutSessionDetails = ({sessions}: ReportSessionDetailsProps) => {
    if (sessions.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-lg font-semibold mb-3">Session Details</h2>
            <div className="space-y-3">
                {sessions.map((session) => (
                    <div key={session.sessionId} className="rounded-md border p-4">
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">{new Date(session.date).toLocaleDateString()}</span>
                            <span className="text-sm text-muted-foreground">
                                {session.durationMinutes} min · {session.totalVolume.toLocaleString()} kg
                            </span>
                        </div>
                        {session.notes && <p className="text-sm text-muted-foreground mb-2">{session.notes}</p>}
                        <div className="text-sm space-y-0.5">
                            {session.exercises.map((exercise) => (
                                <div key={exercise.exerciseId} className="flex gap-4 text-muted-foreground">
                                    <span className="w-44 truncate">{exercise.exerciseName}</span>
                                    <span>{exercise.sets}×{exercise.reps} @ {exercise.weight} kg</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};