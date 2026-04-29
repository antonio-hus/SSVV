import {render, screen} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {getMember, updateMember} from '@/lib/controller/user-controller';
import type {SessionData} from '@/lib/domain/session';
import MemberProfilePage from '@/app/member/profile/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    getMember: jest.fn(),
    updateMember: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetMember = getMember as jest.MockedFunction<typeof getMember>;

const mockSessionWithMember = (memberId: string | null) => ({
    userId: 'user-1',
    email: 'john@example.com',
    fullName: 'John Smith',
    role: 'MEMBER',
    memberId,
} as IronSession<SessionData>);

const mockMember = {
    id: 'mem-1',
    userId: 'user-1',
    membershipStart: new Date('2025-01-15T00:00:00.000Z'),
    isActive: true,
    user: {
        id: 'user-1',
        email: 'john@example.com',
        fullName: 'John Smith',
        phone: '+12345678901',
        dateOfBirth: new Date('1990-03-10T00:00:00.000Z'),
        passwordHash: 'hash',
        role: 'MEMBER' as const,
    },
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('MemberProfilePage', () => {

    it('memberProfilePage_memberIdMissing_rendersNothingAndDoesNotFetchMember', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember(null));

        // Act
        const {container} = render(await MemberProfilePage());

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockGetMember).not.toHaveBeenCalled();
    });

    it('memberProfilePage_getMemberFails_showsErrorMessage', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('mem-1'));
        mockGetMember.mockResolvedValueOnce({success: false, message: 'Member not found'});

        render(await MemberProfilePage());

        // Assert
        expect(screen.getByText('Member not found')).toBeInTheDocument();
        expect(mockGetMember).toHaveBeenCalledTimes(1);
        expect(mockGetMember).toHaveBeenCalledWith('mem-1');
    });

    it('memberProfilePage_getMemberSucceeds_rendersHeaderPersonalInfoMembershipAndPasswordForm', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('mem-1'));
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});

        render(await MemberProfilePage());

        // Assert
        expect(screen.getByRole('heading', {name: 'My Profile'})).toBeInTheDocument();
        expect(screen.getByText('Your account information')).toBeInTheDocument();
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Membership')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: 'Change Password'})).toBeInTheDocument();
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(updateMember).not.toHaveBeenCalled();
    });

    it('memberProfilePage_suspendedMember_showsSuspendedMembershipStatus', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('mem-1'));
        mockGetMember.mockResolvedValueOnce({
            success: true,
            data: {...mockMember, isActive: false},
        });

        render(await MemberProfilePage());

        // Assert
        expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

});
