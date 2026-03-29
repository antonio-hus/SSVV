import type {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, UserWithProfile} from '@/lib/domain/user';
import type {CreateAdminInput, CreateMemberInput, UpdateAdminInput, UpdateMemberInput,} from '@/lib/schema/user-schema';
import type {PageResult} from '@/lib/domain/pagination';

/**
 * Contract for user and member data access.
 */
export interface UserRepositoryInterface {
    /**
     * Creates a new member atomically — both the `User` and `Member` records
     * are written in a single database statement.
     * The password is hashed with bcrypt before persistence.
     *
     * @param data - Validated member creation input including membership start date.
     * @returns The newly created member record with the parent user included.
     * @throws {ConflictError} If the email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    createMember(data: CreateMemberInput): Promise<MemberWithUser>;

    /**
     * Creates a new admin atomically — both the `User` and `Admin` records
     * are written in a single database statement.
     * The password is hashed with bcrypt before persistence.
     *
     * @param data - Validated admin creation input.
     * @returns The newly created user record with the nested admin profile.
     * @throws {ConflictError} If the email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    createAdmin(data: CreateAdminInput): Promise<AdminWithUser>;

    /**
     * Finds a user by their unique identifier, including their role-specific profile.
     *
     * @param id - The user ID.
     * @returns The user record with the nested member or admin profile.
     * @throws {NotFoundError} If no user with the given ID exists.
     */
    findById(id: string): Promise<UserWithProfile>;

    /**
     * Finds a user by their email address, including their role-specific profile.
     *
     * @param email - The user's email address.
     * @returns The user record with profile, or `null` if not found.
     */
    findByEmail(email: string): Promise<UserWithProfile | null>;

    /**
     * Returns a paginated list of members, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of member records (each with the parent user included) and the total count.
     */
    findMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>>;

    /**
     * Returns a paginated list of admins, optionally filtered by name or email.
     *
     * @param options - Optional search term and pagination parameters.
     * @returns A page of member records (each with the parent user included) and the total count.
     */
    findAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>>;

    /**
     * Updates a member's user and membership fields atomically via a single nested write.
     * If a new password is provided it is hashed before persistence.
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
     * Updates an admin's user fields atomically via a single nested write.
     * If a new password is provided it is hashed before persistence.
     *
     * @param adminId - The admin ID.
     * @param data - Validated fields to update (all optional).
     * @returns The updated member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     * @throws {ConflictError} If the new email address is already registered.
     * @throws {TransactionError} If the atomic write fails.
     */
    updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser>;

    /**
     * Activates or suspends a member by toggling `isActive`.
     *
     * @param memberId - The member ID.
     * @param isActive - `true` to activate, `false` to suspend.
     * @returns The updated member record with the parent user included.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    setMemberActive(memberId: string, isActive: boolean): Promise<MemberWithUser>;

    /**
     * Permanently removes a member.
     *
     * @param memberId - The member ID.
     * @throws {NotFoundError} If no member with the given ID exists.
     */
    delete(memberId: string): Promise<void>;

    /**
     * Permanently removes an admin.
     *
     * @param adminId - The admin ID.
     * @throws {NotFoundError} If no admin with the given ID exists.
     */
    delete(adminId: string): Promise<void>;
}
