import {z} from 'zod';
import {e164PhoneRegex, emailRegex, isoDateRegex} from "@/lib/schema/utils";

const userFields = {
    email: z
        .string()
        .trim()
        .regex(emailRegex, 'Invalid email address')
        .describe('User email address'),
    fullName: z
        .string()
        .trim()
        .min(8, 'Full name must be at least 8 characters')
        .max(64, 'Full name must be at most 64 characters')
        .describe('Full name of the user'),
    phone: z
        .string()
        .trim()
        .regex(e164PhoneRegex, 'Phone number format is incorrect')
        .describe('Phone number'),
    dateOfBirth: z
        .string()
        .trim()
        .regex(isoDateRegex, 'Date of birth must be in YYYY-MM-DD format')
        .refine((val) => {
            const today = new Date().toISOString().slice(0, 10);
            return val < today;
        }, 'Date of birth must be in the past')
        .describe('Date of birth in YYYY-MM-DD format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase character')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .describe('User password'),
};

const membershipStartField = z
    .string()
    .regex(isoDateRegex, 'Membership start date must be in YYYY-MM-DD format')
    .describe('Membership start date in YYYY-MM-DD format');

/** Schema for creating a new user. */
export const createUserSchema = z.object(userFields);

/** Schema for updating an existing user. All fields are optional. */
export const updateUserSchema = z.object({
    email: userFields.email.optional(),
    fullName: userFields.fullName.optional(),
    phone: userFields.phone.optional(),
    dateOfBirth: userFields.dateOfBirth.optional(),
    password: userFields.password.optional(),
});

/** Schema for user login. */
export const loginUserSchema = z.object({
    email: z
        .string()
        .regex(emailRegex, 'Invalid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

/** Schema for creating a new member. */
export const createMemberSchema = z.object({
    ...userFields,
    membershipStart: membershipStartField,
});

/** Schema for creating a new member with an auto-generated temporary password. */
export const createMemberWithTempPasswordSchema = z.object({
    email: userFields.email,
    fullName: userFields.fullName,
    phone: userFields.phone,
    dateOfBirth: userFields.dateOfBirth,
    membershipStart: membershipStartField,
});

/** Schema for creating a new admin. */
export const createAdminSchema = z.object(userFields);

/** Schema for updating an existing member. All fields are optional. */
export const updateMemberSchema = z.object({
    email: userFields.email.optional(),
    fullName: userFields.fullName.optional(),
    phone: userFields.phone.optional(),
    dateOfBirth: userFields.dateOfBirth.optional(),
    password: userFields.password.optional(),
    membershipStart: membershipStartField.optional(),
});

/** Schema for updating an existing admin. All fields are optional. */
export const updateAdminSchema = z.object({
    email: userFields.email.optional(),
    fullName: userFields.fullName.optional(),
    phone: userFields.phone.optional(),
    dateOfBirth: userFields.dateOfBirth.optional(),
    password: userFields.password.optional(),
});

/** Input type for creating a user. */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Input type for updating a user. */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Input type for user login. */
export type LoginUserInput = z.infer<typeof loginUserSchema>;

/** Input type for creating a member. */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

/** Input type for creating a member with an auto-generated temporary password. */
export type CreateMemberWithTempPasswordInput = z.infer<typeof createMemberWithTempPasswordSchema>;

/** Input type for updating a member. */
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/** Input type for creating an admin. */
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/** Input type for updating an admin. */
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
