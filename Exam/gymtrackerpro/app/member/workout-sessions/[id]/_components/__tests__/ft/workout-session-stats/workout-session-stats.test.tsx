import {render, screen} from '@testing-library/react';
import {WorkoutSessionStats} from '@/app/member/workout-sessions/[id]/_components/workout-session-stats';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

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

describe('WorkoutSessionStats', () => {

    it('workoutSessionStats_defaultRender_showsDurationExerciseCountAndVolumeCards', () => {
        // Arrange
        render(<WorkoutSessionStats workoutSession={mockWorkoutSession} totalVolume={9600}/>);

        // Assert
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('Exercises')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Total Volume')).toBeInTheDocument();
        expect(screen.getByText('9,600 kg')).toBeInTheDocument();
    });

    it('workoutSessionStats_noExercises_showsZeroExerciseCount', () => {
        // Arrange
        render(<WorkoutSessionStats workoutSession={{...mockWorkoutSession, exercises: []}} totalVolume={0}/>);

        // Assert
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('0 kg')).toBeInTheDocument();
    });

});
