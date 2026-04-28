import {render, screen} from '@testing-library/react';
import UnauthorizedPage from '@/app/(auth)/unauthorized/page';

describe('UnauthorizedPage', () => {

    describe('content', () => {

        it('unauthorizedPage_defaultRender_showsAccessDeniedLabelHeadingAndDescription', () => {
            // Arrange
            render(<UnauthorizedPage />);

            // Assert
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(
                screen.getByRole('heading', {name: "You don't have permission here."}),
            ).toBeInTheDocument();
            expect(
                screen.getByText("This page isn't available with your current account."),
            ).toBeInTheDocument();
        });

    });

    describe('navigation links', () => {

        it('unauthorizedPage_defaultRender_goToHomeLinkPointsToRoot', () => {
            // Arrange
            render(<UnauthorizedPage />);

            // Assert
            const homeLink = screen.getByRole('link', {name: 'Go to Home'});
            expect(homeLink).toBeInTheDocument();
            expect(homeLink).toHaveAttribute('href', '/');
        });

        it('unauthorizedPage_defaultRender_signInLinkPointsToLogin', () => {
            // Arrange
            render(<UnauthorizedPage />);

            // Assert
            const signInLink = screen.getByRole('link', {name: 'Sign in with another account'});
            expect(signInLink).toBeInTheDocument();
            expect(signInLink).toHaveAttribute('href', '/login');
        });

    });

});