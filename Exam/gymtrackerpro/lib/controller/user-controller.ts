'use server';

import {UserServiceInterface} from '@/lib/service/user-service-interface';
import {UserControllerInterface} from '@/lib/controller/user-controller-interface';
import {ActionResult} from '@/lib/domain/action-result';
import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser} from '@/lib/domain/user';
import {PageResult} from '@/lib/domain/pagination';
import {z} from 'zod';
import {CreateAdminInput, createAdminSchema, CreateMemberInput, createMemberSchema, UpdateAdminInput, updateAdminSchema, UpdateMemberInput, updateMemberSchema} from '@/lib/schema/user-schema';
import {AppError} from '@/lib/domain/errors';

/**
 * Implementation of {@link UserControllerInterface} — member and admin management server actions.
 */
export class UserController implements UserControllerInterface {
    private static instance: UserController;
    private readonly userService: UserServiceInterface;

    private constructor(userService: UserServiceInterface) {
        this.userService = userService;
    }

    /**
     * Returns the singleton instance, creating it with the given service on first call.
     *
     * @param userService - The user service to use for member and admin operations.
     */
    static getInstance(userService: UserServiceInterface): UserController {
        if (!UserController.instance) {
            UserController.instance = new UserController(userService);
        }
        return UserController.instance;
    }

    // -------------------------------------------------------------------------
    // Members
    // -------------------------------------------------------------------------

    /** @inheritdoc */
    async createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>> {
        const result = createMemberSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.userService.createMember(result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async getMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
        try {
            return {success: true, data: await this.userService.getMember(memberId)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>> {
        try {
            return {success: true, data: await this.userService.listMembers(options)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>> {
        const result = updateMemberSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.userService.updateMember(memberId, result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
        try {
            return {success: true, data: await this.userService.suspendMember(memberId)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async activateMember(memberId: string): Promise<ActionResult<MemberWithUser>> {
        try {
            return {success: true, data: await this.userService.activateMember(memberId)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async deleteMember(memberId: string): Promise<ActionResult<void>> {
        try {
            await this.userService.deleteMember(memberId);
            return {success: true, data: undefined};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    // -------------------------------------------------------------------------
    // Admins
    // -------------------------------------------------------------------------

    /** @inheritdoc */
    async createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>> {
        const result = createAdminSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.userService.createAdmin(result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>> {
        try {
            return {success: true, data: await this.userService.getAdmin(adminId)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>> {
        try {
            return {success: true, data: await this.userService.listAdmins(options)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>> {
        const result = updateAdminSchema.safeParse(data);
        if (!result.success) {
            return {success: false, message: 'Validation failed', errors: z.flattenError(result.error).fieldErrors};
        }

        try {
            return {success: true, data: await this.userService.updateAdmin(adminId, result.data)};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }

    /** @inheritdoc */
    async deleteAdmin(adminId: string): Promise<ActionResult<void>> {
        try {
            await this.userService.deleteAdmin(adminId);
            return {success: true, data: undefined};
        } catch (error) {
            if (error instanceof AppError) {
                return {success: false, message: error.message};
            }
            return {success: false, message: 'An unexpected error occurred'};
        }
    }
}
