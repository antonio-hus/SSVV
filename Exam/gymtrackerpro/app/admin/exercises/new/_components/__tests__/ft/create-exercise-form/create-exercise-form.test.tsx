import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {createExercise} from '@/lib/controller/exercise-controller';
import {CreateExerciseForm} from '@/app/admin/exercises/new/_components/create-exercise-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {Exercise} from '@/lib/domain/exercise';

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
const mockCreateExercise = createExercise as jest.MockedFunction<typeof createExercise>;

const mockExercise: Exercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'A controlled chest press.',
    muscleGroup: 'CHEST',
    equipmentNeeded: 'BARBELL',
    isActive: true,
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('CreateExerciseForm', () => {

    it('createExerciseForm_defaultRender_showsEmptyFieldsAndEnabledCreateButtonWithNoAlert', () => {
        // Arrange
        render(<CreateExerciseForm/>);

        // Assert
        expect(screen.getByLabelText('Name')).toHaveValue('');
        expect(screen.getByLabelText('Description')).toHaveValue('');
        expect(screen.getByLabelText('Muscle Group')).toHaveValue('');
        expect(screen.getByLabelText('Equipment')).toHaveValue('');
        expect(screen.getByRole('button', {name: 'Create Exercise'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('createExerciseForm_allFieldsEmpty_showsRequiredPredicateErrorsAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_nameTooShort_showsOnlyNameErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Bench');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Name must be at least 8 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_nameTooLong_showsOnlyNameErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'A'.repeat(65));
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Name must be at most 64 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_descriptionTooLong_showsOnlyDescriptionErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');
        await user.type(screen.getByLabelText('Description'), 'a'.repeat(1025));

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Description must be at most 1024 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_missingMuscleGroup_showsOnlyMuscleGroupErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Invalid muscle group')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_missingEquipment_showsOnlyEquipmentErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByText('Invalid equipment')).toBeInTheDocument();
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_allFieldsInvalid_showsAllFieldErrorsAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Bench');
        await user.type(screen.getByLabelText('Description'), 'a'.repeat(1025));

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByLabelText('Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Description').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Muscle Group').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Equipment').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateExercise).not.toHaveBeenCalled();
    });

    it('createExerciseForm_validSubmitWithDescription_callsCreateExerciseWithTrimmedPayloadAndNavigatesToList', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateExercise.mockResolvedValueOnce({success: true, data: mockExercise});
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), '  Barbell Bench Press  ');
        await user.type(screen.getByLabelText('Description'), '  A controlled chest press.  ');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/exercises'));
        expect(mockCreateExercise).toHaveBeenCalledTimes(1);
        expect(mockCreateExercise).toHaveBeenCalledWith({
            name: 'Barbell Bench Press',
            description: 'A controlled chest press.',
            muscleGroup: 'CHEST',
            equipmentNeeded: 'BARBELL',
        });
    });

    it('createExerciseForm_validSubmitWithoutDescription_callsCreateExerciseWithEmptyDescription', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateExercise.mockResolvedValueOnce({
            success: false,
            message: 'Exercise already exists',
        });
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        await waitFor(() => expect(mockCreateExercise).toHaveBeenCalledTimes(1));
        expect(mockCreateExercise).toHaveBeenCalledWith({
            name: 'Barbell Bench Press',
            description: '',
            muscleGroup: 'CHEST',
            equipmentNeeded: 'BARBELL',
        });
    });

    it('createExerciseForm_createFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateExercise.mockResolvedValueOnce({
            success: false,
            message: 'Exercise already exists',
        });
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(await screen.findByText('Exercise already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Exercise'})).toBeEnabled();
        expect(mockCreateExercise).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('createExerciseForm_serverFieldErrors_showsReturnedFieldErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateExercise.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                name: ['Name must be unique'],
                description: ['Description rejected'],
                muscleGroup: ['Muscle group rejected'],
                equipmentNeeded: ['Equipment rejected'],
            },
        });
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(await screen.findByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Name must be unique')).toBeInTheDocument();
        expect(screen.getByText('Description rejected')).toBeInTheDocument();
        expect(screen.getByText('Muscle group rejected')).toBeInTheDocument();
        expect(screen.getByText('Equipment rejected')).toBeInTheDocument();
        expect(mockCreateExercise).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('createExerciseForm_isPending_disablesButtonAndShowsCreatingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveCreate!: (value: ActionResult<Exercise>) => void;
        mockCreateExercise.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveCreate = resolve;
            }),
        );
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Creating…'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Create Exercise'})).not.toBeInTheDocument();

        await act(async () => {
            resolveCreate({success: true, data: mockExercise});
        });
    });

    it('createExerciseForm_afterServerError_subsequentValidSubmissionSucceeds', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateExercise
            .mockResolvedValueOnce({
                success: false,
                message: 'Exercise already exists',
            })
            .mockResolvedValueOnce({success: true, data: mockExercise});
        render(<CreateExerciseForm/>);
        await user.type(screen.getByLabelText('Name'), 'Barbell Bench Press');
        await user.type(screen.getByLabelText('Description'), 'A controlled chest press.');
        await user.selectOptions(screen.getByLabelText('Muscle Group'), 'CHEST');
        await user.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));
        await screen.findByText('Exercise already exists');
        await user.click(screen.getByRole('button', {name: 'Create Exercise'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/exercises'));
        expect(mockCreateExercise).toHaveBeenCalledTimes(2);
    });

});