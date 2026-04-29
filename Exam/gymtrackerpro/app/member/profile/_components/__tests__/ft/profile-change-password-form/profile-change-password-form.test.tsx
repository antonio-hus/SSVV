import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {updateMember} from '@/lib/controller/user-controller';
import {ProfileChangePasswordForm} from '@/app/member/profile/_components/profile-change-password-form';
import type {ActionResult} from '@/lib/domain/action-result';
import type {MemberWithUser} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('@/lib/controller/user-controller', () => ({
    updateMember: jest.fn(),
}));

const mockUpdateMember = updateMember as jest.MockedFunction<typeof updateMember>;

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
    jest.clearAllMocks();
});

describe('ProfileChangePasswordForm', () => {

    it('profileChangePasswordForm_defaultRender_showsEmptyPasswordFieldAndSubmitButton', () => {
        // Arrange
        render(<ProfileChangePasswordForm memberId="mem-1"/>);

        // Assert
        expect(screen.getByLabelText('New Password')).toHaveValue('');
        expect(screen.getByLabelText('New Password')).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('New Password')).toHaveAttribute('autocomplete', 'new-password');
        expect(screen.getByRole('button', {name: 'Update Password'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('profileChangePasswordForm_emptyPassword_showsMinimumLengthErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<ProfileChangePasswordForm memberId="mem-1"/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('profileChangePasswordForm_passwordTooLong_showsMaximumLengthErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), `A1#${'a'.repeat(62)}`);

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByText('Password must be at most 64 characters')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('profileChangePasswordForm_missingUppercase_showsUppercaseValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'lowercase#123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByText('Password must contain at least one uppercase character')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('profileChangePasswordForm_missingNumber_showsNumberValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'NoNumber#');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('profileChangePasswordForm_missingSpecialCharacter_showsSpecialCharacterValidationErrorAndDoesNotCallUpdate', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'NoSpecial123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
        expect(mockUpdateMember).not.toHaveBeenCalled();
    });

    it('profileChangePasswordForm_validPassword_callsUpdateAndResetsFieldOnSuccess', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({success: true, data: mockMember});
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'Strong#123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(await screen.findByText('Password updated successfully.')).toBeInTheDocument();
        expect(mockUpdateMember).toHaveBeenCalledTimes(1);
        expect(mockUpdateMember).toHaveBeenCalledWith('mem-1', {password: 'Strong#123'});
        expect(screen.getByLabelText('New Password')).toHaveValue('');
        expect(screen.queryByText('Password must contain at least one uppercase character')).not.toBeInTheDocument();
    });

    it('profileChangePasswordForm_updateFails_showsServerErrorAndKeepsFormEnabled', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({
            success: false,
            message: 'Unable to update password',
        });
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'Strong#123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(await screen.findByText('Unable to update password')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Update Password'})).toBeEnabled();
        expect(mockUpdateMember).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('New Password')).toHaveValue('Strong#123');
    });

    it('profileChangePasswordForm_serverFieldErrors_showsReturnedPasswordError', async () => {
        // Arrange
        const user = userEvent.setup();
        mockUpdateMember.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {password: ['Password was recently used']},
        });
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'Strong#123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(await screen.findByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Password was recently used')).toBeInTheDocument();
        expect(mockUpdateMember).toHaveBeenCalledTimes(1);
    });

    it('profileChangePasswordForm_updatePending_disablesSubmitAndShowsUpdatingText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveUpdate!: (value: ActionResult<MemberWithUser>) => void;
        mockUpdateMember.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveUpdate = resolve;
            }),
        );
        render(<ProfileChangePasswordForm memberId="mem-1"/>);
        await user.type(screen.getByLabelText('New Password'), 'Strong#123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Update Password'}));

        // Assert
        expect(screen.getByRole('button', {name: 'Updating…'})).toBeDisabled();
        expect(screen.queryByRole('button', {name: 'Update Password'})).not.toBeInTheDocument();

        await act(async () => {
            resolveUpdate({success: true, data: mockMember});
        });
    });

});