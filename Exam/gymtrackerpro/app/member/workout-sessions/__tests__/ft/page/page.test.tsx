import {render, screen, within} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {listMemberWorkoutSessions} from '@/lib/controller/workout-session-controller';
import type {SessionData} from '@/lib/domain/session';
import MemberWorkoutSessionsPage from '@/app/member/workout-sessions/page';
import {ActionResult} from "@/lib/domain/action-result";
import {PageResult} from "@/lib/domain/pagination";
import {WorkoutSessionWithExercises} from "@/lib/domain/workout-session";

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

const mockSessionWithMember = (memberId: string | null = 'mem-1') => ({
    userId: 'user-1',
    email: 'john@example.com',
    fullName: 'John Smith',
    role: 'MEMBER',
    memberId,
} as unknown as IronSession<SessionData>);

const mockExerciseRow = {
    id: 'row-1',
    workoutSessionId: 'session-1',
    exerciseId: 'ex-1',
    sets: 3,
    reps: 10,
    weight: 80,
    exercise: {
        id: 'ex-1',
        name: 'Barbell Bench Press',
        description: null,
        muscleGroup: 'CHEST',
        equipmentNeeded: 'BARBELL',
        isActive: true,
    },
};

const mockWorkoutSession = {
    id: 'session-1',
    memberId: 'mem-1',
    date: new Date('2026-02-20T00:00:00.000Z'),
    duration: 45,
    notes: 'Solid effort',
    exercises: [mockExerciseRow],
};

const mockSessionWithoutNotes = {
    ...mockWorkoutSession,
    id: 'session-2',
    date: new Date('2026-02-21T00:00:00.000Z'),
    duration: 60,
    notes: null,
    exercises: [],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('MemberWorkoutSessionsPage', () => {

    it('memberWorkoutSessionsPage_memberIdMissing_rendersNothingAndDoesNotFetchSessions', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember(null));

        // Act
        const {container} = render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockGetSession).toHaveBeenCalledTimes(1);
        expect(mockListMemberWorkoutSessions).not.toHaveBeenCalled();
    });

    it('memberWorkoutSessionsPage_defaultPage_fetchesFirstPageAndRendersSessionTable', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 1},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByRole('heading', {name: 'My Sessions'})).toBeInTheDocument();
        expect(screen.getByText('Your workout history')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Date'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Duration'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Exercises'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Notes'})).toBeInTheDocument();
        expect(screen.getByText(new Date(mockWorkoutSession.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('Solid effort')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'View'})).toHaveAttribute('href', '/member/workout-sessions/session-1');
        expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledTimes(1);
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_multipleSessions_rendersEachRowAndDashForMissingNotes', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession, mockSessionWithoutNotes], total: 2},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(3);
        expect(screen.getByText(new Date(mockSessionWithoutNotes.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('60 min')).toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();
        expect(screen.getAllByRole('button', {name: 'View'})[1]).toHaveAttribute('href', '/member/workout-sessions/session-2');
    });

    it('memberWorkoutSessionsPage_firstPageWithMoreResults_rendersOnlyNextPaginationLink', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 25},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('(25 total)')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Previous'})).not.toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/member/workout-sessions?page=2');
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_middlePage_fetchesRequestedPageAndRendersPreviousAndNextLinks', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 25},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({page: '2'}),
        }));

        // Assert
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Previous'})).toHaveAttribute('href', '/member/workout-sessions?page=1');
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/member/workout-sessions?page=3');
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 2, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_lastPage_rendersOnlyPreviousPaginationLink', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 25},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({page: '3'}),
        }));

        // Assert
        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Previous'})).toHaveAttribute('href', '/member/workout-sessions?page=2');
        expect(screen.queryByRole('button', {name: 'Next'})).not.toBeInTheDocument();
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 3, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_nonNumericPageParam_passesNaNPageToListAndRendersPaginationLabel', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [mockWorkoutSession], total: 25},
        } as ActionResult<PageResult<WorkoutSessionWithExercises>>);
        
        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({page: 'abc'}),
        }));

        // Assert
        expect(screen.getByText('Page NaN of 3')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Previous'})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Next'})).not.toBeInTheDocument();
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: NaN, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_emptyResult_rendersTableEmptyStateWithoutPagination', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 0},
        });

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByText('No sessions yet')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getByText('No sessions yet')).toBeInTheDocument();
        expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 10});
    });

    it('memberWorkoutSessionsPage_sessionsLoadFails_showsReturnedErrorMessageWithoutTable', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockListMemberWorkoutSessions.mockResolvedValueOnce({
            success: false,
            message: 'Could not load sessions',
        });

        // Act
        render(await MemberWorkoutSessionsPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByText('Could not load sessions')).toBeInTheDocument();
        expect(screen.queryByRole('heading', {name: 'My Sessions'})).not.toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(mockListMemberWorkoutSessions).toHaveBeenCalledWith('mem-1', {page: 1, pageSize: 10});
    });

});