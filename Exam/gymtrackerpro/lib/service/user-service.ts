import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {UserServiceInterface} from '@/lib/service/user-service-interface';
import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser} from '@/lib/domain/user';
import {CreateAdminInput, CreateMemberInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import {PageResult} from '@/lib/domain/pagination';

/**
 * Implementation of {@link UserServiceInterface} providing member and admin management.
 */
export class UserService implements UserServiceInterface {
    private static instance: UserService;
    private readonly userRepository: UserRepositoryInterface;

    private constructor(userRepository: UserRepositoryInterface) {
        this.userRepository = userRepository;
    }

    /**
     * Returns the singleton instance, creating it with the given repository on first call.
     *
     * @param userRepository - The user repository to use for member and admin data access.
     */
    static getInstance(userRepository: UserRepositoryInterface): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService(userRepository);
        }
        return UserService.instance;
    }

    /** @inheritdoc */
    async createMember(data: CreateMemberInput): Promise<MemberWithUser> {
        return this.userRepository.createMember(data);
    }

    /** @inheritdoc */
    async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {
        return this.userRepository.createAdmin(data);
    }

    /** @inheritdoc */
    async getMember(memberId: string): Promise<MemberWithUser> {
        return this.userRepository.findMemberById(memberId);
    }

    /** @inheritdoc */
    async getAdmin(adminId: string): Promise<AdminWithUser> {
        return this.userRepository.findAdminById(adminId);
    }

    /** @inheritdoc */
    async listMembers(options?: MemberListOptions): Promise<PageResult<MemberWithUser>> {
        return this.userRepository.findMembers(options);
    }

    /** @inheritdoc */
    async listAdmins(options?: AdminListOptions): Promise<PageResult<AdminWithUser>> {
        return this.userRepository.findAdmins(options);
    }

    /** @inheritdoc */
    async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {
        return this.userRepository.updateMember(memberId, data);
    }

    /** @inheritdoc */
    async suspendMember(memberId: string): Promise<MemberWithUser> {
        return this.userRepository.setMemberActive(memberId, false);
    }

    /** @inheritdoc */
    async activateMember(memberId: string): Promise<MemberWithUser> {
        return this.userRepository.setMemberActive(memberId, true);
    }

    /** @inheritdoc */
    async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {
        return this.userRepository.updateAdmin(adminId, data);
    }

    /** @inheritdoc */
    async deleteMember(memberId: string): Promise<void> {
        return this.userRepository.delete(memberId);
    }

    /** @inheritdoc */
    async deleteAdmin(adminId: string): Promise<void> {
        return this.userRepository.delete(adminId);
    }
}
