import {render, screen, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter} from 'next/navigation';
import {logout} from '@/lib/controller/auth-controller';
import {LogoutButton} from '@/components/auth/logout-button';
import {ActionResult} from "@/lib/domain/action-result";

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/auth-controller', () => ({
    logout: jest.fn(),
}));

const mockPush = jest.fn();
const mockLogout = logout as jest.MockedFunction<typeof logout>;

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('LogoutButton', () => {

    it('logoutButton_defaultRender_showsEnabledButtonWithSignOutText', () => {
        // Arrange
        render(<LogoutButton/>);

        // Act
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Assert
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
        expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('logoutButton_classNameProp_appendedToButtonElement', () => {
        // Arrange
        render(<LogoutButton className="custom-class"/>);

        // Act
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Assert
        expect(button).toHaveClass('custom-class');
    });

    it('logoutButton_clicked_callsLogoutServerAction', async () => {
        // Arrange
        const user = userEvent.setup();

        mockLogout.mockResolvedValueOnce({
            success: true,
            data: undefined,
        });

        render(<LogoutButton/>);
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Act
        await user.click(button);

        // Assert
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('logoutButton_logoutSucceeds_navigatesToLogin', async () => {
        // Arrange
        const user = userEvent.setup();

        mockLogout.mockResolvedValueOnce({
            success: true,
            data: undefined,
        });

        render(<LogoutButton/>);
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Act
        await user.click(button);

        // Assert
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('logoutButton_logoutThrows_stillNavigatesToLogin', async () => {
        // Arrange
        const user = userEvent.setup();

        mockLogout.mockRejectedValueOnce(new Error('session expired'));
        jest.spyOn(console, 'error').mockImplementation(() => undefined);

        render(<LogoutButton/>);
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Act
        await user.click(button);

        // Assert
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('logoutButton_isPending_disablesButtonAndShowsSigningOutText', async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveLogout!: (value: ActionResult<void>) => void;

        mockLogout.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    resolveLogout = resolve;
                })
        );

        render(<LogoutButton/>);
        const button = screen.getByRole('button', {name: 'Sign out'});

        // Act
        await user.click(button);

        // Assert
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText('Signing out...')).toBeInTheDocument();
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();

        await act(async () => {
            resolveLogout({success: true, data: undefined});
        });
    });

});