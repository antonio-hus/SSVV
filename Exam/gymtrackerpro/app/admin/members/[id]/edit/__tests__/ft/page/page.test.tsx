import {render, screen} from '@testing-library/react';
import {notFound, useRouter} from 'next/navigation';
import {getMember, updateMember} from '@/lib/controller/user-controller';
import EditMemberPage from '@/app/admin/members/[id]/edit/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    getMember: jest.fn(),
    updateMember: jest.fn(),
    suspendMember: jest.fn(),
    activateMember: jest.fn(),
    deleteMember: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockPush = jest.fn();
const mockRefresh = jest.fn();

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
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditMemberPage', () => {

    it('editMemberPage_getMemberSucceeds_rendersHeaderBackLinkAndPrefilledForm', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});

        render(await EditMemberPage({params: Promise.resolve({id: 'mem-1'})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Edit: John Smith'})).toBeInTheDocument();
        expect(screen.getByText('Update member details')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/members/mem-1');
        expect(screen.getByLabelText('Full Name')).toHaveValue('John Smith');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeInTheDocument();
        expect(mockGetMember).toHaveBeenCalledWith('mem-1');
        expect(updateMember).not.toHaveBeenCalled();
    });

    it('editMemberPage_getMemberFails_callsNotFound', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: false, message: 'Member not found'});

        // Act
        let caughtError: Error | undefined;
        try {
            await EditMemberPage({params: Promise.resolve({id: 'missing-member'})});
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetMember).toHaveBeenCalledWith('missing-member');
    });

});
