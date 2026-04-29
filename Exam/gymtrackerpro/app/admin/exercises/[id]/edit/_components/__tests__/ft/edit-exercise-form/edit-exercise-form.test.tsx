import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {
    archiveExercise,
    deleteExercise,
    unarchiveExercise,
    updateExercise,
} from '@/lib/controller/exercise-controller';
import {EditExerciseForm} from '@/app/admin/exercises/[id]/edit/_components/edit-exercise-form';
import type {Exercise} from '@/lib/domain/exercise';
import type {ActionResult} from '@/lib/domain/action-result';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    updateExercise: jest.fn(),
    archiveExercise: jest.fn(),
    unarchiveExercise: jest.fn(),
    deleteExercise: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateExercise = updateExercise as jest.MockedFunction<typeof updateExercise>;
const mockArchiveExercise = archiveExercise as jest.MockedFunction<typeof archiveExercise>;
const mockUnarchiveExercise = unarchiveExercise as jest.MockedFunction<typeof unarchiveExercise>;
const mockDeleteExercise = deleteExercise as jest.MockedFunction<typeof deleteExercise>;

const mockExercise: Exercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'A controlled chest press.',
    muscleGroup: 'CHEST',
    equipmentNeeded: 'BARBELL',
    isActive: true,
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditExerciseForm', () => {

    it('editExerciseForm_defaultRender_prefillsExerciseFieldsAndShowsArchiveDeleteControls', () => {
        // Arrange
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Assert
        expect(screen.getByLabelText('Name')).toHaveValue('Barbell Bench Press');
        expect(screen.getByLabelText('Description')).toHaveValue('A controlled chest press.');
        expect(screen.getByLabelText('Muscle Group')).toHaveValue('CHEST');
        expect(screen.getByLabelText('Equipment')).toHaveValue('BARBELL');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Archive'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Delete Exercise'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('editExerciseForm_nullDescription_prefillsDescriptionAsEmptyString', () => {
        // Arrange
        render(<EditExerciseForm exercise={{...mockExercise, description: null}} exerciseId="ex-1"/>);

        // Assert
        expect(screen.getByLabelText('Description')).toHaveValue('');
    });

    it('editExerciseForm_nameTooShort_showsOnlyNameErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);
        await user.clear(screen.getByLabelText('Name'));
        await user.type(screen.getByLabelText('Name'), 'Bench');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Name must be at least 8 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_nameTooLong_showsOnlyNameErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);
        await user.clear(screen.getByLabelText('Name'));
        await user.type(screen.getByLabelText('Name'), 'A'.repeat(65));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Name must be at most 64 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_descriptionTooLong_showsOnlyDescriptionErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);
        await user.clear(screen.getByLabelText('Description'));
        await user.type(screen.getByLabelText('Description'), 'a'.repeat(1025));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Description must be at most 1024 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_invalidMuscleGroup_showsOnlyMuscleGroupErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm exercise={{...mockExercise, muscleGroup: 'INVALID_MUSCLE' as Exercise['muscleGroup']}}
                                 exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Invalid muscle group')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_invalidEquipment_showsOnlyEquipmentErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm
            exercise={{...mockExercise, equipmentNeeded: 'INVALID_EQUIPMENT' as Exercise['equipmentNeeded']}}
            exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Invalid equipment')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_allFieldsInvalid_showsAllFieldErrorsAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditExerciseForm exercise={{
            ...mockExercise,
            muscleGroup: 'INVALID_MUSCLE' as Exercise['muscleGroup'],
            equipmentNeeded: 'INVALID_EQUIPMENT' as Exercise['equipmentNeeded'],
        }} exerciseId="ex-1"/>);
        await user.clear(screen.getByLabelText('Name'));
        await user.type(screen.getByLabelText('Name'), 'Bench');
        await user.clear(screen.getByLabelText('Description'));
        await user.type(screen.getByLabelText('Description'), 'a'.repeat(1025));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_validUpdate_callsUpdateShowsSuccessAndRefreshesPage', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateExercise.mockResolvedValueOnce({
            success: true,
            data: {
                ...mockExercise,
                name: 'Incline Bench Press',
                description: 'Upper chest press.',
                muscleGroup: 'SHOULDERS',
                equipmentNeeded: 'DUMBBELL',
            },
        });
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);
        await user.clear(screen.getByLabelText('Name'));
        await user.type(screen.getByLabelText('Name'), '  Incline Bench Press  ');
        await user.clear(screen.getByLabelText('Description'));
        await user.type(screen.getByLabelText('Description'), '  Upper chest press.  ');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'SHOULDERS');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'DUMBBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Exercise updated successfully.')).toBeInTheDocument();
        expect(mockUpdateExercise).toHaveBeenCalledTimes(1);
        expect(mockUpdateExercise).toHaveBeenCalledWith('ex-1', {
            name: 'Incline Bench Press',
            description: 'Upper chest press.',
            muscleGroup: 'SHOULDERS',
            equipmentNeeded: 'DUMBBELL',
        });
        expect(mockRefresh).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editExerciseForm_updateFails_showsServerErrorAndDoesNotRefresh', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateExercise.mockResolvedValueOnce({
            success: false,
            message: 'Exercise already exists',
        });
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Exercise already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(mockUpdateExercise).toHaveBeenCalledTimes(1);
        expect(mockRefresh).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editExerciseForm_updateFailsWithFieldErrors_showsReturnedFieldErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateExercise.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                name: ['Name must be unique'],
                description: ['Description rejected'],
                muscleGroup: ['Muscle group rejected'],
                equipmentNeeded: ['Equipment rejected'],
            },
        });
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Name must be unique')).toBeInTheDocument();
        expect(screen.getByText('Description rejected')).toBeInTheDocument();
        expect(screen.getByText('Muscle group rejected')).toBeInTheDocument();
        expect(screen.getByText('Equipment rejected')).toBeInTheDocument();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('editExerciseForm_activeExercise_showsArchiveButtonAndHidesUnarchiveButton', () => {
        // Arrange
        render(<EditExerciseForm exercise={{...mockExercise, isActive: true}} exerciseId="ex-1"/>);

        // Assert
        expect(screen.getByRole('button', {name: 'Archive'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Unarchive'})).not.toBeInTheDocument();
    });

    it('editExerciseForm_archivedExercise_showsUnarchiveButtonAndHidesArchiveButton', () => {
        // Arrange
        render(<EditExerciseForm exercise={{...mockExercise, isActive: false}} exerciseId="ex-1"/>);

        // Assert
        expect(screen.getByRole('button', {name: 'Unarchive'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Archive'})).not.toBeInTheDocument();
    });

    it('editExerciseForm_archiveSucceeds_callsArchiveAndNavigatesToList', async () => {
        // Arrange
        const user = userEvent.setup();
        mockArchiveExercise.mockResolvedValueOnce({success: true, data: {...mockExercise, isActive: false}});
        render(<EditExerciseForm exercise={{...mockExercise, isActive: true}} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Archive'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/exercises'));
        expect(mockArchiveExercise).toHaveBeenCalledTimes(1);
        expect(mockArchiveExercise).toHaveBeenCalledWith('ex-1');
        expect(mockUnarchiveExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_archiveFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockArchiveExercise.mockResolvedValueOnce({
            success: false,
            message: 'Could not archive exercise',
        });
        render(<EditExerciseForm exercise={{...mockExercise, isActive: true}} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Archive'}));

        // Assert
        expect(await screen.findByText('Could not archive exercise')).toBeInTheDocument();
        expect(mockArchiveExercise).toHaveBeenCalledWith('ex-1');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editExerciseForm_unarchiveSucceeds_callsUnarchiveAndNavigatesToList', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUnarchiveExercise.mockResolvedValueOnce({success: true, data: {...mockExercise, isActive: true}});
        render(<EditExerciseForm exercise={{...mockExercise, isActive: false}} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Unarchive'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/exercises'));
        expect(mockUnarchiveExercise).toHaveBeenCalledTimes(1);
        expect(mockUnarchiveExercise).toHaveBeenCalledWith('ex-1');
        expect(mockArchiveExercise).not.toHaveBeenCalled();
    });

    it('editExerciseForm_unarchiveFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUnarchiveExercise.mockResolvedValueOnce({
            success: false,
            message: 'Could not unarchive exercise',
        });
        render(<EditExerciseForm exercise={{...mockExercise, isActive: false}} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Unarchive'}));

        // Assert
        expect(await screen.findByText('Could not unarchive exercise')).toBeInTheDocument();
        expect(mockUnarchiveExercise).toHaveBeenCalledWith('ex-1');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editExerciseForm_deleteSucceeds_callsDeleteAndNavigatesToList', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteExercise.mockResolvedValueOnce({success: true, data: undefined});
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Exercise'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/exercises'));
        expect(mockDeleteExercise).toHaveBeenCalledTimes(1);
        expect(mockDeleteExercise).toHaveBeenCalledWith('ex-1');
    });

    it('editExerciseForm_deleteFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteExercise.mockResolvedValueOnce({
            success: false,
            message: 'Exercise is used by workout sessions',
        });
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Exercise'}));

        // Assert
        expect(await screen.findByText('Exercise is used by workout sessions')).toBeInTheDocument();
        expect(mockDeleteExercise).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editExerciseForm_updatePending_disablesActionButtonsAndShowsSavingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveUpdate!: (value: ActionResult<Exercise>) => void;
        mockUpdateExercise.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveUpdate = resolve;
            }),
        );
        render(<EditExerciseForm exercise={mockExercise} exerciseId="ex-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Saving…'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Archive'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Delete Exercise'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Save Changes'})).not.toBeInTheDocument();

        await act(async () => {
            resolveUpdate({success: true, data: mockExercise});
        });
    });

});