import {render, screen} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';
import type {SessionData} from '@/lib/domain/session';
import MemberDashboardPage from '@/app/member/dashboard/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    listMemberWorkoutSessions: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockListMemberWorkoutSessions = listMemberWorkoutSessions as jest.MockedFunction<typeof listMemberWorkoutSessions>;

const mockSessionWithMember = (fullName: string | null, memberId: string | null = 'mem-1') => ({
    userId: 'user-1',
    email: 'john@example.com',
    fullName,
    role: 'MEMBER',
    memberId,
} as IronSession<SessionData>);

const mockWorkoutSession = {
    id: 'session-1',
    memberId: 'mem-1',
    date: new Date('2026-02-20T00:00:00.000Z'),
    duration: 45,
    notes: 'Solid effort',
    exercises: [],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('MemberDashboardPage', () => {

    it('memberDashboardPage_memberIdMissing_rendersNothingAndDoesNotFetchSessions', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('John Smith', null));

        // Act
        const {container} = render(await MemberDashboardPage());

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockListMemberWorkoutSessions).not.toHaveBeenCalled();
    });

    it('memberDashboardPage_fullNameDefined_rendersPersonalizedHeadingAndStats', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('John Smith'));
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 7},
        });

        render(await MemberDashboardPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Welcome, John Smith'})).toBeInTheDocument();
        expect(screen.getByText('Your fitness overview')).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Recorded workouts')).toBeInTheDocument();
    });

    it('memberDashboardPage_fullNameNull_rendersMemberFallbackHeading', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember(null));
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 0},
        });

        render(await MemberDashboardPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Welcome, Member'})).toBeInTheDocument();
    });

    it('memberDashboardPage_sessionsLoadSucceeds_rendersRecentSessionsPreview', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('John Smith'));
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 1},
        });

        render(await MemberDashboardPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Recent Sessions'})).toBeInTheDocument();
        expect(screen.getByText(new Date(mockWorkoutSession.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'View'})).toHaveAttribute('href', '/member/workout-sessions/session-1');
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledTimes(1);
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 5});
    });

    it('memberDashboardPage_sessionsLoadFails_showsZeroTotalAndEmptyRecentSessions', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('John Smith'));
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: false,
            message: 'Could not load sessions',
        });

        render(await MemberDashboardPage());

        // Assert
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('No workoutSessions yet')).toBeInTheDocument();
    });

});
