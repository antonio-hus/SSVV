import {render, screen, within} from '@testing-library/react';
import {MembersTable} from '@/app/admin/members/_components/members-table';
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

describe('MembersTable', () => {

    it('membersTable_membersProvided_showsHeadersAndMemberRows', () => {
        // Arrange
        render(<MembersTable members={[
            seedMockMember(),
            seedMockMember({
                id: 'mem-2',
                userId: 'user-2',
                user: {...seedMockMember().user, id: 'user-2', fullName: 'Jane Brown', email: 'jane@example.com'},
            }),
        ]}/>);

        // Assert
        expect(screen.getByRole('columnheader', {name: 'Name'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Email'})).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Brown')).toBeInTheDocument();
    });

    it('membersTable_activeMember_showsActiveStatusBadge', () => {
        // Arrange
        render(<MembersTable members={[seedMockMember({isActive: true})]}/>);

        // Assert
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('membersTable_suspendedMember_showsSuspendedStatusBadge', () => {
        // Arrange
        render(<MembersTable members={[seedMockMember({isActive: false})]}/>);

        // Assert
        expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

    it('membersTable_membersProvided_rendersViewAndEditLinksForEachMember', () => {
        // Arrange
        render(<MembersTable members={[seedMockMember()]}/>);
        const row = screen.getByText('John Smith').closest('tr')!;

        // Assert
        expect(within(row).getByRole('button', {name: 'View'})).toHaveAttribute('href', '/admin/members/mem-1');
        expect(within(row).getByRole('button', {name: 'Edit'})).toHaveAttribute('href', '/admin/members/mem-1/edit');
    });

    it('membersTable_emptyMembers_showsEmptyStateMessage', () => {
        // Arrange
        render(<MembersTable members={[]}/>);

        // Assert
        expect(screen.getByText('No members found')).toBeInTheDocument();
    });

});
