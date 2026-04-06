import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type MemberRecentSessionsProps = {
    memberId: string;
    sessions: WorkoutSessionWithExercises[];
}

/**
 * Renders a labelled table of recent workout sessions for a specific member.
 * Displays an empty state when no sessions exist, and includes an "Add Session"
 * link pre-scoped to the member.
 *
 * @param memberId - The ID of the member, used to scope the add session link.
 * @param sessions - The list of recent workout sessions to display.
 * @returns A table of sessions with an edit link per row.
 */
export const MemberRecentWorkoutSessions = ({memberId, sessions}: MemberRecentSessionsProps) => (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Button render={<Link href={`/admin/workout-sessions/new?memberId=${memberId}`} />} nativeButton={false} size="sm">
                Add Session
            </Button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Exercises</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No sessions recorded
                            </TableCell>
                        </TableRow>
                    ) : sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                            <TableCell>{session.duration} min</TableCell>
                            <TableCell>{session.exercises.length}</TableCell>
                            <TableCell className="text-right">
                                <Button render={<Link href={`/admin/workout-sessions/${session.id}/edit`} />} nativeButton={false} variant="ghost" size="sm">
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
);