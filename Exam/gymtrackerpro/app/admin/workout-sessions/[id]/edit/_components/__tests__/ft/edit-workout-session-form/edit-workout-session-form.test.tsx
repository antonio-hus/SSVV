import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {deleteWorkoutSession, updateWorkoutSessionWithExercises} from '@/lib/controller/workout-session-controller';
import {EditWorkoutSessionForm} from '@/app/admin/workout-sessions/[id]/edit/_components/edit-workout-session-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {Exercise} from '@/lib/domain/exercise';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    updateWorkoutSessionWithExercises: jest.fn(),
    deleteWorkoutSession: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateWorkoutSessionWithExercises = updateWorkoutSessionWithExercises as jest.MockedFunction<typeof updateWorkoutSessionWithExercises>;
const mockDeleteWorkoutSession = deleteWorkoutSession as jest.MockedFunction<typeof deleteWorkoutSession>;

const mockExercises: Exercise[] = [
    {
        id: 'ex-1',
        name: 'Barbell Bench Press',
        description: null,
        muscleGroup: 'CHEST',
        equipmentNeeded: 'BARBELL',
        isActive: true
    },
    {id: 'ex-2', name: 'Cable Row', description: null, muscleGroup: 'BACK', equipmentNeeded: 'CABLE', isActive: true},
];

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
            exercise: mockExercises[0],
        },
    ],
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditWorkoutSessionForm', () => {

    it('editWorkoutSessionForm_defaultRender_prefillsSessionFieldsAndExerciseRow', () => {
        // Arrange
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Assert
        expect(screen.getByLabelText('Date')).toHaveValue('2026-02-20');
        expect(screen.getByLabelText('Duration (min)')).toHaveValue('45');
        expect(screen.getByLabelText('Notes')).toHaveValue('Solid effort');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Delete Session'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Remove'})).toBeDisabled();
        expect(screen.getByRole('combobox')).toHaveValue('ex-1');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('editWorkoutSessionForm_nullNotes_prefillsNotesAsEmptyString', () => {
        // Arrange
        render(<EditWorkoutSessionForm session={{...mockSession, notes: null}} exercises={mockExercises}
                                       sessionId="session-1"/>);

        // Assert
        expect(screen.getByLabelText('Notes')).toHaveValue('');
    });

    it('editWorkoutSessionForm_emptyDate_showsDateValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.clear(screen.getByLabelText('Date'));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Date must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(mockUpdateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_durationTooLow_showsDurationValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '-1'}});

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Duration must be greater or equal to 0')).toBeInTheDocument();
        expect(mockUpdateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_durationTooHigh_showsDurationValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.clear(screen.getByLabelText('Duration (min)'));
        await user.type(screen.getByLabelText('Duration (min)'), '181');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Duration must be at most 180 minutes')).toBeInTheDocument();
        expect(mockUpdateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_notesTooLong_showsValidationAlertAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), 'a'.repeat(1025));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(mockUpdateWorkoutSessionWithExercises).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_addExerciseClicked_addsSecondRowAndEnablesRemoval', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));

        // Assert
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
        expect(screen.getAllByRole('button', {name: 'Remove'})).toHaveLength(2);
        expect(screen.getAllByRole('button', {name: 'Remove'})[0]).toBeEnabled();
    });

    it('editWorkoutSessionForm_secondExerciseRemoved_returnsToSingleDisabledRemoveButton', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));

        // Act
        await user.click(screen.getAllByRole('button', {name: 'Remove'})[1]);

        // Assert
        expect(screen.getAllByRole('combobox')).toHaveLength(1);
        expect(screen.getByRole('button', {name: 'Remove'})).toBeDisabled();
    });

    it('editWorkoutSessionForm_validUpdate_callsUpdateWithEditedMetadataAndRowsThenRefreshes', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateWorkoutSessionWithExercises.mockResolvedValueOnce({
            success: true,
            data: {...mockSession, duration: 60},
        });
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.clear(screen.getByLabelText('Duration (min)'));
        await user.type(screen.getByLabelText('Duration (min)'), '60');
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), '  Updated notes  ');
        await user.selectOptions(screen.getByRole('combobox'), 'ex-2');
        await user.clear(screen.getByDisplayValue('3'));
        await user.type(screen.getByDisplayValue(''), '4');
        await user.clear(screen.getByDisplayValue('10'));
        await user.type(screen.getByDisplayValue(''), '8');
        await user.clear(screen.getByDisplayValue('80'));
        await user.type(screen.getByDisplayValue(''), '60.5');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Session updated successfully.')).toBeInTheDocument();
        expect(mockUpdateWorkoutSessionWithExercises).toHaveBeenCalledTimes(1);
        expect(mockUpdateWorkoutSessionWithExercises).toHaveBeenCalledWith(
            'session-1',
            {date: '2026-02-20', duration: 60, notes: 'Updated notes'},
            [{id: 'row-1', exerciseId: 'ex-2', sets: 4, reps: 8, weight: 60.5}],
        );
        expect(mockRefresh).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_newExerciseRow_isSentWithoutIdInParsedRows', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateWorkoutSessionWithExercises.mockResolvedValueOnce({success: true, data: mockSession});
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));
        const comboboxes = screen.getAllByRole('combobox');
        await user.selectOptions(comboboxes[1], 'ex-2');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        await screen.findByText('Session updated successfully.');
        expect(mockUpdateWorkoutSessionWithExercises).toHaveBeenCalledWith(
            'session-1',
            {date: '2026-02-20', duration: 45, notes: 'Solid effort'},
            [
                {id: 'row-1', exerciseId: 'ex-1', sets: 3, reps: 10, weight: 80},
                {id: undefined, exerciseId: 'ex-2', sets: 3, reps: 10, weight: 0},
            ],
        );
    });

    it('editWorkoutSessionForm_updateFails_showsServerErrorAndDoesNotRefresh', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateWorkoutSessionWithExercises.mockResolvedValueOnce({success: false, message: 'Session not found'});
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Session not found')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(mockUpdateWorkoutSessionWithExercises).toHaveBeenCalledTimes(1);
        expect(mockRefresh).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_updateFailsWithFieldErrors_showsReturnedMetadataErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateWorkoutSessionWithExercises.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                date: ['Date rejected'],
                duration: ['Duration rejected'],
            },
        });
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Date rejected')).toBeInTheDocument();
        expect(screen.getByText('Duration rejected')).toBeInTheDocument();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_deleteSucceeds_callsDeleteRefreshesAndNavigatesToMember', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteWorkoutSession.mockResolvedValueOnce({success: true, data: undefined});
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Session'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members/mem-1'));
        expect(mockDeleteWorkoutSession).toHaveBeenCalledTimes(1);
        expect(mockDeleteWorkoutSession).toHaveBeenCalledWith('session-1');
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('editWorkoutSessionForm_deleteFails_showsServerErrorAndDoesNotNavigateOrRefresh', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteWorkoutSession.mockResolvedValueOnce({success: false, message: 'Cannot delete session'});
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Session'}));

        // Assert
        expect(await screen.findByText('Cannot delete session')).toBeInTheDocument();
        expect(mockDeleteWorkoutSession).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('editWorkoutSessionForm_updatePending_disablesSaveAndDeleteAndShowsSavingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveUpdate!: (value: ActionResult<WorkoutSessionWithExercises>) => void;
        mockUpdateWorkoutSessionWithExercises.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveUpdate = resolve;
            }),
        );
        render(<EditWorkoutSessionForm session={mockSession} exercises={mockExercises} sessionId="session-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Saving…'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Delete Session'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Save Changes'})).not.toBeInTheDocument();

        await act(async () => {
            resolveUpdate({success: true, data: mockSession});
        });
    });

});