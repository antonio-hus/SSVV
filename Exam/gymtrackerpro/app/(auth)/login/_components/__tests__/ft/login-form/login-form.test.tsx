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

const VALID_EMAIL = 'test@example.com';
const VALID_PASSWORD = 'Password123!';

const fillValidCredentials = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
    await user.type(screen.getByLabelText('Email'), VALID_EMAIL);
    await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
}

describe('LoginForm', () => {

    describe('rendering', () => {

        it('loginForm_defaultRender_showsFormFieldsAndEnabledSignInButtonWithNoAlert', () => {
            // Arrange
            render(<LoginForm />);

            // Assert
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Sign in'})).toBeEnabled();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

    });

    describe('client-side validation', () => {

        it('loginForm_bothFieldsEmpty_showsValidationAlertAndDoesNotCallLogin', async () => {
            // Arrange
            const user = userEvent.setup();
            render(<LoginForm />);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('loginForm_validEmailEmptyPassword_showsPasswordFieldErrorAndDoesNotCallLogin', async () => {
            // Arrange
            const user = userEvent.setup();
            render(<LoginForm />);
            await user.type(screen.getByLabelText('Email'), VALID_EMAIL);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Password');
            expect(emailInput.parentElement!.querySelector('p')).not.toBeInTheDocument();
            await waitFor(() => expect(passwordInput.parentElement!.querySelector('p')).toBeInTheDocument());
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('loginForm_invalidEmailFormatValidPassword_showsEmailFieldErrorAndDoesNotCallLogin', async () => {
            // Arrange
            const user = userEvent.setup();
            render(<LoginForm />);
            await user.type(screen.getByLabelText('Email'), 'not-an-email');
            await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Password');
            await waitFor(() => expect(emailInput.parentElement!.querySelector('p')).toBeInTheDocument());
            expect(passwordInput.parentElement!.querySelector('p')).not.toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

    });

    describe('server action — success paths', () => {

        it('loginForm_loginSucceedsAdminRole_navigatesToAdminDashboard', async () => {
            // Arrange
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce({
                success: true,
                data: {role: Role.ADMIN} as SessionData,
            });
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
            expect(mockLogin).toHaveBeenCalledTimes(1);
            expect(mockLogin).toHaveBeenCalledWith({email: VALID_EMAIL, password: VALID_PASSWORD});
        });

        it('loginForm_loginSucceedsMemberRole_navigatesToMemberDashboard', async () => {
            // Arrange
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce({
                success: true,
                data: {role: Role.MEMBER} as SessionData,
            });
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member/dashboard'));
            expect(mockLogin).toHaveBeenCalledTimes(1);
            expect(mockLogin).toHaveBeenCalledWith({email: VALID_EMAIL, password: VALID_PASSWORD});
        });

        it('loginForm_loginSucceedsUnknownRole_fallsThroughSwitchDefaultAndNavigatesToLogin', async () => {
            // Arrange
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce({
                success: true,
                data: {role: 'UNKNOWN' as Role} as SessionData,
            });
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
            expect(mockLogin).toHaveBeenCalledTimes(1);
        });

    });

    describe('server action — failure and pending paths', () => {

        it('loginForm_loginReturnsFailure_showsAlertWithServerMessageAndReEnablesButton', async () => {
            // Arrange
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce({
                success: false,
                message: 'Invalid credentials',
            } as ActionResult<SessionData>);
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() =>
                expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'),
            );
            expect(screen.getByRole('button', {name: 'Sign in'})).toBeEnabled();
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
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            expect(screen.getByRole('button')).toBeDisabled();
            expect(screen.getByText('Signing in…')).toBeInTheDocument();
            expect(screen.queryByText('Sign in')).not.toBeInTheDocument();

            // Cleanup
            await act(async () => {
                resolveLogin({success: true, data: {role: Role.MEMBER} as SessionData});
            });
        });

    });

    describe('error recovery', () => {

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
            render(<LoginForm />);
            await fillValidCredentials(user);

            // Act — first submission produces the server error
            await user.click(screen.getByRole('button', {name: 'Sign in'}));
            await waitFor(() =>
                expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'),
            );

            // Act — second submission succeeds
            await user.click(screen.getByRole('button', {name: 'Sign in'}));

            // Assert
            await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member/dashboard'));
            expect(mockLogin).toHaveBeenCalledTimes(2);
        });

    });

});