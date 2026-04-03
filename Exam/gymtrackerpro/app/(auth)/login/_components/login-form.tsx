'use client';

import React, {useState, useTransition, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Role} from '@/lib/domain/user';
import {loginUserSchema, LoginUserInput} from '@/lib/schema/user-schema';
import type {ActionResult} from '@/lib/domain/action-result';
import type {SessionData} from '@/lib/domain/session';
import {login as authLogin} from '@/lib/controller/auth-controller';

/**
 * Renders the login form with client-side validation.
 * On successful login, redirects the user to the role-specific dashboard.
 *
 * @returns A React component rendering a login form with error handling and role-based redirection.
 */
export const LoginForm = () => {
    const router = useRouter();
    const [inputs, setInputs] = useState<LoginUserInput>({email: '', password: ''});
    const [result, setResult] = useState<ActionResult<SessionData> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputs(prev => ({...prev, [e.target.name]: e.target.value}));
    }, []);

    const getFieldError = useCallback((field: string): string | undefined => {
        if (!result || result.success || !result.errors) {
            return undefined;
        }

        return result.errors[field]?.[0];
    }, [result]);

    const emailError = getFieldError('email');
    const passwordError = getFieldError('password');

    const handleSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validation = loginUserSchema.safeParse(inputs);
        if (!validation.success) {
            setResult({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(validation.error).fieldErrors,
            });
            return;
        }

        startTransition(async () => {
            const res = await authLogin(validation.data);
            if (res.success && res.data) {
                switch (res.data.role) {
                    case Role.ADMIN:
                        router.push('/admin/dashboard');
                        break;
                    case Role.MEMBER:
                        router.push('/member/dashboard');
                        break;
                    default:
                        router.push('/login');
                        break;
                }
            } else {
                setResult(res);
            }
        });
    }, [inputs, router]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {result && !result.success && (
                <Alert variant="destructive">
                    <AlertDescription>{result.message}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={inputs.email}
                    onChange={handleChange}
                    required
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={inputs.password}
                    onChange={handleChange}
                    required
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
        </form>
    );
};