'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Card, CardContent} from '@/components/ui/card';
import {createMemberWithTempPassword} from '@/lib/controller/user-controller';
import {createMemberSchema, CreateMemberWithTempPasswordInput} from '@/lib/schema/user-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import {MemberWithUserAndTempPassword} from "@/lib/domain/user";

/**
 * Form for creating a new gym member.
 * Validates input client-side with Zod before submitting. On success renders
 * a one-time panel showing the generated temporary password instead of redirecting.
 *
 * @returns A controlled form component, or a success panel with the temporary password.
 */
export const CreateMemberForm = () => {
    const [inputs, setInputs] = useState<CreateMemberWithTempPasswordInput>({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        membershipStart: '',
    });
    const [result, setResult] = useState<ActionResult<MemberWithUserAndTempPassword> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputs(prev => ({...prev, [e.target.name]: e.target.value}));
    }, []);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) return undefined;
        return result.errors[field]?.[0];
    }, [result]);

    const fullNameError = getFieldError('fullName');
    const emailError = getFieldError('email');
    const phoneError = getFieldError('phone');
    const dateOfBirthError = getFieldError('dateOfBirth');
    const membershipStartError = getFieldError('membershipStart');

    const handleSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = createMemberSchema.omit({password: true}).safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            setResult(await createMemberWithTempPassword(validation.data));
        });
    }, [inputs]);

    if (result?.success) {
        return (
            <Card className="border-green-200 bg-green-50 max-w-lg">
                <CardContent className="pt-6 space-y-3">
                    <p className="font-semibold text-green-800">Member created successfully</p>
                    <p className="text-sm text-green-700">
                        Share this temporary password with <strong>{result.data.user.fullName}</strong>. It will
                        not be shown again.
                    </p>
                    <pre className="bg-white border border-green-200 rounded p-3 text-sm font-mono">
                        {result.data.tempPassword}
                    </pre>
                    <p className="text-xs text-muted-foreground">The member must change this password after first
                        login.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {result && !result.success && (
                <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        value={inputs.fullName}
                        onChange={handleChange}
                        required
                    />
                    {fullNameError && <p className="text-sm text-destructive">{fullNameError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={inputs.email}
                        onChange={handleChange}
                        required
                    />
                    {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        name="phone"
                        placeholder="+1234567890"
                        value={inputs.phone}
                        onChange={handleChange}
                        required
                    />
                    {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={inputs.dateOfBirth}
                        onChange={handleChange}
                        required
                    />
                    {dateOfBirthError && <p className="text-sm text-destructive">{dateOfBirthError}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="membershipStart">Membership Start</Label>
                    <Input
                        id="membershipStart"
                        name="membershipStart"
                        type="date"
                        value={inputs.membershipStart}
                        onChange={handleChange}
                        required
                    />
                    {membershipStartError && <p className="text-sm text-destructive">{membershipStartError}</p>}
                </div>
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create Member'}
            </Button>
        </form>
    );
};