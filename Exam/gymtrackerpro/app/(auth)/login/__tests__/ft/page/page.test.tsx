import {render, screen} from '@testing-library/react';
import {useRouter} from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';

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

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('LoginPage', () => {

    describe('layout and content', () => {

        it('loginPage_defaultRender_showsSignInHeadingAndSubtitle', async () => {
            // Arrange
            render(await LoginPage());

            // Assert
            expect(screen.getByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
            expect(screen.getByText('Enter your credentials to continue.')).toBeInTheDocument();
        });

        it('loginPage_defaultRender_showsBrandNameAndDumbbellIcon', async () => {
            // Arrange
            render(await LoginPage());

            // Assert
            const brandName = screen.getByText('GymTracker Pro');
            expect(brandName).toBeInTheDocument();
            expect(brandName.closest('div')!.querySelector('svg')).toBeInTheDocument();
        });

        it('loginPage_defaultRender_mountsLoginFormWithEmailAndPasswordFields', async () => {
            // Arrange
            render(await LoginPage());

            // Assert
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Sign in'})).toBeInTheDocument();
        });

    });

});