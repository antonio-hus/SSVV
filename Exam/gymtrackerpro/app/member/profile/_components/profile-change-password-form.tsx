'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import type {ActionResult} from '@/lib/domain/action-result';
import type {MemberWithUser} from '@/lib/domain/user';
import {updateMemberSchema, UpdateMemberInput} from '@/lib/schema/user-schema';
import {updateMember} from '@/lib/controller/user-controller';

type ChangePasswordFormProps = {
    memberId: string;
}

/**
 * Renders a password change form for the currently authenticated member.
 * Validates input client-side before submitting, and resets the form on success.
 *
 * @param memberId - The ID of the member whose password is being updated.
 * @returns A controlled form component with inline validation feedback.
 */
export const ProfileChangePasswordForm = ({memberId}: ChangePasswordFormProps) => {
    const [inputs, setInputs] = useState<UpdateMemberInput>({password: ''});
    const [result, setResult] = useState<ActionResult<MemberWithUser> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputs(prev => ({...prev, [e.target.name]: e.target.value}));
    }, []);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) return undefined;
        return result.errors[field]?.[0];
    }, [result]);

    const passwordError = getFieldError('password');

    const handleSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = updateMemberSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await updateMember(memberId, validation.data);
            setResult(res);
            if (res.success) {
                setInputs({password: ''});
            }
        });
    }, [inputs, memberId]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            {result && !result.success && (
                <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
            )}
            {result?.success && (
                <Alert><AlertDescription>Password updated successfully.</AlertDescription></Alert>
            )}
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={inputs.password}
                    onChange={handleChange}
                    required
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating…' : 'Update Password'}
            </Button>
        </form>
    );
};