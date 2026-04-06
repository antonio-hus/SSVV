import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type DashboardRecentSessionsProps = {
    workoutSessions: WorkoutSessionWithExercises[];
}

/**
 * Renders a preview table of the member's most recent workout workoutSessions.
 * Displays an empty state message when no workoutSessions exist, otherwise lists
 * each session's date, duration, and exercise count with a link to the detail view.
 *
 * @param workoutSessions - The most recent workout workoutSessions to display.
 * @returns A labelled table with a "View All" link to the full workoutSessions list.
 */
export const DashboardRecentSessions = ({workoutSessions}: DashboardRecentSessionsProps) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Sessions</h2>
                <Button render={<Link href="/member/workout-sessions" />} nativeButton={false} variant="outline" size="sm">
                    View All
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
                        {workoutSessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No workoutSessions yet
                                </TableCell>
                            </TableRow>
                        ) : workoutSessions.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                                <TableCell>{s.duration} min</TableCell>
                                <TableCell>{s.exercises.length}</TableCell>
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
        </div>
    );
}