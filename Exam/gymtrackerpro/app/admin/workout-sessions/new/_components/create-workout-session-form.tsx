'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {createWorkoutSession} from '@/lib/controller/workout-session-controller';
import {createWorkoutSessionSchema, CreateWorkoutSessionInput, WorkoutSessionExerciseInput} from '@/lib/schema/workout-session-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {Exercise} from '@/lib/domain/exercise';

type CreateWorkoutSessionFormProps = {
    exercises: Exercise[];
    defaultMemberId?: string;
}

/**
 * Form for recording a workout session with an inline exercise list.
 * Validates session input client-side with Zod before submitting. Redirects
 * to the member's detail page on success.
 *
 * @param exercises - The full list of available exercises to select from.
 * @param defaultMemberId - Optional member ID to pre-fill the member field.
 * @returns A controlled form with session details and a dynamic exercise row list.
 */
export const CreateWorkoutSessionForm = ({exercises, defaultMemberId}: CreateWorkoutSessionFormProps) => {
    const router = useRouter();
    const [inputs, setInputs] = useState<CreateWorkoutSessionInput>({
        memberId: defaultMemberId ?? '',
        date: '',
        duration: 60,
        notes: '',
    });
    const [rows, setRows] = useState<WorkoutSessionExerciseInput[]>([
        {exerciseId: '', sets: 3, reps: 10, weight: 0},
    ]);
    const [result, setResult] = useState<ActionResult<WorkoutSessionWithExercises> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setInputs(prev => ({...prev, [name]: name === 'duration' ? Number(value) : value}));
    }, []);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) return undefined;
        return result.errors[field]?.[0];
    }, [result]);

    const memberIdError = getFieldError('memberId');
    const dateError = getFieldError('date');
    const durationError = getFieldError('duration');

    const addRow = useCallback(() => {
        setRows(prev => [...prev, {exerciseId: '', sets: 3, reps: 10, weight: 0}]);
    }, []);

    const removeRow = useCallback((index: number) => {
        setRows(prev => prev.filter((_, rowIndex) => rowIndex !== index));
    }, []);

    const updateRow = useCallback((index: number, field: keyof WorkoutSessionExerciseInput, value: string | number) => {
        setRows(prev => prev.map((row, rowIndex) => rowIndex === index ? {...row, [field]: value} : row));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = createWorkoutSessionSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await createWorkoutSession(validation.data, rows);
            if (res.success) {
                router.push(`/admin/members/${inputs.memberId}`);
            } else {
                setResult(res);
            }
        });
    }, [inputs, rows, router]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {result && !result.success && (
                <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="memberId">Member ID</Label>
                    <Input
                        id="memberId"
                        name="memberId"
                        value={inputs.memberId}
                        onChange={handleChange}
                        required
                    />
                    {memberIdError && <p className="text-sm text-destructive">{memberIdError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={inputs.date}
                        onChange={handleChange}
                        required
                    />
                    {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                        id="duration"
                        name="duration"
                        type="number"
                        min={0}
                        max={180}
                        value={inputs.duration}
                        onChange={handleChange}
                        required
                    />
                    {durationError && <p className="text-sm text-destructive">{durationError}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={2}
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
                {isPending ? 'Creating...' : 'Create Session'}
            </Button>
        </form>
    );
};