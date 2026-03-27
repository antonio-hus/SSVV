import {z} from 'zod';
import {createUserSchema, updateUserSchema} from '@/lib/schema/user-schema';
import {isoDateRegex} from "@/lib/schema/utils";

/**
 * Schema for creating a member.
 */
export const createMemberSchema = createUserSchema.extend(
    z.object({
        membershipStart: z
            .string()
            .min(1, 'Membership start date is required')
            .regex(isoDateRegex, 'Membership start date must be in YYYY-MM-DD format')
            .describe('Membership start date in YYYY-MM-DD format'),
    })
);

/**
 * Schema for updating a member.
 */
export const updateMemberSchema = updateUserSchema.extend(
    z.object({
        membershipStart: z
            .string()
            .regex(isoDateRegex, 'Membership start date must be in YYYY-MM-DD format')
            .optional()
            .describe('Updated membership start date in YYYY-MM-DD format'),
    })
);

/** Input type for creating a member. */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

/** Input type for updating a member. */
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;