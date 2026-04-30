import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {createWorkoutSession} from '@/lib/controller/workout-session-controller';
import {CreateWorkoutSessionForm} from '@/app/admin/workout-sessions/new/_components/create-workout-session-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {Exercise} from '@/lib/domain/exercise';
import type {WorkoutSessionWithExercises} from '@/lib/domain/workout-session';
import type {MemberWithUser} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    createWorkoutSession: jest.fn(),
}));

const mockPush = jest.fn();
const mockCreateWorkoutSession = createWorkoutSession as jest.MockedFunction<typeof createWorkoutSession>;

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

const mockMembers: MemberWithUser[] = [
    {
        id: 'mem-1',
        userId: 'user-1',
        membershipStart: new Date('2025-01-15T00:00:00.000Z'),
        isActive: true,
        user: {
            id: 'user-1',
            email: 'john@example.com',
            fullName: 'John Smith',
            phone: '+12345678901',
            dateOfBirth: new Date('1990-03-10T00:00:00.000Z'),
            passwordHash: 'hash',
            role: 'MEMBER',
        },
    },
];

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('CreateWorkoutSessionForm', () => {

    it('createWorkoutSessionForm_defaultRender_showsFieldsAndInitialExerciseRow', () => {
        // Arrange
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);

        // Assert
        expect(screen.getByLabelText('Member')).toHaveValue('');
        expect(screen.getByLabelText('Date')).toHaveValue('');
        expect(screen.getByLabelText('Duration (min)')).toHaveValue('60');
        expect(screen.getByLabelText('Notes')).toHaveValue('');
        expect(screen.getByText('Exercises')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Session'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Remove'})).toBeDisabled();
        expect(screen.getAllByRole('combobox')[1]).toHaveValue('');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('createWorkoutSessionForm_defaultMemberIdProvided_prefillsMemberSelect', () => {
        // Arrange
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers} defaultMemberId="mem-1"/>);

        // Assert
        expect(screen.getByLabelText('Member')).toHaveValue('mem-1');
    });

    it('createWorkoutSessionForm_emptyMember_showsMemberValidationErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Member is required')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_emptyDate_showsDateValidationErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Date must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_durationTooLow_showsDurationValidationErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '-1'}});

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Duration must be greater or equal to 0')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_durationTooHigh_showsDurationValidationErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        await user.clear(screen.getByLabelText('Duration (min)'));
        await user.type(screen.getByLabelText('Duration (min)'), '181');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Duration must be at most 180 minutes')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_notesTooLong_showsNotesValidationErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Notes'), {target: {name: 'notes', value: 'a'.repeat(1025)}});

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Notes must be at most 1024 characters')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_invalidExerciseRow_showsFieldValidationErrorsAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        const setsInput = screen.getByDisplayValue('3');
        const repsInput = screen.getByDisplayValue('10');
        const weightInput = screen.getByDisplayValue('0');
        await user.clear(setsInput);
        await user.type(setsInput, '7');
        await user.clear(repsInput);
        await user.type(repsInput, '31');
        await user.clear(weightInput);
        await user.type(weightInput, '500.1');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Exercise is required')).toBeInTheDocument();
        expect(screen.getByText('Sets must be at most 6')).toBeInTheDocument();
        expect(screen.getByText('Reps must be at most 30')).toBeInTheDocument();
        expect(screen.getByText('Weight must be at most 500.0')).toBeInTheDocument();
        expect(mockCreateWorkoutSession).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_addExerciseClicked_addsSecondExerciseRowAndEnablesRemove', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));

        // Assert
        expect(screen.getAllByRole('combobox')).toHaveLength(3);
        expect(screen.getAllByRole('button', {name: 'Remove'})).toHaveLength(2);
        expect(screen.getAllByRole('button', {name: 'Remove'})[0]).toBeEnabled();
    });

    it('createWorkoutSessionForm_secondExerciseRemoved_returnsToSingleDisabledRemoveButton', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));

        // Act
        await user.click(screen.getAllByRole('button', {name: 'Remove'})[1]);

        // Assert
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
        expect(screen.getByRole('button', {name: 'Remove'})).toBeDisabled();
    });

    it('createWorkoutSessionForm_validSubmit_callsCreateWithEditedMetadataAndRowThenNavigates', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: {
                id: 'session-1',
                memberId: 'mem-1',
                date: new Date('2026-02-20T00:00:00.000Z'),
                duration: 60,
                notes: 'Updated notes',
                exercises: []
            },
        });
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '60'}});
        await user.type(screen.getByLabelText('Notes'), '  Updated notes  ');
        await user.selectOptions(screen.getAllByRole('combobox')[1], 'ex-2');
        await user.clear(screen.getByDisplayValue('3'));
        await user.type(screen.getByDisplayValue(''), '4');
        await user.clear(screen.getByDisplayValue('10'));
        await user.type(screen.getByDisplayValue(''), '8');
        await user.clear(screen.getByDisplayValue('0'));
        await user.type(screen.getByDisplayValue(''), '60.5');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members/mem-1'));
        expect(mockCreateWorkoutSession).toHaveBeenCalledTimes(1);
        expect(mockCreateWorkoutSession).toHaveBeenCalledWith(
            {memberId: 'mem-1', date: '2026-02-20', duration: 60, notes: 'Updated notes'},
            [{exerciseId: 'ex-2', sets: 4, reps: 8, weight: 60.5}],
        );
    });

    it('createWorkoutSessionForm_addedExerciseRow_isSentAsSecondParsedRow', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateWorkoutSession.mockResolvedValueOnce({
            success: true,
            data: {
                id: 'session-1',
                memberId: 'mem-1',
                date: new Date('2026-02-20T00:00:00.000Z'),
                duration: 45,
                notes: 'Solid effort',
                exercises: []
            },
        });
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '45'}});
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), 'Solid effort');
        await user.selectOptions(screen.getAllByRole('combobox')[1], 'ex-1');
        await user.click(screen.getByRole('button', {name: 'Add Exercise'}));
        await user.selectOptions(screen.getAllByRole('combobox')[2], 'ex-2');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members/mem-1'));
        expect(mockCreateWorkoutSession).toHaveBeenCalledWith(
            {memberId: 'mem-1', date: '2026-02-20', duration: 45, notes: 'Solid effort'},
            [
                {exerciseId: 'ex-1', sets: 3, reps: 10, weight: 0},
                {exerciseId: 'ex-2', sets: 3, reps: 10, weight: 0},
            ],
        );
    });

    it('createWorkoutSessionForm_createFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateWorkoutSession.mockResolvedValueOnce({success: false, message: 'Member not found'});
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '45'}});
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), 'Solid effort');
        await user.selectOptions(screen.getAllByRole('combobox')[1], 'ex-1');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(await screen.findByText('Member not found')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Session'})).toBeEnabled();
        expect(mockCreateWorkoutSession).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_createFailsWithFieldErrors_showsReturnedMetadataErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateWorkoutSession.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                memberId: ['Member rejected'],
                date: ['Date rejected'],
                duration: ['Duration rejected'],
            },
        });
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '45'}});
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), 'Solid effort');
        await user.selectOptions(screen.getAllByRole('combobox')[1], 'ex-1');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(await screen.findByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Member rejected')).toBeInTheDocument();
        expect(screen.getByText('Date rejected')).toBeInTheDocument();
        expect(screen.getByText('Duration rejected')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('createWorkoutSessionForm_submitPending_disablesCreateAndShowsCreatingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveCreate!: (value: ActionResult<WorkoutSessionWithExercises>) => void;
        mockCreateWorkoutSession.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveCreate = resolve;
            }),
        );
        render(<CreateWorkoutSessionForm exercises={mockExercises} members={mockMembers}/>);
        await user.selectOptions(screen.getByLabelText('Member'), 'mem-1');
        fireEvent.change(screen.getByLabelText('Date'), {target: {name: 'date', value: '2026-02-20'}});
        fireEvent.change(screen.getByLabelText('Duration (min)'), {target: {name: 'duration', value: '45'}});
        await user.clear(screen.getByLabelText('Notes'));
        await user.type(screen.getByLabelText('Notes'), 'Solid effort');
        await user.selectOptions(screen.getAllByRole('combobox')[1], 'ex-1');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Session'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Creating...'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Create Session'})).not.toBeInTheDocument();

        await act(async () => {
            resolveCreate({
                success: true,
                data: {
                    id: 'session-1',
                    memberId: 'mem-1',
                    date: new Date('2026-02-20T00:00:00.000Z'),
                    duration: 45,
                    notes: 'Solid effort',
                    exercises: []
                },
            });
        });
    });

});
