import {render, screen} from '@testing-library/react';
import {notFound} from 'next/navigation';
import {getMember} from '@/lib/controller/user-controller';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';
import MemberDetailPage from '@/app/admin/members/[id]/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    getMember: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    listMemberWorkoutSessions: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockListMemberWorkoutSessions = listMemberWorkoutSessions as jest.MockedFunction<typeof listMemberWorkoutSessions>;

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

const mockSession = {
    id: 'session-1',
    memberId: 'mem-1',
    date: new Date('2026-02-20T00:00:00.000Z'),
    duration: 45,
    notes: null,
    exercises: [],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('MemberDetailPage', () => {

    it('memberDetailPage_getMemberSucceeds_rendersHeaderActionsDetailsAndSessions', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockListMemberWorkoutSessions.mockResolvedValueOnce({success: true, data: {items: [mockSession], total: 1}});

        render(await MemberDetailPage({params: Promise.resolve({id: 'mem-1'})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'John Smith'})).toBeInTheDocument();
        expect(screen.getByText('Member profile')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/members');
        expect(screen.getAllByRole('button', {name: 'Edit'}).map(link => link.getAttribute('href'))).toContain('/admin/members/mem-1/edit');
        expect(screen.getByRole('button', {name: 'View Report'})).toHaveAttribute('href', '/admin/members/mem-1/report');
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(mockGetMember).toHaveBeenCalledWith('mem-1');
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 10});
    });

    it('memberDetailPage_sessionsLoadFails_rendersRecentSessionsEmptyState', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockListMemberWorkoutSessions.mockResolvedValueOnce({success: false, message: 'Could not load sessions'});

        render(await MemberDetailPage({params: Promise.resolve({id: 'mem-1'})}));

        // Assert
        expect(screen.getByText('No sessions recorded')).toBeInTheDocument();
    });

    it('memberDetailPage_getMemberFails_callsNotFound', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: false, message: 'Member not found'});
        mockListMemberWorkoutSessions.mockResolvedValueOnce({success: true, data: {items: [], total: 0}});

        // Act
        let caughtError: Error | undefined;
        try {
            await MemberDetailPage({params: Promise.resolve({id: 'missing-member'})});
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetMember).toHaveBeenCalledWith('missing-member');
    });

});
