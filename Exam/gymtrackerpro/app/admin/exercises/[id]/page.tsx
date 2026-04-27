import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/layout/page-header';
import {ExerciseDetailInformation} from './_components/exercise-detail-information';
import {getExercise} from '@/lib/controller/exercise-controller';

type ExerciseDetailPageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Admin exercise detail page.
 * Fetches the exercise from the catalogue and renders its specifications in a read-only view.
 *
 * @param params - Resolved route params containing the exercise `id`.
 * @returns A detail view with classification and status info, or a 404 if not found.
 */
export default async function ExerciseDetailPage({params}: ExerciseDetailPageProps) {
    const {id} = await params;

    const result = await getExercise(id);
    if (!result.success) {
        notFound();
    }

    const exercise = result.data;

    return (
        <div>
            <PageHeader title={exercise.name} description="Exercise details">
                <Button render={<Link href="/admin/exercises" />} nativeButton={false} variant="outline">Back</Button>
                <Button render={<Link href={`/admin/exercises/${id}/edit`} />} nativeButton={false}>Edit</Button>
            </PageHeader>

            <ExerciseDetailInformation exercise={exercise}/>
        </div>
    );
}
