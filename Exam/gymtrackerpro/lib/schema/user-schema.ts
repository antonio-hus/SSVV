import {z} from 'zod';
import {e164PhoneRegex, emailRegex, isoDateRegex} from "@/lib/schema/utils";

/**
 * Reusable validation rules for user-related fields.
 */
const userFields = {
    /**
     * User email address.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Must match a valid email format (via `emailRegex`)
     */
    email: z
        .string()
        .trim()
        .regex(emailRegex, 'Invalid email address')
        .describe('User email address'),

    /**
     * Full name of the user.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Minimum length: 8 characters
     * - Maximum length: 64 characters
     */
    fullName: z
        .string()
        .trim()
        .min(8, 'Full name must be at least 8 characters')
        .max(64, 'Full name must be at most 64 characters')
        .describe('Full name of the user'),

    /**
     * User phone number.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Must follow E.164 international phone format (via `e164PhoneRegex`)
     *   - Typically starts with "+" followed by country code and number
     */
    phone: z
        .string()
        .trim()
        .regex(e164PhoneRegex, 'Phone number format is incorrect')
        .describe('Phone number'),

    /**
     * User date of birth.
     *
     * Constraints:
     * - Must be a string
     * - Must match ISO date format: YYYY-MM-DD
     * - Must satisfy the {@link isoDateRegex} pattern
     * - Must represent a date in the past (strictly less than today)
     *
     * Notes:
     * - Validation compares the input string lexicographically to today's ISO date
     */
    dateOfBirth: z
        .string()
        .regex(isoDateRegex, 'Date of birth must be in YYYY-MM-DD format')
        .refine((val) => {
            const today = new Date().toISOString().slice(0, 10);
            return val < today;
        }, 'Date of birth must be in the past')
        .describe('Date of birth in YYYY-MM-DD format'),

    /**
     * User password.
     *
     * Constraints:
     * - Must be a string
     * - Minimum length: 8 characters
     * - Maximum length: 64 characters
     * - Must contain at least:
     *   - One uppercase letter (A–Z)
     *   - One numeric digit (0–9)
     *   - One special character (non-alphanumeric)
     */
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase character')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .describe('User password'),
};

/**
 * Membership start date.
 *
 * Constraints:
 * - Must be a string
 * - Must match ISO date format: YYYY-MM-DD
 * - Must satisfy the {@link isoDateRegex} pattern
 */
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
    /**
     * User email address.
     *
     * Constraints:
     * - Must be a string
     * - Leading and trailing whitespace is trimmed
     * - Must match a valid email format (via `emailRegex`)
     */
    email: z
        .string()
        .trim()
        .regex(emailRegex, 'Invalid email address')
        .describe('User email address'),

    /**
     * User password.
     *
     * Constraints:
     * - Must be a string
     * - Minimum length: 8 characters
     * - Maximum length: 64 characters
     * - Must contain at least:
     *   - One uppercase letter (A–Z)
     *   - One numeric digit (0–9)
     *   - One special character (non-alphanumeric)
     */
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase character')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .describe('User password'),
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
