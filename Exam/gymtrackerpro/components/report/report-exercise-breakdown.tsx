import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {Report} from '@/lib/domain/report';

type ReportExerciseBreakdownProps = {
    breakdown: Report['exerciseBreakdown'];
}

/**
 * Renders a table breaking down exercise performance across sessions in the report period.
 *
 * @param breakdown - Array of per-exercise aggregates from the progress report.
 * @returns A bordered table of exercises with volume and frequency stats, or null if empty.
 */
export const ReportExerciseBreakdown = ({breakdown}: ReportExerciseBreakdownProps) => {
    if (breakdown.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-lg font-semibold mb-3">Exercise Breakdown</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Exercise</TableHead>
                            <TableHead>Muscle Group</TableHead>
                            <TableHead className="text-right">Sessions</TableHead>
                            <TableHead className="text-right">Sets</TableHead>
                            <TableHead className="text-right">Reps</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {breakdown.map((exercise) => (
                            <TableRow key={exercise.exerciseId}>
                                <TableCell className="font-medium">{exercise.exerciseName}</TableCell>
                                <TableCell>{exercise.muscleGroup}</TableCell>
                                <TableCell className="text-right">{exercise.sessionCount}</TableCell>
                                <TableCell className="text-right">{exercise.totalSets}</TableCell>
                                <TableCell className="text-right">{exercise.totalReps}</TableCell>
                                <TableCell className="text-right">{exercise.totalVolume.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};