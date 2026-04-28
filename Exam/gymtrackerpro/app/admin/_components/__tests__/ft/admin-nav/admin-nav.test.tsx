import {render, screen} from '@testing-library/react';
import {usePathname} from 'next/navigation';
import {AdminNav} from '@/app/admin/_components/admin-nav';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/some/other/path');
    jest.clearAllMocks();
});

describe('AdminNav', () => {

    it('adminNav_defaultRender_showsNavLandmarkWithAdminNavigationLabel', () => {
        // Arrange
        render(<AdminNav/>);

        // Assert
        expect(screen.getByRole('navigation', {name: 'Admin Navigation'})).toBeInTheDocument();
    });

    it('adminNav_defaultRender_rendersAllFourNavLinksWithCorrectHrefs', () => {
        // Arrange
        render(<AdminNav/>);

        // Assert
        expect(screen.getByRole('link', {name: 'Dashboard'})).toHaveAttribute('href', '/admin/dashboard');
        expect(screen.getByRole('link', {name: 'Members'})).toHaveAttribute('href', '/admin/members');
        expect(screen.getByRole('link', {name: 'Exercises'})).toHaveAttribute('href', '/admin/exercises');
        expect(screen.getByRole('link', {name: 'Sessions'})).toHaveAttribute('href', '/admin/workout-sessions');
    });

});