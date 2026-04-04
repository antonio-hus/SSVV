'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import type {MemberWithUser} from '@/lib/domain/user';
import {updateMemberSchema, UpdateMemberInput} from '@/lib/schema/user-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import {updateMember, suspendMember, activateMember, deleteMember} from '@/lib/controller/user-controller';

type EditMemberFormProps = {
    member: MemberWithUser;
    memberId: string;
}

/**
 * Form for updating a member's profile, with suspend/activate and delete sections.
 * Validates update input client-side with Zod before submitting. Redirects to
 * the member detail page on suspend/activate, and to the members list on delete.
 *
 * @param member - The existing member to pre-populate the form with.
 * @param memberId - The ID of the member being edited.
 * @returns A controlled form with update, membership status, and danger zone sections.
 */
export const EditMemberForm = ({member, memberId}: EditMemberFormProps) => {
    const router = useRouter();
    const [inputs, setInputs] = useState<UpdateMemberInput>({
        fullName: member.user.fullName,
        email: member.user.email,
        phone: member.user.phone,
        dateOfBirth: new Date(member.user.dateOfBirth).toISOString().slice(0, 10),
        membershipStart: new Date(member.membershipStart).toISOString().slice(0, 10),
    });
    const [result, setResult] = useState<ActionResult<MemberWithUser> | null>(null);
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

    const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
            if (res.success) router.refresh();
        });
    }, [inputs, memberId, router]);

    const handleSuspend = useCallback(() => {
        startTransition(async () => {
            await suspendMember(memberId);
            router.push(`/admin/members/${memberId}`);
        });
    }, [memberId, router]);

    const handleActivate = useCallback(() => {
        startTransition(async () => {
            await activateMember(memberId);
            router.push(`/admin/members/${memberId}`);
        });
    }, [memberId, router]);

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            const res = await deleteMember(memberId);
            if (res.success) {
                router.refresh();
                router.push('/admin/members');
            } else {
                setResult(res);
            }
        });
    }, [memberId, router]);

    return (
        <div className="space-y-6 max-w-lg">
            <form onSubmit={handleUpdate} className="space-y-4">
                {result && !result.success && (
                    <Alert variant="destructive"><AlertDescription>{result.message}</AlertDescription></Alert>
                )}
                {result?.success && (
                    <Alert><AlertDescription>Member updated successfully.</AlertDescription></Alert>
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
                        />
                        {membershipStartError && <p className="text-sm text-destructive">{membershipStartError}</p>}
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Save Changes'}
                </Button>
            </form>

            <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Membership Status</p>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={member.isActive ? handleSuspend : handleActivate}
                >
                    {member.isActive ? 'Suspend Member' : 'Activate Member'}
                </Button>
            </div>

            <div className="border-t pt-4">
                <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                >
                    Delete Member
                </Button>
            </div>
        </div>
    );
};