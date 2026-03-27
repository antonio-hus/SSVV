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

/**
 * Schema for creating a new member.
 * Extends user fields with membership start date.
 */
export const createMemberSchema = createUserSchema.extend({
    membershipStart: z
        .string()
        .regex(isoDateRegex, 'Membership start date must be in YYYY-MM-DD format')
        .describe('Membership start date in YYYY-MM-DD format'),
});

/**
 * Schema for updating an existing member.
 * All fields are optional.
 */
export const updateMemberSchema = updateUserSchema.extend({
    membershipStart: z
        .string()
        .regex(isoDateRegex, 'Membership start date must be in YYYY-MM-DD format')
        .optional()
        .describe('Updated membership start date in YYYY-MM-DD format'),
});

/**
 * Schema for creating a new admin.
 */
export const createAdminSchema = createUserSchema;

/**
 * Schema for updating an existing admin.
 * All fields are optional.
 */
export const updateAdminSchema = updateUserSchema;

/** Input type for creating a user. */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Input type for updating a user. */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Input type for user login. */
export type LoginUserInput = z.infer<typeof loginUserSchema>;

/** Input type for creating a member. */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

/** Input type for updating a member. */
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/** Input type for creating an admin. */
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/** Input type for updating an admin. */
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;