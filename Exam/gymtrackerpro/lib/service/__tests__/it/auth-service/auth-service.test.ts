import {prisma} from '@/lib/database';
import {userRepository, authService} from '@/lib/di';
import {AuthorizationError, NotFoundError} from '@/lib/domain/errors';
import {CreateAdminInput, CreateMemberInput, LoginUserInput} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('login', () => {

    it('login_memberUserWithCorrectCredentials_returnsSessionDataWithMemberIdAndIsActive', async () => {
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        const seededMember = await userRepository.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: memberInput.password};

        const result = await authService.login(input);

        expect(result.userId).toBe(seededMember.user.id);
        expect(result.email).toBe(seededMember.user.email);
        expect(result.fullName).toBe(seededMember.user.fullName);
        expect(result.role).toBe('MEMBER');
        expect(result.memberId).toBe(seededMember.id);
        expect(result.isActive).toBe(true);
        expect(result.adminId).toBeUndefined();
    });

    it('login_adminUserWithCorrectCredentials_returnsSessionDataWithAdminIdAndNoMemberFields', async () => {
        const adminInput: CreateAdminInput = {
            email: 'admin@gym.test',
            fullName: 'Test Admin',
            phone: '+40700000001',
            dateOfBirth: '1985-06-15',
            password: 'ValidPass123!',
        };
        const seededAdmin = await userRepository.createAdmin(adminInput);
        const input: LoginUserInput = {email: adminInput.email, password: adminInput.password};

        const result = await authService.login(input);

        expect(result.userId).toBe(seededAdmin.user.id);
        expect(result.email).toBe(seededAdmin.user.email);
        expect(result.fullName).toBe(seededAdmin.user.fullName);
        expect(result.role).toBe('ADMIN');
        expect(result.adminId).toBe(seededAdmin.id);
        expect(result.memberId).toBeUndefined();
        expect(result.isActive).toBeUndefined();
    });

    it('login_emailNotRegistered_throwsNotFoundError', async () => {
        const input: LoginUserInput = {email: 'ghost@gym.test', password: 'AnyPass123!'};

        const action = () => authService.login(input);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('login_incorrectPassword_throwsAuthorizationError', async () => {
        const memberInput: CreateMemberInput = {
            email: 'member@gym.test',
            fullName: 'Test Member',
            phone: '+40700000000',
            dateOfBirth: '1990-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };
        await userRepository.createMember(memberInput);
        const input: LoginUserInput = {email: memberInput.email, password: 'WrongPass999!'};

        const action = () => authService.login(input);

        await expect(action()).rejects.toThrow(AuthorizationError);
    });

});