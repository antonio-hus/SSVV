'use server';

import {userService} from '@/lib/di';
import {ActionResult} from '@/lib/domain/action-result';
import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, MemberWithUserAndTempPassword} from '@/lib/domain/user';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateAdminInput, createAdminSchema, CreateMemberInput, createMemberSchema, CreateMemberWithTempPasswordInput, createMemberWithTempPasswordSchema, UpdateAdminInput, updateAdminSchema, UpdateMemberInput, updateMemberSchema} from '@/lib/schema/user-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Validates the input and registers a new gym member with a provided password.
 *
 * @param data - Member creation input including email, password, and membership start date.
 * @returns The newly created member with the parent user included, or a validation/conflict error.
 */
export async function createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>> {
    const result = createMemberSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await userService.createMember(result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and registers a new gym member with an auto-generated temporary password.
 *
 * @param data - Member creation input excluding the password field.
 * @returns The newly created member with the temporary password included, or a validation/conflict error.
 */
export async function createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<ActionResult<MemberWithUserAndTempPassword>> {
    const result = createMemberWithTempPasswordSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await userService.createMemberWithTempPassword(result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and registers a new administrator account.
 *
 * @param data - Admin creation input including email and password.
 * @returns The newly created admin with the parent user included, or a validation/conflict error.
 */
export async function createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>> {
    const result = createAdminSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await userService.createAdmin(result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Retrieves a single member by their member ID.
 *
 * @param memberId - The member ID.
 * @returns The member with the parent user included, or a not-found error.
 */
export async function getMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
    try {
        return {success: true, data: await userService.getMember(memberId)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Retrieves a single admin by their admin ID.
 *
 * @param adminId - The admin ID.
 * @returns The admin with the parent user included, or a not-found error.
 */
export async function getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>> {
    try {
        return {success: true, data: await userService.getAdmin(adminId)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Returns a paginated list of members, optionally filtered by name or email.
 *
 * @param options - Optional search term and pagination parameters.
 * @returns A page of members with the parent user included, and the total count.
 */
export async function listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>> {
    try {
        return {success: true, data: await userService.listMembers(options)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Returns a paginated list of admins, optionally filtered by name or email.
 *
 * @param options - Optional search term and pagination parameters.
 * @returns A page of admins with the parent user included, and the total count.
 */
export async function listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>> {
    try {
        return {success: true, data: await userService.listAdmins(options)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and updates a member's profile and user fields.
 *
 * @param memberId - The member ID.
 * @param data - Fields to update (all optional).
 * @returns The updated member, or a validation/not-found/conflict error.
 */
export async function updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>> {
    const result = updateMemberSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await userService.updateMember(memberId, result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Validates the input and updates an admin's profile and user fields.
 *
 * @param adminId - The admin ID.
 * @param data - Fields to update (all optional).
 * @returns The updated admin, or a validation/not-found/conflict error.
 */
export async function updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>> {
    const result = updateAdminSchema.safeParse(data);
    if (!result.success) {
        return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
    }
    try {
        return {success: true, data: await userService.updateAdmin(adminId, result.data)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Suspends a member by setting their active flag to false.
 *
 * @param memberId - The member ID.
 * @returns The updated member, or a not-found error.
 */
export async function suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
    try {
        return {success: true, data: await userService.suspendMember(memberId)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Reactivates a previously suspended member by setting their active flag to true.
 *
 * @param memberId - The member ID.
 * @returns The updated member, or a not-found error.
 */
export async function activateMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
    try {
        return {success: true, data: await userService.activateMember(memberId)};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Permanently removes a member and their associated user account.
 *
 * @param memberId - The member ID.
 * @returns A success result with no data, or a not-found error.
 */
export async function deleteMember(memberId: string): Promise<ActionResult<void>> {
    try {
        await userService.deleteMember(memberId);
        return {success: true, data: undefined};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}

/**
 * Permanently removes an admin and their associated user account.
 *
 * @param adminId - The admin ID.
 * @returns A success result with no data, or a not-found error.
 */
export async function deleteAdmin(adminId: string): Promise<ActionResult<void>> {
    try {
        await userService.deleteAdmin(adminId);
        return {success: true, data: undefined};
    } catch (error) {
        if (error instanceof AppError) {
            return {success: false, message: error.message};
        }
        return {success: false, message: 'An unexpected error occurred'};
    }
}
