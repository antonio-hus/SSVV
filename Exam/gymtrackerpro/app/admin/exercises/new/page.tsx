import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PageHeader} from '@/components/page-header';
import {CreateExerciseForm} from './_components/create-exercise-form';

/**
 * New exercise page.
 * Renders a form for adding a new exercise to the catalogue.
 *
 * @returns A page with a creation form and a back link to the exercises list.
 */
export default async function NewExercisePage() {
    return (
        <div>
            <PageHeader title="Add Exercise" description="Add a new exercise to the catalogue">
                <Button render={<Link href="/admin/exercises" />} nativeButton={false} variant="outline">
                    Back to Exercises
                </Button>
            </PageHeader>
            <CreateExerciseForm />
        </div>
    );
}