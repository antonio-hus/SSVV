import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type WorkoutSessionsTableProps = {
    sessions: WorkoutSessionWithExercises[];
}

/**
 * Renders a table of workout sessions with date, duration, exercise count, notes, and a detail link.
 * Displays an empty state message when no sessions exist.
 *
 * @param sessions - The list of workout sessions to display.
 * @returns A bordered table of sessions, each linking to its detail view.
 */
export const WorkoutSessionsTable = ({sessions}: WorkoutSessionsTableProps) => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Exercises</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No sessions yet
                            </TableCell>
                        </TableRow>
                    ) : sessions.map((s) => (
                        <TableRow key={s.id}>
                            <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                            <TableCell>{s.duration} min</TableCell>
                            <TableCell>{s.exercises.length}</TableCell>
                            <TableCell className="max-w-xs truncate">{s.notes ?? '—'}</TableCell>
                            <TableCell className="text-right">
                                <Button render={<Link href={`/member/workout-sessions/${s.id}`} />} nativeButton={false} variant="ghost" size="sm">
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}