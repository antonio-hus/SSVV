import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, MemberWithUserAndTempPassword} from '@/lib/domain/user';
import {CreateAdminInput, CreateMemberInput, CreateMemberWithTempPasswordInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import {PageResult} from '@/lib/domain/pagination';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {UserServiceInterface} from '@/lib/service/user-service-interface';
import {AppError} from "@/lib/domain/errors";

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

    /**
     * Generates a random 16-character temporary password.
     * Guarantees at least one uppercase letter, one digit, and one special character.
     */
    private generateTempPassword(): string {
        const LENGTH = 16;
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const all = upper + lower + digits + special;

        const randomChar = (pool: string) => {
            const bytes = new Uint8Array(1);
            crypto.getRandomValues(bytes);
            return pool[bytes[0] % pool.length];
        };

        const required = [
            randomChar(upper),
            randomChar(digits),
            randomChar(special),
        ];

        const remaining = Array.from({length: LENGTH - required.length}, () => randomChar(all));

        const combined = [...required, ...remaining];
        for (let i = combined.length - 1; i > 0; i--) {
            const bytes = new Uint8Array(1);
            crypto.getRandomValues(bytes);
            const j = bytes[0] % (i + 1);
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return combined.join('');
    }

    /** @inheritdoc */
    async createMember(data: CreateMemberInput): Promise<MemberWithUser> {
        return this.userRepository.createMember(data);
    }

    /** @inheritdoc */
    async createMemberWithTempPassword(data: CreateMemberWithTempPasswordInput): Promise<MemberWithUserAndTempPassword> {
        const tempPassword = this.generateTempPassword();
        const member = await this.userRepository.createMember({...data, password: tempPassword});
        return {...member, tempPassword};
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
