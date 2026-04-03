'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {MuscleGroup, Equipment} from '@/lib/domain/exercise';
import {createExercise} from '@/lib/controller/exercise-controller';
import {createExerciseSchema, CreateExerciseInput} from '@/lib/schema/exercise-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import type {Exercise} from '@/lib/domain/exercise';

/**
 * Form for adding a new exercise to the catalogue.
 * Validates input client-side with Zod before submitting, and redirects
 * to the exercises list on success.
 *
 * @returns A controlled form component with inline validation feedback.
 */
export const CreateExerciseForm = () => {
    const router = useRouter();
    const [inputs, setInputs] = useState<CreateExerciseInput>({
        name: '',
        description: '',
        muscleGroup: '' as MuscleGroup,
        equipmentNeeded: '' as Equipment,
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
    const muscleGroupError = getFieldError('muscleGroup');
    const equipmentNeededError = getFieldError('equipmentNeeded');

    const handleSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = createExerciseSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await createExercise(validation.data);
            if (res.success) {
                router.push('/admin/exercises');
            } else {
                setResult(res);
            }
        });
    }, [inputs, router]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {result && !result.success && (
                <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
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
                        required
                    >
                        <option value="">Select…</option>
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
                        required
                    >
                        <option value="">Select…</option>
                        {Object.values(Equipment).map((equipment) => (
                            <option key={equipment} value={equipment}>{equipment}</option>
                        ))}
                    </select>
                    {equipmentNeededError && <p className="text-sm text-destructive">{equipmentNeededError}</p>}
                </div>
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create Exercise'}
            </Button>
        </form>
    );
};