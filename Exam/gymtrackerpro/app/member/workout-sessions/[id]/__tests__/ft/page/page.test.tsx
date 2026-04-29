import {render, screen} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {getWorkoutSession} from '@/lib/controller/workout-session-controller';
import type {SessionData} from '@/lib/domain/session';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import MemberWorkoutSessionDetailPage from '@/app/member/workout-sessions/[id]/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    getWorkoutSession: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetWorkoutSession = getWorkoutSession as jest.MockedFunction<typeof getWorkoutSession>;

const mockSessionWithMember = (memberId: string | null = 'mem-1') => ({
    userId: 'user-1',
    email: 'john@example.com',
    fullName: 'John Smith',
    role: 'MEMBER',
    memberId,
} as IronSession<SessionData>);

const mockWorkoutSession: WorkoutSessionWithExercises = {
    id: 'session-1',
    memberId: 'mem-1',
    date: new Date('2026-02-20T00:00:00.000Z'),
    duration: 45,
    notes: 'Solid effort',
    exercises: [
        {
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
        },
        {
            id: 'row-2',
            workoutSessionId: 'session-1',
            exerciseId: 'ex-2',
            sets: 4,
            reps: 8,
            weight: 60,
            exercise: {
                id: 'ex-2',
                name: 'Cable Row',
                description: null,
                muscleGroup: 'BACK',
                equipmentNeeded: 'CABLE',
                isActive: true,
            },
        },
    ],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('MemberWorkoutSessionDetailPage', () => {

    it('memberWorkoutSessionDetailPage_memberIdMissing_rendersNothingAndDoesNotFetchSession', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember(null));

        // Act
        const {container} = render(await MemberWorkoutSessionDetailPage({
            params: Promise.resolve({id: 'session-1'}),
        }));

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockGetWorkoutSession).not.toHaveBeenCalled();
    });

    it('memberWorkoutSessionDetailPage_sessionFetchFails_rendersNothing', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockGetWorkoutSession.mockResolvedValueOnce({success: false, message: 'Session not found'});

        // Act
        const {container} = render(await MemberWorkoutSessionDetailPage({
            params: Promise.resolve({id: 'missing-session'}),
        }));

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockGetWorkoutSession).toHaveBeenCalledWith('missing-session');
    });

    it('memberWorkoutSessionDetailPage_sessionBelongsToDifferentMember_rendersNothing', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember('mem-1'));
        mockGetWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: {...mockWorkoutSession, memberId: 'mem-2'},
        });

        // Act
        const {container} = render(await MemberWorkoutSessionDetailPage({
            params: Promise.resolve({id: 'session-1'}),
        }));

        // Assert
        expect(container.firstChild).toBeNull();
    });

    it('memberWorkoutSessionDetailPage_validSession_rendersHeaderStatsNotesAndExercises', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockGetWorkoutSession.mockResolvedValueOnce({success: true, data: mockWorkoutSession});

        render(await MemberWorkoutSessionDetailPage({
            params: Promise.resolve({id: 'session-1'}),
        }));

        // Assert
        expect(screen.getByRole('heading', {name: `Session - ${new Date(mockWorkoutSession.date).toLocaleDateString()}`})).toBeInTheDocument();
        expect(screen.getByText('45 minutes')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/member/workout-sessions');
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('4,320 kg')).toBeInTheDocument();
        expect(screen.getByText('Notes:')).toBeInTheDocument();
        expect(screen.getByText('Solid effort')).toBeInTheDocument();
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(screen.getByText('Cable Row')).toBeInTheDocument();
        expect(mockGetWorkoutSession).toHaveBeenCalledWith('session-1');
    });

    it('memberWorkoutSessionDetailPage_sessionWithoutNotes_omitsNotesBlock', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockGetWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: {...mockWorkoutSession, notes: null},
        });

        render(await MemberWorkoutSessionDetailPage({
            params: Promise.resolve({id: 'session-1'}),
        }));

        // Assert
        expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    });

});
