import type {ActionResult} from '@/lib/domain/action-result';
import type {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser} from '@/lib/domain/user';
import type {CreateAdminInput, CreateMemberInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for member and admin management server actions.
 */
export interface UserControllerInterface {
    /**
     * Creates a new gym member.
     *
     * @param data - Validated member creation input including membership start date.
     * @returns The created member on success, or a conflict error.
     */
    createMember(data: CreateMemberInput): Promise<ActionResult<MemberWithUser>>;

    /**
     * Creates a new administrator account.
     *
     * @param data - Validated admin creation input.
     * @returns The created admin on success, or a conflict error.
     */
    createAdmin(data: CreateAdminInput): Promise<ActionResult<AdminWithUser>>;

    /**
     * Retrieves a single member by their member ID.
     *
     * @param memberId - The member ID.
     * @returns The member record on success, or a not-found error.
     */
    getMember(memberId: string): Promise<ActionResult<MemberWithUser>>;

    /**
     * Retrieves a single admin by their admin ID.
     *
     * @param adminId - The admin ID.
     * @returns The admin record on success, or a not-found error.
     */
    getAdmin(adminId: string): Promise<ActionResult<AdminWithUser>>;

    /**
     * Returns a paginated list of members, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of member records and the total count.
     */
    listMembers(options?: MemberListOptions): Promise<ActionResult<PageResult<MemberWithUser>>>;

    /**
     * Returns a paginated list of admins, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of admin records and the total count.
     */
    listAdmins(options?: AdminListOptions): Promise<ActionResult<PageResult<AdminWithUser>>>;

    /**
     * Updates a member's profile and user fields.
     *
     * @param memberId - The member ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated member on success, or a not-found / conflict error.
     */
    updateMember(memberId: string, data: UpdateMemberInput): Promise<ActionResult<MemberWithUser>>;

    /**
     * Suspends a member by setting their `isActive` flag to `false`.
     *
     * @param memberId - The member ID.
     * @returns The updated member on success, or a not-found error.
     */
    suspendMember(memberId: string): Promise<ActionResult<MemberWithUser>>;

    /**
     * Reactivates a previously suspended member.
     *
     * @param memberId - The member ID.
     * @returns The updated member on success, or a not-found error.
     */
    activateMember(memberId: string): Promise<ActionResult<MemberWithUser>>;

    /**
     * Updates an admin's profile and user fields.
     *
     * @param adminId - The admin ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated admin on success, or a not-found / conflict error.
     */
    updateAdmin(adminId: string, data: UpdateAdminInput): Promise<ActionResult<AdminWithUser>>;

    /**
     * Permanently removes a member and their associated user account.
     *
     * @param memberId - The member ID.
     * @returns A success result with no data, or a not-found error.
     */
    deleteMember(memberId: string): Promise<ActionResult<void>>;

    /**
     * Permanently removes an admin and their associated user account.
     *
     * @param adminId - The admin ID.
     * @returns A success result with no data, or a not-found error.
     */
    deleteAdmin(adminId: string): Promise<ActionResult<void>>;
}
