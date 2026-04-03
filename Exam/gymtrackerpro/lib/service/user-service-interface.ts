import type {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, MemberWithUserAndTempPassword} from '@/lib/domain/user';
import type {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for member and admin management business logic.
 */
export interface UserServiceInterface {
    /**
     * Registers a new gym member.
     *
     * @param data - Validated member creation input including membership start date.
     * @returns The newly created member record with the parent user included.
     * @throws {ConflictError} If the email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    createMember(data: CreateMemberInput): Promise<MemberWithUser>;

    /**
     * Registers a new gym member with an auto-generated temporary password.
     *
     * @param data - Validated member creation input excluding the password field.
     * @returns The newly created member record with the parent user included.
     * @throws {ConflictError} If the email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<MemberWithUserAndTempPassword>;

    /**
     * Registers a new administrator account.
     *
     * @param data - Validated admin creation input.
     * @returns The newly created admin record with the parent user included.
     * @throws {ConflictError} If the email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    createAdmin(data: CreateAdminInput): Promise<AdminWithUser>;

    /**
     * Retrieves a single member by their member ID.
     *
     * @param memberId - The member ID.
     * @returns The member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    getMember(memberId: string): Promise<MemberWithUser>;

    /**
     * Retrieves a single admin by their admin ID.
     *
     * @param adminId - The admin ID.
     * @returns The admin record with the parent user included.
     * @throws {NotFoundError} If no admin with the given ID exists.
     */
    getAdmin(adminId: string): Promise<AdminWithUser>;

    /**
     * Returns a paginated list of members, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of member records (each with the parent user included) and the total count.
     */
    listMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>>;

    /**
     * Returns a paginated list of admins, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of admin records (each with the parent user included) and the total count.
     */
    listAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>>;

    /**
     * Updates a member's profile and user fields.
     *
     * @param memberId - The member ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     * @throws {ConflictError} If the new email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser>;

    /**
     * Updates an admin's profile and user fields.
     *
     * @param adminId - The admin ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated admin record with the parent user included.
     * @throws {NotFoundError} If no admin with the given ID exists.
     * @throws {ConflictError} If the new email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser>;

    /**
     * Suspends a member by setting their `isActive` flag to `false`.
     *
     * @param memberId - The member ID.
     * @returns The updated member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    suspendMember(memberId: string): Promise<MemberWithUser>;

    /**
     * Reactivates a previously suspended member by setting their `isActive` flag to `true`.
     *
     * @param memberId - The member ID.
     * @returns The updated member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    activateMember(memberId: string): Promise<MemberWithUser>;

    /**
     * Permanently removes a member and their associated user account.
     *
     * @param memberId - The member ID.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    deleteMember(memberId: string): Promise<void>;

    /**
     * Permanently removes an admin and their associated user account.
     *
     * @param adminId - The admin ID.
     * @throws {NotFoundError} If no admin with the given ID exists.
     */
    deleteAdmin(adminId: string): Promise<void>;
}
