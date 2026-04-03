import {redirect} from 'next/navigation';

/**
 * Admin workout sessions index page.
 * Immediately redirects to the new session form since there is no standalone sessions list.
 */
export default function AdminWorkoutSessionsPage() {
    redirect('/admin/workout-sessions/new');
}