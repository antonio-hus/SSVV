import {render, screen} from '@testing-library/react';
import RootPage from '@/app/page';

describe('RootPage', () => {

    describe('default rendering', () => {

        it('rootPage_defaultRender_rendersBrandHeadingDescriptionAndCta', () => {
            // Arrange
            render(<RootPage />);

            // Assert
            expect(screen.getByText('GymTracker Pro')).toBeInTheDocument();
            expect(screen.getByRole('heading', {name: 'Your fitness, tracked.'})).toBeInTheDocument();
            expect(screen.getByText(/Manage your gym/)).toBeInTheDocument();
            expect(screen.getByRole('link', {name: 'Get Started'})).toBeInTheDocument();
        });

    });

    describe('navigation', () => {

        it('rootPage_getStartedLink_pointsToLoginPage', () => {
            // Arrange
            render(<RootPage />);

            // Assert
            expect(screen.getByRole('link', {name: 'Get Started'})).toHaveAttribute('href', '/login');
        });

    });

});