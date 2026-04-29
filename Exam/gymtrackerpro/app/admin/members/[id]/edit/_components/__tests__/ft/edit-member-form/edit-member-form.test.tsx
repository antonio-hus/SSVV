import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {
    activateMember,
    deleteMember,
    suspendMember,
    updateMember,
} from '@/lib/controller/user-controller';
import {EditMemberForm} from '@/app/admin/members/[id]/edit/_components/edit-member-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {MemberWithUser} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    updateMember: jest.fn(),
    suspendMember: jest.fn(),
    activateMember: jest.fn(),
    deleteMember: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateMember = updateMember as jest.MockedFunction<typeof updateMember>;
const mockSuspendMember = suspendMember as jest.MockedFunction<typeof suspendMember>;
const mockActivateMember = activateMember as jest.MockedFunction<typeof activateMember>;
const mockDeleteMember = deleteMember as jest.MockedFunction<typeof deleteMember>;

const mockMember: MemberWithUser = {
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
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush, refresh: mockRefresh});
    jest.clearAllMocks();
});

describe('EditMemberForm', () => {

    it('editMemberForm_defaultRender_prefillsMemberFieldsAndShowsActionControls', () => {
        // Arrange
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Assert
        expect(screen.getByLabelText('Full Name')).toHaveValue('John Smith');
        expect(screen.getByLabelText('Email')).toHaveValue('john@example.com');
        expect(screen.getByLabelText('Phone')).toHaveValue('+12345678901');
        expect(screen.getByLabelText('Date of Birth')).toHaveValue('1990-03-10');
        expect(screen.getByLabelText('Membership Start')).toHaveValue('2025-01-15');
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Suspend Member'})).toBeEnabled();
        expect(screen.getByRole('button', {name: 'Delete Member'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('editMemberForm_fullNameTooShort_showsOnlyFullNameErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Full Name'));
        await user.type(screen.getByLabelText('Full Name'), 'John');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Full name must be at least 8 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_fullNameTooLong_showsOnlyFullNameErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Full Name'));
        await user.type(screen.getByLabelText('Full Name'), 'A'.repeat(65));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Full name must be at most 64 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_invalidEmail_showsOnlyEmailErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Email'));
        await user.type(screen.getByLabelText('Email'), 'not-an-email');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_invalidPhone_showsOnlyPhoneErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Phone'));
        await user.type(screen.getByLabelText('Phone'), '12 345');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Phone number format is incorrect')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_emptyDateOfBirth_showsOnlyDateOfBirthFormatErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Date of Birth'));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Date of birth must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_futureDateOfBirth_showsPastDateErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Date of Birth'));
        await user.type(screen.getByLabelText('Date of Birth'), '2999-01-01');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_emptyMembershipStart_showsOnlyMembershipStartErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Membership Start'));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByText('Membership start date must be in YYYY-MM-DD format')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_allFieldsInvalid_showsAllFieldErrorsAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Full Name'));
        await user.type(screen.getByLabelText('Full Name'), 'John');
        await user.clear(screen.getByLabelText('Email'));
        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.clear(screen.getByLabelText('Phone'));
        await user.type(screen.getByLabelText('Phone'), '12 345');
        await user.clear(screen.getByLabelText('Date of Birth'));
        await user.clear(screen.getByLabelText('Membership Start'));

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByLabelText('Full Name').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Date of Birth').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Membership Start').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_validUpdate_callsUpdateWithTrimmedPayloadShowsSuccessAndRefreshesPage', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({
            success: true,
            data: {...mockMember, user: {...mockMember.user, fullName: 'John Updated'}},
        });
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);
        await user.clear(screen.getByLabelText('Full Name'));
        await user.type(screen.getByLabelText('Full Name'), '  John Updated  ');
        await user.clear(screen.getByLabelText('Email'));
        await user.type(screen.getByLabelText('Email'), '  john.updated@example.com  ');
        await user.clear(screen.getByLabelText('Phone'));
        await user.type(screen.getByLabelText('Phone'), '+10987654321');

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Member updated successfully.')).toBeInTheDocument();
        expect(mockUpdateMember).toHaveBeenCalledTimes(1);
        expect(mockUpdateMember).toHaveBeenCalledWith('mem-1', {
            fullName: 'John Updated',
            email: 'john.updated@example.com',
            phone: '+10987654321',
            dateOfBirth: '1990-03-10',
            membershipStart: '2025-01-15',
        });
        expect(mockRefresh).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editMemberForm_updateFails_showsServerErrorAndDoesNotRefresh', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({
            success: false,
            message: 'Email already exists',
        });
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Save Changes'})).toBeEnabled();
        expect(mockUpdateMember).toHaveBeenCalledTimes(1);
        expect(mockRefresh).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editMemberForm_updateFailsWithFieldErrors_showsReturnedFieldErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({
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
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(await screen.findByText('Full name rejected')).toBeInTheDocument();
        expect(screen.getByText('Email rejected')).toBeInTheDocument();
        expect(screen.getByText('Phone rejected')).toBeInTheDocument();
        expect(screen.getByText('Birth date rejected')).toBeInTheDocument();
        expect(screen.getByText('Membership date rejected')).toBeInTheDocument();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('editMemberForm_activeMember_showsSuspendButtonAndHidesActivateButton', () => {
        // Arrange
        render(<EditMemberForm member={{...mockMember, isActive: true}} memberId="mem-1"/>);

        // Assert
        expect(screen.getByRole('button', {name: 'Suspend Member'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Activate Member'})).not.toBeInTheDocument();
    });

    it('editMemberForm_suspendedMember_showsActivateButtonAndHidesSuspendButton', () => {
        // Arrange
        render(<EditMemberForm member={{...mockMember, isActive: false}} memberId="mem-1"/>);

        // Assert
        expect(screen.getByRole('button', {name: 'Activate Member'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Suspend Member'})).not.toBeInTheDocument();
    });

    it('editMemberForm_suspendSucceeds_callsSuspendAndNavigatesToDetail', async () => {
        // Arrange
        const user = userEvent.setup();
        mockSuspendMember.mockResolvedValueOnce({success: true, data: {...mockMember, isActive: false}});
        render(<EditMemberForm member={{...mockMember, isActive: true}} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Suspend Member'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members/mem-1'));
        expect(mockSuspendMember).toHaveBeenCalledTimes(1);
        expect(mockSuspendMember).toHaveBeenCalledWith('mem-1');
        expect(mockActivateMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_suspendFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockSuspendMember.mockResolvedValueOnce({
            success: false,
            message: 'Could not suspend member',
        });
        render(<EditMemberForm member={{...mockMember, isActive: true}} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Suspend Member'}));

        // Assert
        expect(await screen.findByText('Could not suspend member')).toBeInTheDocument();
        expect(mockSuspendMember).toHaveBeenCalledWith('mem-1');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editMemberForm_activateSucceeds_callsActivateAndNavigatesToDetail', async () => {
        // Arrange
        const user = userEvent.setup();
        mockActivateMember.mockResolvedValueOnce({success: true, data: {...mockMember, isActive: true}});
        render(<EditMemberForm member={{...mockMember, isActive: false}} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Activate Member'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members/mem-1'));
        expect(mockActivateMember).toHaveBeenCalledTimes(1);
        expect(mockActivateMember).toHaveBeenCalledWith('mem-1');
        expect(mockSuspendMember).not.toHaveBeenCalled();
    });

    it('editMemberForm_activateFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockActivateMember.mockResolvedValueOnce({
            success: false,
            message: 'Could not activate member',
        });
        render(<EditMemberForm member={{...mockMember, isActive: false}} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Activate Member'}));

        // Assert
        expect(await screen.findByText('Could not activate member')).toBeInTheDocument();
        expect(mockActivateMember).toHaveBeenCalledWith('mem-1');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('editMemberForm_deleteSucceeds_callsDeleteRefreshesAndNavigatesToList', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteMember.mockResolvedValueOnce({success: true, data: undefined});
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Member'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/members'));
        expect(mockDeleteMember).toHaveBeenCalledTimes(1);
        expect(mockDeleteMember).toHaveBeenCalledWith('mem-1');
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('editMemberForm_deleteFails_showsServerErrorAndDoesNotNavigate', async () => {
        // Arrange
        const user = userEvent.setup();
        mockDeleteMember.mockResolvedValueOnce({
            success: false,
            message: 'Member has active sessions',
        });
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Delete Member'}));

        // Assert
        expect(await screen.findByText('Member has active sessions')).toBeInTheDocument();
        expect(mockDeleteMember).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('editMemberForm_updatePending_disablesActionButtonsAndShowsSavingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveUpdate!: (value: ActionResult<MemberWithUser>) => void;
        mockUpdateMember.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveUpdate = resolve;
            }),
        );
        render(<EditMemberForm member={mockMember} memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Save Changes'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Saving…'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Suspend Member'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Delete Member'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Save Changes'})).not.toBeInTheDocument();

        await act(async () => {
            resolveUpdate({success: true, data: mockMember});
        });
    });

});