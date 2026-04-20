import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {getExercise} from '@/lib/controller/exercise-controller';
import {PageHeader} from '@/components/layout/page-header';
import {EditExerciseForm} from './_components/edit-exercise-form';

type EditExercisePageProps = {
    params: Promise<{ id: string }>;
}

/**
 * Edit exercise page.
 * Fetches the exercise by ID server-side and renders a form for updating,
 * archiving, and deleting it.
 *
 * @param params - Resolved route params containing the exercise `id`.
 * @returns An edit form pre-populated with the exercise data, or a 404 if not found.
 */
export default async function EditExercisePage({params}: EditExercisePageProps) {
    const {id} = await params;

    const result = await getExercise(id);
    if (!result.success) notFound();

    return (
        <div>
            <PageHeader title={`Edit: ${result.data.name}`} description="Update exercise details">
                <Button render={<Link href="/admin/exercises" />} nativeButton={false} variant="outline">
                    Back to Exercises
                </Button>
            </PageHeader>
            <EditExerciseForm exercise={result.data} exerciseId={id}/>
        </div>
    );
}