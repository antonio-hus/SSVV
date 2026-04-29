import {render, screen} from '@testing-library/react';
import {ExerciseDetailInformation} from '@/app/admin/exercises/[id]/_components/exercise-detail-information';
import type {Exercise} from '@/lib/domain/exercise';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

const seedMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'Keep shoulder blades retracted.',
    muscleGroup: 'CHEST',
    equipmentNeeded: 'BARBELL',
    isActive: true,
    ...overrides,
});

describe('ExerciseDetailInformation', () => {

    it('exerciseDetailInformation_defaultExercise_showsClassificationAndAvailability', () => {
        // Arrange
        render(<ExerciseDetailInformation exercise={seedMockExercise()}/>);

        // Assert
        expect(screen.getByText('Classification')).toBeInTheDocument();
        expect(screen.getByText('Muscle Group')).toBeInTheDocument();
        expect(screen.getByText('CHEST')).toBeInTheDocument();
        expect(screen.getByText('Equipment')).toBeInTheDocument();
        expect(screen.getByText('BARBELL')).toBeInTheDocument();
        expect(screen.getByText('Availability')).toBeInTheDocument();
    });

    it('exerciseDetailInformation_activeExercise_showsActiveStatus', () => {
        // Arrange
        render(<ExerciseDetailInformation exercise={seedMockExercise({isActive: true})}/>);

        // Assert
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('exerciseDetailInformation_archivedExercise_showsArchivedStatus', () => {
        // Arrange
        render(<ExerciseDetailInformation exercise={seedMockExercise({isActive: false})}/>);

        // Assert
        expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('exerciseDetailInformation_descriptionProvided_showsDescriptionCard', () => {
        // Arrange
        render(<ExerciseDetailInformation exercise={seedMockExercise({description: 'Controlled tempo.'})}/>);

        // Assert
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Controlled tempo.')).toBeInTheDocument();
    });

    it('exerciseDetailInformation_descriptionNull_hidesDescriptionCard', () => {
        // Arrange
        render(<ExerciseDetailInformation exercise={seedMockExercise({description: null})}/>);

        // Assert
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

});
