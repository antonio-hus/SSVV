import {render, screen, waitFor, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {login} from '@/lib/controller/auth-controller';
import {Role} from '@/lib/domain/user';
import type {ActionResult} from '@/lib/domain/action-result';
import type {SessionData} from '@/lib/domain/session';
import {LoginForm} from '@/app/(auth)/login/_components/login-form';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/auth-controller', () => ({
    login: jest.fn(),
}));

const mockPush = jest.fn();
const mockLogin = login as jest.MockedFunction<typeof login>;

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('LoginForm', () => {

    it('loginForm_defaultRender_showsFormFieldsAndEnabledSignInButtonWithNoAlert', () => {
        // Arrange
        render(<LoginForm/>);

        // Assert
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Sign in'})).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('loginForm_emptyEmailEmptyPassword_showsBothFieldErrorsAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Password').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_validEmailInvalidPassword_showsOnlyPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'weakpass');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Password').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_invalidEmailValidPassword_showsOnlyEmailErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Password').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_invalidEmailInvalidPassword_showsBothFieldErrorsAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.type(screen.getByLabelText('Password'), 'weakpass');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(screen.getByLabelText('Password').parentElement!.querySelector('p')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_validEmailValidPassword_callsLoginWithTrimmedEmail', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: false,
            message: 'Invalid credentials',
        } as ActionResult<SessionData>);
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), '  test@example.com  ');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
        expect(mockLogin).toHaveBeenCalledWith({email: 'test@example.com', password: 'Password123!'});
    });

    it('loginForm_passwordTooShort_showsPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'P1@aaaa');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_passwordTooLong_showsPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), `P1@${'a'.repeat(62)}`);

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByText('Password must be at most 64 characters')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_passwordMissingUppercase_showsPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByText('Password must contain at least one uppercase character')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_passwordMissingNumber_showsPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_passwordMissingSpecialCharacter_showsPasswordErrorAndDoesNotCallLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
        expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
        expect(screen.getByLabelText('Email').parentElement!.querySelector('p')).not.toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('loginForm_loginSucceedsAdminRole_navigatesToAdminDashboard', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: true,
            data: {role: Role.ADMIN} as SessionData,
        });
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith({email: 'test@example.com', password: 'Password123!'});
    });

    it('loginForm_loginSucceedsMemberRole_navigatesToMemberDashboard', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: true,
            data: {role: Role.MEMBER} as SessionData,
        });
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member/dashboard'));
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith({email: 'test@example.com', password: 'Password123!'});
    });

    it('loginForm_loginSucceedsUnknownRole_fallsThroughSwitchDefaultAndNavigatesToLogin', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: true,
            data: {role: 'UNKNOWN' as Role} as SessionData,
        });
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
        expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('loginForm_loginSucceedsWithoutData_doesNotNavigateOrShowErrorAlert', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: true,
            data: undefined,
        } as unknown as ActionResult<SessionData>);
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('loginForm_loginReturnsFailure_showsAlertWithServerMessageAndReEnablesButton', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: false,
            message: 'Invalid credentials',
        } as ActionResult<SessionData>);
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'),
        );
        expect(screen.getByRole('button', {name: 'Sign in'})).toBeEnabled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('loginForm_serverReturnsFieldErrors_showsEmailAndPasswordErrors', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            success: false,
            message: 'Validation failed',
            errors: {
                email: ['Email rejected by server'],
                password: ['Password rejected by server'],
            },
        } as ActionResult<SessionData>);
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(screen.getByText('Email rejected by server')).toBeInTheDocument());
        expect(screen.getByText('Password rejected by server')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('loginForm_isPending_disablesButtonAndShowsSigningInText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveLogin!: (value: ActionResult<SessionData>) => void;
        mockLogin.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveLogin = resolve;
            }),
        );
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText('Signing in…')).toBeInTheDocument();
        expect(screen.queryByText('Sign in')).not.toBeInTheDocument();

        await act(async () => {
            resolveLogin({success: true, data: {role: Role.MEMBER} as SessionData});
        });
    });

    it('loginForm_afterServerError_subsequentValidSubmissionSucceeds', async () => {
        // Arrange
        const user = userEvent.setup();
        mockLogin
            .mockResolvedValueOnce({
                success: false,
                message: 'Invalid credentials',
            } as ActionResult<SessionData>)
            .mockResolvedValueOnce({
                success: true,
                data: {role: Role.MEMBER} as SessionData,
            });
        render(<LoginForm/>);
        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'Password123!');

        // Act
        await user.click(screen.getByRole('button', {name: 'Sign in'}));
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'),
        );
        await user.click(screen.getByRole('button', {name: 'Sign in'}));

        // Assert
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member/dashboard'));
        expect(mockLogin).toHaveBeenCalledTimes(2);
    });

});