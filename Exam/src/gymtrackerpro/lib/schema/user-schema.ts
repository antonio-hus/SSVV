import {z} from 'zod';
import {e164PhoneRegex, emailRegex, isoDateRegex} from "@/lib/schema/utils";

/**
 * Schema for creating a new user.
 */
export const createUserSchema = z.object({
    email: z
        .string()
        .regex(emailRegex, 'Invalid email address')
        .describe('User email address'),
    fullName: z
        .string()
        .min(8, 'Full name must be at least 8 characters')
        .max(64, 'Full name must be at most 64 characters')
        .describe('Full name of the user'),
    phone: z
        .string()
        .regex(e164PhoneRegex, 'Phone number must be in E.164 format')
        .describe('Phone number'),
    dateOfBirth: z
        .string()
        .regex(isoDateRegex, 'Date of birth must be in YYYY-MM-DD format')
        .describe('Date of birth in YYYY-MM-DD format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .describe('User password'),
});

/**
 * Schema for updating an existing user.
 * All fields are optional.
 */
export const updateUserSchema = z.object({
    email: z
        .string()
        .regex(emailRegex, 'Invalid email address')
        .optional()
        .describe('Updated user email address'),
    fullName: z
        .string()
        .min(8, 'Full name must be at least 8 characters')
        .max(64, 'Full name must be at most 64 characters')
        .optional()
        .describe('Updated full name of the user'),
    phone: z
        .string()
        .regex(e164PhoneRegex, 'Phone number must be in E.164 format')
        .optional()
        .describe('Updated phone number'),
    dateOfBirth: z
        .string()
        .regex(isoDateRegex, 'Date of birth must be in YYYY-MM-DD format')
        .optional()
        .describe('Updated date of birth in YYYY-MM-DD format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .optional()
        .describe('Updated user password'),
});

/**
 * Schema for user login.
 */
export const loginUserSchema = z.object({
    email: z
        .string()
        .regex(emailRegex, 'Invalid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

/** Input type for creating a user. */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Input type for updating a user. */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Input type for user login. */
export type LoginUserInput = z.infer<typeof loginUserSchema>;