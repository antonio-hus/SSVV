import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import type {Exercise} from '@/lib/domain/exercise';

type ExerciseDetailInfoProps = {
    exercise: Exercise;
}

/**
 * Renders exercise details and archive status cards for a single exercise.
 *
 * @param exercise - The exercise whose details are displayed.
 * @returns A two-card grid showing exercise information and archive status.
 */
export const ExerciseDetailInformation = ({exercise}: ExerciseDetailInfoProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classification</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Muscle Group</dt>
                        <dd className="text-sm font-medium text-right truncate">{exercise.muscleGroup}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Equipment</dt>
                        <dd className="text-sm font-medium text-right">{exercise.equipmentNeeded}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Availability</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Status</dt>
                        <dd>
                            <Badge variant={exercise.isActive ? 'default' : 'secondary'}>
                                {exercise.isActive ? 'Active' : 'Archived'}
                            </Badge>
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
        {exercise.description && (
            <Card className="md:col-span-2 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                </div>
                <CardContent className="px-4 py-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exercise.description}</p>
                </CardContent>
            </Card>
        )}
    </div>
);
