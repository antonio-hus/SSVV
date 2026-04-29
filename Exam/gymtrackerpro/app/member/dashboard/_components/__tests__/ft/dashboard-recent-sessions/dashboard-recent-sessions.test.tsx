import {render, screen, within} from '@testing-library/react';
import {DashboardRecentSessions} from '@/app/member/dashboard/_components/dashboard-recent-sessions';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

const mockSession: WorkoutSessionWithExercises = {
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

describe('DashboardRecentSessions', () => {

    it('dashboardRecentSessions_defaultRender_showsHeadingAndViewAllLink', () => {
        // Arrange
        render(<DashboardRecentSessions workoutSessions={[]}/>);

        // Assert
        expect(screen.getByRole('heading', {name: 'Recent Sessions'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'View All'})).toHaveAttribute('href', '/member/workout-sessions');
    });

    it('dashboardRecentSessions_sessionsProvided_showsSessionRows', () => {
        // Arrange
        render(<DashboardRecentSessions workoutSessions={[mockSession]}/>);

        // Assert
        expect(screen.getByText(new Date(mockSession.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('dashboardRecentSessions_sessionsProvided_rendersViewLinkForSession', () => {
        // Arrange
        render(<DashboardRecentSessions workoutSessions={[mockSession]}/>);
        const row = screen.getByText('45 min').closest('tr')!;

        // Assert
        expect(within(row).getByRole('button', {name: 'View'})).toHaveAttribute('href', '/member/workout-sessions/session-1');
    });

    it('dashboardRecentSessions_emptySessions_showsEmptyStateMessage', () => {
        // Arrange
        render(<DashboardRecentSessions workoutSessions={[]}/>);

        // Assert
        expect(screen.getByText('No workoutSessions yet')).toBeInTheDocument();
    });

});
