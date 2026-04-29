import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemberWithTempPassword} from '@/lib/controller/user-controller';
import {CreateMemberForm} from '@/app/admin/members/new/_components/create-member-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {MemberWithUserAndTempPassword} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('@/lib/controller/user-controller', () => ({
    createMemberWithTempPassword: jest.fn(),
}));

const mockCreateMemberWithTempPassword = createMemberWithTempPassword as jest.MockedFunction<typeof createMemberWithTempPassword>;

const mockMember: MemberWithUserAndTempPassword = {
    id: 'mem-1',
    userId: 'user-1',
    membershipStart: new Date('2025-01-15T00:00:00.000Z'),
    isActive: true,
    tempPassword: 'Temp#12345',
    user: {
        id: 'user-1',
        email: 'john@example.com',
        fullName: 'John Smith',
        phone: '+12345678901',
        dateOfBirth: new Date('1990-03-10T00:00:00.000Z'),
        passwordHash: 'hash',
        role: 'MEMBER',
    },
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CreateMemberForm', () => {

    it('createMemberForm_defaultRender_showsEmptyFieldsAndCreateButtonWithNoAlert', () => {
        // Arrange
        render(<CreateMemberForm/>);

        // Assert
        expect(screen.getByLabelText('Full Name')).toHaveValue('');
        expect(screen.getByLabelText('Email')).toHaveValue('');
        expect(screen.getByLabelText('Phone')).toHaveValue('');
        expect(screen.getByLabelText('Date of Birth')).toHaveValue('');
        expect(screen.getByLabelText('Membership Start')).toHaveValue('');
        expect(screen.getByRole('button', {name: 'Create Member'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('createMemberForm_allFieldsEmpty_showsRequiredPredicateErrorsAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_fullNameTooShort_showsOnlyFullNameErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Full name must be at least 8 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_fullNameTooLong_showsOnlyFullNameErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'A'.repeat(65));
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Full name must be at most 64 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_invalidEmail_showsOnlyEmailErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_invalidPhone_showsOnlyPhoneErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '12 345');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Phone number format is incorrect')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_emptyDateOfBirth_showsOnlyDateOfBirthFormatErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Date of birth must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_futureDateOfBirth_showsPastDateErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '2999-01-01');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_emptyMembershipStart_showsOnlyMembershipStartErrorAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByText('Membership start date must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_allFieldsInvalid_showsAllFieldErrorsAndDoesNotCallCreate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John');
        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.type(screen.getByLabelText('Phone'), '12 345');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).not.toHaveBeenCalled();
    });

    it('createMemberForm_validSubmit_callsCreateWithTrimmedPayloadAndShowsTemporaryPasswordPanel', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateMemberWithTempPassword.mockResolvedValueOnce({
            success: true,
            data: mockMember,
        });
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), '  John Smith  ');
        await user.type(screen.getByLabelText('Email'), '  john@example.com  ');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(await screen.findByText('Member created successfully')).toBeInTheDocument();
        expect(screen.getByText('Temp#12345')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Create Member'})).not.toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).toHaveBeenCalledTimes(1);
        expect(mockCreateMemberWithTempPassword).toHaveBeenCalledWith({
            fullName: 'John Smith',
            email: 'john@example.com',
            phone: '+12345678901',
            dateOfBirth: '1990-03-10',
            membershipStart: '2025-01-15',
        });
    });

    it('createMemberForm_createFails_showsServerErrorAndReEnablesForm', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateMemberWithTempPassword.mockResolvedValueOnce({
            success: false,
            message: 'Email already exists',
        });
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(await screen.findByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Member'})).toBeEnabled();
        expect(mockCreateMemberWithTempPassword).toHaveBeenCalledTimes(1);
    });

    it('createMemberForm_serverFieldErrors_showsReturnedFieldErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateMemberWithTempPassword.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                fullName: ['Full name rejected'],
                email: ['Email rejected'],
                phone: ['Phone rejected'],
                dateOfBirth: ['Birth date rejected'],
                membershipStart: ['Membership date rejected'],
            },
        });
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(await screen.findByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Full name rejected')).toBeInTheDocument();
        expect(screen.getByText('Email rejected')).toBeInTheDocument();
        expect(screen.getByText('Phone rejected')).toBeInTheDocument();
        expect(screen.getByText('Birth date rejected')).toBeInTheDocument();
        expect(screen.getByText('Membership date rejected')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).toHaveBeenCalledTimes(1);
    });

    it('createMemberForm_isPending_disablesButtonAndShowsCreatingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveCreate!: (value: ActionResult<MemberWithUserAndTempPassword>) => void;
        mockCreateMemberWithTempPassword.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveCreate = resolve;
            }),
        );
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Creating…'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Create Member'})).not.toBeInTheDocument();

        await act(async () => {
            resolveCreate({success: true, data: mockMember});
        });
    });

    it('createMemberForm_afterServerError_subsequentValidSubmissionSucceeds', async () => {
        // Arrange
        const user = userEvent.setup();
        mockCreateMemberWithTempPassword
            .mockResolvedValueOnce({
                success: false,
                message: 'Email already exists',
            })
            .mockResolvedValueOnce({success: true, data: mockMember});
        render(<CreateMemberForm/>);
        await user.type(screen.getByLabelText('Full Name'), 'John Smith');
        await user.type(screen.getByLabelText('Email'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone'), '+12345678901');
        await user.type(screen.getByLabelText('Date of Birth'), '1990-03-10');
        await user.type(screen.getByLabelText('Membership Start'), '2025-01-15');

        // Act
        await user.click(screen.getByRole('button', {name: 'Create Member'}));
        await screen.findByText('Email already exists');
        await user.click(screen.getByRole('button', {name: 'Create Member'}));

        // Assert
        expect(await screen.findByText('Member created successfully')).toBeInTheDocument();
        expect(mockCreateMemberWithTempPassword).toHaveBeenCalledTimes(2);
    });

});