import bcrypt from 'bcryptjs';
import {LoginUserInput} from '@/lib/schema/user-schema';
import {SessionData} from '@/lib/domain/session';
import {AuthorizationError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {AuthServiceInterface} from '@/lib/service/auth-service-interface';

/**
 * Implementation of {@link AuthServiceInterface} providing credential verification.
 */
export class AuthService implements AuthServiceInterface {
    private static instance: AuthService;
    private readonly userRepository: UserRepositoryInterface;

    private constructor(userRepository: UserRepositoryInterface) {
        this.userRepository = userRepository;
    }

    /**
     * Returns the singleton instance, creating it with the given repository on first call.
     *
     * @param userRepository - The user repository to use for credential lookup.
     */
    static getInstance(userRepository: UserRepositoryInterface): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService(userRepository);
        }
        return AuthService.instance;
    }

    /** @inheritdoc */
    async login(data: LoginUserInput): Promise<SessionData> {
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            throw new AuthorizationError('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!passwordMatch) {
            throw new AuthorizationError('Invalid email or password');
        }

        return {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            memberId: user.member?.id,
            adminId: user.admin?.id,
        };
    }
}