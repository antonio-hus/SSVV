import {render, screen} from '@testing-library/react';
import {notFound, useRouter} from 'next/navigation';
import {getExercise, updateExercise} from '@/lib/controller/exercise-controller';
import EditExercisePage from '@/app/admin/exercises/[id]/edit/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    getExercise: jest.fn(),
    updateExercise: jest.fn(),
    archiveExercise: jest.fn(),
    unarchiveExercise: jest.fn(),
    deleteExercise: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockGetExercise = getExercise as jest.MockedFunction<typeof getExercise>;
const mockPush = jest.fn();
const mockRefresh = jest.fn();

const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'A controlled chest press.',
    muscleGroup: 'CHEST' as const,
    equipmentNeeded: 'BARBELL' as const,
    isActive: true,
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditExercisePage', () => {

    it('editExercisePage_getExerciseSucceeds_rendersHeaderBackLinkAndPrefilledForm', async () => {
        // Arrange
        mockGetExercise.mockResolvedValueOnce({success: true, data: mockExercise});

        render(await EditExercisePage({params: Promise.resolve({id: 'ex-1'})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Edit: Barbell Bench Press'})).toBeInTheDocument();
        expect(screen.getByText('Update exercise details')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back to Exercises'})).toHaveAttribute('href', '/admin/exercises');
        expect(screen.getByLabelText('Name')).toHaveValue('Barbell Bench Press');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeInTheDocument();
        expect(mockGetExercise).toHaveBeenCalledWith('ex-1');
        expect(updateExercise).not.toHaveBeenCalled();
    });

    it('editExercisePage_getExerciseFails_callsNotFound', async () => {
        // Arrange
        mockGetExercise.mockResolvedValueOnce({success: false, message: 'Exercise not found'});

        // Act
        let caughtError: Error | undefined;
        try {
            await EditExercisePage({params: Promise.resolve({id: 'missing-exercise'})});
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetExercise).toHaveBeenCalledWith('missing-exercise');
    });

});
