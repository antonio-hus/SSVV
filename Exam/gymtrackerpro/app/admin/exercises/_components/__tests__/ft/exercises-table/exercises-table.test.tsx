import {render, screen, within} from '@testing-library/react';
import {ExercisesTable} from '@/app/admin/exercises/_components/exercises-table';
import type {Exercise} from '@/lib/domain/exercise';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

const mockActiveExercise: Exercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'Chest press movement',
    muscleGroup: 'CHEST',
    equipmentNeeded: 'BARBELL',
    isActive: true,
};

const mockArchivedExercise: Exercise = {
    id: 'ex-2',
    name: 'Cable Face Pull',
    description: null,
    muscleGroup: 'SHOULDERS',
    equipmentNeeded: 'CABLE',
    isActive: false,
};

describe('ExercisesTable', () => {

    it('exercisesTable_exercisesProvided_showsHeadersAndExerciseRows', () => {
        // Arrange
        render(<ExercisesTable exercises={[mockActiveExercise, mockArchivedExercise]}/>);

        // Assert
        expect(screen.getByRole('columnheader', {name: 'Name'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Muscle Group'})).toBeInTheDocument();
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(screen.getByText('Cable Face Pull')).toBeInTheDocument();
    });

    it('exercisesTable_activeExercise_showsActiveStatusBadge', () => {
        // Arrange
        render(<ExercisesTable exercises={[mockActiveExercise]}/>);

        // Assert
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('exercisesTable_archivedExercise_showsArchivedStatusBadge', () => {
        // Arrange
        render(<ExercisesTable exercises={[mockArchivedExercise]}/>);

        // Assert
        expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('exercisesTable_exercisesProvided_rendersViewAndEditLinksForEachExercise', () => {
        // Arrange
        render(<ExercisesTable exercises={[mockActiveExercise]}/>);
        const row = screen.getByText('Barbell Bench Press').closest('tr')!;

        // Assert
        expect(within(row).getByRole('button', {name: 'View'})).toHaveAttribute('href', '/admin/exercises/ex-1');
        expect(within(row).getByRole('button', {name: 'Edit'})).toHaveAttribute('href', '/admin/exercises/ex-1/edit');
    });

    it('exercisesTable_emptyExercises_showsEmptyStateMessage', () => {
        // Arrange
        render(<ExercisesTable exercises={[]}/>);

        // Assert
        expect(screen.getByText('No exercises found')).toBeInTheDocument();
    });

});
