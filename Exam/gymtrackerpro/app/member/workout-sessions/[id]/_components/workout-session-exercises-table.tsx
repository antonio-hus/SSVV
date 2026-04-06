import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type SessionExercisesTableProps = {
    exercises: WorkoutSessionWithExercises['exercises'];
}

/**
 * Renders a table of exercises performed in a single workout session.
 * Each row shows the exercise name, muscle group, sets, reps, weight, and computed volume.
 *
 * @param exercises - The list of exercises logged in the session.
 * @returns A bordered table of exercise entries with per-row volume.
 */
export const WorkoutSessionExercisesTable = ({exercises}: SessionExercisesTableProps) => {
    return (
        <div>
            <h2 className="text-lg font-semibold mb-3">Exercises</h2>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Exercise</TableHead>
                            <TableHead>Muscle Group</TableHead>
                            <TableHead className="text-right">Sets</TableHead>
                            <TableHead className="text-right">Reps</TableHead>
                            <TableHead className="text-right">Weight (kg)</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exercises.map((exercise) => {
                            const weight = Number(exercise.weight);
                            return (
                                <TableRow key={exercise.id}>
                                    <TableCell className="font-medium">{exercise.exercise.name}</TableCell>
                                    <TableCell>{exercise.exercise.muscleGroup}</TableCell>
                                    <TableCell className="text-right">{exercise.sets}</TableCell>
                                    <TableCell className="text-right">{exercise.reps}</TableCell>
                                    <TableCell className="text-right">{weight}</TableCell>
                                    <TableCell
                                        className="text-right">{exercise.sets * exercise.reps * weight}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}