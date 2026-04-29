import {render, screen, within} from '@testing-library/react';
import {MemberRecentWorkoutSessions} from '@/app/admin/members/[id]/_components/member-recent-workout-sessions';
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
            id: 'wse-1',
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
            id: 'wse-2',
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

describe('MemberRecentWorkoutSessions', () => {

    it('memberRecentWorkoutSessions_defaultRender_showsHeadingAndAddSessionLink', () => {
        // Arrange
        render(<MemberRecentWorkoutSessions memberId="mem-1" sessions={[]}/>);

        // Assert
        expect(screen.getByRole('heading', {name: 'Recent Sessions'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Add Session'})).toHaveAttribute('href', '/admin/workout-sessions/new?memberId=mem-1');
    });

    it('memberRecentWorkoutSessions_sessionsProvided_showsSessionRows', () => {
        // Arrange
        render(<MemberRecentWorkoutSessions memberId="mem-1" sessions={[mockSession]}/>);

        // Assert
        expect(screen.getByText(new Date(mockSession.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('memberRecentWorkoutSessions_sessionsProvided_rendersEditLinkForSession', () => {
        // Arrange
        render(<MemberRecentWorkoutSessions memberId="mem-1" sessions={[mockSession]}/>);
        const row = screen.getByText('45 min').closest('tr')!;

        // Assert
        expect(within(row).getByRole('button', {name: 'Edit'})).toHaveAttribute('href', '/admin/workout-sessions/session-1/edit');
    });

    it('memberRecentWorkoutSessions_emptySessions_showsEmptyStateMessage', () => {
        // Arrange
        render(<MemberRecentWorkoutSessions memberId="mem-1" sessions={[]}/>);

        // Assert
        expect(screen.getByText('No sessions recorded')).toBeInTheDocument();
    });

});
