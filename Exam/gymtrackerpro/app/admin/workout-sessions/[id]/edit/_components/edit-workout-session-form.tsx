'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {updateWorkoutSessionWithExercises, deleteWorkoutSession} from '@/lib/controller/workout-session-controller';
import {updateWorkoutSessionSchema, UpdateWorkoutSessionInput, WorkoutSessionExerciseUpdateInput} from '@/lib/schema/workout-session-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {Exercise} from '@/lib/domain/exercise';

type EditWorkoutSessionFormProps = {
    session: WorkoutSessionWithExercises;
    exercises: Exercise[];
    sessionId: string;
}

export const EditWorkoutSessionForm = ({session, exercises, sessionId}: EditWorkoutSessionFormProps) => {
    const router = useRouter();
    const [inputs, setInputs] = useState<UpdateWorkoutSessionInput>({
        date: new Date(session.date).toISOString().slice(0, 10),
        duration: session.duration,
        notes: session.notes ?? '',
    });
    const [rows, setRows] = useState<WorkoutSessionExerciseUpdateInput[]>(
        session.exercises.map((e) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            weight: Number(e.weight),
        }))
    );
    const [result, setResult] = useState<ActionResult<WorkoutSessionWithExercises> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setInputs(prev => ({...prev, [name]: name === 'duration' ? Number(value) : value}));
    }, []);

    const addRow = useCallback(() => {
        setRows(prev => [...prev, {exerciseId: '', sets: 3, reps: 10, weight: 0}]);
    }, []);

    const removeRow = useCallback((index: number) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateRow = useCallback((index: number, field: keyof WorkoutSessionExerciseUpdateInput, value: string | number) => {
        setRows(prev => prev.map((row, i) => i === index ? {...row, [field]: value} : row));
    }, []);

    const handleUpdate = useCallback(async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
            const res = await updateWorkoutSessionWithExercises(sessionId, validation.data, rows);
            setResult(res);
            if (res.success) router.refresh();
        });
    }, [inputs, rows, sessionId, router]);

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            const res = await deleteWorkoutSession(sessionId);
            if (res.success) {
                router.refresh();
                router.push(`/admin/members/${session.memberId}`);
            } else {
                setResult(res);
            }
        });
    }, [sessionId, session.memberId, router]);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) return undefined;
        return result.errors[field]?.[0];
    }, [result]);

    return (
        <div className="space-y-6 max-w-2xl">
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
                        {getFieldError('date') && <p className="text-sm text-destructive">{getFieldError('date')}</p>}
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
                        {getFieldError('duration') && <p className="text-sm text-destructive">{getFieldError('duration')}</p>}
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
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Exercises</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addRow}>
                            Add Exercise
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {rows.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-md border p-3">
                                <div className="col-span-4 space-y-1">
                                    <Label className="text-xs">Exercise</Label>
                                    <select
                                        value={row.exerciseId}
                                        onChange={(e) => updateRow(index, 'exerciseId', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select...</option>
                                        {exercises.map((exercise) => (
                                            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Sets</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={6}
                                        value={row.sets}
                                        onChange={(e) => updateRow(index, 'sets', Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Reps</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={row.reps}
                                        onChange={(e) => updateRow(index, 'reps', Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={500}
                                        step={0.5}
                                        value={row.weight}
                                        onChange={(e) => updateRow(index, 'weight', Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRow(index)}
                                        disabled={rows.length === 1}
                                    >
                                        Remove
                                    </Button>
                                </div>
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