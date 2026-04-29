import {render, screen} from '@testing-library/react';
import {useRouter} from 'next/navigation';
import {createExercise} from '@/lib/controller/exercise-controller';
import NewExercisePage from '@/app/admin/exercises/new/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    createExercise: jest.fn(),
}));

const mockPush = jest.fn();

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('NewExercisePage', () => {

    it('newExercisePage_defaultRender_showsHeadingDescriptionAndBackLink', async () => {
        // Arrange
        render(await NewExercisePage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Add Exercise'})).toBeInTheDocument();
        expect(screen.getByText('Add a new exercise to the catalogue')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back to Exercises'})).toHaveAttribute('href', '/admin/exercises');
    });

    it('newExercisePage_defaultRender_mountsCreateExerciseForm', async () => {
        // Arrange
        render(await NewExercisePage());

        // Assert
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Exercise'})).toBeInTheDocument();
        expect(createExercise).not.toHaveBeenCalled();
    });

});
