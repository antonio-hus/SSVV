import {render, screen} from '@testing-library/react';
import {notFound, useRouter} from 'next/navigation';
import {listExercises} from '@/lib/controller/exercise-controller';
import {getWorkoutSession, updateWorkoutSessionWithExercises} from '@/lib/controller/workout-session-controller';
import EditWorkoutSessionPage from '@/app/admin/workout-sessions/[id]/edit/page';
import {ActionResult} from "@/lib/domain/action-result";
import {WorkoutSessionWithExercises} from "@/lib/domain/workout-session";

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
    listExercises: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    getWorkoutSession: jest.fn(),
    updateWorkoutSessionWithExercises: jest.fn(),
    deleteWorkoutSession: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockListExercises = listExercises as jest.MockedFunction<typeof listExercises>;
const mockGetWorkoutSession = getWorkoutSession as jest.MockedFunction<typeof getWorkoutSession>;
const mockPush = jest.fn();
const mockRefresh = jest.fn();

const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: null,
    muscleGroup: 'CHEST' as const,
    equipmentNeeded: 'BARBELL' as const,
    isActive: true
};

const mockSession = {
    id: 'session-1',
    memberId: 'mem-1',
    date: new Date('2026-02-20T00:00:00.000Z'),
    duration: 45,
    notes: 'Solid effort',
    exercises: [{
        id: 'row-1',
        workoutSessionId: 'session-1',
        exerciseId: 'ex-1',
        sets: 3,
        reps: 10,
        weight: 80,
        mockExercise
    }],
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditWorkoutSessionPage', () => {

    it('editWorkoutSessionPage_getSessionSucceeds_rendersHeaderBackLinkAndPrefilledForm', async () => {
        // Arrange
        mockGetWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: mockSession
        } as unknown as ActionResult<WorkoutSessionWithExercises>);
        mockListExercises.mockResolvedValueOnce({success: true, data: {items: [mockExercise], total: 1}});

        render(await EditWorkoutSessionPage({params: Promise.resolve({id: 'session-1'})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Edit Session'})).toBeInTheDocument();
        expect(screen.getByText(`Session on ${new Date(mockSession.date).toLocaleDateString()}`)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back to Member'})).toHaveAttribute('href', '/admin/members/mem-1');
        expect(screen.getByLabelText('Date')).toHaveValue('2026-02-20');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeInTheDocument();
        expect(mockGetWorkoutSession).toHaveBeenCalledWith('session-1');
        expect(mockListExercises).toHaveBeenCalledWith({pageSize: 200});
        expect(updateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionPage_exercisesFail_rendersFormWithEmptyExerciseOptions', async () => {
        // Arrange
        mockGetWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: mockSession
        } as unknown as ActionResult<WorkoutSessionWithExercises>);
        mockListExercises.mockResolvedValueOnce({success: false, message: 'Could not load exercises'});

        render(await EditWorkoutSessionPage({params: Promise.resolve({id: 'session-1'})}));

        // Assert
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('');
        expect(screen.queryByRole('option', {name: 'Barbell Bench Press'})).not.toBeInTheDocument();
    });

    it('editWorkoutSessionPage_getSessionFails_callsNotFound', async () => {
        // Arrange
        mockGetWorkoutSession.mockResolvedValueOnce({success: false, message: 'Session not found'});
        mockListExercises.mockResolvedValueOnce({success: true, data: {items: [mockExercise], total: 1}});

        // Act
        let caughtError: Error | undefined;
        try {
            await EditWorkoutSessionPage({params: Promise.resolve({id: 'missing-session'})});
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetWorkoutSession).toHaveBeenCalledWith('missing-session');
    });

});
