'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import type {Exercise} from '@/lib/domain/exercise';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {updateExerciseSchema, UpdateExerciseInput} from '@/lib/schema/exercise-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import {updateExercise, archiveExercise, unarchiveExercise, deleteExercise} from '@/lib/controller/exercise-controller';

type EditExerciseFormProps = {
    exercise: Exercise;
    exerciseId: string;
}

/**
 * Form for editing an existing exercise, with archive/unarchive and delete sections.
 * Validates update input client-side with Zod before submitting. Redirects to
 * the exercises list on archive, unarchive, or delete.
 *
 * @param exercise - The existing exercise to pre-populate the form with.
 * @param exerciseId - The ID of the exercise being edited.
 * @returns A controlled form with update, archive, and danger zone sections.
 */
export const EditExerciseForm = ({exercise, exerciseId}: EditExerciseFormProps) => {
    const router = useRouter();
    const [inputs, setInputs] = useState<UpdateExerciseInput>({
        name: exercise.name,
        description: exercise.description ?? '',
        muscleGroup: exercise.muscleGroup,
        equipmentNeeded: exercise.equipmentNeeded,
    });
    const [result, setResult] = useState<ActionResult<Exercise> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setInputs(prev => ({...prev, [e.target.name]: e.target.value}));
    }, []);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) return undefined;
        return result.errors[field]?.[0];
    }, [result]);

    const nameError = getFieldError('name');
    const descriptionError = getFieldError('description');
    const muscleGroupError = getFieldError('muscleGroup');
    const equipmentNeededError = getFieldError('equipmentNeeded');

    const handleUpdate = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = updateExerciseSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await updateExercise(exerciseId, validation.data);
            if (res.success) {
                setResult(res);
                router.refresh();
            } else {
                setResult(res);
            }
        });
    }, [inputs, exerciseId, router]);

    const handleArchive = useCallback(() => {
        startTransition(async () => {
            const res = await archiveExercise(exerciseId);
            if (res.success) {
                router.push('/admin/exercises');
            } else {
                setResult(res);
            }
        });
    }, [exerciseId, router]);

    const handleUnarchive = useCallback(() => {
        startTransition(async () => {
            const res = await unarchiveExercise(exerciseId);
            if (res.success) {
                router.push('/admin/exercises');
            } else {
                setResult(res);
            }
        });
    }, [exerciseId, router]);

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            const res = await deleteExercise(exerciseId);
            if (res.success) {
                router.push('/admin/exercises');
            } else {
                setResult(res);
            }
        });
    }, [exerciseId, router]);

    return (
        <div className="space-y-6 max-w-lg">
            <form onSubmit={handleUpdate} className="space-y-4">
                {result && !result.success && (
                    <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
                )}
                {result?.success && (
                    <Alert><AlertDescription>Exercise updated successfully.</AlertDescription></Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={inputs.name}
                        onChange={handleChange}
                        required
                    />
                    {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={inputs.description}
                        onChange={handleChange}
                    />
                    {descriptionError && <p className="text-sm text-destructive">{descriptionError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="muscleGroup">Muscle Group</Label>
                        <select
                            id="muscleGroup"
                            name="muscleGroup"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={inputs.muscleGroup}
                            onChange={handleChange}
                        >
                            {Object.values(MuscleGroup).map((muscleGroup) => (
                                <option key={muscleGroup} value={muscleGroup}>{muscleGroup}</option>
                            ))}
                        </select>
                        {muscleGroupError && <p className="text-sm text-destructive">{muscleGroupError}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="equipmentNeeded">Equipment</Label>
                        <select
                            id="equipmentNeeded"
                            name="equipmentNeeded"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={inputs.equipmentNeeded}
                            onChange={handleChange}
                        >
                            {Object.values(Equipment).map((equipment) => (
                                <option key={equipment} value={equipment}>{equipment}</option>
                            ))}
                        </select>
                        {equipmentNeededError && <p className="text-sm text-destructive">{equipmentNeededError}</p>}
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Save Changes'}
                </Button>
            </form>

            <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Archive Status</p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={exercise.isActive ? handleArchive : handleUnarchive}
                >
                    {exercise.isActive ? 'Archive' : 'Unarchive'}
                </Button>
            </div>

            <div className="border-t pt-4">
                <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                >
                    Delete Exercise
                </Button>
            </div>
        </div>
    );
};