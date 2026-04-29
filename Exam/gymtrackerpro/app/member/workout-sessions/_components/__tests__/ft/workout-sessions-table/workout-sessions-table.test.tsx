import {render, screen, within} from '@testing-library/react';
import {WorkoutSessionsTable} from '@/app/member/workout-sessions/_components/workout-sessions-table';
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

describe('WorkoutSessionsTable', () => {

    it('workoutSessionsTable_defaultRender_showsColumnHeaders', () => {
        // Arrange
        render(<WorkoutSessionsTable sessions={[]}/>);

        // Assert
        expect(screen.getByRole('columnheader', {name: 'Date'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Duration'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Exercises'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Notes'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Actions'})).toBeInTheDocument();
    });

    it('workoutSessionsTable_emptySessions_showsEmptyStateMessage', () => {
        // Arrange
        render(<WorkoutSessionsTable sessions={[]}/>);

        // Assert
        expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    });

    it('workoutSessionsTable_sessionsProvided_showsSessionRows', () => {
        // Arrange
        render(<WorkoutSessionsTable sessions={[mockSession]}/>);

        // Assert
        expect(screen.getByText(new Date(mockSession.date).toLocaleDateString())).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Solid effort')).toBeInTheDocument();
    });

    it('workoutSessionsTable_sessionWithoutNotes_showsDashPlaceholder', () => {
        // Arrange
        render(<WorkoutSessionsTable sessions={[{...mockSession, notes: null}]}/>);

        // Assert
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('workoutSessionsTable_sessionsProvided_rendersViewLinkForSession', () => {
        // Arrange
        render(<WorkoutSessionsTable sessions={[mockSession]}/>);
        const row = screen.getByText('45 min').closest('tr')!;

        // Assert
        expect(within(row).getByRole('button', {name: 'View'})).toHaveAttribute('href', '/member/workout-sessions/session-1');
    });

});
