import {render, screen} from '@testing-library/react';
import {notFound} from 'next/navigation';
import {getExercise} from '@/lib/controller/exercise-controller';
import ExerciseDetailPage from '@/app/admin/exercises/[id]/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    getExercise: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockGetExercise = getExercise as jest.MockedFunction<typeof getExercise>;

const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'A controlled chest press.',
    muscleGroup: 'CHEST' as const,
    equipmentNeeded: 'BARBELL' as const,
    isActive: true,
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ExerciseDetailPage', () => {

    it('exerciseDetailPage_getExerciseSucceeds_rendersHeadingActionsAndDetails', async () => {
        // Arrange
        mockGetExercise.mockResolvedValueOnce({success: true, data: mockExercise});

        render(await ExerciseDetailPage({params: Promise.resolve({id: 'ex-1'})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Barbell Bench Press'})).toBeInTheDocument();
        expect(screen.getByText('Exercise details')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/exercises');
        expect(screen.getByRole('button', {name: 'Edit'})).toHaveAttribute('href', '/admin/exercises/ex-1/edit');
        expect(screen.getByText('CHEST')).toBeInTheDocument();
        expect(mockGetExercise).toHaveBeenCalledWith('ex-1');
    });

    it('exerciseDetailPage_getExerciseFails_callsNotFound', async () => {
        // Arrange
        mockGetExercise.mockResolvedValueOnce({success: false, message: 'Exercise not found'});

        // Act
        let caughtError: Error | undefined;
        try {
            await ExerciseDetailPage({params: Promise.resolve({id: 'missing-exercise'})});
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetExercise).toHaveBeenCalledWith('missing-exercise');
    });

});
