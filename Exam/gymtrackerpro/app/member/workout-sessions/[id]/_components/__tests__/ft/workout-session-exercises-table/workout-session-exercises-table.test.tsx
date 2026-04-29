import {render, screen} from '@testing-library/react';
import {
    WorkoutSessionExercisesTable
} from '@/app/member/workout-sessions/[id]/_components/workout-session-exercises-table';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

const mockExercises: WorkoutSessionWithExercises['exercises'] = [
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
];

describe('WorkoutSessionExercisesTable', () => {

    it('workoutSessionExercisesTable_defaultRender_showsHeadingAndColumnHeaders', () => {
        // Arrange
        render(<WorkoutSessionExercisesTable exercises={[]}/>);

        // Assert
        expect(screen.getByRole('heading', {name: 'Exercises'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Exercise'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Muscle Group'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Sets'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Reps'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Weight (kg)'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Volume'})).toBeInTheDocument();
    });

    it('workoutSessionExercisesTable_exercisesProvided_showsExerciseRows', () => {
        // Arrange
        render(<WorkoutSessionExercisesTable exercises={mockExercises}/>);

        // Assert
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(screen.getByText('CHEST')).toBeInTheDocument();
        expect(screen.getByText('Cable Row')).toBeInTheDocument();
        expect(screen.getByText('BACK')).toBeInTheDocument();
    });

    it('workoutSessionExercisesTable_exercisesProvided_calculatesPerExerciseVolume', () => {
        // Arrange
        render(<WorkoutSessionExercisesTable exercises={mockExercises}/>);

        // Assert
        expect(screen.getByText('2400')).toBeInTheDocument();
        expect(screen.getByText('1920')).toBeInTheDocument();
    });

    it('workoutSessionExercisesTable_decimalWeight_displaysNumericWeightAndVolume', () => {
        // Arrange
        render(<WorkoutSessionExercisesTable exercises={[{...mockExercises[0], weight: 22.5}]}/>);

        // Assert
        expect(screen.getByText('22.5')).toBeInTheDocument();
        expect(screen.getByText('675')).toBeInTheDocument();
    });

});
