import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {Exercise} from '@/lib/domain/exercise';

type ExercisesTableProps = {
    exercises: Exercise[];
}

/**
 * Renders a table of exercises with name, muscle group, equipment, status, and an edit link.
 * Displays an empty state message when no exercises match the current filters.
 *
 * @param exercises - The list of exercises to display.
 * @returns A bordered table of exercises, each linking to its edit view.
 */
export const ExercisesTable = ({exercises}: ExercisesTableProps) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Muscle Group</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {exercises.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No exercises found
                            </TableCell>
                        </TableRow>
                    ) : exercises.map((exercise) => (
                        <TableRow key={exercise.id}>
                            <TableCell className="font-medium">{exercise.name}</TableCell>
                            <TableCell>{exercise.muscleGroup}</TableCell>
                            <TableCell>{exercise.equipmentNeeded}</TableCell>
                            <TableCell>
                                <Badge variant={exercise.isActive ? 'default' : 'secondary'}>
                                    {exercise.isActive ? 'Active' : 'Archived'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button render={<Link href={`/admin/exercises/${exercise.id}/edit`} />} nativeButton={false} variant="ghost" size="sm">
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}