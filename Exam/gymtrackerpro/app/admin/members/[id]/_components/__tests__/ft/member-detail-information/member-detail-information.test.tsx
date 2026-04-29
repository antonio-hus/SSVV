import {render, screen} from '@testing-library/react';
import {MemberDetailInformation} from '@/app/admin/members/[id]/_components/member-detail-information';
import type {MemberWithUser} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

const seedMockMember = (overrides: Partial<MemberWithUser> = {}): MemberWithUser => ({
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
        role: 'MEMBER',
    },
    ...overrides,
});

describe('MemberDetailInformation', () => {

    it('memberDetailInformation_defaultMember_showsContactAndMembershipDetails', () => {
        // Arrange
        const member = seedMockMember();
        render(<MemberDetailInformation member={member}/>);

        // Assert
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('+12345678901')).toBeInTheDocument();
        expect(screen.getByText(new Date(member.user.dateOfBirth).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('Membership')).toBeInTheDocument();
        expect(screen.getByText(new Date(member.membershipStart).toLocaleDateString())).toBeInTheDocument();
    });

    it('memberDetailInformation_activeMember_showsActiveStatus', () => {
        // Arrange
        render(<MemberDetailInformation member={seedMockMember({isActive: true})}/>);

        // Assert
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('memberDetailInformation_suspendedMember_showsSuspendedStatus', () => {
        // Arrange
        render(<MemberDetailInformation member={seedMockMember({isActive: false})}/>);

        // Assert
        expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

});
