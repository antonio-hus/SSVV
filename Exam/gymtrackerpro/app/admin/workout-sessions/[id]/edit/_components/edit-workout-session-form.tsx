'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {updateWorkoutSession, deleteWorkoutSession} from '@/lib/controller/workout-session-controller';
import {updateWorkoutSessionSchema, UpdateWorkoutSessionInput} from '@/lib/schema/workout-session-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import type {WorkoutSession, WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

type EditWorkoutSessionFormProps = {
    session: WorkoutSessionWithExercises;
    sessionId: string;
}

/**
 * Form for editing a session's date, duration, and notes.
 * Exercises are read-only — they are fixed at creation time. Validates input
 * client-side with Zod before submitting. Redirects to the member's page on delete.
 *
 * @param session - The existing session to pre-populate the form with.
 * @param sessionId - The ID of the session being edited.
 * @returns A controlled form with an update section and a danger zone for deletion.
 */
export const EditWorkoutSessionForm = ({session, sessionId}: EditWorkoutSessionFormProps) => {
    const router = useRouter();
    const [inputs, setInputs] = useState<UpdateWorkoutSessionInput>({
        date: new Date(session.date).toISOString().slice(0, 10),
        duration: session.duration,
        notes: session.notes ?? '',
    });
    const [result, setResult] = useState<ActionResult<WorkoutSession> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setInputs(prev => ({...prev, [name]: name === 'duration' ? Number(value) : value}));
    }, []);

    const handleUpdate = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = updateWorkoutSessionSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await updateWorkoutSession(sessionId, validation.data);
            setResult(res);
            if (res.success) router.refresh();
        });
    }, [inputs, sessionId, router]);

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            await deleteWorkoutSession(sessionId);
            router.push(`/admin/members/${session.memberId}`);
        });
    }, [sessionId, session.memberId, router]);

    return (
        <div className="space-y-6 max-w-lg">
            <form onSubmit={handleUpdate} className="space-y-4">
                {result && !result.success && (
                    <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
                )}
                {result?.success && (
                    <Alert><AlertDescription>Session updated successfully.</AlertDescription></Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            value={inputs.date ?? ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (min)</Label>
                        <Input
                            id="duration"
                            name="duration"
                            type="number"
                            min={0}
                            max={180}
                            value={inputs.duration ?? ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            value={inputs.notes ?? ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground mb-3">Exercises are fixed after creation.</p>
                    <div className="rounded-md border divide-y">
                        {session.exercises.map((exercise) => (
                            <div key={exercise.id} className="flex gap-4 px-4 py-2 text-sm">
                                <span className="flex-1 font-medium">{exercise.exercise.name}</span>
                                <span className="text-muted-foreground">
                                    {exercise.sets}×{exercise.reps} @ {Number(exercise.weight)} kg
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Save Changes'}
                </Button>
            </form>

            <div className="border-t pt-4">
                <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                >
                    Delete Session
                </Button>
            </div>
        </div>
    );
};